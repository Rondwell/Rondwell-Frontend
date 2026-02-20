<script lang="ts">
	import EventApplicationCard from '$lib/components/EventApplicationCard.svelte';

	let activeTab = 'Created';
	
	const events = [
		{
			date: '2025-09-25',
			time: '12:00 PM',
			title: "Fill Lagos",
			organizers: 'By Filecoin Orbit Community Africa',
			location: 'Lagos',
			locationIcon: '/location.svg',
			status: 'Invited',
			attendees: '0',
			image: '/eventcard.png',
			tag: 'Tech Cabal'
		},
		{
			date: '2025-10-05',
			time: '7:00 PM',
			title: 'Building a sustainable and profitable Credit Business in Nigeria',
			organizers: 'By Anchor, Chukwuma Nwaze & Segun Adeyemi',
			location: 'Hybrid',
			locationIcon: '/hybrid.svg',
			status: 'Going',
			attendees: '388',
			image: '/eventcard2.png',
			tag: ''
		},
		{
			date: '2025-12-05',
			time: '4:00 PM',
			title: 'Ask me anything with product Expert & Author Dan Olsen',
			organizers: 'By Dan Olsen',
			location: 'Zoom',
			locationIcon: '/zoom.svg',
			status: 'Going',
			attendees: '59',
			image: '/eventcard1.png',
			tag: ''
		},
		{
			date: '2025-12-05',
			time: '4:00 PM',
			title: 'A tactical guide to master product discovery to build products users love',
			organizers: 'By Producted & Laura Kluz',
			location: 'Zoom',
			locationIcon: '/zoom.svg',
			status: 'Going',
			attendees: '0',
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
<!-- EventCard component is commented out -->
<div class="w-full">
	<!-- <EventCard {events} /> -->
	<div class="mb-12 w-full space-y-10">
		{#each Array.from(groupedEvents) as [date, dayEvents]}
			<!-- Date Label -->
			<div class="flex flex-col items-stretch gap-4 md:flex-row">
				<div class="flex w-full max-w-[200px] justify-between">
					<div>
						<div class="whitespace-nowrap text-sm font-medium">{formatDate(date).formatted}</div>
						<div class="whitespace-nowrap text-sm text-gray-400">{formatDate(date).weekday}</div>
					</div>
					<div class="relative hidden md:flex w-[11px] shrink-0 justify-center self-stretch">
						<span class="absolute top-0 bottom-0 border-l-2 border-dashed border-[#D9D9D9]"></span>
						<span class="relative z-10 mt-2 h-[11px] w-[11px] rounded-full bg-[#D9D9D9]"></span>
					</div>
				</div>
                

				<div class="flex w-full flex-col gap-4">
					{#each dayEvents as event, index (index)}
						<a href={type === 'mine' ? '/events/1' : '/event-page/1'}>
							<EventApplicationCard {event} />
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
