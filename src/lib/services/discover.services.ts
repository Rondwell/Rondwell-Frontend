/**
 * Discover Services — platform stats, event filter facets and global search.
 *
 * Global search fans out to the four public discovery endpoints in parallel and
 * normalises every hit into one `GlobalSearchResult` shape, so the search
 * dropdown never needs to know where a result came from. Adding a new searchable
 * entity means adding one entry to `SEARCH_SOURCES`.
 */

import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;
const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;
const PRODUCTS_API = `${BASE_URL}/api/v1/products`;
const EVENTS_API = `${EVENT_URL}/api/v1/events`;

export interface DiscoverStats {
	events: number;
	organizers: number;
	vendors: number;
	speakers: number;
	exhibitors: number;
	products: number;
	portfolios: number;
	booths: number;
}

/**
 * Get platform-wide discover stats.
 * Cached on the backend for 5 minutes.
 */
export async function getDiscoverStats(): Promise<DiscoverStats> {
	const res = await fetch(`${PRODUCTS_API}/public/discover/stats`);
	if (!res.ok) await throwApiError(res, 'Failed to fetch stats');
	const data = await res.json();
	return data.data;
}

// ─── Event filter facets ──────────────────────────────────────────────────

export interface FacetCount {
	value: string;
	count: number;
}

export interface CategoryFacet extends FacetCount {
	label: string;
	raw: string;
}

export interface CityFacet extends FacetCount {
	country: string;
}

export interface DiscoverFacets {
	total: number;
	categories: CategoryFacet[];
	eventTypes: FacetCount[];
	registrationTypes: FacetCount[];
	cities: CityFacet[];
	countries: FacetCount[];
	truncated: boolean;
}

export const EMPTY_FACETS: DiscoverFacets = {
	total: 0,
	categories: [],
	eventTypes: [],
	registrationTypes: [],
	cities: [],
	countries: [],
	truncated: false
};

/**
 * Filter options that exist in the live event set, with counts.
 * Counts for each facet exclude that facet's own selection, so they answer
 * "how many results would I get if I picked this?".
 */
export async function getEventFacets(
	params: Record<string, string> = {},
	options: { signal?: AbortSignal } = {}
): Promise<DiscoverFacets> {
	const query = new URLSearchParams(params).toString();
	const res = await fetch(`${EVENTS_API}/discover/facets${query ? `?${query}` : ''}`, {
		signal: options.signal
	});
	if (!res.ok) return EMPTY_FACETS;
	const data = await res.json();
	return { ...EMPTY_FACETS, ...data };
}

// ─── Global search ────────────────────────────────────────────────────────

export type SearchResultType = 'event' | 'vendor' | 'speaker' | 'exhibitor';

export interface GlobalSearchResult {
	type: SearchResultType;
	id: string;
	title: string;
	subtitle: string;
	imageUrl: string;
	href: string;
	badge?: string;
	/** Fallback initial when there is no image. */
	initial: string;
}

export interface GlobalSearchGroup {
	type: SearchResultType;
	label: string;
	icon: string;
	results: GlobalSearchResult[];
	/** Total matches reported by the backend (may exceed `results.length`). */
	total: number;
}

export interface GlobalSearchResponse {
	query: string;
	groups: GlobalSearchGroup[];
	total: number;
	/** True when at least one source failed — the UI degrades quietly. */
	partial: boolean;
}

const initialOf = (value: string) => (value?.trim()?.[0] ?? '?').toUpperCase();

