<script lang="ts">
	import { onMount } from 'svelte';

	export let options: string[] = [];
	export let value: string | null = null;
	export let placeholder: string = 'Select option';

	let open = false;
	let container: HTMLDivElement;

	function toggle() {
		open = !open;
	}

	function select(option: string) {
		value = option;
		open = false;
	}

	function handleClickOutside(event: MouseEvent) {
		if (!container.contains(event.target as Node)) {
			open = false;
		}
	}

	onMount(() => {
		window.addEventListener('click', handleClickOutside);
		return () => window.removeEventListener('click', handleClickOutside);
	});
</script>

<div bind:this={container} class="relative w-64">
	<!-- Trigger -->
	<button
		type="button"
		on:click={toggle}
		class="
      flex
      w-full
      items-center
      justify-between
      rounded-lg
      border
      border-gray-300
      bg-white
      px-4
      py-2
      text-gray-400
      transition
      hover:border-gray-400
      dark:border-gray-700
      dark:bg-gray-600
      dark:text-gray-200
    "
	>
		<span class={value ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}>
			{ value ?? placeholder}
		</span>

		<!-- Chevron -->
		<svg
			class="h-4 w-4 transition-transform {open ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Dropdown -->
	{#if open}
		<div
			class="
        absolute
        z-50
        mt-2
        w-full
        rounded-lg
        border
        border-gray-200
        bg-white
        shadow-lg
        dark:border-gray-700
        dark:bg-gray-900
        dark:text-gray-200
      "
		>
			{#each options as option}
				<button
					type="button"
					on:click={() => select(option)}
					class="
            flex
            w-full
            items-center
            justify-between
            px-4
            py-2
            text-left
            transition
            hover:bg-gray-100
            dark:hover:bg-gray-800
          "
				>
					<span>{option}</span>

					{#if option === value}
						<svg
							class="h-4 w-4 text-green-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
