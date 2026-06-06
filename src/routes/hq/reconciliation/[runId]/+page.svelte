<!--
	FE-P4-01 (P4-01) — Recon run detail.

	Shows every finding for a single recon run, plus the raw JSON payload
	for ops debugging.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import {
		getReconRun,
		type ReconRunDetail,
	} from '$lib/services/reconciliation.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: runId = $page.params.runId;

	let run: ReconRunDetail | null = null;
	let loading = true;
	let error = '';
	let showRaw = false;

	onMount(async () => {
		try {
			run = await getReconRun(runId);
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	});

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}

	function actionStyle(a: string): string {
		if (a === 'FREEZE_WALLET') return 'bg-red-100 text-red-700';
		if (a === 'COMPENSATING_ENTRY') return 'bg-blue-100 text-blue-700';
		if (a === 'ALERT_OPS') return 'bg-yellow-100 text-yellow-700';
		return 'bg-gray-100 text-gray-600';
	}
</script>

<svelte:head><title>Recon run — Rondwell HQ</title></svelte:head>

<div>
	<a href="/hq/reconciliation" class="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
		<Icon icon="mdi:arrow-left" /> Back to runs
	</a>

	{#if loading}
		<div class="mt-4 h-32 animate-pulse rounded-lg bg-white"></div>
	{:else if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{:else if run}
		<header class="mt-4 rounded-xl border bg-white p-5">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="text-xs uppercase text-gray-500">Run #{run.id}</p>
					<h1 class="mt-1 text-xl font-semibold text-gray-900">{run.jobType.replace(/_/g, ' ')}</h1>
					<p class="mt-1 text-xs text-gray-500">
						Started {fmtDate(run.startedAt)} · Completed {fmtDate(run.completedAt)}
					</p>
				</div>
				<span
					class="rounded-full px-3 py-1 text-xs font-medium {run.status === 'FAILED'
						? 'bg-red-100 text-red-700'
						: run.driftCount > 0
							? 'bg-orange-100 text-orange-700'
							: 'bg-green-100 text-green-700'}"
				>
					{run.status}
				</span>
			</div>

			<dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div>
					<dt class="text-xs text-gray-500">Drift count</dt>
					<dd class="mt-0.5 text-lg font-semibold text-gray-900">{run.driftCount}</dd>
				</div>
				<div>
					<dt class="text-xs text-gray-500">Total checked</dt>
					<dd class="mt-0.5 text-lg font-semibold text-gray-900">
						{run.totalChecked.toLocaleString()}
					</dd>
				</div>
				<div>
					<dt class="text-xs text-gray-500">Findings</dt>
					<dd class="mt-0.5 text-lg font-semibold text-gray-900">{run.findings.length}</dd>
				</div>
				<div>
					<dt class="text-xs text-gray-500">Actions taken</dt>
					<dd class="mt-1 flex flex-wrap gap-1">
						{#if run.actionsTaken?.length}
							{#each run.actionsTaken as a}
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {actionStyle(a)}">
									{a.replace(/_/g, ' ')}
								</span>
							{/each}
						{:else}
							<span class="text-xs text-gray-400">None</span>
						{/if}
					</dd>
				</div>
			</dl>

			{#if run.summary}
				<p class="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-600">{run.summary}</p>
			{/if}
		</header>

		<!-- Findings -->
		<section class="mt-6">
			<h2 class="text-base font-semibold text-gray-900">Findings ({run.findings.length})</h2>

			{#if run.findings.length === 0}
				<div class="mt-3 flex h-40 items-center justify-center rounded-xl border border-dashed bg-white">
					<p class="text-sm text-gray-400">No drift detected.</p>
				</div>
			{:else}
				<div class="mt-3 overflow-hidden rounded-xl border bg-white">
					<table class="min-w-full divide-y divide-gray-100 text-sm">
						<thead class="bg-gray-50 text-xs uppercase text-gray-500">
							<tr>
								<th class="px-4 py-2 text-left font-medium">Category</th>
								<th class="px-4 py-2 text-left font-medium">Wallet / Tx</th>
								<th class="px-4 py-2 text-right font-medium">Drift</th>
								<th class="px-4 py-2 text-left font-medium">Action</th>
								<th class="px-4 py-2 text-left font-medium">Notes</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each run.findings as f}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-2 text-xs text-gray-700">{f.category}</td>
									<td class="px-4 py-2">
										{#if f.walletId}
											<a
												href={`/hq/wallets/${f.walletId}`}
												class="font-mono text-xs text-pink-600 hover:underline"
											>
												{f.walletId.slice(-10)}
											</a>
										{/if}
										{#if f.transactionId}
											<p class="font-mono text-[10px] text-gray-400">tx {f.transactionId.slice(-10)}</p>
										{/if}
									</td>
									<td class="px-4 py-2 text-right">
										{#if f.driftKobo}
											<span class="font-medium text-orange-700">
												{formatMoney(f.driftKobo, f.currency ?? 'NGN')}
											</span>
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="px-4 py-2">
										<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {actionStyle(f.action)}">
											{f.action.replace(/_/g, ' ')}
										</span>
									</td>
									<td class="px-4 py-2 text-xs text-gray-500">{f.notes ?? ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		<!-- Raw payload -->
		{#if run.rawReport}
			<section class="mt-6">
				<button
					on:click={() => (showRaw = !showRaw)}
					class="text-xs font-medium text-gray-600 underline"
				>
					{showRaw ? 'Hide' : 'Show'} raw report JSON
				</button>
				{#if showRaw}
					<pre class="mt-2 max-h-[400px] overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">{JSON.stringify(run.rawReport, null, 2)}</pre>
				{/if}
			</section>
		{/if}
	{/if}
</div>
