import type { PageServerLoad } from './$types';
import { SITE, buildVendorSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${SITE.api}/api/v1/products/public/discover/vendor/${encodeURIComponent(slug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.vendor) return { seo: null };

		return { seo: buildVendorSeo(data.vendor, data.products ?? [], slug) };
	} catch (err) {
		console.error('[SEO] v/[slug] load failed:', err);
		return { seo: null };
	}
};
