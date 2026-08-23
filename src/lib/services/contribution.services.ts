/**
 * Celebration layer — non-ticket money-in (gifts & guest contributions).
 *
 * Wraps `/api/v1/payment/contributions`. Three product surfaces ride these
 * same endpoints, which is the whole point of the shared `EventContribution`
 * model:
 *
 *   - RSVP guest contributions   (`kind: 'RSVP_CONTRIBUTION'`, needs `eventId`)
 *   - Gift-registry cash items   (`kind: 'WISHLIST'`,          needs `wishlistItemId`)
 *   - Standalone gift links      (`kind: 'GIFT_LINK'`,         needs `giftLinkId`)
 *
 * Trust contract — mirrors the ticket path:
 *   - `initiate` is PUBLIC (a gift-giver is usually not a Rondwell user), so
 *     it uses bare `fetch`, but forwards a Bearer token when one exists so a
 *     signed-in payer gets the gift bound to their account.
 *   - The AMOUNT is genuinely payer-chosen — unlike a ticket price. It is
 *     therefore CLAMPED server-side against RPC-resolved bounds, at initiate
 *     and again at settlement. The recipient, currency and bounds are never
 *     sent from here.
 *   - `verify-and-settle` requires the HMAC `verificationToken` returned by
 *     `initiate`, forwarded as `x-verification-token`.
 *
 * All amounts are integer minor units (kobo / cents). Use
 * `majorToKobo` from `$lib/utils/money` to convert user input.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';
import { browser } from '$app/environment';

const PAYMENT_URL =
	import.meta.env.VITE_PAYMENT_API_URL ||
	import.meta.env.VITE_API_URL ||
	import.meta.env.VITE_EVENT_API_URL;

const CONTRIBUTIONS_API = `${PAYMENT_URL}/api/v1/payment/contributions`;

export type ContributionKind = 'WISHLIST' | 'RSVP_CONTRIBUTION' | 'GIFT_LINK';
export type ContributionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface InitiateContributionBody {
	kind: ContributionKind;
	/** WISHLIST only. */
	wishlistItemId?: string;
	/** RSVP_CONTRIBUTION only. */
	eventId?: string;
	/** RSVP_CONTRIBUTION only — links the gift to the guest's registration. */
	registrationId?: string;
	/** GIFT_LINK only. */
	giftLinkId?: string;
	/** Integer minor units. Clamped server-side; never trusted as-is. */
	amountKobo: number;
	contributorName: string;
	contributorEmail: string;
	isAnonymous?: boolean;
	message?: string;
	successCallbackUrl: string;
	failureCallbackUrl: string;
}

export interface InitiateContributionResponse {
	status: string;
	checkoutUrl: string;
	contributionId: string;
	reference: string;
	totalAmount: number;
	currency: string;
	paystackPublicKey?: string;
	verificationToken: string;
	verificationTokenExpiresAt: number;
}

export interface ContributionRow {
	_id: string;
	kind: ContributionKind;
	eventId?: string;
	giftLinkId?: string;
	wishlistItemId?: string;
	registrationId?: string;
	contributorName: string;
	contributorEmail: string;
	isAnonymous: boolean;
	message?: string;
	amountKobo: number;
	currency: string;
	platformFeeKobo: number;
	netKobo: number;
	status: ContributionStatus;
	paidAt?: string;
	thankYouSentAt?: string;
	createdAt?: string;
	metaData?: Record<string, any>;
}

export interface ContributionRollupRow {
	kind: ContributionKind;
	gross: number;
	platformFee: number;
	net: number;
	count: number;
}

/**
 * A structured contribution error.
 *
 * The service returns a machine-readable `code` (`AMOUNT_BELOW_MINIMUM`,
 * `CONTRIBUTIONS_DISABLED`, `KYC_REQUIRED`, `ITEM_FULLY_FUNDED`, …) plus
 * `meta` carrying the actual bound. The UI needs those to say "the minimum is
 * ₦500" instead of a generic failure, so we surface them rather than
 * flattening everything to a message string.
 */
export class ContributionError extends Error {
	code?: string;
	meta?: Record<string, any>;
	statusCode?: number;
	constructor(message: string, code?: string, meta?: Record<string, any>, statusCode?: number) {
		super(message);
		this.name = 'ContributionError';
		this.code = code;
		this.meta = meta;
		this.statusCode = statusCode;
	}
}

function bearer(): Record<string, string> {
	if (!browser) return {};
	const token = localStorage.getItem('auth_token');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Start a contribution checkout. PUBLIC — works for signed-out guests.
 *
 * Throws `ContributionError` carrying `code` + `meta` so the caller can
 * render the specific reason (below minimum, registry closed, KYC cap hit).
 */
export async function initiateContribution(
	body: InitiateContributionBody
): Promise<InitiateContributionResponse> {
	const res = await fetch(`${CONTRIBUTIONS_API}/initiate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...bearer() },
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new ContributionError(
			data?.message ?? 'Could not start the contribution',
			data?.code,
			data?.meta,
			res.status
		);
	}
	return data as InitiateContributionResponse;
}

/**
 * Settle from the Paystack inline callback.
 *
 * The webhook is the canonical settlement path and is fully idempotent — this
 * only exists so the payer sees "thank you" immediately instead of waiting on
 * Paystack's retry cadence. A failure here is therefore NOT a payment failure.
 */
export async function verifyAndSettleContribution(
	reference: string,
	verificationToken: string
): Promise<{ status: boolean; message?: string }> {
	const res = await fetch(`${CONTRIBUTIONS_API}/verify-and-settle/${reference}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(verificationToken ? { 'x-verification-token': verificationToken } : {}),
			...bearer()
		}
	});
	const data = await res.json().catch(() => ({}));
	return { status: res.ok, message: data?.message };
}

