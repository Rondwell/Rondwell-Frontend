<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let open = false;

	let searchQuery = '';
	let dragOver = false;
	let selectedCategory = 'Featured';
	let currentFolder: string | null = null; // Track opened folder

	// Folders per category
	const categories = ['Featured', 'Previous Events', 'Halloween', 'Food', 'Party', 'Drinks'];
	const images: Record<string, string[]> = {
		Featured: ['Sports', 'Drinks', 'Party'],
		Party: ['Party1', 'Party2'],
		Drinks: ['Drink1', 'Drink2']
	};

	// Folder contents (images inside each folder)
	const folderContents: Record<string, string[]> = {
		Sports: ['/folderpic1.png', '/folderpic1.png', '/folderpic1.png'],
		Drinks: [],
		Party: [],
		Party1: [],
		Party2: ['/folderpic1.png', '/folderpic1.png']
	};

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

	function openFolder(folder: string) {
		currentFolder = folder;
	}

	function goBack() {
		currentFolder = null;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 py-6 sm:items-center">
		<div
			class="custom-scrollbar h-full w-[846px] max-w-[90%] space-y-2 overflow-y-auto rounded-xl bg-white p-4 shadow-xl md:h-auto"
		>
			<!-- Header -->
			<div class="flex items-center justify-between">
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
				class="h-[116px] w-full cursor-pointer rounded-lg bg-[#EFF0F0] p-6 text-center"
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
					Or choose an image below. The ideal aspect ratio is 3:5:1
				</p>
			</button>

			<!-- Search bar -->
			<div class="relative w-full">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search"
					class="h-[43px] w-full rounded-lg border border-gray-300 bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
				/>
				<span class="absolute top-2.5 left-3 text-gray-400">
					<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
				</span>
			</div>

			<!-- Category + Image/Folders -->
			<div class="flex flex-col gap-2 md:flex-row">
				<!-- Sidebar -->
				<div
					class="custom-scrollbar flex w-full gap-2 overflow-auto p-4 md:w-1/4 md:flex-col md:border-r"
				>
					{#each categories as cat}
						<button
							class="w-fit flex-shrink-0 cursor-pointer rounded-md p-2 text-left text-black hover:bg-gray-100 md:w-full md:rounded {cat ===
							selectedCategory
								? 'bg-[#EBECEC]'
								: ''}"
							on:click={() => {
								selectedCategory = cat;
								currentFolder = null;
							}}
						>
							{cat}
						</button>
					{/each}
				</div>

				<!-- Folder grid OR image grid -->
				<div class="h-full flex-1 py-4 md:p-4">
					{#if currentFolder}
						<!-- Back button -->
						<div class="mb-3 flex items-center gap-2">
							<button
								on:click={goBack}
								class="flex items-center gap-1 text-blue-600 hover:underline"
							>
								<Icon icon="mdi:arrow-left" class="text-lg" />
								Back
							</button>
							<h3 class="font-medium text-gray-700">{currentFolder}</h3>
						</div>

						{#if currentFolder && folderContents[currentFolder]?.length > 0}
							<!-- Images inside folder -->
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{#each folderContents[currentFolder] as image}
									<button
										class="flex h-full flex-col items-center justify-center rounded-lg"
										on:click={() => dispatch('select', image)}
									>
										<img src={image} alt={image} class="h-full w-full rounded-md object-cover" />
									</button>
								{/each}
							</div>
						{:else}
							<!-- Optional: fallback for empty folder -->
							<p class="py-6 text-center text-sm text-gray-500">No images found in this folder.</p>
						{/if}
					{:else}
						<!-- Folder view -->
						{#if images[selectedCategory]?.length > 0}
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{#each images[selectedCategory] as folder}
									<button
										class="relative flex w-full flex-col items-center justify-end overflow-hidden rounded-lg shadow-sm transition"
										on:click={() => openFolder(folder)}
									>
										<img src="/IMAGE FOLDER.svg" alt={folder} class="w-full object-cover" />
										<div
											class="absolute bottom-0 w-full bg-gray-200 py-2 text-center font-medium text-gray-800"
										>
											{folder}
										</div>
									</button>
								{/each}
							</div>
						{:else}
							<!-- Optional: Empty state -->
							<p class="py-6 text-center text-sm text-gray-500">
								No folders available in this category.
							</p>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
