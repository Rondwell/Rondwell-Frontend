/**
 * GAP 9 — promoter mode.
 *
 * Wraps `/api/v1/events/:eventId/promoters` (event service) and
 * `/api/v1/payment/promoters/payouts` (payment service).
 *
 * The split across two services is deliberate. The EVENT service owns
 * attribution and decides what is payable; the PAYMENT service moves the
 * money. That is why "pay commissions" is a two-step call: transfer first,
 * then mark the attributions PAID with the returned transaction id. A crash
 * between the two leaves them ELIGIBLE — payable again, which is recoverable.
 * The reverse order would lose the money.
 *
 * `commissionPercent` is BASIS POINTS everywhere on the wire (1000 = 10%).
 * Convert for display only, never for storage.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';
import { browser } from '$app/environment';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;
const PAYMENT_URL =
	import.meta.env.VITE_PAYMENT_API_URL ||
	import.meta.env.VITE_API_URL ||
	import.meta.env.VITE_EVENT_API_URL;

export type PromoterStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Promoter {
	_id: string;
	eventId: string;
	userId: string;
	name: string;
	email: string;
	refCode: string;
	status: PromoterStatus;
	/** BASIS POINTS. Divide by 100 for a percentage. */
	commissionPercent: number;
	appliedAt: string;
	approvedAt?: string;
	note?: string;
	totals: {
		clicks: number;
		registrations: number;
		ticketsSold: number;
		grossAttributedKobo: number;
		commissionEarnedKobo: number;
		commissionPaidKobo: number;
	};
}

export interface PromoterAttribution {
	_id: string;
	refCode: string;
	registrationId?: string;
	attendeeEmail?: string;
	stage: 'CLICK' | 'REGISTERED' | 'PAID';
	grossKobo: number;
	commissionKobo: number;
	currency: string;
	/** PENDING = refund window still open. Only ELIGIBLE rows are payable. */
	payoutStatus: 'PENDING' | 'ELIGIBLE' | 'PAID' | 'REVERSED';
	eligibleFrom?: string;
	paidAt?: string;
	attributedAt: string;
}

export interface EligiblePayout {
	promoterId: string;
	promoterUserId: string;
	promoterName: string;
	promoterEmail: string;
	amountKobo: number;
	currency: string;
	attributionIds: string[];
	count: number;
}

function api(eventId: string) {
	return `${EVENT_URL}/api/v1/events/${eventId}/promoters`;
}

/** Basis points → a human percentage string. 1000 → "10%". */
export function bpsToPercentLabel(bps: number): string {
	const pct = (bps ?? 0) / 100;
	return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

// ── Applicant ────────────────────────────────────────────────────────────

export async function applyToPromote(eventId: string, note?: string): Promise<Promoter> {
	const res = await authFetch(`${api(eventId)}/apply`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ note })
	});
	if (!res.ok) await throwApiError(res, 'Could not submit your application');
	const data = await res.json();
	return data.promoter;
}

/** `null` when the caller hasn't applied — the page shows a "become a promoter" CTA. */
export async function getMyPromoterRecord(
	eventId: string
): Promise<{ promoter: Promoter | null; attributions: PromoterAttribution[] }> {
	try {
		const res = await authFetch(`${api(eventId)}/me`);
		if (!res.ok) return { promoter: null, attributions: [] };
		const data = await res.json();
		return { promoter: data.promoter ?? null, attributions: data.attributions ?? [] };
	} catch {
		return { promoter: null, attributions: [] };
	}
}

/**
 * Fire-and-forget click beacon.
 *
 * Never awaited by a page render and never surfaces an error: a lost click is
 * a lost stat, not a broken page. `keepalive` so it survives the navigation
 * that usually follows immediately.
 */
export function trackPromoterClick(eventId: string, refCode: string): void {
	if (!browser) return;
	try {
		fetch(`${api(eventId)}/public/track/${encodeURIComponent(refCode)}`, {
			method: 'POST',
			keepalive: true
		}).catch(() => {});
	} catch {
		/* ignore */
	}
}

// ── Organizer ────────────────────────────────────────────────────────────

