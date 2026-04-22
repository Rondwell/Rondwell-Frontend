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

		// ── Build SEO data ──────────────────────────────────────────────

		const title = event.title || 'Event';
		const rawDesc = event.description?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '';
		const description = rawDesc.slice(0, 160) || `Join ${title} on Rondwell`;
		const image = event.coverPictureUrl || event.displayPictureUrl || 'https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png';
		const slug = event.customLinkSlug;
		const url = slug ? `https://rondwell.com/e/${slug}` : `https://rondwell.com/event-page/${id}`;
		const startDate = event.startDateTime ? new Date(event.startDateTime).toISOString() : '';
		const endDate = event.endDateTime ? new Date(event.endDateTime).toISOString() : '';
		const organizer = event.eventOrganizerName || 'Rondwell';
		const category = event.category || '';
		const registrationType = event.registrationType || 'FREE';
		const eventType = event.eventType || 'PHYSICAL';
		const timeZone = event.timeZone || '';

		// Human-readable date/time for social sharing
		const startDt = event.startDateTime ? new Date(event.startDateTime) : null;
		const dateLabel = startDt
			? startDt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
			: '';
		const timeLabel = startDt
			? startDt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: timeZone || undefined })
			: '';

		// Richer description for social cards
		const socialDescription = [
			rawDesc.slice(0, 100),
			dateLabel ? `📅 ${dateLabel}` : '',
			timeLabel ? `🕐 ${timeLabel}` : '',
			registrationType === 'FREE' ? '🎟️ Free' : '🎟️ Paid',
		].filter(Boolean).join(' · ').slice(0, 200) || description;

		// ── Location schema ─────────────────────────────────────────────

		const physical = event.locationDetails?.physical;
		const virtual = event.locationDetails?.virtual;
		let locationSchema: any = null;

		if (eventType === 'VIRTUAL' || eventType === 'HYBRID') {
			locationSchema = { "@type": "VirtualLocation", "url": virtual?.meetingLink || url };
		}
		if (eventType === 'PHYSICAL' || eventType === 'HYBRID') {
			const placeSchema: any = {
				"@type": "Place",
				"name": physical?.venueName || 'Venue',
				"address": {
					"@type": "PostalAddress",
					"streetAddress": physical?.venueAddress || physical?.resolvedAddress?.formatted_address || '',
				}
			};
			if (physical?.resolvedAddress?.lat && physical?.resolvedAddress?.lng) {
				placeSchema.geo = {
					"@type": "GeoCoordinates",
					"latitude": physical.resolvedAddress.lat,
					"longitude": physical.resolvedAddress.lng,
				};
			}
			locationSchema = eventType === 'HYBRID'
				? [placeSchema, { "@type": "VirtualLocation", "url": virtual?.meetingLink || url }]
				: placeSchema;
		}

		// ── Event status ────────────────────────────────────────────────

		const statusMap: Record<string, string> = {
			'LIVE': 'https://schema.org/EventScheduled',
			'CANCELLED': 'https://schema.org/EventCancelled',
			'ENDED': 'https://schema.org/EventScheduled',
			'ARCHIVED': 'https://schema.org/EventScheduled',
		};
		const eventStatusSchema = statusMap[event.eventStatus] || 'https://schema.org/EventScheduled';

		// ── JSON-LD ─────────────────────────────────────────────────────

		const jsonLd: any = {
			"@context": "https://schema.org",
			"@type": "Event",
			"name": title,
			"description": description,
			"image": [image],
			"url": url,
			"eventStatus": eventStatusSchema,
			"eventAttendanceMode": eventType === 'VIRTUAL'
				? "https://schema.org/OnlineEventAttendanceMode"
				: eventType === 'HYBRID'
					? "https://schema.org/MixedEventAttendanceMode"
					: "https://schema.org/OfflineEventAttendanceMode",
			"organizer": {
				"@type": "Organization",
				"name": organizer,
				"url": "https://rondwell.com"
			},
		};

		if (startDate) jsonLd.startDate = startDate;
		if (endDate) jsonLd.endDate = endDate;
		if (locationSchema) jsonLd.location = locationSchema;

		// Ticket types as offers
		const ticketTypes = data.ticketTypes;
		if (ticketTypes && ticketTypes.length > 0) {
			jsonLd.offers = ticketTypes.map((t: any) => ({
				"@type": "Offer",
				"name": t.name,
				"url": url,
				"price": t.price != null ? String(t.price) : "0",
				"priceCurrency": t.currency || "USD",
				"availability": t.quantityAvailable > 0
					? "https://schema.org/InStock"
					: "https://schema.org/SoldOut",
				"validFrom": t.salesStartDate || startDate,
			}));
		} else {
			jsonLd.offers = {
				"@type": "Offer",
				"url": url,
				"availability": event.registrationOpen !== false
					? "https://schema.org/InStock"
					: "https://schema.org/SoldOut",
				...(registrationType === 'FREE' ? { "price": "0", "priceCurrency": "USD" } : {}),
			};
		}

		const locationLabel = physical?.venueName
			|| physical?.resolvedAddress?.formatted_address
			|| (eventType === 'VIRTUAL' ? (virtual?.platform || 'Online') : 'TBD');

		return {
			seo: {
				title: `${title} | Rondwell`,
				description: socialDescription,
				image,
				url,
				organizer,
				startDate,
				endDate,
				dateLabel,
				timeLabel,
				eventType,
				registrationType,
				category,
				location: locationLabel,
				attendeeCount: data.attendeeCount ?? 0,
				jsonLd,
			}
		};
	} catch {
		return { seo: null };
	}
};
