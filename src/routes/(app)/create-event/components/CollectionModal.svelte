<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let open: boolean = false;

	const options = [{ icon: '/face-1.svg', label: 'Personal Collection' }];
	let selected = options[0].label;

	const dispatch = createEventDispatcher();

	function select(option: string) {
		selected = option;
		dispatch('select', option);
	}
</script>

{#if open}
	<div class="triangle absolute z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4">
			<span class="text-sm font-semibold text-[#B8B7B7]">Choose collectin of the event:</span>

			<div class="mt-4">
				{#each options as option}
					<button
						type="button"
						class="flex w-full items-center justify-between gap-2 rounded px-1 py-2 text-left"
						on:click={() => select(option.label)}
					>
						<span class="flex items-center gap-2 text-sm text-black">
							<img src={option.icon} alt="icons" class="h-5 w-5" />
							{option.label}
						</span>
						{#if selected === option.label}
							<img src="/selected.svg" alt="selected icons" class="h-5 w-5" />
						{/if}
					</button>
				{/each}
			</div>
			<div class="mt-3 space-y-3">
				<p class="flex items-center gap-2 text-xl text-[#848384]">
					<Icon icon="mdi:plus" class="h-7 w-7" />
					Create Collection
				</p>
				<div class="flex items-center gap-2">
					<div class="h-[18.75px] w-[18.75px]">
						<svg
							width="19"
							height="19"
							viewBox="0 0 19 19"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M9.375 12.5V8.59375"
								stroke="#A9A8A8"
								stroke-width="2.25"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M15.625 14.0625C16.6016 12.7578 17.1875 11.1328 17.1875 9.375C17.1875 5.0625 13.6875 1.5625 9.375 1.5625C5.0625 1.5625 1.5625 5.0625 1.5625 9.375C1.5625 13.6875 5.0625 17.1875 9.375 17.1875C10.4922 17.1875 11.5625 16.9531 12.5234 16.5234"
								stroke="#A9A8A8"
								stroke-width="2.25"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M9.37891 6.25H9.37189"
								stroke="#A9A8A8"
								stroke-width="2.25"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<p class="text-sm text-[#B8B7B7]">
						Creating the event under a collection grants its admins manage access.
					</p>
				</div>
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
