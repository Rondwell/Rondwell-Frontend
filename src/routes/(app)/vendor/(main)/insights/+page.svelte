<script lang="ts">
	import { onMount } from 'svelte';
	import { DonutChart, StackedAreaChart } from '@carbon/charts-svelte';
	import '@carbon/charts-svelte/styles.css';
	import Icon from '@iconify/svelte';
	import { renderMarkdown } from '$lib/utils/markdown';
	import {
		getVendorAnalyticsOverview,
		generateAnalyticsSummary,
		chatWithAnalytics
	} from '$lib/services/analytics.services';
	import InsightsSkeleton from '$lib/components/analytics/InsightsSkeleton.svelte';
	import { browser } from '$app/environment';
	import { getPersistedTab, persistTab } from '$lib/utils/tabPersistence';

	let loading = true;
	let analytics: any = null;
	let profileId = '';
	let aiSummary = '';
	let aiLoading = false;
	let chatQuestion = '';
	let chatAnswer = '';
	let chatLoading = false;
	let activeTab = getPersistedTab(['analytics', 'ai'], 'analytics');

	let revenueChart: any[] = [];
	let orderDonut: any[] = [];

	const areaOptions: any = {
		title: 'Revenue Trends',
		axes: { left: { mapsTo: 'value', scaleType: 'linear' }, bottom: { mapsTo: 'date', scaleType: 'labels' } },
		curve: 'curveMonotoneX',
		legend: { enabled: true, position: 'bottom' },
		height: '330px',
		color: { scale: { 'Revenue': '#22c55e', 'Orders': '#3b82f6' } }
	};
	const donutOptions = { title: 'Order Status', height: '330px', legend: { position: 'bottom' } };

	onMount(async () => {
		if (browser) profileId = localStorage.getItem('active_profile_id') || '';
		if (!profileId) { loading = false; return; }

		analytics = await getVendorAnalyticsOverview(profileId);

		if (analytics) {
			const months = analytics.orders?.revenueByMonth || [];
			revenueChart = months.flatMap((m: any) => [
				{ group: 'Revenue', date: m.month, value: m.revenue || 0 },
				{ group: 'Orders', date: m.month, value: (m.orders || 0) * 100 },
			]);

			const o = analytics.orders || {};
			orderDonut = [
				{ group: 'Completed', value: o.completedOrders || 0 },
				{ group: 'Pending', value: o.pendingOrders || 0 },
				{ group: 'Cancelled', value: o.cancelledOrders || 0 },
			].filter(d => d.value > 0);
			if (orderDonut.length === 0) orderDonut = [{ group: 'No Data', value: 1 }];
		}
		loading = false;
	});

	async function loadAISummary() {
		aiLoading = true;
		const result = await generateAnalyticsSummary('vendor', profileId);
		aiSummary = result?.summary || 'Unable to generate summary.';
		aiLoading = false;
	}
	async function askQuestion() {
		if (!chatQuestion.trim()) return;
		chatLoading = true;
		const result = await chatWithAnalytics('vendor', profileId, chatQuestion);
		chatAnswer = result?.answer || 'Unable to answer.';
		chatLoading = false;
	}

	function fmt(n: number | undefined): string { if (!n) return '0'; return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toLocaleString(); }
	function fmtCurrency(n: number | undefined): string { if (!n) return '$0'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n); }
	function fmtPercent(n: number | undefined): string { return (n || 0).toFixed(1) + '%'; }
</script>

