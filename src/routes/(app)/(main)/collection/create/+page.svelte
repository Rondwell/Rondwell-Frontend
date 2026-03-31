<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		createCollection,
		uploadCollectionCoverBanner,
		uploadCollectionProfilePicture
	} from '$lib/services/event.services';
	import { colors, type Color } from '$lib/utils/colors';
	import Icon from '@iconify/svelte';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	let name = '';
	let descriptionHtml = '';
	let slug = '';
	let selectedColor: Color = colors[0];
	let submitting = false;
	let submitError = '';
	let showDescEditor = false;
	let coverFile: File | null = null;
	let coverPreview = '';
	let profileFile: File | null = null;
	let profilePreview = '';
	let descEditor: Readable<Editor>;
	let slugManuallyEdited = false;

	onMount(() => {
		descEditor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({ placeholder: 'Describe your collection...' }),
			],
			content: '',
			onUpdate: ({ editor }) => { descriptionHtml = editor.getHTML(); },
		});
	});

	onDestroy(() => { $descEditor?.destroy(); });

	function stripHtml(html: string): string {
		return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
	}

	$: descPreview = stripHtml(descriptionHtml) || 'Add a description';

	function generateSlug(text: string): string {
		return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
	}

	$: if (name && !slugManuallyEdited) { slug = generateSlug(name); }

	function handleSlugInput() { slugManuallyEdited = true; }

	function handleCoverSelect(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		coverFile = file;
		coverPreview = URL.createObjectURL(file);
	}

	function handleProfileSelect(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		profileFile = file;
		profilePreview = URL.createObjectURL(file);
	}

	type SocialLinkKey = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'linkedin' | 'website';
	let socialLinks: Record<SocialLinkKey, string> = {
		instagram: '', x: '', youtube: '', tiktok: '', linkedin: '', website: ''
	};
	const socialLinksMeta: { key: SocialLinkKey; icon: string; label: string | null }[] = [
		{ key: 'instagram', icon: 'mdi:instagram', label: 'instagram.com/' },
		{ key: 'x', icon: 'ri:twitter-x-fill', label: 'x.com/' },
		{ key: 'youtube', icon: 'mdi:youtube', label: 'youtube.com/@' },
		{ key: 'tiktok', icon: 'ic:baseline-tiktok', label: 'tiktok.com/@' },
		{ key: 'linkedin', icon: 'mdi:linkedin', label: 'linkedin.com/in/' },
		{ key: 'website', icon: 'mdi:web', label: null }
	];

	async function handleCreate() {
		if (!name.trim()) { submitError = 'Collection name is required'; return; }
		submitting = true;
		submitError = '';
		try {
			const collection = await createCollection({
				name: name.trim(),
				description: descriptionHtml.trim() || undefined,
				themeColor: selectedColor.name,
				slug: slug || undefined,
				socialLinks: Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v.trim())),
			});
			const id = collection._id ?? collection.id;
			const uploads: Promise<any>[] = [];
			if (profileFile) uploads.push(uploadCollectionProfilePicture(id, profileFile));
			if (coverFile) uploads.push(uploadCollectionCoverBanner(id, coverFile));
			if (uploads.length) await Promise.all(uploads);
			goto(`/collection/${id}/events`);
		} catch (e: any) {
			submitError = e.message ?? 'Failed to create collection';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="w-full space-y-8">
	<div class="rounded-lg">
		<!-- Back button + title -->
		<div class="mb-4 flex items-center gap-2">
			<button aria-label="Go back" on:click={() => history.back()}
				class="flex h-[29px] w-[29px] cursor-pointer items-center justify-center rounded-full bg-[#D8D8DD]">
				<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M9.2793 9.60352C8.62129 10.2457 7.66873 10.3899 6.85156 9.95801L1.31152 7.04199H1.3125C0.625893 6.68284 0.198242 5.97506 0.198242 5.19922C0.198273 4.42347 0.626009 3.71658 1.3125 3.35742L6.85156 0.442383L6.85059 0.441406C7.16604 0.273212 7.49893 0.19339 7.83203 0.193359C8.36285 0.193359 8.87545 0.401565 9.2793 0.794922C9.93827 1.43808 10.0974 2.39081 9.68652 3.21289L8.91211 4.76172C8.77777 5.0304 8.77707 5.35686 8.91211 5.63184L9.68652 7.18555C10.0975 8.00765 9.93828 8.96033 9.2793 9.60352Z" fill="#8E8E90" stroke="#8E8E90" stroke-width="0.394617"/>
					<rect x="5.09957" y="4.60738" width="3.34009" height="1.13098" rx="0.565492" fill="#919091" stroke="#8E8E90" stroke-width="0.394617"/>
				</svg>
			</button>
			<h1 class="text-xl font-medium sm:text-3xl">Create Collection</h1>
		</div>

		<!-- Cover Banner + Profile Picture + Name + Description -->
		<div class="relative mb-10 rounded-t-lg bg-[#FDFDFD]">
			<!-- Cover Banner -->
			<div class="relative h-[191px] overflow-hidden rounded-t-lg bg-[#D8D8DD]">
				{#if coverPreview}
					<img src={coverPreview} alt="Cover" class="h-full w-full object-cover" />
				{/if}
				<label for="cover-upload"
					class="absolute top-2 right-3 cursor-pointer rounded-md bg-[#E4E4E5] px-3 py-2 text-sm font-medium text-[#5D5E61] transition hover:bg-[#d4d4d5]">
					Change Cover
				</label>
				<input id="cover-upload" type="file" accept="image/*" class="hidden" on:change={handleCoverSelect} />
			</div>

			<!-- Profile Picture — bottom-left of cover, overlapping -->
			<div class="absolute left-5 z-20" style="top: 159px;">
				<label for="profile-upload" class="group relative block cursor-pointer">
					<div class="h-16 w-16 overflow-hidden rounded-lg border-3 border-white bg-[#EBECED] shadow-md">
						{#if profilePreview}
							<img src={profilePreview} alt="Profile" class="h-full w-full object-cover" />
						{:else}
							<img src="/edit-cover-photo.svg" alt="Upload" class="h-full w-full p-2" />
						{/if}
					</div>
					<div class="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
						<Icon icon="mdi:camera" class="h-3 w-3 text-gray-500" />
					</div>
				</label>
				<input id="profile-upload" type="file" accept="image/*" class="hidden" on:change={handleProfileSelect} />
			</div>

			<!-- Name + Description -->
			<div class="ml-4 mt-12 w-full">
				<input type="text" placeholder="Collection name" bind:value={name}
					class="h-12 w-full px-4 py-2 text-3xl font-semibold focus:ring-0 focus:outline-none" />
				<!-- Description — click to toggle rich editor -->
				<div class="relative mt-2 border-t">
					<button type="button"
						class="flex h-12 w-full items-center px-4 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none"
						on:click={() => (showDescEditor = !showDescEditor)}>
						<span class="truncate pr-6 {descriptionHtml ? 'text-gray-700' : 'text-gray-400'}">{descPreview}</span>
						<Icon icon={showDescEditor ? 'mdi:chevron-up' : 'mdi:chevron-down'} class="absolute right-4 text-gray-400" />
					</button>

					{#if showDescEditor && descEditor}
						<div class="absolute left-0 top-full z-40 w-full rounded-b-xl border border-t-0 border-gray-100 bg-white shadow-xl">
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
							<div class="min-h-[160px] max-h-[280px] overflow-y-auto p-4 text-sm text-gray-800">
								<EditorContent editor={$descEditor} />
							</div>
							<div class="flex justify-end border-t border-gray-100 bg-[#F8F9FA] px-4 py-2">
								<button class="rounded-lg bg-gray-900 px-5 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
									on:click={() => (showDescEditor = false)}>Done</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Theme / Tint Color -->
		<div class="mb-6 rounded-lg bg-[#FDFDFD] p-4">
			<h2 class="mb-3 text-2xl font-semibold">Customization</h2>
			<div class="mb-4">
				<label class="mb-2 block text-sm font-medium text-gray-700">Theme Color</label>
				<div class="flex flex-wrap items-center justify-start gap-3">
					{#each colors as color}
						<button type="button"
							class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
							style="background-color: {color.bg};"
							class:border-black={selectedColor.name === color.name}
							class:border-transparent={selectedColor.name !== color.name}
							on:click={() => (selectedColor = color)}
							aria-label={`Select ${color.name}`}></button>
					{/each}
				</div>
			</div>
			<div class="mb-4">
				<label class="mb-2 block text-sm font-medium text-gray-700">Public URL (Slug)</label>
				<div class="flex max-w-xl items-center">
					<span class="flex h-[42px] items-center rounded-l-md bg-[#F4F4F4] px-3 text-sm text-gray-500">rondwell.com/c/</span>
					<input type="text" placeholder="my-collection" bind:value={slug}
						on:input={handleSlugInput}
						class="h-[42px] flex-1 rounded-r-md border border-gray-300 bg-white px-3 text-sm focus:ring-0 focus:outline-none" />
				</div>
				<p class="mt-1 text-xs text-gray-400">This will be the shareable link for your collection page.</p>
			</div>
		</div>

		<!-- Social Links -->
		<div class="mb-6 rounded-lg bg-[#FDFDFD] p-4">
			<h3 class="mb-3 text-sm font-medium text-[#000]">Social Links</h3>
			<div class="flex w-fit flex-col gap-4">
				{#each socialLinksMeta as { key, icon, label }}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
							<Icon {icon} class="h-4 w-4" />
						</div>
						<div class="flex h-[42px] w-full items-center shadow-sm">
							{#if label}
								<div class="pointer-events-none flex h-full items-center rounded-tl-[7.5px] rounded-bl-[7.5px] bg-[#EBECED] p-3 text-xs text-[#84857A]">{label}</div>
							{/if}
							<input type="text" bind:value={socialLinks[key]}
								placeholder={key === 'website' ? 'https://yoursite.com' : 'username'}
								class="h-full w-full {key === 'website' ? 'rounded-[7.5px]' : 'rounded-tr-[7.5px] rounded-br-[7.5px]'} bg-white px-3 py-2 focus:outline-none focus:ring-0" />
						</div>
					</div>
				{/each}
			</div>
		</div>

		{#if submitError}
			<p class="mb-4 text-sm text-red-500">{submitError}</p>
		{/if}

		<button on:click={handleCreate} disabled={submitting}
			class="h-[42px] w-[208px] rounded-md bg-[#333537] text-lg text-white disabled:opacity-50">
			{submitting ? 'Creating...' : 'Create Collection'}
		</button>
	</div>
</div>

<style>
	:global(.ProseMirror) { outline: none; min-height: 80px; line-height: 1.6; }
	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder); color: #9ca3af; pointer-events: none; float: left; height: 0;
	}
	:global(.ProseMirror h1) { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; }
	:global(.ProseMirror h2) { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.4rem; }
	:global(.ProseMirror ul) { list-style: disc; padding-left: 1.5rem; }
	:global(.ProseMirror ol) { list-style: decimal; padding-left: 1.5rem; }
</style>
