<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';
	import { discoverEvents } from '$lib/services/event.services';
	import { clearAllFilters, discoverFilters, eventQueryParams, hasActiveFilters } from '$lib/stores/discover.store';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';

	const PAGE_SIZE = 20;

	let events: any[] = [];
	let loading = true;
	let failed = false;
	let pagination: any = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
	let currentPage = 1;

	/** Serialized filters of the last request — guards against duplicate loads. */
	let lastKey = '';
	let requestId = 0;
	let debounce = 0;

	onDestroy(() => clearTimeout(debounce));

	async function loadEvents(params: Record<string, string>, pageNumber: number) {
		const id = ++requestId;
		loading = true;
		failed = false;
		try {
			const data = await discoverEvents({
				page: pageNumber,
				limit: PAGE_SIZE,
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

	function schedule(params: Record<string, string>, pageNumber: number, delay = 0) {
		clearTimeout(debounce);
		if (typeof window === 'undefined') return;
		debounce = window.setTimeout(() => loadEvents(params, pageNumber), delay);
	}

	// Filters changed → back to page 1, debounced so typing doesn't spam the API.
	$: {
		const key = JSON.stringify($eventQueryParams);
		if (key !== lastKey) {
			const isFirstLoad = lastKey === '';
			lastKey = key;
			currentPage = 1;
			schedule({ ...$eventQueryParams }, 1, isFirstLoad ? 0 : 220);
		}
	}

	function goToPage(pageNumber: number) {
		currentPage = pageNumber;
		schedule({ ...$eventQueryParams }, pageNumber, 0);
		if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function normalizeEvent(e: any) {
		const locDetails = e.locationDetails;
		let location = 'TBD';
		let locationIcon = '/location.svg';

		if (e.eventType === 'VIRTUAL' && locDetails?.virtual?.platform) {
			location = locDetails.virtual.platform;
			locationIcon = '/zoom.svg';
		} else if (locDetails?.physical?.venueName) {
			location = locDetails.physical.venueName;
			locationIcon = '/location.svg';
		} else if (e.eventType === 'HYBRID') {
			location = 'Hybrid';
			locationIcon = '/hybrid.svg';
		}

		return {
			id: e._id ?? e.id,
			slug: e.customLinkSlug || '',
			time: e.startDateTime
				? new Date(e.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
				  new Date(e.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
				: '',
			title: e.title ?? 'Untitled Event',
			organizers: e.eventOrganizerName ? `By ${e.eventOrganizerName}` : '',
			location,
			locationIcon,
			status: e.registrationType === 'FREE' ? 'Free' : 'Paid',
			availability: e.category ?? '',
			attendees: e.attendeeCount > 0 ? `+${e.attendeeCount}` : '0',
			image: e.displayPictureUrl ?? e.coverPictureUrl ?? '/events.png',
			tag: e.collectionName ?? '',
			category: e.category ?? '',
			organizerAvatar: e.organizerAvatarUrl ?? '',
		};
	}

	$: displayEvents = events.map(normalizeEvent);
	$: searchTerm = $discoverFilters.search.trim();
	$: heading = searchTerm ? `Results for “${searchTerm}”` : $hasActiveFilters ? 'Filtered Events' : 'Featured Events';
	$: totalLabel = pagination.total === 1 ? '1 event' : `${(pagination.total ?? 0).toLocaleString()} events`;
</script>

<section class="relative max-w-6xl">
	<div class="flex flex-wrap items-baseline justify-between gap-2">
		<h1 class="text-xl font-bold">{heading}</h1>
		{#if !loading && !failed}
			<span class="text-xs font-semibold text-gray-400">{totalLabel}</span>
		{/if}
	</div>

	{#if loading}
	<div class="py-5 grid gap-4 lg:grid-cols-2 animate-pulse">
		{#each [1, 2, 3, 4] as _}
		<div class="h-48 rounded-xl bg-gray-200"></div>
		{/each}
	</div>

	{:else if failed}
	<div class="flex h-48 flex-col items-center justify-center gap-3">
		<Icon icon="mdi:cloud-off-outline" class="h-7 w-7 text-gray-300" />
		<p class="text-sm text-gray-500">We couldn't load events just now.</p>
		<button
			class="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white"
			on:click={() => loadEvents({ ...$eventQueryParams }, currentPage)}
		>
			Try again
		</button>
	</div>

	{:else if displayEvents.length === 0}
	<div class="flex h-56 flex-col items-center justify-center gap-2">
		<Icon icon="mdi:calendar-search" class="h-7 w-7 text-gray-300" />
		<p class="text-base font-semibold text-gray-500">No events match these filters</p>
		<p class="max-w-sm text-center text-sm text-gray-400">
			{$hasActiveFilters
				? 'Try widening your search — fewer categories, more locations, or a different event type.'
				: 'Check back later for upcoming events.'}
		</p>
		{#if $hasActiveFilters}
			<button
				class="mt-1 rounded-lg border border-purple-500 px-4 py-2 text-xs font-semibold text-purple-600 transition hover:bg-purple-50"
				on:click={clearAllFilters}
			>
				Clear all filters
			</button>
		{/if}
	</div>

	{:else}
	<main class="h-full py-5">
		<div class="mb-8 grid gap-4 grid-cols-1 lg:grid-cols-2">
			{#each displayEvents as event (event.id)}
				<a href={event.slug ? `/e/${event.slug}` : `/event-page/${event.id}`} target="_blank" rel="noopener noreferrer" class="no-underline">
					<EventCard {event} eventId={event.id} slug={event.slug} />
				</a>
			{/each}
		</div>

		<!-- Pagination -->
		{#if pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-2 pb-8">
			<button
				class="rounded-lg px-3 py-1.5 text-sm {currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
				disabled={currentPage <= 1}
				on:click={() => goToPage(currentPage - 1)}
			>
				Previous
			</button>
			<span class="text-sm text-gray-500">
				Page {pagination.page} of {pagination.totalPages}
			</span>
			<button
				class="rounded-lg px-3 py-1.5 text-sm {currentPage >= pagination.totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
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
