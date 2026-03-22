<script lang="ts">
	import { page } from '$app/stores';
	import { getEventById, updateEvent, uploadEventPhoto } from '$lib/services/event.services';
	import { colors, type Color } from '$lib/utils/colors';
	import Icon from '@iconify/svelte';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	$: eventId = $page.params.id ?? '';

	type SocialLinkKey = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'linkedin' | 'website';

	let loading = true;
	let saving = false;
	let saveError = '';
	let saveSuccess = false;
	let uploadingCover = false;
	let coverInput: HTMLInputElement;
	let showDescEditor = false;

	let name = '';
	let descriptionHtml = ''; // stored as HTML for rich editor
	let selectedColor: Color = colors[0];
	let publicUrl = '';
	let socialPreviewImage: string | null = null;
	let rawEvent: any = null;
	let links: Record<SocialLinkKey, string> = {
		instagram: '', x: '', youtube: '', tiktok: '', linkedin: '', website: ''
	};

	// Rich text editor
	let descEditor: Readable<Editor>;

	function stripHtml(html: string): string {
		return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
	}

	onMount(async () => {
		try {
			const event = await getEventById(eventId);
			rawEvent = event;
			name = event.title ?? '';
			descriptionHtml = event.description ?? '';
			// Match themeColor name to a color object (case-insensitive)
			const matched = colors.find(
				c => c.name.toLowerCase() === (event.themeColor ?? '').toLowerCase()
				  || c.bg.toLowerCase() === (event.themeColor ?? '').toLowerCase()
			);
			selectedColor = matched ?? colors[0];
			publicUrl = event.customLinkSlug ?? '';
			const sl = event.socialLinks ?? {};
			links = {
				instagram: sl.instagram ?? '',
				x: sl.x ?? sl.twitter ?? '',
				youtube: sl.youtube ?? '',
				tiktok: sl.tiktok ?? '',
				linkedin: sl.linkedin ?? '',
				website: sl.website ?? ''
			};
			socialPreviewImage = event.coverPictureUrl ?? event.displayPictureUrl ?? null;
		} catch (e: any) {
			saveError = e.message ?? 'Failed to load event';
		} finally {
			loading = false;
		}

		descEditor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({ placeholder: "Who should come? What's the event about?" }),
			],
			content: descriptionHtml || '',
			onUpdate: ({ editor }) => {
				descriptionHtml = editor.getHTML();
			},
		});
	});

	onDestroy(() => {
		$descEditor?.destroy();
	});

	async function saveChanges() {
		saving = true;
		saveError = '';
		saveSuccess = false;
		try {
			await updateEvent(eventId, {
				title: name,
				description: descriptionHtml,
				themeColor: selectedColor.name,
				customLinkSlug: publicUrl || undefined,
				socialLinks: links,
			} as any);
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 3000);
		} catch (e: any) {
			saveError = e.message ?? 'Failed to save';
		} finally {
			saving = false;
		}
	}

	async function onCoverSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadingCover = true;
		try {
			const url = await uploadEventPhoto(eventId, file, 'COVER');
			socialPreviewImage = url;
		} catch (err: any) {
			saveError = err.message ?? 'Failed to upload cover';
		} finally {
			uploadingCover = false;
			input.value = '';
		}
	}

	function handleDragOver(event: DragEvent) { event.preventDefault(); }

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		if (!file) return;
		uploadingCover = true;
		uploadEventPhoto(eventId, file, 'COVER')
			.then(url => { socialPreviewImage = url; })
			.catch(err => { saveError = err.message ?? 'Failed to upload'; })
			.finally(() => { uploadingCover = false; });
	}

	const socialLinks: { key: SocialLinkKey; icon: string; label: string }[] = [
		{ key: 'instagram', icon: 'mdi:instagram', label: 'instagram.com/' },
		{ key: 'x', icon: 'mdi:twitter', label: 'x.com/' },
		{ key: 'youtube', icon: 'mdi:youtube', label: 'youtube.com/@' },
		{ key: 'tiktok', icon: 'simple-icons:tiktok', label: 'tiktok.com/@' },
		{ key: 'linkedin', icon: 'mdi:linkedin', label: 'linkedin.com/in/' },
		{ key: 'website', icon: 'mdi:web', label: '' },
	];

	$: descPreview = stripHtml(descriptionHtml) || 'Add a short description';
