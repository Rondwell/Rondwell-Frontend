/**
 * Admin API service layer.
 * All admin API calls go through the gateway at VITE_API_URL.
 */
import { browser } from '$app/environment';

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
  const data = await res.json();

  if (res.status === 401) {
    clearAdminAuth();
    if (browser) window.location.href = '/hq/login';
    throw new Error('Session expired');
  }

  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
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
