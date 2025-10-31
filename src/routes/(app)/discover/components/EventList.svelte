<script>
	import EventCard from '$lib/components/EventCard.svelte';
	import Scroll from '../../../../lib/components/Scroll.svelte';

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

<section class="relative max-w-6xl">
	<h1 class="text-xl font-bold">Featured Events</h1>
	<main class="h-full py-5">
		<div class="mb-12 grid gap-4 lg:grid-cols-2">
			{#each events as event, index (index)}
				<EventCard {event} />
			{/each}
		</div>
	</main>
	<Scroll />
</section>
