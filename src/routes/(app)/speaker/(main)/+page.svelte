<script lang="ts">
	import DashboardSkeleton from '$lib/components/DashboardSkeleton.svelte';
	import { getActiveProfile, type UserProfileData } from '$lib/services/profile.services';
	import {
		getSpeakerCollaborations,
		getSpeakerCollaborationStats,
		getSpeakerPortfolios
	} from '$lib/services/speaker.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// ─── State ────────────────────────────────────────────────────────────────
	let loading = true;
	let speakerName = '';
	let photoUrl = '';
	let profileData: UserProfileData | null = null;

	// Stats
	let activeEngagements = 0;
	let pendingInvitations = 0;
	let portfolioViews = 0;

	// Lists
	let collaborationRequests: any[] = [];
	let latestPortfolios: any[] = [];
	let recentTransactions: any[] = [];

	const formatCurrency = (amount: number, currency = 'NGN') => {
		const ccy = currency || 'NGN';
		return formatMoney(majorToKobo(amount ?? 0, ccy), ccy);
	};

	const timeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		return `${days}d ago`;
	};

	onMount(async () => {
		try {
			const profile = await getActiveProfile();
			profileData = profile;
			const sd = (profile as any)?.speakerDetails;
			speakerName = sd?.fullName || profile?.name || 'Speaker';
			photoUrl = sd?.profilePhotoUrl || profile?.profilePictureUrl || '';

			try {
				const stats = await getSpeakerCollaborationStats();
				pendingInvitations = stats?.pending || 0;
				activeEngagements = stats?.activeEngagements || 0;
			} catch {}

			try {
				const portfolioRes = await getSpeakerPortfolios({ limit: 3 });
				const list = Array.isArray(portfolioRes) ? portfolioRes : portfolioRes?.data || [];
				latestPortfolios = list.slice(0, 3);
				portfolioViews = list.reduce((sum: number, p: any) => sum + (Number(p.views) || 0), 0);
			} catch {
				latestPortfolios = [];
			}

			try {
				const collabResult = await getSpeakerCollaborations({
					limit: 3,
					sortBy: 'createdAt',
					sortOrder: 'desc'
				});
				collaborationRequests = collabResult?.collaborations || [];
			} catch {
				collaborationRequests = [];
			}
		} catch (err) {
			console.error('Failed to load speaker dashboard:', err);
		} finally {
			loading = false;
		}
	});

	$: topStats = [
		{
			title: 'Active Engagements',
			count: String(activeEngagements),
			icon: '/brand3.svg',
			bg: 'bg-emerald-50',
			btn: 'View Engagements',
			href: '/speaker/collab'
		},
		{
			title: 'Pending Invitations',
			count: String(pendingInvitations),
			icon: '/brand4.svg',
			bg: 'bg-purple-50',
			btn: 'Review Invitations',
			href: '/speaker/collab'
		},
		{
			title: 'Portfolio Entries',
			count: String(latestPortfolios.length),
			icon: '/brand2.svg',
			bg: 'bg-blue-50',
			btn: 'Open Portfolio',
			href: '/speaker/portfolio'
		}
	];

	$: bottomStats = [
		{
			title: 'Total Earnings',
			value: formatCurrency(0, 'NGN'),
			icon: '/brand5.svg',
			bg: 'bg-pink-50',
			type: 'revenue',
			btn: 'View Insights',
			href: '/speaker/insights'
		},
		{
			title: 'Portfolio Views',
			value: String(portfolioViews),
			icon: '/brand6.svg',
			bg: 'bg-amber-50',
			type: 'chart',
			barColor: 'bg-amber-400',
			fillAmount: portfolioViews > 0 ? 11 : 0
		},
		{
			title: 'Booking Rate',
			value: activeEngagements > 0 ? 'Active' : '0%',
			icon: '/brand.svg',
			bg: 'bg-teal-50',
			type: 'chart',
			barColor: 'bg-teal-500',
			fillAmount: activeEngagements > 0 ? 10 : 0
		}
	];
