/**
 * Per-entity SEO builders.
 *
 * Each builder takes the raw public API payload and returns a fully-formed
 * SeoMeta object (clean description, optimised share image, canonical URL and
 * JSON-LD). Server load functions stay tiny and every page emits identical,
 * WhatsApp-safe metadata.
 */

import { SITE } from './config';
import type { SeoMeta } from './types';
import { buildDescription, canonical, ogImageType, resolveOgImage, stripHtml, truncate } from './utils';

const titleOf = (name: string) => `${name} | ${SITE.name}`;

/** Resolve a share image and its true MIME type from the first non-empty source. */
function pickImage(...candidates: Array<string | null | undefined>): { image: string; imageType: string } {
	const source = candidates.find((c) => c && String(c).trim());
	const image = resolveOgImage(source);
	const imageType = ogImageType(image) || SITE.defaultImageType;
	return { image, imageType };
}

/* ───────────────────────────── Event ───────────────────────────── */

export function buildEventSeo(event: any, canonicalPath: string, _attendeeCount = 0): SeoMeta {
	const title = event.title || 'Event';
	const rawDesc = stripHtml(event.description);
	const url = canonical(canonicalPath);
	const { image, imageType } = pickImage(event.coverPictureUrl, event.displayPictureUrl);

	const eventType = event.eventType || 'PHYSICAL';
	const registrationType = event.registrationType || 'FREE';

	const startDt = event.startDateTime ? new Date(event.startDateTime) : null;
	const startDate = startDt ? startDt.toISOString() : '';
	const endDate = event.endDateTime ? new Date(event.endDateTime).toISOString() : '';
	const dateLabel = startDt
		? startDt.toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			})
		: '';
	const timeLabel = startDt
		? startDt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
		: '';

	const physical = event.locationDetails?.physical;
	const virtual = event.locationDetails?.virtual;
	const locationLabel =
		physical?.venueName ||
		physical?.resolvedAddress?.formatted_address ||
		(eventType === 'VIRTUAL' ? virtual?.platform || 'Online' : 'TBD');

	const description = buildDescription(
		rawDesc,
		[dateLabel, timeLabel, registrationType === 'FREE' ? 'Free entry' : 'Paid entry', locationLabel],
		`Join ${title} on ${SITE.name}`
	);

	// ── JSON-LD (schema.org/Event) ──
	let locationSchema: unknown = null;
	if (eventType === 'VIRTUAL' || eventType === 'HYBRID') {
		locationSchema = { '@type': 'VirtualLocation', url: virtual?.meetingLink || url };
	}
	if (eventType === 'PHYSICAL' || eventType === 'HYBRID') {
		const place: Record<string, unknown> = {
			'@type': 'Place',
			name: physical?.venueName || 'Venue',
			address: physical?.resolvedAddress?.formatted_address || physical?.venueAddress || ''
		};
		if (physical?.resolvedAddress?.lat && physical?.resolvedAddress?.lng) {
			place.geo = {
				'@type': 'GeoCoordinates',
				latitude: physical.resolvedAddress.lat,
				longitude: physical.resolvedAddress.lng
			};
		}
		locationSchema =
			eventType === 'HYBRID'
				? [place, { '@type': 'VirtualLocation', url: virtual?.meetingLink || url }]
				: place;
	}

	const jsonLd: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: title,
		description: truncate(rawDesc, 160) || description,
		image: [image],
		url,
		eventStatus:
			event.eventStatus === 'CANCELLED'
				? 'https://schema.org/EventCancelled'
				: 'https://schema.org/EventScheduled',
		eventAttendanceMode:
			eventType === 'VIRTUAL'
				? 'https://schema.org/OnlineEventAttendanceMode'
				: eventType === 'HYBRID'
					? 'https://schema.org/MixedEventAttendanceMode'
					: 'https://schema.org/OfflineEventAttendanceMode',
		organizer: {
			'@type': 'Organization',
			name: event.eventOrganizerName || SITE.name,
			url: SITE.url
		},
		offers: {
			'@type': 'Offer',
			url,
			availability: 'https://schema.org/InStock',
			...(registrationType === 'FREE' ? { price: '0', priceCurrency: 'USD' } : {})
		}
	};
	if (startDate) jsonLd.startDate = startDate;
	if (endDate) jsonLd.endDate = endDate;
	if (locationSchema) jsonLd.location = locationSchema;

	return {
		title: titleOf(title),
		description,
		image,
		imageType,
		url,
		ogType: 'article',
		imageAlt: title,
		event: { startDate, endDate, location: locationLabel },
		jsonLd
	};
}

/* ─────────────────────────── Collection ─────────────────────────── */

