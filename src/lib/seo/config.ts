/**
 * Site-wide SEO configuration.
 *
 * Central source of truth for canonical origins, social handles and the
 * Open Graph image contract. Every SEO builder and the <Seo> component read
 * from here so the whole platform stays consistent.
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
	 * Already sized/optimised for social cards.
	 */
	defaultImage:
		'https://res.cloudinary.com/dksfuytfd/image/upload/f_jpg,q_auto:good,c_fill,g_auto,w_1200,h_630/v1747893120/Rodwell_uedn7l.png'
} as const;

/**
 * Open Graph image contract.
 *
 * 1200x630 is the universally supported "large card" ratio (1.91:1) used by
 * WhatsApp, Facebook, LinkedIn, iMessage, Telegram and X.
 *
 * WhatsApp is the strictest consumer: it silently drops preview images that
 * are too large or whose declared type does not match the bytes. We therefore
 * force JPEG at an automatically-tuned quality so the file stays well under
 * WhatsApp's practical preview ceiling (~300 KB) while matching the declared
 * `og:image:type`.
 */
export const OG_IMAGE = {
	width: 1200,
	height: 630,
	type: 'image/jpeg'
} as const;
