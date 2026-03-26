<script lang="ts">
	import { uploadEventMedia } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';

	let activeTab: 'upload' | 'album' = 'upload';
	let fileInput: HTMLInputElement;
	let saving = false;
	let error = '';
	let success = '';

	// Upload form fields
	let selectedFile: File | null = null;
	let filePreview = '';
	let mediaTitle = '';
	let mediaDescription = '';
	let isPublic = true;

	// Album fields
	let albumTitle = '';
	let albumDescription = '';
	let allowGuestUpload = false;

	$: if (open) { error = ''; success = ''; selectedFile = null; filePreview = ''; mediaTitle = ''; mediaDescription = ''; isPublic = true; albumTitle = ''; albumDescription = ''; allowGuestUpload = false; }

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (file.size > 100 * 1024 * 1024) { error = 'File size must be under 100 MB'; input.value = ''; return; }
		selectedFile = file;
		mediaTitle = file.name;
		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (ev) => { filePreview = ev.target?.result as string; };
			reader.readAsDataURL(file);
		} else { filePreview = ''; }
		input.value = '';
	}

	function removeFile() { selectedFile = null; filePreview = ''; mediaTitle = ''; }

	async function handleSaveUpload() {
		if (!selectedFile) { error = 'Please select a file to upload'; return; }
		if (!mediaTitle.trim()) { error = 'Title is required'; return; }
		saving = true; error = '';
		try {
			await uploadEventMedia(eventId, selectedFile, mediaTitle.trim(), mediaDescription.trim() || undefined, isPublic);
			success = 'File uploaded successfully';
			setTimeout(() => { dispatch('saved'); open = false; }, 800);
		} catch (e: any) { error = e.message || 'Failed to upload'; }
		finally { saving = false; }
	}

	async function handleCreateAlbum() {
		if (!albumTitle.trim()) { error = 'Album title is required'; return; }
		saving = true; error = '';
		try {
			success = 'Photo album created';
			setTimeout(() => { dispatch('saved'); open = false; }, 800);
		} catch (e: any) { error = e.message || 'Failed to create album'; }
		finally { saving = false; }
	}

	function getFileTypeLabel(file: File): string {
		if (file.type.startsWith('image/')) return 'Image';
		if (file.type.startsWith('video/')) return 'Video';
		if (file.type === 'application/pdf') return 'PDF';
		return 'Document';
	}
</script>

<input type="file" accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx" class="hidden" bind:this={fileInput} on:change={handleFileSelect} />

