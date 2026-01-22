<script lang="ts">
	import Icon from '@iconify/svelte';

	const vendorName = 'Sleekwareandslides';
	const hasActivity = true; // shows populated states


	const summaryCards = [
		{
			title: 'Active Engagements',
			value: 0,
			icon: 'heroicons:briefcase',
			iconBg: 'bg-green-50',
			iconColor: 'text-green-600',
			barColor: 'bg-green-600',
			fill: 12,
			fillAmount: 12,
			btn: 'View All Engagements'
		},
		{
			title: 'Pending Invitations',
			value: 0,
			icon: 'heroicons:envelope',
			iconBg: 'bg-purple-50',
			iconColor: 'text-purple-600',
			barColor: 'bg-purple-600',
			fill: 10,
			fillAmount: 10,
			btn: 'Review Now'
		},
		{
			title: 'Portfolio Views',
			value: 0,
			icon: 'heroicons:eye',
			iconBg: 'bg-blue-50',
			iconColor: 'text-blue-600',
			barColor: 'bg-blue-600',
			fillAmount: 11,
			btn: 'View Profile'
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

	const listItems = Array(3).fill({
		title: 'Megaexe Award Ceremony',
		time: '12 Minutes Ago'
	});
</script>

<div class="min-h-screen w-full text-[#101828]">
		<!-- HEADER -->
		<div class="mb-6 flex items-center gap-3">
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
				<img src="/edit-cover-photo.svg" alt="logo" class="h-8 w-8 rounded-lg object-cover" />
			</div>
			<h1 class="text-lg font-bold text-gray-900">{vendorName}</h1>
		</div>

		<!-- SUMMARY CARDS -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each summaryCards as card}
				<div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div class="flex items-start justify-between">
						<div>
							<div class="text-2xl font-bold text-gray-900">
								{hasActivity ? card.value : 0}
							</div>
							<div class="text-xs text-gray-500">{card.title}</div>
						</div>

						<div class={`flex h-9 w-9 items-center justify-center rounded-full ${card.iconBg}`}>
							<Icon icon={card.icon} class={`h-5 w-5 ${card.iconColor}`} />
						</div>
					</div>

					<!-- MINI BARS -->
					<div class="mt-4 flex h-4 items-end gap-0.5">
						{#each Array(20) as _, i}
								<div
									class={`h-full flex-1 rounded-sm ${hasActivity && i < (card.fillAmount || 0) ? card.barColor : 'bg-gray-100'}`}
								></div>
							{/each}
					</div>

					<button
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-black py-2 text-xs font-semibold text-white"
					>
						{card.btn}
						<Icon icon="heroicons:paper-airplane" class="h-3 w-3 -rotate-45" />
					</button>
				</div>
			{/each}
		</div>

		<!-- PORTFOLIO SECTION -->
<div class="mb-8 rounded-xl xl:p-5">
	<!-- HEADER ROW -->
<div class="mb-6 flex items-center justify-between gap-6 flex-nowrap">
	<!-- LEFT: Title + Count + Subtitle -->
	<div class="flex min-w-0 items-center gap-4">
		<div class="min-w-0">
			<div class="flex items-center gap-3">
				<h2
					class="truncate text-[24px] text-[#192226] xl:text-[27.02px]"
				>
					My Latest Portfolio Entries
				</h2>

				<span
					class="flex h-[29.5px] min-w-[29.5px] items-center justify-center rounded-full border border-black text-[17.2px] font-medium"
				>
					1
				</span>
			</div>

			<p class="truncate text-[19.65px] text-[#737577]">
				Recently added talks or presentations
			</p>
		</div>
	</div>

	<!-- RIGHT: Buttons -->
	<div class="flex shrink-0 items-center gap-3">
		<button
			class="flex h-[44.65px] items-center gap-2 rounded-lg bg-[#00000033] px-4 text-[17.2px] font-normal shadow-sm transition hover:bg-gray-200"
		>
			Add New Engagement
			<img src="arrow-right-black.svg" class="w-[12px]" />
		</button>

		<button
			class="flex h-[44.65px] items-center gap-2 rounded-lg bg-[#00000033] px-4 text-[17.2px] font-normal shadow-sm transition hover:bg-gray-200"
		>
			View All Portfolio
			<img src="arrow-right-black.svg" class="w-[12px]" />
		</button>
	</div>
</div>


	<!-- CONTENT -->
	<div class="flex flex-1 flex-col justify-center px-1">
		{#if hasActivity}
			<div class="space-y-4">
				{#each listItems as item}
					<div class="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
						<div class="col-span-12 flex items-center gap-3 sm:col-span-5">
									<img
										src="/green-cube.svg"
										alt="avatar"
										class="h-10 w-10 shrink-0 rounded-full bg-gray-200"
									/>
									<div class="flex flex-col">
										<div class="flex items-center gap-1">
											<span class="text-sm font-bold text-gray-900">{item.title}</span>

										</div>
									</div>
								</div>
						<p class="font-medium text-gray-900">{item.title}</p>

						<div class="flex items-center gap-6 text-sm text-gray-500">
							<span>{item.time}</span>
							<button class="rounded-lg bg-gray-200 px-3 py-1 hover:bg-gray-300">
								View Details
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-6 text-center">
				<img src="/empty-state.svg" alt="No data" class="mb-4 w-32" />
				<h3 class="text-sm font-bold text-gray-900">
					No Portfolio Entries, yet
				</h3>
				<p class="mt-1 max-w-[250px] text-xs text-gray-400">
					Portfolio Request will display once they are added
				</p>
			</div>
		{/if}
	</div>
</div>

		

		<!-- COLLABORATION REQUESTS -->
		<div class="mb-8 rounded-xl xl:p-5">
			<div
				class="mb-6 flex flex-col items-start justify-between space-y-5 xl:flex-row xl:items-center"
			>
				<div class="w-full xl:w-auto">
					<div class="mb-1 flex items-center gap-3">
						<h2 class="text-[24px] text-[#192226] xl:text-[27.02px]">
							Recent Collaboration Requests
						</h2>
						<span
							class="ml-auto flex h-[29.5px] min-w-[29.5px] items-center justify-center rounded-full border border-black text-[17.2px] font-medium xl:ml-0"
						>
							1
						</span>
					</div>
					<p class="text-[19.65px] text-[#737577]">
						 New requests from Organizers.
					</p>
				</div>

				<button
					class="flex h-[44.65px] items-center gap-2 rounded-lg bg-[#00000033] px-4 py-2 text-[17.2px] font-normal shadow-sm transition-colors hover:bg-gray-200"
				>
					View All Collaboration
					<img src="arrow-right-black.svg" alt="arrow-right-black" class="w-[12px]" />
				</button>
			</div>
			<div class="flex flex-1 flex-col justify-center p-0"><span class="text-gray-500">12 Minutes Ago</span></div>
			
			<div class="flex flex-1 flex-col justify-center p-5">
				{#if hasActivity}
					<div class="space-y-4">
						{#each listItems as item}
				<div
					class="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
				>
				<div class="col-span-12 flex items-center gap-3 sm:col-span-5">
									<img
										src="/edit-cover-photo.svg"
										alt="avatar"
										class="h-10 w-10 shrink-0 rounded-full bg-gray-200"
									/>
									<div class="flex flex-col">
										<div class="flex items-center gap-1">
											<span class="text-sm font-bold text-gray-900">Megaexe Limited</span>

										</div>
									</div>
								</div>
					<p class="font-medium">{item.title}</p>
					<div class="flex items-center gap-4 text-sm">
						<span class="text-gray-500">{item.time}</span>
						<span
							class="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700"
						>
							Pending
						</span>
						<button class="rounded-lg bg-gray-200 px-3 py-1">
							Review
						</button>
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

		<!-- TRANSACTIONS -->
		<div class="xl:p-5">
			<div
				class="mb-6 flex flex-col items-start justify-between space-y-5 xl:flex-row xl:items-center"
			>
				<div class="w-full xl:w-auto">
					<div class="mb-1 flex items-center gap-3">
						<h2 class="text-[24px] text-[#192226] xl:text-[27.02px]">Recent Transactions</h2>
						<span
							class="ml-auto flex h-[29.5px] min-w-[29.5px] items-center justify-center rounded-full border border-black text-[17.2px] font-medium xl:ml-0"
						>
							1
						</span>
					</div>
					<p class="text-[19.65px] text-[#737577]">Latest payments recieved for speaking <br>Engagements</p>
				</div>
				<button
					class="flex h-[44.65px] items-center gap-2 rounded-lg bg-[#00000033] px-4 py-2 text-[17.2px] font-normal shadow-sm transition-colors hover:bg-gray-200"
				>
					View All Transactions
					<img src="arrow-right-black.svg" alt="arrow-right-black" class="w-[12px]" />
				</button>
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
