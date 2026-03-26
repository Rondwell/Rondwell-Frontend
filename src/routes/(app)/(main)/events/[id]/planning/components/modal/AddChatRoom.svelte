<script lang="ts">
	import { createEventRoom } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';

	let name = '';
	let description = '';
	let saving = false;
	let error = '';

	$: if (open) { name = ''; description = ''; error = ''; }

	async function handleSave() {
		if (!name.trim()) { error = 'Room name is required'; return; }
		saving = true; error = '';
		try {
			await createEventRoom(eventId, { name: name.trim(), description: description.trim() || undefined, communityChatEnabled: true });
			dispatch('saved');
			open = false;
		} catch (e: any) { error = e.message || 'Failed to create chat room'; }
		finally { saving = false; }
	}
</script>

{#if open}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<div class="space-y-5 px-6 py-6">
		<!-- Icon -->
		<div class="flex h-14 w-14 items-center justify-center rounded-lg bg-[#E0F5DF]">
			<img src="/chatroom.svg" alt="chatroom" class="h-8 w-8" />
		</div>

		<h2 class="text-2xl font-semibold text-gray-900">Add New Room</h2>

		{#if error}<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>{/if}

		<!-- Room Name -->
		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Room Name <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<input type="text" bind:value={name} placeholder="e.g., General Chat, Help Desk" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none" />
		</div>

		<!-- Room Description -->
		<div>
			<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Room Description <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
			<div class="relative">
				<textarea bind:value={description} placeholder="e.g., Open discussion for all topics" rows="3" maxlength="100" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
				<span class="absolute right-3 bottom-3 text-xs text-gray-400">{description.length}/100</span>
			</div>
			<p class="mt-1 flex items-center gap-1 text-xs text-gray-500"><Icon icon="mdi:information-outline" width="12" class="text-gray-400" /> You can describe your room briefly.</p>
		</div>

		<!-- Save Button -->
		<button on:click={handleSave} disabled={saving} class="w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
			{saving ? 'Creating...' : 'Add New Room'}
		</button>
	</div>
</div>
</div>
{/if}
