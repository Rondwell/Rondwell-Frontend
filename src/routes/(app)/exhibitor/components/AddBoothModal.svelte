<script lang="ts">
	import { createBooth, deleteBoothMedia, updateBooth, uploadBoothMedia } from '$lib/services/exhibitor.services';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';

	export let show = false;
	export let onSuccess: () => void = () => {};
	export let editBooth: any = null;

	$: isEditMode = !!editBooth;
	$: if (show && editBooth) populateFromBooth(editBooth);
	$: if (!show) { lastPopulatedId = ''; }

	type Section = 'basic' | 'media' | 'resources';
	let openSection: Section | null = null;
	let submitting = false;
	let error = '';

	let boothTitle = '';
	let description = '';
	let isPublic = true;

	// ─── File Upload ──────────────────────────────────────────────────────
	type UploadedFile = { file: File; preview: string };
	type ExistingMedia = { url: string; type: 'IMAGE' | 'VIDEO'; caption?: string };
	let files: UploadedFile[] = [];
	let existingMedia: ExistingMedia[] = [];
	let removedMediaUrls: string[] = [];
	let isDragging = false;
	let fileInput: HTMLInputElement;
	const MAX_FILE_SIZE = 5 * 1024 * 1024;

	// ─── Resources ────────────────────────────────────────────────────────
	let resources: { title: string; url: string; type: 'PDF' | 'LINK' }[] = [];
	let newResourceTitle = '';
	let newResourceUrl = '';
	let newResourceType: 'PDF' | 'LINK' = 'LINK';

	function browseFiles() { fileInput?.click(); }
	function handleFiles(fl: FileList | null) {
		if (!fl) return;
		for (const f of Array.from(fl)) {
			if (f.size > MAX_FILE_SIZE) { error = `File "${f.name}" exceeds 5MB limit.`; continue; }
			files = [...files, { file: f, preview: URL.createObjectURL(f) }];
		}
	}
	function removeFile(i: number) {
		URL.revokeObjectURL(files[i].preview);
		files = files.filter((_, idx) => idx !== i);
	}
	function removeExistingMedia(i: number) {
		removedMediaUrls = [...removedMediaUrls, existingMedia[i].url];
		existingMedia = existingMedia.filter((_, idx) => idx !== i);
	}
	function addResource() {
		if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;
		resources = [...resources, { title: newResourceTitle.trim(), url: newResourceUrl.trim(), type: newResourceType }];
		newResourceTitle = ''; newResourceUrl = ''; newResourceType = 'LINK';
	}
	function removeResource(i: number) { resources = resources.filter((_, idx) => idx !== i); }

	onDestroy(() => files.forEach((f) => URL.revokeObjectURL(f.preview)));

	function toggle(s: Section) { openSection = openSection === s ? null : s; }
	function closeModal() { show = false; editBooth = null; resetForm(); }

	function resetForm() {
		boothTitle = ''; description = ''; isPublic = true; error = '';
		files.forEach((f) => URL.revokeObjectURL(f.preview));
		files = []; existingMedia = []; removedMediaUrls = []; resources = [];
		newResourceTitle = ''; newResourceUrl = ''; newResourceType = 'LINK';
		openSection = null;
	}

	let lastPopulatedId = '';
	function populateFromBooth(b: any) {
		if (!b || lastPopulatedId === b._id) return;
		lastPopulatedId = b._id;
		boothTitle = b.title || '';
		description = b.description || '';
		isPublic = b.status === 'PUBLISHED';
		existingMedia = (b.media || []).map((m: any) => ({ url: m.url, type: m.type, caption: m.caption }));
		resources = (b.resources || []).map((r: any) => ({ title: r.title, url: r.url, type: r.type }));
		files = []; removedMediaUrls = [];
	}

	async function handleSubmit() {
		error = '';
		if (!boothTitle.trim()) { error = 'Booth title is required.'; openSection = 'basic'; return; }
		if (!description.trim() || description.trim().length < 10) { error = 'Description must be at least 10 characters.'; openSection = 'basic'; return; }
		submitting = true;
		try {
			const newMedia: { url: string; type: 'IMAGE' | 'VIDEO' }[] = [];
			for (const f of files) {
				try {
					const url = await uploadBoothMedia(f.file);
					newMedia.push({ url, type: f.file.type.startsWith('video') ? 'VIDEO' : 'IMAGE' });
				} catch (uploadErr: any) {
					console.error('Upload failed for', f.file.name, uploadErr);
				}
			}

			if (isEditMode) {
				for (const url of removedMediaUrls) {
					try { await deleteBoothMedia(url); } catch (e) { console.error('Failed to delete media:', e); }
				}
			}

			const allMedia = [...existingMedia.map(m => ({ url: m.url, type: m.type })), ...newMedia];

			const payload: Record<string, unknown> = {
				title: boothTitle.trim(),
				description: description.trim(),
				media: allMedia,
				resources,
				status: isPublic ? 'PUBLISHED' : 'DRAFT',
			};

			if (allMedia.length > 0) {
				payload.bannerUrl = allMedia[0].url;
			}

			if (isEditMode) {
				await updateBooth(editBooth._id, payload);
			} else {
				await createBooth(payload);
			}
			closeModal();
			onSuccess();
		} catch (e: any) {
			error = e.message || `Failed to ${isEditMode ? 'update' : 'create'} booth. Please try again.`;
		} finally {
			submitting = false;
		}
	}
