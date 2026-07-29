<!--
  CategoryFilter — multi-select category picker.

  Options come from the canonical category list (so every category is always
  discoverable) merged with the facet counts from the API (so organizers see
  what actually has events). Categories present in the data but missing from the
  canonical list — legacy values like "General" — are appended under "Other".
-->
<script lang="ts">
	import GlassPopover from '$lib/components/GlassPopover.svelte';
	import FilterTrigger from './FilterTrigger.svelte';
	import FilterPanel from './FilterPanel.svelte';
	import OptionRow from './OptionRow.svelte';
	import {
		EVENT_CATEGORIES,
		EVENT_CATEGORY_GROUPS,
		categoryEmoji,
		type EventCategory
	} from '$lib/constants/eventCategories';
	import { clearFacet, discoverFilters, toggleCategory } from '$lib/stores/discover.store';
	import type { DiscoverFacets } from '$lib/services/discover.services';

	export let facets: DiscoverFacets;
	export let loading = false;

	let open = false;
	let trigger: HTMLElement | null = null;
	let query = '';

	$: selected = $discoverFilters.categories;
	$: selectedKeys = new Set(selected.map((c) => c.toLowerCase()));

	$: countByLabel = new Map(facets.categories.map((c) => [c.value.toLowerCase(), c.count]));

	/** Canonical list + any extra labels the API reported. */
	$: allOptions = ((): EventCategory[] => {
		const known = new Set(EVENT_CATEGORIES.map((c) => c.label.toLowerCase()));
		const extras: EventCategory[] = facets.categories
			.filter((c) => c.value && !known.has(c.value.toLowerCase()))
			.map((c) => ({ label: c.value, emoji: categoryEmoji(c.value), group: 'Other' }));
		return [...EVENT_CATEGORIES, ...extras];
	})();

	const matches = (option: EventCategory, q: string) =>
		!q || option.label.toLowerCase().includes(q.toLowerCase());

	$: trimmedQuery = query.trim();

	$: filtered = allOptions.filter((o) => matches(o, trimmedQuery));

	$: groupOrder = [...EVENT_CATEGORY_GROUPS, 'Other'];

	$: grouped = groupOrder
		.map((group) => ({ group, items: filtered.filter((o) => o.group === group) }))
		.filter((g) => g.items.length > 0);

	$: popular = allOptions
		.map((o) => ({ option: o, count: countByLabel.get(o.label.toLowerCase()) ?? 0 }))
		.filter((entry) => entry.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 6)
		.map((entry) => entry.option);

	$: summary = selected.length === 1 ? selected[0] : selected.length > 1 ? `${selected[0]} +${selected.length - 1}` : '';

	function close() {
		open = false;
		query = '';
	}
</script>

<FilterTrigger
	bind:element={trigger}
	label="Category"
	icon="mdi:shape-outline"
	count={selected.length}
	{summary}
	{open}
	on:click={() => (open = !open)}
/>

<GlassPopover
	{open}
	anchor={trigger}
	align="start"
	minWidth={330}
	maxWidth={380}
	maxHeight={460}
	label="Filter by category"
	on:close={close}
>
	<svelte:fragment let:maxHeight>
		<FilterPanel
			title="Category"
			searchable
			searchPlaceholder="Search categories"
			bind:query
			selectedCount={selected.length}
			resultLabel={facets.total ? `${facets.total.toLocaleString()} events match` : ''}
			{maxHeight}
			{loading}
			on:reset={() => clearFacet('categories')}
			on:done={close}
		>
			{#if filtered.length === 0}
				<p class="none">No category matches “{trimmedQuery}”.</p>
			{:else}
				{#if !trimmedQuery && popular.length}
					<p class="group-label">Popular right now</p>
					{#each popular as option (option.label)}
						<OptionRow
							label={option.label}
							emoji={option.emoji}
							selected={selectedKeys.has(option.label.toLowerCase())}
							count={countByLabel.get(option.label.toLowerCase()) ?? 0}
							on:click={() => toggleCategory(option.label)}
						/>
					{/each}
				{/if}

				{#each grouped as section (section.group)}
					<p class="group-label">{section.group}</p>
					{#each section.items as option (option.group + option.label)}
						<OptionRow
							label={option.label}
							emoji={option.emoji}
							selected={selectedKeys.has(option.label.toLowerCase())}
							count={countByLabel.get(option.label.toLowerCase()) ?? 0}
							muted={(countByLabel.get(option.label.toLowerCase()) ?? 0) === 0}
							on:click={() => toggleCategory(option.label)}
						/>
					{/each}
				{/each}
			{/if}
		</FilterPanel>
	</svelte:fragment>
</GlassPopover>

<style>
	.group-label {
		padding: 0.55rem 0.6rem 0.2rem;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #b0aeb9;
	}

	.none {
		padding: 1.5rem 0.75rem;
		text-align: center;
		font-size: 0.78rem;
		color: #9a99a4;
	}
</style>
