import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';
const OG_FALLBACK = 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await globalThis.fetch(`${API_BASE}/api/v1/products/public/discover/exhibitor/${encodeURIComponent(slug)}`);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.exhibitor) return { seo: null };

		const exhibitor = data.exhibitor;
		const booths = data.booths ?? [];

		const name = exhibitor.companyName || exhibitor.name || 'Exhibitor';
		const rawDesc = (exhibitor.companyDescription || exhibitor.bio || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
		const description = rawDesc.slice(0, 160) || `${name} — Exhibitor on Rondwell`;
		const image = exhibitor.coverImageUrl || exhibitor.logoUrl || exhibitor.digitalBoothCoverImageUrl || exhibitor.profilePictureUrl || OG_FALLBACK;
		const url = `https://rondwell.com/x/${slug}`;
		const boothCount = booths.length;

		const socialDescription = [
			rawDesc.slice(0, 100),
			exhibitor.industry ? `🏭 ${exhibitor.industry}` : '',
			exhibitor.businessLocation ? `📍 ${exhibitor.businessLocation}` : '',
			boothCount > 0 ? `🏢 ${boothCount} booth${boothCount !== 1 ? 's' : ''}` : '',
		].filter(Boolean).join(' · ').slice(0, 200) || description;

		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "Organization",
			"name": name,
			"description": description,
			"image": image,
			"url": url,
			...(exhibitor.industry ? { "industry": exhibitor.industry } : {}),
			...(exhibitor.businessLocation ? { "address": exhibitor.businessLocation } : {}),
			"publisher": { "@type": "Organization", "name": "Rondwell", "url": "https://rondwell.com" },
		};

		return {
			seo: {
				title: `${name} | Rondwell`,
				description: socialDescription,
				image,
				url,
				boothCount,
				industry: exhibitor.industry,
				jsonLd,
			},
		};
	} catch (err) {
		console.error('[SEO] x/[slug] load failed:', err);
		return { seo: null };
	}
};
