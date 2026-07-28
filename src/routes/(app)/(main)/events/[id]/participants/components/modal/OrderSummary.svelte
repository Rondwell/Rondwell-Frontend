<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import { sendSpeakerMessage } from '$lib/services/event.services';
	import { toast } from '$lib/stores/toast.store';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let items: any[] = [];
	export let vendorName = 'Vendor';
	export let eventId = '';
	export let participantId = '';

	let dateTime = '';
	let logisticsNotes = '';
	let placing = false;
	let error = '';

	const removeItem = (id: string) => { items = items.filter((i) => i.id !== id); };
	const increase = (id: string) => { items = items.map(i => i.id === id ? { ...i, quantity: (i.quantity || 1) + 1 } : i); };
	const decrease = (id: string) => { items = items.map(i => i.id === id && (i.quantity || 1) > 1 ? { ...i, quantity: i.quantity - 1 } : i); };
	$: totalAmount = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
	$: currency = items[0]?.currency || 'NGN';

	// Build the itemised request-for-quote body sent to the vendor. The vendor
	// receives it and issues an invoice from their collaboration dashboard,
	// which the organizer then pays via the pay-invoice flow.
	function buildRfqMessage(): string {
		const lines = items.map((i) => {
			const qty = i.quantity || 1;
			const priceText = i.price > 0 ? `${currency} ${(i.price * qty).toLocaleString()}` : 'Quote on request';
			return `• ${i.title} × ${qty} — ${priceText}`;
		});
		let body = `Hi ${vendorName},\n\nWe'd like to order the following for our event:\n\n${lines.join('\n')}`;
		if (totalAmount > 0) body += `\n\nEstimated total: ${currency} ${totalAmount.toLocaleString()}`;
		if (dateTime) body += `\n\nNeeded by: ${new Date(dateTime).toLocaleString()}`;
		if (logisticsNotes) body += `\n\nNotes: ${logisticsNotes}`;
		body += `\n\nPlease review and send us an invoice to proceed with payment.`;
		return body;
	}

	async function handlePlaceOrder() {
		if (items.length === 0) return;
		if (!eventId || !participantId) {
			error = 'Missing event/participant context — please reopen this order.';
			return;
		}
		placing = true;
		error = '';
		try {
			await sendSpeakerMessage(eventId, participantId, {
				subject: `Order request from event organizer`,
				message: buildRfqMessage()
			});
			toast.success(`Order request sent to ${vendorName}. They'll send an invoice to pay.`);
			dispatch('ordered');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to send order request';
			toast.error(error);
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
							{placing ? 'Sending...' : 'Send Order Request'}
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
												<span class="font-semibold text-gray-800">{item.price > 0 ? `${item.currency || currency} ${(item.price).toLocaleString()}` : 'Quote on request'}</span>
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
						<p class="mb-1 text-sm text-gray-500">Estimated Total</p>
						<input class="w-full rounded-lg border bg-white px-3 py-2.5" value={`${currency} ${totalAmount.toLocaleString()}`} disabled />
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

					<!-- How payment works -->
					<div class="mt-6 flex items-start gap-2 rounded-lg border border-[#DB3EC6]/30 bg-purple-50 p-3">
						<Icon icon="mdi:information-outline" class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#DB3EC6]" />
						<p class="text-xs leading-relaxed text-gray-600">
							Sending this order notifies <span class="font-medium">{vendorName}</span>. They'll issue an invoice
							you can pay securely via Rondwell (Paystack / Flutterwave) from the vendor's row menu.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
