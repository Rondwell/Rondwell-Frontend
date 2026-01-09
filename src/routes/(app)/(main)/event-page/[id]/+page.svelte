<script lang="ts">
	import OrganiserList from '../components/OrganiserList.svelte';

	let selectedTicket = 'standard';

	function handleRequestGetIn() {
		console.log('Request to get in with ticket type:', selectedTicket);
		// Add your logic here
	}
</script>

<div class="w-full">
	<div class="flex flex-col justify-start gap-6 py-4.5 md:flex-row md:gap-9">
		<!-- Left Column -->
		<div class="max-w-[378.13px]">
			<!-- Event Image -->
			<img
				src="./../src/lib/assets/images/eventpage_sample.svg"
				alt="Location"
				class="size-[378.13px] rounded-[27px]"
			/>

			<!-- Organizer Access Card -->
			<div
				class="mb-4 mt-3 max-w-[378.13px] rounded-lg border border-[#69737D]/13 bg-[#69737D]/13 px-3 py-2.5 sm:px-4 sm:py-3"
			>
				<div class="mb-2 flex justify-between gap-2 sm:mb-0 sm:flex-row sm:items-center">
					<div class="max-w-[220.77px] text-xs font-normal leading-6 text-[#69737D] sm:text-base">
						You have organizer <br /> access for this event.
					</div>
					<button
						class="flex items-center justify-center gap-1 rounded-full bg-[#69737D] px-3.5 py-2 text-base font-medium text-white transition-colors hover:bg-[#69737D]/70"
					>
						Organize
						<img src="/send-3.svg" alt="icon" class="ml-[3px] h-3 w-3" />
					</button>
				</div>
			</div>

			<!-- Desktop Only Sections -->
			<div class="hidden md:block">
				<!-- Presented By Section -->
				<div class="flex justify-between gap-3">
					<div class="flex gap-3">
						<div class="size-9 rounded-[9px] bg-green-300"></div>
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
						class="rounded-full bg-[#511A00]/6 px-3.5 py-2.5 text-base font-normal leading-4 text-[#480000]"
					>
						Subscribe
					</button>
				</div>

				<p class="mt-3.5 text-[15px] font-light leading-6 text-[#AA644B]">
					Empowering transformational change in entrepreneurs and driven professionals through
					compassionate coaching. Are you ready to steDanielp
				</p>

				<!-- Organized By Section -->
				<div class="mt-14.5 flex flex-col">
					<h3
						class="mb-[19px] border-b border-[#7F2400]/8 pb-[9px] text-base font-normal text-[#7F2400]/80"
					>
						Organized By
					</h3>
					<div class="space-y-[15px]">
						<OrganiserList organizerName="Darrel Fratter" />
						<OrganiserList organizerName="Darrel Fratter" />
						<OrganiserList organizerName="Darrel Fratter" />
					</div>
				</div>

				<!-- Attending Section -->
				<div class="mt-6.5 flex flex-col">
					<h3
						class="mb-[19px] border-b border-[#7F2400]/8 pb-[9px] text-base font-normal text-[#7F2400]/80"
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
						<p class="max-w-[334px] text-[15px] text-[#7F2400]/80">
							Tucker Cohen, Gabriel Funsho, Bbloloa, and 116 others
						</p>
					</div>
				</div>

				<!-- Footer Links -->
				<div class="mt-7 flex flex-col space-y-[10px]">
					<a href="#" class="text-[15px] font-normal leading-3.5 text-[#480000]/36">
						Contact the Organizer
					</a>
					<a href="#" class="text-[15px] font-normal leading-3.5 text-[#480000]/36">
						Report Event
					</a>
				</div>
			</div>
		</div>

		<!-- Right Column -->
		<div>
			<div>
				<!-- Event Title -->
				<h2 class="text-[55px] font-bold leading-[63.3px]">Megaexe Party, in mapi</h2>

				<div>
					<div class="my-5.5 space-y-3">
						<!-- Date -->
						<div class="flex items-center gap-2">
							<div class="flex h-[49.45px] w-[49.45px] flex-col rounded-md border">
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
						<div class="flex items-center gap-2">
							<div
								class="flex h-[49.45px] w-[49.45px] items-center justify-center rounded-md border"
							>
								<svg
									width="27"
									height="27"
									viewBox="0 0 27 27"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										opacity="0.4"
										d="M23.7738 17.3967L16.7811 4.80977C15.8414 3.11622 14.5412 2.1875 13.1099 2.1875C11.6786 2.1875 10.3784 3.11622 9.43873 4.80977L2.44601 17.3967C1.561 19.0028 1.46266 20.5434 2.17286 21.7562C2.88306 22.969 4.2816 23.6355 6.11719 23.6355H20.1026C21.9382 23.6355 23.3368 22.969 24.047 21.7562C24.7571 20.5434 24.6588 18.9919 23.7738 17.3967Z"
										fill="#B3B5B7"
									/>
									<path
										d="M13.1105 16.1176C12.6625 16.1176 12.291 15.7461 12.291 15.2981V9.83508C12.291 9.38711 12.6625 9.01562 13.1105 9.01562C13.5584 9.01562 13.9299 9.38711 13.9299 9.83508V15.2981C13.9299 15.7461 13.5584 16.1176 13.1105 16.1176Z"
										fill="#B3B5B7"
									/>
									<path
										d="M13.1121 19.6723C13.0466 19.6723 12.9701 19.6614 12.8936 19.6505C12.8281 19.6396 12.7625 19.6177 12.697 19.5849C12.6314 19.5631 12.5658 19.5303 12.5003 19.4866C12.4456 19.4429 12.391 19.3992 12.3364 19.3555C12.1397 19.1479 12.0195 18.8638 12.0195 18.5797C12.0195 18.2956 12.1397 18.0116 12.3364 17.804C12.391 17.7603 12.4456 17.7166 12.5003 17.6729C12.5658 17.6291 12.6314 17.5964 12.697 17.5745C12.7625 17.5417 12.8281 17.5199 12.8936 17.509C13.0357 17.4762 13.1886 17.4762 13.3197 17.509C13.3962 17.5199 13.4618 17.5417 13.5273 17.5745C13.5929 17.5964 13.6584 17.6291 13.724 17.6729C13.7786 17.7166 13.8333 17.7603 13.8879 17.804C14.0846 18.0116 14.2048 18.2956 14.2048 18.5797C14.2048 18.8638 14.0846 19.1479 13.8879 19.3555C13.8333 19.3992 13.7786 19.4429 13.724 19.4866C13.6584 19.5303 13.5929 19.5631 13.5273 19.5849C13.4618 19.6177 13.3962 19.6396 13.3197 19.6505C13.2542 19.6614 13.1777 19.6723 13.1121 19.6723Z"
										fill="#B3B5B7"
									/>
								</svg>
							</div>
							<div>
								<div class="text-lg font-medium text-[#D79917]">Location Missing</div>
								<div class="max-w-50 text-sm text-gray-500 sm:max-w-full">
									Please enter the location of the event before it starts
								</div>
							</div>
						</div>

						<!-- Registration Section -->
						<div
							class="my-[29px] flex max-w-2xl flex-col rounded-2xl border-[1.2px] border-white bg-white"
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
									<div class="relative flex items-center justify-between pl-8">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium text-gray-800">Salesperson Interview</span>
											<span
												class="rounded-full bg-[#D69712]/13 px-2 py-0.5 text-xs font-medium text-[#D69712]"
												>Require Approval</span
											>
										</div>
										<span class="text-sm text-gray-600">Free</span>
									</div>
									<div class="mt-3 pl-8">
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
									<div class="relative flex items-center justify-between pl-8">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium text-gray-800">Admin Module</span>
										</div>
										<span class="text-sm text-gray-600">Free</span>
									</div>
									<p class="mt-2 pl-8 text-xs text-gray-500">
										● Sales ended Oct 22, 2024, 11:59 PM
									</p>
								</div>
							</div>

							<!-- Sign-in Section -->
							<div class="mb-4 flex items-center gap-3 rounded-lg bg-white px-5 py-3">
								<div>
									<span class="block size-[23px] rounded-full bg-amber-400"></span>
								</div>
								<span class="text-sm text-gray-600"
									><strong class="mr-2 text-gray-800">SIGN-IN</strong> For one-click registration</span
								>
							</div>

							<!-- Request Button -->
							<div class="px-5 pb-5">
								<button
									class="w-full cursor-pointer rounded-lg bg-[#B93800] px-4 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#B93800]/80 active:bg-orange-950"
									on:click={handleRequestGetIn}
								>
									Request to Get In
								</button>
							</div>
						</div>

						<!-- About Event Section -->
						<div class="max-w-2xl rounded-2xl bg-white">
							<!-- Header with icon -->
							<div class="mb-6 flex items-center gap-2 border-b p-6">
								<span>
									<svg
										width="17"
										height="19"
										viewBox="0 0 17 19"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M10.0557 0C10.379 0 10.6475 0.30076 10.6475 0.663086C10.6473 1.02528 10.3789 1.3252 10.0557 1.3252H6.1123C2.47655 1.32523 1.18266 2.77488 1.18262 6.84863V12.1514C1.18266 16.2251 2.47655 17.6748 6.1123 17.6748H10.8447C14.4805 17.6748 15.7744 16.2251 15.7744 12.1514V7.73242C15.7745 7.37026 16.042 7.0695 16.3652 7.06934C16.6886 7.06934 16.957 7.37016 16.957 7.73242V12.1514C16.957 16.9498 15.1272 19 10.8447 19H6.1123C1.82981 19 5.18816e-05 16.9498 0 12.1514V6.84863C5.20014e-05 2.05022 1.82981 3.62207e-05 6.1123 0H10.0557Z"
											fill="#686D72"
										/>
										<path
											d="M10.0557 0C10.379 0 10.6475 0.30076 10.6475 0.663086C10.6473 1.02528 10.3789 1.3252 10.0557 1.3252H6.1123C2.47655 1.32523 1.18266 2.77488 1.18262 6.84863V12.1514C1.18266 16.2251 2.47655 17.6748 6.1123 17.6748H10.8447C14.4805 17.6748 15.7744 16.2251 15.7744 12.1514V7.73242C15.7745 7.37026 16.042 7.0695 16.3652 7.06934C16.6886 7.06934 16.957 7.37016 16.957 7.73242V12.1514C16.957 16.9498 15.1272 19 10.8447 19H6.1123C1.82981 19 5.18816e-05 16.9498 0 12.1514V6.84863C5.20014e-05 2.05022 1.82981 3.62207e-05 6.1123 0H10.0557Z"
											stroke="black"
										/>
										<path
											d="M9.82617 0.0527344C10.0469 -0.0530623 10.2992 0.00885952 10.4727 0.194336L16.7822 7.26367C16.9478 7.4492 17.0027 7.74088 16.9082 7.98828C16.8136 8.23564 16.6008 8.3954 16.3643 8.39551H13.209C10.5118 8.39544 9.46289 7.21951 9.46289 4.19727V0.662109C9.46302 0.397127 9.60543 0.1499 9.82617 0.0527344ZM10.6455 4.19727C10.6455 6.47718 11.1743 7.06929 13.209 7.06934H14.9365L10.6455 2.26172V4.19727Z"
											fill="#686D72"
										/>
										<path
											d="M9.82617 0.0527344C10.0469 -0.0530623 10.2992 0.00885952 10.4727 0.194336L16.7822 7.26367C16.9478 7.4492 17.0027 7.74088 16.9082 7.98828C16.8136 8.23564 16.6008 8.3954 16.3643 8.39551H13.209C10.5118 8.39544 9.46289 7.21951 9.46289 4.19727V0.662109C9.46302 0.397127 9.60543 0.1499 9.82617 0.0527344ZM10.6455 4.19727C10.6455 6.47718 11.1743 7.06929 13.209 7.06934H14.9365L10.6455 2.26172V4.19727Z"
											stroke="black"
										/>
										<path
											d="M9.26416 9.7207C9.58753 9.7207 9.85596 10.0215 9.85596 10.3838C9.85581 10.746 9.58744 11.0459 9.26416 11.0459H4.53271C4.20944 11.0459 3.94106 10.746 3.94092 10.3838C3.94092 10.0215 4.20935 9.7207 4.53271 9.7207H9.26416Z"
											fill="#686D72"
										/>
										<path
											d="M9.26416 9.7207C9.58753 9.7207 9.85596 10.0215 9.85596 10.3838C9.85581 10.746 9.58744 11.0459 9.26416 11.0459H4.53271C4.20944 11.0459 3.94106 10.746 3.94092 10.3838C3.94092 10.0215 4.20935 9.7207 4.53271 9.7207H9.26416Z"
											stroke="black"
										/>
										<path
											d="M7.68701 13.2559C8.01038 13.2559 8.27881 13.5566 8.27881 13.9189C8.27866 14.2811 8.01029 14.5811 7.68701 14.5811H4.53271C4.20944 14.5811 3.94106 14.2811 3.94092 13.9189C3.94092 13.5566 4.20935 13.2559 4.53271 13.2559H7.68701Z"
											fill="#686D72"
										/>
										<path
											d="M7.68701 13.2559C8.01038 13.2559 8.27881 13.5566 8.27881 13.9189C8.27866 14.2811 8.01029 14.5811 7.68701 14.5811H4.53271C4.20944 14.5811 3.94106 14.2811 3.94092 13.9189C3.94092 13.5566 4.20935 13.2559 4.53271 13.2559H7.68701Z"
											stroke="black"
										/>
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
					</div>
				</div>
			</div>
		</div>
	</div>
</div>