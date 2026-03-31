import { writable } from 'svelte/store';

// Maps eventId -> slug for URL rewriting on event page sub-pages
export const eventSlugMap = writable<Record<string, string>>({});

export function setEventSlug(eventId: string, slug: string) {
	eventSlugMap.update((m) => ({ ...m, [eventId]: slug }));
}

export function getEventSlugPath(eventId: string, subPath: string = ''): string {
	// This is used reactively via the store in components
	// For non-reactive usage, use the store directly
	return subPath ? `/event-page/${eventId}/${subPath}` : `/event-page/${eventId}`;
}
