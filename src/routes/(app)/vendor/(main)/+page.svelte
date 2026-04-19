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
	import { authState } from '$lib/stores/auth.store';
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
	let totalRevenue = '₦0.00';
	let profileViews = '0';
	let conversionRate = '0%';

	// Lists
	let collaborationRequests: any[] = [];
	let latestProducts: any[] = [];
	let recentTransactions: any[] = [];
	let hasActivity = false;

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
			// 1. Get user profile data (has vendorDetails with businessName, logo, etc.)
			const profile = await getActiveProfile();
			profileData = profile;
			const vd = (profile as any)?.vendorDetails;
			vendorName = vd?.businessName || profile?.name || 'Vendor';
			logoUrl = vd?.logoUrl || profile?.profilePictureUrl || '';

			// 2. Fetch vendor profile from product service (has the full vendor record)
			let vendorProfile: any = null;
			try {
				vendorProfile = await getVendorProfile();
				if (vendorProfile) {
					vendorSlug = vendorProfile.publicProfileSlug || '';
					isPublic = vendorProfile.publicProfileSettings?.showContactInfo !== false;
				}
			} catch {
				// Vendor profile may not exist in product service yet — that's ok
			}

			// 3. Fetch products
			try {
				const productsResult = await getProducts({ limit: 3 });
				const allProducts = Array.isArray(productsResult) ? productsResult : (productsResult?.data || productsResult?.products || []);
				latestProducts = allProducts.slice(0, 3);
				const allProductsFull = await getProducts({ limit: 1000 });
				const fullList = Array.isArray(allProductsFull) ? allProductsFull : (allProductsFull?.data || allProductsFull?.products || []);
				activeListings = fullList.length;
			} catch {
				latestProducts = [];
			}

			// 4. Fetch collaborations
			try {
				const collabResult = await getCollaborations({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
				const allCollabs = collabResult?.collaborations || collabResult?.data || [];
				collaborationRequests = allCollabs.slice(0, 3);
				pendingOrders = allCollabs.filter((c: any) => c.status?.toLowerCase() === 'pending').length;
				acceptedOrders = allCollabs.filter((c: any) => ['accepted', 'confirmed', 'in_progress'].includes(c.status?.toLowerCase())).length;
			} catch {
				collaborationRequests = [];
			}

			// 5. Fetch analytics summary
			try {
				const analytics = await getAnalyticsSummary();
				if (analytics) {
					totalRevenue = formatCurrency(analytics.totalRevenue || 0);
					profileViews = analytics.profileViews?.toLocaleString() || '0';
					conversionRate = analytics.conversionRate ? `${analytics.conversionRate}%` : '0%';
				}
			} catch {
				// Analytics may not be available yet
			}

			hasActivity = latestProducts.length > 0 || collaborationRequests.length > 0;
		} catch (err) {
			console.error('Failed to load vendor dashboard:', err);
		} finally {
			loading = false;
		}
	});

	// ─── Stat card configs ────────────────────────────────────────────────────
	$: topStatsRow1 = [
		{
			title: 'Products/Services',
			count: String(activeListings),
			icon: '/brand3.svg',
			bg: 'bg-green-50',
			btn: 'View All Products',
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
			href: '/vendor/collab'
		},
		{
			title: 'Profile Views',
			value: profileViews,
			icon: '/brand6.svg',
			bg: 'bg-yellow-50',
			type: 'chart',
			barColor: 'bg-yellow-400',
			fillAmount: 10
		},
		{
			title: 'Order Conversion Rate',
			value: conversionRate,
			icon: 'brand.svg',
			bg: 'bg-teal-50',
			type: 'chart',
			barColor: 'bg-teal-600',
			fillAmount: 13
		}
	];

	async function handleVisibilityChange(makePublic: boolean) {
		visibilityUpdating = true;
		showVisibilityDropdown = false;
		try {
			await updateVendorVisibility({ showContactInfo: makePublic, showReviews: makePublic });
			isPublic = makePublic;
		} catch (e) {
			console.error('Failed to update visibility', e);
		} finally {
			visibilityUpdating = false;
		}
	}
</script>

