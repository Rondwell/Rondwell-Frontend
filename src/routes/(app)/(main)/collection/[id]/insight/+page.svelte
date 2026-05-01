<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { DonutChart, StackedAreaChart } from '@carbon/charts-svelte';
	import '@carbon/charts-svelte/styles.css';
	import Icon from '@iconify/svelte';
	import {
		getCollectionAnalyticsOverview,
		generateAnalyticsSummary,
		chatWithAnalytics
	} from '$lib/services/analytics.services';
	import InsightsSkeleton from '$lib/components/analytics/InsightsSkeleton.svelte';

	$: collectionId = $page.params.id ?? '';

	let loading = true;
	let analytics: any = null;
	let aiSummary = '';
	let aiLoading = false;
	let chatQuestion = '';
	let chatAnswer = '';
	let chatLoading = false;
	let activeTab = 'analytics';

	let subscriberChart: any[] = [];
	let subscriberDonut: any[] = [];

	const areaOptions: any = {
		title: 'Subscriber Growth',
		axes: { left: { mapsTo: 'value', scaleType: 'linear' }, bottom: { mapsTo: 'date', scaleType: 'labels' } },
		curve: 'curveMonotoneX',
		legend: { enabled: true, position: 'bottom' },
		height: '330px',
		color: { scale: { 'Subscribers': '#3b82f6', 'Events': '#8b5cf6' } }
	};
	const donutOptions = { title: 'Subscriber Sources', height: '330px', legend: { position: 'bottom' } };

	onMount(async () => {
		loading = true;
		analytics = await getCollectionAnalyticsOverview(collectionId);

		if (analytics) {
			const days = analytics.subscribers?.subscribersByDay || [];
			subscriberChart = days.map((d: any) => ({ group: 'Subscribers', date: d.date, value: d.count || 0 }));

			const src = analytics.subscribers?.bySource || {};
			subscriberDonut = [
				{ group: 'Manual', value: src.manual || 0 },
				{ group: 'Event Attendee', value: src.eventAttendee || 0 },
			].filter(d => d.value > 0);
			if (subscriberDonut.length === 0) subscriberDonut = [{ group: 'No Data', value: 1 }];
		}
		loading = false;
	});

	async function loadAISummary() {
		aiLoading = true;
		const result = await generateAnalyticsSummary('collection', collectionId);
		aiSummary = result?.summary || 'Unable to generate summary.';
		aiLoading = false;
	}
	async function askQuestion() {
		if (!chatQuestion.trim()) return;
		chatLoading = true;
		const result = await chatWithAnalytics('collection', collectionId, chatQuestion);
		chatAnswer = result?.answer || 'Unable to answer.';
		chatLoading = false;
	}

	function fmt(n: number | undefined): string { if (!n) return '0'; return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toLocaleString(); }
	function fmtCurrency(n: number | undefined): string { if (!n) return '$0'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n); }
	function fmtPercent(n: number | undefined): string { return (n || 0).toFixed(1) + '%'; }
</script>

