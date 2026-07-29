<script lang="ts">
	import { discoverSpeakers } from '$lib/services/speaker.public.services';
	import { discoverFilters, setSearch } from '$lib/stores/discover.store';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';

	const PAGE_SIZE = 20;

	let speakers: any[] = [];
	let loading = true;
	let failed = false;
	let pagination: any = { currentPage: 1, totalPages: 0, totalItems: 0 };
	let currentPage = 1;

	let lastKey: string | null = null;
	let requestId = 0;
	let debounce = 0;

	onDestroy(() => clearTimeout(debounce));

	$: searchQuery = $discoverFilters.search.trim();

	async function loadSpeakers(search: string, pageNumber: number) {
		const id = ++requestId;
		loading = true;
		failed = false;
		try {
			const data = await discoverSpeakers({
				page: pageNumber,
				limit: PAGE_SIZE,
				search: search || undefined
			});
			if (id !== requestId) return;
			speakers = data?.speakers ?? [];
			pagination = data?.pagination ?? { currentPage: pageNumber, totalPages: 0, totalItems: 0 };
		} catch {
			if (id !== requestId) return;
			speakers = [];
			failed = true;
		} finally {
			if (id === requestId) loading = false;
		}
	}

	function schedule(search: string, pageNumber: number, delay: number) {
		clearTimeout(debounce);
		if (typeof window === 'undefined') return;
		debounce = window.setTimeout(() => loadSpeakers(search, pageNumber), delay);
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
			{searchQuery ? `Speakers matching “${searchQuery}”` : 'Speakers'}
		</h1>
		{#if !loading && !failed && total}
			<span class="text-xs font-semibold text-gray-400">{total.toLocaleString()} speakers</span>
		{/if}
	</div>

	{#if loading}
		<div class="grid gap-4 py-5 animate-pulse sm:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3, 4, 5, 6] as _}
				<div class="h-64 rounded-xl bg-gray-200"></div>
			{/each}
		</div>
	{:else if failed}
		<div class="flex h-48 flex-col items-center justify-center gap-3">
			<Icon icon="mdi:cloud-off-outline" class="h-7 w-7 text-gray-300" />
			<p class="text-sm text-gray-500">We couldn't load speakers just now.</p>
			<button
				class="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white"
				on:click={() => loadSpeakers(searchQuery, currentPage)}
			>
				Try again
			</button>
		</div>
	{:else if speakers.length === 0}
		<div class="flex h-48 flex-col items-center justify-center gap-2">
			<Icon icon="mdi:account-search-outline" class="h-7 w-7 text-gray-300" />
			<p class="text-base font-semibold text-gray-500">No speakers found</p>
			<p class="text-sm text-gray-400">
				{searchQuery ? 'Try a different search term' : 'Check back later for new speakers'}
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
		<div class="mb-8 grid grid-cols-1 gap-4 py-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each speakers as speaker (speaker._id)}
				<a href="/s/{speaker.publicProfileSlug}"
					class="group flex flex-col items-center overflow-hidden rounded-2xl bg-white p-6 text-center no-underline transition-shadow hover:shadow-md">
					<!-- Avatar -->
					<div class="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
						{#if speaker.profilePhotoUrl || speaker.profilePictureUrl}
							<img src={speaker.profilePhotoUrl || speaker.profilePictureUrl} alt={speaker.fullName || speaker.name}
								class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-300">
								{(speaker.fullName || speaker.name || '?')[0].toUpperCase()}
							</div>
						{/if}
					</div>
					<h3 class="mt-3 text-sm font-semibold text-gray-900">{speaker.fullName || speaker.name}</h3>
					{#if speaker.title}
						<p class="mt-0.5 text-xs text-gray-500">{speaker.title}</p>
					{/if}
					{#if speaker.expertise}
						<span class="mt-2 rounded-full bg-purple-50 px-3 py-1 text-[10px] font-medium text-purple-700">{speaker.expertise}</span>
					{/if}
					{#if speaker.affiliation}
						<p class="mt-2 text-xs text-gray-400">{speaker.affiliation}</p>
					{/if}
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
