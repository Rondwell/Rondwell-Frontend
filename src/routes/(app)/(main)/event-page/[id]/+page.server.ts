import type { PageServerLoad } from './$types';

const API_BASE = 'https://api.rondwell.com';
const OG_FALLBACK = 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;
	const EVENT_URL = API_BASE;
	try {
		const res = await globalThis.fetch(`${EVENT_URL}/api/v1/events/${id}/public`);
		if (!res.ok) return { seo: null };
		const data = await res.json();
		const event = data.event;
		if (!event) return { seo: null };

		const title = event.title || 'Event';
		const rawDesc = (event.description || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
		const description = rawDesc.slice(0, 160) || `Join ${title} on Rondwell`;
		const image = event.coverPictureUrl || event.displayPictureUrl || OG_FALLBACK;
		const slug = event.customLinkSlug;
		const url = slug ? `https://rondwell.com/e/${slug}` : `https://rondwell.com/event-page/${id}`;
		const startDate = event.startDateTime ? new Date(event.startDateTime).toISOString() : '';
		const endDate = event.endDateTime ? new Date(event.endDateTime).toISOString() : '';
		const organizer = event.eventOrganizerName || 'Rondwell';
		const registrationType = event.registrationType || 'FREE';
		const eventType = event.eventType || 'PHYSICAL';

		const startDt = event.startDateTime ? new Date(event.startDateTime) : null;
		const dateLabel = startDt ? startDt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';
		const timeLabel = startDt ? startDt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

		const socialDescription = [rawDesc.slice(0, 100), dateLabel ? `📅 ${dateLabel}` : '', timeLabel ? `🕐 ${timeLabel}` : '', registrationType === 'FREE' ? '🎟️ Free' : '🎟️ Paid'].filter(Boolean).join(' · ').slice(0, 200) || description;

		const physical = event.locationDetails?.physical;
		const virtual = event.locationDetails?.virtual;
		let locationSchema: any = null;
		if (eventType === 'VIRTUAL' || eventType === 'HYBRID') locationSchema = { "@type": "VirtualLocation", "url": virtual?.meetingLink || url };
		if (eventType === 'PHYSICAL' || eventType === 'HYBRID') {
			const place: any = { "@type": "Place", "name": physical?.venueName || 'Venue', "address": physical?.resolvedAddress?.formatted_address || physical?.venueAddress || '' };
			if (physical?.resolvedAddress?.lat && physical?.resolvedAddress?.lng) place.geo = { "@type": "GeoCoordinates", "latitude": physical.resolvedAddress.lat, "longitude": physical.resolvedAddress.lng };
			locationSchema = eventType === 'HYBRID' ? [place, { "@type": "VirtualLocation", "url": virtual?.meetingLink || url }] : place;
		}
		const locationLabel = physical?.venueName || physical?.resolvedAddress?.formatted_address || (eventType === 'VIRTUAL' ? (virtual?.platform || 'Online') : 'TBD');

		const jsonLd: any = {
			"@context": "https://schema.org", "@type": "Event", "name": title, "description": description, "image": [image], "url": url,
			"eventStatus": event.eventStatus === 'CANCELLED' ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
			"eventAttendanceMode": eventType === 'VIRTUAL' ? "https://schema.org/OnlineEventAttendanceMode" : eventType === 'HYBRID' ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
			"organizer": { "@type": "Organization", "name": organizer, "url": "https://rondwell.com" },
			"offers": { "@type": "Offer", "url": url, "availability": "https://schema.org/InStock", ...(registrationType === 'FREE' ? { "price": "0", "priceCurrency": "USD" } : {}) },
		};
		if (startDate) jsonLd.startDate = startDate;
		if (endDate) jsonLd.endDate = endDate;
		if (locationSchema) jsonLd.location = locationSchema;

		return { seo: { title: `${title} | Rondwell`, description: socialDescription, image, url, organizer, startDate, endDate, dateLabel, timeLabel, eventType, registrationType, location: locationLabel, attendeeCount: data.attendeeCount ?? 0, jsonLd } };
	} catch (err) {
		console.error('[SEO] event-page/[id] load failed:', err);
		return { seo: null };
	}
};
