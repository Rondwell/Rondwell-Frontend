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
		const rawDesc = event.description?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '';
		const description = rawDesc.slice(0, 160) || `Join ${title} on Rondwell`;
		const image = event.coverPictureUrl || event.displayPictureUrl || 'https://rondwell.com/og-default.png';
		const url = event.customLinkSlug
			? `https://rondwell.com/e/${event.customLinkSlug}`
			: `https://rondwell.com/event-page/${id}`;
		const startDate = event.startDateTime ? new Date(event.startDateTime).toISOString() : '';
		const endDate = event.endDateTime ? new Date(event.endDateTime).toISOString() : '';
		const organizer = event.eventOrganizerName || 'Rondwell';

		// Build location schema
		const physical = event.locationDetails?.physical;
		const virtual = event.locationDetails?.virtual;
		let locationSchema: any = null;
		if (event.eventType === 'VIRTUAL' || event.eventType === 'HYBRID') {
			locationSchema = { "@type": "VirtualLocation", "url": virtual?.meetingLink || url };
		}
		if (event.eventType === 'PHYSICAL' || event.eventType === 'HYBRID') {
			const placeSchema = {
				"@type": "Place",
				"name": physical?.venueName || 'Venue',
				"address": physical?.resolvedAddress?.formatted_address || physical?.venueAddress || ''
			};
			locationSchema = event.eventType === 'HYBRID'
				? [placeSchema, { "@type": "VirtualLocation", "url": virtual?.meetingLink || url }]
				: placeSchema;
		}

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
					location: physical?.venueName || virtual?.platform || 'Online',
					organizer,
					eventType: event.eventType,
					registrationType: event.registrationType,
				},
				jsonLd: {
					"@context": "https://schema.org",
					"@type": "Event",
					"name": title,
					"description": description,
					"image": [image],
					"startDate": startDate,
					"endDate": endDate,
					"eventStatus": "https://schema.org/EventScheduled",
					"eventAttendanceMode": event.eventType === 'VIRTUAL'
						? "https://schema.org/OnlineEventAttendanceMode"
						: event.eventType === 'HYBRID'
							? "https://schema.org/MixedEventAttendanceMode"
							: "https://schema.org/OfflineEventAttendanceMode",
					...(locationSchema ? { "location": locationSchema } : {}),
					"organizer": { "@type": "Organization", "name": organizer, "url": "https://rondwell.com" },
					"offers": {
						"@type": "Offer",
						"url": url,
						"availability": "https://schema.org/InStock",
						"price": event.registrationType === 'FREE' ? "0" : undefined,
						"priceCurrency": event.registrationType === 'FREE' ? "USD" : undefined,
					},
					"url": url,
				}
			}
		};
	} catch {
		return { seo: null };
	}
};
