<script lang="ts">
	/**
	 * Address Autocomplete using HERE Maps Autosuggest + Lookup APIs.
	 *
	 * Flow:
	 * 1. User types → call /autosuggest → show dropdown
	 * 2. User clicks result → call /lookup with place ID → get full details
	 * 3. Dispatch 'select' event with address, venueName, lat, lng
	 *
	 * Required: VITE_HERE_API_KEY in .env
	 */
	import { browser } from '$app/environment';
	import { createEventDispatcher } from 'svelte';

	export let value = '';
	export let placeholder = 'Search for a venue or address...';
	export let inputClass = '';

	const dispatch = createEventDispatcher<{
		select: {
			address: string;
			venueName: string;
			lat: number;
			lng: number;
			formatted_address: string;
		};
	}>();

	const API_KEY = import.meta.env.VITE_HERE_API_KEY ?? '';
	const AUTOSUGGEST_URL = 'https://autosuggest.search.hereapi.com/v1/autosuggest';
	const LOOKUP_URL = 'https://lookup.search.hereapi.com/v1/lookup';

	let suggestions: any[] = [];
	let showSuggestions = false;
	let loading = false;
	let selectedIndex = -1;
	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleInput() {
		const query = value.trim();
		if (!query || query.length < 2 || !API_KEY) {
			suggestions = [];
			showSuggestions = false;
			return;
		}
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
	}

	async function fetchSuggestions(query: string) {
		loading = true;
		try {
			// Get user's approximate location for better results (default to Lagos)
			let lat = 6.5244;
			let lng = 3.3792;
			if (browser && navigator.geolocation) {
				try {
					const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
						navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000 })
					);
					lat = pos.coords.latitude;
					lng = pos.coords.longitude;
				} catch { /* use default */ }
			}

			const params = new URLSearchParams({
				q: query,
				at: `${lat},${lng}`,
				limit: '6',
				apiKey: API_KEY,
			});

			const res = await fetch(`${AUTOSUGGEST_URL}?${params}`);
			if (!res.ok) throw new Error('Autosuggest failed');
			const data = await res.json();

			// Filter to only places and addresses (skip categoryQuery results)
			suggestions = (data.items ?? []).filter(
				(item: any) => item.resultType === 'place' || item.resultType === 'address' || item.resultType === 'houseNumber' || item.resultType === 'street'
			).slice(0, 5);

			showSuggestions = suggestions.length > 0;
			selectedIndex = -1;
		} catch {
			suggestions = [];
			showSuggestions = false;
		} finally {
			loading = false;
		}
	}

	async function selectSuggestion(suggestion: any) {
		showSuggestions = false;

		// If the suggestion has position directly, use it
		if (suggestion.position) {
			const addr = formatHereAddress(suggestion);
			value = addr;
			dispatch('select', {
				address: addr,
				venueName: suggestion.title ?? '',
				lat: suggestion.position.lat,
				lng: suggestion.position.lng,
				formatted_address: addr,
			});
			return;
		}

		// Otherwise, call /lookup to get full details
		if (suggestion.id) {
			loading = true;
			try {
				const params = new URLSearchParams({
					id: suggestion.id,
					apiKey: API_KEY,
				});
				const res = await fetch(`${LOOKUP_URL}?${params}`);
				if (!res.ok) throw new Error('Lookup failed');
				const place = await res.json();

				const addr = formatHereAddress(place);
				value = addr;
				dispatch('select', {
					address: addr,
					venueName: place.title ?? suggestion.title ?? '',
					lat: place.position?.lat ?? 0,
					lng: place.position?.lng ?? 0,
					formatted_address: addr,
				});
			} catch {
				// Fallback: use the suggestion title
				value = suggestion.title ?? '';
				dispatch('select', {
					address: suggestion.title ?? '',
					venueName: suggestion.title ?? '',
					lat: 0,
					lng: 0,
					formatted_address: suggestion.title ?? '',
				});
			} finally {
				loading = false;
			}
		}
	}

	function formatHereAddress(item: any): string {
		if (item.address?.label) return item.address.label;
		const parts = [
			item.address?.houseNumber,
			item.address?.street,
			item.address?.district,
			item.address?.city,
			item.address?.stateCode ?? item.address?.state,
			item.address?.countryName ?? item.address?.countryCode,
		].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : item.title ?? '';
	}

	function getSubtitle(item: any): string {
		if (item.address?.label && item.title !== item.address.label) {
			return item.address.label;
		}
		const parts = [item.address?.city, item.address?.countryName].filter(Boolean);
		return parts.join(', ');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!showSuggestions || suggestions.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			selectSuggestion(suggestions[selectedIndex]);
		} else if (e.key === 'Escape') {
			showSuggestions = false;
		}
	}

	function handleBlur() {
		setTimeout(() => { showSuggestions = false; }, 200);
	}
</script>

<div class="relative w-full">
	<div class="relative">
		<input
			bind:value
			type="text"
			{placeholder}
			class="w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none {inputClass}"
			on:input={handleInput}
			on:keydown={handleKeydown}
			on:blur={handleBlur}
			on:focus={() => { if (suggestions.length > 0) showSuggestions = true; }}
			autocomplete="off"
		/>
		<!-- Search icon -->
		<svg class="absolute left-3 top-3 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
			<path d="M12 21C12 21 20 15 20 9.5C20 5.36 16.42 2 12 2C7.58 2 4 5.36 4 9.5C4 15 12 21 12 21Z" stroke="currentColor" stroke-width="1.5"/>
			<circle cx="12" cy="9.5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
		</svg>
		{#if loading}
		<div class="absolute right-3 top-3">
			<svg class="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
			</svg>
		</div>
		{/if}
	</div>

	{#if showSuggestions && suggestions.length > 0}
	<div class="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
		{#each suggestions as suggestion, i}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors {i === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}"
			on:mousedown|preventDefault={() => selectSuggestion(suggestion)}
			on:mouseenter={() => selectedIndex = i}
			role="option"
			aria-selected={i === selectedIndex}
		>
			<!-- Icon based on result type -->
			{#if suggestion.resultType === 'place'}
			<svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" viewBox="0 0 24 24" fill="none">
				<path d="M12 21C12 21 20 15 20 9.5C20 5.36 16.42 2 12 2C7.58 2 4 5.36 4 9.5C4 15 12 21 12 21Z" stroke="currentColor" stroke-width="1.5"/>
				<circle cx="12" cy="9.5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
			</svg>
			{:else}
			<svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none">
				<path d="M12 21C12 21 20 15 20 9.5C20 5.36 16.42 2 12 2C7.58 2 4 5.36 4 9.5C4 15 12 21 12 21Z" stroke="currentColor" stroke-width="1.5"/>
				<circle cx="12" cy="9.5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
			</svg>
			{/if}
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium text-gray-800">
					{suggestion.title}
				</p>
				{#if getSubtitle(suggestion)}
				<p class="truncate text-xs text-gray-400">{getSubtitle(suggestion)}</p>
				{/if}
			</div>
			{#if suggestion.resultType === 'place'}
			<span class="mt-0.5 flex-shrink-0 rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-500">Venue</span>
			{/if}
		</div>
		{/each}
	</div>
	{/if}
</div>
