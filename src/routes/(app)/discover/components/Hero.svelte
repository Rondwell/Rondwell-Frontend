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
		discoverFilters,
		discoverTab,
		eventQueryParams,
		setTab,
		toggleCategory,
		toggleEventType,
		type DiscoverTab
	} from '$lib/stores/discover.store';
	import { categoryEmoji, stripCategoryEmoji } from '$lib/constants/eventCategories';

	let stats: DiscoverStats | null = null;
	let facets: DiscoverFacets = EMPTY_FACETS;
	let facetsLoading = false;

	let facetRequestId = 0;
	let facetDebounce = 0;
	let facetController: AbortController | null = null;
	let lastFacetKey = '';

	onMount(async () => {
		try {
			stats = await getDiscoverStats();
		} catch {
			// graceful fallback to placeholder metrics
		}
	});

	onDestroy(() => {
		clearTimeout(facetDebounce);
		facetController?.abort();
	});

	async function loadFacets(params: Record<string, string>) {
		const id = ++facetRequestId;
		facetController?.abort();
		facetController = new AbortController();
		facetsLoading = facets === EMPTY_FACETS;
		try {
			const next = await getEventFacets(params, { signal: facetController.signal });
			if (id === facetRequestId) facets = next;
		} catch {
			// keep stale facets on transient cancel/error
		} finally {
			if (id === facetRequestId) facetsLoading = false;
		}
	}

	$: if ($discoverTab === 'Events') {
		const key = JSON.stringify($eventQueryParams);
		if (key !== lastFacetKey) {
			const isInitial = lastFacetKey === '';
			lastFacetKey = key;
			clearTimeout(facetDebounce);
			const params = { ...$eventQueryParams };
			if (isInitial) {
				void loadFacets(params);
			} else {
				facetDebounce = window.setTimeout(() => void loadFacets(params), 220);
			}
		}
	}

	const heroCopy: Record<DiscoverTab, { eyebrow: string; title: string; subtitle: string; placeholder: string }> = {
		Events: {
			eyebrow: 'Live Discovery',
			title: 'Find events worth clearing your calendar for',
			subtitle: 'Concerts, design salons, tech summits, pop-up tastings, and hybrid rooms curated in real time.',
			placeholder: 'Search concerts, summits, cities, or tags'
		},
		Exhibitors: {
			eyebrow: 'Showcase Floor',
			title: 'Explore exhibitors shaping the floor',
			subtitle: 'Connect with verified hardware makers, studios, and brand activations.',
			placeholder: 'Search exhibitors, booths, or industries'
		},
		Vendors: {
			eyebrow: 'Event Craftspeople',
			title: 'Book trusted production & hospitality vendors',
			subtitle: 'Stage lighting, specialty coffee bars, AV rigs, and catering teams ready for your next date.',
			placeholder: 'Search vendors, cuisines, or production rigs'
		},
		Speakers: {
			eyebrow: 'Keynote Roster',
			title: 'Discover founders, creators & domain speakers',
			subtitle: 'Invite seasoned voices to keynotes, fireside chats, and panels.',
			placeholder: 'Search speakers, topics, or cities'
		},
		Community: {
			eyebrow: 'Recurring Series',
			title: 'Browse community calendars & collections',
			subtitle: 'Follow curators hosting multi-city gatherings and seasonal programs.',
			placeholder: 'Search curated collections or organizers'
		}
	};

	const TAB_ICONS: Record<DiscoverTab, string> = {
		Events: 'solar:ticket-bold-duotone',
		Exhibitors: 'solar:buildings-2-bold-duotone',
		Vendors: 'solar:shop-2-bold-duotone',
		Speakers: 'solar:microphone-3-bold-duotone',
		Community: 'solar:users-group-rounded-bold-duotone'
	};

	$: currentCopy = heroCopy[$discoverTab] ?? heroCopy.Events;

	function fmt(n: number): string {
		if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
		return n.toLocaleString();
	}

	$: primaryMetric = (() => {
		if (!stats) return { count: 'Live', label: 'Events' };
		switch ($discoverTab) {
			case 'Vendors':
				return { count: fmt(stats.vendors), label: 'Vendors' };
			case 'Speakers':
				return { count: fmt(stats.speakers), label: 'Speakers' };
			case 'Exhibitors':
				return { count: fmt(stats.exhibitors), label: 'Exhibitors' };
			default:
				return { count: fmt(stats.events), label: 'Active Events' };
		}
	})();

	$: secondaryMetric = (() => {
		if (!stats) return { count: 'Global', label: 'Cities' };
		switch ($discoverTab) {
			case 'Vendors':
				return { count: fmt(stats.products), label: 'Packages' };
			case 'Speakers':
				return { count: fmt(stats.portfolios), label: 'Talks' };
			case 'Exhibitors':
				return { count: fmt(stats.booths), label: 'Booths' };
			default:
				return { count: fmt(stats.organizers), label: 'Organizers' };
		}
	})();

	$: trending = facets.categories.slice(0, 6).map((c) => ({ value: c.value, count: c.count }));
	$: topCategories = facets.categories.slice(0, 8);
</script>

