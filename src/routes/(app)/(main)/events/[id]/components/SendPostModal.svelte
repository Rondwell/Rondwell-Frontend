<script lang="ts">
	import { page } from '$app/stores';
	import { createEventBlast, previewBlastDraft, uploadBlastImage } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';
	import DatePickerModal from '../../../../create-event/components/DatePickerModal.svelte';
	import TimeModal from '../../../../create-event/components/TimeModal.svelte';

	export let open = false;
	export let eventTitle = '';
	export let emailsRemaining = 250;
	export let onBlastSent: (() => void) | undefined = undefined;

	$: void eventTitle; // used in SendPostModal child
	$: eventId = $page.params.id ?? '';

	// Consent-based attendee statuses only
	const attendeeStatuses = [
		{ label: 'All Attendees', value: 'all', color: '#4B5563' },
		{ label: 'Attending', value: 'ATTENDING', color: '#16A34A' },
		{ label: 'Pending Approval', value: 'PENDING', color: '#D97706' },
		{ label: 'Waitlisted', value: 'WAITLISTED', color: '#9333EA' },
		{ label: 'Checked In', value: 'CHECKED_IN', color: '#2563EB' },
	];

	let selectedStatuses: string[] = ['all'];
	let showStatusDropdown = false;

	function toggleStatus(value: string) {
		if (value === 'all') { selectedStatuses = ['all']; return; }
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
		: selectedStatuses.map((s) => attendeeStatuses.find((a) => a.value === s)?.label).join(', ');

	$: recipientStatusValues = selectedStatuses.includes('all')
		? ['ATTENDING', 'PENDING', 'WAITLISTED', 'CHECKED_IN']
		: selectedStatuses;

	// Subject
	let subject = '';

	// Schedule
	let mode: 'send' | 'schedule' = 'send';
	let showDatePicker = false;
	let showTimePicker = false;
	let scheduledDate: Date | null = null;
	let scheduledTime = '';

	// TipTap editor
	let emailEditor: Readable<Editor>;
	let imageInput: HTMLInputElement;
	let emailContent = '';
	let sending = false;
	let previewing = false;
	let errorMsg = '';
	let successMsg = '';

	onMount(() => {
		emailEditor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({ placeholder: 'Compose your email blast here...' }),
				Image.configure({ inline: false, allowBase64: false }),
				Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
			],
			content: '',
			onUpdate: ({ editor }) => { emailContent = editor.getHTML(); },
		});
	});

	onDestroy(() => { $emailEditor?.destroy(); });

	// Image upload to S3
	async function triggerImageUpload() { imageInput?.click(); }

	async function handleImageUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file || !eventId) return;
		try {
			const url = await uploadBlastImage(eventId, file);
			$emailEditor?.chain().focus().setImage({ src: url }).run();
		} catch (err: any) {
			errorMsg = err.message || 'Failed to upload image';
		}
		target.value = '';
	}

	// Link
	let showLinkInput = false;
	let linkUrl = '';
	function insertLink() {
		if (!linkUrl.trim()) return;
		const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
		$emailEditor?.chain().focus().setLink({ href: url }).run();
		linkUrl = '';
		showLinkInput = false;
	}

	// Send / Schedule
	async function handleSend() {
		if (!subject.trim() || !emailContent.trim()) { errorMsg = 'Subject and message are required'; return; }
		errorMsg = '';
		sending = true;

		try {
			let scheduledAt: string | undefined;
			if (mode === 'schedule' && scheduledDate) {
				const dt = new Date(scheduledDate);
				if (scheduledTime) {
					// Parse "2:30 PM" format from TimeModal
					const [timePart, ampm] = scheduledTime.trim().split(' ');
					let [h, m] = timePart.split(':').map(Number);
					if (ampm?.toUpperCase() === 'PM' && h !== 12) h += 12;
					if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
					dt.setHours(h, m, 0, 0);
				}
				scheduledAt = dt.toISOString();
			}

			await createEventBlast(eventId, {
				subject,
				htmlContent: emailContent,
				recipientStatuses: recipientStatusValues,
				scheduledAt,
			});

			successMsg = mode === 'schedule' ? 'Blast scheduled!' : 'Blast is being sent!';
			setTimeout(() => {
				open = false;
				successMsg = '';
				subject = '';
				emailContent = '';
				$emailEditor?.commands.clearContent();
				selectedStatuses = ['all'];
				mode = 'send';
				scheduledDate = null;
				scheduledTime = '';
				onBlastSent?.();
			}, 1500);
		} catch (err: any) {
			errorMsg = err.message || 'Failed to send blast';
		} finally {
			sending = false;
		}
	}

	$: canSend = subject.trim() && emailContent.trim() && emailsRemaining > 0 && !sending;
	$: canPreview = subject.trim() && emailContent.trim() && !previewing && !sending;

	async function handlePreview() {
		if (!canPreview) return;
		previewing = true;
		errorMsg = '';
		try {
			const result = await previewBlastDraft(eventId, subject, emailContent);
			successMsg = result.message || `Preview sent to your email`;
			setTimeout(() => (successMsg = ''), 4000);
		} catch (err: any) {
			errorMsg = err.message || 'Failed to send preview';
		} finally {
			previewing = false;
		}
	}
