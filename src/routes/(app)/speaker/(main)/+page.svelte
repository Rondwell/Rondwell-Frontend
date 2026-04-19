<script lang="ts">
	import DashboardSkeleton from '$lib/components/DashboardSkeleton.svelte';
	import { getActiveProfile, type UserProfileData } from '$lib/services/profile.services';
	import { getSpeakerCollaborations, getSpeakerCollaborationStats } from '$lib/services/speaker.services';
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
	let recentTransactions: any[] = [];

	// ─── Helpers ──────────────────────────────────────────────────────────────
	const formatCurrency = (amount: number, currency = 'NGN') => {
		const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
		return `${symbol}${amount.toLocaleString()}`;
	};

	const timeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins} Minutes Ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} Ago`;
		const days = Math.floor(hrs / 24);
		return `${days} day${days > 1 ? 's' : ''} Ago`;
	};

	// ─── Data Fetching ────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			const profile = await getActiveProfile();
			profileData = profile;
			const sd = (profile as any)?.speakerDetails;
			speakerName = sd?.fullName || profile?.name || 'Speaker';
			photoUrl = sd?.profilePhotoUrl || profile?.profilePictureUrl || '';

			// Fetch collaboration stats
			try {
				const stats = await getSpeakerCollaborationStats();
				pendingInvitations = stats?.pending || 0;
				activeEngagements = stats?.activeEngagements || 0;
			} catch {}

			// Fetch recent collaborations for the list
			try {
				const collabResult = await getSpeakerCollaborations({ limit: 3, sortBy: 'createdAt', sortOrder: 'desc' });
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

	// ─── Stat card configs ────────────────────────────────────────────────────
	$: topStats = [
		{
			title: 'Active Engagements',
			count: String(activeEngagements),
			icon: '/brand3.svg',
			bg: 'bg-green-50',
			btn: 'View All Engagements',
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
			title: 'Portfolio Views',
			count: String(portfolioViews),
			icon: '/brand2.svg',
			bg: 'bg-blue-50',
			btn: 'View Profile',
			href: '/speaker/settings'
		}
	];

	$: bottomStats = [
		{
			title: 'Total Earnings',
			value: '₦0.00',
			icon: '/brand5.svg',
			bg: 'bg-pink-50',
			type: 'revenue',
			btn: 'View Financials',
			href: '/speaker/collab'
		},
		{
			title: 'Profile Views',
			value: '0',
			icon: '/brand6.svg',
			bg: 'bg-yellow-50',
			type: 'chart',
			barColor: 'bg-yellow-400',
			fillAmount: 0
		},
		{
			title: 'Booking Conversion Rate',
			value: '0%',
			icon: 'brand.svg',
			bg: 'bg-teal-50',
			type: 'chart',
			barColor: 'bg-teal-600',
			fillAmount: 0
		}
	];
</script>

{#if loading}
	<DashboardSkeleton variant="speaker" />
{:else}
<div class="min-h-screen w-full text-[#101828]">
	<!-- Header -->
	<div class="mb-8 flex items-center gap-3">
		{#if photoUrl}
			<img src={photoUrl} alt={speakerName} class="h-8 w-8 rounded-lg object-cover" />
		{:else}
			<img src="/loader.svg" alt="avatar" class="h-8 w-8 rounded-lg object-cover" />
		{/if}
		<h1 class="text-2xl font-bold">{speakerName}</h1>
	</div>

	<div class="flex w-full flex-col gap-8">
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each topStats as stat}
				<div class="flex h-[180px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
					<div class="mb-1">
						<div class={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${stat.bg}`}>
							<img src={stat.icon} class="h-10 w-10" alt={stat.title} />
						</div>
						<div class="mb-1 text-2xl font-bold">{stat.count}</div>
						<div class="text-xs text-gray-500">{stat.title}</div>
					</div>
					<a
						href={stat.href}
						class="flex w-full items-center justify-center gap-1 rounded-xl bg-black py-3 text-xs font-bold text-white transition hover:bg-gray-800"
					>
						{stat.btn}
						<Icon icon="heroicons:paper-airplane" class="h-3 w-3 -rotate-45" />
					</a>
				</div>
			{/each}

			{#each bottomStats as stat}
				<div class="flex h-[180px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
					<div class="mb-1 w-full">
						<div class="mb-3 flex items-start justify-between">
							<div class={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bg}`}>
								<img src={stat.icon} class="h-10 w-10" alt={stat.title} />
							</div>
							{#if stat.type === 'revenue'}
								<span class="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-500">
									<Icon icon="heroicons:bars-3-bottom-left" /> Last 30 Days
								</span>
							{/if}
						</div>
						<div class="mb-1 text-2xl font-bold">{stat.value}</div>
						<div class="text-xs text-gray-500">{stat.title}</div>
					</div>

					{#if stat.type === 'revenue'}
						<a
							href={stat.href}
							class="flex w-full items-center justify-center gap-1 rounded-xl bg-black py-3 text-xs font-bold text-white transition hover:bg-gray-800"
						>
							{stat.btn}
							<Icon icon="heroicons:paper-airplane" class="h-3 w-3 -rotate-45" />
						</a>
					{:else}
						<div class="mt-auto flex h-8 w-full items-end gap-1">
							{#each Array(20) as _, i}
								<div
									class={`h-full flex-1 rounded-sm ${i < (stat.fillAmount || 0) ? stat.barColor : 'bg-gray-100'}`}
								></div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Collaboration Requests -->
		<div class="flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-gray-100">
			<div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-4 sm:p-5">
				<h2 class="text-sm font-bold text-gray-900 sm:text-base">Collaboration Requests</h2>
				{#if collaborationRequests.length > 0}
					<a
						href="/speaker/collab"
						class="flex items-center gap-1.5 rounded-lg bg-gray-200 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-900 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
					>
						<span class="hidden sm:inline">View All Collaboration Requests</span>
						<span class="sm:hidden">View All</span>
						<img src="/arrow-left.svg" alt="arrow" class="h-3 w-3" />
					</a>
				{/if}
			</div>

			<div class="flex flex-1 flex-col justify-center p-5">
				{#if collaborationRequests.length > 0}
					<div class="space-y-4">
						{#each collaborationRequests as req}
							<div class="grid grid-cols-12 items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
								<div class="col-span-12 flex items-center gap-3 sm:col-span-5">
									<img
										src="/rondwell-attendee.png"
										alt="avatar"
										class="h-10 w-10 shrink-0 rounded-full bg-gray-200"
									/>
									<div class="flex flex-col">
										<div class="flex items-center gap-1">
											<span class="text-sm font-bold text-gray-900">{req.creatorId?.username || req.organizerName || 'Organizer'}</span>
											<span class="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
										</div>
										<span class="text-xs text-gray-400">{req.creatorId?.email || ''}</span>
									</div>
								</div>
								<div class="col-span-12 text-sm font-bold text-gray-900 sm:col-span-3">
									{req.title || req.eventName || 'Collaboration'}
								</div>
								<div class="col-span-6 text-xs text-gray-400 sm:col-span-2">
									{req.createdAt ? timeAgo(req.createdAt) : ''}
								</div>
								<div class="col-span-6 text-right sm:col-span-2">
									<a
										href="/speaker/collab"
										class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
									>View Details</a>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<img src="/empty-state.svg" alt="No data" class="mx-auto mb-4 h-auto w-32" />
						<h3 class="text-sm font-bold text-gray-900">No Collaboration Requests, yet</h3>
						<p class="mt-1 max-w-[250px] text-xs text-gray-400">
							Collaboration requests will appear here once organizers reach out.
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Portfolio Entries -->
		<div class="relative min-h-[200px]">
			<div class="mb-4 flex items-center justify-between sm:mb-6">
				<h2 class="text-sm font-bold text-gray-900 sm:text-lg">My Portfolio Entries</h2>
				<a
					href="/speaker/settings"
					class="flex items-center gap-1.5 rounded-lg bg-gray-200 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-300 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
				>
					View Portfolio
					<img src="/arrow-left.svg" alt="arrow" class="h-3 w-3" />
				</a>
			</div>

			<div class="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
				<img src="/empty-state.svg" alt="No portfolio" class="mx-auto mb-4 h-auto w-32" />
				<h3 class="text-sm font-bold text-gray-900">No Portfolio Entries, yet</h3>
				<p class="mt-1 mb-6 max-w-[200px] text-xs text-gray-400">
					Your talks and presentations will appear here once added.
				</p>
				<a
					href="/speaker/settings"
					class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
				>
					+ Add Portfolio Entry
				</a>
			</div>
		</div>

		<!-- Recent Transactions -->
		<div class="mt-4 flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
			<div class="border-b border-gray-100 px-4 py-4 sm:p-5">
				<div class="flex items-center gap-2">
					<h2 class="text-sm font-bold text-gray-900 sm:text-lg">Recent Transactions</h2>
					<span class="ml-auto flex h-[22px] min-w-[22px] items-center justify-center rounded-full border border-black text-xs font-medium sm:h-[25.5px] sm:min-w-[25.5px] sm:text-[17.2px] xl:ml-0">
						{recentTransactions.length}
					</span>
				</div>
				<p class="mt-1 text-xs text-gray-500">Latest payments for speaking engagements</p>
			</div>

			<div class="flex flex-1 flex-col justify-center p-5">
				{#if recentTransactions.length > 0}
					<div class="space-y-4">
						{#each recentTransactions as tx}
							<div class="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
								<div class="flex items-center gap-4">
									<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#E2E8FC]">
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M5.83333 1.66666H14.1667C14.6268 1.66666 15 2.03986 15 2.5V17.5L12.5 15.8333L10 17.5L7.5 15.8333L5 17.5V2.5C5 2.03986 5.37319 1.66666 5.83333 1.66666Z" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M8.33334 5.83334H11.6667" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M8.33334 9.16666H11.6667" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M8.33334 12.5H10" stroke="#146AEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</div>
									<div class="flex flex-col">
										<span class="text-sm font-bold text-gray-900">{tx.description || tx.type || 'Transaction'}</span>
										<span class="mt-1 text-xs text-gray-400">{tx.id || tx._id || ''}</span>
									</div>
								</div>
								<div class="ml-auto flex items-center gap-6 sm:ml-0 sm:gap-12">
									<span class="text-sm font-bold text-gray-900">{formatCurrency(tx.amount || 0)}</span>
									<span class="text-xs whitespace-nowrap text-gray-400">{tx.createdAt ? timeAgo(tx.createdAt) : ''}</span>
									<span class="flex items-center gap-1 rounded-md bg-[#E3F4E1] px-2 py-1 text-[10px] font-bold text-[#3CBD2C]">
										<Icon icon="heroicons:check-circle" class="h-3 w-3" />
										{tx.status || 'Success'}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<img src="/empty-state.svg" alt="No transactions" class="mx-auto mb-4 h-auto w-32" />
						<h3 class="text-sm font-bold text-gray-900">No Transaction history, yet</h3>
						<p class="mt-1 text-xs text-gray-400">No recent transactions.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
{/if}