<section class="relative overflow-hidden rounded-[28px] border border-[#AB46DD]/15 bg-gradient-to-br from-[#EFEAFC] via-[#F9F5FE] to-[#FDF2F8] p-5 shadow-[0_18px_48px_rgba(49,33,94,0.06)] sm:p-7">
	<!-- Lightweight SVG Geometric Glow Backdrop -->
	<div
		class="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-45 blur-3xl"
		style="background: radial-gradient(circle, rgba(171,70,221,0.34), transparent 70%);"
	></div>
	<div
		class="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full opacity-40 blur-3xl"
		style="background: radial-gradient(circle, rgba(219,62,108,0.28), transparent 70%);"
	></div>

	<div class="relative z-10 flex flex-col gap-5">
		<!-- Top Row: Eyebrow + Stats Chips -->
		<div class="flex flex-wrap items-center justify-between gap-3">
			<span class="inline-flex items-center gap-2 rounded-full border border-[#AB46DD]/20 bg-white/85 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#6B21A8] uppercase backdrop-blur-sm">
				<span class="h-1.5 w-1.5 rounded-full bg-[#DB3E6C]"></span>
				{currentCopy.eyebrow}
			</span>

			<div class="flex items-center gap-2">
				<div class="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/80 px-3 py-1 text-xs font-semibold text-[#17161E] backdrop-blur-sm">
					<span class="font-bold text-[#AB46DD]">{primaryMetric.count}</span>
					<span class="text-[#5F5C6D]">{primaryMetric.label}</span>
				</div>
				<div class="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/80 px-3 py-1 text-xs font-semibold text-[#17161E] backdrop-blur-sm">
					<span class="font-bold text-[#DB3E6C]">{secondaryMetric.count}</span>
					<span class="text-[#5F5C6D]">{secondaryMetric.label}</span>
				</div>
			</div>
		</div>

		<!-- Headline -->
		<div class="max-w-2xl">
			<h1 class="text-2xl leading-[1.12] font-bold tracking-tight text-[#17161E] sm:text-4xl">
				{currentCopy.title}
			</h1>
			<p class="mt-2 text-sm leading-relaxed text-[#52505D] sm:text-base">
				{currentCopy.subtitle}
			</p>
		</div>

		<!-- Mobile Tab Switcher (Hidden on Desktop where DiscoverSidebar handles tabs) -->
		<div class="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 md:hidden">
			{#each DISCOVER_TABS as tab}
				{@const active = $discoverTab === tab}
				<button
					type="button"
					on:click={() => setTab(tab as DiscoverTab)}
					class={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
						active
							? 'border-[#17161E] bg-[#17161E] text-white shadow-xs'
							: 'border-black/10 bg-white/85 text-[#3F3D4A]'
					}`}
				>
					<Icon icon={TAB_ICONS[tab]} class="h-3.5 w-3.5" />
					<span>{tab}</span>
				</button>
			{/each}
		</div>

		<!-- Global Command Search Bar -->
		<SearchCommand activeTab={$discoverTab} placeholder={currentCopy.placeholder} {trending} />

		<!-- Quick-Vibe Category Strip + Format Pills + FilterBar (Events Tab) -->
		{#if $discoverTab === 'Events'}
			<div class="space-y-3">
				<div class="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
					<!-- Quick Format Toggles -->
					{#each [
						{ value: 'PHYSICAL', label: 'In-Person', icon: 'solar:map-point-bold-duotone' },
						{ value: 'VIRTUAL', label: 'Virtual', icon: 'solar:videocamera-bold-duotone' },
						{ value: 'HYBRID', label: 'Hybrid', icon: 'solar:routing-2-bold-duotone' }
					] as fmtChip}
						{@const active = $discoverFilters.eventTypes.includes(fmtChip.value)}
						<button
							type="button"
							on:click={() => toggleEventType(fmtChip.value)}
							class={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
								active
									? 'border-[#DB3E6C] bg-[#DB3E6C] text-white shadow-xs'
									: 'border-black/10 bg-white/85 text-[#32303B] hover:bg-white'
							}`}
						>
							<Icon icon={fmtChip.icon} class="h-3.5 w-3.5" />
							<span>{fmtChip.label}</span>
						</button>
					{/each}

					{#if topCategories.length > 0}
						<span class="mx-1 h-4 w-[1px] shrink-0 bg-black/10"></span>
						{#each topCategories as cat}
							{@const active = $discoverFilters.categories.includes(cat.value)}
							{@const cleanLabel = stripCategoryEmoji(cat.value) || cat.value}
							{@const emoji = categoryEmoji(cat.value)}
							<button
								type="button"
								on:click={() => toggleCategory(cat.value)}
								class={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
									active
										? 'border-[#17161E] bg-[#17161E] text-white shadow-xs'
										: 'border-black/10 bg-white/85 text-[#32303B] hover:bg-white'
								}`}
							>
								{#if emoji}
									<span>{emoji}</span>
								{/if}
								<span>{cleanLabel}</span>
								<span class={`text-[10px] ${active ? 'text-white/70' : 'text-[#878495]'}`}>
									{cat.count}
								</span>
							</button>
						{/each}
					{/if}
				</div>

				<FilterBar {facets} loading={facetsLoading} />
			</div>
		{/if}
	</div>
</section>

<style>
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
