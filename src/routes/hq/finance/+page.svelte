<!--
	FE-P4-02 (P4-02 / FA-9.2 / FA-9.3) — Platform revenue rollup dashboard.

	Pulls from /api/v1/payment/admin/finance/overview + /timeseries.
	Renders KPI cards (revenue by source) and a daily / weekly / monthly
	timeseries chart, with a year-on-year comparison toggle and CSV export.
-->
<script lang="ts">
	import {
		downloadBlob,
		exportFinanceCsv,
		getRevenueOverview,
		getRevenueTimeseries,
		type FinanceBucket,
		type RevenueOverview,
		type RevenueTimeseriesPoint,
	} from '$lib/services/finance.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let overview: RevenueOverview | null = null;
	let timeseries: RevenueTimeseriesPoint[] = [];
	let loading = true;
	let error = '';

	// Filters
	let bucket: FinanceBucket = 'day';
	let currency = 'NGN';
	let comparePrevYear = false;

	// Date range — default to last 30 days
	const today = new Date();
	const fromDefault = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
	let from = fromDefault.toISOString().slice(0, 10);
	let to = today.toISOString().slice(0, 10);

	let exporting = false;

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			[overview, timeseries] = await Promise.all([
				getRevenueOverview({
					from: `${from}T00:00:00Z`,
					to: `${to}T23:59:59Z`,
					currency,
					includePreviousYear: comparePrevYear,
				}),
				getRevenueTimeseries({
					bucket,
					from: `${from}T00:00:00Z`,
					to: `${to}T23:59:59Z`,
					currency,
				}),
			]);
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	async function handleExport() {
		exporting = true;
		try {
			const blob = await exportFinanceCsv('overview', {
				from: `${from}T00:00:00Z`,
				to: `${to}T23:59:59Z`,
				currency,
			});
			downloadBlob(blob, `rondwell-finance-overview-${from}_to_${to}.csv`);
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			exporting = false;
		}
	}

	// Simple inline-SVG line chart for the net trend.
	const CHART_W = 700;
	const CHART_H = 220;
	const PADDING = 40;

	$: chartPoints = (() => {
		if (!timeseries.length) return [];
		const max = Math.max(...timeseries.map((p) => p.netKobo), 1);
		const min = Math.min(...timeseries.map((p) => p.netKobo), 0);
		const range = max - min || 1;
		const stepX = (CHART_W - PADDING * 2) / Math.max(timeseries.length - 1, 1);
		return timeseries.map((p, i) => ({
			x: PADDING + i * stepX,
			y: CHART_H - PADDING - ((p.netKobo - min) / range) * (CHART_H - PADDING * 2),
			label: p.bucket,
			net: p.netKobo,
		}));
	})();

	$: linePath = chartPoints.length
		? chartPoints.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(' ')
		: '';

	function fmtDelta(now: number, prev?: number | null): string {
		if (prev == null) return '';
		const delta = now - prev;
		if (prev === 0) return delta > 0 ? '+∞%' : '0%';
		const pct = (delta / Math.abs(prev)) * 100;
		const sign = delta > 0 ? '+' : '';
		return `${sign}${pct.toFixed(1)}% YoY`;
	}
</script>

<svelte:head><title>Finance — Rondwell HQ</title></svelte:head>

