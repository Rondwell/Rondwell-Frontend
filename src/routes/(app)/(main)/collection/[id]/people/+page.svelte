<script lang="ts">
	import SubscriberDetailModal from './SubscriberDetailModal.svelte';

	// Mock data

	let subscribers = [
		{
			id: '1',
			name: 'John Odoemene',
			payment: '$48.00',
			events: [
				{
					title: 'Megaexe Party',
					date: 'Jan 25',
					status: 'Attending'
				}
			],

			email: 'johnmedoc23@gmail.com',
			joinedAt: formatDate(new Date())
		},
		{
			id: '2',
			name: 'Joe Ken',
			payment: '',
			events: [
				{
					title: 'Multiflex Party',
					date: 'September 25',
					status: 'Not attending'
				}
			],
			email: 'smartme783@gmail.com',
			joinedAt: formatDate(new Date())
		},
		{
			id: '3',
			name: '',
			payment: '$128.00',
			events: [
				{
					title: 'Pool Party',
					date: 'Dec 26',
					status: 'Attending'
				}
			],
			email: 'johnmedoce23@gmail.com',
			joinedAt: formatDate(new Date())
		}
	];
	let searchQuery = '';

	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Derived state
	$: subscriberCount = subscribers?.length;

	// Modal state
	let selectedSubscriber: any = null;
	let isSubscriberModalOpen = false;

	function openSubscriber(subscriber: any) {
		selectedSubscriber = {
			...subscriber,
			events: subscriber.events ?? [],
			eventsCount: subscriber.events?.length ?? 0,
			checkIns: 0,
			revenue: 0,
			tags: []
		};

		isSubscriberModalOpen = true;
	}

	function closeSubscriberModal() {
		selectedSubscriber = null;
		isSubscriberModalOpen = false;
	}
</script>

<section class="p-4">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="align-center flex justify-center gap-2 text-lg font-semibold">
			<span> People </span>
			<div class="relative inline-flex items-center justify-center">
				<img src="/circle.svg" alt="" class="h-6 w-6" />
				<span class="absolute text-xs">{subscriberCount}</span>
			</div>
		</h2>

		<button class="flex gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm text-[#616265]">
			<img src="/add-icon.svg" alt="add people" class="h-4 w-4" /> Add People
		</button>
	</div>

	<!-- Description -->
	<p class="mb-4 text-sm text-[#737577]">
		Manage your subscribers and event attendees. Event guests are automatically added to this list.
	</p>

	<div class="mb-4 gap-3">
		<div class="relative w-full">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search"
				class="mb-2 h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none"
			/>
			<span class="absolute top-2.5 left-3 text-gray-400">
				<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
			</span>
			<span class="absolute top-2.5 right-0 border-l px-4 py-1.5 text-gray-400">
				<img src="/search-download.svg" alt="" class="h-4 w-4" />
			</span>
		</div>
		<div class="mb-3 flex items-center justify-between">
			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
			>
				<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
				Filter
				<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
			</button>
			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
			>
				<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
				Recently joined
				<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
			</button>
		</div>
	</div>

	{#if subscriberCount === 0}
		<!-- EMPTY STATE -->
		<div class="mt-20 flex flex-col items-center justify-center gap-4">
			<img src="/noEvent.svg" alt="No Events" class="ml-4 h-60 w-60" />
			<h2 class="text-lg font-semibold text-[#646568]">No Subscribers, yet</h2>
			<p class="max-w-md text-center text-[#A2ACB2]">
				When people subscribe to your calendar, they will appear here.
			</p>
		</div>
	{:else}
		<!-- LIST STATE -->

		<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
			{#each subscribers as subscriber}
				<button
					class="my-0.5 flex items-center justify-between rounded-md border-b py-3 last:border-b-0"
					on:click={() => openSubscriber(subscriber)}
				>
					<div class="flex items-start gap-2">
						<img src="/rondwell-attendee.png" alt="profile icon" class="h-6 w-6 rounded-full" />

						<div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
							<span class="flex items-center gap-1">
								{#if !subscriber?.name}
									<p class="font-medium text-gray-500">Anonymous</p>
								{:else}
									<p class="font-medium">{subscriber.name}</p>
									<span class="h-2 w-2 rounded-full bg-[#EAAB26]"></span>
								{/if}
							</span>

							<p class="text-xs text-gray-500 md:text-sm">
								{subscriber?.email}
							</p>
						</div>
					</div>

					<div class="text-xs text-gray-500">
						{subscriber?.joinedAt}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</section>

<!-- Subscriber modal -->
{#if selectedSubscriber}
	<SubscriberDetailModal subscriber={selectedSubscriber} on:close={closeSubscriberModal} />
{/if}
