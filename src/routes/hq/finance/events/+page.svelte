<!--
	FE-P4-02 — Top events by commission generated.
-->
<script lang="ts">
	import {
		downloadBlob,
		exportFinanceCsv,
		getTopEvents,
		type TopRow,
	} from '$lib/services/finance.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let rows: TopRow[] = [];
	let loading = true;
	let error = '';
	let exporting = false;

	const today = new Date();
	const fromDefault = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
	let from = fromDefault.toISOString().slice(0, 10);
	let to = today.toISOString().slice(0, 10);

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			rows = await getTopEvents({ from, to, limit: 50 });
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	async function handleExport() {
		exporting = true;
		try {
			const blob = await exportFinanceCsv('events', { from, to });
			downloadBlob(blob, `top-events-${from}_to_${to}.csv`);
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			exporting = false;
		}
	}
</script>

<svelte:head><title>Top events — Rondwell HQ</title></svelte:head>

<div>
	<a href="/hq/finance" class="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
		<Icon icon="mdi:arrow-left" /> Back to Finance
	</a>

	<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Top events</h1>
			<p class="mt-1 text-sm text-gray-500">Ranked by commission earned.</p>
		</div>
		<button
			on:click={handleExport}
			disabled={exporting}
			class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
		>
			<Icon icon="mdi:download" class="inline" /> {exporting ? 'Exporting…' : 'Export CSV'}
		</button>
	</div>

	<div class="mt-4 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 text-xs">
		<label class="flex flex-col gap-1">
			<span class="text-gray-500">From</span>
			<input type="date" bind:value={from} class="rounded-md border border-gray-200 px-2 py-1.5" />
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-gray-500">To</span>
			<input type="date" bind:value={to} class="rounded-md border border-gray-200 px-2 py-1.5" />
		</label>
		<button
			on:click={load}
			class="ml-auto rounded-md bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
		>
			Apply
		</button>
	</div>

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 h-32 animate-pulse rounded-lg bg-white"></div>
	{:else if rows.length === 0}
		<div class="mt-6 flex h-40 flex-col items-center justify-center rounded-xl border border-dashed bg-white">
			<p class="text-sm text-gray-400">No data in this window.</p>
		</div>
	{:else}
		<div class="mt-6 overflow-hidden rounded-xl border bg-white">
			<table class="min-w-full divide-y divide-gray-100 text-sm">
				<thead class="bg-gray-50 text-xs uppercase text-gray-500">
					<tr>
						<th class="px-4 py-2 text-left font-medium">#</th>
						<th class="px-4 py-2 text-left font-medium">Event</th>
						<th class="px-4 py-2 text-right font-medium">Tx</th>
						<th class="px-4 py-2 text-right font-medium">Gross</th>
						<th class="px-4 py-2 text-right font-medium">Commission</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each rows as r, i}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-2 text-xs text-gray-400">#{i + 1}</td>
							<td class="px-4 py-2 font-medium text-gray-900">{r.name}</td>
							<td class="px-4 py-2 text-right text-gray-600">{r.transactions.toLocaleString()}</td>
							<td class="px-4 py-2 text-right text-gray-700">{formatMoney(r.grossKobo, r.currency)}</td>
							<td class="px-4 py-2 text-right font-semibold text-green-700">
								{formatMoney(r.commissionKobo, r.currency)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