</script>

{#if loading}
	<DashboardSkeleton variant="speaker" />
{:else}
	<div class="min-h-screen w-full space-y-8 text-[#101828]">
		<!-- Frosted Identity Header Bar -->
		<div class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/85 bg-white/75 p-4 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md sm:px-6 sm:py-5">
			<div class="flex items-center gap-3.5">
				{#if photoUrl}
					<img src={photoUrl} alt={speakerName} class="h-11 w-11 rounded-2xl border border-black/8 object-cover shadow-xs" />
				{:else}
					<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#AB46DD]/15 to-[#513BE2]/20 text-[#AB46DD] ring-1 ring-[#AB46DD]/15">
						<Icon icon="solar:microphone-3-bold-duotone" class="h-6 w-6" />
					</div>
				{/if}
				<div>
					<span class="rounded-full bg-[#F3E8FF] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#7C3AED] uppercase">
						Speaker Workspace
					</span>
					<h1 class="mt-0.5 text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">{speakerName}</h1>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#if profileData?.publicProfileSlug}
					<a
						class="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-4 text-xs font-semibold text-[#32303B] no-underline shadow-xs transition hover:bg-white"
						href="/s/{profileData.publicProfileSlug}"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span>Speaker Page</span>
						<Icon icon="solar:square-top-down-linear" class="h-3.5 w-3.5 text-[#7A7787]" />
					</a>
				{/if}
				<a
					href="/speaker/portfolio"
					class="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#17161E] px-4 text-xs font-semibold text-white no-underline shadow-xs transition hover:bg-[#2C2C34]"
				>
					<Icon icon="solar:add-circle-bold" class="h-4 w-4" />
					<span>Manage Portfolio</span>
				</a>
			</div>
		</div>

		<!-- Bento KPI Grid -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each topStats as stat}
				<div class="flex h-[184px] flex-col justify-between rounded-2xl border border-white/85 bg-white/88 p-5 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
					<div>
						<div class="mb-3 flex items-center justify-between">
							<div class={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
								<img src={stat.icon} class="h-6 w-6 object-contain" alt={stat.title} />
							</div>
							<span class="text-[11px] font-semibold text-[#878495]">{stat.title}</span>
						</div>
						<div class="text-3xl font-bold tracking-tight text-[#17161E]">{stat.count}</div>
					</div>
					<a
						href={stat.href}
						class="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#17161E] py-2.5 text-xs font-semibold text-white no-underline transition hover:bg-[#2C2C34]"
					>
						<span>{stat.btn}</span>
						<Icon icon="solar:arrow-right-linear" class="h-3.5 w-3.5" />
					</a>
				</div>
			{/each}

			{#each bottomStats as stat}
				<div class="flex h-[184px] flex-col justify-between rounded-2xl border border-white/85 bg-white/88 p-5 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
					<div>
						<div class="mb-3 flex items-center justify-between">
							<div class={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
								<img src={stat.icon} class="h-6 w-6 object-contain" alt={stat.title} />
							</div>
							{#if stat.type === 'revenue'}
								<span class="rounded-full border border-black/8 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#6B6878]">
									Last 30 Days
								</span>
							{:else}
								<span class="text-[11px] font-semibold text-[#878495]">{stat.title}</span>
							{/if}
						</div>
						<div class="text-2xl font-bold tracking-tight text-[#17161E] sm:text-3xl">{stat.value}</div>
						{#if stat.type === 'revenue'}
							<p class="mt-0.5 text-xs text-[#6B6878]">{stat.title}</p>
						{/if}
					</div>

					{#if stat.type === 'revenue'}
						<a
							href={stat.href}
							class="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#17161E] py-2.5 text-xs font-semibold text-white no-underline transition hover:bg-[#2C2C34]"
						>
							<span>{stat.btn}</span>
							<Icon icon="solar:arrow-right-linear" class="h-3.5 w-3.5" />
						</a>
					{:else}
						<div class="mt-auto flex h-7 w-full items-end gap-1">
							{#each Array(20) as _, i}
								<div
									class={`h-full flex-1 rounded-sm ${i < (stat.fillAmount || 0) ? stat.barColor : 'bg-black/6'}`}
								></div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Collaboration Requests -->
		<div class="flex flex-col overflow-hidden rounded-[24px] border border-white/85 bg-white/85 shadow-[0_10px_28px_-8px_rgba(18,16,36,0.05)] backdrop-blur-md">
			<div class="flex items-center justify-between border-b border-black/6 px-5 py-4">
				<h2 class="text-sm font-bold text-[#17161E] sm:text-base">Collaboration Requests</h2>
				{#if collaborationRequests.length > 0}
					<a
						href="/speaker/collab"
						class="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-[#32303B] no-underline transition hover:bg-black/10"
					>
						<span class="hidden sm:inline">View All Requests</span>
						<span class="sm:hidden">View All</span>
						<Icon icon="solar:arrow-right-linear" class="h-3.5 w-3.5" />
					</a>
				{/if}
			</div>

			<div class="p-5">
				{#if collaborationRequests.length > 0}
					<div class="space-y-3">
						{#each collaborationRequests as req}
							<div class="grid grid-cols-12 items-center gap-4 rounded-2xl border border-black/6 bg-white p-3.5 shadow-2xs transition hover:shadow-xs">
								<div class="col-span-12 flex items-center gap-3 sm:col-span-5">
									<img
										src="/rondwell-attendee.png"
										alt="avatar"
										class="h-10 w-10 shrink-0 rounded-full bg-gray-100 object-cover"
									/>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-1.5">
											<span class="truncate text-sm font-bold text-[#17161E]">{req.creatorId?.username || req.organizerName || 'Organizer'}</span>
											<span class="h-2 w-2 shrink-0 rounded-full bg-amber-400"></span>
										</div>
										<p class="truncate text-xs text-[#878495]">{req.creatorId?.email || ''}</p>
									</div>
								</div>
								<div class="col-span-12 text-sm font-semibold text-[#17161E] sm:col-span-3">
									{req.title || req.eventName || 'Collaboration'}
								</div>
								<div class="col-span-6 text-xs text-[#878495] sm:col-span-2">
									{req.createdAt ? timeAgo(req.createdAt) : ''}
								</div>
								<div class="col-span-6 text-right sm:col-span-2">
									<a
										href="/speaker/collab"
										class="inline-flex rounded-full border border-black/10 bg-[#FAF9FC] px-4 py-1.5 text-xs font-semibold text-[#17161E] no-underline transition hover:bg-black/5"
									>
										Details
									</a>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<img src="/empty-state.svg" alt="No data" class="mx-auto mb-3 h-auto w-28" />
						<h3 class="text-sm font-bold text-[#17161E]">No Collaboration Requests yet</h3>
						<p class="mt-1 max-w-[260px] text-xs text-[#878495]">
							Collaboration requests will appear here once organizers reach out.
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- My Portfolio Entries (Live Data Preview) -->
		<div class="relative">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-bold text-[#17161E] sm:text-lg">My Portfolio Entries</h2>
				<a
					href="/speaker/portfolio"
					class="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#32303B] no-underline transition hover:bg-white"
				>
					<span>View Portfolio</span>
					<Icon icon="solar:arrow-right-linear" class="h-3.5 w-3.5" />
				</a>
			</div>

			{#if latestPortfolios.length > 0}
				<div class="grid gap-4 md:grid-cols-3">
					{#each latestPortfolios as entry (entry._id)}
						<a
							href="/speaker/portfolio"
							class="group flex flex-col justify-between overflow-hidden rounded-[22px] border border-white/85 bg-white/90 p-4 no-underline shadow-xs backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md"
						>
							<div>
								<div class="relative mb-3 h-36 w-full overflow-hidden rounded-2xl bg-[#F4F5F8]">
									{#if entry.media?.[0]?.url}
										<img src={entry.media[0].url} alt={entry.title} class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
									{:else}
										<div class="flex h-full w-full items-center justify-center text-[#7C3AED]/40">
											<Icon icon="solar:microphone-3-bold-duotone" class="h-10 w-10" />
										</div>
									{/if}
									<span class="absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold {entry.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-white/90 text-[#5F5C6D]'}">
										{entry.status || 'ACTIVE'}
									</span>
								</div>
								<h3 class="line-clamp-1 text-sm font-bold text-[#17161E]">{entry.title}</h3>
								<p class="mt-0.5 line-clamp-1 text-xs text-[#6B6878]">{entry.description || ''}</p>
							</div>
							<div class="mt-3 flex items-center justify-between border-t border-black/6 pt-3 text-[11px] font-medium text-[#878495]">
								<span>{entry.category || 'Speaking'}</span>
								<span>{entry.createdAt ? timeAgo(entry.createdAt) : ''}</span>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center rounded-3xl border border-white/85 bg-white/85 py-12 text-center shadow-xs backdrop-blur-md">
					<img src="/empty-state.svg" alt="No portfolio" class="mx-auto mb-4 h-auto w-28" />
					<h3 class="text-sm font-bold text-[#17161E]">No Portfolio Entries yet</h3>
					<p class="mt-1 mb-5 max-w-[240px] text-xs text-[#878495]">
						Highlight your keynotes, panels, and talks so organizers can invite you.
					</p>
					<a
						href="/speaker/portfolio"
						class="inline-flex items-center gap-1.5 rounded-full bg-[#17161E] px-5 py-2 text-xs font-semibold text-white no-underline transition hover:bg-[#2C2C34]"
					>
						<Icon icon="solar:add-circle-bold" class="h-4 w-4" />
						<span>Add First Engagement</span>
					</a>
				</div>
			{/if}
		</div>

		<!-- Recent Transactions -->
		<div class="flex flex-col overflow-hidden rounded-[24px] border border-white/85 bg-white/85 shadow-xs backdrop-blur-md">
			<div class="flex items-center justify-between border-b border-black/6 px-5 py-4">
				<div>
					<h2 class="text-sm font-bold text-[#17161E] sm:text-base">Recent Transactions</h2>
					<p class="text-xs text-[#878495]">Latest payments for speaking engagements</p>
				</div>
				<span class="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-bold text-[#17161E]">
					{recentTransactions.length}
				</span>
			</div>

			<div class="p-5">
				{#if recentTransactions.length > 0}
					<div class="space-y-3">
						{#each recentTransactions as tx}
							<div class="flex flex-col justify-between gap-4 rounded-2xl border border-black/6 bg-white p-4 sm:flex-row sm:items-center">
								<div class="flex items-center gap-3.5">
									<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E2E8FC] text-[#146AEB]">
										<Icon icon="solar:bill-list-bold-duotone" class="h-5 w-5" />
									</div>
									<div>
										<span class="text-sm font-bold text-[#17161E]">{tx.description || tx.type || 'Transaction'}</span>
										<p class="text-xs text-[#878495]">{tx.id || tx._id || ''}</p>
									</div>
								</div>
								<div class="flex items-center gap-6">
									<span class="text-sm font-bold text-[#17161E]">{formatCurrency(tx.amount || 0)}</span>
									<span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
										{tx.status || 'Success'}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<img src="/empty-state.svg" alt="No transactions" class="mx-auto mb-3 h-auto w-28" />
						<h3 class="text-sm font-bold text-[#17161E]">No Transaction History yet</h3>
						<p class="mt-1 text-xs text-[#878495]">Speaking fee settlements will appear here.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
