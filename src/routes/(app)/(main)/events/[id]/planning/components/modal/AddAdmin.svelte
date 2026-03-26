<script lang="ts">
	import { inviteEventAdmin } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';

	let step: 'search' | 'configure' = 'search';
	let emailSearch = '';
	let selectedEmail = '';
	let adminName = '';
	let showOnEventPage = true;
	let selectedRole = 'EVENT_MANAGER';
	let saving = false;
	let error = '';

	const roles = [
		{ value: 'EVENT_MANAGER', label: 'Manager', desc: 'Full manage access to the event', icon: 'mdi:account-cog-outline' },
		{ value: 'REGISTRATION_MANAGER', label: 'Check-In Only', desc: 'Check in guests and view guest list', icon: 'mdi:clipboard-check-outline', note: 'Requires Rondwell Plus' },
		{ value: 'COMMUNITY_MANAGER', label: 'Community Manager', desc: 'Manage community forums and chats', icon: 'mdi:forum-outline' },
		{ value: 'SUPPORT_MANAGER', label: 'Non-Manager', desc: 'No manage access to event', icon: 'mdi:account-outline' },
	];

	$: if (open) { step = 'search'; emailSearch = ''; selectedEmail = ''; adminName = ''; showOnEventPage = true; selectedRole = 'EVENT_MANAGER'; error = ''; }

	function selectEmail() {
		if (!emailSearch.trim() || !emailSearch.includes('@')) { error = 'Please enter a valid email'; return; }
		selectedEmail = emailSearch.trim();
		error = '';
		step = 'configure';
	}

	async function handleSendInvite() {
		if (!selectedEmail) { error = 'Email is required'; return; }
		saving = true; error = '';
		try {
			await inviteEventAdmin(eventId, { userId: selectedEmail, role: selectedRole, email: selectedEmail });
			dispatch('saved'); open = false;
		} catch (e: any) { error = e.message || 'Failed to send invite'; }
		finally { saving = false; }
	}
</script>

{#if open}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<div class="custom-scrollbar max-h-[80vh] overflow-y-auto px-6 py-6">
		{#if step === 'search'}
		<!-- Step 1: Search/Enter Email -->
		<div class="mb-1 flex items-center justify-between">
			<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100"><img src="/add admin.svg" alt="add admin" class="h-10 w-10" /></div>
			<button on:click={() => (open = false)}><Icon icon="mdi:close" class="text-xl text-gray-400" /></button>
		</div>
		<h2 class="mt-3 text-xl font-semibold">Add Event Admin</h2>
		<p class="mt-1 text-sm text-gray-500">Add a host to highlight them on the event page or to get help managing the event.</p>

		{#if error}<p class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>{/if}

		<div class="mt-4">
			<label class="mb-1 text-sm font-medium text-gray-900">Enter Email or Search</label>
			<input type="email" bind:value={emailSearch} placeholder="Enter email address" on:keydown={(e) => e.key === 'Enter' && selectEmail()} class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none" />
		</div>

		{#if emailSearch.includes('@')}
		<button on:click={selectEmail} class="mt-3 flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left hover:bg-gray-50">
			<Icon icon="mdi:account-circle-outline" class="text-2xl text-gray-400" />
			<div>
				<p class="text-sm font-medium">{emailSearch}</p>
				<p class="text-xs text-gray-400">Invite host via email</p>
			</div>
		</button>
		{:else}
		<div class="mt-6 flex flex-col items-center py-4 text-center">
			<p class="text-sm font-medium text-gray-500">No Suggestions Found</p>
			<p class="text-xs text-gray-400">You can invite host by entering their email address.</p>
		</div>
		{/if}

		{:else}
		<!-- Step 2: Configure Admin -->
		<div class="mb-1 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<button on:click={() => (open = false)} aria-label="Close"><Icon icon="mdi:share-variant" class="text-lg text-gray-500 rotate-180" /></button>
				<span class="font-medium">Configure Admin</span>
			</div>
			<button on:click={() => (open = false)}><Icon icon="mdi:close" class="text-xl text-gray-400" /></button>
		</div>

		<div class="mt-3 flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs">😊</div>
			<div>
				<p class="text-sm font-medium">{selectedEmail}</p>
			</div>
		</div>

		{#if error}<p class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>{/if}

		<!-- Show on Event Page -->
		<div class="mt-4 flex items-center justify-between">
			<span class="text-sm font-medium text-gray-900">Show on the Event Page</span>
			<button aria-label="Toggle event page visibility" on:click={() => (showOnEventPage = !showOnEventPage)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!showOnEventPage} class:bg-gray-800={showOnEventPage}>
				<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={showOnEventPage}></span>
			</button>
		</div>
		<p class="mt-1 text-xs text-gray-400">Help the set up their Rondwell profile so they can appear nicely on the event page.</p>

		<!-- Name -->
		<div class="mt-4 flex items-center gap-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200"><Icon icon="mdi:account-outline" class="text-xl text-gray-400" /></div>
			<input type="text" bind:value={adminName} placeholder="Name" class="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
		</div>

		<!-- Access Control -->
		<p class="mt-5 text-xs text-gray-400">Access Control</p>
		<div class="mt-2 space-y-2">
			{#each roles as role}
			<button on:click={() => (selectedRole = role.value)} class="flex w-full items-center justify-between rounded-lg border p-3 text-left {selectedRole === role.value ? 'border-gray-800' : 'border-gray-200'}">
				<div class="flex items-center gap-2">
					<Icon icon={role.icon} class="text-xl text-gray-500" />
					<div>
						<p class="text-sm font-medium">{role.label}</p>
						<p class="text-xs text-gray-400">{role.desc}</p>
						{#if role.note}<p class="text-xs text-pink-500">{role.note}</p>{/if}
					</div>
				</div>
				<div class="flex h-5 w-5 items-center justify-center rounded {selectedRole === role.value ? 'bg-gray-800' : 'border border-gray-300'}">
					{#if selectedRole === role.value}<Icon icon="mdi:check" class="text-sm text-white" />{/if}
				</div>
			</button>
			{/each}
		</div>

		<!-- Send Invite -->
		<button on:click={handleSendInvite} disabled={saving} class="mt-5 w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
			{saving ? 'Sending...' : 'Send Invite'}
		</button>
		{/if}
	</div>
</div>
</div>
{/if}
