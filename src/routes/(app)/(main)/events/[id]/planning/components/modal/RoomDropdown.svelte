<script lang="ts">
	import { deleteEventRoom, updateEventRoom } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount, tick } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let buttonEl: HTMLElement;
	export let room: any = null;
	export let eventId = '';

	let dropdownEl: HTMLElement;
	let positionAbove = false;
	let showDeactivateConfirm = false;
	let showDeleteConfirm = false;
	let linkCopied = false;

	const items = [
		{ label: 'Create Room', icon: 'mdi:plus', action: 'create' },
		{ label: 'Edit Room', icon: 'mdi:pencil-outline', action: 'edit' },
		{ label: 'Toggle Chat', icon: 'mdi:chat-outline', action: 'toggleChat' },
		{ label: 'Manage Access', icon: 'mdi:cog-outline', action: 'manageAccess' },
		{ label: 'Copy Room Link', icon: 'mdi:link-variant', action: 'copyLink' },
		{ label: 'View Room Community', icon: 'mdi:eye-outline', action: 'viewCommunity', condition: () => room?.communityChatEnabled },
		{ label: 'Deactivate Room', icon: 'mdi:close-circle-outline', action: 'deactivate', condition: () => room?.isActive },
		{ label: 'Delete Room', icon: 'mdi:trash-can-outline', action: 'delete', danger: true },
	];

	$: filteredItems = items.filter(i => !i.condition || i.condition());

	async function handleAction(action: string) {
		open = false;
		if (action === 'create') dispatch('action', { type: 'create' });
		else if (action === 'edit') dispatch('action', { type: 'edit', room });
		else if (action === 'manageAccess') dispatch('action', { type: 'manageAccess', room });
		else if (action === 'toggleChat') {
			try {
				await updateEventRoom(eventId, room.id, { communityChatEnabled: !room.communityChatEnabled });
				dispatch('updated');
			} catch (e: any) { alert(e.message || 'Failed to toggle chat'); }
		} else if (action === 'copyLink') {
			const link = room?.roomLink || `https://rondwell.com/event/${eventId}/room/${room?.id}`;
			navigator.clipboard.writeText(link).then(() => { linkCopied = true; setTimeout(() => (linkCopied = false), 2000); });
		} else if (action === 'viewCommunity') {
			window.open(`/events/${eventId}/community?room=${room?.id}`, '_blank');
		} else if (action === 'deactivate') {
			showDeactivateConfirm = true; open = true;
		} else if (action === 'delete') {
			showDeleteConfirm = true; open = true;
		}
	}

	async function confirmDeactivate() {
		try {
			await updateEventRoom(eventId, room.id, { isActive: false });
			dispatch('updated');
		} catch (e: any) { alert(e.message || 'Failed to deactivate'); }
		showDeactivateConfirm = false; open = false;
	}

	async function confirmDelete() {
		try {
			await deleteEventRoom(eventId, room.id);
			dispatch('updated');
		} catch (e: any) { alert(e.message || 'Failed to delete room'); }
		showDeleteConfirm = false; open = false;
	}

	function updatePosition() {
		if (!dropdownEl || !buttonEl) return;
		const r = buttonEl.getBoundingClientRect();
		positionAbove = window.innerHeight - r.bottom < dropdownEl.offsetHeight + 100;
	}

	$: if (open) { tick().then(updatePosition); }

	onMount(() => {
		window.addEventListener('resize', updatePosition);
		window.addEventListener('scroll', updatePosition, true);
		return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true); };
	});
</script>

{#if open}
	<div bind:this={dropdownEl} class="custom-scrollbar absolute right-0 z-50 w-64 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg" class:bottom-full={positionAbove} class:top-full={!positionAbove} style="margin-top: 8px; margin-bottom: 8px;">
		{#if showDeactivateConfirm}
			<div class="p-3">
				<p class="mb-2 text-sm text-gray-700">Deactivate <span class="font-medium">{room?.name}</span>? Sessions will still exist but won't be accessible via this room.</p>
				<div class="flex gap-2">
					<button on:click={() => { showDeactivateConfirm = false; open = false; }} class="rounded-md bg-gray-100 px-3 py-1.5 text-sm">Cancel</button>
					<button on:click={confirmDeactivate} class="rounded-md bg-black px-3 py-1.5 text-sm text-white">Deactivate</button>
				</div>
			</div>
		{:else if showDeleteConfirm}
			<div class="p-3">
				<p class="mb-2 text-sm text-gray-700">Delete <span class="font-medium">{room?.name}</span>? This will also remove all assigned sessions. This cannot be undone.</p>
				<div class="flex gap-2">
					<button on:click={() => { showDeleteConfirm = false; open = false; }} class="rounded-md bg-gray-100 px-3 py-1.5 text-sm">Cancel</button>
					<button on:click={confirmDelete} class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white">Delete Room</button>
				</div>
			</div>
		{:else}
			{#each filteredItems as item}
				<button on:click={() => handleAction(item.action)} class="flex w-full cursor-pointer items-center justify-between rounded-md p-2 hover:bg-[#EBECED] {item.danger ? 'text-red-500' : ''}">
					<span class="flex items-center gap-2">
						<Icon icon={item.icon} class="text-lg" />
						{item.label}
					</span>
					{#if item.action === 'copyLink' && linkCopied}
						<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-green-600">Copied!</span>
					{:else if item.action === 'copyLink'}
						<span class="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
							<Icon icon="mdi:content-copy" class="text-xs" /> Copy Link
						</span>
					{/if}
				</button>
			{/each}
		{/if}
	</div>
{/if}
