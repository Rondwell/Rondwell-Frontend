<!--
	FE-P2-02-D — Booking calendar page.

	Wraps `BookingCalendar` for service products. Reservation flow:
	1. Pick a slot → calendar reserves it (RESERVED) and starts a 30 min countdown.
	2. Continue to checkout → redirect to gateway.
	3. Cancel / close → release the slot.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import BookingCalendar from '$lib/components/BookingCalendar.svelte';
	import {
		getMarketplaceProduct,
		type MarketplaceProduct,
	} from '$lib/services/marketplace.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: productId = $page.params.productId;
	let product: MarketplaceProduct | null = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			product = await getMarketplaceProduct(productId);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Book {product?.productName ?? 'service'} — Rondwell</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<button
		on:click={() => goto(`/marketplace/${productId}`)}
		class="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" /> Back to product
	</button>

	{#if loading}
		<div class="animate-pulse space-y-3">
			<div class="h-8 w-3/4 rounded bg-gray-200"></div>
			<div class="h-40 w-full rounded bg-gray-100"></div>
		</div>
	{:else if error}
		<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{:else if product}
		<div class="mb-6">
			<h1 class="text-2xl font-bold sm:text-3xl">Book {product.productName}</h1>
			{#if product.vendorName}
				<p class="mt-1 text-sm text-gray-500">by {product.vendorName}</p>
			{/if}
			<p class="mt-2 text-lg font-semibold text-gray-900">
				{formatMoney(product.priceKobo, product.currency)} per slot
			</p>
		</div>

		<BookingCalendar
			productId={product.id}
			productName={product.productName}
			successCallbackUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/account/purchases?status=success`}
			failureCallbackUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/marketplace/${product.id}/book?status=failed`}
		/>
	{/if}
</div>
