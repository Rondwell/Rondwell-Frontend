<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import ProfileSwitchOverlay from '$lib/components/ProfileSwitchOverlay.svelte';
	import { getActiveProfile, getAllProfiles, switchProfile, type UserProfileData } from '$lib/services/profile.services';
	import { getWalletBalance } from '$lib/services/wallet.services';
	import { authState, logout, isAuthenticated, setActiveProfile } from '$lib/stores/auth.store';
	import { onMount } from 'svelte';

	export let showMenu = false;
	export let className = 'fixed bottom-10 left-30 hidden md:block';

	const ALL_ROLES: Array<'ORGANIZER' | 'VENDOR' | 'EXHIBITOR' | 'SPEAKER'> = ['ORGANIZER', 'VENDOR', 'EXHIBITOR', 'SPEAKER'];

	const ROLE_CONFIG: Record<string, { color: string; bg: string; path: string }> = {
		ORGANIZER: { color: '#7C3AED', bg: '#EFEBFF', path: '/overview' },
		VENDOR:    { color: '#146AEB', bg: '#E2E8FC', path: '/vendor' },
		EXHIBITOR: { color: '#3CBD2C', bg: '#E3F4E1', path: '/exhibitor' },
		SPEAKER:   { color: '#AB46DD', bg: 'rgba(171,70,221,0.1)', path: '/speaker' },
	};

	const ROLE_ICONS: Record<string, string> = {
		ORGANIZER: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
		VENDOR: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
		EXHIBITOR: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`,
		SPEAKER: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
	};

	let allProfiles: UserProfileData[] = [];
	let showAll = false;
	let loading = false;
	let showWalletBalance = true;
	let walletBalance = 0;
	let switching = false;
	let switchingRole = '';
	let switchingColor = '#513BE2';

	$: user = $authState.user;
	$: activeProfile = $authState.activeProfile;
	$: token = $authState.token;
	$: activeRole = activeProfile?.role ?? 'ORGANIZER';

	// Build the switchable profiles list: all roles EXCEPT the currently active one
	$: switchableProfiles = ALL_ROLES
		.filter((role) => role !== activeRole)
		.map((role) => {
			const found = allProfiles.find((p) => p.role === role);
			return { role, profile: found ?? null };
		});

	$: displayedProfiles = showAll ? switchableProfiles : switchableProfiles.slice(0, 2);

	$: avatarUrl = activeProfile?.profilePictureUrl || '/you-rondwell.png';
	$: activeCfg = ROLE_CONFIG[activeRole] || ROLE_CONFIG.ORGANIZER;

	// Get display name for a profile, preferring business/company name for vendor/exhibitor
	function getProfileDisplayName(role: string, profile: any): string {
		if (!profile) return role.charAt(0) + role.slice(1).toLowerCase();
		if (role === 'VENDOR') {
			return profile.vendorDetails?.businessName || profile.name || 'Vendor';
		}
		if (role === 'EXHIBITOR') {
			return profile.exhibitorDetails?.companyName || profile.exhibitorDetails?.businessName || profile.name || 'Exhibitor';
		}
		return profile.name || role.charAt(0) + role.slice(1).toLowerCase();
	}

	// Get display name for the active profile header
	$: activeDisplayName = getProfileDisplayName(activeRole, activeProfile);

	$: formattedBalance = showWalletBalance
		? `N${walletBalance.toLocaleString()}`
		: '••••••';

	onMount(async () => {
		if (!token) return;
		loading = true;
		try {
			const [active, all] = await Promise.all([
				getActiveProfile(),
				getAllProfiles(),
			]);
			setActiveProfile(active);
			allProfiles = all;
		} catch (e) {
			console.error('Failed to load profiles', e);
		} finally {
			loading = false;
		}
		try {
			const wallet = await getWalletBalance();
			const agg = wallet?.aggregatedBalance;
			// Canonical NET wallet balance in naira. `aggregatedBalance.totalEarnings`
			// is now the net wallet balance (major units); fall back to converting
			// the raw kobo balance if the aggregate is unavailable.
			walletBalance = agg?.totalEarnings ?? ((Number(wallet?.balance?.NGN ?? 0)) / 100);
		} catch (e) {
			console.error('Failed to load wallet balance', e);
		}
	});

	function onClose() {
		showMenu = false;
	}

	async function handleProfileClick(role: string, profile: UserProfileData | null) {
		const cfg = ROLE_CONFIG[role];
		const rolePath = cfg?.path || '/overview';

		// For non-organizer roles without a profile, go to onboarding
		if (role !== 'ORGANIZER' && !profile) {
			goto(`/${role.toLowerCase()}/onboarding`);
			onClose();
			return;
		}
		if (role !== 'ORGANIZER' && profile?.onboardingStatus === 'INCOMPLETE') {
			goto(`/${role.toLowerCase()}/onboarding`);
			onClose();
			return;
		}

		// Show switching animation
		switchingRole = role.charAt(0) + role.slice(1).toLowerCase();
		switchingColor = cfg?.color || '#513BE2';
		switching = true;
		onClose();

		// For Organizer, find the organizer profile to switch to
		const targetProfile = profile || allProfiles.find((p) => p.role === role);

		if (token && targetProfile) {
			try {
				const result = await switchProfile(targetProfile._id);
				if (result?.newToken) {
					authState.update((s) => ({ ...s, token: result.newToken }));
					localStorage.setItem('auth_token', result.newToken);
				}
				setActiveProfile(targetProfile);
			} catch (e) {
				console.error('Failed to switch profile', e);
				switching = false;
				return;
			}
		}

		await new Promise((r) => setTimeout(r, 1200));
		await goto(rolePath);
		// Small extra delay to let the new page render before removing overlay
		await new Promise((r) => setTimeout(r, 100));
		switching = false;
	}

	// H-02 — this was `clearUser(); goto('/auth');`, which only wiped
	// localStorage. The refresh token stayed valid server-side for its full
	// 30-day sliding window, so an exfiltrated token survived the victim
	// logging out. `logout()` calls `POST /auth/logout` first, then clears
	// locally whether or not the call succeeded.
	async function handleLogout() {
		await logout();
		goto('/auth');
	}

	function getStatusTag(role: string, profile: UserProfileData | null): 'setup' | 'wrapup' | 'done' {
		// Organizer profile always exists (it's the default)
		if (role === 'ORGANIZER') return 'done';
		if (!profile) return 'setup';
		if (profile.onboardingStatus === 'INCOMPLETE') return 'wrapup';
		return 'done';
	}

	function toggleWalletVisibility() {
		showWalletBalance = !showWalletBalance;
	}
</script>

<ProfileSwitchOverlay visible={switching} roleName={switchingRole} roleColor={switchingColor} />

{#if showMenu}
	<div
		class="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px]"
		on:click={onClose}
		on:keydown={(e) => e.key === 'Escape' && onClose()}
		role="button"
		tabindex="-1"
		aria-label="Close profile menu"
	></div>

	<div
		class:triangle={className.includes('left-30')}
		class="bg custom-scrollbar z-50 max-h-[560px] w-[calc(100vw-2rem)] max-w-[340px] overflow-y-auto p-4 text-sm sm:w-85 sm:p-5 md:w-90 {className}"
	>
		{#if $isAuthenticated}
			<!-- Active Profile Card -->
			<div class="flex items-center gap-3 rounded-2xl border border-black/6 bg-gradient-to-br from-white via-white to-[#F8F6FF] p-3.5 shadow-2xs">
				<img src={avatarUrl} alt={activeDisplayName} class="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-black/8" />
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between gap-2">
						<div class="truncate text-sm font-bold text-[#17161E]">{activeDisplayName}</div>
						<span
							class="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
							style="background-color: {activeCfg.bg}; color: {activeCfg.color};"
						>
							<span class="flex items-center [&>svg]:h-3 [&>svg]:w-3">{@html ROLE_ICONS[activeRole] || ROLE_ICONS.ORGANIZER}</span>
							{activeRole}
						</span>
					</div>
					<div class="mt-0.5 truncate text-xs text-[#6B6878]">{user?.email ?? user?.phoneNumber ?? ''}</div>
				</div>
			</div>

			<!-- Switchable Profiles (excludes the active role) -->
			<div class="mt-3 rounded-2xl border border-black/6 bg-black/[0.025] p-2">
				<p class="px-2 pt-0.5 pb-1.5 text-[10px] font-bold tracking-[0.12em] text-[#7A7787] uppercase">Switch Profile</p>
				{#if loading}
					<div class="py-4 text-center text-xs text-[#6B6878]">Loading profiles...</div>
				{:else}
					<div class="space-y-1">
						{#each displayedProfiles as { role, profile }}
							{@const status = getStatusTag(role, profile)}
							{@const cfg = ROLE_CONFIG[role]}
							<div
								class="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-white hover:shadow-2xs active:scale-[0.99]"
								on:click={() => handleProfileClick(role, profile)}
								on:keydown={(e) => e.key === 'Enter' && handleProfileClick(role, profile)}
								role="button"
								tabindex="0"
							>
								<img
									src={profile?.profilePictureUrl ?? '/you-rondwell.png'}
									alt={role}
									class="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-black/6"
								/>
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between gap-2">
										<div class="truncate text-xs font-semibold text-[#17161E] sm:text-sm">
											{#if status === 'done'}
												{getProfileDisplayName(role, profile)}
											{:else}
												{role.charAt(0) + role.slice(1).toLowerCase()}
											{/if}
										</div>
										{#if status === 'setup'}
											<span class="ml-auto rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-[#6B6878] whitespace-nowrap">Setup</span>
										{:else if status === 'wrapup'}
											<span class="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600 whitespace-nowrap">Wrap Up</span>
										{:else}
											<span class="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap" style="background-color:{cfg.bg};color:{cfg.color}">
												<span class="flex items-center [&>svg]:h-3 [&>svg]:w-3">{@html ROLE_ICONS[role] || ''}</span>
												{role}
											</span>
										{/if}
									</div>
									{#if status === 'done'}
										<div class="mt-0.5 truncate text-[11px] text-[#6B6878]">{user?.email ?? ''}</div>
									{:else}
										<div class="mt-0.5 text-[11px] text-[#7A7787]">Click to {status === 'setup' ? 'set up' : 'complete'} profile</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<button
					type="button"
					on:click={() => (showAll = !showAll)}
					class="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-black/6 bg-white/90 text-xs font-semibold text-[#17161E] shadow-2xs transition hover:bg-white"
				>
					<Icon icon="solar:users-group-rounded-bold-duotone" class="h-4 w-4 text-[#7C3AED]" />
					<span>{showAll ? 'View less' : 'View all profiles'}</span>
				</button>
			</div>

			<!-- Menu Actions -->
			<div class="mt-3 space-y-1">
				<a
					href="/overview"
					on:click={onClose}
					class="group flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 text-[#17161E] no-underline transition-all hover:bg-black/[0.04] active:scale-[0.99]"
				>
					<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E2E8FC] ring-1 ring-black/5">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M6.765 2.13L2.7225 5.2875C2.0475 5.8125 1.5 6.9075 1.5 7.7625V13.3275C1.5 15.0975 2.9325 16.5375 4.7025 16.5375H13.2975C15.0675 16.5375 16.5 15.0975 16.5 13.335V7.875C16.5 6.9575 15.8925 5.8125 15.15 5.295L10.515 2.04C9.465 1.305 7.7775 1.3425 6.765 2.13Z" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M9 13.5375V11.2875" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<span class="font-medium">Dashboard</span>
					<Icon icon="solar:alt-arrow-right-linear" class="ml-auto h-4 w-4 text-[#8E8B99] transition-transform group-hover:translate-x-0.5" />
				</a>

				<div
					class="group flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 text-[#17161E] transition-all hover:bg-black/[0.04] active:scale-[0.99]"
					on:click={() => { goto('/settings?tab=wallet'); onClose(); }}
					on:keydown={(e) => e.key === 'Enter' && (goto('/settings?tab=wallet'), onClose())}
					role="button"
					tabindex="0"
				>
					<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E3F4E1] ring-1 ring-black/5">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M9.75 6.9375H5.25" stroke="#15803D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16.5 8.49V9.5175C16.5 9.8325 16.2525 10.0875 15.93 10.1025H14.4075C13.785 10.1025 13.215 9.6375 13.1625 9.015C13.1275 8.6475 13.2675 8.3025 13.5075 8.0625C13.72 7.845 14.0125 7.72 14.3325 7.72H15.93C16.2525 7.735 16.5 7.99 16.5 8.49Z" stroke="#15803D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M13.5075 8.0625C13.2675 8.3025 13.1275 8.6475 13.1625 9.015C13.215 9.6375 13.785 10.1025 14.4075 10.1025H15.93V11.25C15.93 13.5 14.43 15 12.18 15H5.25C3 15 1.5 13.5 1.5 11.25V6.75C1.5 4.7025 2.7525 3.27 4.6425 3.045C4.8375 3.015 5.04 3 5.25 3H12.18C12.375 3 12.5625 3.0075 12.7425 3.0375C14.655 3.2475 15.93 4.68 15.93 6.75V7.72H14.3325C14.0125 7.72 13.72 7.845 13.5075 8.0625Z" stroke="#15803D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<div class="flex flex-1 items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<span class="font-medium">Wallet</span>
							<span class="rounded-full bg-[#16A34A]/10 px-2.5 py-0.5 text-xs font-bold text-[#15803D]">{formattedBalance}</span>
						</div>
						<button
							type="button"
							on:click|stopPropagation={toggleWalletVisibility}
							class="rounded-lg p-1 text-[#6B6878] transition-colors hover:bg-black/5 hover:text-[#17161E]"
							aria-label={showWalletBalance ? 'Hide wallet balance' : 'Show wallet balance'}
						>
							{#if showWalletBalance}
								<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M11.6849 9C11.6849 10.485 10.4849 11.685 8.99994 11.685C7.51494 11.685 6.31494 10.485 6.31494 9C6.31494 7.515 7.51494 6.315 8.99994 6.315C10.4849 6.315 11.6849 7.515 11.6849 9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.00006 15.2025C11.6476 15.2025 14.1151 13.6425 15.8326 10.9425C16.5076 9.88504 16.5076 8.10754 15.8326 7.05004C14.1151 4.35004 11.6476 2.79004 9.00006 2.79004C6.35256 2.79004 3.88506 4.35004 2.16756 7.05004C1.49256 8.10754 1.49256 9.88504 2.16756 10.9425C3.88506 13.6425 6.35256 15.2025 9.00006 15.2025Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{:else}
								<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M10.9425 7.0575L7.0575 10.9425C6.585 10.47 6.3 9.8325 6.3 9.105C6.3 7.6425 7.4925 6.45 8.955 6.45C9.6825 6.45 10.32 6.735 10.9425 7.0575Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.3575 4.3275C12.0375 3.3375 10.5375 2.7975 9 2.7975C6.3525 2.7975 3.885 4.3575 2.1675 7.0575C1.4925 8.115 1.4925 9.8925 2.1675 10.95C2.76 11.8725 3.4425 12.675 4.185 13.32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.3 14.6475C7.1475 15.0375 8.0625 15.2475 9 15.2475C11.6475 15.2475 14.115 13.6875 15.8325 10.9875C16.5075 9.93 16.5075 8.1525 15.8325 7.095C15.585 6.7125 15.315 6.3525 15.0375 6.015" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6325 9.525C11.4375 10.575 10.575 11.4375 9.525 11.6325" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.0575 10.9425L1.5 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 1.5L10.9425 7.0575" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{/if}
						</button>
					</div>
				</div>

				<!--
					GAP 9 — "My promotions".

					Lives here rather than in the main sidebar on purpose: it only
					matters to people who promote somebody else's event, which is a
					minority of accounts, and a permanent top-level slot for it would
					be noise for everyone else. Anyone approved as a promoter also
					reaches it straight from the card on the event page.
				-->
				<a
					href="/promotions"
					on:click={onClose}
					class="group flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 text-[#17161E] no-underline transition-all hover:bg-black/[0.04] active:scale-[0.99]"
				>
					<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E0] ring-1 ring-black/5">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M4.16667 8.33073V11.6641C4.16667 12.5845 4.91286 13.3307 5.83333 13.3307H7.08333L11.3092 16.4674C12.1327 17.0785 13.3333 16.4906 13.3333 15.4653V4.52947C13.3333 3.50418 12.1327 2.9163 11.3092 3.52739L7.08333 6.66406H5.83333C4.91286 6.66406 4.16667 7.41026 4.16667 8.33073Z" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M15.8333 7.5C16.5237 8.19036 16.5237 11.8096 15.8333 12.5" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<span class="font-medium">My promotions</span>
					<Icon icon="solar:alt-arrow-right-linear" class="ml-auto h-4 w-4 text-[#8E8B99] transition-transform group-hover:translate-x-0.5" />
				</a>

				<a
					href="/settings"
					on:click={onClose}
					class="group flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 text-[#17161E] no-underline transition-all hover:bg-black/[0.04] active:scale-[0.99]"
				>
					<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFEFF3] ring-1 ring-black/5">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M2.25 6.83594V11.1634C2.25 12.7534 2.25 12.7534 3.75 13.7659L7.875 16.1509C8.4975 16.5109 9.51 16.5109 10.125 16.1509L14.25 13.7659C15.75 12.7534 15.75 12.7534 15.75 11.1709V6.83594C15.75 5.25344 15.75 5.25344 14.25 4.24094L10.125 1.85594C9.51 1.49594 8.4975 1.49594 7.875 1.85594L3.75 4.24094C2.25 5.25344 2.25 5.25344 2.25 6.83594Z" stroke="#4B4857" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#4B4857" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<span class="font-medium">Settings</span>
					<Icon icon="solar:alt-arrow-right-linear" class="ml-auto h-4 w-4 text-[#8E8B99] transition-transform group-hover:translate-x-0.5" />
				</a>
			</div>

			<!-- Logout -->
			<div class="mt-3 border-t border-black/6 pt-2.5">
				<button
					type="button"
					on:click={handleLogout}
					class="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-semibold text-[#DC2626] transition-all hover:bg-[#DC2626]/8 active:scale-[0.99]"
				>
					<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DC2626]/10">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M6.67578 5.66969C6.90828 2.96969 8.29578 1.86719 11.3333 1.86719H11.4308C14.7833 1.86719 16.1258 3.20969 16.1258 6.56219V11.4522C16.1258 14.8047 14.7833 16.1472 11.4308 16.1472H11.3333C8.31828 16.1472 6.93078 15.0597 6.68328 12.4047" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M11.2498 9H2.71484" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M4.3875 6.48438L1.875 8.99688L4.3875 11.5094" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</span>
					<span>Log out</span>
				</button>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-3.5 py-2 text-center">
				<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED]">
					<Icon icon="solar:user-circle-bold-duotone" class="h-7 w-7" />
				</div>
				<div>
					<p class="text-sm font-bold text-[#17161E]">You're not signed in</p>
					<p class="mt-0.5 text-xs text-[#6B6878]">Sign in to switch profiles and manage events.</p>
				</div>
				<a
					href="/auth"
					on:click={onClose}
					class="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#DB3E6C] via-[#963DD4] to-[#513BE2] px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm"
				>
					<span>Sign in</span>
				</a>
			</div>
		{/if}
	</div>
{/if}

<style>
	.bg {
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(24px) saturate(180%);
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.88);
		box-shadow:
			0 24px 60px -12px rgba(18, 15, 36, 0.22),
			0 0 0 1px rgba(18, 15, 36, 0.06);
		border-radius: 26px;
	}
	@media (min-width: 739px) {
		.triangle::before {
			content: '';
			position: absolute;
			left: -16px;
			bottom: 18px;
			border-width: 8px;
			border-style: solid;
			border-color: transparent rgba(255, 255, 255, 0.94) transparent transparent;
		}
		.triangle::after {
			content: '';
			position: absolute;
			left: -17px;
			bottom: 18px;
			border-width: 8px;
			border-style: solid;
			border-color: transparent rgba(18, 15, 36, 0.08) transparent transparent;
			z-index: -1;
		}
	}
</style>
