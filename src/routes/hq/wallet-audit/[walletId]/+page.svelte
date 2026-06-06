<!--
	FE-P3-09 (NEW-9.1) — Wallet audit log: per-wallet detail.

	Renders the hash-chained ledger entries for a wallet with previousHash /
	entryHash visible. The "Verify chain" CTA hits
	POST /api/v1/payment/admin/wallet/:walletId/audit/verify?fromGenesis=true
	and surfaces VERIFIED / TAMPERED state.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import {
		getWalletAudit,
		verifyWalletAuditChain,
		type WalletAuditEntry,
	} from '$lib/services/wallet.services';
	import { formatMoney } from '$lib/utils/money';
	import { COMMON_TIMEZONES, getBrowserTz } from '$lib/utils/tz';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: walletId = $page.params.walletId ?? '';

	let entries: WalletAuditEntry[] = [];
	let nextCursor: string | null = null;
	let hasMore = false;
	let loading = true;
	let loadingMore = false;
	let chainStatus: 'VERIFIED' | 'TAMPERED' | 'UNKNOWN' = 'UNKNOWN';
	let verifying = false;
	let verifyError = '';
	let verifyResult: { status: 'VERIFIED' | 'TAMPERED'; tamperedAt?: string | null; entriesChecked: number } | null = null;

	let from = '';
	let to = '';
	let timezone = getBrowserTz();
	let showTzDropdown = false;

	onMount(async () => {
		await load();
	});

	async function load(cursor: string | null = null) {
		if (cursor) loadingMore = true;
		else loading = true;
		try {
			const page = await getWalletAudit(walletId, {
				cursor,
				limit: 50,
				from: from || undefined,
				to: to || undefined,
				tz: timezone,
			});
			if (cursor) entries = [...entries, ...page.items];
			else entries = page.items;
			nextCursor = page.nextCursor;
			hasMore = page.hasMore;
			chainStatus = page.chainStatus;
		} catch (e: any) {
			verifyError = e?.message ?? 'Failed to load audit entries.';
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	async function runVerify() {
		verifying = true;
		verifyError = '';
		verifyResult = null;
		try {
			verifyResult = await verifyWalletAuditChain(walletId, true);
			chainStatus = verifyResult.status;
		} catch (e: any) {
			verifyError = e?.message ?? 'Failed to verify chain.';
		} finally {
			verifying = false;
		}
	}

	function fmtDate(iso: string): string {
		try {
			return new Date(iso).toLocaleString(undefined, { timeZone: timezone });
		} catch {
			return iso;
		}
	}

	function shortHash(h: string): string {
		if (!h) return '—';
		return h.length > 16 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;
	}
</script>

<svelte:head>
	<title>Audit · {walletId} · HQ</title>
</svelte:head>

<div class="mx-auto max-w-6xl p-4 sm:p-6">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-xl font-bold sm:text-2xl">Wallet audit</h1>
			<p class="mt-0.5 text-xs text-gray-500 break-all">{walletId}</p>
		</div>
		<div class="flex items-center gap-2">
			{#if chainStatus === 'VERIFIED'}
				<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
					<Icon icon="mdi:shield-check" class="inline text-sm" /> Chain integrity: ✓ Verified
				</span>
			{:else if chainStatus === 'TAMPERED'}
				<span class="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
					<Icon icon="mdi:shield-alert" class="inline text-sm" /> Chain integrity: ✗ Tampered
				</span>
			{:else}
				<span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
					<Icon icon="mdi:shield-outline" class="inline text-sm" /> Chain integrity: unknown
				</span>
			{/if}
			<button
				on:click={runVerify}
				disabled={verifying}
				class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40"
			>
				{verifying ? 'Verifying…' : 'Verify chain'}
			</button>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex flex-wrap items-end gap-2 rounded-xl border bg-white p-3">
		<div>
			<label class="mb-1 block text-[10px] font-medium text-gray-500" for="from">From</label>
			<input id="from" type="datetime-local" bind:value={from} class="rounded-md border border-gray-200 px-2 py-1 text-xs" />
		</div>
		<div>
			<label class="mb-1 block text-[10px] font-medium text-gray-500" for="to">To</label>
			<input id="to" type="datetime-local" bind:value={to} class="rounded-md border border-gray-200 px-2 py-1 text-xs" />
		</div>
		<div use:clickOutside={() => (showTzDropdown = false)} class="relative">
			<button on:click={() => (showTzDropdown = !showTzDropdown)} class="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
				<Icon icon="mdi:earth" class="text-sm" /> {timezone}
			</button>
			{#if showTzDropdown}
				<div class="absolute z-20 mt-1 max-h-72 w-56 overflow-auto rounded-lg border bg-white shadow-lg">
					{#each COMMON_TIMEZONES as tz}
						<button on:click={() => { timezone = tz.value; showTzDropdown = false; }} class="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 {timezone === tz.value ? 'font-medium text-pink-600' : ''}">{tz.label}</button>
					{/each}
				</div>
			{/if}
		</div>
		<button on:click={() => load()} class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white">Apply</button>
	</div>

	{#if verifyResult}
		<div class="mb-3 rounded-md border {verifyResult.status === 'VERIFIED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'} p-3 text-xs">
			Verifier walked {verifyResult.entriesChecked} entries — {verifyResult.status}
			{#if verifyResult.status === 'TAMPERED' && verifyResult.tamperedAt}· first divergence at <span class="font-mono">{verifyResult.tamperedAt}</span>{/if}
		</div>
	{/if}
	{#if verifyError}
		<div class="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{verifyError}</div>
	{/if}

	{#if loading}
		<div class="space-y-2">
			{#each [1, 2, 3, 4, 5] as _}
				<div class="h-12 animate-pulse rounded-lg bg-gray-100"></div>
			{/each}
		</div>
	{:else if entries.length === 0}
		<div class="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed">
			<Icon icon="mdi:database-search-outline" class="mb-2 text-3xl text-gray-300" />
			<p class="text-sm text-gray-500">No audit entries for this filter.</p>
		</div>
	{:else}
		<div class="overflow-auto rounded-xl border bg-white">
			<table class="w-full text-xs">
				<thead class="bg-gray-50 text-gray-500">
					<tr>
						<th class="px-3 py-2 text-left font-medium">Date</th>
						<th class="px-3 py-2 text-left font-medium">Type</th>
						<th class="px-3 py-2 text-right font-medium">Amount</th>
						<th class="px-3 py-2 text-right font-medium">Balance after</th>
						<th class="px-3 py-2 text-left font-medium">Previous hash</th>
						<th class="px-3 py-2 text-left font-medium">Entry hash</th>
					</tr>
				</thead>
				<tbody>
					{#each entries as e}
						<tr class="border-t hover:bg-gray-50">
							<td class="px-3 py-2 whitespace-nowrap">{fmtDate(e.createdAt)}</td>
							<td class="px-3 py-2">{e.type}</td>
							<td class="px-3 py-2 text-right">{formatMoney(e.amountKobo, e.currency)}</td>
							<td class="px-3 py-2 text-right">{formatMoney(e.balanceAfterKobo, e.currency)}</td>
							<td class="px-3 py-2 font-mono text-[10px]" title={e.previousHash}>{shortHash(e.previousHash)}</td>
							<td class="px-3 py-2 font-mono text-[10px]" title={e.entryHash}>{shortHash(e.entryHash)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if hasMore}
			<div class="mt-3 flex justify-center">
				<button
					on:click={() => load(nextCursor)}
					disabled={loadingMore}
					class="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-40"
				>
					{loadingMore ? 'Loading…' : 'Load more'}
				</button>
			</div>
		{/if}
	{/if}
</div>
