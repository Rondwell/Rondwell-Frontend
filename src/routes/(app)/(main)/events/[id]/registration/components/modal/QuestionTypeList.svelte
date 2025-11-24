<!-- src/lib/components/QuestionTypeList.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CompanyQuestionModal from './questionModal/CompanyQuestionModal.svelte';
	import TermsQuestionModal from './questionModal/TermsQuestionModal.svelte';
	import CheckboxQuestionModal from './questionModal/CheckboxQuestionModal.svelte';
	import SocialProfileQuestionModal from './questionModal/SocialProfileQuestionModal.svelte';
	import WebsiteQuestionModal from './questionModal/WebsiteQuestionModal.svelte';
	import OptionsQuestionModal from './questionModal/OptionsQuestionModal.svelte';
	import TextQuestionModal from './questionModal/TextQuestionModal.svelte';
	import Icon from '@iconify/svelte';

	const dispatch = createEventDispatcher();

	// Define question types with icons and descriptions
	const questionTypes = [
		{
			id: 'text',
			name: 'Text',
			icon: '/text-icon.svg',
			description: 'Ask guests custom questions when they register'
		},
		{
			id: 'social',
			name: 'Social Profile',
			icon: '/user-octagon.svg',
			description: 'Collect social media profiles'
		},
		{
			id: 'checkbox',
			name: 'Checkbox',
			icon: '/checkbox-icon.svg',
			description: 'Allow guests to select options'
		},
		{ id: 'website', name: 'Website', icon: '/link-2.svg', description: 'Collect website URLs' },
		{
			id: 'options',
			name: 'Options',
			icon: '/option-icon.svg',
			description: 'Multiple choice questions'
		},
		{
			id: 'company',
			name: 'Company',
			icon: '/buildings-2.svg',
			description: 'Ask for the company the guest works for'
		},
		{
			id: 'terms',
			name: 'Terms',
			icon: '/terms-icon.svg',
			description: 'Collect consent to terms and conditions'
		},
		{ id: 'upload', name: 'Upload', icon: '/link-2.svg', description: 'Allow file uploads' }
	];

	export let open = false;

	let showCompanyModal = false;
	let showTermsModal = false;
	let showTermsEditor = false;
	let showCheckboxModal = false;
	let showSocialModal = false;
	let showWebsiteModal = false;
	let showOptionsModal = false;
	let showTextModal = false;
	let isEditingMode = false;

	function handleSelectQuestionType(typeId: string) {
		open = false;

		if (typeId === 'company') {
			showCompanyModal = true;
		} else if (typeId === 'terms') {
			showTermsModal = true;
		} else if (typeId === 'checkbox') {
			showCheckboxModal = true;
		} else if (typeId === 'social') {
			showSocialModal = true;
		} else if (typeId === 'website') {
			showWebsiteModal = true;
		} else if (typeId === 'options') {
			showOptionsModal = true;
		} else if (typeId === 'text') {
			showTextModal = true;
		} else {
			dispatch('select', typeId);
		}
	}

	function handleReturnToQuestionTypeList() {
		showCompanyModal = false;
		showTermsModal = false;
		showCheckboxModal = false;
		showSocialModal = false;
		showWebsiteModal = false;
		showOptionsModal = false;
		showTextModal = false;
		open = true;
	}

	function handleAddQuestion(question: string) {
		console.log('Added question:', question);
		// Handle adding the question to your form/data structure
	}

	function handleOpenTermsEditor() {
		showTermsModal = false;
		showTermsEditor = true;
	}

	function handleAddTermsContent(content: string) {
		console.log('Added terms content:', content);
		showTermsEditor = false;
		showTermsModal = true;
	}

	let currentQuestion = {
		id: null,
		type: 'checkbox',
		question: 'Do you have experience in Python?',
		isRequired: false,
		helpText: 'When set to Required, guests must check the box to proceed.',
		ticketId: null
	};

	function openAddQuestionModal() {
		isEditingMode = false;
		showCheckboxModal = true;
	}

	function openEditQuestionModal(question: any) {
		isEditingMode = true;
		currentQuestion = { ...question };
		showCheckboxModal = true;
	}

	function handleSaveQuestion(question: string) {
		console.log('Saved checkbox question:', question);
		// Update your questions array or send to API
	}

	function handleDeleteQuestion(questionId: string) {
		console.log('Deleted question with ID:', questionId);
		// Remove from your questions array or send delete request to API
	}

	let currentSocialQuestion = {
		id: null,
		type: 'social',
		platform: 'instagram',
		question: 'What is your Instagram username?',
		isRequired: false,
		helpText: "We'll automatically get this information from their profile if available",
		ticketId: null
	};

	let currentWebsiteQuestion = {
		id: null,
		type: 'website',
		question: 'Website',
		isRequired: false,
		helpText: "We'll automatically get this information from their profile if available",
		ticketId: null
	};

	function openAddSocialQuestionModal() {
		isEditingMode = false;
		showSocialModal = true;
	}

	function openEditSocialQuestionModal(question: any) {
		isEditingMode = true;
		currentSocialQuestion = { ...question };
		showSocialModal = true;
	}

	function openAddWebsiteQuestionModal() {
		isEditingMode = false;
		showWebsiteModal = true;
	}

	function openEditWebsiteQuestionModal(question: any) {
		isEditingMode = true;
		currentWebsiteQuestion = { ...question };
		showWebsiteModal = true;
	}

	function handleAddSocialQuestion(question: string) {
		console.log('Added social profile question:', question);
		// Add to your questions array or send to API
	}

	function handleSaveSocialQuestion(question: string) {
		console.log('Saved social profile question:', question);
		// Update your questions array or send to API
	}

	function handleDeleteSocialQuestion(questionId: string) {
		console.log('Deleted social profile question with ID:', questionId);
		// Remove from your questions array or send delete request to API
	}

	function handleAddWebsiteQuestion(question: string) {
		console.log('Added website question:', question);
		// Add to your questions array or send to API
	}

	function handleSaveWebsiteQuestion(question: string) {
		console.log('Saved website question:', question);
		// Update your questions array or send to API
	}

	function handleDeleteWebsiteQuestion(questionId: string) {
		console.log('Deleted website question with ID:', questionId);
		// Remove from your questions array or send delete request to API
	}

	function closeModal() {
		open = false;
		dispatch('close');
	}

	let currentOptionsQuestion = {
		id: null,
		type: 'options',
		question: '',
		options: [],
		selectionType: 'single',
		isRequired: false,
		helpText: 'Press Enter or Tab key to add a new option.',
		ticketId: null
	};

	let currentTextQuestion = {
		id: null,
		type: 'text',
		question: '',
		responseLength: 'short',
		isRequired: false,
		helpText: 'Ask for a free-form response',
		ticketId: null
	};

	function openAddOptionsQuestionModal() {
		isEditingMode = false;
		showOptionsModal = true;
	}

	function openEditOptionsQuestionModal(question: any) {
		isEditingMode = true;
		currentOptionsQuestion = { ...question };
		showOptionsModal = true;
	}

	function openAddTextQuestionModal() {
		isEditingMode = false;
		showTextModal = true;
	}

	function openEditTextQuestionModal(question: any) {
		isEditingMode = true;
		currentTextQuestion = { ...question };
		showTextModal = true;
	}

	function handleAddOptionsQuestion(question: string) {
		console.log('Added options question:', question);
		// Add to your questions array or send to API
	}

	function handleSaveOptionsQuestion(question: string) {
		console.log('Saved options question:', question);
		// Update your questions array or send to API
	}

	function handleDeleteOptionsQuestion(questionId: string) {
		console.log('Deleted options question with ID:', questionId);
		// Remove from your questions array or send delete request to API
	}

	function handleAddTextQuestion(question: string) {
		console.log('Added text question:', question);
		// Add to your questions array or send to API
	}

	function handleSaveTextQuestion(question: string) {
		console.log('Saved text question:', question);
		// Update your questions array or send to API
	}

	function handleDeleteTextQuestion(questionId: string) {
		console.log('Deleted text question with ID:', questionId);
		// Remove from your questions array or send delete request to API
	}
