<script lang="ts">
	import { discoverExhibitors } from '$lib/services/exhibitor.public.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let exhibitors: any[] = [];
	let loading = true;
	let pagination: any = { currentPage: 1, totalPages: 0, totalItems: 0 };
	let currentPage = 1;
	let searchQuery = '';

	async function loadExhibitors() {
		loading = true;
		try {
			const data = await discoverExhibitors({
				page: currentPage,
				limit: 20,
				search: searchQuery || undefined,
			});
			exhibitors = data.exhibitors || [];
			pagination = data.pagination || { currentPage: 1, totalPages: 0, totalItems: 0 };
		} catch {
			exhibitors = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => loadExhibitors());
</script>

<section class="relative max-w-6xl">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-xl font-bold">Exhibitors</h1>
	</div>

	{#if loading}
		<div class="grid gap-4 py-5 animate-pulse lg:grid-cols-2">
			{#each [1, 2, 3, 4] as _}
				<div class="h-48 rounded-xl bg-gray-200"></div>
			{/each}
		</div>
	{:else if exhibitors.length === 0}
		<div class="flex h-48 items-center justify-center">
			<div class="text-center">
				<p class="text-lg text-gray-400">No exhibitors found</p>
				<p class="mt-1 text-sm text-gray-300">
					{searchQuery ? 'Try a different search term' : 'Check back later for new exhibitors'}
				</p>
			</div>
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
					on:click={() => { currentPage--; loadExhibitors(); }}
				>Previous</button>
				<span class="text-sm text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
				<button
					class="rounded-lg px-3 py-1.5 text-sm {currentPage >= pagination.totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}"
					disabled={currentPage >= pagination.totalPages}
					on:click={() => { currentPage++; loadExhibitors(); }}
				>Next</button>
			</div>
		{/if}
	{/if}
</section>

<style>
	.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
