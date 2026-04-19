<script lang="ts">
	import { getAdminCollections, verifyCollection } from '$lib/services/admin.services';
	import { onMount } from 'svelte';

	let activeTab: 'list' | 'approvals' = 'list';

	// Collections List
	let collections: any[] = [];
	let colTotal = 0;
	let colPage = 1;
	let colTotalPages = 1;
	let colLoading = true;
	let colSearch = '';
	let colSearchTimeout: ReturnType<typeof setTimeout>;

	// Approvals (verification requests)
	let approvals: any[] = [];
	let appTotal = 0;
	let appPage = 1;
	let appTotalPages = 1;
	let appLoading = true;
	let appStatusFilter = 'ALL';
	let showAppStatusDropdown = false;

	// Review modal
	let showReviewModal = false;
	let selectedRequest: any = null;
	let reviewUpdating = false;

	const appStatusOptions = [
		{ label: 'All Requests', value: 'ALL' },
		{ label: 'Pending', value: 'PENDING' },
		{ label: 'Approved', value: 'APPROVED' },
		{ label: 'Rejected', value: 'REJECTED' },
	];

	$: appStatusLabel = appStatusOptions.find((s) => s.value === appStatusFilter)?.label ?? 'All Requests';
	$: pendingCount = approvals.filter((a) => a.approvalStatus === 'PENDING').length;

	onMount(() => { fetchCollections(); fetchApprovals(); });

	async function fetchCollections() {
		colLoading = true;
		try {
			const params: Record<string, string> = { page: colPage.toString(), limit: '20', sortBy: 'createdAt', sortOrder: 'desc' };
			if (colSearch) params.search = colSearch;
			const data = await getAdminCollections(params);
			collections = data.collections;
			colTotal = data.total;
			colTotalPages = data.totalPages;
		} catch { collections = []; }
		finally { colLoading = false; }
	}

	async function fetchApprovals() {
		appLoading = true;
		try {
			const API_URL = import.meta.env.VITE_API_URL;
			const token = localStorage.getItem('admin_token');
			const params = new URLSearchParams({ page: appPage.toString(), limit: '20' });
			if (appStatusFilter !== 'ALL') params.set('status', appStatusFilter);

			const res = await fetch(`${API_URL}/api/v1/admin/collections/approvals?${params}`, {
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			});
			const data = await res.json();
			if (data.success) {
				approvals = data.data.approvals;
				appTotal = data.data.total;
				appTotalPages = data.data.totalPages;
			}
		} catch { approvals = []; }
		finally { appLoading = false; }
	}

	function handleColSearch() {
		clearTimeout(colSearchTimeout);
		colSearchTimeout = setTimeout(() => { colPage = 1; fetchCollections(); }, 300);
	}

	function selectAppStatus(value: string) { appStatusFilter = value; showAppStatusDropdown = false; appPage = 1; fetchApprovals(); }

	async function handleVerify(id: string, status: 'APPROVED' | 'REJECTED') {
		reviewUpdating = true;
		try {
			await verifyCollection(id, status);
			showReviewModal = false;
			fetchApprovals();
		} catch (e) { console.error(e); }
		finally { reviewUpdating = false; }
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'APPROVED': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'REJECTED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#FFF8E1] text-[#EAAB26]';
		}
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head><title>Collections | Rondwell HQ</title></svelte:head>

