import type { PageServerLoad } from './$types';
import { SITE, buildProductSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: vendorSlug, productSlug } = params;
	if (!vendorSlug || !productSlug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${SITE.api}/api/v1/products/public/discover/vendor/${encodeURIComponent(vendorSlug)}/product/${encodeURIComponent(productSlug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.product) return { seo: null };

		return { seo: buildProductSeo(data.product, data.vendor, vendorSlug, productSlug) };
	} catch (err) {
		console.error('[SEO] v/[slug]/[productSlug] load failed:', err);
		return { seo: null };
	}
};
