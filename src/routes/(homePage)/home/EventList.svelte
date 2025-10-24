<script>
	import EventCard from '$lib/components/EventCard.svelte';

	const event1 = {
		time: 'Jun 28, 12:00 PM',
		title: "Geegpay's Geegs & Groove",
		organizers: 'By Cynthia Orji & Beverly',
		location: 'Lagos',
		locationIcon: '/location.svg',
		status: 'Attending',
		availability: 'sold out',
		attendees: '+1.5K',
		image: '/eventcard.png',
		tag: 'Tech Cabal'
	};

	const event2 = {
		time: 'Jul 05, 4:00 PM',
		title: 'Tech Creatives Meetup',
		organizers: 'By Femi Johnson',
		location: 'Zoom',
		locationIcon: '/zoom.svg',
		status: 'Attending',
		availability: 'sold out',
		attendees: '+3.2k',
		image: '/eventcard1.png',
		tag: ''
	};

	const event3 = {
		time: 'Aug 12, 7:00 PM',
		title: 'Music & Money Vibes',
		organizers: 'By DJ Spinall',
		location: 'Hybrid',
		locationIcon: '/hybrid.svg',
		status: 'Attending',
		availability: 'selling out',
		attendees: '+2K',
		image: '/eventcard2.png',
		tag: ''
	};

	// Add each event twice
	const events = [event1, event2, event3, event1, event2, event3];
</script>

<section id="events" class="px-5 pt-10 pb-20 md:px-20">
	<div class="mx-auto max-w-7xl">
		<!-- Section Heading -->
		<h2
			class="mb-12 text-center text-[40px] font-medium whitespace-nowrap text-gray-900 md:text-[56px]"
		>
			Popular <span class="text-[#7B2CBF]">Events.</span>
		</h2>

		<!-- Events Grid -->
		<div class="mb-12 grid gap-4 lg:grid-cols-2">
			{#each events as event, index (index)}
				<EventCard {event} />
			{/each}
		</div>

		<!-- Centered Button -->
		<div class="flex justify-center">
			<a
				href="/discover"
				class="flex h-[60px] w-[300px] items-center justify-center gap-2 rounded-[13px] bg-[#333537] px-8 py-3 text-center text-[20px] text-white transition-colors duration-200 hover:bg-gray-900 hover:text-white"
			>
				<img src="/Disc1.svg" alt="Discover Icon" class="h-6 w-6 object-contain" />
				Discover more events
			</a>
		</div>
	</div>
</section>
