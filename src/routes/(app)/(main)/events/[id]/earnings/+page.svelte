<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getEventEarnings, getUserSubscriptionInfo } from '$lib/services/wallet.services';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

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
	let loadingEarnings = true;

	let earnings: any[] = [];
	let feeRate = 0.06;
	let feePercent = 6;
	let earningsPage = 1;
	const earningsPerPage = 20;

	const statusOptions = ['All', 'Completed', 'Pending', 'Refunded'];
	const dateOptions = ['All Time', 'Today', 'This Week', 'This Month', 'Last 3 Months', 'Last 6 Months'];

	function koboToNaira(amount: number): number {
		return amount / 100;
	}

	$: totalEarnings = earnings.reduce((sum: number, e: any) => sum + (e.status !== 'REFUNDED' ? koboToNaira(e.totalAmount ?? 0) : 0), 0);
	$: completedEarnings = earnings.filter((e: any) => e.status === 'COMPLETED').reduce((sum: number, e: any) => sum + koboToNaira(e.totalAmount ?? 0), 0);
	$: pendingEarnings = earnings.filter((e: any) => e.status === 'PENDING').reduce((sum: number, e: any) => sum + koboToNaira(e.totalAmount ?? 0), 0);
	$: platformFees = completedEarnings * feeRate;
	$: netEarnings = completedEarnings - platformFees;

	$: filteredEarnings = earnings.filter((e: any) => {
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			const name = (e.metaData?.purchaserName || e.metaData?.userName || '').toLowerCase();
			const email = (e.metaData?.purchaserEmail || e.metaData?.userEmail || '').toLowerCase();
			const ticketName = (e.metaData?.ticketTypeName || '').toLowerCase();
			if (!name.includes(q) && !email.includes(q) && !ticketName.includes(q)) return false;
		}
		if (statusFilter !== 'All' && e.status !== statusFilter.toUpperCase()) return false;
		if (dateFilter !== 'All Time') {
			const now = new Date();
			const created = new Date(e.paidAt || e.createdAt);
			if (dateFilter === 'Today') {
				if (created.toDateString() !== now.toDateString()) return false;
			} else if (dateFilter === 'This Week') {
				const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				if (created < weekAgo) return false;
			} else if (dateFilter === 'This Month') {
				if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) return false;
			} else if (dateFilter === 'Last 3 Months') {
				const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
				if (created < threeMonthsAgo) return false;
			} else if (dateFilter === 'Last 6 Months') {
				const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
				if (created < sixMonthsAgo) return false;
			}
		}
		return true;
	});

	$: earningsTotalPages = Math.ceil(filteredEarnings.length / earningsPerPage);
	$: pagedEarnings = filteredEarnings.slice((earningsPage - 1) * earningsPerPage, earningsPage * earningsPerPage);
	$: if (statusFilter || dateFilter || searchQuery) earningsPage = 1;

	onMount(() => {
		if (eventId) {
			fetchEarnings();
			loadFeeRate();
		}
	});

	async function loadFeeRate() {
		try {
			const info = await getUserSubscriptionInfo();
			feeRate = info.feeRate;
			feePercent = Math.round(feeRate * 100);
		} catch { /* use defaults */ }
	}

	async function fetchEarnings() {
		loadingEarnings = true;
		try {
			const result = await getEventEarnings(eventId, { limit: 100 });
			earnings = result.data ?? [];
		} catch (e: any) {
			console.error('Failed to fetch earnings:', e);
		} finally {
			loadingEarnings = false;
		}
	}

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

	function getUserInitials(e: any): string {
		const name = e.metaData?.purchaserName || e.metaData?.userName || 'U';
		return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
	}

	function getUserName(e: any): string {
		return e.metaData?.purchaserName || e.metaData?.userName || 'Unknown';
	}

	function getUserEmail(e: any): string {
		return e.metaData?.purchaserEmail || e.metaData?.userEmail || '';
	}

	function getTicketType(e: any): string {
		return e.metaData?.ticketTypeName || 'Ticket';
	}

	function downloadCSV() {
		if (filteredEarnings.length === 0) return;
		const headers = ['Name', 'Email', 'Time', 'Date', 'Ticket Type', 'Amount (₦)', `Fee (${feePercent}%)`, 'Net (₦)', 'Status'];
		const rows = filteredEarnings.map((e: any) => {
			const gross = koboToNaira(e.totalAmount ?? 0);
			const fee = e.status === 'COMPLETED' ? gross * feeRate : 0;
			const net = gross - fee;
			return [
				getUserName(e),
				getUserEmail(e),
				formatTime(e.paidAt || e.createdAt),
				formatDate(e.paidAt || e.createdAt),
				getTicketType(e),
				gross.toFixed(2),
				fee > 0 ? fee.toFixed(2) : '0',
				net.toFixed(2),
				e.status
			].map(v => `"${v}"`).join(',');
		});
		const csv = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `earnings-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
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
	<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Total Earnings</p>
			{#if loadingEarnings}
				<div class="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-xl font-semibold">{formatCurrency(totalEarnings)}</p>
			{/if}
		</div>
		<div class="rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Completed</p>
			{#if loadingEarnings}
				<div class="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-xl font-semibold text-green-600">{formatCurrency(completedEarnings)}</p>
			{/if}
		</div>
		<div class="rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Platform Fee ({feePercent}%)</p>
			{#if loadingEarnings}
				<div class="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-xl font-semibold text-red-500">-{formatCurrency(platformFees)}</p>
			{/if}
		</div>
		<div class="rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Pending</p>
			{#if loadingEarnings}
				<div class="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="mt-1 text-xl font-semibold text-yellow-600">{formatCurrency(pendingEarnings)}</p>
			{/if}
		</div>
	</div>

	<!-- Search + Filters -->
	<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div class="relative w-full max-w-sm">
			<input type="text" bind:value={searchQuery} placeholder="Search by name, email, or ticket type..." class="h-[43px] w-full rounded-lg bg-white py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
			<span class="absolute top-2.5 left-3 text-gray-400"><img src="/search-favorite.png" alt="search" class="h-5 w-5" /></span>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex h-[33px] w-[33px] cursor-pointer items-center justify-center rounded-lg bg-[#EBECED] hover:bg-gray-200" on:click={downloadCSV} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && downloadCSV()}><img src="/download-icon.svg" alt="download CSV" /></div>
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
	{#if loadingEarnings}
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
				<div class="w-[22%]">User</div>
				<div class="w-[10%]">Time</div>
				<div class="w-[12%]">Date</div>
				<div class="w-[12%]">Ticket Type</div>
				<div class="w-[12%] text-right">Amount</div>
				<div class="w-[10%] text-right">Fee ({feePercent}%)</div>
				<div class="w-[12%] text-right">Net</div>
				<div class="w-[10%] text-right">Status</div>
			</div>
			{#each pagedEarnings as e}
				{@const gross = koboToNaira(e.totalAmount ?? 0)}
				{@const fee = e.status === 'COMPLETED' ? gross * feeRate : 0}
				{@const net = gross - fee}
				<div class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0">
					<!-- User -->
					<div class="flex items-center gap-3 lg:w-[22%]">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-medium text-white">
							{getUserInitials(e)}
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium truncate">{getUserName(e)}</p>
							<p class="text-xs text-gray-400 truncate">{getUserEmail(e)}</p>
						</div>
					</div>
					<!-- Time -->
					<div class="text-sm text-gray-500 lg:w-[10%]">{formatTime(e.paidAt || e.createdAt)}</div>
					<!-- Date -->
					<div class="text-sm text-gray-500 lg:w-[12%]">{formatDate(e.paidAt || e.createdAt)}</div>
					<!-- Ticket Type -->
					<div class="lg:w-[12%]">
						<span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{getTicketType(e)}</span>
					</div>
					<!-- Amount -->
					<div class="text-sm font-medium lg:w-[12%] lg:text-right">{formatCurrency(gross)}</div>
					<!-- Platform Fee -->
					<div class="text-sm text-red-400 lg:w-[10%] lg:text-right">{fee > 0 ? `-${formatCurrency(fee)}` : '–'}</div>
					<!-- Net -->
					<div class="text-sm font-medium text-green-700 lg:w-[12%] lg:text-right">{formatCurrency(net)}</div>
					<!-- Status -->
					<div class="lg:w-[10%] lg:text-right">
						<span class="rounded-full px-2 py-1 text-xs font-medium {getStatusStyle(e.status)}">{e.status.charAt(0) + e.status.slice(1).toLowerCase()}</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if earningsTotalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<button
					on:click={() => { earningsPage = Math.max(1, earningsPage - 1); }}
					disabled={earningsPage === 1}
					class="rounded-md px-3 py-1 text-sm text-[#616265] transition-colors hover:bg-[#EBECED] disabled:opacity-40"
				>
					Previous
				</button>
				<span class="text-sm text-gray-500">Page {earningsPage} of {earningsTotalPages}</span>
				<button
					on:click={() => { earningsPage = Math.min(earningsTotalPages, earningsPage + 1); }}
					disabled={earningsPage === earningsTotalPages}
					class="rounded-md px-3 py-1 text-sm text-[#616265] transition-colors hover:bg-[#EBECED] disabled:opacity-40"
				>
					Next
				</button>
			</div>
		{/if}
	{:else}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:cash-off" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No earnings yet</p>
			<p class="mt-1 text-sm text-gray-400">Earnings will appear here when tickets are sold.</p>
		</div>
	{/if}
</div>
{/if}
