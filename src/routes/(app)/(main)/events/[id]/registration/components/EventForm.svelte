<!-- src/routes/event/forms/+page.svelte -->
<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import QuestionTypeList from './modal/QuestionTypeList.svelte';

	// Mock data for event forms
	const eventData: any = {
		title: 'Megaexe Party',
		collection: 'John Collection',
		tabs: [
			{ name: 'Tickets', active: false },
			{ name: 'Event Forms', active: true },
			{ name: 'Seat Capacity', active: false }
		],
		registrationQuestions: [
			{
				id: 1,
				category: 'Personal Information',
				questions: [
					{
						id: 1,
						type: 'Name',
						required: true,
						icon: `<svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.4" d="M7.13613 0C4.48037 0 2.32129 2.15908 2.32129 4.81484C2.32129 7.41993 4.35873 9.52832 7.01449 9.61955C7.09559 9.60942 7.17668 9.60942 7.2375 9.61955C7.25777 9.61955 7.26791 9.61955 7.28818 9.61955C7.29832 9.61955 7.29832 9.61955 7.30845 9.61955C9.9034 9.52832 11.9408 7.41993 11.951 4.81484C11.951 2.15908 9.7919 0 7.13613 0Z" fill="#CECECF"/>
<path d="M12.2855 9.27342C9.45737 7.38803 4.84525 7.38803 1.99689 9.27342C0.709556 10.135 0 11.3007 0 12.5475C0 13.7943 0.709556 14.9499 1.98676 15.8013C3.40587 16.7542 5.27099 17.2306 7.13611 17.2306C9.00122 17.2306 10.8663 16.7542 12.2855 15.8013C13.5627 14.9397 14.2722 13.7842 14.2722 12.5272C14.2621 11.2804 13.5627 10.1249 12.2855 9.27342Z" fill="#CECECF"/>
</svg>
`
					},
					{
						id: 2,
						type: 'Email',
						required: true,
						icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.74258 16.4844H11.2379C14.984 16.4844 16.4824 14.986 16.4824 11.2399V6.74454C16.4824 2.99844 14.984 1.5 11.2379 1.5H6.74258C2.99649 1.5 1.49805 2.99844 1.49805 6.74454V11.2399C1.49805 14.986 2.99649 16.4844 6.74258 16.4844Z" fill="#CECECF" stroke="#CECECF" stroke-width="1.12383" stroke-linecap="round" stroke-linejoin="round"/>
<g opacity="0.4">
<path d="M1.49805 9.74187H4.31511C4.88452 9.74187 5.40148 10.064 5.65622 10.5735L6.32302 11.9146C6.74258 12.7387 7.4918 12.7387 7.67162 12.7387H10.3164C10.8858 12.7387 11.4027 12.4166 11.6575 11.9071L12.3243 10.566C12.579 10.0565 13.096 9.73438 13.6654 9.73438H16.4675" fill="#CECECF"/>
<path d="M1.49805 9.74187H4.31511C4.88452 9.74187 5.40148 10.064 5.65622 10.5735L6.32302 11.9146C6.74258 12.7387 7.4918 12.7387 7.67162 12.7387H10.3164C10.8858 12.7387 11.4027 12.4166 11.6575 11.9071L12.3243 10.566C12.579 10.0565 13.096 9.73438 13.6654 9.73438H16.4675" stroke="#FDFDFD" stroke-width="2.24766" stroke-linecap="round" stroke-linejoin="round"/>
</g>
</svg>
`
					},
					{
						id: 3,
						type: 'Phone',
						required: false,
						icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.1675 1.50781H5.81414C3.74629 1.50781 2.99707 2.25703 2.99707 4.36234V13.6377C2.99707 15.743 3.74629 16.4922 5.81414 16.4922H12.16C14.2354 16.4922 14.9846 15.743 14.9846 13.6377V4.36234C14.9846 2.25703 14.2354 1.50781 12.1675 1.50781ZM8.99083 14.4693C8.27158 14.4693 7.67969 13.8774 7.67969 13.1582C7.67969 12.4389 8.27158 11.847 8.99083 11.847C9.71008 11.847 10.302 12.4389 10.302 13.1582C10.302 13.8774 9.71008 14.4693 8.99083 14.4693ZM10.4893 4.692H7.49239C7.18521 4.692 6.93047 4.43726 6.93047 4.13008C6.93047 3.8229 7.18521 3.56817 7.49239 3.56817H10.4893C10.7964 3.56817 11.0512 3.8229 11.0512 4.13008C11.0512 4.43726 10.7964 4.692 10.4893 4.692Z" fill="#CECECF"/>
</svg>
`,
						selected: 'Off'
					}
				]
			},
			{
				id: 2,
				category: 'Web3 Identity',
				questions: [
					{
						id: 4,
						type: 'Eth Address',
						required: false,
						icon: `<svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.61883 8.24548L0.215459 7.86648L5.61803 5.36912V8.24548H5.61883ZM5.61883 11.175V15.7336C3.73999 13.344 1.66901 10.7139 0 8.58508C1.96969 9.49153 4.0262 10.4387 5.61883 11.175ZM5.61883 4.56185L0 7.12358L5.61883 0V4.56185Z" fill="#CECECF"/>
<path d="M11.0225 7.86648L5.61914 8.24548V5.36912L11.0225 7.86648ZM5.61914 11.1757C7.21097 10.44 9.26668 9.49153 11.2372 8.58507C9.56816 10.7146 7.49718 13.3446 5.61914 15.733V11.1757ZM5.61914 4.56185V0L11.2372 7.12358L5.61914 4.56185Z" fill="#CECECF"/>
<path opacity="0.2" fill-rule="evenodd" clip-rule="evenodd" d="M5.61914 8.24619L11.0217 7.86719L5.61914 10.3468V8.24619Z" fill="#CECECF"/>
<path opacity="0.603" fill-rule="evenodd" clip-rule="evenodd" d="M5.61724 8.24619L0.213867 7.86719L5.61724 10.3468V8.24619Z" fill="#CECECF"/>
</svg>
`,
						selected: 'Off'
					},
					{
						id: 5,
						type: 'SOL Address',
						required: false,
						icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.6526 12.4048L13.0553 15.5193C12.9988 15.587 12.9305 15.6409 12.8546 15.6778C12.7787 15.7147 12.6968 15.7337 12.614 15.7336H0.301529C0.242779 15.7336 0.185309 15.7144 0.136182 15.6784C0.0870534 15.6424 0.0484065 15.5911 0.0249893 15.5308C0.00157216 15.4706 -0.00559526 15.404 0.00436774 15.3393C0.0143307 15.2745 0.0409901 15.2145 0.0810704 15.1664L2.68034 12.0519C2.73665 11.9845 2.80474 11.9306 2.8804 11.8938C2.95608 11.8569 3.03771 11.8378 3.12025 11.8377H15.4321C15.4908 11.8377 15.5483 11.8569 15.5974 11.8929C15.6465 11.9289 15.6852 11.9802 15.7087 12.0404C15.732 12.1007 15.7392 12.1672 15.7292 12.232C15.7193 12.2967 15.6926 12.3568 15.6526 12.4048ZM13.0553 6.1331C12.9988 6.06545 12.9305 6.01151 12.8546 5.97464C12.7787 5.93779 12.6968 5.91879 12.614 5.91884H0.301529C0.242779 5.91884 0.185309 5.93803 0.136182 5.97405C0.0870534 6.01008 0.0484065 6.06136 0.0249893 6.12159C0.00157216 6.18184 -0.00559526 6.24843 0.00436774 6.31317C0.0143307 6.37789 0.0409901 6.43796 0.0810704 6.486L2.68034 9.60051C2.73665 9.66798 2.80474 9.7218 2.8804 9.75867C2.95608 9.79551 3.03771 9.81463 3.12025 9.81477H15.4321C15.4908 9.81477 15.5483 9.79559 15.5974 9.75956C15.6465 9.72353 15.6852 9.67226 15.7087 9.61202C15.732 9.55177 15.7392 9.48519 15.7292 9.42045C15.7193 9.35572 15.6926 9.29565 15.6526 9.24761L13.0553 6.1331ZM0.301529 3.89595H12.614C12.6968 3.89598 12.7787 3.87699 12.8546 3.84013C12.9305 3.80326 12.9988 3.74932 13.0553 3.68166L15.6526 0.567159C15.6926 0.519132 15.7193 0.45906 15.7292 0.394324C15.7392 0.329587 15.732 0.263007 15.7087 0.202763C15.6852 0.14252 15.6465 0.0912363 15.5974 0.0552148C15.5483 0.019193 15.4908 2.21833e-06 15.4321 0H3.12025C3.03771 0.00015705 2.95608 0.0192556 2.8804 0.0561132C2.80474 0.092971 2.73665 0.146803 2.68034 0.214277L0.0817404 3.32879C0.0416989 3.37675 0.0150513 3.43678 0.00506567 3.50143C-0.00491993 3.56609 0.00219062 3.63262 0.0255252 3.69284C0.0488598 3.75306 0.0874042 3.80433 0.136431 3.84041C0.185459 3.87649 0.242836 3.89579 0.301529 3.89595Z" fill="#CECECF"/>
</svg>
`,
						selected: 'Off'
					}
				]
			},
			{
				id: 3,
				category: 'Custom Questions',
				questions: [
					{
						id: 6,
						type: 'Do you have experience in Python?',
						icon: '/checkbox-icon.svg',
						questionType: 'Checkbox',
						options: ['Early Bird Ticket', 'Investors Only', 'Standard In...', 'Accelerate...'],
						required: false
					},
					{
						id: 7,
						type: 'Terms and Conditions',
						icon: '/terms-icon.svg',
						questionType: 'Terms',
						options: ['Early Bird Ti...', 'Investors Only', 'Standard In...', 'Accelerate...'],
						required: true
					},
					{
						id: 8,
						type: 'Are you creative?',
						icon: '/option-icon.svg',
						questionType: 'Multi Select',
						options: ['Early Bird Ti...', 'Investors Only', 'Standard In...', 'Accelerate...'],
						required: true
					},
					{
						id: 9,
						type: 'What company do you work for?',
						icon: '/buildings-2.svg',
						questionType: 'Office',
						options: ['Standard In...', 'Accelerate...'],
						required: false
					},
					{
						id: 10,
						type: 'Are you creative?',
						icon: '/text-icon.svg',
						questionType: 'Text',
						options: ['Early Bird Ti...', 'Investors Only', 'Standard In...', 'Accelerate...'],
						required: false
					},
					{
						id: 11,
						type: 'Are you creative?',
						icon: '/text-icon.svg',
						questionType: 'Long Text',
						options: [],
						required: true
					},
					{
						id: 12,
						type: 'What is your LinkedIn profile?',
						icon: '/user-octagon.svg',
						questionType: 'LinkedIn',
						options: [],
						required: false
					},
					{
						id: 13,
						type: 'Are you creative?',
						icon: '/checkbox-icon.svg',
						questionType: 'Checkbox',
						options: [],
						required: true
					}
				]
			}
		]
	};

	let menuOpen: number | null = null;

	let options = ['Off', 'Optional', 'Required'];
	let open = false;

	let showAddQuestion = false;

	// Function to delete question
	const deleteQuestion = (questionId: number) => {
		console.log('Deleting question:', questionId);
		// In a real app, this would remove the question from the list
	};

	// Function to edit question
	const editQuestion = (questionId: number) => {
		console.log('Editing question:', questionId);
		// In a real app, this would open a modal or form to edit the question
	};
</script>

<div class="">
	<!-- Registration Questions Section -->
	<div class="mb-6">
		<h2 class="mb-1 text-lg font-semibold">Registration Questions</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">
			We will ask attendees the following questions when they register for the event.
		</p>

		<!-- Personal Information Section -->
		<div class="my-4">
			<div class="mb-3 flex items-center gap-2">
				<img src="/pi-icon.svg" alt="" />
				<h3 class="text-sm font-medium">Personal Information</h3>
			</div>

			<div class="mb-6 flex w-full flex-wrap gap-3">
				{#each eventData.registrationQuestions[0].questions as question}
					<div
						use:clickOutside={() => (menuOpen = null)}
						class="relative flex w-full items-center gap-2 rounded-[8px] bg-[#FDFDFD] px-4 py-3 text-sm font-medium shadow-sm sm:min-w-55 md:w-fit"
					>
						<div class="flex w-full items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<p>{@html question.icon}</p>
								<span class="font-medium">{question.type}</span>
							</div>
							{#if question.required}
								<span class="text-xs text-gray-500">Required</span>
							{:else}
								<div>
									<button
										on:click={() => (menuOpen = menuOpen === question.id ? null : question.id)}
										class="flex items-center gap-1"
									>
										<span class="text-xs text-gray-500">{question.selected}</span>

										<img src="/up-down-icon.svg" alt="" class="h-4 w-4" />
									</button>
									{#if menuOpen === question.id}
										<div
											class="triangle absolute top-13 left-0 z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg"
										>
											{#each options as option}
												<button
													class="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 {option ===
													question.selected
														? 'bg-[#F0F0F0]'
														: ''}"
													class:selected={option === question.selected}
													on:click={() => (question.selected = option)}
												>
													<span>{option}</span>
													{#if option === question.selected}
														<Icon icon="mdi:tick" class="h-4 w-4 text-black" />
													{/if}
												</button>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Web3 Identity Section -->
		<div class="mb-4">
			<div class="mb-3 flex items-center gap-2">
				<img src="/web-3-icon.svg" alt="" />

				<h3 class="font-medium">Web3 Identity</h3>
			</div>

			<div class="mb-6 flex w-full flex-wrap gap-3">
				{#each eventData.registrationQuestions[1].questions as question}
					<div
						use:clickOutside={() => (menuOpen = null)}
						class="relative flex w-full items-center gap-2 rounded-[8px] bg-[#FDFDFD] px-4 py-3 text-sm font-medium shadow-sm sm:min-w-55 md:w-fit"
					>
						<div class="flex w-full items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<p>{@html question.icon}</p>
								<span class="font-medium">{question.type}</span>
							</div>
							<div>
								<button
									on:click={() => (menuOpen = menuOpen === question.id ? null : question.id)}
									class="flex items-center gap-1"
								>
									<span class="text-xs text-gray-500">{question.selected}</span>

									<img src="/up-down-icon.svg" alt="" class="h-4 w-4" />
								</button>
								{#if menuOpen === question.id}
									<div
										class="triangle absolute top-13 left-0 z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg"
									>
										{#each options as option}
											<button
												class="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 {option ===
												question.selected
													? 'bg-[#F0F0F0]'
													: ''}"
												class:selected={option === question.selected}
												on:click={() => (question.selected = option)}
											>
												<span>{option}</span>
												{#if option === question.selected}
													<Icon icon="mdi:tick" class="h-4 w-4 text-black" />
												{/if}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Custom Questions Section -->
		<div class="">
			<div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-2">
					<img src="/cq-icon.svg" alt="" />

					<h3 class="font-medium">Custom Questions</h3>
				</div>
				<div class="flex items-center gap-2">
					<button
						class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
					>
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
						All Tickets
						<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
					</button>
					<div use:clickOutside={() => (showAddQuestion = false)}>
						<button
							on:click={() => (showAddQuestion = !showAddQuestion)}
							class="flex w-fit items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:text-sm"
						>
							<Icon icon="mdi:plus" class="text-xl" />
							Add Question
						</button>
						<QuestionTypeList bind:open={showAddQuestion} />
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-3">
				{#each eventData.registrationQuestions[2].questions as question}
					<div class="rounded-xl bg-[#FDFDFD] p-4">
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<Icon icon="mdi:drag" class="h-6 w-6 text-gray-400" />

								<div class="w-fit md:w-auto">
									<span class="mb-1 font-medium">{question.type}</span>

									<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
										<span class="flex items-center gap-1 text-sm text-[#B3B4B4]">
											<img src={question.icon} alt=" " />
											{question.questionType}
											{question.required === true ? '- Required' : ''}
										</span>

										{#if question.options.length > 0}
											<div class="mt-1 mb-3 flex flex-wrap items-center gap-2">
												{#each question.options as option, i}
													<span
														class="max-w-[100px] truncate rounded-2xl px-2 py-0.5 text-xs font-medium"
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
													</span>
												{/each}
											</div>
										{/if}
									</div>
									{#if question.questionType === 'Multi Select'}
										<span class="text-sm text-[#B3B4B4]"> 3 Options: Yes, No, Maybe </span>
									{/if}
								</div>
							</div>

							<div class="relative">
								<div class="flex w-8 items-center gap-2 self-start md:w-auto">
									<img src="/delete-icon.svg" alt="" />
									<img src="/edit-icon.svg" alt="" />
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	/* Triangle pointer */
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		left: 90px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
