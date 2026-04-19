<script lang="ts">
	import { getExhibitorCollaborations, type ExhibitorCollaborationFilters } from '$lib/services/exhibitor.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let loading = true;
	let events: any[] = [];
	let searchQuery = '';
	let statusFilter = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let showStatusDropdown = false;
	let currentPage = 1;
	let totalPages = 1;
	const limit = 20;

	const statusOptions = [
		{ label: 'Accepted', value: 'ACCEPTED' },
		{ label: 'Awaiting Payment', value: 'PAYMENT_PENDING' },
		{ label: 'Confirmed (Paid)', value: 'CONFIRMED' },
	];

	async function fetchEvents() {
		loading = true;
		try {
			const filters: ExhibitorCollaborationFilters = { page: currentPage, limit, sortBy: 'createdAt', sortOrder: 'desc', status: statusFilter || 'ACCEPTED' };
			if (searchQuery) filters.search = searchQuery;

			// When a specific filter is selected, use that; otherwise default to ACCEPTED
			if (statusFilter) filters.status = statusFilter;

			const result = await getExhibitorCollaborations(filters);
			events = result?.collaborations || result?.data || [];
			if (!Array.isArray(events)) events = [];

			const pg = result?.pagination;
			if (pg) totalPages = pg.totalPages || 1;
		} catch { events = []; }
		finally { loading = false; }
	}

	onMount(() => { fetchEvents(); });
	function handleSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { currentPage = 1; fetchEvents(); }, 300); }
	function selectStatus(v: string) { statusFilter = v; showStatusDropdown = false; currentPage = 1; fetchEvents(); }
	function goToPage(p: number) { if (p >= 1 && p <= totalPages) { currentPage = p; fetchEvents(); } }

	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''; }
	function getStatusClass(s: string) {
		switch (s) {
			case 'ACCEPTED': return 'text-[#3CBD2C]';
			case 'CONFIRMED': return 'text-[#3CBD2C]';
			case 'PAYMENT_PENDING': return 'text-[#EAAB26]';
			case 'CANCELLED': return 'text-[#E53935]';
			default: return 'text-[#616265]';
		}
	}
	function getStatusLabel(s: string) {
		switch (s) {
			case 'ACCEPTED': return 'Accepted';
			case 'PAYMENT_PENDING': return 'Awaiting Payment';
			case 'CONFIRMED': return 'Paid & Confirmed';
			case 'CANCELLED': return 'Cancelled';
			default: return s;
		}
	}
	function getTypeLabel(t: string) {
		switch (t) {
			case 'INVITATION': return 'Inbound';
			case 'SENT_REQUEST': return 'Sent';
			case 'APPLICATION': return 'Applied';
			default: return t;
		}
	}
	function getTypeBadgeClass(t: string) {
		switch (t) {
			case 'INVITATION': return 'bg-blue-50 text-blue-600';
			case 'SENT_REQUEST': return 'bg-orange-50 text-orange-600';
			default: return 'bg-gray-100 text-gray-600';
		}
	}
</script>

<div>
	<div class="mb-5">
		<h2 class="flex items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">Accepted Collaborations <Icon icon="mdi:information-outline" class="h-4 w-4 text-gray-400" /></h2>
		<p class="mt-0.5 text-xs text-gray-400 sm:text-sm">All collaborations that have been accepted — both invitations you accepted and requests organizers approved.</p>
	</div>

	<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative w-full sm:max-w-sm">
			<img src="/search-favorite.svg" alt="" class="absolute left-3 top-2.5 h-4 w-4" />
			<input type="text" bind:value={searchQuery} on:input={handleSearch} placeholder="Search collaborations..." class="h-10 w-full rounded-lg bg-white py-2 pl-10 pr-3 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none" />
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
	{:else if events.length > 0}
		<div class="hidden rounded-lg bg-white sm:block">
			{#each events as ev (ev._id)}
				<div class="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50">
					<div class="col-span-3 flex items-center gap-2 min-w-0">
						<img src={ev.organizerProfilePicture || '/rondwell-attendee.png'} alt="" class="h-7 w-7 shrink-0 rounded-full object-cover" />
						<span class="truncate font-medium text-gray-900">{ev.organizerName || 'Organizer'}</span>
					</div>
					<div class="col-span-3 truncate text-gray-600">{ev.eventName || ev.title || '—'}</div>
					<div class="col-span-1"><span class="rounded px-1.5 py-0.5 text-[10px] font-medium {getTypeBadgeClass(ev.type)}">{getTypeLabel(ev.type)}</span></div>
					<div class="col-span-2 truncate text-gray-400">{ev.packageName || ev.category || '—'}</div>
					<div class="col-span-1 text-xs text-gray-400">{formatDate(ev.createdAt)}</div>
					<div class="col-span-2 flex items-center justify-end gap-2">
						<span class="text-xs font-medium {getStatusClass(ev.status)}">{getStatusLabel(ev.status)}</span>
						{#if ev.invoice?.invoiceNumber}
							<span class="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">Invoice #{ev.invoice.invoiceNumber.slice(-6)}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		<div class="space-y-2 sm:hidden">
			{#each events as ev (ev._id)}
				<div class="flex w-full items-center justify-between rounded-lg bg-white p-3">
					<div class="flex items-center gap-2.5 min-w-0">
						<img src={ev.organizerProfilePicture || '/rondwell-attendee.png'} alt="" class="h-8 w-8 shrink-0 rounded-full object-cover" />
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-gray-900">{ev.organizerName || 'Organizer'}</p>
							<p class="truncate text-xs text-gray-400">{ev.eventName || ev.title || '—'}</p>
						</div>
					</div>
					<div class="flex flex-col items-end gap-0.5 shrink-0">
						<span class="rounded px-1.5 py-0.5 text-[10px] font-medium {getTypeBadgeClass(ev.type)}">{getTypeLabel(ev.type)}</span>
						<span class="text-[10px] font-medium {getStatusClass(ev.status)}">{getStatusLabel(ev.status)}</span>
						<span class="text-[10px] text-gray-400">{formatDate(ev.createdAt)}</span>
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
			<Icon icon="mdi:check-decagram-outline" class="mb-3 h-16 w-16 text-gray-200" />
			<p class="text-sm font-medium text-gray-500">No accepted collaborations yet</p>
			<p class="mt-1 text-xs text-gray-400">Collaborations you've accepted or that organizers have approved will appear here.</p>
		</div>
	{/if}
</div>