</script>

<input type="file" accept="image/*" class="hidden" bind:this={imageInput} on:change={handleImageUpload} />

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm" on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} role="dialog" aria-modal="true" tabindex="-1">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="flex h-full max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl" on:click|stopPropagation on:keydown|stopPropagation role="document">

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-5 py-3">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#DB3EC6] to-[#513BE2]">
						<Icon icon="mdi:send-variant" class="h-5 w-5 text-white" />
					</div>
					<div>
						<h2 class="font-semibold text-gray-800">Send a Blast</h2>
						<p class="text-xs text-[#A5A6A6]">Email blast to your attendees</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<span class="flex items-center gap-1.5 rounded-full border-2 border-[#E5E6E6] px-3 py-1">
						<span class="h-[18px] w-[18px] rounded-full border-3 {emailsRemaining > 50 ? 'border-green-400' : emailsRemaining > 10 ? 'border-yellow-400' : 'border-red-400'}"></span>
						<span class="whitespace-nowrap text-xs text-[#A8A9A9]">{emailsRemaining} Left</span>
					</span>
					<button class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]" on:click={() => (open = false)} aria-label="Close">
						<Icon icon="mdi:close" class="text-lg text-gray-700" />
					</button>
				</div>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
				<!-- Recipient Filter -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Send to</label>
					<div class="relative" use:clickOutside={() => { showStatusDropdown = false; }}>
						<button class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm" on:click={() => (showStatusDropdown = !showStatusDropdown)}>
							<div class="flex flex-wrap items-center gap-1.5">
								{#each selectedStatuses as status}
									{@const obj = attendeeStatuses.find((s) => s.value === status)}
									{#if obj}
										<span class="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs shadow-sm">
											<span class="h-2 w-2 rounded-full" style="background-color: {obj.color}"></span>
											{obj.label}
										</span>
									{/if}
								{/each}
							</div>
							<Icon icon="mdi:chevron-down" class="text-lg text-gray-400 transition-transform {showStatusDropdown ? 'rotate-180' : ''}" />
						</button>
						{#if showStatusDropdown}
							<div class="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
								{#each attendeeStatuses as status}
									<button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50" on:click={() => toggleStatus(status.value)}>
										<span class="h-3 w-3 rounded-full" style="background-color: {status.color}"></span>
										<span class="flex-1 text-left text-gray-700">{status.label}</span>
										{#if selectedStatuses.includes(status.value)}<Icon icon="mdi:check" class="text-lg text-black" />{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Subject -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Subject</label>
					<input type="text" bind:value={subject} placeholder="Enter email subject line..." class="w-full rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none" />
				</div>

				<!-- Rich Text Editor -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Message</label>
					<div class="overflow-hidden rounded-lg border border-gray-200">
						<div class="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-[#F8F9FA] px-3 py-1.5">
							{#if $emailEditor}
								<button type="button" title="Bold" on:click={() => $emailEditor.chain().focus().toggleBold().run()} class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200 {$emailEditor.isActive('bold') ? 'bg-gray-800 text-white' : 'text-gray-700'}">B</button>
								<button type="button" title="Italic" on:click={() => $emailEditor.chain().focus().toggleItalic().run()} class="rounded px-2 py-1 text-sm italic hover:bg-gray-200 {$emailEditor.isActive('italic') ? 'bg-gray-800 text-white' : 'text-gray-700'}">I</button>
								<button type="button" title="Strikethrough" on:click={() => $emailEditor.chain().focus().toggleStrike().run()} class="rounded px-2 py-1 text-sm line-through hover:bg-gray-200 {$emailEditor.isActive('strike') ? 'bg-gray-800 text-white' : 'text-gray-700'}">S</button>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<button type="button" title="Heading 1" on:click={() => $emailEditor.chain().focus().toggleHeading({ level: 1 }).run()} class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$emailEditor.isActive('heading', { level: 1 }) ? 'bg-gray-800 text-white' : 'text-gray-700'}">H1</button>
								<button type="button" title="Heading 2" on:click={() => $emailEditor.chain().focus().toggleHeading({ level: 2 }).run()} class="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 {$emailEditor.isActive('heading', { level: 2 }) ? 'bg-gray-800 text-white' : 'text-gray-700'}">H2</button>
								<button type="button" title="Paragraph" on:click={() => $emailEditor.chain().focus().setParagraph().run()} class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$emailEditor.isActive('paragraph') ? 'bg-gray-800 text-white' : 'text-gray-700'}">P</button>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<button type="button" title="Bullet list" on:click={() => $emailEditor.chain().focus().toggleBulletList().run()} class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('bulletList') ? 'bg-gray-800 text-white' : 'text-gray-700'}"><Icon icon="mdi:format-list-bulleted" class="text-base" /></button>
								<button type="button" title="Ordered list" on:click={() => $emailEditor.chain().focus().toggleOrderedList().run()} class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('orderedList') ? 'bg-gray-800 text-white' : 'text-gray-700'}"><Icon icon="mdi:format-list-numbered" class="text-base" /></button>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<div class="relative" use:clickOutside={() => { showLinkInput = false; }}>
									<button type="button" title="Link" on:click={() => { if ($emailEditor.isActive('link')) $emailEditor.chain().focus().unsetLink().run(); else showLinkInput = !showLinkInput; }} class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('link') ? 'bg-gray-800 text-white' : 'text-gray-700'}"><Icon icon="mdi:link-variant" class="text-base" /></button>
									{#if showLinkInput}
										<div class="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-lg border bg-white p-2 shadow-lg">
											<input type="url" bind:value={linkUrl} placeholder="https://..." class="w-48 rounded border px-2 py-1 text-xs focus:outline-none" on:keydown={(e) => { if (e.key === 'Enter') insertLink(); }} />
											<button on:click={insertLink} class="rounded bg-gray-800 px-2 py-1 text-xs text-white">Add</button>
										</div>
									{/if}
								</div>
								<button type="button" title="Image" on:click={triggerImageUpload} class="rounded px-2 py-1 text-gray-700 hover:bg-gray-200"><Icon icon="mdi:image-outline" class="text-base" /></button>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<button type="button" title="Blockquote" on:click={() => $emailEditor.chain().focus().toggleBlockquote().run()} class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('blockquote') ? 'bg-gray-800 text-white' : 'text-gray-700'}"><Icon icon="mdi:format-quote-close" class="text-base" /></button>
								<button type="button" title="Code block" on:click={() => $emailEditor.chain().focus().toggleCodeBlock().run()} class="rounded px-2 py-1 hover:bg-gray-200 {$emailEditor.isActive('codeBlock') ? 'bg-gray-800 text-white' : 'text-gray-700'}"><Icon icon="mdi:code-tags" class="text-base" /></button>
								<button type="button" title="Horizontal rule" on:click={() => $emailEditor.chain().focus().setHorizontalRule().run()} class="rounded px-2 py-1 text-gray-700 hover:bg-gray-200"><Icon icon="mdi:minus" class="text-base" /></button>
								<div class="mx-1 h-4 w-px bg-gray-300"></div>
								<button type="button" title="Undo" on:click={() => $emailEditor.chain().focus().undo().run()} class="rounded px-2 py-1 text-gray-700 hover:bg-gray-200">↩</button>
								<button type="button" title="Redo" on:click={() => $emailEditor.chain().focus().redo().run()} class="rounded px-2 py-1 text-gray-700 hover:bg-gray-200">↪</button>
							{/if}
						</div>
						<div class="max-h-[300px] min-h-[180px] overflow-y-auto p-4 text-sm text-gray-800">
							<EditorContent editor={$emailEditor} />
						</div>
					</div>
				</div>

				<!-- Schedule Option -->
				<div class="mb-4 rounded-lg border border-gray-100 bg-[#F8F8F9] p-3">
					<div class="flex items-center gap-3">
						<button on:click={() => (mode = 'send')} class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition {mode === 'send' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 shadow-sm'}">
							<Icon icon="mdi:send" class="text-sm" /> Send Now
						</button>
						<button on:click={() => (mode = 'schedule')} class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition {mode === 'schedule' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 shadow-sm'}">
							<Icon icon="mdi:clock-outline" class="text-sm" /> Schedule
						</button>
					</div>

					{#if mode === 'schedule'}
						<div class="mt-3 flex flex-wrap items-center gap-3">
							<div class="relative">
								<button on:click={() => (showDatePicker = !showDatePicker)} class="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-gray-700">
									<Icon icon="mdi:calendar" class="text-sm text-gray-400" />
									{scheduledDate ? scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick date'}
								</button>
								<DatePickerModal bind:open={showDatePicker} bind:selectedDate={scheduledDate} minDate={new Date()} />
							</div>
							<div class="relative">
								<button on:click={() => (showTimePicker = !showTimePicker)} class="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-gray-700">
									<Icon icon="mdi:clock-outline" class="text-sm text-gray-400" />
									{scheduledTime || 'Pick time'}
								</button>
								<TimeModal bind:open={showTimePicker} bind:selectedTime={scheduledTime} />
							</div>
						</div>
					{/if}
				</div>

				{#if errorMsg}
					<p class="mb-3 text-sm text-red-500">{errorMsg}</p>
				{/if}
				{#if successMsg}
					<div class="mb-3 flex items-center gap-2 rounded-lg bg-[#E3F4E1] px-4 py-3 text-sm text-[#3CBD2C]">
						<Icon icon="mdi:check-circle" class="text-lg" /> {successMsg}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<!-- Footer -->
			<div class="border-t border-gray-200 px-5 py-3">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs text-[#B9BABA]">Sending to <span class="font-medium text-gray-700">{selectedStatusLabels}</span></span>
					<button on:click={handlePreview} disabled={!canPreview} class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-[#626365] transition hover:bg-gray-50 disabled:opacity-40" title="Send a test email to yourself">
						{#if previewing}
							<Icon icon="mdi:loading" class="animate-spin text-sm" /> Sending...
						{:else}
							<Icon icon="mdi:eye-outline" class="text-sm" /> Preview
						{/if}
					</button>
				</div>
				<div class="flex items-center gap-2">
					<button on:click={() => (open = false)} class="flex-1 rounded-lg border bg-gray-100 py-2.5 text-sm text-[#626365]">Cancel</button>
					<button on:click={handleSend} disabled={!canSend} class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition {canSend ? 'bg-gray-800 hover:bg-gray-700' : 'cursor-not-allowed bg-[#969798]'}">
						{#if sending}
							<Icon icon="mdi:loading" class="animate-spin text-base" /> Sending...
						{:else if mode === 'schedule'}
							<Icon icon="mdi:clock-outline" class="text-base" /> Schedule
						{:else}
							<Icon icon="mdi:send" class="text-base" /> Send
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.ProseMirror) { outline: none; min-height: 80px; line-height: 1.6; }
	:global(.ProseMirror p.is-editor-empty:first-child::before) { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; float: left; height: 0; }
	:global(.ProseMirror h1) { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; }
	:global(.ProseMirror h2) { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.4rem; }
	:global(.ProseMirror p) { margin-bottom: 0.5rem; }
	:global(.ProseMirror ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
	:global(.ProseMirror ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
	:global(.ProseMirror strong) { font-weight: 700; }
	:global(.ProseMirror em) { font-style: italic; }
	:global(.ProseMirror s) { text-decoration: line-through; }
	:global(.ProseMirror blockquote) { border-left: 3px solid #d1d5db; padding-left: 1rem; margin: 0 0 0.5rem; color: #6b7280; }
	:global(.ProseMirror hr) { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
	:global(.ProseMirror a) { color: #2563eb; text-decoration: underline; cursor: pointer; }
	:global(.ProseMirror img) { max-width: 100%; height: auto; border-radius: 0.375rem; margin: 0.5rem 0; }
	:global(.ProseMirror pre) { background: #f4f5f6; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0.5rem 0; font-family: monospace; font-size: 13px; }
	:global(.ProseMirror code) { background: #f4f5f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
</style>
