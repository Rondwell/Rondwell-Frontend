<script lang="ts">
	import { DonutChart, StackedAreaChart } from '@carbon/charts-svelte';
	import '@carbon/charts-svelte/styles.css';

	let searchQuery = '';
	type Stat = {
		icon: string;
		title: string;
		value: string | number;
		subtitle: string;
	};

	const icontag = {
		eventIcon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.03125 2.71094H6.27344V3.95312C6.27344 4.32133 6.49606 4.63989 6.8125 4.78418V6.23242C6.49569 6.37656 6.27344 6.69696 6.27344 7.06543V10.1846C6.27344 10.5529 6.49589 10.8724 6.8125 11.0166V12.4648C6.49587 12.6091 6.27344 12.9285 6.27344 13.2969V14.5391H5.03125C3.45932 14.5391 2.56394 14.2944 2.04102 13.7715C1.51809 13.2486 1.27344 12.3532 1.27344 10.7812V10.4219C1.27344 10.3343 1.34992 10.2578 1.4375 10.2578C2.33461 10.2578 3.07031 9.52211 3.07031 8.625C3.07031 7.72789 2.33461 6.99219 1.4375 6.99219C1.34992 6.99219 1.27344 6.91571 1.27344 6.82812V6.46875C1.27344 4.89682 1.51809 4.00144 2.04102 3.47852C2.56394 2.95559 3.45932 2.71094 5.03125 2.71094Z" fill="#A2A5A6" stroke="#A2A5A6" stroke-width="0.75"/>
<path opacity="0.4" d="M12.2188 2.71094C13.7907 2.71094 14.6861 2.95559 15.209 3.47852C15.7319 4.00144 15.9766 4.89682 15.9766 6.46875V7.1875C15.9766 7.27508 15.9001 7.35156 15.8125 7.35156C14.9154 7.35156 14.1797 8.08727 14.1797 8.98438C14.1797 9.88148 14.9154 10.6172 15.8125 10.6172C15.9001 10.6172 15.9766 10.6937 15.9766 10.7812C15.9766 12.3532 15.7319 13.2486 15.209 13.7715C14.6861 14.2944 13.7907 14.5391 12.2188 14.5391H8.10156V13.2969C8.10156 12.9285 7.87913 12.6091 7.5625 12.4648V11.0166C7.87911 10.8724 8.10156 10.5529 8.10156 10.1846V7.06543C8.10156 6.69696 7.87931 6.37656 7.5625 6.23242V4.78418C7.87894 4.63989 8.10156 4.32133 8.10156 3.95312V2.71094H12.2188Z" fill="#A2A5A6" stroke="#A2A5A6" stroke-width="0.75"/>
</svg>
`,
		tickeIcon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.03125 2.71094H6.27344V3.95312C6.27344 4.32133 6.49606 4.63989 6.8125 4.78418V6.23242C6.49569 6.37656 6.27344 6.69696 6.27344 7.06543V10.1846C6.27344 10.5529 6.49589 10.8724 6.8125 11.0166V12.4648C6.49587 12.6091 6.27344 12.9285 6.27344 13.2969V14.5391H5.03125C3.45932 14.5391 2.56394 14.2944 2.04102 13.7715C1.51809 13.2486 1.27344 12.3532 1.27344 10.7812V10.4219C1.27344 10.3343 1.34992 10.2578 1.4375 10.2578C2.33461 10.2578 3.07031 9.52211 3.07031 8.625C3.07031 7.72789 2.33461 6.99219 1.4375 6.99219C1.34992 6.99219 1.27344 6.91571 1.27344 6.82812V6.46875C1.27344 4.89682 1.51809 4.00144 2.04102 3.47852C2.56394 2.95559 3.45932 2.71094 5.03125 2.71094Z" fill="#A2A5A6" stroke="#A2A5A6" stroke-width="0.75"/>
<path opacity="0.4" d="M12.2188 2.71094C13.7907 2.71094 14.6861 2.95559 15.209 3.47852C15.7319 4.00144 15.9766 4.89682 15.9766 6.46875V7.1875C15.9766 7.27508 15.9001 7.35156 15.8125 7.35156C14.9154 7.35156 14.1797 8.08727 14.1797 8.98438C14.1797 9.88148 14.9154 10.6172 15.8125 10.6172C15.9001 10.6172 15.9766 10.6937 15.9766 10.7812C15.9766 12.3532 15.7319 13.2486 15.209 13.7715C14.6861 14.2944 13.7907 14.5391 12.2188 14.5391H8.10156V13.2969C8.10156 12.9285 7.87913 12.6091 7.5625 12.4648V11.0166C7.87911 10.8724 8.10156 10.5529 8.10156 10.1846V7.06543C8.10156 6.69696 7.87931 6.37656 7.5625 6.23242V4.78418C7.87894 4.63989 8.10156 4.32133 8.10156 3.95312V2.71094H12.2188Z" fill="#A2A5A6" stroke="#A2A5A6" stroke-width="0.75"/>
</svg>
`,
		subscribersIcon: `<svg width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.4103 7.10902C12.8906 5.92101 12.5918 3.5412 11.8326 2.50747C11.8326 2.50747 10.9082 1.44948 10.0998 1.16535C9.59838 0.989136 8.75196 0.973616 8.75196 0.973616C8.75196 0.973616 8.04044 0.892457 7.59671 0.973616C6.73424 1.13136 6.29133 1.50657 5.67128 2.12401C5.05122 2.74145 4.74325 3.19796 4.51602 4.04133C4.30169 4.83684 4.27058 5.36385 4.51602 6.15039C4.72652 6.82495 5.47873 7.68425 5.47873 7.68425C5.47873 7.68425 6.10624 8.31373 6.2489 8.83464C6.39157 9.35556 6.27631 9.59272 6.05643 9.98501C5.8732 10.3119 5.47873 10.5602 5.47873 10.5602C5.47873 10.5602 4.79503 11.0606 4.32348 11.3272C3.67943 11.6912 3.23463 11.7301 2.59059 12.0941C2.59059 12.0941 1.76822 12.4348 1.43533 12.861C1.22888 13.1253 1.1444 13.3065 1.05025 13.6279C0.90287 14.1311 0.896994 14.4687 1.05025 14.9701C1.17791 15.3878 1.31023 15.6278 1.62788 15.9287C2.04275 16.3218 2.97575 16.6956 2.97575 16.6956C2.97575 16.6956 3.63853 16.9702 4.13093 17.0791C5.86389 17.4626 8.94451 17.2709 8.94451 17.2709" stroke="#A9AAAA" stroke-width="1.875"/>
<rect x="-0.249404" y="-0.329115" width="1.22077" height="0.584318" rx="0.292159" transform="matrix(-0.990719 -0.13593 0.13706 -0.990563 12.8142 7.05321)" fill="#A9AAAA" stroke="#A9AAAA" stroke-width="0.584318"/>
<rect x="-0.253915" y="0.287719" width="1.22319" height="0.542831" rx="0.271415" transform="matrix(0.0625521 0.998042 -0.998074 0.0620286 9.45148 16.8827)" fill="#A9AAAA" stroke="#A9AAAA" stroke-width="0.542831"/>
<path d="M12.4103 7.10902C12.8906 5.92101 12.5918 3.5412 11.8326 2.50747C11.8326 2.50747 10.9082 1.44948 10.0998 1.16535C9.59838 0.989136 8.75196 0.973616 8.75196 0.973616C8.75196 0.973616 8.04044 0.892457 7.59671 0.973616C6.73424 1.13136 6.29133 1.50657 5.67128 2.12401C5.05122 2.74145 4.74325 3.19796 4.51602 4.04133C4.30169 4.83684 4.27058 5.36385 4.51602 6.15039C4.72652 6.82495 5.47873 7.68425 5.47873 7.68425C5.47873 7.68425 6.10624 8.31373 6.2489 8.83464C6.39157 9.35556 6.27631 9.59272 6.05643 9.98501C5.8732 10.3119 5.47873 10.5602 5.47873 10.5602C5.47873 10.5602 4.79503 11.0606 4.32348 11.3272C3.67943 11.6912 3.23463 11.7301 2.59059 12.0941C2.59059 12.0941 1.76822 12.4348 1.43533 12.861C1.22888 13.1253 1.1444 13.3065 1.05025 13.6279C0.90287 14.1311 0.896994 14.4687 1.05025 14.9701C1.17791 15.3878 1.31023 15.6278 1.62788 15.9287C2.04275 16.3218 2.97575 16.6956 2.97575 16.6956C2.97575 16.6956 3.63853 16.9702 4.13093 17.0791C5.86389 17.4626 8.94451 17.2709 8.94451 17.2709" stroke="#A9AAAA" stroke-width="1.875"/>
<rect x="-0.249404" y="-0.329115" width="1.22077" height="0.584318" rx="0.292159" transform="matrix(-0.990719 -0.13593 0.13706 -0.990563 12.8142 7.05321)" fill="#A9AAAA" stroke="#A9AAAA" stroke-width="0.584318"/>
<rect x="-0.253915" y="0.287719" width="1.22319" height="0.542831" rx="0.271415" transform="matrix(0.0625521 0.998042 -0.998074 0.0620286 9.45148 16.8827)" fill="#A9AAAA" stroke="#A9AAAA" stroke-width="0.542831"/>
<path d="M12.1843 15.4875C11.993 15.4875 11.8018 15.3982 11.6584 15.2578L10.1524 13.6492C9.86554 13.3429 9.86554 12.8322 10.1524 12.5258C10.4392 12.2195 10.9173 12.2195 11.2042 12.5258L12.1843 13.5727L14.6703 10.9173C14.9572 10.611 15.4353 10.611 15.7221 10.9173C16.009 11.2237 16.009 11.7344 15.7221 12.0407L12.7102 15.2578C12.5667 15.411 12.3755 15.4875 12.1843 15.4875Z" fill="#A9AAAA"/>
</svg>
`,
		salesIcon: `<svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.16685 2.07577L3.19115 0H4.51134L4.48704 2.07577H3.16685ZM2.82667 15.75L2.85097 13.7146H4.17927L4.15497 15.75H2.82667ZM3.45842 14.0215C2.93467 14.0215 2.43791 13.9812 1.96814 13.9004C1.50378 13.825 1.10421 13.7335 0.769439 13.6258C0.434665 13.5181 0.194384 13.4185 0.0485961 13.3269L0.445464 11.7842C0.650648 11.9027 0.907127 12.0185 1.2149 12.1315C1.52268 12.2446 1.86015 12.3388 2.22732 12.4142C2.59449 12.4842 2.96706 12.5192 3.34503 12.5192C4.08477 12.5192 4.64903 12.3954 5.0378 12.1477C5.42657 11.9 5.62095 11.4962 5.62095 10.9362C5.62095 10.5592 5.52376 10.2442 5.32937 9.99116C5.13499 9.73269 4.84341 9.49039 4.45464 9.26423C4.07128 9.03808 3.59071 8.78769 3.01296 8.51308C2.5216 8.27077 2.04374 7.98 1.57937 7.64077C1.12041 7.30154 0.742441 6.90308 0.445464 6.44539C0.148488 5.98769 0 5.46269 0 4.87039C0 4.28885 0.113391 3.80154 0.340173 3.40846C0.572354 3.01 0.88283 2.68962 1.2716 2.44731C1.66037 2.205 2.09233 2.03 2.5675 1.92231C3.04806 1.81462 3.53942 1.76077 4.04158 1.76077C4.77592 1.76077 5.38337 1.83346 5.86393 1.97885C6.34449 2.11885 6.69007 2.25885 6.90065 2.39885L6.52808 3.89308C6.2527 3.72077 5.92873 3.56731 5.55616 3.43269C5.18899 3.29269 4.68413 3.22269 4.04158 3.22269C3.64741 3.22269 3.28294 3.27385 2.94816 3.37615C2.61339 3.47846 2.34341 3.63462 2.13823 3.84462C1.93305 4.05462 1.83045 4.32385 1.83045 4.65231C1.83045 5.02385 1.90605 5.33615 2.05724 5.58923C2.21382 5.83692 2.4649 6.07116 2.81048 6.29192C3.15605 6.50731 3.60961 6.76039 4.17117 7.05116C4.57613 7.26116 4.9757 7.48462 5.36987 7.72154C5.76404 7.95308 6.12041 8.21154 6.43899 8.49693C6.76296 8.78231 7.01944 9.11077 7.20843 9.48231C7.40281 9.84846 7.5 10.2685 7.5 10.7423C7.5 11.4746 7.32722 12.0858 6.98164 12.5758C6.64147 13.0604 6.16631 13.4239 5.55616 13.6662C4.95141 13.9031 4.25216 14.0215 3.45842 14.0215Z" fill="#A3A5A5"/>
</svg>
`
	};

	const stats: Stat[] = [
		{ icon: icontag.eventIcon, title: 'Events', value: 0, subtitle: '0 last week' },
		{ icon: icontag.tickeIcon, title: 'Tickets', value: 0, subtitle: '0 last week' },
		{ icon: icontag.subscribersIcon, title: 'Subscribers', value: 0, subtitle: '0 last week' },
		{ icon: icontag.salesIcon, title: 'Sales', value: '$0', subtitle: '$0 last week' }
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
	<div class="lg-block hidden sm:justify-between md:mb-10 md:flex">
		<div class="flex w-fit items-center justify-between">
			<img src="/tech-icon.svg" alt="icon" class="h-7 w-7" />
			<h1 class="text-md ml-2 lg:text-2xl">Business Collection</h1>
		</div>
		<button
			class="flex w-fit items-center gap-2 whitespace-nowrap rounded-md bg-[#DCE4EE] px-3 text-[#5D646F] md:text-sm"
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
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
			{#each stats as stat}
				<div class="stat-card">
					<div class="flex items-center justify-items-center gap-0.5 text-[#A2A5A6]">
						<span>{@html stat.icon}</span>
						<span class="stat-title">{stat.title}</span>
					</div>
					<h2 class="stat-value">{stat.value}</h2>
					<span class="text-[#A2A5A6]">{stat.subtitle}</span>
				</div>
			{/each}
		</div>
		<div class="mt-6 text-[#BABABA]">
			<span class="text-xs"
				>Only events created under this calendar count towards these stats.
			</span>
		</div>
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

	<!-- Page Views -->
	<div class="mb-6 grid gap-4 rounded-2xl bg-[#FDFDFD] p-1">
		<!-- Main charts area -->
		<div class="flex w-full flex-col overflow-hidden gap-20 p-4 lg:flex-row">
			<!-- Left charts col -->

			<div class="w-full">
				<StackedAreaChart data={chartData} options={pageViewsOptions} />
			</div>

			<!-- Right donut chart col -->
			<div class=" max-w-100 flex w-full items-center justify-center">
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
									<div class="text-[#CECECF]">
										<img src={v.icon} alt="" class="h-4 w-4" />
									</div>

									<div class="flex flex-col">
										<p class="font-medium text-[#131517]">
											Visitor from {v.source}
										</p>

										<div class="flex items-center gap-1 text-sm text-[#B8BABA]">
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
								<p class="text-sm text-[#B5B6B6]">{v.time}</p>
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
						class="hidden h-5.5 w-5.5 items-center justify-center rounded-full border bg-[#EBECED] lg:flex"
					>
						0
					</p>
				</span>
				<p class="hidden text-sm text-[#737577] lg:block">
					Manage your subscribers and events attendees. Event guests are automatically added to this
					list.
				</p>
			</div>

			<div class="relative mb-4 w-full">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search"
					class="h-10.75 w-full rounded-lg bg-[#FFFFFF] py-2 pl-10 pr-4 text-[#C5C6C6] focus:outline-none focus:ring-0"
				/>
				<span class="absolute left-3 top-2.5 text-gray-400">
					<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
				</span>
				<span class="absolute right-0 top-2.5 border-l px-4 py-1.5 text-gray-400">
					<img src="/search-download.svg" alt="" class="h-4 w-4" />
				</span>
			</div>

			<div class="mb-4 flex items-center justify-between">
				<button
					class="flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Filter
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				<button
					class="flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Recently Added
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>
		</div>

		<div class="min-h-90 mt-10 border-t pt-8 text-center">
			<div class="h-50 mt-10 flex flex-col items-center justify-center">
				<!-- Placeholder icon -->
				<img src="/noreferral.svg" alt="" />
				<div class="text-lg font-medium text-[#646568]">No Transactions, yet</div>
				<div class="mt-1 text-xs text-gray-400">
					When people pay for events under your calendar, they will appear here.
				</div>
			</div>
		</div>
	</div>

	<!-- Feedback History -->
	<div class="mb-6">
		<div class="mb-8 space-y-4">
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
					Manage your subscribers and events attendees. Event guests are automatically added to this
					list.
				</p>
			</div>

			<div class="relative mb-4 w-full">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search"
					class="h-10.75 w-full rounded-lg bg-[#FFFFFF] py-2 pl-10 pr-4 text-[#C5C6C6] focus:outline-none focus:ring-0"
				/>
				<span class="absolute left-3 top-2.5 text-gray-400">
					<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
				</span>
				<span class="absolute right-0 top-2.5 border-l px-4 py-1.5 text-gray-400">
					<img src="/search-download.svg" alt="" class="h-4 w-4" />
				</span>
			</div>

			<div class="mb-4 flex items-center justify-between">
				<button
					class="flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Filter
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
				<button
					class="flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
				>
					<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
					Recently Added
					<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
				</button>
			</div>
		</div>

		<div class="h-50 my-20 flex flex-col items-center justify-center">
			<!-- Placeholder icon -->
			<img src="/feedback-image.svg" alt="" />
			<div class="text-lg font-medium text-[#646568]">No Feedback, yet</div>
			<div class="mb-10 mt-1 text-xs text-gray-400">
				When people pay for events under your calendar, they will appear here.
			</div>
		</div>
	</div>
</div>
