<script lang="ts">
	interface Props {
		steps: string[];
		currentStep: number;
		onStepClick: (step: number) => void;
	}

	let { steps, currentStep, onStepClick }: Props = $props();

	function handleHorizontalScroll(event: WheelEvent) {
		const container = event.currentTarget as HTMLElement;
		event.preventDefault();
		container.scrollLeft += event.deltaY;
	}
</script>

<div class="mb-8 w-full border-b border-[#EBEBEB] py-3 pt-10 md:mx-auto md:w-[518px]">
	<div
		class="custom-scrollbar cursor-grab overflow-x-auto overflow-y-hidden scroll-smooth active:cursor-grabbing"
		onwheel={handleHorizontalScroll}
	>
		<div class="flex min-w-max items-center justify-start gap-4 px-4 md:px-0">
			{#each steps as stepLabel, index}
				<button
					type="button"
					class="flex cursor-pointer items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:mx-auto"
					onclick={() => onStepClick(index + 1)}
					disabled={index + 1 > currentStep}
				>
					<div
						class="mr-2 flex h-6 w-5 items-center justify-center rounded-full text-sm font-normal transition-all"
						style="background: {currentStep > index
							? 'linear-gradient(90deg, #DB3EC6 0%, #963DD4 50%, #513BE2 100%)'
							: '#FFFFFF'}; color: {currentStep > index ? '#FFFFFF' : '#5C5C5C'}"
					>
						{index + 1}
					</div>
					<span
						class="text-sm font-normal whitespace-nowrap transition-all"
						style="color: {currentStep > index ? '#171717' : '#5C5C5C'}"
					>
						{stepLabel}
					</span>
					{#if index < steps.length - 1}
						<div class="ml-2">
							<img src="/arrow-right-s-line.svg" alt="arrow" class="h-5 w-5" />
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	:global(.custom-scrollbar::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-track) {
		background: transparent;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-thumb) {
		background: #888;
		border-radius: 3px;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
		background: #555;
	}
</style>
