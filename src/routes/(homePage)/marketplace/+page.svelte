<!--
	FE-P2-02-A — Public marketplace browse.

	Backend: GET /api/v1/products/marketplace (public, paginated).
	Renders a grid of vendor products with filters by category, currency
	and price range. Card clicks route to the product detail page.
-->
<script lang="ts">
	import {
		listMarketplaceProducts,
		type MarketplaceProduct,
	} from '$lib/services/marketplace.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let products: MarketplaceProduct[] = [];
	let loading = true;
	let error = '';
	let total = 0;
	let page = 1;
	let pageSize = 24;

	let search = '';
	let category = '';
	let currency = '';
	let minPrice: string = '';
	let maxPrice: string = '';
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	const CATEGORIES = [
		'',
		'CATERING',
		'DECOR',
		'PHOTOGRAPHY',
		'VIDEOGRAPHY',
		'ENTERTAINMENT',
		'VENUE',
		'EQUIPMENT',
		'TRANSPORT',
		'PRINTING',
		'OTHER',
	];

	onMount(() => load());

	async function load() {
		loading = true;
		error = '';
		try {
			const result = await listMarketplaceProducts({
				page,
				limit: pageSize,
				search: search || undefined,
				category: category || undefined,
				currency: currency || undefined,
				minPriceKobo: minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined,
				maxPriceKobo: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : undefined,
			});
			products = result.items;
			total = result.total;
		} catch (e: any) {
			error = financialErrorMessage(e);
			products = [];
		} finally {
			loading = false;
		}
	}

	function handleSearchInput() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			page = 1;
			load();
		}, 350);
	}

	function applyFilters() {
		page = 1;
		load();
	}

	function stockLabel(p: MarketplaceProduct): string {
		if (p.unlimited) return 'Unlimited';
		if (typeof p.stockQuantity === 'number') {
			if (p.stockQuantity === 0) return 'Out of stock';
			if (p.stockQuantity < 10) return `${p.stockQuantity} left`;
			return `${p.stockQuantity} in stock`;
		}
		return '';
	}

	function salesEndCountdown(iso?: string | null): string {
		if (!iso) return '';
		const ms = new Date(iso).getTime() - Date.now();
		if (!Number.isFinite(ms) || ms < 0) return '';
		const days = Math.ceil(ms / 86_400_000);
		if (days <= 1) return 'Ends today';
		if (days <= 7) return `Ends in ${days}d`;
		return '';
	}
</script>

<svelte:head>
	<title>Marketplace — Rondwell</title>
	<meta
		name="description"
		content="Browse vendor products and services on the Rondwell marketplace. Buy direct, book service slots, and pay securely."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-10">
	<div class="mb-8">
		<h1 class="text-3xl font-bold sm:text-4xl">Vendor marketplace</h1>
		<p class="mt-2 max-w-2xl text-sm text-gray-500">
			Buy direct from verified vendors. Catering, decor, photography, equipment, and more — all
			payments handled by Rondwell.
		</p>
	</div>

	<!-- Filters -->
	<div class="mb-6 grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
		<div class="lg:col-span-2">
			<label for="mp-search" class="text-xs text-gray-500">Search</label>
			<input
				id="mp-search"
				type="search"
				bind:value={search}
				on:input={handleSearchInput}
				placeholder="Catering, photography…"
				class="mt-1 w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2 text-sm focus:outline-none"
			/>
		</div>
		<div>
			<label for="mp-category" class="text-xs text-gray-500">Category</label>
			<select
				id="mp-category"
				bind:value={category}
				on:change={applyFilters}
				class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
			>
				{#each CATEGORIES as c}
					<option value={c}>{c || 'All categories'}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="mp-currency" class="text-xs text-gray-500">Currency</label>
			<select
				id="mp-currency"
				bind:value={currency}
				on:change={applyFilters}
				class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
			>
				<option value="">Any</option>
				<option value="NGN">NGN</option>
				<option value="USD">USD</option>
				<option value="GBP">GBP</option>
				<option value="EUR">EUR</option>
			</select>
		</div>
		<div class="flex items-end gap-2">
			<div class="flex-1">
				<label for="mp-min-price" class="text-xs text-gray-500">Min</label>
				<input
					id="mp-min-price"
					type="number"
					min="0"
					bind:value={minPrice}
					on:change={applyFilters}
					class="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none"
				/>
			</div>
			<div class="flex-1">
				<label for="mp-max-price" class="text-xs text-gray-500">Max</label>
				<input
					id="mp-max-price"
					type="number"
					min="0"
					bind:value={maxPrice}
					on:change={applyFilters}
					class="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none"
				/>
			</div>
		</div>
	</div>

	{#if error}
		<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each [1, 2, 3, 4, 5, 6, 7, 8] as _}
				<div class="animate-pulse rounded-xl border bg-white p-4">
					<div class="mb-3 h-40 w-full rounded-lg bg-gray-100"></div>
					<div class="h-4 w-3/4 rounded bg-gray-200"></div>
					<div class="mt-2 h-4 w-1/2 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if products.length === 0}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl border bg-white">
			<Icon icon="mdi:storefront-outline" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-gray-500">No products match your filters</p>
			<p class="text-sm text-gray-400">Try clearing the filters or searching for something else.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each products as p}
				<a
					href={`/marketplace/${p.id}`}
					class="group flex flex-col overflow-hidden rounded-xl border bg-white transition hover:shadow-md"
				>
					<div class="aspect-square w-full overflow-hidden bg-gray-100">
						{#if p.media?.[0]?.url}
							<img
								src={p.media[0].url}
								alt={p.productName}
								class="h-full w-full object-cover transition group-hover:scale-105"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center text-gray-300">
								<Icon icon="mdi:image-off-outline" class="text-5xl" />
							</div>
						{/if}
					</div>
					<div class="flex flex-1 flex-col p-4">
						<p class="truncate text-sm font-semibold text-gray-900" title={p.productName}>
							{p.productName}
						</p>
						{#if p.vendorName}
							<p class="mt-0.5 truncate text-xs text-gray-500">by {p.vendorName}</p>
						{/if}
						<p class="mt-2 text-lg font-bold text-gray-900">
							{formatMoney(p.priceKobo, p.currency)}
						</p>
						<div class="mt-2 flex items-center justify-between text-xs text-gray-500">
							{#if stockLabel(p)}
								<span
									class="rounded-full px-2 py-0.5 font-medium {p.stockQuantity === 0 && !p.unlimited
										? 'bg-red-100 text-red-700'
										: 'bg-gray-100'}"
								>
									{stockLabel(p)}
								</span>
							{:else}
								<span></span>
							{/if}
							{#if salesEndCountdown(p.salesEndDate)}
								<span class="text-amber-600">{salesEndCountdown(p.salesEndDate)}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>

		{#if total > pageSize}
			<div class="mt-6 flex items-center justify-center gap-2">
				<button
					on:click={() => {
						page = Math.max(1, page - 1);
						load();
					}}
					disabled={page === 1}
					class="rounded-md px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
				>
					Previous
				</button>
				<span class="text-sm text-gray-500">
					Page {page} of {Math.ceil(total / pageSize)}
				</span>
				<button
					on:click={() => {
						page = Math.min(Math.ceil(total / pageSize), page + 1);
						load();
					}}
					disabled={page >= Math.ceil(total / pageSize)}
					class="rounded-md px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
				>
					Next
				</button>
			</div>
		{/if}
	{/if}
</div>
