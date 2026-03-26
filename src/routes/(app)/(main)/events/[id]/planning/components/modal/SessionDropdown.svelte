<script lang="ts">
	import { deleteEventSession, updateEventSession } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount, tick } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let buttonEl: HTMLElement;
	export let session: any = null;
	export let eventId = '';

	let dropdownEl: HTMLElement;
	let positionAbove = false;
	let showDeleteConfirm = false;
	let linkCopied = false;

	const items = [
		{ label: 'Edit Session', icon: 'mdi:pencil-outline', action: 'edit' },
		{ label: 'Assign Speaker', icon: 'mdi:account-voice', action: 'assignSpeaker' },
		{ label: 'Move to Different Room', icon: 'mdi:swap-horizontal', action: 'moveRoom' },
		{ label: 'Toggle Visibility', icon: 'mdi:eye-outline', action: 'toggleVisibility' },
		{ label: 'Copy Session Link', icon: 'mdi:link-variant', action: 'copyLink' },
		{ label: 'Duplicate Session', icon: 'mdi:content-copy', action: 'duplicate' },
		{ label: 'Delete Session', icon: 'mdi:trash-can-outline', action: 'delete', danger: true },
	];

	async function handleAction(action: string) {
		if (action === 'edit') {
			open = false;
			dispatch('action', { type: 'edit', session });
		} else if (action === 'assignSpeaker') {
			open = false;
			dispatch('action', { type: 'assignSpeaker', session });
		} else if (action === 'moveRoom') {
			open = false;
			dispatch('action', { type: 'moveRoom', session });
		} else if (action === 'toggleVisibility') {
			try {
				await updateEventSession(eventId, session.roomId, session.id, { isPublic: !(session.isPublic ?? true) });
				dispatch('updated');
			} catch (e: any) { alert(e.message || 'Failed to toggle visibility'); }
			open = false;
		} else if (action === 'copyLink') {
			const link = session?.sessionLink || `https://rondwell.com/event/${eventId}/session/${session?.id}`;
			navigator.clipboard.writeText(link).then(() => { linkCopied = true; setTimeout(() => (linkCopied = false), 2000); });
		} else if (action === 'duplicate') {
			open = false;
			dispatch('action', { type: 'duplicate', session });
		} else if (action === 'delete') {
			showDeleteConfirm = true; open = true;
		}
	}

	async function confirmDelete() {
		try {
			await deleteEventSession(eventId, session.roomId, session.id);
			dispatch('updated');
		} catch (e: any) { alert(e.message || 'Failed to delete session'); }
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
		{#if showDeleteConfirm}
			<div class="p-3">
				<p class="mb-2 text-sm text-gray-700">Delete <span class="font-medium">{session?.title}</span>? This cannot be undone.</p>
				<div class="flex gap-2">
					<button on:click={() => { showDeleteConfirm = false; open = false; }} class="rounded-md bg-gray-100 px-3 py-1.5 text-sm">Cancel</button>
					<button on:click={confirmDelete} class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white">Delete Session</button>
				</div>
			</div>
		{:else}
			{#each items as item}
				<button on:click={() => handleAction(item.action)} class="flex w-full cursor-pointer items-center justify-between rounded-md p-2 hover:bg-[#EBECED] {item.danger ? 'text-red-500' : ''}">
					<span class="flex items-center gap-2">
						<Icon icon={item.icon} class="text-lg" />
						{item.label}
					</span>
					{#if item.action === 'copyLink' && linkCopied}
						<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-green-600">Copied!</span>
					{:else if item.action === 'copyLink'}
						<span class="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
							<Icon icon="mdi:content-copy" class="text-xs" /> Copy
						</span>
					{/if}
				</button>
			{/each}
		{/if}
	</div>
{/if}
