import type { PageServerLoad } from './$types';
import { SITE, buildVendorSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: fallbackSeo('/') };

	const path = `/v/${slug}`;

	try {
		const json = await fetchSeoJson(
			`${SITE.api}/api/v1/products/public/discover/vendor/${encodeURIComponent(slug)}`
		);
		const data = json?.data;
		if (!data?.vendor) return { seo: fallbackSeo(path) };

		return { seo: buildVendorSeo(data.vendor, data.products ?? [], slug) };
	} catch (err) {
		console.error('[SEO] v/[slug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
