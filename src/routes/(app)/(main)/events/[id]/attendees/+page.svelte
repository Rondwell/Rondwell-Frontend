<script>
	import { clickOutside } from '$lib/utils/constant';
	import AttendeeDetailModal from '../components/AttendeeDetailModal.svelte';
	import InviteGuestsModal from '../components/InviteGuestsModal.svelte';
	import ShowAttendeeList from './components/ShowAttendeeList.svelte';

	let searchQuery = '';
	let showModal = false;

	let openShowAttendeeList = false;

	const eventData = {
		title: "Faithful's Graduating Party",
		collection: 'John Collection',
		date: 'Wednesday, Dec 25',
		time: '11:30AM - 12:30AM GMT+1',
		location: 'Location Missing',
		description: 'Megaexe Party',
		organizer: 'John Calendar',
		approvalRequired: true,
		invites: {
			accepted: 1,
			opened: 1,
			declined: 0
		},
		attendees: [
			{
				name: 'John Odoemenem',
				email: 'johnmedic23@gmail.com',
				status: 'Attending',
				time: '13 Minutes Ago'
			}
		],
		admins: [{ name: 'John Odoemenem', email: 'johnmedic23@gmail.com', role: 'Creator' }],
		visibility: {
			calendar: 'John Calendar',
			status: 'Public'
		}
	};

	let showInviteGuestsModal = false;

	let value = 100 / eventData?.attendees?.length;
</script>

