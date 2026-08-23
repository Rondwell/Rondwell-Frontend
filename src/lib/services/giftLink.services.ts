/**
 * GAP 4 — standalone gift links.
 *
 * Wraps `/api/v1/payment/gift-links` (owner) and
 * `/api/v1/payment/public/gift-links` (public).
 *
 * The public half is the product: someone posts "it's my birthday 🎉" with a
 * URL, and a friend who has never used Rondwell taps it and sends cash. Every
 * call in the public block therefore uses bare `fetch` — with a Bearer token
 * forwarded when one happens to exist, so a signed-in payer gets the gift
 * bound to their account (and the self-gifting guard can fire).
 *
 * Money never flows through the owner endpoints. Settlement is
 * `ContributionService` in the payment service, the same path wishlist gifts
 * and RSVP contributions use — which is what makes the pre-KYC receive cap,
 * AML screening and payout reserve apply here without a second implementation.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';
import { browser } from '$app/environment';

const PAYMENT_URL =
	import.meta.env.VITE_PAYMENT_API_URL ||
	import.meta.env.VITE_API_URL ||
	import.meta.env.VITE_EVENT_API_URL;

const GIFT_LINKS_API = `${PAYMENT_URL}/api/v1/payment/gift-links`;
const PUBLIC_GIFT_LINKS_API = `${PAYMENT_URL}/api/v1/payment/public/gift-links`;

export type GiftLinkOccasion =
	| 'BIRTHDAY'
	| 'WEDDING'
	| 'GRADUATION'
	| 'BABY'
	| 'THANK_YOU'
	| 'OTHER';

export interface GiftLink {
	_id: string;
	slug: string;
	title: string;
	occasion: GiftLinkOccasion;
	message?: string;
	coverImageUrl?: string;
	themeColor?: string;
	currency: string;
	targetAmountKobo?: number | null;
	raisedAmountKobo: number;
	contributionCount: number;
	suggestedAmountsKobo: number[];
	minKobo: number;
	allowAnonymous: boolean;
	showContributorWall: boolean;
	wishlistId?: string | null;
	status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
	expiresAt?: string | null;
	createdAt?: string;
}

/** What a stranger sees. Deliberately narrower than the owner shape. */
export interface PublicGiftLink {
	id: string;
	slug: string;
	title: string;
	occasion: GiftLinkOccasion;
	message: string;
	coverImageUrl: string;
	themeColor: string | null;
	ownerName: string;
	currency: string;
	targetAmountKobo: number | null;
	raisedAmountKobo: number;
	contributionCount: number;
	suggestedAmountsKobo: number[];
	minKobo: number;
	allowAnonymous: boolean;
	showContributorWall: boolean;
	wishlistId: string | null;
	status: string;
	/** False for a PAUSED, CLOSED or expired link — the page still renders. */
	acceptingGifts: boolean;
	expiresAt: string | null;
}

export const GIFT_OCCASIONS: { value: GiftLinkOccasion; label: string; emoji: string }[] = [
	{ value: 'BIRTHDAY', label: 'Birthday', emoji: '🎂' },
	{ value: 'WEDDING', label: 'Wedding', emoji: '💍' },
	{ value: 'BABY', label: 'New baby', emoji: '👶' },
	{ value: 'GRADUATION', label: 'Graduation', emoji: '🎓' },
	{ value: 'THANK_YOU', label: 'Thank you', emoji: '💐' },
	{ value: 'OTHER', label: 'Something else', emoji: '🎉' }
];

