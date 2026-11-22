import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { themeChrome, type Color } from '$lib/utils/colors';

/** Default chrome hex used for neutral/marketing fallback routes. */
export const DEFAULT_THEME_COLOR = '#ffffff';

function isDarkHex(hex: string): boolean {
	const cleaned = hex.trim().replace('#', '');
	if (cleaned.length !== 3 && cleaned.length !== 6) return false;
	const full =
		cleaned.length === 3
			? cleaned
					.split('')
					.map((c) => c + c)
					.join('')
			: cleaned;
	const r = parseInt(full.slice(0, 2), 16);
	const g = parseInt(full.slice(2, 4), 16);
	const b = parseInt(full.slice(4, 6), 16);
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
	// Relative luminance threshold (WCAG W3C)
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance < 0.45;
}

/**
 * Deterministic route-to-chrome color table matching `src/app.html` pre-hydration logic
 * so SSR initial load and client-side SvelteKit transitions stay visually seamless.
 */
export function resolveRouteDefaultChrome(pathname: string): string {
	const path = (pathname || '/').split('?')[0];
	if (path === '/' || path === '') return '#FBDBE7';
	if (path.startsWith('/discover')) return '#e6e6fa';
	if (path.startsWith('/pricing') || path.startsWith('/help-center')) return '#f5efec';
	if (path.startsWith('/faq') || path.startsWith('/terms') || path.startsWith('/privacy')) return '#F4F5F6';
	if (path.startsWith('/marketplace')) return '#f8f5ff';
	if (path.startsWith('/intro')) return '#070614';
	if (path.startsWith('/create-event')) return '#f4f5f6';
	if (path.startsWith('/vendor') || path.startsWith('/v/')) return '#d1e8f5';
	if (path.startsWith('/exhibitor')) return '#DBD4F1';
	if (path.startsWith('/speaker')) return '#d1e8f5';
	if (path.startsWith('/gift/') || path.startsWith('/g/') || path.startsWith('/w/')) return '#F4E1D2';
	if (path.startsWith('/events/') && path.indexOf('/registration') !== -1) return '#DDD1E1';
	if (
		path.startsWith('/events/') ||
		path.startsWith('/event-page/') ||
		path.startsWith('/e/') ||
		path.startsWith('/invitation')
	) {
		return '#DBD4F1';
	}
	if (path.startsWith('/collections/') || path.startsWith('/collection/') || path.startsWith('/c/')) {
		return '#F4E1D2';
	}
	if (path.startsWith('/overview') || path.startsWith('/events')) return '#f4f5f6';
	return DEFAULT_THEME_COLOR;
}

function getInitialBrowserChrome(): string {
	if (!browser) return DEFAULT_THEME_COLOR;
	const meta = document.getElementById('theme-color-meta') as HTMLMetaElement | null;
	if (meta?.content) return meta.content;
	return resolveRouteDefaultChrome(window.location.pathname);
}

/**
 * Reactive store holding the current browser chrome color.
 */
export const themeColor = writable<string>(getInitialBrowserChrome());

let explicitOverridePath: string | null = null;
let syncedPath: string | null = null;

function syncDocumentChrome(color: string) {
	if (!browser) return;
	const meta = document.getElementById('theme-color-meta') as HTMLMetaElement | null;
	if (meta && meta.getAttribute('content') !== color) {
		meta.setAttribute('content', color);
	}
	const msMeta = document.querySelector(
		'meta[name="msapplication-navbutton-color"]'
	) as HTMLMetaElement | null;
	if (msMeta && msMeta.getAttribute('content') !== color) {
		msMeta.setAttribute('content', color);
	}
	const appleMeta = document.getElementById('apple-status-bar-meta') as HTMLMetaElement | null;
	if (appleMeta) {
		const nextAppleStyle = isDarkHex(color) ? 'black-translucent' : 'default';
		if (appleMeta.getAttribute('content') !== nextAppleStyle) {
			appleMeta.setAttribute('content', nextAppleStyle);
		}
	}
	document.documentElement.style.setProperty('--theme-chrome', color);
	document.documentElement.style.backgroundColor = color;
	if (document.body) {
		document.body.style.backgroundColor = color;
	}
}

if (browser) {
	themeColor.subscribe(syncDocumentChrome);
}

/**
 * Sync the default browser chrome when navigating between routes.
 * Respects any explicit `applyThemeColor()` set on the active route.
 */
export function syncRouteThemeColor(pathname: string) {
	const normalized = (pathname || '/').split('?')[0];
	if (syncedPath === normalized) return;
	syncedPath = normalized;
	if (explicitOverridePath !== normalized) {
		explicitOverridePath = null;
		themeColor.set(resolveRouteDefaultChrome(normalized));
	}
}

/**
 * Sets the browser chrome color to match a theme palette object or CSS hex color.
 */
export function applyThemeColor(color: string | Color) {
	const value = typeof color === 'string' ? color : themeChrome(color);
	if (browser) {
		const currentPath = window.location.pathname.split('?')[0];
		explicitOverridePath = currentPath;
		syncedPath = currentPath;
	}
	themeColor.set(value);
}

/**
 * Restores browser chrome to the active route's default color on microtask
 * so an outgoing route's `onDestroy` never clobbers the incoming route's theme.
 */
export function resetThemeColor() {
	if (!browser) {
		themeColor.set(DEFAULT_THEME_COLOR);
		return;
	}
	const leavingPath = window.location.pathname.split('?')[0];
	queueMicrotask(() => {
		const currentPath = window.location.pathname.split('?')[0];
		if (explicitOverridePath === currentPath && currentPath !== leavingPath) {
			return;
		}
		if (explicitOverridePath === leavingPath && currentPath !== leavingPath) {
			explicitOverridePath = null;
		}
		themeColor.set(resolveRouteDefaultChrome(currentPath));
	});
}
