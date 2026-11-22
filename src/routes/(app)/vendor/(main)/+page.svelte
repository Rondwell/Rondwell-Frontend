<script lang="ts">
	import DashboardSkeleton from '$lib/components/DashboardSkeleton.svelte';
	import { getActiveProfile, type UserProfileData } from '$lib/services/profile.services';
	import {
		getAnalyticsSummary,
		getCollaborations,
		getProducts,
		getVendorProfile,
		updateVendorVisibility
	} from '$lib/services/vendor.services';
	import { toast } from '$lib/stores/toast.store';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// ─── State ────────────────────────────────────────────────────────────────
	let loading = true;
	let vendorName = '';
	let logoUrl = '';
	let profileData: UserProfileData | null = null;
	let vendorSlug = '';
	let isPublic = true;
	let showVisibilityDropdown = false;
	let visibilityUpdating = false;

	// Stats
	let activeListings = 0;
	let pendingOrders = 0;
	let acceptedOrders = 0;
	let totalRevenue = formatMoney(0, 'NGN');
	let profileViews = '0';
	let conversionRate = '0%';

	// Lists
	let collaborationRequests: any[] = [];
	let latestProducts: any[] = [];
	let recentTransactions: any[] = [];
	let hasActivity = false;

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
			const vd = (profile as any)?.vendorDetails;
			vendorName = vd?.businessName || profile?.name || 'Vendor';
			logoUrl = vd?.logoUrl || profile?.profilePictureUrl || '';
			vendorSlug = profile?.publicProfileSlug || '';

			try {
				const vendorProfile = await getVendorProfile();
				if (vendorProfile) {
					vendorSlug = vendorProfile.publicProfileSlug || vendorSlug;
					isPublic = vendorProfile.publicProfileSettings?.showContactInfo !== false;
				}
			} catch {
				// vendor profile optional
			}

			try {
				const productsResult = await getProducts({ limit: 3 });
				const allProducts = Array.isArray(productsResult)
					? productsResult
					: productsResult?.data || productsResult?.products || [];
				latestProducts = allProducts.slice(0, 3);
				const allProductsFull = await getProducts({ limit: 1000 });
				const fullList = Array.isArray(allProductsFull)
					? allProductsFull
					: allProductsFull?.data || allProductsFull?.products || [];
				activeListings = fullList.length;
			} catch {
				latestProducts = [];
			}

			try {
				const collabResult = await getCollaborations({
					limit: 5,
					sortBy: 'createdAt',
					sortOrder: 'desc'
				});
				const allCollabs = collabResult?.collaborations || collabResult?.data || [];
				collaborationRequests = allCollabs.slice(0, 3);
				pendingOrders = allCollabs.filter((c: any) => c.status?.toLowerCase() === 'pending').length;
				acceptedOrders = allCollabs.filter((c: any) =>
					['accepted', 'confirmed', 'in_progress'].includes(c.status?.toLowerCase())
				).length;
			} catch {
				collaborationRequests = [];
			}

			try {
				const analytics = await getAnalyticsSummary();
				if (analytics) {
					totalRevenue = formatCurrency(analytics.totalRevenue || 0);
					profileViews = analytics.profileViews?.toLocaleString() || '0';
					conversionRate = analytics.conversionRate ? `${analytics.conversionRate}%` : '0%';
				}
			} catch {
				// analytics optional
			}

			hasActivity = latestProducts.length > 0 || collaborationRequests.length > 0;
		} catch (err) {
			console.error('Failed to load vendor dashboard:', err);
		} finally {
			loading = false;
		}
	});

	$: topStatsRow1 = [
		{
			title: 'Products / Services',
			count: String(activeListings),
			icon: '/brand3.svg',
			bg: 'bg-emerald-50',
			btn: 'View Products',
			href: '/vendor/products'
		},
		{
			title: 'Pending Orders',
			count: String(pendingOrders),
			icon: '/brand4.svg',
			bg: 'bg-purple-50',
			btn: 'Review Orders',
			href: '/vendor/collab'
		},
		{
			title: 'Accepted Orders',
			count: String(acceptedOrders),
			icon: '/brand2.svg',
			bg: 'bg-blue-50',
			btn: 'View Accepted',
			href: '/vendor/collab'
		}
	];

	$: topStatsRow2 = [
		{
			title: 'Total Revenue',
			value: totalRevenue,
			icon: '/brand5.svg',
			bg: 'bg-pink-50',
			type: 'revenue',
			btn: 'View Financials',
			href: '/vendor/insights'
		},
		{
			title: 'Profile Views',
			value: profileViews,
			icon: '/brand6.svg',
			bg: 'bg-amber-50',
			type: 'chart',
			barColor: 'bg-amber-400',
			fillAmount: 10
		},
		{
			title: 'Order Conversion Rate',
			value: conversionRate,
			icon: '/brand.svg',
			bg: 'bg-teal-50',
			type: 'chart',
			barColor: 'bg-teal-500',
			fillAmount: 13
		}
	];

	async function handleVisibilityChange(makePublic: boolean) {
		visibilityUpdating = true;
		showVisibilityDropdown = false;
		try {
			await updateVendorVisibility({ showContactInfo: makePublic, showReviews: makePublic });
			isPublic = makePublic;
			toast.success(`Profile visibility set to ${makePublic ? 'Public' : 'Private'}`);
		} catch (e) {
			console.error('Failed to update visibility', e);
			toast.error('Failed to update visibility');
		} finally {
			visibilityUpdating = false;
		}
	}

	function copyProfileLink() {
		if (!vendorSlug) return;
		navigator.clipboard.writeText(`${window.location.origin}/v/${vendorSlug}`);
		toast.success('Vendor profile link copied!');
	}
