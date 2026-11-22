<script lang="ts">
	import { getActiveProfile, type UserProfileData } from '$lib/services/profile.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import Business from './Components/business.svelte';
	import Notifications from './Components/Notifications.svelte';
	import Payment from './Components/Payment.svelte';
	import { getPersistedTab, persistTab } from '$lib/utils/tabPersistence';

	let activeTab = 'business';
	let exhibitorName = '';
	let logoUrl = '';
	let profileData: UserProfileData | null = null;
	let headerLoading = true;

	const tabs = [
		{ id: 'business', label: 'Business Details', icon: 'mdi:store-outline' },
		{ id: 'payment', label: 'Payment & Price', icon: 'mdi:credit-card-outline' },
		{ id: 'notifications', label: 'Notifications', icon: 'mdi:bell-outline' },
	];

	// Restore the active tab from the URL so it survives a refresh.
	activeTab = getPersistedTab(tabs.map((t) => t.id), activeTab);

	onMount(async () => {
		try {
			const profile = await getActiveProfile();
			profileData = profile;
			const ed = (profile as any)?.exhibitorDetails;
			exhibitorName = ed?.companyName || profile?.name || 'Exhibitor';
			logoUrl = ed?.logoUrl || profile?.profilePictureUrl || '';
		} catch {
			// silent
		} finally {
			headerLoading = false;
		}
	});
</script>

<div class="w-full">
	<!-- Page Header -->
	<div class="mb-6 flex items-center gap-3.5 rounded-2xl border border-white/85 bg-white/80 p-4 shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md sm:px-5">
		{#if headerLoading}
			<div class="h-10 w-10 animate-pulse rounded-2xl bg-black/8"></div>
			<div class="space-y-1.5">
				<div class="h-2.5 w-16 animate-pulse rounded bg-black/6"></div>
				<div class="h-5 w-40 animate-pulse rounded bg-black/8"></div>
			</div>
		{:else}
			{#if logoUrl}
				<img src={logoUrl} alt="logo" class="h-10 w-10 rounded-2xl object-cover ring-1 ring-black/8 shadow-xs" />
			{:else}
				<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] text-white shadow-xs ring-1 ring-white/40">
					<Icon icon="solar:buildings-2-bold-duotone" class="h-5 w-5" />
				</div>
			{/if}
			<div>
				<p class="text-[11px] font-semibold tracking-wider text-[#6E6B7B] uppercase">Settings</p>
				<h1 class="text-xl font-bold tracking-tight text-[#17161E] sm:text-2xl">{exhibitorName}</h1>
			</div>
		{/if}
	</div>

	<!-- Navigation Tabs -->
	<div class="mb-7">
		<div class="custom-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
			<nav class="inline-flex min-w-max items-center gap-1 rounded-full bg-white/75 p-1 ring-1 ring-black/8 backdrop-blur-md">
				{#each tabs as tab}
					<button
						on:click={() => { activeTab = tab.id; persistTab(tab.id); }}
						class="inline-flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all sm:text-sm
							{activeTab === tab.id
							? 'bg-[#17161E] text-white shadow-xs'
							: 'text-[#5F5C6D] hover:text-[#17161E]'}"
					>
						<Icon icon={tab.icon} class="h-4 w-4" />
						{tab.label}
					</button>
				{/each}
			</nav>
		</div>
	</div>

	<!-- Content Area -->
	{#if activeTab === 'business'}
		<Business profile={profileData} />
	{:else if activeTab === 'payment'}
		<Payment />
	{:else if activeTab === 'notifications'}
		<Notifications />
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar { height: 0; }
</style>
