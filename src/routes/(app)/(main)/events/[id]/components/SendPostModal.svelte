<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	export let open = false;
	export let eventTitle = '';

	// Email limits (free plan)
	const monthlyLimit = 250;
	let emailsSentThisMonth = 0;
	$: emailsRemaining = monthlyLimit - emailsSentThisMonth;

	// Attendee status filter
	const attendeeStatuses = [
		{ label: 'All Attendees', value: 'all', color: '#4B5563' },
		{ label: 'Registered', value: 'registered', color: '#16A34A' },
		{ label: 'Invited', value: 'invited', color: '#2563EB' },
		{ label: 'Pending Approval', value: 'pending', color: '#D97706' },
		{ label: 'Waitlisted', value: 'waitlisted', color: '#9333EA' },
		{ label: 'Declined', value: 'declined', color: '#DC2626' }
	];

	let selectedStatuses: string[] = ['all'];
	let showStatusDropdown = false;

	function toggleStatus(value: string) {
		if (value === 'all') {
			selectedStatuses = ['all'];
			return;
		}
		// Remove 'all' if selecting specific statuses
		selectedStatuses = selectedStatuses.filter((s) => s !== 'all');
		if (selectedStatuses.includes(value)) {
			selectedStatuses = selectedStatuses.filter((s) => s !== value);
			if (selectedStatuses.length === 0) selectedStatuses = ['all'];
		} else {
			selectedStatuses = [...selectedStatuses, value];
		}
	}

	$: selectedStatusLabels = selectedStatuses.includes('all')
		? 'All Attendees'
		: selectedStatuses
				.map((s) => attendeeStatuses.find((a) => a.value === s)?.label)
				.join(', ');

	// Subject line
	let subject = '';

	// TipTap editor
	let emailEditor: Readable<Editor>;
	let imageInput: HTMLInputElement;

	onMount(() => {
		emailEditor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({
					placeholder: 'Compose your email blast here...'
				}),
				Image.configure({
					inline: false,
					allowBase64: true
				}),
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						class: 'text-blue-600 underline cursor-pointer'
					}
				})
			],
			content: '',
			onUpdate: ({ editor }) => {
				emailContent = editor.getHTML();
			}
		});
	});

	onDestroy(() => {
		$emailEditor?.destroy();
	});

	let emailContent = '';
	let sending = false;

	// Image insert
	function triggerImageUpload() {
		imageInput?.click();
	}

	function handleImageUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const url = reader.result as string;
			$emailEditor?.chain().focus().setImage({ src: url }).run();
		};
		reader.readAsDataURL(file);
		target.value = '';
	}

	// Link insert
	let showLinkInput = false;
	let linkUrl = '';

	function insertLink() {
		if (!linkUrl.trim()) return;
		const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
		$emailEditor?.chain().focus().setLink({ href: url }).run();
		linkUrl = '';
		showLinkInput = false;
	}

	function removeLink() {
		$emailEditor?.chain().focus().unsetLink().run();
	}

	// Send
	async function handleSend() {
		if (!subject.trim() || !emailContent.trim()) return;
		sending = true;
		// TODO: integrate with backend API
		setTimeout(() => {
			sending = false;
			open = false;
		}, 1500);
	}

	$: canSend = subject.trim() && emailContent.trim() && emailsRemaining > 0 && !sending;
</script>

<input
	type="file"
	accept="image/*"
	class="hidden"
	bind:this={imageInput}
	on:change={handleImageUpload}
/>

