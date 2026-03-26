<script lang="ts">
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { sendSpeakerMessage } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open: boolean = false;
	export let speakerData: any = null;
	export let eventId: string = '';
	export let eventTitle: string = '';

	let subject = '';
	let message = '';
	let sending = false;
	let sendError = '';
	let sendSuccess = '';
	let showDropdown = false;

	// Rich text formatting
	let isBold = false;
	let isItalic = false;

	$: if (open && speakerData) {
		subject = `Message regarding ${eventTitle || 'Event'}`;
		message = '';
		sendError = '';
		sendSuccess = '';
	}

	function getSpeakerName(): string {
		return speakerData?.displayName || speakerData?.applicationDetails?.contactEmail || 'Speaker';
	}

	async function handleSend() {
		if (!message.trim()) {
			sendError = 'Please enter a message';
			return;
		}
		if (!speakerData?.id || !eventId) return;

		sending = true;
		sendError = '';
		sendSuccess = '';
		try {
			await sendSpeakerMessage(eventId, speakerData.id, {
				subject,
				message,
				email: speakerData.applicationDetails?.contactEmail,
			});
			sendSuccess = 'Message sent successfully!';
			dispatch('sent');
			setTimeout(() => { open = false; sendSuccess = ''; }, 1500);
		} catch (e: any) {
			sendError = e.message || 'Failed to send message';
		} finally {
			sending = false;
		}
	}

	function applyFormatting(type: string) {
		if (type === 'bold') {
			message += '<strong></strong>';
		} else if (type === 'italic') {
			message += '<em></em>';
		} else if (type === 'heading') {
			message += '<h3></h3>';
		} else if (type === 'list') {
			message += '<ul><li></li></ul>';
		}
		showDropdown = false;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 backdrop-blur-sm" on:click={() => (open = false)}>
		<div class="flex h-full max-h-130 w-full max-w-lg flex-col rounded-lg bg-white shadow-lg" on:click|stopPropagation>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex items-center gap-3">
					<button aria-label="Close" on:click={() => (open = false)}>
						<svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect y="12.8203" width="9.9258" height="1.96151" rx="0.980754" transform="rotate(-45 0 12.8203)" fill="#68696B"/>
							<rect x="1.38867" width="10.0318" height="1.96151" rx="0.980754" transform="rotate(45 1.38867 0)" fill="#68696B"/>
							<rect x="7.10547" y="12.8203" width="9.9258" height="1.96151" rx="0.980754" transform="rotate(-45 7.10547 12.8203)" fill="#68696B"/>
							<rect x="8.49414" width="10.0318" height="1.96151" rx="0.980754" transform="rotate(45 8.49414 0)" fill="#68696B"/>
						</svg>
					</button>
					<p class="font-medium">Send Message to {getSpeakerName()}</p>
				</div>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
				<h3 class="mb-1 font-semibold text-gray-800">Compose Message</h3>
				<p class="text-xs font-medium text-gray-500">This message will be sent to the speaker's email address.</p>

				{#if sendError}
					<p class="mt-2 text-sm text-red-500">{sendError}</p>
				{/if}
				{#if sendSuccess}
					<p class="mt-2 text-sm text-green-600">{sendSuccess}</p>
				{/if}

				<div class="mt-4">
					<!-- Subject -->
					<div class="mb-3">
						<label class="mb-1 block text-sm font-medium text-gray-700" for="msg_subject">Subject</label>
						<input id="msg_subject" type="text" bind:value={subject} class="w-full rounded-md border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700 focus:border-gray-400 focus:outline-none" />
					</div>

					<!-- Rich Text Toolbar -->
					<div class="mb-2 flex items-center gap-1 rounded-t-md border border-b-0 border-gray-200 bg-gray-50 px-2 py-1">
						<button on:click={() => applyFormatting('bold')} class="rounded p-1 hover:bg-gray-200" title="Bold">
							<Icon icon="mdi:format-bold" class="text-lg text-gray-600" />
						</button>
						<button on:click={() => applyFormatting('italic')} class="rounded p-1 hover:bg-gray-200" title="Italic">
							<Icon icon="mdi:format-italic" class="text-lg text-gray-600" />
						</button>
						<button on:click={() => applyFormatting('heading')} class="rounded p-1 hover:bg-gray-200" title="Heading">
							<Icon icon="mdi:format-header-1" class="text-lg text-gray-600" />
						</button>
						<button on:click={() => applyFormatting('list')} class="rounded p-1 hover:bg-gray-200" title="List">
							<Icon icon="mdi:format-list-bulleted" class="text-lg text-gray-600" />
						</button>
						<div class="mx-1 h-4 w-px bg-gray-300"></div>
						<div class="relative" use:clickOutside={() => { showDropdown = false; }}>
							<button on:click={() => (showDropdown = !showDropdown)} class="rounded p-1 hover:bg-gray-200" title="More options">
								<Icon icon="mdi:plus" class="text-lg text-gray-600" />
							</button>
							<TextEditor open={showDropdown} className="top-8 left-0" />
						</div>
					</div>

					<!-- Message Body -->
					<textarea rows="8" placeholder="Write your message here..." bind:value={message} class="w-full resize-none rounded-b-md border border-gray-200 bg-white p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none"></textarea>

					<p class="mt-1 text-xs text-gray-400">
						The speaker will receive this message via email.
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="mt-auto flex items-center justify-between border-t px-5 py-3">
				<button on:click={() => (open = false)} class="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
				<button on:click={handleSend} disabled={sending} class="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50">
					{sending ? 'Sending...' : 'Send Message'}
				</button>
			</div>
		</div>
	</div>
{/if}
