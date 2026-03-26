<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let type: 'chat' | 'access' = 'chat';

	const dispatch = createEventDispatcher();

	$: items = type === 'chat'
		? [
			{ label: 'All', icon: 'mdi:view-grid-outline' },
			{ label: 'Enabled', icon: 'mdi:check-circle-outline' },
			{ label: 'Disabled', icon: 'mdi:close-circle-outline' },
		]
		: [
			{ label: 'All', icon: 'mdi:view-grid-outline' },
			{ label: 'Public', icon: 'mdi:web' },
			{ label: 'Restricted', icon: 'mdi:eye-off-outline' },
		];
</script>

{#if open}
	<div class="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg">
		{#each items as item}
			<button on:click={() => dispatch('select', item.label)} class="flex w-full cursor-pointer items-center justify-between p-2 hover:bg-[#EBECED]">
				<span>{item.label}</span>
				<Icon icon={item.icon} class="text-lg" />
			</button>
		{/each}
	</div>
{/if}
