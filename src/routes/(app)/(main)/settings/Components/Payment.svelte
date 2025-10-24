<!-- src/routes/settings/payment/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';

	let paymentMethods = [];

	let hasCollection = false;
	let isRondwellPlusActive = false;

	let paymentHistory: any[] = [];

	// Function to add a card
	const addCard = () => {
		console.log('Adding a new card...');
		// In a real app, this would open a modal or redirect to a payment form
	};

	// Function to learn more about Rondwell Plus
	const learnMore = () => {
		console.log('Learning more about Rondwell Plus...');
		// In a real app, this would open a modal or redirect to a details page
	};

	// Function to create a calendar
	const createCalendar = () => {
		console.log('Creating a calendar...');
		// In a real app, this would redirect to calendar creation
	};

	// Function to filter payment history
	const filterPayments = (e: Event) => {
		console.log('Filtering payments by:', (e.target as HTMLSelectElement).value);
		// In a real app, this would filter the payment history
	};

	let open = false;
	let selected = 'Filter';
	let options = ['Last Month', 'Last Year', 'All Time'];

	function selectOption(option: string) {
		selected = option;
		open = false;
	}
</script>

<div class="mb-12">
	<!-- Page Header -->
	<h1 class="mb-1 text-2xl font-medium">Payment Methods</h1>
	<p class="mb-4 text-sm text-[#8C8F93]">
		Your saved payment methods are encrypted and stored securely by PayPal & Flutterwave.
	</p>

	<!-- Add Card Button -->
	<button
		on:click={addCard}
		class="flex items-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800"
	>
		<Icon icon="mdi:plus" class="text-xl" />
		Add Card
	</button>
</div>

<!-- Rondwell Plus Section -->
<div class="mb-12 border-t pt-12">
	<div class="mb-4 flex flex-col items-start justify-between gap-1 md:flex-row">
		<div>
			<h2 class="mb-1 text-lg font-semibold">Rondwell Plus</h2>
			<p class="text-sm text-[#8C8F93]">
				Enjoy 0% platform fees, higher invite and admin limits, priority support, and more.
			</p>
		</div>
		<button
			on:click={learnMore}
			class="flex items-start gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm font-medium text-[#5D646F] transition-colors hover:bg-gray-200"
		>
			Learn More
			<img src="/send-icon.png" alt="icon" class="h-3 w-3" />
		</button>
	</div>

	<div>
		{#if !hasCollection}
			<div class="mb-1 rounded-lg bg-[#FDFDFD] p-4">
				<div class="flex items-start gap-1">
					<img src="/calender.svg" alt="calender icon" />
					<div class="text-[#A9AAAA]">
						<div class="font-medium">No Collection</div>
						<div class="mt-1 text-sm">
							You have no Collection. To sign up for Rondwell Plus, please first
							<button on:click={createCalendar} class="font-medium text-[#F51A7C] hover:underline">
								create a calendar.
							</button>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- This would show if user has a collection -->
			<div class="mb-1 rounded-lg bg-[#FDFDFD] p-4">
				<div class="flex items-start gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-200">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-green-600"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div>
						<div class="font-medium">Collection Available</div>
						<div class="mt-1 text-sm text-gray-600">
							You can now sign up for Rondwell Plus with your existing collection.
						</div>
					</div>
				</div>
			</div>
		{/if}

		<p class="text-sm font-light text-[#84857A]">
			Rondwell Pro applies on the calendar level. Choose the desired calendar above to manage its
			Rondwell Plus membership.
		</p>
	</div>
</div>

<!-- Payment History Section -->
<div class="mb-12 border-t pt-12">
	<div class="mb-4 flex items-start justify-between">
		<div>
			<h2 class="mb-1 text-lg font-semibold">Payment History</h2>
			<p class="mb-4 text-sm text-[#8C8F93]">Track all your payments on Rondwell</p>
		</div>
		<div class="relative inline-block text-left">
			<!-- Trigger button -->
			<button
				on:click={() => (open = !open)}
				class="flex w-[108.75px] items-center gap-2 rounded-lg bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265]"
			>
				<img src="/filter-edit.svg" alt="filter" class="h-5 w-5" />
				<span>{selected}</span>
				<img src="/arrow-down.svg" alt="arrow" class="ml-auto h-2 w-3" />
			</button>

			<!-- Dropdown -->
			{#if open}
				<div
					class="absolute left-0 z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
				>
					{#each options as option}
						<button
							class="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
							on:click={() => selectOption(option)}
						>
							{option}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if paymentHistory.length === 0}
		<div class="py-12 text-center">
			<div class="flex flex-col items-center justify-center gap-2">
				<img src="/payment.png" alt="payslip" class="h-70 w-60" />
				<h3 class="mb-2 text-xl font-semibold">No Payments</h3>
				<p class="text-sm text-gray-300">You have not made any payments on Rondwell.</p>
			</div>
		</div>
	{:else}
		<!-- This would show if there were payment history -->
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<div class="space-y-4">
				{#each paymentHistory as payment}
					<div
						class="flex items-center justify-between border-b border-gray-100 p-3 last:border-b-0"
					>
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-blue-600"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2zm6 4a2 2 0 100-4h-2v4h2z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div>
								<div class="font-medium">{payment.description}</div>
								<div class="text-sm text-gray-500">{payment.date}</div>
							</div>
						</div>
						<div class="font-semibold">{payment.amount}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
