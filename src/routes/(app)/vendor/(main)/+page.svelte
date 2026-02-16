<script lang="ts">
	import Icon from '@iconify/svelte';

	// =========================================================
	// 🟢 TOGGLE STATE
	// =========================================================
	let hasActivity = true;

	const vendorName = 'Megaexe Limited';

	// 1. STATS DATA HELPERS
	const val = (v: string | number) => (hasActivity ? v : '0');
	const money = (v: string) => (hasActivity ? v : '₦00.00');

	const topStatsRow1 = [
		{
			title: 'Active Listings',
			count: '8',
			icon: '/brand3.svg',
			color: 'text-green-500',
			bg: 'bg-green-50',
			btn: 'View All Listings'
		},
		{
			title: 'Pending Orders',
			count: '12',
			icon: '/brand4.svg',
			color: 'text-purple-500',
			bg: 'bg-purple-50',
			btn: 'Review Orders'
		},
		{
			title: 'Accepted Orders',
			count: '24',
			icon: '/brand2.svg',
			color: 'text-blue-500',
			bg: 'bg-blue-50',
			btn: 'View Accepted'
		}
	];

	const topStatsRow2 = [
		{
			title: 'Total Revenue',
			value: '₦1,250,000',
			icon: '/brand5.svg',
			color: 'text-pink-500',
			bg: 'bg-pink-50',
			type: 'revenue',
			btn: 'View Financials'
		},
		{
			title: 'Profile Views',
			value: '1.2k',
			icon: '/brand6.svg',
			color: 'text-yellow-500',
			bg: 'bg-yellow-50',
			type: 'chart',
			barColor: 'bg-yellow-400',
			fillAmount: 10
		},
		{
			title: 'Order Conversion Rate',
			value: '4.5%',
			icon: 'brand.svg',
			color: 'text-teal-500',
			bg: 'bg-teal-50',
			type: 'chart',
			barColor: 'bg-teal-600',
			fillAmount: 13
		}
	];

	const collaborationRequests = [
		{
			name: 'John Odoemenam',
			email: 'john.odoe...gmail.com',
			event: 'Megaexe Award Ceremony',
			time: '12 Minutes Ago',
			avatar: '/Profile Gravater.svg'
		},
		{
			name: 'John Innocent Tamunosiki',
			email: 'tamunosiki...gmail.com',
			event: 'Megaexe Award Ceremony',
			time: '13 Minutes Ago',
			avatar: '/face-2.svg'
		}
	];

	const eventImage = '/eventcard.png';

	const latestProducts = [
		{
			name: 'Event Management',
			sub: 'Event Venue',
			price: '₦1,250,000',
			date: 'January 25',
			day: 'Monday',
			type: 'Custom Quote',
			status: 'Active',
			statusColor: 'text-green-700 bg-green-100',
			image: eventImage
		},
		{
			name: 'Event Management',
			sub: 'Event Venue',
			price: '₦1,350,000',
			date: 'Sep 25',
			day: 'Wednesday',
			type: 'Custom Quote',
			status: 'Draft',
			statusColor: 'text-gray-700 bg-gray-100',
			image: eventImage
		},
		{
			name: 'Event Management',
			sub: 'Event Venue',
			price: '₦1,350,000',
			date: 'Sep 25',
			day: 'Wednesday',
			type: 'Custom Quote',
			status: 'Archived',
			statusColor: 'text-blue-700 bg-blue-100',
			image: eventImage
		}
	];

	const recentTransactions = [
		{
			name: 'Photography Package',
			id: '#12332',
			type: 'Sale',
			amount: '₦1,250,000',
			status: 'Success',
			time: '12 Minutes Ago'
		},
		{
			name: 'Photography Package',
			id: '#12332',
			type: 'Sale',
			amount: '₦1,250,000',
			status: 'Success',
			time: '12 Minutes Ago'
		},
		{
			name: 'Photography Package',
			id: '#12332',
			type: 'Sale',
			amount: '₦1,250,000',
			status: 'Success',
			time: '12 Minutes Ago'
		}
	];
</script>

