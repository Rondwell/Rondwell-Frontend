<script lang="ts">
	import { Plus, Minus } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import DatePickerModal from '../../create-event/components/DatePickerModal.svelte';
	import { colors, type Color } from '$lib/utils/colors';

	export let show = false;
	let openStartDatePickerModal = false;
	let startDate = new Date(2025, 10, 25);
	function scrollToId(id: string, options?: { behavior?: ScrollBehavior }) {
		const el = document.getElementById(id);
		if (!el) return;

		const isMobile = window.innerWidth <= 768;
		const rect = el.getBoundingClientRect();
		const viewHeight = window.innerHeight - (isMobile ? 100 : 0);

		let scrollAmount = 0;

		// If top of element is above the viewport
		if (rect.top < 0) {
			scrollAmount = rect.top - 16; // add small padding
		}
		// If bottom of element is below the viewport
		else if (rect.bottom > viewHeight) {
			scrollAmount = rect.bottom - viewHeight + 16; // add small padding
		}

		if (scrollAmount !== 0) {
			window.scrollBy({
				top: scrollAmount,
				left: 0,
				behavior: options?.behavior ?? 'smooth'
			});
		}
	}
	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', {
			weekday: 'short', // "Sat"
			month: 'short', // "Sep"
			day: 'numeric' // "14"
		});
	}
	let selectedColor: Color = colors[0];

	const dispatch = createEventDispatcher();

   type AccordionKeys = 'Details' | 'Media' | 'References & Testimonials' | 'Available & Fees' | 'productShowcase' | 'callToActions';

	// Accordion states
	let accordionStates: { [key in AccordionKeys]: boolean } = {
		Details: false,
		Media: false,
		'References & Testimonials': false,
		'Available & Fees': false,
		productShowcase: false,
		callToActions: false
	};
	// true if ANY accordion is open
$: isAnyAccordionOpen = Object.values(accordionStates).some(Boolean);


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
	// Learning Outcomes Logic
	let learningOutcomes: string[] = [];

	let audienceStyle = '';

	function addOutcome() {
		learningOutcomes = [...learningOutcomes, ''];
	}

	function removeOutcome(index: number) {
		learningOutcomes = learningOutcomes.filter((_, i) => i !== index);
	}

	function moveOutcomeUp(index: number) {
		if (index === 0) return;
		[learningOutcomes[index - 1], learningOutcomes[index]] =
			[learningOutcomes[index], learningOutcomes[index - 1]];
	}

	function moveOutcomeDown(index: number) {
		if (index === learningOutcomes.length - 1) return;
		[learningOutcomes[index + 1], learningOutcomes[index]] =
			[learningOutcomes[index], learningOutcomes[index + 1]];
	}

</script>

