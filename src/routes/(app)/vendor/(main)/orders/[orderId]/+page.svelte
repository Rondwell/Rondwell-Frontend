<!--
	FE-P2-02-B — Vendor order detail.

	Single order view with mark-as-fulfilled, customer info, payment
	gateway reference and (when ready) the receipt link.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import {
		getMyVendorOrder,
		markOrderFulfilled,
		type ProductOrder,
	} from '$lib/services/marketplace.services';
	import { toast } from '$lib/stores/toast.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import { openReceipt } from '$lib/utils/receipt';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: orderId = $page.params.orderId;
	let order: ProductOrder | null = null;
	let loading = true;
	let error = '';
	let fulfilling = false;
	let receiptError = '';

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			order = await getMyVendorOrder(orderId);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	async function handleFulfill() {
		if (!order) return;
		fulfilling = true;
		try {
			await markOrderFulfilled(order.id);
			toast.success('Order marked as fulfilled. Customer notified.');
			await load();
		} catch (e: any) {
			toast.error(financialErrorMessage(e));
		} finally {
			fulfilling = false;
		}
	}
</script>

<svelte:head><title>Order — Vendor dashboard</title></svelte:head>

<div class="max-w-3xl">
	<button
		on:click={() => goto('/vendor/orders')}
		class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" /> Back to orders
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
					<p class="text-xs text-gray-400">Order #{order.id}</p>
				</div>
				<TransactionStatusBadge status={order.status} />
			</div>

			<dl class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<dt class="text-xs uppercase tracking-wide text-gray-400">Customer</dt>
					<dd class="text-sm text-gray-800">{order.customerName ?? order.customerEmail ?? '—'}</dd>
					{#if order.customerEmail && order.customerName}
						<dd class="text-xs text-gray-400">{order.customerEmail}</dd>
					{/if}
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wide text-gray-400">Amount</dt>
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
				{#if order.quantity}
					<div>
						<dt class="text-xs uppercase tracking-wide text-gray-400">Quantity</dt>
						<dd class="text-sm text-gray-800">{order.quantity}</dd>
					</div>
				{/if}
			</dl>

			<div class="mt-6 flex flex-wrap items-center gap-2">
				{#if order.status === 'PAID'}
					<button
						on:click={handleFulfill}
						disabled={fulfilling}
						class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
					>
						{fulfilling ? 'Marking…' : 'Mark as fulfilled'}
					</button>
				{/if}
				<!-- FE-P4-04 — Receipt link. Falls back to the presigned URL endpoint. -->
				{#if order.receiptUrl}
					<a
						href={order.receiptUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						View receipt
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
			</div>
			{#if receiptError}
				<p class="mt-3 rounded-md bg-yellow-50 p-3 text-xs text-yellow-700">{receiptError}</p>
			{/if}
		</div>
	{/if}
</div>
