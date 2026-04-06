<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';
	import { discoverEvents } from '$lib/services/event.services';
	import { onMount } from 'svelte';

	let events: any[] = [];
	let loading = true;
	let pagination: any = { page: 1, limit: 20, total: 0, totalPages: 0 };

	// Filters (self-managed, no props needed)
	let searchQuery = '';
	let categoryFilter = '';
	let eventTypeFilter = '';
	let registrationTypeFilter = '';

	let currentPage = 1;

	async function loadEvents() {
		loading = true;
		try {
			const data = await discoverEvents({
				page: currentPage,
				limit: 20,
				search: searchQuery || undefined,
				category: categoryFilter || undefined,
				eventType: eventTypeFilter || undefined,
				registrationType: registrationTypeFilter || undefined,
			});
			events = data.events;
			pagination = data.pagination;
		} catch { events = []; }
		finally { loading = false; }
	}

	onMount(() => loadEvents());

	// Reload when filters change
	$: if (searchQuery !== undefined || categoryFilter || eventTypeFilter || registrationTypeFilter) {
		currentPage = 1;
		loadEvents();
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
</script>

<section class="relative max-w-6xl">
	<h1 class="text-xl font-bold">
		{searchQuery ? `Results for "${searchQuery}"` : 'Featured Events'}
	</h1>

	{#if loading}
	<div class="py-5 grid gap-4 lg:grid-cols-2 animate-pulse">
		{#each [1, 2, 3, 4] as _}
		<div class="h-48 rounded-xl bg-gray-200"></div>
		{/each}
	</div>

	{:else if displayEvents.length === 0}
	<div class="flex h-48 items-center justify-center">
		<div class="text-center">
			<p class="text-lg text-gray-400">No events found</p>
			<p class="text-sm text-gray-300 mt-1">
				{searchQuery ? 'Try a different search term' : 'Check back later for upcoming events'}
			</p>
		</div>
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
				on:click={() => { currentPage--; loadEvents(); }}
			>
				Previous
			</button>
			<span class="text-sm text-gray-500">
				Page {pagination.page} of {pagination.totalPages}
			</span>
			<button
				class="rounded-lg px-3 py-1.5 text-sm {currentPage >= pagination.totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
				disabled={currentPage >= pagination.totalPages}
				on:click={() => { currentPage++; loadEvents(); }}
			>
				Next
			</button>
		</div>
		{/if}
	</main>
	{/if}
</section>
