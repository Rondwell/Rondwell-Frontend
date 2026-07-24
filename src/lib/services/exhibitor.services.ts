import { authFetch } from '$lib/services/api.client';

import { throwApiError } from '$lib/utils/errorMessage';
const BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_API = `${BASE_URL}/api/v1/products`;

// ─── Booths ───────────────────────────────────────────────────────────────

export interface BoothFilters {
	status?: string;
	search?: string;
	page?: number;
	limit?: number;
}

export async function getMyBooths(filters: BoothFilters = {}) {
	const params = new URLSearchParams();
	if (filters.status) params.set('status', filters.status);
	if (filters.search) params.set('search', filters.search);
	if (filters.page) params.set('page', String(filters.page));
	if (filters.limit) params.set('limit', String(filters.limit));

	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/my-booths?${params}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch booths');
	const data = await res.json();
	return data;
}

export async function getBooth(boothId: string) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/${boothId}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch booth');
	const data = await res.json();
	return data.data;
}

export async function createBooth(boothData: Record<string, unknown>) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(boothData)
	});
	if (!res.ok) await throwApiError(res, 'Failed to create booth');
	const data = await res.json();
	return data.data;
}

export async function updateBooth(boothId: string, updates: Record<string, unknown>) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/${boothId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updates)
	});
	if (!res.ok) await throwApiError(res, 'Failed to update booth');
	const data = await res.json();
	return data.data;
}

export async function deleteBooth(boothId: string) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/${boothId}`, {
		method: 'DELETE'
	});
	if (res.status === 204) return true;
	if (!res.ok) await throwApiError(res, 'Failed to delete booth');
	const data = await res.json();
	return data.data;
}

export async function duplicateBooth(boothId: string) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/${boothId}/duplicate`, {
		method: 'POST'
	});
	if (!res.ok) await throwApiError(res, 'Failed to duplicate booth');
	const data = await res.json();
	return data.data;
}

export async function uploadBoothMedia(file: File) {
	const formData = new FormData();
	formData.append('file', file);

	const res = await authFetch(`${PRODUCTS_API}/vendor/upload?context=booth`, {
		method: 'POST',
		body: formData
	});
	if (!res.ok) await throwApiError(res, 'Failed to upload file');
	const data = await res.json();
	return data.url;
}

export async function deleteBoothMedia(url: string) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/upload`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url })
	});
	if (!res.ok) await throwApiError(res, 'Failed to delete media');
	const data = await res.json();
	return data;
}

// ─── Exhibitor Collaborations ─────────────────────────────────────────────

export interface ExhibitorCollaborationFilters {
	status?: string;
	type?: string;
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

export async function getExhibitorCollaborations(filters: ExhibitorCollaborationFilters = {}) {
	const params = new URLSearchParams();
	if (filters.status) params.set('status', filters.status);
	if (filters.type) params.set('type', filters.type);
	if (filters.search) params.set('search', filters.search);
	if (filters.page) params.set('page', String(filters.page));
	if (filters.limit) params.set('limit', String(filters.limit));
	if (filters.sortBy) params.set('sortBy', filters.sortBy);
	if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations?${params}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch collaborations');
	const data = await res.json();
	return data.data;
}

export async function getExhibitorCollaboration(collaborationId: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch collaboration');
	const data = await res.json();
	return data.data;
}

// ─── Booth Invoicing (organizer → exhibitor, paid via Paystack) ────────────

/**
 * Organizer issues a booth invoice to the exhibitor on a collaboration.
 * The exhibitor is emailed a pay link and can pay via Paystack/Flutterwave.
 */
export async function issueExhibitorInvoice(
	collaborationId: string,
	payload: { amount: number; currency?: string; message?: string; serviceName?: string }
) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/issue-invoice`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwApiError(res, 'Failed to issue invoice');
	const data = await res.json();
	return data.data;
}

/**
 * Organizer issues a booth invoice from the event's exhibitor participant view.
 * Finds-or-creates the collaboration by (eventId, exhibitorUserId) then emails
 * the exhibitor a Paystack pay link.
 */
