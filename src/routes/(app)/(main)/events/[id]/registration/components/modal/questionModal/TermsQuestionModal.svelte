<!-- src/lib/components/TermsQuestionModal.svelte -->
<script lang="ts">
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let questionData = {
		contentType: 'text',
		termsContent: '',
		termsLink: '',
		collectSignature: false,
		helpText: 'Guests will type their signature to agree'
	};

	function closeModal() {
		open = false;
		dispatch('close');
	}

	function addQuestion() {
		dispatch('add', questionData);
		closeModal();
	}

	function updateContentType(type: string) {
		questionData.contentType = type;
	}

	function updateTermsContent(e: any) {
		questionData.termsContent = e.target.value;
	}

	function updateTermsLink(e: any) {
		questionData.termsLink = e.target.value;
	}

	function toggleSignature() {
		questionData.collectSignature = !questionData.collectSignature;
	}

	let showDropdown = false;

	function handleReturn (){
		open = false;
		dispatch('return')
	}
</script>

{#if open}
	<div class="fixed inset-0 px-2 z-50 flex items-center justify-center">
		<div
			class="custom-scrollbar h-full max-h-127 w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-xl"
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
						<img src="/terms-icon.svg" alt="arrow back" />
					</div>
					<div>
						<h3 class="font-medium">Terms</h3>
						<p class="text-sm text-gray-600">Collect consent to terms and conditions</p>
					</div>
				</div>

				<div>
					<label for="" class="mb-2 block text-sm font-medium text-gray-700">Content Type</label>
					<div class="flex h-[50px] w-full items-center rounded bg-[#F0F0F0] p-1 text-[#98A1A4]">
						<button
							class={`flex h-full w-full cursor-pointer items-center justify-center gap-1 rounded px-3 py-1 text-sm ${
								questionData.contentType === 'text' ? 'bg-white text-black shadow-md' : ''
							}`}
							on:click={() => updateContentType('text')}
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

							Text
						</button>
						<button
							class={`flex h-full w-full cursor-pointer items-center justify-center gap-1 rounded px-3 py-1 text-sm ${
								questionData.contentType === 'link' ? 'bg-white text-black shadow-md' : ''
							}`}
							on:click={() => updateContentType('link')}
						>
							<img src="/link-2.svg" alt="link icon" />
							Link
						</button>
					</div>
				</div>

				{#if questionData.contentType === 'text'}
					<div class="relative">
						<label for="" class="mb-1 block text-sm font-medium text-[#696B6D]">Terms Content</label
						>

						<div
							class=""
							use:clickOutside={() => {
								showDropdown = false;
							}}
						>
							<!-- + button -->
							<button
								class="absolute top-10 -left-3 mr-2 rounded-sm bg-[#939597] p-1 text-lg font-bold text-white"
								on:click={() => (showDropdown = !showDropdown)}
							>
								<Icon icon="mdi:plus" class="text-xl" />
							</button>

							<!-- Dropdown -->
							<TextEditor open={showDropdown} className="-top-10 left-5" />
						</div>

						<!-- textarea -->
						<textarea
							rows="4"
							placeholder=""
							class="w-full resize-none rounded-sm border border-gray-300 p-2 text-sm outline-none focus:ring-0"
						></textarea>
					</div>
				{:else}
					<div>
						<label for="" class="mb-1 block text-sm font-medium text-[#696B6D]">Terms Link</label>
						<input
							type="url"
							bind:value={questionData.termsLink}
							on:input={updateTermsLink}
							placeholder=""
							class="w-full rounded-sm border border-gray-300 p-3 focus:ring-0 focus:outline-none"
						/>
					</div>
				{/if}

				<div class="">
					<div class="flex items-center justify-between space-x-2">
						<span class="text-sm font-medium text-gray-700">Collect Signature</span>
						<button
							aria-label="toggle"
							class="relative h-6 w-10 rounded-full transition-colors duration-300"
							class:bg-gray-300={!questionData.collectSignature}
							class:bg-gray-800={questionData.collectSignature}
							on:click={toggleSignature}
						>
							<span
								class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
								class:translate-x-4={questionData.collectSignature}
							></span>
						</button>
					</div>
					<div class="text-sm text-gray-600">{questionData.helpText}</div>
				</div>

				<button
					on:click={addQuestion}
					class="w-full rounded-md bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-gray-800"
				>
					Add Question
				</button>
			</div>
		</div>
	</div>
{/if}
