<script>
	import Header from './components/Header.svelte';
	import Sidebar from './components/Sidebar.svelte';
	import Hero from './components/Hero.svelte';
	import EventList from './components/EventList.svelte';
</script>

<main class="relative h-full w-full">
	<Header />

	<div class="px-2 pt-7 md:px-3 lg:flex lg:pt-10">
		<!-- Sidebar -->
		<Sidebar />

		<!-- Main Content Area -->
		<div class="flex h-full flex-1 flex-col gap-7 overflow-x-hidden px-2 lg:px-4">
			<!-- Hero -->
			<Hero />
			<EventList />
		</div>
	</div>
</main>
