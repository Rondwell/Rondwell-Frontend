import { browser } from '$app/environment';
import { colors, type Color } from '$lib/utils/colors';
import { writable } from 'svelte/store';

const STORAGE_KEY = 'rondwell_collection_themes';

function loadThemes(): Record<string, Color> {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function saveThemes(themes: Record<string, Color>) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export const collectionThemes = writable<Record<string, Color>>(loadThemes());

collectionThemes.subscribe((themes) => {
	saveThemes(themes);
});

/** Set the theme for a specific collection */
export function setCollectionTheme(collectionId: string, color: Color) {
	collectionThemes.update((themes) => ({ ...themes, [collectionId]: color }));
}

/** Get the theme for a specific collection (falls back to first color) */
export function getCollectionTheme(collectionId: string): Color {
	const themes = loadThemes();
	return themes[collectionId] ?? colors[0];
}

/**
 * Resolve a themeColor value (could be a color name like "Pale Pink" or a hex like "#EBF6FF")
 * to a proper Color object from the colors array.
 */
export function resolveCollectionThemeColor(themeColor: string | undefined): Color {
	if (!themeColor) return colors[0];
	const match = colors.find(
		(c) =>
			c.name.toLowerCase() === themeColor.toLowerCase() ||
			c.bg.toLowerCase() === themeColor.toLowerCase()
	);
	return match ?? colors[0];
}
