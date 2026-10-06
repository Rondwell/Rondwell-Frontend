export interface Color {
	/**
	 * Stable identifier AND display name. Events, collections and gift links
	 * persist their theme by this name, so it must never change once shipped.
	 */
	name: string;
	bg: string;
	text: string;
	lightText: string;
	cover: string;
	smallCover: string;
	toggle: string;
	button: string;
	buttonText: string;
	/**
	 * Optional layered CSS `background` painted OVER `bg` on full-page
	 * surfaces (event page, create page, collection page). Premium themes use
	 * it for gradients and the light-ray artwork; flat themes leave it unset.
	 *
	 * It is never parsed or concatenated. Components append hex alpha to the
	 * tokens above (`{bg}CC`, `{button}40`), so every token above MUST stay a
	 * 6-digit hex value — anything richer belongs here.
	 */
	backdrop?: string;
	/** CSS background for the picker swatch. Defaults to `backdrop`, then `bg`. */
	swatch?: string;
	/** Browser chrome (status bar / URL bar) tint. Defaults to `bg`. */
	chrome?: string;
	/** Lets components choose overlays that read on light vs dark themes. */
	scheme?: 'light' | 'dark';
}

/**
 * Event / collection theme palettes.
 *
 * Field roles (used consistently across event page, collection page, cards):
 * - bg:         full page background (flat fallback under `backdrop`).
 * - cover:      card / section surface (kept subtly deeper than `bg` for layering).
 * - smallCover: nested surface (avatars, chips, icon buttons).
 * - toggle:     borders, dividers, segmented-control track.
 * - text:       headings + strong text — deep & saturated so it POPS on `cover`.
 * - lightText:  body / secondary text — a muted-but-readable tone (~5:1+ contrast
 *               on `cover`).
 * - button:     primary CTA fill.
 * - buttonText: CTA label (contrast-checked against `button`, WCAG AA).
 *
 * Order matters only for display: `colors[0]` is the default everywhere.
 * Never index into this array by position — use `DEFAULT_THEME` or
 * `resolveTheme(name)`; positions change when palettes are added.
 */
export const DEFAULT_THEME_NAME = 'Default';

