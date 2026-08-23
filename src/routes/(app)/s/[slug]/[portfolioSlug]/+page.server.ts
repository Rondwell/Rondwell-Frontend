import type { PageServerLoad } from './$types';
import { SITE, buildPortfolioSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: speakerSlug, portfolioSlug } = params;
	if (!speakerSlug || !portfolioSlug) return { seo: fallbackSeo('/') };

	const path = `/s/${speakerSlug}/${portfolioSlug}`;

	try {
		const json = await fetchSeoJson(
			`${SITE.api}/api/v1/products/public/discover/speaker/${encodeURIComponent(speakerSlug)}/portfolio/${encodeURIComponent(portfolioSlug)}`
		);
		const data = json?.data;
		if (!data?.portfolio) return { seo: fallbackSeo(path) };

		return { seo: buildPortfolioSeo(data.portfolio, data.speaker, speakerSlug, portfolioSlug) };
	} catch (err) {
		console.error('[SEO] s/[slug]/[portfolioSlug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
