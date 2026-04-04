<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import EventCard from '$lib/components/EventCard.svelte';
	import { getCollectionEvents } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import CreatedEventModal from '../components/CreatedEventModal.svelte';
	import ExternalEventModal from '../components/ExternalEventModal.svelte';
	import AddEventCollectionModal from './AddEventCollectionModal.svelte';

	$: collectionId = $page.params.id ?? '';

	let activeTab: 'Upcoming' | 'Past' = 'Upcoming';
	type ActiveModal = 'none' | 'collection' | 'created' | 'external';
	let activeModal: ActiveModal = 'none';
	let events: any[] = [];
	let loading = true;

	function openCollectionModal() { activeModal = 'collection'; }
	function closeAllModals() { activeModal = 'none'; }

	async function loadEvents() {
		if (!collectionId) return;
		loading = true;
		try {
			const filter = activeTab === 'Upcoming' ? 'upcoming' : 'past';
			events = await getCollectionEvents(collectionId, filter);
		} catch { events = []; }
		finally { loading = false; }
	}

	onMount(() => loadEvents());
	$: activeTab, loadEvents();

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return {
			formatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
		};
	}

	// Group events by date
	$: groupedEvents = (() => {
		const map = new Map<string, any[]>();
		for (const event of events) {
			const dateKey = new Date(event.startDateTime).toISOString().split('T')[0];
			if (!map.has(dateKey)) map.set(dateKey, []);
			map.get(dateKey)!.push({
				...event,
				id: event._id ?? event.id,
				date: dateKey,
				time: new Date(event.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
				location: event.eventType === 'HYBRID' ? 'Hybrid' : event.eventType === 'VIRTUAL' ? (event.locationDetails?.virtual?.platform ?? 'Virtual') : (event.locationDetails?.physical?.venueName ?? 'Physical'),
				locationIcon: event.eventType === 'HYBRID' ? '/hybrid.svg' : event.eventType === 'VIRTUAL' ? '/zoom.svg' : '/location.svg',
				attendees: event.attendeeCount ?? 0,
				image: event.displayPictureUrl || event.coverPictureUrl || '/eventcard2.png',
				category: event.category ?? '',
			});
		}
		return map;
	})();

	let type = 'mine';

	async function handleEventAdded() {
		closeAllModals();
		await loadEvents();
	}
</script>

<div class="px-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="flex items-center gap-2 text-xl font-semibold">
			Events
			<div class="ml-4">
				<button on:click={openCollectionModal}
					class="flex h-9 w-9 items-center justify-center rounded-full bg-[#EBECED] p-1 transition-colors duration-500 hover:bg-[#E8E8E8]">
					<Icon icon="mdi:plus" class="h-6 w-6 text-[#616265]" />
				</button>
			</div>

			<AddEventCollectionModal
				open={activeModal === 'collection'}
				on:close={closeAllModals}
				on:createdEvent={() => (activeModal = 'created')}
				on:externalEvent={() => (activeModal = 'external')}
			/>

			<CreatedEventModal
				open={activeModal === 'created'}
				{collectionId}
				on:close={closeAllModals}
				on:added={handleEventAdded}
				on:collection={openCollectionModal}
			/>

			<ExternalEventModal
				open={activeModal === 'external'}
				{collectionId}
				on:close={closeAllModals}
				on:added={handleEventAdded}
				on:collection={openCollectionModal}
			/>
		</h1>

		<div class="h-10 w-fit rounded bg-[#EBECED] p-1 text-[#A1A2A2]">
			<button class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${activeTab === 'Upcoming' ? 'bg-white text-black' : ''}`}
				on:click={() => (activeTab = 'Upcoming')}>Upcoming</button>
			<button class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${activeTab === 'Past' ? 'bg-white text-black' : ''}`}
				on:click={() => (activeTab = 'Past')}>Past</button>
		</div>
	</div>

	<div class="mb-12 w-full space-y-10">
		{#if loading}
			<div class="w-full space-y-8 animate-pulse">
				{#each [1, 2] as _}
					<div class="flex flex-col items-stretch gap-4 md:flex-row">
						<div class="flex w-full max-w-30 justify-between">
							<div class="flex flex-col gap-2">
								<div class="h-5 w-16 rounded bg-gray-200"></div>
								<div class="h-4 w-20 rounded bg-gray-200"></div>
							</div>
							<div class="hidden w-[11.75px] flex-col items-center justify-center gap-1 md:flex">
								<span class="h-[11.75px] w-[11.75px] rounded-full bg-gray-200"></span>
								<span class="ml-1 h-full border-2 border-dashed border-gray-200"></span>
							</div>
						</div>
						<div class="flex w-full flex-col gap-4 md:max-w-[687px]">
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
		{:else if groupedEvents.size === 0}
			<div class="mt-20 flex flex-col items-center justify-center gap-4">
				<img src="/noEvent.svg" alt="No Events" class="ml-4 h-60 w-60" />
				<h2 class="text-lg font-semibold text-[#646568]">No Events, yet</h2>
				<p class="max-w-md text-center text-[#A2ACB2]">
					This collection has no {activeTab.toLowerCase()} events.
				</p>
				<button on:click={openCollectionModal}
					class="flex items-center rounded-2xl bg-[#EFEFEF] px-3 py-1 text-[#A0A1A3]">
					<Icon icon="mdi:plus" class="text-xl" /> Add Event
				</button>
			</div>
		{:else}
			{#each Array.from(groupedEvents) as [date, dayEvents]}
				<div class="flex flex-col items-stretch gap-4 md:flex-row">
					<div class="flex w-full max-w-30 justify-between">
						<div>
							<div class="text-lg">{formatDate(date).formatted}</div>
							<div class="text-lg text-[#B9BABA]">{formatDate(date).weekday}</div>
						</div>
						<div class="hidden w-[11.75px] flex-col items-center justify-center gap-1 md:flex">
							<span class="h-[11.75px] w-[11.75px] rounded-full bg-[#D9D9D9]"></span>
							<span class="ml-1 h-full border-2 border-dashed border-[#D9D9D9]"></span>
						</div>
					</div>
					<div class="flex w-full flex-col gap-4 overflow-hidden md:max-w-[687px]">
						{#each dayEvents as event, index (event._id ?? index)}
							<EventCard {event} {type} />
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
