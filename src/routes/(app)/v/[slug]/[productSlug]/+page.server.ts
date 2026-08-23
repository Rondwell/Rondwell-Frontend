import type { PageServerLoad } from './$types';
import { SITE, buildProductSeo, fallbackSeo, fetchSeoJson } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: vendorSlug, productSlug } = params;
	if (!vendorSlug || !productSlug) return { seo: fallbackSeo('/') };

	const path = `/v/${vendorSlug}/${productSlug}`;

	try {
		const json = await fetchSeoJson(
			`${SITE.api}/api/v1/products/public/discover/vendor/${encodeURIComponent(vendorSlug)}/product/${encodeURIComponent(productSlug)}`
		);
		const data = json?.data;
		if (!data?.product) return { seo: fallbackSeo(path) };

		return { seo: buildProductSeo(data.product, data.vendor, vendorSlug, productSlug) };
	} catch (err) {
		console.error('[SEO] v/[slug]/[productSlug] load failed:', err);
		return { seo: fallbackSeo(path) };
	}
};
