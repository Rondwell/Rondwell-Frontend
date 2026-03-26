<script lang="ts">
	import { getTicketTypes, updateEventRoom } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';
	export let room: any = null;

	let accessMode: 'ALL' | 'SPECIFIC' = 'ALL';
	let selectedTicketIds: string[] = [];
	let ticketTypes: any[] = [];
	let saving = false;
	let error = '';
	let loadingTickets = false;

	$: if (open && room) {
		accessMode = room.accessType === 'TICKET_TIERED' ? 'SPECIFIC' : 'ALL';
		selectedTicketIds = room.allowedTicketTypeIds || [];
		loadTickets();
	}

	async function loadTickets() {
		loadingTickets = true;
		try {
			ticketTypes = await getTicketTypes(eventId);
		} catch { ticketTypes = []; }
		finally { loadingTickets = false; }
	}

	function toggleTicket(id: string) {
		if (selectedTicketIds.includes(id)) {
			selectedTicketIds = selectedTicketIds.filter(t => t !== id);
		} else {
			selectedTicketIds = [...selectedTicketIds, id];
		}
	}

	async function handleSave() {
		if (!room?.id || !eventId) return;
		saving = true; error = '';
		try {
			const payload: any = {
				accessType: accessMode === 'ALL' ? 'PUBLIC' : 'TICKET_TIERED',
			};
			if (accessMode === 'SPECIFIC') {
				payload.allowedTicketTypeIds = selectedTicketIds;
			} else {
				payload.allowedTicketTypeIds = [];
			}
			await updateEventRoom(eventId, room.id, payload);
			dispatch('saved');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to save access settings';
		} finally {
			saving = false;
		}
	}
</script>

{#if open && room}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex items-center gap-3">
					<button aria-label="Close" on:click={() => (open = false)}>
						<Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" />
					</button>
					<p class="font-medium">Manage Room Access</p>
				</div>
				<div class="flex items-center gap-3">
					<button on:click={handleSave} disabled={saving} class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
						<Icon icon="mdi:content-save-edit-outline" class="text-sm" />
						{saving ? 'Saving...' : 'Save Access Settings'}
					</button>
					<button on:click={() => (open = false)} class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]">
						Cancel <Icon icon="mdi:close" class="text-sm" />
					</button>
				</div>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
				<h2 class="text-2xl font-semibold text-gray-900">Manage Access for {room.name}</h2>

				{#if error}
					<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
				{/if}

				<!-- Access Mode -->
				<div class="rounded-lg border border-gray-200 bg-white p-5">
					<div class="mb-4 flex items-center gap-1">
						<p class="font-medium text-gray-900">Who can access this room?</p>
						<Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
					</div>

					<label class="mb-4 flex cursor-pointer items-start gap-3">
						<input type="radio" bind:group={accessMode} value="ALL" class="mt-1" />
						<div>
							<p class="font-medium text-gray-900">All Attendees</p>
							<p class="text-sm text-gray-500">Makes the room publicly accessible to anyone registered for the event.</p>
						</div>
					</label>

					<label class="flex cursor-pointer items-start gap-3">
						<input type="radio" bind:group={accessMode} value="SPECIFIC" class="mt-1" />
						<div>
							<p class="font-medium text-gray-900">Specific Ticket Types</p>
							<p class="text-sm text-gray-500">Restricts access to selected ticket holders only.</p>
						</div>
					</label>
				</div>

				<!-- Ticket Type Selection -->
				{#if accessMode === 'SPECIFIC'}
					<div>
						<div class="mb-3 flex items-center gap-1">
							<p class="font-medium text-gray-900">Select the ticket types that will have access to this room.</p>
							<Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
						</div>

						{#if loadingTickets}
							<p class="py-4 text-center text-sm text-gray-400">Loading ticket types...</p>
						{:else if ticketTypes.length > 0}
							<div class="space-y-3">
								{#each ticketTypes as ticket}
									{@const ticketId = ticket._id || ticket.id}
									{@const isSelected = selectedTicketIds.includes(ticketId)}
									<button on:click={() => toggleTicket(ticketId)} class="flex w-full items-center justify-between rounded-lg border bg-white p-4 transition-colors {isSelected ? 'border-gray-800' : 'border-gray-200 hover:border-gray-300'}">
										<div class="flex items-center gap-3">
											<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
												<Icon icon="mdi:ticket-outline" class="text-xl text-gray-500" />
											</div>
											<span class="font-medium text-gray-900">{ticket.name}</span>
										</div>
										<div class="flex h-5 w-5 items-center justify-center rounded-full border-2 {isSelected ? 'border-gray-800 bg-gray-800' : 'border-gray-300'}">
											{#if isSelected}
												<Icon icon="mdi:check" class="text-sm text-white" />
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{:else}
							<p class="py-4 text-center text-sm text-gray-400">No ticket types found. Create ticket types in the Registration section first.</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
