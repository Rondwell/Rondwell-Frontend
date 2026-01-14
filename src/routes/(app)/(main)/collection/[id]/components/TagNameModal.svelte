<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;

	let input = '';
	let names: string[] = [];

	const dispatch = createEventDispatcher();

	function addName() {
		const value = input.trim();
		if (!value || names.includes(value)) return;

		names = [...names, value];
		input = '';
	}

	function removeName(name: string) {
		names = names.filter((n) => n !== name);
	}

	function submit() {
		dispatch('submit', names);
		open = false;
	}
</script>

{#if open}
	<!-- Tag container -->
	<div
		class="triangle absolute top-full left-0 z-40 mt-2 w-full gap-1 rounded-md border border-gray-300 bg-white p-2"
	>
		{#each names as name}
			<span class="flex flex-row items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs">
				{name}
				<button on:click={() => removeName(name)} class="text-gray-500 hover:text-red-500">
					×
				</button>
			</span>
		{/each}

		<!-- Name input -->
		<input
			type="text"
			bind:value={input}
			placeholder="Add new tag "
			on:keydown={(e) => e.key === 'Enter' && addName()}
			class="placeholder-opacity-30 w-full flex-1 rounded-md text-sm placeholder-[#C8C9C9] outline-none"
		/>
	</div>
{/if}

<style>
	/* Triangle pointer */
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		left: 20px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
