import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Default brand color — matches the webmanifest theme_color
const DEFAULT_THEME_COLOR = '#ffffff';

/**
 * Reactive store that controls the browser chrome color
 * (status bar, URL bar, notification panel on mobile).
 *
 * Set this from any page/layout to tint the browser UI.
 * It updates the <meta name="theme-color"> tag in real time.
 */
export const themeColor = writable<string>(DEFAULT_THEME_COLOR);

// Keep the meta tag in sync whenever the store changes
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
	});
}

/** Reset the theme color back to the default brand color */
export function resetThemeColor() {
	themeColor.set(DEFAULT_THEME_COLOR);
}