export function buildCollectionSeo(collection: any, events: any[], slug: string): SeoMeta {
	const name = collection.name || 'Collection';
	const rawDesc = stripHtml(collection.description);
	const url = canonical(`/c/${slug}`);
	const { image, imageType } = pickImage(collection.coverBannerUrl, collection.profilePictureUrl);

	const eventCount = events.length;
	const subscriberCount = collection.subscriberCount ?? 0;

	const description = buildDescription(
		rawDesc,
		[
			eventCount > 0 ? `${eventCount} event${eventCount !== 1 ? 's' : ''}` : '',
			subscriberCount > 0 ? `${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}` : ''
		],
		`Explore ${name} -- a curated collection of events on ${SITE.name}`
	);

	const eventItems = events.slice(0, 10).map((e: any, i: number) => ({
		'@type': 'ListItem',
		position: i + 1,
		item: {
			'@type': 'Event',
			name: e.title || 'Event',
			url: e.customLinkSlug
				? canonical(`/e/${e.customLinkSlug}`)
				: canonical(`/event-page/${e._id}`),
			...(e.startDateTime ? { startDate: new Date(e.startDateTime).toISOString() } : {}),
			eventStatus: 'https://schema.org/EventScheduled'
		}
	}));

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name,
		description: truncate(rawDesc, 160) || description,
		url,
		image,
		publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
		mainEntity: {
			'@type': 'ItemList',
			name,
			numberOfItems: eventCount,
			itemListElement: eventItems
		}
	};

	return { title: titleOf(name), description, image, imageType, url, ogType: 'website', imageAlt: name, jsonLd };
}

/* ───────────────────────────── Vendor ───────────────────────────── */

export function buildVendorSeo(vendor: any, products: any[], slug: string): SeoMeta {
	const name = vendor.businessName || vendor.name || 'Vendor';
	const rawDesc = stripHtml(vendor.businessDescription || vendor.bio);
	const url = canonical(`/v/${slug}`);
	const { image, imageType } = pickImage(vendor.coverImageUrl, vendor.logoUrl, vendor.profilePictureUrl);
	const productCount = products.length;

	const description = buildDescription(
		rawDesc,
		[
			vendor.businessType || '',
			vendor.businessLocation || '',
			productCount > 0 ? `${productCount} product${productCount !== 1 ? 's' : ''}` : ''
		],
		`Explore ${name} -- a vendor on ${SITE.name}`
	);

	const productItems = products.slice(0, 10).map((p: any, i: number) => ({
		'@type': 'ListItem',
		position: i + 1,
		item: {
			'@type': 'Product',
			name: p.productName || 'Product',
			url: p.slug ? canonical(`/v/${slug}/${p.slug}`) : url,
			...(p.description ? { description: truncate(stripHtml(p.description), 100) } : {})
		}
	}));

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name,
		description: truncate(rawDesc, 160) || description,
		url,
		image,
		...(vendor.businessLocation ? { address: vendor.businessLocation } : {}),
		...(vendor.contactInfo?.website ? { sameAs: [vendor.contactInfo.website] } : {}),
		publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
		...(productCount > 0
			? {
					makesOffer: {
						'@type': 'ItemList',
						name: `Products by ${name}`,
						numberOfItems: productCount,
						itemListElement: productItems
					}
				}
			: {})
	};

	return { title: titleOf(name), description, image, imageType, url, ogType: 'website', imageAlt: name, jsonLd };
}

/* ───────────────────────────── Speaker ───────────────────────────── */

export function buildSpeakerSeo(speaker: any, portfolios: any[], slug: string): SeoMeta {
	const name = speaker.fullName || speaker.name || 'Speaker';
	const rawDesc = stripHtml(speaker.speakerBio || speaker.bio);
	const url = canonical(`/s/${slug}`);
	const { image, imageType } = pickImage(speaker.profilePhotoUrl, speaker.profilePictureUrl);
	const portfolioCount = portfolios.length;

	const description = buildDescription(
		rawDesc,
		[
			speaker.expertise || '',
			speaker.title || '',
			portfolioCount > 0 ? `${portfolioCount} portfolio item${portfolioCount !== 1 ? 's' : ''}` : ''
		],
		`${name} -- Speaker on ${SITE.name}`
	);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name,
		description: truncate(rawDesc, 160) || description,
		image,
		url,
		...(speaker.title ? { jobTitle: speaker.title } : {}),
		...(speaker.affiliation
			? { worksFor: { '@type': 'Organization', name: speaker.affiliation } }
			: {}),
		...(speaker.expertise ? { knowsAbout: speaker.expertise } : {})
	};

	return { title: titleOf(name), description, image, imageType, url, ogType: 'profile', imageAlt: name, jsonLd };
}

/* ──────────────────────────── Exhibitor ──────────────────────────── */

