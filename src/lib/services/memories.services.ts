/**
 * GAP 10 — memories (guest uploads + moderation).
 *
 * Wraps `/api/v1/events/:eventId/memories`.
 *
 * The trust model, because it is not obvious from the endpoints alone:
 *
 *   - Uploading requires being a VERIFIED ATTENDEE of the event, in an
 *     attendance state the organizer's settings permit, inside the upload
 *     window, and under the per-person cap. All of those are server-side —
 *     `MEDIA_CONTRIBUTE` is granted dynamically and exists on no admin role,
 *     so there is no path that skips them.
 *   - `category` and `source` are forced server-side. A guest cannot upload
 *     into the sponsor gallery, nor claim their photo came from the organizer
 *     to skip moderation.
 *   - The PUBLIC event page only ever shows APPROVED attendee uploads, and
 *     only when the organizer set visibility to PUBLIC.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export interface Memory {
	id: string;
	eventId: string;
	type: 'IMAGE' | 'VIDEO';
	url: string;
	thumbnailUrl: string;
	title: string;
	description: string;
	uploaderId: string;
	uploaderName: string;
	uploaderAvatarUrl: string;
	moderationStatus: 'PENDING' | 'APPROVED' | 'HIDDEN' | 'REMOVED';
	reportCount: number;
	likeCount: number;
	likedByMe: boolean;
	isMine: boolean;
	createdAt: string;
}

function api(eventId: string) {
	return `${EVENT_URL}/api/v1/events/${eventId}/memories`;
}

/**
 * Human copy for the reasons a guest can be refused an upload.
 *
 * Kept next to the service so the memories page and any future surface say
 * the same thing about the same rejection.
 */
export function memoryErrorCopy(err: unknown, fallback = 'Could not add your photo.'): string {
	const code = (err as any)?.code;
	const meta = (err as any)?.meta ?? {};
	switch (code) {
		case 'NOT_AN_ATTENDEE':
			return 'Only people who attended this event can add photos.';
		case 'MEMORIES_DISABLED':
			return "This event isn't collecting guest photos.";
		case 'MEMORIES_CLOSED':
			return 'Photo uploads for this event have closed.';
		case 'MEMORIES_NOT_OPEN_YET':
			return 'Photos open once the event starts.';
		case 'ATTENDEE_STATUS_NOT_ALLOWED':
			return meta.allowedFrom === 'AFTER_CHECKIN'
				? "You'll be able to add photos once you've checked in."
				: 'Your registration needs to be confirmed before you can add photos.';
		case 'UPLOAD_LIMIT_REACHED':
			return `You've reached the ${meta.uploadsAllowed ?? ''} photo limit for this event.`.replace(
				'  ',
				' '
			);
		case 'UNSUPPORTED_MEDIA_TYPE':
			return 'Only photos and videos can be shared here.';
		default:
			return (err as any)?.message || fallback;
	}
}

/**
 * Upload a photo or short video.
 *
 * Throws with `code` intact so the caller can use `memoryErrorCopy` — each
 * refusal reason needs different copy and a different call to action.
 */
export async function uploadMemory(
	eventId: string,
	file: File,
	meta: { title?: string; description?: string } = {}
): Promise<{ media: any; pendingApproval: boolean; uploadsRemaining: number }> {
	const form = new FormData();
	form.append('file', file);
	if (meta.title) form.append('title', meta.title);
	if (meta.description) form.append('description', meta.description);

	const res = await authFetch(api(eventId), { method: 'POST', body: form });
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const err = new Error(data?.message ?? 'Could not add your photo') as any;
		err.code = data?.code;
		err.meta = data?.meta;
		throw err;
	}
	return data;
}

export async function getMemories(
	eventId: string,
	opts: { limit?: number; skip?: number } = {}
): Promise<{ data: Memory[]; pagination: { skip: number; limit: number; total: number } }> {
	const params = new URLSearchParams();
	if (opts.limit) params.set('limit', String(opts.limit));
	if (opts.skip) params.set('skip', String(opts.skip));
	try {
		const res = await authFetch(`${api(eventId)}?${params.toString()}`);
		if (!res.ok) return { data: [], pagination: { skip: 0, limit: 0, total: 0 } };
		const json = await res.json();
		return {
			data: json?.data ?? [],
			pagination: json?.pagination ?? { skip: 0, limit: 0, total: 0 }
		};
	} catch {
		return { data: [], pagination: { skip: 0, limit: 0, total: 0 } };
	}
}

export async function deleteMemory(eventId: string, mediaId: string): Promise<void> {
	const res = await authFetch(`${api(eventId)}/${mediaId}`, { method: 'DELETE' });
	if (!res.ok) await throwApiError(res, 'Could not remove the photo');
}

/** One report per person — a repeat is a silent no-op server-side. */
export async function reportMemory(
	eventId: string,
	mediaId: string,
	reason?: string
): Promise<{ reported: boolean; alreadyReported: boolean; hidden: boolean }> {
	const res = await authFetch(`${api(eventId)}/${mediaId}/report`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ reason })
	});
	if (!res.ok) await throwApiError(res, 'Could not report this photo');
	return await res.json();
}

export async function likeMemory(
	eventId: string,
	mediaId: string
): Promise<{ liked: boolean; likeCount: number }> {
	const res = await authFetch(`${api(eventId)}/${mediaId}/like`, { method: 'POST' });
	if (!res.ok) await throwApiError(res, 'Could not like this photo');
	return await res.json();
}

// ── Moderation ───────────────────────────────────────────────────────────

export async function getModerationQueue(eventId: string): Promise<{
	pending: Memory[];
	reported: Memory[];
	counts: { pending: number; reported: number };
}> {
	try {
		const res = await authFetch(`${api(eventId)}/moderation/queue`);
		if (!res.ok) return { pending: [], reported: [], counts: { pending: 0, reported: 0 } };
		return await res.json();
	} catch {
		return { pending: [], reported: [], counts: { pending: 0, reported: 0 } };
	}
}

export async function getMemoriesStats(eventId: string): Promise<{
	photoCount: number;
	pendingCount: number;
	reportedCount: number;
	contributorCount: number;
}> {
	try {
		const res = await authFetch(`${api(eventId)}/moderation/stats`);
		if (!res.ok) return { photoCount: 0, pendingCount: 0, reportedCount: 0, contributorCount: 0 };
		return await res.json();
	} catch {
		return { photoCount: 0, pendingCount: 0, reportedCount: 0, contributorCount: 0 };
	}
}

export async function moderateMemory(
	eventId: string,
	mediaId: string,
	action: 'approve' | 'hide',
	reason?: string
): Promise<Memory> {
	const res = await authFetch(`${api(eventId)}/${mediaId}/${action}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ reason })
	});
	if (!res.ok) await throwApiError(res, `Could not ${action} the photo`);
	const data = await res.json();
	return data.media;
}

export async function bulkModerateMemories(
	eventId: string,
	mediaIds: string[],
	action: 'APPROVE' | 'HIDE'
): Promise<number> {
	const res = await authFetch(`${api(eventId)}/moderation/bulk`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ mediaIds, action })
	});
	if (!res.ok) await throwApiError(res, 'Bulk moderation failed');
	const data = await res.json();
	return data.moderated ?? 0;
}