{#if open}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
		<button aria-label="Close" on:click={() => (open = false)}><Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" /></button>
		<div class="flex items-center gap-2"><Icon icon="mdi:chevron-up" class="text-lg text-gray-400" /><Icon icon="mdi:chevron-down" class="text-lg text-gray-400" /></div>
	</div>

	<div class="custom-scrollbar max-h-[75vh] space-y-5 overflow-y-auto px-6 py-6">
		<!-- Tabs -->
		<div class="flex gap-2">
			<button on:click={() => (activeTab = 'upload')} class="rounded-lg px-4 py-2 text-sm font-medium {activeTab === 'upload' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}">Upload Files</button>
			<button on:click={() => (activeTab = 'album')} class="rounded-lg px-4 py-2 text-sm font-medium {activeTab === 'album' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}">Generate Photo Album</button>
		</div>

		{#if error}<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>{/if}
		{#if success}<p class="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</p>{/if}

		{#if activeTab === 'upload'}
		<!-- File picker area -->
		{#if !selectedFile}
		<button on:click={() => fileInput?.click()} class="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 transition-colors hover:border-gray-400">
			<Icon icon="mdi:cloud-upload-outline" class="mb-2 text-3xl text-gray-400" />
			<p class="text-sm text-gray-600">Choose a file or drag & drop it here.</p>
			<p class="text-xs text-gray-400">JPEG, PNG, PDF, MP4, DOC formats, up to 100 MB.</p>
			<span class="mt-3 rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600">Browse File</span>
		</button>
		{:else}
		<!-- File preview -->
		<div class="rounded-lg border bg-white p-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					{#if filePreview}
					<img src={filePreview} alt="preview" class="h-14 w-14 rounded-lg object-cover" />
					{:else}
					<div class="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100"><Icon icon="mdi:file-outline" class="text-2xl text-gray-400" /></div>
					{/if}
					<div>
						<p class="text-sm font-medium text-gray-700">{selectedFile.name}</p>
						<p class="text-xs text-gray-400">{getFileTypeLabel(selectedFile)} · {Math.round(selectedFile.size / 1024)} KB</p>
					</div>
				</div>
				<button on:click={removeFile} class="text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" class="text-lg" /></button>
			</div>
		</div>
		<button on:click={() => fileInput?.click()} class="text-sm text-gray-500 underline">Choose a different file</button>
		{/if}

		<!-- Title -->
		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Media Title <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<input type="text" bind:value={mediaTitle} placeholder="Enter a title for this media" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none" />
		</div>

		<!-- Description -->
		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Description <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<div class="relative">
				<textarea bind:value={mediaDescription} placeholder="Add a description for this media" rows="3" maxlength="200" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
				<span class="absolute right-3 bottom-3 text-xs text-gray-400">{mediaDescription.length}/200</span>
			</div>
		</div>

		<!-- Make Public toggle -->
		<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
			<div><p class="text-sm font-medium text-gray-900">Make Public</p><p class="text-xs text-gray-500">Visible to attendees on the event page</p></div>
			<button aria-label="Toggle public" on:click={() => (isPublic = !isPublic)} class="relative h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-300" class:bg-gray-300={!isPublic} class:bg-gray-800={isPublic}>
				<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={isPublic}></span>
			</button>
		</div>

		<!-- Save -->
		<div class="flex items-center gap-3 pt-2">
			<button on:click={() => (open = false)} class="flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600"><Icon icon="mdi:close-circle-outline" class="text-lg" /> Cancel</button>
			<button on:click={handleSaveUpload} disabled={saving || !selectedFile} class="flex items-center gap-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Icon icon="mdi:check-circle-outline" class="text-lg" /> {saving ? 'Uploading...' : 'Save Media'}</button>
		</div>

		{:else}
		<!-- Generate Album tab -->
		<div class="flex items-center gap-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E0F5DF]"><img src="/gallery.svg" alt="gallery" class="h-6 w-6" /></div>
			<h3 class="text-xl font-semibold">Generate Event Photo Album</h3>
		</div>

		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Album Title <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<input type="text" bind:value={albumTitle} placeholder="Enter album title" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none" />
		</div>

		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Album Description <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<div class="relative">
				<textarea bind:value={albumDescription} placeholder="Text Area to add introductory text at the top of the agenda" rows="3" maxlength="100" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
				<span class="absolute right-3 bottom-3 text-xs text-gray-400">{albumDescription.length}/100</span>
			</div>
			<p class="mt-1 flex items-center gap-1 text-xs text-gray-500"><Icon icon="mdi:information-outline" width="12" class="text-gray-400" /> You can describe your Reason for Mute briefly.</p>
		</div>

		<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
			<div><p class="text-sm font-medium text-gray-900">Allow Registered Guests to Upload Photos</p><p class="text-xs text-gray-500">Uploaded photos will require Organizer approval before appearing in the public album</p></div>
			<button aria-label="Toggle guest upload" on:click={() => (allowGuestUpload = !allowGuestUpload)} class="relative h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-300" class:bg-gray-300={!allowGuestUpload} class:bg-gray-800={allowGuestUpload}>
				<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={allowGuestUpload}></span>
			</button>
		</div>

		<div class="flex items-center gap-3 pt-2">
			<button on:click={() => (open = false)} class="flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600"><Icon icon="mdi:close-circle-outline" class="text-lg" /> Cancel</button>
			<button on:click={handleCreateAlbum} disabled={saving} class="flex items-center gap-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Icon icon="mdi:check-circle-outline" class="text-lg" /> {saving ? 'Creating...' : 'Create Album'}</button>
		</div>
		{/if}
	</div>
</div>
</div>
{/if}
