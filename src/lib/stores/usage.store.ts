/**
 * FE-P3-01 (NEW-8.1) — Plan-usage cache.
 *
 * Periodically polls the payment service for a snapshot of every metered
 * limit on the current user's plan (participants per event, active paid
 * events, emails sent this period, AI prompts, etc.) and exposes it
 * reactively so banners / settings pages can render usage live.
 *
 * Backend reference (P3-01):
 *   GET /api/v1/payment/subscription/my-limits     — limits + commission ladder
 *   GET /api/v1/payment/subscription/usage/me      — current usage per period
 *
 * The payment service exposes `internal/usage/snapshotForUser` over RPC for
 * server-to-server callers; the public read path used here is the user-
 * facing aggregate (`/usage/me`). Falls back to limit-only data when the
 * usage endpoint isn't available so banners can still render their copy.
 */

import { authFetch } from '$lib/services/api.client';
import { writable, derived, get } from 'svelte/store';

const BASE_URL = import.meta.env.VITE_API_URL;
const REFRESH_MS = 60_000; // 1 minute

export interface UsageSnapshot {
	tier: string;
	/** Hard limits per metered feature. `-1` = unlimited. */
	limits: Record<string, number>;
	/** Live usage counters for the same keys. */
	usage: Record<string, number>;
	loaded: boolean;
	lastFetched: number | null;
}

const DEFAULTS: UsageSnapshot = {
	tier: 'FREE',
	limits: {},
	usage: {},
	loaded: false,
	lastFetched: null,
};

export const usageStore = writable<UsageSnapshot>({ ...DEFAULTS });

/** Lookup a single (limit, current) pair. Returns `null` if the key is unknown. */
export function getUsageFor(key: string): { limit: number; current: number } | null {
	const s = get(usageStore);
	if (!(key in s.limits) && !(key in s.usage)) return null;
	const limit = s.limits[key] ?? 0;
	const current = s.usage[key] ?? 0;
	return { limit, current };
}

let inFlight: Promise<void> | null = null;
let timer: any = null;

async function fetchLimits(): Promise<{ tier: string; limits: Record<string, number> } | null> {
	try {
		const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/my-limits`);
		if (!res.ok) return null;
		const data = await res.json();
		const d = data?.data ?? {};
		return { tier: d.tier ?? 'FREE', limits: d.limits ?? {} };
	} catch {
		return null;
	}
}

async function fetchUsage(): Promise<Record<string, number> | null> {
	try {
		const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/usage/me`);
		if (!res.ok) return null;
		const data = await res.json();
		const d = data?.data ?? data ?? {};
		// Accept either `{ usage: {...} }` or a flat map.
		return d.usage ?? d;
	} catch {
		return null;
	}
}

/**
 * Refresh the usage cache. Concurrent callers dedupe on the in-flight
 * promise. `force=true` bypasses the loaded check.
 */
export async function loadUsage(force = false): Promise<void> {
	const current = get(usageStore);
	if (!force && current.loaded && current.lastFetched && Date.now() - current.lastFetched < REFRESH_MS) {
		return;
	}
	if (inFlight) return inFlight;
	inFlight = (async () => {
		try {
			const [limitsResp, usageResp] = await Promise.all([fetchLimits(), fetchUsage()]);
			usageStore.update((s) => ({
				tier: limitsResp?.tier ?? s.tier,
				limits: limitsResp?.limits ?? s.limits,
				usage: usageResp ?? s.usage,
				loaded: true,
				lastFetched: Date.now(),
			}));
		} catch (err) {
			console.warn('[usage.store] loadUsage failed:', (err as any)?.message);
			usageStore.update((s) => ({ ...s, loaded: true, lastFetched: Date.now() }));
		} finally {
			inFlight = null;
		}
	})();
	return inFlight;
}

/**
 * Start a background polling loop. Safe to call multiple times — only one
 * timer is ever active.
 */
export function startUsagePolling(intervalMs = REFRESH_MS): void {
	if (timer) return;
	loadUsage().catch(() => {});
	timer = setInterval(() => {
		loadUsage(true).catch(() => {});
	}, intervalMs);
}

/** Stop the polling loop. */
export function stopUsagePolling(): void {
	if (timer) clearInterval(timer);
	timer = null;
}

/** Drop the cache — used after logout. */
export function resetUsage(): void {
	stopUsagePolling();
	usageStore.set({ ...DEFAULTS });
}

/** Derived helper: all keys that are at-or-near their limit (≥ 80%). */
export const nearLimitKeys = derived(usageStore, ($s) => {
	const out: string[] = [];
	for (const [k, limit] of Object.entries($s.limits)) {
		if (limit < 0) continue; // unlimited
		const current = $s.usage[k] ?? 0;
		if (limit > 0 && current / limit >= 0.8) out.push(k);
	}
	return out;
});