function formatEventDate(iso?: string): string {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface SearchSource {
	type: SearchResultType;
	label: string;
	icon: string;
	url: (query: string, limit: number) => string;
	/** Pull the array + total out of the endpoint's envelope. */
	extract: (payload: any) => { items: any[]; total: number };
	map: (item: any) => GlobalSearchResult;
}

const SEARCH_SOURCES: SearchSource[] = [
	{
		type: 'event',
		label: 'Events',
		icon: 'mdi:calendar-star',
		url: (q, limit) => `${EVENTS_API}/discover?search=${encodeURIComponent(q)}&limit=${limit}`,
		extract: (payload) => ({
			items: payload?.events ?? [],
			total: payload?.pagination?.total ?? payload?.events?.length ?? 0
		}),
		map: (e) => {
			const id = e._id ?? e.id ?? '';
			const venue =
				e?.locationDetails?.physical?.venueName ||
				e?.locationDetails?.virtual?.platform ||
				(e?.eventType === 'VIRTUAL' ? 'Online' : '');
			const bits = [formatEventDate(e.startDateTime), venue, e.eventOrganizerName].filter(Boolean);
			return {
				type: 'event',
				id,
				title: e.title ?? 'Untitled event',
				subtitle: bits.join(' · '),
				imageUrl: e.displayPictureUrl ?? e.coverPictureUrl ?? '',
				href: e.customLinkSlug ? `/e/${e.customLinkSlug}` : `/event-page/${id}`,
				badge: e.registrationType === 'FREE' ? 'Free' : e.registrationType === 'PAID' ? 'Paid' : '',
				initial: initialOf(e.title ?? 'E')
			};
		}
	},
	{
		type: 'vendor',
		label: 'Vendors',
		icon: 'mdi:storefront-outline',
		url: (q, limit) =>
			`${PRODUCTS_API}/public/discover/vendors?search=${encodeURIComponent(q)}&limit=${limit}`,
		extract: (payload) => {
			const data = payload?.data ?? payload;
			return {
				items: data?.vendors ?? [],
				total: data?.pagination?.total ?? data?.pagination?.totalItems ?? data?.vendors?.length ?? 0
			};
		},
		map: (v) => ({
			type: 'vendor',
			id: v._id ?? v.userId ?? v.publicProfileSlug ?? '',
			title: v.businessName ?? v.name ?? 'Vendor',
			subtitle: [v.businessType, v.location || v.serviceArea].filter(Boolean).join(' · '),
			imageUrl: v.logoUrl ?? v.profilePictureUrl ?? '',
			href: `/v/${v.publicProfileSlug ?? v._id ?? ''}`,
			initial: initialOf(v.businessName ?? v.name ?? 'V')
		})
	},
	{
		type: 'speaker',
		label: 'Speakers',
		icon: 'mdi:microphone-outline',
		url: (q, limit) =>
			`${PRODUCTS_API}/public/discover/speakers?search=${encodeURIComponent(q)}&limit=${limit}`,
		extract: (payload) => {
			const data = payload?.data ?? payload;
			return {
				items: data?.speakers ?? [],
				total:
					data?.pagination?.totalItems ?? data?.pagination?.total ?? data?.speakers?.length ?? 0
			};
		},
		map: (s) => ({
			type: 'speaker',
			id: s._id ?? s.userId ?? s.publicProfileSlug ?? '',
			title: s.fullName ?? s.name ?? 'Speaker',
			subtitle: [s.title, s.expertise || s.affiliation].filter(Boolean).join(' · '),
			imageUrl: s.profilePhotoUrl ?? s.profilePictureUrl ?? '',
			href: `/s/${s.publicProfileSlug ?? s._id ?? ''}`,
			initial: initialOf(s.fullName ?? s.name ?? 'S')
		})
	},
	{
		type: 'exhibitor',
		label: 'Exhibitors',
		icon: 'mdi:view-grid-outline',
		url: (q, limit) =>
			`${PRODUCTS_API}/public/discover/exhibitors?search=${encodeURIComponent(q)}&limit=${limit}`,
		extract: (payload) => {
			const data = payload?.data ?? payload;
			return {
				items: data?.exhibitors ?? [],
				total:
					data?.pagination?.totalItems ?? data?.pagination?.total ?? data?.exhibitors?.length ?? 0
			};
		},
		map: (x) => ({
			type: 'exhibitor',
			id: x._id ?? x.userId ?? x.publicProfileSlug ?? '',
			title: x.companyName ?? x.name ?? 'Exhibitor',
			subtitle: [x.industry, x.businessLocation].filter(Boolean).join(' · '),
			imageUrl: x.logoUrl ?? x.profilePictureUrl ?? '',
			href: `/x/${x.publicProfileSlug ?? x._id ?? ''}`,
			initial: initialOf(x.companyName ?? x.name ?? 'X')
		})
	}
];

export const SEARCH_SOURCE_META: Record<SearchResultType, { label: string; icon: string }> =
	SEARCH_SOURCES.reduce(
		(acc, source) => {
			acc[source.type] = { label: source.label, icon: source.icon };
			return acc;
		},
		{} as Record<SearchResultType, { label: string; icon: string }>
	);

/**
 * Search events, vendors, speakers and exhibitors at once.
 *
 * @param query        the search term (min 2 chars enforced by the caller)
 * @param options.types  restrict to specific entity types — used to put the
 *                       active tab's entity first / alone
 * @param options.limit  results per entity type
 * @param options.signal abort signal for keystroke cancellation
 */
export async function globalSearch(
	query: string,
	options: { types?: SearchResultType[]; limit?: number; signal?: AbortSignal } = {}
): Promise<GlobalSearchResponse> {
	const term = query.trim();
	const limit = options.limit ?? 5;
	const sources = options.types?.length
		? SEARCH_SOURCES.filter((s) => options.types!.includes(s.type))
		: SEARCH_SOURCES;

	if (term.length < 2) return { query: term, groups: [], total: 0, partial: false };

	const settled = await Promise.allSettled(
		sources.map(async (source) => {
			const res = await fetch(source.url(term, limit), { signal: options.signal });
			if (!res.ok) throw new Error(`${source.type} search failed`);
			const payload = await res.json();
			const { items, total } = source.extract(payload);
			return {
				type: source.type,
				label: source.label,
				icon: source.icon,
				results: items.slice(0, limit).map(source.map).filter((r: GlobalSearchResult) => r.id),
				total
			} satisfies GlobalSearchGroup;
		})
	);

	const groups: GlobalSearchGroup[] = [];
	let partial = false;

	settled.forEach((outcome) => {
		if (outcome.status === 'fulfilled') {
			if (outcome.value.results.length) groups.push(outcome.value);
		} else {
			partial = true;
		}
	});

	return {
		query: term,
		groups,
		total: groups.reduce((sum, g) => sum + g.results.length, 0),
		partial
	};
}