/** Organizer feed for one event, with a per-source rollup. */
export async function getEventContributions(
	eventId: string,
	opts: {
		limit?: number;
		skip?: number;
		kind?: ContributionKind;
		status?: ContributionStatus;
		registrationId?: string;
	} = {}
): Promise<{
	data: ContributionRow[];
	pagination: { skip: number; limit: number; total: number };
	rollup: ContributionRollupRow[];
}> {
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries(opts)) {
		if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
	}
	const res = await authFetch(`${CONTRIBUTIONS_API}/event/${eventId}?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load contributions');
	const json = await res.json();
	return {
		data: json?.data ?? [],
		pagination: json?.pagination ?? { skip: 0, limit: 50, total: 0 },
		rollup: json?.rollup ?? []
	};
}

/** Every gift the signed-in user has RECEIVED, across events and gift links. */
export async function getMyReceivedContributions(
	opts: { limit?: number; skip?: number } = {}
): Promise<{
	data: ContributionRow[];
	pagination: { skip: number; limit: number; total: number };
	totals: { currency: string; gross: number; net: number; count: number }[];
}> {
	const params = new URLSearchParams();
	if (opts.limit) params.set('limit', String(opts.limit));
	if (opts.skip) params.set('skip', String(opts.skip));
	const res = await authFetch(`${CONTRIBUTIONS_API}/mine?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Failed to load received gifts');
	const json = await res.json();
	return {
		data: json?.data ?? [],
		pagination: json?.pagination ?? { skip: 0, limit: 50, total: 0 },
		totals: json?.totals ?? []
	};
}

/**
 * The PUBLIC contributor wall.
 *
 * Amounts-per-person are deliberately absent from the response — only names
 * (or "Anonymous"), messages and the aggregate raised total are public.
 */
export async function getContributorWall(
	scopeType: 'EVENT' | 'GIFT_LINK' | 'WISHLIST_ITEM',
	scopeId: string,
	limit = 50
): Promise<{
	data: { name: string; message: string | null; at: string }[];
	summary: { contributorCount: number; raisedKobo: number };
}> {
	try {
		const res = await fetch(
			`${CONTRIBUTIONS_API}/public/wall/${scopeType}/${scopeId}?limit=${limit}`
		);
		if (!res.ok) return { data: [], summary: { contributorCount: 0, raisedKobo: 0 } };
		const json = await res.json();
		return {
			data: json?.data ?? [],
			summary: json?.summary ?? { contributorCount: 0, raisedKobo: 0 }
		};
	} catch {
		// The wall is decoration on an otherwise-working page — never let it
		// break the render.
		return { data: [], summary: { contributorCount: 0, raisedKobo: 0 } };
	}
}

/** Idempotent — already-thanked contributors are skipped server-side. */
export async function sendThankYou(
	contributionIds: string[],
	message?: string
): Promise<{ sent: number }> {
	const res = await authFetch(`${CONTRIBUTIONS_API}/thank-you`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ contributionIds, message })
	});
	if (!res.ok) await throwApiError(res, 'Failed to send thank-you');
	const json = await res.json();
	return { sent: json?.data?.sent ?? 0 };
}

/** The caller's gifting commission rate, so the UI can show "Gift fee (N%)". */
export async function getGiftingFeeRate(
	currency: 'NGN' | 'USD' = 'NGN'
): Promise<{ feeRate: number; feePercent: number; currency: string }> {
	try {
		const res = await authFetch(`${CONTRIBUTIONS_API}/fee-rate?currency=${currency}`);
		if (!res.ok) return { feeRate: 0, feePercent: 0, currency };
		const json = await res.json();
		return json?.data ?? { feeRate: 0, feePercent: 0, currency };
	} catch {
		return { feeRate: 0, feePercent: 0, currency };
	}
}

/**
 * Human copy for a contribution error code.
 *
 * Kept next to the service (not in each component) so the RSVP modal, the
 * registry page and the gift-link page all say the same thing about the same
 * failure.
 */
export function contributionErrorCopy(err: unknown, fallback = 'Could not process the gift.'): string {
	if (!(err instanceof ContributionError)) {
		return (err as any)?.message ?? fallback;
	}
	switch (err.code) {
		case 'AMOUNT_BELOW_MINIMUM':
		case 'AMOUNT_ABOVE_MAXIMUM':
		case 'SELF_CONTRIBUTION_FORBIDDEN':
			return err.message;
		case 'CONTRIBUTIONS_DISABLED':
			return 'This event is no longer accepting contributions.';
		case 'EVENT_CLOSED':
			return 'This event has closed.';
		case 'REGISTRY_CLOSED':
			return 'This gift registry is closed.';
		case 'ITEM_FULLY_FUNDED':
		case 'ITEM_FULFILLED':
			return 'This gift has already been fully funded. Try another one!';
		case 'ITEM_ALREADY_FUNDED':
			return 'Someone has already claimed this gift.';
		case 'ITEM_NOT_FUNDABLE':
			return 'This item is not a cash gift — claim it instead.';
		case 'GIFT_LINK_INACTIVE':
			return 'This gift link is no longer active.';
		case 'GIFT_LINK_EXPIRED':
			return 'This gift link has expired.';
		case 'KYC_REQUIRED':
			return 'This link has reached its limit until the recipient verifies their identity.';
		default:
			return err.message || fallback;
	}
}
