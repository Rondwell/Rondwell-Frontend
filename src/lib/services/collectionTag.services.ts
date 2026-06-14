import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export interface CollectionTag {
	id: string;
	name: string;
	color: string;
	type: 'EVENT' | 'SUBSCRIBER';
	eventCount?: number;
	memberCount?: number;
}

// ── Event tags ─────────────────────────────────────────────────────────────

export async function getEventTags(collectionId: string): Promise<CollectionTag[]> {
	const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/event-tags`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch event tags');
	const data = await res.json();
	return data.data ?? [];
}

export async function createEventTag(
	collectionId: string,
	name: string,
	color: string
): Promise<CollectionTag> {
	const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/event-tags`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, color })
	});
	if (!res.ok) await throwApiError(res, 'Failed to create tag');
	const data = await res.json();
	return data.data ?? data;
}

export async function updateEventTag(
	collectionId: string,
	tagId: string,
	payload: { name?: string; color?: string }
): Promise<CollectionTag> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/event-tags/${tagId}`,
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to update tag');
	const data = await res.json();
	return data.data ?? data;
}

export async function deleteEventTag(collectionId: string, tagId: string): Promise<void> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/event-tags/${tagId}`,
		{ method: 'DELETE' }
	);
	if (!res.ok) await throwApiError(res, 'Failed to delete tag');
}

/** Replace the full set of event tags assigned to an event. */
export async function setEventTags(
	collectionId: string,
	eventId: string,
	tagIds: string[]
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/events/${eventId}/tags`,
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ tagIds })
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to update event tags');
	const data = await res.json();
	return data.data ?? data;
}

// ── Member tags ──────────────────────────────────────────────────────────────

export async function getMemberTags(collectionId: string): Promise<CollectionTag[]> {
	const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/member-tags`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch member tags');
	const data = await res.json();
	return data.data ?? [];
}

export async function createMemberTag(
	collectionId: string,
	name: string,
	color: string
): Promise<CollectionTag> {
	const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/member-tags`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, color })
	});
	if (!res.ok) await throwApiError(res, 'Failed to create tag');
	const data = await res.json();
	return data.data ?? data;
}

export async function updateMemberTag(
	collectionId: string,
	tagId: string,
	payload: { name?: string; color?: string }
): Promise<CollectionTag> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/member-tags/${tagId}`,
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to update tag');
	const data = await res.json();
	return data.data ?? data;
}

export async function deleteMemberTag(collectionId: string, tagId: string): Promise<void> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/member-tags/${tagId}`,
		{ method: 'DELETE' }
	);
	if (!res.ok) await throwApiError(res, 'Failed to delete tag');
}
