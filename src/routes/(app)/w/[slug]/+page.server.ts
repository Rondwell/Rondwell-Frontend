import type { PageServerLoad } from './$types';
import { SITE, buildWishlistSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

/**
 * GAP 3 / F5 — SSR metadata for a standalone gift registry.
 *
 * These URLs live in WhatsApp group chats. The preview card IS the product
 * surface, so it is rendered server-side with a hard fetch timeout — a slow
 * API must degrade to a generic-but-valid card, never to a page with no tags
 * at all (which WhatsApp then caches as broken for days).
 */
export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: fallbackSeo('/') };

	const path = `/w/${slug}`;

	try {
		const json = await fetchSeoJson(
			`${SITE.api}/api/v1/products/wishlists/public/${encodeURIComponent(slug)}`
		);
		const data = json?.data;
		if (!data?.registry) return { seo: fallbackSeo(path) };

		return {
			seo: buildWishlistSeo(data.registry, data.items?.length ?? 0, slug),
			// Handed to the page so the first paint has content. The page still
			// re-fetches client-side, because raised totals move.
			preloaded: data
		};
	} catch (err) {
		console.error('[SEO] w/[slug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
