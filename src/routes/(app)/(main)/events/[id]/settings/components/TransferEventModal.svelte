<script lang="ts">
	import { getMyCollections, transferEventCollection } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let open = false;
	export let eventId = '';
	export let currentCollectionName = '';

	let collections: any[] = [];
	let selectedCollectionId = '';
	let showDropdown = false;
	let saving = false;
	let error = '';

	$: if (open) { loadCollections(); }
	$: selectedCollection = collections.find((c) => (c._id || c.id) === selectedCollectionId);

	async function loadCollections() {
		try { collections = await getMyCollections(); } catch { collections = []; }
	}

	async function handleTransfer() {
		if (!selectedCollectionId) return;
		saving = true; error = '';
		try {
			await transferEventCollection(eventId, selectedCollectionId);
			open = false;
		} catch (e: any) { error = e.message || 'Failed to transfer'; }
		finally { saving = false; }
	}
</script>

{#if open}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<img src="/tech-icon.svg" alt="" class="mb-3 h-12 w-12" />
			<p class="text-sm text-gray-500">This event is managed by</p>
			<p class="text-lg font-semibold text-gray-900">{currentCollectionName}</p>

			<p class="mt-3 text-sm text-gray-500">When you transfer the event:</p>
			<div class="mt-2 space-y-2">
				<div class="flex items-start gap-2">
					<Icon icon="mdi:account-group-outline" class="mt-0.5 text-base text-gray-400" />
					<p class="text-sm text-gray-600">Admins of the new collection will be able to manage the event.</p>
				</div>
				<div class="flex items-start gap-2">
					<Icon icon="mdi:currency-usd" class="mt-0.5 text-base text-gray-400" />
					<p class="text-sm text-gray-600">Payments will go to the Stripe account of the new calendar.</p>
				</div>
			</div>

			<div class="relative mt-4" use:clickOutside={() => (showDropdown = false)}>
				<button on:click={() => (showDropdown = !showDropdown)}
					class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
					<span class="flex items-center gap-2">
						<img src="/tech-icon.svg" alt="" class="h-4 w-4" />
						{selectedCollection?.name || 'Choose Collection'}
					</span>
					<Icon icon="mdi:chevron-down" class="text-lg" />
				</button>
				{#if showDropdown}
					<div class="absolute left-0 z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
						<div class="max-h-40 overflow-y-auto">
							{#each collections as col}
								<button on:click={() => { selectedCollectionId = col._id || col.id; showDropdown = false; }}
									class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50 {selectedCollectionId === (col._id || col.id) ? 'bg-gray-100 font-medium' : ''}">
									<img src="/tech-icon.svg" alt="" class="h-4 w-4" />
									{col.name}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			{#if error}<p class="mt-3 text-sm text-red-500">{error}</p>{/if}

			<button on:click={handleTransfer} disabled={!selectedCollectionId || saving}
				class="mt-4 w-full rounded-lg bg-gray-900 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50">
				{saving ? 'Transferring...' : 'Transfer Event'}
			</button>
		</div>
	</div>
{/if}
