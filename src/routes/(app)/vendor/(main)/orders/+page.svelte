<!--
	FE-P2-02-B — Vendor orders dashboard.

	Backend reference:
	  - GET   /api/v1/products/me/orders               (vendor)
	  - PATCH /api/v1/products/orders/:id/fulfill      (vendor mark-as-fulfilled)
-->
<script lang="ts">
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import {
		listMyVendorOrders,
		markOrderFulfilled,
		type ProductOrder,
		type ProductOrderStatus,
	} from '$lib/services/marketplace.services';
	import { toast } from '$lib/stores/toast.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	const FILTER_STATUSES: Array<ProductOrderStatus | 'ALL'> = [
		'ALL',
		'PENDING',
		'PAID',
		'FULFILLED',
		'REFUNDED',
		'CANCELED',
	];

	let orders: ProductOrder[] = [];
	let activeStatus: ProductOrderStatus | 'ALL' = 'ALL';
	let loading = true;
	let error = '';
	let fulfilling: Record<string, boolean> = {};

	$: ({} = activeStatus); // ensure reactivity
	$: load(activeStatus);

	async function load(status: ProductOrderStatus | 'ALL') {
		loading = true;
		error = '';
		try {
			const result = await listMyVendorOrders({
				status: status === 'ALL' ? undefined : status,
				limit: 50,
			});
			orders = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
			orders = [];
		} finally {
			loading = false;
		}
	}

	async function handleFulfill(orderId: string) {
		fulfilling = { ...fulfilling, [orderId]: true };
		try {
			await markOrderFulfilled(orderId);
			toast.success('Order marked as fulfilled. Customer notified.');
			await load(activeStatus);
		} catch (e: any) {
			toast.error(financialErrorMessage(e));
		} finally {
			fulfilling = { ...fulfilling, [orderId]: false };
		}
	}

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});
		} catch {
			return iso;
		}
	}
</script>

<svelte:head><title>Orders — Vendor dashboard</title></svelte:head>

<div class="min-h-screen w-full text-[#101828]">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Orders</h1>
		<p class="mt-1 text-sm text-gray-500">Marketplace purchases and bookings from customers.</p>
	</div>

	<div class="mb-4 flex flex-wrap items-center gap-2">
		{#each FILTER_STATUSES as s}
			<button
				on:click={() => (activeStatus = s)}
				class="rounded-full border px-3 py-1 text-xs font-medium transition {activeStatus === s
					? 'border-pink-500 bg-pink-50 text-pink-700'
					: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}"
			>
				{s.replace('_', ' ')}
			</button>
		{/each}
	</div>

	{#if error}
		<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="flex animate-pulse items-center gap-4 rounded-lg bg-white p-4">
					<div class="h-10 w-10 rounded-lg bg-gray-200"></div>
					<div class="h-4 w-40 rounded bg-gray-200"></div>
					<div class="ml-auto h-4 w-20 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if orders.length === 0}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:basket-outline" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No orders yet</p>
			<p class="mt-1 text-sm text-gray-400">
				When customers buy your products or book services, they'll show up here.
			</p>
		</div>
	{:else}
		<div class="overflow-visible rounded-xl bg-white shadow-sm">
			<div class="hidden border-b px-4 py-3 text-xs font-medium text-gray-400 lg:flex">
				<div class="w-1/4">Customer</div>
				<div class="w-1/4">Product</div>
				<div class="w-1/6">Date</div>
				<div class="w-1/6">Status</div>
				<div class="w-1/6 text-right">Amount</div>
				<div class="w-1/6 text-right">Action</div>
			</div>
			{#each orders as o}
				<div
					class="flex flex-col gap-2 border-b px-4 py-3 last:border-none lg:flex-row lg:items-center lg:gap-0"
				>
					<div class="lg:w-1/4">
						<p class="text-sm font-medium">{o.customerName ?? o.customerEmail ?? 'Customer'}</p>
						{#if o.customerEmail}
							<p class="truncate text-xs text-gray-400">{o.customerEmail}</p>
						{/if}
					</div>
					<div class="lg:w-1/4">
						<p class="truncate text-sm">{o.productName}</p>
						{#if o.bookingSlotStart}
							<p class="text-xs text-gray-400">
								Slot {new Date(o.bookingSlotStart).toLocaleString()}
							</p>
						{:else if o.quantity}
							<p class="text-xs text-gray-400">Qty {o.quantity}</p>
						{/if}
					</div>
					<div class="text-sm text-gray-500 lg:w-1/6">{formatDate(o.createdAt)}</div>
					<div class="lg:w-1/6"><TransactionStatusBadge status={o.status} /></div>
					<div class="text-sm font-medium lg:w-1/6 lg:text-right">
						{formatMoney(o.amountKobo, o.currency)}
						<span class="ml-1 text-[10px] text-gray-400">{o.currency}</span>
					</div>
					<div class="lg:w-1/6 lg:text-right">
						{#if o.status === 'PAID'}
							<button
								on:click={() => handleFulfill(o.id)}
								disabled={!!fulfilling[o.id]}
								class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
							>
								{fulfilling[o.id] ? 'Marking…' : 'Mark fulfilled'}
							</button>
						{:else}
							<a
								href={`/vendor/orders/${o.id}`}
								class="rounded-md bg-[#EBECED] px-3 py-1.5 text-xs font-medium text-[#616265] hover:bg-gray-200"
							>
								View
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
