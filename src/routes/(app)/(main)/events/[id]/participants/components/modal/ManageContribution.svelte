<script lang="ts">
	import { markPaidOffline, sendPaymentRequest } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'Exhibitor';
	export let speakerData: any = null;
	export let eventId = '';

	let participantUp = participant.charAt(0).toUpperCase() + participant.slice(1);
	let sendingPayment = false;
	let markingPaid = false;
	let showMarkPaidConfirm = false;
	let error = '';
	let success = '';

	$: participantName = speakerData?.displayName || speakerData?.applicationDetails?.companyName || 'Participant';
	$: contributionAmount = speakerData?.paymentDetails?.contributionAmount || 0;
	$: currency = speakerData?.paymentDetails?.currency || 'USD';
	$: paymentStatus = speakerData?.paymentDetails?.paymentStatus || 'PENDING';
	$: packageName = speakerData?.packageName || speakerData?.paymentDetails?.sponsorshipTier || 'N/A';

	function getPaymentStatusLabel(status: string): string {
		const map: Record<string, string> = { PENDING: 'Pending', COMPLETED: 'Paid', FAILED: 'Overdue', REFUNDED: 'Refunded' };
		return map[status] || status;
	}

	function getPaymentStatusColor(status: string): string {
		if (status === 'COMPLETED') return 'text-green-600 bg-green-50';
		if (status === 'FAILED') return 'text-red-600 bg-red-50';
		if (status === 'PENDING') return 'text-yellow-600 bg-yellow-50';
		return 'text-gray-600 bg-gray-50';
	}

	async function handleSendPaymentRequest() {
		if (!speakerData?.id || !eventId) return;
		sendingPayment = true;
		error = '';
		success = '';
		try {
			await sendPaymentRequest(eventId, speakerData.id);
			success = 'Payment request sent successfully!';
			dispatch('updated');
		} catch (e: any) {
			error = e.message || 'Failed to send payment request';
		} finally {
			sendingPayment = false;
		}
	}

	async function handleMarkPaid() {
		if (!speakerData?.id || !eventId) return;
		markingPaid = true;
		error = '';
		success = '';
		try {
			await markPaidOffline(eventId, speakerData.id, { paymentMethod: 'EXTERNAL', paymentReference: 'Offline payment' });
			success = 'Marked as paid successfully!';
			showMarkPaidConfirm = false;
			dispatch('updated');
			setTimeout(() => { open = false; success = ''; }, 1500);
		} catch (e: any) {
			error = e.message || 'Failed to mark as paid';
		} finally {
			markingPaid = false;
		}
	}
</script>

{#if open}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/50 px-3 py-10 md:items-center" role="dialog" aria-modal="true" tabindex="-1">
		<div class="max-h-130 w-full max-w-2xl rounded-xl bg-white shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<!-- Header -->
			<div class="flex items-start justify-between border-b border-gray-200 px-6 py-4 md:items-center">
				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex items-center gap-3">
						<button aria-label="Close" on:click={() => (open = false)}>
							<Icon icon="mdi:close" class="text-lg text-gray-500" />
						</button>
						<p class="font-medium">Manage {participantUp} Contribution</p>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="custom-scrollbar max-h-80 space-y-6 overflow-y-auto px-6 py-6" style="background-image: linear-gradient(180deg, #DBD4F1 0%, #DBE5F5 17%, #FFFFFF 35%);">
				<h3 class="mb-4 text-xl font-semibold text-gray-700">Manage Contribution for {participantName}</h3>

				{#if error}
					<p class="text-sm text-red-500">{error}</p>
				{/if}
				{#if success}
					<p class="text-sm text-green-600">{success}</p>
				{/if}

				<!-- Participant Info -->
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div class="flex items-center gap-2">
						{#if speakerData?.profilePictureUrl}
							<img src={speakerData.profilePictureUrl} alt={participantName} class="h-10 w-10 rounded-lg object-cover" />
						{:else}
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-lg font-medium text-orange-600">
								{participantName.charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							<p class="font-semibold text-gray-900">{participantName}</p>
							<p class="text-xs text-gray-400">{speakerData?.applicationDetails?.contactEmail || ''}</p>
						</div>
					</div>
					<span class="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium {getPaymentStatusColor(paymentStatus)}">
						{getPaymentStatusLabel(paymentStatus)}
					</span>
				</div>

				<!-- Payment Details -->
				<div class="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
					<div>
						<p class="text-xs text-[#C1C2C2]">Package Assigned</p>
						<p class="text-sm font-semibold text-black">{packageName}</p>
					</div>
					<div>
						<p class="text-xs text-[#C1C2C2]">Amount Due</p>
						<p class="text-sm font-semibold text-black">{currency} {contributionAmount.toLocaleString()}</p>
					</div>
					<div>
						<p class="text-xs text-[#C1C2C2]">Contribution Status</p>
						<p class="text-sm font-semibold text-black">{getPaymentStatusLabel(paymentStatus)}</p>
					</div>
					{#if speakerData?.paymentDetails?.paymentDate}
						<div>
							<p class="text-xs text-[#C1C2C2]">Payment Date</p>
							<p class="text-sm font-semibold text-black">{new Date(speakerData.paymentDetails.paymentDate).toLocaleDateString()}</p>
						</div>
					{/if}
				</div>

				<!-- Mark as Paid Confirmation -->
				{#if showMarkPaidConfirm}
					<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<p class="text-sm text-yellow-800">
							Confirm marking {currency} {contributionAmount.toLocaleString()} for {participantName} as paid offline. This action will update their status and cannot be undone.
						</p>
						<div class="mt-3 flex gap-2">
							<button on:click={() => (showMarkPaidConfirm = false)} class="rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 shadow-xs">Cancel</button>
							<button on:click={handleMarkPaid} disabled={markingPaid} class="rounded-md bg-black px-3 py-1.5 text-sm text-white shadow-xs disabled:opacity-50">
								{markingPaid ? 'Processing...' : 'Confirm Paid'}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex flex-wrap items-center gap-2 border-t p-6">
				<button on:click={() => (open = false)} class="rounded-md bg-[#F4F5F6] px-4 py-2 text-gray-600 shadow-xs">Close</button>
				{#if paymentStatus !== 'COMPLETED'}
					<button on:click={handleSendPaymentRequest} disabled={sendingPayment} class="rounded-md bg-black px-4 py-2 text-white shadow-xs disabled:opacity-50">
						{sendingPayment ? 'Sending...' : 'Send Payment Request'}
					</button>
					<button on:click={() => (showMarkPaidConfirm = true)} class="rounded-md border px-4 py-2 text-sm text-gray-700 shadow-xs">
						Mark as Paid (Offline)
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
