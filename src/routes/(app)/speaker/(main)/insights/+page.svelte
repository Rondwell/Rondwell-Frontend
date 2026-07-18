<script lang="ts">
	import { onMount } from 'svelte';
	import { DonutChart, StackedAreaChart } from '@carbon/charts-svelte';
	import '@carbon/charts-svelte/styles.css';
	import Icon from '@iconify/svelte';
	import {
		getSpeakerAnalyticsOverview,
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

	// Chart data
	let participationChart: any[] = [];
	let statusDonut: any[] = [];

	const areaOptions: any = {
		title: 'Events Over Time',
		axes: { left: { mapsTo: 'value', scaleType: 'linear' }, bottom: { mapsTo: 'date', scaleType: 'labels' } },
		curve: 'curveMonotoneX',
		legend: { enabled: true, position: 'bottom' },
		height: '330px',
		color: { scale: { 'Events': '#8b5cf6', 'Sessions': '#3b82f6' } }
	};
	const donutOptions = { title: 'Event Participation', height: '330px', legend: { position: 'bottom' } };

	onMount(async () => {
		if (browser) {
			profileId = localStorage.getItem('active_profile_id') || '';
		}
		if (!profileId) { loading = false; return; }

		analytics = await getSpeakerAnalyticsOverview(profileId);

		if (analytics) {
			const months = analytics.participation?.eventsByMonth || [];
			participationChart = months.map((m: any) => ({ group: 'Events', date: m.month, value: m.count || 0 }));

			const p = analytics.participation || {};
			statusDonut = [
				{ group: 'Accepted', value: p.totalEventsAccepted || 0 },
				{ group: 'Declined', value: p.totalEventsDeclined || 0 },
				{ group: 'Pending', value: (p.totalEventsInvited || 0) - (p.totalEventsAccepted || 0) - (p.totalEventsDeclined || 0) },
			].filter(d => d.value > 0);
			if (statusDonut.length === 0) statusDonut = [{ group: 'No Data', value: 1 }];
		}
		loading = false;
	});

	async function loadAISummary() {
		aiLoading = true;
		const result = await generateAnalyticsSummary('speaker', profileId);
		aiSummary = result?.summary || 'Unable to generate summary.';
		aiLoading = false;
	}

	async function askQuestion() {
		if (!chatQuestion.trim()) return;
		chatLoading = true;
		const result = await chatWithAnalytics('speaker', profileId, chatQuestion);
		chatAnswer = result?.answer || 'Unable to answer.';
		chatLoading = false;
	}

	function fmt(n: number | undefined): string {
		if (!n) return '0';
		return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toLocaleString();
	}
	function fmtCurrency(n: number | undefined): string {
		if (!n) return '$0';
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
	}
	function fmtPercent(n: number | undefined): string { return (n || 0).toFixed(1) + '%'; }
</script>

<div class="max-w-6xl space-y-6">
	<div class="mb-6">
		<h1 class="mb-2 text-3xl font-bold md:text-4xl">Speaker Insights</h1>
		<p class="text-sm text-gray-500">Track your speaking engagements, audience reach, and growth.</p>

		<!-- Tabs -->
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
		<InsightsSkeleton variant="speaker" />
	{:else if !analytics}
		<div class="flex h-64 flex-col items-center justify-center text-gray-400">
			<Icon icon="mdi:chart-line" class="mb-3 text-5xl" />
			<p class="text-lg font-medium">No analytics data yet</p>
			<p class="text-sm">Analytics will appear once you participate in events.</p>
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
			<p class="text-xs uppercase text-gray-500">Total Sessions</p>
			<p class="mt-1 text-2xl font-bold text-blue-600">{fmt(analytics.sessions?.totalSessions)}</p>
			<p class="mt-1 text-xs text-gray-400">Avg duration: {analytics.sessions?.averageSessionDuration || 0}min</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Audience Reached</p>
			<p class="mt-1 text-2xl font-bold text-purple-600">{fmt(analytics.audienceReach?.totalAttendeesReached)}</p>
			<p class="mt-1 text-xs text-gray-400">Avg per session: {fmt(analytics.audienceReach?.averageAttendeesPerSession)}</p>
		</div>
	</div>

	<!-- Charts -->
	<div class="grid gap-4 rounded-2xl bg-[#FDFDFD] p-1">
		<div class="flex w-full flex-col gap-10 p-4 lg:flex-row">
			<div class="w-full">
				{#if participationChart.length > 0}
					<StackedAreaChart data={participationChart} options={areaOptions} />
				{:else}
					<div class="flex h-80 items-center justify-center text-gray-400">No trend data yet</div>
				{/if}
			</div>
			<div class="flex w-full max-w-100 items-center justify-center">
				<DonutChart data={statusDonut} options={donutOptions} />
			</div>
		</div>

		<div class="flex w-full flex-col items-start gap-6 rounded-b-2xl bg-[#F4F4F4] p-4 lg:flex-row">
			<!-- Collaborations -->
			<div class="w-full space-y-4 text-sm">
				<h3 class="font-semibold text-black">Collaborations</h3>
				<div class="flex gap-4">
					<div>
						<div class="text-[#BABABA]">Total Invitations</div>
						<div class="text-xl font-semibold">{fmt(analytics.collaborations?.totalInvitations)}</div>
					</div>
					<div>
						<div class="text-[#BABABA]">Accepted</div>
						<div class="text-xl font-semibold text-green-600">{fmt(analytics.collaborations?.acceptedInvitations)}</div>
					</div>
					<div>
						<div class="text-[#BABABA]">Pending</div>
						<div class="text-xl font-semibold text-orange-500">{fmt(analytics.collaborations?.pendingInvitations)}</div>
					</div>
				</div>

				<h3 class="mt-4 font-semibold text-black">Earnings</h3>
				<div class="flex gap-4">
					<div>
						<div class="text-[#BABABA]">Total Earnings</div>
						<div class="text-xl font-semibold">{fmtCurrency(analytics.collaborations?.totalEarnings)}</div>
					</div>
					<div>
						<div class="text-[#BABABA]">Avg per Event</div>
						<div class="text-xl font-semibold">{fmtCurrency(analytics.collaborations?.averageEarningsPerEvent)}</div>
					</div>
				</div>
			</div>

			<div class="h-0 w-full border lg:h-full lg:w-0"></div>

			<!-- Reputation -->
			<div class="w-full space-y-3 text-sm">
				<h3 class="font-semibold text-black">Reputation</h3>
				<div class="flex justify-between"><span class="text-gray-500">Profile Views</span><span class="font-medium">{fmt(analytics.reputation?.profileViews)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Portfolio Views</span><span class="font-medium">{fmt(analytics.reputation?.portfolioViews)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Testimonials</span><span class="font-medium">{fmt(analytics.reputation?.testimonialCount)}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Booking Requests</span><span class="font-medium">{fmt(analytics.reputation?.bookingRequestCount)}</span></div>
				{#if analytics.reputation?.averageRating > 0}
					<div class="flex justify-between"><span class="text-gray-500">Average Rating</span><span class="font-medium">{analytics.reputation.averageRating.toFixed(1)} ⭐</span></div>
				{/if}

				<!-- Predictions -->
				{#if analytics.predictions?.confidence > 0}
				<h3 class="mt-4 font-semibold text-black">Predictions</h3>
				<div class="rounded-lg bg-white p-3">
					<div class="flex justify-between"><span class="text-gray-500">Est. Events Next Quarter</span><span class="font-medium">{analytics.predictions.estimatedEventsNextQuarter}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Est. Earnings</span><span class="font-medium">{fmtCurrency(analytics.predictions.estimatedEarningsNextQuarter)}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Demand Trend</span>
						<span class="font-medium capitalize {analytics.predictions.demandTrend === 'growing' ? 'text-green-600' : analytics.predictions.demandTrend === 'declining' ? 'text-red-500' : ''}">{analytics.predictions.demandTrend}</span>
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
					class="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
					{#if aiLoading}<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> Generating...
					{:else}<Icon icon="mdi:auto-fix" class="h-4 w-4" /> Generate Summary{/if}
				</button>
			</div>
			{#if aiSummary}<div class="prose prose-sm max-w-none rounded-lg bg-gray-50 p-4">{@html aiSummary.replace(/\n/g, '<br>')}</div>
			{:else}<p class="text-sm text-gray-400">Click "Generate Summary" for an AI analysis of your speaker performance.</p>{/if}
		</div>
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-medium">Chat with Your Data</h3>
			<div class="flex gap-2">
				<input type="text" bind:value={chatQuestion} placeholder="Ask about your speaking analytics..."
					class="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
					on:keydown={(e) => e.key === 'Enter' && askQuestion()} />
				<button on:click={askQuestion} disabled={chatLoading || !chatQuestion.trim()}
					class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">{chatLoading ? '...' : 'Ask'}</button>
			</div>
			{#if chatAnswer}<div class="mt-4 rounded-lg bg-gray-50 p-4 text-sm">{@html chatAnswer.replace(/\n/g, '<br>')}</div>{/if}
		</div>
	</div>
	{/if}
</div>
