<!--
	FE-P2-02-C — Customer purchase detail.

	Linked from `PRODUCT_ORDER_CONFIRMATION` and `PRODUCT_ORDER_FULFILLED`
	emails. Shows order detail + a (future) refund-request button when
	within window.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import { getMyPurchase, type CustomerPurchase } from '$lib/services/marketplace.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import { openReceipt } from '$lib/utils/receipt';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: orderId = $page.params.orderId;
	let order: CustomerPurchase | null = null;
	let loading = true;
	let error = '';
	let receiptError = '';

	onMount(async () => {
		try {
			order = await getMyPurchase(orderId);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head><title>Purchase detail — Rondwell</title></svelte:head>

<div class="max-w-3xl">
	<button
		on:click={() => goto('/account/purchases')}
		class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" /> Back to purchases
	</button>

	{#if loading}
		<div class="animate-pulse space-y-3">
			<div class="h-8 w-2/3 rounded bg-gray-200"></div>
			<div class="h-32 rounded bg-gray-100"></div>
		</div>
	{:else if error}
		<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{:else if order}
		<div class="rounded-xl border bg-white p-6">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 class="text-xl font-semibold">{order.productName}</h1>
					{#if order.vendorName}
						<p class="text-xs text-gray-500">
							from {#if order.vendorSlug}<a href={`/v/${order.vendorSlug}`} class="text-pink-600 hover:underline">{order.vendorName}</a>{:else}{order.vendorName}{/if}
						</p>
					{/if}
					<p class="mt-1 text-xs text-gray-400">Order #{order.id}</p>
				</div>
				<TransactionStatusBadge status={order.status} />
			</div>

			<dl class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<dt class="text-xs uppercase tracking-wide text-gray-400">Amount paid</dt>
					<dd class="text-base font-semibold text-gray-900">
						{formatMoney(order.amountKobo, order.currency)}
					</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wide text-gray-400">Created</dt>
					<dd class="text-sm text-gray-800">{new Date(order.createdAt).toLocaleString()}</dd>
				</div>
				{#if order.paidAt}
					<div>
						<dt class="text-xs uppercase tracking-wide text-gray-400">Paid</dt>
						<dd class="text-sm text-gray-800">{new Date(order.paidAt).toLocaleString()}</dd>
					</div>
				{/if}
				{#if order.fulfilledAt}
					<div>
						<dt class="text-xs uppercase tracking-wide text-gray-400">Fulfilled</dt>
						<dd class="text-sm text-gray-800">{new Date(order.fulfilledAt).toLocaleString()}</dd>
					</div>
				{/if}
				{#if order.bookingSlotStart}
					<div>
						<dt class="text-xs uppercase tracking-wide text-gray-400">Booking slot</dt>
						<dd class="text-sm text-gray-800">
							{new Date(order.bookingSlotStart).toLocaleString()}
							{#if order.bookingSlotEnd}
								<span> – {new Date(order.bookingSlotEnd).toLocaleTimeString()}</span>
							{/if}
						</dd>
					</div>
				{/if}
			</dl>

			<div class="mt-6 flex flex-wrap items-center gap-2">
				<!-- FE-P4-04 — Receipt link. Falls back to presigned URL endpoint. -->
				{#if order.receiptUrl}
					<a
						href={order.receiptUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						<Icon icon="mdi:receipt-text-outline" class="inline" /> View receipt
					</a>
				{:else if order.status !== 'PENDING' && order.status !== 'CANCELED'}
					<button
						on:click={() => openReceipt(((order as any)?.transactionId ?? order!.id), { onError: (m) => (receiptError = m) })}
						class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						title="Receipts are generated within 60s of payment. Please refresh if not yet available."
					>
						<Icon icon="mdi:receipt-text-outline" class="inline" /> View receipt
					</button>
				{/if}
				<a
					href="/help-center?topic=refunds"
					class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Request refund
				</a>
			</div>
			{#if receiptError}
				<p class="mt-3 rounded-md bg-yellow-50 p-3 text-xs text-yellow-700">{receiptError}</p>
			{/if}
		</div>
	{/if}
</div>
