<script lang="ts">
	import SubscriberDetailModal from "../../people/SubscriberDetailModal.svelte";

	

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
	<!-- Header -->
	<div class="hidden sm:justify-between lg-block md:mb-10 md:flex">
		<div class="flex items-center justify-between">
			<img src="/tech-icon.svg" alt="icon" class="h-7 w-7" />
			<h1 class="ml-2 lg:text-2xl text-md">Business Collection</h1>
		</div>
		<button
			class="flex items-center gap-2 w-fit rounded-md bg-[#DCE4EE] px-3 whitespace-nowrap md:text-sm text-[#5D646F]"
		>
			<span class="md:text-sm">Calendar Page</span>
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
	<div class="mb-4 flex items-center justify-between">
		<h2 class="align-center flex justify-center gap-2 text-lg font-semibold">
			<span> Admins </span>
			<div class="relative inline-flex items-center justify-center">
				<img src="/circle.svg" alt="" class="h-6 w-6" />
				<span class="absolute text-xs">{subscriberCount}</span>
			</div>
		</h2>

		<button class="flex gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm text-[#616265]">
			<img src="/add-icon.svg" alt="add people" class="h-4 w-4" /> Add Admins
		</button>
	</div>

	<!-- Description -->
	<p class="mb-4 text-sm text-[#737577]">
		Admins have full access to the calendar and can approve events. 
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
						<img src="/face-1.svg" alt="profile icon" class="h-6 w-6" />

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
