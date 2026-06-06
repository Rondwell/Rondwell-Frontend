<!--
	FE-P4-07 (P4-07) — Reconciliation backfill sign-off.

	Lists historical recon runs with sign-off state. Each row links to a
	JSON viewer (the dry-run output) and an "Approve for live run" CTA
	(super-admin + finance-ops).
-->
<script lang="ts">
	import {
		approveBackfillRun,
		getBackfillRun,
		listReconBackfills,
		rejectBackfillRun,
		type ReconBackfillRun,
	} from '$lib/services/reconciliation.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let runs: ReconBackfillRun[] = [];
	let loading = true;
	let error = '';
	let nextCursor: string | null = null;
	let loadingMore = false;

	let viewingId = '';
	let viewingPayload: any = null;
	let loadingDetail = false;

	let processing = '';
	let approveNote = '';
	let rejectReason = '';
	let confirmingApproveId = '';
	let confirmingRejectId = '';

	onMount(load);

	async function load(reset = true) {
		if (reset) {
			loading = true;
			runs = [];
			nextCursor = null;
		} else {
			loadingMore = true;
		}
		error = '';
		try {
			const result = await listReconBackfills({
				cursor: reset ? null : nextCursor,
				limit: 30,
			});
			runs = reset ? result.items : [...runs, ...result.items];
			nextCursor = result.nextCursor;
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	async function viewPayload(r: ReconBackfillRun) {
		viewingId = r.id;
		viewingPayload = null;
		loadingDetail = true;
		try {
			const detail = await getBackfillRun(r.id);
			viewingPayload = detail.rawOutput ?? detail;
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loadingDetail = false;
		}
	}

	async function handleApprove() {
		if (!confirmingApproveId) return;
		processing = confirmingApproveId;
		try {
			await approveBackfillRun(confirmingApproveId, approveNote.trim() || undefined);
			runs = runs.map((r) =>
				r.id === confirmingApproveId ? { ...r, status: 'APPROVED' } : r
			);
			confirmingApproveId = '';
			approveNote = '';
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			processing = '';
		}
	}

	async function handleReject() {
		if (!confirmingRejectId || !rejectReason.trim()) return;
		processing = confirmingRejectId;
		try {
			await rejectBackfillRun(confirmingRejectId, rejectReason.trim());
			runs = runs.map((r) =>
				r.id === confirmingRejectId ? { ...r, status: 'REJECTED' } : r
			);
			confirmingRejectId = '';
			rejectReason = '';
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			processing = '';
		}
	}

	function statusColor(s: string): string {
		if (s === 'APPROVED' || s === 'COMPLETED') return 'bg-green-100 text-green-700';
		if (s === 'REJECTED') return 'bg-red-100 text-red-700';
		if (s === 'AWAITING_SIGNOFF') return 'bg-orange-100 text-orange-700';
		return 'bg-gray-100 text-gray-600';
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}
</script>

<svelte:head><title>Recon backfill — Rondwell HQ</title></svelte:head>

<div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Reconciliation backfill</h1>
			<p class="mt-1 text-sm text-gray-500">
				One-time recovery exercises (subscription orphans, coupon overcharges, disbursement
				orphans, wallet drift). Each row writes to <code>ReconReport</code> on dry run; finance-ops
				approves before the live run.
			</p>
		</div>
		<button
			on:click={() => load(true)}
			class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
		>
			<Icon icon="mdi:refresh" class="inline" /> Refresh
		</button>
	</div>

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 space-y-2">
			{#each [1, 2, 3] as _}
				<div class="h-20 animate-pulse rounded-lg bg-white"></div>
			{/each}
		</div>
	{:else if runs.length === 0}
		<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:shovel" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-gray-700">No backfill runs</p>
			<p class="mt-1 text-sm text-gray-400">Backend scripts will write here on first dry run.</p>
		</div>
	{:else}
		<div class="mt-6 space-y-3">
			{#each runs as r}
				<div class="rounded-xl border bg-white p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-gray-900">{r.scope}</p>
							<p class="mt-0.5 text-xs text-gray-500">
								Created {fmtDate(r.createdAt)} by {r.createdBy ?? 'system'}
							</p>
							<div class="mt-2 flex items-center gap-3 text-xs text-gray-500">
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {statusColor(r.status)}">
									{r.status.replace(/_/g, ' ')}
								</span>
								<span>{r.findings.toLocaleString()} finding{r.findings === 1 ? '' : 's'}</span>
								{#if r.approvedBy}
									<span>· approved by {r.approvedBy} {fmtDate(r.approvedAt)}</span>
								{/if}
							</div>
							{#if r.notes}
								<p class="mt-1 text-xs italic text-gray-500">"{r.notes}"</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<button
								on:click={() => viewPayload(r)}
								class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
							>
								View JSON
							</button>
							{#if r.status === 'AWAITING_SIGNOFF'}
								<button
									on:click={() => {
										confirmingApproveId = r.id;
										approveNote = '';
									}}
									class="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
								>
									Approve
								</button>
								<button
									on:click={() => {
										confirmingRejectId = r.id;
										rejectReason = '';
									}}
									class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
								>
									Reject
								</button>
							{/if}
						</div>
					</div>

					{#if confirmingApproveId === r.id}
						<div class="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
							<label for={`approve-note-${r.id}`} class="text-xs font-medium text-green-900">
								Approval note (optional)
							</label>
							<textarea
								id={`approve-note-${r.id}`}
								rows="2"
								bind:value={approveNote}
								class="mt-1 w-full rounded-md border border-green-200 px-2 py-1 text-xs"
							></textarea>
							<div class="mt-2 flex justify-end gap-2">
								<button
									on:click={() => (confirmingApproveId = '')}
									class="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs"
								>
									Cancel
								</button>
								<button
									on:click={handleApprove}
									disabled={processing === r.id}
									class="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
								>
									{processing === r.id ? 'Approving…' : 'Confirm approval'}
								</button>
							</div>
						</div>
					{/if}

					{#if confirmingRejectId === r.id}
						<div class="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
							<label for={`reject-reason-${r.id}`} class="text-xs font-medium text-red-900">
								Rejection reason (audit log)
							</label>
							<textarea
								id={`reject-reason-${r.id}`}
								rows="2"
								bind:value={rejectReason}
								class="mt-1 w-full rounded-md border border-red-200 px-2 py-1 text-xs"
							></textarea>
							<div class="mt-2 flex justify-end gap-2">
								<button
									on:click={() => (confirmingRejectId = '')}
									class="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs"
								>
									Cancel
								</button>
								<button
									on:click={handleReject}
									disabled={processing === r.id || !rejectReason.trim()}
									class="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
								>
									{processing === r.id ? 'Rejecting…' : 'Confirm rejection'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if nextCursor}
			<div class="mt-4 flex justify-center">
				<button
					on:click={() => load(false)}
					disabled={loadingMore}
					class="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					{loadingMore ? 'Loading…' : 'Load more'}
				</button>
			</div>
		{/if}
	{/if}
</div>

<!-- JSON viewer modal -->
{#if viewingId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" on:click|self={() => (viewingId = '')}>
		<div class="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
			<div class="flex items-center justify-between border-b p-4">
				<h2 class="text-base font-semibold text-gray-900">Run #{viewingId.slice(-10)}</h2>
				<button on:click={() => (viewingId = '')} aria-label="Close">
					<Icon icon="mdi:close" class="text-xl text-gray-400 hover:text-gray-600" />
				</button>
			</div>
			<div class="max-h-[60vh] overflow-auto p-4">
				{#if loadingDetail}
					<div class="h-24 animate-pulse rounded-md bg-gray-100"></div>
				{:else if viewingPayload}
					<pre class="text-xs text-gray-700">{JSON.stringify(viewingPayload, null, 2)}</pre>
				{:else}
					<p class="text-sm text-gray-400">No payload available.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
