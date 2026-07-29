<script lang="ts">
	import { discoverExhibitors } from '$lib/services/exhibitor.public.services';
	import { discoverFilters, setSearch } from '$lib/stores/discover.store';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';

	const PAGE_SIZE = 20;

	let exhibitors: any[] = [];
	let loading = true;
	let failed = false;
	let pagination: any = { currentPage: 1, totalPages: 0, totalItems: 0 };
	let currentPage = 1;

	let lastKey: string | null = null;
	let requestId = 0;
	let debounce = 0;

	onDestroy(() => clearTimeout(debounce));

	$: searchQuery = $discoverFilters.search.trim();

	async function loadExhibitors(search: string, pageNumber: number) {
		const id = ++requestId;
		loading = true;
		failed = false;
		try {
			const data = await discoverExhibitors({
				page: pageNumber,
				limit: PAGE_SIZE,
				search: search || undefined
			});
			if (id !== requestId) return;
			exhibitors = data?.exhibitors ?? [];
			pagination = data?.pagination ?? { currentPage: pageNumber, totalPages: 0, totalItems: 0 };
		} catch {
			if (id !== requestId) return;
			exhibitors = [];
			failed = true;
		} finally {
			if (id === requestId) loading = false;
		}
	}

	function schedule(search: string, pageNumber: number, delay: number) {
		clearTimeout(debounce);
		if (typeof window === 'undefined') return;
		debounce = window.setTimeout(() => loadExhibitors(search, pageNumber), delay);
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

	$: total = pagination?.totalItems ?? pagination?.total ?? 0;
</script>

<section class="relative max-w-6xl">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
		<h1 class="text-xl font-bold">
			{searchQuery ? `Exhibitors matching “${searchQuery}”` : 'Exhibitors'}
		</h1>
		{#if !loading && !failed && total}
			<span class="text-xs font-semibold text-gray-400">{total.toLocaleString()} exhibitors</span>
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
			<p class="text-sm text-gray-500">We couldn't load exhibitors just now.</p>
			<button
				class="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white"
				on:click={() => loadExhibitors(searchQuery, currentPage)}
			>
				Try again
			</button>
		</div>
	{:else if exhibitors.length === 0}
		<div class="flex h-48 flex-col items-center justify-center gap-2">
			<Icon icon="mdi:store-search-outline" class="h-7 w-7 text-gray-300" />
			<p class="text-base font-semibold text-gray-500">No exhibitors found</p>
			<p class="text-sm text-gray-400">
				{searchQuery ? 'Try a different search term' : 'Check back later for new exhibitors'}
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
			{#each exhibitors as exhibitor (exhibitor._id)}
				<a href="/x/{exhibitor.publicProfileSlug}"
					class="group flex gap-4 overflow-hidden rounded-2xl bg-white p-4 no-underline transition-shadow hover:shadow-md">
					<!-- Logo -->
					<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
						{#if exhibitor.logoUrl || exhibitor.profilePictureUrl}
							<img src={exhibitor.logoUrl || exhibitor.profilePictureUrl} alt={exhibitor.companyName || exhibitor.name}
								class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center text-xl font-bold text-gray-300">
								{(exhibitor.companyName || exhibitor.name || '?')[0].toUpperCase()}
							</div>
						{/if}
					</div>
					<!-- Info -->
					<div class="flex-1">
						<h3 class="text-sm font-semibold text-gray-900">{exhibitor.companyName || exhibitor.name}</h3>
						{#if exhibitor.industry}
							<span class="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{exhibitor.industry}</span>
						{/if}
						{#if exhibitor.companyDescription}
							<p class="mt-1 text-xs text-gray-500 line-clamp-2">{exhibitor.companyDescription}</p>
						{/if}
						{#if exhibitor.businessLocation}
							<p class="mt-1 flex items-center gap-1 text-xs text-gray-400">
								<Icon icon="mdi:map-marker-outline" class="h-3 w-3" />
								{exhibitor.businessLocation}
							</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>

		{#if pagination.totalPages > 1}
			<div class="flex items-center justify-center gap-2 pb-8">
				<button
					class="rounded-lg px-3 py-1.5 text-sm {currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
					disabled={currentPage <= 1}
					on:click={() => goToPage(currentPage - 1)}
				>Previous</button>
				<span class="text-sm text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
				<button
					class="rounded-lg px-3 py-1.5 text-sm {currentPage >= pagination.totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
					disabled={currentPage >= pagination.totalPages}
					on:click={() => goToPage(currentPage + 1)}
				>Next</button>
			</div>
		{/if}
	{/if}
</section>

<style>
	.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
