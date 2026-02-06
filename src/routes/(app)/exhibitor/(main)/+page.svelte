<script>
	import { TrendingUp, ArrowRight } from 'lucide-svelte';

	let stats = {
		totalBoothViews: { value: 1245, change: -2 },
		leadsCaptured: { value: 128, change: +5 },
		activeParticipations: { value: 6, change: +5 },
		pendingApplications: { value: 8, change: +5 }
	};

	let collaborationRequests = [
		{ id: 1, from: 'John Odoemenem', for: 'Megaexe award ceremony' },
		{ id: 2, from: 'John Odoemenem', for: 'Megaexe Induction ceremony' },
		{ id: 3, from: 'John Odoemenem', for: 'Megaexe award ceremony' }
	];

	let booths = [
		{ id: 1, name: 'Popcorn Booth', time: '12 Minutes Ago' },
		{ id: 2, name: 'Food Stand', time: '12 Minutes Ago' }
	];

	let transactions = [
		{
			id: 1,
			to: 'Megaexe Limited',
			for: 'Megaexe Award Ceremony',
			amount: '₦1,250,000',
			time: '12 Minutes Ago'
		},
		{
			id: 2,
			to: 'Megaexe Limited',
			for: 'Megaexe Award Ceremony',
			amount: '₦1,250,000',
			time: '12 Minutes Ago'
		}
	];
</script>

