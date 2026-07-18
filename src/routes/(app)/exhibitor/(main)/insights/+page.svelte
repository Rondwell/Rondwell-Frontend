<script lang="ts">
	import { onMount } from 'svelte';
	import { DonutChart, StackedAreaChart } from '@carbon/charts-svelte';
	import '@carbon/charts-svelte/styles.css';
	import Icon from '@iconify/svelte';
	import {
		getExhibitorAnalyticsOverview,
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

	let eventChart: any[] = [];
	let participationDonut: any[] = [];

	const areaOptions: any = {
		title: 'Event Participation Over Time',
		axes: { left: { mapsTo: 'value', scaleType: 'linear' }, bottom: { mapsTo: 'date', scaleType: 'labels' } },
		curve: 'curveMonotoneX',
		legend: { enabled: true, position: 'bottom' },
		height: '330px',
		color: { scale: { 'Events': '#f59e0b', 'Leads': '#3b82f6' } }
	};
	const donutOptions = { title: 'Participation Status', height: '330px', legend: { position: 'bottom' } };

	onMount(async () => {
		if (browser) profileId = localStorage.getItem('active_profile_id') || '';
		if (!profileId) { loading = false; return; }

		analytics = await getExhibitorAnalyticsOverview(profileId);

		if (analytics) {
			const months = analytics.participation?.eventsByMonth || [];
			eventChart = months.map((m: any) => ({ group: 'Events', date: m.month, value: m.count || 0 }));

			const leadMonths = analytics.leads?.leadsByMonth || [];
			eventChart = [...eventChart, ...leadMonths.map((m: any) => ({ group: 'Leads', date: m.month, value: m.leads || 0 }))];

			const p = analytics.participation || {};
			participationDonut = [
				{ group: 'Accepted', value: p.totalEventsAccepted || 0 },
				{ group: 'Declined', value: p.totalEventsDeclined || 0 },
				{ group: 'Pending', value: Math.max(0, (p.totalEventsInvited || 0) - (p.totalEventsAccepted || 0) - (p.totalEventsDeclined || 0)) },
			].filter(d => d.value > 0);
			if (participationDonut.length === 0) participationDonut = [{ group: 'No Data', value: 1 }];
		}
		loading = false;
	});

	async function loadAISummary() {
		aiLoading = true;
		const result = await generateAnalyticsSummary('exhibitor', profileId);
		aiSummary = result?.summary || 'Unable to generate summary.';
		aiLoading = false;
	}
	async function askQuestion() {
		if (!chatQuestion.trim()) return;
		chatLoading = true;
		const result = await chatWithAnalytics('exhibitor', profileId, chatQuestion);
		chatAnswer = result?.answer || 'Unable to answer.';
		chatLoading = false;
	}

	function fmt(n: number | undefined): string { if (!n) return '0'; return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toLocaleString(); }
	function fmtCurrency(n: number | undefined): string { if (!n) return '$0'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n); }
	function fmtPercent(n: number | undefined): string { return (n || 0).toFixed(1) + '%'; }
</script>

