<script lang="ts">
	import { discoverSpeakers } from '$lib/services/speaker.public.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let speakers: any[] = [];
	let loading = true;
	let pagination: any = { currentPage: 1, totalPages: 0, totalItems: 0 };
	let currentPage = 1;
	let searchQuery = '';

	async function loadSpeakers() {
		loading = true;
		try {
			const data = await discoverSpeakers({
				page: currentPage,
				limit: 20,
				search: searchQuery || undefined,
			});
			speakers = data.speakers || [];
			pagination = data.pagination || { currentPage: 1, totalPages: 0, totalItems: 0 };
		} catch {
			speakers = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => loadSpeakers());
</script>

<section class="relative max-w-6xl">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-xl font-bold">Speakers</h1>
		<div class="relative w-64">
			<input
				type="text"
				placeholder="Search speakers..."
				bind:value={searchQuery}
				on:input={() => { currentPage = 1; loadSpeakers(); }}
				class="w-full rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#513BE2]"
			/>
			<img class="absolute top-2.5 left-3 h-4 w-4" alt="search" src="/search.svg" />
		</div>
	</div>

	{#if loading}
		<div class="grid gap-4 py-5 animate-pulse sm:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3, 4, 5, 6] as _}
				<div class="h-64 rounded-xl bg-gray-200"></div>
			{/each}
		</div>
	{:else if speakers.length === 0}
		<div class="flex h-48 items-center justify-center">
			<div class="text-center">
				<p class="text-lg text-gray-400">No speakers found</p>
				<p class="mt-1 text-sm text-gray-300">
					{searchQuery ? 'Try a different search term' : 'Check back later for new speakers'}
				</p>
			</div>
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
					on:click={() => { currentPage--; loadSpeakers(); }}
				>Previous</button>
				<span class="text-sm text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
				<button
					class="rounded-lg px-3 py-1.5 text-sm {currentPage >= pagination.totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
					disabled={currentPage >= pagination.totalPages}
					on:click={() => { currentPage++; loadSpeakers(); }}
				>Next</button>
			</div>
		{/if}
	{/if}
</section>
