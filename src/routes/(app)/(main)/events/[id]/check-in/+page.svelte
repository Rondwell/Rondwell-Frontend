<script>
	import { clickOutside } from '$lib/utils/constant';
	import { goto } from '$app/navigation';
	import CheckedInAttendeeModal from './components/CheckedInAttendeeModal.svelte';
	import ScanAttendeeModal from './components/ScanAttendeeModal.svelte';

	let searchQuery = '';
	let showModal = false;
	let showScanModal = false;

	const eventData = {
		title: 'Megaexe Party',
		startTime: 'Starting in 2 Days',
		checkedInAttendees: [
			{
				name: 'Anonymous',
				email: 'megaexenome@gmail.com',
				ticketType: 'Standard Ticket',
				status: 'Checked-In',
				time: 'this minute'
			},
			{
				name: 'John Mesbon',
				email: 'megaexenome@gmail.com',
				ticketType: 'Premium Ticket',
				status: 'Checked-In',
				time: '2 hours ago'
			}
		]
	};
</script>

<div class="max-w-6xl">
	<!-- Back Button and Event Info -->
	<div class="mb-6 flex items-center gap-3">
		<button
			on:click={() => goto(`/events/${1}/attendees`)}
			class="flex items-center gap-2 text-gray-600 hover:text-gray-800"
		>
			<img src="/back-button.svg" alt="back" class="h-8 w-8" />
		</button>

		<img src="/Title-icon.svg" alt="title icon" class="h-12 w-12" />
		
		<div>
			<h1 class="text-xl font-semibold">{eventData.title}</h1>
			<p class="text-sm text-gray-500">{eventData.startTime}</p>
		</div>
	</div>

	<!-- Scan Attendee Button -->
	<div class="mb-6">
		<button
			on:click={() => (showScanModal = true)}
			class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-70 md:w-fit"
		>
			<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#E3F4E1]">
				<img src="/scan-icon.svg" alt="scan icon" class="h-6 w-6" />
			</div>
			Scan Attendee
		</button>
	</div>

	<!-- Attendee Checked-in List Section -->
	<div class="mb-12 border-t pt-6">
		<div class="mb-4 flex items-center justify-between gap-1">
			<h1 class="text-xl font-semibold">Attendee Checked-in List</h1>
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
				<img src="/search-favorite.svg" alt="search icon" class="h-5 w-5" />
			</span>
		</div>

		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					All Guests
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				<button
					class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Check-in Time
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>

			{#if eventData?.checkedInAttendees?.length > 0}
				<div class="" use:clickOutside={() => (showModal = false)}>
					<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
						{#each eventData.checkedInAttendees as attendee}
							<button
								class="flex items-center justify-between rounded-md border-b py-3 last:border-b-0"
								on:click={() => (showModal = !showModal)}
							>
								<div class="flex items-start gap-2">
									<img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />
									<div class="flex flex-col items-start gap-1">
										<p class="font-medium">{attendee.name}</p>
										<p class="text-xs text-gray-500">{attendee.email}</p>
									</div>
								</div>
								<div class="flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-4">
									<div
										class="flex items-center justify-center rounded-full bg-[#E3F4E1] px-2 py-1 text-xs text-[#3CBD2C]"
									>
										{attendee.status}
									</div>
									<div class="text-xs text-gray-500">{attendee.ticketType}</div>
									<div class="text-xs text-gray-500">{attendee.time}</div>
								</div>
							</button>
						{/each}
					</div>
					<CheckedInAttendeeModal bind:open={showModal} />
				</div>
			{:else}
				<div class="flex h-50 flex-col items-center justify-center">
					<img src="/profile-2user.svg" alt="" />
					<p class="text-[#646568]">No Checked-in Attendees</p>
					<p class="text-sm text-gray-500">Scan attendees to check them in</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<ScanAttendeeModal bind:open={showScanModal} />
