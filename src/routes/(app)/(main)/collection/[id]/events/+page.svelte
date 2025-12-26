<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';
	import Icon from '@iconify/svelte';

	let activeTab: 'Upcoming' | 'Past' = 'Upcoming';

	type EventItem = {
		id?: number;
		title: string;
		date: string;
		day?: string;
		time?: string;
		location?: string;
		guests?: number;
		image?: string;
		organizers?: string;
		locationIcon?: string;
		status?: string;
		availability?: string;
		attendees?: string;
		tag?: string;
	};

	let events: EventItem[] = [
		{
			date: '2026-10-05',
			time: '7:00 PM',
			title: 'Music & Money Vibes',
			organizers: 'By DJ Spinall',
			location: 'Hybrid',
			locationIcon: '/hybrid.svg',
			status: 'Attending',
			availability: 'selling out',
			attendees: '+2K',
			image: '/eventcard2.png',
			tag: ''
		},
		{
			date: '2025-12-05',
			time: '4:00 PM',
			title: 'Tech Creatives Meetup',
			organizers: 'By Femi Johnson',
			location: 'Zoom',
			locationIcon: '/zoom.svg',
			status: 'Attending',
			availability: 'sold out',
			attendees: '+3.2k',
			image: '/eventcard1.png',
			tag: ''
		}
	];

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return {
			formatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
		};
	}

	function getToday() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return today;
	}

	let type: string = 'mine';

	// Reactive: Filter events based on active tab
	$: filteredEvents = events.filter((event) => {
		const eventDate = new Date(event.date);
		const today = getToday();
		return activeTab === 'Upcoming' ? eventDate >= today : eventDate < today;
	});

	// Reactive: Group filtered events by date
	$: groupedEvents = (() => {
		const map = new Map();
		filteredEvents.forEach((event) => {
			const date = event.date;
			if (!map.has(date)) {
				map.set(date, []);
			}
			map.get(date).push(event);
		});
		return map;
	})();
</script>

<!-- Event Header Section -->
<div class="">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="flex items-center gap-2 text-xl font-semibold">
			Events
			<button
				class="flex h-9 w-9 items-center justify-center rounded-full bg-[#EBECED] p-1 transition-colors duration-500 hover:bg-[#E8E8E8] hover:text-[#5555658]"
			>
				<Icon icon="mdi:plus" class="h-6 w-6 text-[#616265]" />
			</button>
		</h1>

		<div class="h-[40px] w-fit rounded bg-[#EBECED] p-1 text-[#A1A2A2]">
			<button
				class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${
					activeTab === 'Upcoming' ? 'bg-white text-black' : ''
				}`}
				on:click={() => (activeTab = 'Upcoming')}
			>
				Upcoming
			</button>
			<button
				class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${
					activeTab === 'Past' ? 'bg-white text-black' : ''
				}`}
				on:click={() => (activeTab = 'Past')}
			>
				Past
			</button>
		</div>
	</div>

	<!-- Event List Section -->
	<div class="mb-12 w-full space-y-10">
		{#if groupedEvents.size === 0}
			<div class="mt-20 flex flex-col items-center justify-center gap-4">
				<img src="/noEvent.svg" alt="No Events" class="ml-4 h-60 w-60" />
				<h2 class="text-lg font-semibold text-[#646568]">No Events, yet</h2>
				<p class="max-w-md text-center text-[#A2ACB2]">
					This calendar has no {activeTab.toLowerCase()} events.
				</p>

				<div class="flex items-center rounded-2xl bg-[#EFEFEF] px-1 py-0.5 text-[#A0A1A3]">
					<Icon icon="mdi:plus" class="text-xl" />
					Add Event
				</div>
			</div>
		{:else}
			{#each Array.from(groupedEvents) as [date, dayEvents]}
				<!-- Date Label -->
				<div class="flex flex-col items-stretch gap-4 md:flex-row">
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

					<div class="flex w-full max-w-[687px] flex-col gap-4">
						{#each dayEvents as event, index (index)}
							<EventCard {event} {type} />
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
