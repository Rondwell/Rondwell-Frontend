import type { PageServerLoad } from './$types';
import { SITE, buildPortfolioSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: speakerSlug, portfolioSlug } = params;
	if (!speakerSlug || !portfolioSlug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${SITE.api}/api/v1/products/public/discover/speaker/${encodeURIComponent(speakerSlug)}/portfolio/${encodeURIComponent(portfolioSlug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.portfolio) return { seo: null };

		return { seo: buildPortfolioSeo(data.portfolio, data.speaker, speakerSlug, portfolioSlug) };
	} catch (err) {
		console.error('[SEO] s/[slug]/[portfolioSlug] load failed:', err);
		return { seo: null };
	}
};
