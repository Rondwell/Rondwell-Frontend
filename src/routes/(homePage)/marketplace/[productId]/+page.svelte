<!--
	FE-P2-02-A — Marketplace product detail.

	Renders product photos, description, vendor info, and a "Buy now" /
	"Book this slot" CTA. Guests pass `customerEmail`; auth users skip
	the email field.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		getMarketplaceProduct,
		purchaseProduct,
		type MarketplaceProduct,
	} from '$lib/services/marketplace.services';
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: productId = $page.params.productId;

	let product: MarketplaceProduct | null = null;
	let loading = true;
	let error = '';

	let activeImageIdx = 0;
	let quantity = 1;
	let guestEmail = '';
	let guestName = '';
	let purchasing = false;
	let purchaseError = '';

	$: isService = product?.pricingType === 'BOOKING';
	$: outOfStock = product && !product.unlimited && (product.stockQuantity ?? 0) <= 0;

	onMount(async () => {
		await loadProduct();
	});

	async function loadProduct() {
		loading = true;
		error = '';
		try {
			product = await getMarketplaceProduct(productId);
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	}

	async function handleBuy() {
		if (!product) return;
		if (!$isAuthenticated && !guestEmail) {
			purchaseError = 'Enter your email to continue as a guest.';
			return;
		}
		purchasing = true;
		purchaseError = '';
		try {
			const result = await purchaseProduct(product.id, {
				quantity,
				customerEmail: $isAuthenticated ? $authState.user?.email : guestEmail,
				customerName: guestName || undefined,
				successCallbackUrl: `${window.location.origin}/account/purchases?status=success`,
				failureCallbackUrl: `${window.location.origin}/marketplace/${product.id}?status=failed`,
				paymentGateway: product.currency === 'USD' ? 'STRIPE' : 'PAYSTACK',
			});
			if (result.checkoutUrl) {
				window.location.href = result.checkoutUrl;
				return;
			}
			throw new Error('No checkout URL received from gateway');
		} catch (e: any) {
			purchaseError = financialErrorMessage(e);
		} finally {
			purchasing = false;
		}
	}
</script>

<svelte:head>
	<title>{product?.productName ?? 'Product'} — Rondwell marketplace</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10">
	<button
		on:click={() => goto('/marketplace')}
		class="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" /> Back to marketplace
	</button>

	{#if loading}
		<div class="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-2">
			<div class="aspect-square w-full rounded-xl bg-gray-100"></div>
			<div class="space-y-3">
				<div class="h-8 w-3/4 rounded bg-gray-200"></div>
				<div class="h-6 w-1/2 rounded bg-gray-200"></div>
				<div class="h-32 w-full rounded bg-gray-100"></div>
			</div>
		</div>
	{:else if error}
		<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{:else if product}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Gallery -->
			<div>
				<div class="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
					{#if product.media?.[activeImageIdx]?.url}
						<img
							src={product.media[activeImageIdx].url}
							alt={product.productName}
							class="h-full w-full object-cover"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center text-gray-300">
							<Icon icon="mdi:image-off-outline" class="text-6xl" />
						</div>
					{/if}
				</div>
				{#if (product.media?.length ?? 0) > 1}
					<div class="mt-3 flex gap-2 overflow-x-auto">
						{#each product.media ?? [] as m, i}
							<button
								on:click={() => (activeImageIdx = i)}
								class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 {i === activeImageIdx
									? 'border-pink-500'
									: 'border-transparent'}"
							>
								<img src={m.url} alt={`${product.productName} ${i + 1}`} class="h-full w-full object-cover" />
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Detail -->
			<div>
				<h1 class="text-2xl font-bold sm:text-3xl">{product.productName}</h1>
				{#if product.vendorName}
					<a
						href={product.vendorSlug ? `/v/${product.vendorSlug}` : '#'}
						class="mt-1 inline-block text-sm text-pink-600 hover:underline"
					>
						by {product.vendorName}
					</a>
				{/if}

				<p class="mt-4 text-3xl font-bold text-gray-900">
					{formatMoney(product.priceKobo, product.currency)}
				</p>

				{#if product.description}
					<p class="mt-4 leading-relaxed text-gray-600">{product.description}</p>
				{/if}

				<div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
					{#if product.marketplaceCategory}
						<span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
							{product.marketplaceCategory}
						</span>
					{/if}
					{#if product.unlimited}
						<span class="rounded-full bg-green-100 px-2 py-0.5 text-green-700">Unlimited</span>
					{:else if product.stockQuantity !== undefined}
						<span
							class="rounded-full px-2 py-0.5 {(product.stockQuantity ?? 0) > 0
								? 'bg-gray-100 text-gray-600'
								: 'bg-red-100 text-red-700'}"
						>
							{product.stockQuantity ?? 0} in stock
						</span>
					{/if}
					{#if product.requiresShipping}
						<span class="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">Requires shipping</span>
					{/if}
					{#if product.salesEndDate}
						<span class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
							Ends {new Date(product.salesEndDate).toLocaleDateString()}
						</span>
					{/if}
				</div>

				<!-- Purchase form -->
				<div class="mt-6 space-y-3 rounded-xl border bg-white p-4">
					{#if purchaseError}
						<p class="rounded-md bg-red-50 p-2 text-sm text-red-600">{purchaseError}</p>
					{/if}

					{#if isService}
						<a
							href={`/marketplace/${product.id}/book`}
							class="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
						>
							Book this slot
						</a>
						<p class="text-center text-xs text-gray-400">
							Pick a time. Slot held for 30 minutes during checkout.
						</p>
					{:else}
						{#if !product.unlimited}
							<div>
								<label for="qty" class="text-xs text-gray-500">Quantity</label>
								<input
									id="qty"
									type="number"
									min="1"
									max={product.stockQuantity}
									bind:value={quantity}
									class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
								/>
							</div>
						{/if}

						{#if !$isAuthenticated}
							<div>
								<label for="guest-email" class="text-xs text-gray-500">Email</label>
								<input
									id="guest-email"
									type="email"
									bind:value={guestEmail}
									required
									placeholder="you@example.com"
									class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
								/>
								<input
									type="text"
									bind:value={guestName}
									placeholder="Your name (optional)"
									class="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
								/>
								<p class="mt-1 text-[11px] text-gray-400">Continuing as a guest. Sign in to see all your purchases later.</p>
							</div>
						{/if}

						<button
							on:click={handleBuy}
							disabled={purchasing || outOfStock}
							class="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
						>
							{outOfStock
								? 'Out of stock'
								: purchasing
									? 'Starting checkout…'
									: `Buy for ${formatMoney(product.priceKobo * quantity, product.currency)}`}
						</button>
						<p class="flex items-center justify-center gap-1 text-center text-[11px] text-gray-400">
							<Icon icon="mdi:lock-outline" class="text-sm" /> Secure checkout via Rondwell
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
