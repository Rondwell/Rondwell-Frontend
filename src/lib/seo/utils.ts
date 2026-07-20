/**
 * Shared SEO primitives used by every server-side SEO builder.
 */

import { SITE } from './config';

/**
 * Strip HTML tags, decode a few common entities and collapse whitespace so a
 * rich-text description becomes clean plain text suitable for a meta tag.
 */
export function stripHtml(input?: string | null): string {
	if (!input) return '';
	return input
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Truncate to `max` characters on a word boundary, without a trailing ellipsis. */
export function truncate(text: string, max: number): string {
	const t = text.trim();
	if (t.length <= max) return t;
	const cut = t.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * Resolve a usable share-image URL.
 *
 * We pass the source image through unchanged (S3, or wherever it lives) and
 * only substitute the self-hosted default when there is nothing usable. The
 * URL must be absolute and https so crawlers can fetch it.
 */
export function resolveOgImage(url?: string | null): string {
	if (!url || typeof url !== 'string') return SITE.defaultImage;
	const trimmed = url.trim();
	if (!trimmed) return SITE.defaultImage;
	// Protocol-relative or root-relative → make absolute against the site.
	if (trimmed.startsWith('//')) return `https:${trimmed}`;
	if (trimmed.startsWith('/')) return `${SITE.url}${trimmed}`;
	// Upgrade bare http to https; crawlers require secure image URLs.
	if (trimmed.startsWith('http://')) return `https://${trimmed.slice('http://'.length)}`;
	if (!trimmed.startsWith('https://')) return SITE.defaultImage;
	return trimmed;
}

/**
 * Derive the correct `og:image:type` MIME from a URL's file extension.
 *
 * Declaring the *true* type matters: Facebook/WhatsApp reject a share image
 * when the declared type does not match the actual bytes (e.g. claiming JPEG
 * for a PNG), which is what makes previews fall back to a generic logo.
 *
 * Returns an empty string when the type cannot be determined, in which case
 * the tag is omitted rather than guessed.
 */
export function ogImageType(url: string): string {
	// Ignore query/hash, then read the extension.
	const path = url.split(/[?#]/)[0].toLowerCase();
	const ext = path.slice(path.lastIndexOf('.') + 1);
	switch (ext) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'png':
			return 'image/png';
		case 'webp':
			return 'image/webp';
		case 'gif':
			return 'image/gif';
		default:
			return '';
	}
}

/**
 * Build a neat, emoji-free social description.
 *
 * Format: "<lead sentence> -- <detail> | <detail> | <detail>"
 *   - The lead text is separated from the metadata by a double dash " -- ".
 *   - Metadata facts are separated by a pipe " | ".
 */
export function buildDescription(
	lead: string,
	facts: Array<string | false | null | undefined>,
	fallback = '',
	max = 200
): string {
	const cleanLead = truncate(stripHtml(lead), 110);
	const cleanFacts = facts.filter((f): f is string => Boolean(f && String(f).trim()));

	let out = cleanLead;
	if (cleanFacts.length) {
		const factLine = cleanFacts.join(' | ');
		out = cleanLead ? `${cleanLead} -- ${factLine}` : factLine;
	}

	out = out.trim();
	if (!out) out = fallback;
	return truncate(out, max);
}

/** Absolute canonical URL for a given path (path should start with "/"). */
export function canonical(path: string): string {
	return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}
