<script lang="ts">
	import { colors } from '$lib/utils/colors';

	type EventData = {
		name: string;
		description: string;
		tintColor: string;
		publicUrl: string;
		location: {
			type: 'City' | 'Global';
			city: string;
		};
	};

	let eventData: EventData = {
		name: '',
		description: '',
		tintColor: '#6B7280',
		publicUrl: '',
		location: { type: 'City', city: 'Lagos' }
	};

	function selectTintColor(color: string) {
		eventData.tintColor = color;
	}

	let search = '';
	let activeTab = 'City';

	type Location = { name: string; region: string };

	const cityLocations: Location[] = [
		{ name: 'Lagos', region: 'Portugal' },
		{ name: 'Laguna Beach', region: 'CA, USA' }
	];

	const globalLocations: Location[] = [
		{ name: 'Laguna Beach', region: '' },
		{ name: 'Berlin', region: 'Germany' }
	];

	let selectedLocations: Location[] = [];
	let filteredLocations: Location[] = [];

	$: selectedLocations = activeTab === 'City' ? cityLocations : globalLocations;

	$: filteredLocations = search
		? selectedLocations.filter((loc) => loc.name.toLowerCase().startsWith(search.toLowerCase()))
		: selectedLocations;

	function selectLocation(loc: Location) {
		// dispatch('select', loc);
		// dispatch('close');
	}

	function handlePublicUrlInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		eventData.publicUrl = `ron.d/${value}`;
	}
</script>

