<!-- src/routes/event/more/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import Icon from '@iconify/svelte';
	import Nav from '../../../../components/Nav.svelte';
	import CancelEventModal from './components/CancelEventModal.svelte';
	import CloneEventModal from './components/CloneEventModal.svelte';
	import DeleteEventModal from './components/DeleteEventModal.svelte';
	import TransferEventModal from './components/TransferEventModal.svelte';

	$: eventId = $page.params.id;

	// Use cached event data
	$: ({ event: eventStore, collections: collectionsStore, loading: loadingStore, error: errorStore } = getEventCache(eventId!));
	$: rawEvent = $eventStore;
	$: cachedCollections = $collectionsStore;
	$: loading = $loadingStore;
	$: error = $errorStore;

	$: collectionName = cachedCollections.find(
		(c: any) => c._id === rawEvent?.collectionId || c.id === rawEvent?.collectionId
	)?.name ?? 'My Collection';

	$: eventData = rawEvent ? (() => {
		const eid = rawEvent._id ?? rawEvent.id;
		return {
			id: eid,
			title: rawEvent.title ?? 'Untitled Event',
			collection: collectionName,
			collectionId: rawEvent.collectionId ?? '',
			publicUrl: rawEvent.customLinkSlug ?? 'applikhek',
			embedCode: `\n<a\n  href="https://rondwell.com/event/${eid}"\n  class="rondwell-checkout--button"\n  data-rondwell-action="checkout"\n  data-rondwell-event-id="${eid}"\n>\n  Register for Event\n</a>\n\n<script id="rondwell-checkout" src="https://embed.rondwell.com/checkout-button.js"><\/script>\n`
		};
	})() : null;
	let activeTab = 'event-settings';

	const tabs = [
		{
			id: 'event-settings',
			label: 'Event Settings',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4993 18.9557H7.49935C2.97435 18.9557 1.04102 17.0224 1.04102 12.4974V7.4974C1.04102 2.9724 2.97435 1.03906 7.49935 1.03906H12.4993C17.0243 1.03906 18.9577 2.9724 18.9577 7.4974V12.4974C18.9577 17.0224 17.0243 18.9557 12.4993 18.9557ZM7.49935 2.28906C3.65768 2.28906 2.29102 3.65573 2.29102 7.4974V12.4974C2.29102 16.3391 3.65768 17.7057 7.49935 17.7057H12.4993C16.341 17.7057 17.7077 16.3391 17.7077 12.4974V7.4974C17.7077 3.65573 16.341 2.28906 12.4993 2.28906H7.49935Z" fill="currentColor"/><path d="M12.9824 16.0391C12.6408 16.0391 12.3574 15.7557 12.3574 15.4141V12.1641C12.3574 11.8224 12.6408 11.5391 12.9824 11.5391C13.3241 11.5391 13.6074 11.8224 13.6074 12.1641V15.4141C13.6074 15.7557 13.3241 16.0391 12.9824 16.0391Z" fill="currentColor"/><path d="M12.9824 6.83594C12.6408 6.83594 12.3574 6.5526 12.3574 6.21094V4.58594C12.3574 4.24427 12.6408 3.96094 12.9824 3.96094C13.3241 3.96094 13.6074 4.24427 13.6074 4.58594V6.21094C13.6074 6.5526 13.3241 6.83594 12.9824 6.83594Z" fill="currentColor"/><path d="M12.9831 11.1693C11.4414 11.1693 10.1914 9.91927 10.1914 8.3776C10.1914 6.83594 11.4414 5.58594 12.9831 5.58594C14.5247 5.58594 15.7747 6.83594 15.7747 8.3776C15.7747 9.91927 14.5164 11.1693 12.9831 11.1693Z" fill="currentColor"/><path d="M7.01758 16.0391C6.67591 16.0391 6.39258 15.7557 6.39258 15.4141V13.7891C6.39258 13.4474 6.67591 13.1641 7.01758 13.1641C7.35924 13.1641 7.64258 13.4474 7.64258 13.7891V15.4141C7.64258 15.7557 7.36758 16.0391 7.01758 16.0391Z" fill="currentColor"/><path d="M7.01758 8.46094C6.67591 8.46094 6.39258 8.1776 6.39258 7.83594V4.58594C6.39258 4.24427 6.67591 3.96094 7.01758 3.96094C7.35924 3.96094 7.64258 4.24427 7.64258 4.58594V7.83594C7.64258 8.1776 7.36758 8.46094 7.01758 8.46094Z" fill="currentColor"/><path d="M7.01628 14.4193C5.47461 14.4193 4.22461 13.1693 4.22461 11.6276C4.22461 10.0859 5.47461 8.83594 7.01628 8.83594C8.55794 8.83594 9.80794 10.0859 9.80794 11.6276C9.80794 13.1693 8.55794 14.4193 7.01628 14.4193Z" fill="currentColor"/></svg>`
		},
		{
			id: 'developer-tools',
			label: 'Developer Tools',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.66667 7.5L3.33333 10L6.66667 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.3333 7.5L16.6667 10L13.3333 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6667 5L8.33333 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		}
	];

	const embedAs = [
		{
			name: 'Embed as Button',
			svg: `<svg width="27" height="30" viewBox="0 0 27 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="25.4735" height="16.4828" rx="3.7461" fill="#F31A7C"/>
                <path d="M7.57626 12.4795C7.17085 11.2996 8.30046 10.17 9.4803 10.5754L19.6875 14.0827C20.7353 14.4428 21.0435 15.776 20.2601 16.5594L13.5602 23.2593C12.7768 24.0427 11.4436 23.7345 11.0836 22.6867L7.57626 12.4795Z" fill="url(#paint0_linear_3940_40212)"/>
                <rect x="14.9871" y="20.1016" width="2.99688" height="7.63574" rx="1.49844" transform="rotate(-45 14.9871 20.1016)" fill="#F31A7C"/>
                <defs>
                <linearGradient id="paint0_linear_3940_40212" x1="12.7395" y1="7.1224" x2="13.1141" y2="23.9798" gradientUnits="userSpaceOnUse">
                <stop offset="0.42" stop-color="white"/>
                <stop offset="0.455" stop-color="#F31A7C"/>
                </linearGradient>
                </defs>
                </svg>`
		},
		{
			name: 'Embed Event Page',
			svg: `<svg width="21" height="26" viewBox="0 0 21 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="20.9781" height="25.4735" rx="3.7461" fill="#F21A7C"/>
                <path d="M2.9978 5.9961C2.9978 3.92719 4.67499 2.25 6.7439 2.25H14.2361C16.305 2.25 17.9822 3.92718 17.9822 5.9961V10.4914H2.9978V5.9961Z" fill="#FBDEEC"/>
                <rect x="3.74707" y="14.2344" width="5.24454" height="2.24766" rx="1.12383" fill="#FBDEEC"/>
                <rect x="3.74707" y="18.7344" width="8.99063" height="2.24766" rx="1.12383" fill="#FBDEEC"/>
                </svg>`
		}
	];

	$: selectedEmbed = embedAs[0].name;

	function escapeHtml(str: any) {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				console.log('Copied to clipboard');
			})
			.catch((err) => {
				console.error('Failed to copy: ', err);
			});
	};

	let urlUpdating = false;
	let urlSuccess = '';

	const updatePublicUrl = async () => {
		if (!eventData) return;
		urlUpdating = true;
		urlSuccess = '';
		try {
			const { updateEvent } = await import('$lib/services/event.services');
			const slug = eventData.publicUrl.replace('rondwell.com/', '');
			await updateEvent(eventId!, { customLinkSlug: slug } as any);
			urlSuccess = 'URL updated successfully';
			setTimeout(() => { urlSuccess = ''; }, 3000);
		} catch (e: any) {
			urlSuccess = e.message || 'Failed to update URL';
		} finally {
			urlUpdating = false;
		}
	};

	const cloneEvent = () => {
		showCloneModal = true;
	};

	const transferEvent = () => {
		showTransferModal = true;
	};

	const cancelEvent = () => {
		showCancelModal = true;
	};

	let showCloneModal = false;
	let showTransferModal = false;
	let showCancelModal = false;
	let showDeleteModal = false;
