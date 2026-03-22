<script lang="ts">
	import { goto } from '$app/navigation';
	import { getActiveProfile, getAllProfiles, switchProfile, type UserProfileData } from '$lib/services/profile.services';
	import { authState, clearUser, setActiveProfile } from '$lib/stores/auth.store';
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

	$: user = $authState.user;
	$: activeProfile = $authState.activeProfile;
	$: token = $authState.token;

	$: otherProfiles = OTHER_ROLES.map((role) => {
		const found = allProfiles.find((p) => p.role === role);
		return { role, profile: found ?? null };
	});

	$: displayedOtherProfiles = showAll ? otherProfiles : otherProfiles.slice(0, 2);

	onMount(async () => {
		if (!token) return;
		loading = true;
		try {
			const [active, all] = await Promise.all([
				getActiveProfile(token),
				getAllProfiles(token),
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
			// Switch to this profile
			if (token) {
				try {
					const result = await switchProfile(token, profile._id);
					if (result?.newToken) {
						// Update token in store
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
</script>

{#if showMenu}
	<div
		class="triangle bg custom-scrollbar z-30 max-h-[540px] w-83 overflow-y-auto rounded-xl p-6 text-sm md:w-90 {className}"
	>
		<!-- Active Profile -->
		<div class="flex items-center space-x-3">
			<img src="/you-rondwell.png" alt="profile" class="h-10 w-10 rounded-full object-cover" />
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
			<a href="/settings" on:click={onClose} class="flex cursor-pointer items-center gap-2">
				<div class="flex h-[36px] w-[36px] items-center rounded-full bg-[#E2E4E5] p-2">
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
