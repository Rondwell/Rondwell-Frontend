<script lang="ts">
	import { page } from '$app/stores';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import Icon from '@iconify/svelte';
	import Nav from '../../../../components/Nav.svelte';
	import Admin from './components/Admin.svelte';
	import Agenda from './components/Agenda.svelte';
	import Community from './components/Community.svelte';
	import Media from './components/Media.svelte';
	import Rooms from './components/Rooms.svelte';
	import Sessions from './components/Sessions.svelte';

	$: eventId = $page.params.id;

	// Use cached event data
	$: ({ event: eventStore, collections: collectionsStore, loading: loadingStore } = getEventCache(eventId!));
	$: rawEvent = $eventStore;
	$: cachedCollections = $collectionsStore;
	$: loading = $loadingStore;

	$: eventData = rawEvent ? {
		title: rawEvent.title ?? 'Untitled Event',
		collection: cachedCollections.find((c: any) => c._id === rawEvent.collectionId || c.id === rawEvent.collectionId)?.name ?? 'My Collection',
		collectionId: rawEvent.collectionId ?? '',
	} : null;

	const tabs = [
		{
			id: 'rooms',
			label: 'Rooms',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.51602 2.36517L3.02435 5.86517C2.27435 6.44851 1.66602 7.69017 1.66602 8.63184V14.8068C1.66602 16.7402 3.24102 18.3235 5.17435 18.3235H14.8244C16.7577 18.3235 18.3327 16.7402 18.3327 14.8152V8.74851C18.3327 7.74017 17.6577 6.44851 16.8327 5.87351L11.6827 2.26517C10.516 1.44851 8.64102 1.49017 7.51602 2.36517Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.75 15H11.25C12.625 15 13.75 13.875 13.75 12.5V10C13.75 8.625 12.625 7.5 11.25 7.5H8.75C7.375 7.5 6.25 8.625 6.25 10V12.5C6.25 13.875 7.375 15 8.75 15Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 7.5V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.25 11.25H13.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'sessions',
			label: 'Sessions',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.3086 7.39844H14.6836" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.31641 7.39844L5.94141 8.02344L7.81641 6.14844" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.3086 13.2344H14.6836" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.31641 13.2344L5.94141 13.8594L7.81641 11.9844" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.49935 18.3307H12.4993C16.666 18.3307 18.3327 16.6641 18.3327 12.4974V7.4974C18.3327 3.33073 16.666 1.66406 12.4993 1.66406H7.49935C3.33268 1.66406 1.66602 3.33073 1.66602 7.4974V12.4974C1.66602 16.6641 3.33268 18.3307 7.49935 18.3307Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'agenda',
			label: 'Agenda',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1426 10.2109V13.9609C14.1426 17.0859 12.8926 18.3359 9.76758 18.3359H6.01758C2.89258 18.3359 1.64258 17.0859 1.64258 13.9609V10.2109C1.64258 7.08594 2.89258 5.83594 6.01758 5.83594H9.76758C12.8926 5.83594 14.1426 7.08594 14.1426 10.2109Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.3077 6.2474C18.3077 8.63906 16.4827 10.5974 14.141 10.8057V10.2057C14.141 7.08073 12.891 5.83073 9.76602 5.83073H9.16602C9.37435 3.48906 11.3327 1.66406 13.7243 1.66406C16.0493 1.66406 17.966 3.38906 18.2577 5.63906C18.291 5.83073 18.3077 6.03906 18.3077 6.2474Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'community',
			label: 'Community',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.0004 5.96407C14.9504 5.95573 14.8921 5.95573 14.8421 5.96407C13.6921 5.9224 12.7754 4.98073 12.7754 3.81406C12.7754 2.6224 13.7337 1.66406 14.9254 1.66406C16.1171 1.66406 17.0754 2.63073 17.0754 3.81406C17.0671 4.98073 16.1504 5.9224 15.0004 5.96407Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.1422 12.0309C15.2839 12.2225 16.5422 12.0225 17.4255 11.4309C18.6005 10.6475 18.6005 9.3642 17.4255 8.58086C16.5339 7.9892 15.2589 7.78919 14.1172 7.98919" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.97344 5.96407C5.02344 5.95573 5.08177 5.95573 5.13177 5.96407C6.28177 5.9224 7.19844 4.98073 7.19844 3.81406C7.19844 2.6224 6.24011 1.66406 5.04844 1.66406C3.85677 1.66406 2.89844 2.63073 2.89844 3.81406C2.90677 4.98073 3.82344 5.9224 4.97344 5.96407Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.83255 12.0309C4.69088 12.2225 3.43255 12.0225 2.54922 11.4309C1.37422 10.6475 1.37422 9.3642 2.54922 8.58086C3.44089 7.9892 4.71588 7.78919 5.85755 7.98919" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.0004 12.1906C9.95039 12.1823 9.89206 12.1823 9.84206 12.1906C8.69206 12.149 7.77539 11.2073 7.77539 10.0406C7.77539 8.84896 8.73372 7.89062 9.92539 7.89062C11.1171 7.89062 12.0754 8.85729 12.0754 10.0406C12.0671 11.2073 11.1504 12.1573 10.0004 12.1906Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.57461 14.8187C6.39961 15.6021 6.39961 16.8854 7.57461 17.6687C8.90794 18.5604 11.0913 18.5604 12.4246 17.6687C13.5996 16.8854 13.5996 15.6021 12.4246 14.8187C11.0996 13.9354 8.90794 13.9354 7.57461 14.8187Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'media',
			label: 'Media / FAQs',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.441 17.0177H5.17435C2.54102 17.0177 1.66602 15.2677 1.66602 13.5094V6.49271C1.66602 3.85937 2.54102 2.98438 5.17435 2.98438H10.441C13.0743 2.98438 13.9493 3.85937 13.9493 6.49271V13.5094C13.9493 16.1427 13.066 17.0177 10.441 17.0177Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.2659 14.2482L13.9492 12.6232V7.36482L16.2659 5.73982C17.3992 4.94816 18.3326 5.43149 18.3326 6.82316V13.1732C18.3326 14.5648 17.3992 15.0482 16.2659 14.2482Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.58398 9.16406C10.2743 9.16406 10.834 8.60442 10.834 7.91406C10.834 7.22371 10.2743 6.66406 9.58398 6.66406C8.89363 6.66406 8.33398 7.22371 8.33398 7.91406C8.33398 8.60442 8.89363 9.16406 9.58398 9.16406Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'admin',
			label: 'Admin & Team',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.63411 9.05573C7.55078 9.0474 7.45078 9.0474 7.35911 9.05573C5.37578 8.98906 3.80078 7.36406 3.80078 5.36406C3.80078 3.3224 5.45078 1.66406 7.50078 1.66406C9.54245 1.66406 11.2008 3.3224 11.2008 5.36406C11.1924 7.36406 9.61745 8.98906 7.63411 9.05573Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M13.6747 3.33594C15.2914 3.33594 16.5914 4.64427 16.5914 6.2526C16.5914 7.8276 15.3414 9.11094 13.7831 9.16927C13.7164 9.16094 13.6414 9.16094 13.5664 9.16927" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.46758 12.1359C1.45091 13.4859 1.45091 15.6859 3.46758 17.0276C5.75924 18.5609 9.51758 18.5609 11.8092 17.0276C13.8259 15.6776 13.8259 13.4776 11.8092 12.1359C9.52591 10.6109 5.76758 10.6109 3.46758 12.1359Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15.2832 16.6641C15.8832 16.5391 16.4499 16.2974 16.9165 15.9391C18.2165 14.9641 18.2165 13.3557 16.9165 12.3807C16.4582 12.0307 15.8999 11.7974 15.3082 11.6641" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		},
	];

	let activeTab = 'rooms';
