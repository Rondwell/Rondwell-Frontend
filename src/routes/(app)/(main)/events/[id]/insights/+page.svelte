<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { DonutChart, StackedAreaChart } from '@carbon/charts-svelte';
	import '@carbon/charts-svelte/styles.css';
	import Icon from '@iconify/svelte';
	import Nav from '../../../../components/Nav.svelte';
	import {
		getEventAnalyticsOverview,
		getEventTimeseries,
		generateAnalyticsSummary,
		chatWithAnalytics
	} from '$lib/services/analytics.services';
	import InsightsSkeleton from '$lib/components/analytics/InsightsSkeleton.svelte';

	$: eventId = $page.params.id ?? '';

	let loading = true;
	let analytics: any = null;
	let aiSummary = '';
	let aiLoading = false;
	let chatQuestion = '';
	let chatAnswer = '';
	let chatLoading = false;
	let activeTab = 'analytics';
	let searchQuery = '';

	const tabs = [
		{
			id: 'analytics',
			label: 'Analytics',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 18.3307H12.5C16.6667 18.3307 18.3333 16.6641 18.3333 12.4974V7.4974C18.3333 3.33073 16.6667 1.66406 12.5 1.66406H7.5C3.33333 1.66406 1.66667 3.33073 1.66667 7.4974V12.4974C1.66667 16.6641 3.33333 18.3307 7.5 18.3307Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.25 12.1849L8.15833 9.60156L10.3333 11.3516L12.2 8.85156" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		},
		{
			id: 'ai',
			label: 'AI Insights',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 1.66406L12.575 6.88073L18.3333 7.72573L14.1667 11.7841L15.15 17.5174L10 14.8091L4.85 17.5174L5.83333 11.7841L1.66667 7.72573L7.425 6.88073L10 1.66406Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		},
		{
			id: 'surveys',
			label: 'Surveys & Feedback',
			icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.3327 8.33073V12.4974C18.3327 16.6641 16.666 18.3307 12.4993 18.3307H7.49935C3.33268 18.3307 1.66602 16.6641 1.66602 12.4974V7.4974C1.66602 3.33073 3.33268 1.66406 7.49935 1.66406H11.666" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3327 8.33073H14.9993C12.4993 8.33073 11.666 7.4974 11.666 4.9974V1.66406L18.3327 8.33073Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.83398 10.8359H10.834" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.83398 14.1641H9.16732" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		}
	];

	// Chart data derived from API
	let chartData: any[] = [];
	let donutData: any[] = [];

	const areaOptions: any = {
		title: 'Registration Trends',
		axes: {
			left: { mapsTo: 'value', scaleType: 'linear', title: '' },
			bottom: { mapsTo: 'date', scaleType: 'labels', title: '' }
		},
		curve: 'curveMonotoneX',
		legend: { enabled: true, position: 'bottom' },
		height: '330px',
		color: { scale: { 'Registrations': '#3b82f6', 'Check-ins': '#22c55e', 'Cancellations': '#ef4444' } }
	};

	const donutOptions = { title: 'Attendee Status', height: '330px', legend: { position: 'bottom' } };

	onMount(async () => {
		loading = true;
		analytics = await getEventAnalyticsOverview(eventId);

		if (analytics) {
			// Build area chart from daily snapshots
			const snapshots = analytics.dailySnapshots || [];
			chartData = snapshots.flatMap((s: any) => [
				{ group: 'Registrations', date: s.date, value: s.registrations || 0 },
				{ group: 'Check-ins', date: s.date, value: s.checkIns || 0 },
			]);

			// Build donut from registration status
			const reg = analytics.registrations || {};
			donutData = [
				{ group: 'Attending', value: reg.attending || 0 },
				{ group: 'Pending', value: reg.pending || 0 },
				{ group: 'Checked In', value: reg.checkedIn || 0 },
				{ group: 'Waitlisted', value: reg.waitlisted || 0 },
				{ group: 'Declined', value: reg.declined || 0 },
			].filter(d => d.value > 0);

			if (donutData.length === 0) donutData = [{ group: 'No Data', value: 1 }];
		}
		loading = false;
	});

	async function loadAISummary() {
		aiLoading = true;
		const result = await generateAnalyticsSummary('event', eventId);
		aiSummary = result?.summary || 'Unable to generate summary at this time.';
		aiLoading = false;
	}

	async function askQuestion() {
		if (!chatQuestion.trim()) return;
		chatLoading = true;
		const result = await chatWithAnalytics('event', eventId, chatQuestion);
		chatAnswer = result?.answer || 'Unable to answer at this time.';
		chatLoading = false;
	}

	function fmt(n: number | undefined): string {
		if (n === undefined || n === null) return '0';
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return n.toLocaleString();
	}

	function fmtCurrency(n: number | undefined, currency?: string): string {
		const code = (currency || analytics?.tickets?.currency || 'NGN').toUpperCase();
		try {
			return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, minimumFractionDigits: 0 }).format(n || 0);
		} catch {
			return `${code} ${(n || 0).toLocaleString()}`;
		}
	}

	function fmtPercent(n: number | undefined): string {
		if (!n) return '0%';
		return n.toFixed(1) + '%';
	}
