<script lang="ts">
	import { generateDescriptionWithAI } from '$lib/services/ai.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount, tick } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	export let open = false;
	export let description = '';

	let showAIModal = false;
	let showDropdown = false;
	let moods = ['💐', '💼', '😂'];
	let moodToTone: Record<string, string> = { '💐': 'CELEBRATORY', '💼': 'PROFESSIONAL', '😂': 'FUN' };
	let selectedMood: string = moods[0];
	let selectedLength = 'S';
	let lengthMap: Record<string, string> = { S: 'SHORT', M: 'MEDIUM', L: 'LONG' };
	let aiPromptText = '';
	let aiGenerating = false;
	let aiError = '';

	let descEditor: Readable<Editor>;

	onMount(() => {
		descEditor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({ placeholder: "Who should come? What's the event about?" }),
			],
			content: description || '',
			onUpdate: ({ editor }) => {
				description = editor.getHTML();
			},
		});
	});

	$: if (open && descEditor) {
		tick().then(() => {
			const current = $descEditor?.getHTML();
			if (description && current !== description) {
				$descEditor?.commands.setContent(description);
			}
		});
	}

	onDestroy(() => {
		$descEditor?.destroy();
	});

	async function handleAIGenerate() {
		if (!aiPromptText.trim() || aiPromptText.trim().length < 10) {
			aiError = 'Please provide at least 10 characters.';
			return;
		}

		aiError = '';
		aiGenerating = true;

		try {
			const tone = moodToTone[selectedMood] || 'PROFESSIONAL';
			const length = lengthMap[selectedLength] || 'MEDIUM';
			const result = await generateDescriptionWithAI(aiPromptText.trim(), tone, length);

			// Set the generated description into the editor
			const html = result
				.split(/\n\n+/)
				.filter((p: string) => p.trim())
				.map((p: string) => `<p>${p.trim()}</p>`)
				.join('');
			if ($descEditor) {
				$descEditor.commands.setContent(html);
			}
			description = html;
			showAIModal = false;
			aiPromptText = '';
		} catch (e: any) {
			aiError = e.message ?? 'Failed to generate description.';
		} finally {
			aiGenerating = false;
		}
	}
</script>

