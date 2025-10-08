<script>
	import Header from './components/Header.svelte';
	import Sidebar from './components/Sidebar.svelte';
	import Hero from './components/Hero.svelte';
	import EventList from './components/EventList.svelte';
</script>

<main class="relative h-full w-full">
	<Header />

	<div class="px-2 pt-10 md:px-3 lg:flex">
		<!-- Sidebar -->
		<Sidebar />

		<!-- Main Content Area -->
		<div class="flex h-full flex-1 flex-col gap-7 md:px-4">
			<!-- Hero -->
			<Hero />
			<EventList />
		</div>
	</div>
</main>
