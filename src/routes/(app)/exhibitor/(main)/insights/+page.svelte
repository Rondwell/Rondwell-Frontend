<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { DonutChart, StackedAreaChart } from '@carbon/charts-svelte';
	import '@carbon/charts-svelte/styles.css';
	import Icon from '@iconify/svelte';
	import { renderMarkdown } from '$lib/utils/markdown';
	import {
		getExhibitorAnalyticsOverview,
		generateAnalyticsSummary,
		chatWithAnalytics
	} from '$lib/services/analytics.services';
	import { getActiveProfile } from '$lib/services/profile.services';
	import { authState } from '$lib/stores/auth.store';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import InsightsSkeleton from '$lib/components/analytics/InsightsSkeleton.svelte';
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
		color: { scale: { Events: '#f59e0b', Leads: '#513be2' } }
	};
	const donutOptions = { title: 'Participation Status', height: '330px', legend: { position: 'bottom' } };

	onMount(async () => {
		profileId =
			$authState.activeProfile?._id ||
			(browser ? localStorage.getItem('active_profile_id') || '' : '');

		if (!profileId) {
			try {
				const profile = await getActiveProfile();
				profileId = profile?._id || '';
			} catch {
				profileId = '';
			}
		}

		if (!profileId) {
			loading = false;
			return;
		}

		try {
			analytics = await getExhibitorAnalyticsOverview(profileId);

			if (analytics) {
				const months = analytics.participation?.eventsByMonth || [];
				eventChart = months.map((m: any) => ({ group: 'Events', date: m.month, value: m.count || 0 }));

				const leadMonths = analytics.leads?.leadsByMonth || [];
				eventChart = [
					...eventChart,
					...leadMonths.map((m: any) => ({ group: 'Leads', date: m.month, value: m.leads || 0 }))
				];

				const p = analytics.participation || {};
				participationDonut = [
					{ group: 'Accepted', value: p.totalEventsAccepted || 0 },
					{ group: 'Declined', value: p.totalEventsDeclined || 0 },
					{
						group: 'Pending',
						value: Math.max(
							0,
							(p.totalEventsInvited || 0) - (p.totalEventsAccepted || 0) - (p.totalEventsDeclined || 0)
						)
					}
				].filter((d) => d.value > 0);
				if (participationDonut.length === 0) participationDonut = [{ group: 'No Data', value: 1 }];
			}
		} catch {
			analytics = null;
		} finally {
			loading = false;
		}
	});

	async function loadAISummary() {
		aiLoading = true;
		const result = await generateAnalyticsSummary('exhibitor', profileId);
		aiSummary = result.summary || result.error || 'Unable to generate summary.';
		aiLoading = false;
	}
	async function askQuestion() {
		if (!chatQuestion.trim()) return;
		chatLoading = true;
		const result = await chatWithAnalytics('exhibitor', profileId, chatQuestion);
		chatAnswer = result.answer || result.error || 'Unable to answer.';
		chatLoading = false;
	}

	function fmt(n: number | undefined): string {
		if (!n) return '0';
		return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toLocaleString();
	}
	function fmtCurrency(n: number | undefined): string {
		return formatMoney(majorToKobo(n ?? 0, 'NGN'), 'NGN');
	}
	function fmtPercent(n: number | undefined): string {
		return (n || 0).toFixed(1) + '%';
	}
</script>

