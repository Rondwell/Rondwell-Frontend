<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import EditStatus from './EditStatus.svelte';
	import AddTag from './AddTag.svelte';
	import Report from './Report.svelte';
	import EmailModal from './EmailModal.svelte';

	export let open = false;
	let showEditStatus = false;
	let showAddTag = false;
	let showReportAttendee = false;

	let attendee = {
		name: 'John Odoemenem',
		email: 'johnmedoc23@gmail.com',
		registrationTime: 'Sep 23, 9:31 PM',
		amountPaid: '$0.00',
		tag: 'Main',
		status: 'Not Attending',
		timeline: [
			{ type: 'Sent', action: 'Registration Declined', time: 'Sep 23, 9:48 PM', opened: true },
			{
				type: 'Status Updated',
				action: 'Going → Not Going',
				time: 'Sep 23, 9:48 PM',
				updatedBy: 'JOHN NEBRASKA NEVADA'
			},
			{ type: 'Sent', action: 'Registration Confirmed', time: 'Sep 23, 9:48 PM', opened: true },
			{ type: 'Added to Events', time: 'Sep 23, 9:48 PM', addedBy: 'JOHN NEBRASKA NEVADA' }
		]
	};

	let registrationQuestions = [
		'Do you have experience in Python?',
		'Terms and Conditions',
		'Are you creative',
		'What company do you work for?',
		'Are you creative?',
		'Are you creative',
		'What is your LinkedIn profile?'
	];

	let showViewEmail: any = null;
	let showEmailModal: any = null;

	const timeline = [
		{
			id: 1,
			type: 'email',
			title: 'Sent: Registration Declined',
			time: 'Sep 23, 9:48 PM · Opened',
			bgColor: '#ECECEC',
			iconColor: '#A9AAAA',
			viewEmail: true
		},
		{
			id: 2,
			type: 'status',
			title: 'Going → Not Going',
			subtitle: 'Status Updated',
			time: 'Sep 23, 9:48 PM · JOHN NEBRASKA NEVADA',
			bgColor: '#ECECEC',
			iconColor: '#A9AAAA'
		},
		{
			id: 3,
			type: 'email',
			title: 'Sent: Registration Confirmed',
			time: 'Sep 23, 9:48 PM · Opened',
			bgColor: '#ECECEC',
			iconColor: '#A9AAAA',
			viewEmail: true
		},
		{
			id: 4,
			type: 'event',
			title: 'Added to Events',
			time: 'Sep 23, 9:48 PM · JOHN NEBRASKA NEVADA',
			bgColor: '#DFF1DE',
			iconColor: '#3CBD2C'
		},
		{
			id: 5,
			type: 'registered',
			title: 'Registered',
			time: 'Sep 23, 9:48 PM',
			bgColor: '#DFF1DE',
			iconColor: '#3CBD2C'
		},
		{
			id: 6,
			type: 'email',
			title: 'You are invited to Megaexe Party',
			time: 'Sep 23, 9:48 PM · Opened',
			bgColor: '#ECECEC',
			iconColor: '#A9AAAA',
			resendEmail: true
		},
		{
			id: 7,
			type: 'invited',
			title: 'Invited',
			time: 'Sep 23, 9:48 PM · JOHN NEBRASKA NEVADA',
			bgColor: '#F4ECDA',
			iconColor: '#3CBD2C'
		}
	];
</script>

