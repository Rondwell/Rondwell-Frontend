/**
 * Exhibitor Public Services — Public-facing API calls for exhibitor discovery.
 *
 * Used by:
 *   /discover (Exhibitors tab)
 *   /x/[slug] (Exhibitor profile page)
 *   /x/[slug]/[boothSlug] (Booth detail page)
 */

const BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_API = `${BASE_URL}/api/v1/products`;

/**
 * Discover public exhibitors (paginated, searchable).
 */
export async function discoverExhibitors(
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
  } = {}
) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.industry) params.set('industry', filters.industry);

  const res = await fetch(`${PRODUCTS_API}/public/discover/exhibitors?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch exhibitors');
  return data.data;
}

/**
 * Get a public exhibitor profile by slug (profile + booths).
 */
export async function getPublicExhibitorBySlug(slug: string) {
  const res = await fetch(`${PRODUCTS_API}/public/discover/exhibitor/${slug}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Exhibitor not found');
  return data.data;
}

/**
 * Get a single published booth detail.
 */
export async function getPublicExhibitorBooth(exhibitorSlug: string, boothSlug: string) {
  const res = await fetch(`${PRODUCTS_API}/public/discover/exhibitor/${exhibitorSlug}/booth/${boothSlug}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Booth not found');
  return data.data;
}
