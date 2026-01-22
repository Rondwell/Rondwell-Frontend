<script lang="ts">
	import RegistrationModal from '../components/modal/RegistrationModal.svelte';
	import OrganiserList from '../components/OrganiserList.svelte';

	let selectedTicket = 'standard';
	let showAddModal = false

	const organizer  = [
		{
			id: 1,
			name: 'JOHN EMINEM ODO',
			avatar: '/john-avatar.svg',
			social: true
		},
				{
			id: 2,
			name: 'Sam Adekunle',
			avatar: '/user1-icon.svg',
			social: true
		},
				{
			id: 1,
			name: 'Africa Startup Festival',
			avatar: '/user3-icon.svg',
			social: false
		},
	]

	// 	  $: {
    // 	if (showAddModal) {
    //   	document.body.style.overflow = 'hidden';
    // 	} else {
    //   	document.body.style.overflow = '';
    // 	}
  	// }

</script>

<div class="w-full">
	<div class="flex flex-col justify-start gap-6 py-4.5 md:flex-row md:gap-9">
		<!-- Left Column -->
		<div class="w-full md:max-w-[378.13px]">
			<!-- Event Image -->
			<img
				src="/eventpage_sample.svg"
				alt="Location"
				class=" w-full md:size-[378.13px] aspect-square rounded-[27px]"
			/>

			<!-- Organizer Access Card -->
			<div
				class="mb-6 mt-6.5 w-full md:max-w-[378.13px] rounded-lg border border-[#69737D]/13 bg-[#69737D]/13 px-3 py-2.5 sm:px-4 sm:py-3"
			>
				<div class="flex justify-between items-center gap-2 ">
					<div class="max-w-[220.77px] font-normal leading-6 text-[#69737D] text-base">
						You have organizer <br /> access for this event.
					</div>
					<button
						class="flex items-center justify-center gap-1 rounded-full bg-[#69737D] px-3.5 py-2 text-base font-medium text-white transition-colors hover:bg-[#69737D]/70"
					>
						Organize
						<img src="/send-white.svg" alt="icon" class="ml-[3px] size-5" />
					</button>
				</div>
			</div>

			<!-- Desktop Only Sections -->
			<div class="hidden md:block">
				<!-- Presented By Section -->
				<div class='bg-white p-[20px_7px_15px_19px] rounded-2xl'>
					<div class="flex justify-between items-center gap-3">
					<div class="flex gap-3">
						
							<img src='/present.svg' alt='host-pic' class="size-9 rounded-[9px]"  />
						
						<div>
							<p>Presented by</p>
							<h2 class="flex">
								💰 Get Funded! Offi...
								<span>
									<svg
										width="17"
										height="16"
										viewBox="0 0 17 16"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<g clip-path="url(#clip0_1_8843)">
											<path
												d="M7 12L11 8L7 4"
												stroke="#480000"
												stroke-opacity="0.36"
												stroke-width="1.33333"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</g>
										<defs>
											<clipPath id="clip0_1_8843">
												<rect width="16" height="16" fill="white" transform="translate(1)" />
											</clipPath>
										</defs>
									</svg>
								</span>
							</h2>
						</div>
					</div>
					<button
						class="rounded-full bg-[#511A00]/4 px-[13px] py-2.5 min-h-8.5 text-base leading-0 font-normal text-[#42494F]/64"
					>
						Subscribe
					</button>
				</div>

				<p class="mt-3.5 text-[15px] font-light leading-6 text-[#666C71] max-w-[324px]">
					Empowering transformational change in entrepreneurs and driven professionals through
					compassionate coaching. Are you ready to steDanielp
				</p>
				</div>

				<!-- Organized By Section -->
				<div class='bg-white p-[7px_22px_24px_15px] rounded-[16px] mt-[25px]'>
					<div class=" flex flex-col">
					<h3
						class="mb-[19px] border-b border-[#7F2400]/8 pb-[9px] text-base font-normal text-[#42494F]/80"
					>
						Organized By
					</h3>
					<div class="space-y-3">
						{#each organizer as or}
						<OrganiserList organizerName={or.name} organizerAvatar={or.avatar} organizerSocial={or.social}  />
				{/each}

					</div>
				</div>

				<!-- Attending Section -->
				<div class="mt-6.5 flex flex-col">
					<h3
						class="mb-[19px] border-b border-[#7F2400]/8 pb-[9px] text-base font-normal text-[#666C71]/80"
					>
						119 Attending
					</h3>
					<div class="space-y-[10px]">
						<div class="relative flex items-center gap-1 text-sm text-gray-600">
							<img src="/ppp.svg" alt="Featured" class="h-auto w-auto" />
							<span
								class="absolute left-10 top-0 rounded-[11.2503px] border border-[#FFF0E6] bg-[#F4F4F4] px-2 py-1 text-xs text-[#7F7F81]"
								>+59</span
							>
						</div>
						<p class="max-w-[334px] text-[15px] text-[#666C71]/80">
							Tucker Cohen, Gabriel Funsho, Bbloloa, and 116 others
						</p>
					</div>
				</div>

				<!-- Footer Links -->
				<div class="mt-7 flex flex-col space-y-3.5 mb-6">
					<a href="#" class="text-[15px] font-normal leading-3.5 text-[#0D151C]/36">
						Contact the Organizer
					</a>
					<a href="#" class="text-[15px] font-normal leading-3.5 text-[#0D151C]/36">
						Report Event
					</a>
				</div>
				<div class='w-fit rounded-full border border-[#0D151C]/8 text-[#0D151C]/36 px-[8.4px] py-[2.6px]'> <span class='mr-[3px]'>#</span>AI</div>
				</div>
			</div>
		</div>

		<!-- Right Column -->
		<div>
			<div>
				<!-- Event Title -->
				
				<div>
					<div class="mb-5.5 space-y-3">
						<div class='bg-white rounded-[16px] flex flex-col gap-[19px] p-[24px_33px_19px_22px]'>
							<div>
								<h2 class="text-3xl md:text-[55px] font-bold md:leading-[63.3px] max-w-[597px]">Megaexe Party, in mapi</h2>
								<div class="flex items-center mt-2 md:hidden">
									<img src='/tech-icon.svg' alt='calender icon' class="size-4 border border-[#0D151C]/8 mr-2 rounded-[4px]" /> 
									<p class="text-[#42494F]/80 text-[13.43px]">John Calendar</p>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<g opacity="0.5">
										<path d="M5.75488 11.5072L9.59151 7.67061L5.75488 3.83398" stroke="#42494F" stroke-opacity="0.8" stroke-width="1.27887" stroke-linecap="round" stroke-linejoin="round"/>
										</g>
									</svg>
								</div>
							</div>

						<!-- Date -->
						<div class="flex items-center gap-4.5">
							<div class="flex h-[49.45px] w-[44.31px] flex-col rounded-md border">
								<p class="bg-[#EBECED] py-[2px] text-center text-xs text-[#C7C9CB]">Jun</p>
								<div class="flex flex-1 items-center justify-center border-t">
									<p class="text-sm font-medium text-gray-700">25</p>
								</div>
							</div>
							<div>
								<div class="text-lg font-medium text-gray-800">Wednesday, Dec 25</div>
								<div class="text-sm text-gray-500">11:30AM - 12:30AM GMT+1</div>
							</div>
						</div>

						<!-- Location -->
						<div class="flex items-center gap-4.5">
							<div
								class="flex w-[44.31px] items-center justify-center rounded-md border py-[11px]"
							>
								<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M2.86182 9.81725C2.86182 15.7842 10.0806 21.4847 11.4556 21.4847C12.8306 21.4847 20.0493 15.7842 20.0493 9.81725C20.0493 5.18665 16.2022 1.43262 11.4556 1.43262C6.70895 1.43262 2.86182 5.18522 2.86182 9.81725Z" stroke="#42494F" stroke-opacity="0.8" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.6035 9.31055C13.6035 9.88035 13.3772 10.4268 12.9743 10.8297C12.5713 11.2326 12.0249 11.459 11.4551 11.459C10.8853 11.459 10.3388 11.2326 9.9359 10.8297C9.53299 10.4268 9.30664 9.88035 9.30664 9.31055C9.30664 8.74075 9.53299 8.19428 9.9359 7.79137C10.3388 7.38846 10.8853 7.16211 11.4551 7.16211C12.0249 7.16211 12.5713 7.38846 12.9743 7.79137C13.3772 8.19428 13.6035 8.74075 13.6035 9.31055Z" stroke="#42494F" stroke-opacity="0.8" stroke-width="2.14844" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

							</div>
							<div>
								<div class="text-lg font-medium text-[#0D151C]">Register to See Address</div>
							
							</div>
						</div>
						</div>

						<!-- Registration Section -->
						<div
							class="mt-[21px] mb-[17px] flex max-w-2xl flex-col rounded-2xl border-[1.2px] border-white bg-white"
						>
							<h2 class="rounded-t-2xl bg-[#2A2E33]/4 px-5 py-2 text-lg font-normal text-gray-600">
								Registration
							</h2>

							<p class="my-4 px-5 text-base text-[#0D151C]">
								Welcome! Please choose your desired ticket type:
							</p>

							<div class="mb-5 flex flex-col gap-3 px-5">
								<!-- Standard Ticket -->
								<div
									class="relative block cursor-pointer rounded-lg border-2 bg-white p-4 transition-colors {selectedTicket ===
									'standard'
										? 'border-gray-800'
										: 'border-gray-300 hover:border-gray-400'}"
								>
									<div class="relative flex items-center justify-between pl-8">
										<div class="absolute left-0 top-0 flex h-5 w-5 items-center justify-center">
											<svg
												width="19"
												height="19"
												viewBox="0 0 19 19"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													fill-rule="evenodd"
													clip-rule="evenodd"
													d="M8.55643 0.0191306C7.24211 0.109731 5.96257 0.481523 4.80435 1.10936C3.64613 1.7372 2.63625 2.60644 1.84299 3.6583C0.916016 4.8809 0.339661 6.27538 0.0841406 7.91278C-0.00981771 8.51205 -0.00981771 9.82059 0.0841406 10.4199C0.476016 12.9338 1.69174 14.9975 3.66143 16.4916C4.87831 17.4152 6.28081 17.995 7.91362 18.2493C8.51289 18.3433 9.82143 18.3433 10.4207 18.2493C12.6482 17.9022 14.5411 16.8984 15.962 15.3103C17.2224 13.902 17.95 12.346 18.2502 10.4199C18.3441 9.82059 18.3441 8.51205 18.2502 7.91278C17.9958 6.27996 17.416 4.87746 16.4925 3.66059C15.7549 2.67976 14.8279 1.85701 13.7664 1.24114C12.7049 0.625272 11.5306 0.228814 10.313 0.0752764C9.72909 0.0220065 9.14255 0.00325863 8.55643 0.0191306ZM12.8155 5.18111C12.5796 5.24141 12.3653 5.36643 12.1967 5.54205C12.1131 5.62684 11.1139 6.80017 9.97383 8.14767C9.28502 8.97268 8.58717 9.79009 7.88039 10.5998C7.86664 10.5998 7.45185 10.1781 6.96029 9.66476C5.64945 8.29434 5.59674 8.2508 5.17508 8.17632C4.91447 8.13677 4.64799 8.17296 4.40737 8.28059C4.12069 8.43042 3.90186 8.68385 3.79543 8.98932C3.689 9.29478 3.70295 9.62932 3.83445 9.92486C3.91466 10.1048 4.07393 10.2801 5.73081 12.0034C6.48706 12.7894 7.17685 13.4815 7.26508 13.5388C7.43237 13.6534 7.74174 13.7497 7.93997 13.7497C8.13935 13.7497 8.43727 13.6545 8.62174 13.5319C8.75581 13.4437 9.40549 12.6966 11.4611 10.2663C13.2509 8.15111 14.1584 7.05569 14.2226 6.92507C14.3108 6.75319 14.3234 6.6959 14.3246 6.43236C14.3246 6.0359 14.2512 5.83194 14.014 5.57528C13.8651 5.41192 13.6765 5.28979 13.4665 5.22073C13.2566 5.15167 13.0323 5.13803 12.8155 5.18111Z"
													fill="#42494F"
												/>
											</svg>
										</div>

										<div class="flex items-center gap-2">
											<span class="text-sm font-medium text-gray-800">Standard</span>
											<span
												class="rounded-full bg-[#D69712]/13 px-2 py-0.5 text-xs font-medium text-[#D69712]"
												>Require Approval</span
											>
										</div>
										<span class="text-sm text-gray-600">Free</span>
									</div>
								</div>

								<!-- Salesperson Interview Ticket -->
								<div
									class="relative block cursor-pointer rounded-lg border-2 bg-white p-4 transition-colors {selectedTicket ===
									'salesperson'
										? 'border-gray-800'
										: 'border-gray-300 hover:border-gray-400'}"
								>
									<div class="relative flex items-start justify-between pl-5">
										<div class="flex flex-col lg:flex-row items-start lg:items-start gap-2">
											<span class="text-sm font-medium text-gray-800">Salesperson Interview</span>
											<span
												class="min-w-fit rounded-full bg-[#D69712]/13 px-2 py-0.5 text-xs font-medium text-[#D69712]"
												>Require Approval</span
											>
										</div>
										<span class="text-sm text-gray-600">Free</span>
									</div>
									<div class="mt-3 pl-5">
										<p class="mb-1 text-sm text-gray-600">Registration Emails</p>
										<p class="text-xs leading-relaxed text-gray-600">
											Customize the emails sent when a guest registers for the event and for when
											your approve or decline their registration.
										</p>
									</div>
								</div>

								<!-- Admin Module -->
								<div
									class="relative block cursor-not-allowed rounded-lg border-2 border-gray-300 bg-white p-4 opacity-60"
								>
									<div class="relative flex items-center justify-between pl-5">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium text-gray-800">Admin Module</span>
										</div>
										<span class="text-sm text-gray-600">Free</span>
									</div>
									<p class="mt-2 pl-5 text-xs text-gray-500">
										<span class='size-[10px] bg-[#0D151C]/20 rounded-full'></span> Sales ended Oct 22, 2024, 11:59 PM
									</p>
								</div>
							</div>

							<!-- Sign-in Section -->
							<div class="mb-4 flex items-center gap-3 rounded-lg bg-white px-5 py-3">
								<div>
									<img src='/john-avatar.svg' alt='avatar' class="size-[23px] rounded-full" />
								</div>
								<span class="text-sm text-gray-600"
									><strong class="mr-2 text-gray-800">SIGN-IN</strong> For one-click registration</span
								>
							</div>

							<!-- Request Button -->
							<div class="px-5 pb-5">
								<button
									class="w-full cursor-pointer rounded-lg bg-[#69737D] px-4 py-[9.5px] text-base font-medium text-white transition-colors hover:bg-[#69737D]/70 active:bg-[#69737D]/70"
									on:click={() => (showAddModal = true)}
								>
									Request to Get In
								</button>
								<RegistrationModal bind:open={showAddModal} />
							</div>
						</div>

						<!-- About Event Section -->
						<div class="max-w-2xl rounded-2xl bg-white mb-6">
							<!-- Header with icon -->
							<div class="mb-6 flex items-center gap-2 border-b p-6">
								<span>
									<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M10.8446 19H6.11242C1.82978 19 0 16.9498 0 12.1512V6.84884C0 2.05023 1.82978 0 6.11242 0H10.0559C10.3793 0 10.6474 0.300465 10.6474 0.662791C10.6474 1.02512 10.3793 1.32558 10.0559 1.32558H6.11242C2.47652 1.32558 1.18305 2.77488 1.18305 6.84884V12.1512C1.18305 16.2251 2.47652 17.6744 6.11242 17.6744H10.8446C14.4805 17.6744 15.774 16.2251 15.774 12.1512V7.73256C15.774 7.37023 16.0421 7.06977 16.3655 7.06977C16.6889 7.06977 16.957 7.37023 16.957 7.73256V12.1512C16.957 16.9498 15.1272 19 10.8446 19Z" fill="#686D72"/>
										<path d="M16.364 8.39502H13.2092C10.5119 8.39502 9.46289 7.21967 9.46289 4.19735V0.662463C9.46289 0.397346 9.60486 0.149905 9.82569 0.0526953C10.0465 -0.0533512 10.2989 0.00850933 10.4724 0.194091L16.782 7.26386C16.9476 7.44944 17.0029 7.74107 16.9082 7.98851C16.8136 8.23595 16.6006 8.39502 16.364 8.39502ZM10.6459 2.262V4.19735C10.6459 6.47735 11.1744 7.06944 13.2092 7.06944H14.9365L10.6459 2.262Z" fill="#686D72"/>
										<path d="M9.26464 11.0463H4.53244C4.20908 11.0463 3.94092 10.7458 3.94092 10.3835C3.94092 10.0212 4.20908 9.7207 4.53244 9.7207H9.26464C9.588 9.7207 9.85616 10.0212 9.85616 10.3835C9.85616 10.7458 9.588 11.0463 9.26464 11.0463Z" fill="#686D72"/>
										<path d="M7.68724 14.5814H4.53244C4.20908 14.5814 3.94092 14.281 3.94092 13.9187C3.94092 13.5563 4.20908 13.2559 4.53244 13.2559H7.68724C8.01061 13.2559 8.27876 13.5563 8.27876 13.9187C8.27876 14.281 8.01061 14.5814 7.68724 14.5814Z" fill="#686D72"/>
									</svg>
								</span>
								<h2 class="text-lg font-semibold text-[#0D151C]">About Event</h2>
							</div>

							<!-- Send Newsletters Section -->
							<div class="mb-8 px-6">
								<h3 class="mb-5 text-xl font-semibold text-[#0D151C]">Send Newsletters</h3>
								<p class="mb-3 text-base font-light text-[#0D151C]">
									When guests subscribe to your Calendar, you'll be able to send them newsletters.
									With your Luma newsletter, it's easy to include your upcoming events and to filter
									your audience by tags.
								</p>
							</div>

							<!-- Highlight Community Events Section -->
							<div class="px-6 pb-6">
								<h3 class="mb-5 text-xl font-semibold text-[#0D151C]">
									Highlight Community Events
								</h3>
								<p class="mb-3 text-base font-light text-[#0D151C]">
									You can add events from other Calendars and even from other websites.<br />
									You won't be able to manage these events, but they will be highlighted on your Calendar.<br
									/>
									This is a perfect way to highlight events that are created by your community.
								</p>
							</div>
						</div>


						<div class="md:hidden block">
						<!-- Presented By Section -->
							<div class='bg-white p-[20px_7px_15px_19px] rounded-2xl'>
								<div class="flex justify-between items-center gap-3">
									<div class="flex gap-3">
										<img src='/present.svg' alt='host-pic' class="size-9 rounded-[9px]"  />
										<div>
											<p>Presented by</p>
											<h2 class="flex">
												💰 Get Funded! Offi...
												<span>
													<svg
														width="17"
														height="16"
														viewBox="0 0 17 16"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<g clip-path="url(#clip0_1_8843)">
															<path
																d="M7 12L11 8L7 4"
																stroke="#480000"
																stroke-opacity="0.36"
																stroke-width="1.33333"
																stroke-linecap="round"
																stroke-linejoin="round"
															/>
														</g>
														<defs>
															<clipPath id="clip0_1_8843">
																<rect width="16" height="16" fill="white" transform="translate(1)" />
															</clipPath>
														</defs>
													</svg>
												</span>
											</h2>
										</div>
									</div>
										<button
											class="rounded-full bg-[#511A00]/4 px-[13px] py-2.5 min-h-8.5 text-base leading-0 font-normal text-[#42494F]/64">
											Subscribe
										</button>
									</div>

									<p class="mt-3.5 text-[15px] font-light leading-6 text-[#666C71] max-w-[324px]">
									Empowering transformational change in entrepreneurs and driven professionals through
									compassionate coaching. Are you ready to steDanielp
									</p>
								</div>
							
								<!-- Organized By Section -->
								<div class='bg-white p-[7px_22px_24px_15px] rounded-[16px] mt-[25px]'>
									<div class=" flex flex-col">
										<h3 class="mb-[19px] border-b border-[#7F2400]/8 pb-[9px] text-base font-normal text-[#42494F]/80">
											Organized By
										</h3>
										<div class="space-y-3">
											{#each organizer as or}
												<OrganiserList organizerName={or.name} organizerAvatar={or.avatar} organizerSocial={or.social}  />
											{/each}
										</div>
									</div>

				<!-- Attending Section -->
				<div class="mt-6.5 flex flex-col">
					<h3
						class="mb-[19px] border-b border-[#7F2400]/8 pb-[9px] text-base font-normal text-[#666C71]/80"
					>
						119 Attending
					</h3>
					<div class="space-y-[10px]">
						<div class="relative flex items-center gap-1 text-sm text-gray-600">
							<img src="/ppp.svg" alt="Featured" class="h-auto w-auto" />
							<span
								class="absolute left-10 top-0 rounded-[11.2503px] border border-[#FFF0E6] bg-[#F4F4F4] px-2 py-1 text-xs text-[#7F7F81]"
								>+59</span
							>
						</div>
						<p class="max-w-[334px] text-[15px] text-[#666C71]/80">
							Tucker Cohen, Gabriel Funsho, Bbloloa, and 116 others
						</p>
					</div>
				</div>

				<!-- Footer Links -->
				<div class="mt-7 flex flex-col space-y-3.5 mb-6">
					<a href="#" class="text-[15px] font-normal leading-3.5 text-[#0D151C]/36">
						Contact the Organizer
					</a>
					<a href="#" class="text-[15px] font-normal leading-3.5 text-[#0D151C]/36">
						Report Event
					</a>
				</div>
				<div class='w-fit rounded-full border border-[#0D151C]/8 text-[#0D151C]/36 px-[8.4px] py-[2.6px]'> <span class='mr-[3px]'>#</span>AI</div>
				</div>
			</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>