</script>

<div class="max-w-6xl">
	<div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			<a href="/collection/{eventData?.collectionId ?? ''}/events" class="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-[#83808D] transition-colors hover:bg-[#F0EFF1]">
				<span class="flex-shrink-0">In</span>
				<span class="hidden sm:inline">{eventData?.collection ?? 'Collection'}</span>
				<span class="inline sm:hidden">{(eventData?.collection ?? 'Collection').length > 20 ? (eventData?.collection ?? 'Collection').slice(0, 20) + '...' : eventData?.collection ?? 'Collection'}</span>
			</a>
			<a
				href={rawEvent?.customLinkSlug ? `/e/${rawEvent.customLinkSlug}` : `/event-page/${eventId}`}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 rounded-md bg-[#F0EFF1] px-3 py-1.5 text-sm font-medium text-[#5D646F] transition-colors hover:bg-[#E4E3E6]"
			>
				Event Page
				<Icon icon="mdi:open-in-new" class="h-3.5 w-3.5 text-[#8A8D90]" />
			</a>
		</div>
		<h1 class="mb-10 text-3xl font-bold md:text-4xl">{eventData?.title ?? 'Loading...'}</h1>

		<Nav {tabs} bind:activeTab />
	</div>
	{#if activeTab === 'rooms'}
		<Rooms eventTitle={eventData?.title ?? ''} eventData={rawEvent} />
	{:else if activeTab === 'sessions'}
		<Sessions eventTitle={eventData?.title ?? ''} eventData={rawEvent} />
	{:else if activeTab === 'agenda'}
		<Agenda eventTitle={eventData?.title ?? ''} />
	{:else if activeTab === 'community'}
		<Community eventTitle={eventData?.title ?? ''} />
	{:else if activeTab === 'media'}
		<Media eventTitle={eventData?.title ?? ''} />
	{:else if activeTab === 'admin'}
		<Admin eventTitle={eventData?.title ?? ''} />
	{/if}
</div>
