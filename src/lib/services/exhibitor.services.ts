import { authFetch } from '$lib/services/api.client';

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
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to fetch booths');
	return data;
}

export async function getBooth(boothId: string) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/${boothId}`);
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to fetch booth');
	return data.data;
}

export async function createBooth(boothData: Record<string, unknown>) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(boothData)
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to create booth');
	return data.data;
}

export async function updateBooth(boothId: string, updates: Record<string, unknown>) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/${boothId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updates)
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to update booth');
	return data.data;
}

export async function deleteBooth(boothId: string) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/${boothId}`, {
		method: 'DELETE'
	});
	if (res.status === 204) return true;
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to delete booth');
	return data.data;
}

export async function duplicateBooth(boothId: string) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/booths/${boothId}/duplicate`, {
		method: 'POST'
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to duplicate booth');
	return data.data;
}

export async function uploadBoothMedia(file: File) {
	const formData = new FormData();
	formData.append('file', file);

	const res = await authFetch(`${PRODUCTS_API}/vendor/upload?context=booth`, {
		method: 'POST',
		body: formData
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to upload file');
	return data.url;
}

export async function deleteBoothMedia(url: string) {
	const res = await authFetch(`${PRODUCTS_API}/vendor/upload`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url })
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to delete media');
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
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to fetch collaborations');
	return data.data;
}

export async function getExhibitorCollaboration(collaborationId: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}`);
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to fetch collaboration');
	return data.data;
}

export async function sendExhibitorCollaborationRequest(requestData: Record<string, unknown>) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/send`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestData)
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to send collaboration request');
	return data.data;
}

export async function updateExhibitorCollaborationStatus(collaborationId: string, status: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/status`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status })
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to update collaboration');
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
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to withdraw collaboration');
	return data.data;
}

export async function sendExhibitorMessage(collaborationId: string, message: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/message`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ content: message })
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to send message');
	return data.data;
}

export async function getExhibitorCollaborationStats() {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/stats`);
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to fetch stats');
	return data.data;
}

export async function uploadExhibitorMedia(file: File) {
	const formData = new FormData();
	formData.append('file', file);

	const res = await authFetch(`${PRODUCTS_API}/vendor/upload?context=exhibitor`, {
		method: 'POST',
		body: formData
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to upload file');
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
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to discover events');
	return data.events || [];
}

export async function resendExhibitorCollaborationEmail(collaborationId: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}/resend-email`, {
		method: 'POST'
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to resend email');
	return data;
}

export async function deleteExhibitorCollaboration(collaborationId: string) {
	const res = await authFetch(`${PRODUCTS_API}/exhibitor/collaborations/${collaborationId}`, {
		method: 'DELETE'
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to delete collaboration');
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
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to upload exhibitor logo');
	return data.data;
}

export async function uploadExhibitorCover(profileId: string, file: File) {
	const formData = new FormData();
	formData.append('cover', file);

	const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/exhibitor/cover`, {
		method: 'POST',
		body: formData
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? 'Failed to upload exhibitor cover');
	return data.data;
}
