<script lang="ts">
	import { goto } from '$app/navigation';
	import { getMyCollections } from '$lib/services/event.services';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let open: boolean = false;

	interface CollectionOption {
		id: string;
		label: string;
		icon: string;
	}

	let options: CollectionOption[] = [];
	let loadingCollections = false;
	let selectedId = '';
	let selectedLabel = 'Personal Collection';

	const dispatch = createEventDispatcher();

	async function fetchCollections() {
		if (!$isAuthenticated) return;
		loadingCollections = true;
		try {
			const collections = await getMyCollections();
			options = collections.map((c: any) => ({
				id: c._id ?? c.id,
				label: c.name ?? 'Unnamed Collection',
				icon: c.profilePictureUrl ?? c.coverBannerUrl ?? '/rondwell-attendee.png'
			}));
			if (options.length > 0 && !selectedId) {
				selectedId = options[0].id;
				selectedLabel = options[0].label;
			}
		} catch {
			options = [];
		} finally {
			loadingCollections = false;
		}
	}

	$: if (open) fetchCollections();

	function select(option: CollectionOption) {
		selectedId = option.id;
		selectedLabel = option.label;
		dispatch('select', { id: option.id, label: option.label });
	}
</script>

{#if open}
	<div class="triangle absolute z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">

			{#if !$isAuthenticated}
				<!-- Not logged in state -->
				<div class="flex flex-col items-center gap-3 py-2">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F0F0]">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zM20.59 22c0-3.87-3.85-7-8.59-7s-8.59 3.13-8.59 7" stroke="#848384" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</div>
					<p class="text-center text-sm text-[#848384]">
						Sign in to select a collection for your event
					</p>
					<a
						href="/auth?redirect=/create-event"
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white no-underline transition hover:bg-gray-800"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M8.9 7.56c.31-3.6 2.16-5.07 6.21-5.07h.13c4.47 0 6.26 1.79 6.26 6.26v6.52c0 4.47-1.79 6.26-6.26 6.26h-.13c-4.02 0-5.87-1.45-6.2-4.99" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 12H3.62M5.85 8.65L2.5 12l3.35 3.35" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						Sign In
					</a>
					<p class="text-center text-xs text-[#B8B7B7]">
						Your event will be saved to a default collection if you continue without signing in.
					</p>
				</div>
			{:else}
				<!-- Logged in state -->
				<span class="text-sm font-semibold text-[#B8B7B7]">Choose collection of the event:</span>

				<div class="mt-4">
					{#if loadingCollections}
						<div class="space-y-2">
							{#each [1, 2] as _}
								<div class="animate-pulse flex items-center gap-2 px-1 py-2">
									<div class="h-5 w-5 rounded-full bg-gray-200"></div>
									<div class="h-4 w-32 rounded bg-gray-200"></div>
								</div>
							{/each}
						</div>
					{:else if options.length === 0}
						<p class="text-sm text-[#B8B7B7]">No collections found. Create one to get started.</p>
					{:else}
						{#each options as option (option.id)}
							<button
								type="button"
								class="flex w-full items-center justify-between gap-2 rounded px-1 py-2 text-left hover:bg-gray-50 transition-colors"
								on:click={() => select(option)}
							>
								<span class="flex items-center gap-2 text-sm text-black">
									<img src={option.icon} alt="icon" class="h-5 w-5 rounded-full object-cover" />
									{option.label}
								</span>
								{#if selectedId === option.id}
									<img src="/selected.svg" alt="selected" class="h-5 w-5" />
								{/if}
							</button>
						{/each}
					{/if}
				</div>

				<div class="mt-3 space-y-3">
					<button
						class="flex w-full items-center gap-2 rounded px-1 py-2 text-xl text-[#848384] transition-colors hover:bg-gray-50"
						on:click={() => goto('/collection/create')}
					>
						<Icon icon="mdi:plus" class="h-7 w-7" />
						Create Collection
					</button>
					<div class="flex items-center gap-2">
						<div class="h-[18.75px] w-[18.75px] flex-shrink-0">
							<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9.375 12.5V8.59375" stroke="#A9A8A8" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M15.625 14.0625C16.6016 12.7578 17.1875 11.1328 17.1875 9.375C17.1875 5.0625 13.6875 1.5625 9.375 1.5625C5.0625 1.5625 1.5625 5.0625 1.5625 9.375C1.5625 13.6875 5.0625 17.1875 9.375 17.1875C10.4922 17.1875 11.5625 16.9531 12.5234 16.5234" stroke="#A9A8A8" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M9.37891 6.25H9.37189" stroke="#A9A8A8" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
						<p class="text-sm text-[#B8B7B7]">
							Creating the event under a collection grants its admins manage access.
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		left: 90px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
