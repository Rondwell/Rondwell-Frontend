import type { PageServerLoad } from './$types';
import { SITE, buildCollectionSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: fallbackSeo('/') };

	const path = `/c/${slug}`;

	try {
		const data = await fetchSeoJson(
			`${SITE.api}/api/v1/collections/by-slug/${encodeURIComponent(slug)}`
		);
		const collection = data?.collection;
		if (!collection) return { seo: fallbackSeo(path) };

		return { seo: buildCollectionSeo(collection, data.events ?? [], slug) };
	} catch (err) {
		console.error('[SEO] c/[slug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