{#if show}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-40 bg-black/30" on:click={closeModal} />

	<!-- Modal Wrapper -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		on:click={handleBackdropClick}
	>
		<div
  class="relative w-full max-w-4xl h-[92vh] rounded-2xl bg-[#FDFCFB] shadow-xl overflow-hidden"
>

			
			<!-- Scroll Area -->
			<div class="h-full overflow-y-auto px-3 py-4">
				<!-- Inner Card -->
				<div class="bg-gray-50 rounded-xl p-3">
					<!-- Edit Header -->
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-2 text-sm font-medium">
							<button class="text-lg" on:click={closeModal}>»</button>
							Edit Product Details
						</div>

						<div class="flex items-center gap-2">
							<div class="flex gap-2 mr-20">
  {#if !isAnyAccordionOpen}
   <button


  class="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-gray-200"
  on:click={handleContinue}
>
  <span class="p-1">Publish</span>
  <img src="/arrow-up-right.svg" alt="arrow-up-right" />
</button>

<button
  class="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-gray-200"
  on:click={handleBackdropClick}
>
  <span class="p-1">Cancel</span>
  <img src="/arrow-up-right.svg" alt="arrow-up-right" />
</button>

  {/if}
</div>

  <button class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
    <img src="/Group 35151.svg" alt="up-icon"/>
  </button>
  <button class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
    <img src="/arrow.svg" alt="up-icon"/>
  </button>
</div>

					</div>

					<!-- Image -->
<div class="mb-6 flex justify-center">
  <div class="w-full max-w-xl rounded-xl p-3">
    <div class="relative overflow-hidden rounded-lg">
      <img
        src="/events.png"
        class="h-full w-full object-cover"
        alt="cover"
      />
      <button
        class="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow"
      >
        ▢
      </button>
    </div>
  </div>
</div>


					<div class="flex h-full w-full flex-col">

			
			<!-- Modal Body - Scrollable -->
			<div class="flex-1 overflow-y-auto px-6 md:px-10 py-6 custom-scrollbar">
				<div class="space-y-3">
					<!-- Booth Info Accordion -->
					<button
						on:click={() => toggleAccordion('Details')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Details</span>
						</div>
						{#if accordionStates.Details}
  <Minus class="h-4 w-4 text-[#5C5C5C]" />
{:else}
  <Plus class="h-4 w-4 text-[#5C5C5C]" />
{/if}

					</button>

					{#if accordionStates.Details}
<div class="rounded-lg border border-gray-200 bg-white p-6 space-y-6">

	<!-- Title -->
	<div class="space-y-1">
		<div class="flex items-center gap-1 text-sm text-black-500">
			<span>Title of Session / Talk</span>
			<span class="w-6 h-6 flex items-center justify-center text-xs"><img src="/info-itallic.svg" alt="info" /></span>
		</div>
		<h3 class="text-xl font-semibold text-gray-500">
			The Future of AI in Business
		</h3>
	</div>

	<hr />

	<!-- Original Event Name -->
	<div class="space-y-1">
		<label class="text-sm font-medium text-black-700">
			Original Event Name <span class="text-blue-600">*</span>
		</label>
		<input
			type="text"
			placeholder="Rondwell Tech Summit, May 2024"
			class="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
		/>
	</div>

	<!-- Original Event Date -->
	<div class="space-y-1">
		<label class="text-sm font-medium text-gray-700">
			Original Event Date <span class="text-blue-600">*</span>
		</label>
		<div
									class="relative w-full"
									use:clickOutside={() => (openStartDatePickerModal = false)}
								>
									<button
										on:click={async () => {
											openStartDatePickerModal = !openStartDatePickerModal;
											await tick();
											scrollToId('date');
										}}
										class="rounded-t-r w-full p-2 text-sm font-semibold"
										style="background-color: {selectedColor.smallCover}; border-top-left-radius: 9.75px;"
										><p class="mr-auto w-fit">{formatDate(startDate)}</p></button
									>
									<DatePickerModal open={openStartDatePickerModal} bind:selectedDate={startDate} />
								</div>
	</div>

	<!-- Description -->
	<div class="space-y-1">
		<label class="text-sm font-medium text-gray-700">
			Description of Talk <span class="text-blue-600">*</span>
			<span class="text-gray-400 font-normal">(Optional)</span>
		</label>

		<div class="relative">
			<textarea
				rows="4"
				maxlength="200"
				class="w-full rounded-lg border px-4 py-2 text-sm resize-none focus:border-blue-500 focus:outline-none"
				placeholder="Provide a detailed overview of your session, target audience, and key takeaways."
			></textarea>

			<!-- Counter inside textarea -->
			<span class="flex absolute bottom-2 gap-2  right-3 text-xs text-gray-400">
				0 / 200 <img src="/Resize.svg " alt="resize-icon"/>
			</span>
		</div>

		<p class="text-xs text-gray-400 flex items-center gap-1">
			<span class="w-3 h-3 rounded-full border text-[10px] flex items-center justify-center">i</span>
			You can describe your product briefly.
		</p>
	</div>

	<!-- Key Learning Outcomes -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<label class="text-sm font-medium text-gray-700">
				Key Learning Outcomes <span class="text-blue-600">*</span>
				<span class="text-gray-400 font-normal">(Optional)</span>
			</label>

			<button
				class="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
			>
				<span class="text-lg leading-none">+</span>
				Add Learning Outcome
			</button>
		</div>

		<!-- Table -->
<div class="overflow-hidden rounded-lg border">
  <table class="w-full table-fixed text-sm">
    
    <!-- HEADER -->
    <thead class="bg-gray-100 text-gray-600">
      <tr>
        <!-- Learning Outcome -->
        <th class="px-4 py-2 text-left">
          <div class="flex items-center gap-1">
            Learning Outcome
            <img src="/Sorting Icons [1.1].svg" alt="resize-icon" />
          </div>
        </th>

        <!-- Trash action -->
        <th class="px-4 py-2 text-right w-20">
          <div class="flex items-center justify-end gap-1 pr-2">
            Action
            <img src="/Sorting Icons [1.1].svg" alt="resize-icon" />
          </div>
        </th>

        <!-- More menu -->
        <th class="px-4 py-2 w-12"></th>
      </tr>
    </thead>

    <!-- BODY -->
    <tbody>
      {#each [1,2,3] as _}
      <tr class="border-t">
        <!-- Text -->
        <td class="px-4 py-3">
          Understand the basics of quantum computing
        </td>

        <!-- Trash -->
        <td class="px-4 py-3 text-right">
          <div class="flex justify-end pr-2 text-gray-500">
            <button>
              <img src="/trash.svg" alt="trash icon" />
            </button>
          </div>
        </td>

        <!-- More -->
        <td class="px-4 py-3 text-center">
          <button class="text-gray-500">⋮</button>
        </td>
      </tr>
      {/each}
    </tbody>

  </table>
</div>


	</div>

	<!-- Audience Engagement Style -->
	<div class="space-y-2">
		<label class="text-sm font-medium text-gray-700">
			Audience Engagement Style <span class="text-blue-600">*</span>
			<span class="text-gray-400 font-normal">(Optional)</span>
		</label>

		<div class="grid grid-cols-2 gap-3 text-sm text-gray-700">
			<label class="flex items-center gap-2"><input type="radio" /> Interactive</label>
			<label class="flex items-center gap-2"><input type="radio" /> Q&amp;A</label>
			<label class="flex items-center gap-2"><input type="radio" /> Workshop</label>
			<label class="flex items-center gap-2"><input type="radio" /> Panel Discussion</label>
			<label class="flex items-center gap-2"><input type="radio" /> Fireside Chat</label>
			<label class="flex items-center gap-2"><input type="radio" /> Keynote</label>
		</div>
	</div>

	<!-- Save Button -->
	<div>
		<button class="rounded-lg bg-black px-6 py-2 text-sm text-white hover:bg-gray-800">
			Save Changes
		</button>
	</div>

</div>
{/if}





					<!-- Media Gallery Accordion -->
					<button
						on:click={() => toggleAccordion('Media')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Media</span>
						</div>
						{#if accordionStates.Media}
  <Minus class="h-4 w-4 text-[#5C5C5C]" />
{:else}
  <Plus class="h-4 w-4 text-[#5C5C5C]" />
{/if}

					</button>

					{#if accordionStates.Media}
<div class="rounded-lg border border-gray-200 bg-white p-6 space-y-6">

	<!-- Upload Media -->
	<h3 class="text-sm font-semibold text-gray-900">Upload Media</h3>

	<!-- Upload Dropzone -->
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-10 text-center"
	>
		<div class="text-gray-400 text-2xl">☁️</div>

		<p class="text-sm text-gray-700">
			Choose a file or drag & drop it here.
		</p>

		<p class="text-xs text-gray-400">
			JPEG, PNG, PDF, and MP4 formats, up to 100 MB.
		</p>

		<button
			class="mt-2 rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
		>
			Browse File
		</button>
	</div>

	<!-- Uploading File -->
	<div class="rounded-lg border border-gray-200 p-4 space-y-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="rounded px-2 py-1 text-xs font-semibold text-red-600">
					<img src="/pdf-format.svg" alt="PDF Icon" />
				</span>

				<div>
					<p class="text-sm font-medium">Learning Outcome.pdf</p>
					<p class="text-xs text-gray-400">
						0 KB of 120 KB · Uploading...
					</p>
				</div>
			</div>

			<button class="text-gray-400 hover:text-gray-600">✕</button>
		</div>

		<!-- Progress Bar -->
		<div class="h-1 w-full rounded bg-gray-200">
			<div class="h-1 w-1/4 rounded bg-blue-600"></div>
		</div>
	</div>

	<!-- Completed File -->
	<div class="rounded-lg border border-gray-200 p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
					<img src="/pdf-format.svg" alt="PDF Icon" />
				</span>

				<div>
					<p class="text-sm font-medium">Keynote.pdf</p>
					<p class="text-xs text-gray-400 flex items-center gap-1">
						94 KB of 94 KB
						<span class="text-green-600">●</span>
						Completed
					</p>
				</div>
			</div>

			<button class="text-gray-400 hover:text-red-600"> <img src="/trash.svg" alt="trash icon" /></button>
		</div>
	</div>

	<!-- Speaker Reels / Demo Videos -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<label class="text-sm font-medium text-gray-700">
				Speaker Reels / Demo Videos <span class="text-blue-600">*</span>
			</label>

			<button
				class="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
			>
				<span class="text-lg leading-none">+</span>
				Add Video Link
			</button>
		</div>

		<!-- Video URL Inputs -->
		<div class="grid gap-3">
			<input
				type="url"
				placeholder="https://www.google.com/"
				class="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
			/>

			<input
				type="url"
				placeholder="https://www.google.com/search?q=https://"
				class="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
			/>
		</div>
	</div>

	<!-- Save Button -->
	<div>
		<button class="rounded-lg bg-black px-6 py-2 text-sm text-white hover:bg-gray-800">
			Save Changes
		</button>
	</div>

</div>
{/if}

					<!-- Downloadable Resources Accordion -->
					<button
						on:click={() => toggleAccordion('References & Testimonials')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">References & Testimonials</span>
						</div>
						{#if accordionStates['References & Testimonials']}
  <Minus class="h-4 w-4 text-[#5C5C5C]" />
{:else}
  <Plus class="h-4 w-4 text-[#5C5C5C]" />
{/if}

					</button>

					{#if accordionStates['References & Testimonials']}
<div class="rounded-lg border border-gray-200 bg-white p-6 space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold text-gray-900">
			References & Testimonials
			<span class="text-blue-600">*</span>
			<span class="font-normal text-gray-400">(Optional)</span>
		</h3>

		<button
			class="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
		>
			<span class="text-lg leading-none">+</span>
			Add Testimonial
		</button>
	</div>

	<!-- Form -->
	<div class="space-y-4 rounded-lg border border-gray-200 p-5">

		<!-- Event Name -->
		<div class="space-y-1">
			<label class="text-sm font-medium text-gray-700">
				Event Name <span class="text-blue-600">*</span>
			</label>

			<input
				type="text"
				placeholder="Enter testimonial quote..."
				class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
			/>
		</div>

		<!-- Organizer -->
		<div class="space-y-1">
			<label class="text-sm font-medium text-gray-700">
				Name of Organizer/Company <span class="text-blue-600">*</span>
			</label>

			<input
				type="text"
				placeholder="Enter testimonial quote..."
				class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
			/>
		</div>

		<!-- Testimonial -->
		<div class="space-y-1">
			<label class="text-sm font-medium text-gray-700">
				Enter testimonial quote
				<span class="text-blue-600">*</span>
				<span class="text-gray-400 font-normal">(Optional)</span>
			</label>

			<div class="relative">
				<textarea
					rows="4"
					maxlength="200"
					placeholder="Provide a detailed overview of your session, target audience, and key takeaways."
					class="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm resize focus:border-blue-500 focus:outline-none"
				></textarea>

				<!-- Counter -->
				<div
					class="pointer-events-none absolute bottom-2 right-3 text-xs text-gray-400"
				>
					0 / 200
				</div>
			</div>

			<p class="flex items-center gap-2 text-xs text-gray-400">
				<span class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]">
					i Edit Product Details
cover
				</span>
				You can describe your product briefly.
			</p>
		</div>
	</div>

	<!-- Table -->
	<div class="rounded-lg border border-gray-200 overflow-hidden">
		<table class="w-full text-sm">
			<thead class="bg-gray-100 text-gray-600">
				<tr>
					<th class="px-4 py-3 text-left">
						<div class="flex ">
						Testimonial <span> <img src="/Sorting Icons [1.1].svg" alt="resize-icon" /></span></div>
					</th>
					<th class="px-4 py-3 text-left">
						Event Name <span><img src="/Sorting Icons [1.1].svg" alt="resize-icon" /></span>
					</th>
					<th class="px-4 py-3 text-left">
						Organizers Name <span><img src="/Sorting Icons [1.1].svg" alt="resize-icon" /></span>
					</th>
					<th class="px-4 py-3 text-center">
						Action <span> <img src="/Sorting Icons [1.1].svg" alt="resize-icon" /></span>
					</th>
				</tr>
			</thead>

			<tbody class="divide-y">
				<tr>
					<td class="px-4 py-3 truncate max-w-[150px]">
						Understa...
					</td>
					<td class="px-4 py-3 truncate max-w-[180px]">
						Understand the basics...
					</td>
					<td class="px-4 py-3 truncate max-w-[180px]">
						Understand...
					</td>
					<td class="px-4 py-3 text-center">
						<button class="text-gray-400 hover:text-red-600"> <img src="/trash.svg" alt="trash icon" /></button>
					</td>
				</tr>

				<tr>
					<td class="px-4 py-3 truncate">Explain th...</td>
					<td class="px-4 py-3 truncate">Explain the role of entan...</td>
					<td class="px-4 py-3 truncate">Explain the r...</td>
					<td class="px-4 py-3 text-center">
						<button class="text-gray-400 hover:text-red-600"> <img src="/trash.svg" alt="trash icon" /></button>
					</td>
				</tr>

				<tr>
					<td class="px-4 py-3 truncate">Explain th...</td>
					<td class="px-4 py-3 truncate">Explain the role of entan...</td>
					<td class="px-4 py-3 truncate">Explain the r...</td>
					<td class="px-4 py-3 text-center">
						<button class="text-gray-400 hover:text-red-600"> <img src="/trash.svg" alt="trash icon" /></button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	<!-- Save -->
	<div>
		<button class="rounded-lg bg-black px-6 py-2 text-sm text-white hover:bg-gray-800">
			Save Changes
		</button>
	</div>

</div>
{/if}


					<!-- Live Interaction & Leads Accordion -->
					<button
						on:click={() => toggleAccordion('Available & Fees')}
						class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] md:px-6 px-3 py-4 transition-colors hover:bg-gray-200"
					>
						<div class="flex items-center gap-3">
							<img src="/question-line.svg" alt="question-line" class="w-5 h-5">
							<span class="font-medium text-[#171717] text-[14px]">Available & Fees</span>
						</div>
						{#if accordionStates['Available & Fees']}
  <Minus class="h-4 w-4 text-[#5C5C5C]" />
{:else}
  <Plus class="h-4 w-4 text-[#5C5C5C]" />
{/if}

					</button>

					{#if accordionStates['Available & Fees']}
<div class="rounded-lg border border-gray-200 bg-white p-6 space-y-6">

	<!-- General Availability -->
	<div class="space-y-2">
		<label class="text-sm font-medium text-gray-700 flex items-center gap-1">
			General Availability
			<span class="text-blue-600">*</span>
			<span class="text-gray-400 font-normal">(Optional)</span>
		</label>

		<div class="relative">
			<textarea
				rows="4"
				maxlength="200"
				placeholder="General available for engagements on Tuesdays and Thursdays. Can travel."
				class="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm resize focus:border-blue-500 focus:outline-none"
			></textarea>

			<!-- Counter -->
			<div class="pointer-events-none absolute bottom-2 right-3 text-xs text-gray-400">
				0 / 200
			</div>
		</div>

		<p class="flex items-center gap-2 text-xs text-gray-400">
			<span
				class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]"
			>
				i
			</span>
			You can describe your company briefly.
		</p>
	</div>

	<!-- Speaking Fees -->
	<div class="space-y-4">
		<label class="text-sm font-medium text-gray-700 flex items-center gap-1">
			Speaking Fees
			<span class="text-blue-600">*</span>
			<span class="text-gray-400 font-normal">(Optional)</span>
		</label>

		<!-- Radio Options -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
			<label class="flex items-center gap-2">
				<input type="radio" name="feeType" class="accent-black" />
				Fixed Fee per Engagement
			</label>

			<label class="flex items-center gap-2">
				<input type="radio" name="feeType" class="accent-black" />
				Pro Bono / Negotiable
			</label>

			<label class="flex items-center gap-2">
				<input type="radio" name="feeType" class="accent-black" />
				Variable / Custom Quote
			</label>

			<label class="flex items-center gap-2">
				<input type="radio" name="feeType" class="accent-black" />
				Not Applicable / Private
			</label>
		</div>
	</div>

	<!-- Custom Quote & Currency -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Custom Quote -->
		<div class="space-y-1">
			<label class="text-sm font-medium text-gray-700 flex items-center gap-2">
				Custom Quote
				<span
					class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] text-gray-400"
				>
					i
				</span>
			</label>

			<input
				type="text"
				value="$1000"
				class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
			/>
		</div>

		<!-- Preferred Currency -->
		<div class="space-y-1">
			<label class="text-sm font-medium text-gray-700">
				Preferred Currency
			</label>

			<select
				class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option selected>US Dollar ($)</option>
				<option>Euro (€)</option>
				<option>British Pound (£)</option>
				<option>Nigerian Naira (₦)</option>
				<option>Canadian Dollar (CAD)</option>
				<option>Australian Dollar (AUD)</option>
				<option>Japanese Yen (¥)</option>
				<option>Swiss Franc (CHF)</option>
				<option>Chinese Yuan (¥)</option>
			</select>
		</div>
		<!-- General Availability -->
	<div class="space-y-2">
		<label class="text-sm font-medium text-gray-700 flex items-center gap-1">
			Provide any additional content regarding your fees
			<span class="text-blue-600">*</span>
			<span class="text-gray-400 font-normal">(Optional)</span>
		</label>

		<div class="relative">
			<textarea
				rows="4"
				maxlength="200"
				placeholder="General available for engagements on Tuesdays and Thursdays. Can travel."
				class="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm resize focus:border-blue-500 focus:outline-none"
			></textarea>

			<!-- Counter -->
			<div class="pointer-events-none absolute bottom-2 right-3 text-xs text-gray-400">
				0 / 200
			</div>
		</div>

		<p class="flex items-center gap-2 text-xs text-gray-400">
			<span
				class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]"
			>
				i
			</span>
			You can describe your company briefly.
		</p>
	</div>
	</div>

	<!-- Save -->
	<div>
		<button
			class="rounded-lg bg-black px-6 py-2 text-sm text-white hover:bg-gray-800"
		>
			Save Changes
		</button>
	</div>

</div>
{/if}


					
				</div>
			</div>
		</div>

					<div class="h-24" />
				</div>
			</div>
		</div>
	</div>
{/if}
