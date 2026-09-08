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

// ── Cover image ─────────────────────────────────────────────────

/**
 * The cover image is the share card.
 *
 * A gift link's whole job is to be posted in a group chat, and the preview
 * WhatsApp renders decides whether anyone taps it. So the upload happens in
 * the wizard, BEFORE the link exists: the server stores the object as a
 * transient draft and only makes it permanent once a create or update attaches
 * it. Anything the user picks and then abandons is swept by an S3 lifecycle
 * rule, so a closed tab costs nothing.
 */

/** Longest edge of the stored image, in pixels. */
const COVER_MAX_EDGE = 1600;
/** JPEG quality for the re-encode. */
const COVER_QUALITY = 0.86;
/** Anything at or under this is uploaded untouched. */
const COVER_SKIP_RESIZE_BYTES = 400 * 1024;

/**
 * Downscale and re-encode in the browser before uploading.
 *
 * Phone cameras produce 4-12 MB images and the server caps uploads at 5 MB, so
 * without this a perfectly ordinary photo is simply rejected. Re-encoding also
 * strips EXIF — including GPS coordinates, which people do not expect to
 * publish alongside a birthday photo.
 *
 * Falls back to the original bytes if anything goes wrong: a failed resize must
 * not become a failed upload.
 */
async function prepareCoverImage(file: File): Promise<string> {
	const asDataUrl = () =>
		new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error('Could not read that image file.'));
			reader.readAsDataURL(file);
		});

	// GIFs are left alone — drawing one to a canvas keeps only the first frame,
	// which silently turns an animation into a still.
	if (file.type === 'image/gif' || file.size <= COVER_SKIP_RESIZE_BYTES) {
		return asDataUrl();
	}

	try {
		const source = await asDataUrl();
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(new Error('decode failed'));
			el.src = source;
		});

		const scale = Math.min(1, COVER_MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
		const width = Math.max(1, Math.round(img.naturalWidth * scale));
		const height = Math.max(1, Math.round(img.naturalHeight * scale));

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return source;

		// A white ground, so a transparent PNG does not turn black once it is
		// flattened into a JPEG.
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, width, height);
		ctx.drawImage(img, 0, 0, width, height);

		const out = canvas.toDataURL('image/jpeg', COVER_QUALITY);
		// Only keep the re-encode when it actually helped.
		return out.length < source.length ? out : source;
	} catch {
		return asDataUrl();
	}
}

/**
 * Upload a cover image and return its public URL.
 *
 * The returned URL is a transient draft until a create or update saves it onto
 * a link.
 */
export async function uploadGiftCoverImage(file: File): Promise<string> {
	if (!file.type.startsWith('image/')) {
		throw new Error('Please choose an image file.');
	}
	const data = await prepareCoverImage(file);
	const res = await authFetch(`${GIFT_LINKS_API}/cover`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ data })
	});
	if (!res.ok) await throwApiError(res, 'Could not upload that image');
	const json = await res.json();
	return json?.data?.url ?? '';
}

/**
 * Discard a draft cover the user replaced or cancelled.
 *
 * Never throws. It is called from cleanup paths where an error would surface a
 * failure for something the user did not ask for, and the server-side
 * lifecycle rule collects anything this misses.
 */
export async function discardGiftCoverImage(url: string): Promise<void> {
	if (!url) return;
	try {
		await authFetch(`${GIFT_LINKS_API}/cover`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url })
		});
	} catch {
		/* ignore — the lifecycle rule expires abandoned drafts */
	}
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