function bearer(): Record<string, string> {
	if (!browser) return {};
	const token = localStorage.getItem('auth_token');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Owner ────────────────────────────────────────────────────────────────

export async function createGiftLink(payload: {
	title: string;
	occasion?: GiftLinkOccasion;
	message?: string;
	coverImageUrl?: string;
	themeColor?: string;
	currency?: 'NGN' | 'USD';
	targetAmountKobo?: number;
	suggestedAmountsKobo?: number[];
	minKobo?: number;
	allowAnonymous?: boolean;
	showContributorWall?: boolean;
	wishlistId?: string;
	expiresAt?: string;
	slug?: string;
}): Promise<GiftLink> {
	const res = await authFetch(GIFT_LINKS_API, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwApiError(res, 'Could not create your gift link');
	const data = await res.json();
	return data.data;
}

export async function getMyGiftLinks(): Promise<GiftLink[]> {
	try {
		const res = await authFetch(`${GIFT_LINKS_API}/mine`);
		if (!res.ok) return [];
		const data = await res.json();
		return data.data ?? [];
	} catch {
		return [];
	}
}

export async function getGiftLink(id: string): Promise<GiftLink> {
	const res = await authFetch(`${GIFT_LINKS_API}/${id}`);
	if (!res.ok) await throwApiError(res, 'Gift link not found');
	const data = await res.json();
	return data.data;
}

export async function updateGiftLink(id: string, patch: Partial<GiftLink>): Promise<GiftLink> {
	const res = await authFetch(`${GIFT_LINKS_API}/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) await throwApiError(res, 'Could not update your gift link');
	const data = await res.json();
	return data.data;
}

/** Closes the link. Deliberately not a delete — the gifts are financial records. */
export async function closeGiftLink(id: string): Promise<GiftLink> {
	const res = await authFetch(`${GIFT_LINKS_API}/${id}/close`, { method: 'POST' });
	if (!res.ok) await throwApiError(res, 'Could not close your gift link');
	const data = await res.json();
	return data.data;
}

export async function getGiftLinkContributions(
	id: string,
	opts: { limit?: number; skip?: number } = {}
): Promise<{
	data: any[];
	pagination: { skip: number; limit: number; total: number };
	totals: { currency: string; gross: number; net: number; platformFee: number; count: number }[];
}> {
	const params = new URLSearchParams();
	if (opts.limit) params.set('limit', String(opts.limit));
	if (opts.skip) params.set('skip', String(opts.skip));
	const res = await authFetch(`${GIFT_LINKS_API}/${id}/contributions?${params.toString()}`);
	if (!res.ok) await throwApiError(res, 'Could not load your gifts');
	const json = await res.json();
	return {
		data: json?.data ?? [],
		pagination: json?.pagination ?? { skip: 0, limit: 50, total: 0 },
		totals: json?.totals ?? []
	};
}

// ── Public ───────────────────────────────────────────────────────────────

export async function getPublicGiftLink(slug: string): Promise<PublicGiftLink | null> {
	try {
		const res = await fetch(`${PUBLIC_GIFT_LINKS_API}/${encodeURIComponent(slug)}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.data ?? null;
	} catch {
		return null;
	}
}

/**
 * Send a gift.
 *
 * Returns the same checkout envelope every other contribution path returns,
 * so the Paystack handling is identical. Throws with `code` + `meta` intact
 * (`KYC_REQUIRED`, `GIFT_LINK_EXPIRED`, `AMOUNT_BELOW_MINIMUM`, …) so callers
 * can use `contributionErrorCopy` for a precise message.
 */
export async function contributeToGiftLink(
	slug: string,
	body: {
		amountKobo: number;
		contributorName: string;
		contributorEmail: string;
		message?: string;
		isAnonymous?: boolean;
		successCallbackUrl: string;
		failureCallbackUrl: string;
	}
): Promise<{
	status: string;
	checkoutUrl: string;
	contributionId: string;
	reference: string;
	totalAmount: number;
	currency: string;
	paystackPublicKey?: string;
	verificationToken: string;
	verificationTokenExpiresAt: number;
}> {
	const res = await fetch(`${PUBLIC_GIFT_LINKS_API}/${encodeURIComponent(slug)}/contribute`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...bearer() },
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const err = new Error(data?.message ?? 'Could not start the gift payment') as any;
		err.code = data?.code;
		err.meta = data?.meta;
		throw err;
	}
	return data;
}
