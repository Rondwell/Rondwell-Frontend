<script lang="ts">
	import Icon from '@iconify/svelte';

	let activeTab = 'email';
	let searchQuery = '';

	export let open = false;
	export let participant = 'Speaker';
	let participantLowerCase = participant.toLocaleLowerCase();

	let selectedS: number[] = [];

	function toggleSelect(id: number) {
		if (selectedS.includes(id)) {
			selectedS = selectedS.filter((s) => s !== id);
		} else {
			selectedS = [...selectedS, id];
		}
	}

	const tabs = [
		{ id: 'email', label: 'Invite by Email' },
		{ id: 'rondwell', label: `Add From Rondwell ${participant}` },
		{ id: 'manual', label: 'Manual Add' },
		{ id: 'link', label: 'Generate Invitation Link' }
	];
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div
			class="animate-fadeIn max-h-180 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 shadow-xl md:max-h-150 md:p-6"
		>
			<!-- Modal Header -->
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<svg
							width="32"
							height="32"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M19.2529 25.4017L21.2796 27.4283L25.3329 23.375"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M16.2135 14.4907C16.0801 14.4774 15.9201 14.4774 15.7735 14.4907C12.6001 14.3841 10.0801 11.7841 10.0801 8.58406C10.0668 5.3174 12.7201 2.66406 15.9868 2.66406C19.2535 2.66406 21.9068 5.3174 21.9068 8.58406C21.9068 11.7841 19.3735 14.3841 16.2135 14.4907Z"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M15.9867 29.077C13.5601 29.077 11.1467 28.4636 9.30672 27.237C6.08005 25.077 6.08005 21.557 9.30672 19.4103C12.9734 16.957 18.9867 16.957 22.6534 19.4103"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				</div>

				<h2 class="text-xl font-semibold text-gray-800">Add {participant} to Megaaxe Party</h2>
				<p class="text-sm text-gray-500">Provide details of {participantLowerCase} to proceed.</p>
				<button
					class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
					on:click={() => (open = false)}
				>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<!-- Tabs -->
			<div class="mt-6 overflow-hidden border-t pt-6">
				<div
					class="custom-scrollbar flex items-center gap-2 overflow-x-auto rounded-lg bg-white p-1 shadow-xs"
				>
					{#each tabs as t}
						<button
							class="flex-shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-all
					{activeTab === t.id ? 'bg-[#EBECED] text-black' : ' text-gray-400 '}"
							on:click={() => (activeTab = t.id)}
						>
							{t.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- TAB CONTENT -->
			<div class="custom-scrollbar mt-6 max-h-80 overflow-y-auto rounded-lg border p-4 md:h-60">
				<!-- Invite by Email -->
				{#if activeTab === 'email'}
					<div>
						<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
							Send a direct invitation to a {participantLowerCase}
							<img src="/warning-icon.svg" alt="" />
						</h3>

						<div class="mt-4 flex w-full flex-wrap items-center gap-3">
							<div class="">
								<label class="flex text-gray-900" for="first_name">
									{participant}'s First Name <span class="text-blue-600">*</span></label
								>
								<input
									type="text"
									placeholder="James"
									class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
								/>
							</div>
							<div class="">
								<label class="flex text-gray-900" for="first_name">
									{participant}'s Last Name <span class="text-blue-600">*</span></label
								>
								<input
									type="text"
									placeholder="Brown"
									class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
								/>
							</div>
							<div class="">
								<label class="flex text-gray-900" for="first_name">
									{participant}'s Email Address <span class="text-blue-600">*</span></label
								>
								<input
									type="email"
									placeholder="jamesbrown@email.com"
									class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
								/>
							</div>
						</div>

						<div class="mt-6">
							<label class="flex text-gray-900" for="first_name">
								Personal Message <span class="text-blue-600">*</span>
								<span class="ml-1 text-gray-700">(Optional)</span></label
							>
							<textarea
								placeholder="Add a personalized note for the {participantLowerCase}..."
								rows="4"
								class="mt-2 w-full resize-none rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
							></textarea>
							<p class="flex items-center gap-1 text-xs font-light text-gray-500">
								<img src="/information-fill.svg" alt="" />
								You can describe your personal message briefly.
							</p>
						</div>
					</div>
				{/if}

				<!-- Rondwell Participants -->
				{#if activeTab === 'rondwell'}
					<div>
						<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
							Browse existing {participantLowerCase} profiles on Rondwell
							<img src="/warning-icon.svg" alt="" />
						</h3>
						<div class="mb-4 flex items-center gap-2">
							<div class="relative w-full max-w-xl">
								<input
									type="text"
									bind:value={searchQuery}
									placeholder="Search {participantLowerCase}s by name, session, or status..."
									class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
								/>
								<span class="absolute top-2.5 left-3 text-gray-400">
									<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
								</span>
							</div>

							<button
								class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
							>
								<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
								Top Related
							</button>
						</div>

						<div class="divide-y rounded-lg border">
							<!-- Example participant rows -->
							{#each [1, 2] as s}
								<div
									class="flex items-start justify-between gap-2 p-3 hover:bg-gray-50 md:flex-row md:items-center"
								>
									<div class="flex flex-col gap-2 md:flex-row md:items-center">
										<div class="flex items-center gap-2">
											<button
												on:click={() => toggleSelect(s)}
												class="flex h-5 w-5 items-center justify-center rounded-full border-2 {selectedS.includes(
													s
												)
													? 'bg-black'
													: 'border-gray-300'}"
											>
												{#if selectedS.includes(s)}
													<Icon icon="mdi:tick" class="text-2xl text-white" />
												{/if}
											</button>
											<div class="flex items-center gap-2">
												<img src="/face-2.svg" alt="" class="h-8 w-8 rounded-full" />
												<div class="font-medium">John Doesonreen</div>
											</div>
										</div>

										<div
											class="max-w-[250px] truncate text-sm text-[#B6B7B7] md:max-w-[150px] lg:max-w-[250px]"
										>
											UX Designer, 8+ years of experience in design…
										</div>
									</div>

									<div class="flex flex-col items-end gap-2 sm:flex-row md:items-center">
										<button class="rounded-md bg-gray-200 px-3 py-1 text-gray-400"> Expert </button>
										<img src="/delete-icon.svg" alt="bin icon" class="h-4 w-4" />
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Manual Add -->
				{#if activeTab === 'manual'}
					<div>
						<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
							Add a {participantLowerCase} manually without sending an invitation
							<img src="/warning-icon.svg" alt="" />
						</h3>

						<div class="relative h-20 w-20">
							<img
								src="/face-1.svg"
								alt="Profile"
								class="h-full w-full rounded-full object-cover"
							/>
							<div class="absolute -right-1 -bottom-1 cursor-pointer">
								<svg
									width="31"
									height="32"
									viewBox="0 0 31 32"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M28.6875 13.0528H24.0816C20.3044 13.0528 17.2284 9.97687 17.2284 6.19969V1.59375C17.2284 0.717187 16.5113 0 15.6347 0H8.87719C3.96844 0 0 3.1875 0 8.87719V22.9978C0 28.6875 3.96844 31.875 8.87719 31.875H21.4041C26.3128 31.875 30.2812 28.6875 30.2812 22.9978V14.6466C30.2812 13.77 29.5641 13.0528 28.6875 13.0528ZM14.3916 18.3759C14.1525 18.615 13.8497 18.7266 13.5469 18.7266C13.2441 18.7266 12.9413 18.615 12.7022 18.3759L11.5547 17.2284V23.9062C11.5547 24.5597 11.0128 25.1016 10.3594 25.1016C9.70594 25.1016 9.16406 24.5597 9.16406 23.9062V17.2284L8.01656 18.3759C7.55438 18.8381 6.78937 18.8381 6.32719 18.3759C5.865 17.9137 5.865 17.1488 6.32719 16.6866L9.51469 13.4991C9.62625 13.4034 9.73781 13.3237 9.86531 13.26C9.89719 13.2441 9.945 13.2281 9.97688 13.2122C10.0725 13.1803 10.1681 13.1644 10.2797 13.1484C10.3275 13.1484 10.3594 13.1484 10.4072 13.1484C10.5347 13.1484 10.6622 13.1803 10.7897 13.2281C10.8056 13.2281 10.8056 13.2281 10.8216 13.2281C10.9491 13.2759 11.0766 13.3716 11.1722 13.4672C11.1881 13.4831 11.2041 13.4831 11.2041 13.4991L14.3916 16.6866C14.8537 17.1488 14.8537 17.9137 14.3916 18.3759Z"
										fill="#292D32"
									/>
									<path
										d="M23.7969 10.8527C25.3109 10.8687 27.4147 10.8687 29.2156 10.8687C30.1241 10.8687 30.6022 9.80086 29.9647 9.16336C27.6697 6.85243 23.5578 2.69274 21.1991 0.33399C20.5456 -0.319448 19.4141 0.126802 19.4141 1.03524V6.59743C19.4141 8.9243 21.3903 10.8527 23.7969 10.8527Z"
										fill="#292D32"
									/>
								</svg>
							</div>
						</div>

						<div class="mt-6 flex w-full flex-wrap items-center gap-3">
							<div class="">
								<label class="flex text-gray-900" for="first_name">
									{participant}'s First Name <span class="text-blue-600">*</span></label
								>
								<input
									type="text"
									placeholder="James"
									class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
								/>
							</div>
							<div class="">
								<label class="flex text-gray-900" for="first_name">
									{participant}'s Last Name <span class="text-blue-600">*</span></label
								>
								<input
									type="text"
									placeholder="Brown"
									class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
								/>
							</div>
							<div class="">
								<label class="flex text-gray-900" for="titl">
									{participant}'s Title <span class="text-blue-600">*</span></label
								>
								<input
									type="text"
									placeholder="Mr."
									class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
								/>
							</div>
						</div>

						<div class="mt-6">
							<label class="flex text-gray-900" for="first_name">
								{participant} Bio <span class="text-blue-600">*</span>
								<span class="ml-1 text-gray-700">(Optional)</span></label
							>
							<textarea
								placeholder="Add a personalized note for the {participantLowerCase}..."
								rows="4"
								class="mt-2 w-full resize-none rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
							></textarea>
							<p class="flex items-center gap-1 text-xs font-light text-gray-500">
								<img src="/information-fill.svg" alt="" />
								You can describe your personal message briefly.
							</p>
						</div>

						<div class="mt-6 flex w-full flex-wrap items-center gap-3">
							<div class="">
								<label class="flex text-gray-900" for="titl">
									LinkedIn <span class="text-blue-600">*</span></label
								>
								<div class="mt-2 flex items-center">
									<div class="rounded-l-sm border-r bg-[#FFFFFF] p-2 text-gray-600 shadow-xs">
										linkedin.com
									</div>
									<input
										placeholder="Username"
										class="rounded-r-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
									/>
								</div>
							</div>
							<div class="">
								<label class="flex text-gray-900" for="titl">
									X <span class="text-blue-600">*</span></label
								>
								<div class="mt-2 flex items-center">
									<div class="rounded-l-sm border-r bg-[#FFFFFF] p-2 text-gray-600 shadow-xs">
										twitter.com
									</div>
									<input
										placeholder="Username"
										class="rounded-r-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
									/>
								</div>
							</div>
							<div class="">
								<label class="flex text-gray-900" for="titl">
									Website URL <span class="text-blue-600">*</span></label
								>
								<div class="mt-2 flex items-center">
									<div class="rounded-l-sm border-r bg-[#FFFFFF] px-3 py-2 text-gray-600 shadow-xs">
										https
									</div>
									<input
										placeholder="www.example.com"
										class="rounded-r-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"
									/>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-6 flex items-center gap-2">
				<button
					on:click={() => (open = false)}
					class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs"
				>
					cancel
				</button>

				<button
					on:click={() => (open = false)}
					class="rounded-md bg-black px-4 py-2 text-white shadow-xs"
				>
					Send Invitation
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.input {
		@apply w-full rounded-lg border px-3 py-2 text-sm;
	}
	.btn {
		@apply rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900;
	}
	.animate-fadeIn {
		animation: fade 0.15s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
