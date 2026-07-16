<!--
	Finance module — unified admin page with tabs:
	  1. Analytics (revenue rollup dashboard)
	  2. Beneficiaries (bank account review queue)
	  3. AML (anti-money laundering compliance)
	  4. Wallet Audit (hash-chained ledger verification)
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
	import { adminFetch } from '$lib/services/admin.fetch';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { throwApiError } from '$lib/utils/errorMessage';
	import { formatMoney } from '$lib/utils/money';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// ─── Tab state ────────────────────────────────────────────────────────
	type Tab = 'analytics' | 'beneficiaries' | 'aml' | 'wallet-audit';
	let activeTab: Tab = 'analytics';

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'analytics', label: 'Analytics' },
		{ id: 'beneficiaries', label: 'Beneficiaries' },
		{ id: 'aml', label: 'AML' },
		{ id: 'wallet-audit', label: 'Wallet Audit' },
	];

	// ─── Analytics state ───────────────────────────────────────────────────
	const API_URL = import.meta.env.VITE_API_URL;
	let overview: RevenueOverview | null = null;
	let timeseries: RevenueTimeseriesPoint[] = [];
	let analyticsLoading = true;
	let analyticsError = '';
	let bucket: FinanceBucket = 'day';
	let currency = 'NGN';
	let comparePrevYear = false;
	const today = new Date();
	const fromDefault = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
	let from = fromDefault.toISOString().slice(0, 10);
	let to = today.toISOString().slice(0, 10);
	let exporting = false;

	// ─── Beneficiaries state ──────────────────────────────────────────────
	interface PendingBeneficiary {
		id: string; userId: string; userEmail?: string; userName?: string;
		accountNumber: string; bankName: string; bankCode: string;
		accountName: string; canonicalAccountName?: string; flagReason?: string; createdAt: string;
	}
	let beneficiaryItems: PendingBeneficiary[] = [];
	let beneficiaryLoading = false;
	let beneficiaryError = '';
	let beneficiaryProcessing = '';

	// ─── AML state ────────────────────────────────────────────────────────
	type AmlTab = 'reviews' | 'alerts' | 'export';
	let amlActiveTab: AmlTab = 'reviews';
	let amlReviews: AmlReview[] = [];
	let amlAlerts: AmlAlert[] = [];
	let amlLoading = false;
	let amlError = '';
	let amlProcessing = '';
	let exportMonth: string = new Date().toISOString().slice(0, 7);
	let amlExporting = false;

	// ─── Wallet Audit state ───────────────────────────────────────────────
	let walletId = '';
	let walletAuditError = '';

	// ─── Analytics functions ───────────────────────────────────────────────
	onMount(loadAnalytics);

	async function loadAnalytics() {
		analyticsLoading = true;
		analyticsError = '';
		try {
			[overview, timeseries] = await Promise.all([
				getRevenueOverview({ from, to, currency, includePreviousYear: comparePrevYear }),
				getRevenueTimeseries({ bucket, from, to, currency }),
			]);
		} catch (e) { analyticsError = financialErrorMessage(e); }
		finally { analyticsLoading = false; }
	}

	async function handleExport() {
		exporting = true;
		try {
			const blob = await exportFinanceCsv('overview', { from, to, currency });
			downloadBlob(blob, `rondwell-finance-${from}_to_${to}.csv`);
		} catch (e) { analyticsError = financialErrorMessage(e); }
		finally { exporting = false; }
	}

	const CHART_W = 700; const CHART_H = 220; const PADDING = 40;
	$: chartPoints = (() => {
		if (!timeseries.length) return [];
		const max = Math.max(...timeseries.map((p) => p.netKobo), 1);
		const min = Math.min(...timeseries.map((p) => p.netKobo), 0);
		const range = max - min || 1;
		const stepX = (CHART_W - PADDING * 2) / Math.max(timeseries.length - 1, 1);
		return timeseries.map((p, i) => ({
			x: PADDING + i * stepX,
			y: CHART_H - PADDING - ((p.netKobo - min) / range) * (CHART_H - PADDING * 2),
			label: p.bucket, net: p.netKobo,
		}));
	})();
	$: linePath = chartPoints.length ? chartPoints.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(' ') : '';

	function fmtDelta(now: number, prev?: number | null): string {
		if (prev == null) return '';
		const delta = now - prev;
		if (prev === 0) return delta > 0 ? '+∞%' : '0%';
		return `${delta > 0 ? '+' : ''}${((delta / Math.abs(prev)) * 100).toFixed(1)}% YoY`;
	}

	// ─── Beneficiary functions ─────────────────────────────────────────────
	async function loadBeneficiaries() {
		beneficiaryLoading = true; beneficiaryError = '';
		try {
			const res = await adminFetch(`${API_URL}/api/v1/payment/beneficiary/admin/pending-review`);
			if (!res.ok) await throwApiError(res, 'Failed to load queue');
			const data = await res.json();
			beneficiaryItems = data.data?.items ?? data.items ?? [];
		} catch (e: any) { beneficiaryError = financialErrorMessage(e); }
		finally { beneficiaryLoading = false; }
	}
	async function approveBeneficiary(id: string) {
		beneficiaryProcessing = id;
		try {
			const res = await adminFetch(`${API_URL}/api/v1/payment/beneficiary/admin/${id}/approve`, { method: 'POST' });
			if (!res.ok) await throwApiError(res, 'Failed to approve');
			beneficiaryItems = beneficiaryItems.filter((i) => i.id !== id);
		} catch (e: any) { beneficiaryError = financialErrorMessage(e); }
		finally { beneficiaryProcessing = ''; }
	}
	async function rejectBeneficiary(id: string) {
		const reason = window.prompt('Reason for rejection?');
		if (!reason) return;
		beneficiaryProcessing = id;
		try {
			const res = await adminFetch(`${API_URL}/api/v1/payment/beneficiary/admin/${id}/reject`, {
				method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
			});
			if (!res.ok) await throwApiError(res, 'Failed to reject');
			beneficiaryItems = beneficiaryItems.filter((i) => i.id !== id);
		} catch (e: any) { beneficiaryError = financialErrorMessage(e); }
		finally { beneficiaryProcessing = ''; }
	}

	// ─── AML functions ────────────────────────────────────────────────────
	async function loadAml() {
		amlLoading = true; amlError = '';
		try {
			const [r, a] = await Promise.all([listPendingReviews({ limit: 50 }), listOpenAlerts({ limit: 50 })]);
			amlReviews = r.items; amlAlerts = a.items;
		} catch (e: any) { amlError = financialErrorMessage(e); }
		finally { amlLoading = false; }
	}
	async function approveReview(id: string) {
		amlProcessing = id;
		try { await approveAmlReview(id); amlReviews = amlReviews.filter((r) => r.id !== id); }
		catch (e: any) { amlError = financialErrorMessage(e); }
		finally { amlProcessing = ''; }
	}
	async function rejectReview(id: string) {
		const reason = window.prompt('Reason?');
		if (!reason) return;
		amlProcessing = id;
		try { await rejectAmlReview(id, reason); amlReviews = amlReviews.filter((r) => r.id !== id); }
		catch (e: any) { amlError = financialErrorMessage(e); }
		finally { amlProcessing = ''; }
	}
	async function clearAmlAlert(id: string) {
		amlProcessing = id;
		try { await clearAlert(id); amlAlerts = amlAlerts.filter((a) => a.id !== id); }
		catch (e: any) { amlError = financialErrorMessage(e); }
		finally { amlProcessing = ''; }
	}
	async function downloadAmlReport() {
		amlExporting = true;
		try {
			const blob = await downloadCtrStrReport(exportMonth);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a'); a.href = url; a.download = `ctr-str-${exportMonth}.csv`; a.click();
			URL.revokeObjectURL(url);
		} catch (e: any) { amlError = financialErrorMessage(e); }
		finally { amlExporting = false; }
	}
	function severityColor(s: string): string {
		if (s === 'HIGH') return 'bg-red-100 text-red-700';
		if (s === 'MEDIUM') return 'bg-amber-100 text-amber-700';
		return 'bg-gray-100 text-gray-700';
	}

	// ─── Wallet Audit functions ────────────────────────────────────────────
	function openWalletAudit() {
		const id = walletId.trim();
		if (!id) { walletAuditError = 'Enter a wallet ID.'; return; }
		goto(`/hq/wallet-audit/${encodeURIComponent(id)}`);
	}

	// ─── Tab switch handler ───────────────────────────────────────────────
	function switchTab(tab: Tab) {
		activeTab = tab;
		if (tab === 'beneficiaries' && beneficiaryItems.length === 0 && !beneficiaryLoading) loadBeneficiaries();
		if (tab === 'aml' && amlReviews.length === 0 && amlAlerts.length === 0 && !amlLoading) loadAml();
	}
