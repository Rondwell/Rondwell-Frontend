<script lang="ts">
	import { page } from '$app/stores';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import Icon from '@iconify/svelte';
	import Nav from '../../../../components/Nav.svelte';
	import EmailBlasts from './components/EmailBlasts.svelte';
	import EventForm from './components/EventForm.svelte';
	import SeatCapacity from './components/SeatCapacity.svelte';
	import Tickets from './components/Tickets.svelte';

	$: eventId = $page.params.id as string;

	// Use cached event data
	$: ({ event: eventStore, collections: collectionsStore, loading: loadingStore, error: errorStore } = getEventCache(eventId));
	$: rawEvent = $eventStore;
	$: cachedCollections = $collectionsStore;
	$: loading = $loadingStore;
	$: error = $errorStore;

	$: collectionName = cachedCollections.find(
		(c: any) => c._id === rawEvent?.collectionId || c.id === rawEvent?.collectionId
	)?.name ?? 'My Collection';
	$: collectionId = rawEvent?.collectionId ?? '';
	$: eventData = rawEvent;

	let activeTab = 'ticket';

	// Support deep-linking to a specific tab via ?tab= query param
	$: {
		const tabParam = $page.url.searchParams.get('tab');
		if (tabParam && ['ticket', 'event_forms', 'seat_capacity', 'email_blasts'].includes(tabParam)) {
			activeTab = tabParam;
		}
	}

	const tabs = [
		{
			id: 'ticket',
			label: 'Ticket',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.9086 18.9609H6.09193C2.61693 18.9609 1.55859 17.9026 1.55859 14.4276V14.0443C1.55859 13.7026 1.84193 13.4193 2.18359 13.4193C2.91693 13.4193 3.51693 12.8193 3.51693 12.0859C3.51693 11.3526 2.91693 10.7526 2.18359 10.7526C1.84193 10.7526 1.55859 10.4693 1.55859 10.1276V9.74427C1.55859 6.26927 2.61693 5.21094 6.09193 5.21094H13.9086C17.3836 5.21094 18.4419 6.26927 18.4419 9.74427V10.5276C18.4419 10.8693 18.1586 11.1526 17.8169 11.1526C17.0836 11.1526 16.4836 11.7526 16.4836 12.4859C16.4836 13.2193 17.0836 13.8109 17.8169 13.8109C18.1586 13.8109 18.4419 14.0943 18.4419 14.4359C18.4336 17.9026 17.3753 18.9609 13.9086 18.9609ZM2.81693 14.5943C2.83359 17.2443 3.35859 17.7109 6.10026 17.7109H13.9169C16.5169 17.7109 17.1169 17.2859 17.1919 14.9776C16.0753 14.6943 15.2419 13.6859 15.2419 12.4776C15.2419 11.2693 16.0753 10.2526 17.2003 9.96927V9.73594C17.2003 6.94427 16.7086 6.4526 13.9169 6.4526H6.09193C3.35859 6.4526 2.83359 6.9276 2.80859 9.56927C3.93359 9.8526 4.76693 10.8693 4.76693 12.0776C4.76693 13.2859 3.93359 14.3109 2.81693 14.5943Z" fill="currentColor"/>
<path d="M8.33301 8.54427C7.99134 8.54427 7.70801 8.26094 7.70801 7.91927V5.83594C7.70801 5.49427 7.99134 5.21094 8.33301 5.21094C8.67467 5.21094 8.95801 5.49427 8.95801 5.83594V7.91927C8.95801 8.26094 8.67467 8.54427 8.33301 8.54427Z" fill="currentColor"/>
<path d="M8.33301 14.1031C7.99134 14.1031 7.70801 13.8198 7.70801 13.4781V10.7031C7.70801 10.3615 7.99134 10.0781 8.33301 10.0781C8.67467 10.0781 8.95801 10.3615 8.95801 10.7031V13.4781C8.95801 13.8198 8.67467 14.1031 8.33301 14.1031Z" fill="currentColor"/>
<path d="M8.33301 18.9583C7.99134 18.9583 7.70801 18.675 7.70801 18.3333V16.25C7.70801 15.9083 7.99134 15.625 8.33301 15.625C8.67467 15.625 8.95801 15.9083 8.95801 16.25V18.3333C8.95801 18.675 8.67467 18.9583 8.33301 18.9583Z" fill="currentColor"/>
<path d="M13.6082 6.46146H6.03315C5.78315 6.46146 5.54982 6.31146 5.45815 6.07813C5.36649 5.84479 5.41649 5.56979 5.59149 5.39479L8.03315 2.95313C10.2832 0.703125 11.6582 0.703125 13.8998 2.95313L14.3998 3.45313C14.5165 3.56979 14.5832 3.72813 14.5832 3.89479C14.5832 4.06146 14.5165 4.21979 14.3998 4.33646C14.0665 4.66979 13.9748 5.16146 14.1665 5.58646C14.2582 5.77813 14.2415 6.00313 14.1248 6.18646C14.0165 6.35313 13.8165 6.46146 13.6082 6.46146ZM7.54149 5.21146H12.8165C12.7998 4.76979 12.9082 4.32813 13.1332 3.94479L13.0248 3.83646C11.2832 2.09479 10.6665 2.09479 8.92482 3.83646L7.54149 5.21146Z" fill="currentColor"/>
</svg>
`
		},
		{
			id: 'event_forms',
			label: 'Event Forms',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.5003 18.9557H7.50033C2.97533 18.9557 1.04199 17.0224 1.04199 12.4974V7.4974C1.04199 2.9724 2.97533 1.03906 7.50033 1.03906H12.5003C17.0253 1.03906 18.9587 2.9724 18.9587 7.4974V12.4974C18.9587 17.0224 17.0253 18.9557 12.5003 18.9557ZM7.50033 2.28906C3.65866 2.28906 2.29199 3.65573 2.29199 7.4974V12.4974C2.29199 16.3391 3.65866 17.7057 7.50033 17.7057H12.5003C16.342 17.7057 17.7087 16.3391 17.7087 12.4974V7.4974C17.7087 3.65573 16.342 2.28906 12.5003 2.28906H7.50033Z" fill="currentColor"/>
<path d="M13.125 8.125H6.875C6.53333 8.125 6.25 7.84167 6.25 7.5C6.25 7.15833 6.53333 6.875 6.875 6.875H13.125C13.4667 6.875 13.75 7.15833 13.75 7.5C13.75 7.84167 13.4667 8.125 13.125 8.125Z" fill="currentColor"/>
<path d="M13.125 13.125H6.875C6.53333 13.125 6.25 12.8417 6.25 12.5C6.25 12.1583 6.53333 11.875 6.875 11.875H13.125C13.4667 11.875 13.75 12.1583 13.75 12.5C13.75 12.8417 13.4667 13.125 13.125 13.125Z" fill="currentColor"/>
</svg>
`
		},
		{
			id: 'seat_capacity',
			label: 'Seat Capacity',
			icon: `<svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.66699 20.3672H18.3337" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 1.85156C11.3333 2.44411 12.8333 2.44411 14.1667 1.85156V4.62912C12.8333 5.22167 11.3333 5.22167 10 4.62912V1.85156Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 4.63281V7.41037" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.1663 7.40625H5.83301C4.16634 7.40625 3.33301 8.3321 3.33301 10.1838V20.3682H16.6663V10.1838C16.6663 8.3321 15.833 7.40625 14.1663 7.40625Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.81641 11.1094H16.1831" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.6582 11.1094V20.3679" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M9.99121 11.1094V20.3679" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M13.3252 11.1094V20.3679" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round"/>
</svg>
`
		},
		{
			id: 'email_blasts',
			label: 'Email / Blasts',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1667 17.0833H5.83333C3.33333 17.0833 1.66667 15.8333 1.66667 12.9167V7.08333C1.66667 4.16667 3.33333 2.91667 5.83333 2.91667H14.1667C16.6667 2.91667 18.3333 4.16667 18.3333 7.08333V12.9167C18.3333 15.8333 16.6667 17.0833 14.1667 17.0833Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.1667 7.5L11.5583 9.58333C10.7 10.2667 9.29167 10.2667 8.43333 9.58333L5.83333 7.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
		}
	];
