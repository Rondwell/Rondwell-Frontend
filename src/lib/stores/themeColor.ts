import { browser } from '$app/environment';
import type { Color } from '$lib/utils/colors';
import { writable } from 'svelte/store';

// Default brand color — matches the webmanifest theme_color
const DEFAULT_THEME_COLOR = '#ffffff';

/**
 * Reactive store that controls the browser chrome color
 * (status bar, URL bar, notification panel on mobile).
 *
 * Set this from any page/layout to tint the browser UI.
 * It updates the <meta name="theme-color"> tag in real time.
 *
 * ── Scalable theming pattern ────────────────────────────────────────────────
 * Every themed surface (event page, collection page, marketing page, …) should
 * push a SINGLE representative background colour into this store. The subscriber
 * below fans that colour out to *all* the browser-chrome surfaces we can reach:
 *   • <meta name="theme-color">              → Android status/notification bar + URL bar
 *   • <meta name="msapplication-navbutton-color"> → legacy Edge/IE tiles
 *   • :root { --theme-chrome }               → any in-app chrome (bottom nav bar,
 *                                              safe-area fillers, etc.) reads this,
 *                                              so it always matches automatically.
 *
 * Because everything flows from one colour, adding a brand-new palette to
 * `colors.ts` needs ZERO extra wiring — pages just resolve their `Color` and
 * call `applyThemeColor(color)` (or push `color.bg` into this store).
 */
export const themeColor = writable<string>(DEFAULT_THEME_COLOR);

// Keep the meta tags + CSS variable in sync whenever the store changes
if (browser) {
	themeColor.subscribe((color) => {
		const meta = document.getElementById('theme-color-meta') as HTMLMetaElement | null;
		if (meta) {
			meta.setAttribute('content', color);
		}

		// Also update the msapplication-navbutton-color for Edge
		const msMeta = document.querySelector(
			'meta[name="msapplication-navbutton-color"]'
		) as HTMLMetaElement | null;
		if (msMeta) {
			msMeta.setAttribute('content', color);
		}

		// Expose to CSS so in-app chrome (bottom nav, safe-area fillers) can
		// adapt to the exact same colour without any prop drilling.
		document.documentElement.style.setProperty('--theme-chrome', color);
	});
}

/**
 * Apply a theme colour to every browser-chrome surface.
 *
 * Accepts either a raw hex string or a palette `Color` object (in which case
 * its `bg` field — the full-page background — is used, matching what the user
 * actually sees behind the notification bar).
 */
export function applyThemeColor(color: string | Color) {
	const value = typeof color === 'string' ? color : color.bg;
	themeColor.set(value);
}

/** Reset the theme color back to the default brand color */
export function resetThemeColor() {
	themeColor.set(DEFAULT_THEME_COLOR);
}
