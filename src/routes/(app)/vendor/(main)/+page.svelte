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
			icon: 'heroicons:cube', 
			color: 'text-green-500', 
			bg: 'bg-green-50', 
			btn: 'View All Listings' 
		},
		{ 
			title: 'Pending Orders', 
			count: '12', 
			icon: 'heroicons:clock', 
			color: 'text-purple-500', 
			bg: 'bg-purple-50', 
			btn: 'Review Orders' 
		},
		{ 
			title: 'Accepted Orders', 
			count: '24', 
			icon: 'heroicons:cube', 
			color: 'text-blue-500', 
			bg: 'bg-blue-50', 
			btn: 'View Accepted' 
		}
	];

	const topStatsRow2 = [
		{ 
			title: 'Total Revenue', 
			value: '₦1,250,000', 
			icon: 'heroicons:banknotes', 
			color: 'text-pink-500', 
			bg: 'bg-pink-50', 
			type: 'revenue',
			btn: 'View Financials' 
		},
		{ 
			title: 'Profile Views', 
			value: '1.2k', 
			icon: 'heroicons:user', 
			color: 'text-yellow-500', 
			bg: 'bg-yellow-50', 
			type: 'chart',
			barColor: 'bg-yellow-400',
			fillAmount: 10 
		},
		{ 
			title: 'Order Conversion Rate', 
			value: '4.5%', 
			icon: 'heroicons:arrow-path', 
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
			avatar: '/face.svg' 
		},
		{
			name: 'John Innocent Tamunosiki',
			email: 'tamunosiki...gmail.com',
			event: 'Megaexe Award Ceremony',
			time: '13 Minutes Ago',
			avatar: '/face-1.svg' 
		}
	];

	const eventImage = '/eventcard.png';

	const latestProducts = [
		{
			name: 'Event Management',
			sub: 'Event Venue',
			price: '₦1,250,000',
			date: 'Jan 25',
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
			time: '12 Minutes Ago', 
		},
		{ 
			name: 'Photography Package', 
			id: '#12332',
			type: 'Sale', 
			amount: '₦1,250,000', 
			status: 'Success', 
			time: '12 Minutes Ago', 
		},
		{ 
			name: 'Photography Package', 
			id: '#12332',
			type: 'Sale', 
			amount: '₦1,250,000', 
			status: 'Success', 
			time: '12 Minutes Ago', 
		},
	];
</script>