export async function issueExhibitorInvoiceByParticipant(payload: {
	eventId: string;
	exhibitorUserId: string;
	exhibitorName?: string;
	exhibitorEmail?: string;
	eventName?: string;
	organizerName?: string;
	organizerEmail?: string;
	amount: number;
	currency?: string;
	message?: string;
	serviceName?: string;
}) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/organizer/issue-invoice`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwApiError(res, 'Failed to issue invoice');
	const data = await res.json();
	return data.data;
}

/**
 * Fetch the issued invoice + payment context for the pay page. Works for the
 * exhibitor (payer) and the organizer (issuer).
 */
export async function getExhibitorInvoiceForPay(collaborationId: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/invoice`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch invoice');
	const data = await res.json();
	return data.data;
}

export async function sendExhibitorCollaborationRequest(requestData: Record<string, unknown>) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/send`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestData)
	});
	if (!res.ok) await throwApiError(res, 'Failed to send collaboration request');
	const data = await res.json();
	return data.data;
}

export async function updateExhibitorCollaborationStatus(collaborationId: string, status: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/status`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status })
	});
	if (!res.ok) await throwApiError(res, 'Failed to update collaboration');
	const data = await res.json();
	return data.data;
}

export async function acceptExhibitorCollaboration(collaborationId: string) {
	return updateExhibitorCollaborationStatus(collaborationId, 'ACCEPTED');
}

export async function declineExhibitorCollaboration(collaborationId: string) {
	return updateExhibitorCollaborationStatus(collaborationId, 'DECLINED');
}

export async function withdrawExhibitorCollaboration(collaborationId: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/withdraw`, {
		method: 'PUT'
	});
	if (!res.ok) await throwApiError(res, 'Failed to withdraw collaboration');
	const data = await res.json();
	return data.data;
}

export async function sendExhibitorMessage(collaborationId: string, message: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/message`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ content: message })
	});
	if (!res.ok) await throwApiError(res, 'Failed to send message');
	const data = await res.json();
	return data.data;
}

export async function getExhibitorCollaborationStats() {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/stats`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch stats');
	const data = await res.json();
	return data.data;
}

export async function uploadExhibitorMedia(file: File) {
	const formData = new FormData();
	formData.append('file', file);

	const res = await authFetch(`${PRODUCTS_API}/vendor/upload?context=exhibitor`, {
		method: 'POST',
		body: formData
	});
	if (!res.ok) await throwApiError(res, 'Failed to upload file');
	const data = await res.json();
	return data.url;
}

// ─── Discover Public Events (for exhibitor) ───────────────────────────────

export async function discoverEvents(filters: { search?: string; page?: number; limit?: number; organizerId?: string } = {}) {
	const BASE = import.meta.env.VITE_API_URL;
	const params = new URLSearchParams();
	if (filters.search) params.set('search', filters.search);
	if (filters.page) params.set('page', String(filters.page));
	if (filters.limit) params.set('limit', String(filters.limit));
	if (filters.organizerId) params.set('organizerId', filters.organizerId);

	const res = await fetch(`${BASE}/api/v1/events/discover?${params}`);
	if (!res.ok) await throwApiError(res, 'Failed to discover events');
	const data = await res.json();
	return data.events || [];
}

export async function resendExhibitorCollaborationEmail(collaborationId: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/resend-email`, {
		method: 'POST'
	});
	if (!res.ok) await throwApiError(res, 'Failed to resend email');
	const data = await res.json();
	return data;
}

export async function deleteExhibitorCollaboration(collaborationId: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}`, {
		method: 'DELETE'
	});
	if (!res.ok) await throwApiError(res, 'Failed to delete collaboration');
	const data = await res.json();
	return data;
}


// ─── Exhibitor Logo/Cover Upload (User Service) ──────────────────────────

export async function uploadExhibitorLogo(profileId: string, file: File) {
	const formData = new FormData();
	formData.append('logo', file);

	const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/exhibitor/logo`, {
		method: 'POST',
		body: formData
	});
	if (!res.ok) await throwApiError(res, 'Failed to upload exhibitor logo');
	const data = await res.json();
	return data.data;
}

export async function uploadExhibitorCover(profileId: string, file: File) {
	const formData = new FormData();
	formData.append('cover', file);

	const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/exhibitor/cover`, {
		method: 'POST',
		body: formData
	});
	if (!res.ok) await throwApiError(res, 'Failed to upload exhibitor cover');
	const data = await res.json();
	return data.data;
}
