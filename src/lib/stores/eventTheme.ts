import { browser } from '$app/environment';
import { colors, type Color } from '$lib/utils/colors';
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

/** Get the theme for a specific event (falls back to first color) */
export function getEventTheme(eventId: string): Color {
	const themes = loadThemes();
	return themes[eventId] ?? colors[0];
}

// Active event-page theme — used by the main layout to apply colors when on event-page routes
export const activeEventPageTheme = writable<Color | null>(null);
