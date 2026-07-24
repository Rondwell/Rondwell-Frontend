<script lang="ts">
	import { page } from '$app/stores';
	import { authFetch } from '$lib/services/api.client';
	import { getCollaboration } from '$lib/services/vendor.services';
	import { getExhibitorInvoiceForPay } from '$lib/services/exhibitor.services';
	import { getOrCreateIdempotencyKey } from '$lib/utils/idempotency';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	const PAYMENT_URL = import.meta.env.VITE_PAYMENT_API_URL || import.meta.env.VITE_API_URL;

	let status: 'loading' | 'loaded' | 'paying' | 'success' | 'error' = 'loading';
	let collab: any = null;
	let errorMessage = '';
	let selectedGateway: 'PAYSTACK' | 'FLUTTERWAVE' = 'PAYSTACK';

	$: collaborationId = $page.url.searchParams.get('collaborationId') || '';
	$: invoiceNumber = $page.url.searchParams.get('invoiceNumber') || '';
	// `type=exhibitor` → organizer→exhibitor booth invoice (exhibitor pays the
	// organizer). Default `vendor` → vendor→organizer service invoice.
	$: invoiceType = ($page.url.searchParams.get('type') || 'vendor').toLowerCase();
	$: isExhibitor = invoiceType === 'exhibitor';

	// Normalised invoice view so the template is direction-agnostic.
	$: inv = collab
		? isExhibitor
			? {
					invoiceNumber: collab.invoice?.invoiceNumber,
					amount: collab.invoice?.amount,
					currency: collab.invoice?.currency || 'NGN',
					paid: collab.invoice?.invoiceStatus === 'PAID',
					sentAt: collab.invoice?.invoiceSentAt,
					fromLabel: 'From (Organizer)',
					fromName: collab.organizerName || 'Organizer',
					toLabel: 'To (Exhibitor)',
					toName: collab.exhibitorName || 'Exhibitor',
					serviceName: collab.boothName || collab.packageName || collab.title || 'Exhibition Booth',
					description: collab.description || '',
					message: collab.invoice?.invoiceMessage || '',
					messageFrom: 'organizer'
				}
			: {
					invoiceNumber: collab.quote?.invoiceNumber,
					amount: collab.quote?.quotedAmount,
					currency: collab.quote?.quotedCurrency || 'NGN',
					paid: collab.quote?.quoteStatus === 'PAID',
					sentAt: collab.quote?.quoteSentAt,
					fromLabel: 'From (Vendor)',
					fromName: collab.vendorName || collab.title || 'Vendor',
					toLabel: 'To (Organizer)',
					toName: collab.organizerName || 'Organizer',
					serviceName: collab.title || 'Service',
					description: collab.description || '',
					message: collab.proposal || '',
					messageFrom: 'vendor'
				}
		: null;

	onMount(async () => {
		if (!collaborationId) {
			status = 'error';
			errorMessage = 'Invalid invoice link. No collaboration ID provided.';
			return;
		}

		try {
			collab = isExhibitor
				? await getExhibitorInvoiceForPay(collaborationId)
				: await getCollaboration(collaborationId);

			const invoiceNo = isExhibitor ? collab?.invoice?.invoiceNumber : collab?.quote?.invoiceNumber;
			if (!invoiceNo) {
				status = 'error';
				errorMessage = 'No invoice found for this collaboration.';
				return;
			}

			const alreadyPaid = isExhibitor
				? collab.invoice?.invoiceStatus === 'PAID'
				: collab.quote?.quoteStatus === 'PAID';
			if (alreadyPaid) {
				status = 'success';
				return;
			}

			status = 'loaded';
		} catch (e: any) {
			status = 'error';
			errorMessage = e.message || 'Failed to load invoice details.';
		}
	});

	function getCurrencySymbol(c: string): string {
		// FE-P1-01: legacy callsites still produce a symbol; prefer formatMoney
		// for full currency-aware formatting. Kept for the gateway-button
		// label only — the totals below now route through formatMoney.
		if (c === 'NGN') return '₦';
		if (c === 'USD') return '$';
		if (c === 'GBP') return '£';
		return c;
	}

	function formatInvoiceTotal(amountMajor: number | undefined | null, currency: string): string {
		// FE-P1-01 / FE-P1-16 — render every monetary string through the
		// currency-aware helper. Convert the legacy major-unit `quotedAmount`
		// at the boundary exactly once via majorToKobo.
		const ccy = currency || 'NGN';
		return formatMoney(majorToKobo(Number(amountMajor ?? 0), ccy), ccy);
	}

	function formatDate(d: string): string {
		if (!d) return '';
		return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	async function handlePay() {
		if (!inv?.invoiceNumber) return;
		status = 'paying';
		errorMessage = '';

		try {
			// FE-P1-09 (FA-8.1) — stable Idempotency-Key per (collab, invoice).
			// A flaky network or mid-flight refresh re-uses the same in-flight
			// transaction instead of opening a duplicate. The backend derives
			// its own key when omitted, but supplying a stable client key is
			// the canonical safe path.
			const idempotencyScope = `invoice:${collaborationId}:${inv.invoiceNumber}`;
			const idempotencyKey = getOrCreateIdempotencyKey(idempotencyScope);

			const typeQuery = isExhibitor ? '&type=exhibitor' : '';
			const endpoint = isExhibitor
				? `${PAYMENT_URL}/api/v1/payment/exhibitor-invoice/initiate`
				: `${PAYMENT_URL}/api/v1/payment/vendor-invoice/initiate`;

			const body = isExhibitor
				? {
						collaborationId,
						invoiceNumber: inv.invoiceNumber,
						// Exhibitor is the authenticated payer (resolved server-side);
						// we send the organizer (receiver) details from the invoice.
						organizerUserId: String(collab.organizerId?._id || collab.organizerId),
						organizerName: collab.organizerName || 'Organizer',
						organizerEmail: collab.organizerEmail || '',
						amount: inv.amount,
						currency: inv.currency,
						serviceName: inv.serviceName,
						eventId: collab.eventId,
						eventName: collab.eventName,
						paymentGateway: selectedGateway,
						successCallbackUrl: `${window.location.origin}/pay-invoice?collaborationId=${collaborationId}${typeQuery}&status=success`,
						failureCallbackUrl: `${window.location.origin}/pay-invoice?collaborationId=${collaborationId}${typeQuery}&status=failed`
					}
				: {
						collaborationId,
						invoiceNumber: inv.invoiceNumber,
						vendorUserId: String(collab.vendorId?._id || collab.vendorId),
						vendorName: collab.vendorName || 'Vendor',
						vendorEmail: collab.vendorEmail || '',
						amount: inv.amount,
						currency: inv.currency,
						serviceName: collab.title || collab.description || 'Service',
						eventId: collab.eventId,
						eventName: collab.eventName,
						paymentGateway: selectedGateway,
						successCallbackUrl: `${window.location.origin}/pay-invoice?collaborationId=${collaborationId}&status=success`,
						failureCallbackUrl: `${window.location.origin}/pay-invoice?collaborationId=${collaborationId}&status=failed`
					};

			const res = await authFetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Idempotency-Key': idempotencyKey,
					'x-idempotency-key': idempotencyKey,
				},
				body: JSON.stringify(body),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				throw new Error(data.message || 'Failed to initiate payment');
			}

			// Redirect to payment gateway checkout
			if (data.data?.checkoutUrl) {
				window.location.href = data.data.checkoutUrl;
			} else {
				throw new Error('No checkout URL returned');
			}
		} catch (e: any) {
			status = 'loaded';
			errorMessage = e.message || 'Payment initiation failed. Please try again.';
		}
	}
