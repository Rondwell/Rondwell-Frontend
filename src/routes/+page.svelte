<script>
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<main class="relative w-full">
	<!-- Main Page Layout -->
	<Header />

	<!-- Landing Section -->
	<Hero />

	<Footer />

	<div class="fixed bottom-0 right-0 p-5">
		<ThemeToggle />
	</div>
</main>
