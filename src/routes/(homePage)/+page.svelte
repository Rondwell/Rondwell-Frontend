<script>
	import Header from './home/Header.svelte';
	import Hero from './home/Hero.svelte';
	import Features from './home/Features.svelte';
	import EventList from './home/EventList.svelte';
	import EventSlide from './home/EventSlide.svelte';
</script>

<main class="relative w-full">
	<div class="hero-section">
		<div class="highlight highlight-1"></div>
		<div class="highlight highlight-2"></div>
		<div class="highlight highlight-3"></div>
		<div class="highlight highlight-4"></div>
		<Header />

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
		overflow: hidden;
		background:
			linear-gradient(0deg, rgba(251, 219, 231, 0.33), rgba(251, 219, 231, 0.33)), #ffffff;
	}

	.highlight {
		position: absolute;
		border-radius: 50%;
		z-index: 1;
	}

	/* Example highlight 1 */
	.highlight-1 {
		width: 693px;
		height: 662px;
		left: -60px;
		top: 58px;
		background: rgba(255, 117, 169, 0.55);
		filter: blur(189px);
	}

	/* Example highlight 2 */
	.highlight-2 {
		width: 547px;
		height: 549px;
		left: 892px;
		top: 58px;
		background: rgba(255, 195, 124, 0.44);
		filter: blur(189px);
	}

	.highlight-3 {
		width: 312px;
		height: 299px;
		left: 210px;
		top: 683px;
		background: #ff7eaf;
		filter: blur(189px);
	}

	.highlight-4 {
		width: 609px;
		height: 613px;
		left: 1044px;
		top: 817px;
		background: rgba(231, 126, 231, 0.66);
		filter: blur(189px);
	}
</style>
