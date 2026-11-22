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

	/** Fall back to the id when an exhibitor has no public slug. */
	$: displayExhibitors = exhibitors.map((e) => ({
		...e,
		href: `/x/${e.publicProfileSlug || e._id}`,
	}));
</script>

<section class="relative w-full max-w-6xl">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
		<div class="flex items-baseline gap-2.5">
			<h1 class="text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">
				{searchQuery ? `Exhibitors matching “${searchQuery}”` : 'Exhibitors'}
			</h1>
			{#if !loading && !failed && total}
				<span class="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-[#6B6878]">
					{total.toLocaleString()} {total === 1 ? 'exhibitor' : 'exhibitors'}
				</span>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="grid gap-5 py-5 animate-pulse lg:grid-cols-2">
			{#each [1, 2, 3, 4] as _}
				<div class="h-44 rounded-[22px] border border-black/8 bg-white/85 backdrop-blur-md"></div>
			{/each}
		</div>
	{:else if failed}
		<div class="mt-6 flex h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-black/8 bg-white/80 p-6 text-center backdrop-blur-md">
			<Icon icon="solar:cloud-cross-bold-duotone" class="h-9 w-9 text-[#DB3E6C]" />
			<p class="text-sm font-medium text-[#555362]">We couldn't load exhibitors just now.</p>
			<button
				type="button"
				class="rounded-full bg-[#17161E] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#2E2D38]"
				on:click={() => loadExhibitors(searchQuery, currentPage)}
			>
				Try again
			</button>
		</div>
	{:else if exhibitors.length === 0}
		<div class="mt-6 flex h-60 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-black/15 bg-white/75 p-6 text-center backdrop-blur-md">
			<Icon icon="solar:buildings-2-bold-duotone" class="h-9 w-9 text-[#AB46DD]" />
			<p class="text-base font-bold text-[#17161E]">No exhibitors found</p>
			<p class="max-w-sm text-xs text-[#6B6878]">
				{searchQuery ? 'Try a different search term or check another category.' : 'Check back later for new exhibitors'}
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
			{#each displayExhibitors as exhibitor (exhibitor._id)}
				<!-- Opens in a new tab, matching the behaviour of the event cards. -->
				<a href={exhibitor.href} target="_blank" rel="noopener noreferrer"
					class="group flex gap-4 overflow-hidden rounded-[22px] border border-black/8 bg-white/88 p-4 sm:p-5 no-underline shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_12px_30px_-10px_rgba(19,21,23,0.12)]">
					<!-- Logo -->
					<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/6">
						{#if exhibitor.logoUrl || exhibitor.profilePictureUrl}
							<img src={exhibitor.logoUrl || exhibitor.profilePictureUrl} alt={exhibitor.companyName || exhibitor.name}
								class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0EA5E9]/15 to-[#6366F1]/15 text-xl font-bold text-[#0284C7]">
								{(exhibitor.companyName || exhibitor.name || '?')[0].toUpperCase()}
							</div>
						{/if}
					</div>
					<!-- Info -->
					<div class="min-w-0 flex-1">
						<div class="flex items-start justify-between gap-2">
							<h3 class="text-sm font-bold tracking-tight text-[#17161E] transition-colors group-hover:text-[#0284C7] sm:text-base">{exhibitor.companyName || exhibitor.name}</h3>
						</div>
						<div class="mt-1 flex flex-wrap items-center gap-1.5">
							<span class="rounded-full bg-[#0EA5E9]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0284C7]">Exhibitor</span>
							{#if exhibitor.industry}
								<span class="rounded-full bg-[#6366F1]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#4F46E5]">{exhibitor.industry}</span>
							{/if}
						</div>
						{#if exhibitor.companyDescription}
							<p class="mt-1.5 text-xs leading-relaxed text-[#5F5C6D] line-clamp-2">{exhibitor.companyDescription}</p>
						{/if}
						{#if exhibitor.businessLocation}
							<p class="mt-1.5 flex items-center gap-1 text-xs text-[#6B6878]">
								<Icon icon="solar:map-point-bold-duotone" class="h-3.5 w-3.5 flex-shrink-0 text-[#8E8B99]" />
								<span class="truncate">{exhibitor.businessLocation}</span>
							</p>
						{/if}
					</div>
				</a>
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
				<span class="text-xs font-semibold text-[#6B6878]">Page {pagination.currentPage} of {pagination.totalPages}</span>
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

<style>
	.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
