<script lang="ts">
	interface Props {
		currentStep: number;
		totalSteps: number;
		canProceed: boolean;
		isSubmitting?: boolean;
		onNext: () => void;
		onPrev: () => void;
		onSubmit: () => void;
	}

	let { currentStep, totalSteps, canProceed, isSubmitting = false, onNext, onPrev, onSubmit }: Props = $props();
</script>

<div class="mt-8 flex gap-4">
	{#if currentStep > 1}
		<button
			onclick={onPrev}
			class="h-[40px] flex-1 rounded-[10px] border border-[#EBEBEB] bg-white py-2 font-medium text-[#171717] transition hover:bg-gray-50"
		>
			Back
		</button>
	{/if}

	{#if currentStep < totalSteps}
		<button
			onclick={onNext}
			disabled={!canProceed}
			class="h-[40px] flex-1 rounded-[10px] bg-black py-2 text-white transition disabled:opacity-60"
		>
			Continue
		</button>
	{:else}
		<button
			onclick={onSubmit}
			disabled={isSubmitting}
			class="h-[40px] flex-1 rounded-[10px] bg-black py-2 font-medium text-white transition disabled:opacity-50"
		>
			{#if isSubmitting}
				<div class="flex items-center justify-center gap-2">
					<svg class="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Creating Profile...
				</div>
			{:else}
				Complete Registration
			{/if}
		</button>
	{/if}
</div>
