<!--
	FE-P2-09 — AML compliance dashboard.

	Two tabs: Reviews (pending withdrawal reviews) + Alerts (open AML
	alerts). Plus a CTR/STR export tool.
-->
<script lang="ts">
	import {
		approveAmlReview,
		clearAlert,
		downloadCtrStrReport,
		listOpenAlerts,
		listPendingReviews,
		rejectAmlReview,
		type AmlAlert,
		type AmlReview,
	} from '$lib/services/aml.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	type Tab = 'reviews' | 'alerts' | 'export';
	let activeTab: Tab = 'reviews';

	let reviews: AmlReview[] = [];
	let alerts: AmlAlert[] = [];
	let loading = true;
	let error = '';
	let processing = '';

	let exportMonth: string = new Date().toISOString().slice(0, 7);
	let exporting = false;

	onMount(loadAll);

	async function loadAll() {
		loading = true;
		error = '';
		try {
			const [r, a] = await Promise.all([listPendingReviews({ limit: 50 }), listOpenAlerts({ limit: 50 })]);
			reviews = r.items;
			alerts = a.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	async function approveReview(id: string) {
		processing = id;
		try {
			await approveAmlReview(id);
			reviews = reviews.filter((r) => r.id !== id);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			processing = '';
		}
	}

	async function rejectReview(id: string) {
		const reason = window.prompt('Reason?');
		if (!reason) return;
		processing = id;
		try {
			await rejectAmlReview(id, reason);
			reviews = reviews.filter((r) => r.id !== id);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			processing = '';
		}
	}

	async function clear(id: string) {
		processing = id;
		try {
			await clearAlert(id);
			alerts = alerts.filter((a) => a.id !== id);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			processing = '';
		}
	}

	async function downloadReport() {
		exporting = true;
		try {
			const blob = await downloadCtrStrReport(exportMonth);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `ctr-str-${exportMonth}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			exporting = false;
		}
	}

	function severityColor(s: string): string {
		if (s === 'HIGH') return 'bg-red-100 text-red-700';
		if (s === 'MEDIUM') return 'bg-amber-100 text-amber-700';
		return 'bg-gray-100 text-gray-700';
	}
</script>

<svelte:head><title>AML — Rondwell HQ</title></svelte:head>

<div>
	<h1 class="text-2xl font-semibold text-gray-900">AML & compliance</h1>
	<p class="mt-1 text-sm text-gray-500">
		Manual reviews, open alerts, and monthly CTR/STR exports.
	</p>

	<div class="mt-6 flex border-b">
		{#each ['reviews', 'alerts', 'export'] as t}
			<button
				on:click={() => (activeTab = t)}
				class="border-b-2 px-4 py-2 text-sm font-medium {activeTab === t
					? 'border-pink-500 text-pink-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
			>
				{t === 'reviews'
					? `Reviews (${reviews.length})`
					: t === 'alerts'
						? `Alerts (${alerts.length})`
						: 'CTR / STR export'}
			</button>
		{/each}
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
	{:else if activeTab === 'reviews'}
		{#if reviews.length === 0}
			<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
				<Icon icon="mdi:check-circle-outline" class="mb-2 text-4xl text-green-400" />
				<p class="text-lg font-medium text-gray-700">No pending reviews</p>
			</div>
		{:else}
			<div class="mt-6 space-y-3">
				{#each reviews as r}
					<div class="rounded-xl border bg-white p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="font-semibold">{r.userName ?? r.userEmail ?? 'User'}</p>
								<p class="text-xs text-gray-500">
									{r.threshold.replace(/_/g, ' ').toLowerCase()} —
									{formatMoney(r.amountKobo, r.currency)}
								</p>
								<p class="mt-1 text-xs text-gray-400">
									Opened {new Date(r.openedAt).toLocaleString()}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<button
									on:click={() => approveReview(r.id)}
									disabled={processing === r.id}
									class="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
								>
									Approve
								</button>
								<button
									on:click={() => rejectReview(r.id)}
									disabled={processing === r.id}
									class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
								>
									Reject
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'alerts'}
		{#if alerts.length === 0}
			<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
				<Icon icon="mdi:check-circle-outline" class="mb-2 text-4xl text-green-400" />
				<p class="text-lg font-medium text-gray-700">No open alerts</p>
			</div>
		{:else}
			<div class="mt-6 space-y-3">
				{#each alerts as a}
					<div class="rounded-xl border bg-white p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="font-semibold">{a.userName ?? a.userEmail ?? 'User'}</p>
								<p class="text-xs text-gray-500">{a.type}</p>
								<p class="mt-1 text-xs text-gray-400">
									Opened {new Date(a.openedAt).toLocaleString()}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {severityColor(a.severity)}">
									{a.severity}
								</span>
								<button
									on:click={() => clear(a.id)}
									disabled={processing === a.id}
									class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
								>
									Clear
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="mt-6 max-w-md rounded-xl border bg-white p-6">
			<h2 class="text-lg font-semibold">CTR / STR export</h2>
			<p class="mt-1 text-sm text-gray-500">Monthly cash & suspicious transaction reports.</p>
			<div class="mt-4">
				<label for="export-month" class="text-xs text-gray-500">Month</label>
				<input
					id="export-month"
					type="month"
					bind:value={exportMonth}
					class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				/>
			</div>
			<button
				on:click={downloadReport}
				disabled={exporting}
				class="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
			>
				{exporting ? 'Generating…' : 'Download CSV'}
			</button>
		</div>
	{/if}
</div>
