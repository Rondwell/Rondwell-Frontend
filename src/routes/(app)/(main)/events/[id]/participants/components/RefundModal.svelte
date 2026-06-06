<!--
	FE-P2-01-A — Refund modal.

	Issued from the participant / earnings row "Issue refund" action. Wraps
	`initiateTicketRefund` and surfaces every server error code via the
	central `mapFinancialError` registry so the user never sees a generic
	"Something went wrong".

	Backend reference: P2-01 / FA-7.1 / NEW-5.1. The refund cascade is
	server-side — invalidates the registration, voids the QR, frees the
	seat, decrements analytics, emails both sides.
-->
<script lang="ts">
	import {
		initiateTicketRefund,
		type Refund,
	} from '$lib/services/refund.services';
	import { toast } from '$lib/stores/toast.store';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney, koboToMajor, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let ticketPaymentId: string = '';
	/** Original payment amount in minor units. Used to cap partial-refund input. */
	export let originalAmountKobo: number = 0;
	export let currency: string = 'NGN';
	export let attendeeName: string = '';
	export let ticketTypeName: string = '';
	export let eventName: string = '';
	/**
	 * Optional refund-policy hint for the confirmation copy. The server
	 * still enforces the policy — this is just a UX preview.
	 */
	export let refundPolicyHint: string = '';

	const dispatch = createEventDispatcher<{ refunded: { refund: Refund } }>();

	let refundType: 'full' | 'partial' = 'full';
	let partialAmountMajor: string = '';
	let reason: string = '';
	let confirmAcknowledged = false;
	let submitting = false;
	let inlineError = '';

	$: maxMajor = koboToMajor(originalAmountKobo, currency);
	$: amountKobo =
		refundType === 'full'
			? originalAmountKobo
			: majorToKobo(partialAmountMajor || 0, currency);
	$: amountValid = refundType === 'full' || (amountKobo > 0 && amountKobo <= originalAmountKobo);
	$: canSubmit = !submitting && reason.trim().length >= 3 && amountValid && confirmAcknowledged;

	function reset() {
		refundType = 'full';
		partialAmountMajor = '';
		reason = '';
		confirmAcknowledged = false;
		submitting = false;
		inlineError = '';
	}

	$: if (open) reset();

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		inlineError = '';
		try {
			const refund = await initiateTicketRefund(ticketPaymentId, {
				amountKobo: refundType === 'full' ? undefined : amountKobo,
				reason: reason.trim(),
			});
			toast.success('Refund initiated. The attendee has been notified.');
			dispatch('refunded', { refund });
			open = false;
		} catch (err: any) {
			inlineError = financialErrorMessage(err);
		} finally {
			submitting = false;
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm"
		on:click={() => (open = false)}
		on:keydown={(e) => {
			if (e.key === 'Escape') open = false;
		}}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="flex items-center justify-between border-b px-5 py-4">
				<div>
					<h3 class="text-lg font-semibold">Issue refund</h3>
					<p class="mt-0.5 text-xs text-gray-500">
						{attendeeName ? `${attendeeName} · ` : ''}{ticketTypeName}{eventName ? ` — ${eventName}` : ''}
					</p>
				</div>
				<button
					on:click={() => (open = false)}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Close"
				>
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<div class="space-y-4 px-5 py-4">
				{#if inlineError}
					<p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{inlineError}</p>
				{/if}

				<div class="rounded-lg bg-gray-50 p-3 text-sm">
					<div class="flex items-center justify-between">
						<span class="text-gray-500">Original payment</span>
						<span class="font-semibold">{formatMoney(originalAmountKobo, currency)}</span>
					</div>
				</div>

				<div>
					<p class="mb-2 text-sm font-medium text-gray-700">Refund amount</p>
					<div class="grid grid-cols-2 gap-2">
						<button
							type="button"
							on:click={() => (refundType = 'full')}
							class="rounded-md border px-3 py-2 text-sm font-medium {refundType === 'full'
								? 'border-pink-500 bg-pink-50 text-pink-700'
								: 'border-gray-200 text-gray-600 hover:bg-gray-50'}"
						>
							Full refund
						</button>
						<button
							type="button"
							on:click={() => (refundType = 'partial')}
							class="rounded-md border px-3 py-2 text-sm font-medium {refundType === 'partial'
								? 'border-pink-500 bg-pink-50 text-pink-700'
								: 'border-gray-200 text-gray-600 hover:bg-gray-50'}"
						>
							Partial
						</button>
					</div>
					{#if refundType === 'partial'}
						<div class="mt-2">
							<label for="refund-amount" class="text-xs text-gray-500">
								Amount in {currency} (max {formatMoney(originalAmountKobo, currency)})
							</label>
							<input
								id="refund-amount"
								type="number"
								min="0"
								max={maxMajor}
								step="0.01"
								bind:value={partialAmountMajor}
								placeholder="0.00"
								class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
							/>
						</div>
					{/if}
				</div>

				<div>
					<label for="refund-reason" class="mb-1 block text-sm font-medium text-gray-700">
						Reason <span class="text-xs text-gray-400">(shown to attendee)</span>
					</label>
					<textarea
						id="refund-reason"
						bind:value={reason}
						rows="3"
						placeholder="e.g. Event canceled due to weather"
						class="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					></textarea>
					<p class="mt-1 text-[11px] text-gray-400">Minimum 3 characters.</p>
				</div>

				<div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
					<p class="font-medium">What happens next</p>
					<ul class="mt-1 list-inside list-disc space-y-0.5">
						<li>The QR code is voided immediately and the seat (if any) is freed.</li>
						<li>{currency} {formatMoney(amountKobo, currency)} is sent back through the original gateway.</li>
						<li>The attendee receives a `TICKET_REFUND_ISSUED` email.</li>
						{#if refundPolicyHint}<li>{refundPolicyHint}</li>{/if}
					</ul>
				</div>

				<label class="flex items-start gap-2 text-sm text-gray-700">
					<input type="checkbox" bind:checked={confirmAcknowledged} class="mt-0.5 h-4 w-4" />
					<span>I understand this voids the QR and notifies the attendee.</span>
				</label>
			</div>

			<div class="flex items-center justify-end gap-2 border-t px-5 py-3">
				<button
					on:click={() => (open = false)}
					class="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					on:click={handleSubmit}
					disabled={!canSubmit}
					class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
				>
					{submitting ? 'Refunding…' : 'Issue refund'}
				</button>
			</div>
		</div>
	</div>
{/if}
