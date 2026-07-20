/**
 * Shared SEO primitives used by every server-side SEO builder.
 *
 * The two most important functions here are:
 *  - optimizeOgImage(): guarantees a WhatsApp-safe share image
 *  - buildDescription(): builds a clean, emoji-free social description
 */

import { OG_IMAGE, SITE } from './config';

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
 * Turn a raw image URL into a WhatsApp/OG-safe share image.
 *
 * For Cloudinary-hosted images we inject an on-the-fly transformation that
 * resizes to the OG contract (1200x630), crops intelligently, forces JPEG and
 * auto-tunes quality. This keeps the file small enough for WhatsApp to render
 * and makes the declared `og:image:type` truthful.
 *
 * Non-Cloudinary URLs are returned untouched (we cannot safely transform them);
 * empty/missing URLs fall back to the site default share image.
 */
export function optimizeOgImage(url?: string | null): string {
	if (!url || typeof url !== 'string') return SITE.defaultImage;

	const trimmed = url.trim();
	if (!trimmed) return SITE.defaultImage;

	// Only Cloudinary delivery URLs can be transformed via URL params.
	const marker = '/image/upload/';
	const idx = trimmed.indexOf(marker);
	if (!trimmed.includes('res.cloudinary.com') || idx === -1) {
		return trimmed;
	}

	const prefix = trimmed.slice(0, idx + marker.length);
	let rest = trimmed.slice(idx + marker.length);

	// If a transformation is already present as the first path segment, drop it
	// so we do not stack conflicting directives.
	const firstSeg = rest.split('/')[0] ?? '';
	const looksLikeTransform = /(^|,)(f_|q_|c_|g_|w_|h_|dpr_|e_|b_)/.test(firstSeg);
	if (looksLikeTransform) {
		rest = rest.slice(firstSeg.length + 1);
	}

	const transform = `f_jpg,q_auto:good,c_fill,g_auto,w_${OG_IMAGE.width},h_${OG_IMAGE.height}`;
	return `${prefix}${transform}/${rest}`;
}

/**
 * Build a neat, emoji-free social description.
 *
 * Format: "<lead sentence> -- <detail> | <detail> | <detail>"
 *   - The lead text is separated from the metadata by a double dash " -- ".
 *   - Metadata facts are separated by a pipe " | ".
 *
 * Falls back to the lead text (or a provided fallback) when there are no facts.
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
