<script lang="ts">
	import { DonutChart, StackedAreaChart } from "@carbon/charts-svelte";
import '@carbon/charts-svelte/styles.css';

let searchQuery = '';
	type Stat = {
        icon: string;
		title: string;
		value: string | number;
		subtitle: string;
	};

	const stats: Stat[] = [
		{ icon: '', title: 'Events', value: 0, subtitle: '0 last week' },
		{ icon:'', title: 'Tickets', value: 0, subtitle: '0 last week' },
		{ icon:'',title: 'Subscribers', value: 0, subtitle: '0 last week' },
		{ icon:'',title: 'Sales', value: '$0', subtitle: '$0 last week' }
	];

    const pageViewsData = [
		{ date: '2024-10-01', views: 150, uniqueVisitors: 80 },
		{ date: '2024-10-02', views: 100, uniqueVisitors: 100 },
		{ date: '2024-10-03', views: 250, uniqueVisitors: 120 },
		{ date: '2024-10-04', views: 200, uniqueVisitors: 150 },
		{ date: '2024-10-05', views: 350, uniqueVisitors: 180 },
		{ date: '2024-10-06', views: 300, uniqueVisitors: 200 },
		{ date: '2024-10-07', views: 450, uniqueVisitors: 220 }
	];

    const chartData = pageViewsData.flatMap((item) => [
		{ group: 'Page Views', date: item.date, value: item.views },
		{ group: 'Unique Visitors', date: item.date, value: item.uniqueVisitors }
	]);

    const pageViewsOptions: any = {
		title: 'Unique Visitor Distribution',
		axes: {
			left: {
				mapsTo: 'value',
				scaleType: 'linear',
				title: ''
			},
			bottom: {
				mapsTo: 'date',
				scaleType: 'time',
				title: ''
			}
		},
		curves: {
			curve: 'curveMonotoneX'
		},
		legend: {
			enabled: true,
			position: 'bottom'
		},
		height: '330px'
		// color: {
		// 	scale: {
		// 		'Page Views': '#FF6B6B',
		// 		'Unique Visitors': '#4ECDC4'
		// 	}
		// }
	};

    // Donut chart for Page Views Distribution
	const pageViewsDistribution = [
		{ group: 'Male', value: 15.6 },
		{ group: 'Female', value: 84.4 }
	];

    const donutOptions = {
		title: 'Page Views Distribution',
		height: '330px'
		// width: '330px'
	};

    const pageView = [
		{ label: 'Yesterday', value: 4 },
		{ label: 'Past Month', value: 6 }
	];

    let visits = [
		{
			source: 'Direct',
			time: '18m',
			location: 'Lagos, Lagos',
			icon: '/mobile.svg' // phone icon
		},
		{
			source: 'rondwell.com',
			time: '1h',
			location: 'Lagos, Lagos',
			icon: '/monitor.svg', // desktop icon
			extra: 'Embed'
		}
	];

    // Top Referrers
	const topReferrers = [{ name: 'rondwell.com', percent: '100%' }];

    // Top Cities
	const topCities = [
		{ name: 'Lagos, Nigeria', percent: '67%' },
		{ name: 'Port Harcourt, Nigeria', percent: '33%' }
	];

	// Top Sources
	const topSources: any[] = [];

</script>

<div class="p-4">

