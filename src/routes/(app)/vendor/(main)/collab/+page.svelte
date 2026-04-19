<script lang="ts">
	import { getActiveProfile, type UserProfileData } from '$lib/services/profile.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AcceptedCollaborations from './components/AcceptedCollaborations.svelte';
	import InboundOrders from './components/InboundOrders.svelte';
	import SentRequests from './components/SentRequests.svelte';

	let vendorName = '';
	let logoUrl = '';
	let vendorProfilePictureUrl = '';
	let headerLoading = true;
	let activeTab = 'inbound';

	const tabs = [
		{ id: 'inbound', label: 'Inbound Requests', icon: 'mdi:inbox-arrow-down' },
		{ id: 'accepted', label: 'Accepted Collaborations', icon: 'mdi:check-decagram-outline' },
		{ id: 'sent', label: 'Sent Requests', icon: 'mdi:send-outline' },
	];

	onMount(async () => {
		try {
			const profile = await getActiveProfile();
			const vd = (profile as any)?.vendorDetails;
			vendorName = vd?.businessName || profile?.name || 'Vendor';
			logoUrl = vd?.logoUrl || profile?.profilePictureUrl || '';
			vendorProfilePictureUrl = profile?.profilePictureUrl || vd?.logoUrl || '';
		} catch { /* silent */ }
		finally { headerLoading = false; }
	});
</script>

<div class="w-full">
	<!-- Header -->
	<div class="mb-6 flex items-center gap-3">
		{#if headerLoading}
			<div class="h-9 w-9 animate-pulse rounded-lg bg-gray-200"></div>
			<div class="h-6 w-40 animate-pulse rounded bg-gray-200"></div>
		{:else}
			{#if logoUrl}
				<img src={logoUrl} alt="logo" class="h-9 w-9 rounded-lg object-cover" />
			{:else}
				<img src="/loader.svg" alt="logo" class="h-9 w-9 rounded-lg object-cover" />
			{/if}
			<h1 class="text-2xl font-bold text-gray-900">{vendorName}</h1>
		{/if}
	</div>

	<!-- Tabs -->
	<div class="mb-8">
		<nav class="custom-scrollbar -mx-4 flex overflow-x-auto border-b border-gray-200 px-4 sm:mx-0 sm:px-0">
			{#each tabs as tab}
				<button
					on:click={() => (activeTab = tab.id)}
					class="flex flex-shrink-0 items-center gap-2 border-b-2 px-4 pb-3 pt-1 text-sm font-medium whitespace-nowrap transition-colors
						{activeTab === tab.id
						? 'border-[#DB3EC6] text-[#DB3EC6]'
						: 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					<Icon icon={tab.icon} class="h-4 w-4" />
					{tab.label}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Content -->
	{#if activeTab === 'inbound'}
		<InboundOrders />
	{:else if activeTab === 'accepted'}
		<AcceptedCollaborations />
	{:else if activeTab === 'sent'}
		<SentRequests {vendorName} {vendorProfilePictureUrl} />
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar { height: 0; }
</style>
