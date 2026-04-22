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

		// ── Build SEO data ──────────────────────────────────────────────

		const name = collection.name || 'Collection';
		const rawDesc = collection.description?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '';
		const description = rawDesc.slice(0, 160) || `Explore ${name} — a curated collection of events on Rondwell`;
		const image = collection.coverBannerUrl || collection.profilePictureUrl || 'https://rondwell.com/og-default.png';
		const url = `https://rondwell.com/c/${slug}`;
		const events = data.events ?? [];
		const eventCount = events.length;
		const subscriberCount = collection.subscriberCount ?? 0;
		const organizer = collection.organizerName || 'Rondwell';

		// Build richer description for social sharing
		const socialDescription = [
			rawDesc.slice(0, 100),
			eventCount > 0 ? `📅 ${eventCount} event${eventCount !== 1 ? 's' : ''}` : '',
			subscriberCount > 0 ? `👥 ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}` : '',
		].filter(Boolean).join(' · ').slice(0, 200) || description;

		// ── JSON-LD: CollectionPage + ItemList of events ────────────────

		const eventItems = events.slice(0, 10).map((e: any, i: number) => {
			const eventUrl = e.customLinkSlug
				? `https://rondwell.com/e/${e.customLinkSlug}`
				: `https://rondwell.com/event-page/${e._id}`;
			return {
				"@type": "ListItem",
				"position": i + 1,
				"item": {
					"@type": "Event",
					"name": e.title || 'Event',
					"url": eventUrl,
					...(e.startDateTime ? { "startDate": new Date(e.startDateTime).toISOString() } : {}),
					...(e.endDateTime ? { "endDate": new Date(e.endDateTime).toISOString() } : {}),
					...(e.displayPictureUrl || e.coverPictureUrl ? { "image": e.displayPictureUrl || e.coverPictureUrl } : {}),
					"eventAttendanceMode": e.eventType === 'VIRTUAL'
						? "https://schema.org/OnlineEventAttendanceMode"
						: e.eventType === 'HYBRID'
							? "https://schema.org/MixedEventAttendanceMode"
							: "https://schema.org/OfflineEventAttendanceMode",
					"eventStatus": "https://schema.org/EventScheduled",
				}
			};
		});

		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			"name": name,
			"description": description,
			"url": url,
			"image": image,
			"publisher": {
				"@type": "Organization",
				"name": "Rondwell",
				"url": "https://rondwell.com",
			},
			"mainEntity": {
				"@type": "ItemList",
				"name": name,
				"numberOfItems": eventCount,
				"itemListElement": eventItems,
			},
		};

		return {
			seo: {
				title: `${name} | Rondwell`,
				description: socialDescription,
				image,
				url,
				organizer,
				eventCount,
				subscriberCount,
				jsonLd,
			}
		};
	} catch {
		return { seo: null };
	}
};