<div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Finance</h1>
			<p class="mt-1 text-sm text-gray-500">
				Platform revenue rolled up daily from the wallet ledger.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/hq/finance/events"
				class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
			>
				Top events
			</a>
			<a
				href="/hq/finance/vendors"
				class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
			>
				Top vendors
			</a>
			<a
				href="/hq/finance/organizers"
				class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
			>
				Top organizers
			</a>
			<a
				href="/hq/finance/disputes"
				class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
			>
				Disputes
			</a>
		</div>
	</div>

	<!-- Filters -->
	<div class="mt-5 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 text-xs">
		<label class="flex flex-col gap-1">
			<span class="text-gray-500">From</span>
			<input
				type="date"
				bind:value={from}
				class="rounded-md border border-gray-200 px-2 py-1.5"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-gray-500">To</span>
			<input
				type="date"
				bind:value={to}
				class="rounded-md border border-gray-200 px-2 py-1.5"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-gray-500">Currency</span>
			<select bind:value={currency} class="rounded-md border border-gray-200 px-2 py-1.5">
				<option value="NGN">NGN</option>
				<option value="USD">USD</option>
				<option value="GBP">GBP</option>
				<option value="EUR">EUR</option>
			</select>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-gray-500">Bucket</span>
			<select bind:value={bucket} class="rounded-md border border-gray-200 px-2 py-1.5">
				<option value="day">Day</option>
				<option value="week">Week</option>
				<option value="month">Month</option>
			</select>
		</label>
		<label class="ml-2 flex items-center gap-2">
			<input type="checkbox" bind:checked={comparePrevYear} />
			<span class="text-gray-600">Compare previous year</span>
		</label>
		<button
			on:click={load}
			class="ml-auto rounded-md bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
		>
			Apply
		</button>
		<button
			on:click={handleExport}
			disabled={exporting}
			class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
		>
			<Icon icon="mdi:download" class="inline" /> {exporting ? 'Exporting…' : 'Export CSV'}
		</button>
	</div>

	{#if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="mt-6 grid gap-3 md:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<div class="h-24 animate-pulse rounded-xl bg-white"></div>
			{/each}
		</div>
	{:else if overview}
		<!-- KPI Cards -->
		<div class="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
			{#each [
				{ label: 'Net revenue', value: overview.netKobo, prev: overview.previousYear?.netKobo, color: 'text-green-700' },
				{ label: 'Ticket commission', value: overview.ticketCommissionKobo, prev: overview.previousYear?.ticketCommissionKobo, color: 'text-gray-900' },
				{ label: 'Vendor commission', value: overview.vendorCommissionKobo, prev: overview.previousYear?.vendorCommissionKobo, color: 'text-gray-900' },
				{ label: 'Subscription revenue', value: overview.subscriptionRevenueKobo, prev: overview.previousYear?.subscriptionRevenueKobo, color: 'text-gray-900' },
				{ label: 'FX revenue', value: overview.fxRevenueKobo, prev: overview.previousYear?.fxRevenueKobo, color: 'text-blue-700' },
				{ label: 'Gateway fees paid', value: overview.gatewayFeesPaidKobo, prev: overview.previousYear?.gatewayFeesPaidKobo, color: 'text-orange-700' },
				{ label: 'Refund returns', value: overview.refundReturnsKobo, prev: overview.previousYear?.refundReturnsKobo, color: 'text-red-700' },
			] as kpi}
				<div class="rounded-xl border bg-white p-4">
					<p class="text-xs uppercase text-gray-500">{kpi.label}</p>
					<p class="mt-1 text-xl font-semibold {kpi.color}">{formatMoney(kpi.value, overview.currency)}</p>
					{#if comparePrevYear && kpi.prev != null}
						<p class="mt-0.5 text-[10px] text-gray-500">{fmtDelta(kpi.value, kpi.prev)}</p>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Timeseries chart -->
		<section class="mt-6 rounded-xl border bg-white p-5">
			<h2 class="text-base font-semibold text-gray-900">Net revenue trend ({bucket})</h2>
			{#if !timeseries.length}
				<p class="mt-3 text-sm text-gray-400">No data in this window.</p>
			{:else}
				<div class="overflow-x-auto">
					<svg viewBox="0 0 {CHART_W} {CHART_H}" class="mt-3 w-full max-w-full" role="img" aria-label="Net revenue trend">
						<line x1={PADDING} y1={CHART_H - PADDING} x2={CHART_W - PADDING} y2={CHART_H - PADDING} stroke="#E5E7EB" />
						<line x1={PADDING} y1={PADDING} x2={PADDING} y2={CHART_H - PADDING} stroke="#E5E7EB" />
						<path d={linePath} stroke="#16A34A" stroke-width="2" fill="none" />
						{#each chartPoints as p}
							<circle cx={p.x} cy={p.y} r="3" fill="#16A34A" />
						{/each}
					</svg>
				</div>
				<p class="mt-2 text-xs text-gray-400">
					{timeseries.length} {bucket}{timeseries.length === 1 ? '' : 's'} · totals are net of gateway fees and refunds.
				</p>
			{/if}
		</section>

		<!-- Sources breakdown table -->
		<section class="mt-6 rounded-xl border bg-white">
			<table class="min-w-full divide-y divide-gray-100 text-sm">
				<thead class="bg-gray-50 text-xs uppercase text-gray-500">
					<tr>
						<th class="px-4 py-2 text-left font-medium">Source</th>
						<th class="px-4 py-2 text-right font-medium">Amount</th>
						<th class="px-4 py-2 text-right font-medium">% of net</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each [
						{ label: 'Ticket commission', v: overview.ticketCommissionKobo },
						{ label: 'Vendor commission', v: overview.vendorCommissionKobo },
						{ label: 'Subscription revenue', v: overview.subscriptionRevenueKobo },
						{ label: 'FX revenue', v: overview.fxRevenueKobo },
						{ label: 'Gateway fees', v: -overview.gatewayFeesPaidKobo },
						{ label: 'Refund returns', v: -overview.refundReturnsKobo },
					] as row}
						<tr>
							<td class="px-4 py-2 text-gray-700">{row.label}</td>
							<td class="px-4 py-2 text-right {row.v < 0 ? 'text-red-700' : 'text-gray-900'}">
								{formatMoney(row.v, overview.currency)}
							</td>
							<td class="px-4 py-2 text-right text-xs text-gray-500">
								{overview.netKobo
									? `${((row.v / overview.netKobo) * 100).toFixed(1)}%`
									: '—'}
							</td>
						</tr>
					{/each}
					<tr class="bg-green-50 font-semibold">
						<td class="px-4 py-2 text-green-900">Net</td>
						<td class="px-4 py-2 text-right text-green-900">{formatMoney(overview.netKobo, overview.currency)}</td>
						<td class="px-4 py-2 text-right text-green-900">100%</td>
					</tr>
				</tbody>
			</table>
		</section>
	{/if}
</div>
