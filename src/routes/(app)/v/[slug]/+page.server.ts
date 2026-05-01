import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';
const OG_FALLBACK = 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await globalThis.fetch(`${API_BASE}/api/v1/products/public/discover/vendor/${encodeURIComponent(slug)}`);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.vendor) return { seo: null };

		const vendor = data.vendor;
		const products = data.products ?? [];

		const name = vendor.businessName || vendor.name || 'Vendor';
		const rawDesc = (vendor.businessDescription || vendor.bio || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
		const description = rawDesc.slice(0, 160) || `Explore ${name} — a vendor on Rondwell`;
		const image = vendor.coverImageUrl || vendor.logoUrl || vendor.profilePictureUrl || OG_FALLBACK;
		const url = `https://rondwell.com/v/${slug}`;
		const productCount = products.length;

		const socialDescription = [
			rawDesc.slice(0, 100),
			vendor.businessType ? `🏢 ${vendor.businessType}` : '',
			vendor.businessLocation ? `📍 ${vendor.businessLocation}` : '',
			productCount > 0 ? `📦 ${productCount} product${productCount !== 1 ? 's' : ''}` : '',
		].filter(Boolean).join(' · ').slice(0, 200) || description;

		const productItems = products.slice(0, 10).map((p: any, i: number) => ({
			"@type": "ListItem",
			"position": i + 1,
			"item": {
				"@type": "Product",
				"name": p.productName || 'Product',
				"url": p.slug ? `https://rondwell.com/v/${slug}/${p.slug}` : url,
				...(p.description ? { "description": p.description.slice(0, 100) } : {}),
			},
		}));

		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "LocalBusiness",
			"name": name,
			"description": description,
			"url": url,
			"image": image,
			...(vendor.businessLocation ? { "address": vendor.businessLocation } : {}),
			...(vendor.contactInfo?.website ? { "sameAs": [vendor.contactInfo.website] } : {}),
			"publisher": { "@type": "Organization", "name": "Rondwell", "url": "https://rondwell.com" },
			...(productCount > 0 ? {
				"makesOffer": {
					"@type": "ItemList",
					"name": `Products by ${name}`,
					"numberOfItems": productCount,
					"itemListElement": productItems,
				},
			} : {}),
		};

		return {
			seo: {
				title: `${name} | Rondwell`,
				description: socialDescription,
				image,
				url,
				productCount,
				businessType: vendor.businessType,
				location: vendor.businessLocation,
				jsonLd,
			},
		};
	} catch (err) {
		console.error('[SEO] v/[slug] load failed:', err);
		return { seo: null };
	}
};