{#if open}
	<!-- Overlay -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm"
		on:click={() => (open = false)}
	>
		<!-- Panel -->
		<div
			class="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-5 py-3">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2E4F8]">
						<svg width="20" height="20" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M17.6353 3.23798L7.76904 6.51582C1.13688 8.73382 1.13688 12.3504 7.76904 14.5574L10.6972 15.5299L11.6697 18.4581C13.8767 25.0902 17.5042 25.0902 19.7113 18.4581L23 8.6027C24.4641 4.17763 22.0604 1.76295 17.6353 3.23798Z" fill="#AB46DD"/>
						</svg>
					</div>
					<div>
						<h2 class="font-semibold text-gray-800">Send a Post</h2>
						<p class="text-xs text-[#A5A6A6]">Email blast to your attendees</p>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<!-- Email limit badge -->
					<button
						class="flex items-center gap-2 rounded-full border-2 px-3 py-1.5 {emailsRemaining > 50 ? 'border-[#E5E6E6]' : emailsRemaining > 10 ? 'border-yellow-300' : 'border-red-300'}"
					>
						<span class="h-[22px] w-[22px] rounded-full border-3 border-[#E5E6E6]"></span>
						<p class="whitespace-nowrap text-xs text-[#A8A9A9]">
							{emailsRemaining} Left
						</p>
					</button>

					<button
						class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
						on:click={() => (open = false)}
					>
						<Icon icon="mdi:close" class="text-lg font-bold" />
					</button>
				</div>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
				<!-- Recipient Status Filter -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Send to</label>
					<div class="relative" use:clickOutside={() => { showStatusDropdown = false; }}>
						<button
							class="flex w-full items-center justify-between rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm text-gray-700"
							on:click={() => (showStatusDropdown = !showStatusDropdown)}
						>
							<div class="flex flex-wrap items-center gap-1.5">
								{#each selectedStatuses as status}
									{@const statusObj = attendeeStatuses.find((s) => s.value === status)}
									{#if statusObj}
										<span
											class="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs shadow-sm"
										>
											<span class="h-2 w-2 rounded-full" style="background-color: {statusObj.color}"></span>
											{statusObj.label}
										</span>
									{/if}
								{/each}
							</div>
							<Icon icon="mdi:chevron-down" class="text-lg text-gray-400 transition-transform {showStatusDropdown ? 'rotate-180' : ''}" />
						</button>

						{#if showStatusDropdown}
							<div class="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-gray-100 bg-white py-1 shadow-lg">
								{#each attendeeStatuses as status}
									<button
										class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
										on:click={() => toggleStatus(status.value)}
									>
										<span class="h-3 w-3 rounded-full" style="background-color: {status.color}"></span>
										<span class="flex-1 text-left text-gray-700">{status.label}</span>
										{#if selectedStatuses.includes(status.value)}
											<Icon icon="mdi:check" class="text-lg text-black" />
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Subject Line -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Subject</label>
					<input
						type="text"
						bind:value={subject}
						placeholder="Enter email subject line..."
						class="w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
					/>
				</div>

				<!-- Rich Text Editor -->
				<div class="mb-3">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Message</label>
					<div class="overflow-hidden rounded-md border border-gray-200">
						<!-- Toolbar -->
						<div class="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-[#F8F9FA] px-3 py-1.5">
							{#if $emailEditor}
								<button type="button" title="Bold"
									on:click={() => $emailEditor.chain().focus().toggleBold().run()}
									class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200 {$emailEditor.isActive('bold') ? 'bg-gray-800 text-white' : 'text-gray-700'}">B</button>
								<button type="button" title="Italic"
									on:click={() => $emailEditor.chain().focus().toggleItalic().run()}
									class="rounded px-2 py-1 text-sm italic hover:bg-gray-200 {$emailEditor.isActive('italic') ? 'bg-gray-800 text-white' : 'text-gray-700'}">I</button>
								<button type="button" title="Strikethrough"
									on:click={() => $emailEditor.chain().focus().toggleStrike().run()}
									class="rounded px-2 py-1 text-sm line-through hover:bg-gray-200 {$emailEditor.isActive('strike') ? 'bg-gray-800 text-white' : 'text-gray-700'}">S</button>

								<div class="mx-1 h-4 w-px bg-gray-300"></div>

								<button type="button" title="Heading 1"
									on:click={() => $emailEditor.chain().focus().toggleHeading({ level: 1 }).run()}
									class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$emailEditor.isActive('heading', { level: 1 }) ? 'bg-gray-800 text-white' : 'text-gray-700'}">H1</button>
								<button type="button" title="Heading 2"
									on:click={() => $emailEditor.chain().focus().toggleHeading({ level: 2 }).run()}
									class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$emailEditor.isActive('heading', { level: 2 }) ? 'bg-gray-800 text-white' : 'text-gray-700'}">H2</button>
								<button type="button" title="Paragraph"
									on:click={() => $emailEditor.chain().focus().setParagraph().run()}
									class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$emailEditor.isActive('paragraph') ? 'bg-gray-800 text-white' : 'text-gray-700'}">P</button>

								<div class="mx-1 h-4 w-px bg-gray-300"></div>

								<button type="button" title="Bullet list"
									on:click={() => $emailEditor.chain().focus().toggleBulletList().run()}
									class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$emailEditor.isActive('bulletList') ? 'bg-gray-800 text-white' : 'text-gray-700'}">
									<Icon icon="mdi:format-list-bulleted" class="text-base" />
								</button>
								<button type="button" title="Ordered list"
									on:click={() => $emailEditor.chain().focus().toggleOrderedList().run()}
									class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$emailEditor.isActive('orderedList') ? 'bg-gray-800 text-white' : 'text-gray-700'}">
									<Icon icon="mdi:format-list-numbered" class="text-base" />
								</button>

								<div class="mx-1 h-4 w-px bg-gray-300"></div>

								<!-- Link -->
								<div class="relative" use:clickOutside={() => { showLinkInput = false; }}>
									<button type="button" title="Insert Link"
										on:click={() => {
											if ($emailEditor.isActive('link')) {
												removeLink();
											} else {
												showLinkInput = !showLinkInput;
											}
										}}
										class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$emailEditor.isActive('link') ? 'bg-gray-800 text-white' : 'text-gray-700'}">
										<Icon icon="mdi:link-variant" class="text-base" />
									</button>

									{#if showLinkInput}
										<div class="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-md border bg-white p-2 shadow-lg">
											<input
												type="url"
												bind:value={linkUrl}
												placeholder="https://..."
												class="w-48 rounded border px-2 py-1 text-xs focus:outline-none"
												on:keydown={(e) => { if (e.key === 'Enter') insertLink(); }}
											/>
											<button
												on:click={insertLink}
												class="rounded bg-gray-800 px-2 py-1 text-xs text-white"
											>
												Add
											</button>
										</div>
									{/if}
								</div>

								<!-- Image -->
								<button type="button" title="Insert Image"
									on:click={triggerImageUpload}
									class="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-200">
									<Icon icon="mdi:image-outline" class="text-base" />
								</button>

								<div class="mx-1 h-4 w-px bg-gray-300"></div>

								<button type="button" title="Blockquote"
									on:click={() => $emailEditor.chain().focus().toggleBlockquote().run()}
									class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$emailEditor.isActive('blockquote') ? 'bg-gray-800 text-white' : 'text-gray-700'}">
									<Icon icon="mdi:format-quote-close" class="text-base" />
								</button>

								<button type="button" title="Horizontal Rule"
									on:click={() => $emailEditor.chain().focus().setHorizontalRule().run()}
									class="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-200">
									<Icon icon="mdi:minus" class="text-base" />
								</button>

								<div class="mx-1 h-4 w-px bg-gray-300"></div>

								<button type="button" title="Undo"
									on:click={() => $emailEditor.chain().focus().undo().run()}
									class="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200">↩</button>
								<button type="button" title="Redo"
									on:click={() => $emailEditor.chain().focus().redo().run()}
									class="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200">↪</button>
							{/if}
						</div>

						<!-- Editor area -->
						<div class="min-h-[200px] max-h-[300px] overflow-y-auto p-4 text-sm text-gray-800">
							<EditorContent editor={$emailEditor} />
						</div>
					</div>

					<p class="mt-1.5 text-xs text-gray-400">
						You can use rich formatting, insert images, and add links to customize your email.
					</p>
				</div>

				<!-- Email Limit Info -->
				<div class="rounded-lg border border-gray-100 bg-[#F8F8F9] p-3">
					<div class="flex items-center justify-between text-xs">
						<div class="flex items-center gap-1.5">
							<Icon icon="mdi:email-outline" class="text-sm text-[#A5A6A6]" />
							<span class="text-[#666769]">Monthly email limit (Free Plan)</span>
						</div>
						<span class="font-medium text-gray-800">{emailsSentThisMonth} / {monthlyLimit} used</span>
					</div>
					<div class="mt-2 h-1.5 w-full rounded-full bg-gray-200">
						<div
							class="h-1.5 rounded-full transition-all {emailsRemaining > 50 ? 'bg-green-400' : emailsRemaining > 10 ? 'bg-yellow-400' : 'bg-red-400'}"
							style="width: {(emailsSentThisMonth / monthlyLimit) * 100}%;"
						></div>
					</div>
					<div class="mt-1.5 flex items-center justify-between text-xs text-[#A5A6A6]">
						<span>{emailsRemaining} emails remaining this month</span>
						<button class="text-pink-600 hover:underline">Upgrade Plan</button>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex h-15 items-center justify-between border-t border-gray-200 px-5 py-3">
				<span class="text-sm text-[#B9BABA]">Sending to <span class="text-gray-700">{selectedStatusLabels}</span></span>

				<div class="flex items-center gap-2">
					<button
						on:click={() => (open = false)}
						class="flex items-center gap-1 rounded-md border bg-gray-100 px-4 py-2 text-sm text-[#626365]"
					>
						Cancel
					</button>
					<button
						on:click={handleSend}
						disabled={!canSend}
						class="flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium text-white {canSend ? 'bg-gray-800' : 'cursor-not-allowed bg-[#969798]'}"
					>
						{#if sending}
							<Icon icon="mdi:loading" class="animate-spin text-base" />
							Sending...
						{:else}
							<svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M0.871094 0.841797C1.5721 0.157615 2.58659 0.00457658 3.45703 0.464844L9.39453 3.58984L9.52832 3.66602C10.1806 4.06709 10.5811 4.77826 10.5811 5.55273C10.5809 6.32719 10.1807 7.0385 9.52832 7.43945L9.39453 7.51465L3.45703 10.6387L3.45801 10.6396C3.12189 10.8189 2.76691 10.9033 2.41211 10.9033C1.84716 10.9033 1.30127 10.6826 0.871094 10.2637V10.2627C0.16927 9.57763 -0.000216478 8.56312 0.4375 7.6875L1.26758 6.02734C1.41356 5.73526 1.41438 5.38069 1.26758 5.08203L0.4375 3.41699C-0.000180173 2.54137 0.169252 1.52684 0.871094 0.841797ZM2.41797 1.36426C2.12646 1.36426 1.86586 1.50002 1.68457 1.67676L1.68359 1.67773C1.41317 1.93952 1.22744 2.3971 1.47754 2.90234L2.30664 4.5625L2.30762 4.56348C2.61652 5.18723 2.61666 5.92317 2.30762 6.54688H2.30664L1.47754 8.20703L1.47656 8.20801C1.22284 8.71154 1.41204 9.16866 1.68359 9.43164C1.95736 9.69658 2.41563 9.87688 2.91504 9.61426L8.85254 6.48926L8.97852 6.41211C9.25687 6.21531 9.41791 5.90557 9.41797 5.55762C9.41797 5.16005 9.20777 4.81236 8.85254 4.62598L8.85156 4.625L2.91406 1.49023V1.48926C2.73942 1.3978 2.57161 1.36433 2.41797 1.36426Z" fill="white" stroke="white" stroke-width="0.394627"/>
								<rect x="5.32622" y="6.17388" width="3.55164" height="1.18388" rx="0.59194" transform="rotate(-180 5.32622 6.17388)" fill="white" stroke="white" stroke-width="0.394627"/>
							</svg>
							Send
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
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
	:global(.ProseMirror s) { text-decoration: line-through; }
	:global(.ProseMirror blockquote) { border-left: 3px solid #d1d5db; padding-left: 1rem; margin-left: 0; margin-bottom: 0.5rem; color: #6b7280; }
	:global(.ProseMirror hr) { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
	:global(.ProseMirror a) { color: #2563eb; text-decoration: underline; cursor: pointer; }
	:global(.ProseMirror img) { max-width: 100%; height: auto; border-radius: 0.375rem; margin: 0.5rem 0; }
</style>
