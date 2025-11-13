<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open: boolean = false;

	let selected = 'Virtual';
	const options = [
		{ icon: '/vid1.svg', label: 'Virtual' },
		{ icon: '/profile1.svg', label: 'Physical' },
		{ icon: '/tv.svg', label: 'Hybrid' }
	];

	const dispatch = createEventDispatcher();

	function select(option: string) {
		selected = option;
		dispatch('select', option);
	}
</script>

{#if open}
	<div id="eventType" class="triangle absolute z-40 mt-2 inline-block text-left">
		<div class="relative w-[270px] max-w-lg rounded-lg bg-[#FFFCFC] p-4">
			<span class="text-sm font-semibold text-[#B8B7B7]">Choose event type:</span>

			<div class="mt-4">
				{#each options as option}
					<button
						type="button"
						class="flex w-full items-center justify-between gap-2 rounded px-1 py-2 text-left text-sm text-[#848384] {selected ===
						option.label
							? 'bg-[#DDDEDE]'
							: ''}"
						on:click={() => select(option.label)}
					>
						<span class="flex items-center gap-1">
							<img src={option.icon} alt="icons" class="h-5 w-5" />
							{option.label}
						</span>
						{#if selected === option.label}
							<img src="/selected.svg" alt="selected icons" class="h-5 w-5" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Triangle pointer */
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		left: 90px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