<div class="max-w-6xl">
	<!-- Attendees Section -->
	<div class={eventData?.attendees?.length > 0 ? 'mb-12' : ''}>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-sm text-[#83808D]">John Collection</span>
				<svg
					width="11"
					height="11"
					viewBox="0 0 11 11"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898ZM2.29492 1.29199C2.01826 1.29212 1.77162 1.42109 1.59961 1.58887L1.59863 1.58984C1.34194 1.83849 1.16551 2.27322 1.40332 2.75293L2.19043 4.32812L2.28711 4.55469C2.47977 5.09324 2.44715 5.69271 2.19043 6.21094V6.21191L1.40234 7.78711V7.78809C1.16122 8.26626 1.34076 8.7005 1.59863 8.9502C1.85851 9.20169 2.2935 9.37235 2.76758 9.12305L8.40332 6.15723H8.4043C8.74149 5.98034 8.94037 5.64982 8.94043 5.27246C8.94043 4.89509 8.74146 4.56463 8.4043 4.3877H8.40332L2.76758 1.41113C2.60129 1.32386 2.44117 1.29199 2.29492 1.29199Z"
						fill="#83808D"
						stroke="#83808D"
						stroke-width="0.37461"
					/>
					<rect
						x="5.0584"
						y="5.85137"
						width="3.37149"
						height="1.12383"
						rx="0.561915"
						transform="rotate(-180 5.0584 5.85137)"
						fill="#83808D"
						stroke="#83808D"
						stroke-width="0.37461"
					/>
				</svg>
			</div>
			<button
				class="flex items-start gap-1 rounded-md bg-[#DCE4EE] px-3 py-1 text-sm font-medium text-[#5D646F]"
			>
				Event Page
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M1.24306 6.4387C1.40611 5.40243 2.12888 4.62786 3.0931 4.47826L9.69034 3.43935L9.8408 3.42097C10.5948 3.35739 11.3249 3.72187 11.7721 4.3912C12.2195 5.06073 12.3131 5.92902 12.0244 6.68931L11.9618 6.83923L9.01457 13.3413L9.01326 13.3411C8.84871 13.7088 8.61528 14.0066 8.33157 14.2308C7.8792 14.5883 7.31432 14.7405 6.72781 14.6481C5.77143 14.4963 5.05093 13.7247 4.89305 12.6922L4.591 10.7138C4.53659 10.3578 4.3245 10.0403 4.02548 9.86912L4.02494 9.8683L2.3872 8.94152C1.53287 8.45922 1.08026 7.47484 1.24306 6.4387ZM2.76439 5.88928C2.52769 6.07636 2.39626 6.36366 2.35324 6.63719L2.35378 6.638C2.28828 7.04462 2.40721 7.57568 2.91465 7.86476L4.55152 8.78851L4.66279 8.85692C5.17357 9.19045 5.53909 9.73754 5.67294 10.3689L5.69839 10.5051L6.00044 12.4835L6.00098 12.4843C6.09306 13.0997 6.52266 13.3845 6.9 13.4426C7.27991 13.5012 7.75745 13.3662 8.00792 12.8142L10.9559 6.31145C11.1348 5.91836 11.1012 5.47237 10.8636 5.11651C10.6258 4.7606 10.2457 4.58735 9.84651 4.65089L9.84575 4.6515L3.24253 5.68148C3.04601 5.71271 2.88934 5.79056 2.76439 5.88928Z"
						fill="#5D646F"
						stroke="#5D646F"
						stroke-width="0.37461"
					/>
					<rect
						x="7.25931"
						y="8.68484"
						width="3.5114"
						height="1.15881"
						rx="0.579404"
						transform="rotate(144 7.25931 8.68484)"
						fill="#5D646F"
						stroke="#5D646F"
						stroke-width="0.37461"
					/>
				</svg>
			</button>
		</div>

		{#if eventData?.attendees?.length > 0}
			<h1 class="mt-2 mb-5 text-2xl font-semibold">At a Glannce</h1>

			<!-- Tabs -->
			<div class="mb-6 w-full max-w-2xl text-xs font-medium text-green-600">
				<!-- Top label -->
				<p class="mb-1">Attendee</p>

				<!-- Progress bar -->
				<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
					<div
						class="h-full rounded-full bg-green-500 transition-all duration-500"
						style="width: {value}%;"
					></div>
				</div>

				<!-- Sub label -->
				<div class="flex gap-1">
					<div class="flex items-center space-x-1 text-green-600">
						<span class="h-2 w-2 rounded-full bg-green-500"></span>
						<span>{eventData?.attendees.length} Attending</span>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="mb-4 flex w-full flex-wrap gap-3">
				<div
					class="relative w-full md:w-fit"
					use:clickOutside={() => {
						showInviteGuestsModal = false;
					}}
				>
					<button
						on:click={() => (showInviteGuestsModal = !showInviteGuestsModal)}
						class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
					>
						<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#E2E8FC]">
							<svg
								width="20"
								height="22"
								viewBox="0 0 20 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M17.2196 10.4232C16.5968 10.2593 15.8647 10.1719 14.9906 10.1719C13.7778 10.1719 13.3299 10.4669 12.7071 10.9367C12.6743 10.9586 12.6415 10.9913 12.6087 11.0241L11.5708 12.1277C10.6967 13.0454 9.12331 13.0564 8.24922 12.1167L7.21124 11.0241C7.17846 10.9913 7.14568 10.9586 7.1129 10.9367C6.49011 10.4669 6.04214 10.1719 4.82934 10.1719C3.95526 10.1719 3.22321 10.2593 2.60042 10.4232C-2.60499e-07 11.1224 0 13.1875 0 15.0012V16.0173C0 18.7598 -5.20998e-07 21.8628 5.84547 21.8628H13.9745C17.8533 21.8628 19.82 19.8961 19.82 16.0173V15.0012C19.82 13.1875 19.82 11.1224 17.2196 10.4232ZM12.4558 17.9294H7.3642C6.94901 17.9294 6.6103 17.5907 6.6103 17.1646C6.6103 16.7385 6.94901 16.3998 7.3642 16.3998H12.4558C12.871 16.3998 13.2097 16.7385 13.2097 17.1646C13.2097 17.5907 12.871 17.9294 12.4558 17.9294Z"
									fill="#146AEB"
								/>
								<path
									d="M17.7867 4.82934V8.87201C17.743 8.85016 17.6884 8.83923 17.6447 8.8283C16.8798 8.62071 16.0167 8.52237 14.9896 8.52237C13.307 8.52237 12.5203 9.01405 11.7118 9.62591C11.6025 9.70239 11.5042 9.80073 11.4168 9.88814L10.3679 10.9917C10.2695 11.1009 10.0947 11.1665 9.90898 11.1665C9.72324 11.1665 9.54842 11.1009 9.43916 10.9808L8.4121 9.89906C8.31377 9.7898 8.20451 9.69147 8.09525 9.61499C7.30857 9.01405 6.51096 8.52237 4.82834 8.52237C3.80128 8.52237 2.93812 8.62071 2.17329 8.8283C2.12959 8.83923 2.07495 8.85016 2.03125 8.87201V4.82934C2.03125 2.56764 2.03125 0 6.86059 0H12.9574C17.7867 0 17.7867 2.56764 17.7867 4.82934Z"
									fill="#146AEB"
								/>
							</svg>
						</div>
						Invite Attendee
					</button>
					<InviteGuestsModal bind:open={showInviteGuestsModal} />
				</div>

				<button
					class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium sm:min-w-70 md:w-fit"
				>
					<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#E3F4E1]">
						<svg
							width="27"
							height="27"
							viewBox="0 0 27 27"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								opacity="0.4"
								d="M20.398 2.1875H18.322C15.9401 2.1875 14.6836 3.444 14.6836 5.8259V7.90186C14.6836 10.2838 15.9401 11.5403 18.322 11.5403H20.398C22.7798 11.5403 24.0364 10.2838 24.0364 7.90186V5.8259C24.0364 3.444 22.7798 2.1875 20.398 2.1875Z"
								fill="#3CBD2C"
							/>
							<path
								opacity="0.4"
								d="M7.90888 14.6719H5.83292C3.4401 14.6719 2.18359 15.9284 2.18359 18.3103V20.3862C2.18359 22.7791 3.4401 24.0356 5.82199 24.0356H7.89795C10.2798 24.0356 11.5364 22.7791 11.5364 20.3972V18.3212C11.5473 15.9284 10.2908 14.6719 7.90888 14.6719Z"
								fill="#3CBD2C"
							/>
							<path
								d="M6.8709 11.5621C9.45963 11.5621 11.5582 9.46353 11.5582 6.8748C11.5582 4.28608 9.45963 2.1875 6.8709 2.1875C4.28217 2.1875 2.18359 4.28608 2.18359 6.8748C2.18359 9.46353 4.28217 11.5621 6.8709 11.5621Z"
								fill="#3CBD2C"
							/>
							<path
								d="M19.3494 24.0387C21.9381 24.0387 24.0367 21.9401 24.0367 19.3514C24.0367 16.7626 21.9381 14.6641 19.3494 14.6641C16.7607 14.6641 14.6621 16.7626 14.6621 19.3514C14.6621 21.9401 16.7607 24.0387 19.3494 24.0387Z"
								fill="#3CBD2C"
							/>
						</svg>
					</div>
					Check In Guest
				</button>

				<div
					class="relative w-full md:w-fit"
					use:clickOutside={() => {
						openShowAttendeeList = false;
					}}
				>
					<button
						class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
						on:click={() => {
							openShowAttendeeList = !openShowAttendeeList;
						}}
					>
						<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#F8EFDD]">
							<svg
								width="27"
								height="27"
								viewBox="0 0 27 27"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									opacity="0.4"
									d="M9.83444 4.36719C6.97179 4.36719 4.64453 6.69445 4.64453 9.55709C4.64453 12.3651 6.84068 14.6377 9.70332 14.7361C9.79073 14.7251 9.87814 14.7251 9.9437 14.7361C9.96555 14.7361 9.97648 14.7361 9.99833 14.7361C10.0093 14.7361 10.0093 14.7361 10.0202 14.7361C12.8173 14.6377 15.0134 12.3651 15.0243 9.55709C15.0243 6.69445 12.6971 4.36719 9.83444 4.36719Z"
									fill="#EAAB26"
								/>
								<path
									d="M15.385 15.4617C12.3366 13.4294 7.36526 13.4294 4.29502 15.4617C2.90741 16.3904 2.14258 17.6469 2.14258 18.9908C2.14258 20.3347 2.90741 21.5803 4.2841 22.4981C5.81375 23.5252 7.82416 24.0387 9.83457 24.0387C11.845 24.0387 13.8554 23.5252 15.385 22.4981C16.7617 21.5694 17.5266 20.3238 17.5266 18.969C17.5156 17.6251 16.7617 16.3795 15.385 15.4617Z"
									fill="#EAAB26"
								/>
								<path
									opacity="0.4"
									d="M21.8413 10.3454C22.0161 12.465 20.5083 14.3225 18.4214 14.5738C18.4105 14.5738 18.4105 14.5738 18.3995 14.5738H18.3668C18.3012 14.5738 18.2356 14.5738 18.181 14.5956C17.1212 14.6502 14.4605 14.5446 15.4167 13.6888C16.5421 12.6835 17.1867 11.1757 17.0556 9.53683C16.9791 8.65181 16.6732 7.84328 16.2143 7.15493C16.6295 6.94734 17.1103 6.81622 17.6019 6.77252C19.7434 6.58677 21.6555 8.18199 21.8413 10.3454Z"
									fill="#EAAB26"
								/>
								<path
									d="M23.9733 18.227C23.8859 19.2869 23.2085 20.2047 22.0722 20.8274C20.9796 21.4284 19.6029 21.7125 18.2371 21.6797C19.0238 20.9695 19.4827 20.0845 19.5701 19.1448C19.6794 17.79 19.0347 16.4898 17.7454 15.4518C17.0134 14.8727 15.8427 14.7523 15.2324 14.0751C17.6471 13.3758 20.6846 13.8457 22.5529 15.3535C23.5581 16.162 24.0717 17.1781 23.9733 18.227Z"
									fill="#EAAB26"
								/>
							</svg>
						</div>
						<div>
							<p>Attendees List</p>
							<p class="text-xs text-[#B8BABA]">Shown to guests</p>
						</div>
					</button>
					<ShowAttendeeList bind:open={openShowAttendeeList} />
				</div>
			</div>
		{/if}
	</div>

	<div class="mb-12 border-t {eventData?.attendees?.length > 0 ? 'pt-12' : 'pt-6'}">
		<div class="mb-4 flex items-center justify-between gap-1">
			<h1 class="text-xl font-semibold">Attendee List</h1>
			<div class="flex items-center gap-1">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/download-icon.svg" alt="download icon" />
				</div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/export.svg" alt="export icon" />
				</div>
			</div>
		</div>
		<div class="relative mb-4 w-full">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search"
				class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
			/>
			<span class="absolute top-2.5 left-3 text-gray-400">
				<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
			</span>
		</div>

		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					All Attendees
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Register Time
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>

			{#if eventData?.attendees?.length > 0}
				<div class="" use:clickOutside={() => (showModal = false)}>
					<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
						{#each eventData.attendees as attendee}
							<button
								class="flex items-center justify-between rounded-md border-b py-3 last:border-b-0"
								on:click={() => (showModal = !showModal)}
							>
								<div class="flex items-start gap-2">
									<img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />
									<div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
										<span class="flex items-center gap-1">
											<p class="font-medium">{attendee.name}</p>
											<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
										</span>
										<p class="text-xs text-gray-500 md:text-sm">{attendee.email}</p>
									</div>
								</div>
								<div class="flex flex-col items-center gap-1 lg:flex-row lg:gap-4">
									<div
										class="flex items-center justify-center rounded-full px-2 py-1 text-xs {attendee.status ===
										'Attending'
											? 'bg-[#E3F4E1] text-[#3CBD2C]'
											: 'bg-[#EBECED] text-[#616265]'}"
									>
										{attendee.status}
									</div>
									<div class="text-xs text-gray-500">{attendee.time}</div>
								</div>
							</button>
						{/each}
					</div>
					<AttendeeDetailModal bind:open={showModal} />
				</div>
			{:else}
				<div class="flex h-50 flex-col items-center justify-center">
					<img src="/profile-2user.svg" alt="">
					<p class="text-[#646568]">No Guests Found</p>
					<p class="text-sm text-gray-500">Try searching for something else</p>
				</div>
			{/if}
		</div>
	</div>
</div>
