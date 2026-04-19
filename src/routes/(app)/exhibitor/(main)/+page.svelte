<script lang="ts">
	import DashboardSkeleton from '$lib/components/DashboardSkeleton.svelte';
	import { getExhibitorCollaborations, getExhibitorCollaborationStats, getMyBooths } from '$lib/services/exhibitor.services';
	import { getActiveProfile, type UserProfileData } from '$lib/services/profile.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// ─── State ────────────────────────────────────────────────────────────────
	let loading = true;
	let exhibitorName = '';
	let logoUrl = '';
	let profileData: UserProfileData | null = null;

	// Stats
	let boothCount = 0;
	let pendingApplications = 0;
	let totalBoothViews = 0;
	let leadsCaptured = 0;

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
			const ed = (profile as any)?.exhibitorDetails;
			exhibitorName = ed?.companyName || profile?.name || 'Exhibitor';
			logoUrl = ed?.logoUrl || profile?.profilePictureUrl || '';

			// Fetch collaboration stats
			try {
				const stats = await getExhibitorCollaborationStats();
				pendingApplications = stats?.pending || 0;
			} catch {}

			// Fetch actual booth count
			try {
				const boothResult = await getMyBooths({ limit: 1 });
				boothCount = boothResult?.pagination?.totalItems || boothResult?.data?.length || 0;
			} catch {}

			// Fetch recent collaborations for the list
			try {
				const collabResult = await getExhibitorCollaborations({ limit: 3, sortBy: 'createdAt', sortOrder: 'desc' });
				collaborationRequests = collabResult?.collaborations || [];
			} catch {
				collaborationRequests = [];
			}
		} catch (err) {
			console.error('Failed to load exhibitor dashboard:', err);
		} finally {
			loading = false;
		}
	});

	// ─── Stat card configs ────────────────────────────────────────────────────
	$: topStats = [
		{
			title: 'Booths / Stands',
			count: String(boothCount),
			icon: '/brand2.svg',
			bg: 'bg-blue-50',
			btn: 'View Booths',
			href: '/exhibitor/booths'
		},
		{
			title: 'Pending Applications',
			count: String(pendingApplications),
			icon: '/brand4.svg',
			bg: 'bg-purple-50',
			btn: 'Review Applications',
			href: '/exhibitor/collab'
		},
		{
			title: 'Total Booth Views',
			count: String(totalBoothViews),
			icon: '/brand3.svg',
			bg: 'bg-green-50',
			btn: 'View Booths',
			href: '/exhibitor/booths'
		}
	];

	$: bottomStats = [
		{
			title: 'Leads Captured',
			value: String(leadsCaptured),
			icon: '/brand6.svg',
			bg: 'bg-yellow-50',
			type: 'chart',
			barColor: 'bg-yellow-400',
			fillAmount: 0
		},
		{
			title: 'Profile Views',
			value: '0',
			icon: '/brand5.svg',
			bg: 'bg-pink-50',
			type: 'chart',
			barColor: 'bg-pink-400',
			fillAmount: 0
		},
		{
			title: 'Engagement Rate',
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
	<DashboardSkeleton variant="exhibitor" />
{:else}
<div class="min-h-screen w-full text-[#101828]">
	<!-- Header -->
	<div class="mb-8 flex items-center gap-3">
		{#if logoUrl}
			<img src={logoUrl} alt="logo" class="h-8 w-8 rounded-lg object-cover" />
		{:else}
			<img src="/loader.svg" alt="logo" class="h-8 w-8 rounded-lg object-cover" />
		{/if}
		<h1 class="text-2xl font-bold">{exhibitorName}</h1>
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
						</div>
						<div class="mb-1 text-2xl font-bold">{stat.value}</div>
						<div class="text-xs text-gray-500">{stat.title}</div>
					</div>
					<div class="mt-auto flex h-8 w-full items-end gap-1">
						{#each Array(20) as _, i}
							<div
								class={`h-full flex-1 rounded-sm ${i < (stat.fillAmount || 0) ? stat.barColor : 'bg-gray-100'}`}
							></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Collaboration Requests -->
		<div class="flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-gray-100">
			<div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-4 sm:p-5">
				<h2 class="text-sm font-bold text-gray-900 sm:text-base">Collaboration Requests</h2>
				{#if collaborationRequests.length > 0}
					<a
						href="/exhibitor/collab"
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
										href="/exhibitor/collab"
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

		<!-- My Booths & Stands -->
		<div class="relative min-h-[200px]">
			<div class="mb-4 flex items-center justify-between sm:mb-6">
				<h2 class="text-sm font-bold text-gray-900 sm:text-lg">My Booths & Stands</h2>
				<a
					href="/exhibitor/booths"
					class="flex items-center gap-1.5 rounded-lg bg-gray-200 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-300 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
				>
					Manage Booths
					<img src="/arrow-left.svg" alt="arrow" class="h-3 w-3" />
				</a>
			</div>

			<div class="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
				<img src="/empty-state.svg" alt="No booths" class="mx-auto mb-4 h-auto w-32" />
				<h3 class="text-sm font-bold text-gray-900">No Booths or Stands, yet</h3>
				<p class="mt-1 mb-6 max-w-[200px] text-xs text-gray-400">
					Your booths will appear here once you're approved for events.
				</p>
				<a
					href="/exhibitor/booths"
					class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
				>
					Browse Events
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
				<p class="mt-1 text-xs text-gray-500">View transaction history</p>
			</div>

			<div class="flex flex-1 flex-col justify-center p-5">
				<div class="flex flex-col items-center justify-center py-6 text-center">
					<img src="/empty-state.svg" alt="No transactions" class="mx-auto mb-4 h-auto w-32" />
					<h3 class="text-sm font-bold text-gray-900">No Transaction history, yet</h3>
					<p class="mt-1 text-xs text-gray-400">No recent transactions.</p>
				</div>
			</div>
		</div>
	</div>
</div>
{/if}
