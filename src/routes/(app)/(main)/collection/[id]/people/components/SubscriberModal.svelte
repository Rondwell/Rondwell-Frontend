<script lang="ts">
	import { blockCollectionSubscriber, deleteCollectionSubscriber } from '$lib/services/collection.services';
	import { createEventDispatcher } from 'svelte';

	export let subscriber: any;
	export let collectionId = '';
	export let open = false;

	const dispatch = createEventDispatcher();

	let removing = false;
	let blocking = false;
	let confirmAction: 'remove' | 'block' | null = null;

	async function handleRemove() {
		const subId = subscriber?.id ?? subscriber?._id;
		if (!subId || !collectionId) return;
		removing = true;
		try {
			await deleteCollectionSubscriber(collectionId, subId);
			dispatch('removed');
		} catch (e: any) {
			console.error('Failed to remove subscriber:', e);
		} finally {
			removing = false;
			open = false;
			confirmAction = null;
		}
	}

	async function handleBlock() {
		const subId = subscriber?.id ?? subscriber?._id;
		if (!subId || !collectionId) return;
		blocking = true;
		try {
			await blockCollectionSubscriber(collectionId, subId);
			dispatch('blocked');
		} catch (e: any) {
			console.error('Failed to block subscriber:', e);
		} finally {
			blocking = false;
			open = false;
			confirmAction = null;
		}
	}
</script>

{#if open}
	<div id="ticket" class="triangle absolute right-0 top-7 z-40 mt-2 inline-block text-left">
		<div class="relative w-[142px] max-w-lg gap-1 rounded-lg bg-[#FFFCFC] p-2 shadow-lg">
			<div class="flex w-[130px] flex-col items-center justify-center gap-2">
				{#if !subscriber?.name}
					<button class="flex w-full gap-1 rounded-md px-2 py-1 text-sm transition hover:bg-[#F0F0F0]">
						<img src="/add-name-icon.svg" alt="add name" class="h-4 w-4" /> Add Name
					</button>
				{/if}
				<button
					class="flex w-full gap-1 rounded-md px-2 py-1 text-sm transition hover:bg-[#F0F0F0]"
					on:click={() => { confirmAction = 'remove'; open = false; }}
				>
					<img src="/remove-icon.svg" alt="remove" class="h-4 w-4" /> Remove
				</button>
				<button
					class="flex w-full gap-1 rounded-md px-2 py-1 text-sm transition hover:bg-[#F0F0F0]"
					on:click={() => { confirmAction = 'block'; open = false; }}
				>
					<img src="/block-icon.svg" alt="block" class="h-4 w-4" /> Block
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if confirmAction}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" on:click={() => (confirmAction = null)}>
		<div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" on:click|stopPropagation>
			<div class="flex flex-col items-center gap-4 text-center">
				{#if confirmAction === 'remove'}
					<div class="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D92D20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900">Remove Subscriber</h3>
					<p class="text-sm text-gray-500">
						This will permanently remove <span class="font-medium text-gray-700">{subscriber?.name || subscriber?.email}</span> from this collection. This action cannot be undone.
					</p>
					<div class="mt-2 flex w-full gap-3">
						<button on:click={() => (confirmAction = null)} class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Cancel</button>
						<button on:click={handleRemove} disabled={removing} class="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
							{removing ? 'Removing...' : 'Remove'}
						</button>
					</div>
				{:else}
					<div class="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10" />
							<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900">Block Subscriber</h3>
					<p class="text-sm text-gray-500">
						This will block <span class="font-medium text-gray-700">{subscriber?.name || subscriber?.email}</span> from receiving any future communications from this collection.
					</p>
					<div class="mt-2 flex w-full gap-3">
						<button on:click={() => (confirmAction = null)} class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Cancel</button>
						<button on:click={handleBlock} disabled={blocking} class="flex-1 rounded-lg bg-orange-600 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50">
							{blocking ? 'Blocking...' : 'Block'}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		right: 10px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