<div class="max-w-6xl space-y-6">
	<div class="mb-6">
		<h1 class="mb-2 text-3xl font-bold md:text-4xl">Exhibitor Insights</h1>
		<p class="text-sm text-gray-500">Track your event participation, booth performance, leads, and ROI.</p>
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
		<InsightsSkeleton variant="exhibitor" />
	{:else if !analytics}
		<div class="flex h-64 flex-col items-center justify-center text-gray-400">
			<Icon icon="mdi:presentation" class="mb-3 text-5xl" />
			<p class="text-lg font-medium">No analytics data yet</p>
			<p class="text-sm">Analytics will appear once you participate in events as an exhibitor.</p>
		</div>
	{:else if activeTab === 'analytics'}

	<!-- Stats Cards -->
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Events Invited</p>
			<p class="mt-1 text-2xl font-bold">{fmt(analytics.participation?.totalEventsInvited)}</p>
			<p class="mt-1 text-xs text-gray-400">Acceptance: {fmtPercent(analytics.participation?.acceptanceRate)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Events Accepted</p>
			<p class="mt-1 text-2xl font-bold text-green-600">{fmt(analytics.participation?.totalEventsAccepted)}</p>
			<p class="mt-1 text-xs text-gray-400">Upcoming: {fmt(analytics.participation?.upcomingEvents)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Leads</p>
			<p class="mt-1 text-2xl font-bold text-blue-600">{fmt(analytics.leads?.totalLeads)}</p>
			<p class="mt-1 text-xs text-gray-400">Qualified: {fmt(analytics.leads?.qualifiedLeads)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">ROI</p>
			<p class="mt-1 text-2xl font-bold text-amber-600">{fmtPercent(analytics.financials?.roi)}</p>
			<p class="mt-1 text-xs text-gray-400">Investment: {fmtCurrency(analytics.financials?.totalInvestment)}</p>
		</div>
	</div>

	<!-- Charts -->
	<div class="grid gap-4 rounded-2xl bg-[#FDFDFD] p-1">
		<div class="flex w-full flex-col gap-10 p-4 lg:flex-row">
			<div class="w-full">
				{#if eventChart.length > 0}
					<StackedAreaChart data={eventChart} options={areaOptions} />
				{:else}
					<div class="flex h-80 items-center justify-center text-gray-400">No trend data yet</div>
				{/if}
			</div>
			<div class="flex w-full max-w-100 items-center justify-center">
				<DonutChart data={participationDonut} options={donutOptions} />
			</div>
		</div>

		<div class="flex w-full flex-col items-start gap-6 rounded-b-2xl bg-[#F4F4F4] p-4 lg:flex-row">
			<!-- Booth & Leads -->
			<div class="w-full space-y-4 text-sm">
				<h3 class="font-semibold text-black">Booth Performance</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Total Booths</div><div class="text-xl font-semibold">{fmt(analytics.booth?.totalBooths)}</div></div>
					<div><div class="text-[#BABABA]">Published</div><div class="text-xl font-semibold text-green-600">{fmt(analytics.booth?.publishedBooths)}</div></div>
					<div><div class="text-[#BABABA]">Draft</div><div class="text-xl font-semibold">{fmt(analytics.booth?.draftBooths)}</div></div>
					<div><div class="text-[#BABABA]">Views</div><div class="text-xl font-semibold">{fmt(analytics.booth?.boothViews)}</div></div>
				</div>

				<h3 class="mt-4 font-semibold text-black">Lead Generation</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Total Leads</div><div class="text-xl font-semibold">{fmt(analytics.leads?.totalLeads)}</div></div>
					<div><div class="text-[#BABABA]">Qualified</div><div class="text-xl font-semibold text-green-600">{fmt(analytics.leads?.qualifiedLeads)}</div></div>
					<div><div class="text-[#BABABA]">Conversion</div><div class="text-xl font-semibold">{fmtPercent(analytics.leads?.leadConversionRate)}</div></div>
				</div>

				<h3 class="mt-4 font-semibold text-black">Visibility</h3>
				<div class="flex gap-4">
					<div><div class="text-[#BABABA]">Profile Views</div><div class="text-xl font-semibold">{fmt(analytics.visibility?.profileViews)}</div></div>
					<div><div class="text-[#BABABA]">Impressions</div><div class="text-xl font-semibold">{fmt(analytics.visibility?.boothImpressions)}</div></div>
					<div><div class="text-[#BABABA]">Contact Requests</div><div class="text-xl font-semibold">{fmt(analytics.visibility?.contactRequests)}</div></div>
				</div>
			</div>

			<div class="h-0 w-full border lg:h-full lg:w-0"></div>

			<!-- Financials & Collaborations -->
			<div class="w-full space-y-3 text-sm">
				<h3 class="font-semibold text-black">Financial Summary</h3>
				<div class="flex justify-between"><span class="text-gray-500">Total Sponsorship</span><span class="font-medium">{fmtCurrency(analytics.financials?.totalSponsorship)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Total Investment</span><span class="font-medium">{fmtCurrency(analytics.financials?.totalInvestment)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">ROI</span><span class="font-medium text-amber-600">{fmtPercent(analytics.financials?.roi)}</span></div>

				<h3 class="mt-4 font-semibold text-black">Collaborations</h3>
				<div class="flex justify-between"><span class="text-gray-500">Total</span><span class="font-medium">{fmt(analytics.collaborations?.totalCollaborations)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Active</span><span class="font-medium text-green-600">{fmt(analytics.collaborations?.activeCollaborations)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Completed</span><span class="font-medium">{fmt(analytics.collaborations?.completedCollaborations)}</span></div>

				{#if analytics.predictions?.confidence > 0}
				<h3 class="mt-4 font-semibold text-black">Predictions</h3>
				<div class="rounded-lg bg-white p-3">
					<div class="flex justify-between"><span class="text-gray-500">Est. Leads Next Quarter</span><span class="font-medium">{analytics.predictions.estimatedLeadsNextQuarter}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Est. Events</span><span class="font-medium">{analytics.predictions.estimatedEventsNextQuarter}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Growth Trend</span>
						<span class="font-medium capitalize {analytics.predictions.growthTrend === 'growing' ? 'text-green-600' : analytics.predictions.growthTrend === 'declining' ? 'text-red-500' : ''}">{analytics.predictions.growthTrend}</span>
					</div>
				</div>
				{/if}

				<!-- Leads by Event -->
				{#if analytics.leads?.leadsByEvent?.length > 0}
				<h3 class="mt-4 font-semibold text-black">Leads by Event</h3>
				{#each analytics.leads.leadsByEvent.slice(0, 5) as le}
					<div class="flex justify-between"><span class="text-gray-500">{le.eventTitle}</span><span class="font-medium">{le.leads} leads</span></div>
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
					class="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
					{#if aiLoading}<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> Generating...
					{:else}<Icon icon="mdi:auto-fix" class="h-4 w-4" /> Generate Summary{/if}
				</button>
			</div>
			{#if aiSummary}<div class="prose prose-sm max-w-none rounded-lg bg-gray-50 p-4">{@html aiSummary.replace(/\n/g, '<br>')}</div>
			{:else}<p class="text-sm text-gray-400">Click "Generate Summary" for an AI analysis of your exhibitor performance.</p>{/if}
		</div>
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-medium">Chat with Your Data</h3>
			<div class="flex gap-2">
				<input type="text" bind:value={chatQuestion} placeholder="Ask about your exhibitor analytics..."
					class="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
					on:keydown={(e) => e.key === 'Enter' && askQuestion()} />
				<button on:click={askQuestion} disabled={chatLoading || !chatQuestion.trim()}
					class="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">{chatLoading ? '...' : 'Ask'}</button>
			</div>
			{#if chatAnswer}<div class="mt-4 rounded-lg bg-gray-50 p-4 text-sm">{@html chatAnswer.replace(/\n/g, '<br>')}</div>{/if}
		</div>
	</div>
	{/if}
</div>
