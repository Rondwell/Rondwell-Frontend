<script lang="ts">
	import { updateAttendeeStatus } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let attendee: any = {};
	export let eventId = '';

	let buttonOpen = false;
	let updating = false;
	let customMessage = '';

	$: if (open === false) { buttonOpen = false; }

	const options = [
		{ label: 'Attending', value: 'ATTENDING', icon: 'mdi:check-circle-outline' },
		{ label: 'Pending', value: 'PENDING', icon: 'mdi:clock-outline' },
		{ label: 'Waitlisted', value: 'WAITLISTED', icon: 'mdi:hourglass-empty' },
		{ label: 'Declined', value: 'DECLINED', icon: 'mdi:close-circle-outline' },
		{ label: 'Checked In', value: 'CHECKED_IN', icon: 'mdi:check-decagram' },
		{ label: 'Unregistered', value: 'UNREGISTERED', icon: 'mdi:account-remove-outline' },
		{ label: 'Unapproved', value: 'UNAPPROVED', icon: 'mdi:account-clock-outline' },
	];

	let selectedValue = options[0].value;
	let notify = false;

	$: selectedOption = options.find((o) => o.value === selectedValue) || options[0];

	function getStatusLabel(status: string) {
		const opt = options.find(o => o.value === status);
		return opt?.label || status;
	}

	async function handleUpdateStatus() {
		if (updating) return;
		updating = true;
		try {
			const attendeeId = attendee._id || attendee.id;
			await updateAttendeeStatus(eventId, attendeeId, selectedValue, notify, notify ? customMessage : undefined);
			dispatch('updated');
			open = false;
			buttonOpen = false;
		} catch (e: any) {
			console.error('Failed to update status:', e);
		} finally {
			updating = false;
		}
	}
</script>

{#if open}
	<div class="triangle absolute right-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
				{(attendee.name || attendee.firstName || 'A').charAt(0).toUpperCase()}
			</div>
			<div class="mt-3 flex items-center justify-between gap-2">
				<div>
					<p class="font-semibold text-gray-900">{attendee.name || `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim()}</p>
					<p class="text-xs text-gray-400">{attendee.email}</p>
				</div>
				<div class="flex items-center gap-1 rounded-md bg-[#DCDCDC] px-3 py-1 text-xs text-[#A9AAAA]">
					{getStatusLabel(attendee.status || attendee.attendeeStatus)}
				</div>
			</div>

			<label for="status-select" class="mt-4 mb-1 block text-sm font-medium text-gray-700">Change status to:</label>

			<div class="relative">
				<button
					type="button"
					class="flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-gray-500 transition-colors"
					on:click={() => (buttonOpen = !buttonOpen)}
				>
					<span class="flex items-center gap-2">
						<Icon icon={selectedOption.icon} class="text-lg" />
						{selectedOption.label}
					</span>
					<Icon icon="mdi:menu-down" class="h-6 w-6" />
				</button>

				{#if buttonOpen}
					<div class="absolute right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
						{#each options as option}
							<button
								class="w-full px-3 py-2 text-left text-sm transition hover:bg-gray-50 {selectedValue === option.value ? 'bg-[#E5E5E5]' : ''}"
								on:click={() => { selectedValue = option.value; buttonOpen = false; }}
							>
								<div class="flex gap-2">
									<Icon icon={option.icon} class="h-5 w-5 text-gray-400" />
									<p class="font-medium text-gray-800">{option.label}</p>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="mt-4 flex items-center space-x-2">
				<input type="checkbox" bind:checked={notify} class="h-[22px] w-[22px] rounded border-gray-300 accent-black focus:ring-0" id="notify" />
				<label for="notify" class="text-sm">Notify Attendee</label>
			</div>

			{#if notify}
				<div class="mt-4" transition:fade>
					<textarea
						rows="4"
						bind:value={customMessage}
						placeholder="Add an optional, custom message..."
						class="w-full resize-none rounded-md border bg-white p-2 text-xs text-gray-400 outline-none focus:ring-0"
					></textarea>
					<p class="mt-1 text-xs font-light text-[#BCBCBC]">
						Any message you specified in the registration emails will always be included.
					</p>
				</div>
			{/if}

			<button
				class="mt-5 w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
				disabled={updating}
				on:click={handleUpdateStatus}
			>
				{updating ? 'Updating...' : 'Update Status'}
			</button>
		</div>
	</div>
{/if}
