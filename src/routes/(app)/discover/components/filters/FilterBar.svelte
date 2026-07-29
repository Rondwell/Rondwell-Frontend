<!--
  FilterBar — the row of glass filter pills plus the active-selection chips.

  Only the Events tab is filterable today; the bar renders nothing for the other
  tabs, which keeps the hero from jumping around when switching.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import CategoryFilter from './CategoryFilter.svelte';
	import EventTypeFilter from './EventTypeFilter.svelte';
	import LocationFilter from './LocationFilter.svelte';
	import { categoryEmoji, EVENT_TYPE_OPTIONS } from '$lib/constants/eventCategories';
	import {
		clearAllFilters,
		discoverFilters,
		hasActiveFilters,
		removeFilterValue,
		setSearch
	} from '$lib/stores/discover.store';
	import type { DiscoverFacets } from '$lib/services/discover.services';

	export let facets: DiscoverFacets;
	export let loading = false;

	type Chip = {
		facet: 'categories' | 'eventTypes' | 'locations';
		value: string;
		label: string;
		emoji?: string;
		icon?: string;
	};

	$: chips = [
		...$discoverFilters.categories.map(
			(value): Chip => ({ facet: 'categories', value, label: value, emoji: categoryEmoji(value) })
		),
		...$discoverFilters.eventTypes.map(
			(value): Chip => ({
				facet: 'eventTypes',
				value,
				label: EVENT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value,
				icon: EVENT_TYPE_OPTIONS.find((o) => o.value === value)?.icon ?? 'mdi:swap-horizontal-variant'
			})
		),
		...$discoverFilters.locations.map(
			(value): Chip => ({
				facet: 'locations',
				value,
				label: value,
				icon: 'mdi:map-marker-outline'
			})
		)
	];

	$: searchTerm = $discoverFilters.search.trim();
</script>

<div class="filter-bar">
	<div class="custom-scrollbar pill-row">
		<CategoryFilter {facets} {loading} />
		<EventTypeFilter {facets} {loading} />
		<LocationFilter {facets} {loading} />

		{#if $hasActiveFilters}
			<button type="button" class="clear-pill" on:click={clearAllFilters}>
				Clear all
				<Icon icon="mdi:close-circle-outline" class="h-4 w-4" />
			</button>
		{/if}
	</div>

	{#if chips.length || searchTerm}
		<div class="chip-row">
			{#if searchTerm}
				<span class="chip">
					<Icon icon="mdi:magnify" class="h-3.5 w-3.5 opacity-60" />
					“{searchTerm}”
					<button type="button" on:click={() => setSearch('')} aria-label="Clear search term">
						<Icon icon="mdi:close" class="h-3 w-3" />
					</button>
				</span>
			{/if}

			{#each chips as chip (chip.facet + chip.value)}
				<span class="chip">
					{#if chip.emoji}
						<span aria-hidden="true">{chip.emoji}</span>
					{:else if chip.icon}
						<Icon icon={chip.icon} class="h-3.5 w-3.5 opacity-60" />
					{/if}
					{chip.label}
					<button
						type="button"
						on:click={() => removeFilterValue(chip.facet, chip.value)}
						aria-label={`Remove ${chip.label} filter`}
					>
						<Icon icon="mdi:close" class="h-3 w-3" />
					</button>
				</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.filter-bar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.pill-row {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		overflow-y: hidden;
		white-space: nowrap;
		padding-bottom: 0.15rem;
	}

	.clear-pill {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.3rem;
		border-radius: 12px;
		border: 1px solid rgba(166, 103, 228, 0.55);
		background: rgba(255, 255, 255, 0.6);
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
		padding: 0.45rem 0.7rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #6c40c4;
		cursor: pointer;
		transition:
			background 160ms ease,
			transform 160ms ease;
	}

	.clear-pill:hover {
		background: #fff;
		transform: translateY(-1px);
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border-radius: 999px;
		border: 1px solid rgba(31, 25, 53, 0.07);
		background: rgba(255, 255, 255, 0.75);
		padding: 0.18rem 0.4rem 0.18rem 0.55rem;
		font-size: 0.72rem;
		font-weight: 600;
		color: #4a4658;
	}

	.chip button {
		display: grid;
		height: 16px;
		width: 16px;
		place-items: center;
		border-radius: 999px;
		background: rgba(31, 25, 53, 0.07);
		color: #6b6a75;
		cursor: pointer;
		transition:
			background 140ms ease,
			color 140ms ease;
	}

	.chip button:hover {
		background: rgba(166, 103, 228, 0.25);
		color: #4b2f9c;
	}
</style>
