/**
 * Discover page state — the single source of truth for the active tab, the
 * search term and the event filters.
 *
 * Everything the discover page renders (hero, filter bar, result lists) reads
 * from here, and the state is mirrored into the URL query string so a filtered
 * view is shareable, bookmarkable and survives a refresh or back/forward.
 *
 * URL contract:
 *   ?tab=events|exhibitors|vendors|speakers|community
 *   &q=<search term>
 *   &category=Art,Business          (plain labels, comma separated)
 *   &type=PHYSICAL,VIRTUAL,HYBRID
 *   &location=Lagos,Nigeria
 */

import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import { derived, get, writable, type Readable } from 'svelte/store';

export const DISCOVER_TABS = ['Events', 'Exhibitors', 'Vendors', 'Speakers', 'Community'] as const;
export type DiscoverTab = (typeof DISCOVER_TABS)[number];

export interface DiscoverFilterState {
	/** Free-text search applied to the active tab's list. */
	search: string;
	/** Plain category labels, e.g. ['Art', 'Technology']. */
	categories: string[];
	/** VIRTUAL | PHYSICAL | HYBRID */
	eventTypes: string[];
	/** City / country / free-text location terms. */
	locations: string[];
}

export const EMPTY_FILTERS: DiscoverFilterState = {
	search: '',
	categories: [],
	eventTypes: [],
	locations: []
};

const TAB_BY_SLUG = new Map<string, DiscoverTab>(
	DISCOVER_TABS.map((tab) => [tab.toLowerCase(), tab])
);

/**
 * Single-key tab shortcuts (no modifier), the way Linear/Superhuman do it.
 * Modifier combos like ⌘1 are reserved by browsers for tab switching and can't
 * be intercepted reliably, so bare letters are used instead — suppressed while
 * the user is typing.
 */
export const TAB_SHORTCUTS: Record<DiscoverTab, string> = {
	Events: 'E',
	Exhibitors: 'X',
	Vendors: 'V',
	Speakers: 'S',
	Community: 'C'
};

const TAB_BY_SHORTCUT = new Map<string, DiscoverTab>(
	(Object.entries(TAB_SHORTCUTS) as Array<[DiscoverTab, string]>).map(([tab, key]) => [
		key.toLowerCase(),
		tab
	])
);

/** Resolve a bare keypress to a tab, or null when it isn't a shortcut. */
export function tabForShortcut(key: string): DiscoverTab | null {
	return TAB_BY_SHORTCUT.get(key.toLowerCase()) ?? null;
}

export const discoverTab = writable<DiscoverTab>('Events');
export const discoverFilters = writable<DiscoverFilterState>({ ...EMPTY_FILTERS });

/** Number of filter facets in play (search excluded — it has its own affordance). */
export const activeFilterCount: Readable<number> = derived(
	discoverFilters,
	($f) => $f.categories.length + $f.eventTypes.length + $f.locations.length
);

export const hasActiveFilters: Readable<boolean> = derived(
	[activeFilterCount, discoverFilters],
	([$count, $f]) => $count > 0 || $f.search.trim().length > 0
);

/** Query params for the events discover / facets endpoints. */
export const eventQueryParams: Readable<Record<string, string>> = derived(
	discoverFilters,
	($f) => {
		const params: Record<string, string> = {};
		if ($f.search.trim()) params.search = $f.search.trim();
		if ($f.categories.length) params.category = $f.categories.join(',');
		if ($f.eventTypes.length) params.eventType = $f.eventTypes.join(',');
		if ($f.locations.length) params.location = $f.locations.join(',');
		return params;
	}
);

// ─── Mutations ────────────────────────────────────────────────────────────

function toggleIn(list: string[], value: string): string[] {
	const key = value.toLowerCase();
	return list.some((v) => v.toLowerCase() === key)
		? list.filter((v) => v.toLowerCase() !== key)
		: [...list, value];
}

export function setSearch(value: string): void {
	discoverFilters.update((f) => (f.search === value ? f : { ...f, search: value }));
}

export function toggleCategory(label: string): void {
	discoverFilters.update((f) => ({ ...f, categories: toggleIn(f.categories, label) }));
}

export function toggleEventType(value: string): void {
	discoverFilters.update((f) => ({ ...f, eventTypes: toggleIn(f.eventTypes, value) }));
}

export function toggleLocation(value: string): void {
	discoverFilters.update((f) => ({ ...f, locations: toggleIn(f.locations, value) }));
}

export function clearFacet(facet: 'categories' | 'eventTypes' | 'locations'): void {
	discoverFilters.update((f) => ({ ...f, [facet]: [] }));
}

/** Clears filters and search — what the "Clear" pill does. */
export function clearAllFilters(): void {
	discoverFilters.set({ ...EMPTY_FILTERS });
}