{#if loading}
	<DashboardSkeleton variant="vendor" />
{:else}
<div class="min-h-screen w-full text-[#101828]">
	<div class="mb-8 flex items-center gap-3">
		{#if logoUrl}
			<img src={logoUrl} alt="logo" class="h-8 w-8 rounded-lg object-cover" />
		{:else}
			<img src="/loader.svg" alt="logo" class="h-8 w-8 rounded-lg object-cover" />
		{/if}
		<h1 class="text-2xl font-bold">{vendorName}</h1>
	</div>

	<div class="flex w-full flex-col gap-8">
		<!-- Stats Row 1 -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each topStatsRow1 as stat}
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

			{#each topStatsRow2 as stat}
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
						href="/vendor/collab"
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
										href="/vendor/collab"
										class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
									>View Details</a>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<img src="/empty-state.svg" alt="No data" class="mx-auto h-auto w-32 mb-4" />
						<h3 class="text-sm font-bold text-gray-900">No Collaboration Request, yet</h3>
						<p class="mt-1 max-w-[250px] text-xs text-gray-400">
							Collaboration Request will display once they are added
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Latest Products -->
		<div class="relative min-h-[200px]">
			<div class="mb-4 flex items-center justify-between sm:mb-6">
				<h2 class="text-sm font-bold text-gray-900 sm:text-lg">Your Latest Products</h2>
				<a
					href="/vendor/products"
					class="flex items-center gap-1.5 rounded-lg bg-gray-200 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-300 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
				>
					View All Products
					<img src="/arrow-left.svg" alt="arrow" class="h-3 w-3" />
				</a>
			</div>

			{#if latestProducts.length > 0}
				<div class="relative space-y-6">
					{#each latestProducts as product}
						<div class="relative flex items-start gap-6">
							<div class="w-24 text-left">
								<p class="text-sm font-bold text-gray-900">
									{new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
								</p>
								<p class="text-xs text-gray-400">
									{new Date(product.createdAt).toLocaleDateString('en-US', { weekday: 'long' })}
								</p>
							</div>

							<div class="relative hidden md:flex w-[11px] shrink-0 justify-center self-stretch">
								<span class="absolute top-0 bottom-0 border-l-2 border-dashed border-[#D9D9D9]"></span>
								<span class="relative z-10 mt-2 h-[11px] w-[11px] rounded-full bg-[#D9D9D9]"></span>
							</div>

							<div class="flex max-w-2xl flex-1 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
								<div class="flex flex-1 flex-col justify-between">
									<div>
										<h3 class="text-sm font-bold text-gray-900">{product.productName}</h3>
										<p class="text-xs text-gray-500">{product.description?.slice(0, 60) || ''}</p>
									</div>
									<div class="mt-2 mb-4">
										{#if product.price}
											<span class="text-lg font-bold text-gray-900">
												{formatCurrency(parseFloat(product.price?.$numberDecimal || product.price || 0), product.currency)}
											</span>
										{/if}
										<span class="ml-2 inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500">
											{product.pricingType || 'Custom Quote'}
										</span>
									</div>
									<div class="flex flex-wrap gap-2">
										<span class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold
											{product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : product.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}">
											{product.status}
										</span>
									</div>
								</div>

								{#if product.media?.[0]?.url}
									<div class="relative h-32 w-full flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 sm:w-32">
										<img src={product.media[0].url} alt={product.productName} class="h-full w-full object-cover" />
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
					<img src="/empty-state.svg" alt="No products" class="mx-auto h-auto w-32 mb-4" />
					<h3 class="text-sm font-bold text-gray-900">No Product/Services, yet</h3>
					<p class="mt-1 mb-6 max-w-[200px] text-xs text-gray-400">
						You haven't added any products yet. Start by adding your first one!
					</p>
					<a
						href="/vendor/products"
						class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
					>
						+ Add New Product
					</a>
				</div>
			{/if}
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
						<img src="/empty-state.svg" alt="No transactions" class="mx-auto h-auto w-32 mb-4" />
						<h3 class="text-sm font-bold text-gray-900">No Transaction history, yet</h3>
						<p class="mt-1 text-xs text-gray-400">No recent transactions.</p>
					</div>
				{/if}
			</div>
		</div>
		<!-- Visibility & Discovery -->
		<div class="mt-4 border-t pt-8">
			<h3 class="mb-1 text-lg font-medium">Visibility & Discovery</h3>
			<p class="mb-4 text-sm text-[#737577]">Control how people can find your vendor profile.</p>

			<div class="mb-4 rounded-md bg-[#FDFDFD] p-3">
				<div class="flex flex-col items-start gap-3 lg:flex-row">
					<div class="flex gap-3">
						{#if logoUrl}
							<img src={logoUrl} alt="vendor" class="h-10 w-10 rounded-lg object-cover" />
						{:else}
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
								<Icon icon="mdi:store" class="h-5 w-5 text-gray-400" />
							</div>
						{/if}
						<div class="lg:hidden">
							<div class="text-xs font-medium text-[#ABADAD]">Vendor Profile</div>
							<div class="text-sm text-gray-500">{vendorName}</div>
						</div>
					</div>
					<div>
						<div class="hidden lg:block">
							<div class="text-xs font-medium text-[#ABADAD]">Vendor Profile</div>
							<div class="text-sm text-gray-500">{vendorName}</div>
						</div>
						<div class="mt-1 mb-3 flex flex-col items-start gap-1 lg:flex-row lg:items-center">
							<span class="flex items-center {isPublic ? 'text-[#46C036]' : 'text-[#D69712]'}">
								<Icon icon={isPublic ? 'mdi:web' : 'mdi:lock-outline'} class="rounded-full text-xl" />
								<p>{isPublic ? 'Public' : 'Private'}</p>
							</span>
							<p class="hidden lg:flex">—</p>
							<p class="text-sm text-gray-500">
								{isPublic
									? 'Your profile is listed on the Rondwell discover page. Organizers can find and contact you.'
									: 'Your profile is hidden. Only people with your direct link can view it.'}
							</p>
						</div>
						<div class="relative flex flex-col gap-2 sm:flex-row">
							<button
								on:click={() => (showVisibilityDropdown = !showVisibilityDropdown)}
								disabled={visibilityUpdating}
								class="flex items-center justify-center gap-1 rounded-sm bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265] transition-colors hover:bg-gray-200 disabled:opacity-50"
							>
								<Icon icon="mdi:eye-outline" class="text-lg" />
								{visibilityUpdating ? 'Updating...' : 'Change Visibility'}
							</button>

							{#if showVisibilityDropdown}
								<div class="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border bg-white p-2 shadow-lg">
									<button
										on:click={() => handleVisibilityChange(true)}
										class="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-gray-50 {isPublic ? 'bg-gray-50' : ''}"
									>
										<Icon icon="mdi:web" class="mt-0.5 text-base text-gray-500" />
										<div>
											<p class="text-sm font-medium">Public</p>
											<p class="text-xs text-gray-400">Listed on the discover page. Organizers can find you.</p>
										</div>
										{#if isPublic}<Icon icon="mdi:check" class="ml-auto text-base" />{/if}
									</button>
									<button
										on:click={() => handleVisibilityChange(false)}
										class="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-gray-50 {!isPublic ? 'bg-gray-50' : ''}"
									>
										<Icon icon="mdi:lock-outline" class="mt-0.5 text-base text-gray-500" />
										<div>
											<p class="text-sm font-medium">Private</p>
											<p class="text-xs text-gray-400">Hidden from discover. Only direct link access.</p>
										</div>
										{#if !isPublic}<Icon icon="mdi:check" class="ml-auto text-base" />{/if}
									</button>
								</div>
							{/if}

							{#if vendorSlug}
								<button
									on:click={() => { navigator.clipboard.writeText(`${window.location.origin}/vendor-page/${vendorSlug}`); }}
									class="flex items-center justify-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#616265] transition-colors hover:bg-gray-200"
								>
									<Icon icon="mdi:content-copy" class="text-lg" />
									Copy Profile Link
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-start gap-1 text-xs text-gray-500">
				<Icon icon="mdi:star-outline" class="mt-0.5 shrink-0 text-base text-gray-300" />
				<p>
					Your public vendor profile appears on the Rondwell discover page under the Vendors tab, where organizers can browse and contact you for their events.
				</p>
			</div>
		</div>
	</div>
</div>
{/if}