</script>

{#if error}
	<div class="max-w-6xl">
		<div class="mb-6 sm:mb-8">
			<div class="mb-2 flex items-center justify-between">
				<div class="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
				<div class="h-8 w-24 rounded-md bg-gray-200"></div>
			</div>
			<div class="mb-10 h-9 w-3/4 animate-pulse rounded bg-gray-200"></div>
			<Nav {tabs} bind:activeTab />
		</div>
		<div class="space-y-6">
			<div class="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
			<div class="h-4 w-full max-w-lg animate-pulse rounded bg-gray-200"></div>
			<div class="h-10 w-36 animate-pulse rounded bg-gray-200"></div>
			<div class="mt-6 border-t pt-6">
				<div class="h-6 w-28 animate-pulse rounded bg-gray-200"></div>
				<div class="mt-3 h-4 w-full max-w-lg animate-pulse rounded bg-gray-200"></div>
				<div class="mt-3 h-12 w-full max-w-sm animate-pulse rounded bg-gray-200"></div>
			</div>
		</div>
	</div>
{:else if loading}
	<div class="max-w-6xl">
		<div class="mb-6 sm:mb-8">
			<div class="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200"></div>
			<div class="mb-8 h-9 w-3/4 animate-pulse rounded bg-gray-200 sm:mb-10"></div>
		</div>
	</div>
{:else if eventData}
<div class="max-w-6xl">
	<!-- Event Header -->
	<div class="mb-6 sm:mb-8">
		<div class="mb-2 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
			<a href="/collection/{eventData.collectionId}/events" class="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-[#F0EFF1]">
				<span class="text-xs text-[#83808D] sm:text-sm">{eventData.collection}</span>
				<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898ZM2.29492 1.29199C2.01826 1.29212 1.77162 1.42109 1.59961 1.58887L1.59863 1.58984C1.34194 1.83849 1.16551 2.27322 1.40332 2.75293L2.19043 4.32812L2.28711 4.55469C2.47977 5.09324 2.44715 5.69271 2.19043 6.21094V6.21191L1.40234 7.78711V7.78809C1.16122 8.26626 1.34076 8.7005 1.59863 8.9502C1.85851 9.20169 2.2935 9.37235 2.76758 9.12305L8.40332 6.15723H8.4043C8.74149 5.98034 8.94037 5.64982 8.94043 5.27246C8.94043 4.89509 8.74146 4.56463 8.4043 4.3877H8.40332L2.76758 1.41113C2.60129 1.32386 2.44117 1.29199 2.29492 1.29199Z" fill="#83808D" stroke="#83808D" stroke-width="0.37461"/>
					<rect x="5.0584" y="5.85137" width="3.37149" height="1.12383" rx="0.561915" transform="rotate(-180 5.0584 5.85137)" fill="#83808D" stroke="#83808D" stroke-width="0.37461"/>
				</svg>
			</a>
			<button
				on:click={() => goto(`/event-page/${eventId}`)}
				class="flex w-full items-center justify-center gap-1 rounded-md bg-[#DCE4EE] px-3 py-2 text-xs font-medium text-[#5D646F] transition-colors hover:bg-[#ccd6e0] sm:w-auto sm:justify-start sm:text-sm"
			>
				Event Page
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M1.24306 6.4387C1.40611 5.40243 2.12888 4.62786 3.0931 4.47826L9.69034 3.43935L9.8408 3.42097C10.5948 3.35739 11.3249 3.72187 11.7721 4.3912C12.2195 5.06073 12.3131 5.92902 12.0244 6.68931L11.9618 6.83923L9.01457 13.3413L9.01326 13.3411C8.84871 13.7088 8.61528 14.0066 8.33157 14.2308C7.8792 14.5883 7.31432 14.7405 6.72781 14.6481C5.77143 14.4963 5.05093 13.7247 4.89305 12.6922L4.591 10.7138C4.53659 10.3578 4.3245 10.0403 4.02548 9.86912L4.02494 9.8683L2.3872 8.94152C1.53287 8.45922 1.08026 7.47484 1.24306 6.4387ZM2.76439 5.88928C2.52769 6.07636 2.39626 6.36366 2.35324 6.63719L2.35378 6.638C2.28828 7.04462 2.40721 7.57568 2.91465 7.86476L4.55152 8.78851L4.66279 8.85692C5.17357 9.19045 5.53909 9.73754 5.67294 10.3689L5.69839 10.5051L6.00044 12.4835L6.00098 12.4843C6.09306 13.0997 6.52266 13.3845 6.9 13.4426C7.27991 13.5012 7.75745 13.3662 8.00792 12.8142L10.9559 6.31145C11.1348 5.91836 11.1012 5.47237 10.8636 5.11651C10.6258 4.7606 10.2457 4.58735 9.84651 4.65089L9.84575 4.6515L3.24253 5.68148C3.04601 5.71271 2.88934 5.79056 2.76439 5.88928Z" fill="#5D646F" stroke="#5D646F" stroke-width="0.37461"/>
					<rect x="7.25931" y="8.68484" width="3.5114" height="1.15881" rx="0.579404" transform="rotate(144 7.25931 8.68484)" fill="#5D646F" stroke="#5D646F" stroke-width="0.37461"/>
				</svg>
			</button>
		</div>
		<h1 class="mb-8 text-2xl leading-tight font-bold sm:mb-10 sm:text-3xl md:text-4xl">
			{eventData.title}
		</h1>
	</div>

	<!-- Tabs -->
	<Nav {tabs} bind:activeTab />

	{#if activeTab === 'event-settings'}
	<!-- Clone Event Section -->
	<div class="mb-6 flex flex-col sm:mb-8">
		<div class="mb-2 flex flex-col items-start justify-between gap-3 sm:mb-4 sm:flex-row sm:items-center">
			<h2 class="text-lg font-semibold sm:text-xl">Clone Event</h2>
			<button class="flex w-full items-center justify-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#5D646F] transition-colors hover:bg-gray-200 sm:w-auto sm:justify-start sm:text-sm">
				Learn More
				<img src="/send-icon.png" alt="icon" class="h-3 w-3" />
			</button>
		</div>
		<p class="mb-3 text-xs text-gray-600 sm:mb-4 sm:text-sm">
			Create a new event with the same information as this one. Everything except the guest list and
			event Marketing will be copied over.
		</p>
		<button
			on:click={cloneEvent}
			class="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit sm:py-2"
		>
			<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect x="0.936525" y="0.936525" width="10.1145" height="10.1145" rx="1.31113" stroke="white" stroke-width="1.87305"/>
				<rect x="5.43189" y="5.43652" width="10.1145" height="10.1145" rx="1.31113" fill="#333537" stroke="white" stroke-width="1.87305"/>
			</svg>
			Clone Event
		</button>
	</div>

	<!-- Event Page URL Section -->
	<div class="mt-6 mb-6 border-t pt-6 sm:mt-8 sm:mb-8 sm:pt-8">
		<h2 class="mb-2 text-lg font-semibold sm:text-xl">Event Page</h2>
		<p class="mb-3 text-xs text-gray-600 sm:mb-4 sm:text-sm">
			When you choose a new URL, the current one will no longer work. Do not change your URL if you
			have already shared the event.
		</p>
		<div class="mt-3 mb-4 rounded-lg bg-[#DADCDD] px-3 py-2.5 sm:px-4 sm:py-3">
			<div class="mb-2 flex flex-col justify-between gap-2 sm:mb-0 sm:flex-row sm:items-center">
				<div class="text-xs text-[#7A7C7E] sm:text-sm">
					Upgrade to Rondwell Plus to set a custom URL for this event.
				</div>
				<button class="flex w-fit items-center justify-center gap-1 rounded-md bg-[#E3E4E5] px-3 py-2 text-xs font-medium text-[#7A7C7E] transition-colors hover:bg-gray-200 sm:justify-start sm:text-sm">
					Learn More
					<img src="/send-icon.png" alt="icon" class="h-3 w-3" />
				</button>
			</div>
		</div>
		<div class="w-full sm:max-w-96">
			<label for="url" class="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">Public URL</label>
			<div class="flex items-center">
				<span class="rounded-l-md bg-[#EBECED] px-3 py-2.5 text-xs sm:rounded-l-md sm:text-sm">rondwell.com/</span>
				<input
					type="text"
					value={eventData.publicUrl}
					on:input={(e) => {
						const target = e.target as HTMLInputElement | null;
						if (target) eventData.publicUrl = target.value;
					}}
					class="flex-1 rounded-r-md border border-gray-300 bg-[#F4F5F6] px-3 py-2 text-xs focus:ring-0 focus:outline-none sm:rounded-r-md sm:text-sm"
				/>
				<button
					on:click={updatePublicUrl}
					disabled={true}
					title="Upgrade to Rondwell Plus to customize your event URL"
					class="ml-1 w-fit cursor-not-allowed rounded-md bg-[#939596] px-3 py-2 text-xs font-medium text-white opacity-50 sm:w-auto sm:text-sm"
				>
					Update
				</button>
			</div>
			<p class="mt-1 text-xs text-gray-400">Upgrade to Rondwell Plus to customize your event URL</p>
		</div>
	</div>

	<!-- Transfer Event Section -->
	<div class="mt-6 mb-6 border-t pt-6 sm:mt-8 sm:mb-8 sm:pt-8">
		<h2 class="mb-2 text-lg font-semibold sm:mb-3 sm:text-xl">Transfer Event</h2>
		<p class="mb-3 text-xs text-gray-600 sm:mb-4 sm:text-sm lg:max-w-[70%]">
			This event is managed by <span class="font-medium text-pink-600">{eventData.collection}</span>, with
			the admins of the calendar having manage access to the event. You can move it to a different
			calendar if you want.
		</p>
		<button
			on:click={transferEvent}
			class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:w-auto sm:py-2"
		>
			<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M5.9646 1.625V4.05996" stroke="white" stroke-width="1.49844" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M14.2644 1.625V4.05996" stroke="white" stroke-width="1.49844" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M2.94995 8.125H17.2788" stroke="white" stroke-width="1.49844" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M10.1144 17.8594H6.74292C3.79287 17.8594 2.52856 16.236 2.52856 13.8011V6.90202C2.52856 4.46706 3.79287 2.84375 6.74292 2.84375H13.4859C16.436 2.84375 17.7003 4.46706 17.7003 6.90202V9.74281" stroke="white" stroke-width="1.49844" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M11.2461 12.7375L14.6176 10.1421V15.3329L11.2461 12.7375Z" fill="white"/>
				<rect x="14.0557" y="13.4844" width="1.49844" height="3.9334" transform="rotate(-90 14.0557 13.4844)" fill="white"/>
				<path d="M18.7383 16.4813L15.3668 19.0766V13.8859L18.7383 16.4813Z" fill="white"/>
				<rect x="15.9287" y="15.7344" width="1.49844" height="3.9334" transform="rotate(90 15.9287 15.7344)" fill="white"/>
			</svg>
			Move to Another Collection
		</button>
	</div>

	<!-- Cancel Event Section -->
	<div class="mt-6 mb-6 border-t pt-6 sm:mt-8 sm:pt-8">
		<h2 class="mb-2 text-lg font-semibold sm:mb-3 sm:text-xl">Cancel Event</h2>
		<p class="mb-3 text-xs text-gray-600 sm:mb-4 sm:text-sm lg:max-w-[70%]">
			Cancel this event. If there are any registered guests, we will notify them that the event has been canceled.
		</p>
		<button
			on:click={cancelEvent}
			class="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 sm:w-auto sm:py-2"
		>
			<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M10.4877 10.4875L5.99243 5.99219" stroke="white" stroke-width="1.49844" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M10.4877 5.99219L5.99243 10.4875" stroke="white" stroke-width="1.49844" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<circle cx="8.24142" cy="8.24142" r="7.4922" stroke="white" stroke-width="1.49844"/>
			</svg>
			Cancel Event
		</button>
	</div>

	<!-- Delete Event Section -->
	<div class="mt-6 mb-6 border-t pt-6 sm:mt-8 sm:pt-8">
		<h2 class="mb-2 text-lg font-semibold text-[#D92D20] sm:mb-3 sm:text-xl">Delete Event</h2>
		<p class="mb-3 text-xs text-gray-600 sm:mb-4 sm:text-sm lg:max-w-[70%]">
			Permanently delete this event and all associated data including registrations, tickets, and analytics. This operation cannot be undone.
		</p>
		<button
			on:click={() => (showDeleteModal = true)}
			class="flex w-full items-center justify-center gap-2 rounded-md border-2 border-red-600 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:w-auto sm:py-2"
		>
			<Icon icon="mdi:delete-forever-outline" class="text-lg" />
			Delete Event Permanently
		</button>
	</div>

	{:else if activeTab === 'developer-tools'}

	<!-- Embed Event Section -->
	<div class="mb-6 sm:mb-8">
		<h2 class="mb-2 text-lg font-semibold sm:text-xl">Embed Event</h2>
		<p class="mb-4 text-xs text-gray-600 sm:mb-6 sm:text-sm">
			Have your own site? Embed the event to let visitors know about it.
		</p>

		<div class="my-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
			{#each embedAs as embed}
				<button
					class="flex w-full items-center justify-between gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2.5 text-xs font-medium shadow-sm transition-all hover:shadow-md sm:w-70 sm:p-2 sm:text-sm"
					on:click={() => (selectedEmbed = embed.name)}
				>
					<div class="flex min-w-0 items-center gap-2">
						<div class="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-sm bg-[#FBDEEC]">
							<p>{@html embed.svg}</p>
						</div>
						<span class="truncate">{embed.name}</span>
					</div>
					{#if selectedEmbed === embed.name}
						<div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F31A7C]">
							<Icon icon="mdi:tick" class="text-xl text-white" />
						</div>
					{/if}
				</button>
			{/each}
		</div>

		<div class="my-4 sm:my-6">
			<p class="mb-2 text-sm text-gray-600 sm:mb-3 sm:text-base">
				Paste the following HTML code snippet to your page.
			</p>
			<div class="relative md:max-w-158 lg:max-w-auto">
				<div class="custom-scrollbar overflow-x-auto rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-sm sm:p-5 sm:text-sm">
					<pre class=""><code>{escapeHtml(eventData.embedCode)}</code></pre>
				</div>
				<button
					on:click={() => copyToClipboard(eventData.embedCode)}
					class="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-[#F6F6F6] p-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-100 sm:top-4 sm:right-4"
				>
					<img src="/copy.svg" alt="" />
					Copy
				</button>
			</div>
		</div>

		<div class="mb-4 sm:mb-6">
			<p class="my-2 text-xs text-gray-600 sm:my-3 sm:text-sm">
				This gives you the following button. Click to see it in action!
			</p>
			<div class="relative flex justify-center overflow-hidden rounded-lg">
				<img src="/embed-bg.png" alt="" class="h-full min-h-40 w-full object-cover sm:min-h-48" />
				<button class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:px-6 sm:py-3 sm:text-base">
					Register for Event
				</button>
			</div>
		</div>

		<div class="mb-4 sm:mb-6">
			<p class="mb-2 text-xs text-gray-600 sm:mb-3 sm:text-sm">
				If you want to use your own styling for the button, simply remove the luma-checkout--button
				class from the snippet above.
			</p>
			<p class="text-xs text-gray-600 sm:text-sm">
				For advanced usage, check out our <span class="cursor-pointer font-medium text-pink-600 hover:text-pink-700">example code and documentation</span>.
			</p>
		</div>
	</div>

	<!-- SDK Setup Section -->
	<div class="mt-6 mb-6 border-t pt-6 sm:mt-8 sm:mb-8 sm:pt-8">
		<h2 class="mb-2 text-lg font-semibold sm:text-xl">SDK Setup</h2>
		<p class="mb-4 text-xs text-gray-600 sm:mb-6 sm:text-sm">
			Integrate Rondwell into your application using our SDK. Access event data, manage registrations, and more programmatically.
		</p>

		<div class="space-y-4">
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<div class="flex items-center gap-3 mb-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FBDEEC]">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.66667 7.5L3.33333 10L6.66667 12.5" stroke="#F31A7C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.3333 7.5L16.6667 10L13.3333 12.5" stroke="#F31A7C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6667 5L8.33333 15" stroke="#F31A7C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">JavaScript SDK</p>
						<p class="text-xs text-gray-500">npm install @rondwell/sdk</p>
					</div>
				</div>
				<div class="relative">
					<div class="custom-scrollbar overflow-x-auto rounded-lg border border-gray-200 bg-[#F9FAFB] p-3 text-xs sm:text-sm">
						<pre><code>import Rondwell from '@rondwell/sdk';

const rondwell = new Rondwell('your-api-key');

// Fetch event details
const event = await rondwell.events.get('EVENT_ID');

// List registrations
const registrations = await rondwell.events.registrations('EVENT_ID');</code></pre>
					</div>
				</div>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<div class="flex items-center gap-3 mb-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E2E8FC]">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="#146AEB" stroke-width="1.5"/><path d="M6.66667 10H13.3333" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round"/><path d="M10 6.66667V13.3333" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round"/></svg>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">REST API</p>
						<p class="text-xs text-gray-500">Base URL: https://api.rondwell.com/v1</p>
					</div>
				</div>
				<p class="text-xs text-gray-600 sm:text-sm">
					Access the full API documentation at <span class="cursor-pointer font-medium text-pink-600 hover:text-pink-700">docs.rondwell.com/api</span>
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<div class="flex items-center gap-3 mb-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3E0]">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 5.83333V14.1667C17.5 16.6667 16.25 18.3333 13.3333 18.3333H6.66667C3.75 18.3333 2.5 16.6667 2.5 14.1667V5.83333C2.5 3.33333 3.75 1.66667 6.66667 1.66667H13.3333C16.25 1.66667 17.5 3.33333 17.5 5.83333Z" stroke="#FF9800" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.0833 3.75V5.41667C12.0833 6.33333 12.8333 7.08333 13.75 7.08333H15.4167" stroke="#FF9800" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.66667 10.8333H10" stroke="#FF9800" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.66667 14.1667H13.3333" stroke="#FF9800" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">Webhooks</p>
						<p class="text-xs text-gray-500">Receive real-time event notifications</p>
					</div>
				</div>
				<p class="text-xs text-gray-600 sm:text-sm">
					Configure webhook endpoints to receive notifications for registrations, check-ins, and payment events.
				</p>
			</div>
		</div>
	</div>

	{/if}
</div>
{/if}

<CloneEventModal bind:open={showCloneModal} {eventId} eventTitle={eventData?.title || ''} />
<TransferEventModal bind:open={showTransferModal} {eventId} currentCollectionName={eventData?.collection || ''} />
<CancelEventModal bind:open={showCancelModal} {eventId} eventTitle={eventData?.title || ''} />
<DeleteEventModal bind:open={showDeleteModal} {eventId} eventTitle={eventData?.title || ''} />
