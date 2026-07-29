<!--
  Discover hero — compact gradient banner with the global search field, live
  platform stats, the mobile tab switcher and (on the Events tab) the filter bar.

  Facets are owned here because both the filter bar and the search dropdown need
  them; fetching once keeps it to a single request per filter change.
-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onDestroy, onMount } from 'svelte';
	import SearchCommand from './SearchCommand.svelte';
	import FilterBar from './filters/FilterBar.svelte';
	import {
		EMPTY_FACETS,
		getDiscoverStats,
		getEventFacets,
		type DiscoverFacets,
		type DiscoverStats
	} from '$lib/services/discover.services';
	import {
		DISCOVER_TABS,
		discoverTab,
		eventQueryParams,
		setTab,
		type DiscoverTab
	} from '$lib/stores/discover.store';

	// ─── Platform stats ───────────────────────────────────────────────────
	let stats: DiscoverStats | null = null;

	// ─── Filter facets ────────────────────────────────────────────────────
	let facets: DiscoverFacets = EMPTY_FACETS;
	let facetsLoading = false;
	let facetController: AbortController | null = null;
	let facetDebounce = 0;
	let facetRequestId = 0;
	let lastFacetKey = '';

	onMount(async () => {
		try {
			stats = await getDiscoverStats();
		} catch {
			// Silent — the stat row falls back to "—".
		}
	});

	onDestroy(() => {
		clearTimeout(facetDebounce);
		facetController?.abort();
	});

	async function loadFacets(params: Record<string, string>) {
		facetController?.abort();
		facetController = new AbortController();
		const id = ++facetRequestId;
		facetsLoading = facets === EMPTY_FACETS;

		try {
			const next = await getEventFacets(params, { signal: facetController.signal });
			if (id === facetRequestId) facets = next;
		} catch {
			if (id === facetRequestId) facets = EMPTY_FACETS;
		} finally {
			if (id === facetRequestId) facetsLoading = false;
		}
	}

	// Recount facets whenever the filters change — debounced so multi-select
	// bursts and typing collapse into one request. Only the Events tab uses
	// facets, so other tabs don't pay for them.
	$: {
		const key = JSON.stringify($eventQueryParams);
		if ($discoverTab === 'Events' && key !== lastFacetKey) {
			lastFacetKey = key;
			const params = { ...$eventQueryParams };
			clearTimeout(facetDebounce);
			if (typeof window !== 'undefined') {
				facetDebounce = window.setTimeout(() => loadFacets(params), 220);
			}
		}
	}

	function fmt(n: number | undefined): string {
		if (n === undefined || n === null) return '—';
		return n.toLocaleString();
	}

	const heroCopy: Record<DiscoverTab, { title: string; placeholder: string }> = {
		Events: { title: 'Discover Unlimited Events', placeholder: 'Search events, vendors, speakers…' },
		Vendors: { title: 'Find Trusted Vendors', placeholder: 'Search vendors and services…' },
		Speakers: { title: 'Discover Expert Speakers', placeholder: 'Search speakers and topics…' },
		Exhibitors: {
			title: 'Explore Exhibitor Showcases',
			placeholder: 'Search exhibitors and booths…'
		},
		Community: { title: 'Join the Community', placeholder: 'Search communities…' }
	};

	const TAB_ICONS: Record<DiscoverTab, string> = {
		Events: 'mdi:ticket-confirmation-outline',
		Exhibitors: 'mdi:view-grid-outline',
		Vendors: 'mdi:storefront-outline',
		Speakers: 'mdi:microphone-outline',
		Community: 'mdi:account-group-outline'
	};

	$: currentCopy = heroCopy[$discoverTab] ?? heroCopy.Events;

	$: stat1 = (() => {
		if (!stats) return { count: '—', label: 'Events' };
		switch ($discoverTab) {
			case 'Vendors':
				return { count: fmt(stats.vendors), label: 'Vendors' };
			case 'Speakers':
				return { count: fmt(stats.speakers), label: 'Speakers' };
			case 'Exhibitors':
				return { count: fmt(stats.exhibitors), label: 'Exhibitors' };
			default:
				return { count: fmt(stats.events), label: 'Events' };
		}
	})();

	$: stat2 = (() => {
		if (!stats) return { count: '—', label: 'Organizers' };
		switch ($discoverTab) {
			case 'Vendors':
				return { count: fmt(stats.products), label: 'Products' };
			case 'Speakers':
				return { count: fmt(stats.portfolios), label: 'Portfolios' };
			case 'Exhibitors':
				return { count: fmt(stats.booths), label: 'Booths' };
			default:
				return { count: fmt(stats.organizers), label: 'Organizers' };
		}
	})();

	/** Top categories, offered as quick filters inside the search dropdown. */
	$: trending = facets.categories.slice(0, 6).map((c) => ({ value: c.value, count: c.count }));
</script>

<header class="relative">
	<div class="hero-section relative overflow-hidden rounded-[14px]">
		<div class="relative z-10 flex flex-col items-center gap-4 px-5 pt-8 pb-12 text-center md:pb-14">
			<h1 class="text-2xl font-bold tracking-tight text-gray-800 md:text-4xl">
				{currentCopy.title}
			</h1>

			<div class="w-full max-w-2xl">
				<SearchCommand
					activeTab={$discoverTab}
					placeholder={currentCopy.placeholder}
					{trending}
				/>
			</div>

			<div class="flex items-center gap-3 text-xs font-bold text-gray-400 md:text-sm">
				<span>{stat1.count} <span class="font-medium">{stat1.label}</span></span>
				<span class="h-3 w-px bg-gray-400/60"></span>
				<span>{stat2.count} <span class="font-medium">{stat2.label}</span></span>
			</div>
		</div>

		<div class="pointer-events-none absolute bottom-0 left-0 h-[22px] w-full md:h-[34px]">
			<img src="/floor-light.svg.png" alt="" class="h-full w-full object-cover" />
		</div>
	</div>

	<!-- Mobile / tablet tab switcher -->
	<div class="custom-scrollbar mt-4 flex gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap lg:hidden">
		{#each DISCOVER_TABS as tab}
			<button
				type="button"
				class="tab-pill"
				class:is-active={$discoverTab === tab}
				on:click={() => setTab(tab)}
			>
				<Icon icon={TAB_ICONS[tab]} class="h-4 w-4" />
				{tab}
			</button>
		{/each}
	</div>

	{#if $discoverTab === 'Events'}
		<div class="mt-4">
			<FilterBar {facets} loading={facetsLoading} />
		</div>
	{/if}
</header>

<style>
	.hero-section {
		background: linear-gradient(135deg, #e6e6fa 0%, #ffffff 50%, #f8e1ff 100%);
	}

	/* Soft light bloom behind the search field. */
	.hero-section::after {
		content: '';
		position: absolute;
		top: -30%;
		left: 50%;
		height: 130%;
		width: 70%;
		transform: translateX(-50%);
		background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0) 65%);
		pointer-events: none;
	}

	.tab-pill {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.4rem;
		border-radius: 12px;
		border: 1px solid transparent;
		background: #eeeff0;
		padding: 0.45rem 0.8rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #55525f;
		cursor: pointer;
		transition:
			background 160ms ease,
			color 160ms ease,
			border-color 160ms ease;
	}

	.tab-pill.is-active {
		border-color: rgba(166, 103, 228, 0.6);
		background: rgba(255, 255, 255, 0.85);
		color: #6c40c4;
	}
</style>
