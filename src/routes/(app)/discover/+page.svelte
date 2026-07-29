<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
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
	<meta name="theme-color" content="#e6e6fa" />
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
