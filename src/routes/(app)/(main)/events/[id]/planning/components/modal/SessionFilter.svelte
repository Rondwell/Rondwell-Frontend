<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let type: 'room' | 'speakers' | 'sessionType' = 'room';
	export let rooms: any[] = [];
	export let speakers: any[] = [];

	const dispatch = createEventDispatcher();

	const sessionTypes = [
		{ label: 'All', value: 'All', icon: 'mdi:view-grid-outline' },
		{ label: 'Keynote', value: 'TALK', icon: 'mdi:microphone-variant' },
		{ label: 'Workshop', value: 'WORKSHOP', icon: 'mdi:wrench-outline' },
		{ label: 'Panel', value: 'PANEL', icon: 'mdi:account-group-outline' },
		{ label: 'Networking', value: 'NETWORKING', icon: 'mdi:handshake-outline' },
	];

	$: items = type === 'room'
		? [{ label: 'No Room Assigned', value: 'unassigned', icon: 'mdi:minus-circle-outline' }, ...rooms.map(r => ({ label: r.name, value: r.id || r._id, icon: 'mdi:door-open' }))]
		: type === 'speakers'
			? [{ label: 'All', value: 'All', icon: 'mdi:view-grid-outline' }, { label: 'Assigned', value: 'assigned', icon: 'mdi:account-check-outline' }, { label: 'Unassigned', value: 'unassigned', icon: 'mdi:account-off-outline' }, ...speakers.map(s => ({ label: s.displayName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Anonymous', value: s.participantProfileId || s._id || s.id, icon: 'mdi:account-outline' }))]
			: sessionTypes;
</script>

{#if open}
	<div class="absolute right-0 z-50 mt-2 max-h-64 w-52 overflow-y-auto rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg">
		{#if type === 'room'}
			<button on:click={() => dispatch('select', 'All')} class="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-[#EBECED]">
				<Icon icon="mdi:view-grid-outline" class="text-lg" />
				<span>All</span>
			</button>
		{/if}
		{#each items as item}
			<button on:click={() => dispatch('select', item.value)} class="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-[#EBECED]">
				<Icon icon={item.icon} class="text-lg" />
				<span class="truncate">{item.label}</span>
			</button>
		{/each}
	</div>
{/if}
