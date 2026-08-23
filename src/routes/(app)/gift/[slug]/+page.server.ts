import type { PageServerLoad } from './$types';
import { SITE, buildGiftLinkSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

/**
 * GAP 4 / F5 — SSR metadata for a gift link.
 *
 * This is the single most-shared URL in the celebration layer: someone posts
 * "it's my birthday 🎉" with this link and the WhatsApp preview card decides
 * whether anyone taps. It is rendered server-side with a hard fetch timeout so
 * a slow API degrades to a generic-but-valid card rather than a page with no
 * tags — which WhatsApp caches as broken for days.
 */
export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: fallbackSeo('/gift') };

	const path = `/gift/${slug}`;

	try {
		const json = await fetchSeoJson(
			`${SITE.api}/api/v1/payment/public/gift-links/${encodeURIComponent(slug)}`
		);
		const link = json?.data;
		if (!link) return { seo: fallbackSeo(path) };

		return {
			seo: buildGiftLinkSeo(link, slug),
			// First paint has content; the page still re-fetches client-side
			// because the raised total moves.
			preloaded: link
		};
	} catch (err) {
		console.error('[SEO] gift/[slug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
