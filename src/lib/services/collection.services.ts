import { authFetch } from '$lib/services/api.client';

import { throwApiError } from '$lib/utils/errorMessage';
const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export async function getCollectionSubscribers(
	collectionId: string,
	options?: { search?: string; skip?: number; limit?: number; status?: string; source?: string; sortBy?: string; sortOrder?: string }
): Promise<any> {
	const params = new URLSearchParams();
	if (options?.search) params.set('search', options.search);
	if (options?.skip !== undefined) params.set('skip', String(options.skip));
	if (options?.limit !== undefined) params.set('limit', String(options.limit));
	if (options?.status) params.set('status', options.status);
	if (options?.source) params.set('source', options.source);
	if (options?.sortBy) params.set('sortBy', options.sortBy);
	if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers?${params.toString()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to fetch subscribers');
	const data = await res.json();
	return data.data ?? data;
}

export async function getSubscriberDetail(
	collectionId: string,
	subscriberId: string
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers/${subscriberId}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to fetch subscriber detail');
	const data = await res.json();
	return data.data ?? data;
}

export async function addCollectionSubscriber(
	collectionId: string,
	subscriberData: { email: string; firstName?: string; lastName?: string; tags?: string[] }
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(subscriberData)
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to add subscriber');
	const data = await res.json();
	return data;
}

export async function removeCollectionSubscriber(
	collectionId: string,
	subscriberId: string
): Promise<void> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers/${subscriberId}`,
		{ method: 'DELETE' }
	);
	if (!res.ok) await throwApiError(res, 'Failed to remove subscriber');
}

export async function confirmCollectionSubscription(token: string): Promise<any> {
	const res = await fetch(
		`${EVENT_URL}/api/v1/collections/confirm-subscription?token=${token}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to confirm subscription');
	const data = await res.json();
	return data;
}

export async function publicSubscribeToCollection(
	collectionId: string,
	payload: { email?: string; firstName?: string; lastName?: string; userId?: string }
): Promise<any> {
	const res = await fetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/public-subscribe`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to subscribe');
	const data = await res.json();
	return data;
}

export async function addSubscriberTag(
	collectionId: string,
	subscriberId: string,
	tagName: string
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers/${subscriberId}/tags`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ tagName })
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to add tag');
	const data = await res.json();
	return data;
}

export async function removeSubscriberTag(
	collectionId: string,
	subscriberId: string,
	tagName: string
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers/${subscriberId}/tags/${encodeURIComponent(tagName)}`,
		{ method: 'DELETE' }
	);
	if (!res.ok) await throwApiError(res, 'Failed to remove tag');
	const data = await res.json();
	return data;
}

export async function deleteCollectionSubscriber(
	collectionId: string,
	subscriberId: string
): Promise<void> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers/${subscriberId}/delete`,
		{ method: 'DELETE' }
	);
	if (!res.ok) await throwApiError(res, 'Failed to delete subscriber');
}

export async function blockCollectionSubscriber(
	collectionId: string,
	subscriberId: string
): Promise<void> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers/${subscriberId}/block`,
		{ method: 'PUT' }
	);
	if (!res.ok) await throwApiError(res, 'Failed to block subscriber');
}

export async function getCollectionSubscriberTags(collectionId: string): Promise<any[]> {
	const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/subscriber-tags`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch tags');
	const data = await res.json();
	return data.data ?? [];
}

export async function createCollectionSubscriberTag(
	collectionId: string,
	name: string,
	color: string
): Promise<any> {
	const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/subscriber-tags`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, color })
	});
	if (!res.ok) await throwApiError(res, 'Failed to create tag');
	const data = await res.json();
	return data.data ?? data;
}

export async function resendSubscriptionConfirmation(
	collectionId: string,
	subscriberId: string
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/subscribers/${subscriberId}/resend-confirmation`,
		{ method: 'POST' }
	);
	if (!res.ok) await throwApiError(res, 'Failed to resend confirmation');
	const data = await res.json();
	return data;
}
