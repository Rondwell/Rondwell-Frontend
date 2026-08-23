/**
 * Shared state for one gift link's dashboard.
 *
 * The layout loads the link and its contributions ONCE and hands them to every
 * tab through context. The alternative — each tab fetching for itself — is what
 * makes a multi-tab dashboard feel slow and, worse, lets two tabs disagree:
 * rename the link in Settings and the header keeps the old title until a hard
 * reload. Here `reload()` is shared, so whoever mutates refreshes everyone.
 *
 * Stores rather than plain values because the layout owns the fetch and the
 * tabs are siblings of it in the render tree, not children of its script.
 */
import { getContext, setContext } from 'svelte';
import type { Writable } from 'svelte/store';
import type { GiftLink } from '$lib/services/giftLink.services';

export interface GiftLinkTotals {
	currency: string;
	gross: number;
	net: number;
	platformFee: number;
	count: number;
}

export interface GiftLinkCtx {
	link: Writable<GiftLink | null>;
	contributions: Writable<any[]>;
	totals: Writable<GiftLinkTotals[]>;
	loading: Writable<boolean>;
	error: Writable<string>;
	/** Refetch link + contributions. Safe to call from any tab. */
	reload: () => Promise<void>;
}

const KEY = Symbol('gift-link-dashboard');

export function setGiftLinkCtx(ctx: GiftLinkCtx): GiftLinkCtx {
	return setContext(KEY, ctx);
}

export function getGiftLinkCtx(): GiftLinkCtx {
	return getContext<GiftLinkCtx>(KEY);
}
