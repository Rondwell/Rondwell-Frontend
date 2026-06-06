<!--
	FE-P4-01 (P4-01) — Daily reconciliation admin dashboard.

	Lists nightly recon runs across the three jobs (wallet replay, gateway
	settlement, disbursement) with status, drift count, and any actions taken
	(FREEZE_WALLET, COMPENSATING_ENTRY, ALERT_OPS).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		listReconRuns,
		type ReconJobType,
		type ReconRun,
		type ReconRunStatus,
	} from '$lib/services/reconciliation.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let runs: ReconRun[] = [];
	let loading = true;
	let error = '';
	let nextCursor: string | null = null;
	let loadingMore = false;

	let jobTypeFilter: ReconJobType | '' = '';
	let statusFilter: ReconRunStatus | '' = '';

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
			const result = await listReconRuns({
				jobType: jobTypeFilter || undefined,
				status: statusFilter || undefined,
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

	function fmtJobType(t: ReconJobType): string {
		switch (t) {
			case 'WALLET_REPLAY':
				return 'Wallet replay';
			case 'GATEWAY_SETTLEMENT':
				return 'Gateway settlement';
			case 'DISBURSEMENT':
				return 'Disbursement';
			default:
				return t;
		}
	}

	function statusColor(s: ReconRunStatus, drift: number): string {
		if (s === 'FAILED') return 'bg-red-100 text-red-700';
		if (s === 'RUNNING') return 'bg-yellow-100 text-yellow-700';
		if (drift > 0) return 'bg-orange-100 text-orange-700';
		return 'bg-green-100 text-green-700';
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}

	function viewRun(r: ReconRun) {
		goto(`/hq/reconciliation/${r.id}`);
	}
</script>

<svelte:head><title>Reconciliation — Rondwell HQ</title></svelte:head>

<div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Reconciliation</h1>
			<p class="mt-1 text-sm text-gray-500">
				Nightly recon runs across wallet replay, gateway settlement, and disbursement.
			</p>
		</div>
		<button
			on:click={() => load(true)}
			class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
		>
			<Icon icon="mdi:refresh" /> Refresh
		</button>
	</div>

	<!-- Filters -->
	<div class="mt-4 flex flex-wrap items-center gap-3 text-xs">
		<label class="flex items-center gap-2">
			<span class="text-gray-500">Job</span>
			<select
				bind:value={jobTypeFilter}
				on:change={() => load(true)}
				class="rounded-md border border-gray-200 bg-white px-2 py-1"
			>
				<option value="">All</option>
				<option value="WALLET_REPLAY">Wallet replay</option>
				<option value="GATEWAY_SETTLEMENT">Gateway settlement</option>
				<option value="DISBURSEMENT">Disbursement</option>
			</select>
		</label>
		<label class="flex items-center gap-2">
			<span class="text-gray-500">Status</span>
			<select
				bind:value={statusFilter}
				on:change={() => load(true)}
				class="rounded-md border border-gray-200 bg-white px-2 py-1"
			>
				<option value="">All</option>
				<option value="RUNNING">Running</option>
				<option value="COMPLETED">Completed</option>
				<option value="FAILED">Failed</option>
			</select>
		</label>
	</div>

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 space-y-2">
			{#each [1, 2, 3, 4] as _}
				<div class="h-16 animate-pulse rounded-lg bg-white"></div>
			{/each}
		</div>
	{:else if runs.length === 0}
		<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:database-check" class="mb-2 text-4xl text-green-400" />
			<p class="text-lg font-medium text-gray-700">No recon runs yet</p>
			<p class="mt-1 text-sm text-gray-400">Runs appear here after the nightly cron executes.</p>
		</div>
	{:else}
		<div class="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
			<table class="min-w-full divide-y divide-gray-100 text-sm">
				<thead class="bg-gray-50 text-xs uppercase text-gray-500">
					<tr>
						<th class="px-4 py-3 text-left font-medium">Job</th>
						<th class="px-4 py-3 text-left font-medium">Started</th>
						<th class="px-4 py-3 text-right font-medium">Drift</th>
						<th class="px-4 py-3 text-right font-medium">Checked</th>
						<th class="px-4 py-3 text-left font-medium">Action</th>
						<th class="px-4 py-3 text-left font-medium">Status</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each runs as r}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium text-gray-900">{fmtJobType(r.jobType)}</td>
							<td class="px-4 py-3 text-xs text-gray-500">{fmtDate(r.startedAt)}</td>
							<td class="px-4 py-3 text-right">
								{#if r.driftCount > 0}
									<span class="font-semibold text-orange-600">{r.driftCount}</span>
								{:else}
									<span class="text-gray-400">0</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-gray-600">{r.totalChecked.toLocaleString()}</td>
							<td class="px-4 py-3 text-xs">
								{#if r.actionsTaken?.length}
									<div class="flex flex-wrap gap-1">
										{#each r.actionsTaken as a}
											<span
												class="rounded-full px-2 py-0.5 text-[10px] font-medium {a === 'FREEZE_WALLET'
													? 'bg-red-100 text-red-700'
													: a === 'ALERT_OPS'
														? 'bg-yellow-100 text-yellow-700'
														: a === 'COMPENSATING_ENTRY'
															? 'bg-blue-100 text-blue-700'
															: 'bg-gray-100 text-gray-600'}">{a.replace(/_/g, ' ')}</span
											>
										{/each}
									</div>
								{:else}
									<span class="text-gray-400">—</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusColor(
										r.status,
										r.driftCount
									)}"
								>
									{r.status}
								</span>
							</td>
							<td class="px-4 py-3 text-right">
								<button
									on:click={() => viewRun(r)}
									class="text-xs font-medium text-pink-600 hover:underline"
								>
									View
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
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
