<script lang="ts">
	import { getActiveProfile } from '$lib/services/profile.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AcceptedCollaborations from './Components/AcceptedCollaborations.svelte';
	import InboundInvitations from './Components/InboundInvitations.svelte';
	import SentRequests from './Components/SentRequests.svelte';

	let speakerName = 'Speaker';
	let photoUrl = '';
	let speakerProfilePictureUrl = '';
	let headerLoading = true;
	let activeTab = 'inbound';

	const tabs = [
		{ id: 'inbound', label: 'Inbound Invitations', icon: 'mdi:inbox-arrow-down' },
		{ id: 'sent', label: 'Sent Collaboration Requests', icon: 'mdi:send-outline' },
		{ id: 'accepted', label: 'Accepted Collaborations', icon: 'mdi:check-decagram-outline' },
	];

	onMount(async () => {
		try {
			const profile = await getActiveProfile();
			const sd = (profile as any)?.speakerDetails;
			speakerName = sd?.fullName || profile?.name || 'Speaker';
			photoUrl = sd?.profilePhotoUrl || profile?.profilePictureUrl || '';
			speakerProfilePictureUrl = profile?.profilePictureUrl || sd?.profilePhotoUrl || '';
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
			{#if photoUrl}
				<img src={photoUrl} alt="logo" class="h-9 w-9 rounded-lg object-cover" />
			{:else}
				<img src="/tech-icon.svg" alt="logo" class="h-9 w-9 rounded-lg object-cover" />
			{/if}
			<h1 class="text-2xl font-bold text-gray-900">{speakerName}</h1>
		{/if}
	</div>

	<!-- Tabs — same pattern as vendor collab page -->
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
		<InboundInvitations />
	{:else if activeTab === 'sent'}
		<SentRequests {speakerName} {speakerProfilePictureUrl} />
	{:else if activeTab === 'accepted'}
		<AcceptedCollaborations />
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar { height: 0; }
	.custom-scrollbar { scrollbar-width: none; }
</style>