</script>

<input type="file" accept="image/*" class="hidden" bind:this={coverInput} on:change={onCoverSelected} />

<div class="w-full max-w-5xl">
	<!-- Header -->
	<div class="mb-6 flex items-center gap-2">
		<button
			aria-label="back button"
			on:click={() => history.back()}
			class="flex h-[29px] w-[29px] cursor-pointer items-center justify-center rounded-full bg-[#D8D8DD]"
		>
			<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M9.2793 9.60352C8.62129 10.2457 7.66873 10.3899 6.85156 9.95801L1.31152 7.04199H1.3125C0.625893 6.68284 0.198242 5.97506 0.198242 5.19922C0.198273 4.42347 0.626009 3.71658 1.3125 3.35742L6.85156 0.442383L6.85059 0.441406C7.16604 0.273212 7.49893 0.19339 7.83203 0.193359C8.36285 0.193359 8.87545 0.401565 9.2793 0.794922C9.93827 1.43808 10.0974 2.39081 9.68652 3.21289L8.91211 4.76172C8.77777 5.0304 8.77707 5.35686 8.91211 5.63184L9.68652 7.18555C10.0975 8.00765 9.93828 8.96033 9.2793 9.60352Z" fill="#8E8E90" stroke="#8E8E90" stroke-width="0.394617"/>
				<rect x="5.09957" y="4.60738" width="3.34009" height="1.13098" rx="0.565492" fill="#919091" stroke="#8E8E90" stroke-width="0.394617"/>
			</svg>
		</button>
		<h1 class="text-3xl font-bold">Edit Event</h1>
	</div>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-[191px] rounded-t-lg bg-gray-200"></div>
			<div class="h-12 w-3/4 rounded bg-gray-200"></div>
			<div class="h-8 w-1/2 rounded bg-gray-200"></div>
		</div>
	{:else}
		<!-- Event Title / Description -->
		<div class="relative mb-6 rounded-t-lg bg-[#FDFDFD]">
			<div class="relative h-[191px] rounded-t-lg bg-[#D8D8DD] overflow-hidden">
				{#if socialPreviewImage}
					<img src={socialPreviewImage} alt="Cover" class="h-full w-full object-cover" />
				{/if}
				<button
					class="absolute top-2 right-3 rounded-md bg-[#E4E4E5] px-3 py-2 text-sm font-medium text-[#5D5E61]"
					on:click={() => coverInput?.click()}
					disabled={uploadingCover}
				>
					{uploadingCover ? 'Uploading...' : 'Change Cover'}
				</button>
			</div>
			<!-- Event avatar: shows actual event image or fallback icon -->
			<div class="absolute bottom-24 left-5 h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-[#D8D8DD] shadow-md">
				{#if socialPreviewImage}
					<img src={socialPreviewImage} alt="Event" class="h-full w-full object-cover" />
				{:else}
					<img src="/edit-cover-photo.svg" alt="" class="h-full w-full" />
				{/if}
			</div>
			<div class="mt-8 ml-4 mr-6 w-full pr-6">
				<input
					type="text"
					placeholder="Event name"
					bind:value={name}
					class="h-12 w-full px-4 py-2 text-3xl font-semibold focus:ring-0 focus:outline-none"
				/>
				<!-- Description — click to open rich editor -->
				<div class="relative mt-2 border-t">
					<button
						type="button"
						class="flex h-12 w-full items-center px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 focus:outline-none"
						on:click={() => (showDescEditor = !showDescEditor)}
					>
						<span class="truncate pr-6 {descriptionHtml ? 'text-gray-700' : 'text-gray-400'}">{descPreview}</span>
						<Icon icon={showDescEditor ? 'mdi:chevron-up' : 'mdi:chevron-down'} class="absolute right-4 text-gray-400" />
					</button>

					{#if showDescEditor && descEditor}
						<div class="absolute left-0 top-full z-40 w-full rounded-b-xl border border-t-0 border-gray-100 bg-white shadow-xl">
							<!-- Toolbar -->
							<div class="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-[#F8F9FA] px-3 py-1.5">
								{#if $descEditor}
									<button type="button" on:click={() => $descEditor.chain().focus().toggleBold().run()}
										class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200 {$descEditor.isActive('bold') ? 'bg-gray-800 text-white' : 'text-gray-700'}">B</button>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleItalic().run()}
										class="rounded px-2 py-1 text-sm italic hover:bg-gray-200 {$descEditor.isActive('italic') ? 'bg-gray-800 text-white' : 'text-gray-700'}">I</button>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleStrike().run()}
										class="rounded px-2 py-1 text-sm line-through hover:bg-gray-200 {$descEditor.isActive('strike') ? 'bg-gray-800 text-white' : 'text-gray-700'}">S</button>
									<div class="mx-1 h-4 w-px bg-gray-300"></div>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleHeading({ level: 1 }).run()}
										class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$descEditor.isActive('heading', { level: 1 }) ? 'bg-gray-800 text-white' : 'text-gray-700'}">H1</button>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleHeading({ level: 2 }).run()}
										class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$descEditor.isActive('heading', { level: 2 }) ? 'bg-gray-800 text-white' : 'text-gray-700'}">H2</button>
									<div class="mx-1 h-4 w-px bg-gray-300"></div>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleBulletList().run()}
										class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$descEditor.isActive('bulletList') ? 'bg-gray-800 text-white' : 'text-gray-700'}">• List</button>
									<button type="button" on:click={() => $descEditor.chain().focus().toggleOrderedList().run()}
										class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$descEditor.isActive('orderedList') ? 'bg-gray-800 text-white' : 'text-gray-700'}">1. List</button>
									<div class="mx-1 h-4 w-px bg-gray-300"></div>
									<button type="button" on:click={() => $descEditor.chain().focus().undo().run()}
										class="rounded px-2 py-1 text-sm hover:bg-gray-200 text-gray-700">↩</button>
									<button type="button" on:click={() => $descEditor.chain().focus().redo().run()}
										class="rounded px-2 py-1 text-sm hover:bg-gray-200 text-gray-700">↪</button>
								{/if}
							</div>
							<!-- Editor area -->
							<div class="min-h-[160px] max-h-[280px] overflow-y-auto p-4 text-sm text-gray-800">
								<EditorContent editor={$descEditor} />
							</div>
							<div class="flex justify-end border-t border-gray-100 bg-[#F8F9FA] px-4 py-2">
								<button
									class="rounded-lg bg-gray-900 px-5 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
									on:click={() => (showDescEditor = false)}
								>Done</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Customization -->
		<div class="mb-6 rounded-lg bg-[#FDFDFD] p-4">
			<h2 class="mb-3 text-2xl font-semibold">Customization</h2>

			<!-- Tint Color -->
			<div class="mb-4">
				<label class="mb-2 block text-sm font-medium text-gray-700">Tint Color</label>
				<div class="flex flex-wrap items-center gap-3">
					{#each colors as color}
						<button
							type="button"
							title={color.name}
							class="relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
							style="background-color: {color.bg}; border-color: {selectedColor.name === color.name ? color.button : '#e5e7eb'};"
							on:click={() => (selectedColor = color)}
						>
							{#if selectedColor.name === color.name}
								<span class="absolute inset-0 flex items-center justify-center">
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
										<path d="M2 6l3 3 5-5" stroke={color.button} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</span>
							{/if}
						</button>
					{/each}
				</div>
				<p class="mt-2 text-xs text-gray-400">Selected: {selectedColor.name}</p>
			</div>

			<!-- Public URL -->
			<div class="mb-4">
				<label for="public-url" class="mb-2 block text-sm font-medium text-gray-700">Public URL</label>
				<div class="flex max-w-xl items-center">
					<span class="w-32 rounded-l-md bg-[#F4F4F4] p-3 text-sm text-gray-500">rondwell.com/</span>
					<input
						id="public-url"
						type="text"
						placeholder="some-event-slug"
						bind:value={publicUrl}
						class="flex-1 rounded-r-md border border-gray-300 bg-[#FFFFFF] p-3 text-sm focus:ring-0 focus:outline-none"
					/>
				</div>
			</div>
		</div>

		<!-- Links -->
		<div class="mb-6 rounded-lg bg-[#FDFDFD] p-4">
			<h2 class="mb-1 font-semibold">Links</h2>
			<p class="mb-4 text-xs text-gray-400">These will appear as clickable icons on your event page.</p>
			<div class="grid w-full max-w-xl grid-cols-1 gap-5">
				{#each socialLinks as { key, icon, label }}
					<div class="flex items-center gap-4">
						<Icon {icon} class="h-5 w-5 text-[#A3A5A5]" />
						<div class="flex h-[42px] w-full items-center shadow-sm">
							{#if label}
								<div class="pointer-events-none flex h-full items-center rounded-tl-[7.5px] rounded-bl-[7.5px] bg-[#EBECED] p-3 text-xs text-[#84857A]">
									{label}
								</div>
							{/if}
							<input
								type="text"
								bind:value={links[key]}
								placeholder={key === 'website' ? 'https://yourwebsite.com' : 'username'}
								class="h-full w-full {key === 'website' ? 'rounded-[7.5px]' : 'rounded-tr-[7.5px] rounded-br-[7.5px]'} border border-gray-200 bg-[#FFFFFF] px-3 py-2 text-sm focus:ring-0 focus:outline-none"
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Social Sharing Preview -->
		<div class="mb-6 rounded-lg border border-gray-200 bg-white p-4">
			<h2 class="mb-1 font-semibold">Sharing</h2>
			<p class="mb-4 text-sm text-gray-500">Preview how your event will appear when shared on social media.</p>

			<!-- Upload area -->
			<button
				on:dragover={handleDragOver}
				on:drop={handleDrop}
				on:click={() => coverInput?.click()}
				class="mb-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-50"
			>
				<Icon icon="mdi:upload" class="text-lg" />
				{uploadingCover ? 'Uploading...' : 'Upload cover image'}
			</button>

			<!-- Side-by-side preview cards -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- Facebook-style preview card -->
				<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
					<div class="relative h-[140px] w-full bg-gray-100">
						{#if socialPreviewImage}
							<img src={socialPreviewImage} alt="Social Preview" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full items-center justify-center text-gray-300">
								<Icon icon="mdi:image-outline" class="text-4xl" />
							</div>
						{/if}
						<div class="absolute top-2 left-2">
							<span class="rounded-full bg-[#1877F2] px-2 py-0.5 text-xs font-medium text-white">Facebook</span>
						</div>
					</div>
					<div class="border-t border-gray-100 bg-[#F0F2F5] px-3 py-2">
						<p class="text-[9px] uppercase tracking-wide text-gray-400">rondwell.com{publicUrl ? `/${publicUrl}` : ''}</p>
						<p class="mt-0.5 text-xs font-semibold text-gray-900 line-clamp-1">{name || 'Event Name'}</p>
						<p class="mt-0.5 text-[10px] text-gray-500 line-clamp-2">{stripHtml(descriptionHtml) || 'Your event description will appear here.'}</p>
					</div>
				</div>

				<!-- Instagram-style preview -->
				<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
					<div class="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100">
						<div class="h-6 w-6 rounded-full bg-gradient-to-tr from-[#F77737] to-[#833AB4]"></div>
						<span class="text-xs font-semibold text-gray-800">rondwell</span>
						<span class="ml-auto rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] px-2 py-0.5 text-xs font-medium text-white">Instagram</span>
					</div>
					<div class="relative h-[140px] w-full bg-gray-100">
						{#if socialPreviewImage}
							<img src={socialPreviewImage} alt="Instagram Preview" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full items-center justify-center text-gray-300">
								<Icon icon="mdi:image-outline" class="text-4xl" />
							</div>
						{/if}
					</div>
					<div class="px-3 py-2">
						<p class="text-[10px] text-gray-800 line-clamp-2"><span class="font-semibold">rondwell</span> {stripHtml(descriptionHtml) || 'Your event description...'}</p>
					</div>
				</div>
			</div>

			<p class="mt-3 text-xs text-[#B3B4B4]">For best results, use an image with a 1.9:1 ratio for Facebook and 1:1 for Instagram.</p>
		</div>

		{#if saveError}
			<p class="mt-3 text-sm text-red-500">{saveError}</p>
		{/if}
		{#if saveSuccess}
			<p class="mt-3 text-sm text-green-600">Changes saved successfully.</p>
		{/if}

		<!-- Save -->
		<div class="mt-6 mb-10">
			<button
				on:click={saveChanges}
				disabled={saving}
				class="flex items-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
			>
				<svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M5.30273 2.8125H6.63184V4.125C6.63184 4.50932 6.86845 4.8386 7.2002 4.9834V6.51367C6.86849 6.65838 6.63201 6.98787 6.63184 7.37207V10.6279C6.63201 11.012 6.86868 11.3406 7.2002 11.4854V13.0156C6.86826 13.1603 6.63184 13.4905 6.63184 13.875V15.1875H5.30273C3.64484 15.1875 2.693 14.9316 2.13574 14.3799C1.57986 13.8292 1.32227 12.8899 1.32227 11.25V10.875C1.32227 10.7781 1.40865 10.6875 1.51562 10.6875C2.44628 10.6874 3.21582 9.93052 3.21582 9C3.21582 8.06948 2.44628 7.31264 1.51562 7.3125C1.40865 7.3125 1.32227 7.22189 1.32227 7.125V6.75C1.32227 5.11009 1.57986 4.17077 2.13574 3.62012C2.693 3.06836 3.64484 2.8125 5.30273 2.8125Z" fill="white" stroke="white" stroke-width="0.75"/>
					<path opacity="0.4" d="M12.8789 2.8125C14.5366 2.81254 15.4877 3.0684 16.0449 3.62012C16.601 4.17073 16.8594 5.10977 16.8594 6.75V7.5C16.8594 7.59687 16.773 7.68745 16.666 7.6875C15.7352 7.6875 14.9658 8.44439 14.9658 9.375C14.9658 10.3056 15.7352 11.0625 16.666 11.0625C16.773 11.0625 16.8594 11.1531 16.8594 11.25C16.8594 12.8902 16.601 13.8293 16.0449 14.3799C15.4877 14.9316 14.5366 15.1875 12.8789 15.1875H8.51953V13.875C8.51953 13.4905 8.28312 13.1603 7.95117 13.0156V11.4854C8.2827 11.3406 8.51936 11.012 8.51953 10.6279V7.37207C8.51936 6.98787 8.28289 6.65838 7.95117 6.51367V4.9834C8.28293 4.8386 8.51953 4.50933 8.51953 4.125V2.8125H12.8789Z" fill="white" stroke="white" stroke-width="0.75"/>
					<path d="M9.84375 5.98509L11.359 7.48535L14.619 4.5" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				{saving ? 'Saving...' : 'Save Changes'}
			</button>
		</div>
	{/if}
</div>

<style>
	:global(.ProseMirror) { outline: none; min-height: 80px; line-height: 1.6; }
	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder); color: #9ca3af; pointer-events: none; float: left; height: 0;
	}
	:global(.ProseMirror h1) { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; }
	:global(.ProseMirror h2) { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.4rem; }
	:global(.ProseMirror p) { margin-bottom: 0.5rem; }
	:global(.ProseMirror ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
	:global(.ProseMirror ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
	:global(.ProseMirror strong) { font-weight: 700; }
	:global(.ProseMirror em) { font-style: italic; }
</style>
