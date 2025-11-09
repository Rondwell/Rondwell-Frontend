<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';

	let activeTab = 'Created';

	const events = [
		{
			date: '2025-09-25',
			time: '12:00 PM',
			title: "Geegpay's Geegs & Groove",
			organizers: 'By Cynthia Orji & Beverly',
			location: 'Lagos',
			locationIcon: '/location.svg',
			status: 'Attending',
			availability: 'sold out',
			attendees: '+1.5K',
			image: '/eventcard.png',
			tag: 'Tech Cabal'
		},
		{
			date: '2025-10-05',
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

	// Format a date for display
	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return {
			formatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
		};
	}

	// Get today's date (no time)
	function getToday() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return today;
	}

	// Reactive: Filter events based on active tab
	// $: filteredEvents = events.filter((event) => {
	// 	const eventDate = new Date(event.date);
	// 	const today = getToday();
	// 	return activeTab === 'Created' ? eventDate >= today : eventDate < today;
	// });

	let type: string;

	$: filteredEvents = events.filter((event) => {
		if (activeTab === 'Created') {
			// Example: show events NOT marked as attending
			return (type = 'mine');
		}
		if (activeTab === 'Attending') {
			return (type = 'attending');
		}
		return true;
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

<div class="w-full">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-3xl font-medium">Events</h2>

		<div class="h-[50px] w-fit rounded bg-[#E0E9EC] p-1 text-[#98A1A4]">
			<button
				class={`h-full w-25 cursor-pointer rounded px-3 py-1 text-sm ${
					activeTab === 'Created' ? 'bg-white text-black shadow-md' : ''
				}`}
				on:click={() => (activeTab = 'Created')}
			>
				Created
			</button>
			<button
				class={`h-full w-25 cursor-pointer rounded px-3 py-1 text-sm ${
					activeTab === 'Attending' ? 'bg-white text-black shadow-md' : ''
				}`}
				on:click={() => (activeTab = 'Attending')}
			>
				Attending
			</button>
		</div>
	</div>

	<!-- <EventCard {events} /> -->
	<div class="mb-12 w-full space-y-10">
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
	</div>
</div>
