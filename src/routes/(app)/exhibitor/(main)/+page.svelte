<script lang="ts">
	import DashboardSkeleton from '$lib/components/DashboardSkeleton.svelte';
	import {
		getExhibitorCollaborations,
		getExhibitorCollaborationStats,
		getMyBooths
	} from '$lib/services/exhibitor.services';
	import { getActiveProfile, type UserProfileData } from '$lib/services/profile.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
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
	let latestBooths: any[] = [];
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
			const ed = (profile as any)?.exhibitorDetails;
			exhibitorName = ed?.companyName || profile?.name || 'Exhibitor';
			logoUrl = ed?.logoUrl || profile?.profilePictureUrl || '';

			try {
				const stats = await getExhibitorCollaborationStats();
				pendingApplications = stats?.pending || 0;
			} catch {}

			try {
				const boothResult = await getMyBooths({ limit: 3 });
				const list = Array.isArray(boothResult)
					? boothResult
					: boothResult?.data || boothResult?.booths || [];
				latestBooths = list.slice(0, 3);
				boothCount = boothResult?.pagination?.totalItems || list.length || 0;
				totalBoothViews = list.reduce((sum: number, b: any) => sum + (Number(b.views) || 0), 0);
			} catch {
				latestBooths = [];
			}

			try {
				const collabResult = await getExhibitorCollaborations({
					limit: 3,
					sortBy: 'createdAt',
					sortOrder: 'desc'
				});
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

	$: topStats = [
		{
			title: 'Booths / Stands',
			count: String(boothCount),
			icon: '/brand2.svg',
			bg: 'bg-blue-50',
			btn: 'View Booths',
			href: '/exhibitor/booths-stands'
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
			bg: 'bg-emerald-50',
			btn: 'Manage Stands',
			href: '/exhibitor/booths-stands'
		}
	];

	$: bottomStats = [
		{
			title: 'Leads Captured',
			value: String(leadsCaptured),
			icon: '/brand6.svg',
			bg: 'bg-amber-50',
			barColor: 'bg-amber-400',
			fillAmount: leadsCaptured > 0 ? 10 : 0
		},
		{
			title: 'Profile Views',
			value: String(totalBoothViews),
			icon: '/brand5.svg',
			bg: 'bg-pink-50',
			barColor: 'bg-pink-400',
			fillAmount: totalBoothViews > 0 ? 12 : 0
		},
		{
			title: 'Engagement Rate',
			value: boothCount > 0 ? 'Active' : '0%',
			icon: '/brand.svg',
			bg: 'bg-teal-50',
			barColor: 'bg-teal-500',
			fillAmount: boothCount > 0 ? 11 : 0
		}
	];
</script>

{#if loading}
	<DashboardSkeleton variant="exhibitor" />
{:else}
	<div class="min-h-screen w-full space-y-8 text-[#101828]">
		<!-- Frosted Identity Header Bar -->
		<div class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/85 bg-white/75 p-4 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md sm:px-6 sm:py-5">
			<div class="flex items-center gap-3.5">
				{#if logoUrl}
					<img src={logoUrl} alt={exhibitorName} class="h-11 w-11 rounded-2xl border border-black/8 object-cover shadow-xs" />
				{:else}
					<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#513BE2]/15 to-[#AB46DD]/20 text-[#513BE2] ring-1 ring-[#513BE2]/15">
						<Icon icon="solar:buildings-2-bold-duotone" class="h-6 w-6" />
					</div>
				{/if}
				<div>
					<span class="rounded-full bg-[#EDE8FC] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#513BE2] uppercase">
						Exhibitor Workspace
					</span>
					<h1 class="mt-0.5 text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">{exhibitorName}</h1>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#if profileData?.publicProfileSlug}
					<a
						class="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-4 text-xs font-semibold text-[#32303B] no-underline shadow-xs transition hover:bg-white"
						href="/x/{profileData.publicProfileSlug}"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span>Exhibitor Page</span>
						<Icon icon="solar:square-top-down-linear" class="h-3.5 w-3.5 text-[#7A7787]" />
					</a>
				{/if}
				<a
					href="/exhibitor/booths-stands"
					class="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#17161E] px-4 text-xs font-semibold text-white no-underline shadow-xs transition hover:bg-[#2C2C34]"
				>
					<Icon icon="solar:add-circle-bold" class="h-4 w-4" />
					<span>Manage Booths</span>
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
							<span class="text-[11px] font-semibold text-[#878495]">{stat.title}</span>
						</div>
						<div class="text-2xl font-bold tracking-tight text-[#17161E] sm:text-3xl">{stat.value}</div>
					</div>
					<div class="mt-auto flex h-7 w-full items-end gap-1">
						{#each Array(20) as _, i}
							<div
								class={`h-full flex-1 rounded-sm ${i < (stat.fillAmount || 0) ? stat.barColor : 'bg-black/6'}`}
							></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Collaboration Requests -->
		<div class="flex flex-col overflow-hidden rounded-[24px] border border-white/85 bg-white/85 shadow-[0_10px_28px_-8px_rgba(18,16,36,0.05)] backdrop-blur-md">
			<div class="flex items-center justify-between border-b border-black/6 px-5 py-4">
				<h2 class="text-sm font-bold text-[#17161E] sm:text-base">Collaboration Requests</h2>
				{#if collaborationRequests.length > 0}
					<a
						href="/exhibitor/collab"
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
										href="/exhibitor/collab"
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

		<!-- My Booths & Stands (Live Data Preview) -->
		<div class="relative">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-bold text-[#17161E] sm:text-lg">My Booths & Stands</h2>
				<a
					href="/exhibitor/booths-stands"
					class="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#32303B] no-underline transition hover:bg-white"
				>
					<span>Manage Booths</span>
					<Icon icon="solar:arrow-right-linear" class="h-3.5 w-3.5" />
				</a>
			</div>

			{#if latestBooths.length > 0}
				<div class="grid gap-4 md:grid-cols-3">
					{#each latestBooths as booth (booth._id)}
						<a
							href="/exhibitor/booths-stands"
							class="group flex flex-col justify-between overflow-hidden rounded-[22px] border border-white/85 bg-white/90 p-4 no-underline shadow-xs backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md"
						>
							<div>
								<div class="relative mb-3 h-36 w-full overflow-hidden rounded-2xl bg-[#F4F5F8]">
									{#if booth.media?.[0]?.url || booth.bannerUrl}
										<img
											src={booth.media?.[0]?.url || booth.bannerUrl}
											alt={booth.title}
											class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center text-[#513BE2]/40">
											<Icon icon="solar:buildings-2-bold-duotone" class="h-10 w-10" />
										</div>
									{/if}
									<span class="absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold {booth.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-white/90 text-[#5F5C6D]'}">
										{booth.status || 'DRAFT'}
									</span>
								</div>
								<h3 class="line-clamp-1 text-sm font-bold text-[#17161E]">{booth.title}</h3>
								<p class="mt-0.5 line-clamp-1 text-xs text-[#6B6878]">{booth.description || ''}</p>
							</div>
							<div class="mt-3 flex items-center justify-between border-t border-black/6 pt-3 text-[11px] font-medium text-[#878495]">
								<span>{booth.resources?.length ?? 0} resources</span>
								<span>{booth.createdAt ? timeAgo(booth.createdAt) : ''}</span>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center rounded-3xl border border-white/85 bg-white/85 py-12 text-center shadow-xs backdrop-blur-md">
					<img src="/empty-state.svg" alt="No booths" class="mx-auto mb-4 h-auto w-28" />
					<h3 class="text-sm font-bold text-[#17161E]">No Booths or Stands yet</h3>
					<p class="mt-1 mb-5 max-w-[240px] text-xs text-[#878495]">
						Create your first digital booth so attendees and organizers can explore your showcase.
					</p>
					<a
						href="/exhibitor/booths-stands"
						class="inline-flex items-center gap-1.5 rounded-full bg-[#17161E] px-5 py-2 text-xs font-semibold text-white no-underline transition hover:bg-[#2C2C34]"
					>
						<Icon icon="solar:add-circle-bold" class="h-4 w-4" />
						<span>Create First Booth</span>
					</a>
				</div>
			{/if}
		</div>

		<!-- Recent Transactions -->
		<div class="flex flex-col overflow-hidden rounded-[24px] border border-white/85 bg-white/85 shadow-xs backdrop-blur-md">
			<div class="flex items-center justify-between border-b border-black/6 px-5 py-4">
				<div>
					<h2 class="text-sm font-bold text-[#17161E] sm:text-base">Recent Transactions</h2>
					<p class="text-xs text-[#878495]">View sponsorship & booth settlement history</p>
				</div>
				<span class="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-bold text-[#17161E]">
					{recentTransactions.length}
				</span>
			</div>

			<div class="p-5">
				<div class="flex flex-col items-center justify-center py-6 text-center">
					<img src="/empty-state.svg" alt="No transactions" class="mx-auto mb-3 h-auto w-28" />
					<h3 class="text-sm font-bold text-[#17161E]">No Transaction History yet</h3>
					<p class="mt-1 text-xs text-[#878495]">Recent booth transactions will appear here.</p>
				</div>
			</div>
		</div>
	</div>
{/if}