<div class="hidden sm:justify-between lg-block md:mb-10 md:flex">
		<div class="flex items-center justify-between w-fit">
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

    <!-- Stats Row -->
	<section class="flex flex-col gap-0">
        <div class="flex gap-14 lg:gap-30">
		    {#each stats as stat}
                <div class="stat-card ">
                    <div class="text-[#A2A5A6]">
                    <span>{stat.icon}</span>
				    <span class="stat-title">{stat.title}</span>
                    </div>
				    <h2 class="stat-value">{stat.value}</h2>
				    <span class="text-[#A2A5A6]">{stat.subtitle}</span>
			        </div>
		    {/each}
        </div>
        <div class="text-[#BABABA] mt-6"> <span class="text-xs">Only events created under this calendar count towards these stats. </span>   </div>
	</section>

    <div class="mb-6 flex flex-col">
		<div class="mb-1 flex items-center justify-between gap-4">
			<h2 class="text-lg font-semibold">Page Views</h2>
			<button
				class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
			>
				<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
				Past Week
				<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
			</button>
		</div>
		<p class="text-sm text-gray-600">See recent page views of the calendar page.</p>
	</div>

<div class="mb-6 grid gap-4 rounded-2xl bg-[#FDFDFD] p-1">
		<!-- Main charts area -->
		<div class="flex w-full flex-col gap-20 p-4 lg:flex-row">
			<!-- Left charts col -->

			<div class="w-full">
				<StackedAreaChart data={chartData} options={pageViewsOptions} />
			</div>

			<!-- Right donut chart col -->
			<div class=" flex w-full max-w-100 items-center justify-center">
				<DonutChart data={pageViewsDistribution} options={donutOptions} />
			</div>
		</div>

		<!-- Stats + lists -->
		<div class="flex w-full flex-col items-center gap-6 rounded-b-2xl bg-[#F4F4F4] p-4 lg:flex-row">
			<!-- Left stats -->
			<div class="w-full space-y-4 text-sm text-gray-700">
				<div>
					<h3 class="mb-2 font-semibold text-black">Page Views</h3>
					<div class="flex items-center gap-2">
						{#each pageView as stat}
							<div class="w-full">
								<div class="mb-1 text-[#BABABA]">{stat.label}</div>
								<div class="text-xl font-semibold text-gray-900">{stat.value}</div>
							</div>
						{/each}
					</div>
				</div>
				<div>
					<h3 class="mb-2 font-semibold text-black">Live Traffic</h3>
					<div class="flex flex-col gap-3">
						{#each visits as v}
							<div class="flex items-center justify-between rounded-lg bg-[#FDFDFD] p-3">
								<!-- Left side -->
								<div class="flex items-center gap-3">
									<div class="text-gray-500">
										<img src={v.icon} alt="" class="h-4 w-4" />
									</div>

									<div class="flex flex-col">
										<p class="font-medium text-gray-800">
											Visitor from {v.source}
										</p>

										<div class="flex items-center gap-1 text-sm text-gray-500">
											<img src="/location.svg" alt="" class="h-4 w-4" />
											<span>{v.location}</span>

											{#if v.extra}
												<span class="ml-2 flex items-center gap-1">
													<img src="/document.svg" alt="icon" class="h-4 w-4" />
													{v.extra}
												</span>
											{/if}
										</div>
									</div>
								</div>

								<!-- Time -->
								<p class="text-sm text-gray-500">{v.time}</p>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="h-0 w-full border lg:h-full lg:w-0"></div>

			<!-- Right lists -->
			<div class="flex w-full flex-col gap-3">
				<div>
					<h3 class="mb-2 font-semibold text-black">Top Referrers</h3>
					<ul class="space-y-2 text-sm font-medium">
						{#each topReferrers as ref}
							<li class="flex justify-between">
								<span class="text-[#BABABA]">{ref.name}</span>
								<span class="text-[#565759]">{ref.percent}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div>
					<h3 class="mb-2 font-semibold text-black">Top Cities</h3>
					<ul class="space-y-2 text-sm font-medium">
						{#each topCities as city}
							<li class="flex justify-between">
								<span class="text-[#BABABA]">{city.name}</span>
								<span class="text-[#565759]">{city.percent}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div>
					<h3 class="mb-2 font-semibold text-black">Top Sources</h3>
					<ul class="space-y-2 text-sm font-medium">
						{#each topSources as source}
							<span class="text-[#BABABA]">{source.name}</span>
						{:else}
							<span class="w-[50%] text-[#BABABA]"
								>Set up a tracking link by adding ?utm_source=your-link-name to your URL.</span
							>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>

    <!-- Sales History -->
<div class="mb-6">
		<div class="mb-4 space-y-4">
			<div class="mb-5">
				<span class="flex items-center gap-1">
					<h4 class="text-lg font-medium">Sales History</h4>
					<p
						class="hidden h-[22px] w-[22px] items-center justify-center rounded-full border bg-[#EBECED] lg:flex"
					>
						0
					</p>
				</span>
				<p class="hidden text-sm text-[#737577] lg:block">
					Manage your subscribers and events attendees. Event guests are automatically added to this list.
				</p>
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
				<span class="absolute top-2.5 right-0 border-l px-4 py-1.5 text-gray-400">
					<img src="/search-download.svg" alt=""  class="w-4 h-4"/>
				</span>
			</div>

			<div class="mb-4 flex items-center justify-between">
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
					Recently Added
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>
		</div>

		<div class="mt-8 min-h-90 border-t pt-8 text-center">
			<div class="mb-12 flex w-full justify-between">
				<button
					class="ml-auto flex items-start gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#5D646F] transition-colors hover:bg-gray-200"
				>
					Learn More
					<img src="/send-icon.png" alt="icon" class="h-3 w-3" />
				</button>
			</div>
			<div class="flex h-50 flex-col items-center justify-center">
				<!-- Placeholder icon -->
				<img src="/noreferral.svg" alt="" />
				<div class="text-lg font-medium text-[#646568]">No Referrals, yet</div>
				<div class="mt-1 text-xs text-gray-400">
					Referrals will start showing up once guests start inviting their friends.
				</div>
			</div>
		</div>
	</div>


    <!-- Feedback History -->
     <!-- Registration Referrals -->
	<div class="mb-6">
		<div class="mb-4 space-y-4">
			<div class="mb-5">
				<span class="flex items-center gap-1">
					<h4 class="text-lg font-medium">Event Feedback</h4>
					<p
						class="hidden h-[22px] w-[22px] items-center justify-center rounded-full border bg-[#EBECED] lg:flex"
					>
						0
					</p>
				</span>
				<p class="hidden text-sm text-[#737577] lg:block">
					Manage your subscribers and events attendees. Event guests are automatically added to this list.
				</p>
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
				<span class="absolute top-2.5 right-0 border-l px-4 py-1.5 text-gray-400">
					<img src="/search-download.svg" alt=""  class="w-4 h-4"/>
				</span>
			</div>

			<div class="mb-4 flex items-center justify-between">
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
					Recently Added
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>
		</div>

		<div class="mt-8 min-h-90 border-t pt-8 text-center">
			<div class="mb-12 flex w-full justify-between">
				<button
					class="ml-auto flex items-start gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#5D646F] transition-colors hover:bg-gray-200"
				>
					Learn More
					<img src="/send-icon.png" alt="icon" class="h-3 w-3" />
				</button>
			</div>
			<div class="flex h-50 flex-col items-center justify-center">
				<!-- Placeholder icon -->
				<img src="/feedback-image.svg" alt="" />
				<div class="text-lg font-medium text-[#646568]">No Referrals, yet</div>
				<div class="mt-1 text-xs text-gray-400">
					Referrals will start showing up once guests start inviting their friends.
				</div>
			</div>
		</div>
	</div>
</div>


    