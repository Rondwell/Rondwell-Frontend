/**
 * GAP 3 — Gift registry / wishlist.
 *
 * Wraps `/api/v1/products/wishlists`. Three surfaces use it:
 *   - the organizer's `events/[id]/gifts` tab (authenticated)
 *   - the public event page's Gifts tab (unauthenticated)
 *   - the standalone `/w/[slug]` registry page (unauthenticated)
 *
 * Two rules worth knowing before you call anything here:
 *
 *   1. **Cash items are funded, not claimed.** A CASH / EXPERIENCE item goes
 *      through `contribution.services.initiateContribution({ kind: 'WISHLIST' })`.
 *      Only PHYSICAL / EXTERNAL_LINK items use `claimItem` below.
 *
 *   2. **The `claimToken` is returned exactly once**, by `claimItem`. It is a
 *      guest's only credential for managing their claim, so persist it
 *      (the confirmation email also carries it) — there is no lookup route
 *      that will re-issue it.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';
import { browser } from '$app/environment';

const BASE_URL = import.meta.env.VITE_API_URL;
const WISHLIST_API = `${BASE_URL}/api/v1/products/wishlists`;

export type WishlistItemType = 'PHYSICAL' | 'CASH' | 'EXPERIENCE' | 'EXTERNAL_LINK';
export type WishlistItemStatus = 'OPEN' | 'PARTIALLY_CLAIMED' | 'FULFILLED' | 'ARCHIVED';

export interface WishlistItem {
	id?: string;
	_id?: string;
	title: string;
	description?: string;
	imageUrl?: string;
	type: WishlistItemType;
	externalUrl?: string;
	priority: 'MUST_HAVE' | 'NICE_TO_HAVE';
	status: WishlistItemStatus;
	currency: string;
	targetAmountKobo?: number | null;
	raisedAmountKobo: number;
	remainingKobo?: number | null;
	quantityWanted: number;
	quantityClaimed: number;
	allowGroupGifting: boolean;
	sortOrder?: number;
}

export interface Wishlist {
	_id?: string;
	id?: string;
	ownerUserId?: string;
	scopeType: 'EVENT' | 'GIFT_LINK' | 'STANDALONE';
	eventId?: string | null;
	title: string;
	description?: string;
	coverImageUrl?: string;
	currency: 'NGN' | 'USD';
	slug: string;
	hideClaimersFromHost: boolean;
	thankYouMessage?: string;
	status: 'DRAFT' | 'OPEN' | 'CLOSED';
	closesAt?: string | null;
	isPublic: boolean;
	totals: { itemCount: number; fulfilledCount: number; raisedAmountKobo: number };
	items?: WishlistItem[];
}

export interface PublicWishlistView {
	registry: {
		id: string;
		slug: string;
		title: string;
		description: string;
		coverImageUrl: string;
		currency: string;
		scopeType: string;
		eventId: string | null;
		status: string;
		closesAt: string | null;
		isOpen: boolean;
		totals: { itemCount: number; fulfilledCount: number; raisedAmountKobo: number };
		/** Told to guests deliberately — it changes whether they claim at all. */
		surprisePreserved: boolean;
	};
	items: WishlistItem[];
}

