import { authFetch } from '$lib/services/api.client';

import { throwApiError } from '$lib/utils/errorMessage';
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
  if (!res.ok) await throwApiError(res, 'Failed to upload speaker photo');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to upload speaker portfolio');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update speaker details');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to fetch speaker collaborations');
  const data = await res.json();
  return data.data;
}

/**
 * Fetch speaker collaboration stats for the dashboard.
 */
export async function getSpeakerCollaborationStats() {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/stats`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch speaker stats');
  const data = await res.json();
  return data.data;
}

/**
 * Get a single speaker collaboration by ID.
 */
export async function getSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch collaboration');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to send collaboration request');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to send quote');
  const data = await res.json();
  return data.data;
}

/**
 * Accept a speaker collaboration.
 */
export async function acceptSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/accept`, {
    method: 'POST'
  });
  if (!res.ok) await throwApiError(res, 'Failed to accept collaboration');
  const data = await res.json();
  return data.data;
}

/**
 * Decline a speaker collaboration.
 */
export async function declineSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/decline`, {
    method: 'POST'
  });
  if (!res.ok) await throwApiError(res, 'Failed to decline collaboration');
  const data = await res.json();
  return data.data;
}

/**
 * Withdraw a sent speaker collaboration request.
 */
export async function withdrawSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/withdraw`, {
    method: 'PUT'
  });
  if (!res.ok) await throwApiError(res, 'Failed to withdraw collaboration');
  const data = await res.json();
  return data.data;
}

/**
 * Fetch speaker invitations from the products service.
 */
export async function getSpeakerInvitations() {
  const res = await authFetch(`${PRODUCTS_API}/speaker/invitations`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch speaker invitations');
  const data = await res.json();
  return data.data;
}

/**
 * Fetch speaker profile from the products service.
 */
export async function getSpeakerProductProfile() {
  const res = await authFetch(`${PRODUCTS_API}/speaker/profile`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch speaker profile');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to fetch portfolios');
  const data = await res.json();
  return data;
}

export async function getSpeakerPortfolio(portfolioId: string) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/${portfolioId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch portfolio');
  const data = await res.json();
  return data.data;
}

export async function createSpeakerPortfolio(portfolioData: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(portfolioData)
  });
  if (!res.ok) await throwApiError(res, 'Failed to create portfolio');
  const data = await res.json();
  return data.data;
}

export async function updateSpeakerPortfolio(portfolioId: string, updates: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/${portfolioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) await throwApiError(res, 'Failed to update portfolio');
  const data = await res.json();
  return data.data;
}

export async function archiveSpeakerPortfolio(portfolioId: string) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/${portfolioId}`, {
    method: 'DELETE'
  });
  if (!res.ok) await throwApiError(res, 'Failed to archive portfolio');
  const data = await res.json();
  return data;
}

export async function duplicateSpeakerPortfolio(portfolioId: string) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/${portfolioId}/duplicate`, {
    method: 'POST'
  });
  if (!res.ok) await throwApiError(res, 'Failed to duplicate portfolio');
  const data = await res.json();
  return data.data;
}

export async function uploadSpeakerPortfolioMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authFetch(`${PRODUCTS_API}/portfolio/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload file');
  const data = await res.json();
  return data.url;
}

export async function deleteSpeakerPortfolioMedia(url: string) {
  const res = await authFetch(`${PRODUCTS_API}/portfolio/media`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete media');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to send message');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update collaboration');
  const data = await res.json();
  return data.data;
}

/**
 * Resend speaker collaboration email to organizer.
 */
export async function resendSpeakerCollaborationEmail(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}/resend-email`, {
    method: 'POST'
  });
  if (!res.ok) await throwApiError(res, 'Failed to resend email');
  const data = await res.json();
  return data;
}

/**
 * Delete a speaker collaboration request.
 */
export async function deleteSpeakerCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/speaker/collaborations/${collaborationId}`, {
    method: 'DELETE'
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete collaboration');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to discover events');
  const data = await res.json();
  return data.events || [];
}
