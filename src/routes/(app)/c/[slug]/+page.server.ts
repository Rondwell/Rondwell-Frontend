import type { PageServerLoad } from './$types';

const EVENT_URL = process.env.VITE_EVENT_API_URL || 'http://localhost:3000';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { slug } = params;
	if (!slug) return { seo: null };

	try {
		const res = await fetch(
			`${EVENT_URL}/api/v1/collections/by-slug/${encodeURIComponent(slug)}`
		);
		if (!res.ok) return { seo: null };
		const data = await res.json();
		const collection = data.collection;
		if (!collection) return { seo: null };

		const name = collection.name || 'Collection';
		const rawDesc = collection.description?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '';
		const description = rawDesc.slice(0, 160) || `Explore ${name} — a curated collection of events on Rondwell`;
		const image = collection.coverBannerUrl || collection.profilePictureUrl || 'https://rondwell.com/og-default.png';
		const url = `https://rondwell.com/c/${slug}`;
		const eventCount = data.events?.length ?? 0;
		const organizer = collection.organizerName || 'Rondwell';

		return {
			seo: {
				title: `${name} | Rondwell`,
				description,
				image,
				url,
				type: 'website',
				collection: {
					name,
					organizer,
					eventCount,
					subscriberCount: collection.subscriberCount ?? 0,
				}
			}
		};
	} catch {
		return { seo: null };
	}
};