export function buildExhibitorSeo(exhibitor: any, booths: any[], slug: string): SeoMeta {
	const name = exhibitor.companyName || exhibitor.name || 'Exhibitor';
	const rawDesc = stripHtml(exhibitor.companyDescription || exhibitor.bio);
	const url = canonical(`/x/${slug}`);
	const { image, imageType } = pickImage(
		exhibitor.coverImageUrl,
		exhibitor.logoUrl,
		exhibitor.digitalBoothCoverImageUrl,
		exhibitor.profilePictureUrl
	);
	const boothCount = booths.length;

	const description = buildDescription(
		rawDesc,
		[
			exhibitor.industry || '',
			exhibitor.businessLocation || '',
			boothCount > 0 ? `${boothCount} booth${boothCount !== 1 ? 's' : ''}` : ''
		],
		`${name} -- Exhibitor on ${SITE.name}`
	);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name,
		description: truncate(rawDesc, 160) || description,
		image,
		url,
		...(exhibitor.industry ? { knowsAbout: exhibitor.industry } : {}),
		...(exhibitor.businessLocation ? { address: exhibitor.businessLocation } : {}),
		publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url }
	};

	return { title: titleOf(name), description, image, imageType, url, ogType: 'website', imageAlt: name, jsonLd };
}

/* ─────────────────────── Vendor product (detail) ─────────────────────── */

export function buildProductSeo(product: any, vendor: any, vendorSlug: string, productSlug: string): SeoMeta {
	const name = product.productName || 'Product';
	const vendorName = vendor?.businessName || vendor?.name || 'Vendor';
	const rawDesc = stripHtml(product.description);
	const url = canonical(`/v/${vendorSlug}/${productSlug}`);
	const { image, imageType } = pickImage(product.media?.[0]?.url, vendor?.coverImageUrl);

	const description = buildDescription(
		rawDesc,
		[`By ${vendorName}`, product.pricingType === 'CUSTOM_QUOTE' ? 'Custom quote' : ''],
		`${name} by ${vendorName} on ${SITE.name}`
	);

	const jsonLd: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name,
		description: truncate(rawDesc, 160) || description,
		image,
		url,
		brand: { '@type': 'Organization', name: vendorName }
	};
	if (product.price) {
		jsonLd.offers = {
			'@type': 'Offer',
			url,
			priceCurrency: product.currency || 'USD',
			price: String(product.price?.$numberDecimal || product.price),
			availability: 'https://schema.org/InStock'
		};
	}

	return {
		title: `${name} - ${vendorName} | ${SITE.name}`,
		description,
		image,
		imageType,
		url,
		ogType: 'website',
		imageAlt: name,
		jsonLd
	};
}

/* ───────────────────── Speaker portfolio (detail) ───────────────────── */

export function buildPortfolioSeo(portfolio: any, speaker: any, speakerSlug: string, portfolioSlug: string): SeoMeta {
	const title = portfolio.title || 'Portfolio';
	const speakerName = speaker?.fullName || speaker?.name || 'Speaker';
	const rawDesc = stripHtml(portfolio.description);
	const url = canonical(`/s/${speakerSlug}/${portfolioSlug}`);
	const { image, imageType } = pickImage(portfolio.media?.[0]?.url, speaker?.profilePhotoUrl);

	const description = buildDescription(
		rawDesc,
		[`By ${speakerName}`, portfolio.category || ''],
		`${title} by ${speakerName} on ${SITE.name}`
	);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		name: title,
		description: truncate(rawDesc, 160) || description,
		image,
		url,
		author: { '@type': 'Person', name: speakerName },
		...(portfolio.category ? { genre: portfolio.category } : {})
	};

	return {
		title: `${title} - ${speakerName} | ${SITE.name}`,
		description,
		image,
		imageType,
		url,
		ogType: 'article',
		imageAlt: title,
		jsonLd
	};
}

/* ───────────────────── Exhibitor booth (detail) ───────────────────── */

export function buildBoothSeo(booth: any, exhibitor: any, exhibitorSlug: string, boothSlug: string): SeoMeta {
	const title = booth.title || 'Digital Booth';
	const exhibitorName = exhibitor?.companyName || exhibitor?.name || 'Exhibitor';
	const rawDesc = stripHtml(booth.description);
	const url = canonical(`/x/${exhibitorSlug}/${boothSlug}`);
	const { image, imageType } = pickImage(booth.bannerUrl, booth.media?.[0]?.url, exhibitor?.coverImageUrl);

	const description = buildDescription(
		rawDesc,
		[`By ${exhibitorName}`],
		`${title} by ${exhibitorName} on ${SITE.name}`
	);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'ExhibitionEvent',
		name: title,
		description: truncate(rawDesc, 160) || description,
		image,
		url,
		organizer: { '@type': 'Organization', name: exhibitorName }
	};

	return {
		title: `${title} - ${exhibitorName} | ${SITE.name}`,
		description,
		image,
		imageType,
		url,
		ogType: 'website',
		imageAlt: title,
		jsonLd
	};
}
