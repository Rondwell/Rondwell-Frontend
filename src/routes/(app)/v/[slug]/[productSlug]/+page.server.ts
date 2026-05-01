import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';
const OG_FALLBACK = 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: vendorSlug, productSlug } = params;
	if (!vendorSlug || !productSlug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${API_BASE}/api/v1/products/public/discover/vendor/${encodeURIComponent(vendorSlug)}/product/${encodeURIComponent(productSlug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.product) return { seo: null };

		const product = data.product;
		const vendor = data.vendor;

		const name = product.productName || 'Product';
		const vendorName = vendor?.businessName || vendor?.name || 'Vendor';
		const rawDesc = (product.description || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
		const description = rawDesc.slice(0, 160) || `${name} by ${vendorName} on Rondwell`;
		const image = product.media?.[0]?.url || vendor?.coverImageUrl || OG_FALLBACK;
		const url = `https://rondwell.com/v/${vendorSlug}/${productSlug}`;

		const jsonLd: any = {
			"@context": "https://schema.org",
			"@type": "Product",
			"name": name,
			"description": description,
			"image": image,
			"url": url,
			"brand": { "@type": "Organization", "name": vendorName },
		};

		if (product.price) {
			jsonLd.offers = {
				"@type": "Offer",
				"url": url,
				"priceCurrency": product.currency || "USD",
				"price": String(product.price?.$numberDecimal || product.price),
				"availability": "https://schema.org/InStock",
			};
		}

		return {
			seo: {
				title: `${name} — ${vendorName} | Rondwell`,
				description,
				image,
				url,
				jsonLd,
			},
		};
	} catch (err) {
		console.error('[SEO] v/[slug]/[productSlug] load failed:', err);
		return { seo: null };
	}
};
