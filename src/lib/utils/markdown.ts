/**
 * Lightweight, dependency-free Markdown → HTML renderer.
 *
 * Purpose-built for rendering AI-generated analytics summaries and chat
 * answers (headings, bold/italic, bullet & numbered lists, inline code,
 * links, blockquotes, horizontal rules). The output is meant to be dropped
 * into a container styled with Tailwind's `prose` classes.
 *
 * SECURITY: the source is treated as UNTRUSTED. All raw text is HTML-escaped
 * BEFORE any Markdown tokens are converted, so no author-supplied HTML can
 * reach the DOM. Only the tags this renderer emits are ever produced.
 */

function escapeHtml(input: string): string {
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Convert inline Markdown (bold, italic, code, links) on an already-escaped string. */
function renderInline(escaped: string): string {
	let t = escaped;

	// Inline code first so its contents aren't touched by other rules.
	t = t.replace(/`([^`]+?)`/g, '<code>$1</code>');

	// Bold: **text** or __text__
	t = t.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
	t = t.replace(/__([^_]+?)__/g, '<strong>$1</strong>');

	// Italic: *text* or _text_ (single markers, not part of a bold run)
	t = t.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
	t = t.replace(/(^|[^_])_([^_\s][^_]*?)_(?!_)/g, '$1<em>$2</em>');

	// Links: [label](https://url) — only http(s) is allowed.
	t = t.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
	);

	return t;
}

/**
 * Render a Markdown string to sanitized HTML.
 */
export function renderMarkdown(source: string | null | undefined): string {
	if (!source) return '';

	// Normalise line endings and escape everything up front.
	const lines = escapeHtml(source.replace(/\r\n/g, '\n')).split('\n');

	const html: string[] = [];
	let listType: 'ul' | 'ol' | null = null;
	let paragraph: string[] = [];

	const closeList = () => {
		if (listType) {
			html.push(`</${listType}>`);
			listType = null;
		}
	};

	const flushParagraph = () => {
		if (paragraph.length) {
			html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
			paragraph = [];
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		const trimmed = line.trim();

		// Blank line — paragraph / list break.
		if (trimmed === '') {
			flushParagraph();
			closeList();
			continue;
		}

		// Horizontal rule.
		if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
			flushParagraph();
			closeList();
			html.push('<hr />');
			continue;
		}

		// Headings: #, ##, ###, ...
		const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
		if (heading) {
			flushParagraph();
			closeList();
			const level = heading[1].length;
			html.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
			continue;
		}

		// Blockquote.
		const quote = trimmed.match(/^&gt;\s?(.*)$/);
		if (quote) {
			flushParagraph();
			closeList();
			html.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
			continue;
		}

		// Ordered list item: "1. text"
		const ordered = trimmed.match(/^\d+[.)]\s+(.*)$/);
		if (ordered) {
			flushParagraph();
			if (listType !== 'ol') {
				closeList();
				html.push('<ol>');
				listType = 'ol';
			}
			html.push(`<li>${renderInline(ordered[1])}</li>`);
			continue;
		}

		// Unordered list item: "- text", "* text", "• text"
		const unordered = trimmed.match(/^([-*•])\s+(.*)$/);
		if (unordered) {
			flushParagraph();
			if (listType !== 'ul') {
				closeList();
				html.push('<ul>');
				listType = 'ul';
			}
			html.push(`<li>${renderInline(unordered[2])}</li>`);
			continue;
		}

		// Plain text — accumulate into the current paragraph.
		closeList();
		paragraph.push(trimmed);
	}

	flushParagraph();
	closeList();

	return html.join('\n');
}