export function removeFilterValue(
	facet: 'categories' | 'eventTypes' | 'locations',
	value: string
): void {
	const key = value.toLowerCase();
	discoverFilters.update((f) => ({
		...f,
		[facet]: f[facet].filter((v) => v.toLowerCase() !== key)
	}));
}

export function setTab(tab: DiscoverTab): void {
	discoverTab.set(tab);
}

// ─── URL sync ─────────────────────────────────────────────────────────────

let syncEnabled = false;

function parseList(value: string | null): string[] {
	if (!value) return [];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const part of value.split(',')) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(trimmed);
	}
	return out;
}

const VALID_EVENT_TYPES = new Set(['VIRTUAL', 'PHYSICAL', 'HYBRID']);

/**
 * Hydrate the stores from a URL. Called once on mount, and again on
 * back/forward navigation so the UI matches the address bar.
 */
export function hydrateDiscoverFromUrl(url: URL): void {
	const params = url.searchParams;

	const tab = TAB_BY_SLUG.get((params.get('tab') || '').toLowerCase());
	discoverTab.set(tab ?? 'Events');

	discoverFilters.set({
		search: params.get('q') ?? '',
		categories: parseList(params.get('category')),
		eventTypes: parseList(params.get('type'))
			.map((t) => t.toUpperCase())
			.filter((t) => VALID_EVENT_TYPES.has(t)),
		locations: parseList(params.get('location'))
	});
}

function buildUrl(): string | null {
	if (!browser) return null;
	const url = new URL(window.location.href);
	const filters = get(discoverFilters);
	const tab = get(discoverTab);

	const set = (key: string, value: string) => {
		if (value) url.searchParams.set(key, value);
		else url.searchParams.delete(key);
	};

	set('tab', tab === 'Events' ? '' : tab.toLowerCase());
	set('q', filters.search.trim());
	set('category', filters.categories.join(','));
	set('type', filters.eventTypes.join(','));
	set('location', filters.locations.join(','));

	return `${url.pathname}${url.search}${url.hash}`;
}

let pendingWrite = 0;
let lastWrittenUrl: string | null = null;

/**
 * True when `url` is the one this store just wrote. Lets the page skip
 * re-hydrating (and thrashing the lists) on its own history writes.
 */
export function isSelfWrittenUrl(url: URL): boolean {
	return lastWrittenUrl === `${url.pathname}${url.search}${url.hash}`;
}

function scheduleUrlWrite(): void {
	if (!syncEnabled || !browser) return;
	if (pendingWrite) return;
	// Coalesce rapid updates (typing, multi-select bursts) into one history write.
	pendingWrite = window.setTimeout(() => {
		pendingWrite = 0;
		const next = buildUrl();
		if (!next) return;
		const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		if (next === current) return;
		lastWrittenUrl = next;
		try {
			// Keeps SvelteKit's router state in sync (it owns the history stack).
			replaceState(next, {});
		} catch {
			try {
				window.history.replaceState(window.history.state, '', next);
			} catch {
				/* history writes can fail in sandboxed frames — the UI still works */
			}
		}
	}, 120);
}

/** Turn on URL mirroring. Call after {@link hydrateDiscoverFromUrl}. */
export function enableDiscoverUrlSync(): () => void {
	syncEnabled = true;
	const unsubFilters = discoverFilters.subscribe(scheduleUrlWrite);
	const unsubTab = discoverTab.subscribe(scheduleUrlWrite);
	return () => {
		syncEnabled = false;
		if (pendingWrite) {
			clearTimeout(pendingWrite);
			pendingWrite = 0;
		}
		unsubFilters();
		unsubTab();
	};
}

// ─── Recent searches (local only) ─────────────────────────────────────────

const RECENT_KEY = 'rondwell:discover:recent';
const RECENT_MAX = 6;

export const recentSearches = writable<string[]>([]);

export function loadRecentSearches(): void {
	if (!browser) return;
	try {
		const raw = window.localStorage.getItem(RECENT_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		if (Array.isArray(parsed)) {
			recentSearches.set(parsed.filter((v) => typeof v === 'string').slice(0, RECENT_MAX));
		}
	} catch {
		recentSearches.set([]);
	}
}

export function rememberSearch(term: string): void {
	const value = term.trim();
	if (!browser || value.length < 2) return;
	recentSearches.update((list) => {
		const next = [value, ...list.filter((v) => v.toLowerCase() !== value.toLowerCase())].slice(
			0,
			RECENT_MAX
		);
		try {
			window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
		} catch {
			/* storage can be unavailable (private mode / quota) */
		}
		return next;
	});
}

export function clearRecentSearches(): void {
	recentSearches.set([]);
	if (!browser) return;
	try {
		window.localStorage.removeItem(RECENT_KEY);
	} catch {
		/* ignore */
	}
}
