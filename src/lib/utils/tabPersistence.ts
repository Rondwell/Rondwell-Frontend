/**
 * Helpers for persisting the active inner tab of a page in the URL query string
 * so the selection survives a page refresh.
 *
 * Usage in a Svelte page that manages its own tab state:
 *
 *   import { getPersistedTab, persistTab } from '$lib/utils/tabPersistence';
 *
 *   let activeTab = getPersistedTab(['analytics', 'ai'], 'analytics');
 *   // on tab click:
 *   const setTab = (tab: string) => { activeTab = tab; persistTab(tab); };
 */

/**
 * Reads the persisted tab from the URL query string. Returns the fallback when
 * running on the server, when the param is missing, or when the value isn't a
 * recognised tab id.
 */
export function getPersistedTab(validTabs: string[], fallback: string, key = 'tab'): string {
	if (typeof window === 'undefined') return fallback;
	const param = new URLSearchParams(window.location.search).get(key);
	return param && validTabs.includes(param) ? param : fallback;
}

/**
 * Writes the active tab to the URL query string without triggering a navigation
 * or adding a new history entry.
 */
export function persistTab(tab: string, key = 'tab'): void {
	if (typeof window === 'undefined') return;
	const url = new URL(window.location.href);
	url.searchParams.set(key, tab);
	window.history.replaceState(window.history.state, '', url.toString());
}
