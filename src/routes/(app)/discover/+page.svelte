<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import Footer from '../../(homePage)/components/Footer.svelte';
	import Sidebar from '../components/Sidebar.svelte';
	import EventList from './components/EventList.svelte';
	import Header from './components/Header.svelte';
	import Hero from './components/Hero.svelte';
	import DiscoverSidebar from './components/Sidebar.svelte';
	import VendorList from './components/VendorList.svelte';
	import SpeakerList from './components/SpeakerList.svelte';
	import ExhibitorList from './components/ExhibitorList.svelte';
	import {
		discoverTab,
		enableDiscoverUrlSync,
		hydrateDiscoverFromUrl,
		isSelfWrittenUrl,
		setTab,
		tabForShortcut
	} from '$lib/stores/discover.store';

	/** `?show=true` renders the page inside the app shell (with the app sidebar). */
	let show = false;

	let disableUrlSync: (() => void) | null = null;

	// Hydrate during client init (not onMount) so a shared link like
	// /discover?tab=vendors renders the right tab on the very first client paint.
	// Browser-only: the stores are module singletons and must never carry state
	// between server requests.
	if (browser) {
		const initialUrl = new URL(window.location.href);
		show = initialUrl.searchParams.get('show') === 'true';
		hydrateDiscoverFromUrl(initialUrl);
	}

	onMount(() => {
		disableUrlSync = enableDiscoverUrlSync();

		window.addEventListener('popstate', handlePopState);
		window.addEventListener('keydown', handleShortcut);
	});

	onDestroy(() => {
		disableUrlSync?.();
		if (typeof window === 'undefined') return;
		window.removeEventListener('popstate', handlePopState);
		window.removeEventListener('keydown', handleShortcut);
	});

	function handlePopState() {
		hydrateDiscoverFromUrl(new URL(window.location.href));
	}

	/** Bare-letter tab shortcuts (E, X, V, S, C) — ignored while typing. */
	function handleShortcut(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;

		const target = event.target as HTMLElement | null;
		if (target) {
			const tag = target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
				return;
			}
		}

		// Don't hijack letters while a dropdown is open — the user is filtering.
		if (document.querySelector('.glass-popover')) return;

		const tab = tabForShortcut(event.key);
		if (!tab) return;
		event.preventDefault();
		setTab(tab);
	}

	// Keep the tab in step when SvelteKit navigates to /discover with a new query
	// string (e.g. the "Discover vendors" links elsewhere in the app). History
	// writes made by the store itself are ignored — the state already matches.
	let lastSearch: string | null = null;
	$: if ($page.url && $page.url.search !== lastSearch) {
		lastSearch = $page.url.search;
		if (typeof window !== 'undefined' && !isSelfWrittenUrl($page.url)) {
			hydrateDiscoverFromUrl($page.url);
		}
	}
</script>

<svelte:head>
	<title>Discover | Rondwell</title>
	<meta name="description" content="Discover events, vendors, speakers, and exhibitors on Rondwell. Find conferences, meetups, workshops, and more." />
	<meta property="og:title" content="Discover | Rondwell" />
	<meta property="og:description" content="Discover events, vendors, speakers, and exhibitors on Rondwell." />
	<meta property="og:image" content="https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png" />
	<!-- Required for WhatsApp to render a large preview card without first
	     downloading the image to measure it. -->
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:url" content="https://rondwell.com/discover" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Discover | Rondwell" />
	<meta name="twitter:description" content="Discover events, vendors, speakers, and exhibitors on Rondwell." />
	<meta name="twitter:image" content="https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png" />
	<meta name="twitter:site" content="@rondwellhq" />
	<link rel="canonical" href="https://rondwell.com/discover" />
</svelte:head>

<div class="relative flex min-h-screen text-sm font-medium" style="background: linear-gradient(180deg, #e6e6fa 0%, #f1effa 14%, #f4f5f6 34%);">
	<!-- Sidebar -->
	<div class="relative md:min-w-[117px] {show ? '' : 'hidden'}">
		<Sidebar background_color="" {show} />
	</div>
	<main class="relative h-full w-full {show ? 'mb-[106px] md:mb-0' : ''}">
		<div class={show ? 'hidden' : ''}>
			<Header />
		</div>
		<div class="mx-auto max-w-7xl px-2 pt-6 md:flex md:gap-5 md:px-4 lg:gap-6 lg:pt-10">
			<!-- Sidebar -->
			<DiscoverSidebar />

			<!-- Main Content Areas -->
			<div
				class="custom-scrollbar flex h-full flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto px-2 lg:px-4"
			>
				<!-- Hero -->
				<Hero />

				<!-- Content based on sidebar selection -->
				{#if $discoverTab === 'Vendors'}
					<VendorList />
				{:else if $discoverTab === 'Speakers'}
					<SpeakerList />
				{:else if $discoverTab === 'Exhibitors'}
					<ExhibitorList />
				{:else if $discoverTab === 'Community'}
					<div class="flex flex-col items-center justify-center gap-3 rounded-3xl border border-black/8 bg-white/80 px-6 py-20 text-center shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md">
						<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#059669]/10 text-[#059669] ring-1 ring-[#059669]/15">
							<Icon icon="solar:users-group-rounded-bold-duotone" class="h-7 w-7" />
						</div>
						<h3 class="text-lg font-bold tracking-tight text-[#17161E]">Community</h3>
						<p class="max-w-sm text-sm text-[#5F5C6D]">Community spaces and curated event threads are coming soon. Stay tuned!</p>
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
