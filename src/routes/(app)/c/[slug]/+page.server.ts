import type { PageServerLoad } from './$types';
import { SITE, buildCollectionSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${SITE.api}/api/v1/collections/by-slug/${encodeURIComponent(slug)}`
		);
		if (!res.ok) return { seo: null };
		const data = await res.json();
		const collection = data.collection;
		if (!collection) return { seo: null };

		return { seo: buildCollectionSeo(collection, data.events ?? [], slug) };
	} catch (err) {
		console.error('[SEO] c/[slug] load failed:', err);
		return { seo: null };
	}
};
