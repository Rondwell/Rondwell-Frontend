<script>
	import Header from './components/Header.svelte';
	import Sidebar from './components/Sidebar.svelte';
	import Hero from './components/Hero.svelte';
</script>

<main class="relative w-full">
	<Header />

	<div class="flex h-screen px-3 pt-10">
		<!-- Sidebar -->
		<Sidebar />

		<!-- Main Content Area -->
		<div class="flex flex-1 flex-col overflow-hidden px-4">
			<!-- Hero -->
			<Hero />
		</div>
	</div>
</main>

<style>
	/* Optional: Add global styles if needed */
</style>