export const colors: Color[] = [
	{
		/**
		 * The premium default — the same look as the exhibitor, speaker and
		 * vendor onboarding pages: near-white cards and ink-black type over the
		 * pastel light-ray artwork (`/exhibitor-bg.png`, re-encoded as WebP for
		 * the web). It replaces the plain "White Black" theme, whose tokens it
		 * reuses; the CSS gradient under the image paints instantly while the
		 * artwork loads.
		 */
		name: DEFAULT_THEME_NAME,
		bg: '#F2F4F6',
		text: '#141414',
		lightText: '#5C5C5C',
		cover: '#FBFAF9',
		smallCover: '#F2F1EF',
		toggle: '#E6E3E0',
		button: '#171717',
		buttonText: '#FFFFFF',
		backdrop:
			"url('/themes/default-light-rays.webp') center / cover no-repeat, radial-gradient(120% 70% at 50% 100%, rgba(253, 238, 234, 0.95) 0%, rgba(249, 230, 243, 0.8) 35%, rgba(242, 234, 246, 0.45) 60%, rgba(242, 244, 246, 0) 82%), #F2F4F6",
		swatch:
			'linear-gradient(165deg, #F2F4F6 0%, #F2F4F6 40%, #F8E4F3 62%, #FDEEEA 78%, #EFE6F8 100%)',
		scheme: 'light'
	},
	{
		/**
		 * Brand theme (light) — Rondwell's orchid → indigo glow from the
		 * invitation pages and the homepage hero, on a blush base, with the
		 * brand indigo as the call to action.
		 */
		name: 'Orchid',
		bg: '#FCF3F9',
		text: '#2A1033',
		lightText: '#6B4E73',
		cover: '#FFFFFF',
		smallCover: '#F8EAF5',
		toggle: '#EDD3E8',
		button: '#513BE2',
		buttonText: '#FFFFFF',
		backdrop:
			'radial-gradient(60% 50% at 0% 0%, rgba(231, 126, 231, 0.34) 0%, rgba(231, 126, 231, 0) 70%), radial-gradient(55% 45% at 100% 100%, rgba(81, 59, 226, 0.22) 0%, rgba(81, 59, 226, 0) 70%), radial-gradient(40% 35% at 72% 16%, rgba(255, 195, 124, 0.22) 0%, rgba(255, 195, 124, 0) 70%), #FCF3F9',
		swatch: 'linear-gradient(135deg, #F1BDEB 0%, #FCF3F9 52%, #D6CFFB 100%)',
		scheme: 'light'
	},
	{
		/**
		 * Brand theme (dark) — a deep indigo night lit by the brand magenta and
		 * indigo, for concerts, galas and evening events.
		 */
		name: 'Midnight',
		bg: '#0E0B1E',
		text: '#F5F3FF',
		lightText: '#C3BCE6',
		cover: '#191430',
		smallCover: '#241D45',
		toggle: '#352C5E',
		button: '#C42FB2',
		buttonText: '#FFFFFF',
		backdrop:
			'radial-gradient(70% 55% at 0% 0%, rgba(219, 62, 198, 0.3) 0%, rgba(219, 62, 198, 0) 70%), radial-gradient(65% 55% at 100% 100%, rgba(81, 59, 226, 0.42) 0%, rgba(81, 59, 226, 0) 70%), radial-gradient(45% 40% at 55% 45%, rgba(150, 61, 212, 0.16) 0%, rgba(150, 61, 212, 0) 70%), #0E0B1E',
		swatch: 'linear-gradient(135deg, #4A1A5E 0%, #0E0B1E 55%, #2B2380 100%)',
		scheme: 'dark'
	},
	{
		name: 'Light Rose',
		bg: '#FDEEEE',
		text: '#6E3B3A',
		lightText: '#8A5856',
		cover: '#F9E6E3',
		smallCover: '#F2DAD6',
		toggle: '#E7C5C2',
		button: '#C53635',
		buttonText: '#FFFFFF',
		scheme: 'light'
	},
	{
		name: 'Sky Blue',
		bg: '#EBF6FF',
		text: '#344A86',
		lightText: '#4E5F94',
		cover: '#E1EDF9',
		smallCover: '#D6E5F4',
		toggle: '#C1D4EA',
		button: '#2C6CD5',
		buttonText: '#FFFFFF',
		scheme: 'light'
	},
	{
		name: 'Pale Green',
		bg: '#EDF9EB',
		text: '#355035',
		lightText: '#4C6A4B',
		cover: '#E3F0E1',
		smallCover: '#D8E8D6',
		toggle: '#C2D8C0',
		button: '#2F8326',
		buttonText: '#FFFFFF',
		scheme: 'light'
	},
	{
		name: 'Pale Pink',
		bg: '#FFEEF3',
		text: '#7C3A50',
		lightText: '#97546B',
		cover: '#FAE4EB',
		smallCover: '#F4D8E1',
		toggle: '#EAC3D0',
		button: '#C32C68',
		buttonText: '#FFFFFF',
		scheme: 'light'
	},
	{
		name: 'Light Apricot',
		bg: '#FFF3E1',
		text: '#74441F',
		lightText: '#8C5C30',
		cover: '#FAEAD6',
		smallCover: '#F4DEC8',
		toggle: '#E8CDB1',
		button: '#AA5C00',
		buttonText: '#FFFFFF',
		scheme: 'light'
	},
	{
		name: 'pastel purple',
		bg: '#FBF1FF',
		text: '#5A3771',
		lightText: '#714A8A',
		cover: '#F1E6F8',
		smallCover: '#E8D9F1',
		toggle: '#D9C7E5',
		button: '#9051B2',
		buttonText: '#FFFFFF',
		scheme: 'light'
	},
	{
		name: 'Coffee Brown',
		bg: '#3A1F04',
		text: '#F2EBE2',
		lightText: '#CBBBA8',
		cover: '#4A2E13',
		smallCover: '#5A3B20',
		toggle: '#6E5238',
		button: '#F6EFE6',
		buttonText: '#4A2E13',
		scheme: 'dark'
	}
];

/** The default theme. Use this instead of `colors[0]`. */
export const DEFAULT_THEME: Color = colors[0];

/**
 * Stored values that no longer name a palette, mapped to their replacement.
 * Keys are lower-cased. "White Black" (the retired black & white theme) and
 * its page colour become the premium Default, which reuses its tokens.
 */
const LEGACY_THEME_ALIASES: Record<string, string> = {
	'white black': DEFAULT_THEME_NAME,
	'black white': DEFAULT_THEME_NAME,
	'white & black': DEFAULT_THEME_NAME,
	'black & white': DEFAULT_THEME_NAME,
	monochrome: DEFAULT_THEME_NAME,
	'#ffffff': DEFAULT_THEME_NAME,
	'#fff': DEFAULT_THEME_NAME
};

/**
 * Find the palette a stored value refers to: a name (any case), a legacy
 * alias, or a palette's `bg` hex (collections historically stored hex).
 * Returns `null` when nothing matches.
 */
export function findTheme(value: string | null | undefined): Color | null {
	if (!value) return null;
	const needle = String(value).trim().toLowerCase();
	if (!needle) return null;
	const target = (LEGACY_THEME_ALIASES[needle] ?? needle).toLowerCase();
	return colors.find((c) => c.name.toLowerCase() === target || c.bg.toLowerCase() === target) ?? null;
}

/** `findTheme`, falling back to the default theme. */
export function resolveTheme(value: string | null | undefined): Color {
	return findTheme(value) ?? DEFAULT_THEME;
}

/** CSS `background` for a full-page surface (backdrop over the flat colour). */
export function themeBackground(color: Color): string {
	return color.backdrop ?? color.bg;
}

/** CSS `background` for a picker swatch. */
export function themeSwatch(color: Color): string {
	return color.swatch ?? color.backdrop ?? color.bg;
}

/** Browser chrome tint for a theme. */
export function themeChrome(color: Color): string {
	return color.chrome ?? color.bg;
}