<div>
	<div class="mb-6">
		<h1 class="text-3xl font-semibold text-gray-900">Collections</h1>
		<p class="mt-1 text-sm text-gray-500">Manage collections and newsletter verification requests</p>
	</div>

	<!-- Inner Tabs -->
	<div class="mb-6">
		<nav class="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
			<button on:click={() => (activeTab = 'list')}
				class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition {activeTab === 'list' ? 'bg-[#513BE2] text-white shadow' : 'text-gray-500 hover:text-gray-700'}">
				Collection List
			</button>
			<button on:click={() => (activeTab = 'approvals')}
				class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition {activeTab === 'approvals' ? 'bg-[#513BE2] text-white shadow' : 'text-gray-500 hover:text-gray-700'}">
				Verification Requests
				{#if pendingCount > 0}
					<span class="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
						{pendingCount}
					</span>
				{/if}
			</button>
		</nav>
	</div>

	<!-- ─── Collection List Tab ─── -->
	{#if activeTab === 'list'}
		<div class="relative mb-4 w-full">
			<input type="text" bind:value={colSearch} on:input={handleColSearch} placeholder="Search collections..."
				class="h-[44px] w-full rounded-xl bg-white py-2 pr-4 pl-10 text-sm shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
			<svg class="absolute top-3 left-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
		</div>

		{#if colLoading}
			<div class="rounded-xl bg-white p-4">
				{#each Array(5) as _}
					<div class="flex animate-pulse items-center justify-between border-b py-3 last:border-b-0">
						<div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-gray-200"></div><div><div class="h-4 w-40 rounded bg-gray-200"></div><div class="mt-1 h-3 w-24 rounded bg-gray-200"></div></div></div>
						<div class="h-4 w-16 rounded bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if collections.length > 0}
			<div class="rounded-xl bg-white">
				{#each collections as col}
					<div class="flex items-center gap-2 border-b border-gray-50 px-4 py-3 last:border-b-0">
						<div class="flex min-w-0 flex-1 items-center gap-3">
							{#if col.profilePictureUrl}
								<img src={col.profilePictureUrl} alt="" class="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
							{:else}
								<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF7D8] text-xs font-semibold text-[#D79917]">
									{(col.name || '?').charAt(0).toUpperCase()}
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-800">{col.name}</p>
								<p class="text-xs text-gray-400">{col.eventCount || 0} events · {col.subscriberCount || 0} subscribers</p>
							</div>
						</div>
						<span class="flex-shrink-0 text-xs text-gray-400">{formatDate(col.createdAt)}</span>
					</div>
				{/each}
			</div>

			{#if colTotalPages > 1}
				<div class="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
					<p class="text-xs text-gray-400">Showing {(colPage - 1) * 20 + 1}–{Math.min(colPage * 20, colTotal)} of {colTotal}</p>
					<div class="flex items-center gap-1">
						<button on:click={() => { colPage = Math.max(1, colPage - 1); fetchCollections(); }} disabled={colPage === 1} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] hover:bg-white disabled:opacity-40">Prev</button>
						{#each Array(Math.min(colTotalPages, 5)) as _, i}
							{@const pageNum = colTotalPages <= 5 ? i + 1 : Math.max(1, Math.min(colPage - 2, colTotalPages - 4)) + i}
							<button on:click={() => { colPage = pageNum; fetchCollections(); }}
								class="h-8 w-8 rounded-lg text-sm transition {colPage === pageNum ? 'bg-[#513BE2] text-white' : 'text-[#616265] hover:bg-white'}">{pageNum}</button>
						{/each}
						<button on:click={() => { colPage = Math.min(colTotalPages, colPage + 1); fetchCollections(); }} disabled={colPage === colTotalPages} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] hover:bg-white disabled:opacity-40">Next</button>
					</div>
				</div>
			{/if}
		{:else}
			<div class="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-white">
				<p class="text-lg font-medium text-[#646568]">No Collections Found</p>
			</div>
		{/if}

	<!-- ─── Verification Requests Tab ─── -->
	{:else}
		<div class="mb-4">
			<div class="relative inline-block">
				<button on:click={() => (showAppStatusDropdown = !showAppStatusDropdown)}
					class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-[#616265] shadow-sm">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
					{appStatusLabel}
				</button>
				{#if showAppStatusDropdown}
					<div class="absolute left-0 z-50 mt-2 w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
						{#each appStatusOptions as option}
							<button on:click={() => selectAppStatus(option.value)}
								class="flex w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 {appStatusFilter === option.value ? 'font-medium text-[#513BE2]' : 'text-[#616265]'}">
								{option.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		{#if appLoading}
			<div class="rounded-xl bg-white p-4">
				{#each Array(3) as _}
					<div class="flex animate-pulse items-center justify-between border-b py-4 last:border-b-0">
						<div><div class="h-4 w-48 rounded bg-gray-200"></div><div class="mt-2 h-3 w-32 rounded bg-gray-200"></div></div>
						<div class="h-6 w-20 rounded-full bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if approvals.length > 0}
			<div class="rounded-xl bg-white">
				{#each approvals as req}
					<button class="flex w-full items-center gap-2 border-b border-gray-50 px-4 py-4 text-left transition last:border-b-0 hover:bg-gray-50"
						on:click={() => { selectedRequest = req; showReviewModal = true; }}>
						<div class="flex min-w-0 flex-1 items-center gap-3">
							{#if req.profilePictureUrl}
								<img src={req.profilePictureUrl} alt="" class="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
							{:else}
								<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF7D8] text-xs font-semibold text-[#D79917]">
									{(req.name || '?').charAt(0).toUpperCase()}
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-800">{req.name}</p>
								<p class="text-xs text-gray-400">
									Est. audience: {req.verificationRequest?.estimatedAudience || 0} · {req.subscriberCount || 0} subscribers
								</p>
								<p class="mt-0.5 text-xs text-gray-300">Submitted {formatDate(req.verificationRequest?.submittedAt || req.updatedAt)}</p>
							</div>
						</div>
						<span class="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium {getStatusClass(req.approvalStatus)}">
							{req.approvalStatus}
						</span>
					</button>
				{/each}
			</div>

			{#if appTotalPages > 1}
				<div class="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
					<p class="text-xs text-gray-400">Showing {(appPage - 1) * 20 + 1}–{Math.min(appPage * 20, appTotal)} of {appTotal}</p>
					<div class="flex items-center gap-1">
						<button on:click={() => { appPage = Math.max(1, appPage - 1); fetchApprovals(); }} disabled={appPage === 1} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] hover:bg-white disabled:opacity-40">Prev</button>
						<span class="text-sm text-gray-500">{appPage} / {appTotalPages}</span>
						<button on:click={() => { appPage = Math.min(appTotalPages, appPage + 1); fetchApprovals(); }} disabled={appPage === appTotalPages} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] hover:bg-white disabled:opacity-40">Next</button>
					</div>
				</div>
			{/if}
		{:else}
			<div class="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-white">
				<p class="text-lg font-medium text-[#646568]">No Verification Requests</p>
				<p class="text-sm text-gray-400">When organizers submit newsletter verification requests, they'll appear here</p>
			</div>
		{/if}
	{/if}
</div>

<!-- Review Modal -->
{#if showReviewModal && selectedRequest}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div on:click={() => (showReviewModal = false)} on:keydown={(e) => e.key === 'Escape' && (showReviewModal = false)}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		role="dialog" aria-modal="true" tabindex="-1">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" on:click|stopPropagation on:keydown|stopPropagation role="document">
			<div class="mb-1 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Newsletter Verification Request</h2>
				<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusClass(selectedRequest.approvalStatus)}">{selectedRequest.approvalStatus}</span>
			</div>
			<p class="mb-5 text-sm text-gray-400">{selectedRequest.name}</p>

			<div class="space-y-4">
				<div>
					<p class="text-xs font-medium text-[#C1C2C2]">Estimated Audience</p>
					<p class="text-sm text-gray-800">{selectedRequest.verificationRequest?.estimatedAudience || 'N/A'}</p>
				</div>
				<div>
					<p class="text-xs font-medium text-[#C1C2C2]">About Their Events</p>
					<p class="text-sm text-gray-700">{selectedRequest.verificationRequest?.eventsInfo || 'No information provided'}</p>
				</div>
				<div>
					<p class="text-xs font-medium text-[#C1C2C2]">About Their Guests</p>
					<p class="text-sm text-gray-700">{selectedRequest.verificationRequest?.guestsInfo || 'No information provided'}</p>
				</div>
				<div>
					<p class="text-xs font-medium text-[#C1C2C2]">Current Subscribers</p>
					<p class="text-sm text-gray-800">{selectedRequest.subscriberCount || 0}</p>
				</div>
				<div>
					<p class="text-xs font-medium text-[#C1C2C2]">Submitted</p>
					<p class="text-sm text-gray-600">{formatDate(selectedRequest.verificationRequest?.submittedAt || selectedRequest.updatedAt)}</p>
				</div>
			</div>

			{#if selectedRequest.approvalStatus === 'PENDING'}
				<div class="mt-6 flex gap-3">
					<button on:click={() => handleVerify(selectedRequest._id, 'REJECTED')} disabled={reviewUpdating}
						class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
						{reviewUpdating ? '...' : 'Reject'}
					</button>
					<button on:click={() => handleVerify(selectedRequest._id, 'APPROVED')} disabled={reviewUpdating}
						class="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50">
						{reviewUpdating ? '...' : 'Approve Newsletter Sending'}
					</button>
				</div>
			{:else}
				<button on:click={() => (showReviewModal = false)} class="mt-6 w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200">Close</button>
			{/if}
		</div>
	</div>
{/if}
