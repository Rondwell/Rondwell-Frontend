<script>
	import Header from './home/Header.svelte';
	import Hero from './home/Hero.svelte';
	import Features from './home/Features.svelte';
	import EventList from './home/eventList.svelte';
	import EventSlide from './home/EventSlide.svelte';
</script>

<main class="relative w-full">
	<Header />
	<div class="hero-section">
		<!-- Landing Section -->
		<Hero />

		<!-- Event Card Section -->
		<EventSlide />
	</div>

	<!-- Features Section -->
	<Features />

	<!-- Events Section -->
	<EventList />
</main>

<style>
	.hero-section {
		position: relative;
		background: linear-gradient(
			135deg,
			#eb9ec4ff 0%,
			#ffe0f0 20%,
			#ffd1e8 40%,
			#ffffff 70%,
			#ffd1e8 100%,
			#e6e6fa 80%,
			#ffd1e8 90%,
			#f8e1ff 100%
		);
	}
</style>