</script>

{#if show}
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
	on:click|self={closeModal}
	on:keydown={(e) => e.key === 'Escape' && closeModal()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#FDFCFB]"
		on:click|stopPropagation
		on:keydown|stopPropagation
		role="document"
	>
		<!-- ═══ HEADER ═══ -->
		<div class="relative border-b border-[#EBEBEB] px-6 pb-5 pt-6">
			<button on:click={closeModal} class="absolute right-4 top-4 rounded-full bg-[#EBECED] p-2 hover:bg-gray-200" aria-label="Close modal">
				<Icon icon="heroicons:x-mark" class="h-4 w-4 text-[#5C5C5C]" />
			</button>
			<div class="flex flex-col items-center text-center">
				<div class="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F0F0F0]">
					<img src="/NDB.svg" alt="" class="h-[72px] w-[72px] rounded-full" />
				</div>
				<h2 class="text-xl font-semibold text-[#171717]">{isEditMode ? 'Edit Booth / Stand' : 'Add Booth / Stand'}</h2>
				<p class="text-sm text-[#5C5C5C]">{isEditMode ? 'Update the details of your booth or stand.' : 'Provide details of your booth or stand to proceed.'}</p>
			</div>
		</div>

		<!-- ═══ SCROLLABLE BODY ═══ -->
		<div class="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6">
			{#if error}
				<div class="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
			{/if}

			<!-- Upload Area -->
			<div class="mb-5">
				<p class="mb-2 text-sm font-medium text-[#171717]">Images/Videos</p>
				<div
					class="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition {isDragging ? 'border-black bg-gray-50' : 'border-gray-300 bg-white'}"
					on:drop|preventDefault={(e) => { isDragging = false; handleFiles(e.dataTransfer?.files ?? null); }}
					on:dragover|preventDefault={() => (isDragging = true)}
					on:dragleave={() => (isDragging = false)}
					role="region"
					aria-label="File upload area"
				>
					<img src="/upload.svg" alt="" class="mb-2 h-7 w-7 opacity-50" />
					<p class="text-sm text-[#171717]">Choose a file or drag & drop it here.</p>
					<p class="mt-1 text-xs text-[#737373]">JPEG, PNG, PDF, and MP4 formats, up to 5 MB.</p>
					<button type="button" on:click={browseFiles} class="mt-3 rounded-lg border border-gray-300 px-5 py-1.5 text-sm font-medium text-[#5C5C5C] hover:bg-gray-50">Browse File</button>
					<input bind:this={fileInput} type="file" class="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.mp4" on:change={(e) => handleFiles((e.target as HTMLInputElement).files)} />
				</div>

				<!-- Existing media (edit mode) -->
				{#if existingMedia.length > 0}
					<div class="mt-3 space-y-2">
						{#each existingMedia as item, idx}
							<div class="flex items-center justify-between rounded-lg border bg-white p-2.5">
								<div class="flex items-center gap-2 min-w-0">
									{#if item.type === 'IMAGE'}
										<img src={item.url} alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
									{:else}
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-bold text-blue-500">VID</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate text-xs font-medium">Existing file</p>
										<p class="text-[10px] text-gray-400"><span class="text-green-600">✓ Uploaded</span></p>
									</div>
								</div>
								<button on:click={() => removeExistingMedia(idx)} class="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remove file">
									<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- New files -->
				{#if files.length > 0}
					<div class="mt-3 space-y-2">
						{#each files as item, idx}
							<div class="flex items-center justify-between rounded-lg border bg-white p-2.5">
								<div class="flex items-center gap-2 min-w-0">
									{#if item.file.type.startsWith('image')}
										<img src={item.preview} alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
									{:else}
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-50 text-[10px] font-bold text-red-500">PDF</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate text-xs font-medium">{item.file.name}</p>
										<p class="text-[10px] text-gray-400">{(item.file.size / 1024).toFixed(0)} KB · <span class="text-green-600">✓ Completed</span></p>
									</div>
								</div>
								<button on:click={() => removeFile(idx)} class="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remove file">
									<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- ═══ ACCORDIONS ═══ -->
			<div class="space-y-3">
				<!-- ── Basic Information ── -->
				<div>
					<button on:click={() => toggle('basic')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:help-circle-outline" class="h-4 w-4 text-gray-400" /> Basic Information</span>
						<Icon icon={openSection === 'basic' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'basic'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<div>
								<label for="booth-title" class="mb-1 flex items-center gap-1 text-sm font-medium">Booth Title <Icon icon="mdi:information-outline" class="h-3.5 w-3.5 text-gray-400" /></label>
								<input id="booth-title" bind:value={boothTitle} placeholder="e.g. Innovative Tech Showcase 2025..." class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
							</div>
							<div>
								<label for="booth-desc" class="mb-1 block text-sm font-medium">Booth Description <span class="text-[#335CFF]">*</span></label>
								<div class="relative">
									<textarea id="booth-desc" bind:value={description} maxlength="500" rows="3" placeholder="Describe your booth or stand..." class="w-full resize-none rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 pr-16 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
									<span class="pointer-events-none absolute right-3 bottom-2 text-[10px] text-gray-400">{description.length}/500</span>
								</div>
								<p class="mt-1 flex items-center gap-1 text-[10px] text-gray-400"><Icon icon="mdi:information-outline" class="h-3 w-3" /> Describe what visitors will find at your booth.</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- ── Downloadable Resources ── -->
				<div>
					<button on:click={() => toggle('resources')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:file-download-outline" class="h-4 w-4 text-gray-400" /> Downloadable Resources</span>
						<Icon icon={openSection === 'resources' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'resources'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							{#if resources.length > 0}
								<div class="space-y-2">
									{#each resources as res, idx}
										<div class="flex items-center justify-between rounded-lg border bg-gray-50 p-2.5">
											<div class="flex items-center gap-2 min-w-0">
												<Icon icon={res.type === 'PDF' ? 'mdi:file-pdf-box' : 'mdi:link-variant'} class="h-5 w-5 shrink-0 {res.type === 'PDF' ? 'text-red-500' : 'text-blue-500'}" />
												<div class="min-w-0">
													<p class="truncate text-xs font-medium">{res.title}</p>
													<p class="truncate text-[10px] text-gray-400">{res.url}</p>
												</div>
											</div>
											<button on:click={() => removeResource(idx)} class="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remove resource">
												<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
											</button>
										</div>
									{/each}
								</div>
							{/if}
							<div class="space-y-2">
								<input bind:value={newResourceTitle} placeholder="Resource title..." class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
								<input bind:value={newResourceUrl} placeholder="URL (e.g. https://...)" class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
								<div class="flex items-center gap-2">
									<select bind:value={newResourceType} class="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300">
										<option value="LINK">Link</option>
										<option value="PDF">PDF</option>
									</select>
									<button type="button" on:click={addResource} class="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800">Add Resource</button>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- ── Additional Details ── -->
				<div>
					<button on:click={() => toggle('media')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:cog-outline" class="h-4 w-4 text-gray-400" /> Additional Details</span>
						<Icon icon={openSection === 'media' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'media'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" bind:checked={isPublic} class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" />
								<div>
									<span class="text-sm font-medium text-[#171717]">Publish immediately</span>
									<p class="text-[10px] text-gray-400">When enabled, this booth will be visible publicly. Otherwise it will be saved as a draft.</p>
								</div>
							</label>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ═══ FOOTER ═══ -->
		<div class="border-t border-[#EBEBEB] px-6 py-4">
			<div class="flex items-center justify-end gap-3">
				<button on:click={closeModal} class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-[#5C5C5C] hover:bg-gray-50">
					Cancel
				</button>
				<button
					on:click={handleSubmit}
					disabled={submitting}
					class="flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if submitting}
						<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
						{isEditMode ? 'Saving...' : 'Creating...'}
					{:else}
						<Icon icon={isEditMode ? 'mdi:content-save-outline' : 'mdi:plus'} class="h-4 w-4" />
						{isEditMode ? 'Save Changes' : 'Create Booth'}
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
</style>
