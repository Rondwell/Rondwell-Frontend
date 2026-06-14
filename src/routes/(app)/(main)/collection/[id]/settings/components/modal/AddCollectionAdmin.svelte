<script lang="ts">
	import { COLLECTION_ADMIN_ROLES } from '$lib/constants/collection-admin-roles';
	import { inviteCollectionAdmin } from '$lib/services/collectionAdmin.services';
	import { getUserSubscriptionInfo } from '$lib/services/wallet.services';
	import { isPlanLimitError, mapPlanLimit, type PlanLimitCopy } from '$lib/utils/planLimitErrors';
	import PlanLimitBanner from '$lib/components/PlanLimitBanner.svelte';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let collectionId = '';

	let step: 'search' | 'configure' = 'search';
	let emailSearch = '';
	let selectedEmail = '';
	let adminName = '';
	let personalMessage = '';
	let showOnCollectionPage = true;
	let selectedRole = 'COLLECTION_MANAGER';
	let saving = false;
	let error = '';
	let tier: string = 'FREE';
	let planLimit: PlanLimitCopy | null = null;

	$: if (open) {
		step = 'search';
		emailSearch = '';
		selectedEmail = '';
		adminName = '';
		personalMessage = '';
		showOnCollectionPage = true;
		selectedRole = 'COLLECTION_MANAGER';
		error = '';
		planLimit = null;
	}

	onMount(async () => {
		try {
			const sub = await getUserSubscriptionInfo();
			tier = sub.tier || 'FREE';
		} catch {
			tier = 'FREE';
		}
	});

	function isRoleAllowed(role: { requiresPlus?: boolean }): boolean {
		if (!role.requiresPlus) return true;
		return tier === 'PLUS';
	}

	function selectEmail() {
		const v = emailSearch.trim();
		if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
			error = 'Please enter a valid email';
			return;
		}
		selectedEmail = v;
		error = '';
		step = 'configure';
	}

	function selectRole(role: (typeof COLLECTION_ADMIN_ROLES)[number]) {
		if (!isRoleAllowed(role)) {
			error = `The "${role.label}" role requires Rondwell Plus.`;
			return;
		}
		selectedRole = role.value;
		error = '';
	}

	async function handleSendInvite() {
		if (!selectedEmail) {
			error = 'Email is required';
			return;
		}
		const def = COLLECTION_ADMIN_ROLES.find((r) => r.value === selectedRole);
		if (def && !isRoleAllowed(def)) {
			error = `The "${def.label}" role requires Rondwell Plus.`;
			return;
		}
		saving = true;
		error = '';
		try {
			await inviteCollectionAdmin(collectionId, {
				email: selectedEmail,
				role: selectedRole,
				displayName: adminName.trim() || undefined,
				personalMessage: personalMessage.trim() || undefined,
				showOnCollectionPage
			});
			dispatch('saved');
			open = false;
		} catch (e: any) {
			if (isPlanLimitError(e)) {
				planLimit = mapPlanLimit(e);
			} else {
				error = e.message || 'Failed to send invite';
			}
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<div
		on:click={() => (open = false)}
		on:keydown={(e) => e.key === 'Escape' && (open = false)}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="custom-scrollbar max-h-[80vh] overflow-y-auto px-6 py-6">
				{#if step === 'search'}
					<div class="mb-1 flex items-center justify-between">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
							<Icon icon="mdi:account-multiple-plus-outline" class="text-2xl text-gray-500" />
						</div>
						<button on:click={() => (open = false)}>
							<Icon icon="mdi:close" class="text-xl text-gray-400" />
						</button>
					</div>
					<h2 class="mt-3 text-xl font-semibold">Add Collection Admin</h2>
					<p class="mt-1 text-sm text-gray-500">
						Add a co-manager to help run this collection. They'll receive an email invitation with
						the role you assign and can manage events under the collection.
					</p>

					{#if planLimit}
						<div class="mt-3">
							<PlanLimitBanner copy={planLimit} on:dismiss={() => (planLimit = null)} />
						</div>
					{/if}

					{#if error}
						<p class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
					{/if}

					<div class="mt-4">
						<label class="mb-1 text-sm font-medium text-gray-900">Enter Email</label>
						<input
							type="email"
							bind:value={emailSearch}
							placeholder="Enter email address"
							on:keydown={(e) => e.key === 'Enter' && selectEmail()}
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
						/>
					</div>

					{#if emailSearch.includes('@')}
						<button
							on:click={selectEmail}
							class="mt-3 flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left hover:bg-gray-50"
						>
							<Icon icon="mdi:account-circle-outline" class="text-2xl text-gray-400" />
							<div>
								<p class="text-sm font-medium">{emailSearch}</p>
								<p class="text-xs text-gray-400">Invite admin via email</p>
							</div>
						</button>
					{:else}
						<div class="mt-6 flex flex-col items-center py-4 text-center">
							<p class="text-sm font-medium text-gray-500">No Suggestions Found</p>
							<p class="text-xs text-gray-400">
								You can invite an admin by entering their email address.
							</p>
						</div>
					{/if}
				{:else}
					<div class="mb-1 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<button on:click={() => (step = 'search')} aria-label="Back">
								<Icon icon="mdi:arrow-left" class="text-lg text-gray-500" />
							</button>
							<span class="font-medium">Configure Admin</span>
						</div>
						<button on:click={() => (open = false)}>
							<Icon icon="mdi:close" class="text-xl text-gray-400" />
						</button>
					</div>

					<div class="mt-3 flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs">
							😊
						</div>
						<div>
							<p class="text-sm font-medium">{selectedEmail}</p>
						</div>
					</div>

					{#if planLimit}
						<div class="mt-3">
							<PlanLimitBanner copy={planLimit} on:dismiss={() => (planLimit = null)} />
						</div>
					{/if}

					{#if error}
						<p class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
					{/if}

					<!-- Show on Collection Page -->
					<div class="mt-4 flex items-center justify-between">
						<span class="text-sm font-medium text-gray-900">Show on the Collection Page</span>
						<button
							aria-label="Toggle collection page visibility"
							on:click={() => (showOnCollectionPage = !showOnCollectionPage)}
							class="relative h-6 w-10 rounded-full transition-colors duration-300"
							class:bg-gray-300={!showOnCollectionPage}
							class:bg-gray-800={showOnCollectionPage}
						>
							<span
								class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
								class:translate-x-4={showOnCollectionPage}
							></span>
						</button>
					</div>
					<p class="mt-1 text-xs text-gray-400">
						Display this co-manager on the public collection page so visitors can see who's running
						the collection.
					</p>

					<!-- Name -->
					<div class="mt-4 flex items-center gap-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
							<Icon icon="mdi:account-outline" class="text-xl text-gray-400" />
						</div>
						<input
							type="text"
							bind:value={adminName}
							placeholder="Full name (optional)"
							maxlength="80"
							class="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-400">
						This will be displayed until they update their name on their own profile.
					</p>

					<!-- Personal Message -->
					<div class="mt-4">
						<label class="mb-1 text-xs text-gray-500">Personal message (optional)</label>
						<textarea
							bind:value={personalMessage}
							maxlength="500"
							rows="3"
							placeholder="Add a personal note to the invitation email…"
							class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
						></textarea>
						<p class="mt-1 text-right text-xs text-gray-400">{personalMessage.length}/500</p>
					</div>

					<!-- Access Control -->
					<p class="mt-5 text-xs text-gray-400">Access Control</p>
					<div class="mt-2 space-y-2">
						{#each COLLECTION_ADMIN_ROLES as role}
							{@const allowed = isRoleAllowed(role)}
							<button
								on:click={() => selectRole(role)}
								class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition {selectedRole ===
								role.value
									? 'border-gray-800'
									: 'border-gray-200'} {!allowed ? 'opacity-60' : ''}"
							>
								<div class="flex items-center gap-2">
									<Icon icon={role.icon} class="text-xl text-gray-500" />
									<div>
										<p class="text-sm font-medium">{role.label}</p>
										<p class="text-xs text-gray-400">{role.description}</p>
										{#if role.requiresPlus}
											<p class="text-xs text-pink-500">
												{allowed ? 'Rondwell Plus only' : 'Requires Rondwell Plus'}
											</p>
										{/if}
									</div>
								</div>
								<div
									class="flex h-5 w-5 items-center justify-center rounded {selectedRole === role.value
										? 'bg-gray-800'
										: 'border border-gray-300'}"
								>
									{#if selectedRole === role.value}
										<Icon icon="mdi:check" class="text-sm text-white" />
									{/if}
								</div>
							</button>
						{/each}
					</div>

					<button
						on:click={handleSendInvite}
						disabled={saving}
						class="mt-5 w-full rounded-lg bg-gray-900 py-3 text-center font-medium text-white disabled:opacity-50"
					>
						{saving ? 'Sending…' : 'Send Invite'}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
