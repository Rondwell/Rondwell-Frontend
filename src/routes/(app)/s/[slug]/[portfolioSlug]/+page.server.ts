import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';
const OG_FALLBACK = 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';

export const load: PageServerLoad = async ({ params }) => {
	const { slug: speakerSlug, portfolioSlug } = params;
	if (!speakerSlug || !portfolioSlug) return { seo: null };

	try {
		const res = await globalThis.fetch(
			`${API_BASE}/api/v1/products/public/discover/speaker/${encodeURIComponent(speakerSlug)}/portfolio/${encodeURIComponent(portfolioSlug)}`
		);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.portfolio) return { seo: null };

		const portfolio = data.portfolio;
		const speaker = data.speaker;

		const title = portfolio.title || 'Portfolio';
		const speakerName = speaker?.fullName || speaker?.name || 'Speaker';
		const rawDesc = (portfolio.description || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
		const description = rawDesc.slice(0, 160) || `${title} by ${speakerName} on Rondwell`;
		const image = portfolio.media?.[0]?.url || speaker?.profilePhotoUrl || OG_FALLBACK;
		const url = `https://rondwell.com/s/${speakerSlug}/${portfolioSlug}`;

		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "CreativeWork",
			"name": title,
			"description": description,
			"image": image,
			"url": url,
			"author": { "@type": "Person", "name": speakerName },
			...(portfolio.category ? { "genre": portfolio.category } : {}),
		};

		return {
			seo: {
				title: `${title} — ${speakerName} | Rondwell`,
				description,
				image,
				url,
				jsonLd,
			},
		};
	} catch (err) {
		console.error('[SEO] s/[slug]/[portfolioSlug] load failed:', err);
		return { seo: null };
	}
};
