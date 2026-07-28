/**
 * FE-P5-03 (NEW-11.1) — Organizer payout reserve client.
 *
 * Wraps `GET /api/v1/payment/payout-reserve/me`.
 *
 * ── Why the organizer needs this ─────────────────────────────────────────
 *
 * The rolling reserve deliberately makes an organizer's withdrawable balance
 * LOWER than their earnings: a percentage of each ticket sale is held until
 * shortly after the event ends, because Rondwell is the merchant of record and
 * Paystack takes refunds and lost chargebacks out of the platform's balance.
 *
 * If we don't explain that, the organizer's only signal is a rejected withdrawal
 * at the last step — which turns a sensible risk control into a support ticket
 * and a trust problem. This endpoint gives the wallet UI the numbers and dates it
 * needs to say, plainly: "₦120,000 held — releases 3 days after Lagos Tech Fest
 * ends (12 Aug)".
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface PayoutReservePolicy {
	mode: 'ROLLING' | 'INSTANT';
	riskTier: 'TRUSTED' | 'STANDARD' | 'ELEVATED';
	reservePercent: number;
	reservePercentBps: number;
	releaseDelayDays: number;
	/** Server-authored plain-language explanation, so copy stays consistent. */
	explanation: string;
}

export interface PayoutReserveHeld {
	currency: string;
	heldKobo: number;
	held: number;
	holdCount: number;
	nextReleaseAt: string | null;
}

export interface PayoutReserveScheduleItem {
	holdId: string;
	eventId: string;
	eventTitle: string | null;
	currency: string;
	heldKobo: number;
	held: number;
	releaseDueAt: string;
	/**
	 * The event's end date couldn't be resolved when the sale settled, so this
	 * release date is provisional and may move once it can be.
	 */
	isProvisionalDate: boolean;
}

export interface PayoutReserveSummary {
	policy: PayoutReservePolicy;
	held: PayoutReserveHeld[];
	schedule: PayoutReserveScheduleItem[];
}

export async function getMyPayoutReserve(): Promise<PayoutReserveSummary> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/payout-reserve/me`);
	if (!res.ok) await throwApiError(res, 'Failed to load payout reserve');
	const data = await res.json();
	const d = data.data ?? data ?? {};
	return {
		policy: d.policy ?? {
			mode: 'ROLLING',
			riskTier: 'STANDARD',
			reservePercent: 20,
			reservePercentBps: 2000,
			releaseDelayDays: 3,
			explanation: ''
		},
		held: d.held ?? [],
		schedule: d.schedule ?? []
	};
}