{#if open}
	<div id="description" class="absolute left-0 top-full z-40 mt-2 w-full">
		<div class="w-full overflow-hidden rounded-xl bg-white shadow-xl border border-gray-100">

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-100 bg-[#F8F9FA] px-4 py-2.5">
				<span class="text-sm font-medium text-gray-600">Event Description</span>
				<button
					on:click={() => (open = false)}
					class="flex h-7 w-7 items-center justify-center rounded-full bg-[#EBECED] text-[#616265] hover:bg-gray-200"
				>
					<Icon icon="mdi:close" class="text-base" />
				</button>
			</div>

			<!-- Toolbar -->
			<div class="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-[#F8F9FA] px-3 py-1.5">
				<div use:clickOutside={() => { showDropdown = false; }} class="relative mr-1">
					<button
						class="flex h-6 w-6 items-center justify-center rounded bg-[#939597] text-white hover:bg-gray-600"
						on:click={() => (showDropdown = !showDropdown)}
						title="Insert"
					>
						<Icon icon="mdi:plus" class="text-sm" />
					</button>
				</div>

				<div class="mx-1 h-4 w-px bg-gray-300"></div>

				{#if $descEditor}
					<button type="button" title="Bold"
						on:click={() => $descEditor.chain().focus().toggleBold().run()}
						class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200 {$descEditor.isActive('bold') ? 'bg-gray-800 text-white' : 'text-gray-700'}">B</button>
					<button type="button" title="Italic"
						on:click={() => $descEditor.chain().focus().toggleItalic().run()}
						class="rounded px-2 py-1 text-sm italic hover:bg-gray-200 {$descEditor.isActive('italic') ? 'bg-gray-800 text-white' : 'text-gray-700'}">I</button>
					<button type="button" title="Strikethrough"
						on:click={() => $descEditor.chain().focus().toggleStrike().run()}
						class="rounded px-2 py-1 text-sm line-through hover:bg-gray-200 {$descEditor.isActive('strike') ? 'bg-gray-800 text-white' : 'text-gray-700'}">S</button>

					<div class="mx-1 h-4 w-px bg-gray-300"></div>

					<button type="button" title="Heading 1"
						on:click={() => $descEditor.chain().focus().toggleHeading({ level: 1 }).run()}
						class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$descEditor.isActive('heading', { level: 1 }) ? 'bg-gray-800 text-white' : 'text-gray-700'}">H1</button>
					<button type="button" title="Heading 2"
						on:click={() => $descEditor.chain().focus().toggleHeading({ level: 2 }).run()}
						class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$descEditor.isActive('heading', { level: 2 }) ? 'bg-gray-800 text-white' : 'text-gray-700'}">H2</button>
					<button type="button" title="Paragraph"
						on:click={() => $descEditor.chain().focus().setParagraph().run()}
						class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$descEditor.isActive('paragraph') ? 'bg-gray-800 text-white' : 'text-gray-700'}">P</button>

					<div class="mx-1 h-4 w-px bg-gray-300"></div>

					<button type="button" title="Bullet list"
						on:click={() => $descEditor.chain().focus().toggleBulletList().run()}
						class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$descEditor.isActive('bulletList') ? 'bg-gray-800 text-white' : 'text-gray-700'}">• List</button>
					<button type="button" title="Ordered list"
						on:click={() => $descEditor.chain().focus().toggleOrderedList().run()}
						class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$descEditor.isActive('orderedList') ? 'bg-gray-800 text-white' : 'text-gray-700'}">1. List</button>

					<div class="mx-1 h-4 w-px bg-gray-300"></div>

					<button type="button" title="Undo"
						on:click={() => $descEditor.chain().focus().undo().run()}
						class="rounded px-2 py-1 text-sm hover:bg-gray-200 text-gray-700">↩</button>
					<button type="button" title="Redo"
						on:click={() => $descEditor.chain().focus().redo().run()}
						class="rounded px-2 py-1 text-sm hover:bg-gray-200 text-gray-700">↪</button>
				{/if}
			</div>

			<!-- Editor area -->
			<div class="min-h-[180px] max-h-[300px] overflow-y-auto p-4 text-sm text-gray-800">
				<EditorContent editor={$descEditor} />
			</div>

			<!-- Footer -->
			<div class="relative flex items-center justify-between border-t border-gray-100 bg-[#F8F9FA] px-4 py-2.5">
				<button
					class="flex items-center gap-1.5 text-xs text-[#B2B3B3] hover:text-gray-500 transition-colors"
					on:click={() => (showAIModal = !showAIModal)}
				>
					<svg width="16" height="16" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect x="10.9964" y="4.03479" width="1.57061" height="4.71184" rx="0.785307" fill="currentColor"/>
						<rect x="16.8948" y="5.60511" width="1.57061" height="4.71184" rx="0.785307" transform="rotate(48.8391 16.8948 5.60511)" fill="currentColor"/>
						<rect x="3.13703" y="12.7692" width="1.57061" height="4.71184" rx="0.785307" transform="rotate(-90.9275 3.13703 12.7692)" fill="currentColor"/>
						<rect x="14.9183" y="12.6754" width="1.57061" height="4.71184" rx="0.785307" transform="rotate(-90 14.9183 12.6754)" fill="currentColor"/>
						<rect x="9.21124" y="8.64417" width="1.57061" height="4.71184" rx="0.785307" transform="rotate(130.233 9.21124 8.64417)" fill="currentColor"/>
						<rect x="17.6605" y="16.0504" width="1.57061" height="4.71184" rx="0.785307" transform="rotate(131.574 17.6605 16.0504)" fill="currentColor"/>
						<rect x="12.5706" y="19.4176" width="1.57061" height="4.71184" rx="0.785307" transform="rotate(-179.587 12.5706 19.4176)" fill="currentColor"/>
						<rect x="8.59406" y="13.2535" width="1.57061" height="4.71184" rx="0.785307" transform="rotate(41.5742 8.59406 13.2535)" fill="currentColor"/>
					</svg>
					Suggest with AI
				</button>

				<button
					class="rounded-lg bg-gray-900 px-5 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
					on:click={() => (open = false)}
				>
					Done
				</button>
			</div>
		</div>
	</div>

	<!-- AI Suggest Modal -->
	{#if showAIModal}
		<div
			class="fixed bottom-16 left-1/2 z-[9999] w-[320px] -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-4 shadow-xl"
			use:clickOutside={() => { showAIModal = false; }}
		>
			<div class="mb-3 flex items-center justify-between">
				<h3 class="font-semibold text-gray-800">Suggest with AI</h3>
				<button
					on:click={() => (showAIModal = false)}
					class="flex h-6 w-6 items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
				>
					<Icon icon="mdi:close" class="text-sm" />
				</button>
			</div>
			<p class="mb-4 text-xs text-gray-400">Generate a description for your event using AI.</p>

			<div class="mb-3 flex gap-4">
				<div class="flex-1">
					<span class="mb-1 block text-xs font-medium text-gray-600">Mood</span>
					<div class="flex gap-1 rounded-lg bg-[#EFEFF0] p-1">
						{#each moods as mood}
							<button
								class="flex-1 rounded-md py-1 text-sm transition {selectedMood === mood ? 'bg-white shadow-sm' : ''}"
								on:click={() => (selectedMood = mood)}
							>{mood}</button>
						{/each}
					</div>
				</div>
				<div>
					<span class="mb-1 block text-xs font-medium text-gray-600">Length</span>
					<div class="flex gap-1 rounded-lg bg-[#EFEFF0] p-1">
						{#each ['S', 'M', 'L'] as size}
							<button
								class="w-8 rounded-md py-1 text-xs font-medium transition {selectedLength === size ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}"
								on:click={() => (selectedLength = size)}
							>{size}</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="mb-3">
				<label for="ai-desc-prompt" class="mb-1 block text-xs font-medium text-gray-600">Additional Instructions</label>
				<textarea
					id="ai-desc-prompt"
					rows="3"
					bind:value={aiPromptText}
					placeholder="Tell the AI about your event..."
					class="w-full resize-none rounded-lg border border-gray-200 bg-white p-2 text-sm outline-none"
				></textarea>
			</div>

			{#if aiError}
				<p class="mb-2 text-xs text-red-500">{aiError}</p>
			{/if}

			<button
				class="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
				on:click={handleAIGenerate}
				disabled={aiGenerating}
			>
				{aiGenerating ? 'Generating...' : 'Generate'}
			</button>
		</div>
	{/if}
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
		min-height: 80px;
		line-height: 1.6;
	}
	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: #9ca3af;
		pointer-events: none;
		float: left;
		height: 0;
	}
	:global(.ProseMirror h1) { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; }
	:global(.ProseMirror h2) { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.4rem; }
	:global(.ProseMirror p) { margin-bottom: 0.5rem; }
	:global(.ProseMirror ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
	:global(.ProseMirror ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
	:global(.ProseMirror strong) { font-weight: 700; }
	:global(.ProseMirror em) { font-style: italic; }
</style>
