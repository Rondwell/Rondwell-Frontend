<script lang="ts">
	import { getExhibitorCollaborations, type ExhibitorCollaborationFilters } from '$lib/services/exhibitor.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import SentRequestDetailModal from './SentRequestDetailModal.svelte';

	export let exhibitorName = '';
	export let exhibitorProfilePictureUrl = '';

	let loading = true;
	let requests: any[] = [];
	let searchQuery = '';
	let statusFilter = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let showStatusDropdown = false;
	let currentPage = 1;
	let totalPages = 1;
	const limit = 20;

	let showDetailModal = false;
	let selectedId = '';
	let selectedReq: any = null;
	let modalMode: 'view' | 'create' = 'view';

	const statusOptions = [
		{ label: 'All', value: '' },
		{ label: 'Pending', value: 'PENDING' },
		{ label: 'Accepted', value: 'ACCEPTED' },
		{ label: 'Declined', value: 'DECLINED' },
	];

	async function fetchRequests() {
		loading = true;
		try {
			const filters: ExhibitorCollaborationFilters = { page: currentPage, limit, sortBy: 'createdAt', sortOrder: 'desc', type: 'SENT_REQUEST' };
			if (statusFilter) filters.status = statusFilter;
			if (searchQuery) filters.search = searchQuery;
			const result = await getExhibitorCollaborations(filters);
			requests = result?.collaborations || result?.data || [];
			if (!Array.isArray(requests)) requests = [];
			const pg = result?.pagination;
			if (pg) totalPages = pg.totalPages || 1;
		} catch { requests = []; }
		finally { loading = false; }
	}

	onMount(() => { fetchRequests(); });
	function handleSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { currentPage = 1; fetchRequests(); }, 300); }
	function selectStatus(v: string) { statusFilter = v; showStatusDropdown = false; currentPage = 1; fetchRequests(); }
	function goToPage(p: number) { if (p >= 1 && p <= totalPages) { currentPage = p; fetchRequests(); } }

	function openDetail(req: any) { selectedId = req._id; selectedReq = req; modalMode = 'view'; showDetailModal = true; }
	function openCreateForm() { selectedId = ''; selectedReq = null; modalMode = 'create'; showDetailModal = true; }

	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''; }
	function getStatusClass(s: string) {
		switch (s) {
			case 'ACCEPTED': case 'CONFIRMED': return 'text-[#3CBD2C]';
			case 'PENDING': return 'text-[#EAAB26]';
			case 'DECLINED': case 'CANCELLED': return 'text-[#E53935]';
			default: return 'text-[#616265]';
		}
	}
</script>

<div>
	<div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h2 class="flex items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">Sent Exhibition Requests <Icon icon="mdi:information-outline" class="h-4 w-4 text-gray-400" /></h2>
			<p class="mt-0.5 text-xs text-gray-400 sm:text-sm">Track your proactive exhibition proposals to Organizers.</p>
		</div>
		<button on:click={openCreateForm} class="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2.5 text-xs font-bold text-white hover:bg-gray-800">
			<Icon icon="mdi:plus" class="h-4 w-4" /> Send New Exhibition Request
		</button>
	</div>

	<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
	{:else if requests.length > 0}
		<div class="hidden rounded-lg bg-white sm:block">
			{#each requests as req (req._id)}
				<div class="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50">
					<div class="col-span-3 flex items-center gap-2 min-w-0">
						<img src={req.organizerProfilePicture || '/rondwell-attendee.png'} alt="" class="h-7 w-7 shrink-0 rounded-full object-cover" />
						<span class="truncate font-medium text-gray-900">{req.organizerName || 'Organizer'}</span>
					</div>
					<div class="col-span-3 truncate text-gray-600">{req.eventName || req.title || '—'}</div>
					<div class="col-span-2 truncate text-gray-400">{req.title || req.category || '—'}</div>
					<div class="col-span-1 text-xs text-gray-400">{formatDate(req.createdAt)}</div>
					<div class="col-span-1 text-xs font-medium {getStatusClass(req.status)}">{req.status}</div>
					<div class="col-span-2 flex items-center justify-end gap-1.5">
						<button on:click={() => openDetail(req)} class="rounded-md bg-[#EBECED] px-2.5 py-1 text-[10px] font-medium text-[#616265] hover:bg-gray-300">View Details</button>
						<input type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300" />
					</div>
				</div>
			{/each}
		</div>
		<div class="space-y-2 sm:hidden">
			{#each requests as req (req._id)}
				<button on:click={() => openDetail(req)} class="flex w-full items-center justify-between rounded-lg bg-white p-3 text-left">
					<div class="flex items-center gap-2.5 min-w-0">
						<img src={req.organizerProfilePicture || '/rondwell-attendee.png'} alt="" class="h-8 w-8 shrink-0 rounded-full object-cover" />
						<div class="min-w-0"><p class="truncate text-sm font-medium text-gray-900">{req.organizerName || 'Organizer'}</p><p class="truncate text-xs text-gray-400">{req.eventName || req.title || '—'}</p></div>
					</div>
					<div class="flex flex-col items-end gap-0.5 shrink-0">
						<span class="text-[10px] font-medium {getStatusClass(req.status)}">{req.status}</span>
						<span class="text-[10px] text-gray-400">{formatDate(req.createdAt)}</span>
					</div>
				</button>
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
			<Icon icon="mdi:send-outline" class="mb-3 h-16 w-16 text-gray-200" />
			<p class="text-sm font-medium text-gray-500">No sent requests yet</p>
			<p class="mt-1 text-xs text-gray-400">Your sent exhibition requests will appear here.</p>
		</div>
	{/if}
</div>

<SentRequestDetailModal bind:open={showDetailModal} collaborationId={selectedId} initialData={selectedReq} mode={modalMode} {exhibitorName} {exhibitorProfilePictureUrl} onStatusChanged={() => fetchRequests()} />
