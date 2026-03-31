import type { PageServerLoad } from './$types';

const EVENT_URL = process.env.VITE_EVENT_API_URL || 'http://localhost:3000';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { slug } = params;
	if (!slug) return { eventId: null, seo: null };

	try {
		const res = await fetch(`${EVENT_URL}/api/v1/events/by-slug/${encodeURIComponent(slug)}`);
		if (!res.ok) return { eventId: null, seo: null };
		const data = await res.json();
		const eventId = data.event?._id || data.event?.id || data.eventId;
		if (!eventId) return { eventId: null, seo: null };

		// Fetch full event data for SEO
		const eventRes = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/public`);
		let seo = null;
		if (eventRes.ok) {
			const eventData = await eventRes.json();
			const event = eventData.event;
			if (event) {
				const title = event.title || 'Event';
				const description = event.description?.replace(/<[^>]*>/g, '').slice(0, 160) || `Join ${title} on Rondwell`;
				const image = event.coverPictureUrl || event.displayPictureUrl || 'https://rondwell.com/og-default.png';
				seo = {
					title: `${title} | Rondwell`,
					description,
					image,
					url: `https://rondwell.com/e/${slug}`,
					organizer: event.eventOrganizerName || 'Rondwell',
					startDate: event.startDateTime ? new Date(event.startDateTime).toISOString() : '',
				};
			}
		}

		return { eventId, seo };
	} catch {
		return { eventId: null, seo: null };
	}
};
