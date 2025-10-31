<script context="module">
	export const prerender = false;
</script>

<script>
	import Header from './components/Header.svelte';
	import DiscoverSidebar from './components/Sidebar.svelte';
	import Sidebar from '../components/Sidebar.svelte';
	import Hero from './components/Hero.svelte';
	import EventList from './components/EventList.svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';

	$: url = $page.url;
	$: show = url.searchParams.get('show') === 'true';
</script>

<div class="relative flex min-h-screen text-sm font-medium">
	<!-- Sidebar -->
	<div class="relative md:min-w-[117px] {show ? '' : 'hidden'}">
		<Sidebar background_color="#F4F5F6" />
		<!-- <SideMenu /> -->
	</div>
	<main class="relative h-full w-full">
		<div class={show ? 'hidden' : ''}>
			<Header />
		</div>
		<div class="px-2 pt-7 md:px-3 lg:flex lg:pt-10">
			<!-- Sidebar -->
			<DiscoverSidebar />

			<!-- Main Content Area -->
			<div class="flex h-full flex-1 flex-col gap-7 overflow-x-hidden px-2 lg:px-4">
				<!-- Hero -->
				<Hero />
				<EventList />
			</div>
		</div>
	</main>
</div>
