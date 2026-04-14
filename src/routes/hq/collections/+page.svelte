<script lang="ts">
	import { getAdminCollections, getCollectionApprovals, updateApprovalStatus, verifyCollection } from '$lib/services/admin.services';
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

	// Approvals
	let approvals: any[] = [];
	let appTotal = 0;
	let appPage = 1;
	let appTotalPages = 1;
	let appLoading = true;
	let appStatusFilter = 'ALL';
	let showAppStatusDropdown = false;

	// Approval modal
	let showApprovalModal = false;
	let selectedApproval: any = null;
	let adminNote = '';
	let approvalUpdating = false;

	const appStatusOptions = [
		{ label: 'All Requests', value: 'ALL' },
		{ label: 'Pending', value: 'PENDING' },
		{ label: 'Approved', value: 'APPROVED' },
		{ label: 'Declined', value: 'DECLINED' },
	];

	$: appStatusLabel = appStatusOptions.find((s) => s.value === appStatusFilter)?.label ?? 'All Requests';

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
			const params: Record<string, string> = { page: appPage.toString(), limit: '20' };
			if (appStatusFilter !== 'ALL') params.status = appStatusFilter;
			const data = await getCollectionApprovals(params);
			approvals = data.approvals;
			appTotal = data.total;
			appTotalPages = data.totalPages;
		} catch { approvals = []; }
		finally { appLoading = false; }
	}

	function handleColSearch() {
		clearTimeout(colSearchTimeout);
		colSearchTimeout = setTimeout(() => { colPage = 1; fetchCollections(); }, 300);
	}

	function selectAppStatus(value: string) { appStatusFilter = value; showAppStatusDropdown = false; appPage = 1; fetchApprovals(); }

	async function handleApprovalAction(id: string, status: 'APPROVED' | 'DECLINED') {
		approvalUpdating = true;
		try {
			await updateApprovalStatus(id, status, adminNote);
			showApprovalModal = false;
			adminNote = '';
			fetchApprovals();
		} catch (e) { console.error(e); }
		finally { approvalUpdating = false; }
	}

	function getApprovalStatusClass(status: string): string {
		switch (status) {
			case 'APPROVED': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'DECLINED': return 'bg-[#FDEAEA] text-[#E53935]';
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
		<p class="mt-1 text-sm text-gray-500">Manage collections and newsletter approvals</p>
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
				Approvals
				{#if approvals.filter((a) => a.status === 'PENDING').length > 0}
					<span class="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
						{approvals.filter((a) => a.status === 'PENDING').length}
					</span>
				{/if}
			</button>
		</nav>
	</div>

	<!-- Collection List Tab -->
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
					<div class="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-b-0">
						<div class="flex items-center gap-3">
							{#if col.profilePictureUrl}
								<img src={col.profilePictureUrl} alt="" class="h-10 w-10 rounded-lg object-cover" />
							{:else}
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF7D8] text-xs font-semibold text-[#D79917]">
									{(col.name || '?').charAt(0).toUpperCase()}
								</div>
							{/if}
							<div>
								<p class="text-sm font-medium text-gray-800">{col.name}</p>
								<p class="text-xs text-gray-400">{col.eventCount || 0} events · {col.subscriberCount || 0} subscribers</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {col.approvalStatus === 'APPROVED' ? 'bg-[#E3F4E1] text-[#3CBD2C]' : col.approvalStatus === 'REJECTED' ? 'bg-[#FDEAEA] text-[#E53935]' : 'bg-[#FFF8E1] text-[#EAAB26]'}">
								{col.approvalStatus || 'PENDING'}
							</span>
							{#if col.approvalStatus === 'PENDING' && col.verificationRequest}
								<button on:click={async () => { await verifyCollection(col._id, 'APPROVED'); fetchCollections(); }}
									class="rounded bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700">Verify</button>
								<button on:click={async () => { await verifyCollection(col._id, 'REJECTED'); fetchCollections(); }}
									class="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50">Reject</button>
							{:else if col.approvalStatus !== 'APPROVED' && !col.verificationRequest}
								<button on:click={async () => { await verifyCollection(col._id, 'APPROVED'); fetchCollections(); }}
									class="rounded bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700">Verify</button>
							{/if}
							<span class="hidden text-xs text-gray-400 sm:block">{formatDate(col.createdAt)}</span>
						</div>
					</div>
				{/each}
			</div>

			{#if colTotalPages > 1}
				<div class="mt-4 flex items-center justify-center gap-2">
					<button on:click={() => { colPage = Math.max(1, colPage - 1); fetchCollections(); }} disabled={colPage === 1} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] hover:bg-white disabled:opacity-40">Previous</button>
					<span class="text-sm text-gray-500">{colPage} / {colTotalPages}</span>
					<button on:click={() => { colPage = Math.min(colTotalPages, colPage + 1); fetchCollections(); }} disabled={colPage === colTotalPages} class="rounded-lg px-3 py-1.5 text-sm text-[#616265] hover:bg-white disabled:opacity-40">Next</button>
				</div>
			{/if}
		{:else}
			<div class="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-white">
				<p class="text-lg font-medium text-[#646568]">No Collections Found</p>
			</div>
		{/if}

	<!-- Approvals Tab -->
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
				{#each approvals as approval}
					<button class="flex w-full items-center justify-between border-b border-gray-50 px-4 py-4 text-left transition last:border-b-0 hover:bg-gray-50"
						on:click={() => { selectedApproval = approval; showApprovalModal = true; adminNote = ''; }}>
						<div>
							<p class="text-sm font-medium text-gray-800">{approval.subject}</p>
							<p class="text-xs text-gray-400">{approval.collectionName} · {approval.organizerName || approval.organizerEmail}</p>
							<p class="mt-1 text-xs text-gray-300">{approval.subscriberCount} subscribers · {formatDate(approval.createdAt)}</p>
						</div>
						<span class="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium {getApprovalStatusClass(approval.status)}">{approval.status}</span>
					</button>
				{/each}
			</div>
		{:else}
			<div class="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-white">
				<p class="text-lg font-medium text-[#646568]">No Approval Requests</p>
				<p class="text-sm text-gray-400">Newsletter approval requests will appear here</p>
			</div>
		{/if}
	{/if}
</div>

<!-- Approval Detail Modal -->
{#if showApprovalModal && selectedApproval}
	<div on:click={() => (showApprovalModal = false)} on:keydown={(e) => e.key === 'Escape' && (showApprovalModal = false)}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" on:click|stopPropagation on:keydown|stopPropagation role="document">
			<h2 class="mb-1 text-lg font-semibold text-gray-900">Newsletter Approval</h2>
			<span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium {getApprovalStatusClass(selectedApproval.status)}">{selectedApproval.status}</span>

			<div class="mt-5 space-y-3">
				<div><p class="text-xs text-[#C1C2C2]">Collection</p><p class="text-sm font-medium text-gray-800">{selectedApproval.collectionName}</p></div>
				<div><p class="text-xs text-[#C1C2C2]">Organizer</p><p class="text-sm font-medium text-gray-800">{selectedApproval.organizerName || 'N/A'} ({selectedApproval.organizerEmail})</p></div>
				<div><p class="text-xs text-[#C1C2C2]">Subject</p><p class="text-sm font-medium text-gray-800">{selectedApproval.subject}</p></div>
				<div><p class="text-xs text-[#C1C2C2]">Subscribers</p><p class="text-sm font-medium text-gray-800">{selectedApproval.subscriberCount}</p></div>
				{#if selectedApproval.message}
					<div>
						<p class="text-xs text-[#C1C2C2]">Message Preview</p>
						<div class="mt-1 max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{@html selectedApproval.message.substring(0, 1000)}</div>
					</div>
				{/if}
				<div><p class="text-xs text-[#C1C2C2]">Submitted</p><p class="text-sm text-gray-600">{formatDate(selectedApproval.createdAt)}</p></div>
			</div>

			{#if selectedApproval.status === 'PENDING'}
				<div class="mt-5">
					<label for="admin-note" class="mb-1 block text-xs font-medium text-gray-600">Admin Note (optional)</label>
					<textarea id="admin-note" bind:value={adminNote} rows="2" placeholder="Add a note for the organizer..."
						class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#513BE2] focus:outline-none"></textarea>
				</div>
				<div class="mt-4 flex gap-3">
					<button on:click={() => handleApprovalAction(selectedApproval._id, 'DECLINED')} disabled={approvalUpdating}
						class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
						{approvalUpdating ? '...' : 'Decline'}
					</button>
					<button on:click={() => handleApprovalAction(selectedApproval._id, 'APPROVED')} disabled={approvalUpdating}
						class="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50">
						{approvalUpdating ? '...' : 'Approve'}
					</button>
				</div>
			{:else}
				{#if selectedApproval.adminNote}
					<div class="mt-4 rounded-lg bg-gray-50 p-3">
						<p class="text-xs text-[#C1C2C2]">Admin Note</p>
						<p class="text-sm text-gray-700">{selectedApproval.adminNote}</p>
					</div>
				{/if}
				<button on:click={() => (showApprovalModal = false)} class="mt-4 w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200">Close</button>
			{/if}
		</div>
	</div>
{/if}
