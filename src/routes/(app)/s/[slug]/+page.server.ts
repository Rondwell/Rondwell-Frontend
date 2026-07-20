import type { PageServerLoad } from './$types';
import { SITE, buildSpeakerSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${SITE.api}/api/v1/products/public/discover/speaker/${encodeURIComponent(slug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.speaker) return { seo: null };

		return { seo: buildSpeakerSeo(data.speaker, data.portfolios ?? [], slug) };
	} catch (err) {
		console.error('[SEO] s/[slug] load failed:', err);
		return { seo: null };
	}
};
