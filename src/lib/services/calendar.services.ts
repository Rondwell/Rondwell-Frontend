import { getToken } from '$lib/stores/auth.store';
import type { MeetingPlatform } from '$lib/utils/meetingPlatform';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

/**
 * Calendar export and join-link access.
 *
 * ── Why these do NOT use `authFetch` ─────────────────────────────────────
 *
 * `authFetch` throws when there is no access token, and on a 401 it signs the
 * user out and hard-redirects to `/auth`. Both are wrong here. These endpoints
 * are mounted behind the backend's `softAuthMiddleware`: they answer for a
 * signed-out visitor too, just without the join link. "Add to calendar" working
 * before someone has an account is the point of it — routing it through
 * `authFetch` would bounce an anonymous visitor to a login screen for clicking
 * a button that was supposed to work for them.
 *
 * So the token is attached when present and omitted when not, and a non-OK
 * response is returned to the caller rather than ending the session.
 */

export type JoinDeniedReason = 'NOT_REGISTERED' | 'NOT_YET';

export interface JoinAccess {
	canJoin: boolean;
	isRegistered: boolean;
	isHost: boolean;
	reason?: JoinDeniedReason;
	/** ISO string — when `reason` is `NOT_YET`. */
	opensAt?: string;
}

export interface VirtualDetails {
	platform: string;
	platformKey: MeetingPlatform;
	/** Present only when `access.canJoin`. */
	meetingLink?: string;
	meetingId?: string;
	passcode?: string;
	dialInNumbers?: string[];
	access: JoinAccess;
}

export interface JoinDetails {
	eventType: 'VIRTUAL' | 'PHYSICAL' | 'HYBRID';
	startDateTime: string;
	endDateTime: string;
	timeZone: string;
	eventStatus: string;
	virtual: VirtualDetails | null;
	policy: {
		visibility: 'ON_REGISTRATION' | 'BEFORE_START' | 'AT_START';
		revealMinutesBefore: number;
	};
}

export interface CalendarLinks {
	google: string;
	outlook: string;
	office365: string;
	yahoo: string;
	/** Relative path on the event API. Use `icsDownloadUrl()` to resolve it. */
	ics: string;
	icsPerDay: string | null;
	eventUrl: string;
	isMultiDay: boolean;
}

/** Authorization header when signed in; nothing when not. */
function optionalAuthHeaders(): HeadersInit {
	const token = getToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch the viewer's join entitlement for an event.
 *
 * Returns `null` rather than throwing on any failure. This drives a progressive
 * enhancement on the event page — the page must render its location block
 * whether or not this call succeeds, and a failed lookup should look like "no
 * link available", never like a broken page.
 */
export async function getJoinDetails(eventId: string): Promise<JoinDetails | null> {
	try {
		const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/join-details`, {
			headers: optionalAuthHeaders()
		});
		if (!res.ok) return null;
		const json = await res.json();
		return (json?.data ?? null) as JoinDetails | null;
	} catch {
		return null;
	}
}

/** Fetch the hosted-calendar deep links for an event. */
export async function getCalendarLinks(eventId: string): Promise<CalendarLinks | null> {
	try {
		const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/calendar/links`, {
			headers: optionalAuthHeaders()
		});
		if (!res.ok) return null;
		const json = await res.json();
		return (json?.data ?? null) as CalendarLinks | null;
	} catch {
		return null;
	}
}

/** Absolute URL for the `.ics`, for an `<a download>`. */
export function icsDownloadUrl(eventId: string, perDay = false): string {
	return `${EVENT_URL}/api/v1/events/${eventId}/calendar.ics${perDay ? '?days=1' : ''}`;
}

/**
 * Download the `.ics` as a file.
 *
 * Fetched and turned into a blob rather than pointed at with a plain
 * `<a href download>`, because the response is viewer-specific: the attendee's
 * copy carries the join link and a visitor's does not, and that difference comes
 * from the `Authorization` header — which a bare anchor navigation cannot send.
 *
 * Returns `false` when the download could not be produced, so the caller can
 * fall back to the Google/Outlook deep links rather than failing silently.
 */
export async function downloadIcs(
	eventId: string,
	fileName = 'event.ics',
	perDay = false
): Promise<boolean> {
	try {
		const res = await fetch(icsDownloadUrl(eventId, perDay), {
			headers: optionalAuthHeaders()
		});
		if (!res.ok) return false;

		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		a.remove();
		// Revoked on the next tick: revoking synchronously can cancel the
		// download in Safari before it has read the blob.
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		return true;
	} catch {
		return false;
	}
}

/** Providers Rondwell can create a meeting on. */
export type MeetingProvider = 'GOOGLE' | 'ZOOM' | 'OUTLOOK';

export interface ProvisionedMeeting {
	platform: 'GOOGLE_MEET' | 'ZOOM' | 'MS_TEAMS';
	label: string;
	joinUrl: string;
	meetingId?: string;
	passcode?: string;
	dialInNumbers?: string[];
}

/**
 * Have Rondwell create the meeting on the organizer's connected account.
 *
 * Uses `authFetch` rather than the optional-auth helper above: this is a write
 * on behalf of a specific connected account and has no anonymous form, so a
 * missing session genuinely is an error.
 *
 * `replace` must be passed explicitly to overwrite an existing link — the
 * server refuses otherwise, because attendees may already be holding the old
 * URL and would arrive at an empty room.
 */
export async function provisionMeeting(
	eventId: string,
	provider: MeetingProvider,
	replace = false
): Promise<ProvisionedMeeting> {
	const { authFetch } = await import('$lib/services/api.client');
	const { throwApiError } = await import('$lib/utils/errorMessage');
	const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/meeting/provision`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ provider, replace })
	});
	if (!res.ok) await throwApiError(res, 'Could not create the meeting');
	const json = await res.json();
	return json.data as ProvisionedMeeting;
}

export interface AttendanceImportResult {
	provider: 'ZOOM';
	meetingId: string;
	participantsReported: number;
	matched: number;
	alreadyCheckedIn: number;
	unmatched: number;
	unmatchedSample: string[];
	belowThreshold: number;
}

/** Pull the provider's attendance report onto the event's attendee records. */
export async function importMeetingAttendance(
	eventId: string,
	minMinutes?: number
): Promise<AttendanceImportResult> {
	const { authFetch } = await import('$lib/services/api.client');
	const { throwApiError } = await import('$lib/utils/errorMessage');
	const res = await authFetch(
		`${EVENT_URL}/api/v1/events/${eventId}/meeting/import-attendance`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(minMinutes !== undefined ? { minMinutes } : {})
		}
	);
	if (!res.ok) await throwApiError(res, 'Could not import attendance');
	const json = await res.json();
	return json.data as AttendanceImportResult;
}

/** A filesystem-safe `.ics` name from an event title. */
export function icsFileName(title: string): string {
	const slug =
		title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'event';
	return `${slug}.ics`;
}
