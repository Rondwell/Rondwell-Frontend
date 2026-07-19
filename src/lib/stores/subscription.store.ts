/**
 * FE-P1-11 (FA-5.4, PA-5.2) — Subscription store.
 *
 * Single source of truth for the user's tier + billing cycle + lifecycle
 * state. Every protected feature page (FE-P3-01) reads from here instead
 * of duplicating the `/api/v1/payment/subscription/my-tier` call.
 *
 * Backend reference:
 *   - `services/payment/src/api/controllers/subscription.controller.ts:getMyTier`
 *   - `services/payment/src/models/subscription.ts` (SubscriptionStatus enum)
 *
 * The store is hydrated on demand via `loadSubscription()`. Callers should
 * call `loadSubscription()` after login and after any subscription mutation
 * (cancel, upgrade, trial start) to refresh the cache.
 */

import { writable, derived, get } from 'svelte/store';
import { getMyTier as fetchMyTier } from '$lib/services/subscription.services';

export type SubscriptionTier = 'FREE' | 'PLUS';
export type SubscriptionStatus =
	| 'ACTIVE'
	| 'PENDING'
	| 'PAST_DUE'
	| 'CANCELED'
	| 'TRIALING'
	| null;
export type BillingCycle = 'MONTHLY' | 'YEARLY' | null;
export type SubscriptionCurrency = 'NGN' | 'USD' | null;

export interface SubscriptionSnapshot {
	tier: SubscriptionTier;
	feeRate: number;
	feePercent: number;
	withdrawalFeeRate: number;
	withdrawalFeeCap: number;
	subscriptionStatus: SubscriptionStatus;
	billingCycle: BillingCycle;
	currency: SubscriptionCurrency;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
	trialEndsAt: string | null;
	firstActivatedAt: string | null;
	/** True when PLUS is a complimentary admin grant (not a paid subscription). */
	isComp: boolean;
	loaded: boolean;
}

export const SUBSCRIPTION_DEFAULTS: SubscriptionSnapshot = {
	tier: 'FREE',
	feeRate: 0.04,
	feePercent: 4,
	withdrawalFeeRate: 0.03,
	withdrawalFeeCap: 500,
	subscriptionStatus: null,
	billingCycle: null,
	currency: null,
	currentPeriodStart: null,
	currentPeriodEnd: null,
	cancelAtPeriodEnd: false,
	trialEndsAt: null,
	firstActivatedAt: null,
	isComp: false,
	loaded: false,
};

export const subscriptionStore = writable<SubscriptionSnapshot>({ ...SUBSCRIPTION_DEFAULTS });

/** Convenience derivations the UI uses directly. */
export const isPlusUser = derived(subscriptionStore, ($s) => $s.tier === 'PLUS');
export const isPastDue = derived(subscriptionStore, ($s) => $s.subscriptionStatus === 'PAST_DUE');
export const isTrialing = derived(subscriptionStore, ($s) => $s.subscriptionStatus === 'TRIALING');
/** Complimentary admin grant — free PLUS the user can't cancel/resume themselves. */
export const isComp = derived(subscriptionStore, ($s) => $s.isComp === true);
/**
 * A user-scheduled cancellation (cancel-at-period-end). Deliberately EXCLUDES
 * comps: a comp also carries `cancelAtPeriodEnd`, but the user didn't cancel it
 * and there's nothing to "resume", so it must not trigger the resume CTA.
 */
export const isCanceledScheduled = derived(
	subscriptionStore,
	($s) => $s.cancelAtPeriodEnd && $s.subscriptionStatus === 'ACTIVE' && !$s.isComp
);

/** Days until `currentPeriodEnd`. Returns `null` for FREE / never-activated users. */
export const daysUntilRenewal = derived(subscriptionStore, ($s) => {
	if (!$s.currentPeriodEnd) return null;
	const ms = new Date($s.currentPeriodEnd).getTime() - Date.now();
	if (!Number.isFinite(ms) || ms < 0) return 0;
	return Math.ceil(ms / 86_400_000);
});

let inFlight: Promise<void> | null = null;

/**
 * Load (or refresh) the cached subscription snapshot. Concurrent callers
 * dedupe on the same in-flight promise so a settings page that mounts
 * Wallet + Subscription tabs in parallel only hits the server once.
 */
export async function loadSubscription(force = false): Promise<void> {
	const current = get(subscriptionStore);
	if (!force && current.loaded) return;
	if (inFlight) return inFlight;
	inFlight = (async () => {
		try {
			const data = await fetchMyTier();
			subscriptionStore.set({
				...SUBSCRIPTION_DEFAULTS,
				...data,
				loaded: true,
			});
		} catch (err) {
			console.warn('[subscription.store] loadSubscription failed:', (err as any)?.message);
			subscriptionStore.set({ ...SUBSCRIPTION_DEFAULTS, loaded: true });
		} finally {
			inFlight = null;
		}
	})();
	return inFlight;
}

/** Drop the cache — used after logout. */
export function resetSubscription(): void {
	subscriptionStore.set({ ...SUBSCRIPTION_DEFAULTS });
}
