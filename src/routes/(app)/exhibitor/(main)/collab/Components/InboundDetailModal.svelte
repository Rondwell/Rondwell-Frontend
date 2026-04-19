<script lang="ts">
	import { getExhibitorCollaboration, sendExhibitorMessage, updateExhibitorCollaborationStatus } from '$lib/services/exhibitor.services';
	import Icon from '@iconify/svelte';

	export let open = false;
	export let collaborationId = '';
	export let initialData: any = null;
	export let onStatusChanged: () => void = () => {};

	let loading = true;
	let collab: any = null;
	let actionLoading = '';
	let messageText = '';
	let messageSending = false;

	$: if (open && collaborationId) loadDetail();
	$: if (!open) { messageText = ''; }

	async function loadDetail() {
		collab = initialData;
		loading = true;
		try { collab = await getExhibitorCollaboration(collaborationId); } catch { /* use initial */ }
		finally { loading = false; }
	}

	async function handleAction(status: string) {
		actionLoading = status;
		try {
			await updateExhibitorCollaborationStatus(collaborationId, status);
			onStatusChanged();
			if (status === 'DECLINED' || status === 'CANCELLED') open = false;
			else await loadDetail();
		} catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	async function handleSendMessage() {
		if (!messageText.trim()) return;
		messageSending = true;
		try {
			await sendExhibitorMessage(collaborationId, messageText.trim());
			messageText = '';
			await loadDetail();
		} catch (e) { console.error(e); }
		finally { messageSending = false; }
	}

	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
	function getStatusClass(s: string) {
		switch (s) {
			case 'ACCEPTED': case 'CONFIRMED': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'PENDING': case 'REVIEWING': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'DECLINED': case 'REJECTED': case 'CANCELLED': return 'bg-[#FDEAEA] text-[#E53935]';
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
				<button aria-label="Close" on:click={() => (open = false)}>
					<Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" />
				</button>
			</div>
			<div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
				{#if collab?.status === 'PENDING'}
					<button on:click={() => handleAction('ACCEPTED')} disabled={!!actionLoading} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:text-xs disabled:opacity-50">
						<Icon icon="mdi:check" class="h-3 w-3 text-green-600" /> Accept Invitation
					</button>
					<button on:click={() => handleAction('DECLINED')} disabled={!!actionLoading} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:text-xs disabled:opacity-50">
						<Icon icon="mdi:close" class="h-3 w-3 text-red-500" /> Decline
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
				<div class="animate-pulse space-y-4">
					<div class="h-44 w-full rounded-xl bg-gray-200"></div>
					<div class="h-6 w-48 rounded bg-gray-200"></div>
					<div class="h-4 w-64 rounded bg-gray-100"></div>
					<div class="h-32 w-full rounded-lg bg-gray-100"></div>
				</div>
			{:else if collab}
				<!-- Hero Image -->
				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 sm:h-52">
					<Icon icon="mdi:store-outline" class="h-20 w-20 text-purple-300" />
				</div>

				<!-- Title -->
				<div class="mb-1 flex items-center gap-2">
					<span class="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-500">Exhibition Invitation</span>
					<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(collab.status)}">{collab.status}</span>
				</div>
				<h2 class="text-lg font-bold text-gray-900 leading-tight sm:text-xl">
					Invitation from {collab.organizerName || 'Organizer'}
				</h2>
				{#if collab.title}<p class="mt-0.5 text-sm text-gray-500">{collab.title}</p>{/if}

				<!-- Organizer & Event Info -->
				<div class="mt-6 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Organizer & Event Info</h3>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<img src={collab.organizerProfilePicture || '/rondwell-attendee.png'} alt="" class="h-9 w-9 rounded-full object-cover" />
							<div>
								<div class="flex items-center gap-1.5">
									<span class="text-sm font-medium text-gray-900">{collab.organizerName || 'Organizer'}</span>
									<span class="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-600">Organizer</span>
								</div>
								<p class="text-xs text-gray-400">{collab.organizerEmail || ''}</p>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex items-start gap-2">
								<Icon icon="mdi:calendar-star" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
								<div><p class="text-[10px] text-gray-400">Event</p><p class="text-xs font-medium text-gray-800">{collab.eventName || '—'}</p></div>
							</div>
							<div class="flex items-start gap-2">
								<Icon icon="mdi:map-marker-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
								<div><p class="text-[10px] text-gray-400">Location</p><p class="text-xs font-medium text-gray-800">{collab.eventLocation || '—'}</p></div>
							</div>
						</div>
					</div>
				</div>

				<!-- Exhibition Details -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Exhibition Details</h3>
					<div class="space-y-3">
						{#if collab.packageName}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:package-variant-closed" class="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
								<div><p class="text-[10px] text-gray-400">Booth Package</p><p class="text-xs font-medium text-gray-800">{collab.packageName}</p></div>
							</div>
						{/if}
						{#if collab.boothName || collab.boothId}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:store-marker-outline" class="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
								<div><p class="text-[10px] text-gray-400">Booth / Stand</p><p class="text-xs font-medium text-gray-800">{collab.boothName || collab.boothId}</p></div>
							</div>
						{/if}
						{#if collab.category}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:shape-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
								<div><p class="text-[10px] text-gray-400">Category</p><p class="text-xs font-medium text-gray-800">{collab.category}</p></div>
							</div>
						{/if}
						{#if collab.proposal}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:note-text-outline" class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
								<div><p class="text-[10px] text-gray-400">Details / Notes</p><p class="text-xs font-medium text-gray-800">{collab.proposal}</p></div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Invoice / Payment Info (if applicable) -->
				{#if collab.invoice?.invoiceNumber}
					<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="mb-3 text-sm font-bold text-gray-900">Invoice Details</h3>
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Invoice #</span>
								<span class="text-xs font-medium text-gray-800">{collab.invoice.invoiceNumber}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Amount</span>
								<span class="text-sm font-bold text-gray-900">{collab.invoice.currency === 'USD' ? '$' : '₦'}{Number(collab.invoice.amount).toLocaleString()}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Payment Status</span>
								<span class="rounded px-2 py-0.5 text-[10px] font-medium {collab.invoice.invoiceStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}">{collab.invoice.invoiceStatus === 'PAID' ? 'Paid' : 'Awaiting Payment'}</span>
							</div>
							{#if collab.invoice.paidAt}
								<div class="flex items-center justify-between">
									<span class="text-xs text-gray-400">Paid on</span>
									<span class="text-xs text-gray-800">{formatDate(collab.invoice.paidAt)}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Conversation History -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Conversation History</h3>
					{#if collab.messages?.length > 0}
						<div class="mb-3 max-h-40 space-y-2 overflow-y-auto">
							{#each collab.messages as msg}
								<div class="rounded-lg bg-gray-50 p-2">
									<p class="text-xs font-medium text-gray-700">{msg.senderId}</p>
									<p class="text-xs text-gray-600">{msg.content}</p>
									<p class="mt-0.5 text-[9px] text-gray-400">{formatDate(msg.timestamp)}</p>
								</div>
							{/each}
						</div>
					{/if}
					<div>
						<label for="exhib-msg" class="mb-1 block text-xs font-medium text-gray-700">Message to Organizer <span class="text-gray-400">(Optional)</span></label>
						<div class="relative">
							<textarea id="exhib-msg" bind:value={messageText} maxlength="200" rows="2" placeholder="Send a message to the organizer..." class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-14 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
							<span class="pointer-events-none absolute right-3 bottom-2 text-[9px] text-gray-400">{messageText.length}/200</span>
						</div>
						{#if messageText.trim()}
							<button on:click={handleSendMessage} disabled={messageSending} class="mt-2 rounded-lg bg-black px-4 py-1.5 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50">
								{messageSending ? 'Sending...' : 'Send Message'}
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<span class="text-[10px] text-gray-400 sm:text-xs">{collab?.createdAt ? `Received ${formatDate(collab.createdAt)}` : ''}</span>
			{#if collab?.status === 'PENDING'}
				<div class="flex items-center gap-2">
					<button on:click={() => handleAction('DECLINED')} disabled={!!actionLoading} class="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
						<Icon icon="mdi:close" class="h-3.5 w-3.5" /> Decline
					</button>
					<button on:click={() => handleAction('ACCEPTED')} disabled={!!actionLoading} class="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50">
						<Icon icon="mdi:check" class="h-3.5 w-3.5" /> Accept Invitation
					</button>
				</div>
			{:else if collab?.status === 'ACCEPTED'}
				<span class="flex items-center gap-1.5 rounded-lg bg-green-100 px-4 py-2 text-xs font-bold text-green-700">
					<Icon icon="mdi:check" class="h-3.5 w-3.5" /> Accepted
				</span>
			{:else if collab?.status === 'CONFIRMED'}
				<span class="flex items-center gap-1.5 rounded-lg bg-green-100 px-4 py-2 text-xs font-bold text-green-700">
					<Icon icon="mdi:check-decagram" class="h-3.5 w-3.5" /> Confirmed
				</span>
			{/if}
		</div>
	</div>
</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
</style>
