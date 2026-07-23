/**
 * Admin API service layer.
 * All admin API calls go through the gateway at VITE_API_URL.
 */
import { browser } from '$app/environment';
import { throwApiError } from '$lib/utils/errorMessage';

const API_URL = import.meta.env.VITE_API_URL;

function getAdminToken(): string | null {
  if (!browser) return null;
  return localStorage.getItem('admin_token');
}

export function setAdminAuth(token: string, admin: any) {
  if (!browser) return;
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_user', JSON.stringify(admin));
}

export function getAdminUser(): any | null {
  if (!browser) return null;
  try {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAdminAuth() {
  if (!browser) return;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

async function adminFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAdminToken();
  if (!token) throw new Error('Not authenticated');

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${API_URL}/api/v1/admin${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAdminAuth();
    if (browser) window.location.href = '/hq/login';
    throw new Error('Session expired');
  }

  if (!res.ok) await throwApiError(res, 'Request failed');
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) await throwApiError(res, 'Login failed');
  const data = await res.json();
  return data.data;
}

export async function seedAdmin() {
  const res = await fetch(`${API_URL}/api/v1/admin/seed`, { method: 'POST' });
  return res.json();
}

// ─── Dashboard ────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const data = await adminFetch('/dashboard/stats');
  return data.data;
}

// ─── Users ────────────────────────────────────────────────────────────────
export async function getUsers(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await adminFetch(`/users?${query}`);
  return data.data;
}

export async function getUser(id: string) {
  const data = await adminFetch(`/users/${id}`);
  return data.data;
}

export async function updateUserStatus(id: string, status: string) {
  const data = await adminFetch(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data;
}

/** Fetch a user's subscription plan (effective tier + subscription row + plan catalog). */
export async function getUserSubscription(id: string) {
  const data = await adminFetch(`/users/${id}/subscription`);
  return data.data;
}

/**
 * Fetch a user's wallet balance for the User Management detail panel.
 * Returns per-currency total / reserved / disputed / withdrawable amounts
 * plus wallet status. A user with no provisioned wallet resolves to `null`
 * (the API returns 404) so callers can show a "No wallet yet" state.
 */
export async function getUserWallet(id: string) {
  const token = getAdminToken();
  if (!token) throw new Error('Not authenticated');

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${API_URL}/api/v1/admin/users/${id}/wallet`, { headers });

  if (res.status === 401) {
    clearAdminAuth();
    if (browser) window.location.href = '/hq/login';
    throw new Error('Session expired');
  }
  // No wallet provisioned yet — surface as null rather than an error.
  if (res.status === 404) return null;

  if (!res.ok) await throwApiError(res, 'Failed to load wallet balance');
  const data = await res.json();
  return data.data;
}

/**
 * Change a user's plan. `tier` is 'PLUS' or 'FREE'.
 * For PLUS you may pass billingCycle ('MONTHLY'|'YEARLY') and currency ('NGN'|'USD').
 */
export async function updateUserPlan(
  id: string,
  tier: 'PLUS' | 'FREE',
  opts: { billingCycle?: 'MONTHLY' | 'YEARLY'; currency?: 'NGN' | 'USD'; durationMonths?: number; reason?: string } = {},
) {
  const data = await adminFetch(`/users/${id}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ tier, ...opts }),
  });
  return data;
}

// ─── Events ───────────────────────────────────────────────────────────────
export async function getAdminEvents(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await adminFetch(`/events?${query}`);
  return data.data;
}

export async function getAdminEvent(id: string) {
  const data = await adminFetch(`/events/${id}`);
  return data.data;
}

export async function updateEventStatus(id: string, eventStatus: string) {
  const data = await adminFetch(`/events/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ eventStatus }),
  });
  return data;
}

// ─── Collections ──────────────────────────────────────────────────────────
export async function getAdminCollections(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await adminFetch(`/collections?${query}`);
  return data.data;
}

export async function getCollectionApprovals(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await adminFetch(`/collections/approvals?${query}`);
  return data.data;
}

export async function updateApprovalStatus(id: string, status: string, adminNote?: string) {
  const data = await adminFetch(`/collections/approvals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNote }),
  });
  return data.data;
}

export async function verifyCollection(id: string, status: 'APPROVED' | 'REJECTED') {
  const data = await adminFetch(`/collections/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data;
}

// ─── Settings ─────────────────────────────────────────────────────────────
export async function getAdminProfile() {
  const data = await adminFetch('/settings/profile');
  return data.data;
}

export async function updateAdminProfile(updates: { name?: string; email?: string }) {
  const data = await adminFetch('/settings/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.data;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  const data = await adminFetch('/settings/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return data;
}
