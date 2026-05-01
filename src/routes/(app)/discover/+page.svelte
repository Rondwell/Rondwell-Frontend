<script lang="ts">
	import Footer from '../../(homePage)/components/Footer.svelte';
	import Sidebar from '../components/Sidebar.svelte';
	import EventList from './components/EventList.svelte';
	import Header from './components/Header.svelte';
	import Hero from './components/Hero.svelte';
	import DiscoverSidebar from './components/Sidebar.svelte';
	import VendorList from './components/VendorList.svelte';
	import SpeakerList from './components/SpeakerList.svelte';
	import ExhibitorList from './components/ExhibitorList.svelte';

	let show = false;
	let activeItem = 'Events';

	if (typeof window !== 'undefined') {
		const params = new URLSearchParams(window.location.search);
		show = params.get('show') === 'true';
		const tab = params.get('tab');
		if (tab === 'vendors') activeItem = 'Vendors';
		else if (tab === 'speakers') activeItem = 'Speakers';
		else if (tab === 'exhibitors') activeItem = 'Exhibitors';
	}
</script>

<svelte:head>
	<title>Discover | Rondwell</title>
	<meta name="description" content="Discover events, vendors, speakers, and exhibitors on Rondwell. Find conferences, meetups, workshops, and more." />
	<meta property="og:title" content="Discover | Rondwell" />
	<meta property="og:description" content="Discover events, vendors, speakers, and exhibitors on Rondwell." />
	<meta property="og:image" content="https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png" />
	<meta property="og:url" content="https://rondwell.com/discover" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Discover | Rondwell" />
	<meta name="twitter:description" content="Discover events, vendors, speakers, and exhibitors on Rondwell." />
	<meta name="twitter:image" content="https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png" />
	<meta name="twitter:site" content="@rondwellhq" />
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
			<DiscoverSidebar bind:activeItem />

			<!-- Main Content Areas -->
			<div
				class="custom-scrollbar flex h-full flex-1 flex-col gap-7 overflow-x-hidden overflow-y-auto px-2 lg:px-4"
			>
				<!-- Hero -->
				<Hero bind:activeItem={activeItem} />

				<!-- Content based on sidebar selection -->
				{#if activeItem === 'Events'}
					<EventList />
				{:else if activeItem === 'Vendors'}
					<VendorList />
				{:else if activeItem === 'Speakers'}
					<SpeakerList />
				{:else if activeItem === 'Exhibitors'}
					<ExhibitorList />
				{:else if activeItem === 'Community'}
					<div class="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white py-20">
						<p class="text-5xl">💬</p>
						<h3 class="text-lg font-semibold text-gray-900">Community</h3>
						<p class="max-w-sm text-center text-sm text-gray-500">Community features are coming soon. Stay tuned!</p>
					</div>
				{:else}
					<EventList />
				{/if}
			</div>
		</div>
		<div class={show ? 'hidden' : ''}>
			<Footer />
		</div>
	</main>
</div>
