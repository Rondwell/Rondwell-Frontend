<script lang="ts">
	import VendorCard from '$lib/components/VendorCard.svelte';
	import { discoverVendors } from '$lib/services/vendor.services';
	import { discoverFilters, setSearch } from '$lib/stores/discover.store';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';

	const PAGE_SIZE = 20;

	let vendors: any[] = [];
	let loading = true;
	let failed = false;
	let pagination: any = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
	let currentPage = 1;

	let lastKey: string | null = null;
	let requestId = 0;
	let debounce = 0;

	onDestroy(() => clearTimeout(debounce));

	$: searchQuery = $discoverFilters.search.trim();

	async function loadVendors(search: string, pageNumber: number) {
		const id = ++requestId;
		loading = true;
		failed = false;
		try {
			const data = await discoverVendors({
				page: pageNumber,
				limit: PAGE_SIZE,
				search: search || undefined
			});
			if (id !== requestId) return;
			vendors = data?.vendors ?? [];
			pagination = data?.pagination ?? { page: pageNumber, total: 0, totalPages: 0 };
		} catch {
			if (id !== requestId) return;
			vendors = [];
			failed = true;
		} finally {
			if (id === requestId) loading = false;
		}
	}

	function schedule(search: string, pageNumber: number, delay: number) {
		clearTimeout(debounce);
		if (typeof window === 'undefined') return;
		debounce = window.setTimeout(() => loadVendors(search, pageNumber), delay);
	}

	$: if (searchQuery !== lastKey) {
		const isFirstLoad = lastKey === null;
		lastKey = searchQuery;
		currentPage = 1;
		schedule(searchQuery, 1, isFirstLoad ? 0 : 220);
	}

	function goToPage(pageNumber: number) {
		currentPage = pageNumber;
		schedule(searchQuery, pageNumber, 0);
		if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function normalizeVendor(v: any) {
		return {
			slug: v.publicProfileSlug || v._id,
			businessName: v.businessName || 'Vendor',
			businessType: v.businessType || '',
			bio: v.bio || '',
			logoUrl: v.logoUrl || '',
			coverImageUrl: v.coverImageUrl || '',
			location: v.location || '',
			serviceArea: v.serviceArea || '',
			productCount: v.publicProfileSettings?.visibleProductIds?.length || 0,
		};
	}

	$: displayVendors = vendors.map(normalizeVendor);
	$: total = pagination?.total ?? pagination?.totalItems ?? 0;
</script>

<section class="relative max-w-6xl">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
		<h1 class="text-xl font-bold">
			{searchQuery ? `Vendors matching “${searchQuery}”` : 'Vendors & Service Providers'}
		</h1>
		{#if !loading && !failed && total}
			<span class="text-xs font-semibold text-gray-400">{total.toLocaleString()} vendors</span>
		{/if}
	</div>

	{#if loading}
		<div class="grid gap-4 py-5 animate-pulse lg:grid-cols-2">
			{#each [1, 2, 3, 4] as _}
				<div class="h-48 rounded-xl bg-gray-200"></div>
			{/each}
		</div>
	{:else if failed}
		<div class="flex h-48 flex-col items-center justify-center gap-3">
			<Icon icon="mdi:cloud-off-outline" class="h-7 w-7 text-gray-300" />
			<p class="text-sm text-gray-500">We couldn't load vendors just now.</p>
			<button
				class="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white"
				on:click={() => loadVendors(searchQuery, currentPage)}
			>
				Try again
			</button>
		</div>
	{:else if displayVendors.length === 0}
		<div class="flex h-48 flex-col items-center justify-center gap-2">
			<Icon icon="mdi:store-search-outline" class="h-7 w-7 text-gray-300" />
			<p class="text-base font-semibold text-gray-500">No vendors found</p>
			<p class="text-sm text-gray-400">
				{searchQuery ? 'Try a different search term' : 'Check back later for new vendors'}
			</p>
			{#if searchQuery}
				<button
					class="mt-1 rounded-lg border border-purple-500 px-4 py-2 text-xs font-semibold text-purple-600 transition hover:bg-purple-50"
					on:click={() => setSearch('')}
				>
					Clear search
				</button>
			{/if}
		</div>
	{:else}
		<div class="mb-8 grid grid-cols-1 gap-4 py-5 lg:grid-cols-2">
			{#each displayVendors as vendor (vendor.slug)}
				<VendorCard {vendor} newTab />
			{/each}
		</div>

		{#if pagination.totalPages > 1}
			<div class="flex items-center justify-center gap-2 pb-8">
				<button
					class="rounded-lg px-3 py-1.5 text-sm {currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
					disabled={currentPage <= 1}
					on:click={() => goToPage(currentPage - 1)}
				>Previous</button>
				<span class="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
				<button
					class="rounded-lg px-3 py-1.5 text-sm {currentPage >= pagination.totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
					disabled={currentPage >= pagination.totalPages}
					on:click={() => goToPage(currentPage + 1)}
				>Next</button>
			</div>
		{/if}
	{/if}
</section>
