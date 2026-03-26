<script lang="ts">
	import { deleteEventFaq, updateEventFaq } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount, tick } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let buttonEl: HTMLElement;
	export let faq: any = null;
	export let eventId = '';

	let dropdownEl: HTMLElement;
	let positionAbove = false;
	let showDeleteConfirm = false;

	const items = [
		{ label: 'Create FAQ', icon: 'mdi:plus', action: 'create' },
		{ label: 'Edit FAQ', icon: 'mdi:pencil-outline', action: 'edit' },
		{ label: 'Make Public', icon: 'mdi:eye-outline', action: 'togglePublic' },
		{ label: 'Delete FAQ', icon: 'mdi:trash-can-outline', action: 'delete', danger: true },
	];

	async function handleAction(action: string) {
		if (action === 'create') { dispatch('action', { type: 'create' }); open = false; }
		else if (action === 'edit') { dispatch('action', { type: 'edit', faq }); open = false; }
		else if (action === 'togglePublic') {
			try { await updateEventFaq(eventId, faq._id || faq.id, { isPublic: !faq.isPublic }); dispatch('updated'); }
			catch (e: any) { alert(e.message || 'Failed to update'); }
			open = false;
		} else if (action === 'delete') { showDeleteConfirm = true; open = true; }
	}

	async function confirmDelete() {
		try { await deleteEventFaq(eventId, faq._id || faq.id); dispatch('updated'); }
		catch (e: any) { alert(e.message || 'Failed to delete'); }
		showDeleteConfirm = false; open = false;
	}

	function updatePosition() {
		if (!dropdownEl || !buttonEl) return;
		const r = buttonEl.getBoundingClientRect();
		positionAbove = window.innerHeight - r.bottom < dropdownEl.offsetHeight + 100;
	}

	$: if (open) { tick().then(updatePosition); }
	onMount(() => { window.addEventListener('resize', updatePosition); window.addEventListener('scroll', updatePosition, true); return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true); }; });
</script>

{#if open}
<div bind:this={dropdownEl} class="absolute right-0 z-50 w-48 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg" class:bottom-full={positionAbove} class:top-full={!positionAbove} style="margin-top: 8px;">
	{#if showDeleteConfirm}
	<div class="p-3">
		<p class="mb-2 text-sm text-gray-700">Delete this FAQ? This cannot be undone.</p>
		<div class="flex gap-2">
			<button on:click={() => { showDeleteConfirm = false; open = false; }} class="rounded-md bg-gray-100 px-3 py-1.5 text-sm">Cancel</button>
			<button on:click={confirmDelete} class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white">Delete</button>
		</div>
	</div>
	{:else}
	{#each items as item}
	<button on:click={() => handleAction(item.action)} class="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-[#EBECED] {item.danger ? 'text-red-500' : ''}">
		<Icon icon={item.icon} class="text-lg" /> {item.label}
	</button>
	{/each}
	{/if}
</div>
{/if}
