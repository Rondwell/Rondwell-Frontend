import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';
const OG_FALLBACK = 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: exhibitorSlug, boothSlug } = params;
	if (!exhibitorSlug || !boothSlug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${API_BASE}/api/v1/products/public/discover/exhibitor/${encodeURIComponent(exhibitorSlug)}/booth/${encodeURIComponent(boothSlug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.booth) return { seo: null };

		const booth = data.booth;
		const exhibitor = data.exhibitor;

		const title = booth.title || 'Digital Booth';
		const exhibitorName = exhibitor?.companyName || exhibitor?.name || 'Exhibitor';
		const rawDesc = (booth.description || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
		const description = rawDesc.slice(0, 160) || `${title} by ${exhibitorName} on Rondwell`;
		const image = booth.bannerUrl || booth.media?.[0]?.url || exhibitor?.coverImageUrl || OG_FALLBACK;
		const url = `https://rondwell.com/x/${exhibitorSlug}/${boothSlug}`;

		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "ExhibitionEvent",
			"name": title,
			"description": description,
			"image": image,
			"url": url,
			"organizer": { "@type": "Organization", "name": exhibitorName },
		};

		return {
			seo: {
				title: `${title} — ${exhibitorName} | Rondwell`,
				description,
				image,
				url,
				jsonLd,
			},
		};
	} catch (err) {
		console.error('[SEO] x/[slug]/[boothSlug] load failed:', err);
		return { seo: null };
	}
};
