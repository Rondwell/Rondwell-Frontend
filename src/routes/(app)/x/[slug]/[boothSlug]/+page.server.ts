import type { PageServerLoad } from './$types';
import { SITE, buildBoothSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: exhibitorSlug, boothSlug } = params;
	if (!exhibitorSlug || !boothSlug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${SITE.api}/api/v1/products/public/discover/exhibitor/${encodeURIComponent(exhibitorSlug)}/booth/${encodeURIComponent(boothSlug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.booth) return { seo: null };

		return { seo: buildBoothSeo(data.booth, data.exhibitor, exhibitorSlug, boothSlug) };
	} catch (err) {
		console.error('[SEO] x/[slug]/[boothSlug] load failed:', err);
		return { seo: null };
	}
};
