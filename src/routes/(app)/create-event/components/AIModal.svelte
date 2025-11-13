<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';

	export let open = false;
	let showDropdown = false;
	let eventTypes = [
		'Conference / Summit',
		'Workshop / Training',
		'Webinar / Virtual Meetup',
		'Festival / Exhibition',
		'Networking / Mixer'
	];
	let selectedType = 'Conference / Summit';
	let promptText =
		'A 2-day virtual summit on African innovation, featuring 10 speakers and live panel sessions, 20 attendees';

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function selectType(type: string) {
		selectedType = type;
		showDropdown = false;
	}

	function generateEvent() {
		console.log('Generating event:', selectedType, promptText);
	}

	function closeModal() {
		console.log('Modal closed');
	}

	$: if (open === false) {
		showDropdown = false;
	}
</script>

{#if open}
	<div id="aiModal" class="absolute bottom-18 z-40 mt-2 inline-block text-left">
		<div class="relative w-full rounded-lg bg-[#FFFCFC] p-4 shadow-lg md:w-[390px]">
			<div class="mb-4 flex items-start justify-between">
				<div
					class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
				>
					<div class="flex h-9 w-9 items-center justify-center">
						<svg
							width="33"
							height="33"
							viewBox="0 0 33 33"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M30.4907 2.85618C30.6445 3.18984 30.905 3.45445 31.2482 3.60402L32.6804 4.22531C33.1065 4.4209 33.1065 5.00766 32.6804 5.20325L31.2601 5.82453C30.9168 5.9741 30.6445 6.23873 30.5025 6.57238L29.378 9.12655C29.1768 9.52921 28.5732 9.52921 28.372 9.12655L27.2475 6.57238C27.0936 6.23873 26.8332 5.9741 26.4899 5.82453L25.0696 5.20325C24.6435 5.00766 24.6435 4.4209 25.0696 4.22531L26.4899 3.60402C26.8332 3.45445 27.1055 3.18984 27.2475 2.85618L28.372 0.302011C28.5732 -0.100671 29.1768 -0.100671 29.378 0.302011L30.4907 2.85618ZM16.4804 3.7297C16.5908 3.95916 16.7747 4.14273 17.02 4.24599L18.0379 4.67047C18.3445 4.80814 18.3445 5.20971 18.0379 5.34737L17.02 5.77187C16.7747 5.87513 16.5785 6.05869 16.4804 6.28814L15.6833 8.04348C15.536 8.31883 15.1068 8.31883 14.9596 8.04348L14.1625 6.28814C14.0521 6.05869 13.8681 5.87513 13.6229 5.77187L12.6049 5.34737C12.2984 5.20971 12.2984 4.80814 12.6049 4.67047L13.6229 4.24599C13.8681 4.14273 14.0644 3.95916 14.1625 3.7297L14.9596 1.97437C15.1068 1.69902 15.536 1.69902 15.6833 1.97437L16.4804 3.7297ZM2.35714 28.2857L0.397768 30.2033C-0.132589 30.7352 -0.132589 31.5861 0.397768 32.1179L0.880982 32.6025C1.39955 33.1344 2.25991 33.1344 2.77848 32.5908L4.71429 30.6494L4.71099 30.6461L21.2143 14.1428L23.1873 12.1778C23.6994 11.6535 23.6994 10.7173 23.1873 10.2041L22.7978 9.81348C22.2745 9.30024 21.2143 9.42856 20.625 10.0178L2.35714 28.2857ZM28.2276 16.8507C27.9879 16.7352 27.7986 16.5428 27.6851 16.2861L26.8774 14.3738C26.7261 14.0659 26.297 14.0659 26.1583 14.3738L25.3506 16.2861C25.2497 16.5299 25.0478 16.7352 24.8081 16.8507L23.7985 17.3128C23.4958 17.4668 23.4958 17.9032 23.7985 18.0443L24.8081 18.5064C25.0478 18.6219 25.2371 18.8143 25.3506 19.071L26.1583 20.9833C26.3096 21.2912 26.7387 21.2912 26.8774 20.9833L27.6851 19.071C27.786 18.8272 27.9879 18.6219 28.2276 18.5064L29.2372 18.0443C29.54 17.8903 29.54 17.4539 29.2372 17.3128L28.2276 16.8507ZM11.7857 14.1428C12.4366 14.1428 12.9643 13.6152 12.9643 12.9643C12.9643 12.3133 12.4366 11.7857 11.7857 11.7857C11.1348 11.7857 10.6071 12.3133 10.6071 12.9643C10.6071 13.6152 11.1348 14.1428 11.7857 14.1428ZM33 12.9643C33 13.6152 32.4724 14.1428 31.8214 14.1428C31.1705 14.1428 30.6429 13.6152 30.6429 12.9643C30.6429 12.3133 31.1705 11.7857 31.8214 11.7857C32.4724 11.7857 33 12.3133 33 12.9643ZM20.0357 2.35714C20.6866 2.35714 21.2143 1.82949 21.2143 1.17857C21.2143 0.52766 20.6866 2.96038e-06 20.0357 2.96366e-06C19.3848 2.96694e-06 18.8571 0.52766 18.8571 1.17857C18.8571 1.82949 19.3848 2.35714 20.0357 2.35714ZM21.2143 22.3928C21.2143 23.0438 20.6866 23.5714 20.0357 23.5714C19.3848 23.5714 18.8571 23.0438 18.8571 22.3928C18.8571 21.7419 19.3848 21.2143 20.0357 21.2143C20.6866 21.2143 21.2143 21.7419 21.2143 22.3928Z"
								fill="url(#paint0_linear_1761_8224)"
							/>
							<defs>
								<linearGradient
									id="paint0_linear_1761_8224"
									x1="8.31102e-08"
									y1="16.5"
									x2="33"
									y2="16.5"
									gradientUnits="userSpaceOnUse"
								>
									<stop stop-color="#DB3EC6" />
									<stop offset="0.5" stop-color="#963DD4" />
									<stop offset="1" stop-color="#513BE2" />
								</linearGradient>
							</defs>
						</svg>
					</div>
				</div>
				<button
					on:click={() => (open = false)}
					class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
				>
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<h3 class="mb-2 text-xl font-medium text-gray-700">Describe your event</h3>
			<p class="mb-4 text-sm text-gray-500">Generate description for your event with AI.</p>

			<!-- Event Type -->
			<label for="" class="mb-1 block text-sm font-medium text-gray-700">Event Type</label>
			<div class="relative mb-4" use:clickOutside={() => (showDropdown = false)}>
				<button
					on:click={toggleDropdown}
					class="flex w-full items-center justify-between rounded-md border border-gray-300 bg-[#FCFDFD] px-3 py-2 text-sm text-gray-500"
				>
					<span>{selectedType}</span>
					<svg
						width="12"
						height="12"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M14.418 1.12207C15.3683 2.09574 15.5796 3.50344 14.9404 4.71191L10.4707 13.2041V13.2051C9.93997 14.2195 8.89369 14.8515 7.74707 14.8516C6.60043 14.8516 5.55426 14.2195 5.02344 13.2051L0.552734 4.71191L0.553711 4.71094C0.305154 4.24437 0.187547 3.75335 0.1875 3.26172C0.1875 2.47868 0.493415 1.72134 1.07617 1.12305V1.12207C2.02732 0.147846 3.43464 -0.0863889 4.65039 0.521484L7.02441 1.70898C7.46955 1.93154 8.00912 1.9316 8.46289 1.70801H8.46387L10.8438 0.521484C12.0595 -0.086218 13.4669 0.14769 14.418 1.12207ZM13.832 3.26855C13.832 2.82174 13.6239 2.4274 13.3574 2.1543V2.15332C12.9611 1.74382 12.263 1.45873 11.4951 1.83887L9.12012 3.02637L8.95605 3.10156C8.18224 3.43027 7.30409 3.43024 6.53027 3.10156L6.36621 3.02637L3.99121 1.83887C3.22461 1.45229 2.52643 1.74255 2.12891 2.15332C1.72955 2.56599 1.45292 3.26448 1.85254 4.02441L6.32227 12.5176L6.43945 12.71C6.73858 13.1325 7.2107 13.3769 7.73926 13.377C8.26782 13.377 8.7399 13.1324 9.03906 12.71L9.15625 12.5176L13.6406 4.02441C13.7797 3.75951 13.832 3.50355 13.832 3.26855Z"
							fill="#333537"
							stroke="#9D6E6C"
							stroke-width="0.375"
						/>
						<rect
							x="6.96094"
							y="7.33594"
							width="4.89098"
							height="1.50399"
							rx="0.751997"
							transform="rotate(-90 6.96094 7.33594)"
							fill="#333537"
							stroke="#9D6E6C"
							stroke-width="0.375"
						/>
					</svg>
				</button>

				<!-- Dropdown -->
				{#if showDropdown}
					<div
						class="triangle absolute right-0 left-0 z-10 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
					>
						<p class="my-2 text-xs text-[#B8B7B7]">Choose event type:</p>
						<div class="overflow-y-auto text-sm text-gray-700">
							{#each eventTypes as type}
								<button
									class="flex w-full cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-100 {selectedType ===
									type
										? 'bg-[#F1F1F1]'
										: ''}"
									on:click={() => selectType(type)}
								>
									<span>{type}</span>
									{#if selectedType === type}
										<img src="/selected.svg" alt="selected icons" class="h-5 w-5" />
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Prompt -->
			<div class="mb-3">
				<label for="" class="mb-1 block text-sm font-medium text-gray-600">Enter Prompt</label>
				<textarea
					rows="4"
					placeholder="For example, you could tell the AI to write about a startup pitch event."
					class="w-full resize-none rounded-md border p-2 text-xs text-gray-500 outline-none focus:ring-0"
				></textarea>
			</div>

			<!-- Generate Button -->
			<button
				class="w-full rounded-md bg-black py-2 text-sm font-medium text-white"
				on:click={generateEvent}
			>
				Generate Event
			</button>
		</div>
	</div>
{/if}
