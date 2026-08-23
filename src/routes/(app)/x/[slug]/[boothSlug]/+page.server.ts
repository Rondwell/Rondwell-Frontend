import type { PageServerLoad } from './$types';
import { SITE, buildBoothSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: exhibitorSlug, boothSlug } = params;
	if (!exhibitorSlug || !boothSlug) return { seo: fallbackSeo('/') };

	const path = `/x/${exhibitorSlug}/${boothSlug}`;

	try {
		const json = await fetchSeoJson(
			`${SITE.api}/api/v1/products/public/discover/exhibitor/${encodeURIComponent(exhibitorSlug)}/booth/${encodeURIComponent(boothSlug)}`
		);
		const data = json?.data;
		if (!data?.booth) return { seo: fallbackSeo(path) };

		return { seo: buildBoothSeo(data.booth, data.exhibitor, exhibitorSlug, boothSlug) };
	} catch (err) {
		console.error('[SEO] x/[slug]/[boothSlug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