<div class="min-h-screen w-full text-[#101828]">
	<div class="mb-8 flex items-center gap-3">
		<img src="/loader.svg" alt="logo" class="h-8 w-8 rounded-lg object-cover" />
		<h1 class="text-2xl font-bold">{vendorName}</h1>
	</div>

	<div class="flex w-full flex-col gap-8">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each topStatsRow1 as stat}
				<div
					class="flex h-[180px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
				>
					<div class="mb-1">
						<div class={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${stat.bg}`}>
							<img src={stat.icon} class={`h-10 w-10`} />
						</div>
						<div class="mb-1 text-3xl font-bold">{val(stat.count)}</div>
						<div class="text-xs text-gray-500">{stat.title}</div>
					</div>
					<button
						class="flex w-full items-center justify-center gap-1 rounded-xl bg-black py-3 text-xs font-bold text-white transition hover:bg-gray-800"
					>
						{stat.btn}
						<Icon icon="heroicons:paper-airplane" class="h-3 w-3 -rotate-45" />
					</button>
				</div>
			{/each}

			{#each topStatsRow2 as stat}
				<div
					class="flex h-[180px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
				>
					<div class="mb-1 w-full">
						<div class="mb-3 flex items-start justify-between">
							<div class={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bg}`}>
								<img src={stat.icon} class={`h-10 w-10`} />
							</div>
							{#if stat.type === 'revenue'}
								<button
									class="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-500"
								>
									<Icon icon="heroicons:bars-3-bottom-left" /> Last 30 Days
								</button>
							{/if}
						</div>

						<div class="mb-1 text-3xl font-bold">
							{stat.type === 'revenue' ? money(stat.value) : hasActivity ? stat.value : '0'}
						</div>
						<div class="text-xs text-gray-500">{stat.title}</div>
					</div>

					{#if stat.type === 'revenue'}
						<button
							class="flex w-full items-center justify-center gap-1 rounded-xl bg-black py-3 text-xs font-bold text-white transition hover:bg-gray-800"
						>
							{stat.btn}
							<Icon icon="heroicons:paper-airplane" class="h-3 w-3 -rotate-45" />
						</button>
					{:else}
						<div class="mt-auto flex h-8 w-full items-end gap-1">
							{#each Array(20) as _, i}
								<div
									class={`h-full flex-1 rounded-sm ${hasActivity && i < (stat.fillAmount || 0) ? stat.barColor : 'bg-gray-100'}`}
								></div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div
			class="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-gray-100 "
		>
			<div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5">
				<h2 class="font-bold text-gray-900">Collaboration Request</h2>

				{#if hasActivity}
					<a
						href="/vendor/collab"
						class="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-200 px-3 py-2 rounded-lg"
					>
						View All Collaboration Requests
						<img src="/arrow-left.svg" alt="arrow" class="h-3 w-3" />
					</a>
				{/if}
			</div>

			<div class="flex flex-1 flex-col justify-center p-5">
				{#if hasActivity}
					<div class="space-y-4">
						{#each collaborationRequests as req}
							<div
								class="grid grid-cols-12 items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
							>
								<div class="col-span-12 flex items-center gap-3 sm:col-span-5">
									<img
										src={req.avatar}
										alt="avatar"
										class="h-10 w-10 shrink-0 rounded-full bg-gray-200"
									/>
									<div class="flex flex-col">
										<div class="flex items-center gap-1">
											<span class="text-sm font-bold text-gray-900">{req.name}</span>
											<span class="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
										</div>
										<span class="text-xs text-gray-400">{req.email}</span>
									</div>
								</div>
								<div class="col-span-12 text-sm font-bold text-gray-900 sm:col-span-3">
									{req.event}
								</div>
								<div class="col-span-6 text-xs text-gray-400 sm:col-span-2">{req.time}</div>
								<div class="col-span-6 text-right sm:col-span-2">
									<button
										class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
										>View Details</button
									>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<div class="mb-4">
							<img src="/empty-state.svg" alt="No data" class="mx-auto h-auto w-32" />
						</div>
						<h3 class="text-sm font-bold text-gray-900">No Collaboration Request, yet</h3>
						<p class="mt-1 max-w-[250px] text-xs text-gray-400">
							Collaboration Request will display once they are added
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="relative min-h-[300px]">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-lg font-bold">Your Latest Products</h2>
				<div class="flex gap-2">
					<button
						class="flex items-center gap-1 rounded-lg bg-gray-300 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-300"
						><img src="/plus.svg" alt="plus" class="h-3 w-3" />  Add New Product</button
					>
					<button
						class="flex items-center gap-2 rounded-lg bg-gray-300 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
					>
						View All Products
						<img src="/arrow-left.svg" alt="arrow" class="h-3 w-3" />
					</button>
				</div>
			</div>

			{#if hasActivity}
  <div class="relative">

    <!-- TIMELINE CONTAINER -->
    <div class="relative space-y-10">

      {#each latestProducts as product}
        <div class="relative flex items-start gap-6">

          <!-- DATE / DAY -->
          <div class="w-24 text-left">
            <p class="text-sm font-bold text-gray-900">{product.date}</p>
            <p class="text-xs text-gray-400">{product.day}</p>
          </div>

          <!-- TIMELINE COLUMN (CONTINUOUS) -->
  <div class="relative hidden md:flex w-[11px] shrink-0 justify-center self-stretch">
    <!-- CONTINUOUS DASHED LINE -->
    <span class="absolute top-0 bottom-0 border-l-2 border-dashed border-[#D9D9D9]"></span>

    <!-- DOT -->
    <span class="relative z-10 mt-2 h-[11px] w-[11px] rounded-full bg-[#D9D9D9]"></span>
  </div>
          <!-- CARD -->
          <div
            class="flex max-w-2xl flex-1 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row"
          >
            <div class="flex flex-1 flex-col justify-between">
              <div>
                <h3 class="text-sm font-bold text-gray-900">
                  {product.name}
                </h3>
                <p class="text-xs text-gray-500">
                  {product.sub}
                </p>
              </div>

              <div class="mt-2 mb-4">
                <span class="text-lg font-bold text-gray-900">
                  {product.price}
                </span>
                <span
                  class="ml-2 inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500"
                >
                  <img src="/edit-icon-2.svg" class="h-3 w-3 opacity-60" />
                  {product.type}
                </span>
              </div>

              <div class="flex flex-wrap gap-2">
                <button class="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-[10px] font-bold text-white">
                  <img src="/edit-icon-2.svg" class="h-3 w-3 brightness-0 invert" />
                  Active
                </button>

                <button class="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
                  <Icon icon="heroicons:document-duplicate" />
                  Duplicate
                </button>

                <button class="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
                  <Icon icon="heroicons:archive-box" />
                  Archive
                </button>

                <button class="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50">
                  <Icon icon="heroicons:trash" />
                  Delete
                </button>
              </div>
            </div>

            <!-- IMAGE -->
            <div
              class="relative h-32 w-full flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 sm:w-32"
            >
              <img
                src={product.image}
                alt={product.name}
                class="h-full w-full object-cover"
              />
              <span
                class={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm ${product.statusColor}`}
              >
                {product.status}
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else}




				<div
					class="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm"
				>
					<div class="mb-4">
						<img src="/empty-state.svg" alt="No products" class="mx-auto h-auto w-32" />
					</div>
					<h3 class="text-sm font-bold text-gray-900">No Product/Services, yet</h3>
					<p class="mt-1 mb-6 max-w-[200px] text-xs text-gray-400">
						You haven't added any products yet. Start by adding your first one!
					</p>
					<button
						class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
					>
						+ Add New Product
					</button>
				</div>
			{/if}
		</div>

		<div
			class="mt-4 flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
		>
			<div class="border-b border-gray-100 p-5">
				<div class="flex items-center gap-2">
					<h2 class="text-lg font-bold text-gray-900">Recent Transactions</h2>
					<span
							class="ml-auto flex h-[25.5px] min-w-[25.5px] items-center justify-center rounded-full border border-black text-[17.2px] font-medium xl:ml-0"
						>
							1
						</span>
				</div>
				<p class="mt-1 text-xs text-gray-500">View transaction history</p>
			</div>

			<div class="flex flex-1 flex-col justify-center p-5">
				{#if hasActivity}
					<div class="space-y-4">
						{#each recentTransactions as tx}
							<div
								class="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
							>
								<div class="flex items-center gap-4">
									<div
										class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#E2E8FC]"
									>
										<svg
											width="20"
											height="20"
											viewBox="0 0 20 20"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M5.83333 1.66666H14.1667C14.6268 1.66666 15 2.03986 15 2.5V17.5L12.5 15.8333L10 17.5L7.5 15.8333L5 17.5V2.5C5 2.03986 5.37319 1.66666 5.83333 1.66666Z"
												stroke="#146AEB"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
											<path
												d="M8.33334 5.83334H11.6667"
												stroke="#146AEB"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
											<path
												d="M8.33334 9.16666H11.6667"
												stroke="#146AEB"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
											<path
												d="M8.33334 12.5H10"
												stroke="#146AEB"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</div>
									<div class="flex flex-col">
										<div class="flex items-center gap-2">
											<span class="text-sm font-bold text-gray-900">{tx.name}</span>
											<span
												class="flex items-center gap-1.5 rounded-full bg-[#FFF7D8] px-2 py-0.5 text-xs font-medium text-gray-900"
											>
												<span class="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
												{tx.type}
											</span>
										</div>
										<span class="mt-1 text-xs text-gray-400">{tx.id}</span>
									</div>
								</div>

								<div class="ml-auto flex items-center gap-6 sm:ml-0 sm:gap-12">
									<span class="text-sm font-bold text-gray-900">{tx.amount}</span>
									<span class="text-xs whitespace-nowrap text-gray-400">{tx.time}</span>
									<span
										class="flex items-center gap-1 rounded-md bg-[#E3F4E1] px-2 py-1 text-[10px] font-bold text-[#3CBD2C]"
									>
										<Icon icon="heroicons:check-circle" class="h-3 w-3" />
										{tx.status}
									</span>
									<button
										class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
										>View Details</button
									>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<div class="mb-4">
							<img src="/empty-state.svg" alt="No transactions" class="mx-auto h-auto w-32" />
						</div>
						<h3 class="text-sm font-bold text-gray-900">No Transaction history, yet</h3>
						<p class="mt-1 text-xs text-gray-400">No recent transactions.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