<div class="w-full font-sans text-[#101828] p-6 bg-[#F9FAFB] min-h-screen">
	
	<div class="flex items-center gap-3 mb-8">
		<img src="/edit-cover-photo.svg" alt="logo" class="h-8 w-8 rounded-lg object-cover" />
		<h1 class="text-2xl font-bold">{vendorName}</h1>
	</div>

	<div class="flex flex-col gap-8 w-full">
		
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each topStatsRow1 as stat}
				<div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[180px]">
					<div>
						<div class={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${stat.bg}`}>
							<Icon icon={stat.icon} class={`h-5 w-5 ${stat.color}`} />
						</div>
						<div class="text-3xl font-bold mb-1">{val(stat.count)}</div>
						<div class="text-xs text-gray-500">{stat.title}</div>
					</div>
					<button class="w-full bg-black text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1 hover:bg-gray-800 transition">
						{stat.btn} <Icon icon="heroicons:paper-airplane" class="h-3 w-3 -rotate-45" />
					</button>
				</div>
			{/each}

			{#each topStatsRow2 as stat}
				<div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[180px]">
					<div class="w-full">
						<div class="flex justify-between items-start mb-3">
							<div class={`h-10 w-10 rounded-full flex items-center justify-center ${stat.bg}`}>
								<Icon icon={stat.icon} class={`h-5 w-5 ${stat.color}`} />
							</div>
							{#if stat.type === 'revenue'}
								<button class="flex items-center gap-1 text-[10px] border border-gray-200 rounded-md px-2 py-1 text-gray-500 bg-white">
									<Icon icon="heroicons:bars-3-bottom-left" /> Last 30 Days
								</button>
							{/if}
						</div>
						
						<div class="text-3xl font-bold mb-1">
							{stat.type === 'revenue' ? money(stat.value) : (hasActivity ? stat.value : '0')}
						</div>
						<div class="text-xs text-gray-500">{stat.title}</div>
					</div>

					{#if stat.type === 'revenue'}
						<button class="w-full bg-black text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1 hover:bg-gray-800 transition">
							{stat.btn} <Icon icon="heroicons:paper-airplane" class="h-3 w-3 -rotate-45" />
						</button>
					{:else}
						<div class="flex items-end gap-1 h-8 mt-auto w-full">
							{#each Array(20) as _, i}
								<div class={`flex-1 rounded-sm h-full ${hasActivity && i < (stat.fillAmount || 0) ? stat.barColor : 'bg-gray-100'}`}></div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
			<div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
				<h2 class="font-bold text-gray-900">Collaboration Request</h2>
				
				{#if hasActivity}
					<a href="/vendor/collab" class="text-xs font-bold text-gray-500 flex items-center gap-2 hover:text-gray-900">
						View All Collaboration Requests 
						<img src="/arrow-right.svg" alt="arrow" class="h-3 w-3" />
					</a>
				{/if}
			</div>
			
			<div class="p-5 flex-1 flex flex-col justify-center">
				{#if hasActivity}
					<div class="space-y-4">
						{#each collaborationRequests as req}
							<div class="grid grid-cols-12 items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm gap-4">
								<div class="col-span-12 sm:col-span-5 flex items-center gap-3">
									<img src={req.avatar} alt="avatar" class="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
									<div class="flex flex-col">
										<div class="flex items-center gap-1">
											<span class="text-sm font-bold text-gray-900">{req.name}</span>
											<span class="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
										</div>
										<span class="text-xs text-gray-400">{req.email}</span>
									</div>
								</div>
								<div class="col-span-12 sm:col-span-3 text-sm font-bold text-gray-900">{req.event}</div>
								<div class="col-span-6 sm:col-span-2 text-xs text-gray-400">{req.time}</div>
								<div class="col-span-6 sm:col-span-2 text-right">
									<button class="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition">View Details</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center text-center py-6">
						<div class="mb-4">
							<img src="/empty-state.svg" alt="No data" class="w-32 h-auto mx-auto" />
						</div>
						<h3 class="text-sm font-bold text-gray-900">No Collaboration Request, yet</h3>
						<p class="text-xs text-gray-400 mt-1 max-w-[250px]">Collaboration Request will display once they are added</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="relative min-h-[300px]">
			<div class="flex justify-between items-center mb-6">
				<h2 class="font-bold text-lg">Your Latest Products</h2>
				<div class="flex gap-2">
					<button class="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200">+ Add New Product</button>
					<button class="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">
						View All Products 
						<img src="/arrow-left.svg" alt="arrow" class="h-3 w-3" />
					</button>
				</div>
			</div>

			{#if hasActivity}
				<div class="relative pl-6 border-l border-gray-200 space-y-8">
					{#each latestProducts as product}
						<div class="relative">
							<div class="absolute -left-[29px] top-0 h-3 w-3 rounded-full bg-gray-300 ring-4 ring-gray-50"></div>
							<div class="mb-2">
								<p class="text-sm font-bold text-gray-900">{product.date}</p>
								<p class="text-xs text-gray-400">{product.day}</p>
							</div>
							<div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
								<div class="flex-1 flex flex-col justify-between">
									<div class="flex justify-between items-start">
										<div>
											<h3 class="font-bold text-gray-900 text-sm">{product.name}</h3>
											<p class="text-xs text-gray-500">{product.sub}</p>
										</div>
									</div>
									<div class="mt-2 mb-4">
										<span class="text-lg font-bold text-gray-900">{product.price}</span>
										<span class="text-xs text-gray-500 ml-2 border border-gray-200 px-2 py-1 rounded-md flex inline-flex items-center gap-1.5">
											<img src="/edit-icon-2.svg" alt="icon" class="h-3 w-3 opacity-60" />
											{product.type}
										</span>
									</div>
									<div class="flex gap-2">
										<button class="px-3 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5">
											<img src="/edit-icon-2.svg" alt="active" class="h-3 w-3 brightness-0 invert" /> 
											Active
										</button>
										<button class="px-3 py-1.5 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-gray-50">
											<Icon icon="heroicons:document-duplicate" /> Duplicate
										</button>
										<button class="px-3 py-1.5 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-gray-50">
											<Icon icon="heroicons:archive-box" /> Archive
										</button>
										<button class="px-3 py-1.5 border border-gray-200 text-red-500 text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-red-50">
											<Icon icon="heroicons:trash" /> Delete
										</button>
									</div>
								</div>
								<div class="relative w-full sm:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100">
									<img src={product.image} alt={product.name} class="w-full h-full object-cover" />
									<span class={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-md font-bold border border-transparent shadow-sm z-10 ${product.statusColor}`}>
										{product.status}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center text-center py-12 bg-white border border-gray-100 rounded-2xl shadow-sm">
					<div class="mb-4">
						<img src="/empty-state.svg" alt="No products" class="w-32 h-auto mx-auto" />
					</div>
					<h3 class="text-sm font-bold text-gray-900">No Product/Services, yet</h3>
					<p class="text-xs text-gray-400 mt-1 mb-6 max-w-[200px]">You haven't added any products yet. Start by adding your first one!</p>
					<button class="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 transition">
						+ Add New Product
					</button>
				</div>
			{/if}
		</div>

		<div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4 min-h-[250px] flex flex-col">
			<div class="p-5 border-b border-gray-100">
				<div class="flex items-center gap-2">
					<h2 class="font-bold text-gray-900 text-lg">Recent Transactions</h2>
					<Icon icon="heroicons:information-circle" class="text-gray-400" />
				</div>
				<p class="text-xs text-gray-500 mt-1">View transaction history</p>
			</div>
			
			<div class="p-5 flex-1 flex flex-col justify-center">
				{#if hasActivity}
					<div class="space-y-4">
						{#each recentTransactions as tx}
							<div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm gap-4">
								<div class="flex items-center gap-4">
									<div class="h-10 w-10 rounded-full bg-[#E2E8FC] flex items-center justify-center flex-shrink-0">
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M5.83333 1.66666H14.1667C14.6268 1.66666 15 2.03986 15 2.5V17.5L12.5 15.8333L10 17.5L7.5 15.8333L5 17.5V2.5C5 2.03986 5.37319 1.66666 5.83333 1.66666Z" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M8.33334 5.83334H11.6667" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M8.33334 9.16666H11.6667" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M8.33334 12.5H10" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</div>
									<div class="flex flex-col">
										<div class="flex items-center gap-2">
											<span class="font-bold text-gray-900 text-sm">{tx.name}</span>
											<span class="flex items-center gap-1.5 text-xs text-gray-900 font-medium bg-[#FFF7D8] px-2 py-0.5 rounded-full">
												<span class="h-1.5 w-1.5 rounded-full bg-yellow-400"></span> {tx.type}
											</span>
										</div>
										<span class="text-xs text-gray-400 mt-1">{tx.id}</span>
									</div>
								</div>

								<div class="flex items-center gap-6 sm:gap-12 ml-auto sm:ml-0">
									<span class="font-bold text-gray-900 text-sm">{tx.amount}</span>
									<span class="text-xs text-gray-400 whitespace-nowrap">{tx.time}</span>
									<span class="bg-[#E3F4E1] text-[#3CBD2C] text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
										<Icon icon="heroicons:check-circle" class="h-3 w-3" />
										{tx.status}
									</span>
									<button class="text-xs font-bold text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition">View Details</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center text-center py-6">
						<div class="mb-4">
							<img src="/empty-state.svg" alt="No transactions" class="w-32 h-auto mx-auto" />
						</div>
						<h3 class="text-sm font-bold text-gray-900">No Transaction history, yet</h3>
						<p class="text-xs text-gray-400 mt-1">No recent transactions.</p>
					</div>
				{/if}
			</div>
		</div>

	</div>
</div>