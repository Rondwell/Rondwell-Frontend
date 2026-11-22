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

	/**
	 * GAP 8 — make planners findable.
	 *
	 * Event planners already exist on the platform as vendors with
	 * `businessType: 'Event Planning'`; nothing surfaced them. These chips are
	 * the whole fix — a first-class filter, not a new subsystem. "Planning &
	 * Coordination" is deliberately first: it is the category an organizer
	 * setting up a big event looks for before anything else.
	 */
	const QUICK_CATEGORIES = [
		{ label: 'Planning & Coordination', value: 'Event Planning' },
		{ label: 'Catering', value: 'Catering' },
		{ label: 'Photography', value: 'Photography' },
		{ label: 'Decoration', value: 'Decoration' },
		{ label: 'Sound & Lighting', value: 'Sound & Lighting' },
		{ label: 'Entertainment', value: 'Entertainment' },
		{ label: 'Event Venue', value: 'Event Venue' }
	];
	let businessType = '';

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
				search: search || undefined,
				businessType: businessType || undefined
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

	// Key on BOTH the search text and the category chip so selecting a chip
	// actually re-queries — keying on search alone would leave the list stale.
	$: filterKey = `${searchQuery}::${businessType}`;
	$: if (filterKey !== lastKey) {
		const isFirstLoad = lastKey === null;
		lastKey = filterKey;
		currentPage = 1;
		schedule(searchQuery, 1, isFirstLoad ? 0 : 220);
	}

	function toggleCategory(value: string) {
		businessType = businessType === value ? '' : value;
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

<section class="relative w-full max-w-6xl">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
		<div class="flex items-baseline gap-2.5">
			<h1 class="text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">
				{searchQuery ? `Vendors matching “${searchQuery}”` : 'Vendors & Service Providers'}
			</h1>
			{#if !loading && !failed && total}
				<span class="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-[#6B6878]">
					{total.toLocaleString()} {total === 1 ? 'vendor' : 'vendors'}
				</span>
			{/if}
		</div>
	</div>

	<!-- GAP 8 — category chips. "Planning & Coordination" leads. -->
	<div class="mb-4 flex flex-wrap gap-2">
		{#each QUICK_CATEGORIES as cat}
			<button
				type="button"
				aria-pressed={businessType === cat.value}
				on:click={() => toggleCategory(cat.value)}
				class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all {businessType === cat.value
					? 'bg-[#17161E] text-white shadow-xs'
					: 'border border-black/8 bg-white/80 text-[#555362] backdrop-blur-sm hover:bg-white hover:text-[#17161E]'}"
			>
				{cat.label}
			</button>
		{/each}
		{#if businessType}
			<button
				type="button"
				on:click={() => (businessType = '')}
				class="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#6B6878] transition hover:text-[#17161E]"
			>
				Clear
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="grid gap-5 py-5 animate-pulse lg:grid-cols-2">
			{#each [1, 2, 3, 4] as _}
				<div class="h-48 rounded-[22px] border border-black/8 bg-white/85 backdrop-blur-md"></div>
			{/each}
		</div>
	{:else if failed}
		<div class="mt-6 flex h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-black/8 bg-white/80 p-6 text-center backdrop-blur-md">
			<Icon icon="solar:cloud-cross-bold-duotone" class="h-9 w-9 text-[#DB3E6C]" />
			<p class="text-sm font-medium text-[#555362]">We couldn't load vendors just now.</p>
			<button
				type="button"
				class="rounded-full bg-[#17161E] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#2E2D38]"
				on:click={() => loadVendors(searchQuery, currentPage)}
			>
				Try again
			</button>
		</div>
	{:else if displayVendors.length === 0}
		<div class="mt-6 flex h-60 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-black/15 bg-white/75 p-6 text-center backdrop-blur-md">
			<Icon icon="solar:shop-2-bold-duotone" class="h-9 w-9 text-[#AB46DD]" />
			<p class="text-base font-bold text-[#17161E]">No vendors found</p>
			<p class="max-w-sm text-xs text-[#6B6878]">
				{searchQuery ? 'Try a different search term or clear your filters.' : 'Check back later for new vendors'}
			</p>
			{#if searchQuery}
				<button
					type="button"
					class="mt-2 rounded-full border border-black/15 bg-white px-4 py-1.5 text-xs font-semibold text-[#17161E] transition hover:bg-black/5"
					on:click={() => setSearch('')}
				>
					Clear search
				</button>
			{/if}
		</div>
	{:else}
		<div class="mb-8 grid grid-cols-1 gap-5 py-5 lg:grid-cols-2">
			{#each displayVendors as vendor (vendor.slug)}
				<VendorCard {vendor} newTab />
			{/each}
		</div>

		{#if pagination.totalPages > 1}
			<div class="flex items-center justify-center gap-3 pb-8">
				<button
					type="button"
					class="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#17161E] transition {currentPage <= 1 ? 'cursor-not-allowed opacity-40' : 'hover:bg-black/5'}"
					disabled={currentPage <= 1}
					on:click={() => goToPage(currentPage - 1)}
				>Previous</button>
				<span class="text-xs font-semibold text-[#6B6878]">Page {pagination.page} of {pagination.totalPages}</span>
				<button
					type="button"
					class="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#17161E] transition {currentPage >= pagination.totalPages ? 'cursor-not-allowed opacity-40' : 'hover:bg-black/5'}"
					disabled={currentPage >= pagination.totalPages}
					on:click={() => goToPage(currentPage + 1)}
				>Next</button>
			</div>
		{/if}
	{/if}
</section>