<div class="w-full space-y-8">
	<!-- HEADER CARD -->
	<div class="rounded-lg">
		<h1 class="mb-4 text-xl font-medium sm:text-3xl">Create Collection</h1>

		<div class="relative mb-6 rounded-t-lg bg-[#FDFDFD]">
			<div class="h-[191px] rounded-t-lg bg-[#D8D8DD]"></div>
			<button
				class="absolute top-2 right-3 rounded-md bg-[#E4E4E5] px-3 py-2 text-sm font-medium text-[#5D5E61]"
			>
				Change Cover
			</button>
			<img src="/edit-cover-photo.svg" alt="" class="absolute bottom-28 left-5 w-14" />
			<div class="mt-8 ml-4 w-full">
				<input
					type="text"
					placeholder="Collection name"
					bind:value={eventData.name}
					class="h-12 w-full px-4 py-2 text-3xl font-semibold focus:ring-0 focus:outline-none"
				/>
				<div class="mt-2 border-t">
					<input
						type="text"
						placeholder="Add a short description"
						bind:value={eventData.description}
						class="h-12 w-full px-4 py-2 focus:ring-0 focus:outline-none"
					/>
				</div>
			</div>
		</div>

		<!-- CUSTOMIZATION -->

		<div class="mb-6 rounded-lg bg-[#FDFDFD] p-4">
			<h2 class="mb-3 text-2xl font-semibold">Customization</h2>
			<div class="flex flex-col justify-between lg:flex-row">
				<div>
					<!-- Tint Color -->
					<div class="mb-4">
						<label for="color" class="mb-2 block text-sm font-medium text-gray-700"
							>Tint Color</label
						>
						<div class="flex flex-wrap items-center justify-start gap-3">
							{#each colors as color}
								<button
									type="button"
									class="h-8 w-8 rounded-full border-2"
									style="background-color: {color.bg};"
									class:border-black={eventData.tintColor === color.bg}
									on:click={() => selectTintColor(color.bg)}
									aria-label={`Select color ${color.bg}`}
								></button>
							{/each}
						</div>
					</div>

					<!-- Public URL -->
					<div class="mb-4">
						<label for="" class="mb-2 block text-sm font-medium text-gray-700">Public URL</label>
						<div class="flex max-w-xl items-center">
							<span class="w-20 rounded-l-md bg-[#F4F4F4] p-3 text-sm">ron.d/</span>
							<input
								type="text"
								placeholder="some calendar"
								bind:value={eventData.publicUrl}
								on:input={handlePublicUrlInput}
								class="flex-1 rounded-r-md border border-gray-300 bg-[#FFFFFF] p-3 text-sm focus:ring-0 focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<!-- Location -->
				<div>
					<div class="mb-4">
						<label for="location" class="mb-2 block text-sm font-medium text-gray-700"
							>Location</label
						>

						<div class="relative w-full overflow-hidden rounded-lg bg-white shadow-lg lg:w-[600px]">
							<!-- Tabs -->
							<div
								class="mb-3 flex h-[175px] w-full flex-col justify-between gap-2 p-2"
								style="background: url('/map.png'); background-size: cover;"
							>
								<div class="h-[40px] w-fit rounded bg-[#DCDCDC] p-1 text-[#A1A2A2]">
									<button
										class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${
											activeTab === 'City' ? 'bg-white text-black' : ''
										}`}
										on:click={() => (activeTab = 'City')}
									>
										City
									</button>
									<button
										class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${
											activeTab === 'Global' ? 'bg-white text-black' : ''
										}`}
										on:click={() => (activeTab = 'Global')}
									>
										Global
									</button>
								</div>

								<!-- Input -->
								<div class="relative z-10">
									<input
										type="text"
										placeholder="Search location"
										bind:value={search}
										class="w-full rounded-md border border-black px-10 py-2 text-sm focus:outline-none"
									/>
									<span class="absolute top-2.5 left-3 text-gray-500">
										<svg
											width="19"
											height="19"
											viewBox="0 0 19 19"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M7.4375 8.75391H11.5626"
												stroke="#141415"
												stroke-width="1.50004"
												stroke-linecap="round"
											/>
											<path
												d="M9.5 10.8165V6.69141"
												stroke="#141415"
												stroke-width="1.50004"
												stroke-linecap="round"
											/>
											<path
												d="M4.98575 3.72997C8.26334 0.647395 14.616 1.70492 15.786 6.88755C16.6485 10.6976 14.2785 13.9227 12.2009 15.9178C10.6934 17.3728 8.30834 17.3728 6.7933 15.9178C4.72325 13.9152 2.34569 10.6901 3.21571 6.88005"
												stroke="#141415"
												stroke-width="1.50004"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</span>

									{#if search}
										<button
											aria-label="button"
											class="absolute top-1.5 right-3 text-gray-400"
											on:click={() => (search = '')}
										>
											<svg
												width="26"
												height="27"
												viewBox="0 0 26 27"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<rect
													x="0.0078125"
													y="13.4473"
													width="17.9532"
													height="17.9532"
													rx="8.97661"
													transform="rotate(-45 0.0078125 13.4473)"
													fill="#C7C7C8"
												/>
												<g opacity="0.4">
													<path
														d="M10.0312 16.1191L15.3764 10.7739"
														stroke="white"
														stroke-width="2.25006"
														stroke-linecap="round"
													/>
													<path
														d="M15.3764 16.1206L10.0312 10.7754"
														stroke="white"
														stroke-width="2.25006"
														stroke-linecap="round"
													/>
												</g>
												<g opacity="0.4">
													<path
														d="M10.0312 16.1191L15.3764 10.7739"
														stroke="white"
														stroke-width="2.25006"
														stroke-linecap="round"
													/>
													<path
														d="M15.3764 16.1206L10.0312 10.7754"
														stroke="white"
														stroke-width="2.25006"
														stroke-linecap="round"
													/>
												</g>
												<g opacity="0.4">
													<path
														d="M10.0312 10.7754L15.3764 16.1206"
														stroke="white"
														stroke-width="2.25006"
														stroke-linecap="round"
													/>
													<path
														d="M10.0298 16.1206L15.375 10.7754"
														stroke="white"
														stroke-width="2.25006"
														stroke-linecap="round"
													/>
												</g>
												<g opacity="0.4">
													<path
														d="M10.0312 10.7754L15.3764 16.1206"
														stroke="white"
														stroke-width="2.25006"
														stroke-linecap="round"
													/>
													<path
														d="M10.0298 16.1206L15.375 10.7754"
														stroke="white"
														stroke-width="2.25006"
														stroke-linecap="round"
													/>
												</g>
											</svg>
										</button>
									{/if}
								</div>
							</div>

							<!-- Suggestions -->
							<div class="relative z-10 hidden max-h-40 overflow-y-auto rounded-md bg-white">
								{#each filteredLocations as loc (loc.name)}
									<button
										class="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-gray-100"
										on:click={() => selectLocation(loc)}
									>
										<span class="text-sm font-medium text-gray-800">{loc.name}</span>
										{#if loc.region}
											<span class="text-xs text-gray-500">{loc.region}</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<button class="h-[42px] w-[208px] rounded-md bg-[#333537] text-lg text-white">
			Create Collection
		</button>
	</div>
</div>
