<script lang="ts">
	interface Props {
		show: boolean;
		taxRate: number;
		onSave: (rate: number) => void;
		onCancel: () => void;
	}

	let { show, taxRate, onSave, onCancel }: Props = $props();
	let tempRate = $state(0);

	$effect(() => {
		if (show) tempRate = taxRate;
	});
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
		onclick={onCancel}
		onkeydown={(e) => e.key === 'Escape' && onCancel()}
		role="button"
		tabindex="0"
	>
		<div
			class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="0"
		>
			<div class="mb-4">
				<h3 class="text-lg font-semibold text-[#1A1A1A]">Set Tax Rate</h3>
				<p class="text-sm text-gray-500">Enter the default tax rate for all products</p>
			</div>

			<div class="mb-6">
				<label for="taxRateInput" class="mb-2 block text-sm font-medium text-[#1A1A1A]">
					Tax Rate (%)
				</label>
				<div class="relative">
					<input
						id="taxRateInput"
						type="number"
						bind:value={tempRate}
						min="0"
						max="100"
						step="0.01"
						class="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-8 text-sm focus:ring-2 focus:ring-black focus:outline-none"
						placeholder="0.00"
					/>
					<span class="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400">%</span>
				</div>
			</div>

			<div class="flex gap-3">
				<button
					onclick={onCancel}
					class="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					onclick={() => onSave(tempRate)}
					class="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
				>
					Save Tax Rate
				</button>
			</div>
		</div>
	</div>
{/if}
