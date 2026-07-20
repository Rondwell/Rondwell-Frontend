import type { PageServerLoad } from './$types';
import { SITE, buildExhibitorSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${SITE.api}/api/v1/products/public/discover/exhibitor/${encodeURIComponent(slug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.exhibitor) return { seo: null };

		return { seo: buildExhibitorSeo(data.exhibitor, data.booths ?? [], slug) };
	} catch (err) {
		console.error('[SEO] x/[slug] load failed:', err);
		return { seo: null };
	}
};
