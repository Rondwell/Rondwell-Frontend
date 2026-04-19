<script lang="ts">
	import Footer from '../../(homePage)/components/Footer.svelte';
	import Sidebar from '../components/Sidebar.svelte';
	import EventList from './components/EventList.svelte';
	import Header from './components/Header.svelte';
	import Hero from './components/Hero.svelte';
	import DiscoverSidebar from './components/Sidebar.svelte';
	import VendorList from './components/VendorList.svelte';

	let show = false;
	let activeTab: 'events' | 'vendors' = 'events';

	if (typeof window !== 'undefined') {
		const params = new URLSearchParams(window.location.search);
		show = params.get('show') === 'true';
		if (params.get('tab') === 'vendors') activeTab = 'vendors';
	}
</script>

<svelte:head>
	<title>Discover Events | Rondwell</title>
	<meta name="description" content="Discover and explore upcoming events near you. Find conferences, meetups, workshops, and more on Rondwell." />
	<meta property="og:title" content="Discover Events | Rondwell" />
	<meta property="og:description" content="Discover and explore upcoming events near you. Find conferences, meetups, workshops, and more." />
	<meta property="og:image" content="https://rondwell.com/og-default.png" />
	<meta property="og:url" content="https://rondwell.com/discover" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Discover Events | Rondwell" />
	<meta name="twitter:description" content="Discover and explore upcoming events near you." />
	<link rel="canonical" href="https://rondwell.com/discover" />
</svelte:head>

<div class="relative flex min-h-screen bg-[#F4F5F6] text-sm font-medium">
	<!-- Sidebar -->
	<div class="relative md:min-w-[117px] {show ? '' : 'hidden'}">
		<Sidebar background_color="#F4F5F6" show={false} />
	</div>
	<main class="relative h-full w-full {show ? 'mb-[106px] md:mb-0' : ''}">
		<div class={show ? 'hidden' : ''}>
			<Header />
		</div>
		<div class="px-2 pt-7 md:px-3 lg:flex lg:pt-10">
			<!-- Sidebar -->
			<DiscoverSidebar />

			<!-- Main Content Areas -->
			<div
				class="custom-scrollbar flex h-full flex-1 flex-col gap-7 overflow-x-hidden overflow-y-auto px-2 lg:px-4"
			>
				<!-- Hero -->
				<Hero />

				<!-- Tabs -->
				<div class="flex gap-1 border-b border-gray-200">
					<button
						class="px-4 pb-2 text-sm font-medium transition-colors {activeTab === 'events' ? 'border-b-2 border-[#513BE2] text-[#513BE2]' : 'text-gray-500 hover:text-gray-700'}"
						on:click={() => (activeTab = 'events')}
					>
						Events
					</button>
					<button
						class="px-4 pb-2 text-sm font-medium transition-colors {activeTab === 'vendors' ? 'border-b-2 border-[#513BE2] text-[#513BE2]' : 'text-gray-500 hover:text-gray-700'}"
						on:click={() => (activeTab = 'vendors')}
					>
						Vendors
					</button>
				</div>

				{#if activeTab === 'events'}
					<EventList />
				{:else}
					<VendorList />
				{/if}
			</div>
		</div>
		<div class={show ? 'hidden' : ''}>
			<Footer />
		</div>
	</main>
</div>