<div class="max-w-6xl space-y-6">
	<!-- Premium Header & Segmented Switcher -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<span class="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#513BE2] uppercase ring-1 ring-black/6 backdrop-blur-md">
				<Icon icon="solar:chart-square-bold-duotone" class="h-3.5 w-3.5" />
				Exhibitor Telemetry
			</span>
			<h1 class="mt-2 text-2xl font-bold tracking-tight text-[#17161E] sm:text-3xl">Exhibitor Insights</h1>
			<p class="mt-1 text-sm text-[#5F5C6D]">Track your event participation, booth performance, leads, and ROI.</p>
		</div>

		<div class="flex w-fit rounded-full bg-white/75 p-1 ring-1 ring-black/8 backdrop-blur-md">
			{#each ['analytics', 'ai'] as tab}
				<button
					type="button"
					on:click={() => {
						activeTab = tab;
						persistTab(tab);
					}}
					class="rounded-full px-4 py-1.5 text-xs font-semibold transition-all {activeTab === tab
						? 'bg-[#17161E] text-white shadow-xs'
						: 'text-[#5F5C6D] hover:text-[#17161E]'}"
				>
					{tab === 'analytics' ? 'Analytics' : 'AI Insights'}
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<InsightsSkeleton variant="exhibitor" />
	{:else if !analytics}
		<div class="flex h-64 flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/75 p-8 text-center shadow-xs backdrop-blur-md">
			<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE8FC] text-[#513BE2]">
				<Icon icon="solar:buildings-2-bold-duotone" class="h-7 w-7" />
			</div>
			<p class="mt-3 text-base font-bold text-[#17161E]">No analytics data yet</p>
			<p class="mt-1 max-w-sm text-xs text-[#6B6878]">
				Analytics will appear once you showcase booths and capture leads at events.
			</p>
		</div>
	{:else if activeTab === 'analytics'}
		<!-- Bento KPI Cards -->
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<div class="rounded-2xl border border-white/85 bg-white/85 p-5 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md">
				<p class="text-[11px] font-semibold tracking-wider text-[#6B6878] uppercase">Events Invited</p>
				<p class="mt-1.5 text-2xl font-bold text-[#17161E]">{fmt(analytics.participation?.totalEventsInvited)}</p>
				<p class="mt-1 text-xs text-[#878495]">Acceptance: {fmtPercent(analytics.participation?.acceptanceRate)}</p>
			</div>
			<div class="rounded-2xl border border-white/85 bg-white/85 p-5 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md">
				<p class="text-[11px] font-semibold tracking-wider text-[#6B6878] uppercase">Events Accepted</p>
				<p class="mt-1.5 text-2xl font-bold text-emerald-600">{fmt(analytics.participation?.totalEventsAccepted)}</p>
				<p class="mt-1 text-xs text-[#878495]">Upcoming: {fmt(analytics.participation?.upcomingEvents)}</p>
			</div>
			<div class="rounded-2xl border border-white/85 bg-white/85 p-5 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md">
				<p class="text-[11px] font-semibold tracking-wider text-[#6B6878] uppercase">Total Leads</p>
				<p class="mt-1.5 text-2xl font-bold text-[#146AEB]">{fmt(analytics.leads?.totalLeads)}</p>
				<p class="mt-1 text-xs text-[#878495]">Qualified: {fmt(analytics.leads?.qualifiedLeads)}</p>
			</div>
			<div class="rounded-2xl border border-white/85 bg-white/85 p-5 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md">
				<p class="text-[11px] font-semibold tracking-wider text-[#6B6878] uppercase">ROI</p>
				<p class="mt-1.5 text-2xl font-bold text-amber-600">{fmtPercent(analytics.financials?.roi)}</p>
				<p class="mt-1 text-xs text-[#878495]">Investment: {fmtCurrency(analytics.financials?.totalInvestment)}</p>
			</div>
		</div>

		<!-- Charts + Breakdown Container -->
		<div class="overflow-hidden rounded-[24px] border border-white/85 bg-white/88 shadow-[0_12px_32px_-8px_rgba(18,16,36,0.06)] backdrop-blur-md">
			<div class="flex w-full flex-col gap-10 p-5 lg:flex-row">
				<div class="w-full">
					{#if eventChart.length > 0}
						<StackedAreaChart data={eventChart} options={areaOptions} />
					{:else}
						<div class="flex h-80 items-center justify-center text-sm text-[#878495]">No trend data yet</div>
					{/if}
				</div>
				<div class="flex w-full max-w-100 items-center justify-center">
					<DonutChart data={participationDonut} options={donutOptions} />
				</div>
			</div>

			<div class="flex w-full flex-col items-start gap-6 border-t border-black/6 bg-[#FAF9FC]/80 p-5 lg:flex-row">
				<div class="w-full space-y-4 text-sm">
					<h3 class="font-bold text-[#17161E]">Booth Performance</h3>
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div><div class="text-xs text-[#878495]">Total Booths</div><div class="text-xl font-bold">{fmt(analytics.booth?.totalBooths)}</div></div>
						<div><div class="text-xs text-[#878495]">Published</div><div class="text-xl font-bold text-emerald-600">{fmt(analytics.booth?.publishedBooths)}</div></div>
						<div><div class="text-xs text-[#878495]">Draft</div><div class="text-xl font-bold">{fmt(analytics.booth?.draftBooths)}</div></div>
						<div><div class="text-xs text-[#878495]">Views</div><div class="text-xl font-bold">{fmt(analytics.booth?.boothViews)}</div></div>
					</div>

					<h3 class="mt-4 font-bold text-[#17161E]">Lead Generation</h3>
					<div class="grid grid-cols-3 gap-3">
						<div><div class="text-xs text-[#878495]">Total Leads</div><div class="text-xl font-bold">{fmt(analytics.leads?.totalLeads)}</div></div>
						<div><div class="text-xs text-[#878495]">Qualified</div><div class="text-xl font-bold text-emerald-600">{fmt(analytics.leads?.qualifiedLeads)}</div></div>
						<div><div class="text-xs text-[#878495]">Conversion</div><div class="text-xl font-bold">{fmtPercent(analytics.leads?.leadConversionRate)}</div></div>
					</div>

					<h3 class="mt-4 font-bold text-[#17161E]">Visibility</h3>
					<div class="grid grid-cols-3 gap-3">
						<div><div class="text-xs text-[#878495]">Profile Views</div><div class="text-xl font-bold">{fmt(analytics.visibility?.profileViews)}</div></div>
						<div><div class="text-xs text-[#878495]">Impressions</div><div class="text-xl font-bold">{fmt(analytics.visibility?.boothImpressions)}</div></div>
						<div><div class="text-xs text-[#878495]">Contact Req.</div><div class="text-xl font-bold">{fmt(analytics.visibility?.contactRequests)}</div></div>
					</div>
				</div>

				<div class="w-full space-y-3 border-t border-black/6 pt-4 text-sm lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
					<h3 class="font-bold text-[#17161E]">Financial Summary</h3>
					<div class="flex justify-between"><span class="text-[#6B6878]">Total Sponsorship</span><span class="font-semibold">{fmtCurrency(analytics.financials?.totalSponsorship)}</span></div>
					<div class="flex justify-between"><span class="text-[#6B6878]">Total Investment</span><span class="font-semibold">{fmtCurrency(analytics.financials?.totalInvestment)}</span></div>
					<div class="flex justify-between"><span class="text-[#6B6878]">ROI</span><span class="font-semibold text-amber-600">{fmtPercent(analytics.financials?.roi)}</span></div>

					<h3 class="mt-4 font-bold text-[#17161E]">Collaborations</h3>
					<div class="flex justify-between"><span class="text-[#6B6878]">Total</span><span class="font-semibold">{fmt(analytics.collaborations?.totalCollaborations)}</span></div>
					<div class="flex justify-between"><span class="text-[#6B6878]">Active</span><span class="font-semibold text-emerald-600">{fmt(analytics.collaborations?.activeCollaborations)}</span></div>
					<div class="flex justify-between"><span class="text-[#6B6878]">Completed</span><span class="font-semibold">{fmt(analytics.collaborations?.completedCollaborations)}</span></div>

					{#if analytics.predictions?.confidence > 0}
						<h3 class="mt-4 font-bold text-[#17161E]">Predictions</h3>
						<div class="space-y-1.5 rounded-2xl border border-black/6 bg-white p-3.5">
							<div class="flex justify-between"><span class="text-[#6B6878]">Est. Leads Next Quarter</span><span class="font-semibold">{analytics.predictions.estimatedLeadsNextQuarter}</span></div>
							<div class="flex justify-between"><span class="text-[#6B6878]">Est. Events</span><span class="font-semibold">{analytics.predictions.estimatedEventsNextQuarter}</span></div>
							<div class="flex justify-between"><span class="text-[#6B6878]">Growth Trend</span>
								<span class="font-semibold capitalize {analytics.predictions.growthTrend === 'growing' ? 'text-emerald-600' : analytics.predictions.growthTrend === 'declining' ? 'text-rose-500' : ''}">{analytics.predictions.growthTrend}</span>
							</div>
						</div>
					{/if}

					{#if analytics.leads?.leadsByEvent?.length > 0}
						<h3 class="mt-4 font-bold text-[#17161E]">Leads by Event</h3>
						{#each analytics.leads.leadsByEvent.slice(0, 5) as le}
							<div class="flex justify-between"><span class="text-[#6B6878]">{le.eventTitle}</span><span class="font-semibold">{le.leads} leads</span></div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{:else if activeTab === 'ai'}
		<div class="space-y-5">
			<div class="rounded-3xl border border-white/85 bg-white/88 p-6 shadow-xs backdrop-blur-md">
				<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h3 class="text-base font-bold text-[#17161E]">AI-Generated Summary</h3>
					<button
						type="button"
						on:click={loadAISummary}
						disabled={aiLoading}
						class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#DB3E6C] to-[#513BE2] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-95 disabled:opacity-50"
					>
						{#if aiLoading}
							<div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div> Generating...
						{:else}
							<Icon icon="solar:magic-stick-3-bold" class="h-4 w-4" /> Generate Summary
						{/if}
					</button>
				</div>
				{#if aiSummary}
					<div class="prose prose-sm max-w-none rounded-2xl bg-[#FAF9FC] p-4">{@html renderMarkdown(aiSummary)}</div>
				{:else}
					<p class="text-xs text-[#878495]">Click "Generate Summary" for an AI analysis of your exhibitor performance.</p>
				{/if}
			</div>

			<div class="rounded-3xl border border-white/85 bg-white/88 p-6 shadow-xs backdrop-blur-md">
				<h3 class="mb-4 text-base font-bold text-[#17161E]">Chat with Your Data</h3>
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={chatQuestion}
						placeholder="Ask about your exhibitor analytics..."
						class="flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm focus:border-[#513BE2] focus:outline-none"
						on:keydown={(e) => e.key === 'Enter' && askQuestion()}
					/>
					<button
						type="button"
						on:click={askQuestion}
						disabled={chatLoading || !chatQuestion.trim()}
						class="rounded-full bg-[#17161E] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2C2C34] disabled:opacity-50"
					>
						{chatLoading ? '...' : 'Ask'}
					</button>
				</div>
				{#if chatAnswer}
					<div class="prose prose-sm mt-4 max-w-none rounded-2xl bg-[#FAF9FC] p-4">{@html renderMarkdown(chatAnswer)}</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