<div class="max-w-6xl space-y-6">
	<div class="mb-6">
		<h1 class="mb-2 text-3xl font-bold md:text-4xl">Vendor Insights</h1>
		<p class="text-sm text-gray-500">Track your products, orders, revenue, and event participation.</p>
		<div class="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1">
			{#each ['analytics', 'ai'] as tab}
				<button on:click={() => { activeTab = tab; persistTab(tab); }}
					class="rounded-md px-4 py-2 text-sm font-medium transition-colors {activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">
					{tab === 'analytics' ? 'Analytics' : 'AI Insights'}
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<InsightsSkeleton variant="vendor" />
	{:else if !analytics}
		<div class="flex h-64 flex-col items-center justify-center text-gray-400">
			<Icon icon="mdi:store" class="mb-3 text-5xl" />
			<p class="text-lg font-medium">No analytics data yet</p>
			<p class="text-sm">Analytics will appear once you start selling products and participating in events.</p>
		</div>
	{:else if activeTab === 'analytics'}

	<!-- Stats Cards -->
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Revenue</p>
			<p class="mt-1 text-2xl font-bold text-green-600">{fmtCurrency(analytics.financials?.totalRevenue)}</p>
			<p class="mt-1 text-xs text-gray-400">Payouts: {fmtCurrency(analytics.financials?.totalPayouts)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Orders</p>
			<p class="mt-1 text-2xl font-bold">{fmt(analytics.orders?.totalOrders)}</p>
			<p class="mt-1 text-xs text-gray-400">Conversion: {fmtPercent(analytics.orders?.orderConversionRate)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Active Listings</p>
			<p class="mt-1 text-2xl font-bold text-blue-600">{fmt(analytics.products?.activeListings)}</p>
			<p class="mt-1 text-xs text-gray-400">Total: {fmt(analytics.products?.totalListings)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Events Participated</p>
			<p class="mt-1 text-2xl font-bold text-purple-600">{fmt(analytics.events?.totalEventsParticipated)}</p>
			<p class="mt-1 text-xs text-gray-400">Upcoming: {fmt(analytics.events?.upcomingEvents)}</p>
		</div>
	</div>

	<!-- Charts -->
	<div class="grid gap-4 rounded-2xl bg-[#FDFDFD] p-1">
		<div class="flex w-full flex-col gap-10 p-4 lg:flex-row">
			<div class="w-full">
				{#if revenueChart.length > 0}
					<StackedAreaChart data={revenueChart} options={areaOptions} />
				{:else}
					<div class="flex h-80 items-center justify-center text-gray-400">No revenue data yet</div>
				{/if}
			</div>
			<div class="flex w-full max-w-100 items-center justify-center">
				<DonutChart data={orderDonut} options={donutOptions} />
			</div>
		</div>

		<div class="flex w-full flex-col items-start gap-6 rounded-b-2xl bg-[#F4F4F4] p-4 lg:flex-row">
			<!-- Products & Orders -->
			<div class="w-full space-y-4 text-sm">
				<h3 class="font-semibold text-black">Products Overview</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Active</div><div class="text-xl font-semibold text-green-600">{fmt(analytics.products?.activeListings)}</div></div>
					<div><div class="text-[#BABABA]">Draft</div><div class="text-xl font-semibold">{fmt(analytics.products?.draftListings)}</div></div>
					<div><div class="text-[#BABABA]">Archived</div><div class="text-xl font-semibold">{fmt(analytics.products?.archivedListings)}</div></div>
					<div><div class="text-[#BABABA]">Avg Price</div><div class="text-xl font-semibold">{fmtCurrency(analytics.products?.averagePrice)}</div></div>
				</div>

				<h3 class="mt-4 font-semibold text-black">Order Breakdown</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Completed</div><div class="text-xl font-semibold text-green-600">{fmt(analytics.orders?.completedOrders)}</div></div>
					<div><div class="text-[#BABABA]">Pending</div><div class="text-xl font-semibold text-orange-500">{fmt(analytics.orders?.pendingOrders)}</div></div>
					<div><div class="text-[#BABABA]">Cancelled</div><div class="text-xl font-semibold text-red-500">{fmt(analytics.orders?.cancelledOrders)}</div></div>
					<div><div class="text-[#BABABA]">Avg Value</div><div class="text-xl font-semibold">{fmtCurrency(analytics.orders?.averageOrderValue)}</div></div>
				</div>

				<!-- Booth -->
				{#if analytics.booth?.totalBooths > 0}
				<h3 class="mt-4 font-semibold text-black">Booth Performance</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Total Booths</div><div class="text-xl font-semibold">{analytics.booth.totalBooths}</div></div>
					<div><div class="text-[#BABABA]">Published</div><div class="text-xl font-semibold text-green-600">{analytics.booth.publishedBooths}</div></div>
					<div><div class="text-[#BABABA]">Views</div><div class="text-xl font-semibold">{fmt(analytics.booth.boothViews)}</div></div>
				</div>
				{/if}
			</div>

			<div class="h-0 w-full border lg:h-full lg:w-0"></div>

			<!-- Financials & Collaborations -->
			<div class="w-full space-y-3 text-sm">
				<h3 class="font-semibold text-black">Financial Summary</h3>
				<div class="flex justify-between"><span class="text-gray-500">Total Revenue</span><span class="font-medium text-green-600">{fmtCurrency(analytics.financials?.totalRevenue)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Total Payouts</span><span class="font-medium">{fmtCurrency(analytics.financials?.totalPayouts)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Balance</span><span class="font-medium">{fmtCurrency(analytics.financials?.balance)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Invoices</span><span class="font-medium">{fmt(analytics.financials?.invoiceCount)}</span></div>

				<h3 class="mt-4 font-semibold text-black">Collaborations</h3>
				<div class="flex justify-between"><span class="text-gray-500">Inbound</span><span class="font-medium">{fmt(analytics.collaborations?.totalInbound)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Accepted</span><span class="font-medium text-green-600">{fmt(analytics.collaborations?.acceptedCollaborations)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Conversion Rate</span><span class="font-medium">{fmtPercent(analytics.collaborations?.collaborationConversionRate)}</span></div>

				{#if analytics.predictions?.confidence > 0}
				<h3 class="mt-4 font-semibold text-black">Predictions</h3>
				<div class="rounded-lg bg-white p-3">
					<div class="flex justify-between"><span class="text-gray-500">Est. Revenue Next Month</span><span class="font-medium">{fmtCurrency(analytics.predictions.estimatedRevenueNextMonth)}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Est. Orders</span><span class="font-medium">{analytics.predictions.estimatedOrdersNextMonth}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Trend</span>
						<span class="font-medium capitalize {analytics.predictions.revenueTrend === 'growing' ? 'text-green-600' : analytics.predictions.revenueTrend === 'declining' ? 'text-red-500' : ''}">{analytics.predictions.revenueTrend}</span>
					</div>
				</div>
				{/if}

				<!-- Top Products -->
				{#if analytics.products?.topProducts?.length > 0}
				<h3 class="mt-4 font-semibold text-black">Top Products</h3>
				{#each analytics.products.topProducts.slice(0, 5) as product}
					<div class="flex justify-between"><span class="text-gray-500">{product.name}</span><span class="font-medium">{product.orders} orders · {fmtCurrency(product.revenue)}</span></div>
				{/each}
				{/if}
			</div>
		</div>
	</div>

	{:else if activeTab === 'ai'}
	<div class="space-y-6">
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-medium">AI-Generated Summary</h3>
				<button on:click={loadAISummary} disabled={aiLoading}
					class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
					{#if aiLoading}<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> Generating...
					{:else}<Icon icon="mdi:auto-fix" class="h-4 w-4" /> Generate Summary{/if}
				</button>
			</div>
			{#if aiSummary}<div class="prose prose-sm max-w-none rounded-lg bg-gray-50 p-4">{@html renderMarkdown(aiSummary)}</div>
			{:else}<p class="text-sm text-gray-400">Click "Generate Summary" for an AI analysis of your vendor performance.</p>{/if}
		</div>
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-medium">Chat with Your Data</h3>
			<div class="flex gap-2">
				<input type="text" bind:value={chatQuestion} placeholder="Ask about your vendor analytics..."
					class="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
					on:keydown={(e) => e.key === 'Enter' && askQuestion()} />
				<button on:click={askQuestion} disabled={chatLoading || !chatQuestion.trim()}
					class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">{chatLoading ? '...' : 'Ask'}</button>
			</div>
			{#if chatAnswer}<div class="prose prose-sm mt-4 max-w-none rounded-lg bg-gray-50 p-4">{@html renderMarkdown(chatAnswer)}</div>{/if}
		</div>
	</div>
	{/if}
</div>
