<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import EventCard from '$lib/components/EventCard.svelte';
	import { getMyEvents } from '$lib/services/event.services';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { onMount } from 'svelte';

	// Auth guard — redirect unauthenticated users to discover
	$: if (browser && !$isAuthenticated) {
		goto('/discover?show=true');
	}

	let activeTab: 'Created' | 'Attending' = 'Created';
	let createdEvents: any[] = [];
	let attendingEvents: any[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		if (!$isAuthenticated) return;
		try {
			createdEvents = await getMyEvents();
		} catch (e: any) {
			error = e.message ?? 'Failed to load events';
		} finally {
			loading = false;
		}
	});

	// Normalize a backend event into the shape EventCard expects
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
			date: e.startDateTime ? new Date(e.startDateTime).toISOString().split('T')[0] : '',
			time: e.startDateTime
				? new Date(e.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
				: '',
			title: e.title ?? 'Untitled Event',
			organizers: '',
			location,
			locationIcon,
			status: e.eventStatus ?? 'DRAFT',
			availability: '',
			attendees: e.attendeeCount ?? 0,
			image: e.displayPictureUrl ?? e.coverPictureUrl ?? '/event_pic1.png',
			tag: e.tags?.[0] ?? '',
			category: e.category ?? '',
			organizerAvatar: e.organizerAvatarUrl ?? '',
		};
	}

	$: displayEvents = activeTab === 'Created'
		? createdEvents.map(normalizeEvent)
		: attendingEvents.map(normalizeEvent);

	// Group by date string (YYYY-MM-DD), sorted latest first
	$: groupedEvents = (() => {
		const map = new Map<string, any[]>();
		displayEvents.forEach((event) => {
			if (!map.has(event.date)) map.set(event.date, []);
			map.get(event.date)!.push(event);
		});
		// Sort dates descending (latest first)
		return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
	})();

	function formatDate(dateStr: string) {
		if (!dateStr) return { formatted: '', weekday: '' };
		const d = new Date(dateStr);
		return {
			formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
		};
	}
</script>

<div class="w-full">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-2xl font-medium md:text-3xl">Events</h2>

		<div class="h-[50px] w-fit rounded bg-[#E0E9EC] p-1 text-[#98A1A4]">
			<button
				class={`h-full w-25 cursor-pointer rounded px-3 py-1 text-sm ${activeTab === 'Created' ? 'bg-white text-black shadow-md' : ''}`}
				on:click={() => (activeTab = 'Created')}
			>
				Created
			</button>
			<button
				class={`h-full w-25 cursor-pointer rounded px-3 py-1 text-sm ${activeTab === 'Attending' ? 'bg-white text-black shadow-md' : ''}`}
				on:click={() => (activeTab = 'Attending')}
			>
				Attending
			</button>
		</div>
	</div>

	{#if loading}
		<!-- Skeleton loader -->
		<div class="mb-12 w-full space-y-10 animate-pulse">
			{#each [1, 2] as _}
				<div class="flex flex-col items-stretch gap-4 md:flex-row">
					<!-- Date label skeleton -->
					<div class="flex w-full max-w-[120px] justify-between">
						<div class="flex flex-col gap-2">
							<div class="h-5 w-16 rounded bg-gray-200"></div>
							<div class="h-4 w-20 rounded bg-gray-200"></div>
						</div>
						<div class="hidden w-[11.75px] flex-col items-center justify-center gap-1 md:flex">
							<span class="h-[11.75px] w-[11.75px] rounded-full bg-gray-200"></span>
							<span class="ml-1 h-full border-2 border-dashed border-gray-200"></span>
						</div>
					</div>
					<!-- Card skeleton -->
					<div class="flex w-full max-w-[687px] flex-col gap-4">
						<div class="flex gap-4 rounded-md bg-[#FDFDFD] p-6">
							<div class="flex-1 space-y-3">
								<div class="h-3 w-16 rounded bg-gray-200"></div>
								<div class="h-5 w-48 rounded bg-gray-200"></div>
								<div class="h-3 w-24 rounded bg-gray-200"></div>
								<div class="h-3 w-32 rounded bg-gray-200"></div>
								<div class="h-8 w-28 rounded bg-gray-200"></div>
							</div>
							<div class="h-30 w-30 flex-shrink-0 rounded-xl bg-gray-200"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>

	{:else if error}
		<div class="flex h-40 items-center justify-center text-red-500">{error}</div>

	{:else if groupedEvents.size === 0}
		<div class="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
			<p class="text-lg">No {activeTab === 'Created' ? 'created' : 'attended'} events yet.</p>
			{#if activeTab === 'Created'}
				<button
					on:click={() => goto('/create-event')}
					class="rounded-md bg-[#513BE2] px-4 py-2 text-sm text-white"
				>
					Create your first event
				</button>
			{/if}
		</div>

	{:else}
		<div class="mb-12 w-full space-y-10">
			{#each Array.from(groupedEvents) as [date, dayEvents]}
				<div class="flex flex-col items-stretch gap-4 md:flex-row">
					<!-- Date label -->
					<div class="flex w-full max-w-[120px] justify-between">
						<div>
							<div class="text-lg">{formatDate(date).formatted}</div>
							<div class="text-lg text-[#B9BABA]">{formatDate(date).weekday}</div>
						</div>
						<div class="hidden w-[11.75px] flex-col items-center justify-center gap-1 md:flex">
							<span class="h-[11.75px] w-[11.75px] rounded-full bg-[#D9D9D9]"></span>
							<span class="ml-1 h-full border-2 border-dashed border-[#D9D9D9]"></span>
						</div>
					</div>

					<!-- Cards for this date -->
					<div class="flex w-full max-w-[687px] flex-col gap-4">
						{#each dayEvents as event (event.id)}
							{#if activeTab === 'Created'}
								<a href={`/events/${event.id}`} class="no-underline">
									<EventCard {event} type="mine" />
								</a>
							{:else}
								<a href={`/event-page/${event.id}`} class="no-underline">
									<EventCard {event} type="attending" />
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