<div class="max-w-6xl space-y-6">
	<div class="mb-6">
		<h1 class="mb-2 text-3xl font-bold md:text-4xl">{analytics?.collectionName || 'Collection'} Insights</h1>
		<p class="text-sm text-gray-500">Track subscribers, events, audience retention, and growth.</p>
		<div class="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1">
			{#each ['analytics', 'ai'] as tab}
				<button on:click={() => activeTab = tab}
					class="rounded-md px-4 py-2 text-sm font-medium transition-colors {activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">
					{tab === 'analytics' ? 'Analytics' : 'AI Insights'}
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<InsightsSkeleton variant="collection" />
	{:else if !analytics}
		<div class="flex h-64 flex-col items-center justify-center text-gray-400">
			<Icon icon="mdi:folder-multiple" class="mb-3 text-5xl" />
			<p class="text-lg font-medium">No analytics data yet</p>
			<p class="text-sm">Analytics will appear once your collection has events and subscribers.</p>
		</div>
	{:else if activeTab === 'analytics'}

	<!-- Stats Cards -->
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Subscribers</p>
			<p class="mt-1 text-2xl font-bold">{fmt(analytics.subscribers?.total)}</p>
			<p class="mt-1 text-xs text-gray-400">Active: {fmt(analytics.subscribers?.active)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Events</p>
			<p class="mt-1 text-2xl font-bold text-purple-600">{fmt(analytics.events?.total)}</p>
			<p class="mt-1 text-xs text-gray-400">Live: {fmt(analytics.events?.live)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Attendees</p>
			<p class="mt-1 text-2xl font-bold text-green-600">{fmt(analytics.events?.totalAttendees)}</p>
			<p class="mt-1 text-xs text-gray-400">Avg per event: {fmt(analytics.events?.averageAttendees)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Revenue</p>
			<p class="mt-1 text-2xl font-bold text-blue-600">{fmtCurrency(analytics.events?.totalRevenue)}</p>
			<p class="mt-1 text-xs text-gray-400">Avg per event: {fmtCurrency(analytics.events?.averageRevenue)}</p>
		</div>
	</div>

	<!-- Charts -->
	<div class="grid gap-4 rounded-2xl bg-[#FDFDFD] p-1">
		<div class="flex w-full flex-col gap-10 p-4 lg:flex-row">
			<div class="w-full">
				{#if subscriberChart.length > 0}
					<StackedAreaChart data={subscriberChart} options={areaOptions} />
				{:else}
					<div class="flex h-80 items-center justify-center text-gray-400">No subscriber trend data yet</div>
				{/if}
			</div>
			<div class="flex w-full max-w-100 items-center justify-center">
				<DonutChart data={subscriberDonut} options={donutOptions} />
			</div>
		</div>

		<div class="flex w-full flex-col items-start gap-6 rounded-b-2xl bg-[#F4F4F4] p-4 lg:flex-row">
			<!-- Subscribers -->
			<div class="w-full space-y-4 text-sm">
				<h3 class="font-semibold text-black">Subscriber Breakdown</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Active</div><div class="text-xl font-semibold text-green-600">{fmt(analytics.subscribers?.active)}</div></div>
					<div><div class="text-[#BABABA]">Pending</div><div class="text-xl font-semibold text-orange-500">{fmt(analytics.subscribers?.pendingVerification)}</div></div>
					<div><div class="text-[#BABABA]">Expired</div><div class="text-xl font-semibold text-red-500">{fmt(analytics.subscribers?.expired)}</div></div>
				</div>

				<h3 class="mt-4 font-semibold text-black">Event Portfolio</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Live</div><div class="text-xl font-semibold text-green-600">{fmt(analytics.events?.live)}</div></div>
					<div><div class="text-[#BABABA]">Ended</div><div class="text-xl font-semibold">{fmt(analytics.events?.ended)}</div></div>
					<div><div class="text-[#BABABA]">Cancelled</div><div class="text-xl font-semibold text-red-500">{fmt(analytics.events?.cancelled)}</div></div>
				</div>

				<!-- Audience -->
				{#if analytics.audience?.repeatAttendeeRate > 0}
				<h3 class="mt-4 font-semibold text-black">Audience Insights</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Repeat Rate</div><div class="text-xl font-semibold">{fmtPercent(analytics.audience.repeatAttendeeRate)}</div></div>
					<div><div class="text-[#BABABA]">Avg Events/Attendee</div><div class="text-xl font-semibold">{analytics.audience.averageEventsPerAttendee?.toFixed(1) || '0'}</div></div>
				</div>
				{/if}
			</div>

			<div class="h-0 w-full border lg:h-full lg:w-0"></div>

			<!-- Top Events & Predictions -->
			<div class="w-full space-y-3 text-sm">
				{#if analytics.events?.topPerformingEvents?.length > 0}
				<h3 class="font-semibold text-black">Top Performing Events</h3>
				{#each analytics.events.topPerformingEvents.slice(0, 5) as event}
					<div class="flex justify-between">
						<span class="text-gray-500 truncate max-w-48">{event.title}</span>
						<span class="font-medium">{event.attendees} attendees</span>
					</div>
				{/each}
				{/if}

				<!-- Growth -->
				<h3 class="mt-4 font-semibold text-black">Growth Metrics</h3>
				<div class="flex justify-between"><span class="text-gray-500">Subscriber Growth Rate</span><span class="font-medium">{fmtPercent(analytics.subscribers?.growthRate)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Churn Rate</span><span class="font-medium text-red-500">{fmtPercent(analytics.subscribers?.churnRate)}</span></div>

				{#if analytics.predictions?.confidence > 0}
				<h3 class="mt-4 font-semibold text-black">Predictions</h3>
				<div class="rounded-lg bg-white p-3">
					<div class="flex justify-between"><span class="text-gray-500">Est. Subscribers (30d)</span><span class="font-medium">{fmt(analytics.predictions.estimatedSubscribersNext30Days)}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Next Event Attendance</span><span class="font-medium">{fmt(analytics.predictions.nextEventAttendanceEstimate)}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Growth Trend</span>
						<span class="font-medium capitalize {analytics.predictions.subscriberGrowthTrend === 'growing' ? 'text-green-600' : analytics.predictions.subscriberGrowthTrend === 'declining' ? 'text-red-500' : ''}">{analytics.predictions.subscriberGrowthTrend}</span>
					</div>
				</div>
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
					class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
					{#if aiLoading}<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> Generating...
					{:else}<Icon icon="mdi:auto-fix" class="h-4 w-4" /> Generate Summary{/if}
				</button>
			</div>
			{#if aiSummary}<div class="prose prose-sm max-w-none rounded-lg bg-gray-50 p-4">{@html aiSummary.replace(/\n/g, '<br>')}</div>
			{:else}<p class="text-sm text-gray-400">Click "Generate Summary" for an AI analysis of your collection performance.</p>{/if}
		</div>
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-medium">Chat with Your Data</h3>
			<div class="flex gap-2">
				<input type="text" bind:value={chatQuestion} placeholder="Ask about your collection analytics..."
					class="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
					on:keydown={(e) => e.key === 'Enter' && askQuestion()} />
				<button on:click={askQuestion} disabled={chatLoading || !chatQuestion.trim()}
					class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{chatLoading ? '...' : 'Ask'}</button>
			</div>
			{#if chatAnswer}<div class="mt-4 rounded-lg bg-gray-50 p-4 text-sm">{@html chatAnswer.replace(/\n/g, '<br>')}</div>{/if}
		</div>
	</div>
	{/if}
</div>
