import { authFetch } from '$lib/services/api.client';

import { throwApiError } from '$lib/utils/errorMessage';
const BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_API = `${BASE_URL}/api/v1/products`;

// ─── Vendor Profile (Product Service) ─────────────────────────────────────

export async function getVendorProfile() {
  const res = await authFetch(`${PRODUCTS_API}/vendor/profile`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch vendor profile');
  const data = await res.json();
  return data.data; // May be null if no product-service vendor record exists
}

export async function updateVendorProfile(updates: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) await throwApiError(res, 'Failed to update vendor profile');
  const data = await res.json();
  return data.data;
}

// ─── Products ─────────────────────────────────────────────────────────────

export interface ProductFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await authFetch(`${PRODUCTS_API}/vendor/products/products?${params}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch products');
  const data = await res.json();
  return data.data;
}

export async function getProduct(productId: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/products/products/${productId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch product');
  const data = await res.json();
  return data.data;
}

export async function createProduct(productData: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/products/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  if (!res.ok) await throwApiError(res, 'Failed to create product');
  const data = await res.json();
  return data.data;
}

export async function updateProduct(productId: string, updates: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/products/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) await throwApiError(res, 'Failed to update product');
  const data = await res.json();
  return data.data;
}

export async function deleteProduct(productId: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/products/products/${productId}`, {
    method: 'DELETE'
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete product');
  const data = await res.json();
  return data.data;
}

export async function duplicateProduct(productId: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/products/products/${productId}/duplicate`, {
    method: 'POST'
  });
  if (!res.ok) await throwApiError(res, 'Failed to duplicate product');
  const data = await res.json();
  return data.data;
}

export async function deleteVendorMedia(url: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/upload`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete media');
  const data = await res.json();
  return data;
}

// ─── Collaborations ───────────────────────────────────────────────────────

export interface CollaborationFilters {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getCollaborations(filters: CollaborationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations?${params}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch collaborations');
  const data = await res.json();
  return data.data;
}

export async function getCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch collaboration');
  const data = await res.json();
  return data.data;
}

export async function updateCollaborationStatus(collaborationId: string, status: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) await throwApiError(res, 'Failed to update collaboration');
  const data = await res.json();
  return data.data;
}

export async function acceptCollaboration(collaborationId: string) {
  return updateCollaborationStatus(collaborationId, 'ACCEPTED');
}

export async function declineCollaboration(collaborationId: string) {
  return updateCollaborationStatus(collaborationId, 'DECLINED');
}

export async function sendCollaborationQuote(collaborationId: string, quote: { quotedAmount: number; quotedCurrency: string; message?: string }) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quote)
  });
  if (!res.ok) await throwApiError(res, 'Failed to send quote');
  const data = await res.json();
  return data.data;
}

export async function sendOutboundCollaboration(requestData: Record<string, unknown>) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  if (!res.ok) await throwApiError(res, 'Failed to send collaboration request');
  const data = await res.json();
  return data.data;
}

export async function withdrawCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}/withdraw`, {
    method: 'PUT'
  });
  if (!res.ok) await throwApiError(res, 'Failed to withdraw collaboration');
  const data = await res.json();
  return data.data;
}

export async function deleteCollaboration(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}`, {
    method: 'DELETE'
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete collaboration');
  const data = await res.json();
  return data.data;
}

export async function resendCollaborationEmail(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}/resend-email`, {
    method: 'POST'
  });
  if (!res.ok) await throwApiError(res, 'Failed to resend email');
  const data = await res.json();
  return data;
}

export async function resendInvoiceEmail(collaborationId: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}/resend-invoice`, {
    method: 'POST'
  });
  if (!res.ok) await throwApiError(res, 'Failed to resend invoice');
  const data = await res.json();
  return data;
}

export async function sendCollaborationMessage(collaborationId: string, message: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) await throwApiError(res, 'Failed to send message');
  const data = await res.json();
  return data.data;
}

export async function uploadCollaborationDeliverable(collaborationId: string, deliverable: { url: string; type: string }) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deliverable)
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload deliverable');
  const data = await res.json();
  return data.data;
}

export async function cancelCollaboration(collaborationId: string, reason?: string) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/collaborations/${collaborationId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) await throwApiError(res, 'Failed to cancel collaboration');
  const data = await res.json();
  return data.data;
}

// ─── Financials ───────────────────────────────────────────────────────────

export async function getFinancials(filters: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.type) params.set('type', filters.type);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  const res = await authFetch(`${PRODUCTS_API}/vendor/financials?${params}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch financials');
  const data = await res.json();
  return data.data;
}

// ─── Analytics / Dashboard Stats ──────────────────────────────────────────

export async function getAnalyticsSummary() {
  const res = await authFetch(`${PRODUCTS_API}/vendor/analytics/summary`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch analytics');
  const data = await res.json();
  return data.data;
}

// ─── Calendar ─────────────────────────────────────────────────────────────

export async function getCalendarBookings() {
  const res = await authFetch(`${PRODUCTS_API}/vendor/calendar`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch calendar');
  const data = await res.json();
  return data.data;
}

// ─── File Upload ──────────────────────────────────────────────────────────

export async function uploadVendorMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authFetch(`${PRODUCTS_API}/vendor/upload?context=product`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload file');
  const data = await res.json();
  return data.url;
}

// ─── Vendor Logo/Cover Upload (User Service) ──────────────────────────────

export async function uploadVendorLogo(profileId: string, file: File) {
  const formData = new FormData();
  formData.append('logo', file);

  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/vendor/logo`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload vendor logo');
  const data = await res.json();
  return data.data;
}

export async function uploadVendorCover(profileId: string, file: File) {
  const formData = new FormData();
  formData.append('cover', file);

  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/vendor/cover`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload vendor cover');
  const data = await res.json();
  return data.data;
}


// ─── Public Vendor Discovery ──────────────────────────────────────────────

export async function discoverVendors(filters: { page?: number; limit?: number; search?: string; businessType?: string; location?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.businessType) params.set('businessType', filters.businessType);
  if (filters.location) params.set('location', filters.location);

  const res = await fetch(`${PRODUCTS_API}/public/discover/vendors?${params}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch vendors');
  const data = await res.json();
  return data.data;
}

export async function getPublicVendorBySlug(slug: string) {
  const res = await fetch(`${PRODUCTS_API}/public/discover/vendor/${slug}`);
  if (!res.ok) await throwApiError(res, 'Vendor not found');
  const data = await res.json();
  return data.data;
}

export async function getPublicVendorProduct(vendorSlug: string, productSlug: string) {
  const res = await fetch(`${PRODUCTS_API}/public/discover/vendor/${vendorSlug}/product/${productSlug}`);
  if (!res.ok) await throwApiError(res, 'Product not found');
  const data = await res.json();
  return data.data;
}

// ─── Vendor Visibility ────────────────────────────────────────────────────

export async function updateVendorVisibility(updates: { showReviews?: boolean; showContactInfo?: boolean }) {
  const res = await authFetch(`${PRODUCTS_API}/vendor/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicProfileSettings: updates })
  });
  if (!res.ok) await throwApiError(res, 'Failed to update visibility');
  const data = await res.json();
  return data.data;
}

// ─── Discover Public Events ───────────────────────────────────────────────

export async function discoverEvents(filters: { search?: string; page?: number; limit?: number; organizerId?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.organizerId) params.set('organizerId', filters.organizerId);

  const res = await fetch(`${BASE_URL}/api/v1/events/discover?${params}`);
  if (!res.ok) await throwApiError(res, 'Failed to discover events');
  const data = await res.json();
  return data.events || [];
}
