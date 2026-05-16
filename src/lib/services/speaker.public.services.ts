/**
 * Speaker Public Services — Public-facing API calls for speaker discovery.
 *
 * Used by:
 *   /discover (Speakers tab)
 *   /s/[slug] (Speaker profile page)
 *   /s/[slug]/[portfolioSlug] (Portfolio detail page)
 */

import { throwApiError } from '$lib/utils/errorMessage';
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
  if (!res.ok) await throwApiError(res, 'Failed to fetch speakers');
  const data = await res.json();
  return data.data;
}

/**
 * Get a public speaker profile by slug (profile + portfolios).
 */
export async function getPublicSpeakerBySlug(slug: string) {
  const res = await fetch(`${PRODUCTS_API}/public/discover/speaker/${slug}`);
  if (!res.ok) await throwApiError(res, 'Speaker not found');
  const data = await res.json();
  return data.data;
}

/**
 * Get a single public portfolio detail.
 */
export async function getPublicSpeakerPortfolio(speakerSlug: string, portfolioSlug: string) {
  const res = await fetch(`${PRODUCTS_API}/public/discover/speaker/${speakerSlug}/portfolio/${portfolioSlug}`);
  if (!res.ok) await throwApiError(res, 'Portfolio not found');
  const data = await res.json();
  return data.data;
}
