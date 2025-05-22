<!-- src/lib/components/ThemeToggle.svelte -->
<script lang="ts">
	import { theme, type Theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let mounted = false;
	let currentTheme: Theme;

	// Subscribe to theme changes
	$: currentTheme = $theme;

	onMount(() => {
		mounted = true;
	});

	function cycleTheme() {
		const themes: Theme[] = ['light', 'dark', 'system'];
		const currentIndex = themes.indexOf(currentTheme);
		const nextIndex = (currentIndex + 1) % themes.length;
		theme.set(themes[nextIndex]);
	}

	function getThemeIcon(themeValue: Theme): string {
		switch (themeValue) {
			case 'light':
				return '☀️';
			case 'dark':
				return '🌙';
			case 'system':
				return '💻';
			default:
				return '💻';
		}
	}

	function getThemeLabel(themeValue: Theme): string {
		switch (themeValue) {
			case 'light':
				return 'Light';
			case 'dark':
				return 'Dark';
			case 'system':
				return 'System';
			default:
				return 'System';
		}
	}
</script>

{#if mounted}
	<div class="group relative">
		<button
			on:click={cycleTheme}
			class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-lg font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
			title="Toggle theme ({getThemeLabel(currentTheme)})"
		>
			<span>{getThemeIcon(currentTheme)}</span>
		</button>

		<!-- Hover tooltip -->
		<div
			class="absolute -top-10 left-1/2 -translate-x-1/2 transform rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:bg-gray-700"
		>
			{getThemeLabel(currentTheme)}
			<!-- Tooltip arrow -->
			<div
				class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-gray-900 dark:bg-gray-700"
			></div>
		</div>
	</div>
{/if}

<style>
	button {
		cursor: pointer;
	}
</style>
