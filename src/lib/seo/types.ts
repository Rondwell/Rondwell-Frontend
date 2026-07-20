/**
 * The single shape consumed by the <Seo> component.
 *
 * Every page produces one of these in its server load. Keeping one flat,
 * explicit contract means the rendered <head> is always complete and identical
 * across events, collections, vendors, speakers and exhibitors.
 */
export interface SeoMeta {
	/** Full <title> and og:title. Already includes the " | Rondwell" suffix. */
	title: string;
	/** Clean, emoji-free meta description / og:description. */
	description: string;
	/** WhatsApp/OG-safe absolute image URL (1200x630 JPEG). */
	image: string;
	/** Absolute canonical URL of the page. */
	url: string;
	/** og:type — "website", "article", "profile", etc. Defaults to "website". */
	ogType?: string;
	/** Alt text for the share image. Defaults to the title. */
	imageAlt?: string;
	/** Set true to emit noindex/nofollow. */
	noindex?: boolean;
	/** Optional event-specific facets rendered as extra meta tags. */
	event?: {
		startDate?: string;
		endDate?: string;
		location?: string;
	};
	/** JSON-LD structured data object (serialised into a script tag). */
	jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
}