export async function getPromoters(
	eventId: string,
	opts: { status?: PromoterStatus; limit?: number; skip?: number } = {}
): Promise<{ data: Promoter[]; pagination: { skip: number; limit: number; total: number } }> {
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries(opts)) {
		// `String(v)` rather than a `v !== ''` guard: the values here are a
		// status string or a number, and comparing a number to '' is a
		// comparison TypeScript is right to reject. An empty string after
		// stringifying is the only case actually worth skipping.
		if (v === undefined || v === null) continue;
		const s = String(v);
		if (s !== '') params.set(k, s);
	}
	try {
		const res = await authFetch(`${api(eventId)}?${params.toString()}`);
		if (!res.ok) return { data: [], pagination: { skip: 0, limit: 0, total: 0 } };
		const json = await res.json();
		return {
			data: json?.data ?? [],
			pagination: json?.pagination ?? { skip: 0, limit: 0, total: 0 }
		};
	} catch {
		return { data: [], pagination: { skip: 0, limit: 0, total: 0 } };
	}
}

export async function updatePromoter(
	eventId: string,
	promoterId: string,
	patch: { status?: PromoterStatus; commissionPercent?: number }
): Promise<Promoter> {
	const res = await authFetch(`${api(eventId)}/${promoterId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) await throwApiError(res, 'Could not update the promoter');
	const data = await res.json();
	return data.promoter;
}

export async function getPromoterAttributions(
	eventId: string,
	promoterId: string
): Promise<PromoterAttribution[]> {
	try {
		const res = await authFetch(`${api(eventId)}/${promoterId}/attributions`);
		if (!res.ok) return [];
		const data = await res.json();
		return data.attributions ?? [];
	} catch {
		return [];
	}
}

/** What is owed right now, split PENDING (refund window open) / ELIGIBLE / PAID. */
export async function getPromoterPayoutSummary(eventId: string): Promise<{
	currency: string;
	pendingKobo: number;
	eligibleKobo: number;
	paidKobo: number;
	eligibleCount: number;
	pendingCount: number;
} | null> {
	try {
		const res = await authFetch(`${api(eventId)}/payouts/summary`);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

/** Exactly what a "Pay commissions" click would transfer, and to whom. */
export async function getEligiblePayouts(eventId: string): Promise<EligiblePayout[]> {
	try {
		const res = await authFetch(`${api(eventId)}/payouts/eligible`);
		if (!res.ok) return [];
		const data = await res.json();
		return data.payouts ?? [];
	} catch {
		return [];
	}
}

/**
 * Pay eligible commissions.
 *
 * Throws with `code` + `meta` intact so `INSUFFICIENT_FUNDS` can show the
 * actual shortfall — including how much of the balance is held in the payout
 * reserve, which is otherwise a confusing "but I can see the money" moment.
 */
export async function payPromoterCommissions(
	eventId: string,
	payouts: EligiblePayout[],
	currency = 'NGN'
): Promise<{ paidCount: number; failed: Array<{ promoterId: string; reason: string }> }> {
	const token = browser ? localStorage.getItem('auth_token') : null;

	const res = await fetch(`${PAYMENT_URL}/api/v1/payment/promoters/payouts`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {})
		},
		body: JSON.stringify({
			eventId,
			currency,
			payouts: payouts.map((p) => ({
				promoterId: p.promoterId,
				promoterUserId: p.promoterUserId,
				promoterName: p.promoterName,
				promoterEmail: p.promoterEmail,
				amountKobo: p.amountKobo,
				attributionIds: p.attributionIds
			}))
		})
	});

	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const err = new Error(data?.message ?? 'Could not pay the commissions') as any;
		err.code = data?.code;
		err.meta = data?.meta;
		throw err;
	}

	// Mark paid AFTER the transfer committed — see the file docs for why the
	// order matters. Best-effort per promoter so one failure doesn't strand
	// the rest of the batch.
	await Promise.all(
		(data.paid ?? []).map((p: any) =>
			authFetch(`${api(eventId)}/payouts/mark-paid`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					attributionIds: p.attributionIds,
					transactionId: p.transactionId
				})
			}).catch(() => {})
		)
	);

	return { paidCount: (data.paid ?? []).length, failed: data.failed ?? [] };
}
