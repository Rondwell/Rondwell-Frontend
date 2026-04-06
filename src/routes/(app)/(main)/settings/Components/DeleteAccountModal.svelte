<script lang="ts">
	import { goto } from '$app/navigation';
	import { deleteAccount } from '$lib/services/settings.services';
	import { clearUser } from '$lib/stores/auth.store';
	import Icon from '@iconify/svelte';

	export let open = false;

	let confirmText = '';
	let saving = false;
	let error = '';

	$: canDelete = confirmText === 'I CONFIRM';

	function close() {
		open = false;
		confirmText = '';
		error = '';
	}

	async function handleDelete() {
		if (!canDelete) return;
		saving = true;
		error = '';
		try {
			await deleteAccount();
			clearUser();
			close();
			goto('/auth');
		} catch (e: any) {
			error = e.message || 'Failed to delete account';
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<div
		on:click={close}
		on:keydown={(e) => e.key === 'Escape' && close()}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3F2]">
				<Icon icon="mdi:alert-outline" class="text-2xl text-[#D92D20]" />
			</div>

			<h2 class="text-lg font-semibold text-gray-900">Delete Account</h2>
			<p class="mt-2 text-sm text-gray-500">
				This will permanently delete your account and all associated data including events, collections, registrations, payment records, and sessions. This action cannot be undone.
			</p>

			<div class="mt-4">
				<label for="confirm-delete" class="mb-1.5 block text-sm font-medium text-gray-700">
					Type <span class="font-semibold text-[#D92D20]">I CONFIRM</span> to proceed
				</label>
				<input
					id="confirm-delete"
					type="text"
					bind:value={confirmText}
					placeholder="I CONFIRM"
					class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400"
					autocomplete="off"
				/>
			</div>

			{#if error}
				<p class="mt-3 text-sm text-red-500">{error}</p>
			{/if}

			<div class="mt-5 flex gap-3">
				<button
					on:click={close}
					class="flex-1 rounded-lg bg-[#F0F1F1] py-2.5 text-sm font-medium text-[#727375] transition hover:bg-gray-200"
				>
					Cancel
				</button>
				<button
					on:click={handleDelete}
					disabled={!canDelete || saving}
					class="flex-1 rounded-lg bg-[#D92D20] py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{saving ? 'Deleting...' : 'Delete Account'}
				</button>
			</div>
		</div>
	</div>
{/if}
