<script lang="ts">
	import { getExhibitorCollaborations, type ExhibitorCollaborationFilters } from '$lib/services/exhibitor.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let loading = true;
	let payments: any[] = [];
	let searchQuery = '';
	let statusFilter = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let showStatusDropdown = false;
	let currentPage = 1;
	let totalPages = 1;
	const limit = 20;

	const statusOptions = [
		{ label: 'All', value: '' },
		{ label: 'Paid', value: 'CONFIRMED' },
		{ label: 'Pending', value: 'PAYMENT_PENDING' },
		{ label: 'Overdue', value: 'OVERDUE' },
	];

	async function fetchPayments() {
		loading = true;
		try {
			const filters: ExhibitorCollaborationFilters = { page: currentPage, limit, sortBy: 'createdAt', sortOrder: 'desc' };
			if (searchQuery) filters.search = searchQuery;

			const result = await getExhibitorCollaborations(filters);
			let allCollabs = result?.collaborations || result?.data || [];
			if (!Array.isArray(allCollabs)) allCollabs = [];

			// Filter to only show collaborations with invoice data or payment-related statuses
			let filtered = allCollabs.filter((c: any) => c.invoice || ['PAYMENT_PENDING', 'CONFIRMED'].includes(c.status));

			if (statusFilter === 'CONFIRMED') {
				filtered = filtered.filter((c: any) => c.invoice?.invoiceStatus === 'PAID' || c.status === 'CONFIRMED');
			} else if (statusFilter === 'PAYMENT_PENDING') {
				filtered = filtered.filter((c: any) => c.status === 'PAYMENT_PENDING' || (c.invoice && c.invoice.invoiceStatus !== 'PAID'));
			} else if (statusFilter === 'OVERDUE') {
				filtered = filtered.filter((c: any) => c.invoice?.invoiceStatus === 'OVERDUE');
			}

			payments = filtered;
			const pg = result?.pagination;
			if (pg) totalPages = pg.totalPages || 1;
		} catch { payments = []; }
		finally { loading = false; }
	}

	onMount(() => { fetchPayments(); });
	function handleSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { currentPage = 1; fetchPayments(); }, 300); }
	function selectStatus(v: string) { statusFilter = v; showStatusDropdown = false; currentPage = 1; fetchPayments(); }
	function goToPage(p: number) { if (p >= 1 && p <= totalPages) { currentPage = p; fetchPayments(); } }

	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''; }
	function getPaymentStatusClass(c: any) {
		if (c.invoice?.invoiceStatus === 'PAID' || c.status === 'CONFIRMED') return 'bg-green-100 text-green-700';
		if (c.invoice?.invoiceStatus === 'OVERDUE') return 'bg-red-100 text-red-700';
		return 'bg-orange-100 text-orange-600';
	}
	function getPaymentStatusLabel(c: any) {
		if (c.invoice?.invoiceStatus === 'PAID' || c.status === 'CONFIRMED') return 'Paid';
		if (c.invoice?.invoiceStatus === 'OVERDUE') return 'Overdue';
		if (c.status === 'PAYMENT_PENDING') return 'Pending';
		return c.invoice?.invoiceStatus || 'Pending';
	}
	function getAmount(c: any) {
		if (c.invoice?.amount) return `₦${Number(c.invoice.amount).toLocaleString()}`;
		return '—';
	}
</script>

