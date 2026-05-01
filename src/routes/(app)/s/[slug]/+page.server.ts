import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';
const OG_FALLBACK = 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await globalThis.fetch(`${API_BASE}/api/v1/products/public/discover/speaker/${encodeURIComponent(slug)}`);
		if (!res.ok) return { seo: null };
		const json = await res.json();
		const data = json.data;
		if (!data?.speaker) return { seo: null };

		const speaker = data.speaker;
		const portfolios = data.portfolios ?? [];

		const name = speaker.fullName || speaker.name || 'Speaker';
		const rawDesc = (speaker.speakerBio || speaker.bio || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
		const description = rawDesc.slice(0, 160) || `${name} — Speaker on Rondwell`;
		const image = speaker.profilePhotoUrl || speaker.profilePictureUrl || OG_FALLBACK;
		const url = `https://rondwell.com/s/${slug}`;
		const portfolioCount = portfolios.length;

		const socialDescription = [
			rawDesc.slice(0, 100),
			speaker.expertise ? `🎤 ${speaker.expertise}` : '',
			speaker.title ? `💼 ${speaker.title}` : '',
			portfolioCount > 0 ? `📁 ${portfolioCount} portfolio item${portfolioCount !== 1 ? 's' : ''}` : '',
		].filter(Boolean).join(' · ').slice(0, 200) || description;

		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "Person",
			"name": name,
			"description": description,
			"image": image,
			"url": url,
			...(speaker.title ? { "jobTitle": speaker.title } : {}),
			...(speaker.affiliation ? { "worksFor": { "@type": "Organization", "name": speaker.affiliation } } : {}),
			...(speaker.expertise ? { "knowsAbout": speaker.expertise } : {}),
		};

		return {
			seo: {
				title: `${name} | Rondwell`,
				description: socialDescription,
				image,
				url,
				portfolioCount,
				expertise: speaker.expertise,
				jsonLd,
			},
		};
	} catch (err) {
		console.error('[SEO] s/[slug] load failed:', err);
		return { seo: null };
	}
};
