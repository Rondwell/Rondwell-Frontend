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

/**
 * Share-image rendering contract.
 *
 * Every og:image is served through the Netlify Image CDN at exactly these
 * dimensions and format. Because the output size is fixed and guaranteed, we
 * can declare og:image:width/height truthfully — which is what lets WhatsApp
 * render a large preview without first downloading the file to measure it.
 *
 * 1200x630 (1.91:1) is the cross-platform standard: WhatsApp, Facebook,
 * LinkedIn, X and iMessage all render it as a full-width card. Switching to a
 * square card is a one-line change here — everything else derives from it.
 */
export const OG_IMAGE = {
	width: 1200,
	height: 630,
	/** Output format. JPEG is universally decodable; WebP support is patchy on older WhatsApp builds. */
	format: 'jpg',
	mime: 'image/jpeg',
	/** Quality tuned to land a 1200x630 photo well under WhatsApp's 600 KB ceiling. */
	quality: 78
} as const;
