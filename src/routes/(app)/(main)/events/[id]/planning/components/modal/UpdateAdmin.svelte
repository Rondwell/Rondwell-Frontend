<script lang="ts">
	import { removeEventAdmin, resendAdminInvite, updateEventAdminPermissions } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';
	export let admin: any = null;

	let showOnEventPage = true;
	let selectedRole = '';
	let saving = false;
	let resending = false;
	let error = '';
	let resendSuccess = '';

	const roles = [
		{ value: 'EVENT_MANAGER', label: 'Manager', desc: 'Full manage access to the event', icon: 'mdi:account-cog-outline' },
		{ value: 'REGISTRATION_MANAGER', label: 'Check-In Only', desc: 'Check in guests and view guest list', icon: 'mdi:clipboard-check-outline', note: 'Requires Rondwell Plus' },
		{ value: 'COMMUNITY_MANAGER', label: 'Community Manager', desc: 'Manage community forums and chats', icon: 'mdi:forum-outline' },
		{ value: 'SUPPORT_MANAGER', label: 'Non-Manager', desc: 'No manage access to event', icon: 'mdi:account-outline' },
	];

	$: if (open && admin) { selectedRole = admin.role || 'EVENT_MANAGER'; showOnEventPage = true; error = ''; resendSuccess = ''; }

	async function handleUpdate() {
		if (!admin?.id) return;
		saving = true; error = '';
		try {
			await updateEventAdminPermissions(eventId, admin.id, { role: selectedRole });
			dispatch('saved'); open = false;
		} catch (e: any) { error = e.message || 'Failed to update admin'; }
		finally { saving = false; }
	}

	async function handleRemove() {
		if (!admin?.id) return;
		if (!confirm(`Remove this admin? They will lose access to manage this event.`)) return;
		try {
			await removeEventAdmin(eventId, admin.id);
			dispatch('saved'); open = false;
		} catch (e: any) { alert(e.message || 'Failed to remove admin'); }
	}

	async function handleResendInvite() {
		if (!admin?.id) return;
		resending = true; resendSuccess = ''; error = '';
		try {
			await resendAdminInvite(eventId, admin.id);
			resendSuccess = 'Invitation resent successfully';
		} catch (e: any) { error = e.message || 'Failed to resend invitation'; }
		finally { resending = false; }
	}
</script>

{#if open && admin}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
	<div class="custom-scrollbar max-h-[80vh] overflow-y-auto px-6 py-6">
		<div class="mb-1 flex items-center justify-between">
			<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100"><img src="/add admin.svg" alt="admin" class="h-10 w-10" /></div>
			<button on:click={() => (open = false)}><Icon icon="mdi:close" class="text-xl text-gray-400" /></button>
		</div>

		<h2 class="mt-3 text-xl font-semibold">Update Admin</h2>
		<div class="mt-2 flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs">😊</div>
			<div>
				<p class="text-sm font-medium">{admin.displayName || admin.email || 'Admin'}</p>
				<p class="text-xs text-gray-400">{admin.email || admin.userId}</p>
			</div>
		</div>

		{#if error}<p class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>{/if}
		{#if resendSuccess}<p class="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-600">{resendSuccess}</p>{/if}

		<!-- Resend Invitation (only for pending admins) -->
		{#if admin.status === 'PENDING'}
		<div class="mt-4 flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
			<div>
				<p class="text-sm font-medium text-orange-800">Invitation Pending</p>
				<p class="text-xs text-orange-600">This admin hasn't accepted the invite yet.</p>
			</div>
			<button on:click={handleResendInvite} disabled={resending} class="flex-shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">
				{resending ? 'Sending...' : 'Resend Invite'}
			</button>
		</div>
		{/if}

		<!-- Show on Event Page -->
		<div class="mt-4 flex items-center justify-between">
			<span class="text-sm font-medium text-gray-900">Show on the Event Page</span>
			<button aria-label="Toggle visibility" on:click={() => (showOnEventPage = !showOnEventPage)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!showOnEventPage} class:bg-gray-800={showOnEventPage}>
				<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={showOnEventPage}></span>
			</button>
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

		<!-- Actions -->
		<div class="mt-5 flex items-center gap-3">
			<button on:click={handleUpdate} disabled={saving} class="flex-1 rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50">
				{saving ? 'Updating...' : 'Update Admin'}
			</button>
			<button on:click={handleRemove} class="rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50">
				Remove Admin
			</button>
		</div>
	</div>
</div>
</div>
{/if}
