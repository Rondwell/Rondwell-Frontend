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

// ─── Payout reserve (FE-P5-03 / NEW-11.1) ─────────────────────────────────
//
// Rolling reserve applies to EVERY organizer by default: a percentage of each
// ticket sale is held and released shortly after the event ends, because Rondwell
// is the merchant of record and Paystack takes refunds and lost chargebacks out
// of OUR balance — not the organizer's.
//
// These helpers let an admin ease that for a trustworthy organizer, tighten it
// for a risky one, and release money that is currently held. Easing the POLICY
// and RELEASING existing holds are deliberately separate calls: one toggle must
// not silently dump a reserve that was taken against known exposure.

export type PayoutPolicyMode = 'ROLLING' | 'INSTANT';
export type PayoutRiskTier = 'TRUSTED' | 'STANDARD' | 'ELEVATED';

export interface PayoutHeldByCurrency {
  currency: string;
  heldKobo: number;
  holdCount: number;
  nextReleaseAt: string | null;
}

export interface PayoutUpcomingHold {
  holdId: string;
  eventId: string;
  eventTitle: string | null;
  currency: string;
  heldKobo: number;
  releaseDueAt: string;
  isFallbackDate: boolean;
}

export interface PayoutPolicyChange {
  at: string;
  actor: string;
  fromPolicy?: PayoutPolicyMode;
  toPolicy?: PayoutPolicyMode;
  fromReservePercentBps?: number;
  toReservePercentBps?: number;
  fromReleaseDelayDays?: number;
  toReleaseDelayDays?: number;
  fromRiskTier?: PayoutRiskTier;
  toRiskTier?: PayoutRiskTier;
  reason?: string;
  releasedKobo?: number;
}

export interface PayoutPanel {
  userId: string;
  effective: {
    policy: PayoutPolicyMode;
    riskTier: PayoutRiskTier;
    reservePercentBps: number;
    releaseDelayDays: number;
    easeExpired: boolean;
    easedUntil: string | null;
    easedBy: string | null;
    easedReason: string | null;
  };
  stored: {
    policy: PayoutPolicyMode;
    riskTier: PayoutRiskTier;
    reservePercentBps: number;
    releaseDelayDays: number;
    easedBy: string | null;
    easedAt: string | null;
    easedReason: string | null;
    easedUntil: string | null;
    chargebackCount: number;
    refundCount: number;
    lastChargebackAt: string | null;
    autoElevatedAt: string | null;
  };
  outstanding: PayoutHeldByCurrency[];
  upcoming: PayoutUpcomingHold[];
  lifetime: {
    heldKobo: number;
    releasedKobo: number;
    consumedKobo: number;
    holdCount: number;
  };
  history: PayoutPolicyChange[];
  defaults: {
    reservePercentBps: number;
    releaseDelayDays: number;
    tiers: Record<PayoutRiskTier, { reservePercentBps: number; releaseDelayDays: number }>;
  };
}

/** Read an organizer's payout policy, outstanding reserve and change history. */
export async function getUserPayout(id: string): Promise<PayoutPanel> {
  const data = await adminFetch(`/users/${id}/payout`);
  return data.data;
}

/**
 * Update an organizer's payout policy. Affects FUTURE settlements only.
 * A `reason` is required by the backend when granting INSTANT payouts.
 */
export async function updateUserPayoutPolicy(
  id: string,
  body: {
    policy?: PayoutPolicyMode;
    riskTier?: PayoutRiskTier;
    reservePercentBps?: number;
    releaseDelayDays?: number;
    easedUntil?: string | null;
    reason?: string;
  },
): Promise<PayoutPanel> {
  const data = await adminFetch(`/users/${id}/payout`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return data.data;
}

/**
 * Release an organizer's outstanding reserve immediately.
 * Separate from the policy change on purpose — this moves real money now.
 */
export async function releaseUserPayoutHolds(
  id: string,
  body: { reason: string; eventId?: string },
): Promise<{ releasedCount: number; releasedKobo: number; panel: PayoutPanel }> {
  const data = await adminFetch(`/users/${id}/payout/release`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.data;
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

/**
 * Registration/group/ticket detail for a single event. These back the tabs on
 * the Event Details panel — the panel used to render only the fields already
 * present in the list response, which is why it couldn't answer anything about
 * who had actually registered.
 */
export async function getAdminEventStats(id: string) {
  const data = await adminFetch(`/events/${id}/stats`);
  return data.data;
}

export async function getAdminEventRegistrations(id: string, params: Record<string, any> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '') as [string, string][]
  ).toString();
  const data = await adminFetch(`/events/${id}/registrations?${query}`);
  return data.data;
}

export async function getAdminEventGroups(id: string, params: Record<string, any> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '') as [string, string][]
  ).toString();
  const data = await adminFetch(`/events/${id}/groups?${query}`);
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
