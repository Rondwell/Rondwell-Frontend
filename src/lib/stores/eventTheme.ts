import { browser } from '$app/environment';
import { resolveTheme, type Color } from '$lib/utils/colors';
import type { ThemeFont } from '$lib/utils/themeFonts';
import { writable } from 'svelte/store';

const STORAGE_KEY = 'rondwell_event_themes';

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

// Store: map of eventId -> Color
export const eventThemes = writable<Record<string, Color>>(loadThemes());

// Save to localStorage on every change
eventThemes.subscribe((themes) => {
	saveThemes(themes);
});

/** Set the theme for a specific event */
export function setEventTheme(eventId: string, color: Color) {
	eventThemes.update((themes) => ({ ...themes, [eventId]: color }));
}

/**
 * Get the theme for a specific event (falls back to the default theme).
 *
 * The cache stores whole Color objects, so the entry is re-resolved BY NAME
 * against the current palette. Without this a visitor who once saw a theme
 * kept its cached copy forever — including palettes that have since been
 * retired ("White Black") or had their tokens retuned.
 */
export function getEventTheme(eventId: string): Color {
	const themes = loadThemes();
	return resolveTheme(themes[eventId]?.name);
}

/** Whether a cached theme exists for this event (used to avoid a default flash). */
export function hasCachedEventTheme(eventId: string): boolean {
	return Boolean(loadThemes()[eventId]?.name);
}

// Active event-page theme — used by the main layout to apply colors when on event-page routes
export const activeEventPageTheme = writable<Color | null>(null);

// Active event-page font pairing — set by the event page once its data loads.
export const activeEventPageFont = writable<ThemeFont | null>(null);