</script>

<div class="max-w-6xl">
	{#if loading}
		<div class="max-w-6xl animate-pulse">
			<!-- Header skeleton -->
			<div class="mb-6">
				<div class="mb-2 flex items-center justify-between">
					<div class="h-4 w-32 rounded bg-gray-200"></div>
					<div class="h-8 w-24 rounded-md bg-gray-200"></div>
				</div>
				<div class="mb-10 h-9 w-3/4 rounded bg-gray-200"></div>
				<!-- Tabs render immediately (static) -->
				<Nav {tabs} bind:activeTab />
			</div>
			<!-- Tickets skeleton -->
			<div class="mb-6 flex w-full flex-wrap gap-3">
				<div class="h-[60px] w-full rounded-[12.75px] bg-gray-200 sm:w-[220px]"></div>
				<div class="h-[60px] w-full rounded-[12.75px] bg-gray-200 sm:w-[220px]"></div>
				<div class="h-[60px] w-full rounded-[12.75px] bg-gray-200 sm:w-[220px]"></div>
			</div>
			<div class="mb-4 flex items-center justify-between">
				<div class="h-5 w-20 rounded bg-gray-200"></div>
				<div class="flex gap-2">
					<div class="h-9 w-32 rounded-md bg-gray-200"></div>
					<div class="h-9 w-9 rounded bg-gray-200"></div>
				</div>
			</div>
			<div class="flex flex-wrap gap-4">
				{#each [1, 2] as _}
					<div class="w-full rounded-lg bg-[#FDFDFD] p-4 md:max-w-[400px]">
						<div class="mb-2 h-4 w-32 rounded bg-gray-200"></div>
						<div class="mb-3 h-7 w-16 rounded bg-gray-200"></div>
						<div class="mb-3 flex items-center justify-between">
							<div class="h-4 w-28 rounded bg-gray-200"></div>
							<div class="h-6 w-10 rounded-full bg-gray-200"></div>
						</div>
						<div class="mt-3 flex items-center justify-between border-t pt-3">
							<div class="h-3 w-16 rounded bg-gray-200"></div>
							<div class="h-3 w-20 rounded bg-gray-200"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		{#if error}
			<div class="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
				<p class="text-sm text-red-600">{error}</p>
				<button on:click={() => (error = '')} class="text-red-400 hover:text-red-600">✕</button>
			</div>
		{/if}
		<!-- Event Header -->
		<div class="mb-6">
			<div class="mb-2 flex items-center justify-between">
				<a href="/collection/{collectionId}/events" class="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-[#83808D] transition-colors hover:bg-[#F0EFF1]">
					<span class="flex-shrink-0">In</span>
					<span class="hidden sm:inline">{collectionName}</span>
					<span class="inline sm:hidden">{collectionName.length > 20 ? collectionName.slice(0, 20) + '...' : collectionName}</span>
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
			<h1 class="mb-10 text-3xl font-bold md:text-4xl">{eventData?.title ?? 'Untitled Event'}</h1>

			<!-- Navigation Tabs -->
			<Nav {tabs} bind:activeTab />
		</div>
		{#if activeTab === 'ticket'}
			<Tickets {eventId} {eventData} />
		{:else if activeTab === 'event_forms'}
			<EventForm {eventId} {eventData} />
		{:else if activeTab === 'seat_capacity'}
			<SeatCapacity {eventData} />
		{:else if activeTab === 'email_blasts'}
			<EmailBlasts {eventId} {eventData} />
		{/if}
	{/if}
</div>
