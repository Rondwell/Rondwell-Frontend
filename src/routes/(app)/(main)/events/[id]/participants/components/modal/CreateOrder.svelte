<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import OrderSummary from './OrderSummary.svelte';

	const dispatch = createEventDispatcher();

	let searchQuery = '';
	export let open = false;
	export let speakerData: any = null;
	export let eventId = '';
	let showSummary = false;

	$: vendorName = speakerData?.displayName || speakerData?.applicationDetails?.companyName || 'Vendor';

	let selectedItems: any[] = [];

	// Mock catalog items - in production these would come from the vendor's Rondwell profile
	let catalogItems = [
		{ id: '1', title: 'Conference Photography Package', desc: 'Full-day event coverage by a professional photographer', price: 2994, type: 'fixed' },
		{ id: '2', title: 'Onsite Registration Kiosk', desc: 'Self-service check-in unit with badge printing', price: 0, type: 'quote' },
		{ id: '3', title: 'LED Video Wall (12ft x 8ft)', desc: 'High-resolution indoor display for presentations', price: 4500, type: 'fixed' },
	];

	function addToOrder(item: any) {
		if (!selectedItems.find(s => s.id === item.id)) {
			selectedItems = [...selectedItems, { ...item, quantity: 1 }];
		}
	}

	function removeFromOrder(id: string) {
		selectedItems = selectedItems.filter(s => s.id !== id);
	}

	function proceedToSummary() {
		if (selectedItems.length === 0) return;
		open = false;
		showSummary = true;
	}

	$: filteredCatalog = catalogItems.filter(item => {
		if (!searchQuery) return true;
		return item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase());
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn max-h-180 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 shadow-xl md:max-h-150 md:p-6">
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<Icon icon="mdi:cart-outline" class="text-2xl" />
					</div>
				</div>
				<h2 class="text-xl font-semibold text-gray-800">Order Services from {vendorName}</h2>
				<p class="text-sm text-gray-500">Select products or services from the vendor's catalog.</p>
				<button class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED]" on:click={() => (open = false)}>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<div class="custom-scrollbar mt-6 h-80 overflow-y-auto rounded-lg border p-4 md:h-60">
				<div class="mb-4 flex items-center gap-2">
					<div class="relative w-full max-w-xl">
						<input type="text" bind:value={searchQuery} placeholder="Search products or services..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
						<span class="absolute top-2.5 left-3 text-gray-400">
							<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
						</span>
					</div>
				</div>

				{#if selectedItems.length > 0}
					<div class="mb-3 rounded-md bg-green-50 p-2 text-sm text-green-700">
						{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
					</div>
				{/if}

				<div class="divide-y rounded-lg border">
					{#each filteredCatalog as item}
						{@const isSelected = selectedItems.some(s => s.id === item.id)}
						<div class="flex items-start justify-between gap-2 p-3 hover:bg-gray-50 md:flex-row md:items-center">
							<div class="flex flex-col gap-2 md:flex-row md:items-center">
								<div class="flex items-center gap-2">
									<img src="/menu-board.svg" alt="" class="h-6 w-6 rounded-full" />
									<div class="max-w-[120px] truncate font-medium">{item.title}</div>
								</div>
								<div class="max-w-[200px] truncate text-sm text-[#B6B7B7] md:max-w-[150px]">{item.desc}</div>
								{#if item.price > 0}
									<p class="text-sm font-medium">${item.price.toLocaleString()}</p>
								{/if}
							</div>

							{#if item.type === 'fixed'}
								{#if isSelected}
									<button on:click={() => removeFromOrder(item.id)} class="flex w-35 items-center gap-2 rounded-md bg-red-100 px-2 py-1 text-sm text-red-600">
										<Icon icon="mdi:close" class="h-4 w-4" /> Remove
									</button>
								{:else}
									<button on:click={() => addToOrder(item)} class="flex w-35 items-center gap-2 rounded-md bg-gray-200 px-2 py-1 text-sm text-gray-600">
										<Icon icon="mdi:plus" class="h-5 w-5" /> Add to order
									</button>
								{/if}
							{:else}
								<button class="flex w-35 items-center gap-2 rounded-md bg-gray-200 px-2 py-1 text-sm text-gray-400">
									Request Quote
									<img src="/send-icon.png" alt="icon" class="h-3 w-3" />
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<div class="mt-6 flex items-center gap-2">
				<button on:click={() => (open = false)} class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs">Cancel</button>
				<button on:click={proceedToSummary} disabled={selectedItems.length === 0} class="rounded-md bg-black px-4 py-2 text-white shadow-xs disabled:opacity-50">
					Proceed to Order ({selectedItems.length})
				</button>
			</div>
		</div>
	</div>
{/if}

<OrderSummary bind:open={showSummary} items={selectedItems} {vendorName} {eventId} on:ordered={() => dispatch('ordered')} />

<style>
	.animate-fadeIn { animation: fade 0.15s ease-out; }
	@keyframes fade { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>