<div class="min-h-screen xl:p-8">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-2 flex items-center gap-5">
				<img alt="loader" src="/loader.svg" class="hidden h-[28.5px] w-[28.5px] md:block" />
				<h1 class="text-[24px] font-normal text-gray-900 xl:text-[35.25px]">Sleekwareandslides</h1>
			</div>
			<p
				class="mt-5 flex flex-wrap items-center text-[18px] text-[#00000080] md:mt-10 xl:text-[29.48px]"
			>
				Welcome Back <span class="font-semibold text-[#171717] ml-3"> Megaexe Limited</span>
				<span class="text-text-[29.48px]">👋🏻</span>
			</p>
		</div>

		<!-- Stats Grid -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
			{#each Object.entries(stats) as [key, stat]}
				<div class="rounded-xl border border-[#EBEBEB] bg-white px-6 py-3 xl:py-6 shadow-sm">
					<div class="mb-5 flex items-center justify-between">
						<img alt="arrow-left-down" src="arrow-left-down.svg" class="w-[29.6px]" />
						<img src="/Chart.svg" alt="chart" class="w-[88.8px]" />
					</div>
					<div class="flex flex-col">
						<div class="text-[12.28px] tracking-wider text-[#5C5C5C]">
							{key === 'totalBoothViews'
								? 'Total Booth Views'
								: key === 'leadsCaptured'
									? 'Leads Captured'
									: key === 'activeParticipations'
										? 'Active Event Participations'
										: 'Pending Applications'}
						</div>
						<div class="flex items-center gap-2">
							<div class="text-[23.67px] font-medium text-[#171717]">
								{stat.value.toLocaleString()}
							</div>
							<div
								class="flex h-[14.7px] w-[29.5px] items-center justify-center rounded-full text-[8.88px] font-medium {stat.change <
								0
									? 'bg-[#FFC0C5] text-[#681219]'
									: 'bg-[#C2F5DA] text-[#0B4627]'}"
							>
								{stat.change > 0 ? '+' : ''}{stat.change}%
							</div>
						</div>
					</div>
					<!-- <svg class="w-full h-12 mt-4 border-8" viewBox="0 0 100 30">
            <path
              d="M0,15 Q25,10 50,15 T100,12"
              fill="none"
              stroke="#6366f1"
              stroke-width="2"
              opacity="0.3"
            />
          </svg> -->
				</div>
			{/each}
		</div>

		<div class="my-10 h-[1px] w-full bg-[#E2E4E5]"></div>

		<!-- Recent Collaboration Requests -->
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
							4
						</span>
					</div>
					<p class="text-[19.65px] text-[#737577]">
						You have <span class="text-[#000000]">3</span> new requests.
					</p>
				</div>

				<button
					class="flex h-[44.65px] items-center gap-2 rounded-lg bg-[#00000033] px-4 py-2 text-[17.2px] font-normal shadow-sm transition-colors hover:bg-gray-200"
				>
					View All Request
					<img src="arrow-right-black.svg" alt="arrow-right-black" class="w-[12px]" />
				</button>
			</div>

			<div class="flex flex-col items-stretch  gap-8 xl:flex-row">
				<div
					class="relative flex min-h-[257.5px] w-full flex-col justify-between rounded-[13.51px] bg-[#FDFDFD] px-5 py-6 text-left xl:w-[235px]"
				>
					<p class="mb-2 text-[24.57px] text-[#B6B7B7]">
						You have <span class="text-black">3</span> new <br />requests.
					</p>
					<div class="text-[44.17px] font-bold text-black">
						3<span class="text-[29.48px] text-[#0000004D]">/40</span>
					</div>
					<div
						class="absolute top-4 right-4 h-[20px] w-[18px] cursor-pointer xl:h-[17px] xl:w-[13.7px]"
					>
						<img src="/fullscreen.svg" alt="fullscreen" class="h-full w-full" />
					</div>
				</div>

				<div
					class=" w-full flex-1 flex-col justify-between space-y-3 rounded-[13.51px] bg-[#FDFDFD] py-5"
				>
					<div
						class="mb-3 block w-full border-b-[1.23px] border-[#EAEBEB] px-5 text-[16.57px] font-normal tracking-wide text-gray-400 uppercase xl:hidden"
					>
						Recently Request
					</div>
					<div
						class="mb-3 hidden w-full border-b-[1.23px] border-[#EAEBEB] px-5 text-[16.57px] font-normal tracking-wide text-gray-400 uppercase xl:block"
					>
						Recently <br />Request
					</div>

					{#each collaborationRequests as request}
						<div
							class="flex w-full  flex-col gap-3 border-b-[1.23px] border-[#EAEBEB] px-5 py-2 last:border-0 xl:flex-row xl:items-center"
						>
							<span class="text-[19.65px] text-[#808080]">Invitation from</span>
							<div class="flex gap-3" >
								<div class="flex w-[33.34px] items-center justify-center">
									<img src="Profile Gravater.svg" alt="Profile Gravater" class="h-full w-full" />
								</div>
								<span class="text-[18.65px] text-[#131517]" >{request.from}</span>
							</div>
							<span  class="text-[18.65px] text-[#808080] flex-1 w-full xl:w-60 truncate xl:truncate-none bg-blue-50 break-words" >for {request.for}</span>
							
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="my-10 h-[1px] w-full bg-[#E2E4E5]"></div>

		<!-- My Latest Booths and Stands -->
		<div class="mb-8 xl:p-5">
			<div
				class="mb-6 flex flex-col items-start justify-between space-y-5 xl:flex-row xl:items-center"
			>
				<div class=" w-full xl:w-auto">
					<div class="mb-1 flex w-full items-center gap-3">
						<h2 class="text-[24px] text-[#192226] xl:text-[27.02px]">
							My Latest Booths and Stands
						</h2>
						<span
							class="ml-auto flex h-[29.5px] min-w-[29.5px] items-center justify-center rounded-full border border-black text-[17.2px] font-medium xl:ml-0"
						>
							2
						</span>
					</div>
					<p class="text-[19.65px] text-[#737577]">Latest Payments & Transactions</p>
				</div>
				<button
					class="flex h-[44.65px] items-center gap-2 rounded-lg bg-[#00000033] px-4 py-2 text-[17.2px] font-normal shadow-sm transition-colors hover:bg-gray-200"
				>
					Manage Booths
					<img src="arrow-right-black.svg" alt="arrow-right-black" class="w-[12px]" />
				</button>
			</div>

			<div class="space-y-4">
				{#each booths as booth}
					<div
						class="flex flex-col items-start justify-between space-y-3 rounded-[13.8px] bg-white px-5 py-3 last:border-0 xl:flex-row xl:items-center"
					>
						<div class="flex items-center gap-5">
							<div class="flex w-[33.34px] items-center justify-center">
								<img src="Profile Gravater.svg" alt="Profile Gravater" class="h-full w-full" />
							</div>
							<span class="w-[150px] text-[19.65px] font-normal text-[#131517]">{booth.name}</span>
						</div>
						<div class="flex items-center gap-4">
							<span class="text-[17.49px] text-[#A9AAAA]">{booth.time}</span>
						</div>
						<button
							class="flex h-[31.94px] items-center rounded-[7.37px] bg-[#EBECED] px-2 text-[16.57px] font-normal transition-colors hover:bg-gray-200"
						>
							View Details
						</button>
					</div>
				{/each}
			</div>
		</div>

		<div class="my-10 h-[1px] w-full bg-[#E2E4E5]"></div>

		<!-- Recent Transaction History -->
		<div class="xl:p-5">
			<div
				class="mb-6 flex flex-col items-start justify-between space-y-5 xl:flex-row xl:items-center"
			>
				<div class="w-full xl:w-auto">
					<div class="mb-1 flex items-center gap-3">
						<h2 class="text-[24px] text-[#192226] xl:text-[27.02px]">Recent Transaction History</h2>
						<span
							class="ml-auto flex h-[29.5px] min-w-[29.5px] items-center justify-center rounded-full border border-black text-[17.2px] font-medium xl:ml-0"
						>
							2
						</span>
					</div>
					<p class="text-[19.65px] text-[#737577]">Your Latest Booths</p>
				</div>
				<button
					class="flex h-[44.65px] items-center gap-2 rounded-lg bg-[#00000033] px-4 py-2 text-[17.2px] font-normal shadow-sm transition-colors hover:bg-gray-200"
				>
					View All Transactions
					<img src="arrow-right-black.svg" alt="arrow-right-black" class="w-[12px]" />
				</button>
			</div>

			<div class="space-y-4">
				{#each transactions as transaction}
					<div
						class="flex flex-col items-start justify-between rounded-[13.8px] bg-white px-5 py-5 last:border-0 xl:flex 2xl:flex-row"
					>
						<div class="flex items-center gap-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
								<img src="Brand-desktop.svg" alt="Brand" class="w-[40.52px]" />
							</div>
							<div>
								<p class="text=[16px] text-[#131517] lg:text-[19.65px]">
									<span class="text-[#808080]">Payment to </span>
									<span class="font-bold">{transaction.to}</span>
									<span class="text-[#808080]"> for </span>
									<span class="font-bold">{transaction.for}</span>
								</p>
							</div>
						</div>
						<div
							class="flex w-full flex-col items-start gap-4 xl:mt-3 xl:flex-row xl:items-center xl:justify-between xl:pl-15 2xl:mt-0 2xl:pl-0"
						>
							<div class="mt-4 flex items-center gap-4 xl:mt-0">
								<span class="block text-[15px] text-[#B6B7B7] xl:hidden">#12332</span>
								<span class="-mr-2 block text-[17.49px] text-black xl:hidden">Sale</span>
								<span class="text-[17.49px] font-bold text-[#171717] xl:text-[19.65px]"
									>{transaction.amount}</span
								>
							</div>

							<div
								class="flex flex-col-reverse gap-3 xl:flex-row-reverse xl:justify-between 2xl:flex-col"
							>
								<button
									class="flex h-[31.94px] items-center rounded-[7.37px] bg-[#EBECED] px-3 text-[16.57px] font-normal transition-colors hover:bg-gray-200"
								>
									View Details
								</button>
								<p class="mt-1 text-[17.49px] text-[#A9AAAA] xl:text-[17.49px]">
									{transaction.time}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
