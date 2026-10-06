import { browser } from '$app/environment';
import { resolveTheme, type Color } from '$lib/utils/colors';
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

/**
 * Get the theme for a specific collection (falls back to the default theme).
 *
 * The cache holds whole Color objects, so it is re-resolved BY NAME: a cached
 * copy of a retired palette ("White Black") or of old token values would
 * otherwise keep rendering forever.
 */
export function getCollectionTheme(collectionId: string): Color {
	const themes = loadThemes();
	return resolveTheme(themes[collectionId]?.name);
}

/**
 * Resolve a themeColor value (a palette name like "Pale Pink", a legacy name,
 * or a hex like "#EBF6FF") to a palette from the colors array.
 */
export function resolveCollectionThemeColor(themeColor: string | undefined): Color {
	return resolveTheme(themeColor);
}
