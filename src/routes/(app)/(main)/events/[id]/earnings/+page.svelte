<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	$: eventId = $page.params.id ?? '';

	// Use cached event data
	$: ({ event: eventStore, collections: collectionsStore, loading: loadingStore, error: errorStore } = getEventCache(eventId));
	$: rawEvent = $eventStore;
	$: cachedCollections = $collectionsStore;
	$: loading = $loadingStore;
	$: error = $errorStore;

	$: collectionName = cachedCollections.find(
		(c: any) => c._id === rawEvent?.collectionId || c.id === rawEvent?.collectionId
	)?.name ?? 'My Collection';
	$: eventData = rawEvent ? { title: rawEvent.title ?? 'Untitled Event', collection: collectionName, collectionId: rawEvent.collectionId ?? '' } : null;

	let searchQuery = '';
	let statusFilter = 'All';
	let showStatusDropdown = false;
	let dateFilter = 'All Time';
	let showDateDropdown = false;

	// Mock earnings data
	let earnings = [
		{ id: '1', user: 'Sarah Johnson', email: 'sarah@example.com', date: '2026-03-25T14:30:00Z', ticketType: 'VIP', amount: 50000, status: 'COMPLETED' },
		{ id: '2', user: 'Mike Chen', email: 'mike@example.com', date: '2026-03-25T12:15:00Z', ticketType: 'General', amount: 15000, status: 'COMPLETED' },
		{ id: '3', user: 'Ada Obi', email: 'ada@example.com', date: '2026-03-24T09:45:00Z', ticketType: 'VIP', amount: 50000, status: 'PENDING' },
		{ id: '4', user: 'John Doe', email: 'john@example.com', date: '2026-03-24T08:00:00Z', ticketType: 'Early Bird', amount: 10000, status: 'COMPLETED' },
		{ id: '5', user: 'Fatima Ali', email: 'fatima@example.com', date: '2026-03-23T16:20:00Z', ticketType: 'General', amount: 15000, status: 'REFUNDED' },
	];

	const statusOptions = ['All', 'Completed', 'Pending', 'Refunded'];
	const dateOptions = ['All Time', 'Today', 'This Week', 'This Month'];

	$: totalEarnings = earnings.reduce((sum, e) => sum + (e.status !== 'REFUNDED' ? e.amount : 0), 0);
	$: completedEarnings = earnings.filter(e => e.status === 'COMPLETED').reduce((sum, e) => sum + e.amount, 0);
	$: pendingEarnings = earnings.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + e.amount, 0);

	$: filteredEarnings = earnings.filter(e => {
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			if (!e.user.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q) && !e.ticketType.toLowerCase().includes(q)) return false;
		}
		if (statusFilter !== 'All' && e.status !== statusFilter.toUpperCase()) return false;
		return true;
	});

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatTime(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
	}

	function getStatusStyle(status: string): string {
		switch (status) {
			case 'COMPLETED': return 'bg-green-100 text-green-700';
			case 'PENDING': return 'bg-yellow-100 text-yellow-700';
			case 'REFUNDED': return 'bg-red-100 text-red-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}
</script>

{#if error}
	<div class="flex h-64 items-center justify-center text-red-500">{error}</div>
{:else}
<div class="max-w-6xl">
	<!-- Back button + Header -->
	<div class="mb-6">
		<button on:click={() => goto(`/events/${eventId}`)} class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
			<Icon icon="mdi:arrow-left" class="text-lg" /> Back to Event
		</button>
		{#if loading}
			<div class="h-9 w-3/4 animate-pulse rounded bg-gray-200"></div>
		{:else if eventData}
			<div class="flex items-center gap-2 mb-1">
				<span class="text-sm text-[#83808D]">{eventData.collection}</span>
				<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898Z" fill="#83808D" stroke="#83808D" stroke-width="0.37461"/><rect x="5.0584" y="5.85137" width="3.37149" height="1.12383" rx="0.561915" transform="rotate(-180 5.0584 5.85137)" fill="#83808D" stroke="#83808D" stroke-width="0.37461"/></svg>
			</div>
			<h1 class="text-2xl font-bold sm:text-3xl md:text-4xl">{eventData.title}</h1>
			<p class="mt-1 text-sm text-[#8C8F93]">Track ticket sales and revenue for this event.</p>
		{/if}
	</div>

	<!-- Summary Cards -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-xl border bg-white p-5">
			<p class="text-xs text-gray-500">Total Earnings</p>
			<p class="mt-1 text-2xl font-semibold">{formatCurrency(totalEarnings)}</p>
		</div>
		<div class="rounded-xl border bg-white p-5">
			<p class="text-xs text-gray-500">Completed</p>
			<p class="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(completedEarnings)}</p>
		</div>
		<div class="rounded-xl border bg-white p-5">
			<p class="text-xs text-gray-500">Pending</p>
			<p class="mt-1 text-2xl font-semibold text-yellow-600">{formatCurrency(pendingEarnings)}</p>
		</div>
	</div>

	<!-- Search + Filters -->
	<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div class="relative w-full max-w-xl">
			<input type="text" bind:value={searchQuery} placeholder="Search by name, email, or ticket type..." class="h-[43px] w-full rounded-lg bg-white py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
			<span class="absolute top-2.5 left-3 text-gray-400"><img src="/search-favorite.png" alt="search" class="h-5 w-5" /></span>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/download-icon.svg" alt="download" /></div>
			<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]"><img src="/export.svg" alt="export" /></div>
			<div use:clickOutside={() => (showStatusDropdown = false)} class="relative">
				<button on:click={() => (showStatusDropdown = !showStatusDropdown)} class="flex items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<img src="/filter-edit.svg" alt="filter" class="h-5 w-5" /> {statusFilter}
				</button>
				{#if showStatusDropdown}
					<div class="absolute right-0 z-10 mt-1 w-40 rounded-lg border bg-white shadow-lg">
						{#each statusOptions as opt}
							<button on:click={() => { statusFilter = opt; showStatusDropdown = false; }} class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {statusFilter === opt ? 'font-medium text-pink-600' : ''}">{opt}</button>
						{/each}
					</div>
				{/if}
			</div>
			<div use:clickOutside={() => (showDateDropdown = false)} class="relative">
				<button on:click={() => (showDateDropdown = !showDateDropdown)} class="flex items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<Icon icon="mdi:calendar-outline" class="text-base" /> {dateFilter}
				</button>
				{#if showDateDropdown}
					<div class="absolute right-0 z-10 mt-1 w-40 rounded-lg border bg-white shadow-lg">
						{#each dateOptions as opt}
							<button on:click={() => { dateFilter = opt; showDateDropdown = false; }} class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {dateFilter === opt ? 'font-medium text-pink-600' : ''}">{opt}</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Earnings Table -->
	{#if loading}
		<div class="overflow-hidden rounded-xl bg-white shadow-sm">
			{#each [1, 2, 3, 4] as _}
				<div class="flex animate-pulse items-center gap-4 border-b px-4 py-4 last:border-none">
					<div class="h-8 w-8 rounded-full bg-gray-200"></div>
					<div class="h-4 w-32 rounded bg-gray-200"></div>
					<div class="h-4 w-24 rounded bg-gray-200"></div>
					<div class="h-4 w-20 rounded bg-gray-200"></div>
					<div class="h-4 w-16 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if filteredEarnings.length > 0}
		<div class="overflow-visible rounded-xl bg-white shadow-sm">
			<!-- Table Header -->
			<div class="hidden border-b px-4 py-3 text-xs font-medium text-gray-400 lg:flex">
				<div class="w-1/4">User</div>
				<div class="w-1/6">Time</div>
				<div class="w-1/6">Date</div>
				<div class="w-1/6">Ticket Type</div>
				<div class="w-1/6 text-right">Amount</div>
				<div class="w-1/6 text-right">Status</div>
			</div>
			{#each filteredEarnings as e}
				<div class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0">
					<!-- User -->
					<div class="flex items-center gap-3 lg:w-1/4">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-medium text-white">
							{e.user.split(' ').map(n => n[0]).join('')}
						</div>
						<div>
							<p class="text-sm font-medium">{e.user}</p>
							<p class="text-xs text-gray-400">{e.email}</p>
						</div>
					</div>
					<!-- Time -->
					<div class="text-sm text-gray-500 lg:w-1/6">{formatTime(e.date)}</div>
					<!-- Date -->
					<div class="text-sm text-gray-500 lg:w-1/6">{formatDate(e.date)}</div>
					<!-- Ticket Type -->
					<div class="lg:w-1/6">
						<span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{e.ticketType}</span>
					</div>
					<!-- Amount -->
					<div class="text-sm font-medium lg:w-1/6 lg:text-right">{formatCurrency(e.amount)}</div>
					<!-- Status -->
					<div class="lg:w-1/6 lg:text-right">
						<span class="rounded-full px-2 py-1 text-xs font-medium {getStatusStyle(e.status)}">{e.status.charAt(0) + e.status.slice(1).toLowerCase()}</span>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:cash-off" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No earnings yet</p>
			<p class="mt-1 text-sm text-gray-400">Earnings will appear here when tickets are sold.</p>
		</div>
	{/if}
</div>
{/if}
