<script lang="ts">
	import VendorCard from '$lib/components/VendorCard.svelte';
	import { discoverVendors } from '$lib/services/vendor.services';
	import { onMount } from 'svelte';

	let vendors: any[] = [];
	let loading = true;
	let pagination: any = { page: 1, limit: 20, total: 0, totalPages: 0 };
	let currentPage = 1;
	let searchQuery = '';

	async function loadVendors() {
		loading = true;
		try {
			const data = await discoverVendors({
				page: currentPage,
				limit: 20,
				search: searchQuery || undefined,
			});
			vendors = data.vendors || [];
			pagination = data.pagination || { page: 1, total: 0, totalPages: 0 };
		} catch {
			vendors = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => loadVendors());

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
</script>

<section class="relative max-w-6xl">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-xl font-bold">Vendors & Service Providers</h1>
		<div class="relative w-64">
			<input
				type="text"
				placeholder="Search vendors..."
				bind:value={searchQuery}
				on:input={() => { currentPage = 1; loadVendors(); }}
				class="w-full rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#513BE2]"
			/>
			<img class="absolute top-2.5 left-3 h-4 w-4" alt="search" src="/search.svg" />
		</div>
	</div>

	{#if loading}
		<div class="grid gap-4 py-5 animate-pulse lg:grid-cols-2">
			{#each [1, 2, 3, 4] as _}
				<div class="h-48 rounded-xl bg-gray-200"></div>
			{/each}
		</div>
	{:else if displayVendors.length === 0}
		<div class="flex h-48 items-center justify-center">
			<div class="text-center">
				<p class="text-lg text-gray-400">No vendors found</p>
				<p class="mt-1 text-sm text-gray-300">
					{searchQuery ? 'Try a different search term' : 'Check back later for new vendors'}
				</p>
			</div>
		</div>
	{:else}
		<div class="mb-8 grid grid-cols-1 gap-4 py-5 lg:grid-cols-2">
			{#each displayVendors as vendor (vendor.slug)}
				<VendorCard {vendor} />
			{/each}
		</div>

		{#if pagination.totalPages > 1}
			<div class="flex items-center justify-center gap-2 pb-8">
				<button
					class="rounded-lg px-3 py-1.5 text-sm {currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
					disabled={currentPage <= 1}
					on:click={() => { currentPage--; loadVendors(); }}
				>Previous</button>
				<span class="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
				<button
					class="rounded-lg px-3 py-1.5 text-sm {currentPage >= pagination.totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
					disabled={currentPage >= pagination.totalPages}
					on:click={() => { currentPage++; loadVendors(); }}
				>Next</button>
			</div>
		{/if}
	{/if}
</section>