<div>
	<div class="mb-5">
		<h2 class="flex items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">Payment History <Icon icon="mdi:information-outline" class="h-4 w-4 text-gray-400" /></h2>
		<p class="mt-0.5 text-xs text-gray-400 sm:text-sm">Track invoices and payments for your exhibition bookings.</p>
	</div>

	<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative w-full sm:max-w-sm">
			<img src="/search-favorite.svg" alt="" class="absolute left-3 top-2.5 h-4 w-4" />
			<input type="text" bind:value={searchQuery} on:input={handleSearch} placeholder="Search by event name..." class="h-10 w-full rounded-lg bg-white py-2 pl-10 pr-3 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none" />
		</div>
		<div class="relative">
			<button on:click={() => (showStatusDropdown = !showStatusDropdown)} class="flex items-center gap-2 rounded-lg bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265]">
				Status <Icon icon="mdi:chevron-down" class="h-3 w-3" />
			</button>
			{#if showStatusDropdown}
				<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showStatusDropdown = false)} aria-label="Close"></button>
				<div class="absolute right-0 z-20 mt-1 w-40 rounded-lg border bg-white p-1 shadow-lg">
					{#each statusOptions as opt}
						<button on:click={() => selectStatus(opt.value)} class="flex w-full items-center rounded-md px-3 py-2 text-left text-xs hover:bg-gray-50 {statusFilter === opt.value ? 'bg-gray-50 font-medium' : ''}">{opt.label}</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="rounded-lg bg-white">
			{#each Array(5) as _}
				<div class="flex animate-pulse items-center gap-4 border-b px-4 py-3 last:border-b-0">
					<div class="h-8 w-8 rounded-full bg-gray-200"></div><div class="h-4 w-28 rounded bg-gray-200"></div><div class="h-4 w-36 rounded bg-gray-100"></div><div class="ml-auto h-4 w-16 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if payments.length > 0}
		<div class="hidden rounded-lg bg-white sm:block">
			{#each payments as p (p._id)}
				<div class="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50">
					<div class="col-span-3 truncate font-medium text-gray-900">{p.eventName || p.title || '—'}</div>
					<div class="col-span-2 truncate text-gray-600">{p.organizerName || '—'}</div>
					<div class="col-span-2 text-xs text-gray-400">{p.invoice?.invoiceNumber || '—'}</div>
					<div class="col-span-2 text-xs font-medium text-green-600">{getAmount(p)}</div>
					<div class="col-span-1 text-xs text-gray-400">{formatDate(p.invoice?.invoiceSentAt || p.createdAt)}</div>
					<div class="col-span-2 flex items-center justify-end">
						<span class="rounded px-2 py-0.5 text-[10px] font-medium {getPaymentStatusClass(p)}">{getPaymentStatusLabel(p)}</span>
					</div>
				</div>
			{/each}
		</div>
		<div class="space-y-2 sm:hidden">
			{#each payments as p (p._id)}
				<div class="flex w-full items-center justify-between rounded-lg bg-white p-3">
					<div class="min-w-0">
						<p class="truncate text-sm font-medium text-gray-900">{p.eventName || p.title || '—'}</p>
						<p class="truncate text-xs text-gray-400">{p.invoice?.invoiceNumber || 'No invoice'} · {p.organizerName || ''}</p>
					</div>
					<div class="flex flex-col items-end gap-0.5 shrink-0">
						<span class="text-xs font-medium text-green-600">{getAmount(p)}</span>
						<span class="rounded px-2 py-0.5 text-[10px] font-medium {getPaymentStatusClass(p)}">{getPaymentStatusLabel(p)}</span>
					</div>
				</div>
			{/each}
		</div>
		{#if totalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40">Previous</button>
				{#each Array(Math.min(totalPages, 5)) as _, i}
					{@const pg = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i}
					<button on:click={() => goToPage(pg)} class="h-8 w-8 rounded-md text-sm {currentPage === pg ? 'bg-[#7C3AED] text-white' : 'text-gray-500 hover:bg-gray-100'}">{pg}</button>
				{/each}
				<button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40">Next</button>
			</div>
		{/if}
	{:else}
		<div class="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-center">
			<Icon icon="mdi:receipt-text-outline" class="mb-3 h-16 w-16 text-gray-200" />
			<p class="text-sm font-medium text-gray-500">No payment history yet</p>
			<p class="mt-1 text-xs text-gray-400">Invoices and payment records will appear here.</p>
		</div>
	{/if}
</div>
