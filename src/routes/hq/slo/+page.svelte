<!--
	FE-P4-06 (P4-06) — SLO dashboard.

	Pulls live p50/p95/p99 metrics for webhook processing, withdrawal init,
	refund cascade. Color-coded badges per SLO target.
-->
<script lang="ts">
	import { getSloDashboard, type SloMetric, type SloStatus } from '$lib/services/slo.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let metrics: SloMetric[] = [];
	let loading = true;
	let error = '';
	let lastRefresh: Date | null = null;

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			metrics = await getSloDashboard();
			lastRefresh = new Date();
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	function statusBadge(s: SloStatus): string {
		if (s === 'BREACH') return 'bg-red-100 text-red-700';
		if (s === 'WARN') return 'bg-yellow-100 text-yellow-700';
		return 'bg-green-100 text-green-700';
	}

	function fmtMs(ms: number): string {
		if (ms == null) return '—';
		if (ms < 1000) return `${ms.toFixed(0)} ms`;
		return `${(ms / 1000).toFixed(2)} s`;
	}
</script>

<svelte:head><title>SLOs — Rondwell HQ</title></svelte:head>

<div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Service Level Objectives</h1>
			<p class="mt-1 text-sm text-gray-500">
				p50 / p95 / p99 latency for the platform's critical money paths.
			</p>
		</div>
		<button
			on:click={load}
			class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
		>
			<Icon icon="mdi:refresh" /> Refresh
		</button>
	</div>

	{#if lastRefresh}
		<p class="mt-1 text-xs text-gray-400">Updated {lastRefresh.toLocaleTimeString()}</p>
	{/if}

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 grid gap-3 md:grid-cols-2">
			{#each [1, 2, 3, 4] as _}
				<div class="h-28 animate-pulse rounded-xl bg-white"></div>
			{/each}
		</div>
	{:else if metrics.length === 0}
		<div class="mt-8 flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:chart-timeline-variant" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-gray-700">No SLO data yet</p>
			<p class="mt-1 text-sm text-gray-400">
				The backend ships SLO instrumentation under P4-06. Check Grafana for live metrics in the
				meantime.
			</p>
		</div>
	{:else}
		<div class="mt-6 grid gap-3 md:grid-cols-2">
			{#each metrics as m}
				<div class="rounded-xl border bg-white p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-gray-900">{m.label}</p>
							<p class="mt-0.5 text-xs text-gray-500">Target: {m.target}</p>
						</div>
						<span class="rounded-full px-2 py-0.5 text-xs font-medium {statusBadge(m.status)}">
							{m.status}
						</span>
					</div>

					<dl class="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
						<div>
							<dt class="text-xs text-gray-500">p50</dt>
							<dd class="mt-0.5 font-semibold text-gray-900">{fmtMs(m.p50Ms)}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500">p95</dt>
							<dd class="mt-0.5 font-semibold text-gray-900">{fmtMs(m.p95Ms)}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500">p99</dt>
							<dd class="mt-0.5 font-semibold text-gray-900">{fmtMs(m.p99Ms)}</dd>
						</div>
					</dl>

					{#if m.notes}
						<p class="mt-3 text-[11px] text-gray-500">{m.notes}</p>
					{/if}
					<p class="mt-2 text-[10px] text-gray-400">
						Window since {new Date(m.since).toLocaleString()}
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
