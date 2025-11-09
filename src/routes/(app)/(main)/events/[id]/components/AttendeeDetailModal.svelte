<script>
	import Icon from '@iconify/svelte';

	export let open = true;
	let showViewEmail1 = false;
	let showViewEmail2 = false;

	let attendee = {
		name: 'John Odoemenem',
		email: 'johnmedoc23@gmail.com',
		registrationTime: 'Sep 23, 9:31 PM',
		amountPaid: '$0.00',
		tag: 'Main',
		status: 'Not Going',
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
</script>

{#if open}
	<!-- Container -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm md:inset-y-0 md:right-10 md:left-auto md:w-lg md:justify-start md:bg-transparent md:backdrop-blur-none"
	>
		<!-- Panel -->
		<div
			class="w-full max-w-lg overflow-y-auto rounded-t-lg bg-white shadow-lg md:w-full md:max-w-none md:rounded-none md:shadow-none"
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
			<div class="px-6 pt-4 pb-10 md:pb-4">
				<!-- Attendee Info -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<img src="/face-1.svg" alt="profile icon" class="h-10 w-10" />
						<div>
							<p class="font-semibold text-gray-900">{attendee.name}</p>
							<p class="text-xs text-gray-400">{attendee.email}</p>
						</div>
					</div>
					<button
						class="flex items-center gap-1 rounded-md bg-[#DCDCDC] px-3 py-1 text-xs text-[#A9AAAA]"
					>
						{attendee.status}
					</button>
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
					<button
						class="flex items-center rounded-2xl bg-[#EFEFEF] px-1 py-0.5 text-xs text-[#A0A1A3]"
					>
						<Icon icon="mdi:plus" class="text-xl" /> Add Tag
					</button>
					<button class="rounded-[22px] bg-[#F4ECDA] px-2 py-1 text-xs text-[#D79B1B]">
						{attendee.tag} <span class="ml-1 cursor-pointer font-semibold">×</span>
					</button>
				</div>

				<!-- Timeline -->
				<div class="mt-6 border-t py-6">
					<h3 class="mb-4 font-semibold text-gray-900">Timeline</h3>

					<!-- 1️⃣ Registration Declined -->
					<div class="relative flex items-center justify-between gap-3">
						<div class="relative flex gap-2">
							<!-- Icon + line -->
							<div
								class="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#ECECEC]"
							>
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
							</div>

							<!-- Content -->
							<div class="flex-1">
								<p class="font-semibold text-[#858587]">Sent: Registration Declined</p>
								<p class="text-xs text-gray-400">Sep 23, 9:48 PM · Opened</p>
							</div>
							<div class="absolute -bottom-4.5 left-2.5 h-6.5 border-2"></div>
						</div>
						<!-- Hover View Email -->
						<button
							on:click={() => (showViewEmail1 = !showViewEmail1)}
							class="text-gray-400 hover:text-gray-600"
						>
							<Icon icon="mdi:dots-horizontal" class="h-4 w-4" />
						</button>

						<!-- View Email box -->
						{#if showViewEmail1}
							<div class="absolute top-6 right-0 z-10">
								<button
									class="borderwhite flex items-center gap-1 rounded-md border bg-[#F0F0F0] p-2 text-xs shadow-sm"
								>
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
								</button>
							</div>
						{/if}
					</div>

					<!-- 2️⃣ Going → Not Going -->
					<div class="relative mt-5 flex items-start gap-3">
						<div
							class="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#ECECEC]"
						>
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
						</div>

						<div class="flex-1 border-gray-100">
							<p class="font-semibold text-gray-700">Going → Not Going</p>
							<p class="text-xs text-gray-400">Status Updated</p>
							<p class="mt-1 text-xs text-gray-300 uppercase">
								Sep 23, 9:48 PM · JOHN NEBRASKA NEVADA
							</p>
						</div>
						<div class="absolute -bottom-4 left-2.5 h-10.5 border-2"></div>
					</div>

					<!-- 3️⃣ Registration Confirmed -->
					<div class="group relative mt-5 flex items-center justify-between gap-3">
						<div class="relative flex gap-2">
							<div
								class="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#ECECEC]"
							>
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
							</div>

							<div class="flex-1">
								<p class="font-semibold text-[#858587]">Sent: Registration Confirmed</p>
								<p class="text-xs text-gray-400">Sep 23, 9:48 PM · Opened</p>
							</div>

							<div class="absolute -bottom-4.5 left-2.5 h-6.5 border-2"></div>
						</div>

						<button
							on:click={() => (showViewEmail2 = !showViewEmail2)}
							class="text-gray-400 hover:text-gray-600"
						>
							<Icon icon="mdi:dots-horizontal" class="h-4 w-4" />
						</button>

						<!-- View Email box -->
						{#if showViewEmail2}
							<div class="absolute top-6 right-0 z-10">
								<button
									class="borderwhite flex items-center gap-1 rounded-md border bg-[#F0F0F0] p-2 text-xs shadow-sm"
								>
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
								</button>
							</div>
						{/if}
					</div>

					<!-- 4️⃣ Added to Events -->
					<div class="mt-5 flex items-start gap-3">
						<div
							class="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#DFF1DE]"
						>
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
						</div>

						<div class="flex-1">
							<p class="font-semibold text-gray-700">Added to Events</p>
							<p class="mt-1 text-xs text-gray-300 uppercase">
								Sep 23, 9:48 PM · JOHN NEBRASKA NEVADA
							</p>
						</div>
					</div>
				</div>

				<div class="border-t border-gray-200 py-2 text-xs font-semibold text-[#A6A7A7]">
					Report Attendee
				</div>
			</div>
		</div>
	</div>
{/if}
