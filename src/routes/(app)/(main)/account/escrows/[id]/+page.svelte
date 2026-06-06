<!--
	FE-P2-03-B — Escrow detail.

	Shows a single escrow with the release timer, vendor + event context,
	and the "Open dispute" CTA when status is HELD.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import { getEscrow, type Escrow } from '$lib/services/escrow.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: escrowId = $page.params.id;
	let escrow: Escrow | null = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			escrow = await getEscrow(escrowId);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	});

	function daysUntil(iso?: string | null): number {
		if (!iso) return 0;
		const ms = new Date(iso).getTime() - Date.now();
		return Math.max(0, Math.ceil(ms / 86_400_000));
	}
</script>

<svelte:head><title>Escrow — Rondwell</title></svelte:head>

<div class="max-w-3xl">
	<button
		on:click={() => goto('/account/escrows')}
		class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" /> Back to escrows
	</button>

	{#if loading}
		<div class="animate-pulse space-y-3">
			<div class="h-8 w-2/3 rounded bg-gray-200"></div>
			<div class="h-32 rounded bg-gray-100"></div>
		</div>
	{:else if error}
		<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{:else if escrow}
		<div class="rounded-xl border bg-white p-6">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 class="text-xl font-semibold">
						{escrow.vendorName ?? 'Vendor'}
						{#if escrow.invoiceNumber}<span class="ml-1 text-xs font-normal text-gray-400">· {escrow.invoiceNumber}</span>{/if}
					</h1>
					{#if escrow.eventName}
						<p class="text-sm text-gray-500">for {escrow.eventName}</p>
					{/if}
				</div>
				<TransactionStatusBadge status={escrow.status} />
			</div>

			<dl class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<dt class="text-xs uppercase tracking-wide text-gray-400">Amount in escrow</dt>
					<dd class="text-2xl font-bold text-gray-900">
						{formatMoney(escrow.amountKobo, escrow.currency)}
					</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wide text-gray-400">Held since</dt>
					<dd class="text-sm text-gray-800">{new Date(escrow.heldAt).toLocaleString()}</dd>
				</div>
				{#if escrow.status === 'HELD'}
					<div>
						<dt class="text-xs uppercase tracking-wide text-gray-400">Releases on</dt>
						<dd class="text-sm text-gray-800">
							{new Date(escrow.releaseDueAt).toLocaleDateString()}
							<span class="text-amber-600">
								(in {daysUntil(escrow.releaseDueAt)} day{daysUntil(escrow.releaseDueAt) === 1 ? '' : 's'})
							</span>
						</dd>
					</div>
				{/if}
				{#if escrow.releasedAt}
					<div>
						<dt class="text-xs uppercase tracking-wide text-gray-400">Released</dt>
						<dd class="text-sm text-gray-800">{new Date(escrow.releasedAt).toLocaleString()}</dd>
					</div>
				{/if}
				{#if escrow.netToVendorKobo !== undefined}
					<div>
						<dt class="text-xs uppercase tracking-wide text-gray-400">Vendor payout</dt>
						<dd class="text-sm text-gray-800">
							{formatMoney(escrow.netToVendorKobo, escrow.currency)}
						</dd>
					</div>
				{/if}
				{#if escrow.platformFeeKobo !== undefined}
					<div>
						<dt class="text-xs uppercase tracking-wide text-gray-400">Platform fee</dt>
						<dd class="text-sm text-gray-800">
							{formatMoney(escrow.platformFeeKobo, escrow.currency)}
						</dd>
					</div>
				{/if}
			</dl>

			{#if escrow.dispute}
				<div class="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
					<p class="text-sm font-medium text-amber-900">Dispute open</p>
					<p class="mt-1 text-xs text-amber-800">
						Status: {escrow.dispute.status.replace(/_/g, ' ').toLowerCase()}
					</p>
					<p class="mt-2 text-xs italic text-amber-800">"{escrow.dispute.reason}"</p>
					{#if escrow.dispute.resolutionNote}
						<p class="mt-2 text-xs text-amber-700">
							Resolution: {escrow.dispute.resolutionNote}
						</p>
					{/if}
				</div>
			{:else if escrow.status === 'HELD'}
				<div class="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
					<p class="text-sm text-gray-700">
						If the vendor doesn't deliver, you can open a dispute before the release date. The funds
						stay in escrow until the platform reviews your claim.
					</p>
					<a
						href={`/account/escrows/${escrow.id}/dispute`}
						class="mt-3 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
					>
						Open dispute
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
