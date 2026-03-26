<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let items: any[] = [];
	export let vendorName = 'Vendor';
	export let eventId = '';

	let dateTime = '';
	let logisticsNotes = '';
	let placing = false;
	let error = '';

	const removeItem = (id: string) => { items = items.filter((i) => i.id !== id); };
	const increase = (id: string) => { items = items.map(i => i.id === id ? { ...i, quantity: (i.quantity || 1) + 1 } : i); };
	const decrease = (id: string) => { items = items.map(i => i.id === id && (i.quantity || 1) > 1 ? { ...i, quantity: i.quantity - 1 } : i); };
	$: totalAmount = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

	let buttonOpen = false;
	let paymentMethod = 'Paystack';
	let paymentOptions = [
		{ id: 'paystack', label: 'Paystack', icon: '/paystack.svg', enabled: false },
		{ id: 'flutterwave', label: 'Flutterwave', icon: '/Logo_Flutterwave Logo.svg', enabled: false },
		{ id: 'stripe', label: 'Stripe', icon: '/Stripe.svg', enabled: false }
	];

	async function handlePlaceOrder() {
		if (items.length === 0) return;
		placing = true;
		error = '';
		try {
			// In production, this would call an order creation API
			dispatch('ordered');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to place order';
		} finally {
			placing = false;
		}
	}
</script>

{#if open}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
		<div class="h-155 w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<!-- Header -->
			<div class="flex items-start justify-between border-b border-gray-200 px-6 py-4 md:items-center">
				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex items-center gap-3">
						<button aria-label="Close" on:click={() => (open = false)}>
							<Icon icon="mdi:close" class="text-lg text-gray-500" />
						</button>
						<p class="font-medium">Order Summary</p>
					</div>
					<div class="flex items-center gap-3">
						<button on:click={handlePlaceOrder} disabled={placing || items.length === 0} class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
							{placing ? 'Placing...' : 'Place Order'}
						</button>
						<button on:click={() => (open = false)} class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]">Cancel</button>
					</div>
				</div>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar h-134 space-y-8 overflow-hidden overflow-y-auto bg-[#F4F5F6] px-5 py-6 text-gray-700">
				<h2 class="text-2xl font-semibold text-gray-900">Order from {vendorName}</h2>

				{#if error}
					<p class="text-sm text-red-500">{error}</p>
				{/if}

				<div class="rounded-2xl bg-white p-4">
					{#if items.length === 0}
						<p class="py-8 text-center text-sm text-gray-400">No items in order</p>
					{:else}
						<div class="space-y-3">
							{#each items as item}
								<div class="flex items-start justify-between px-2 py-4 md:px-4">
									<div class="flex gap-3">
										<div class="flex h-22 w-22 items-center justify-center rounded-lg bg-gray-200">
											<img src="/tech-icon.svg" class="h-12 w-12" alt="" />
										</div>
										<div>
											<p class="font-medium">{item.title}</p>
											<div class="mt-1 flex items-center gap-2 text-sm">
												<span class="font-semibold text-gray-800">${(item.price || 0).toLocaleString()}</span>
											</div>
											<div class="mt-3 flex w-fit items-center gap-3 rounded-lg border border-gray-500 px-2 py-1.5">
												<button on:click={() => decrease(item.id)}>–</button>
												<p>{item.quantity || 1}</p>
												<button on:click={() => increase(item.id)}>+</button>
											</div>
										</div>
									</div>
									<button on:click={() => removeItem(item.id)}>
										<Icon icon="mdi:trash-can-outline" class="h-5 w-5 text-gray-400" />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Total -->
					<div class="mt-6 border-t-3 border-dashed pt-6">
						<p class="mb-1 text-sm text-gray-500">Total Amount</p>
						<input class="w-full rounded-lg border bg-white px-3 py-2.5" value="${totalAmount.toLocaleString()}" disabled />
					</div>

					<!-- Date/Time -->
					<div class="mt-5">
						<p class="mb-1 text-sm text-gray-500">Date/Time Needed</p>
						<input type="datetime-local" bind:value={dateTime} class="w-full rounded-lg border bg-white px-3 py-2.5" />
					</div>

					<!-- Notes -->
					<div class="mt-5">
						<p class="mb-1 text-sm text-gray-500">Delivery/Logistics Notes</p>
						<div class="relative">
							<textarea bind:value={logisticsNotes} class="h-20 w-full rounded-lg border bg-white px-3 py-2" maxlength={500} placeholder="Any special delivery instructions..." />
							<p class="absolute right-2 bottom-3 text-xs text-gray-400">{logisticsNotes.length}/500</p>
						</div>
					</div>

					<!-- Payment Method -->
					<div class="mt-6">
						<label class="flex text-gray-900">Select Payment Method</label>
						<div use:clickOutside={() => (buttonOpen = false)} class="relative w-full">
							<button class="mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg border bg-white p-3 text-sm font-medium text-[#3a3b3d]" on:click={() => (buttonOpen = !buttonOpen)}>
								<span>{paymentMethod || 'Select option'}</span>
								<img src="/arrow-left.svg" alt="" class="rotate-90" />
							</button>
							{#if buttonOpen}
								<div class="absolute left-0 z-10 w-full rounded-lg border bg-white p-2 shadow-lg">
									{#each paymentOptions as option}
										<button class="flex w-full items-center justify-between rounded-sm p-2 hover:bg-gray-50" on:click={() => { paymentMethod = option.label; buttonOpen = false; }}>
											<div class="flex items-center gap-2">
												<div class="flex h-10 w-10 items-center justify-center rounded-full border">
													<img src={option.icon} alt="" class="h-6" />
												</div>
												<span class="text-sm">{option.label}</span>
												<span class="rounded-xl bg-gray-100 px-2 py-0.5 text-xs text-gray-400">soon</span>
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
