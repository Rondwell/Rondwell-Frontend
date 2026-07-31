<!--
	KYC Review Queue — Admin page with tabs (Pending / Approved) + side sheet detail view.
	Tab pattern reused from /hq/aml and /hq/collections.
-->
<script lang="ts">
	import {
		approveKyc,
		getKycDocumentViewUrl,
		listPendingKyc,
		listApprovedKyc,
		listRejectedKyc,
		rejectKyc,
		revokeKyc,
		type KycReviewItem,
	} from '$lib/services/kyc.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	/**
	 * FE-P5-08 — a REJECTED tab was added.
	 *
	 * There was no way to see a rejection after the fact: the page dropped the row
	 * from `pendingItems` the moment it was rejected, and no endpoint returned
	 * `status: 'REJECTED'`. "Did we reject this person, and why?" had no answer
	 * inside the product.
	 */
	type Tab = 'pending' | 'approved' | 'rejected';
	// Typed tuple so `switchTab(tab.id)` keeps the literal union rather than
	// widening `id` to `string` (which the inline array literal did).
	const TABS: { id: Tab; label: string }[] = [
		{ id: 'pending', label: 'Pending' },
		{ id: 'approved', label: 'Approved' },
		{ id: 'rejected', label: 'Rejected' }
	];
	let activeTab: Tab = 'pending';

	let pendingItems: KycReviewItem[] = [];
	let approvedItems: KycReviewItem[] = [];
	let rejectedItems: KycReviewItem[] = [];
	let loadingPending = true;
	let loadingApproved = false;
	let loadingRejected = false;
	let error = '';

	// Side sheet
	let showDetail = false;
	let selected: KycReviewItem | null = null;
	let processingId = '';
	let rejectingMode = false;
	let rejectReason = '';
	let reviewerNotes = '';
	/** FE-P5-08 — revoking a VERIFIED profile (distinct from rejecting a pending one). */
	let revokingMode = false;
	let revokeReason = '';
	let actionSuccess = '';

	onMount(loadPending);

	async function loadPending() {
		loadingPending = true;
		error = '';
		try {
			const result = await listPendingKyc({ pageSize: 50 });
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
			const result = await listApprovedKyc({ pageSize: 50 });
			approvedItems = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loadingApproved = false;
		}
	}

	async function loadRejected() {
		loadingRejected = true;
		error = '';
		try {
			const result = await listRejectedKyc({ pageSize: 50 });
			rejectedItems = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loadingRejected = false;
		}
	}

	function switchTab(tab: Tab) {
		activeTab = tab;
		error = '';
		if (tab === 'approved' && approvedItems.length === 0 && !loadingApproved) {
			loadApproved();
		}
		if (tab === 'rejected' && rejectedItems.length === 0 && !loadingRejected) {
			loadRejected();
		}
	}

	function openDetail(item: KycReviewItem) {
		selected = item;
		showDetail = true;
		rejectingMode = false;
		revokingMode = false;
		rejectReason = '';
		revokeReason = '';
		reviewerNotes = '';
		actionSuccess = '';
		docError = '';
	}

	// The stored `idDocumentUrl` is an identifier — the document itself is not
	// publicly readable. Viewing fetches a 1-hour presigned URL on demand.
	let loadingDoc = false;
	let docError = '';
	async function viewDocument() {
		if (!selected || loadingDoc) return;
		loadingDoc = true;
		docError = '';
		try {
			const url = await getKycDocumentViewUrl(selected.id);
			window.open(url, '_blank', 'noopener,noreferrer');
		} catch (e: any) {
			docError = financialErrorMessage(e);
		} finally {
			loadingDoc = false;
		}
	}

	/**
	 * FE-P5-08 — Withdraw verification from an already-VERIFIED profile.
	 *
	 * This action previously did not exist anywhere: `reject` filters on
	 * PENDING_REVIEW server-side, so a forged document discovered after approval
	 * left the account with uncapped withdrawal rights and no remedy in the UI.
	 * Revoking blocks withdrawals immediately (the payment service's KYC cache is
	 * invalidated by the published decision event).
	 */
	async function handleRevoke() {
		if (!selected || revokeReason.trim().length < 3) return;
		processingId = selected.id;
		actionSuccess = '';
		try {
			await revokeKyc(selected.id, revokeReason.trim(), reviewerNotes.trim() || undefined);
			approvedItems = approvedItems.filter((i) => i.id !== selected!.id);
			actionSuccess = 'Verification withdrawn. The user has been notified and withdrawals are paused.';
			revokingMode = false;
			// Refresh the rejected list so the revocation is immediately auditable.
			rejectedItems = [];
			setTimeout(closeDetail, 1800);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			processingId = '';
		}
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
			await approveKyc(selected.id, reviewerNotes.trim() || undefined);
			pendingItems = pendingItems.filter((i) => i.id !== selected!.id);
			actionSuccess = 'Approved successfully. User has been notified.';
			approvedItems = [];
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
			await rejectKyc(selected.id, rejectReason.trim(), reviewerNotes.trim() || undefined);
			pendingItems = pendingItems.filter((i) => i.id !== selected!.id);
			actionSuccess = 'Rejected. User has been notified and can resubmit.';
			rejectingMode = false;
			// Invalidate the rejected list so the decision shows up there on next
			// visit — previously a rejection vanished from the UI entirely.
			rejectedItems = [];
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
			{#each TABS as tab}
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

	<!-- ─── Rejected Tab (FE-P5-08) ─── -->
	{:else if activeTab === 'rejected'}
		{#if loadingRejected}
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
		{:else if rejectedItems.length === 0}
			<div class="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-white">
				<Icon icon="mdi:file-remove-outline" class="text-4xl text-gray-300" />
				<p class="text-lg font-medium text-gray-700">No Rejections</p>
				<p class="text-sm text-gray-400">Rejected and revoked verifications will appear here.</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl bg-white shadow-sm">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
							<tr>
								<th class="px-4 py-3">User</th>
								<th class="px-4 py-3">Reason</th>
								<th class="px-4 py-3">Attempts</th>
								<th class="px-4 py-3">Reviewed</th>
								<th class="px-4 py-3 text-right">Outcome</th>
							</tr>
						</thead>
						<tbody>
							{#each rejectedItems as item (item.id)}
								<tr class="cursor-pointer border-b border-gray-50 transition last:border-b-0 hover:bg-gray-50"
									on:click={() => openDetail(item)}>
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
												{(item.userName || item.userEmail || '?').charAt(0).toUpperCase()}
											</div>
											<div class="min-w-0">
												<p class="truncate text-sm font-medium text-gray-800">{item.userName || 'Unknown'}</p>
												<p class="truncate text-xs text-gray-400">{item.userEmail || '—'}</p>
											</div>
										</div>
									</td>
									<td class="max-w-[240px] px-4 py-3">
										<p class="truncate text-xs text-gray-600" title={item.rejectionReason ?? ''}>
											{item.rejectionReason || '—'}
										</p>
									</td>
									<td class="px-4 py-3 text-xs text-gray-500">
										{item.resubmissionCount ?? 0}
									</td>
									<td class="px-4 py-3 text-xs text-gray-500">
										{formatDate((item.revokedAt || item.rejectedAt || item.submittedAt) as string)}
									</td>
									<td class="px-4 py-3 text-right">
										{#if item.wasRevocation}
											<span class="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">Revoked</span>
										{:else}
											<span class="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Rejected</span>
										{/if}
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
				<div class="mt-4 flex flex-wrap items-center gap-2">
					{#if selected.status === 'VERIFIED'}
						<span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Verified</span>
					{:else if selected.status === 'REJECTED'}
						<!-- FE-P5-08 — REJECTED previously fell into the "Pending Review"
						     else-branch, so a rejected row was mislabelled as pending. -->
						<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {selected.wasRevocation ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}">
							{selected.wasRevocation ? 'Revoked' : 'Rejected'}
						</span>
					{:else}
						<span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Pending Review</span>
					{/if}
					{#if (selected.resubmissionCount ?? 0) > 1}
						<span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
							Attempt {selected.resubmissionCount}
						</span>
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
							<button on:click={viewDocument} disabled={loadingDoc}
								class="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700 transition hover:bg-pink-100 disabled:opacity-50">
								<Icon icon={loadingDoc ? 'mdi:loading' : 'mdi:file-document-outline'} class="text-base {loadingDoc ? 'animate-spin' : ''}" />
								{loadingDoc ? 'Opening…' : 'View ID Document'}
								<Icon icon="mdi:open-in-new" class="text-xs" />
							</button>
							{#if docError}
								<p class="mt-2 text-xs text-red-600">{docError}</p>
							{/if}
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

				<!--
					FE-P5-08 — Prior decision + review history.

					A reviewer looking at a resubmission previously had no idea it WAS a
					resubmission, or what the last reviewer had objected to — so the same
					document could be bounced back and forth indefinitely.
				-->
				{#if selected.rejectionReason || (selected.resubmissionCount ?? 0) > 1}
					<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
						<h3 class="text-sm font-semibold text-amber-900">Review history</h3>
						{#if (selected.resubmissionCount ?? 0) > 1}
							<p class="mt-1 text-xs text-amber-800">
								This user has submitted <strong>{selected.resubmissionCount}</strong> times.
							</p>
						{/if}
						{#if selected.rejectionReason}
							<p class="mt-2 text-xs text-amber-800">
								<span class="font-medium">Last decision:</span> {selected.rejectionReason}
							</p>
						{/if}
						{#if selected.reviewHistory?.length}
							<ul class="mt-3 space-y-2">
								{#each selected.reviewHistory as h}
									<li class="flex items-start gap-2 text-xs text-amber-900">
										<Icon
											icon={h.type === 'APPROVED'
												? 'mdi:check-circle-outline'
												: h.type === 'SUBMITTED'
													? 'mdi:upload-outline'
													: 'mdi:close-circle-outline'}
											class="mt-0.5 shrink-0"
										/>
										<span>
											<strong>{h.type}</strong>
											{#if h.attempt}(attempt {h.attempt}){/if}
											· {formatDate(h.at)} · {h.actor}
											{#if h.reason}<br /><span class="text-amber-700">{h.reason}</span>{/if}
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<!-- Reviewer note (shared by approve / reject / revoke) -->
				{#if (rejectingMode || revokingMode) === false && !actionSuccess && selected.status === 'PENDING_REVIEW'}
					<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
						<label class="text-xs font-medium text-gray-700" for="reviewer-notes">
							Internal note (optional — stored on the review trail)
						</label>
						<textarea
							id="reviewer-notes"
							rows="2"
							bind:value={reviewerNotes}
							placeholder="Anything the next reviewer should know…"
							class="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 focus:outline-none"
						></textarea>
					</div>
				{/if}

				<!-- Reject form (pending submissions only) -->
				{#if rejectingMode && selected.status === 'PENDING_REVIEW'}
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
						<p class="mt-2 text-[11px] text-red-700">
							Be specific — this text is shown on the user's resubmission form, so it is what
							they will try to fix.
						</p>
						<div class="mt-3 flex justify-end gap-2">
							<button on:click={() => (rejectingMode = false)}
								class="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
								Cancel
							</button>
							<button on:click={handleReject}
								disabled={rejectReason.trim().length < 3 || !!processingId}
								class="rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
								{processingId ? 'Rejecting…' : 'Confirm Rejection'}
							</button>
						</div>
					</div>
				{/if}

				<!-- Revoke form (verified profiles only) — FE-P5-08 -->
				{#if revokingMode && selected.status === 'VERIFIED'}
					<div class="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
						<h3 class="text-sm font-semibold text-orange-900">Withdraw verification</h3>
						<p class="mt-1 text-xs text-orange-800">
							This drops the user to UNVERIFIED and <strong>blocks withdrawals immediately</strong>.
							Money already in their wallet is untouched. They'll be emailed and can re-verify.
						</p>
						<label class="mt-3 block text-xs font-medium text-orange-900" for="revoke-reason">
							Reason (sent to the user)
						</label>
						<textarea
							id="revoke-reason"
							rows="3"
							bind:value={revokeReason}
							placeholder="e.g. Document could not be re-validated with the issuing authority…"
							class="mt-2 w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:outline-none"
						></textarea>
						<div class="mt-3 flex justify-end gap-2">
							<button on:click={() => (revokingMode = false)}
								class="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
								Cancel
							</button>
							<button on:click={handleRevoke}
								disabled={revokeReason.trim().length < 3 || !!processingId}
								class="rounded-md bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50">
								{processingId ? 'Revoking…' : 'Confirm Revocation'}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			{#if !rejectingMode && !revokingMode && !actionSuccess && selected.status === 'PENDING_REVIEW'}
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

			<!--
				FE-P5-08 — Revoke action for a VERIFIED profile.

				There was previously no footer at all for verified rows (the condition
				was `status !== 'VERIFIED'`), so a verified profile was a dead end: no
				way to de-verify someone whose document later turned out to be forged.
			-->
			{#if !revokingMode && !actionSuccess && selected.status === 'VERIFIED'}
				<div class="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4">
					<p class="text-xs text-gray-400">Verified — withdrawals unlocked.</p>
					<button on:click={() => (revokingMode = true)}
						disabled={!!processingId}
						class="rounded-lg border border-orange-200 bg-white px-5 py-2.5 text-sm font-medium text-orange-700 transition hover:bg-orange-50 disabled:opacity-50">
						Withdraw verification
					</button>
				</div>
			{/if}

			<!-- Rejected rows are read-only; the user resubmits from their own side. -->
			{#if !actionSuccess && selected.status === 'REJECTED'}
				<div class="border-t border-gray-200 bg-white px-6 py-4">
					<p class="text-xs text-gray-500">
						{selected.wasRevocation ? 'Verification was withdrawn.' : 'Submission was rejected.'}
						The user has been notified and can submit again — their next attempt will appear in the
						Pending queue.
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
