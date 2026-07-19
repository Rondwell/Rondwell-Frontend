<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: string;
	export let options: { label: string; value: string }[] = [];
	export let label = '';
	export let disabled = false;

	let open = false;
	const dispatch = createEventDispatcher();

	$: selected = options.find((o) => o.value === value);

	function choose(v: string) {
		value = v;
		open = false;
		dispatch('change', v);
	}
</script>

<div class="relative">
	{#if label}
		<span class="mb-1 block text-xs text-[#C1C2C2]">{label}</span>
	{/if}

	<button
		type="button"
		{disabled}
		on:click={() => (open = !open)}
		class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition hover:border-gray-300 focus:ring-1 focus:ring-[#513BE2] focus:outline-none disabled:opacity-50"
	>
		<span>{selected?.label ?? 'Select'}</span>
		<svg class="ml-2 flex-shrink-0 transition-transform {open ? 'rotate-180' : ''}" width="10" height="6" viewBox="0 0 10 6" fill="none">
			<path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
		</svg>
	</button>

	{#if open}
		<!-- click-away catcher -->
		<button type="button" aria-hidden="true" tabindex="-1" class="fixed inset-0 z-10 cursor-default" on:click={() => (open = false)}></button>
		<div class="absolute left-0 z-20 mt-1 w-full rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
			{#each options as o}
				<button
					type="button"
					on:click={() => choose(o.value)}
					class="flex w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 {value === o.value ? 'font-medium text-[#513BE2]' : 'text-gray-700'}"
				>
					{o.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
