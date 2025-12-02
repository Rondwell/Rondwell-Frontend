<script lang="ts">
	import Icon from '@iconify/svelte';

	let searchQuery = '';
	export let open = false;

	let selectedS: number[] = [];

	let sessions = [
		{
			id: 1,
			title: 'Opening Keynote',
			time: 'Friday 24 July 2025, 06:32AM',
			stage: 'Main Stage'
		},
		{
			id: 2,
			title: 'Design Systems in 2025',
			time: 'Friday 24 July 2025, 09:00AM',
			stage: 'Stage B'
		}
	];

	function toggleSelect(id: number) {
		if (selectedS.includes(id)) {
			selectedS = selectedS.filter((s) => s !== id);
		} else {
			selectedS = [...selectedS, id];
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn max-h-180 md:max-h-150 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 md:p-6 shadow-xl">
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

				<h2 class="text-xl font-semibold text-gray-800">Assign Speaker to Session</h2>
				<p class="text-sm text-gray-500">Provide details of speaker to proceed.</p>
				<button
					class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
					on:click={() => (open = false)}
				>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<!-- TAB CONTENT -->
			<div class="custom-scrollbar mt-6 h-80 md:h-60 overflow-y-auto rounded-lg border p-4">
				<div>
					<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
						Select the sessions where Gabriela Walker will present.
						<img src="/warning-icon.svg" alt="" />
					</h3>
					<div class="mb-4 flex items-center gap-2">
						<div class="relative w-full max-w-xl">
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search speaker by name, session, or status..."
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
						{#each sessions as session}
							<div
								class="flex items-start justify-between gap-2 p-3 hover:bg-gray-50 md:flex-row md:items-center"
							>
								<div class="flex flex-col justify-between gap-2 md:flex-row md:items-center">
									<div class="flex items-center gap-2">
										<button
											on:click={() => toggleSelect(session.id)}
											class="flex h-5 w-5 items-center justify-center rounded-full border-2 {selectedS.includes(
												session.id
											)
												? 'bg-black'
												: 'border-gray-300'}"
										>
											{#if selectedS.includes(session.id)}
												<Icon icon="mdi:tick" class="text-2xl text-white" />
											{/if}
										</button>
										<div class="flex items-center gap-2">
											<img src="/face-2.svg" alt="" class="h-8 w-8 rounded-full" />
											<div class="font-medium">Opening Keynote</div>
										</div>
									</div>

									<div
										class="max-w-[250px] truncate text-sm text-[#B6B7B7] md:max-w-[150px] lg:max-w-[250px]"
									>
										Friday 24 July 2025, 06:32AM
									</div>
								</div>

								<div class="flex flex-col items-end gap-2 sm:flex-row md:items-center">
									Main Stage
								</div>
							</div>
						{/each}
					</div>
				</div>
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
					Assign Session
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
