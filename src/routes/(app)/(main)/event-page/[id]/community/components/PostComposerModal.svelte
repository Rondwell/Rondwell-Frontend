<script lang="ts">
	import { uploadCommunityImage, deleteCommunityImage } from '$lib/services/community.services';
	import type { Color } from '$lib/utils/colors';
	import Icon from '@iconify/svelte';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	export let open = false;
	export let eventId = '';
	export let roomName = '';
	export let themeColor: Color;
	export let submitting = false;

	const dispatch = createEventDispatcher();

	let title = '';
	let content = '';
	let coverUrl = '';
	let coverUploading = false;
	let inlineUploading = false;
	let error = '';

	// Draft images uploaded this session but not yet published. Abandoned drafts
	// (cancel/close, or replaced/removed images) are deleted from S3; the server
	// promotes the survivors to permanent when the post is created.
	let draftImages = new Set<string>();

	function trackDraft(url: string) {
		if (url) draftImages.add(url);
	}
	function discardDraft(url: string) {
		if (!url) return;
		draftImages.delete(url);
		deleteCommunityImage(url); // best-effort; lifecycle rule is the safety net
	}
	function discardAllDrafts() {
		for (const url of draftImages) deleteCommunityImage(url);
		draftImages = new Set();
	}

	let coverInput: HTMLInputElement;
	let inlineInput: HTMLInputElement;
	let showLinkInput = false;
	let linkUrl = '';

	let editor: Readable<Editor>;

	onMount(() => {
		editor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({ placeholder: 'Share something with the community…' }),
				Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: 'post-img' } }),
				Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow' } })
			],
			content: '',
			onUpdate: ({ editor }) => { content = editor.getHTML(); }
		});
	});

	onDestroy(() => { $editor?.destroy(); });

	// Reset the composer only on the open transition. We track the previous
	// `open` value in a plain variable so this reactive block depends ONLY on
	// `open` — referencing `$editor` here would make it re-run on every editor
	// transaction and cause an infinite clearContent() loop (page freeze).
	let prevOpen = false;
	$: {
		if (open && !prevOpen) onOpen();
		prevOpen = open;
	}
	function onOpen() {
		title = '';
		content = '';
		coverUrl = '';
		error = '';
		draftImages = new Set();
		tick().then(() => $editor?.commands.clearContent());
	}

	// `keepDrafts` is true only after a successful publish (the server promotes
	// and keeps the images); otherwise uploaded-but-unpublished images are
	// cleaned up from S3.
	function reset(keepDrafts = false) {
		if (!keepDrafts) discardAllDrafts();
		else draftImages = new Set();
		title = '';
		content = '';
		coverUrl = '';
		error = '';
		$editor?.commands.clearContent();
	}

	function close() {
		reset(false); // cancel/backdrop → drop any unpublished draft images
		dispatch('close');
	}

	async function handleCover(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) { error = 'Please select an image file.'; return; }
		if (file.size > 5 * 1024 * 1024) { error = 'Image must be 5MB or smaller.'; return; }
		coverUploading = true;
		error = '';
		try {
			// Replacing an existing cover — discard the previous draft image.
			const previous = coverUrl;
			const url = await uploadCommunityImage(file);
			if (previous) discardDraft(previous);
			coverUrl = url;
			trackDraft(url);
		} catch (err: any) {
			error = err?.message ?? 'Failed to upload cover image.';
		} finally {
			coverUploading = false;
			(e.target as HTMLInputElement).value = '';
		}
	}

	async function handleInlineImage(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) { error = 'Please select an image file.'; return; }
		if (file.size > 5 * 1024 * 1024) { error = 'Image must be 5MB or smaller.'; return; }
		inlineUploading = true;
		error = '';
		try {
			const url = await uploadCommunityImage(file);
			trackDraft(url);
			$editor?.chain().focus().setImage({ src: url }).run();
		} catch (err: any) {
			error = err?.message ?? 'Failed to upload image.';
		} finally {
			inlineUploading = false;
			(e.target as HTMLInputElement).value = '';
		}
	}

	function insertLink() {
		const value = linkUrl.trim();
		if (!value) { $editor?.chain().focus().extendMarkRange('link').unsetLink().run(); showLinkInput = false; return; }
		const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
		$editor?.chain().focus().extendMarkRange('link').setLink({ href }).run();
		linkUrl = '';
		showLinkInput = false;
	}

	function submit() {
		error = '';
		if (!title.trim()) { error = 'Please add a title.'; return; }
		dispatch('submit', {
			title: title.trim(),
			content: content && content !== '<p></p>' ? content : undefined,
			mediaUrl: coverUrl || undefined
		});
	}

	// Called by the parent after a successful submit — keep the (now promoted)
	// images and just clear the form.
	export function resetAfterSubmit() { reset(true); }
