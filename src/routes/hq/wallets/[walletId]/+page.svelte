<!--
	FE-P4-01 (P4-01) — Wallet detail with frozen badge + unfreeze action.

	Shows the full balance breakdown for a wallet (per currency, including
	disputedReserve from P4-05) and exposes the super-admin "Unfreeze" CTA
	when a recon job has frozen it.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import {
		getReconWallet,
		unfreezeWallet,
		type ReconWalletDetail,
	} from '$lib/services/reconciliation.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: walletId = $page.params.walletId;

	let wallet: ReconWalletDetail | null = null;
	let loading = true;
	let error = '';
	let unfreezing = false;
	let unfreezeNote = '';
	let showUnfreezeConfirm = false;

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			wallet = await getReconWallet(walletId);
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	async function handleUnfreeze() {
		if (!unfreezeNote.trim()) {
			error = 'Please add a note before unfreezing.';
			return;
		}
		unfreezing = true;
		try {
			await unfreezeWallet(walletId, unfreezeNote.trim());
			showUnfreezeConfirm = false;
			unfreezeNote = '';
			await load();
		} catch (e) {
			error = financialErrorMessage(e);
		} finally {
			unfreezing = false;
		}
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}

	$: currencies = wallet ? Object.keys(wallet.balance) : [];
</script>

<svelte:head><title>Wallet detail — Rondwell HQ</title></svelte:head>

<div>
	<a href="/hq/reconciliation" class="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
		<Icon icon="mdi:arrow-left" /> Back to recon
	</a>

	{#if loading}
		<div class="mt-4 h-32 animate-pulse rounded-lg bg-white"></div>
	{:else if error}
		<p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{:else if wallet}
		<header class="mt-4 rounded-xl border bg-white p-5">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="text-xs uppercase text-gray-500">Wallet #{wallet.walletId}</p>
					<h1 class="mt-1 text-xl font-semibold text-gray-900">
						{wallet.userName ?? wallet.userEmail ?? 'Wallet'}
					</h1>
					{#if wallet.userEmail && wallet.userName}
						<p class="text-xs text-gray-500">{wallet.userEmail}</p>
					{/if}
				</div>
				{#if wallet.frozen}
					<span class="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
						<Icon icon="mdi:snowflake" /> Frozen
					</span>
				{:else}
					<span class="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
						<Icon icon="mdi:check-circle" /> Active
					</span>
				{/if}
			</div>

			{#if wallet.frozen}
				<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
					<p class="text-sm font-semibold text-red-900">Wallet is frozen</p>
					{#if wallet.frozenReason}
						<p class="mt-1 text-xs text-red-700">{wallet.frozenReason}</p>
					{/if}
					{#if wallet.frozenAt}
						<p class="mt-0.5 text-xs text-red-600">Since {fmtDate(wallet.frozenAt)}</p>
					{/if}
					<p class="mt-2 text-[11px] text-red-600">
						The user sees a neutral banner: "Your wallet is temporarily on hold while we verify activity. Contact support."
					</p>

					{#if !showUnfreezeConfirm}
						<button
							on:click={() => (showUnfreezeConfirm = true)}
							class="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
						>
							Unfreeze wallet
						</button>
					{:else}
						<div class="mt-3 rounded-md border border-red-200 bg-white p-3">
							<label for="unfreeze-note" class="text-xs font-medium text-red-900">
								Reason for unfreezing (audit log)
							</label>
							<textarea
								id="unfreeze-note"
								rows="2"
								bind:value={unfreezeNote}
								placeholder="Drift reconciled via compensating entry #..."
								class="mt-1 w-full rounded-md border border-red-200 px-2 py-1 text-xs"
							></textarea>
							<div class="mt-2 flex justify-end gap-2">
								<button
									on:click={() => {
										showUnfreezeConfirm = false;
										unfreezeNote = '';
									}}
									class="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs"
								>
									Cancel
								</button>
								<button
									on:click={handleUnfreeze}
									disabled={unfreezing || !unfreezeNote.trim()}
									class="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
								>
									{unfreezing ? 'Unfreezing…' : 'Confirm unfreeze'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<dl class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div>
					<dt class="text-xs text-gray-500">Last recon</dt>
					<dd class="mt-0.5 text-sm text-gray-700">{fmtDate(wallet.lastReconAt)}</dd>
				</div>
				<div>
					<dt class="text-xs text-gray-500">Status</dt>
					<dd class="mt-0.5 text-sm text-gray-700">{wallet.lastReconStatus ?? '—'}</dd>
				</div>
				{#if wallet.lastDriftKobo != null}
					<div class="sm:col-span-2">
						<dt class="text-xs text-gray-500">Last drift</dt>
						<dd class="mt-0.5 text-sm font-semibold text-orange-700">
							{formatMoney(wallet.lastDriftKobo, currencies[0] ?? 'NGN')}
						</dd>
					</div>
				{/if}
			</dl>
		</header>

		<section class="mt-6">
			<h2 class="text-base font-semibold text-gray-900">Balance breakdown</h2>
			<div class="mt-3 space-y-3">
				{#each currencies as ccy}
					<div class="rounded-xl border bg-white p-4">
						<div class="flex items-center justify-between">
							<span class="font-medium text-gray-900">{ccy}</span>
							<span class="text-lg font-semibold text-gray-900">
								{formatMoney(wallet.balance[ccy] ?? 0, ccy)}
							</span>
						</div>
						<dl class="mt-3 grid grid-cols-3 gap-2 text-xs">
							<div>
								<dt class="text-gray-500">Reserved</dt>
								<dd class="mt-0.5 text-gray-700">{formatMoney(wallet.reservedBalance?.[ccy] ?? 0, ccy)}</dd>
							</div>
							<div>
								<dt class="text-gray-500">Disputed</dt>
								<dd class="mt-0.5 text-gray-700">{formatMoney(wallet.disputedReserve?.[ccy] ?? 0, ccy)}</dd>
							</div>
							<div>
								<dt class="text-gray-500">Available</dt>
								<dd class="mt-0.5 font-medium text-green-700">{formatMoney(wallet.availableBalance?.[ccy] ?? 0, ccy)}</dd>
							</div>
						</dl>
					</div>
				{/each}
			</div>
		</section>

		<section class="mt-6">
			<h2 class="text-base font-semibold text-gray-900">Audit trail</h2>
			<a
				href={`/hq/wallet-audit/${wallet.walletId}`}
				class="mt-2 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-gray-50"
			>
				<Icon icon="mdi:link-variant" /> View hash-chained audit log
			</a>
		</section>
	{/if}
</div>
