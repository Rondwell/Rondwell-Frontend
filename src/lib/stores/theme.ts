import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

// Get initial theme from localStorage or default to system
function getInitialTheme(): Theme {
	if (!browser) return 'system';
	
	const stored = localStorage.getItem('theme') as Theme;
	if (stored && ['light', 'dark', 'system'].includes(stored)) {
		return stored;
	}
	return 'system';
}

// Create the theme store
export const theme = writable<Theme>(getInitialTheme());

// Function to get the actual theme (resolving 'system' to 'light' or 'dark')
export function getResolvedTheme(themeValue: Theme): 'light' | 'dark' {
	if (themeValue === 'system') {
		if (!browser) return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return themeValue;
}

// Function to apply theme to document
export function applyTheme(themeValue: Theme) {
	if (!browser) return;
	
	const resolvedTheme = getResolvedTheme(themeValue);
	const root = document.documentElement;
	
	// Remove existing theme classes
	root.classList.remove('light', 'dark');
	
	// Add current theme class
	root.classList.add(resolvedTheme);
	
	// Store in localStorage
	localStorage.setItem('theme', themeValue);
}

// Initialize theme on client side
if (browser) {
	// Apply initial theme
	const initialTheme = getInitialTheme();
	applyTheme(initialTheme);
	
	// Listen for system theme changes
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const handleSystemThemeChange = () => {
		theme.subscribe(currentTheme => {
			if (currentTheme === 'system') {
				applyTheme('system');
			}
		})();
	};
	
	mediaQuery.addEventListener('change', handleSystemThemeChange);
}

// Subscribe to theme changes and apply them
if (browser) {
	theme.subscribe(applyTheme);
}