{#if open}
	<!-- Container -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm lg:inset-y-0 lg:justify-end lg:p-0 lg:pr-10"
		on:click={() => (open = false)}
	>
		<!-- Panel -->
		<div
			class="flex h-full max-h-150 w-full max-w-lg flex-col rounded-tr-lg bg-[#F8F9F9] shadow-lg lg:w-lg lg:max-w-none lg:rounded-none lg:shadow-none"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<button aria-label="Close" on:click={() => (open = false)}>
					<svg
						width="16"
						height="15"
						viewBox="0 0 16 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							y="12.8203"
							width="9.9258"
							height="1.96151"
							rx="0.980754"
							transform="rotate(-45 0 12.8203)"
							fill="#68696B"
						/>
						<rect
							x="1.38867"
							width="10.0318"
							height="1.96151"
							rx="0.980754"
							transform="rotate(45 1.38867 0)"
							fill="#68696B"
						/>
						<rect
							x="7.10547"
							y="12.8203"
							width="9.9258"
							height="1.96151"
							rx="0.980754"
							transform="rotate(-45 7.10547 12.8203)"
							fill="#68696B"
						/>
						<rect
							x="8.49414"
							width="10.0318"
							height="1.96151"
							rx="0.980754"
							transform="rotate(45 8.49414 0)"
							fill="#68696B"
						/>
					</svg>
				</button>

				<div class="flex gap-2">
					<button
						aria-label="revert"
						class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 rotate-90"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					<button
						aria-label="forward"
						class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 -rotate-90"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="custom-scrollbar flex-1 overflow-y-auto px-6 pt-4 pb-10 md:pb-4">
				<!-- Attendee Info -->
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div class="flex items-center gap-2">
						<img src="/face-1.svg" alt="profile icon" class="h-10 w-10" />
						<div>
							<p class="font-semibold text-gray-900">{attendee.name}</p>
							<p class="text-xs text-gray-400">{attendee.email}</p>
						</div>
					</div>
					<div
						class="relative"
						use:clickOutside={() => {
							showEditStatus = false;
						}}
					>
						<button
							class="flex items-center gap-1 rounded-md bg-[#DCDCDC] px-3 py-1 text-xs text-[#A9AAAA]"
							on:click={() => (showEditStatus = !showEditStatus)}
						>
							{attendee.status}
							<img src="/edit-icon.svg" alt="" />
						</button>
						<EditStatus bind:open={showEditStatus} {attendee} />
					</div>
				</div>

				<!-- Registration Time / Amount -->
				<div class="mt-4 flex items-center gap-10 text-gray-400">
					<div class="border-r pr-10">
						<p class="text-xs text-[#C1C2C2]">Registration Time</p>
						<p class="text-sm font-semibold text-black">{attendee.registrationTime}</p>
					</div>
					<div>
						<p class="text-xs text-[#C1C2C2]">Amount Paid</p>
						<p class="text-sm font-semibold text-black">{attendee.amountPaid}</p>
					</div>
				</div>

				<!-- Tags -->
				<div class="mt-5 flex items-center gap-2">
					<div
						class="relative"
						use:clickOutside={() => {
							showAddTag = false;
						}}
					>
						<button
							class="flex items-center rounded-2xl bg-[#EFEFEF] px-1 py-0.5 text-xs text-[#A0A1A3]"
							on:click={() => (showAddTag = !showAddTag)}
						>
							<Icon icon="mdi:plus" class="text-xl" /> Add Tag
						</button>
						<AddTag bind:open={showAddTag} />
					</div>
					<button class="rounded-[22px] bg-[#F4ECDA] px-2 py-1 text-xs text-[#D79B1B]">
						{attendee.tag} <span class="ml-1 cursor-pointer font-semibold">×</span>
					</button>
				</div>

				<!-- Registration Questions -->
				<div class="mt-6 border-t pt-6">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold text-gray-900">Registration Questions</h3>

						<button
							class="flex items-center gap-1 rounded-md bg-[#DCDCDC] px-3 py-1 text-xs text-[#A9AAAA]"
						>
							<img src="/edit-icon.svg" alt="" />
							Edit
						</button>
					</div>

					<div class="mt-4 flex flex-col gap-3">
						{#each registrationQuestions as question}
							<div>
								<p class="text-sm text-[#B6B8BA]">{question}</p>
								<p class="mt-1 text-xs text-[#B6B8BA]">──</p>
							</div>
						{/each}
					</div>
				</div>

				<!-- Timeline -->
				<div class="mt-6 border-t py-6">
					<h3 class="mb-4 font-semibold text-gray-900">Timeline</h3>

					{#each timeline as item, i (item.id)}
						<div class="relative mt-5 flex items-start gap-3">
							<!-- Icon Circle -->
							<div
								class="flex h-[30px] w-[30px] items-center justify-center rounded-full"
								style="background-color: {item.bgColor}"
							>
								<!-- Dynamic icon based on type -->
								{#if item.type === 'email'}
									<!-- Email Icon -->
									<svg
										width="13"
										height="13"
										viewBox="0 0 13 13"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M11.5761 5.52693V8.15778C11.5761 9.99937 10.5238 10.7886 8.94526 10.7886H3.68358C2.10507 10.7886 1.05273 9.99937 1.05273 8.15778V4.47459C1.05273 2.633 2.10507 1.84375 3.68358 1.84375H7.36676"
											stroke="#A9AAAA"
											stroke-width="1.18388"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M3.68359 4.73438L5.3305 6.0498C5.87246 6.48126 6.76168 6.48126 7.30364 6.0498L7.92451 5.5552"
											stroke="#A9AAAA"
											stroke-width="1.18388"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M10.2607 4.20897C10.9872 4.20897 11.5762 3.62003 11.5762 2.89355C11.5762 2.16706 10.9872 1.57812 10.2607 1.57812C9.53425 1.57812 8.94531 2.16706 8.94531 2.89355C8.94531 3.62003 9.53425 4.20897 10.2607 4.20897Z"
											stroke="#A9AAAA"
											stroke-width="1.18388"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{:else if item.type === 'status'}
									<!-- Status Icon -->
									<svg
										width="15"
										height="15"
										viewBox="0 0 20 21"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M13.0596 7.47885C13.565 6.22866 13.2506 3.7243 12.4517 2.63647C12.4517 2.63647 11.4789 1.52311 10.6281 1.2241C10.1005 1.03867 9.20978 1.02233 9.20978 1.02233C9.20978 1.02233 8.46102 0.936927 7.99406 1.02233C7.08646 1.18833 6.62036 1.58318 5.96786 2.23294C5.31535 2.8827 4.99126 3.36309 4.75214 4.25061C4.52659 5.08775 4.49385 5.64234 4.75214 6.47004C4.97365 7.17991 5.76524 8.08418 5.76524 8.08418C5.76524 8.08418 6.42558 8.74661 6.57572 9.29478C6.72585 9.84296 6.60456 10.0925 6.37317 10.5054C6.18035 10.8494 5.76524 11.1107 5.76524 11.1107C5.76524 11.1107 5.04575 11.6373 4.54952 11.9178C3.87177 12.3008 3.40369 12.3417 2.72594 12.7248C2.72594 12.7248 1.86053 13.0834 1.51022 13.5319C1.29296 13.81 1.20406 14.0007 1.10498 14.339C0.949885 14.8685 0.943703 15.2237 1.10498 15.7513C1.23932 16.1909 1.37857 16.4435 1.71284 16.7602C2.14942 17.1738 3.13125 17.5672 3.13125 17.5672C3.13125 17.5672 3.82873 17.8561 4.3469 17.9708C6.17055 18.3743 9.4124 18.1725 9.4124 18.1725"
											stroke="#A9AAAA"
											stroke-width="1.97313"
										/>
										<rect
											x="-0.262457"
											y="-0.34634"
											width="1.28466"
											height="0.614899"
											rx="0.30745"
											transform="matrix(-0.990719 -0.13593 0.13706 -0.990563 13.484 7.42335)"
											fill="#A9AAAA"
											stroke="#A9AAAA"
											stroke-width="0.614899"
										/>
										<rect
											x="-0.267204"
											y="0.302778"
											width="1.2872"
											height="0.571241"
											rx="0.28562"
											transform="matrix(0.0625521 0.998042 -0.998074 0.0620286 9.95014 17.7616)"
											fill="#A9AAAA"
											stroke="#A9AAAA"
											stroke-width="0.571241"
										/>
										<path
											d="M10.1693 12.9359C10.2969 12.6157 10.4724 12.29 10.7222 11.9745C11.8506 10.549 13.9193 10.3084 15.3448 11.4368C16.7703 12.5653 17.0109 14.634 15.8825 16.0595C14.7541 17.4849 12.6853 17.7256 11.2598 16.5972C10.7301 16.1778 10.3633 15.6261 10.1694 15.0272"
											stroke="#A9AAAA"
											stroke-width="1.57851"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M9.947 13.3602L9.63981 11.7181"
											stroke="#A9AAAA"
											stroke-width="1.57851"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M9.94922 13.3594L11.4752 12.936"
											stroke="#A9AAAA"
											stroke-width="1.57851"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{:else if item.type === 'event'}
									<svg
										width="19"
										height="20"
										viewBox="0 0 19 20"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M13.0596 7.47885C13.565 6.22866 13.2506 3.7243 12.4517 2.63647C12.4517 2.63647 11.4789 1.52311 10.6281 1.2241C10.1005 1.03867 9.20978 1.02233 9.20978 1.02233C9.20978 1.02233 8.46102 0.936927 7.99406 1.02233C7.08646 1.18833 6.62036 1.58318 5.96786 2.23294C5.31535 2.8827 4.99126 3.36309 4.75214 4.25061C4.52659 5.08775 4.49385 5.64234 4.75214 6.47004C4.97365 7.17991 5.76524 8.08418 5.76524 8.08418C5.76524 8.08418 6.42558 8.74661 6.57572 9.29478C6.72585 9.84296 6.60456 10.0925 6.37317 10.5054C6.18035 10.8494 5.76524 11.1107 5.76524 11.1107C5.76524 11.1107 5.04575 11.6373 4.54952 11.9178C3.87177 12.3008 3.40369 12.3417 2.72594 12.7248C2.72594 12.7248 1.86053 13.0834 1.51022 13.5319C1.29296 13.81 1.20406 14.0007 1.10498 14.339C0.949885 14.8685 0.943703 15.2237 1.10498 15.7513C1.23932 16.1909 1.37857 16.4435 1.71284 16.7602C2.14942 17.1738 3.13125 17.5672 3.13125 17.5672C3.13125 17.5672 3.82873 17.8561 4.3469 17.9708C6.17055 18.3743 9.4124 18.1725 9.4124 18.1725"
											stroke="#3CBD2C"
											stroke-width="1.97313"
										/>
										<rect
											x="-0.262457"
											y="-0.34634"
											width="1.28466"
											height="0.614899"
											rx="0.30745"
											transform="matrix(-0.990719 -0.13593 0.13706 -0.990563 13.484 7.42335)"
											fill="#3CBD2C"
											stroke="#3CBD2C"
											stroke-width="0.614899"
										/>
										<rect
											x="-0.267204"
											y="0.302778"
											width="1.2872"
											height="0.571241"
											rx="0.28562"
											transform="matrix(0.0625521 0.998042 -0.998074 0.0620286 9.95014 17.7616)"
											fill="#3CBD2C"
											stroke="#3CBD2C"
											stroke-width="0.571241"
										/>
										<path
											d="M13.0596 7.47885C13.565 6.22866 13.2506 3.7243 12.4517 2.63647C12.4517 2.63647 11.4789 1.52311 10.6281 1.2241C10.1005 1.03867 9.20978 1.02233 9.20978 1.02233C9.20978 1.02233 8.46102 0.936927 7.99406 1.02233C7.08646 1.18833 6.62036 1.58318 5.96786 2.23294C5.31535 2.8827 4.99126 3.36309 4.75214 4.25061C4.52659 5.08775 4.49385 5.64234 4.75214 6.47004C4.97365 7.17991 5.76524 8.08418 5.76524 8.08418C5.76524 8.08418 6.42558 8.74661 6.57572 9.29478C6.72585 9.84296 6.60456 10.0925 6.37317 10.5054C6.18035 10.8494 5.76524 11.1107 5.76524 11.1107C5.76524 11.1107 5.04575 11.6373 4.54952 11.9178C3.87177 12.3008 3.40369 12.3417 2.72594 12.7248C2.72594 12.7248 1.86053 13.0834 1.51022 13.5319C1.29296 13.81 1.20406 14.0007 1.10498 14.339C0.949885 14.8685 0.943703 15.2237 1.10498 15.7513C1.23932 16.1909 1.37857 16.4435 1.71284 16.7602C2.14942 17.1738 3.13125 17.5672 3.13125 17.5672C3.13125 17.5672 3.82873 17.8561 4.3469 17.9708C6.17055 18.3743 9.4124 18.1725 9.4124 18.1725"
											stroke="#3CBD2C"
											stroke-width="1.97313"
										/>
										<rect
											x="-0.262457"
											y="-0.34634"
											width="1.28466"
											height="0.614899"
											rx="0.30745"
											transform="matrix(-0.990719 -0.13593 0.13706 -0.990563 13.484 7.42335)"
											fill="#3CBD2C"
											stroke="#3CBD2C"
											stroke-width="0.614899"
										/>
										<rect
											x="-0.267204"
											y="0.302778"
											width="1.2872"
											height="0.571241"
											rx="0.28562"
											transform="matrix(0.0625521 0.998042 -0.998074 0.0620286 9.95014 17.7616)"
											fill="#3CBD2C"
											stroke="#3CBD2C"
											stroke-width="0.571241"
										/>
										<path
											d="M17.2621 14.1354C17.6272 14.1356 17.9235 14.4318 17.9236 14.797C17.9236 15.1623 17.6273 15.4583 17.2621 15.4585L14.6733 15.4578V18.0473C14.6732 18.4127 14.3771 18.7089 14.0117 18.7089C13.6464 18.7088 13.3502 18.4127 13.3502 18.0473V15.4578L10.7614 15.4585C10.3961 15.4583 10.0998 15.1622 10.0998 14.797C10.1 14.4318 10.3962 14.1356 10.7614 14.1354L13.3502 14.1348L13.3495 11.5473C13.3495 11.1819 13.6463 10.8851 14.0117 10.8851C14.3769 10.8851 14.6729 11.1815 14.6733 11.5466V14.1348L17.2621 14.1354Z"
											fill="#3CBD2C"
											stroke="#3CBD2C"
											stroke-width="0.394627"
										/>
									</svg>
								{:else if item.type === 'registered'}
									<svg
										width="22"
										height="22"
										viewBox="0 0 22 22"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M9.76566 13.4154C9.53926 13.4154 9.31286 13.3125 9.14306 13.1509L7.36017 11.2995C7.02057 10.9469 7.02057 10.3591 7.36017 10.0065C7.69977 9.65385 8.26577 9.65385 8.60536 10.0065L9.76566 11.2114L12.7089 8.15511C13.0485 7.80246 13.6144 7.80246 13.954 8.15511C14.2936 8.50775 14.2936 9.09549 13.954 9.44814L10.3883 13.1509C10.2185 13.3272 9.99206 13.4154 9.76566 13.4154Z"
											fill="#3CBD2C"
										/>
										<path
											d="M17.3158 11.0941C17.3158 9.86879 18.3102 8.87433 19.5355 8.87433V7.98642C19.5355 4.43478 18.6476 3.54688 15.096 3.54688H6.21689C2.66525 3.54688 1.77734 4.43478 1.77734 7.98642V8.43038C3.00266 8.43038 3.99712 9.42484 3.99712 10.6502C3.99712 11.8755 3.00266 12.8699 1.77734 12.8699V13.3139C1.77734 16.8655 2.66525 17.7534 6.21689 17.7534H15.096C18.6476 17.7534 19.5355 16.8655 19.5355 13.3139C18.3102 13.3139 17.3158 12.3194 17.3158 11.0941Z"
											stroke="#3CBD2C"
											stroke-width="1.57851"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{:else if item.type === 'invited'}
									<svg
										width="22"
										height="22"
										viewBox="0 0 22 22"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M6.2157 10.6562C2.66406 10.6562 2.66406 12.2456 2.66406 14.2079V15.0958C2.66406 17.5464 2.66406 19.5353 7.10361 19.5353H14.2069C17.7585 19.5353 18.6464 17.5464 18.6464 15.0958V14.2079C18.6464 12.2456 18.6464 10.6562 15.0948 10.6562C14.2069 10.6562 13.9583 10.8427 13.4966 11.189L12.5909 12.1479C11.5432 13.2667 9.76734 13.2667 8.71073 12.1479L7.81394 11.189C7.35223 10.8427 7.10361 10.6562 6.2157 10.6562Z"
											stroke="#EAAB26"
											stroke-width="1.57851"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M4.4375 8.84375V10.6551"
											stroke="#EAAB26"
											stroke-width="1.57851"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M16.8682 10.6525V5.32508C16.8682 3.3628 16.8682 1.77344 13.3166 1.77344H7.98914C4.4375 1.77344 4.4375 3.3628 4.4375 5.32508"
											stroke="#EAAB26"
											stroke-width="1.57851"
											stroke-miterlimit="10"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M9.17188 8.16406H12.1286"
											stroke="#EAAB26"
											stroke-width="1.57851"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M12.1289 5.50781H12.8748"
											stroke="#EAAB26"
											stroke-width="1.57851"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M8.43359 5.50781H9.83649"
											stroke="#EAAB26"
											stroke-width="1.57851"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{/if}
							</div>

							{#if i < timeline.length - 1}
								<div class="absolute -bottom-4.5 left-3.5 h-[65%] border-2 border-gray-200"></div>
							{/if}

							<!-- Content -->
							<div class="flex-1">
								<p class="font-semibold text-gray-700">{item.title}</p>
								{#if item.subtitle}
									<p class="text-xs text-gray-400">{item.subtitle}</p>
								{/if}
								<p class="mt-1 text-xs text-gray-300 uppercase">{item.time}</p>
							</div>

							<!-- View Email Button (if applicable) -->
							{#if item.viewEmail || item.resendEmail}
								<div
									class=""
									use:clickOutside={() => {
										showEmailModal = null;
									}}
								>
									<button
										aria-label="show modal"
										on:click={() => (showViewEmail = showViewEmail === item.id ? null : item.id)}
										class="text-gray-400 hover:text-gray-600"
									>
										<!-- Dots icon -->
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											class="h-4 w-4"
										>
											<path
												d="M6 12a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0z"
											/>
										</svg>
									</button>

									{#if showViewEmail === item.id}
										<div class="absolute top-3 right-0 z-10">
											<button
												on:click={() =>
													(showEmailModal = showEmailModal === item.id ? null : item.id)}
												class="borderwhite flex items-center gap-1 rounded-md border-3 border-white bg-[#F0F0F0] p-2 text-xs shadow-sm"
											>
												{#if item.resendEmail}
													<svg
														width="19"
														height="19"
														viewBox="0 0 19 19"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<path
															d="M17.3632 8.2904V12.2367C17.3632 14.999 15.7847 16.1829 13.4169 16.1829H5.52439C3.15663 16.1829 1.57812 14.999 1.57812 12.2367V6.71189C1.57812 3.9495 3.15663 2.76562 5.52439 2.76562H11.0492"
															stroke="#A9AAAA"
															stroke-width="1.18388"
															stroke-miterlimit="10"
															stroke-linecap="round"
															stroke-linejoin="round"
														/>
														<path
															d="M5.52344 7.10156L7.9938 9.0747C8.80673 9.72188 10.1406 9.72188 10.9535 9.0747L11.8848 8.3328"
															stroke="#A9AAAA"
															stroke-width="1.18388"
															stroke-miterlimit="10"
															stroke-linecap="round"
															stroke-linejoin="round"
														/>
														<path
															d="M15.3911 6.31345C16.4808 6.31345 17.3642 5.43005 17.3642 4.34032C17.3642 3.25059 16.4808 2.36719 15.3911 2.36719C14.3014 2.36719 13.418 3.25059 13.418 4.34032C13.418 5.43005 14.3014 6.31345 15.3911 6.31345Z"
															stroke="#A9AAAA"
															stroke-width="1.18388"
															stroke-miterlimit="10"
															stroke-linecap="round"
															stroke-linejoin="round"
														/>
													</svg>

													Resend Confirmation Email
												{:else}
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-3.5 w-3.5 text-gray-500"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														stroke-width="2"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
													View Email
												{/if}
											</button>
										</div>
										<EmailModal open={showEmailModal} type={item.resendEmail ? 'resend' : 'view'} />
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<div
				class="relative w-full border-t border-gray-200 p-4"
				use:clickOutside={() => {
					showReportAttendee = false;
				}}
			>
				<button
					on:click={() => (showReportAttendee = !showReportAttendee)}
					class="w-full text-left text-xs font-semibold text-[#A6A7A7]"
				>
					Report Attendee
				</button>
				<Report bind:open={showReportAttendee} />
			</div>
		</div>
	</div>
{/if}

<style>
	/* optional fade transition */
	:global(.fade-enter-active),
	:global(.fade-leave-active) {
		transition: opacity 0.2s ease;
	}
	:global(.fade-enter-from),
	:global(.fade-leave-to) {
		opacity: 0;
	}
</style>
