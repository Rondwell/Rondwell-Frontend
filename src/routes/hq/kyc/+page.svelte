<!--
	KYC Review Queue — Admin page with tabs (Pending / Approved) + side sheet detail view.
	Tab pattern reused from /hq/aml and /hq/collections.
-->
<script lang="ts">
	import {
		approveKyc,
		listPendingKyc,
		listApprovedKyc,
		rejectKyc,
		type KycReviewItem,
	} from '$lib/services/kyc.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	type Tab = 'pending' | 'approved';
	let activeTab: Tab = 'pending';

	let pendingItems: KycReviewItem[] = [];
	let approvedItems: KycReviewItem[] = [];
	let loadingPending = true;
	let loadingApproved = false;
	let error = '';

	// Side sheet
	let showDetail = false;
	let selected: KycReviewItem | null = null;
	let processingId = '';
	let rejectingMode = false;
	let rejectReason = '';
	let actionSuccess = '';

	onMount(loadPending);

	async function loadPending() {
		loadingPending = true;
		error = '';
		try {
			const result = await listPendingKyc({ limit: 50 });
			pendingItems = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loadingPending = false;
		}
	}

	async function loadApproved() {
		loadingApproved = true;
		error = '';
		try {
			const result = await listApprovedKyc({ limit: 50 });
			approvedItems = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loadingApproved = false;
		}
	}

	function switchTab(tab: Tab) {
		activeTab = tab;
		error = '';
		if (tab === 'approved' && approvedItems.length === 0 && !loadingApproved) {
			loadApproved();
		}
	}

	function openDetail(item: KycReviewItem) {
		selected = item;
		showDetail = true;
		rejectingMode = false;
		rejectReason = '';
		actionSuccess = '';
	}

	function closeDetail() {
		showDetail = false;
		selected = null;
	}

	async function handleApprove() {
		if (!selected) return;
		processingId = selected.id;
		actionSuccess = '';
		try {
			await approveKyc(selected.id);
			pendingItems = pendingItems.filter((i) => i.id !== selected!.id);
			actionSuccess = 'Approved successfully. User has been notified.';
			setTimeout(closeDetail, 1500);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			processingId = '';
		}
	}

	async function handleReject() {
		if (!selected || !rejectReason.trim()) return;
		processingId = selected.id;
		actionSuccess = '';
		try {
			await rejectKyc(selected.id, rejectReason.trim());
			pendingItems = pendingItems.filter((i) => i.id !== selected!.id);
			actionSuccess = 'Rejected. User has been notified.';
			rejectingMode = false;
			setTimeout(closeDetail, 1500);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			processingId = '';
		}
	}

	function formatDate(d: string): string {
		if (!d) return '—';
		try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
		catch { return '—'; }
	}

	function idTypeLabel(t: string): string {
		switch (t) {
			case 'PASSPORT': return 'Passport';
			case 'DRIVERS_LICENSE': return "Driver's Licence";
			case 'NATIONAL_ID': return 'National ID';
			case 'BVN': return 'BVN';
			case 'NIN': return 'NIN';
			default: return t;
		}
	}
</script>

<svelte:head><title>KYC Review Queue — Rondwell HQ</title></svelte:head>

