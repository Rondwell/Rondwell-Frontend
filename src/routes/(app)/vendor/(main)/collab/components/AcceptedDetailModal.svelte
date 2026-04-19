<script lang="ts">
	import { cancelCollaboration, getCollaboration, resendInvoiceEmail, sendCollaborationMessage, sendCollaborationQuote, updateCollaborationStatus, uploadCollaborationDeliverable, uploadVendorMedia } from '$lib/services/vendor.services';
	import Icon from '@iconify/svelte';

	export let open = false;
	export let collaborationId = '';
	export let initialData: any = null;
	export let onStatusChanged: () => void = () => {};

	let loading = true;
	let collab: any = null;
	let actionLoading = '';
	let statusDropdownOpen = false;
	let messageText = '';
	let messageSending = false;
	let fileInput: HTMLInputElement;
	let uploading = false;
	let showInvoiceConfirm = false;
	let invoiceSending = false;
	let invoiceSentSuccess = false;
	let resendingInvoice = false;
	let resendMessage = '';

	$: if (open && collaborationId) loadDetail();
	$: if (!open) { showInvoiceConfirm = false; invoiceSentSuccess = false; }

	// Dynamic status options based on current collaboration status
	$: validStatusOptions = getValidStatusOptions(collab?.status);

	function getValidStatusOptions(currentStatus: string): { label: string; value: string; color: string }[] {
		switch (currentStatus) {
			case 'ACCEPTED':
				return [{ label: 'Cancel Collaboration', value: 'CANCELLED', color: 'text-red-600' }];
			case 'PAYMENT_PENDING':
				return [{ label: 'Cancel Collaboration', value: 'CANCELLED', color: 'text-red-600' }];
			case 'CONFIRMED':
				return [{ label: 'Cancel Collaboration', value: 'CANCELLED', color: 'text-red-600' }];
			default:
				return [{ label: 'Cancel Collaboration', value: 'CANCELLED', color: 'text-red-600' }];
		}
	}

	function getStatusLabel(s: string): string {
		const map: Record<string, string> = {
			ACCEPTED: 'Accepted',
			PAYMENT_PENDING: 'Invoice Sent — Awaiting Payment',
			CONFIRMED: 'Paid & Confirmed',
			CANCELLED: 'Cancelled',
		};
		return map[s] || s;
	}

	async function loadDetail() {
		collab = initialData;
		loading = true;
		try { collab = await getCollaboration(collaborationId); } catch { /* use initial */ }
		finally { loading = false; }
	}

	async function handleStatusUpdate(status: string) {
		actionLoading = status;
		statusDropdownOpen = false;
		try { await updateCollaborationStatus(collaborationId, status); onStatusChanged(); await loadDetail(); } catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	async function handleSendInvoice() {
		if (!collab?.budget) return;
		invoiceSending = true;
		try {
			await sendCollaborationQuote(collaborationId, {
				quotedAmount: collab.budget,
				quotedCurrency: 'NGN',
				message: `Invoice for ${collab.title || 'service'} — ${collab.eventName || 'event'}`,
			});
			showInvoiceConfirm = false;
			invoiceSentSuccess = true;
			setTimeout(() => { invoiceSentSuccess = false; }, 4000);
			onStatusChanged();
			await loadDetail();
		} catch (e) { console.error(e); }
		finally { invoiceSending = false; }
	}

	async function handleResendInvoice() {
		if (resendingInvoice) return;
		resendingInvoice = true;
		resendMessage = '';
		try {
			const result = await resendInvoiceEmail(collaborationId);
			resendMessage = result.message || 'Invoice email resent!';
			setTimeout(() => (resendMessage = ''), 4000);
		} catch (e: any) {
			resendMessage = e.message || 'Failed to resend';
			setTimeout(() => (resendMessage = ''), 4000);
		} finally {
			resendingInvoice = false;
		}
	}

	async function handleFileUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		uploading = true;
		try {
			const url = await uploadVendorMedia(file);
			await uploadCollaborationDeliverable(collaborationId, { url, type: file.type.startsWith('image') ? 'IMAGE' : 'DOCUMENT' });
			await loadDetail();
		} catch (e) { console.error(e); }
		finally { uploading = false; }
	}

	async function handleSendMessage() {
		if (!messageText.trim()) return;
		messageSending = true;
		try {
			await sendCollaborationMessage(collaborationId, messageText.trim());
			messageText = '';
			await loadDetail();
		} catch (e) { console.error(e); }
		finally { messageSending = false; }
	}

	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
	function formatDateTime(d: string) {
		if (!d) return '';
		const dt = new Date(d);
		return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + ' · ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}
	function getStatusClass(s: string) {
		switch (s) {
			case 'ACCEPTED': case 'CONFIRMED': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'PENDING': case 'REVIEWING': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'DECLINED': case 'CANCELLED': return 'bg-[#FDEAEA] text-[#E53935]';
			case 'PAYMENT_PENDING': return 'bg-orange-100 text-orange-600';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}
</script>

{#if open}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)}
	class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0 lg:pr-10"
	role="dialog" aria-modal="true" tabindex="-1">
	<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
		role="document" on:click|stopPropagation on:keydown|stopPropagation>

		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<div class="flex items-center gap-2">
				<button aria-label="Close" on:click={() => (open = false)}><Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" /></button>
			</div>
			<div class="flex items-center gap-1.5 sm:gap-2">
				{#if collab?.quote?.invoiceNumber}
					<button on:click={() => { if (collab?.quote?.invoiceNumber) window.open(`/pay-invoice?collaborationId=${collaborationId}&invoiceNumber=${collab.quote.invoiceNumber}`, '_blank'); }} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:text-xs">
						<Icon icon="mdi:receipt-text-outline" class="h-3 w-3" /> View Invoice
					</button>
					{#if collab.quote.quoteStatus !== 'PAID'}
						<button on:click={handleResendInvoice} disabled={resendingInvoice} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-blue-600 shadow-sm hover:bg-blue-50 sm:text-xs disabled:opacity-50">
							<Icon icon="mdi:email-fast-outline" class="h-3 w-3" /> {resendingInvoice ? 'Sending...' : 'Resend Invoice'}
						</button>
					{/if}
				{:else if collab?.status === 'ACCEPTED' && collab?.budget}
					<button on:click={() => (showInvoiceConfirm = true)} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:text-xs">
						<Icon icon="mdi:receipt-text-outline" class="h-3 w-3" /> Issue Invoice
					</button>
				{/if}
				<button aria-label="Previous" class="rounded-md bg-[#F0F1F1] p-1.5 text-[#68696B] hover:bg-gray-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
				</button>
				<button aria-label="Next" class="rounded-md bg-[#F0F1F1] p-1.5 text-[#68696B] hover:bg-gray-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="custom-scrollbar flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-6 sm:pt-5">
			{#if loading && !collab}
				<div class="animate-pulse space-y-4"><div class="h-44 w-full rounded-xl bg-gray-200"></div><div class="h-6 w-48 rounded bg-gray-200"></div><div class="h-32 w-full rounded-lg bg-gray-100"></div></div>
			{:else if collab}

				<!-- Success Toast -->
				{#if invoiceSentSuccess}
					<div class="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Invoice sent! The organizer will receive an email with payment details.
					</div>
				{/if}
				{#if resendMessage}
					<div class="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm {resendMessage.includes('Failed') || resendMessage.includes('limit') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}">
						{resendMessage}
					</div>
				{/if}

				<!-- Invoice Confirmation Modal -->
				{#if showInvoiceConfirm}
					<div class="mb-5 rounded-xl border-2 border-[#DB3EC6]/20 bg-purple-50 p-5">
						<div class="mb-3 flex items-center gap-2">
							<Icon icon="mdi:receipt-text-check-outline" class="h-5 w-5 text-[#DB3EC6]" />
							<h3 class="text-sm font-bold text-gray-900">Confirm Invoice</h3>
						</div>
						<p class="mb-4 text-xs text-gray-600">
							Send an invoice to <strong>{collab.organizerName || 'the organizer'}</strong> for the following:
						</p>
						<div class="mb-4 rounded-lg bg-white p-3 space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-500">Service</span>
								<span class="text-xs font-medium text-gray-900">{collab.title || collab.description || 'Service'}</span>
							</div>
							{#if collab.description}
								<div>
									<span class="text-xs text-gray-500">Description</span>
									<p class="mt-0.5 text-xs text-gray-700">{collab.description}</p>
								</div>
							{/if}
							{#if collab.eventName}
								<div class="flex items-center justify-between">
									<span class="text-xs text-gray-500">Event</span>
									<span class="text-xs font-medium text-gray-900">{collab.eventName}</span>
								</div>
							{/if}
							<div class="flex items-center justify-between border-t border-gray-100 pt-2">
								<span class="text-xs font-medium text-gray-700">Total Amount</span>
								<span class="text-base font-bold text-gray-900">₦{Number(collab.budget).toLocaleString()}</span>
							</div>
						</div>
						<div class="flex gap-2">
							<button on:click={() => (showInvoiceConfirm = false)} class="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
								Cancel
							</button>
							<button on:click={handleSendInvoice} disabled={invoiceSending} class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#131517] px-4 py-2.5 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50">
								{#if invoiceSending}
									<div class="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
									Sending...
								{:else}
									<Icon icon="mdi:send" class="h-3 w-3" />
									Send Invoice
								{/if}
							</button>
						</div>
					</div>
				{/if}

				<!-- Hero -->
				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-teal-100 sm:h-52">
					<Icon icon="mdi:check-decagram" class="h-20 w-20 text-green-300" />
				</div>

				<div class="mb-1 flex items-center gap-2">
					<span class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-400">Product/Service Name</span>
				</div>
				<h2 class="text-lg font-bold text-gray-900 leading-tight sm:text-xl">{collab.title || collab.description || 'Collaboration'}</h2>

				<!-- Status & Payment Info -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<div class="flex items-start gap-2 mb-3">
						<Icon icon="mdi:swap-vertical" class="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
						<div>
							<p class="text-[10px] text-gray-400">Order Status</p>
							<span class="mt-0.5 inline-block rounded px-2 py-0.5 text-[10px] font-medium {getStatusClass(collab.status)}">{getStatusLabel(collab.status)}</span>
						</div>
					</div>
					{#if collab.startDate}
						<div class="flex items-start gap-2 mb-3">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[9px] font-bold text-blue-600">
								{new Date(collab.startDate).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}<br/>{new Date(collab.startDate).getDate()}
							</div>
							<p class="text-xs font-medium text-gray-800">{formatDateTime(collab.startDate)}</p>
						</div>
					{/if}
					<div class="flex items-start gap-2">
						<Icon icon="mdi:cash" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
						<div><p class="text-[10px] text-gray-400">Product Price</p><p class="text-sm font-bold text-gray-900">{collab.budget ? `₦${collab.budget.toLocaleString()}` : '—'}</p></div>
					</div>
				</div>

				<!-- Invoice Details (if invoice has been sent) -->
				{#if collab.quote?.invoiceNumber}
					<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="mb-3 text-sm font-bold text-gray-900">Invoice Details</h3>
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Invoice #</span>
								<span class="text-xs font-medium text-gray-800">{collab.quote.invoiceNumber}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Amount</span>
								<span class="text-sm font-bold text-gray-900">{collab.quote.quotedCurrency === 'USD' ? '$' : '₦'}{Number(collab.quote.quotedAmount).toLocaleString()}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Payment Status</span>
								<span class="rounded px-2 py-0.5 text-[10px] font-medium {collab.quote.quoteStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}">{collab.quote.quoteStatus === 'PAID' ? 'Paid' : 'Awaiting Payment'}</span>
							</div>
							{#if collab.quote.paidAt}
								<div class="flex items-center justify-between">
									<span class="text-xs text-gray-400">Paid on</span>
									<span class="text-xs text-gray-800">{formatDate(collab.quote.paidAt)}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Upload Deliverables -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Upload Deliverables</h3>
					<div class="flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center"
						on:drop|preventDefault
						on:dragover|preventDefault
						role="region" aria-label="Upload area">
						<Icon icon="mdi:cloud-upload-outline" class="mb-1 h-6 w-6 text-gray-400" />
						<p class="text-xs text-gray-600">Choose a file or drag & drop it here.</p>
						<p class="text-[10px] text-gray-400">JPEG, PNG, PDF, and MP4 formats, up to 50 MB.</p>
						<button on:click={() => fileInput?.click()} disabled={uploading} class="mt-2 rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
							{uploading ? 'Uploading...' : 'Browse File'}
						</button>
						<input bind:this={fileInput} type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf,.mp4" on:change={handleFileUpload} />
					</div>
				</div>

				<!-- Direct Message -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Direct Message Organizer</h3>
					<div>
						<label for="msg" class="mb-1 block text-xs font-medium text-gray-700">Message <span class="text-gray-400">(Optional)</span></label>
						<div class="relative">
							<textarea id="msg" bind:value={messageText} maxlength="200" rows="2" placeholder="Send a message to the organizer..." class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-14 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"></textarea>
							<span class="pointer-events-none absolute right-3 bottom-2 text-[9px] text-gray-400">{messageText.length}/200</span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<span class="text-[10px] text-gray-400 sm:text-xs">{collab?.updatedAt ? `Updated ${formatDate(collab.updatedAt)}` : ''}</span>
			<div class="flex items-center gap-2">
				{#if collab?.status !== 'CANCELLED' && collab?.status !== 'CONFIRMED'}
					<button on:click={() => handleStatusUpdate('CANCELLED')} disabled={!!actionLoading} class="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
						<Icon icon="mdi:close" class="h-3.5 w-3.5" /> Cancel
					</button>
				{/if}
				{#if collab?.status === 'ACCEPTED' && !collab?.quote?.invoiceNumber && collab?.budget}
					<button on:click={() => (showInvoiceConfirm = true)} disabled={invoiceSending} class="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50">
						<Icon icon="mdi:receipt-text-outline" class="h-3.5 w-3.5" /> Issue Invoice
					</button>
				{:else if collab?.status === 'CONFIRMED'}
					<span class="flex items-center gap-1.5 rounded-lg bg-green-100 px-4 py-2 text-xs font-bold text-green-700">
						<Icon icon="mdi:check" class="h-3.5 w-3.5" /> Paid & Confirmed
					</span>
				{:else if collab?.status === 'PAYMENT_PENDING'}
					<span class="flex items-center gap-1.5 rounded-lg bg-orange-100 px-4 py-2 text-xs font-medium text-orange-700">
						<Icon icon="mdi:clock-outline" class="h-3.5 w-3.5" /> Awaiting Payment
					</span>
				{/if}
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
</style>