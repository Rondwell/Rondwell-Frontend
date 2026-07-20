/**
 * Site-wide SEO configuration.
 *
 * Central source of truth for canonical origins, social handles and the
 * default share image. Every SEO builder and the <Seo> component read from
 * here so the whole platform stays consistent.
 */

export const SITE = {
	/** Canonical public origin (no trailing slash). */
	url: 'https://rondwell.com',
	/** Backend API origin used by server load functions. */
	api: 'https://api.rondwell.com',
	name: 'Rondwell',
	twitter: '@rondwellhq',
	locale: 'en_US',
	/**
	 * Default share image used when an entity has no artwork of its own.
	 * Self-hosted so it never depends on a third-party image host.
	 */
	defaultImage: 'https://rondwell.com/events.png',
	defaultImageType: 'image/png'
} as const;
