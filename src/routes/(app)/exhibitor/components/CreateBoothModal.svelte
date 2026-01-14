<script lang="ts">
	import {Plus } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	export let show = false;

	const dispatch = createEventDispatcher();

   type AccordionKeys = 'boothInfo' | 'mediaGallery' | 'downloadableResources' | 'liveInteraction' | 'productShowcase' | 'callToActions';

	// Accordion states
	let accordionStates: { [key in AccordionKeys]: boolean } = {
		boothInfo: false,
		mediaGallery: false,
		downloadableResources: false,
		liveInteraction: false,
		productShowcase: false,
		callToActions: false
	};

	function toggleAccordion(section: AccordionKeys) {
		accordionStates[section] = !accordionStates[section];
	}

	function closeModal() {
		dispatch('close');
	}

	function handleContinue() {
		// Dispatch submit event with form data
		dispatch('submit', {
			// Add your form data here
		});
	}

	function  handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		on:click={handleBackdropClick}
	>
		<div class="flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-[#FDFCFB]">
			<!-- Modal Header -->
			<div class="relative border-b border-[#EBEBEB] mb-10 px-8 py-6">
				<button
					on:click={closeModal}
					class="absolute top-6 right-8 bg-[#EBECED] rounded-full p-2 transition-colors hover:text-[#5C5C5C]"
				>

          <img alt="close" src="/close.svg" class="w-4 h-4"/>
				</button>

				<div class="mb-4 flex flex-col items-center text-center">
					<div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#F0F0F0]">
            <img alt="NDB" src="/NDB.svg" class="w-[96px] h-[96px] rounded-full"
            style="backdrop-filter: blur(24px)"/>
					</div>
					<h2 class="mb-2 text-2xl font-normal text-[#171717]">Create New Digital Booth</h2>
					<p class="text-[#5C5C5C] text-[16px]">Provide details of New Digital Booth to proceed.</p>
				</div>
			</div>

			<!-- Modal Body - Scrollable -->
			<div class="flex-1 overflow-y-auto md:px-8 px-4 py-6 custom-scrollbar">
				<div class="space-y-3">
					<!-- Booth Info Accordion -->
					<button
						on:click={() => toggleAccordion('boothInfo')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Booth Info</span>
						</div>
						<Plus class="h-4 w-4 text-[#5C5C5C]" />
					</button>

					{#if accordionStates.boothInfo}
						<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
							<!-- Add your booth info form fields here -->
							<p class="text-[#5C5C5C]">Booth Info form fields go here...</p>
						</div>
					{/if}

					<!-- Media Gallery Accordion -->
					<button
						on:click={() => toggleAccordion('mediaGallery')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Media Gallery</span>
						</div>
						<Plus class="h-4 w-4 text-[#5C5C5C]" />
					</button>

					{#if accordionStates.mediaGallery}
						<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
							<!-- Add your media gallery form fields here -->
							<p class="text-[#5C5C5C]">Media Gallery form fields go here...</p>
						</div>
					{/if}

					<!-- Downloadable Resources Accordion -->
					<button
						on:click={() => toggleAccordion('downloadableResources')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Downloadable Resources</span>
						</div>
						<Plus class="h-4 w-4 text-[#5C5C5C]" />
					</button>

					{#if accordionStates.downloadableResources}
						<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
							<!-- Add your downloadable resources form fields here -->
							<p class="text-[#5C5C5C]">Downloadable Resources form fields go here...</p>
						</div>
					{/if}

					<!-- Live Interaction & Leads Accordion -->
					<button
						on:click={() => toggleAccordion('liveInteraction')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Live Interaction & Leads</span>
						</div>
						<Plus class="h-4 w-4 text-[#5C5C5C]" />
					</button>

					{#if accordionStates.liveInteraction}
						<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
							<!-- Add your live interaction form fields here -->
							<p class="text-[#5C5C5C]">Live Interaction & Leads form fields go here...</p>
						</div>
					{/if}

					<!-- Product/Service Showcase Accordion -->
					<button
						on:click={() => toggleAccordion('productShowcase')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Product/Service Showcase</span>
						</div>
						<Plus class="h-4 w-4 text-[#5C5C5C]" />
					</button>

					{#if accordionStates.productShowcase}
						<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
							<!-- Add your product showcase form fields here -->
							<p class="text-[#5C5C5C]">Product/Service Showcase form fields go here...</p>
						</div>
					{/if}

					<!-- Call-to-Actions (CTAs) Accordion -->
					<button
						on:click={() => toggleAccordion('callToActions')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Call-to-Actions (CTAs)</span>
						</div>
						<Plus class="h-4 w-4 text-[#5C5C5C]" />
					</button>

					{#if accordionStates.callToActions}
						<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
							<!-- Add your CTA form fields here -->
							<p class="text-[#5C5C5C]">Call-to-Actions form fields go here...</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="border-t border-gray-200 px-8 py-6">
				<button
					on:click={handleContinue}
					class="w-full rounded-[10px] bg-black py-3.5 font-medium text-[14px] text-white transition-colors hover:bg-gray-800"
				>
					Continue
				</button>
			</div>
		</div>
	</div>
{/if}
