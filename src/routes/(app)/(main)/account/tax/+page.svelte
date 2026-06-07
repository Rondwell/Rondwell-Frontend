<!--
	FE-P4-03 (P4-03 / NEW-10.6) — Organizer VAT / TIN settings + quarterly export.

	Backend reference:
	  - GET  /api/v1/profile/organizer/tax
	  - PUT  /api/v1/profile/organizer/tax     (TIN)
	  - GET  /api/v1/payment/vat/summary
	  - GET  /api/v1/payment/vat/quarterly?period=YYYY-Qn  (FIRS-compatible CSV)

	A valid TIN is required before the organizer can publish a paid event.
-->
<script lang="ts">
	import { downloadBlob } from '$lib/services/finance.services';
	import {
		downloadVatReport,
		getOrganizerTaxInfo,
		getVatSummary,
		isValidNigerianTin,
		updateOrganizerTaxId,
		type OrganizerTaxInfo,
		type VatSummary,
	} from '$lib/services/tax.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import SettingsBackButton from '$lib/components/SettingsBackButton.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let info: OrganizerTaxInfo | null = null;
	let summary: VatSummary | null = null;
	let loading = true;
	let saving = false;
	let downloadingPeriod = '';
	let error = '';
	let success = '';

	let tinInput = '';

	const today = new Date();
	const year = today.getFullYear();
	const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
	let selectedYear = year;
	let selectedQuarter: 1 | 2 | 3 | 4 = currentQuarter as 1 | 2 | 3 | 4;
	$: selectedPeriod = `${selectedYear}-Q${selectedQuarter}`;

	onMount(load);

	async function load() {
		loading = true;
		try {
			[info, summary] = await Promise.all([
				getOrganizerTaxInfo(),
				getVatSummary().catch(() => null),
			]);
			tinInput = info?.taxId ?? '';
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	async function handleSave() {
		error = '';
		success = '';
		const stripped = tinInput.replace(/[\s-]/g, '');
		if (!isValidNigerianTin(stripped)) {
			error = 'Enter a valid TIN — 8 to 14 digits.';
			return;
		}
		saving = true;
		try {
			info = await updateOrganizerTaxId(stripped);
			success = 'TIN saved. We\'ll verify it with FIRS within 24h.';
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			saving = false;
		}
	}

	async function handleDownload() {
		downloadingPeriod = selectedPeriod;
		error = '';
		try {
			const blob = await downloadVatReport(selectedPeriod);
			downloadBlob(blob, `vat-report-${selectedPeriod}.csv`);
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			downloadingPeriod = '';
		}
	}

	function statusBadge(s: OrganizerTaxInfo['taxIdStatus']): { label: string; cls: string } {
		switch (s) {
			case 'VERIFIED':
				return { label: 'Verified', cls: 'bg-green-100 text-green-700' };
			case 'PENDING_VERIFICATION':
				return { label: 'Pending verification', cls: 'bg-yellow-100 text-yellow-700' };
			case 'INVALID':
				return { label: 'Invalid', cls: 'bg-red-100 text-red-700' };
			default:
				return { label: 'Not set', cls: 'bg-gray-100 text-gray-600' };
		}
	}
</script>

<svelte:head><title>Tax & VAT — Rondwell</title></svelte:head>

<div class="max-w-3xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl">Tax & VAT</h1>
		<p class="mt-1 text-sm text-[#8C8F93]">
			Provide your Tax Identification Number (TIN) so we can issue VAT-inclusive receipts and
			generate FIRS-compatible quarterly reports for paid events in Nigeria.
		</p>
	</div>

	{#if loading}
		<div class="h-32 animate-pulse rounded-xl bg-white"></div>
	{:else}
		<!-- TIN -->
		<section class="rounded-xl bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-semibold">Tax Identification Number</h2>
				{#if info}
					<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {statusBadge(info.taxIdStatus).cls}">
						{statusBadge(info.taxIdStatus).label}
					</span>
				{/if}
			</div>

			<label class="mt-4 block text-sm">
				<span class="font-medium text-gray-700">TIN</span>
				<input
					type="text"
					bind:value={tinInput}
					placeholder="e.g. 12345678 or 1234567890"
					class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
				/>
				<span class="mt-1 block text-xs text-gray-500">
					Nigerian TIN: 8 digits (legacy) or 10–14 digits (new). Spaces and dashes are stripped
					automatically.
				</span>
			</label>

			{#if error}
				<p class="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-600">{error}</p>
			{/if}
			{#if success}
				<p class="mt-3 rounded-md bg-green-50 p-3 text-xs text-green-700">{success}</p>
			{/if}

			<div class="mt-4 flex items-center justify-end">
				<button
					on:click={handleSave}
					disabled={saving || !tinInput.trim()}
					class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
				>
					{saving ? 'Saving…' : info?.taxId ? 'Update TIN' : 'Save TIN'}
				</button>
			</div>

			{#if !info?.canPublishPaidEvents}
				<p class="mt-4 rounded-md bg-orange-50 p-3 text-xs text-orange-700">
					<Icon icon="mdi:alert-outline" class="inline" /> A verified TIN is required before you can publish paid events.
				</p>
			{/if}
		</section>

		<!-- VAT summary -->
		{#if summary}
			<section class="mt-6 rounded-xl bg-white p-5 shadow-sm">
				<h2 class="text-base font-semibold">VAT collected</h2>
				<p class="mt-1 text-xs text-gray-500">
					Period: {summary.periodStart?.slice(0, 10)} → {summary.periodEnd?.slice(0, 10)}
				</p>
				<dl class="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
					<div>
						<dt class="text-xs text-gray-500">Taxable amount</dt>
						<dd class="mt-0.5 font-semibold">{formatMoney(summary.taxableAmountKobo, summary.currency)}</dd>
					</div>
					<div>
						<dt class="text-xs text-gray-500">VAT collected</dt>
						<dd class="mt-0.5 font-semibold text-green-700">{formatMoney(summary.vatCollectedKobo, summary.currency)}</dd>
					</div>
					<div>
						<dt class="text-xs text-gray-500">Remitted</dt>
						<dd class="mt-0.5 font-semibold">{formatMoney(summary.remittedKobo, summary.currency)}</dd>
					</div>
					<div>
						<dt class="text-xs text-gray-500">Outstanding</dt>
						<dd class="mt-0.5 font-semibold text-orange-700">{formatMoney(summary.outstandingKobo, summary.currency)}</dd>
					</div>
				</dl>
				<p class="mt-3 text-xs text-gray-400">
					{summary.taxableTransactions.toLocaleString()} taxable transactions
				</p>
			</section>
		{/if}

		<!-- Quarterly export -->
		<section class="mt-6 rounded-xl bg-white p-5 shadow-sm">
			<h2 class="text-base font-semibold">Quarterly VAT report (FIRS)</h2>
			<p class="mt-1 text-xs text-gray-500">
				Download a FIRS-compatible CSV with every taxable transaction in the period.
			</p>
			<div class="mt-4 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1 text-xs">
					<span class="text-gray-500">Year</span>
					<select bind:value={selectedYear} class="rounded-md border border-gray-200 px-2 py-1.5 text-sm">
						{#each [year, year - 1, year - 2] as y}
							<option value={y}>{y}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-xs">
					<span class="text-gray-500">Quarter</span>
					<select bind:value={selectedQuarter} class="rounded-md border border-gray-200 px-2 py-1.5 text-sm">
						<option value={1}>Q1 (Jan–Mar)</option>
						<option value={2}>Q2 (Apr–Jun)</option>
						<option value={3}>Q3 (Jul–Sep)</option>
						<option value={4}>Q4 (Oct–Dec)</option>
					</select>
				</label>
				<button
					on:click={handleDownload}
					disabled={downloadingPeriod === selectedPeriod}
					class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					<Icon icon="mdi:download" class="inline" />
					{downloadingPeriod === selectedPeriod ? 'Downloading…' : `Download ${selectedPeriod}`}
				</button>
			</div>
		</section>
	{/if}
</div>