</script>

{#if open}
<div class="fixed inset-0 z-[999] flex items-center justify-center p-4">
	<!-- Backdrop -->
	<button class="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Close" on:click={close}></button>

	<!-- Modal -->
	<div class="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
		style="background-color: {themeColor.bg};">
		<!-- Header -->
		<div class="flex items-center justify-between border-b px-5 py-4" style="border-color: {themeColor.toggle};">
			<div>
				<h2 class="text-base font-semibold" style="color: {themeColor.text};">Create Post</h2>
				{#if roomName}<p class="text-xs" style="color: {themeColor.lightText};">in {roomName}</p>{/if}
			</div>
			<button class="flex h-8 w-8 items-center justify-center rounded-full" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};" on:click={close}>
				<Icon icon="mdi:close" width="18" />
			</button>
		</div>

		<!-- Body -->
		<div class="flex-1 overflow-y-auto p-5">
			<!-- Title -->
			<input
				bind:value={title}
				placeholder="Post title"
				maxlength="200"
				class="mb-4 w-full rounded-lg border px-4 py-3 text-sm font-medium outline-none"
				style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"
			/>

			<!-- Cover image -->
			{#if coverUrl}
			<div class="relative mb-4 overflow-hidden rounded-xl">
				<img src={coverUrl} alt="cover" class="max-h-56 w-full object-cover" />
				<button class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white" on:click={() => { discardDraft(coverUrl); coverUrl = ''; }}>
					<Icon icon="mdi:close" width="16" />
				</button>
			</div>
			{:else}
			<button
				class="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-4 text-sm transition-colors"
				style="border-color: {themeColor.toggle}; color: {themeColor.lightText};"
				on:click={() => coverInput?.click()}
				disabled={coverUploading}
			>
				{#if coverUploading}<Icon icon="mdi:loading" class="animate-spin" width="18" /> Uploading…{:else}<Icon icon="solar:gallery-add-linear" width="18" /> Add cover image{/if}
			</button>
			{/if}
			<input type="file" accept="image/*" class="hidden" bind:this={coverInput} on:change={handleCover} />

			<!-- Rich text toolbar -->
			{#if $editor}
			<div class="flex flex-wrap items-center gap-0.5 rounded-t-lg border px-2 py-1.5" style="background-color: {themeColor.cover}; border-color: {themeColor.toggle};">
				<button type="button" title="Bold" on:click={() => $editor.chain().focus().toggleBold().run()} class="rounded px-2 py-1 text-sm font-bold" style="color: {themeColor.text}; {$editor.isActive('bold') ? `background-color:${themeColor.smallCover};` : ''}">B</button>
				<button type="button" title="Italic" on:click={() => $editor.chain().focus().toggleItalic().run()} class="rounded px-2 py-1 text-sm italic" style="color: {themeColor.text}; {$editor.isActive('italic') ? `background-color:${themeColor.smallCover};` : ''}">I</button>
				<button type="button" title="Strike" on:click={() => $editor.chain().focus().toggleStrike().run()} class="rounded px-2 py-1 text-sm line-through" style="color: {themeColor.text}; {$editor.isActive('strike') ? `background-color:${themeColor.smallCover};` : ''}">S</button>
				<div class="mx-1 h-4 w-px" style="background-color: {themeColor.toggle};"></div>
				<button type="button" title="Heading" on:click={() => $editor.chain().focus().toggleHeading({ level: 2 }).run()} class="rounded px-2 py-1 text-xs font-semibold" style="color: {themeColor.text}; {$editor.isActive('heading', { level: 2 }) ? `background-color:${themeColor.smallCover};` : ''}">H</button>
				<button type="button" title="Bullet list" on:click={() => $editor.chain().focus().toggleBulletList().run()} class="rounded px-2 py-1 text-xs" style="color: {themeColor.text}; {$editor.isActive('bulletList') ? `background-color:${themeColor.smallCover};` : ''}">• List</button>
				<button type="button" title="Numbered list" on:click={() => $editor.chain().focus().toggleOrderedList().run()} class="rounded px-2 py-1 text-xs" style="color: {themeColor.text}; {$editor.isActive('orderedList') ? `background-color:${themeColor.smallCover};` : ''}">1. List</button>
				<button type="button" title="Quote" on:click={() => $editor.chain().focus().toggleBlockquote().run()} class="rounded px-2 py-1 text-xs" style="color: {themeColor.text}; {$editor.isActive('blockquote') ? `background-color:${themeColor.smallCover};` : ''}">❝</button>
				<div class="mx-1 h-4 w-px" style="background-color: {themeColor.toggle};"></div>
				<button type="button" title="Link" on:click={() => (showLinkInput = !showLinkInput)} class="rounded px-2 py-1" style="color: {themeColor.text};"><Icon icon="mdi:link-variant" width="16" /></button>
				<button type="button" title="Image" on:click={() => inlineInput?.click()} disabled={inlineUploading} class="rounded px-2 py-1" style="color: {themeColor.text};">
					{#if inlineUploading}<Icon icon="mdi:loading" class="animate-spin" width="16" />{:else}<Icon icon="mdi:image-outline" width="16" />{/if}
				</button>
				<div class="mx-1 h-4 w-px" style="background-color: {themeColor.toggle};"></div>
				<button type="button" title="Undo" on:click={() => $editor.chain().focus().undo().run()} class="rounded px-2 py-1 text-sm" style="color: {themeColor.text};">↩</button>
				<button type="button" title="Redo" on:click={() => $editor.chain().focus().redo().run()} class="rounded px-2 py-1 text-sm" style="color: {themeColor.text};">↪</button>
			</div>

			{#if showLinkInput}
			<div class="flex items-center gap-2 border-x px-2 py-2" style="border-color: {themeColor.toggle}; background-color: {themeColor.cover};">
				<input type="url" bind:value={linkUrl} placeholder="https://example.com" class="flex-1 rounded-md border px-2 py-1 text-sm outline-none" style="border-color: {themeColor.toggle}; background-color: {themeColor.bg}; color: {themeColor.text};" on:keydown={(e) => e.key === 'Enter' && insertLink()} />
				<button type="button" class="rounded-md px-3 py-1 text-xs font-medium" style="background-color: {themeColor.button}; color: {themeColor.buttonText};" on:click={insertLink}>Apply</button>
			</div>
			{/if}

			<input type="file" accept="image/*" class="hidden" bind:this={inlineInput} on:change={handleInlineImage} />

			<!-- Editor -->
			<div class="post-editor max-h-[280px] min-h-[160px] overflow-y-auto rounded-b-lg border border-t-0 p-4 text-sm"
				style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};">
				<EditorContent editor={$editor} />
			</div>
			{/if}

			{#if error}<p class="mt-3 text-xs text-red-500">{error}</p>{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-end gap-2 border-t px-5 py-4" style="border-color: {themeColor.toggle};">
			<button class="rounded-lg px-4 py-2 text-sm" style="color: {themeColor.lightText};" on:click={close}>Cancel</button>
			<button
				class="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
				on:click={submit}
				disabled={submitting || !title.trim()}
			>
				{#if submitting}<Icon icon="mdi:loading" class="animate-spin" width="16" />{/if}
				{submitting ? 'Posting…' : 'Post'}
			</button>
		</div>
	</div>
</div>
{/if}

<style>
	:global(.post-editor .ProseMirror) { outline: none; min-height: 140px; line-height: 1.6; }
	:global(.post-editor .ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder); color: #9ca3af; pointer-events: none; float: left; height: 0;
	}
	:global(.post-editor .ProseMirror h1) { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; }
	:global(.post-editor .ProseMirror h2) { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.4rem; }
	:global(.post-editor .ProseMirror p) { margin-bottom: 0.5rem; }
	:global(.post-editor .ProseMirror ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
	:global(.post-editor .ProseMirror ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
	:global(.post-editor .ProseMirror blockquote) { border-left: 3px solid #cbd5e1; padding-left: 0.75rem; color: #64748b; margin: 0.5rem 0; }
	:global(.post-editor .ProseMirror a) { color: #7c3aed; text-decoration: underline; }
	:global(.post-editor .ProseMirror img) { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.5rem 0; display: block; }
</style>
