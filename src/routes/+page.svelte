<script>
	import Header from '$lib/components/homapagecode/Header.svelte';
	import Footer from '$lib/components/homapagecode/Footer.svelte';
	import Hero from '$lib/components/homapagecode/Hero.svelte';

	import Features from '$lib/components/homapagecode/features.svelte';
	import EventListing from '$lib/components/homapagecode/event-listing.svelte';
	
</script>

<main class="relative w-full">
	<!-- Main Page Layout -->
	<Header />

	<!-- Landing Section -->
	<Hero />

	<!-- Event Card Section -->
	

	<!-- Features Section -->
	<Features />

	<!-- Events Section -->
	<EventListing />

	<Footer />

</main>
