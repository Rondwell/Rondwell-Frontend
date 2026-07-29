<!--
  LocationFilter — city / country picker driven by the venues that actually
  exist in the live event set, plus a free-text escape hatch so a term the facet
  list hasn't surfaced (a neighbourhood, a venue name) can still be applied.

  Selected terms are matched server-side against the venue name and address, so
  "Lagos", "Nigeria" and "Landmark Centre" all behave the same way.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import GlassPopover from '$lib/components/GlassPopover.svelte';
	import FilterTrigger from './FilterTrigger.svelte';
	import FilterPanel from './FilterPanel.svelte';
	import OptionRow from './OptionRow.svelte';
	import { clearFacet, discoverFilters, toggleLocation } from '$lib/stores/discover.store';
	import type { DiscoverFacets } from '$lib/services/discover.services';

	export let facets: DiscoverFacets;
	export let loading = false;

	let open = false;
	let trigger: HTMLElement | null = null;
	let query = '';
	let scope: 'cities' | 'countries' = 'cities';

	$: selected = $discoverFilters.locations;
	$: selectedKeys = new Set(selected.map((l) => l.toLowerCase()));

	$: trimmedQuery = query.trim();

	$: cities = facets.cities.filter(
		(c) =>
			!trimmedQuery ||
			c.value.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
			(c.country || '').toLowerCase().includes(trimmedQuery.toLowerCase())
	);

	$: countries = facets.countries.filter(
		(c) => !trimmedQuery || c.value.toLowerCase().includes(trimmedQuery.toLowerCase())
	);

	/** One shape for both scopes so the option list stays dumb. */
	$: visible =
		scope === 'cities'
			? cities.map((c) => ({ value: c.value, country: c.country ?? '', count: c.count }))
			: countries.map((c) => ({ value: c.value, country: '', count: c.count }));

	/** Offer the raw term when it isn't already an option or a selection. */
	$: canUseCustomTerm =
		trimmedQuery.length >= 2 &&
		!selectedKeys.has(trimmedQuery.toLowerCase()) &&
		!visible.some((o) => o.value.toLowerCase() === trimmedQuery.toLowerCase());

	/** Selections that came from free text rather than the facet lists. */
	$: customSelections = selected.filter(
		(value) =>
			!facets.cities.some((c) => c.value.toLowerCase() === value.toLowerCase()) &&
			!facets.countries.some((c) => c.value.toLowerCase() === value.toLowerCase())
	);

	$: summary =
		selected.length === 1 ? selected[0] : selected.length > 1 ? `${selected[0]} +${selected.length - 1}` : '';

	function apply(value: string) {
		toggleLocation(value);
		query = '';
	}

	function close() {
		open = false;
		query = '';
	}
</script>

<FilterTrigger
	bind:element={trigger}
	label="Location"
	icon="mdi:map-marker-outline"
	count={selected.length}
	{summary}
	{open}
	on:click={() => (open = !open)}
/>

<GlassPopover
	{open}
	anchor={trigger}
	align="start"
	minWidth={320}
	maxWidth={368}
	maxHeight={440}
	label="Filter by location"
	on:close={close}
>
	<svelte:fragment let:maxHeight>
		<FilterPanel
			title="Location"
			searchable
			searchPlaceholder="Search city, country or venue"
			bind:query
			selectedCount={selected.length}
			resultLabel={facets.total ? `${facets.total.toLocaleString()} events match` : ''}
			{maxHeight}
			{loading}
			on:reset={() => clearFacet('locations')}
			on:done={close}
		>
			<div class="scope-tabs" slot="tabs" role="tablist" aria-label="Location scope">
				<button
					type="button"
					role="tab"
					aria-selected={scope === 'cities'}
					class:is-active={scope === 'cities'}
					on:click={() => (scope = 'cities')}
				>
					Cities
					{#if facets.cities.length}<span>{facets.cities.length}</span>{/if}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={scope === 'countries'}
					class:is-active={scope === 'countries'}
					on:click={() => (scope = 'countries')}
				>
					Countries
					{#if facets.countries.length}<span>{facets.countries.length}</span>{/if}
				</button>
			</div>

			{#if canUseCustomTerm}
				<button type="button" class="custom" data-option on:click={() => apply(trimmedQuery)}>
					<span class="custom-icon"><Icon icon="mdi:map-search-outline" class="h-4 w-4" /></span>
					<span class="custom-body">
						<span class="custom-title">Use “{trimmedQuery}”</span>
						<span class="custom-hint">Match any venue or address containing this</span>
					</span>
					<Icon icon="mdi:plus" class="h-4 w-4 text-[#7c5cf0]" />
				</button>
			{/if}

			{#if customSelections.length && !trimmedQuery}
				<p class="group-label">Custom terms</p>
				{#each customSelections as value (value)}
					<OptionRow
						label={value}
						icon="mdi:map-search-outline"
						selected={true}
						on:click={() => apply(value)}
					/>
				{/each}
			{/if}

			{#if visible.length === 0}
				{#if !canUseCustomTerm}
					<p class="none">
						{trimmedQuery
							? `No ${scope} match “${trimmedQuery}”.`
							: `No ${scope} yet — live events with a venue will appear here.`}
					</p>
				{/if}
			{:else}
				<p class="group-label">{scope === 'cities' ? 'Cities' : 'Countries'}</p>
				{#each visible as option (option.value + option.country)}
					<OptionRow
						label={option.value}
						icon={scope === 'cities' ? 'mdi:city-variant-outline' : 'mdi:earth'}
						hint={option.country}
						count={option.count}
						selected={selectedKeys.has(option.value.toLowerCase())}
						on:click={() => apply(option.value)}
					/>
				{/each}
			{/if}
		</FilterPanel>
	</svelte:fragment>
</GlassPopover>

<style>
	.scope-tabs {
		display: flex;
		gap: 0.25rem;
		margin: 0 0.55rem 0.35rem;
		border-radius: 11px;
		background: rgba(31, 25, 53, 0.05);
		padding: 0.18rem;
	}

	.scope-tabs button {
		display: inline-flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		border-radius: 9px;
		padding: 0.3rem 0.4rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #7d7b88;
		cursor: pointer;
		transition:
			background 160ms ease,
			color 160ms ease,
			box-shadow 160ms ease;
	}

	.scope-tabs button.is-active {
		background: #fff;
		color: #35313f;
		box-shadow: 0 1px 3px rgba(31, 25, 53, 0.12);
	}

	.scope-tabs button span {
		font-size: 0.62rem;
		font-weight: 700;
		color: #b0aeb9;
	}

	.group-label {
		padding: 0.55rem 0.6rem 0.2rem;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #b0aeb9;
	}

	.custom {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.55rem;
		border-radius: 11px;
		border: 1px dashed rgba(124, 92, 240, 0.4);
		background: rgba(124, 92, 240, 0.06);
		padding: 0.45rem 0.55rem;
		text-align: left;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.custom:hover,
	.custom:focus-visible {
		background: rgba(124, 92, 240, 0.12);
		outline: none;
	}

	.custom-icon {
		display: grid;
		height: 26px;
		width: 26px;
		flex-shrink: 0;
		place-items: center;
		border-radius: 8px;
		background: rgba(124, 92, 240, 0.14);
		color: #6c40c4;
	}

	.custom-body {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
	}

	.custom-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.8rem;
		font-weight: 600;
		color: #35313f;
	}

	.custom-hint {
		font-size: 0.67rem;
		color: #9a99a4;
	}

	.none {
		padding: 1.5rem 0.75rem;
		text-align: center;
		font-size: 0.78rem;
		color: #9a99a4;
	}
</style>
