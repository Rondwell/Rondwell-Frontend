<script lang="ts">
	export let open: boolean = false;
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import TimeModal from '../../../../create-event/components/TimeModal.svelte';
	import DatePickerModal from '../../../../create-event/components/DatePickerModal.svelte';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import EventLocationModal from '../../../../create-event/components/EventLocationModal.svelte';
	import TagNameModal from './TagNameModal.svelte';

	const dispatch = createEventDispatcher<{
		close: void;
		collection: void;
		submit: {
			url: string;
			startDate: Date;
			endDate: Date;
			startTime: string;
			endTime: string;
			timezone: string;
			eventName: string;
			eventLocation: string;
			eventOrganizer: string;
			locationName: string;
			location: string;
		};
	}>();
	let previousOverflow: string;

	let showModal = false;
	let openEventLocationModal = false;
	let openStartDatePickerModal = false;
	let openStartTimeModal = false;
	let openEndTimeModal = false;
	let startTime = '1:30 AM';
	let endTime = '2:30 AM';
	let startDate = new Date(2025, 10, 25);
	let endDate = new Date(2025, 10, 30);
	let locationName = '...';
	let timezone = '';

	$: if (open) {
		previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	} else {
		document.body.style.overflow = previousOverflow || '';
	}

	function submitEvent() {
		dispatch('submit', {
			url: eventUrl,
			startDate,
			eventName,
			endDate,
			startTime,
			endTime,
			timezone,
			eventOrganizer,
			eventLocation,
			locationName,
			location
		});
	}
	let location = '';
	let eventName = '';
	let eventLocation = '';
	let eventOrganizer = '';
	// Url State
	let eventUrl = '';

	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', {
			weekday: 'short', // "Sat"
			month: 'short', // "Sep"
			day: 'numeric' // "14"
		});
	}

	onMount(() => {
		// Get user’s location
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(async (position) => {
				const { latitude, longitude } = position.coords;

				// Get timezone from browser
				const offsetMin = new Date().getTimezoneOffset();
				const offsetHours = -(offsetMin / 60);
				const sign = offsetHours >= 0 ? '+' : '-';
				const formattedOffset = `GMT${sign}${String(Math.abs(offsetHours)).padStart(2, '0')}:00`;
				timezone = formattedOffset;

				// Get city name using reverse geocoding (OpenStreetMap API)
				try {
					const res = await fetch(
						`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
					);
					const data = await res.json();
					locationName =
						data.address.city ||
						data.address.town ||
						data.address.village ||
						data.address.state ||
						'Unknown';
				} catch (e) {
					locationName = 'Unknown';
				}
			});
		} else {
			locationName = 'Unavailable';
			timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		}
	});
</script>

{#if open}
	<!-- Container -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm lg:inset-y-0 lg:p-0 lg:pr-10"
		on:click={() => dispatch('close')}
	>
		<!-- Panel -->
		<div
			class="flex h-full max-h-[90vh] w-full max-w-lg flex-col rounded-md bg-[#F8F9F9] shadow-lg lg:w-lg lg:max-w-none lg:shadow-none"
			on:click|stopPropagation
		>
			<!-- Header -->

			<div class="flex items-center justify-between border-b border-gray-200 px-4 py-4">
				<div class="flex items-center justify-between">
					<button aria-label="Close" on:click={() => dispatch('close')}>
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

					<p class="ml-7 py-2 text-[16px]">Add Event to Collection</p>
				</div>

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

			<!-- Existing Event section -->
			<div class="flex flex-col">
				<div class="custom-scrollbar overflow-y-auto px-3 pb-10 md:pb-4" style="max-height: 80vh;">
					<div class="flex items-center justify-start gap-2 py-2">
						<div class="cursor-pointer" on:click={() => dispatch('collection')}>
							<svg
								width="38"
								height="38"
								viewBox="0 0 38 38"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle cx="18.5474" cy="18.5474" r="18.5474" fill="#EFEFF0" />
								<path
									d="M23.875 24.2969C23.0553 25.0968 21.8691 25.2746 20.8516 24.7363H20.8525L13.8154 21.0332L13.6592 20.9443C12.8966 20.4757 12.4287 19.6446 12.4287 18.7393C12.4288 17.7736 12.9609 16.8923 13.8154 16.4453L13.8164 16.4463L20.8525 12.7432L20.8516 12.7422C21.2445 12.5327 21.6588 12.4336 22.0732 12.4336C22.7333 12.4336 23.3717 12.6924 23.875 13.1826C24.6953 13.9834 24.8926 15.1688 24.3809 16.1924L23.3975 18.1602C23.2192 18.5168 23.2182 18.9493 23.3975 19.3135L24.3809 21.2861C24.8927 22.3098 24.6955 23.496 23.875 24.2969ZM22.0674 23.7393C22.4245 23.7392 22.7417 23.5732 22.9619 23.3584V23.3574C23.2913 23.0387 23.5193 22.4797 23.2139 21.8633H23.2148L22.2305 19.8965V19.8955C21.8692 19.1664 21.8692 18.3063 22.2305 17.5771V17.5762L23.2148 15.6094V15.6084C23.5247 14.9937 23.2924 14.4351 22.9619 14.1152C22.6294 13.7934 22.0703 13.5722 21.4609 13.8926L14.4238 17.5967L14.2695 17.6904C13.9302 17.9305 13.7344 18.3091 13.7344 18.7334C13.7344 19.1575 13.9305 19.5353 14.2695 19.7754L14.4238 19.8701L21.4609 23.5859C21.674 23.6978 21.8792 23.7393 22.0674 23.7393Z"
									fill="#616365"
									stroke="#616365"
									stroke-width="0.394627"
								/>
								<rect
									x="18.6542"
									y="18.0449"
									width="4.13627"
									height="1.33004"
									rx="0.665018"
									fill="#616365"
									stroke="#616365"
									stroke-width="0.394627"
								/>
							</svg>
						</div>

						<p class="text-[16px]">Existing Rondwell Event</p>
					</div>
					<!-- URL SECTION  -->
					<div class=" pt-2 md:pr-4">
						<label class="mb-1 block text-sm font-medium text-[#666769]">
							Event Page URL <span>*</span>
						</label>

						<input
							type="url"
							class="placeholder-opacity-30 w-full rounded-md border px-3 py-2 text-sm placeholder-[#C8C9C9]"
							placeholder="https://eventbrite.com/e/some-event"
							bind:value={eventUrl}
						/>
					</div>

					<!-- Event Name Section-->
					<div class="pt-5 md:mr-4">
						<label class="mb-1 block text-sm font-medium text-[#666769]">
							Event Name <span>*</span>
						</label>

						<input
							type="text"
							class="placeholder-opacity-30 w-full rounded-md border px-3 py-2 text-sm placeholder-[#C8C9C9]"
							placeholder="Happy Hour Drinks"
							bind:value={eventName}
						/>
					</div>

					<!-- Event Location -->

					<div class=" pt-5">
						<label class="mb-1 block text-sm font-medium text-[#666769]">
							Event Location (Virtual/Physical)<span>*</span>
						</label>

						<div class="relative" use:clickOutside={() => (openEventLocationModal = false)}>
							<input
								type="text"
								readonly
								class="w-full cursor-pointer rounded-md border px-3 py-2 text-sm placeholder-[#C8C9C9]"
								value={location || ''}
							/>
							<button
								type="button"
								class="absolute inset-0"
								on:click={async () => {
									openEventLocationModal = true;
									await tick();
									scrollToId('location');
								}}
								aria-label="Open event location modal"
							/>
							{#if !location}
								<div
									class="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center gap-2 text-[#C8C9C9]"
								>
									<svg
										width="18"
										height="19"
										viewBox="0 0 18 19"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M11.0625 8.25C11.4736 8.25 11.8125 8.58895 11.8125 9C11.8125 9.41105 11.4736 9.75 11.0625 9.75H6.9375C6.52645 9.75 6.1875 9.41105 6.1875 9C6.1875 8.58895 6.52645 8.25 6.9375 8.25H11.0625Z"
											fill="currentColor"
											stroke="currentColor"
											stroke-width="0.375"
										/>
										<path
											d="M9 6.1875C9.41105 6.1875 9.75 6.52645 9.75 6.9375V11.0625C9.75 11.4736 9.41105 11.8125 9 11.8125C8.58895 11.8125 8.25 11.4736 8.25 11.0625V6.9375C8.25 6.52645 8.58895 6.1875 9 6.1875Z"
											fill="currentColor"
											stroke="currentColor"
											stroke-width="0.375"
										/>
										<path
											d="M9.00684 1.5C11.8694 1.50002 15.166 3.18327 16.0225 6.96387C16.9602 11.1074 14.45 14.5616 12.2266 16.7021V16.7031C11.3209 17.5697 10.1563 18.0078 8.99902 18.0078C7.84198 18.0077 6.67802 17.5695 5.77246 16.7031L5.77148 16.7021C3.54798 14.5614 1.03891 11.0996 1.98438 6.95605C2.84085 3.18304 6.13666 1.5001 8.99902 1.5H9.00684ZM8.99902 3C6.87258 3.00009 4.16913 4.12935 3.45215 7.28613V7.28711C2.71515 10.5016 4.56012 13.3211 6.44238 15.2422L6.81934 15.6143V15.6152C8.04416 16.7976 9.96167 16.7975 11.1865 15.6152C13.1801 13.6963 15.3328 10.7164 14.5615 7.28711L14.4883 6.99707C13.669 4.06002 11.0594 3 8.99902 3Z"
											fill="currentColor"
											stroke="currentColor"
											stroke-width="0.375"
										/>
									</svg>

									<span class="text-sm">What is the address? </span>
								</div>
							{/if}

							<EventLocationModal open={openEventLocationModal} bind:link={location} />
						</div>
					</div>

					<!-- Organizer -->
					<div class="pt-5">
						<label class="mb-1 block text-sm font-medium text-[#666769]">
							Organizer <span>*</span>
						</label>

						<input
							type="text"
							class="placeholder-opacity-30 w-full rounded-md border px-3 py-2 text-sm placeholder-[#C8C9C9]"
							placeholder="John Nebraska"
							bind:value={eventOrganizer}
						/>
					</div>

					<!-- Event Time -->
					<label class="mb-1 block pt-5 text-sm font-medium text-[#666769]"> Event Time </label>
					<div class="flex w-full rounded-sm border-[#EBECEC] bg-[#F8F9F9]">
						<div class=" w-full">
							<div class="flex w-full flex-col rounded-[9.75px] bg-[#fff] sm:max-w-[280px]">
								<!-- start Date, Time & Location Pickers -->
								<div class="flex w-full flex-col items-center">
									<!-- Date Picker -->
									<div class=" min-h-[96px] w-full flex-col">
										<div
											class="relative w-full pt-1 pl-3"
											use:clickOutside={() => (openStartDatePickerModal = false)}
										>
											<button
												on:click={async () => {
													openStartDatePickerModal = !openStartDatePickerModal;
													await tick();
												}}
												class="h-[32.36px] w-[115px] rounded-sm p-1 text-sm transition hover:bg-[#E4E5E5]"
												><p class="mr-auto w-fit">{formatDate(startDate)}</p></button
											>
											<DatePickerModal
												open={openStartDatePickerModal}
												bind:selectedDate={startDate}
											/>
										</div>
										<!-- Time Picker -->
										<div class=" mt-3 flex w-full pl-3">
											<div
												class="relative mb-2 w-full text-sm"
												use:clickOutside={() => (openStartTimeModal = false)}
											>
												<button
													on:click={async () => {
														openStartTimeModal = !openStartTimeModal;
														await tick();
														scrollToId('time');
													}}
													class="w-full text-sm font-semibold"
													style=" border-top-right-radius: 9.75px;"
													><p class="w-fit px-1">{startTime}</p></button
												>
												<TimeModal open={openStartTimeModal} bind:selectedTime={startTime} />
											</div>

											<span class="mb-2 text-sm text-gray-200">
												<svg
													width="9"
													height="15"
													viewBox="0 0 9 15"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<rect
														y="12.8203"
														width="9.9258"
														height="1.96151"
														rx="0.980754"
														transform="rotate(-45 0 12.8203)"
														fill="#B3B5B7"
													/>
													<rect
														x="1.39062"
														width="10.0318"
														height="1.96151"
														rx="0.980754"
														transform="rotate(45 1.39062 0)"
														fill="#B3B5B7"
													/>
												</svg>
											</span>
											<div
												class="relative mb-2 w-full text-sm"
												use:clickOutside={() => (openEndTimeModal = false)}
											>
												<button
													on:click={async () => {
														openEndTimeModal = !openEndTimeModal;
														await tick();
														scrollToId('time');
													}}
													class="w-full pr-4 text-sm font-semibold"
													style="border-bottom-right-radius: 9.75px;"
													><p class="ml-auto w-fit">{endTime}</p></button
												>
												<TimeModal
													open={openEndTimeModal}
													bind:selectedTime={endTime}
													referenceTime={startTime}
												/>
											</div>
										</div>
										<!-- Location  -->
										<div
											class="align-center flex w-full gap-2 rounded-b-[9.75px] border-t-1 border-t-[#868789]/30 px-1 py-4 pl-3 text-xs text-[#636466]"
										>
											<div>
												<svg
													width="19"
													height="18"
													viewBox="0 0 19 18"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														d="M9.25 16.5C13.3921 16.5 16.75 13.1421 16.75 9C16.75 4.85786 13.3921 1.5 9.25 1.5C5.10786 1.5 1.75 4.85786 1.75 9C1.75 13.1421 5.10786 16.5 9.25 16.5Z"
														stroke="currentColor"
														stroke-width="1.125"
														stroke-linecap="round"
														stroke-linejoin="round"
													/>
													<path
														d="M6.24922 2.25H6.99922C5.53672 6.63 5.53672 11.37 6.99922 15.75H6.24922"
														stroke="currentColor"
														stroke-width="1.125"
														stroke-linecap="round"
														stroke-linejoin="round"
													/>
													<path
														d="M11.5 2.25C12.9625 6.63 12.9625 11.37 11.5 15.75"
														stroke="currentColor"
														stroke-width="1.125"
														stroke-linecap="round"
														stroke-linejoin="round"
													/>
													<path
														d="M2.5 12V11.25C6.88 12.7125 11.62 12.7125 16 11.25V12"
														stroke="currentColor"
														stroke-width="1.125"
														stroke-linecap="round"
														stroke-linejoin="round"
													/>
													<path
														d="M2.5 6.75313C6.88 5.29063 11.62 5.29063 16 6.75313"
														stroke="currentColor"
														stroke-width="1.125"
														stroke-linecap="round"
														stroke-linejoin="round"
													/>
												</svg>
											</div>
											<div class="flex pt-0.5 text-xs">
												<span>{timezone}</span>
												<span class="ml-1">{locationName}</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Add Tags button -->
					<div class="relative flex w-[300px] flex-col items-center justify-start gap-2 pt-5">
						<label class="w-full text-sm font-semibold text-[#666769]">Apply Tags</label>

						<div class="flex w-full justify-start" use:clickOutside={() => (showModal = false)}>
							<div
								on:click={() => (showModal = !showModal)}
								class="flex w-[90px] cursor-pointer justify-start rounded-2xl bg-[#939597] px-1 py-0.5 text-sm text-[#FFFFFF]"
							>
								<Icon icon="mdi:plus" class="text-x mt-0.5" />
								<span>Add Tag</span>
							</div>
						</div>

						<TagNameModal bind:open={showModal} on:submit={(e) => console.log(e.detail)} />
					</div>

					<!-- Event Creation buttons -->

					<div class="mt-3 pb-4">
						<button
							class="w-full rounded-md bg-[#333537] py-3 text-sm text-white"
							on:click={submitEvent}
						>
							Submit
						</button>
						<p class="w-full px-5 py-2 text-center text-sm text-[#666769]/40">
							Events that you added from external platform are saved as draft. Can edit and publish
							from the event management page.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- -->
<style>
	/* optional fade transition */
	:global(.fade-enter-active),
	:global(.fade-leave-active) {
		transition: opacity 0.2s ease;
	}
	:global(.fade-enter-from),
	:global(.fade-leave-to) {
		opacity: 0;
	}
</style>