</script>

{#if loading}
	<DashboardSkeleton variant="vendor" />
{:else}
	<div class="min-h-screen w-full space-y-8 text-[#101828]">
		<!-- Frosted Identity Header Bar -->
		<div class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/85 bg-white/75 p-4 shadow-[0_8px_24px_-6px_rgba(18,16,36,0.05)] backdrop-blur-md sm:px-6 sm:py-5">
			<div class="flex items-center gap-3.5">
				{#if logoUrl}
					<img src={logoUrl} alt={vendorName} class="h-11 w-11 rounded-2xl border border-black/8 object-cover shadow-xs" />
				{:else}
					<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#146AEB]/15 to-[#513BE2]/20 text-[#146AEB] ring-1 ring-[#146AEB]/15">
						<Icon icon="solar:shop-2-bold-duotone" class="h-6 w-6" />
					</div>
				{/if}
				<div>
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-[#E2E8FC] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#146AEB] uppercase">
							Vendor Workspace
						</span>
						<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold {isPublic ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
							<span class="h-1.5 w-1.5 rounded-full {isPublic ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
							{isPublic ? 'Public' : 'Private'}
						</span>
					</div>
					<h1 class="mt-0.5 text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">{vendorName}</h1>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#if profileData?.publicProfileSlug || vendorSlug}
					<a
						class="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-4 text-xs font-semibold text-[#32303B] no-underline shadow-xs transition hover:bg-white"
						href="/v/{profileData?.publicProfileSlug || vendorSlug}"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span>Vendor Page</span>
						<Icon icon="solar:square-top-down-linear" class="h-3.5 w-3.5 text-[#7A7787]" />
					</a>
				{/if}
				<a
					href="/vendor/products"
					class="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#17161E] px-4 text-xs font-semibold text-white no-underline shadow-xs transition hover:bg-[#2C2C34]"
				>
					<Icon icon="solar:add-circle-bold" class="h-4 w-4" />
					<span>Manage Catalog</span>
				</a>
			</div>
		</div>

		<!-- Bento KPI Grid -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each topStatsRow1 as stat}
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

			{#each topStatsRow2 as stat}
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
						href="/vendor/collab"
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
										href="/vendor/collab"
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
						<img src="/empty-state.svg" alt="No requests" class="mx-auto mb-3 h-auto w-28" />
						<h3 class="text-sm font-bold text-[#17161E]">No Collaboration Requests yet</h3>
						<p class="mt-1 max-w-[260px] text-xs text-[#878495]">
							Collaboration requests from organizers will appear here.
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Latest Products -->
		<div class="relative">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-bold text-[#17161E] sm:text-lg">Your Latest Products</h2>
				<a
					href="/vendor/products"
					class="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#32303B] no-underline transition hover:bg-white"
				>
					<span>View All</span>
					<Icon icon="solar:arrow-right-linear" class="h-3.5 w-3.5" />
				</a>
			</div>

			{#if latestProducts.length > 0}
				<div class="grid gap-4 md:grid-cols-3">
					{#each latestProducts as product}
						<a
							href="/vendor/products"
							class="group flex flex-col justify-between overflow-hidden rounded-[22px] border border-white/85 bg-white/90 p-4 no-underline shadow-xs backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md"
						>
							<div>
								<div class="relative mb-3 h-36 w-full overflow-hidden rounded-2xl bg-[#F4F5F8]">
									{#if product.media?.[0]?.url}
										<img src={product.media[0].url} alt={product.productName} class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
									{:else}
										<div class="flex h-full w-full items-center justify-center text-[#146AEB]/40">
											<Icon icon="solar:box-bold-duotone" class="h-10 w-10" />
										</div>
									{/if}
									<span class="absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold {product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-white/90 text-[#5F5C6D]'}">
										{product.status}
									</span>
								</div>
								<h3 class="line-clamp-1 text-sm font-bold text-[#17161E]">{product.productName}</h3>
								<p class="mt-0.5 line-clamp-1 text-xs text-[#6B6878]">{product.description || ''}</p>
							</div>
							<div class="mt-3 flex items-center justify-between border-t border-black/6 pt-3">
								<span class="text-sm font-bold text-[#17161E]">
									{product.price
										? formatCurrency(parseFloat(product.price?.$numberDecimal || product.price || 0), product.currency)
										: product.pricingType || 'Custom Quote'}
								</span>
								<span class="text-[11px] font-medium text-[#878495]">
									{product.createdAt ? timeAgo(product.createdAt) : ''}
								</span>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center rounded-3xl border border-white/85 bg-white/85 py-12 text-center shadow-xs backdrop-blur-md">
					<img src="/empty-state.svg" alt="No products" class="mx-auto mb-4 h-auto w-28" />
					<h3 class="text-sm font-bold text-[#17161E]">No Products or Services yet</h3>
					<p class="mt-1 mb-5 max-w-[230px] text-xs text-[#878495]">
						Add offerings so event organizers can discover and book your services.
					</p>
					<a
						href="/vendor/products"
						class="inline-flex items-center gap-1.5 rounded-full bg-[#17161E] px-5 py-2 text-xs font-semibold text-white no-underline transition hover:bg-[#2C2C34]"
					>
						<Icon icon="solar:add-circle-bold" class="h-4 w-4" />
						<span>Add First Product</span>
					</a>
				</div>
			{/if}
		</div>

		<!-- Recent Transactions -->
		<div class="flex flex-col overflow-hidden rounded-[24px] border border-white/85 bg-white/85 shadow-xs backdrop-blur-md">
			<div class="flex items-center justify-between border-b border-black/6 px-5 py-4">
				<div>
					<h2 class="text-sm font-bold text-[#17161E] sm:text-base">Recent Transactions</h2>
					<p class="text-xs text-[#878495]">Latest vendor settlements</p>
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
						<p class="mt-1 text-xs text-[#878495]">Settlements from bookings will appear here.</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Visibility & Discovery -->
		<div class="rounded-[24px] border border-white/85 bg-white/85 p-5 shadow-xs backdrop-blur-md sm:p-6">
			<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h3 class="text-base font-bold text-[#17161E]">Visibility & Discovery</h3>
					<p class="mt-0.5 text-xs text-[#6B6878]">
						{isPublic
							? 'Your profile is listed on Rondwell Discover under Vendors.'
							: 'Your profile is hidden from search — only accessible via direct link.'}
					</p>
				</div>

				<div class="relative flex flex-wrap items-center gap-2">
					<button
						type="button"
						on:click={() => (showVisibilityDropdown = !showVisibilityDropdown)}
						disabled={visibilityUpdating}
						class="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-[#17161E] shadow-2xs transition hover:bg-[#FAF9FC] disabled:opacity-50"
					>
						<Icon icon="solar:eye-bold-duotone" class="h-4 w-4 text-[#146AEB]" />
						<span>{visibilityUpdating ? 'Updating...' : isPublic ? 'Public Profile' : 'Private Profile'}</span>
					</button>

					{#if showVisibilityDropdown}
						<div class="absolute top-full right-0 z-50 mt-2 w-64 rounded-2xl border border-black/8 bg-white p-2 shadow-xl">
							<button
								type="button"
								on:click={() => handleVisibilityChange(true)}
								class="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left hover:bg-[#FAF9FC] {isPublic ? 'bg-[#FAF9FC]' : ''}"
							>
								<Icon icon="solar:global-bold-duotone" class="mt-0.5 h-4 w-4 text-emerald-600" />
								<div class="flex-1">
									<p class="text-xs font-bold text-[#17161E]">Public</p>
									<p class="text-[11px] text-[#878495]">Listed on Discover directory.</p>
								</div>
								{#if isPublic}<Icon icon="mdi:check" class="text-sm text-emerald-600" />{/if}
							</button>
							<button
								type="button"
								on:click={() => handleVisibilityChange(false)}
								class="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left hover:bg-[#FAF9FC] {!isPublic ? 'bg-[#FAF9FC]' : ''}"
							>
								<Icon icon="solar:lock-password-bold-duotone" class="mt-0.5 h-4 w-4 text-amber-600" />
								<div class="flex-1">
									<p class="text-xs font-bold text-[#17161E]">Private</p>
									<p class="text-[11px] text-[#878495]">Direct link access only.</p>
								</div>
								{#if !isPublic}<Icon icon="mdi:check" class="text-sm text-amber-600" />{/if}
							</button>
						</div>
					{/if}

					{#if vendorSlug}
						<button
							type="button"
							on:click={copyProfileLink}
							class="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#17161E] px-4 text-xs font-semibold text-white transition hover:bg-[#2C2C34]"
						>
							<Icon icon="solar:copy-bold-duotone" class="h-4 w-4" />
							<span>Copy Profile Link</span>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
