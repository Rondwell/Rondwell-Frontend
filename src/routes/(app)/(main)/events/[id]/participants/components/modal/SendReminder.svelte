<script lang="ts">
	import { sendSpeakerReminder } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'speaker';
	export let speakerData: any = null;
	export let eventId = '';
	export let eventTitle = '';

	let sendCopy = false;
	let buttonOpen = false;
	let sending = false;
	let sendError = '';
	let sendSuccess = '';
	let customMessage = '';

	$: participantName = speakerData?.displayName || speakerData?.applicationDetails?.contactEmail || 'Speaker';

	const reminderTypes = [
		{ id: 1, label: 'General Reminder', icon: 'mdi:bell' },
		{ id: 2, label: 'Submission Deadline', icon: 'mdi:pencil' },
		{ id: 3, label: 'Presentation Upload', icon: 'mdi:clipboard-text' },
		{ id: 4, label: 'Session Approaching', icon: 'mdi:calendar-clock' }
	];

	let selectedOption = reminderTypes[0];

	function selectReminderType(option: typeof reminderTypes[0]) {
		selectedOption = option;
		buttonOpen = false;
	}

	async function handleSendReminder() {
		if (!speakerData?.id || !eventId) return;
		sending = true;
		sendError = '';
		sendSuccess = '';
		try {
			await sendSpeakerReminder(eventId, speakerData.id, {
				reminderType: selectedOption.label,
				customMessage: customMessage || undefined,
				sendCopy,
				email: speakerData.applicationDetails?.contactEmail,
			});
			sendSuccess = 'Reminder sent successfully!';
			dispatch('sent');
			setTimeout(() => { open = false; sendSuccess = ''; }, 1500);
		} catch (e: any) {
			sendError = e.message || 'Failed to send reminder';
		} finally {
			sending = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn max-h-180 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 shadow-xl md:max-h-150 md:p-6">
			<!-- Modal Header -->
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M19.2529 25.4017L21.2796 27.4283L25.3329 23.375" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16.2135 14.4907C16.0801 14.4774 15.9201 14.4774 15.7735 14.4907C12.6001 14.3841 10.0801 11.7841 10.0801 8.58406C10.0668 5.3174 12.7201 2.66406 15.9868 2.66406C19.2535 2.66406 21.9068 5.3174 21.9068 8.58406C21.9068 11.7841 19.3735 14.3841 16.2135 14.4907Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M15.9867 29.077C13.5601 29.077 11.1467 28.4636 9.30672 27.237C6.08005 25.077 6.08005 21.557 9.30672 19.4103C12.9734 16.957 18.9867 16.957 22.6534 19.4103" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
				</div>

				<h2 class="text-xl font-semibold text-gray-800">Send Reminder</h2>
				<p class="text-sm text-gray-500">Send a reminder to {participantName}.</p>
				<button class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700" on:click={() => (open = false)}>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<!-- Content -->
			<div class="custom-scrollbar mt-6 h-80 overflow-y-auto rounded-lg border p-4 md:h-60">
				<div>
					<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
						Send Reminder to {participantName}
					</h3>

					{#if sendError}
						<p class="mb-3 text-sm text-red-500">{sendError}</p>
					{/if}
					{#if sendSuccess}
						<p class="mb-3 text-sm text-green-600">{sendSuccess}</p>
					{/if}

					<div class="mt-4">
						<label class="flex text-gray-900" for="reminder_type">Select Reminder Type <span class="text-blue-600">*</span></label>
						<div use:clickOutside={() => (buttonOpen = false)} class="relative w-full">
							<button class="mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#ECEDED] bg-white p-3 text-sm font-medium text-[#3a3b3d]" on:click={() => (buttonOpen = !buttonOpen)}>
								<span class="flex items-center gap-1">{selectedOption.label}</span>
								<img src="/arrow-left.svg" alt="" class="rotate-90 transform" />
							</button>

							{#if buttonOpen}
								<div class="absolute left-0 z-10 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
									<div class="flex flex-col gap-2">
										{#each reminderTypes as option}
											<button on:click={() => selectReminderType(option)} class="flex w-full items-center justify-between rounded-sm p-2 {selectedOption.id === option.id ? 'bg-[#F0F0F0]' : ''}">
												<div class="truncate rounded-2xl px-2 py-1 text-xs font-medium">{option.label}</div>
												<Icon icon={option.icon} class="text-lg text-gray-500" />
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>

					<div class="mt-4">
						<label class="flex text-gray-900" for="custom_msg">Custom Message <span class="ml-1 text-gray-700">(Optional)</span></label>
						<textarea id="custom_msg" placeholder="Add a custom message or leave blank for the default reminder..." rows="4" bind:value={customMessage} class="mt-2 w-full resize-none rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"></textarea>
					</div>

					<div class="mt-2 flex items-center gap-2">
						<button on:click={() => (sendCopy = !sendCopy)} class="flex h-4 w-4 items-center justify-center rounded-full border-2 {sendCopy ? 'bg-black' : 'border-gray-300'}">
							{#if sendCopy}
								<Icon icon="mdi:tick" class="text-2xl text-white" />
							{/if}
						</button>
						<p class="text-xs font-light text-gray-600">Send a copy to my email.</p>
					</div>
				</div>
			</div>

			<div class="mt-6 flex items-center gap-2">
				<button on:click={() => (open = false)} class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs">Cancel</button>
				<button on:click={handleSendReminder} disabled={sending} class="rounded-md bg-black px-4 py-2 text-white shadow-xs disabled:opacity-50">
					{sending ? 'Sending...' : 'Send Reminder'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn { animation: fade 0.15s ease-out; }
	@keyframes fade { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>
