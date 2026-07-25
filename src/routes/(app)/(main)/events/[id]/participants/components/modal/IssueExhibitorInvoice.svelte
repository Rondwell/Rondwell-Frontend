<script lang="ts">
	import { issueExhibitorInvoiceByParticipant, getExhibitorInvoiceForOrganizer } from '$lib/services/exhibitor.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let speakerData: any = null; // the exhibitor EventParticipant
	export let eventId = '';
	export let eventTitle = '';

	let amount: number | null = null;
	let currency = 'NGN';
	let serviceName = '';
	let message = '';
	let submitting = false;
	let error = '';
	let success = '';

	// Live invoice/payment status for this exhibitor (organizer visibility).
	let statusLoading = false;
	let collab: any = null;
	let loadedForOpen = false;

	// The collaboration record is keyed by a real Rondwell userId. Email-only
	// invitees who haven't accepted yet won't have one, so guard against that.
	$: exhibitorUserId = speakerData?.participantUserId || '';
	$: isLinkedUser = /^[a-f\d]{24}$/i.test(String(exhibitorUserId));
	$: exhibitorName =
		speakerData?.displayName ||
		speakerData?.applicationDetails?.companyName ||
		speakerData?.applicationDetails?.contactEmail ||
		'Exhibitor';
	$: exhibitorEmail = speakerData?.applicationDetails?.contactEmail || '';

	$: invoice = collab?.invoice || null;
	$: isPaid = invoice?.invoiceStatus === 'PAID' || collab?.status === 'CONFIRMED';
	$: hasIssuedInvoice = !!invoice?.invoiceNumber && invoice?.invoiceStatus !== 'DRAFT';

	// Load current status whenever the modal opens for a linked exhibitor.
	$: if (open && !loadedForOpen && isLinkedUser && eventId && exhibitorUserId) {
		loadedForOpen = true;
		void loadStatus();
	}
	$: if (!open && loadedForOpen) {
		loadedForOpen = false;
		collab = null;
	}

	async function loadStatus() {
		statusLoading = true;
		try {
			collab = await getExhibitorInvoiceForOrganizer(eventId, String(exhibitorUserId));
		} catch {
			collab = null;
		} finally {
			statusLoading = false;
		}
	}

	function fmtAmount(amt: number | undefined, ccy: string | undefined) {
		if (amt == null) return '—';
		const c = ccy || 'NGN';
		return formatMoney(majorToKobo(Number(amt), c), c);
	}
	function fmtDate(d: string | undefined) {
		return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
	}

	async function handleSubmit() {
		error = '';
		success = '';
		const numeric = Number(amount);
		if (!numeric || numeric <= 0) {
			error = 'Enter a valid invoice amount.';
			return;
		}
		if (!isLinkedUser) {
			error = 'This exhibitor has not linked a Rondwell account yet. They need to accept their invitation first.';
			return;
		}
		submitting = true;
		try {
			await issueExhibitorInvoiceByParticipant({
				eventId,
				exhibitorUserId: String(exhibitorUserId),
				exhibitorName,
				exhibitorEmail,
				eventName: eventTitle,
				amount: numeric,
				currency,
				message: message || undefined,
				serviceName: serviceName || undefined
			});
			success = 'Invoice sent! The exhibitor has been emailed a secure payment link.';
			dispatch('issued');
			amount = null;
			message = '';
			serviceName = '';
			await loadStatus(); // refresh the status panel to show the new invoice
			setTimeout(() => { success = ''; }, 3000);
		} catch (e: any) {
			error = e?.message || 'Failed to issue invoice.';
		} finally {
			submitting = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="w-full max-w-md rounded-2xl bg-[#FDFCFB] p-6 shadow-xl">
			<div class="mb-4 flex items-start justify-between">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Booth Invoice & Payment</h2>
					<p class="text-sm text-gray-500">Bill {exhibitorName} for their booth and track their payment. They pay securely via Paystack.</p>
				</div>
				<button on:click={() => (open = false)} class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED] text-gray-700">
					<Icon icon="mdi:close" class="text-lg" />
				</button>
			</div>

			{#if !isLinkedUser}
				<div class="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
					This exhibitor hasn't linked a Rondwell account yet. Once they accept their invitation you can invoice them.
				</div>
			{/if}

			<!-- Live invoice / payment status (organizer visibility) -->
			{#if isLinkedUser}
				{#if statusLoading}
					<div class="mb-4 h-16 animate-pulse rounded-lg bg-gray-100"></div>
				{:else if hasIssuedInvoice}
					<div class="mb-4 rounded-lg border {isPaid ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'} p-4">
						<div class="flex items-center justify-between">
							<span class="flex items-center gap-1.5 text-sm font-semibold {isPaid ? 'text-green-700' : 'text-orange-700'}">
								<Icon icon={isPaid ? 'mdi:check-circle' : 'mdi:clock-outline'} class="text-base" />
								{isPaid ? 'Paid' : 'Awaiting payment'}
							</span>
							<span class="text-sm font-bold text-gray-900">{fmtAmount(invoice?.amount, invoice?.currency)}</span>
						</div>
						<div class="mt-2 space-y-0.5 text-xs text-gray-500">
							<p><span class="font-medium text-gray-700">Invoice:</span> {invoice?.invoiceNumber}</p>
							<p><span class="font-medium text-gray-700">Issued:</span> {fmtDate(invoice?.invoiceSentAt)}</p>
							{#if isPaid}
								<p><span class="font-medium text-gray-700">Paid on:</span> {fmtDate(invoice?.paidAt)}</p>
								{#if invoice?.paymentReference}
									<p class="truncate"><span class="font-medium text-gray-700">Reference:</span> <span class="font-mono">{invoice.paymentReference}</span></p>
								{/if}
								<p class="mt-1 text-green-600">Credited to your wallet (net of platform fee).</p>
							{:else}
								<p class="mt-1 text-orange-600">Balance outstanding: {fmtAmount(invoice?.amount, invoice?.currency)}</p>
							{/if}
						</div>
					</div>
				{/if}
			{/if}

			{#if error}
				<p class="mb-3 text-sm text-red-500">{error}</p>
			{/if}
			{#if success}
				<p class="mb-3 text-sm text-green-600">{success}</p>
			{/if}

			{#if isPaid}
				<div class="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
					This booth invoice has been paid in full. No further action needed.
				</div>
			{:else}
			<div class="space-y-4">
				{#if hasIssuedInvoice}
					<p class="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">Issuing a new invoice replaces the outstanding one and re-sends the payment link.</p>
				{/if}
				<div>
					<label class="block text-sm text-gray-900" for="inv_service">Booth / Package name <span class="text-gray-400">(optional)</span></label>
					<input id="inv_service" type="text" bind:value={serviceName} placeholder="e.g. Standard Booth A12" class="mt-1 w-full rounded-md bg-white px-3 py-2 shadow-xs" />
				</div>

				<div class="flex gap-3">
					<div class="w-28">
						<label class="block text-sm text-gray-900" for="inv_currency">Currency</label>
						<select id="inv_currency" bind:value={currency} class="mt-1 w-full rounded-md bg-white px-3 py-2 shadow-xs">
							<option value="NGN">NGN</option>
							<option value="USD">USD</option>
						</select>
					</div>
					<div class="flex-1">
						<label class="block text-sm text-gray-900" for="inv_amount">Amount <span class="text-blue-600">*</span></label>
						<input id="inv_amount" type="number" min="1" step="0.01" bind:value={amount} placeholder="50000" class="mt-1 w-full rounded-md bg-white px-3 py-2 shadow-xs" />
					</div>
				</div>

				<div>
					<label class="block text-sm text-gray-900" for="inv_message">Note to exhibitor <span class="text-gray-400">(optional)</span></label>
					<textarea id="inv_message" rows="3" bind:value={message} placeholder="Payment due before the event…" class="mt-1 w-full resize-none rounded-md bg-white px-3 py-2 shadow-xs"></textarea>
				</div>
			</div>
			{/if}

			<div class="mt-6 flex items-center justify-end gap-2">
				<button on:click={() => (open = false)} disabled={submitting} class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs disabled:opacity-50">{isPaid ? 'Close' : 'Cancel'}</button>
				{#if !isPaid}
					<button on:click={handleSubmit} disabled={submitting || !isLinkedUser} class="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-white shadow-xs disabled:cursor-not-allowed disabled:opacity-60">
						{#if submitting}
							<Icon icon="line-md:loading-twotone-loop" class="text-lg" />
						{/if}
						<span>{submitting ? 'Sending…' : hasIssuedInvoice ? 'Re-issue Invoice' : 'Send Invoice'}</span>
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
