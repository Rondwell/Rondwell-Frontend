<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';
	import { discoverEvents } from '$lib/services/event.services';
	import {
		clearAllFilters,
		discoverFilters,
		eventQueryParams,
		hasActiveFilters
	} from '$lib/stores/discover.store';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';

	const PAGE_SIZE = 18;

	let events: any[] = [];
	let loading = true;
	let failed = false;
	let pagination: any = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
	let currentPage = 1;
	let sortOrder: 'upcoming' | 'newest' = 'upcoming';
	let viewMode: 'ticket' | 'landscape' = 'ticket';

	let lastKey = '';
	let requestId = 0;
	let debounce = 0;

	onDestroy(() => clearTimeout(debounce));

	async function loadEvents(params: Record<string, string>, pageNumber: number, sort: 'upcoming' | 'newest') {
		const id = ++requestId;
		loading = true;
		failed = false;
		try {
			const data = await discoverEvents({
				page: pageNumber,
				limit: PAGE_SIZE,
				sort,
				...params
			});
			if (id !== requestId) return;
			events = data.events ?? [];
			pagination = data.pagination ?? { page: pageNumber, limit: PAGE_SIZE, total: 0, totalPages: 0 };
		} catch {
			if (id !== requestId) return;
			events = [];
			failed = true;
		} finally {
			if (id === requestId) loading = false;
		}
	}

	function schedule(params: Record<string, string>, pageNumber: number, sort: 'upcoming' | 'newest', delay: number) {
		clearTimeout(debounce);
		if (delay === 0) {
			void loadEvents(params, pageNumber, sort);
			return;
		}
		debounce = window.setTimeout(() => void loadEvents(params, pageNumber, sort), delay);
	}

	$: {
		const key = JSON.stringify({ params: $eventQueryParams, sortOrder });
		if (key !== lastKey) {
			const isFirstLoad = lastKey === '';
			lastKey = key;
			currentPage = 1;
			schedule({ ...$eventQueryParams }, 1, sortOrder, isFirstLoad ? 0 : 200);
		}
	}

	function goToPage(pageNumber: number) {
		currentPage = pageNumber;
		schedule({ ...$eventQueryParams }, pageNumber, sortOrder, 0);
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function normalizeEvent(e: any) {
		const start = e.startDateTime ? new Date(e.startDateTime) : null;
		const validStart = start && !Number.isNaN(start.getTime()) ? start : null;
		const locDetails = e.locationDetails;
		let location = 'Location TBA';
		if (e.eventType === 'VIRTUAL') {
			location = locDetails?.virtual?.platform || 'Virtual Event';
		} else if (locDetails?.physical) {
			location =
				[locDetails.physical.venueName, locDetails.physical.city].filter(Boolean).join(', ') ||
				locDetails.physical.resolvedAddress ||
				'In Person';
		} else if (e.eventType === 'HYBRID') {
			location = 'Hybrid';
		}
		return {
			id: e._id ?? e.id,
			slug: e.customLinkSlug ?? e.slug,
			startDateTime: e.startDateTime,
			endDateTime: e.endDateTime,
			date: validStart
				? validStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
				: 'Date TBA',
			time: validStart
				? validStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
				: 'Time TBA',
			title: e.title ?? 'Untitled Event',
			organizer: e.eventOrganizerName || e.organizerName || 'Rondwell Host',
			eventOrganizerName: e.eventOrganizerName,
			location,
			locationDetails: e.locationDetails,
			eventType: e.eventType ?? 'PHYSICAL',
			registrationType: e.registrationType,
			registrationOpen: e.registrationOpen,
			price: e.registrationType === 'PAID' ? 'Paid' : 'Free',
			attendees: `${e.attendeeCount ?? 0} attending`,
			attendeeCount: e.attendeeCount ?? 0,
			image: e.displayPictureUrl ?? e.coverPictureUrl ?? '',
			displayPictureUrl: e.displayPictureUrl,
			coverPictureUrl: e.coverPictureUrl,
			tag: e.collectionName ?? '',
			tags: Array.isArray(e.tags) ? e.tags : [],
			category: e.category ?? '',
			themeColor: e.themeColor,
			themeFont: e.themeFont,
			organizerAvatar: e.organizerAvatarUrl ?? ''
		};
	}

	$: displayEvents = events.map(normalizeEvent);
	$: searchTerm = $discoverFilters.search.trim();
	$: heading = searchTerm
		? `Results for “${searchTerm}”`
		: $hasActiveFilters
			? 'Filtered Events'
			: 'Featured & Upcoming Events';
	$: totalLabel =
		pagination.total === 1
			? '1 event'
			: `${(pagination.total ?? 0).toLocaleString()} events`;
</script>

<section class="relative w-full max-w-6xl">
	<!-- Controls Header: Heading + Count + Sort + View Mode Switcher -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-baseline gap-2.5">
			<h2 class="text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">{heading}</h2>
			{#if !loading && !failed}
				<span class="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-[#6B6878]">
					{totalLabel}
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<!-- Sort Pills -->
			<div class="inline-flex items-center rounded-full border border-black/10 bg-white/90 p-0.5 text-xs shadow-xs">
				<button
					type="button"
					on:click={() => (sortOrder = 'upcoming')}
					class={`rounded-full px-3 py-1 font-semibold transition ${
						sortOrder === 'upcoming' ? 'bg-[#17161E] text-white' : 'text-[#555362] hover:text-[#17161E]'
					}`}
				>
					Upcoming
				</button>
				<button
					type="button"
					on:click={() => (sortOrder = 'newest')}
					class={`rounded-full px-3 py-1 font-semibold transition ${
						sortOrder === 'newest' ? 'bg-[#17161E] text-white' : 'text-[#555362] hover:text-[#17161E]'
					}`}
				>
					Newest
				</button>
			</div>

			<!-- Gallery vs Stub View Mode Toggle -->
			<div class="inline-flex items-center rounded-full border border-black/10 bg-white/90 p-0.5 shadow-xs">
				<button
					type="button"
					aria-label="Ticket gallery view"
					title="Ticket Gallery"
					on:click={() => (viewMode = 'ticket')}
					class={`flex h-7 w-8 items-center justify-center rounded-full transition ${
						viewMode === 'ticket' ? 'bg-[#AB46DD] text-white' : 'text-[#6B6878] hover:text-[#17161E]'
					}`}
				>
					<Icon icon="solar:widget-4-bold-duotone" class="h-4 w-4" />
				</button>
				<button
					type="button"
					aria-label="Compact horizontal stub view"
					title="Compact Stubs"
					on:click={() => (viewMode = 'landscape')}
					class={`flex h-7 w-8 items-center justify-center rounded-full transition ${
						viewMode === 'landscape' ? 'bg-[#AB46DD] text-white' : 'text-[#6B6878] hover:text-[#17161E]'
					}`}
				>
					<Icon icon="solar:list-bold-duotone" class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	{#if loading}
		<!-- Perforated Collector Card Skeletons -->
		<div
			class={`mt-5 grid gap-5 ${
				viewMode === 'ticket'
					? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
					: 'grid-cols-1 lg:grid-cols-2'
			}`}
		>
			{#each [1, 2, 3, 4, 5, 6] as idx (idx)}
				<div
					class={`animate-pulse rounded-[22px] border border-black/8 bg-white/85 p-4 ${
						viewMode === 'ticket' ? 'h-[330px]' : 'h-[120px]'
					}`}
				></div>
			{/each}
		</div>
	{:else if failed}
		<div class="mt-6 flex h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-black/8 bg-white/80 p-6 text-center">
			<Icon icon="solar:cloud-cross-bold-duotone" class="h-9 w-9 text-[#DB3E6C]" />
			<p class="text-sm font-medium text-[#555362]">We couldn't load events just now.</p>
			<button
				type="button"
				class="rounded-full bg-[#17161E] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#2E2D38]"
				on:click={() => loadEvents({ ...$eventQueryParams }, currentPage, sortOrder)}
			>
				Try again
			</button>
		</div>
	{:else if displayEvents.length === 0}
		<div class="mt-6 flex h-60 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-black/15 bg-white/75 p-6 text-center">
			<Icon icon="solar:calendar-search-bold-duotone" class="h-9 w-9 text-[#AB46DD]" />
			<p class="text-base font-bold text-[#17161E]">No events match these filters</p>
			<p class="max-w-sm text-xs text-[#6B6878]">
				{#if $hasActiveFilters}
					Try widening your category, city, or search keywords.
				{:else}
					New public events are added daily — check back soon!
				{/if}
			</p>
			{#if $hasActiveFilters}
				<button
					type="button"
					class="mt-2 rounded-full border border-black/15 bg-white px-4 py-1.5 text-xs font-semibold text-[#17161E] transition hover:bg-black/5"
					on:click={clearAllFilters}
				>
					Clear all filters
				</button>
			{/if}
		</div>
	{:else}
		<main class="py-5">
			<div
				class={`mb-8 grid gap-5 ${
					viewMode === 'ticket'
						? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
						: 'grid-cols-1 lg:grid-cols-2'
				}`}
			>
				{#each displayEvents as event (event.id)}
					<EventCard
						{event}
						eventId={event.id}
						slug={event.slug}
						variant={viewMode}
						interactiveTilt={viewMode === 'ticket'}
					/>
				{/each}
			</div>

			{#if pagination.totalPages > 1}
				<div class="flex items-center justify-center gap-3 pb-8">
					<button
						type="button"
						class={`rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#17161E] transition ${
							currentPage <= 1 ? 'cursor-not-allowed opacity-40' : 'hover:bg-black/5'
						}`}
						disabled={currentPage <= 1}
						on:click={() => goToPage(currentPage - 1)}
					>
						Previous
					</button>
					<span class="text-xs font-semibold text-[#6B6878]">
						Page {pagination.page} of {pagination.totalPages}
					</span>
					<button
						type="button"
						class={`rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#17161E] transition ${
							currentPage >= pagination.totalPages ? 'cursor-not-allowed opacity-40' : 'hover:bg-black/5'
						}`}
						disabled={currentPage >= pagination.totalPages}
						on:click={() => goToPage(currentPage + 1)}
					>
						Next
					</button>
				</div>
			{/if}
		</main>
	{/if}
</section>