</script>

<svelte:head>
	<title>Pay Invoice {invoiceNumber || ''} — Rondwell</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-10">
	{#if status === 'loading'}
		<div class="flex flex-col items-center justify-center py-20">
			<div class="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#DB3EC6]"></div>
			<p class="mt-4 text-sm text-gray-500">Loading invoice details...</p>
		</div>

	{:else if status === 'error'}
		<div class="flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
				<Icon icon="mdi:alert-circle-outline" class="h-8 w-8 text-red-500" />
			</div>
			<h1 class="mb-2 text-xl font-semibold text-gray-900">Something Went Wrong</h1>
			<p class="mb-6 text-sm text-gray-500">{errorMessage}</p>
			<a href={isExhibitor ? '/exhibitor/collab' : '/vendor/collab'} class="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
				Back to Collaborations
			</a>
		</div>

	{:else if status === 'success'}
		<div class="flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
				<Icon icon="mdi:check-circle" class="h-8 w-8 text-green-500" />
			</div>
			<h1 class="mb-2 text-xl font-semibold text-gray-900">Payment Complete</h1>
			<p class="mb-1 text-sm text-gray-500">Invoice {inv?.invoiceNumber || invoiceNumber} has been paid.</p>
			<p class="mb-6 text-xs text-gray-400">
				{isExhibitor
					? 'The organizer has been notified and funds have been credited to their wallet.'
					: 'The vendor has been notified and funds have been credited to their wallet.'}
			</p>
			<a href="/" class="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
				Go to Dashboard
			</a>
		</div>

	{:else if collab}
		<!-- Invoice Card -->
		<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
			<!-- Header -->
			<div class="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 text-white">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">Invoice</p>
						<p class="mt-0.5 text-lg font-bold">{inv?.invoiceNumber || '—'}</p>
					</div>
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
						<Icon icon="mdi:receipt-text-outline" class="h-5 w-5 text-white" />
					</div>
				</div>
			</div>

			<div class="p-6">
				{#if errorMessage}
					<div class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{errorMessage}</div>
				{/if}

				<!-- From / To -->
				<div class="mb-6 grid grid-cols-2 gap-4">
					<div>
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">{inv?.fromLabel}</p>
						<p class="mt-1 text-sm font-semibold text-gray-900">{inv?.fromName}</p>
					</div>
					<div>
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">{inv?.toLabel}</p>
						<p class="mt-1 text-sm font-semibold text-gray-900">{inv?.toName}</p>
					</div>
				</div>

				<!-- Service Details -->
				<div class="mb-6 rounded-lg bg-gray-50 p-4">
					<div class="flex items-center justify-between border-b border-gray-200 pb-3">
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">{isExhibitor ? 'Booth' : 'Service'}</p>
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">Amount</p>
					</div>
					<div class="flex items-start justify-between pt-3">
						<div class="flex-1 pr-4">
							<p class="text-sm font-medium text-gray-900">{inv?.serviceName}</p>
							{#if inv?.description}
								<p class="mt-1 text-xs leading-relaxed text-gray-500">{inv.description}</p>
							{/if}
							{#if collab.eventName}
								<p class="mt-1 text-xs text-gray-400">Event: {collab.eventName}</p>
							{/if}
						</div>
						<p class="shrink-0 text-sm font-bold text-gray-900">
							{formatInvoiceTotal(inv?.amount, inv?.currency)}
						</p>
					</div>
				</div>

				<!-- Total -->
				<div class="mb-6 flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3">
					<p class="text-sm font-medium text-gray-300">Total Due</p>
					<p class="text-xl font-bold text-white">
						{formatInvoiceTotal(inv?.amount, inv?.currency)}
					</p>
				</div>

				{#if inv?.message}
					<div class="mb-6 rounded-lg border-l-3 border-[#DB3EC6] bg-purple-50 p-3">
						<p class="text-xs font-medium text-gray-500">Message from {inv.messageFrom}</p>
						<p class="mt-1 text-sm text-gray-700">{inv.message}</p>
					</div>
				{/if}

				<!-- Date -->
				{#if inv?.sentAt}
					<p class="mb-6 text-xs text-gray-400">Invoice date: {formatDate(inv.sentAt)}</p>
				{/if}

				<!-- Payment Gateway Selection -->
				<div class="mb-4">
					<p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Pay with</p>
					<div class="grid grid-cols-2 gap-3">
						<button
							on:click={() => (selectedGateway = 'PAYSTACK')}
							class="flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all
								{selectedGateway === 'PAYSTACK' ? 'border-[#DB3EC6] bg-purple-50 text-[#DB3EC6]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}"
						>
							<Icon icon="simple-icons:paystack" class="h-4 w-4" />
							Paystack
						</button>
						<button
							on:click={() => (selectedGateway = 'FLUTTERWAVE')}
							class="flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all
								{selectedGateway === 'FLUTTERWAVE' ? 'border-[#DB3EC6] bg-purple-50 text-[#DB3EC6]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}"
						>
							<Icon icon="simple-icons:flutterwave" class="h-4 w-4" />
							Flutterwave
						</button>
					</div>
				</div>

				<!-- Pay Button -->
				<button
					on:click={handlePay}
					disabled={status === 'paying'}
					class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#DB3EC6] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#c235b0] disabled:opacity-50"
				>
					{#if status === 'paying'}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
						Processing...
					{:else}
						<Icon icon="mdi:lock-outline" class="h-4 w-4" />
						Pay {formatInvoiceTotal(inv?.amount, inv?.currency)}
					{/if}
				</button>

				<p class="mt-3 text-center text-[10px] text-gray-400">
					Secured by Rondwell. Your payment is processed securely via {selectedGateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'}.
				</p>
			</div>
		</div>
	{/if}
</div>
