/**
 * Speaker Public Services — Public-facing API calls for speaker discovery.
 *
 * Used by:
 *   /discover (Speakers tab)
 *   /s/[slug] (Speaker profile page)
 *   /s/[slug]/[portfolioSlug] (Portfolio detail page)
 */

const BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_API = `${BASE_URL}/api/v1/products`;

/**
 * Discover public speakers (paginated, searchable).
 */
export async function discoverSpeakers(
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    expertise?: string;
  } = {}
) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.expertise) params.set('expertise', filters.expertise);

  const res = await fetch(`${PRODUCTS_API}/public/discover/speakers?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch speakers');
  return data.data;
}

/**
 * Get a public speaker profile by slug (profile + portfolios).
 */
export async function getPublicSpeakerBySlug(slug: string) {
  const res = await fetch(`${PRODUCTS_API}/public/discover/speaker/${slug}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Speaker not found');
  return data.data;
}

/**
 * Get a single public portfolio detail.
 */
export async function getPublicSpeakerPortfolio(speakerSlug: string, portfolioSlug: string) {
  const res = await fetch(`${PRODUCTS_API}/public/discover/speaker/${speakerSlug}/portfolio/${portfolioSlug}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Portfolio not found');
  return data.data;
}
