/**
 * FE-P1-11 (FA-5.4, PA-5.2) — Subscription lifecycle service.
 *
 * Wraps the payment-service subscription routes:
 *   - GET  /api/v1/payment/subscription/my-tier          — read state + lifecycle
 *   - GET  /api/v1/payment/subscription/my-limits        — plan limits
 *   - POST /api/v1/payment/subscription/cancel           — schedule cancel-at-period-end
 *   - POST /api/v1/payment/subscription/proration/preview
 *   - POST /api/v1/payment/subscription/proration/initiate (P2-04)
 *   - POST /api/v1/payment/subscription/free-trial       (P2-06)
 *
 * Idempotency: `initiateProration` accepts an `Idempotency-Key` header so a
 * mid-flight refresh re-uses the same in-flight transaction (FE-P1-09).
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';
import { getOrCreateIdempotencyKey } from '$lib/utils/idempotency';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface MyTierResponse {
	tier: 'FREE' | 'PLUS';
	feeRate: number;
	feePercent: number;
	withdrawalFeeRate: number;
	withdrawalFeeCap: number;
	subscriptionStatus: 'ACTIVE' | 'PENDING' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | null;
	billingCycle: 'MONTHLY' | 'YEARLY' | null;
	currency: 'NGN' | 'USD' | null;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
	trialEndsAt: string | null;
	firstActivatedAt: string | null;
}

export async function getMyTier(): Promise<MyTierResponse> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/my-tier`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch subscription');
	const data = await res.json();
	const d = data?.data ?? {};
	return {
		tier: d.tier ?? 'FREE',
		feeRate: d.feeRate ?? 0.06,
		feePercent: d.feePercent ?? 6,
		withdrawalFeeRate: d.withdrawalFeeRate ?? 0.03,
		withdrawalFeeCap: d.withdrawalFeeCap ?? 500,
		subscriptionStatus: d.subscriptionStatus ?? null,
		billingCycle: d.billingCycle ?? null,
		currency: d.currency ?? null,
		currentPeriodStart: d.currentPeriodStart ?? null,
		currentPeriodEnd: d.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: !!d.cancelAtPeriodEnd,
		trialEndsAt: d.trialEndsAt ?? null,
		firstActivatedAt: d.firstActivatedAt ?? null,
	};
}

export interface MyLimitsResponse {
	tier: string;
	limits: Record<string, number>;
	commissionStructure: Record<string, number>;
	features: string[];
}

export async function getMyLimits(): Promise<MyLimitsResponse> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/my-limits`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch plan limits');
	const data = await res.json();
	const d = data?.data ?? {};
	return {
		tier: d.tier ?? 'FREE',
		limits: d.limits ?? {},
		commissionStructure: d.commissionStructure ?? {},
		features: d.features ?? [],
	};
}

/**
 * Schedule cancel-at-period-end. The user keeps PLUS benefits until
 * `currentPeriodEnd`; the lifecycle cron flips them to FREE on that date.
 */
export async function cancelSubscription(): Promise<{ status: boolean; message?: string; data?: { cancelAt?: string | null } }> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/cancel`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
	if (!res.ok) await throwApiError(res, 'Failed to cancel subscription');
	return await res.json();
}

export interface ProrationPreviewBody {
	targetPlan?: 'PLUS';
	billingCycle: 'MONTHLY' | 'YEARLY';
	currency?: 'NGN' | 'USD';
}

export async function previewProration(body: ProrationPreviewBody): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/proration/preview`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) await throwApiError(res, 'Failed to preview proration');
	const data = await res.json();
	return data?.data ?? data;
}

/**
 * Kick off a paid upgrade. Sends a stable `Idempotency-Key` derived from the
 * user's intent so a flaky network can't double-charge.
 */
export async function initiateProration(body: ProrationPreviewBody): Promise<any> {
	const scope = `subscription:${body.targetPlan ?? 'PLUS'}:${body.billingCycle}:${body.currency ?? 'NGN'}`;
	const idempotencyKey = getOrCreateIdempotencyKey(scope);
	const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/proration/initiate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Idempotency-Key': idempotencyKey,
			'x-idempotency-key': idempotencyKey,
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) await throwApiError(res, 'Failed to start upgrade');
	return await res.json();
}

export interface ApplyFreeTrialBody {
	billingCycle: 'MONTHLY' | 'YEARLY';
	currency?: 'NGN' | 'USD';
}

export async function applyFreeTrial(body: ApplyFreeTrialBody): Promise<any> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/subscription/free-trial`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) await throwApiError(res, 'Failed to start free trial');
	return await res.json();
}
