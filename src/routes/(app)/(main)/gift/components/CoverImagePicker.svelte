<!--
	Cover-image picker for a gift link.

	Used by both the creation wizard and the manage/settings screen, so the two
	behave identically — including the cleanup rules, which are the part that
	silently diverges when this kind of thing is written twice.

	── What it owns ─────────────────────────────────────────────────────────

	It owns the S3 object, not just the preview. Picking a file uploads it
	immediately (as a transient draft) and hands the parent a URL. Replacing or
	removing an image tells the server to delete the object it is dropping —
	but ONLY when that object was a draft this component uploaded. An image
	that is already saved on the link is left alone here, because the save
	itself is what deletes the one it replaced; deleting from both places would
	race, and the loser would be a live share card.

	── The 1.91:1 frame ────────────────────────────────────────────────────

	The preview is deliberately shown at the share-card aspect ratio rather
	than the page's own 44px-tall banner. What people actually care about is
	how it looks in WhatsApp, and that is the only place they cannot check
	before posting.
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import { uploadGiftCoverImage, discardGiftCoverImage } from '$lib/services/giftLink.services';

	/** The current cover URL. Bound, so the parent always has the truth. */
	export let value: string = '';
	/**
	 * The URL as it is SAVED on the server right now.
	 *
	 * Anything in `value` that is not this is an unsaved draft this component
	 * uploaded, and is therefore ours to delete. On the creation wizard there
	 * is no saved value, so every upload is a draft.
	 */
	export let savedValue: string = '';
	export let disabled = false;
	export let label = 'Cover image';
	export let hint =
		'Shown at the top of your gift page and used as the preview when you share the link.';

	const dispatch = createEventDispatcher<{ change: { url: string } }>();

	let input: HTMLInputElement;
	let uploading = false;
	let dragging = false;

	/** True when `value` is a draft we uploaded and nothing else references. */
	$: isUnsavedDraft = !!value && value !== savedValue;

	async function handleFiles(files: FileList | null | undefined) {
		const file = files?.[0];
		if (!file || disabled) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please choose an image file.');
			return;
		}

		const replacing = isUnsavedDraft ? value : '';
		uploading = true;
		try {
			const url = await uploadGiftCoverImage(file);
			if (!url) throw new Error('The upload did not return an image.');
			value = url;
			dispatch('change', { url });
			// Only after the replacement is safely in hand. Deleting first and
			// then failing the upload would leave the user with nothing.
			if (replacing) void discardGiftCoverImage(replacing);
		} catch (e: any) {
			toast.error(cleanErrorMessage(e?.message || 'Could not upload that image'));
		} finally {
			uploading = false;
			// Let the same file be re-picked after an error.
			if (input) input.value = '';
		}
	}

	function remove() {
		if (disabled) return;
		const dropped = isUnsavedDraft ? value : '';
		value = '';
		dispatch('change', { url: '' });
		if (dropped) void discardGiftCoverImage(dropped);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		void handleFiles(event.dataTransfer?.files);
	}
</script>

<div>
	<div class="mb-1 flex items-baseline justify-between gap-3">
		<span class="text-xs font-medium text-gray-700">{label}</span>
		{#if value && !disabled}
			<button
				type="button"
				on:click={remove}
				class="text-xs font-medium text-[#B02A37] hover:underline"
			>
				Remove
			</button>
		{/if}
	</div>

	<input
		bind:this={input}
		type="file"
		accept="image/jpeg,image/png,image/webp,image/gif"
		class="hidden"
		{disabled}
		on:change={(e) => handleFiles((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if value}
		<div class="relative overflow-hidden rounded-xl border border-[#EBECED] bg-[#F6F6F6]">
			<!-- 1200x630 is the share-card ratio every platform renders. -->
			<img
				src={value}
				alt="Gift cover preview"
				class="block aspect-[1200/630] w-full object-cover"
			/>
			{#if uploading}
				<div class="absolute inset-0 flex items-center justify-center bg-black/40">
					<Icon icon="mdi:loading" class="animate-spin text-2xl text-white" />
				</div>
			{/if}
		</div>
		{#if !disabled}
			<button
				type="button"
				on:click={() => input?.click()}
				disabled={uploading}
				class="mt-2 rounded-lg border border-[#EBECED] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
			>
				{uploading ? 'Uploading…' : 'Change image'}
			</button>
		{/if}
	{:else}
		<button
			type="button"
			on:click={() => input?.click()}
			on:dragover|preventDefault={() => (dragging = true)}
			on:dragleave={() => (dragging = false)}
			on:drop={onDrop}
			{disabled}
			class="flex aspect-[1200/630] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-colors disabled:opacity-50 {dragging
				? 'border-[#F31A7C] bg-[#FBDEEC]'
				: 'border-[#EBECED] bg-[#FDFDFD] hover:border-gray-300 hover:bg-[#F6F6F6]'}"
		>
			{#if uploading}
				<Icon icon="mdi:loading" class="animate-spin text-2xl text-[#83808D]" />
				<span class="text-xs text-[#83808D]">Uploading…</span>
			{:else}
				<Icon icon="mdi:image-plus-outline" class="text-2xl text-[#83808D]" />
				<span class="text-sm font-medium text-gray-700">Add a cover image</span>
				<span class="text-xs text-[#83808D]">Drag one here, or click to choose</span>
			{/if}
		</button>
	{/if}

	<p class="mt-1.5 text-xs text-gray-400">
		{hint} Landscape works best. JPG, PNG, WebP or GIF, up to 5MB.
	</p>
</div>
