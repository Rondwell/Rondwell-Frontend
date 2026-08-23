import type { PageServerLoad } from './$types';
import { SITE, buildSpeakerSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: fallbackSeo('/') };

	const path = `/s/${slug}`;

	try {
		const json = await fetchSeoJson(
			`${SITE.api}/api/v1/products/public/discover/speaker/${encodeURIComponent(slug)}`
		);
		const data = json?.data;
		if (!data?.speaker) return { seo: fallbackSeo(path) };

		return { seo: buildSpeakerSeo(data.speaker, data.portfolios ?? [], slug) };
	} catch (err) {
		console.error('[SEO] s/[slug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
