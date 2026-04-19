import { authFetch } from '$lib/services/api.client';

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Upload speaker profile photo to S3 via the user profile service.
 */
export async function uploadSpeakerPhoto(profileId: string, file: File) {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/speaker/photo`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to upload speaker photo');
  return data.data;
}

/**
 * Upload speaker portfolio files to S3 via the user profile service.
 * Supports multiple files (images, videos, PDFs).
 */
export async function uploadSpeakerPortfolio(profileId: string, files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/speaker/portfolio`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to upload speaker portfolio');
  return data.data;
}

/**
 * Update speaker details on an existing speaker profile.
 */
export async function updateSpeakerDetails(
  profileId: string,
  details: Record<string, unknown>
) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/speaker/details`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update speaker details');
  return data.data;
}

const PRODUCTS_API = `${BASE_URL}/api/v1/products`;

// ─── Speaker Collaboration & Invitation APIs ──────────────────────────────

interface SpeakerCollaborationFilters {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetch speaker collaborations from the dedicated speaker collaboration API.
 */
export async function getSpeakerCollaborations(filters: SpeakerCollaborationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch speaker collaborations');
  return data.data;
}

/**
 * Fetch speaker collaboration stats for the dashboard.
 */
export async function getSpeakerCollaborationStats() {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/stats`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch speaker stats');
  return data.data;
}

/**
 * Get a single speaker collaboration by ID.
 */
export async function getSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch collaboration');
  return data.data;
}

/**
 * Send an outbound speaker collaboration request.
 */
export async function sendSpeakerCollaborationRequest(requestData: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to send collaboration request');
  return data.data;
}

/**
 * Send a speaker quote for a collaboration.
 */
export async function sendSpeakerQuote(collaborationId: string, quote: { quotedAmount: number; quotedCurrency?: string; message?: string }) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quote)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to send quote');
  return data.data;
}

/**
 * Accept a speaker collaboration.
 */
export async function acceptSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/accept`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to accept collaboration');
  return data.data;
}

/**
 * Decline a speaker collaboration.
 */
export async function declineSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/decline`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to decline collaboration');
  return data.data;
}

/**
 * Withdraw a sent speaker collaboration request.
 */
export async function withdrawSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/withdraw`, {
    method: 'PUT'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to withdraw collaboration');
  return data.data;
}

/**
 * Fetch speaker invitations from the products service.
 */
export async function getSpeakerInvitations() {
  const res = await authFetch(`${PRODUCTS_API}/speaker/invitations`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch speaker invitations');
  return data.data;
}

/**
 * Fetch speaker profile from the products service.
 */
export async function getSpeakerProductProfile() {
  const res = await authFetch(`${PRODUCTS_API}/speaker/profile`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch speaker profile');
  return data.data;
}

// ─── Speaker Portfolio CRUD ───────────────────────────────────────────────

export interface PortfolioFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getSpeakerPortfolios(filters: PortfolioFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const res = await authFetch(`${PRODUCTS_API}/portfolio?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch portfolios');
  return data;
}

export async function getSpeakerPortfolio(portfolioId: string) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/${portfolioId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch portfolio');
  return data.data;
}

export async function createSpeakerPortfolio(portfolioData: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(portfolioData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create portfolio');
  return data.data;
}

export async function updateSpeakerPortfolio(portfolioId: string, updates: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/${portfolioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update portfolio');
  return data.data;
}

export async function archiveSpeakerPortfolio(portfolioId: string) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/${portfolioId}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to archive portfolio');
  return data;
}

export async function duplicateSpeakerPortfolio(portfolioId: string) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/${portfolioId}/duplicate`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to duplicate portfolio');
  return data.data;
}

export async function uploadSpeakerPortfolioMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authFetch(`${PRODUCTS_API}/portfolio/upload`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to upload file');
  return data.url;
}

export async function deleteSpeakerPortfolioMedia(url: string) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/media`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to delete media');
  return data;
}

/**
 * Send a message on a speaker collaboration.
 */
export async function sendSpeakerMessage(collaborationId: string, content: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to send message');
  return data.data;
}

/**
 * Update speaker collaboration status.
 */
export async function updateSpeakerCollaborationStatus(collaborationId: string, status: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update collaboration');
  return data.data;
}

/**
 * Resend speaker collaboration email to organizer.
 */
export async function resendSpeakerCollaborationEmail(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/resend-email`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to resend email');
  return data;
}

/**
 * Delete a speaker collaboration request.
 */
export async function deleteSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to delete collaboration');
  return data;
}

/**
 * Discover public events (for speaker to find events to apply to).
 */
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
