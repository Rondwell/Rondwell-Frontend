<script lang="ts">
	import { getDashboardStats } from '$lib/services/admin.services';
	import { onMount } from 'svelte';

	let stats: any = null;
	let loading = true;

	onMount(async () => {
		try {
			stats = await getDashboardStats();
		} catch (e) {
			console.error('Failed to load dashboard stats', e);
		} finally {
			loading = false;
		}
	});

	const statsCards = [
		{ title: 'Total Users', key: 'totalUsers', icon: 'users', color: '#AB46DD', bg: '#F2E4F8' },
		{ title: 'Total Events', key: 'totalEvents', icon: 'events', color: '#146AEB', bg: '#E2E8FC' },
		{ title: 'Total Attendees', key: 'totalAttendees', icon: 'attendees', color: '#3CBD2C', bg: '#E3F4E1' },
		{ title: 'Total Collections', key: 'totalCollections', icon: 'collections', color: '#D79917', bg: '#FFF7D8' },
	];

	function formatNumber(n: number): string {
		if (!n) return '0';
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return n.toLocaleString();
	}

	function timeAgo(dateStr: string): string {
		if (!dateStr) return '';
		const now = new Date();
		const date = new Date(dateStr);
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getEventStatusClass(status: string): string {
		switch (status) {
			case 'LIVE': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'ENDED': return 'bg-[#EBECED] text-[#616265]';
			case 'CANCELLED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#FFF8E1] text-[#EAAB26]';
		}
	}

	function getUserStatusClass(status: string): string {
		switch (status) {
			case 'ACTIVE': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'INACTIVE': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'DELETED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}
</script>

<svelte:head>
	<title>Dashboard | Rondwell HQ</title>
</svelte:head>

{#if loading}
	<div class="animate-pulse">
		<div class="mb-8 h-9 w-56 rounded bg-gray-200"></div>
		<div class="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
			{#each Array(4) as _}
				<div class="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5">
					<div class="mb-3 flex items-center justify-between">
						<div class="h-10 w-10 rounded-full bg-gray-200"></div>
						<div class="h-5 w-16 rounded bg-gray-200"></div>
					</div>
					<div class="h-8 w-28 rounded bg-gray-200"></div>
					<div class="mt-1 h-3 w-20 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			{#each Array(2) as _}
				<div class="rounded-2xl bg-white p-6">
					<div class="mb-4 h-6 w-32 rounded bg-gray-200"></div>
					{#each Array(5) as _}
						<div class="mb-3 flex items-center gap-3">
							<div class="h-8 w-8 rounded-full bg-gray-200"></div>
							<div class="flex-1"><div class="h-4 w-40 rounded bg-gray-200"></div></div>
							<div class="h-5 w-16 rounded-full bg-gray-200"></div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div>
		<div class="mb-8">
			<h1 class="text-3xl font-semibold text-gray-900">Dashboard</h1>
			<p class="mt-1 text-sm text-gray-500">Platform overview and key metrics</p>
		</div>

		<!-- Stats Cards -->
		<div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
			{#each statsCards as card}
				<div class="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:p-5">
					<div class="mb-2 flex items-center justify-between sm:mb-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10" style="background-color: {card.bg}">
							{#if card.icon === 'users'}
								<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M6.863 8.145c-.075-.008-.165-.008-.248 0-1.762-.06-3.172-1.515-3.172-3.293A3.3 3.3 0 016.742 1.568c1.815 0 3.3 1.47 3.3 3.285-.007 1.777-1.417 3.232-3.18 3.292z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.118 10.928c-1.8 1.23-1.8 3.225 0 4.447 2.04 1.388 5.46 1.388 7.5 0 1.8-1.23 1.8-3.225 0-4.447-2.033-1.38-5.453-1.38-7.5 0z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.688 15c.54-.113 1.05-.33 1.478-.653 1.155-.87 1.155-2.31 0-3.18-.42-.315-.93-.54-1.463-.66" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{:else if card.icon === 'events'}
								<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M6 1.5V3.75M12 1.5V3.75M2.625 6.818h12.75M15.75 6.375v6.375c0 2.25-1.125 3.75-3.75 3.75H6c-2.625 0-3.75-1.5-3.75-3.75V6.375c0-2.25 1.125-3.75 3.75-3.75h6c2.625 0 3.75 1.5 3.75 3.75z" stroke="{card.color}" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{:else if card.icon === 'attendees'}
								<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M6.863 8.145c-.075-.008-.165-.008-.248 0-1.762-.06-3.172-1.515-3.172-3.293A3.3 3.3 0 016.742 1.568c1.815 0 3.3 1.47 3.3 3.285-.007 1.777-1.417 3.232-3.18 3.292z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.293 3c1.432 0 2.58 1.155 2.58 2.58 0 1.395-1.103 2.528-2.483 2.58M3.118 10.928c-1.8 1.23-1.8 3.225 0 4.447 2.04 1.388 5.46 1.388 7.5 0 1.8-1.23 1.8-3.225 0-4.447-2.033-1.38-5.453-1.38-7.5 0z" stroke="{card.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{:else}
								<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M14.167 8.333h1.666c1.667 0 2.5-.833 2.5-2.5V4.167c0-1.667-.833-2.5-2.5-2.5h-1.666c-1.667 0-2.5.833-2.5 2.5v1.666c0 1.667.833 2.5 2.5 2.5z" stroke="{card.color}" stroke-width="1.3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.9)"/><circle cx="5" cy="5" r="3" stroke="{card.color}" stroke-width="1.3" transform="translate(0,0.5)"/><circle cx="14" cy="14" r="3" stroke="{card.color}" stroke-width="1.3" transform="translate(-0.5,0)"/></svg>
							{/if}
						</div>
						<span class="hidden rounded-md px-2 py-0.5 text-[10px] font-medium sm:inline-block" style="background-color: {card.bg}; color: {card.color}">
							{card.key === 'totalUsers' ? `+${stats?.recentUsers ?? 0} this month` : 'All Time'}
						</span>
					</div>
					<div class="text-xl font-bold text-gray-900 sm:text-2xl">{formatNumber(stats?.[card.key] ?? 0)}</div>
					<div class="mt-1 text-xs text-gray-500">{card.title}</div>
				</div>
			{/each}
		</div>

		<!-- Active Events + Growth -->
		<div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
			<div class="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#E3F4E1]">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="#3CBD2C"/><circle cx="12" cy="12" r="8" stroke="#3CBD2C" stroke-width="1.5" stroke-dasharray="3 3"/></svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{stats?.activeEvents ?? 0}</p>
					<p class="text-xs text-gray-500">Active Live Events</p>
				</div>
			</div>
			<div class="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#E2E8FC]">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 17l4-4 4 4 6-8 4 4" stroke="#146AEB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">+{stats?.recentEvents ?? 0}</p>
					<p class="text-xs text-gray-500">New Events This Month</p>
				</div>
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Latest Events -->
			<div class="rounded-2xl border border-gray-100 bg-white p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Latest Events</h2>
					<a href="/hq/events" class="text-xs font-medium text-[#513BE2] hover:underline">View All</a>
				</div>
				{#if stats?.latestEvents?.length}
					<div class="space-y-3">
						{#each stats.latestEvents as event}
							<div class="flex items-center gap-2 rounded-lg p-2 transition hover:bg-gray-50">
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-gray-800">{event.title}</p>
									<p class="text-xs text-gray-400">{timeAgo(event.createdAt)}</p>
								</div>
								<span class="ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {getEventStatusClass(event.eventStatus)}">
									{event.eventStatus}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="py-8 text-center text-sm text-gray-400">No events yet</p>
				{/if}
			</div>

			<!-- Latest Users -->
			<div class="rounded-2xl border border-gray-100 bg-white p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Latest Users</h2>
					<a href="/hq/users" class="text-xs font-medium text-[#513BE2] hover:underline">View All</a>
				</div>
				{#if stats?.latestUsers?.length}
					<div class="space-y-3">
						{#each stats.latestUsers as user}
							<div class="flex items-center gap-2 rounded-lg p-2 transition hover:bg-gray-50">
								<div class="flex min-w-0 flex-1 items-center gap-2">
									<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#F2E4F8] text-xs font-semibold text-[#AB46DD]">
										{(user.email || '?').charAt(0).toUpperCase()}
									</div>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-gray-800">{user.email}</p>
										<p class="text-xs text-gray-400">{timeAgo(user.createdAt)}</p>
									</div>
								</div>
								<span class="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {getUserStatusClass(user.status)}">
									{user.status}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="py-8 text-center text-sm text-gray-400">No users yet</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
