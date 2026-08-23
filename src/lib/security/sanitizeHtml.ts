import DOMPurify from 'dompurify';

/**
 * C-09 — the single HTML sanitizer for every user-content `{@html}` sink.
 *
 * Before this, **no HTML sanitizer existed in the frontend at all** — no
 * `dompurify`, `sanitize-html` or `xss` anywhere in `package.json` — while four
 * `{@html}` sinks rendered stored user content directly:
 *
 *   - `event-page/[id]/+page.svelte`         `ticket.description`, `event.description`
 *   - `event-page/[id]/community/+page.svelte` `selectedPost.content`
 *   - `c/[slug]/+page.svelte`                `collection.description`
 *
 * Backend sanitizers existed for some write paths but not all of them, and a
 * write-path sanitizer cannot protect content that was stored before it
 * shipped, or content that reached the database by another route. Sanitizing
 * at the sink is what makes the guarantee hold regardless.
 *
 * Because both auth tokens live in `localStorage` with a 30-day sliding
 * refresh, any XSS here is **persistent account takeover, not session
 * hijack** — which is why the allow-list below is strict rather than
 * permissive.
 *
 * SSR note
 * --------
 * DOMPurify needs a DOM. During SSR there is none, so we fall back to
 * `toPlainText` — dropping formatting rather than emitting unsanitized markup.
 * Rich text renders on hydration. Failing closed is the only safe direction:
 * the JSON-LD sink (`safeJsonLd`) is the one that MUST work server-side, and it
 * is pure string escaping precisely so it does not depend on a DOM.
 */

/**
 * Tags a description or post may use. Deliberately excludes every element that
 * can execute or navigate implicitly: `script`, `style`, `iframe`, `object`,
 * `embed`, `form`, `input`, `svg`, `math`.
 */
const ALLOWED_TAGS = [
	'p', 'br', 'hr', 'span', 'div',
	'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup', 'mark', 'small',
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'ul', 'ol', 'li',
	'blockquote', 'pre', 'code',
	'a',
	'img',
	'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'
];

/**
 * No `style` (CSS can exfiltrate via `background: url()` and can overlay the
 * page for clickjacking), and no `on*` — DOMPurify strips event handlers
 * regardless, but an allow-list makes that explicit rather than implicit.
 */
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'colspan', 'rowspan'];

let hooksInstalled = false;

function installHooks(): void {
	if (hooksInstalled) return;
	if (typeof window === 'undefined') return;

	/**
	 * Every outbound link is `noopener noreferrer`.
	 *
	 * `target="_blank"` without `noopener` hands the opened page a `window.opener`
	 * reference it can navigate — reverse tabnabbing. Applied here rather than
	 * asked of each author, because "remember to add rel" is not a control.
	 */
	DOMPurify.addHook('afterSanitizeAttributes', (node) => {
		if (node instanceof Element && node.tagName === 'A' && node.hasAttribute('href')) {
			node.setAttribute('rel', 'noopener noreferrer');
			if (node.getAttribute('target')) node.setAttribute('target', '_blank');
		}
	});

	hooksInstalled = true;
}

/**
 * Strip tags without a DOM. Used only on the SSR path.
 *
 * Note the deliberate absence of an entity decode: decoding `&lt;`/`&gt;` back
 * to raw brackets is exactly the defect C-09 route 2 describes in
 * `lib/seo/utils.ts` — a "strip" that reconstructs the payload.
 */
function ssrFallbackToText(input: string): string {
	return input
		.replace(/<[^>]*>/g, ' ')
		.replace(/[<>]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Sanitize stored rich text for rendering through `{@html}`.
 *
 * ALWAYS use this. A bare `{@html userContent}` anywhere in this codebase is a
 * bug.
 */
export function sanitizeHtml(input?: string | null): string {
	if (!input) return '';

	if (typeof window === 'undefined') {
		return ssrFallbackToText(input);
	}

	installHooks();

	return DOMPurify.sanitize(input, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
		// An allow-list, not a deny-list. The community service's sanitizer used
		// a deny-list and `<a href="&#106;avascript:alert(1)">` survived it —
		// along with `\x01javascript:`, `blob:` and `filesystem:`. DOMPurify
		// resolves entities before matching, so the encoded form cannot slip
		// past this the way it did there.
		ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
		// Defence in depth — these are not in ALLOWED_TAGS anyway.
		FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'svg', 'math'],
		FORBID_ATTR: ['style', 'srcset', 'formaction', 'form'],
		// `<svg>`/`<math>` parsing is a recurring mXSS source and no user content
		// here needs them.
		USE_PROFILES: { html: true },
		KEEP_CONTENT: true
	});
}

/**
 * Plain-text conversion for attributes, meta tags and previews — anywhere
 * markup is not wanted at all.
 */
export function toPlainText(input?: string | null): string {
	if (!input) return '';
	if (typeof window === 'undefined') return ssrFallbackToText(input);
	installHooks();
	return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [], KEEP_CONTENT: true })
		.replace(/\s+/g, ' ')
		.trim();
}