</script>

<svelte:head><title>Finance — Rondwell HQ</title></svelte:head>

<div>
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">Finance</h1>
		<p class="mt-1 text-sm text-gray-500">Revenue analytics, beneficiary reviews, AML compliance, and wallet audit.</p>
	</div>

	<!-- Tabs -->
	<div class="mb-6">
		<nav class="flex gap-1 border-b border-gray-200">
			{#each tabs as tab}
				<button on:click={() => switchTab(tab.id)}
					class="border-b-2 px-4 pb-3 text-sm font-medium transition {activeTab === tab.id ? 'border-[#DB3EC6] text-[#DB3EC6]' : 'border-transparent text-gray-500 hover:text-gray-700'}">
					{tab.label}
				</button>
			{/each}
		</nav>
	</div>

	<!-- ═══ ANALYTICS TAB ═══ -->
	{#if activeTab === 'analytics'}
		<div class="flex flex-wrap items-center justify-end gap-2 mb-4">
			<a href="/hq/finance/events" class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Top events</a>
			<a href="/hq/finance/vendors" class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Top vendors</a>
			<a href="/hq/finance/organizers" class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Top organizers</a>
			<a href="/hq/finance/disputes" class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Disputes</a>
		</div>

		<!-- Filters -->
		<div class="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 text-xs">
			<label class="flex flex-col gap-1"><span class="text-gray-500">From</span><input type="date" bind:value={from} class="rounded-md border border-gray-200 px-2 py-1.5" /></label>
			<label class="flex flex-col gap-1"><span class="text-gray-500">To</span><input type="date" bind:value={to} class="rounded-md border border-gray-200 px-2 py-1.5" /></label>
			<label class="flex flex-col gap-1"><span class="text-gray-500">Currency</span>
				<select bind:value={currency} class="rounded-md border border-gray-200 px-2 py-1.5"><option value="NGN">NGN</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select>
			</label>
			<label class="flex flex-col gap-1"><span class="text-gray-500">Bucket</span>
				<select bind:value={bucket} class="rounded-md border border-gray-200 px-2 py-1.5"><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select>
			</label>
			<label class="ml-2 flex items-center gap-2"><input type="checkbox" bind:checked={comparePrevYear} /><span class="text-gray-600">Compare previous year</span></label>
			<button on:click={loadAnalytics} class="ml-auto rounded-md bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Apply</button>
			<button on:click={handleExport} disabled={exporting} class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
				<Icon icon="mdi:download" class="inline" /> {exporting ? 'Exporting…' : 'Export CSV'}
			</button>
		</div>

		{#if analyticsError}<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{analyticsError}</p>{/if}

		{#if analyticsLoading}
			<div class="mt-6 grid gap-3 md:grid-cols-4">{#each [1,2,3,4] as _}<div class="h-24 animate-pulse rounded-xl bg-white"></div>{/each}</div>
		{:else if overview}
			<div class="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
				{#each [
					{ label: 'Net revenue', value: overview.netKobo, prev: overview.previousYear?.netKobo, color: 'text-green-700' },
					{ label: 'Ticket commission', value: overview.ticketCommissionKobo, prev: overview.previousYear?.ticketCommissionKobo, color: 'text-gray-900' },
					{ label: 'Vendor commission', value: overview.vendorCommissionKobo, prev: overview.previousYear?.vendorCommissionKobo, color: 'text-gray-900' },
					{ label: 'Subscription revenue', value: overview.subscriptionRevenueKobo, prev: overview.previousYear?.subscriptionRevenueKobo, color: 'text-gray-900' },
					{ label: 'FX revenue', value: overview.fxRevenueKobo, prev: overview.previousYear?.fxRevenueKobo, color: 'text-blue-700' },
					{ label: 'Refund returns', value: overview.refundReturnsKobo, prev: overview.previousYear?.refundReturnsKobo, color: 'text-red-700' },
				] as kpi}
					<div class="rounded-xl border bg-white p-4">
						<p class="text-xs uppercase text-gray-500">{kpi.label}</p>
						<p class="mt-1 text-xl font-semibold {kpi.color}">{formatMoney(kpi.value, overview.currency)}</p>
						{#if comparePrevYear && kpi.prev != null}<p class="mt-0.5 text-[10px] text-gray-500">{fmtDelta(kpi.value, kpi.prev)}</p>{/if}
					</div>
				{/each}
			</div>

			<section class="mt-6 rounded-xl border bg-white p-5">
				<h2 class="text-base font-semibold text-gray-900">Net revenue trend ({bucket})</h2>
				{#if !timeseries.length}<p class="mt-3 text-sm text-gray-400">No data in this window.</p>
				{:else}
					<div class="overflow-x-auto">
						<svg viewBox="0 0 {CHART_W} {CHART_H}" class="mt-3 w-full max-w-full" role="img" aria-label="Net revenue trend">
							<line x1={PADDING} y1={CHART_H - PADDING} x2={CHART_W - PADDING} y2={CHART_H - PADDING} stroke="#E5E7EB" />
							<line x1={PADDING} y1={PADDING} x2={PADDING} y2={CHART_H - PADDING} stroke="#E5E7EB" />
							<path d={linePath} stroke="#16A34A" stroke-width="2" fill="none" />
							{#each chartPoints as p}<circle cx={p.x} cy={p.y} r="3" fill="#16A34A" />{/each}
						</svg>
					</div>
					<p class="mt-2 text-xs text-gray-400">{timeseries.length} {bucket}{timeseries.length === 1 ? '' : 's'} · net of refunds.</p>
				{/if}
			</section>

			<section class="mt-6 rounded-xl border bg-white">
				<table class="min-w-full divide-y divide-gray-100 text-sm">
					<thead class="bg-gray-50 text-xs uppercase text-gray-500"><tr><th class="px-4 py-2 text-left font-medium">Source</th><th class="px-4 py-2 text-right font-medium">Amount</th><th class="px-4 py-2 text-right font-medium">% of net</th></tr></thead>
					<tbody class="divide-y divide-gray-100">
						{#each [
							{ label: 'Ticket commission', v: overview.ticketCommissionKobo },
							{ label: 'Vendor commission', v: overview.vendorCommissionKobo },
							{ label: 'Subscription revenue', v: overview.subscriptionRevenueKobo },
							{ label: 'FX revenue', v: overview.fxRevenueKobo },
							{ label: 'Refund returns', v: -overview.refundReturnsKobo },
						] as row}
							<tr>
								<td class="px-4 py-2 text-gray-700">{row.label}</td>
								<td class="px-4 py-2 text-right {row.v < 0 ? 'text-red-700' : 'text-gray-900'}">{formatMoney(row.v, overview.currency)}</td>
								<td class="px-4 py-2 text-right text-xs text-gray-500">{overview.netKobo ? `${((row.v / overview.netKobo) * 100).toFixed(1)}%` : '—'}</td>
							</tr>
						{/each}
						<tr class="bg-green-50 font-semibold"><td class="px-4 py-2 text-green-900">Net revenue</td><td class="px-4 py-2 text-right text-green-900">{formatMoney(overview.netKobo, overview.currency)}</td><td class="px-4 py-2 text-right text-green-900">100%</td></tr>
					</tbody>
				</table>
			</section>
		{/if}

	<!-- ═══ BENEFICIARIES TAB ═══ -->
	{:else if activeTab === 'beneficiaries'}
		<p class="mb-4 text-sm text-gray-500">Bank accounts pending review (cross-user duplicates, name mismatches, flagged adds).</p>
		{#if beneficiaryError}<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{beneficiaryError}</p>{/if}
		{#if beneficiaryLoading}
			<div class="space-y-2">{#each [1,2,3] as _}<div class="h-20 animate-pulse rounded-lg bg-white"></div>{/each}</div>
		{:else if beneficiaryItems.length === 0}
			<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
				<Icon icon="mdi:check-circle-outline" class="mb-2 text-4xl text-green-400" />
				<p class="text-lg font-medium text-gray-700">Queue empty</p>
				<p class="text-sm text-gray-400">No flagged bank accounts to review.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each beneficiaryItems as i}
					<div class="rounded-xl border bg-white p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="font-semibold">{i.userName ?? i.userEmail ?? 'User'}</p>
								{#if i.userEmail && i.userName}<p class="text-xs text-gray-400">{i.userEmail}</p>{/if}
								<dl class="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
									<div><dt class="text-gray-400">Bank</dt><dd class="text-gray-700">{i.bankName} ({i.bankCode})</dd></div>
									<div><dt class="text-gray-400">Account</dt><dd class="font-mono text-gray-700">{i.accountNumber}</dd></div>
									<div><dt class="text-gray-400">Submitted name</dt><dd class="text-gray-700">{i.accountName}</dd></div>
									{#if i.canonicalAccountName}<div><dt class="text-gray-400">Canonical name</dt><dd class="text-gray-700">{i.canonicalAccountName}</dd></div>{/if}
								</dl>
								{#if i.flagReason}<p class="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">Flag: {i.flagReason}</p>{/if}
							</div>
							<div class="flex items-center gap-2">
								<button on:click={() => approveBeneficiary(i.id)} disabled={beneficiaryProcessing === i.id} class="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Approve</button>
								<button on:click={() => rejectBeneficiary(i.id)} disabled={beneficiaryProcessing === i.id} class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

	<!-- ═══ AML TAB ═══ -->
	{:else if activeTab === 'aml'}
		<div class="mb-4 flex border-b">
			{#each [{ id: 'reviews', label: `Reviews (${amlReviews.length})` }, { id: 'alerts', label: `Alerts (${amlAlerts.length})` }, { id: 'export', label: 'CTR / STR export' }] as t}
				<button on:click={() => (amlActiveTab = t.id as AmlTab)} class="border-b-2 px-4 py-2 text-sm font-medium {amlActiveTab === t.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">{t.label}</button>
			{/each}
		</div>
		{#if amlError}<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{amlError}</p>{/if}
		{#if amlLoading}
			<div class="space-y-2">{#each [1,2,3] as _}<div class="h-20 animate-pulse rounded-lg bg-white"></div>{/each}</div>
		{:else if amlActiveTab === 'reviews'}
			{#if amlReviews.length === 0}
				<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white"><Icon icon="mdi:check-circle-outline" class="mb-2 text-4xl text-green-400" /><p class="text-lg font-medium text-gray-700">No pending reviews</p></div>
			{:else}
				<div class="space-y-3">
					{#each amlReviews as r}
						<div class="rounded-xl border bg-white p-4">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p class="font-semibold">{r.userName ?? r.userEmail ?? 'User'}</p>
									<p class="text-xs text-gray-500">{r.threshold.replace(/_/g, ' ').toLowerCase()} — {formatMoney(r.amountKobo, r.currency)}</p>
									<p class="mt-1 text-xs text-gray-400">Opened {new Date(r.openedAt).toLocaleString()}</p>
								</div>
								<div class="flex items-center gap-2">
									<button on:click={() => approveReview(r.id)} disabled={amlProcessing === r.id} class="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Approve</button>
									<button on:click={() => rejectReview(r.id)} disabled={amlProcessing === r.id} class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else if amlActiveTab === 'alerts'}
			{#if amlAlerts.length === 0}
				<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white"><Icon icon="mdi:check-circle-outline" class="mb-2 text-4xl text-green-400" /><p class="text-lg font-medium text-gray-700">No open alerts</p></div>
			{:else}
				<div class="space-y-3">
					{#each amlAlerts as a}
						<div class="rounded-xl border bg-white p-4">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p class="font-semibold">{a.userName ?? a.userEmail ?? 'User'}</p>
									<p class="text-xs text-gray-500">{a.type}</p>
									<p class="mt-1 text-xs text-gray-400">Opened {new Date(a.openedAt).toLocaleString()}</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {severityColor(a.severity)}">{a.severity}</span>
									<button on:click={() => clearAmlAlert(a.id)} disabled={amlProcessing === a.id} class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">Clear</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="max-w-md rounded-xl border bg-white p-6">
				<h2 class="text-lg font-semibold">CTR / STR export</h2>
				<p class="mt-1 text-sm text-gray-500">Monthly cash & suspicious transaction reports.</p>
				<div class="mt-4"><label for="export-month" class="text-xs text-gray-500">Month</label><input id="export-month" type="month" bind:value={exportMonth} class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none" /></div>
				<button on:click={downloadAmlReport} disabled={amlExporting} class="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{amlExporting ? 'Generating…' : 'Download CSV'}</button>
			</div>
		{/if}

	<!-- ═══ WALLET AUDIT TAB ═══ -->
	{:else if activeTab === 'wallet-audit'}
		<div class="mx-auto max-w-3xl">
			<p class="mb-6 text-sm text-gray-500">
				Look up the hash-chained ledger for a single wallet. Each entry carries <code class="text-xs">previousHash</code> and
				<code class="text-xs">entryHash</code>; the chain verifier walks them from genesis and reports tampering.
			</p>
			<form on:submit|preventDefault={openWalletAudit} class="rounded-xl border bg-white p-4">
				<label for="wallet-id" class="mb-1 block text-xs font-medium text-gray-700">Wallet ID</label>
				<div class="flex gap-2">
					<input id="wallet-id" type="text" bind:value={walletId} placeholder="6650f1a1c0d2…" class="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none" />
					<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
						<Icon icon="mdi:magnify" class="inline text-base" /> Open
					</button>
				</div>
				{#if walletAuditError}<p class="mt-2 text-xs text-red-500">{walletAuditError}</p>{/if}
			</form>
		</div>
	{/if}
</div>
