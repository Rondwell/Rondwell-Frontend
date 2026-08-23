import type { PageServerLoad } from './$types';
import { SITE, buildExhibitorSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: fallbackSeo('/') };

	const path = `/x/${slug}`;

	try {
		const json = await fetchSeoJson(
			`${SITE.api}/api/v1/products/public/discover/exhibitor/${encodeURIComponent(slug)}`
		);
		const data = json?.data;
		if (!data?.exhibitor) return { seo: fallbackSeo(path) };

		return { seo: buildExhibitorSeo(data.exhibitor, data.booths ?? [], slug) };
	} catch (err) {
		console.error('[SEO] x/[slug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
