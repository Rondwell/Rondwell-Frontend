<script lang="ts">
	import { page } from '$app/stores';
	import { authFetch } from '$lib/services/api.client';
	import { getCollaboration } from '$lib/services/vendor.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	const PAYMENT_URL = import.meta.env.VITE_PAYMENT_API_URL || import.meta.env.VITE_API_URL;

	let status: 'loading' | 'loaded' | 'paying' | 'success' | 'error' = 'loading';
	let collab: any = null;
	let errorMessage = '';
	let selectedGateway: 'PAYSTACK' | 'FLUTTERWAVE' = 'PAYSTACK';

	$: collaborationId = $page.url.searchParams.get('collaborationId') || '';
	$: invoiceNumber = $page.url.searchParams.get('invoiceNumber') || '';

	onMount(async () => {
		if (!collaborationId) {
			status = 'error';
			errorMessage = 'Invalid invoice link. No collaboration ID provided.';
			return;
		}

		try {
			const data = await getCollaboration(collaborationId);
			collab = data;

			if (!collab?.quote?.invoiceNumber) {
				status = 'error';
				errorMessage = 'No invoice found for this collaboration.';
				return;
			}

			if (collab.quote.quoteStatus === 'PAID') {
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
		if (c === 'NGN') return '₦';
		if (c === 'USD') return '$';
		if (c === 'GBP') return '£';
		return c;
	}

	function formatDate(d: string): string {
		if (!d) return '';
		return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	async function handlePay() {
		if (!collab?.quote) return;
		status = 'paying';
		errorMessage = '';

		try {
			const res = await authFetch(`${PAYMENT_URL}/api/v1/payment/vendor-invoice/initiate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					collaborationId,
					invoiceNumber: collab.quote.invoiceNumber,
					vendorUserId: String(collab.vendorId?._id || collab.vendorId),
					vendorName: collab.vendorName || 'Vendor',
					vendorEmail: collab.vendorEmail || '',
					amount: collab.quote.quotedAmount,
					currency: collab.quote.quotedCurrency || 'NGN',
					serviceName: collab.title || collab.description || 'Service',
					eventId: collab.eventId,
					eventName: collab.eventName,
					paymentGateway: selectedGateway,
					successCallbackUrl: `${window.location.origin}/pay-invoice?collaborationId=${collaborationId}&status=success`,
					failureCallbackUrl: `${window.location.origin}/pay-invoice?collaborationId=${collaborationId}&status=failed`,
				}),
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
			<a href="/vendor/collab" class="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
				Back to Collaborations
			</a>
		</div>

	{:else if status === 'success'}
		<div class="flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
				<Icon icon="mdi:check-circle" class="h-8 w-8 text-green-500" />
			</div>
			<h1 class="mb-2 text-xl font-semibold text-gray-900">Payment Complete</h1>
			<p class="mb-1 text-sm text-gray-500">Invoice {collab?.quote?.invoiceNumber || invoiceNumber} has been paid.</p>
			<p class="mb-6 text-xs text-gray-400">The vendor has been notified and funds have been credited to their wallet.</p>
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
						<p class="mt-0.5 text-lg font-bold">{collab.quote?.invoiceNumber || '—'}</p>
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
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">From (Vendor)</p>
						<p class="mt-1 text-sm font-semibold text-gray-900">{collab.vendorName || collab.title || 'Vendor'}</p>
					</div>
					<div>
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">To (Organizer)</p>
						<p class="mt-1 text-sm font-semibold text-gray-900">{collab.organizerName || 'Organizer'}</p>
					</div>
				</div>

				<!-- Service Details -->
				<div class="mb-6 rounded-lg bg-gray-50 p-4">
					<div class="flex items-center justify-between border-b border-gray-200 pb-3">
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">Service</p>
						<p class="text-xs font-medium uppercase tracking-wider text-gray-400">Amount</p>
					</div>
					<div class="flex items-start justify-between pt-3">
						<div class="flex-1 pr-4">
							<p class="text-sm font-medium text-gray-900">{collab.title || 'Service'}</p>
							{#if collab.description}
								<p class="mt-1 text-xs leading-relaxed text-gray-500">{collab.description}</p>
							{/if}
							{#if collab.eventName}
								<p class="mt-1 text-xs text-gray-400">Event: {collab.eventName}</p>
							{/if}
						</div>
						<p class="shrink-0 text-sm font-bold text-gray-900">
							{getCurrencySymbol(collab.quote?.quotedCurrency || 'NGN')}{Number(collab.quote?.quotedAmount || 0).toLocaleString()}
						</p>
					</div>
				</div>

				<!-- Total -->
				<div class="mb-6 flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3">
					<p class="text-sm font-medium text-gray-300">Total Due</p>
					<p class="text-xl font-bold text-white">
						{getCurrencySymbol(collab.quote?.quotedCurrency || 'NGN')}{Number(collab.quote?.quotedAmount || 0).toLocaleString()}
					</p>
				</div>

				{#if collab.proposal}
					<div class="mb-6 rounded-lg border-l-3 border-[#DB3EC6] bg-purple-50 p-3">
						<p class="text-xs font-medium text-gray-500">Message from vendor</p>
						<p class="mt-1 text-sm text-gray-700">{collab.proposal}</p>
					</div>
				{/if}

				<!-- Date -->
				{#if collab.quote?.quoteSentAt}
					<p class="mb-6 text-xs text-gray-400">Invoice date: {formatDate(collab.quote.quoteSentAt)}</p>
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
						Pay {getCurrencySymbol(collab.quote?.quotedCurrency || 'NGN')}{Number(collab.quote?.quotedAmount || 0).toLocaleString()}
					{/if}
				</button>

				<p class="mt-3 text-center text-[10px] text-gray-400">
					Secured by Rondwell. Your payment is processed securely via {selectedGateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'}.
				</p>
			</div>
		</div>
	{/if}
</div>
