<!--
	FE-P3-09 (NEW-9.1) — Wallet audit log: search by walletId.

	Super-admin only. Drops the user into the per-wallet detail page
	(`hq/wallet-audit/[walletId]`) which renders ledger entries with their
	previousHash / entryHash and exposes a "Verify chain" CTA.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	let walletId = '';
	let error = '';

	function open() {
		const id = walletId.trim();
		if (!id) {
			error = 'Enter a wallet ID.';
			return;
		}
		goto(`/hq/wallet-audit/${encodeURIComponent(id)}`);
	}
</script>

<svelte:head>
	<title>Wallet Audit · HQ</title>
</svelte:head>

<div class="mx-auto max-w-3xl p-6">
	<h1 class="mb-1 text-2xl font-bold">Wallet audit log</h1>
	<p class="mb-6 text-sm text-gray-500">
		Look up the hash-chained ledger for a single wallet. Each entry carries `previousHash` and
		`entryHash`; the chain verifier walks them from genesis and reports tampering.
	</p>

	<form on:submit|preventDefault={open} class="rounded-xl border bg-white p-4">
		<label for="wallet-id" class="mb-1 block text-xs font-medium text-gray-700">Wallet ID</label>
		<div class="flex gap-2">
			<input
				id="wallet-id"
				type="text"
				bind:value={walletId}
				placeholder="6650f1a1c0d2…"
				class="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
			/>
			<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
				<Icon icon="mdi:magnify" class="inline text-base" /> Open
			</button>
		</div>
		{#if error}<p class="mt-2 text-xs text-red-500">{error}</p>{/if}
	</form>
</div>
