<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { searchStockImages, type StockImage } from '$lib/services/stockImages.services';

	const dispatch = createEventDispatcher();

	export let open = false;

	let searchQuery = '';
	let dragOver = false;
	let selectedCategory = 'Featured';

	// Categories offered in the sidebar. Each maps (server-side) to an Unsplash
	// search so every category aggregates fresh, relevant free stock photos.
	const categories = [
		'Featured',
		'Previous Events',
		'Sports',
		'Games',
		'Party',
		'Drinks',
		'Food',
		'Halloween'
	];

	let stockImages: StockImage[] = [];
	let loading = false;
	let errorMsg = '';
	// When the provider isn't configured the modal becomes upload-only.
	let providerDisabled = false;

	let searchDebounce: ReturnType<typeof setTimeout>;
	let requestToken = 0;

	// Session cache so revisiting a category (or repeating a search) doesn't
	// spend another Unsplash request — important given the 50 req/hr dev limit.
	const cache = new Map<string, StockImage[]>();

	async function loadImages(category: string, query: string) {
		errorMsg = '';
		const cacheKey = `${category}|${query.trim().toLowerCase()}`;

		// Serve from cache instantly when we've already fetched this view.
		const cached = cache.get(cacheKey);
		if (cached) {
			stockImages = cached;
			loading = false;
			return;
		}

		loading = true;
		const token = ++requestToken;
		try {
			const res = await searchStockImages(category, query);
			// Ignore out-of-order responses (fast category/search switching).
			if (token !== requestToken) return;
			stockImages = res.results;
			providerDisabled = res.disabled;
			if (!res.disabled && res.results.length) cache.set(cacheKey, res.results);
		} catch (e: any) {
			if (token !== requestToken) return;
			errorMsg = e?.message ?? 'Could not load images.';
			stockImages = [];
		} finally {
			if (token === requestToken) loading = false;
		}
	}

	function selectCategory(cat: string) {
		selectedCategory = cat;
		searchQuery = '';
		loadImages(cat, '');
	}

	function onSearchInput() {
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => loadImages(selectedCategory, searchQuery), 400);
	}

	function chooseStockImage(image: StockImage) {
		// Hand the full-resolution URL AND its metadata to the parent. We do NOT
		// ping Unsplash's download endpoint here — that's deferred until the event
		// is actually created (see create-event), both to satisfy Unsplash's
		// "on use" guideline and to avoid burning the hourly rate limit while the
		// organizer is just browsing thumbnails.
		dispatch('select', {
			stock: true,
			url: image.full,
			downloadLocation: image.downloadLocation,
			author: image.author,
			authorUrl: image.authorUrl
		});
		open = false;
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement | null;
		const file = input?.files?.[0];
		if (file) dispatch('select', file);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) dispatch('select', file);
	}

	function close() {
		open = false;
	}

	// Load the default category the first time the modal is opened.
	let hasLoaded = false;
	$: if (open && !hasLoaded) {
		hasLoaded = true;
		loadImages(selectedCategory, '');
	}

	onMount(() => {
		if (open && !hasLoaded) {
			hasLoaded = true;
			loadImages(selectedCategory, '');
		}
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 py-6 sm:items-center">
		<!--
			Bounded height + internal scrolling: the header/upload/search stay
			pinned while the sidebar and image grid each scroll on their own. This
			keeps the modal at its original compact size no matter how many stock
			photos load.
		-->
		<div
			class="flex h-full max-h-[92vh] w-[846px] max-w-[90%] flex-col gap-2 overflow-hidden rounded-xl bg-white p-4 shadow-xl md:h-[600px]"
		>
			<!-- Header -->
			<div class="flex flex-shrink-0 items-center justify-between">
				<h2 class="w-full text-center font-semibold text-black">Choose Image</h2>
				<button
					on:click={close}
					class="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
				>
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<!-- Upload area -->
			<button
				class="h-[116px] w-full flex-shrink-0 cursor-pointer rounded-lg bg-[#EFF0F0] p-6 text-center"
				class:border-blue-500={dragOver}
				on:dragover|preventDefault={() => (dragOver = true)}
				on:dragleave={() => (dragOver = false)}
				on:drop={handleDrop}
				on:click={() => (document.getElementById('fileInput') as HTMLInputElement | null)?.click()}
			>
				<input
					id="fileInput"
					type="file"
					class="hidden"
					accept="image/*"
					on:change={handleFileSelect}
				/>
				<p class="text-gray-600">Drag & drop or click here to upload.</p>
				<p class="mt-1 text-xs font-light text-gray-400">
					Or choose an image below. The ideal aspect ratio is 3.5:1
				</p>
			</button>

			<!-- Search bar -->
			<div class="relative w-full flex-shrink-0">
				<input
					type="text"
					bind:value={searchQuery}
					on:input={onSearchInput}
					placeholder="Search free photos"
					class="h-[43px] w-full rounded-lg border border-gray-300 bg-[#FFFFFF] py-2 pr-4 pl-10 text-gray-700 placeholder-[#C5C6C6] focus:ring-0 focus:outline-none"
				/>
				<span class="absolute top-2.5 left-3 text-gray-400">
					<Icon icon="mdi:magnify" class="text-xl" />
				</span>
			</div>

			<!-- Category + Image grid — this row fills the remaining space and its
			     two columns scroll independently (min-h-0 lets flex children shrink
			     so their own overflow kicks in instead of growing the modal). -->
			<div class="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
				<!-- Sidebar -->
				<div
					class="custom-scrollbar flex w-full flex-shrink-0 gap-2 overflow-x-auto p-1 md:w-1/4 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-r md:p-2"
				>
					{#each categories as cat}
						<button
							class="w-fit flex-shrink-0 cursor-pointer rounded-md p-2 text-left text-black hover:bg-gray-100 md:w-full md:rounded {cat ===
							selectedCategory
								? 'bg-[#EBECEC]'
								: ''}"
							on:click={() => selectCategory(cat)}
						>
							{cat}
						</button>
					{/each}
				</div>

				<!-- Image grid -->
				<div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto py-2 md:p-3">
					{#if loading}
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{#each Array(6) as _}
								<div class="aspect-[3/2] animate-pulse rounded-lg bg-gray-100"></div>
							{/each}
						</div>
					{:else if providerDisabled}
						<div class="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
							<Icon icon="mdi:image-off-outline" class="text-4xl text-gray-300" />
							<p class="text-sm text-gray-500">Stock photo library isn't available right now.</p>
							<p class="text-xs text-gray-400">You can still upload your own image above.</p>
						</div>
					{:else if errorMsg}
						<div class="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
							<p class="text-sm text-gray-500">{errorMsg}</p>
							<button
								class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
								on:click={() => loadImages(selectedCategory, searchQuery)}
							>
								Try again
							</button>
						</div>
					{:else if stockImages.length === 0}
						<p class="py-10 text-center text-sm text-gray-500">No images found. Try another search.</p>
					{:else}
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{#each stockImages as image (image.id)}
								<div class="group relative overflow-hidden rounded-lg">
									<button
										class="block h-full w-full"
										on:click={() => chooseStockImage(image)}
										title={image.alt}
									>
										<img
											src={image.thumb}
											alt={image.alt}
											loading="lazy"
											class="aspect-[3/2] w-full rounded-lg object-cover transition group-hover:brightness-90"
										/>
									</button>
									<!-- Unsplash attribution (required by their API guidelines) -->
									<a
										href="{image.authorUrl}?utm_source=rondwell&utm_medium=referral"
										target="_blank"
										rel="noopener noreferrer"
										class="absolute bottom-0 left-0 right-0 truncate bg-black/40 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
									>
										{image.author}
									</a>
								</div>
							{/each}
						</div>
						<p class="mt-3 text-center text-[11px] text-gray-400">
							Photos via
							<a
								href="https://unsplash.com/?utm_source=rondwell&utm_medium=referral"
								target="_blank"
								rel="noopener noreferrer"
								class="underline">Unsplash</a
							>
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
