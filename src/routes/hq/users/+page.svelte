<script lang="ts">
	import {
		getUser,
		getUsers,
		updateUserStatus,
		getUserSubscription,
		updateUserPlan,
		getUserWallet,
		getUserPayout,
		updateUserPayoutPolicy,
		releaseUserPayoutHolds,
		type PayoutPanel,
		type PayoutPolicyMode,
		type PayoutRiskTier
	} from '$lib/services/admin.services';
	import PlanSelect from '$lib/components/hq/PlanSelect.svelte';
	import { onMount } from 'svelte';

	let users: any[] = [];
	let total = 0;
	let currentPage = 1;
	let totalPages = 1;
	let limit = 20;
	let loading = true;

	// Filters
	let searchQuery = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let statusFilter = 'ALL';
	let sortBy = 'createdAt';
	let sortOrder: 'asc' | 'desc' = 'desc';
	let showStatusDropdown = false;
	let showSortDropdown = false;

	// Modal
	let showModal = false;
	let selectedUser: any = null;
	let modalLoading = false;
	let statusUpdating = false;

	// Subscription plan (view + change)
	let userPlan: any = null;
	let planLoading = false;
	let planUpdating = false;
	let planError = '';
	let planCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
	let planCurrency: 'NGN' | 'USD' = 'NGN';
	let planDuration = 'DEFAULT'; // 'DEFAULT' = follow billing cycle, else months as string

	// Confirmation modal
	let showPlanConfirm = false;
	let planConfirmTier: 'PLUS' | 'FREE' = 'PLUS';

	// Wallet balance (admin view)
	let userWallet: any = null;
	let walletLoading = false;
	let walletError = '';

	// ── Payout reserve (FE-P5-03 / NEW-11.1) ────────────────────────────────
	//
	// Rolling reserve is ON for every organizer by default. This section is where
	// an admin eases it for a proven organizer, tightens it for a risky one, or
	// releases held funds early.
	let userPayout: PayoutPanel | null = null;
	let payoutLoading = false;
	let payoutUpdating = false;
	let payoutError = '';
	let payoutSuccess = '';
	// Draft controls
	let payoutMode: PayoutPolicyMode = 'ROLLING';
	let payoutTier: PayoutRiskTier = 'STANDARD';
	let payoutReservePercent = 20; // whole percent in the UI; bps on the wire
	let payoutDelayDays = 3;
	let payoutEaseExpiry = ''; // yyyy-mm-dd, '' = no expiry
	let payoutReason = '';
	// Confirmation modals
	let showPayoutConfirm = false;
	let showReleaseConfirm = false;
	let releaseReason = '';

	const payoutModeOptions = [
		{ label: 'Rolling (hold a reserve)', value: 'ROLLING' },
		{ label: 'Instant (no reserve)', value: 'INSTANT' }
	];
	const payoutTierOptions = [
		{ label: 'Trusted (low reserve)', value: 'TRUSTED' },
		{ label: 'Standard (default)', value: 'STANDARD' },
		{ label: 'Elevated (high reserve)', value: 'ELEVATED' }
	];

	async function loadUserPayout(userId: string) {
		payoutLoading = true;
		payoutError = '';
		payoutSuccess = '';
		try {
			userPayout = await getUserPayout(userId);
			// Seed the draft controls from the stored policy so the admin edits the
			// real current values rather than a blank form.
			payoutMode = userPayout.stored.policy;
			payoutTier = userPayout.stored.riskTier;
			payoutReservePercent = Math.round((userPayout.stored.reservePercentBps ?? 2000) / 100);
			payoutDelayDays = userPayout.stored.releaseDelayDays ?? 3;
			payoutEaseExpiry = userPayout.stored.easedUntil
				? new Date(userPayout.stored.easedUntil).toISOString().slice(0, 10)
				: '';
			payoutReason = '';
		} catch (e: any) {
			payoutError = e?.message ?? 'Failed to load payout settings';
		} finally {
			payoutLoading = false;
		}
	}

	/** Total held across every currency, for the summary line. */
	function totalHeldLabel(panel: PayoutPanel | null): string {
		if (!panel || panel.outstanding.length === 0) return '—';
		return panel.outstanding
			.filter((c) => c.heldKobo > 0)
			.map((c) => fmtMoney(c.heldKobo / 100, c.currency))
			.join(' · ') || '—';
	}

	function openPayoutConfirm() {
		if (!selectedUser?._id || payoutUpdating) return;
		payoutError = '';
		// The backend requires a reason for an INSTANT grant; check here so the
		// admin gets the message before a round trip.
		if (payoutMode === 'INSTANT' && payoutReason.trim().length < 3) {
			payoutError = 'A reason is required when granting instant payouts.';
			return;
		}
		showPayoutConfirm = true;
	}

	async function confirmPayoutUpdate() {
		if (!selectedUser?._id || payoutUpdating) return;
		payoutUpdating = true;
		payoutError = '';
		try {
			userPayout = await updateUserPayoutPolicy(selectedUser._id, {
				policy: payoutMode,
				riskTier: payoutTier,
				reservePercentBps: Math.round(payoutReservePercent * 100),
				releaseDelayDays: payoutDelayDays,
				easedUntil: payoutMode === 'INSTANT' ? (payoutEaseExpiry || null) : null,
				reason: payoutReason.trim() || undefined
			});
			showPayoutConfirm = false;
			payoutSuccess =
				payoutMode === 'INSTANT'
					? 'Instant payouts granted. Future ticket sales will not be held.'
					: 'Rolling reserve updated. Applies to future ticket sales.';
			payoutReason = '';
		} catch (e: any) {
			payoutError = e?.message ?? 'Failed to update payout settings';
		} finally {
			payoutUpdating = false;
		}
	}

	async function confirmReleaseHolds() {
		if (!selectedUser?._id || payoutUpdating) return;
		if (releaseReason.trim().length < 3) {
			payoutError = 'A reason is required to release held funds early.';
			return;
		}
		payoutUpdating = true;
		payoutError = '';
		try {
			const result = await releaseUserPayoutHolds(selectedUser._id, {
				reason: releaseReason.trim()
			});
			userPayout = result.panel;
			showReleaseConfirm = false;
			releaseReason = '';
			payoutSuccess =
				result.releasedCount === 0
					? 'No outstanding holds to release.'
					: `Released ${result.releasedCount} hold(s) — ${fmtMoney(result.releasedKobo / 100, 'NGN')} is now withdrawable.`;
			// The wallet panel above now shows a different withdrawable figure.
			if (selectedUser?._id) loadUserWallet(selectedUser._id);
		} catch (e: any) {
			payoutError = e?.message ?? 'Failed to release held funds';
		} finally {
			payoutUpdating = false;
		}
	}

	function payoutBadgeClass(mode: string): string {
		return mode === 'INSTANT' ? 'bg-[#E3F4E1] text-[#3CBD2C]' : 'bg-[#EEF0FF] text-[#513BE2]';
	}
	function tierBadgeClass(tier: string): string {
		if (tier === 'TRUSTED') return 'bg-[#E3F4E1] text-[#3CBD2C]';
		if (tier === 'ELEVATED') return 'bg-[#FDEAEA] text-[#E53935]';
		return 'bg-gray-100 text-gray-600';
	}

	const cycleOptions = [
		{ label: 'Monthly', value: 'MONTHLY' },
		{ label: 'Yearly', value: 'YEARLY' },
	];
	const currencyOptions = [
		{ label: 'NGN (₦)', value: 'NGN' },
		{ label: 'USD ($)', value: 'USD' },
	];
	const durationOptions = [
		{ label: 'Default (follow billing cycle)', value: 'DEFAULT' },
		{ label: '1 month', value: '1' },
		{ label: '3 months', value: '3' },
		{ label: '6 months', value: '6' },
		{ label: '12 months', value: '12' },
	];

	const statusOptions = [
		{ label: 'All Users', value: 'ALL' },
		{ label: 'Active', value: 'ACTIVE' },
		{ label: 'Inactive', value: 'INACTIVE' },
		{ label: 'Pending', value: 'PENDING_VERIFICATION' },
		{ label: 'Deleted', value: 'DELETED' },
	];

	const sortOptions = [
		{ label: 'Joined Date', value: 'createdAt' },
		{ label: 'Email', value: 'email' },
		{ label: 'Status', value: 'status' },
	];

	$: selectedStatusLabel = statusOptions.find((s) => s.value === statusFilter)?.label ?? 'All Users';
	$: selectedSortLabel = sortOptions.find((s) => s.value === sortBy)?.label ?? 'Joined Date';

	onMount(() => fetchUsers());

	async function fetchUsers() {
		loading = true;
		try {
			const params: Record<string, string> = {
				page: currentPage.toString(),
				limit: limit.toString(),
				sortBy,
				sortOrder,
			};
			if (searchQuery) params.search = searchQuery;
			if (statusFilter !== 'ALL') params.status = statusFilter;

			const data = await getUsers(params);
			users = data.users;
			total = data.total;
			totalPages = data.totalPages;
		} catch {
			users = [];
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => { currentPage = 1; fetchUsers(); }, 300);
	}

	function selectStatus(value: string) {
		statusFilter = value;
		showStatusDropdown = false;
		currentPage = 1;
		fetchUsers();
	}

	function selectSort(value: string) {
		if (sortBy === value) sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
		else { sortBy = value; sortOrder = 'desc'; }
		showSortDropdown = false;
		currentPage = 1;
		fetchUsers();
	}

	function goToPage(p: number) {
		if (p < 1 || p > totalPages) return;
		currentPage = p;
		fetchUsers();
	}

	async function openUserModal(user: any) {
		selectedUser = user;
		showModal = true;
		modalLoading = true;
		// Reset plan state for the newly opened user.
		userPlan = null;
		planError = '';
		planCycle = 'MONTHLY';
		planCurrency = 'NGN';
		planDuration = 'DEFAULT';
		showPlanConfirm = false;
		// Reset wallet state.
		userWallet = null;
		walletError = '';
		// Reset payout-reserve state (FE-P5-03).
		userPayout = null;
		payoutError = '';
		payoutSuccess = '';
		showPayoutConfirm = false;
		showReleaseConfirm = false;
		releaseReason = '';
		try {
			const detail = await getUser(user._id);
			selectedUser = detail;
		} catch { /* use basic data */ }
		finally { modalLoading = false; }
		loadUserPlan(user._id);
		loadUserWallet(user._id);
		loadUserPayout(user._id);
	}

	async function loadUserWallet(userId: string) {
		walletLoading = true;
		walletError = '';
		try {
			userWallet = await getUserWallet(userId);
		} catch (e: any) {
			walletError = e?.message ?? 'Failed to load wallet balance';
		} finally {
			walletLoading = false;
		}
	}

	/** Currencies that carry a non-zero balance (or NGN as a sensible default). */
	function walletCurrenciesToShow(w: any): any[] {
		if (!w?.balances) return [];
		const nonZero = w.balances.filter(
			(b: any) => b.totalKobo > 0 || b.reservedKobo > 0 || b.disputedKobo > 0,
		);
		if (nonZero.length > 0) return nonZero;
		// Nothing yet — still show NGN so the admin sees a zero balance.
		return w.balances.filter((b: any) => b.currency === 'NGN');
	}

	const currencySymbols: Record<string, string> = { NGN: '₦', USD: '$', ETH: 'Ξ' };

	/** Format a major-unit amount with its currency symbol. */
	function fmtMoney(amount: number, currency: string): string {
		const symbol = currencySymbols[currency] ?? '';
		return `${symbol}${Number(amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	async function loadUserPlan(userId: string) {
		planLoading = true;
		planError = '';
		try {
			userPlan = await getUserSubscription(userId);
			// Pre-select the change controls to the user's current billing prefs.
			if (userPlan?.subscription?.billingCycle) planCycle = userPlan.subscription.billingCycle;
			if (userPlan?.subscription?.currency) planCurrency = userPlan.subscription.currency;
		} catch (e: any) {
			planError = e?.message ?? 'Failed to load plan';
		} finally {
			planLoading = false;
		}
	}

	function openPlanConfirm(tier: 'PLUS' | 'FREE') {
		if (!selectedUser?._id || planUpdating) return;
		planConfirmTier = tier;
		planError = '';
		showPlanConfirm = true;
	}

	/** Preview the exact date the grant will expire (mirrors backend math). */
	function computePlanExpiry(): Date {
		const now = new Date();
		const d = new Date(now);
		if (planDuration !== 'DEFAULT') {
			d.setMonth(d.getMonth() + parseInt(planDuration, 10));
		} else if (planCycle === 'YEARLY') {
			d.setFullYear(d.getFullYear() + 1);
		} else {
			d.setMonth(d.getMonth() + 1);
		}
		return d;
	}

	async function confirmPlanChange() {
		if (!selectedUser?._id || planUpdating) return;
		const tier = planConfirmTier;
		planUpdating = true;
		planError = '';
		try {
			await updateUserPlan(
				selectedUser._id,
				tier,
				tier === 'PLUS'
					? {
							billingCycle: planCycle,
							currency: planCurrency,
							...(planDuration !== 'DEFAULT' ? { durationMonths: parseInt(planDuration, 10) } : {}),
						}
					: {},
			);
			showPlanConfirm = false;
			await loadUserPlan(selectedUser._id);
		} catch (e: any) {
			planError = e?.message ?? 'Failed to update plan';
		} finally {
			planUpdating = false;
		}
	}

	function planBadgeClass(tier: string): string {
		return tier === 'PLUS'
			? 'bg-[#FDE0EE] text-[#F31A7C]'
			: 'bg-[#EBECED] text-[#616265]';
	}

	function fmtDate(d: string | null | undefined): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	async function handleStatusChange(userId: string, newStatus: string) {
		statusUpdating = true;
		try {
			await updateUserStatus(userId, newStatus);
			if (selectedUser?._id === userId) selectedUser.status = newStatus;
			const idx = users.findIndex((u) => u._id === userId);
			if (idx >= 0) users[idx].status = newStatus;
			users = users;
		} catch (e) { console.error(e); }
		finally { statusUpdating = false; }
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'ACTIVE': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'INACTIVE': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'DELETED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}

	function timeAgo(dateStr: string): string {
		if (!dateStr) return '';
		const now = new Date();
		const date = new Date(dateStr);
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
		if (diffDays < 1) return 'Today';
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head><title>Users | Rondwell HQ</title></svelte:head>

<div>
	<div class="mb-6">
		<h1 class="text-3xl font-semibold text-gray-900">User Management</h1>
		<p class="mt-1 text-sm text-gray-500">Manage all platform users</p>
	</div>

	<!-- Search -->
	<div class="relative mb-4 w-full">
		<input type="text" bind:value={searchQuery} on:input={handleSearch} placeholder="Search by email or phone..."
			class="h-[44px] w-full rounded-xl bg-white py-2 pr-4 pl-10 text-sm shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
		<svg class="absolute top-3 left-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex items-center justify-between">
		<div class="relative">
			<button on:click={() => { showStatusDropdown = !showStatusDropdown; showSortDropdown = false; }}
				class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-[#616265] shadow-sm">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
				{selectedStatusLabel}
				<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
			</button>
			{#if showStatusDropdown}
				<div class="absolute left-0 z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
					{#each statusOptions as option}
						<button on:click={() => selectStatus(option.value)}
							class="flex w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 {statusFilter === option.value ? 'font-medium text-[#513BE2]' : 'text-[#616265]'}">
							{option.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="relative">
			<button on:click={() => { showSortDropdown = !showSortDropdown; showStatusDropdown = false; }}
				class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-[#616265] shadow-sm">
				{selectedSortLabel} {sortOrder === 'asc' ? '↑' : '↓'}
			</button>
			{#if showSortDropdown}
				<div class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
					{#each sortOptions as option}
						<button on:click={() => selectSort(option.value)}
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 {sortBy === option.value ? 'font-medium text-[#513BE2]' : 'text-[#616265]'}">
							{option.label}
							{#if sortBy === option.value}<span class="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- User List -->
	{#if loading}
		<div class="rounded-xl bg-white p-4">
			{#each Array(5) as _}
				<div class="flex animate-pulse items-center justify-between border-b py-3 last:border-b-0">
					<div class="flex items-center gap-3">
						<div class="h-9 w-9 rounded-full bg-gray-200"></div>
						<div><div class="h-4 w-36 rounded bg-gray-200"></div><div class="mt-1 h-3 w-48 rounded bg-gray-200"></div></div>
					</div>
					<div class="h-6 w-20 rounded-full bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if users.length > 0}
		<div class="rounded-xl bg-white">
			{#each users as user}
				<button class="flex w-full items-center gap-2 border-b border-gray-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50"
					on:click={() => openUserModal(user)}>
					<div class="flex min-w-0 flex-1 items-center gap-3">
						{#if user.profilePictureUrl}
							<img src={user.profilePictureUrl} alt="" class="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
						{:else}
							<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F2E4F8] text-xs font-semibold text-[#AB46DD]">
								{(user.name || user.email || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-800">{user.name || 'Unknown'}</p>
							<p class="truncate text-xs text-gray-400">{user.email}</p>
						</div>
					</div>
					<div class="flex flex-shrink-0 items-center gap-2">
						<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(user.status)}">{user.status}</span>
						<span class="hidden text-xs text-gray-400 sm:block">{timeAgo(user.createdAt)}</span>
					</div>
				</button>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
				<p class="text-xs text-gray-400">Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, total)} of {total}</p>
				<div class="flex items-center gap-1">
					<button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
						class="rounded-lg px-3 py-1.5 text-sm text-[#616265] transition hover:bg-white disabled:opacity-40">Prev</button>
					{#each Array(Math.min(totalPages, 5)) as _, i}
						{@const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i}
						<button on:click={() => goToPage(pageNum)}
							class="h-8 w-8 rounded-lg text-sm transition {currentPage === pageNum ? 'bg-[#513BE2] text-white' : 'text-[#616265] hover:bg-white'}">
							{pageNum}
						</button>
					{/each}
					<button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
						class="rounded-lg px-3 py-1.5 text-sm text-[#616265] transition hover:bg-white disabled:opacity-40">Next</button>
				</div>
			</div>
		{/if}
	{:else}
		<div class="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-white">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="text-gray-300"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zM3 21c0-3.314 4.03-6 9-6s9 2.686 9 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
			<p class="text-lg font-medium text-[#646568]">No Users Found</p>
			<p class="text-sm text-gray-400">Try adjusting your search or filters</p>
		</div>
	{/if}
</div>

<!-- User Detail Modal -->
{#if showModal && selectedUser}
	<div on:click={() => (showModal = false)} on:keydown={(e) => e.key === 'Escape' && (showModal = false)}
		class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0 lg:pr-10"
		role="dialog" aria-modal="true" tabindex="-1">
		<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
			role="document" on:click|stopPropagation on:keydown|stopPropagation>

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<button on:click={() => (showModal = false)} class="text-gray-500 hover:text-gray-700">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<span class="text-sm font-medium text-gray-500">User Details</span>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-6 pt-5 pb-6">
				{#if modalLoading}
					<div class="animate-pulse space-y-4">
						<div class="flex items-center gap-3"><div class="h-12 w-12 rounded-full bg-gray-200"></div><div><div class="h-5 w-40 rounded bg-gray-200"></div><div class="mt-1 h-3 w-52 rounded bg-gray-200"></div></div></div>
						{#each Array(4) as _}<div class="h-10 w-full rounded bg-gray-200"></div>{/each}
					</div>
				{:else}
					<!-- User Info -->
					<div class="flex items-center gap-4">
						{#if selectedUser.profilePictureUrl}
							<img src={selectedUser.profilePictureUrl} alt="" class="h-14 w-14 rounded-full object-cover" />
						{:else}
							<div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2E4F8] text-lg font-semibold text-[#AB46DD]">
								{(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							<p class="text-lg font-semibold text-gray-900">{selectedUser.name || 'Unknown'}</p>
							<p class="text-sm text-gray-400">{selectedUser.email}</p>
						</div>
					</div>

					<!-- Status -->
					<div class="mt-5 flex flex-wrap items-center gap-4">
						<div class="border-r border-gray-200 pr-4">
							<p class="text-xs text-[#C1C2C2]">Status</p>
							<span class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusClass(selectedUser.status)}">{selectedUser.status}</span>
						</div>
						<div class="border-r border-gray-200 pr-4">
							<p class="text-xs text-[#C1C2C2]">Joined</p>
							<p class="text-sm font-medium text-gray-800">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
						</div>
						{#if selectedUser.lastLoginAt}
							<div>
								<p class="text-xs text-[#C1C2C2]">Last Login</p>
								<p class="text-sm font-medium text-gray-800">{timeAgo(selectedUser.lastLoginAt)}</p>
							</div>
						{/if}
					</div>

					<!-- Details -->
					<div class="mt-6 space-y-4 border-t border-gray-200 pt-6">
						{#if selectedUser.phoneNumber}
							<div><p class="text-xs text-[#C1C2C2]">Phone</p><p class="text-sm font-medium text-gray-800">{selectedUser.phoneNumber}</p></div>
						{/if}
						<div><p class="text-xs text-[#C1C2C2]">Email Verified</p><p class="text-sm font-medium text-gray-800">{selectedUser.isEmailVerified ? '✓ Yes' : '✗ No'}</p></div>
						{#if selectedUser.role}
							<div><p class="text-xs text-[#C1C2C2]">Role</p><p class="text-sm font-medium text-gray-800">{selectedUser.role}</p></div>
						{/if}
						{#if selectedUser.bio}
							<div><p class="text-xs text-[#C1C2C2]">Bio</p><p class="text-sm text-gray-700">{selectedUser.bio}</p></div>
						{/if}
					</div>

					<!-- Wallet Balance -->
					<div class="mt-6 border-t border-gray-200 pt-6">
						<div class="mb-3 flex items-center justify-between">
							<h3 class="text-sm font-semibold text-gray-700">Wallet Balance</h3>
							{#if userWallet}
								{#if userWallet.frozen}
									<span class="rounded-full bg-[#FDEAEA] px-2 py-0.5 text-[10px] font-medium text-[#E53935]">Frozen</span>
								{:else}
									<span class="rounded-full bg-[#E3F4E1] px-2 py-0.5 text-[10px] font-medium text-[#3CBD2C]">{userWallet.walletStatus ?? 'Active'}</span>
								{/if}
							{/if}
						</div>

						{#if walletLoading}
							<div class="animate-pulse space-y-3">
								<div class="h-16 w-full rounded-xl bg-gray-200"></div>
							</div>
						{:else if walletError}
							<div class="rounded-lg bg-[#FDEAEA] px-3 py-2 text-xs text-[#E53935]">
								{walletError}
								<button on:click={() => selectedUser && loadUserWallet(selectedUser._id)} class="ml-2 font-medium underline">Retry</button>
							</div>
						{:else if userWallet}
							<div class="space-y-3">
								{#each walletCurrenciesToShow(userWallet) as bal}
									<div class="rounded-xl border border-gray-200 bg-white p-4">
										<div class="flex items-center justify-between">
											<div>
												<p class="text-xs text-[#C1C2C2]">Withdrawable ({bal.currency})</p>
												<p class="text-xl font-semibold text-gray-900">{fmtMoney(bal.withdrawable, bal.currency)}</p>
											</div>
											<div class="text-right">
												<p class="text-xs text-[#C1C2C2]">Total Balance</p>
												<p class="text-sm font-medium text-gray-700">{fmtMoney(bal.total, bal.currency)}</p>
											</div>
										</div>
										{#if bal.reservedKobo > 0 || bal.disputedKobo > 0 || bal.payoutReserveKobo > 0}
											<div class="mt-3 flex flex-wrap gap-4 border-t border-gray-100 pt-3">
												{#if bal.reservedKobo > 0}
													<div><p class="text-xs text-[#C1C2C2]">Reserved (withdrawals)</p><p class="text-sm font-medium text-[#EAAB26]">{fmtMoney(bal.reserved, bal.currency)}</p></div>
												{/if}
												{#if bal.disputedKobo > 0}
													<div><p class="text-xs text-[#C1C2C2]">Disputed (held)</p><p class="text-sm font-medium text-[#E53935]">{fmtMoney(bal.disputed, bal.currency)}</p></div>
												{/if}
												<!-- FE-P5-03 — the rolling payout reserve. Omitting it here made
												     the panel overstate what the organizer could withdraw. -->
												{#if bal.payoutReserveKobo > 0}
													<div><p class="text-xs text-[#C1C2C2]">Payout reserve (held)</p><p class="text-sm font-medium text-[#513BE2]">{fmtMoney(bal.payoutReserveHeld, bal.currency)}</p></div>
												{/if}
											</div>
										{/if}
									</div>
								{/each}
								{#if userWallet.balanceUpdatedAt}
									<p class="text-[11px] text-gray-400">Balance as of {new Date(userWallet.balanceUpdatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
								{/if}
							</div>
						{:else}
							<p class="text-sm text-gray-400">No wallet provisioned for this user yet.</p>
						{/if}
					</div>

					<!-- Subscription Plan -->
					<div class="mt-6 border-t border-gray-200 pt-6">
						<h3 class="mb-3 text-sm font-semibold text-gray-700">Subscription Plan</h3>

						{#if planLoading}
							<div class="animate-pulse space-y-3">
								<div class="h-6 w-24 rounded-full bg-gray-200"></div>
								<div class="h-10 w-full rounded bg-gray-200"></div>
							</div>
						{:else if planError}
							<div class="rounded-lg bg-[#FDEAEA] px-3 py-2 text-xs text-[#E53935]">
								{planError}
								<button on:click={() => selectedUser && loadUserPlan(selectedUser._id)} class="ml-2 font-medium underline">Retry</button>
							</div>
						{:else if userPlan}
							<!-- Current plan -->
							<div class="flex items-center gap-3">
								<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold {planBadgeClass(userPlan.effectiveTier)}">
									{userPlan.effectiveTier === 'PLUS' ? 'Rondwell PLUS' : 'Rondwell (Free)'}
								</span>
								{#if userPlan.subscription?.status && userPlan.subscription.status !== 'ACTIVE'}
									<span class="text-xs text-[#EAAB26]">({userPlan.subscription.status})</span>
								{/if}
							</div>

							<!-- Subscription details -->
							{#if userPlan.subscription}
								<div class="mt-3 grid grid-cols-2 gap-3">
									<div><p class="text-xs text-[#C1C2C2]">Billing Cycle</p><p class="text-sm font-medium text-gray-800">{userPlan.subscription.billingCycle ?? '—'}</p></div>
									<div><p class="text-xs text-[#C1C2C2]">Currency</p><p class="text-sm font-medium text-gray-800">{userPlan.subscription.currency ?? '—'}</p></div>
									<div><p class="text-xs text-[#C1C2C2]">Renews / Ends</p><p class="text-sm font-medium text-gray-800">{fmtDate(userPlan.subscription.currentPeriodEnd)}</p></div>
									<div><p class="text-xs text-[#C1C2C2]">First Activated</p><p class="text-sm font-medium text-gray-800">{fmtDate(userPlan.subscription.firstActivatedAt)}</p></div>
									{#if userPlan.subscription.cancelAtPeriodEnd}
										<div class="col-span-2"><span class="text-xs font-medium text-[#EAAB26]">Set to cancel at period end</span></div>
									{/if}
								</div>
							{/if}

							<!-- Change plan controls -->
							<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
								{#if userPlan.effectiveTier !== 'PLUS'}
									<p class="mb-3 text-xs font-medium text-gray-600">Grant Rondwell PLUS (admin comp — no charge)</p>
									<div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
										<PlanSelect label="Billing Cycle" bind:value={planCycle} options={cycleOptions} disabled={planUpdating} />
										<PlanSelect label="Currency" bind:value={planCurrency} options={currencyOptions} disabled={planUpdating} />
										<PlanSelect label="Duration" bind:value={planDuration} options={durationOptions} disabled={planUpdating} />
									</div>
									<button on:click={() => openPlanConfirm('PLUS')} disabled={planUpdating}
										class="rounded-lg bg-[#F31A7C] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#d1176b] disabled:opacity-50">
										Grant Rondwell PLUS
									</button>
								{:else}
									<p class="mb-3 text-xs font-medium text-gray-600">This user is on Rondwell PLUS.</p>
									<button on:click={() => openPlanConfirm('FREE')} disabled={planUpdating}
										class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
										Revert to Free
									</button>
								{/if}
							</div>
						{:else}
							<p class="text-sm text-gray-400">No subscription data.</p>
						{/if}
					</div>

					<!--
						Payout Reserve (FE-P5-03 / NEW-11.1)

						Rondwell is the merchant of record: Paystack takes refunds and lost
						chargebacks out of OUR balance, not the organizer's. Ticket settlement
						credits the organizer's spendable wallet immediately, so without a
						holdback an organizer could withdraw 100% of a sale the same day and
						any later reversal became an unsecured debt.

						We hold a MINORITY slice (default 20%) and release it a few days after
						the event ends, rather than holding everything until the event —
						organizers need cash flow before the event to pay venues and vendors.

						This panel is where an admin eases that for a proven organizer.
					-->
					<div class="mt-6 border-t border-gray-200 pt-6">
						<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
							<h3 class="text-sm font-semibold text-gray-700">Payout Reserve</h3>
							{#if userPayout}
								<div class="flex items-center gap-2">
									<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold {payoutBadgeClass(userPayout.effective.policy)}">
										{userPayout.effective.policy === 'INSTANT' ? 'Instant payouts' : 'Rolling reserve'}
									</span>
									<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {tierBadgeClass(userPayout.effective.riskTier)}">
										{userPayout.effective.riskTier}
									</span>
								</div>
							{/if}
						</div>

						{#if payoutLoading}
							<div class="animate-pulse space-y-3">
								<div class="h-16 w-full rounded-xl bg-gray-200"></div>
								<div class="h-10 w-full rounded bg-gray-200"></div>
							</div>
						{:else if payoutError && !userPayout}
							<div class="rounded-lg bg-[#FDEAEA] px-3 py-2 text-xs text-[#E53935]">
								{payoutError}
								<button on:click={() => selectedUser && loadUserPayout(selectedUser._id)} class="ml-2 font-medium underline">Retry</button>
							</div>
						{:else if userPayout}
							{#if payoutSuccess}
								<div class="mb-3 rounded-lg bg-[#E3F4E1] px-3 py-2 text-xs text-[#2E8C22]">{payoutSuccess}</div>
							{/if}
							{#if payoutError}
								<div class="mb-3 rounded-lg bg-[#FDEAEA] px-3 py-2 text-xs text-[#E53935]">{payoutError}</div>
							{/if}

							<!-- Current effective policy, in plain language -->
							<div class="rounded-xl border border-gray-200 bg-white p-4">
								{#if userPayout.effective.policy === 'INSTANT'}
									<p class="text-sm text-gray-700">
										Ticket revenue is withdrawable <span class="font-medium">as soon as it settles</span> — nothing is held.
									</p>
									{#if userPayout.stored.easedBy}
										<p class="mt-1 text-xs text-[#C1C2C2]">
											Eased by {userPayout.stored.easedBy}
											{#if userPayout.stored.easedAt}on {fmtDate(userPayout.stored.easedAt)}{/if}
											{#if userPayout.stored.easedReason}— “{userPayout.stored.easedReason}”{/if}
										</p>
									{/if}
									{#if userPayout.effective.easedUntil}
										<p class="mt-1 text-xs text-[#EAAB26]">
											Expires {fmtDate(userPayout.effective.easedUntil)} — reverts to rolling automatically.
										</p>
									{/if}
								{:else}
									<p class="text-sm text-gray-700">
										<span class="font-medium">{(userPayout.effective.reservePercentBps / 100).toFixed(userPayout.effective.reservePercentBps % 100 === 0 ? 0 : 2)}%</span>
										of each ticket sale is held, released
										<span class="font-medium">{userPayout.effective.releaseDelayDays} day{userPayout.effective.releaseDelayDays === 1 ? '' : 's'}</span>
										after the event ends. The rest is withdrawable immediately.
									</p>
								{/if}
								{#if userPayout.effective.easeExpired}
									<p class="mt-1 text-xs text-[#EAAB26]">A previous instant-payout grant expired and has reverted to rolling.</p>
								{/if}
								{#if userPayout.stored.autoElevatedAt}
									<p class="mt-1 text-xs text-[#E53935]">
										Auto-escalated to ELEVATED on {fmtDate(userPayout.stored.autoElevatedAt)} after chargebacks.
									</p>
								{/if}
							</div>

							<!-- Exposure snapshot -->
							<div class="mt-3 grid grid-cols-2 gap-3">
								<div>
									<p class="text-xs text-[#C1C2C2]">Currently held</p>
									<p class="text-sm font-medium text-gray-800">{totalHeldLabel(userPayout)}</p>
								</div>
								<div>
									<p class="text-xs text-[#C1C2C2]">Next release</p>
									<p class="text-sm font-medium text-gray-800">
										{userPayout.outstanding.find((c) => c.nextReleaseAt)?.nextReleaseAt
											? fmtDate(userPayout.outstanding.find((c) => c.nextReleaseAt)!.nextReleaseAt!)
											: '—'}
									</p>
								</div>
								<div>
									<p class="text-xs text-[#C1C2C2]">Chargebacks</p>
									<p class="text-sm font-medium {userPayout.stored.chargebackCount > 0 ? 'text-[#E53935]' : 'text-gray-800'}">
										{userPayout.stored.chargebackCount}
									</p>
								</div>
								<div>
									<p class="text-xs text-[#C1C2C2]">Refunds</p>
									<p class="text-sm font-medium text-gray-800">{userPayout.stored.refundCount}</p>
								</div>
							</div>

							<!-- Per-event release schedule -->
							{#if userPayout.upcoming.length > 0}
								<div class="mt-3 rounded-xl border border-gray-200 bg-white p-3">
									<p class="mb-2 text-xs font-medium text-gray-600">Release schedule</p>
									<div class="max-h-40 space-y-1.5 overflow-y-auto">
										{#each userPayout.upcoming as h}
											<div class="flex items-center justify-between gap-2 text-xs">
												<span class="truncate text-gray-700">{h.eventTitle || h.eventId}</span>
												<span class="flex shrink-0 items-center gap-2">
													<span class="font-medium text-gray-800">{fmtMoney(h.heldKobo / 100, h.currency)}</span>
													<span class="text-[#C1C2C2]">{fmtDate(h.releaseDueAt)}</span>
													{#if h.isFallbackDate}
														<!-- The event's end date couldn't be resolved at settlement
														     time, so this date is provisional and will move once it can. -->
														<span class="rounded bg-[#FFF6E5] px-1.5 py-0.5 text-[10px] font-medium text-[#EAAB26]">provisional</span>
													{/if}
												</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Controls -->
							<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
								<p class="mb-3 text-xs font-medium text-gray-600">
									Adjust payout policy (applies to future ticket sales)
								</p>
								<div class="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
									<PlanSelect label="Payout mode" bind:value={payoutMode} options={payoutModeOptions} disabled={payoutUpdating} />
									<PlanSelect label="Risk tier" bind:value={payoutTier} options={payoutTierOptions} disabled={payoutUpdating} />
								</div>

								{#if payoutMode === 'ROLLING'}
									<div class="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
										<label class="block">
											<span class="text-xs text-[#C1C2C2]">Reserve percentage</span>
											<div class="mt-1 flex items-center gap-2">
												<input
													type="number"
													min="0"
													max="100"
													step="1"
													bind:value={payoutReservePercent}
													disabled={payoutUpdating}
													class="h-[38px] w-full rounded-lg border border-gray-200 px-3 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none disabled:opacity-50"
												/>
												<span class="text-sm text-gray-500">%</span>
											</div>
										</label>
										<label class="block">
											<span class="text-xs text-[#C1C2C2]">Release delay after event ends</span>
											<div class="mt-1 flex items-center gap-2">
												<input
													type="number"
													min="0"
													max="90"
													step="1"
													bind:value={payoutDelayDays}
													disabled={payoutUpdating}
													class="h-[38px] w-full rounded-lg border border-gray-200 px-3 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none disabled:opacity-50"
												/>
												<span class="text-sm text-gray-500">days</span>
											</div>
										</label>
									</div>
								{:else}
									<!-- A trust grant that lives forever is a standing risk. Offering an
									     expiry makes "ease it for this festival" the easy default. -->
									<label class="mb-3 block">
										<span class="text-xs text-[#C1C2C2]">Expires on (optional — reverts to rolling automatically)</span>
										<input
											type="date"
											bind:value={payoutEaseExpiry}
											disabled={payoutUpdating}
											class="mt-1 h-[38px] w-full rounded-lg border border-gray-200 px-3 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none disabled:opacity-50"
										/>
									</label>
								{/if}

								<label class="mb-4 block">
									<span class="text-xs text-[#C1C2C2]">
										Reason {payoutMode === 'INSTANT' ? '(required)' : '(optional)'}
									</span>
									<input
										type="text"
										bind:value={payoutReason}
										disabled={payoutUpdating}
										placeholder="e.g. Long-standing organizer, 40+ events, zero disputes"
										class="mt-1 h-[38px] w-full rounded-lg border border-gray-200 px-3 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none disabled:opacity-50"
									/>
								</label>

								<div class="flex flex-wrap gap-2">
									<button on:click={openPayoutConfirm} disabled={payoutUpdating}
										class="rounded-lg bg-[#513BE2] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#4230bd] disabled:opacity-50">
										Save payout policy
									</button>
									{#if userPayout.outstanding.some((c) => c.heldKobo > 0)}
										<!-- Deliberately a SEPARATE action from the policy change: this moves
										     real money now, against exposure that has not yet expired. -->
										<button on:click={() => { payoutError = ''; showReleaseConfirm = true; }} disabled={payoutUpdating}
											class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
											Release held funds now
										</button>
									{/if}
								</div>
								<p class="mt-3 text-[11px] text-gray-400">
									Changing the policy affects future sales only. Money already held stays held
									until its release date, or until you release it explicitly.
								</p>
							</div>

							<!-- Audit trail -->
							{#if userPayout.history.length > 0}
								<div class="mt-3 rounded-xl border border-gray-200 bg-white p-3">
									<p class="mb-2 text-xs font-medium text-gray-600">Change history</p>
									<div class="max-h-40 space-y-2 overflow-y-auto">
										{#each userPayout.history as h}
											<div class="text-xs">
												<p class="text-gray-700">
													<span class="font-medium">{h.actor}</span>
													{#if h.fromPolicy && h.toPolicy && h.fromPolicy !== h.toPolicy}
														· {h.fromPolicy} → {h.toPolicy}
													{/if}
													{#if h.toReservePercentBps !== undefined}
														· {(h.toReservePercentBps / 100).toFixed(0)}% / {h.toReleaseDelayDays}d
													{/if}
												</p>
												<p class="text-[#C1C2C2]">
													{fmtDate(h.at)}{#if h.reason} — “{h.reason}”{/if}
												</p>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{:else}
							<p class="text-sm text-gray-400">No payout data for this user yet.</p>
						{/if}
					</div>

					<!-- Actions -->
					<div class="mt-6 border-t border-gray-200 pt-6">
						<h3 class="mb-3 text-sm font-semibold text-gray-700">Actions</h3>
						<div class="flex flex-wrap gap-2">
							{#if selectedUser.status !== 'ACTIVE'}
								<button on:click={() => handleStatusChange(selectedUser._id, 'ACTIVE')} disabled={statusUpdating}
									class="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50">
									{statusUpdating ? '...' : 'Activate'}
								</button>
							{/if}
							{#if selectedUser.status !== 'INACTIVE'}
								<button on:click={() => handleStatusChange(selectedUser._id, 'INACTIVE')} disabled={statusUpdating}
									class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
									{statusUpdating ? '...' : 'Deactivate'}
								</button>
							{/if}
							{#if selectedUser.status !== 'DELETED'}
								<button on:click={() => handleStatusChange(selectedUser._id, 'DELETED')} disabled={statusUpdating}
									class="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
									{statusUpdating ? '...' : 'Delete'}
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Plan Change Confirmation Modal -->
{#if showPlanConfirm && selectedUser}
	<div on:click={() => !planUpdating && (showPlanConfirm = false)} on:keydown={(e) => e.key === 'Escape' && !planUpdating && (showPlanConfirm = false)}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			{#if planConfirmTier === 'PLUS'}
				<h3 class="text-lg font-semibold text-gray-900">Grant Rondwell PLUS?</h3>
				<p class="mt-1 text-sm text-gray-500">
					This grants <span class="font-medium text-gray-800">{selectedUser.name || selectedUser.email}</span> a complimentary PLUS plan. No charge is made.
				</p>
				<div class="mt-4 space-y-2 rounded-xl bg-[#F9F5FF] p-4 text-sm">
					<div class="flex justify-between"><span class="text-gray-500">Plan</span><span class="font-medium text-[#F31A7C]">Rondwell PLUS</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Billing Cycle</span><span class="font-medium text-gray-800">{planCycle === 'YEARLY' ? 'Yearly' : 'Monthly'}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Currency</span><span class="font-medium text-gray-800">{planCurrency}</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Duration</span><span class="font-medium text-gray-800">{planDuration === 'DEFAULT' ? (planCycle === 'YEARLY' ? '1 year' : '1 month') : `${planDuration} month${planDuration === '1' ? '' : 's'}`}</span></div>
					<div class="flex justify-between border-t border-[#EADDFB] pt-2"><span class="text-gray-500">Expires</span><span class="font-semibold text-gray-900">{fmtDate(computePlanExpiry().toISOString())}</span></div>
				</div>
				<p class="mt-3 text-xs text-gray-400">After this date the plan reverts to Free automatically — no auto-charge, since this is a comp.</p>
			{:else}
				<h3 class="text-lg font-semibold text-gray-900">Revert to Free?</h3>
				<p class="mt-1 text-sm text-gray-500">
					This immediately downgrades <span class="font-medium text-gray-800">{selectedUser.name || selectedUser.email}</span> to the Free plan. PLUS limits and fee discounts stop right away.
				</p>
			{/if}

			{#if planError}
				<div class="mt-3 rounded-lg bg-[#FDEAEA] px-3 py-2 text-xs text-[#E53935]">{planError}</div>
			{/if}

			<div class="mt-6 flex justify-end gap-2">
				<button on:click={() => (showPlanConfirm = false)} disabled={planUpdating}
					class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Cancel</button>
				<button on:click={confirmPlanChange} disabled={planUpdating}
					class="rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 {planConfirmTier === 'PLUS' ? 'bg-[#F31A7C] hover:bg-[#d1176b]' : 'bg-red-600 hover:bg-red-700'}">
					{planUpdating ? 'Working…' : planConfirmTier === 'PLUS' ? 'Confirm Grant' : 'Confirm Revert'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Payout Policy Confirmation (FE-P5-03) -->
{#if showPayoutConfirm && selectedUser}
	<div on:click={() => !payoutUpdating && (showPayoutConfirm = false)} on:keydown={(e) => e.key === 'Escape' && !payoutUpdating && (showPayoutConfirm = false)}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			{#if payoutMode === 'INSTANT'}
				<h3 class="text-lg font-semibold text-gray-900">Grant instant payouts?</h3>
				<p class="mt-1 text-sm text-gray-500">
					<span class="font-medium text-gray-800">{selectedUser.name || selectedUser.email}</span>
					will be able to withdraw 100% of every ticket sale as soon as it settles. Nothing will be
					held back to cover refunds or chargebacks.
				</p>
				<div class="mt-4 rounded-xl bg-[#FFF6E5] p-3 text-xs text-[#8A6A12]">
					Rondwell is the merchant of record — if a refund or chargeback lands after this organizer
					has withdrawn, the platform absorbs it and has to recover the money from them directly.
					Only ease this for organizers you'd extend credit to.
				</div>
			{:else}
				<h3 class="text-lg font-semibold text-gray-900">Update rolling reserve?</h3>
				<p class="mt-1 text-sm text-gray-500">
					This changes how much of <span class="font-medium text-gray-800">{selectedUser.name || selectedUser.email}</span>'s
					future ticket sales is held back.
				</p>
			{/if}

			<div class="mt-4 space-y-2 rounded-xl bg-[#F9F5FF] p-4 text-sm">
				<div class="flex justify-between"><span class="text-gray-500">Mode</span><span class="font-medium text-[#513BE2]">{payoutMode === 'INSTANT' ? 'Instant (no reserve)' : 'Rolling reserve'}</span></div>
				<div class="flex justify-between"><span class="text-gray-500">Risk tier</span><span class="font-medium text-gray-800">{payoutTier}</span></div>
				{#if payoutMode === 'ROLLING'}
					<div class="flex justify-between"><span class="text-gray-500">Reserve</span><span class="font-medium text-gray-800">{payoutReservePercent}% of each sale</span></div>
					<div class="flex justify-between"><span class="text-gray-500">Released</span><span class="font-medium text-gray-800">{payoutDelayDays} day{payoutDelayDays === 1 ? '' : 's'} after event ends</span></div>
				{:else if payoutEaseExpiry}
					<div class="flex justify-between border-t border-[#EADDFB] pt-2"><span class="text-gray-500">Expires</span><span class="font-semibold text-gray-900">{fmtDate(payoutEaseExpiry)}</span></div>
				{:else}
					<div class="flex justify-between border-t border-[#EADDFB] pt-2"><span class="text-gray-500">Expires</span><span class="font-semibold text-[#EAAB26]">Never — permanent grant</span></div>
				{/if}
				{#if payoutReason.trim()}
					<div class="border-t border-[#EADDFB] pt-2"><span class="text-gray-500">Reason</span><p class="mt-0.5 text-gray-800">{payoutReason.trim()}</p></div>
				{/if}
			</div>

			<p class="mt-3 text-xs text-gray-400">
				Applies to future ticket sales. Funds already held keep their existing release dates —
				use “Release held funds now” if you also want to free those.
			</p>

			{#if payoutError}
				<div class="mt-3 rounded-lg bg-[#FDEAEA] px-3 py-2 text-xs text-[#E53935]">{payoutError}</div>
			{/if}

			<div class="mt-6 flex justify-end gap-2">
				<button on:click={() => (showPayoutConfirm = false)} disabled={payoutUpdating}
					class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Cancel</button>
				<button on:click={confirmPayoutUpdate} disabled={payoutUpdating}
					class="rounded-lg bg-[#513BE2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4230bd] disabled:opacity-50">
					{payoutUpdating ? 'Working…' : 'Confirm'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Release Held Funds Confirmation (FE-P5-03) -->
{#if showReleaseConfirm && selectedUser && userPayout}
	<div on:click={() => !payoutUpdating && (showReleaseConfirm = false)} on:keydown={(e) => e.key === 'Escape' && !payoutUpdating && (showReleaseConfirm = false)}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<h3 class="text-lg font-semibold text-gray-900">Release held funds now?</h3>
			<p class="mt-1 text-sm text-gray-500">
				This immediately makes every held reserve for
				<span class="font-medium text-gray-800">{selectedUser.name || selectedUser.email}</span>
				withdrawable, ahead of its scheduled release date.
			</p>

			<div class="mt-4 space-y-2 rounded-xl bg-[#F9F5FF] p-4 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-500">Amount to release</span>
					<span class="font-semibold text-gray-900">{totalHeldLabel(userPayout)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Holds affected</span>
					<span class="font-medium text-gray-800">{userPayout.outstanding.reduce((n, c) => n + c.holdCount, 0)}</span>
				</div>
			</div>

			<div class="mt-3 rounded-xl bg-[#FFF6E5] p-3 text-xs text-[#8A6A12]">
				This reserve was taken to cover refunds and chargebacks on sales that may not have cleared
				their dispute window yet. Once released, the organizer can withdraw it and the platform
				carries that exposure.
			</div>

			<label class="mt-4 block">
				<span class="text-xs text-[#C1C2C2]">Reason (required — recorded on the audit trail)</span>
				<input
					type="text"
					bind:value={releaseReason}
					disabled={payoutUpdating}
					placeholder="e.g. Event completed, organizer needs vendor settlement funds"
					class="mt-1 h-[38px] w-full rounded-lg border border-gray-200 px-3 text-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none disabled:opacity-50"
				/>
			</label>

			{#if payoutError}
				<div class="mt-3 rounded-lg bg-[#FDEAEA] px-3 py-2 text-xs text-[#E53935]">{payoutError}</div>
			{/if}

			<div class="mt-6 flex justify-end gap-2">
				<button on:click={() => (showReleaseConfirm = false)} disabled={payoutUpdating}
					class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Cancel</button>
				<button on:click={confirmReleaseHolds} disabled={payoutUpdating || releaseReason.trim().length < 3}
					class="rounded-lg bg-[#F31A7C] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#d1176b] disabled:opacity-50">
					{payoutUpdating ? 'Releasing…' : 'Confirm Release'}
				</button>
			</div>
		</div>
	</div>
{/if}
