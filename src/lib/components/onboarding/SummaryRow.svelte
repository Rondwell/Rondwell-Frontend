<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		icon: string;
		label: string;
		value?: string;
		editStep: number;
		onEdit: (step: number) => void;
		showBorder?: boolean;
		children?: Snippet;
	}

	let { icon, label, value, editStep, onEdit, showBorder = true, children }: Props = $props();
</script>

<div class="flex items-center justify-between py-4 {showBorder ? 'border-b border-[#E5E7EB]' : ''}">
	<div class="flex items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
			<img src={icon} alt={label} class="h-5 w-5" />
		</div>
		<div>
			<div class="text-xs tracking-wider text-[#5C5C5C] uppercase">{label}</div>
			{#if children}
				{@render children()}
			{:else}
				<div class="text-sm font-medium text-[#171717]">{value || 'Not provided'}</div>
			{/if}
		</div>
	</div>
	<button
		class="text-gray-400 transition-colors hover:text-gray-600"
		onclick={() => onEdit(editStep)}
	>
		<img src="/edit.svg" alt="edit" class="h-[11.42px] w-[11.98px]" />
	</button>
</div>
