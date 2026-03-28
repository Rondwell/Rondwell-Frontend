import type { PageServerLoad } from './$types';

const EVENT_URL = process.env.VITE_EVENT_API_URL || 'http://localhost:3000';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { id } = params;
	try {
		const res = await fetch(`${EVENT_URL}/api/v1/events/${id}/public`);
		if (!res.ok) return { seo: null };
		const data = await res.json();
		const event = data.event;
		if (!event) return { seo: null };

		const title = event.title || 'Event';
		const description = event.description?.replace(/<[^>]*>/g, '').slice(0, 160) || `Join ${title} on Rondwell`;
		const image = event.coverPictureUrl || event.displayPictureUrl || 'https://rondwell.com/og-default.png';
		const url = event.customLinkSlug
			? `https://rondwell.com/${event.customLinkSlug}`
			: `https://rondwell.com/event-page/${id}`;

		const startDate = event.startDateTime ? new Date(event.startDateTime).toISOString() : '';
		const endDate = event.endDateTime ? new Date(event.endDateTime).toISOString() : '';
		const location = event.locationDetails?.physical?.venueName
			|| event.locationDetails?.virtual?.platform
			|| 'Online';
		const organizer = event.eventOrganizerName || 'Rondwell';

		return {
			seo: {
				title: `${title} | Rondwell`,
				description,
				image,
				url,
				type: 'website',
				event: {
					name: title,
					startDate,
					endDate,
					location,
					organizer,
					eventType: event.eventType,
					registrationType: event.registrationType,
				}
			}
		};
	} catch {
		return { seo: null };
	}
};
