/**
 * Room-level community chat.
 *
 * An event room's "Enable Community Chat" switch is not a standalone feature —
 * it provisions a real *channel* inside the event's community (the same
 * ChatRoom collection the Community planning tab and the public event page
 * read from). The relationship is:
 *
 *   Event community (master switch)
 *     └── General channel        ← created when the organiser turns community on
 *     └── <Room name> channel    ← created when a room enables community chat
 *
 * Consequences that the UI must reflect:
 *
 *  1. A room channel cannot exist without the event community existing. If the
 *     organiser flips a room's chat on while the event community has never been
 *     provisioned, there is nothing to attach the channel to.
 *  2. Turning a room's chat on must NOT silently flip the event-wide community
 *     switch — that changes what every attendee sees. Instead the caller asks
 *     for consent (`alsoEnableEventCommunity`) and we do it explicitly.
 *  3. While the event community is off, an enabled room channel exists but is
 *     invisible to attendees (the public page is locked by the default
 *     channel's state). The UI surfaces this as a warning rather than pretending
 *     the chat is live.
 *
 * The resulting channel id is stored back on the event room as
 * `communityChatRoomId`, which makes the link durable and the sync idempotent.
 */

import { enableEventCommunity, updateEvent } from '$lib/services/event.services';
import {
	createCommunityRoom,
	deleteCommunityRoom,
	getEventOverview,
	setCommunityEnabled,
	updateCommunityRoom,
	type CommunityOverview,
} from '$lib/services/community.services';

export interface RoomChatState {
	/** Is the event-wide community switched on (i.e. visible to attendees)? */
	communityEnabled: boolean;
	/** Has a community ever been provisioned for this event? */
	communityExists: boolean;
	overview: CommunityOverview | null;
}

/** Reads the current community state for an event. Never throws. */
export async function getRoomChatState(eventId: string): Promise<RoomChatState> {
	if (!eventId) return { communityEnabled: false, communityExists: false, overview: null };
	try {
		const overview = await getEventOverview(eventId);
		return {
			communityEnabled: !!overview.enabled,
			// `enabled: false` is returned both when no community exists and when
			// it exists but is switched off. A non-empty room list only ever comes
			// back for an enabled community, so treat "enabled" as proof of
			// existence and fall back to the channel list otherwise.
			communityExists: !!overview.enabled || (overview.rooms?.length ?? 0) > 0,
			overview,
		};
	} catch {
		return { communityEnabled: false, communityExists: false, overview: null };
	}
}

export interface SyncRoomChannelInput {
	eventId: string;
	/** The room's name — used as the channel name so both stay in step. */
	name: string;
	description?: string;
	/** Desired state of the room's community chat. */
	enabled: boolean;
	/** Channel id already linked to this room, if any. */
	communityChatRoomId?: string | null;
	/**
	 * Explicit opt-in to switch the event-wide community on as part of this
	 * change. Only pass `true` when the organiser has actively agreed.
	 */
	alsoEnableEventCommunity?: boolean;
}

export interface SyncRoomChannelResult {
	/** Channel id to persist on the event room ('' clears the link). */
	communityChatRoomId: string;
	/** True when the event community is on, so the channel is attendee-visible. */
	communityEnabled: boolean;
	/** Set when the channel could not be provisioned; safe to show to the user. */
	warning?: string;
}

/**
 * Brings the community channel for one event room in line with the requested
 * state. Idempotent: safe to call on every save.
 */
export async function syncRoomCommunityChannel(
	input: SyncRoomChannelInput
): Promise<SyncRoomChannelResult> {
	const { eventId, name, description, enabled } = input;
	const linkedId = input.communityChatRoomId || '';

	// ── Turning it off: disable the channel and drop the link. ────────────────
	if (!enabled) {
		if (linkedId) {
			try {
				await deleteCommunityRoom(linkedId);
			} catch {
				/* Already gone, or the organiser lost access — clearing the link
				   locally is still the right outcome. */
			}
		}
		const state = await getRoomChatState(eventId);
		return { communityChatRoomId: '', communityEnabled: state.communityEnabled };
	}

	// ── Turning it on ────────────────────────────────────────────────────────
	if (input.alsoEnableEventCommunity) {
		// Provision + switch on the event community, with the organiser's consent.
		// `enableEventCommunity` creates the default channel; `setCommunityEnabled`
		// guarantees the master switch is on even if it was previously turned off.
		try {
			await enableEventCommunity(eventId);
		} catch {
			/* The community may already exist — the toggle below is what matters. */
		}
		await Promise.allSettled([
			updateEvent(eventId, { communityEnabled: true } as any),
			setCommunityEnabled(eventId, true),
		]);
	}

	const state = await getRoomChatState(eventId);
	const channelName = name.trim() || 'Room Chat';

	// Reuse the already-linked channel when we can see it. Note the overview only
	// lists channels while the community is switched ON, so a missing entry is not
	// proof the channel is gone — hence the update-then-create fallback below.
	const known = state.overview?.rooms?.find((r) => r._id === linkedId);
	const byName = !known
		? state.overview?.rooms?.find((r) => !r.isDefault && r.name === channelName)
		: undefined;
	const target = known ?? byName;

	try {
		if (target) {
			if (target.name !== channelName || (target.description ?? '') !== (description ?? '')) {
				await updateCommunityRoom(target._id, { name: channelName, description });
			}
			return { communityChatRoomId: target._id, communityEnabled: state.communityEnabled };
		}

		if (linkedId) {
			// Community may be switched off (so the channel isn't listed) while the
			// channel itself still exists. Try to keep it in step; fall through to
			// creation only if it has genuinely gone.
			try {
				await updateCommunityRoom(linkedId, { name: channelName, description });
				return { communityChatRoomId: linkedId, communityEnabled: state.communityEnabled };
			} catch {
				/* stale link — create a fresh channel below */
			}
		}

		const created = await createCommunityRoom(eventId, {
			name: channelName,
			description: description || `Chat for the ${channelName} room`,
			emoji: '🚪',
		});
		return { communityChatRoomId: created._id, communityEnabled: state.communityEnabled };
	} catch (e: any) {
		// The most common cause is no community existing for the event yet, which
		// the community service reports as a 404 on room creation.
		const reason = state.communityExists
			? e?.message || 'Could not create the community chat channel for this room.'
			: 'Community has not been set up for this event yet, so this room has no chat channel. Turn on Community for the event, then save the room again.';
		return {
			communityChatRoomId: linkedId,
			communityEnabled: state.communityEnabled,
			warning: reason,
		};
	}
}

/** Deep link to a room's chat channel on the public event page. */
export function roomCommunityUrl(eventId: string, communityChatRoomId?: string | null): string {
	const base = `/event-page/${eventId}/community`;
	return communityChatRoomId ? `${base}?room=${communityChatRoomId}` : base;
}