</script>

<div class="max-w-6xl">
	<!-- Header -->
	<div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			<span class="text-sm text-[#83808D]">{analytics?.collectionId ? 'Collection' : ''}</span>
			<a href="/event-page/{eventId}" target="_blank" rel="noopener noreferrer"
				class="flex items-center gap-1.5 rounded-md bg-[#F0EFF1] px-3 py-1.5 text-sm font-medium text-[#5D646F] transition-colors hover:bg-[#E4E3E6]">
				Event Page
				<Icon icon="mdi:open-in-new" class="h-3.5 w-3.5 text-[#8A8D90]" />
			</a>
		</div>
		<h1 class="mb-4 text-3xl font-bold md:text-4xl">{analytics?.eventTitle || 'Event Insights'}</h1>
		<Nav {tabs} bind:activeTab />
	</div>

	{#if loading}
		<InsightsSkeleton variant="event" />
	{:else if activeTab === 'analytics'}

	<!-- Stats Cards -->
	<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Registrations</p>
			<p class="mt-1 text-2xl font-bold">{fmt(analytics?.registrations?.total)}</p>
			<p class="mt-1 text-xs text-gray-400">Conversion: {fmtPercent(analytics?.registrations?.conversionRate)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Attending</p>
			<p class="mt-1 text-2xl font-bold text-green-600">{fmt(analytics?.registrations?.attending)}</p>
			<p class="mt-1 text-xs text-gray-400">Check-in rate: {fmtPercent(analytics?.registrations?.checkInRate)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Tickets Sold</p>
			<p class="mt-1 text-2xl font-bold">{fmt(analytics?.tickets?.totalSold)}</p>
			<p class="mt-1 text-xs text-gray-400">Avg price: {fmtCurrency(analytics?.tickets?.averageTicketPrice)}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs uppercase text-gray-500">Total Revenue</p>
			<p class="mt-1 text-2xl font-bold text-blue-600">{fmtCurrency(analytics?.tickets?.totalRevenue, analytics?.tickets?.currency)}</p>
			<p class="mt-1 text-xs text-gray-400">Refunds: {fmtCurrency(analytics?.tickets?.refunds?.amount)}</p>
		</div>
	</div>

	<!-- Charts -->
	<div class="mb-6 grid gap-4 rounded-2xl bg-[#FDFDFD] p-1">
		<div class="flex w-full flex-col gap-10 p-4 lg:flex-row">
			<div class="w-full">
				{#if chartData.length > 0}
					<StackedAreaChart data={chartData} options={areaOptions} />
				{:else}
					<div class="flex h-80 items-center justify-center text-gray-400">No trend data yet</div>
				{/if}
			</div>
			<div class="flex w-full max-w-100 items-center justify-center">
				<DonutChart data={donutData} options={donutOptions} />
			</div>
		</div>

		<!-- Stats + Lists -->
		<div class="flex w-full flex-col items-start gap-6 rounded-b-2xl bg-[#F4F4F4] p-4 lg:flex-row">
			<div class="w-full space-y-4 text-sm text-gray-700">
				<div>
					<h3 class="mb-2 font-semibold text-black">Registration Sources</h3>
					<div class="flex items-center gap-4">
						<div>
							<div class="mb-1 text-[#BABABA]">Self-Registered</div>
							<div class="text-xl font-semibold text-gray-900">{fmt(analytics?.demographics?.bySource?.selfRegistered)}</div>
						</div>
						<div>
							<div class="mb-1 text-[#BABABA]">Manual Invite</div>
							<div class="text-xl font-semibold text-gray-900">{fmt(analytics?.demographics?.bySource?.manualInvite)}</div>
						</div>
						<div>
							<div class="mb-1 text-[#BABABA]">Bulk Invite</div>
							<div class="text-xl font-semibold text-gray-900">{fmt(analytics?.demographics?.bySource?.bulkInvite)}</div>
						</div>
					</div>
				</div>

				<!-- Engagement -->
				<div>
					<h3 class="mb-2 font-semibold text-black">Check-in Methods</h3>
					<div class="flex flex-wrap gap-3">
						<span class="rounded-full bg-white px-3 py-1 text-xs">QR Code: {fmt(analytics?.engagement?.checkInsByMethod?.qrCode)}</span>
						<span class="rounded-full bg-white px-3 py-1 text-xs">Passcode: {fmt(analytics?.engagement?.checkInsByMethod?.passcode)}</span>
						<span class="rounded-full bg-white px-3 py-1 text-xs">Manual: {fmt(analytics?.engagement?.checkInsByMethod?.manual)}</span>
					</div>
				</div>

				<!-- Waitlist -->
				{#if analytics?.waitlist?.totalJoined > 0}
				<div>
					<h3 class="mb-2 font-semibold text-black">Waitlist</h3>
					<div class="flex items-center gap-4">
						<div>
							<div class="mb-1 text-[#BABABA]">Joined</div>
							<div class="text-xl font-semibold">{fmt(analytics?.waitlist?.totalJoined)}</div>
						</div>
						<div>
							<div class="mb-1 text-[#BABABA]">Promoted</div>
							<div class="text-xl font-semibold">{fmt(analytics?.waitlist?.promoted)}</div>
						</div>
						<div>
							<div class="mb-1 text-[#BABABA]">Rate</div>
							<div class="text-xl font-semibold">{fmtPercent(analytics?.waitlist?.promotionRate)}</div>
						</div>
					</div>
				</div>
				{/if}
			</div>

			<div class="h-0 w-full border lg:h-full lg:w-0"></div>

			<!-- Ticket Breakdown -->
			<div class="flex w-full flex-col gap-3">
				<h3 class="font-semibold text-black">Ticket Types</h3>
				{#if analytics?.tickets?.byType?.length > 0}
					{#each analytics.tickets.byType as tt}
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-600">{tt.name}</span>
							<div class="flex items-center gap-3">
								<span class="text-gray-400">{tt.sold} sold</span>
								<span class="font-medium">{fmtCurrency(tt.revenue)}</span>
								{#if tt.available > 0}
									<span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{tt.percentSold}%</span>
								{/if}
							</div>
						</div>
					{/each}
				{:else}
					<p class="text-sm text-gray-400">No ticket types configured</p>
				{/if}

				<!-- Predictions -->
				{#if analytics?.predictions?.confidence > 0}
				<div class="mt-4">
					<h3 class="font-semibold text-black">Predictions</h3>
					<div class="mt-2 rounded-lg bg-white p-3 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-500">Est. Final Attendance</span>
							<span class="font-medium">{fmt(analytics.predictions.estimatedFinalAttendance)}</span>
						</div>
						<div class="mt-1 flex justify-between">
							<span class="text-gray-500">Est. Final Revenue</span>
							<span class="font-medium">{fmtCurrency(analytics.predictions.estimatedFinalRevenue)}</span>
						</div>
						<div class="mt-1 flex justify-between">
							<span class="text-gray-500">Trend</span>
							<span class="font-medium capitalize {analytics.predictions.attendanceTrend === 'growing' ? 'text-green-600' : analytics.predictions.attendanceTrend === 'declining' ? 'text-red-500' : 'text-gray-600'}">
								{analytics.predictions.attendanceTrend}
							</span>
						</div>
					</div>
				</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Funnel -->
	<div class="mb-6 rounded-xl bg-white p-6 shadow-sm">
		<h3 class="mb-4 text-lg font-medium">Registration Funnel</h3>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-5">
			<div class="text-center">
				<p class="text-2xl font-bold">{fmt(analytics?.funnel?.registrationStarts)}</p>
				<p class="text-xs text-gray-500">Started</p>
			</div>
			<div class="text-center">
				<p class="text-2xl font-bold">{fmt(analytics?.funnel?.registrationCompletes)}</p>
				<p class="text-xs text-gray-500">Completed</p>
			</div>
			<div class="text-center">
				<p class="text-2xl font-bold">{fmt(analytics?.funnel?.paymentStarts)}</p>
				<p class="text-xs text-gray-500">Payment Started</p>
			</div>
			<div class="text-center">
				<p class="text-2xl font-bold">{fmt(analytics?.funnel?.paymentCompletes)}</p>
				<p class="text-xs text-gray-500">Payment Complete</p>
			</div>
			<div class="text-center">
				<p class="text-2xl font-bold text-red-500">{fmtPercent(analytics?.funnel?.dropOffRate)}</p>
				<p class="text-xs text-gray-500">Drop-off Rate</p>
			</div>
		</div>
	</div>

	<!-- Communications -->
	<div class="mb-6 rounded-xl bg-white p-6 shadow-sm">
		<h3 class="mb-4 text-lg font-medium">Communications</h3>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<div>
				<p class="text-2xl font-bold">{fmt(analytics?.communications?.emailsSent)}</p>
				<p class="text-xs text-gray-500">Emails Sent</p>
			</div>
			<div>
				<p class="text-2xl font-bold">{fmt(analytics?.communications?.invitationsSent)}</p>
				<p class="text-xs text-gray-500">Invitations</p>
			</div>
			<div>
				<p class="text-2xl font-bold">{fmt(analytics?.communications?.blastsSent)}</p>
				<p class="text-xs text-gray-500">Blasts Sent</p>
			</div>
			<div>
				<p class="text-2xl font-bold">{fmtPercent(analytics?.communications?.invitationAcceptRate)}</p>
				<p class="text-xs text-gray-500">Accept Rate</p>
			</div>
		</div>
	</div>

	{:else if activeTab === 'ai'}
	<!-- AI Insights Tab -->
	<div class="space-y-6">
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-medium">AI-Generated Summary</h3>
				<button on:click={loadAISummary} disabled={aiLoading}
					class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
					{#if aiLoading}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						Generating...
					{:else}
						<Icon icon="mdi:auto-fix" class="h-4 w-4" />
						Generate Summary
					{/if}
				</button>
			</div>
			{#if aiSummary}
				<div class="prose prose-sm max-w-none rounded-lg bg-gray-50 p-4">{@html aiSummary.replace(/\n/g, '<br>')}</div>
			{:else}
				<p class="text-sm text-gray-400">Click "Generate Summary" to get an AI-powered analysis of your event performance.</p>
			{/if}
		</div>

		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-medium">Chat with Your Data</h3>
			<div class="flex gap-2">
				<input type="text" bind:value={chatQuestion} placeholder="Ask a question about your event analytics..."
					class="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					on:keydown={(e) => e.key === 'Enter' && askQuestion()} />
				<button on:click={askQuestion} disabled={chatLoading || !chatQuestion.trim()}
					class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
					{chatLoading ? '...' : 'Ask'}
				</button>
			</div>
			{#if chatAnswer}
				<div class="mt-4 rounded-lg bg-gray-50 p-4 text-sm">{@html chatAnswer.replace(/\n/g, '<br>')}</div>
			{/if}
		</div>
	</div>

	{:else if activeTab === 'surveys'}
	<div class="flex h-70 flex-col items-center justify-center">
		<Icon icon="mdi:clipboard-text-outline" class="mb-3 text-6xl text-gray-300" />
		<p class="text-lg font-medium text-[#A2ACB2]">Surveys & Feedback</p>
		<p class="mt-1 text-center text-sm text-gray-400">Create surveys and collect feedback from your event attendees. Coming soon.</p>
	</div>
	{/if}
</div>
