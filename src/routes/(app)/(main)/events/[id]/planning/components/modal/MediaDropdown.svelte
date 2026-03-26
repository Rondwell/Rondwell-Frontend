<script lang="ts">
	import { deleteEventMedia } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount, tick } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let buttonEl: HTMLElement;
	export let media: any = null;
	export let eventId = '';

	let dropdownEl: HTMLElement;
	let positionAbove = false;
	let showDeleteConfirm = false;
	let linkCopied = false;

	const items = [
		{ label: 'View Full Size', icon: 'mdi:eye-outline', action: 'view' },
		{ label: 'Download', icon: 'mdi:download-outline', action: 'download' },
		{ label: 'Copy Link', icon: 'mdi:content-copy', action: 'copyLink' },
		{ label: 'Add to Photo Album', icon: 'mdi:plus', action: 'addAlbum' },
		{ label: 'Delete File', icon: 'mdi:trash-can-outline', action: 'delete', danger: true },
	];

	async function handleAction(action: string) {
		if (action === 'view') { window.open(media?.url, '_blank'); open = false; }
		else if (action === 'download') {
			const a = document.createElement('a'); a.href = media?.url; a.download = media?.title || 'download'; a.click();
			open = false;
		} else if (action === 'copyLink') {
			navigator.clipboard.writeText(media?.url || '').then(() => { linkCopied = true; setTimeout(() => (linkCopied = false), 2000); });
		} else if (action === 'delete') { showDeleteConfirm = true; open = true; }
		else { open = false; }
	}

	async function confirmDelete() {
		try { await deleteEventMedia(eventId, media._id || media.id); dispatch('updated'); }
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
<div bind:this={dropdownEl} class="absolute right-0 z-50 w-56 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg" class:bottom-full={positionAbove} class:top-full={!positionAbove} style="margin-top: 8px;">
	{#if showDeleteConfirm}
	<div class="p-3">
		<p class="mb-2 text-sm text-gray-700">Delete this file? This cannot be undone.</p>
		<div class="flex gap-2">
			<button on:click={() => { showDeleteConfirm = false; open = false; }} class="rounded-md bg-gray-100 px-3 py-1.5 text-sm">Cancel</button>
			<button on:click={confirmDelete} class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white">Delete</button>
		</div>
	</div>
	{:else}
	{#each items as item}
	<button on:click={() => handleAction(item.action)} class="flex w-full cursor-pointer items-center justify-between rounded-md p-2 hover:bg-[#EBECED] {item.danger ? 'text-red-500' : ''}">
		<span class="flex items-center gap-2"><Icon icon={item.icon} class="text-lg" /> {item.label}</span>
		{#if item.action === 'copyLink' && linkCopied}<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-green-600">Copied!</span>{/if}
	</button>
	{/each}
	{/if}
</div>
{/if}
