<!--
  EventTypeFilter — in person / virtual / hybrid, multi-select with live counts.
-->
<script lang="ts">
	import GlassPopover from '$lib/components/GlassPopover.svelte';
	import FilterTrigger from './FilterTrigger.svelte';
	import FilterPanel from './FilterPanel.svelte';
	import OptionRow from './OptionRow.svelte';
	import { EVENT_TYPE_OPTIONS } from '$lib/constants/eventCategories';
	import { clearFacet, discoverFilters, toggleEventType } from '$lib/stores/discover.store';
	import type { DiscoverFacets } from '$lib/services/discover.services';

	export let facets: DiscoverFacets;
	export let loading = false;

	let open = false;
	let trigger: HTMLElement | null = null;

	$: selected = $discoverFilters.eventTypes;
	$: selectedKeys = new Set(selected.map((t) => t.toUpperCase()));
	$: countByType = new Map(facets.eventTypes.map((t) => [t.value, t.count]));

	$: labels = selected
		.map((value) => EVENT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value)
		.filter(Boolean);
	$: summary = labels.length === 1 ? labels[0] : labels.length > 1 ? `${labels[0]} +${labels.length - 1}` : '';
</script>

<FilterTrigger
	bind:element={trigger}
	label="Event Type"
	icon="mdi:swap-horizontal-variant"
	count={selected.length}
	{summary}
	{open}
	on:click={() => (open = !open)}
/>

<GlassPopover
	{open}
	anchor={trigger}
	align="start"
	minWidth={286}
	maxWidth={320}
	maxHeight={340}
	label="Filter by event type"
	on:close={() => (open = false)}
>
	<svelte:fragment let:maxHeight>
		<FilterPanel
			title="Event type"
			selectedCount={selected.length}
			resultLabel={facets.total ? `${facets.total.toLocaleString()} events match` : ''}
			{maxHeight}
			{loading}
			autofocus={false}
			on:reset={() => clearFacet('eventTypes')}
			on:done={() => (open = false)}
		>
			{#each EVENT_TYPE_OPTIONS as option (option.value)}
				<OptionRow
					label={option.label}
					icon={option.icon}
					hint={option.hint}
					selected={selectedKeys.has(option.value)}
					count={countByType.get(option.value) ?? 0}
					muted={(countByType.get(option.value) ?? 0) === 0}
					on:click={() => toggleEventType(option.value)}
				/>
			{/each}
		</FilterPanel>
	</svelte:fragment>
</GlassPopover>