</script>

<section class="">
	{#if open}
		<div class="fixed inset-0 z-50 px-3 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div
				class="custom-scrollbar max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-xl"
			>
				<!-- Header -->
				<div class="mb-3 flex items-start justify-between">
					<div class="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]">
						<div class="flex h-9 w-9 items-center justify-center">
							<svg
								width="37"
								height="35"
								viewBox="0 0 37 35"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect x="3.41797" width="22.7783" height="2.27783" rx="1.13892" fill="#737577" />
								<rect
									x="23.918"
									y="4.55469"
									width="4.55567"
									height="2.27783"
									rx="1.13892"
									transform="rotate(-90 23.918 4.55469)"
									fill="#737577"
								/>
								<rect
									x="3.41797"
									y="4.55469"
									width="4.55567"
									height="2.27783"
									rx="1.13892"
									transform="rotate(-90 3.41797 4.55469)"
									fill="#737577"
								/>
								<rect y="6" width="30.7508" height="7.50019" rx="3.75009" fill="#DBDCDC" />
								<rect
									x="1.12503"
									y="6.82034"
									width="28.5007"
									height="20.5283"
									rx="2.62507"
									stroke="#737577"
									stroke-width="2.25006"
								/>
								<path
									d="M12.5617 20.1152C12.3491 19.9098 12.1565 19.6318 11.9838 19.2812C11.8177 18.9306 11.7247 18.5349 11.7048 18.0941C11.6915 17.7535 11.8111 17.4529 12.0635 17.1924C12.3226 16.932 12.6481 16.6941 13.04 16.4787C13.4386 16.2633 13.8405 16.0554 14.2457 15.8551C14.6509 15.6497 14.9996 15.4368 15.2919 15.2164C15.5909 14.991 15.7669 14.7355 15.82 14.45C16.0857 13.5685 15.8699 12.8897 15.1724 12.4139C14.4749 11.933 13.4319 11.6926 12.0436 11.6926C11.5454 11.6926 11.1534 11.7101 10.8678 11.7452C10.5821 11.7802 10.3762 11.8103 10.25 11.8353V10.5731C10.3364 10.528 10.4858 10.4804 10.6984 10.4303C10.9176 10.3802 11.18 10.3377 11.4856 10.3026C11.7911 10.2675 12.1133 10.25 12.4521 10.25C13.608 10.25 14.5778 10.3652 15.3617 10.5956C16.1455 10.826 16.76 11.1391 17.2051 11.5348C17.6568 11.9255 17.9557 12.3663 18.1019 12.8572C18.248 13.3481 18.2613 13.8515 18.1417 14.3674C18.0753 14.7431 17.9291 15.0711 17.7033 15.3516C17.4774 15.6322 17.2084 15.8776 16.8962 16.088C16.584 16.2933 16.2585 16.4837 15.9197 16.659C15.5875 16.8293 15.272 16.9971 14.9731 17.1624C14.6741 17.3227 14.425 17.4955 14.2257 17.6808C14.0331 17.8611 13.9235 18.069 13.8969 18.3044C13.8504 18.63 13.8737 18.9231 13.9667 19.1835C14.0597 19.444 14.1726 19.7545 14.3055 20.1152H12.5617ZM13.6976 23.917C13.3323 23.917 13.0035 23.8093 12.7112 23.5939C12.4255 23.3785 12.2761 23.1081 12.2628 22.7825C12.2561 22.5571 12.3292 22.3492 12.482 22.1589C12.6348 21.9685 12.8341 21.8157 13.0799 21.7005C13.3256 21.5803 13.5847 21.5202 13.8571 21.5202C14.3221 21.5202 14.6775 21.6304 14.9232 21.8508C15.1757 22.0712 15.3052 22.3292 15.3119 22.6247C15.3251 22.8651 15.2554 23.083 15.1026 23.2784C14.9498 23.4737 14.7472 23.629 14.4948 23.7442C14.249 23.8594 13.9833 23.917 13.6976 23.917Z"
									fill="#737577"
								/>
								<rect
									x="17.25"
									y="15"
									width="19.5005"
									height="19.5005"
									rx="9.75024"
									fill="#EFEFF0"
								/>
								<g opacity="0.4">
									<path
										d="M21.3398 24.9609H33.0773"
										stroke="#616265"
										stroke-width="2.25006"
										stroke-linecap="round"
									/>
									<path
										d="M27.207 30.8312V19.0938"
										stroke="#616265"
										stroke-width="2.25006"
										stroke-linecap="round"
									/>
								</g>
								<g opacity="0.4">
									<path
										d="M21.3398 24.9609H33.0773"
										stroke="#616265"
										stroke-width="2.25006"
										stroke-linecap="round"
									/>
									<path
										d="M27.207 30.8312V19.0938"
										stroke="#616265"
										stroke-width="2.25006"
										stroke-linecap="round"
									/>
								</g>
								<g opacity="0.4">
									<path
										d="M27.2148 19.0938V30.8312"
										stroke="#616265"
										stroke-width="2.25006"
										stroke-linecap="round"
									/>
									<path
										d="M21.3446 24.9609H33.082"
										stroke="#616265"
										stroke-width="2.25006"
										stroke-linecap="round"
									/>
								</g>
								<g opacity="0.4">
									<path
										d="M27.2148 19.0938V30.8312"
										stroke="#616265"
										stroke-width="2.25006"
										stroke-linecap="round"
									/>
									<path
										d="M21.3446 24.9609H33.082"
										stroke="#616265"
										stroke-width="2.25006"
										stroke-linecap="round"
									/>
								</g>
							</svg>
						</div>
					</div>
					<button
						on:click={() => (open = false)}
						class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
					>
						<Icon icon="mdi:close" class="text-xl" />
					</button>
				</div>

				<h3 class="mb-1 text-xl font-medium text-gray-700">Add Questions</h3>
				<p class="mb-4 text-sm text-gray-500">Ask guests custom questions when they register</p>

				<!-- Question Types List -->
				<div class="grid gap-2 md:grid-cols-2">
					{#each questionTypes as type}
						<button
							on:click={() => handleSelectQuestionType(type.id)}
							class="flex w-full items-center space-x-3 rounded-md bg-[#F0F0F0] p-3 text-[#696B6D] transition-colors"
						>
							<img src={type.icon} alt="" />
							<span class="font-medium">{type.name}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<CompanyQuestionModal
		bind:open={showCompanyModal}
		on:add={() => handleAddQuestion}
		on:close={() => (showCompanyModal = false)}
		on:return={() => handleReturnToQuestionTypeList()}
	/>

	<TermsQuestionModal
		bind:open={showTermsModal}
		on:add={() => handleAddQuestion}
		on:close={() => (showTermsModal = false)}
		on:openEditor={handleOpenTermsEditor}
		on:return={() => handleReturnToQuestionTypeList()}
	/>

	<CheckboxQuestionModal
		bind:open={showCheckboxModal}
		isEditing={isEditingMode}
		on:add={() => handleAddQuestion}
		on:save={() => handleSaveQuestion}
		on:delete={() => handleDeleteQuestion}
		on:close={() => (showCheckboxModal = false)}
		on:return={() => handleReturnToQuestionTypeList()}
	/>

	<SocialProfileQuestionModal
		bind:open={showSocialModal}
		isEditing={isEditingMode}
		on:add={() => handleAddSocialQuestion}
		on:save={() => handleSaveSocialQuestion}
		on:delete={() => handleDeleteSocialQuestion}
		on:close={() => (showSocialModal = false)}
		on:return={() => handleReturnToQuestionTypeList()}
	/>

	<WebsiteQuestionModal
		bind:open={showWebsiteModal}
		isEditing={isEditingMode}
		on:add={() => handleAddWebsiteQuestion}
		on:save={() => handleSaveWebsiteQuestion}
		on:delete={() => handleDeleteWebsiteQuestion}
		on:close={() => (showWebsiteModal = false)}
		on:return={() => handleReturnToQuestionTypeList()}
	/>

	<OptionsQuestionModal
		bind:open={showOptionsModal}
		isEditing={isEditingMode}
		on:add={() => handleAddOptionsQuestion}
		on:save={() => handleSaveOptionsQuestion}
		on:delete={() => handleDeleteOptionsQuestion}
		on:close={() => (showOptionsModal = false)}
		on:return={() => handleReturnToQuestionTypeList()}
	/>

	<TextQuestionModal
		bind:open={showTextModal}
		isEditing={isEditingMode}
		on:add={() => handleAddTextQuestion}
		on:save={() => handleSaveTextQuestion}
		on:delete={() => handleDeleteTextQuestion}
		on:close={() => (showTextModal = false)}
		on:return={() => handleReturnToQuestionTypeList()}
	/>
</section>
