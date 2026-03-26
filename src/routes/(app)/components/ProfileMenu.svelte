<script lang="ts">
	import { goto } from '$app/navigation';
	import { getActiveProfile, getAllProfiles, switchProfile, type UserProfileData } from '$lib/services/profile.services';
	import { authState, clearUser, isAuthenticated, setActiveProfile } from '$lib/stores/auth.store';
	import { onMount } from 'svelte';

	export let showMenu = false;
	export let className = 'fixed bottom-10 left-30 hidden md:block';

	const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
		VENDOR:    { color: '#146AEB', bg: '#E2E8FC' },
		EXHIBITOR: { color: '#3CBD2C', bg: '#E3F4E1' },
		SPEAKER:   { color: '#AB46DD', bg: 'rgba(171,70,221,0.1)' },
		ORGANIZER: { color: '#7C3AED', bg: '#EFEBFF' },
	};

	const OTHER_ROLES: Array<'VENDOR' | 'EXHIBITOR' | 'SPEAKER'> = ['VENDOR', 'EXHIBITOR', 'SPEAKER'];

	let allProfiles: UserProfileData[] = [];
	let showAll = false;
	let loading = false;
	let showWalletBalance = true;
	let walletBalance = 200000;

	$: user = $authState.user;
	$: activeProfile = $authState.activeProfile;
	$: token = $authState.token;

	$: otherProfiles = OTHER_ROLES.map((role) => {
		const found = allProfiles.find((p) => p.role === role);
		return { role, profile: found ?? null };
	});

	$: displayedOtherProfiles = showAll ? otherProfiles : otherProfiles.slice(0, 2);

	$: avatarUrl = activeProfile?.profilePictureUrl || '/you-rondwell.png';

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
	});

	function onClose() {
		showMenu = false;
	}

	async function handleProfileClick(role: 'VENDOR' | 'EXHIBITOR' | 'SPEAKER', profile: UserProfileData | null) {
		const rolePath = role.toLowerCase();
		if (!profile) {
			goto(`/${rolePath}/onboarding`);
		} else if (profile.onboardingStatus === 'INCOMPLETE') {
			goto(`/${rolePath}/onboarding`);
		} else {
			if (token) {
				try {
					const result = await switchProfile(profile._id);
					if (result?.newToken) {
						authState.update((s) => ({ ...s, token: result.newToken }));
						localStorage.setItem('auth_token', result.newToken);
					}
					setActiveProfile(profile);
				} catch (e) {
					console.error('Failed to switch profile', e);
				}
			}
			goto(`/${rolePath}`);
		}
		onClose();
	}

	function handleLogout() {
		clearUser();
		goto('/auth');
	}

	function getStatusTag(profile: UserProfileData | null): 'setup' | 'wrapup' | 'done' {
		if (!profile) return 'setup';
		if (profile.onboardingStatus === 'INCOMPLETE') return 'wrapup';
		return 'done';
	}

	function toggleWalletVisibility() {
		showWalletBalance = !showWalletBalance;
	}
</script>

