<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import { getMyEvents } from '$lib/services/event.services';
	import { getEarningsSummary, getWalletBalance } from '$lib/services/wallet.services';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { onMount } from 'svelte';

	let activeTab: 'Created' | 'Attending' = 'Created';
	let createdEvents: any[] = [];
	let attendingEvents: any[] = [];
	let pageReady = false;

	// Stats
	let totalRevenue = 0;
	let totalEvents = 0;
	let totalAttendees = 0;
	let walletBalance = 0;

	onMount(async () => {
		if (!$isAuthenticated) return;
		try {
			const [events] = await Promise.all([
				getMyEvents(),
				loadWalletAndRevenue(),
			]);
			createdEvents = events;
			totalEvents = createdEvents.length;
			totalAttendees = createdEvents.reduce((sum: number, e: any) => sum + (e.attendeeCount ?? 0), 0);
		} catch (e: any) {
			console.error('Failed to load overview data', e);
		} finally {
			pageReady = true;
		}
	});

	async function loadWalletAndRevenue() {
		try {
			const wallet = await getWalletBalance();
			const agg = wallet?.aggregatedBalance;
			if (agg) {
				walletBalance = agg.withdrawable ?? agg.totalEarnings ?? 0;
			} else {
				const ngnBalance = wallet?.balance?.NGN ?? 0;
				walletBalance = ngnBalance > 100000 ? ngnBalance / 100 : ngnBalance;
			}
		} catch { /* non-critical */ }

		try {
			const earnings = await getEarningsSummary();
			const items = Array.isArray(earnings) ? earnings : [];
			totalRevenue = items.reduce((sum: number, e: any) => sum + (e.completedAmount ?? 0), 0);
		} catch { /* non-critical */ }
	}

	function normalizeEvent(e: any) {
		const locDetails = e.locationDetails;
		let location = 'TBD';
		let locationIcon = '/location.svg';
		if (e.eventType === 'VIRTUAL' && locDetails?.virtual?.platform) {
			location = locDetails.virtual.platform;
			locationIcon = '/zoom.svg';
		} else if (locDetails?.physical?.venueName) {
			location = locDetails.physical.venueName;
		} else if (e.eventType === 'HYBRID') {
			location = 'Hybrid';
		}
		return {
			id: e._id ?? e.id,
			date: e.startDateTime ? new Date(e.startDateTime).toISOString().split('T')[0] : '',
			time: e.startDateTime
				? new Date(e.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
				: '',
			title: e.title ?? 'Untitled Event',
			organizers: '',
			location,
			locationIcon,
			status: e.eventStatus ?? 'DRAFT',
			availability: '',
			attendees: e.attendeeCount ?? 0,
			image: e.displayPictureUrl ?? e.coverPictureUrl ?? '/events.png',
			tag: e.tags?.[0] ?? '',
		};
	}

	$: latestEvent = (() => {
		const source = activeTab === 'Created' ? createdEvents : attendingEvents;
		if (!source.length) return null;
		const sorted = [...source].sort((a, b) => {
			const da = new Date(a.startDateTime ?? 0).getTime();
			const db = new Date(b.startDateTime ?? 0).getTime();
			return db - da;
		});
		return normalizeEvent(sorted[0]);
	})();

	$: latestEventDate = latestEvent?.date
		? {
			formatted: new Date(latestEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			weekday: new Date(latestEvent.date).toLocaleDateString('en-US', { weekday: 'long' }),
		}
		: null;

	const statsCards = [
		{
			title: 'Total Revenue',
			icon: 'revenue',
			color: '#AB46DD',
			bg: '#F2E4F8',
		},
		{
			title: 'Total Events',
			icon: 'events',
			color: '#146AEB',
			bg: '#E2E8FC',
		},
		{
			title: 'Total Attendees',
			icon: 'attendees',
			color: '#3CBD2C',
			bg: '#E3F4E1',
		},
		{
			title: 'Wallet Balance',
			icon: 'wallet',
			color: '#D79917',
			bg: '#FFF7D8',
		},
	];

	function getStatValue(icon: string): string {
		switch (icon) {
			case 'revenue': return `N${totalRevenue.toLocaleString()}`;
			case 'events': return totalEvents.toString();
			case 'attendees': return totalAttendees.toLocaleString();
			case 'wallet': return `N${walletBalance.toLocaleString()}`;
			default: return '0';
		}
	}

	const collections = [
		{
			name: 'The GenAI Collective',
			image: '/events.png',
			events: [
				{ title: '💕  GenAI Collective NTC 💕 Research Roundtable', date: 'Thu, Sep 19, 6:30 PM' },
				{ title: '💕  GenAI Collective NTC 💕 Research Roundtable', date: 'Thu, Sep 19, 6:30 PM' }
			]
		}
	];
</script>

<svelte:head>
	<title>Dashboard | Rondwell</title>
	<meta name="description" content="Your Rondwell dashboard. Manage events, track revenue, and view analytics." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !pageReady}
	<!-- Full-page skeleton: renders once, no layout shift -->
	<div class="w-full animate-pulse">
		<!-- Welcome header skeleton -->
		<div class="mb-8">
			<div class="mb-4 h-9 w-56 rounded bg-gray-200"></div>

			<!-- Stats cards skeleton -->
			<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each Array(4) as _}
					<div class="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4">
						<div class="mb-3 flex items-center justify-between">
							<div class="h-10 w-10 rounded-full bg-gray-200"></div>
							<div class="h-5 w-16 rounded bg-gray-200"></div>
						</div>
						<div class="h-7 w-28 rounded bg-gray-200"></div>
						<div class="mt-1 h-3 w-20 rounded bg-gray-200"></div>
					</div>
				{/each}
			</div>

			<!-- Welcome card skeleton -->
			<div class="flex min-h-[181.5px] flex-col gap-4 rounded-lg bg-[#FDFDFD] p-3 md:flex-row md:p-6">
				<div class="flex w-full items-center justify-center rounded bg-gray-200 p-5 md:h-[144px] md:max-w-[195.09px]"></div>
				<div class="flex flex-1 flex-col justify-between">
					<div class="space-y-2">
						<div class="h-6 w-48 rounded bg-gray-200"></div>
						<div class="h-4 w-full max-w-[500px] rounded bg-gray-200"></div>
					</div>
					<div class="mt-4 flex items-center justify-between">
						<div class="flex gap-1">
							{#each Array(4) as _}
								<div class="h-1 w-8 rounded bg-gray-200"></div>
							{/each}
						</div>
						<div class="h-[38px] w-20 rounded bg-gray-200"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Latest Event skeleton -->
		<div class="mb-8">
			<div class="mb-4 flex items-center justify-between">
				<div class="h-8 w-36 rounded bg-gray-200"></div>
				<div class="h-[50px] w-52 rounded bg-gray-200"></div>
			</div>
			<div class="flex flex-col items-stretch gap-4 md:flex-row">
				<div class="flex w-full max-w-[120px] justify-between">
					<div class="flex flex-col gap-2">
						<div class="h-5 w-16 rounded bg-gray-200"></div>
						<div class="h-4 w-20 rounded bg-gray-200"></div>
					</div>
					<div class="hidden w-[11.75px] flex-col items-center justify-center gap-1 md:flex">
						<span class="h-[11.75px] w-[11.75px] rounded-full bg-gray-200"></span>
						<span class="ml-1 h-full border-2 border-dashed border-gray-200"></span>
					</div>
				</div>
				<div class="flex w-full max-w-[687px] flex-col gap-4">
					<div class="flex gap-4 rounded-md bg-[#FDFDFD] p-6">
						<div class="flex-1 space-y-3">
							<div class="h-3 w-16 rounded bg-gray-200"></div>
							<div class="h-5 w-48 rounded bg-gray-200"></div>
							<div class="h-3 w-32 rounded bg-gray-200"></div>
							<div class="h-8 w-28 rounded bg-gray-200"></div>
						</div>
						<div class="h-30 w-30 flex-shrink-0 rounded-xl bg-gray-200"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="w-full">
		<!-- Welcome Aboard Sections -->
		<div class="mb-8">
			<h1 class="mb-4 text-3xl font-medium">Welcome Aboard</h1>

			<!-- Stats Cards -->
			<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each statsCards as card}
					<div class="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
						<div class="mb-3 flex items-center justify-between">
							<div class="flex h-10 w-10 items-center justify-center rounded-full" style="background-color: {card.bg}">
								{#if card.icon === 'revenue'}
									<svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M6.5625 10.6875C6.5625 11.5275 7.2075 12.2025 8.0025 12.2025H9.6225C10.3125 12.2025 10.875 11.6175 10.875 10.8975C10.875 10.1175 10.53 9.84 10.0275 9.66L7.41 8.7375C6.9075 8.5575 6.5625 8.28 6.5625 7.5C6.5625 6.78 7.125 6.195 7.815 6.195H9.435C10.23 6.195 10.875 6.87 10.875 7.71" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M8.71875 5.25V13.125" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5C13.14 1.5 16.5 4.86 16.5 9Z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								{:else if card.icon === 'events'}
									<svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M6 1.5V3.75" stroke="{card.color}" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M12 1.5V3.75" stroke="{card.color}" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M2.625 6.8175H15.375" stroke="{card.color}" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M15.75 6.375V12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375Z" stroke="{card.color}" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M8.99625 10.275H9.003" stroke="{card.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M6.22049 10.275H6.22724" stroke="{card.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M6.22049 12.525H6.22724" stroke="{card.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								{:else if card.icon === 'attendees'}
									<svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M6.8625 8.145C6.7875 8.1375 6.6975 8.1375 6.615 8.145C4.8525 8.085 3.4425 6.63 3.4425 4.8525C3.4425 3.0375 4.9125 1.5675 6.7425 1.5675C8.5575 1.5675 10.0425 3.0375 10.0425 4.8525C10.035 6.63 8.625 8.085 6.8625 8.145Z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M12.2925 3C13.725 3 14.8725 4.155 14.8725 5.58C14.8725 6.975 13.77 8.1075 12.39 8.16C12.33 8.1525 12.2625 8.1525 12.195 8.16" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M3.1175 10.9275C1.3175 12.1575 1.3175 14.1525 3.1175 15.375C5.1575 16.7625 8.5775 16.7625 10.6175 15.375C12.4175 14.1475 12.4175 12.1525 10.6175 10.9275C8.585 9.5475 5.165 9.5475 3.1175 10.9275Z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M13.6875 15C14.2275 14.8875 14.7375 14.67 15.165 14.3475C16.32 13.4775 16.32 12.0375 15.165 11.1675C14.745 10.8525 14.2425 10.6425 13.71 10.5225" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								{:else}
									<svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M9.75 6.9375H5.25" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M16.5 8.49V9.5175C16.5 9.8325 16.2525 10.0875 15.93 10.1025H14.4075C13.785 10.1025 13.215 9.6375 13.1625 9.015C13.1275 8.6475 13.2675 8.3025 13.5075 8.0625C13.72 7.845 14.0125 7.72 14.3325 7.72H15.93C16.2525 7.735 16.5 7.99 16.5 8.49Z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M13.5075 8.0625C13.2675 8.3025 13.1275 8.6475 13.1625 9.015C13.215 9.6375 13.785 10.1025 14.4075 10.1025H15.93V11.25C15.93 13.5 14.43 15 12.18 15H5.25C3 15 1.5 13.5 1.5 11.25V6.75C1.5 4.7025 2.7525 3.27 4.6425 3.045C4.8375 3.015 5.04 3 5.25 3H12.18C12.375 3 12.5625 3.0075 12.7425 3.0375C14.655 3.2475 15.93 4.68 15.93 6.75V7.72H14.3325C14.0125 7.72 13.72 7.845 13.5075 8.0625Z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								{/if}
							</div>
							<span class="rounded-md px-2 py-0.5 text-[10px] font-medium" style="background-color: {card.bg}; color: {card.color}">
								{card.icon === 'revenue' ? 'This Month' : card.icon === 'wallet' ? '' : 'All Time'}
							</span>
						</div>
						<div class="text-2xl font-bold text-gray-900">{getStatValue(card.icon)}</div>
						<div class="mt-1 text-xs text-gray-500">{card.title}</div>
					</div>
				{/each}
			</div>

			<!-- Welcome Card -->
			<div
				class="flex h-full min-h-[181.5px] flex-col items-start gap-4 rounded-lg bg-[#FDFDFD] p-3 md:flex-row md:p-6"
			>
				<div
					class="flex w-full items-center justify-center rounded bg-[#F4F5F6] p-5 md:h-[144px] md:max-w-[195.09px]"
				>
					<img src="/folder-icon.png" alt="folder icon" class="w-full" />
				</div>

				<div
					class="flex h-full min-h-[144px] flex-1 flex-col justify-between text-center md:text-left"
				>
					<span>
						<h2 class="font-mediun mb-1 text-xl">Welcome to Rondwell</h2>
						<p class="mb-3 max-w-[724px] text-sm text-[#B9BABA]">
							Rondwell lets you easily share and manage your events. Every event on Rondwell is part
							of a calendar. Let's see how they work.
						</p>
					</span>

					<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
						<div class="mt-4 flex items-center gap-1">
							<span class="h-1 w-8 rounded bg-black"></span>
							<span class="h-1 w-8 rounded-full bg-gray-400"></span>
							<span class="h-1 w-8 rounded-full bg-gray-400"></span>
							<span class="h-1 w-8 rounded-full bg-gray-400"></span>
						</div>
						<button
							class="h-[38px] w-full rounded bg-black px-3 py-1 text-sm font-medium text-white md:w-fit"
						>
							Next
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Latest Event Section -->
		<div class="mb-8 w-full">
			<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 class="text-2xl font-medium">Latest Event</h2>

				<div class="flex h-[42px] w-fit shrink-0 rounded bg-[#E0E9EC] p-1 text-[#98A1A4] sm:h-[50px]">
					<button
						class={`h-full cursor-pointer rounded px-4 py-1 text-sm whitespace-nowrap ${activeTab === 'Created' ? 'bg-white text-black shadow-md' : ''}`}
						on:click={() => (activeTab = 'Created')}
					>
						Created
					</button>
					<button
						class={`h-full cursor-pointer rounded px-4 py-1 text-sm whitespace-nowrap ${activeTab === 'Attending' ? 'bg-white text-black shadow-md' : ''}`}
						on:click={() => (activeTab = 'Attending')}
					>
						Attending
					</button>
				</div>
			</div>

			{#if latestEvent}
				<div class="mb-12 w-full space-y-10">
					<div class="flex flex-col items-stretch gap-4 md:flex-row">
						<div class="flex w-full max-w-[120px] justify-between">
							<div>
								<div class="text-lg">{latestEventDate?.formatted}</div>
								<div class="text-lg text-[#B9BABA]">{latestEventDate?.weekday}</div>
							</div>
							<div class="hidden w-[11.75px] flex-col items-center justify-center gap-1 md:flex">
								<span class="h-[11.75px] w-[11.75px] rounded-full bg-[#D9D9D9]"></span>
								<span class="ml-1 h-full border-2 border-dashed border-[#D9D9D9]"></span>
							</div>
						</div>
						<div class="flex w-full max-w-[687px] flex-col gap-4">
							{#if activeTab === 'Created'}
								<a href={`/events/${latestEvent.id}`} class="no-underline">
									<EventCard event={latestEvent} type="mine" />
								</a>
							{:else}
								<a href={`/event-page/${latestEvent.id}`} class="no-underline">
									<EventCard event={latestEvent} type="attending" />
								</a>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex justify-center">
					<a
						href="/events"
						class="rounded-md bg-[#F4F4F4] px-6 py-2 text-sm font-medium text-[#616265] no-underline hover:bg-gray-200 transition"
					>
						View All Events
					</a>
				</div>
			{:else}
				<div class="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
					<p class="text-lg">No {activeTab === 'Created' ? 'created' : 'attended'} events yet.</p>
					{#if activeTab === 'Created'}
						<button
							on:click={() => goto('/create-event')}
							class="rounded-md bg-[#513BE2] px-4 py-2 text-sm text-white"
						>
							Create your first event
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Subscribed Collections Section -->
		<div>
			<h2 class="mb-4 text-2xl font-medium">Subscribed Collections</h2>

			<div class="mb-12 flex w-full max-w-[1020px] flex-col gap-4">
				{#each collections as collection, index (index)}
					<CollectionCard {collection} />
				{/each}
			</div>
		</div>
	</div>
{/if}
