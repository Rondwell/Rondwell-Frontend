<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open: boolean = false;
	export let position = { top: 0, left: 0 };

	const dispatch = createEventDispatcher();

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
		dispatch('select', loc);
		dispatch('close');
	}
</script>

{#if open}
	<div
		class="absolute left-78 z-40 mt-2 inline-block w-full max-w-96 text-left"
		style="top: {position.top}px; left: {position.left}px;"
	>
		<div class="relative w-full rounded-lg bg-white shadow-lg">
			<!-- Tabs -->
			<div
				class="mb-3 flex h-[175px] flex-col justify-between gap-2 p-2"
				style="background: url('./map.png'); background-size: cover;"
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
{/if}
