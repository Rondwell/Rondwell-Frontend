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

	/**
	 * A speaker without a public slug has no profile page — link by id so the
	 * card never resolves to `/s/undefined`.
	 */
	$: displaySpeakers = speakers.map((s) => ({
		...s,
		href: `/s/${s.publicProfileSlug || s._id}`,
	}));
</script>

<section class="relative w-full max-w-6xl">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
		<div class="flex items-baseline gap-2.5">
			<h1 class="text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">
				{searchQuery ? `Speakers matching “${searchQuery}”` : 'Speakers'}
			</h1>
			{#if !loading && !failed && total}
				<span class="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-[#6B6878]">
					{total.toLocaleString()} {total === 1 ? 'speaker' : 'speakers'}
				</span>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="grid gap-5 py-5 animate-pulse sm:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3, 4, 5, 6] as _}
				<div class="h-64 rounded-[22px] border border-black/8 bg-white/85 backdrop-blur-md"></div>
			{/each}
		</div>
	{:else if failed}
		<div class="mt-6 flex h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-black/8 bg-white/80 p-6 text-center backdrop-blur-md">
			<Icon icon="solar:cloud-cross-bold-duotone" class="h-9 w-9 text-[#DB3E6C]" />
			<p class="text-sm font-medium text-[#555362]">We couldn't load speakers just now.</p>
			<button
				type="button"
				class="rounded-full bg-[#17161E] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#2E2D38]"
				on:click={() => loadSpeakers(searchQuery, currentPage)}
			>
				Try again
			</button>
		</div>
	{:else if speakers.length === 0}
		<div class="mt-6 flex h-60 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-black/15 bg-white/75 p-6 text-center backdrop-blur-md">
			<Icon icon="solar:microphone-3-bold-duotone" class="h-9 w-9 text-[#AB46DD]" />
			<p class="text-base font-bold text-[#17161E]">No speakers found</p>
			<p class="max-w-sm text-xs text-[#6B6878]">
				{searchQuery ? 'Try a different search term or explore featured events.' : 'Check back later for new speakers'}
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
		<div class="mb-8 grid grid-cols-1 gap-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each displaySpeakers as speaker (speaker._id)}
				<!-- Opens in a new tab, matching the behaviour of the event cards. -->
				<a href={speaker.href} target="_blank" rel="noopener noreferrer"
					class="group flex flex-col items-center overflow-hidden rounded-[22px] border border-black/8 bg-white/88 p-6 text-center no-underline shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_12px_30px_-10px_rgba(19,21,23,0.12)]">
					<!-- Avatar -->
					<div class="h-20 w-20 overflow-hidden rounded-full bg-black/5 ring-2 ring-white shadow-sm">
						{#if speaker.profilePhotoUrl || speaker.profilePictureUrl}
							<img src={speaker.profilePhotoUrl || speaker.profilePictureUrl} alt={speaker.fullName || speaker.name}
								class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EC4899]/15 to-[#8B5CF6]/15 text-2xl font-bold text-[#7C3AED]">
								{(speaker.fullName || speaker.name || '?')[0].toUpperCase()}
							</div>
						{/if}
					</div>
					<h3 class="mt-3.5 text-sm font-bold tracking-tight text-[#17161E] transition-colors group-hover:text-[#7C3AED] sm:text-base">{speaker.fullName || speaker.name}</h3>
					{#if speaker.title}
						<p class="mt-0.5 line-clamp-2 text-xs text-[#5F5C6D]">{speaker.title}</p>
					{/if}
					{#if speaker.expertise}
						<span class="mt-2.5 rounded-full bg-[#7C3AED]/10 px-3 py-1 text-[11px] font-semibold text-[#7C3AED]">{speaker.expertise}</span>
					{/if}
					{#if speaker.affiliation}
						<p class="mt-2 text-xs font-medium text-[#6B6878]">{speaker.affiliation}</p>
					{/if}
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
