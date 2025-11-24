<!-- src/lib/components/OptionsQuestionModal.svelte -->
<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';

	const dispatch = createEventDispatcher();

	type QuestionData = {
		id: number | null;
		type: string;
		question: string;
		options: string[];
		selectionType: 'single' | 'multiple';
		isRequired: boolean;
		helpText: string;
		ticketIds: string[];
		ticketOptions: string[];
	};

	export let open = false;
	export let isEditing = false;
	let questionData: QuestionData = {
		id: null,
		type: 'options',
		question: '',
		options: [],
		selectionType: 'single', // 'single' or 'multiple'
		isRequired: false,
		helpText: 'Press Enter or Tab key to add a new option.',
		ticketIds: [],
		ticketOptions: ['Early Bird Ticket', 'Investors Only', 'Standard In...', 'Accelerate...']
	};

	// For edit mode, we need to track original data for comparison
	let originalData = {};

	function closeModal() {
		open = false;
		dispatch('close');
	}

	function toggleRequired() {
		questionData.isRequired = !questionData.isRequired;
	}

	function updateQuestion(e: any) {
		questionData.question = e.target.value;
	}

	function updateSelectionType(type: any) {
		questionData.selectionType = type;
	}

	let newOption = '';

	function addOption(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Tab') {
			e.preventDefault();

			if (newOption.trim().length > 0) {
				questionData.options = [...questionData.options, newOption.trim()];
				newOption = '';
			}
		}
	}

	function removeOption(index: number) {
		questionData.options = questionData.options.filter((_, i) => i !== index);
	}

	function saveQuestion() {
		if (isEditing) {
			dispatch('save', questionData);
		} else {
			dispatch('add', questionData);
		}
		closeModal();
	}

	function deleteQuestion() {
		dispatch('delete', questionData.id);
		closeModal();
	}

	let buttonOpen = false;

	function toggleTicket(opt: any) {
		if (questionData.ticketIds.includes(opt)) {
			questionData.ticketIds = questionData.ticketIds.filter((t) => t !== opt);
		} else {
			questionData.ticketIds = [...questionData.ticketIds, opt];
		}
	}

	function handleReturn() {
		open = false;
		dispatch('return');
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex px-3 items-center justify-center bg-black/50 backdrop-blur-sm">
		<div
			class="custom-scrollbar h-full max-h-120 w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-xl"
		>
			<!-- Header -->
			<div class="mb-2 flex items-start justify-between">
				<button
					on:click={handleReturn}
					class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
				>
					<img src="/arrow-right.svg" alt="arrow back" />
				</button>

				<h2 class="text-xl font-bold">Add Question</h2>

				<button
					on:click={() => (open = false)}
					class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
				>
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<!-- Content -->
			<div class="space-y-6">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-[29px] w-[29px] items-center justify-center rounded-sm bg-[#F0F0F0] text-[#616265]"
					>
						<img src="/option-icon.svg" alt="arrow back" />
					</div>
					<div>
						<h3 class="font-medium">Options</h3>
						<p class="text-sm text-gray-600">Let the guest choose from a list of options</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="question" class="mb-1 block text-sm font-medium text-[#696B6D]"
							>Question</label
						>
						<input
							type="text"
							bind:value={questionData.question}
							on:input={updateQuestion}
							placeholder="What is your favorite color?"
							class="w-full rounded-sm border border-gray-300 px-3 py-2 focus:ring-0 focus:outline-none"
						/>
					</div>

					<div>
						<label for="option" class="mb-1 block text-sm font-medium text-[#696B6D]">Options</label
						>
						<div
							class="flex flex-wrap items-center gap-1 rounded-sm border border-gray-300 px-3 py-1 focus-within:ring-0"
						>
							<!-- Existing Options -->
							{#each questionData.options as option, index}
								<div class="flex items-center gap-1 rounded-sm bg-[#ECEDED] px-2 py-1 text-sm">
									<span>{option}</span>
									<button
										on:click={() => removeOption(index)}
										class="text-gray-500 hover:text-red-600"
										aria-label="Remove option"
									>
										×
									</button>
								</div>
							{/each}

							<!-- Input Field for New Option -->
							<input
								type="text"
								bind:value={newOption}
								on:keydown={addOption}
								placeholder=""
								class="min-w-[80px] flex-1 border-none p-1 text-sm focus:outline-none"
							/>
						</div>
						<p class="mt-2 text-xs text-gray-500">{questionData.helpText}</p>
					</div>
				</div>

				<div>
					<label for="type" class="mb-2 block text-sm font-medium text-gray-700"
						>Selection Type</label
					>
					<div class="flex h-[50px] w-full items-center rounded bg-[#F0F0F0] p-1 text-[#98A1A4]">
						<button
							class={`flex h-full w-full cursor-pointer items-center justify-center gap-1 rounded px-3 py-1 text-sm ${
								questionData.selectionType === 'single' ? 'bg-white text-black shadow-md' : ''
							}`}
							on:click={() => updateSelectionType('single')}
						>
							<svg
								width="18"
								height="15"
								viewBox="0 0 18 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect x="1.5" y="12.75" width="13.5003" height="1.50004" fill="currentColor" />
								<rect x="7.5" y="2.25" width="9.75024" height="1.50004" fill="currentColor" />
								<rect x="1.5" y="7.5" width="13.5003" height="1.50004" fill="currentColor" />
								<path d="M6 3.00008L1.49989 5.59822V0.401934L6 3.00008Z" fill="currentColor" />
							</svg>

							Single
						</button>
						<button
							class={`flex h-full w-full cursor-pointer items-center justify-center gap-1 rounded px-3 py-1 text-sm ${
								questionData.selectionType === 'multiple' ? 'bg-white text-black shadow-md' : ''
							}`}
							on:click={() => updateSelectionType('multiple')}
						>
							<svg
								width="17"
								height="15"
								viewBox="0 0 17 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<ellipse cx="1.50004" cy="1.12503" rx="1.50004" ry="1.12503" fill="currentColor" />
								<ellipse cx="1.50004" cy="6.37503" rx="1.50004" ry="1.12503" fill="currentColor" />
								<ellipse cx="1.50004" cy="13.125" rx="1.50004" ry="1.12503" fill="currentColor" />
								<rect x="5.25" width="11.2503" height="2.25006" rx="1.12503" fill="currentColor" />
								<rect
									x="5.25"
									y="6"
									width="11.2503"
									height="2.25006"
									rx="1.12503"
									fill="currentColor"
								/>
								<rect
									x="5.25"
									y="12"
									width="11.2503"
									height="2.25006"
									rx="1.12503"
									fill="currentColor"
								/>
							</svg>

							Multiple
						</button>
					</div>
				</div>

				<div class="inline-flex cursor-pointer items-center">
					<button
						aria-label="toggle"
						class="relative h-6 w-10 rounded-full transition-colors duration-300"
						class:bg-gray-300={!questionData.isRequired}
						class:bg-gray-800={questionData.isRequired}
						on:click={toggleRequired}
					>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
							class:translate-x-4={questionData.isRequired}
						></span>
					</button>
					<span class="ml-3 text-sm font-medium text-gray-700">Required</span>
				</div>

				<div use:clickOutside={() => (buttonOpen = false)} class="relative w-full">
					<button
						class="mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#ECEDED] bg-[#FDFDFD] p-3 text-sm font-medium text-[#B3B5B7]"
						on:click={() => (buttonOpen = !buttonOpen)}
					>
						<span class="flex items-center gap-1">
							Choose Ticket
							<img src="/information.svg" alt="" />
						</span>
						<img src="/arrow-left.svg" alt="" class="rotate-90 transform" />
					</button>

					{#if buttonOpen}
						<div
							class="absolute left-0 z-10 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
						>
							<div class="flex flex-col gap-2">
								{#each questionData.ticketOptions as option, i}
									<button
										on:click={() => toggleTicket(option)}
										class="flex w-full items-center justify-between rounded-sm p-2
										{questionData.ticketIds.includes(option) ? 'bg-[#F0F0F0]' : ''}"
									>
										<div
											class="max-w-60 flex-1 truncate rounded-2xl px-2 py-1 text-xs font-medium"
											class:bg-[#F4E1D5]={i === 0}
											class:text-[#D79813]={i === 0}
											class:bg-[#E3F4E1]={i === 1}
											class:text-[#3CBD2C]={i === 1}
											class:bg-[#E9DAE4]={i === 2}
											class:text-[#94748D]={i === 2}
											class:bg-[#E2E8FC]={i === 3}
											class:text-[#146AEB]={i === 3}
										>
											{option}
										</div>

										{#if questionData.ticketIds.includes(option)}
											<Icon icon="mdi:check" class="inline h-4 w-4 text-black" />
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center justify-between">
					{#if isEditing}
						<div class="flex items-center space-x-2">
							<button
								on:click={deleteQuestion}
								class="flex items-center space-x-1 rounded-md bg-gray-200 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-300"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A1 1 0 0117.133 21H6.867A1 1 0 016 19.95L5.133 7.808A1 1 0 016 7h12a1 1 0 011 1z"
									/>
								</svg>
								<span>Delete</span>
							</button>
						</div>
					{/if}

					<div class="flex-1"></div>

					<button
						on:click={saveQuestion}
						class="w-full rounded-md bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-gray-800"
					>
						Add Question
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
