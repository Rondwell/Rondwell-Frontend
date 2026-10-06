import { browser } from '$app/environment';

/**
 * Event page fonts.
 *
 * Each option is a PAIRING: a `display` face for the event title and section
 * headings, and a `body` face for everything else. Expressive faces (script,
 * poster, wide display) are only ever used for headings and are paired with a
 * readable body face; text-friendly faces are used for both.
 *
 * All faces are open-licensed Google Fonts, loaded on demand — only the
 * selected pairing is fetched on a public event page, and the picker loads the
 * rest only when its Font tab opens. The `id` is what events persist, so it
 * must never change once shipped.
 *
 * Note: the previous picker listed commercial faces (Alverata, Roc Grotesk,
 * Ivy Mode, …) that were never loaded or saved — choosing one changed nothing
 * on the live page. These replace them.
 */
export interface ThemeFont {
	id: string;
	label: string;
	/** One or two words describing the mood, shown under the sample. */
	vibe: string;
	/** CSS font-family stack for the title and headings. */
	display: string;
	/** CSS font-family stack for body text. */
	body: string;
	/** Google Fonts css2 `family=` values; empty for the app's built-in face. */
	families: string[];
}

const SANS_FALLBACK = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const SERIF_FALLBACK = "Georgia, 'Times New Roman', serif";
const APP_SANS = `'Merriweather Sans', ${SANS_FALLBACK}`;

export const DEFAULT_FONT_ID = 'default';

export const themeFonts: ThemeFont[] = [
	{
		id: DEFAULT_FONT_ID,
		label: 'Default',
		vibe: 'Clean',
		display: APP_SANS,
		body: APP_SANS,
		// Already loaded app-wide by app.css.
		families: []
	},
	{
		id: 'jakarta',
		label: 'Jakarta',
		vibe: 'Modern',
		display: `'Plus Jakarta Sans', ${SANS_FALLBACK}`,
		body: `'Plus Jakarta Sans', ${SANS_FALLBACK}`,
		families: ['Plus+Jakarta+Sans:wght@400;500;600;700;800']
	},
	{
		id: 'playfair',
		label: 'Playfair',
		vibe: 'Elegant',
		display: `'Playfair Display', ${SERIF_FALLBACK}`,
		body: APP_SANS,
		families: ['Playfair+Display:wght@500;600;700;800']
	},
	{
		id: 'fraunces',
		label: 'Fraunces',
		vibe: 'Editorial',
		display: `'Fraunces', ${SERIF_FALLBACK}`,
		body: `'Fraunces', ${SERIF_FALLBACK}`,
		families: ['Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700']
	},
	{
		id: 'space-grotesk',
		label: 'Space Grotesk',
		vibe: 'Tech',
		display: `'Space Grotesk', ${SANS_FALLBACK}`,
		body: `'Space Grotesk', ${SANS_FALLBACK}`,
		families: ['Space+Grotesk:wght@400;500;600;700']
	},
	{
		id: 'nunito',
		label: 'Nunito',
		vibe: 'Friendly',
		display: `'Nunito', ${SANS_FALLBACK}`,
		body: `'Nunito', ${SANS_FALLBACK}`,
		families: ['Nunito:wght@400;500;600;700;800']
	},
	{
		id: 'geist-mono',
		label: 'Geist Mono',
		vibe: 'Minimal',
		display: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
		body: `'Geist', ${SANS_FALLBACK}`,
		families: ['Geist+Mono:wght@400;500;600;700', 'Geist:wght@400;500;600;700']
	},
	{
		id: 'bebas',
		label: 'Bebas Neue',
		vibe: 'Poster',
		display: `'Bebas Neue', 'Arial Narrow', ${SANS_FALLBACK}`,
		body: APP_SANS,
		families: ['Bebas+Neue']
	},
	{
		id: 'great-vibes',
		label: 'Great Vibes',
		vibe: 'Romantic',
		display: "'Great Vibes', 'Brush Script MT', cursive",
		body: APP_SANS,
		families: ['Great+Vibes']
	},
	{
		id: 'unbounded',
		label: 'Unbounded',
		vibe: 'Statement',
		display: `'Unbounded', ${SANS_FALLBACK}`,
		body: APP_SANS,
		families: ['Unbounded:wght@400;500;600;700']
	}
];

export const DEFAULT_FONT: ThemeFont = themeFonts[0];

/** The font an id refers to (case-insensitive), or the default. */
export function resolveThemeFont(id: string | null | undefined): ThemeFont {
	if (!id) return DEFAULT_FONT;
	const needle = String(id).trim().toLowerCase();
	return themeFonts.find((f) => f.id === needle) ?? DEFAULT_FONT;
}

/** Google Fonts stylesheet URL for a font, or `null` for the built-in face. */
export function themeFontHref(font: ThemeFont): string | null {
	if (font.families.length === 0) return null;
	const query = font.families.map((f) => `family=${f}`).join('&');
	return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

/**
 * Inline style declaring the pairing as CSS variables. Elements inside a
 * `.theme-scope` use them (see app.css), so one wrapper themes a whole page.
 */
export function themeFontStyle(font: ThemeFont): string {
	return `--theme-font-display: ${font.display}; --theme-font-body: ${font.body};`;
}

/**
 * Load a font's stylesheet once (client only). The browser downloads the
 * font FILES lazily, only for faces actually rendered, so loading several
 * stylesheets for picker previews costs little.
 */
export function ensureThemeFontLoaded(font: ThemeFont): void {
	if (!browser) return;
	const href = themeFontHref(font);
	if (!href) return;
	if (document.head.querySelector(`link[data-theme-font="${font.id}"]`)) return;
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = href;
	link.dataset.themeFont = font.id;
	document.head.appendChild(link);
}