function bearer(): Record<string, string> {
	if (!browser) return {};
	const token = localStorage.getItem('auth_token');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Owner ────────────────────────────────────────────────────────────────

export async function createWishlist(payload: {
	title: string;
	eventId?: string;
	giftLinkId?: string;
	scopeType?: 'EVENT' | 'GIFT_LINK' | 'STANDALONE';
	description?: string;
	coverImageUrl?: string;
	currency?: 'NGN' | 'USD';
	hideClaimersFromHost?: boolean;
	closesAt?: string;
	isPublic?: boolean;
}): Promise<Wishlist> {
	const res = await authFetch(WISHLIST_API, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwApiError(res, 'Failed to create registry');
	const data = await res.json();
	return data.data;
}

/**
 * The registry for one event, with its items.
 *
 * Returns `null` (not an error) when the event has no registry yet — the
 * organizer UI renders an empty state and a create CTA, and treating that as
 * a failure would show an error banner on a perfectly normal event.
 */
export async function getEventWishlist(eventId: string): Promise<Wishlist | null> {
	try {
		const res = await authFetch(`${WISHLIST_API}/event/${eventId}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.data ?? null;
	} catch {
		return null;
	}
}

export async function getMyWishlists(): Promise<Wishlist[]> {
	try {
		const res = await authFetch(`${WISHLIST_API}/mine`);
		if (!res.ok) return [];
		const data = await res.json();
		return data.data ?? [];
	} catch {
		return [];
	}
}

export async function updateWishlist(
	wishlistId: string,
	patch: Partial<Wishlist>
): Promise<Wishlist> {
	const res = await authFetch(`${WISHLIST_API}/${wishlistId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) await throwApiError(res, 'Failed to update registry');
	const data = await res.json();
	return data.data;
}

export async function addWishlistItem(
	wishlistId: string,
	item: Partial<WishlistItem> & { title: string }
): Promise<WishlistItem> {
	const res = await authFetch(`${WISHLIST_API}/${wishlistId}/items`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(item)
	});
	if (!res.ok) await throwApiError(res, 'Failed to add gift');
	const data = await res.json();
	return data.data;
}

export async function updateWishlistItem(
	wishlistId: string,
	itemId: string,
	patch: Partial<WishlistItem>
): Promise<WishlistItem> {
	const res = await authFetch(`${WISHLIST_API}/${wishlistId}/items/${itemId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) await throwApiError(res, 'Failed to update gift');
	const data = await res.json();
	return data.data;
}

export async function deleteWishlistItem(wishlistId: string, itemId: string): Promise<void> {
	const res = await authFetch(`${WISHLIST_API}/${wishlistId}/items/${itemId}`, {
		method: 'DELETE'
	});
	// A 409 here means the gift already has claims or contributions — the
	// server refuses to delete it so the history isn't stranded. The caller
	// surfaces that message and offers "archive" instead.
	if (!res.ok) await throwApiError(res, 'Failed to remove gift');
}

export async function reorderWishlistItems(
	wishlistId: string,
	orderedIds: string[]
): Promise<void> {
	const res = await authFetch(`${WISHLIST_API}/${wishlistId}/items/reorder`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ orderedIds })
	});
	if (!res.ok) await throwApiError(res, 'Failed to save order');
}

/**
 * Claims on the registry, for the host.
 *
 * `hideClaimersFromHost` comes back with the rows so the UI can say
 * "Hidden to keep the surprise" instead of rendering blank names that look
 * like a bug.
 */
export async function getWishlistClaims(wishlistId: string): Promise<{
	hideClaimersFromHost: boolean;
	claims: Array<{
		id: string;
		wishlistItemId: string;
		quantity: number;
		status: string;
		createdAt: string;
		expiresAt: string;
		claimerName?: string;
		claimerEmail?: string;
		note?: string;
	}>;
}> {
	try {
		const res = await authFetch(`${WISHLIST_API}/${wishlistId}/claims`);
		if (!res.ok) return { hideClaimersFromHost: true, claims: [] };
		const data = await res.json();
		return { hideClaimersFromHost: data.hideClaimersFromHost !== false, claims: data.claims ?? [] };
	} catch {
		return { hideClaimersFromHost: true, claims: [] };
	}
}

// ── Public ───────────────────────────────────────────────────────────────

export async function getPublicWishlistBySlug(slug: string): Promise<PublicWishlistView | null> {
	const res = await fetch(`${WISHLIST_API}/public/${encodeURIComponent(slug)}`);
	if (!res.ok) return null;
	const data = await res.json();
	return data.data ?? null;
}

export async function getPublicWishlistForEvent(
	eventId: string
): Promise<PublicWishlistView | null> {
	try {
		const res = await fetch(`${WISHLIST_API}/public/event/${eventId}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.data ?? null;
	} catch {
		return null;
	}
}

/**
 * Claim a PHYSICAL / EXTERNAL_LINK gift.
 *
 * Concurrency-safe server-side: two guests clicking at the same instant means
 * exactly one succeeds and the other gets a 409 with `code: 'ALREADY_CLAIMED'`.
 * Surface that as "someone just took the last one", not as a generic failure.
 */
export async function claimWishlistItem(
	wishlistId: string,
	itemId: string,
	body: { claimerName: string; claimerEmail: string; quantity?: number; note?: string }
): Promise<{
	claimToken: string;
	itemId: string;
	quantity: number;
	expiresAt: string;
	itemStatus: string;
}> {
	const res = await fetch(`${WISHLIST_API}/public/${wishlistId}/items/${itemId}/claim`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...bearer() },
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const err = new Error(data?.message ?? 'Could not claim this gift') as any;
		err.code = data?.code;
		err.meta = data?.meta;
		throw err;
	}
	return data.data;
}

export async function getClaimByToken(claimToken: string): Promise<any | null> {
	try {
		const res = await fetch(`${WISHLIST_API}/public/claims/${claimToken}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.data ?? null;
	} catch {
		return null;
	}
}

export async function markClaimPurchased(claimToken: string): Promise<void> {
	const res = await fetch(`${WISHLIST_API}/public/claims/${claimToken}/purchased`, {
		method: 'POST'
	});
	if (!res.ok) await throwApiError(res, 'Could not mark this as bought');
}

export async function releaseClaim(claimToken: string): Promise<void> {
	const res = await fetch(`${WISHLIST_API}/public/claims/${claimToken}/release`, {
		method: 'POST'
	});
	if (!res.ok) await throwApiError(res, 'Could not release this claim');
}
