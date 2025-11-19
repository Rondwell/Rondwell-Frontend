<script lang="ts">
	import { colors } from '$lib/utils/colors';
	import Icon from '@iconify/svelte';

	export let open = false;

	$: activeTab = 'suggestions'; // enter | suggestions
	let email = '';

	let subscribers = [
		{
			name: 'Everyone',
			number: 2,
			color: 'gray'
		},
		{
			name: 'Main',
			number: 0,
			color: 'green'
		},
		{
			name: 'Newsletter',
			number: 0,
			color: 'blue'
		},
		{
			name: 'VIP',
			number: 0,
			color: 'purple'
		}
	];

	let emailList = [
		{
			name: 'Everyone',
			email: 'everyone@example.com',
			initial: 'E',
			selected: false,
			source: 'Everyone'
		},
		{
			name: 'Main',
			email: 'main@example.com',
			initial: 'M',
			selected: false,
			source: 'Everyone'
		},
		{
			name: 'John Nebraska',
			email: 'megaxenome@gmail.com',
			initial: 'J',
			selected: false,
			inEvent: true,
			source: 'suggestions'
		}
	];

	// Add manually entered email
	function addEmail() {
		if (email.trim()) {
			emailList = [
				...emailList,
				{
					email,
					name: '',
					initial: email[0].toUpperCase(),
					selected: true,
					source: 'entered'
				}
			];
			email = '';
		}
	}

	// Select all visible items in suggestions tab
	function selectAllSuggestions(item: any) {
		emailList = emailList.map((e) => (e.source === item ? { ...e, selected: true } : e));
	}

	// Counting selected
	$: selectedCount = emailList.filter((e) => e.selected).length;

	$: step = 1;

	let customMessage = '';
	let rsvpLink = 'rndwell.com/dp7ikj';

	let searchQuery = '';

	function toggleSelect(item: any) {
		emailList = emailList.map((e) => (e === item ? { ...e, selected: !e.selected } : e));
	}

	const weeklyLimit = 15;
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
		<div
			class="flex h-full max-h-140 w-full max-w-3xl flex-col rounded-lg bg-[#F8F8F9] shadow-lg md:max-h-120"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 p-3">
				<div class="flex h-full w-full max-w-85 items-center justify-between">
					<h2 class="font-semibold">Invite Attendee</h2>

					{#if activeTab === 'limit_details'}
						<div class="hidden items-center gap-2 md:flex">
							<button
								on:click={() => (activeTab = 'suggestions')}
								class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
							>
								<img src="/arrow-right.svg" alt="arrow back" />
							</button>

							Invite Limit
						</div>
					{/if}
				</div>

				<div class="flex items-center gap-5">
					{#if step === 1}
						<button
							on:click={() => (activeTab = 'limit_details')}
							class="flex w-[120px] items-center gap-2 rounded-full border-2 px-3 py-1 {activeTab ===
							'limit_details'
								? 'border-black'
								: 'border-[#E5E6E6]'}"
						>
							<span class="h-[22px] w-[22px] rounded-full border-3 border-[#E5E6E6]"></span>
							<p class=" text-[#A8A9A9]">
								{weeklyLimit - emailList.filter((e) => e.selected).length} Left
							</p>
						</button>
					{/if}
					<!-- Desktop Close -->
					<button
						class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
						on:click={() => (open = false)}
					>
						<Icon icon="mdi:close" class="text-lg font-bold" />
					</button>
				</div>
			</div>

			<div class="custom-scrollbar flex-1 overflow-y-auto">
				{#if step === 1}
					<div class="flex">
						<!-- Sidebar -->
						<aside class="hidden h-full w-80 flex-col justify-between px-3 py-1 md:flex">
							<div class="w-full space-y-1">
								<button
									on:click={() => (activeTab = 'suggestions')}
									class="flex w-full items-center gap-1 rounded px-3 py-2 text-left text-[16px] text-[#A5A6A6]
                 			{activeTab === 'suggestions' ? 'bg-[#EBEBEB] font-medium' : ''}"
								>
									<Icon icon="mdi:sparkles" />
									Suggestions
								</button>

								<button
									on:click={() => (activeTab = 'enter')}
									class="flex w-full items-center gap-1 rounded px-3 py-2 text-left text-[16px] text-[#A5A6A6]
                 {activeTab === 'enter' ? 'bg-[#EBEBEB] font-medium' : ''}"
								>
									<Icon icon="mdi:at" class="h-4 w-4" />
									Enter Emails
								</button>
							</div>
							<div class="mt-3 space-y-3 border-t pt-3">
								<p class="text-sm text-[#A5A6A6]">subscribers</p>
								<div class="flex flex-col gap-1">
									{#each subscribers as sub}
										<button
											on:click={() => (activeTab = sub.name)}
											class="flex w-full items-center justify-between rounded px-3 py-2 {activeTab ===
											sub.name
												? 'bg-[#EBEBEB] font-medium'
												: ''}"
										>
											<div class="flex items-center gap-2">
												<p class="h-3 w-3 rounded-full" style="background-color: {sub.color};"></p>
												<p class="text-[#3E4041]">{sub.name}</p>
											</div>
											<p class="text-[#A6A7A7]">{sub.number}</p>
										</button>
									{/each}
								</div>
								<p class="border-t pt-3 text-[#A5A6A6]">
									Events: <span class="text-gray-800">Your first event</span>
								</p>
							</div>
						</aside>

						<!-- Main Panel -->
						<main
							class="custom-scrollbar flex w-full flex-col gap-4 overflow-y-auto border-l px-3 py-3"
						>
							<!-- Mobile Tabs -->
							<div class="custom-scrollbar flex gap-2 overflow-x-auto md:hidden">
								<div class="flex w-full gap-2">
									<button
										on:click={() => (activeTab = 'suggestions')}
										class="flex flex-shrink-0 items-center gap-1 rounded px-3 py-2 text-left text-[16px] text-[#A5A6A6]
                 						{activeTab === 'suggestions' ? 'bg-[#EBEBEB] font-medium' : ''}"
									>
										<Icon icon="mdi:sparkles" />
										Suggestions
									</button>

									<button
										on:click={() => (activeTab = 'enter')}
										class="flex flex-shrink-0 items-center gap-1 rounded px-3 py-2 text-left text-[16px] text-[#A5A6A6]
                 						{activeTab === 'enter' ? 'bg-[#EBEBEB] font-medium' : ''}"
									>
										<Icon icon="mdi:at" class="h-4 w-4" />
										Enter Emails
									</button>

									{#each subscribers as sub}
										<button
											on:click={() => (activeTab = sub.name)}
											class="flex flex-shrink-0 items-center justify-between rounded px-3 py-2 {activeTab ===
											sub.name
												? 'bg-[#EBEBEB] font-medium'
												: ''}"
										>
											<div class="flex items-center gap-2">
												<p class="h-3 w-3 rounded-full" style="background-color: {sub.color};"></p>
												<p class="text-[#3E4041]">{sub.name}</p>
											</div>
										</button>
									{/each}
								</div>
							</div>
							<div>
								<!-- TAB: ENTER EMAILS -->
								{#if activeTab === 'enter'}
									<div class="space-y-3">
										<!-- Add Email -->
										<label for="email" class="block text-sm font-medium text-[#666769]"
											>Add Emails</label
										>
										<div class="flex gap-1">
											<input
												type="email"
												placeholder="Paste or enter email here"
												bind:value={email}
												class="flex-1 rounded-md border bg-[#EFF0F0] px-3 py-2 text-sm focus:ring-0 focus:outline-none"
											/>
											<button
												disabled={!email.trim()}
												on:click={addEmail}
												class="rounded-md {!email.trim()
													? 'bg-[#EFF0F0] text-[#666769]'
													: 'bg-[#666769] text-white'} px-4 py-2 text-sm"
											>
												Add
											</button>
										</div>

										{#if emailList.filter((e) => e.source === 'entered').length > 0}
											<!-- Added Email List -->
											<div class="space-y-2">
												{#each emailList.filter((e) => e.source === 'entered') as item}
													<div class="flex items-center justify-between">
														<div class="flex items-center gap-2">
															<div
																class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-[#9A9B9B]"
															>
																{item.initial}
															</div>
															<span class="text-sm">{item.email}</span>
														</div>

														<button
															class="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white"
														>
															<Icon icon="mdi:tick" class="text-xl" />
														</button>
													</div>
												{/each}
											</div>
										{:else}
											<div class="mt-5 space-y-2">
												<p class="block text-sm font-medium text-[#666769]">Import CSV</p>

												<div
													class="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-[#EFF0F0] p-6 text-center"
												>
													<img src="/csv-icon.svg" alt="" />
													<p class="text-lg text-[#666769]">Import CSV File</p>
													<p class="text-sm text-gray-400">
														Drop file or click here to choose file.
													</p>
												</div>

												<button class="flex items-center gap-1 text-sm text-gray-400">
													<img src="/document-download.svg" alt="" />
													Download CSV Template
												</button>
											</div>
										{/if}
									</div>
								{:else if activeTab === 'limit_details'}
									<div>
										<div class="mb-3 flex items-center gap-2">
											<img src="/tech-icon.svg" class="h-full w-8" alt="avatar" />
											<div>
												<div class="text-md font-semibold">John Colletion</div>
												<div class="text-xs text-[#ABADAD]">Not Verified</div>
											</div>
										</div>

										<div class="mb-2 text-sm">
											You can send {weeklyLimit} invites from this calendar each week.
										</div>

										<!-- Progress -->
										<div class="space-y-2">
											<div class="flex justify-between text-sm text-gray-600">
												<span>{emailList.filter((e) => e.selected).length} Selected</span>
												<span
													>{weeklyLimit - emailList.filter((e) => e.selected).length} Available</span
												>
											</div>
											<div class="h-2 w-full rounded bg-gray-200">
												<div
													class="h-2 rounded bg-blue-500"
													style="width: {(emailList.filter((e) => e.selected).length /
														weeklyLimit) *
														100}%;"
												></div>
											</div>
										</div>

										<div class="border-t pt-4">
											<!-- Ways to Increase Limit -->
											<div class="font-medium">How to increase your invite limit</div>

											<div class="mt-3 space-y-3 rounded-lg bg-[#FDFDFD] p-3">
												<!-- Verify Calendar -->
												<div
													class="flex flex-col justify-between gap-2 md:flex-row md:items-center"
												>
													<div class="flex items-center gap-1">
														<img src="/verify.svg" alt="" />
														<div>
															<div class="font-medium">Verify Calendar</div>
															<div class="text-sm font-light text-[#7F766A]">
																Verify to increase your weekly limit to 500
															</div>
														</div>
													</div>

													<button
														class="w-full rounded-md bg-gray-800 px-4 py-2 text-white md:w-fit"
													>
														Verify
													</button>
												</div>

												<!-- Upgrade -->
												<div
													class="flex flex-col justify-between gap-2 border-t pt-3 md:flex-row md:items-center"
												>
													<div class="flex items-center gap-1">
														<img src="/upgrade-icon.svg" alt="" />
														<div>
															<div class="font-medium">Upgrade to Rondwell Plus</div>
															<div class="text-sm font-light text-[#7F766A]">
																Get 5,000 to 100,000 sends per week
															</div>
														</div>
													</div>
													<button
														class="w-full rounded-md bg-gray-800 px-4 py-2 text-white md:w-fit"
													>
														Upgrade
													</button>
												</div>
											</div>
										</div>
									</div>
								{:else}
									<div class="space-y-3">
										<!-- Search -->
										<div class="relative mb-4 w-full">
											<input
												type="text"
												bind:value={searchQuery}
												placeholder={emailList.some((e) => e.source === 'suggestions')
													? 'Search in Suggestions'
													: 'Search in "All Subscribers" '}
												class="h-[43px] w-full rounded-lg bg-[#EFF0F0] py-2 pr-4 pl-10 text-[#b5b6b6] focus:ring-0 focus:outline-none"
											/>
											<span class="absolute top-2.5 left-3 text-gray-400">
												<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
											</span>
										</div>

										<div
											class="flex items-center justify-between border-b pb-2 text-sm text-gray-500"
										>
											<span>{emailList.filter((e) => e.source === activeTab).length} People</span>
											<button on:click={() => selectAllSuggestions(activeTab)} class=""
												>Select All</button
											>
										</div>

										{#if emailList.filter((e) => e.source === activeTab).length > 0}
											<!-- Suggestions list -->
											<div class="space-y-2">
												{#each emailList.filter((e) => e.source === activeTab) as person}
													<button
														class="flex w-full cursor-pointer items-center justify-between"
														on:click={() => toggleSelect(person)}
													>
														<div class="flex items-center gap-2">
															<img src="/face-1.svg" alt="" class="h-7 w-7" />

															<div
																class="flex flex-col items-start text-sm {person.selected
																	? ''
																	: 'text-[#D3D3D3]'}"
															>
																<span class="text-sm font-medium">{person.name}</span>
																<span class="text-xs {person.selected ? 'text-[#A9AAAA]' : ''}"
																	>{person.email}</span
																>
															</div>
														</div>

														<div class="flex items-center gap-2">
															{#if person.selected}
																<div
																	class="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white"
																>
																	<Icon icon="mdi:tick" class="text-xl" />
																</div>
															{/if}

															<span
																class="rounded px-2 py-1 text-xs {person.selected
																	? 'bg-[#F1F1F1] text-[#969798]'
																	: 'bg-[#EFEFEF] text-[#D3D3D3]'}">In Event</span
															>
														</div>
													</button>
												{/each}
											</div>
										{:else}
											<div class="flex h-full flex-col items-center justify-center">
												<img src="/profile-2user.svg" alt="" />
												<p class="text-center text-[#646568]">No Result found.</p>
												<p class="text-[#BABBBB]">
													Search for someone else or <span class="text-pink-600"
														>add people by email.
													</span>
												</p>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</main>
					</div>
				{:else if step === 2}
					<div class="flex flex-col gap-2 md:flex-row">
						<aside class="flex w-80 flex-col gap-2 px-3 py-1">
							<!-- Inviting count -->
							<p class="mt-2 text-sm text-gray-500">
								Inviting {emailList.filter((e) => e.selected).length} People
							</p>

							<!-- Email List -->
							<div class="space-y-2">
								{#each emailList.filter((e) => e.selected) as item}
									<div class="flex items-center gap-2">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium"
										>
											{item.initial}
										</div>
										<span class="text-sm">{item.email}</span>
									</div>
								{/each}
							</div>
						</aside>

						<div class="flex flex-col border-l p-4">
							<div class="mb-4 rounded-md bg-[#FEFEFE]">
								<!-- Invite Message -->
								<p class="text-md p-4 leading-relaxed">
									Hi, JOHN NEWNESS MEDOC invites you to join Megazee Party.
								</p>
								<textarea
									placeholder="Add a custom message here..."
									bind:value={customMessage}
									class="h-24 w-full resize-none bg-[#F5F5F5] px-3 py-2 text-sm focus:ring-0 focus:outline-0"
								></textarea>

								<!-- RSVP Link -->
								<p class="text-md p-4 font-medium">RSVP: {rsvpLink}</p>
							</div>

							<!-- Info note -->
							<div class="flex items-start gap-1 text-xs">
								<div
									class="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#EFF0F0]"
								>
									<svg
										width="20"
										height="20"
										viewBox="0 0 40 40"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											opacity="0.4"
											d="M34.2712 21.6511C34.9125 21.6511 35.4222 21.1249 35.4222 20.4672V19.0203C35.4222 12.5583 33.449 10.6016 27.0035 10.6016H16.6445V14.5972C17.2858 14.5972 17.812 15.1233 17.812 15.7646V20.1713C17.812 20.8125 17.2858 21.3387 16.6445 21.3387V25.4658C17.2858 25.4658 17.812 25.992 17.812 26.6333V31.0399C17.812 31.6812 17.2858 32.2074 16.6445 32.2074V36.1701H27.0035C33.449 36.1701 35.4222 34.1969 35.4222 27.7514C35.4222 27.1101 34.9125 26.5839 34.2712 26.5839C32.89 26.5839 31.7883 25.4823 31.7883 24.1175C31.7883 22.7528 32.89 21.6511 34.2712 21.6511Z"
											fill="#737577"
										/>
										<path
											opacity="0.4"
											d="M30.0147 11.049H13.418L18.7676 5.6625C23.1313 1.26875 25.3223 1.26875 29.686 5.6625L30.7815 6.76553C29.6313 7.92371 29.3574 9.63341 30.0147 11.049Z"
											stroke="#737577"
											stroke-width="2.36776"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M15.4785 15.7716V20.1783C15.4785 20.8195 16.0047 21.3457 16.6459 21.3457V25.4728C16.0047 25.4728 15.4785 25.999 15.4785 26.6403V31.0469C15.4785 31.6882 16.0047 32.2144 16.6459 32.2144V36.1771H12.4695C6.02391 36.1771 4.05078 34.2039 4.05078 27.7584V27.0513C4.05078 26.3936 4.56051 25.8839 5.20178 25.8839C6.58297 25.8839 7.68463 24.7658 7.68463 23.401C7.68463 22.0363 6.58297 20.9182 5.20178 20.9182C4.56051 20.9182 4.05078 20.4085 4.05078 19.7507V19.0437C4.05078 12.5817 6.02391 10.625 12.4695 10.625H16.6295V14.6206C16.0047 14.6206 15.4785 15.1468 15.4785 15.7716Z"
											fill="#737577"
										/>
									</svg>
								</div>
								<div>
									<p>We will send guests an invite link to register for the event.</p>
									<p class="text-[#AFB1B1]">
										Guests will be automatically approved when they complete their registration.
									</p>
								</div>
							</div>

							<!-- Small bottom text -->
							<p class="mt-4 border-t pt-4 text-xs leading-tight text-gray-500">
								You can bypass registration and payment by adding guests directly to the guest list.
								<span class="text-pink-600">Add Guests Directly</span>
							</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Bottom Footer -->
			<div class="max flex h-15 items-center justify-between border-t border-gray-200 p-3">
				{#if step === 1}
					<span class="text-[#B9BABA]">{selectedCount} Selected</span>
				{:else if step === 2}
					<button
						on:click={() => (step = 1)}
						class="flex items-center gap-1 rounded-md border bg-gray-100 px-4 py-2 text-sm text-[#626365]"
					>
						<img src="/arrow-right.svg" alt="" />
						Back
					</button>
				{/if}

				<button
					on:click={() => (step = 2)}
					class="flex items-center gap-1 rounded-md px-6 py-2 text-white {selectedCount === 0
						? 'bg-[#969798]'
						: 'bg-gray-800'}"
					disabled={selectedCount === 0}
				>
					{step === 1 ? 'Next' : 'Send Invites'}
					<svg
						width="11"
						height="12"
						viewBox="0 0 11 12"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M0.871094 0.841797C1.5721 0.157615 2.58659 0.00457658 3.45703 0.464844L9.39453 3.58984L9.52832 3.66602C10.1806 4.06709 10.5811 4.77826 10.5811 5.55273C10.5809 6.32719 10.1807 7.0385 9.52832 7.43945L9.39453 7.51465L3.45703 10.6387L3.45801 10.6396C3.12189 10.8189 2.76691 10.9033 2.41211 10.9033C1.84716 10.9033 1.30127 10.6826 0.871094 10.2637V10.2627C0.16927 9.57763 -0.000216478 8.56312 0.4375 7.6875L1.26758 6.02734C1.41356 5.73526 1.41438 5.38069 1.26758 5.08203L0.4375 3.41699C-0.000180173 2.54137 0.169252 1.52684 0.871094 0.841797ZM2.41797 1.36426C2.12646 1.36426 1.86586 1.50002 1.68457 1.67676L1.68359 1.67773C1.41317 1.93952 1.22744 2.3971 1.47754 2.90234L2.30664 4.5625L2.30762 4.56348C2.61652 5.18723 2.61666 5.92317 2.30762 6.54688H2.30664L1.47754 8.20703L1.47656 8.20801C1.22284 8.71154 1.41204 9.16866 1.68359 9.43164C1.95736 9.69658 2.41563 9.87688 2.91504 9.61426L8.85254 6.48926L8.97852 6.41211C9.25687 6.21531 9.41791 5.90557 9.41797 5.55762C9.41797 5.16005 9.20777 4.81236 8.85254 4.62598L8.85156 4.625L2.91406 1.49023V1.48926C2.73942 1.3978 2.57161 1.36433 2.41797 1.36426Z"
							fill="white"
							stroke="white"
							stroke-width="0.394627"
						/>
						<rect
							x="5.32622"
							y="6.17388"
							width="3.55164"
							height="1.18388"
							rx="0.59194"
							transform="rotate(-180 5.32622 6.17388)"
							fill="white"
							stroke="white"
							stroke-width="0.394627"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
