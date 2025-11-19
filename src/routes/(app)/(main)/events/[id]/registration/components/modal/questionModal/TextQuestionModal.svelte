<!-- src/lib/components/TextQuestionModal.svelte -->
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
		responseLength: 'short' | 'multi-line';
		isRequired: boolean;
		helpText: string;
		ticketIds: string[];
		ticketOptions: string[];
	};

	export let open = false;
	export let isEditing = false;
	let questionData: QuestionData = {
		id: null,
		type: 'text',
		question: '',
		responseLength: 'short',
		isRequired: false,
		helpText: 'Ask for a free-form response',
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

	function updateResponseLength(length: any) {
		questionData.responseLength = length;
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

		function handleReturn (){
		open = false;
		dispatch('return')
	}

</script>

{#if open}
	<div class="fixed inset-0 px-2 z-50 flex items-center justify-center">
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
						<img src="/text-icon.svg" alt="arrow back" />
					</div>
					<div>
						<h3 class="font-medium">Text</h3>
						<p class="text-sm text-gray-600">Ask for a free-form response</p>
					</div>
				</div>

				<div>
					<label for="" class="mb-1 block text-sm font-medium text-[#696B6D]">Question</label>
					<input
						type="text"
						bind:value={questionData.question}
						on:input={updateQuestion}
						placeholder="What is your favorite book?"
						class="w-full rounded-sm border border-gray-300 px-3 py-2 focus:ring-0"
					/>
				</div>

				<div>
					<label for="" class="mb-2 block text-sm font-medium text-gray-700">Response Length</label>
					<div class="flex h-[50px] w-full items-center rounded bg-[#F0F0F0] p-1 text-[#98A1A4]">
						<button
							class={`flex h-full w-full cursor-pointer items-center justify-center gap-1 rounded px-3 py-1 text-sm ${
								questionData.responseLength === 'short' ? 'bg-white text-black shadow-md' : ''
							}`}
							on:click={() => updateResponseLength('short')}
						>
							<img src="/text-icon.svg" alt="arrow back" />

							Short
						</button>
						<button
							class={`flex h-full w-full cursor-pointer items-center justify-center gap-1 rounded px-3 py-1 text-sm ${
								questionData.responseLength === 'multi-line' ? 'bg-white text-black shadow-md' : ''
							}`}
							on:click={() => updateResponseLength('multi-line')}
						>
							<svg
								width="15"
								height="14"
								viewBox="0 0 15 14"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect width="15.0004" height="2.25006" rx="1.12503" fill="currentColor" />
								<rect y="5.25" width="10.5003" height="2.25006" rx="1.12503" fill="currentColor" />
								<rect y="11.25" width="6.00015" height="2.25006" rx="1.12503" fill="currentColor" />
							</svg>
							Multi-Line
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