<div>
	<div class="mb-6">
		<h1 class="text-3xl font-semibold text-gray-900">KYC Review Queue</h1>
		<p class="mt-1 text-sm text-gray-500">Pending identity verifications requiring manual review.</p>
	</div>

	<!-- Tabs -->
	<div class="mb-6">
		<nav class="flex gap-1 border-b border-gray-200">
			{#each [{ id: 'pending', label: 'Pending' }, { id: 'approved', label: 'Approved' }] as tab}
				<button on:click={() => switchTab(tab.id)}
					class="border-b-2 px-4 pb-3 text-sm font-medium transition {activeTab === tab.id ? 'border-[#DB3EC6] text-[#DB3EC6]' : 'border-transparent text-gray-500 hover:text-gray-700'}">
					{tab.label}
					{#if tab.id === 'pending' && pendingItems.length > 0}
						<span class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-100 px-1.5 text-[10px] font-semibold text-pink-700">
							{pendingItems.length}
						</span>
					{/if}
				</button>
			{/each}
		</nav>
	</div>

	{#if error}
		<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	<!-- ─── Pending Tab ─── -->
	{#if activeTab === 'pending'}
		{#if loadingPending}
			<div class="rounded-xl bg-white p-4">
				{#each Array(4) as _}
					<div class="flex animate-pulse items-center justify-between border-b py-3 last:border-b-0">
						<div class="flex items-center gap-3">
							<div class="h-9 w-9 rounded-full bg-gray-200"></div>
							<div><div class="h-4 w-36 rounded bg-gray-200"></div><div class="mt-1 h-3 w-48 rounded bg-gray-200"></div></div>
						</div>
						<div class="h-6 w-24 rounded-full bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if pendingItems.length === 0}
			<div class="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-white">
				<Icon icon="mdi:check-circle-outline" class="text-4xl text-green-400" />
				<p class="text-lg font-medium text-gray-700">Queue Empty</p>
				<p class="text-sm text-gray-400">No pending KYC submissions to review.</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl bg-white shadow-sm">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
							<tr>
								<th class="px-4 py-3">User</th>
								<th class="px-4 py-3">ID Type</th>
								<th class="px-4 py-3">Address</th>
								<th class="px-4 py-3">Submitted</th>
								<th class="px-4 py-3 text-right">Action</th>
							</tr>
						</thead>
						<tbody>
							{#each pendingItems as item (item.id)}
								<tr class="cursor-pointer border-b border-gray-50 transition last:border-b-0 hover:bg-gray-50"
									on:click={() => openDetail(item)}>
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F2E4F8] text-xs font-semibold text-[#AB46DD]">
												{(item.userName || item.userEmail || '?').charAt(0).toUpperCase()}
											</div>
											<div class="min-w-0">
												<p class="truncate text-sm font-medium text-gray-800">{item.userName || 'Unknown'}</p>
												<p class="truncate text-xs text-gray-400">{item.userEmail || '—'}</p>
											</div>
										</div>
									</td>
									<td class="px-4 py-3">
										<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{idTypeLabel(item.idType)}</span>
									</td>
									<td class="max-w-[200px] truncate px-4 py-3 text-xs text-gray-500">
										{item.address?.formatted || item.address?.street || '—'}
									</td>
									<td class="px-4 py-3 text-xs text-gray-500">{formatDate(item.submittedAt)}</td>
									<td class="px-4 py-3 text-right">
										<button class="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
											Review
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

	<!-- ─── Approved Tab ─── -->
	{:else if activeTab === 'approved'}
		{#if loadingApproved}
			<div class="rounded-xl bg-white p-4">
				{#each Array(4) as _}
					<div class="flex animate-pulse items-center justify-between border-b py-3 last:border-b-0">
						<div class="flex items-center gap-3">
							<div class="h-9 w-9 rounded-full bg-gray-200"></div>
							<div><div class="h-4 w-36 rounded bg-gray-200"></div><div class="mt-1 h-3 w-48 rounded bg-gray-200"></div></div>
						</div>
						<div class="h-6 w-24 rounded-full bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if approvedItems.length === 0}
			<div class="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-white">
				<Icon icon="mdi:shield-check-outline" class="text-4xl text-gray-300" />
				<p class="text-lg font-medium text-gray-700">No Approved Verifications</p>
				<p class="text-sm text-gray-400">Approved KYC verifications will appear here.</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl bg-white shadow-sm">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
							<tr>
								<th class="px-4 py-3">User</th>
								<th class="px-4 py-3">ID Type</th>
								<th class="px-4 py-3">Address</th>
								<th class="px-4 py-3">Verified</th>
								<th class="px-4 py-3 text-right">Status</th>
							</tr>
						</thead>
						<tbody>
							{#each approvedItems as item (item.id)}
								<tr class="cursor-pointer border-b border-gray-50 transition last:border-b-0 hover:bg-gray-50"
									on:click={() => openDetail(item)}>
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
												{(item.userName || item.userEmail || '?').charAt(0).toUpperCase()}
											</div>
											<div class="min-w-0">
												<p class="truncate text-sm font-medium text-gray-800">{item.userName || 'Unknown'}</p>
												<p class="truncate text-xs text-gray-400">{item.userEmail || '—'}</p>
											</div>
										</div>
									</td>
									<td class="px-4 py-3">
										<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{idTypeLabel(item.idType)}</span>
									</td>
									<td class="max-w-[200px] truncate px-4 py-3 text-xs text-gray-500">
										{item.address?.formatted || item.address?.street || '—'}
									</td>
									<td class="px-4 py-3 text-xs text-gray-500">{formatDate(item.submittedAt)}</td>
									<td class="px-4 py-3 text-right">
										<span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Verified</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Side Sheet Detail -->
{#if showDetail && selected}
	<div on:click={closeDetail} on:keydown={(e) => e.key === 'Escape' && closeDetail()}
		class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0"
		role="dialog" aria-modal="true" tabindex="-1">
		<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
			role="document" on:click|stopPropagation on:keydown|stopPropagation>

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
				<button on:click={closeDetail} class="text-gray-500 hover:text-gray-700">
					<Icon icon="mdi:chevron-double-right" class="text-xl" />
				</button>
				<span class="text-sm font-medium text-gray-500">Verification Details</span>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-6 pt-5 pb-6">
				{#if actionSuccess}
					<div class="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
						<Icon icon="mdi:check-circle" class="text-green-600" />
						{actionSuccess}
					</div>
				{/if}

				<!-- User Info -->
				<div class="flex items-center gap-4">
					<div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2E4F8] text-lg font-semibold text-[#AB46DD]">
						{(selected.userName || selected.userEmail || '?').charAt(0).toUpperCase()}
					</div>
					<div>
						<p class="text-lg font-semibold text-gray-900">{selected.userName || 'Unknown User'}</p>
						<p class="text-sm text-gray-400">{selected.userEmail || '—'}</p>
					</div>
				</div>

				<!-- Status badge -->
				<div class="mt-4">
					{#if selected.status === 'VERIFIED' || selected.status === 'APPROVED'}
						<span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Verified</span>
					{:else}
						<span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Pending Review</span>
					{/if}
				</div>

				<!-- ID Details -->
				<div class="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="text-sm font-semibold text-gray-700">Identity Document</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-xs text-gray-400">ID Type</p>
							<p class="text-sm font-medium text-gray-800">{idTypeLabel(selected.idType)}</p>
						</div>
						<div>
							<p class="text-xs text-gray-400">ID Number</p>
							<p class="font-mono text-sm font-medium text-gray-800">{selected.idNumber}</p>
						</div>
					</div>
					{#if selected.idDocumentUrl}
						<div>
							<p class="mb-2 text-xs text-gray-400">Uploaded Document</p>
							<a href={selected.idDocumentUrl} target="_blank" rel="noopener noreferrer"
								class="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700 transition hover:bg-pink-100">
								<Icon icon="mdi:file-document-outline" class="text-base" />
								View ID Document
								<Icon icon="mdi:open-in-new" class="text-xs" />
							</a>
						</div>
					{/if}
				</div>

				<!-- Address -->
				<div class="mt-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="text-sm font-semibold text-gray-700">Address</h3>
					{#if selected.address?.formatted || selected.address?.street}
						<p class="text-sm text-gray-700">{selected.address?.formatted || selected.address?.street}</p>
						<div class="grid grid-cols-2 gap-3 text-xs">
							{#if selected.address?.city}
								<div><span class="text-gray-400">City:</span> <span class="text-gray-700">{selected.address.city}</span></div>
							{/if}
							{#if selected.address?.state}
								<div><span class="text-gray-400">State:</span> <span class="text-gray-700">{selected.address.state}</span></div>
							{/if}
							{#if selected.address?.country}
								<div><span class="text-gray-400">Country:</span> <span class="text-gray-700">{selected.address.country}</span></div>
							{/if}
							{#if selected.address?.postalCode}
								<div><span class="text-gray-400">Postal:</span> <span class="text-gray-700">{selected.address.postalCode}</span></div>
							{/if}
						</div>
					{:else}
						<p class="text-xs text-gray-400">No address provided</p>
					{/if}
				</div>

				<!-- Submission info -->
				<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
					<div class="grid grid-cols-2 gap-3 text-xs">
						<div><span class="text-gray-400">Submitted:</span> <span class="text-gray-700">{formatDate(selected.submittedAt)}</span></div>
						<div><span class="text-gray-400">User ID:</span> <span class="font-mono text-gray-700">{selected.userId}</span></div>
					</div>
				</div>

				<!-- Reject form (only for pending items) -->
				{#if rejectingMode && selected.status !== 'VERIFIED'}
					<div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
						<label class="text-xs font-medium text-red-900" for="reject-reason">
							Rejection reason (will be sent to the user)
						</label>
						<textarea
							id="reject-reason"
							rows="3"
							bind:value={rejectReason}
							placeholder="e.g. Document is not legible, name does not match profile..."
							class="mt-2 w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
						></textarea>
						<div class="mt-3 flex justify-end gap-2">
							<button on:click={() => (rejectingMode = false)}
								class="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
								Cancel
							</button>
							<button on:click={handleReject}
								disabled={!rejectReason.trim() || !!processingId}
								class="rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
								{processingId ? 'Rejecting…' : 'Confirm Rejection'}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer Actions (only for pending items) -->
			{#if !rejectingMode && !actionSuccess && selected.status !== 'VERIFIED'}
				<div class="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
					<button on:click={() => (rejectingMode = true)}
						disabled={!!processingId}
						class="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50">
						Reject
					</button>
					<button on:click={handleApprove}
						disabled={!!processingId}
						class="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50">
						{processingId ? 'Approving…' : 'Approve'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
