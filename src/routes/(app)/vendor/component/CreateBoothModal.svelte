<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
import  Icon  from '@iconify/svelte';



onDestroy(() => {
	portfolioFiles.forEach((item) => {
		URL.revokeObjectURL(item.preview);
	});
});
	let openSection: string | null = null;

	function toggle(section: Section) {
		openSection = openSection === section ? null : section;
	}

	export let show = false;
	const dispatch = createEventDispatcher();

	type Section = 'basic' | 'pricing' | 'additional';

	

	function closeModal() {
		dispatch('close');
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closeModal();
	}
	let isDragging = false;
	let fileInput: HTMLInputElement;

	type PortfolioFile = {
		file: File;
		preview: string;
	};

	let portfolioFiles: PortfolioFile[] = [];

	const MAX_SIZE = 50 * 1024 * 1024; // 50MB

	function browseFiles() {
		fileInput.click();
	}

	function handleFiles(files: FileList | null) {
		if (!files) return;

		const newFiles: PortfolioFile[] = [];

		Array.from(files).forEach((file) => {
			if (file.size > MAX_SIZE) return;

			newFiles.push({
				file,
				preview: URL.createObjectURL(file)
			});
		});

		portfolioFiles = [...portfolioFiles, ...newFiles];
	}

	function removeFile(index: number) {
		URL.revokeObjectURL(portfolioFiles[index].preview);
		portfolioFiles = portfolioFiles.filter((_, i) => i !== index);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		handleFiles(event.dataTransfer?.files || null);
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function onDragLeave() {
		isDragging = false;
	}
</script>


{#if show}
	<!-- BACKDROP -->
	<!-- MODAL -->
	<div
		class="fixed inset-0 z-40 flex items-center justify-center  bg-black/30 p-4"
		on:click={handleBackdropClick}
	>
		<div
			class="relative w-full max-w-4xl rounded-2xl bg-[#FDFCFB] shadow-xl"
		>
	<!-- HEADER -->
<div class="relative flex flex-col items-center gap-1 px-6 pt-6">
	<!-- CIRCLE ICON -->
	<div class="mx-auto ">
							<img src="/NDB.svg" alt="detail-icon" class="h-full w-full" />
						</div>

	<h2 class="text-lg font-semibold text-gray-900">
		Add Product/Service
	</h2>

	<p class="text-sm text-gray-500">
		Provide details of product/service to proceed.
	</p>

	<button
		on:click={closeModal}
		class="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
	>
		<Icon icon="heroicons:x-mark" class="h-4 w-4 text-gray-500" />
	</button>
</div>


			<!-- BODY -->
			<div class="grid gap-6 px-6 py-6 md:grid-cols-2">
				<!-- LEFT: UPLOAD -->
				<div
	class={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition
		${isDragging ? 'border-black bg-gray-50' : 'border-gray-300 bg-white'}`}
	on:drop={onDrop}
	on:dragover={onDragOver}
	on:dragleave={onDragLeave}
>
	<div class="mb-3 text-gray-400">
		<img src="/upload.svg" alt="upload-icon" />
	</div>

	<p class="text-sm font-medium text-gray-700">
		Choose a file or drag & drop it here
	</p>

	<p class="mt-1 text-xs text-gray-400">
		Any format supported, up to 50 MB.
	</p>

	<button
		type="button"
		class="mt-4 rounded-lg border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-100"
		on:click={browseFiles}
	>
		Browse File
	</button>

	<input
		type="file"
		bind:this={fileInput}
		class="hidden"
		multiple
		accept=".jpg,.jpeg,.png,.pdf,.mp4"
		on:change={(e) =>
			handleFiles((e.target as HTMLInputElement).files)
		}
	/>

	<!-- FILE PREVIEW LIST -->
	{#if portfolioFiles.length > 0}
		<div class="mt-4 w-full space-y-3">
			{#each portfolioFiles as item, index}
				<div
					class="flex items-center justify-between rounded-lg border border-[#EBEBEB] bg-white p-3"
				>
					<div class="flex items-center gap-3">
						{#if item.file.type.startsWith('image')}
							<img
								src={item.preview}
								class="h-10 w-10 rounded object-cover"
							/>
						{:else if item.file.type.startsWith('video')}
							<video
								src={item.preview}
								class="h-10 w-10 rounded object-cover"
								muted
							/>
						{:else}
							<span class="text-xl">📄</span>
						{/if}

						<div>
							<p class="text-sm font-medium text-[#171717]">
								{item.file.name}
							</p>
							<p class="text-xs text-[#737373]">
								{(item.file.size / (1024 * 1024)).toFixed(1)} MB
							</p>
						</div>
					</div>

					<button
						type="button"
						class="text-sm text-[#737373] hover:text-[#171717]"
						on:click={() => removeFile(index)}
					>
						✕
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>


				<!-- RIGHT: ACCORDIONS -->
				<div class="space-y-3">
					<!-- BASIC -->
					<div class="space-y-2">
	<button
		on:click={() => toggle('basic')}
		class="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium"
	>
		Basic Information

		<Icon
		icon="heroicons:plus"		
			class={`h-4 w-4 transition-transform ${
				openSection === 'basic' ? 'rotate-45' : ''
			}`}
		/>
	</button>

	{#if openSection === 'basic'}
		<div
			class="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-gray-600 shadow-sm"
		>
			<span>Product name</span>

			<span
				class="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-700"
				title="More info"
			>
				i
			</span>
		</div>
	{/if}
</div>



					<!-- PRICING -->
					<button
						on:click={() => toggle('pricing')}
						class="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium"
					>
						Pricing & Availability
						<Icon
		icon="heroicons:plus"		
			class={`h-4 w-4 transition-transform ${
				openSection === 'basic' ? 'rotate-45' : ''
			}`}
		/>
					</button>

					<!-- ADDITIONAL -->
					<button
						on:click={() => toggle('additional')}
						class="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium"
					>
						Additional Details
						<Icon
		icon="heroicons:plus"		
			class={`h-4 w-4 transition-transform ${
				openSection === 'basic' ? 'rotate-45' : ''
			}`}
		/>

					</button>{#if openSection === 'pricing'}
		<div
			class="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-gray-600 shadow-sm"
		>
			Pricing details go here.
		</div>
	{/if}
				</div>
			</div>

			<!-- FOOTER -->
			<div class="px-6 pb-6">
				<button
					class="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
				>
					Continue
				</button>
			</div>
		</div>
	</div>
{/if}
