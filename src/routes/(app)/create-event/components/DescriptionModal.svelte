<script lang="ts">
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let open = false;

	let showDropdown = false;
	let showAIModal = false;

	let moods = ['💐', '💼', '😂'];
	let selectedMood: string | null = moods[0];
	let selectedLength = 'S';

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function openAIModal() {
		showAIModal = true;
	}

	function closeAIModal() {
		showAIModal = false;
	}
</script>

{#if open}
	<div id="description" class="absolute top-full left-0 z-40 mt-2 w-full max-w-[662.8px]">
		<div class="w-full max-w-[662.8px] overflow-hidden rounded-sm bg-[#FFFCFC]">
			<div class="flex h-[50px] w-full items-center justify-end bg-[#F4F5F6] px-3">
				<button
					on:click={() => (open = false)}
					class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
				>
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<!-- Text area -->
			<div class="p-2">
				<div class="flex w-full items-start rounded-md bg-white p-2">
					<div
						class=""
						use:clickOutside={() => {
							showDropdown = false;
						}}
					>
						<!-- + button -->
						<button
							class="mr-2 rounded-sm bg-[#939597] p-1 text-lg font-bold text-white"
							on:click={toggleDropdown}
						>
							<Icon icon="mdi:plus" class="text-xl" />
						</button>

						<!-- Dropdown -->

						<TextEditor open={showDropdown} />
					</div>

					<!-- textarea -->
					<textarea
						rows="6"
						placeholder="Who should come? What's the event about?"
						class="w-full resize-none border-none text-sm text-gray-500 outline-none focus:ring-0"
					></textarea>
				</div>
			</div>

			<div
				class="flex h-[55px] w-full items-center justify-between bg-[#F4F5F6] px-3"
				use:clickOutside={() => {
					showAIModal = false;
				}}
			>
				<!-- Suggest with AI -->
				<button class="flex items-center gap-1 text-sm text-[#B2B3B3]" on:click={openAIModal}>
					<svg
						width="23"
						height="23"
						viewBox="0 0 23 23"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							x="10.9964"
							y="4.03479"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							fill="#ACAEAE"
						/>
						<rect
							x="16.8948"
							y="5.60511"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(48.8391 16.8948 5.60511)"
							fill="#ACAEAE"
						/>
						<rect
							x="3.13703"
							y="12.7692"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(-90.9275 3.13703 12.7692)"
							fill="#ACAEAE"
						/>
						<rect
							x="14.9183"
							y="12.6754"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(-90 14.9183 12.6754)"
							fill="#ACAEAE"
						/>
						<rect
							x="9.21124"
							y="8.64417"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(130.233 9.21124 8.64417)"
							fill="#ACAEAE"
						/>
						<rect
							x="17.6605"
							y="16.0504"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(131.574 17.6605 16.0504)"
							fill="#ACAEAE"
						/>
						<rect
							x="12.5706"
							y="19.4176"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(-179.587 12.5706 19.4176)"
							fill="#ACAEAE"
						/>
						<rect
							x="8.59406"
							y="13.2535"
							width="1.57061"
							height="4.71184"
							rx="0.785307"
							transform="rotate(41.5742 8.59406 13.2535)"
							fill="#ACAEAE"
						/>
					</svg>
					Suggest with AI
				</button>

				<!-- Done button -->
				<div class="flex justify-end">
					<button
						class="rounded-md bg-gray-800 px-4 py-2 text-sm text-white"
						on:click={() => (open = false)}
					>
						Done
					</button>
				</div>

				<!-- AI Suggest Modal -->
				{#if showAIModal}
					<div
						class="absolute bottom-[50px] left-[-10px] z-50 w-85 rounded-md border bg-[#F8F8F9] p-2 shadow-lg md:left-0"
					>
						<div class="mb-4 flex items-start justify-between">
							<div
								class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
							>
								<div class="flex h-9 w-9 items-center justify-center">
									<svg
										width="55"
										height="58"
										viewBox="0 0 55 58"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<rect
											width="3.89404"
											height="11.72"
											rx="1.94702"
											transform="matrix(0.967873 -0.0100048 -0.00935403 1.03084 26.5616 10.3293)"
											fill="#737577"
										/>
										<rect
											width="3.84882"
											height="11.8536"
											rx="1.92441"
											transform="matrix(0.637367 0.781083 -0.724219 0.678245 40.6866 14.2121)"
											fill="#737577"
										/>
										<rect
											width="3.90495"
											height="11.6872"
											rx="1.95248"
											transform="matrix(-0.00626614 -1.03099 0.967474 -0.0267319 7.50104 32.9152)"
											fill="#737577"
										/>
										<rect
											width="3.90665"
											height="11.6821"
											rx="1.95333"
											transform="matrix(0.00935403 -1.03084 0.967873 -0.0100048 35.7803 32.3761)"
											fill="#737577"
										/>
										<rect
											width="3.95282"
											height="11.5415"
											rx="1.97641"
											transform="matrix(-0.622912 0.784135 -0.741761 -0.668389 22.1671 22.2043)"
											fill="#737577"
										/>
										<rect
											width="3.95287"
											height="11.5413"
											rx="1.97644"
											transform="matrix(-0.639625 0.768688 -0.726593 -0.687069 42.2842 40.9699)"
											fill="#737577"
										/>
										<rect
											width="3.89328"
											height="11.7222"
											rx="1.94664"
											transform="matrix(-0.967968 0.00254488 0.01631 -1.03068 29.9835 49.7433)"
											fill="#737577"
										/>
										<rect
											width="3.84711"
											height="11.8586"
											rx="1.92355"
											transform="matrix(0.726593 0.687069 -0.639625 0.768688 20.587 34.0246)"
											fill="#737577"
										/>
									</svg>
								</div>
							</div>
							<button
								on:click={closeAIModal}
								class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
							>
								<Icon icon="mdi:close" class="text-xl" />
							</button>
						</div>
						<h3 class="mb-2 text-xl font-medium text-gray-700">Suggest Description</h3>
						<p class="mb-4 text-sm text-gray-500">Generate description for your event with AI.</p>

						<div class="flex justify-between">
							<div class="mb-3">
								<label for="" class="mb-1 block font-medium text-gray-600">Mood</label>
								<div class="flex gap-2 rounded-md bg-[#EFEFF0] p-1">
									{#each moods as mood}
										<button
											class="h-[39px] w-[43px] rounded-md px-3 py-1 {selectedMood === mood
												? 'bg-white'
												: ''}"
											on:click={() => (selectedMood = mood)}
										>
											{mood}
										</button>
									{/each}
								</div>
							</div>

							<div class="mb-3">
								<label for="" class="mb-1 block font-medium text-gray-600">Length</label>
								<div class="flex gap-2 rounded-md bg-[#EFEFF0] p-1">
									{#each ['S', 'M', 'L'] as size}
										<button
											class="h-[39px] w-[39px] rounded-md px-3 py-1 {selectedLength === size
												? 'bg-white text-black'
												: 'text-gray-400'}"
											on:click={() => (selectedLength = size)}
										>
											{size}
										</button>
									{/each}
								</div>
							</div>
						</div>

						<div class="mb-3">
							<label for="" class="mb-1 block text-sm font-medium text-gray-600"
								>Additional Instructions</label
							>
							<textarea
								rows="4"
								placeholder="For example, you could tell the AI to write about a startup pitch event."
								class="w-full resize-none rounded-md border p-2 text-xs text-gray-500 outline-none focus:ring-0"
							></textarea>
						</div>

						<button class="mb-5 w-full rounded-md bg-gray-800 py-1.5 text-sm text-white">
							Generate
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
