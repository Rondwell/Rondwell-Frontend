/**
 * Discover Services — Platform-wide stats for the discover hero section.
 */

const BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_API = `${BASE_URL}/api/v1/products`;

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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch stats');
  return data.data;
}
