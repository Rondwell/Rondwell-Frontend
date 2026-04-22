import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';
const OG_FALLBACK = 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await globalThis.fetch(`${API_BASE}/api/v1/collections/by-slug/${encodeURIComponent(slug)}`);
		if (!res.ok) return { seo: null };
		const data = await res.json();
		const collection = data.collection;
		if (!collection) return { seo: null };

		const name = collection.name || 'Collection';
		const rawDesc = (collection.description || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
		const description = rawDesc.slice(0, 160) || `Explore ${name} — a curated collection of events on Rondwell`;
		const image = collection.coverBannerUrl || collection.profilePictureUrl || OG_FALLBACK;
		const url = `https://rondwell.com/c/${slug}`;
		const events = data.events ?? [];
		const eventCount = events.length;
		const subscriberCount = collection.subscriberCount ?? 0;

		const socialDescription = [rawDesc.slice(0, 100), eventCount > 0 ? `📅 ${eventCount} event${eventCount !== 1 ? 's' : ''}` : '', subscriberCount > 0 ? `👥 ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ').slice(0, 200) || description;

		const eventItems = events.slice(0, 10).map((e: any, i: number) => ({
			"@type": "ListItem", "position": i + 1,
			"item": { "@type": "Event", "name": e.title || 'Event', "url": e.customLinkSlug ? `https://rondwell.com/e/${e.customLinkSlug}` : `https://rondwell.com/event-page/${e._id}`, ...(e.startDateTime ? { "startDate": new Date(e.startDateTime).toISOString() } : {}), "eventStatus": "https://schema.org/EventScheduled" }
		}));

		const jsonLd = {
			"@context": "https://schema.org", "@type": "CollectionPage", "name": name, "description": description, "url": url, "image": image,
			"publisher": { "@type": "Organization", "name": "Rondwell", "url": "https://rondwell.com" },
			"mainEntity": { "@type": "ItemList", "name": name, "numberOfItems": eventCount, "itemListElement": eventItems }
		};

		return { seo: { title: `${name} | Rondwell`, description: socialDescription, image, url, eventCount, subscriberCount, jsonLd } };
	} catch (err) {
		console.error('[SEO] c/[slug] load failed:', err);
		return { seo: null };
	}
};