{#if showMenu}
	<!-- Blur backdrop -->
	<div
		class="fixed inset-0 z-20 bg-black/10 backdrop-blur-[2px]"
		on:click={onClose}
		on:keydown={(e) => e.key === 'Escape' && onClose()}
		role="button"
		tabindex="-1"
		aria-label="Close profile menu"
	></div>

	<div
		class="triangle bg custom-scrollbar z-30 max-h-[540px] w-83 overflow-y-auto rounded-xl p-6 text-sm md:w-90 {className}"
	>
		{#if $isAuthenticated}
			<!-- Active Profile -->
			<div class="flex items-center space-x-3">
				<img src={avatarUrl} alt="profile" class="h-10 w-10 rounded-full object-cover" />
				<div class="flex-1 min-w-0">
					<div class="flex items-center justify-between gap-2">
						<div class="font-semibold truncate">{activeProfile?.name ?? user?.email ?? 'User'}</div>
						<span class="ml-auto flex items-center gap-1 bg-[#EFEBFF] text-xs font-semibold text-purple-600 rounded-md px-2 py-1 whitespace-nowrap">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
							{activeProfile?.role ?? 'ORGANIZER'}
						</span>
					</div>
					<div class="text-xs font-light text-gray-500 truncate">{user?.email ?? user?.phoneNumber ?? ''}</div>
				</div>
			</div>

			<!-- Switchable Profiles -->
			<div class="mt-4 space-y-2 rounded-md bg-[#FFFFFF] p-2 shadow-sm">
				{#if loading}
					<div class="py-4 text-center text-xs text-gray-400">Loading profiles...</div>
				{:else}
					{#each displayedOtherProfiles as { role, profile }}
						{@const status = getStatusTag(profile)}
						{@const cfg = ROLE_CONFIG[role]}
						<div
							class="selected flex cursor-pointer items-center p-2 transition"
							on:click={() => handleProfileClick(role, profile)}
							on:keydown={(e) => e.key === 'Enter' && handleProfileClick(role, profile)}
							role="button"
							tabindex="0"
						>
							<img
								src={profile?.profilePictureUrl ?? '/you-rondwell.png'}
								alt="profile"
								class="h-8 w-8 rounded-full object-cover"
							/>
							<div class="ml-3 flex-1 min-w-0">
								<div class="flex items-center justify-between gap-2">
									<div class="text-sm font-medium truncate">
										{#if status === 'done'}
											{profile?.name}
										{:else}
											{role.charAt(0) + role.slice(1).toLowerCase()}
										{/if}
									</div>
									{#if status === 'setup'}
										<span class="ml-auto rounded-md px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-500 whitespace-nowrap">Setup</span>
									{:else if status === 'wrapup'}
										<span class="ml-auto rounded-md px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-600 whitespace-nowrap">Wrap Up</span>
									{:else}
										<span class="ml-auto rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap" style="background-color:{cfg.bg};color:{cfg.color}">{role}</span>
									{/if}
								</div>
								{#if status === 'done'}
									<div class="mt-1 text-xs font-light text-gray-500 truncate">{user?.email ?? ''}</div>
								{:else}
									<div class="mt-1 text-xs font-light text-gray-400">Click to {status === 'setup' ? 'set up' : 'complete'} profile</div>
								{/if}
							</div>
						</div>
					{/each}
				{/if}

				<div class="mt-3 border-t pt-3">
					<button
						on:click={() => (showAll = !showAll)}
						class="flex h-[36px] w-full items-center justify-center gap-2 rounded-sm bg-[#EBECED] text-center text-sm"
					>
						<img src="/profile-2.svg" alt="icon" />
						{showAll ? 'View less' : 'View all profiles'}
					</button>
				</div>
			</div>

			<!-- Menu Actions -->
			<div class="mt-4 space-y-3">
				<!-- Dashboard -->
				<a href="/overview" on:click={onClose} class="flex cursor-pointer items-center gap-2">
					<div class="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#E2E8FC]">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M6.765 2.13L2.7225 5.2875C2.0475 5.8125 1.5 6.9075 1.5 7.7625V13.3275C1.5 15.0975 2.9325 16.5375 4.7025 16.5375H13.2975C15.0675 16.5375 16.5 15.0975 16.5 13.335V7.875C16.5 6.9575 15.8925 5.8125 15.15 5.295L10.515 2.04C9.465 1.305 7.7775 1.3425 6.765 2.13Z" stroke="#2A2D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M9 13.5375V11.2875" stroke="#2A2D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<span>Dashboard</span>
				</a>

				<!-- Wallet -->
				<div class="flex cursor-pointer items-center gap-2">
					<div class="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#E3F4E1]">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M9.75 6.9375H5.25" stroke="#2A2D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16.5 8.49V9.5175C16.5 9.8325 16.2525 10.0875 15.93 10.1025H14.4075C13.785 10.1025 13.215 9.6375 13.1625 9.015C13.1275 8.6475 13.2675 8.3025 13.5075 8.0625C13.72 7.845 14.0125 7.72 14.3325 7.72H15.93C16.2525 7.735 16.5 7.99 16.5 8.49Z" stroke="#2A2D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M13.5075 8.0625C13.2675 8.3025 13.1275 8.6475 13.1625 9.015C13.215 9.6375 13.785 10.1025 14.4075 10.1025H15.93V11.25C15.93 13.5 14.43 15 12.18 15H5.25C3 15 1.5 13.5 1.5 11.25V6.75C1.5 4.7025 2.7525 3.27 4.6425 3.045C4.8375 3.015 5.04 3 5.25 3H12.18C12.375 3 12.5625 3.0075 12.7425 3.0375C14.655 3.2475 15.93 4.68 15.93 6.75V7.72H14.3325C14.0125 7.72 13.72 7.845 13.5075 8.0625Z" stroke="#2A2D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<div class="flex flex-1 items-center justify-between">
						<div class="flex items-center gap-2">
							<span>Wallet</span>
							<span class="text-xs font-semibold text-[#3CBD2C]">{formattedBalance}</span>
						</div>
						<button
							on:click|stopPropagation={toggleWalletVisibility}
							class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
							aria-label={showWalletBalance ? 'Hide wallet balance' : 'Show wallet balance'}
						>
							{#if showWalletBalance}
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M11.6849 9C11.6849 10.485 10.4849 11.685 8.99994 11.685C7.51494 11.685 6.31494 10.485 6.31494 9C6.31494 7.515 7.51494 6.315 8.99994 6.315C10.4849 6.315 11.6849 7.515 11.6849 9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M9.00006 15.2025C11.6476 15.2025 14.1151 13.6425 15.8326 10.9425C16.5076 9.88504 16.5076 8.10754 15.8326 7.05004C14.1151 4.35004 11.6476 2.79004 9.00006 2.79004C6.35256 2.79004 3.88506 4.35004 2.16756 7.05004C1.49256 8.10754 1.49256 9.88504 2.16756 10.9425C3.88506 13.6425 6.35256 15.2025 9.00006 15.2025Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							{:else}
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10.9425 7.0575L7.0575 10.9425C6.585 10.47 6.3 9.8325 6.3 9.105C6.3 7.6425 7.4925 6.45 8.955 6.45C9.6825 6.45 10.32 6.735 10.9425 7.0575Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M13.3575 4.3275C12.0375 3.3375 10.5375 2.7975 9 2.7975C6.3525 2.7975 3.885 4.3575 2.1675 7.0575C1.4925 8.115 1.4925 9.8925 2.1675 10.95C2.76 11.8725 3.4425 12.675 4.185 13.32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M6.3 14.6475C7.1475 15.0375 8.0625 15.2475 9 15.2475C11.6475 15.2475 14.115 13.6875 15.8325 10.9875C16.5075 9.93 16.5075 8.1525 15.8325 7.095C15.585 6.7125 15.315 6.3525 15.0375 6.015" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M11.6325 9.525C11.4375 10.575 10.575 11.4375 9.525 11.6325" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.0575 10.9425L1.5 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M16.5 1.5L10.9425 7.0575" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<!-- Settings -->
				<a href="/settings" on:click={onClose} class="flex cursor-pointer items-center gap-2">
					<div class="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#E2E4E5]">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M2.25 6.83594V11.1634C2.25 12.7534 2.25 12.7534 3.75 13.7659L7.875 16.1509C8.4975 16.5109 9.51 16.5109 10.125 16.1509L14.25 13.7659C15.75 12.7534 15.75 12.7534 15.75 11.1709V6.83594C15.75 5.25344 15.75 5.25344 14.25 4.24094L10.125 1.85594C9.51 1.49594 8.4975 1.49594 7.875 1.85594L3.75 4.24094C2.25 5.25344 2.25 5.25344 2.25 6.83594Z" stroke="#2A2D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#2A2D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<span>Settings</span>
				</a>
			</div>

			<!-- Logout -->
			<div class="mt-4 border-t pt-4">
				<button
					on:click={handleLogout}
					class="flex w-full cursor-pointer items-center space-x-3 rounded p-2 text-sm text-red-600 hover:bg-red-50"
				>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M6.67578 5.66969C6.90828 2.96969 8.29578 1.86719 11.3333 1.86719H11.4308C14.7833 1.86719 16.1258 3.20969 16.1258 6.56219V11.4522C16.1258 14.8047 14.7833 16.1472 11.4308 16.1472H11.3333C8.31828 16.1472 6.93078 15.0597 6.68328 12.4047" stroke="#FF0004" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M11.2498 9H2.71484" stroke="#FF0004" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M4.3875 6.48438L1.875 8.99688L4.3875 11.5094" stroke="#FF0004" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span>Log out</span>
				</button>
			</div>
		{:else}
			<!-- Not authenticated: show Sign in -->
			<div class="flex flex-col items-center gap-4 py-2">
				<p class="text-sm text-gray-500">You're not signed in</p>
				<a
					href="/auth"
					on:click={onClose}
					class="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white"
					style="background: linear-gradient(90deg, #DB3EC6 0%, #963DD4 50%, #513BE2 100%);"
				>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M6.67578 5.66969C6.90828 2.96969 8.29578 1.86719 11.3333 1.86719H11.4308C14.7833 1.86719 16.1258 3.20969 16.1258 6.56219V11.4522C16.1258 14.8047 14.7833 16.1472 11.4308 16.1472H11.3333C8.31828 16.1472 6.93078 15.0597 6.68328 12.4047" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M11.2498 9H2.71484" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M4.3875 6.48438L1.875 8.99688L4.3875 11.5094" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Sign in
				</a>
			</div>
		{/if}
	</div>
{/if}

<style>
	.bg {
		background: #f4f5f6;
		box-shadow: 0px 0px 80px rgba(0, 0, 0, 0.08);
		border-radius: 8px;
	}

	.selected:hover {
		background: #f9f9f9;
		box-shadow: inset 0px 0px 0px 3px #ffffff;
		border-radius: 11px;
	}

	@media (min-width: 739px) {
		.triangle::before {
			content: '';
			position: absolute;
			left: -18px;
			bottom: 16px;
			border-width: 8px;
			border-style: solid;
			border-color: transparent #f8f8f8 transparent transparent;
		}
		.triangle::after {
			content: '';
			position: absolute;
			left: -18px;
			bottom: 16px;
			border-width: 8px;
			border-style: solid;
			border-color: transparent rgba(0, 0, 0, 0.08) transparent transparent;
			z-index: -1;
		}
	}
</style>
