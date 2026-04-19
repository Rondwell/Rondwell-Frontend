<script lang="ts">
	import { getCollaboration, sendCollaborationMessage, sendCollaborationQuote, updateCollaborationStatus } from '$lib/services/vendor.services';
	import Icon from '@iconify/svelte';

	export let open = false;
	export let collaborationId = '';
	export let initialData: any = null;
	export let onStatusChanged: () => void = () => {};

	let loading = true;
	let collab: any = null;
	let actionLoading = '';
	let showQuoteForm = false;
	let quoteAmount = '';
	let quoteCurrency = 'NGN';
	let quoteMessage = '';
	let quoteSending = false;
	let messageText = '';
	let messageSending = false;
	let quoteSentSuccess = false;

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

	$: if (open && collaborationId) { loadDetail(); }
	$: if (!open) { showQuoteForm = false; quoteAmount = ''; quoteMessage = ''; messageText = ''; }

	async function loadDetail() {
		collab = initialData;
		loading = true;
		try {
			const detail = await getCollaboration(collaborationId);
			collab = detail;
		} catch { /* use initialData */ }
		finally { loading = false; }
	}

	async function handleAction(status: string) {
		actionLoading = status;
		try {
			await updateCollaborationStatus(collaborationId, status);
			onStatusChanged();
			if (status === 'DECLINED' || status === 'CANCELLED') open = false;
			else await loadDetail();
		} catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	async function handleSendQuote() {
		if (!quoteAmount) return;
		quoteSending = true;
		try {
			await sendCollaborationQuote(collaborationId, { quotedAmount: parseFloat(quoteAmount), quotedCurrency: quoteCurrency, message: quoteMessage });
			showQuoteForm = false;
			quoteAmount = ''; quoteMessage = '';
			quoteSentSuccess = true;
			setTimeout(() => { quoteSentSuccess = false; }, 3000);
			onStatusChanged();
			await loadDetail();
		} catch (e) { console.error(e); }
		finally { quoteSending = false; }
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
						<Icon icon="mdi:check" class="h-3 w-3 text-green-600" /> Accept Order
					</button>
					<button on:click={() => handleAction('DECLINED')} disabled={!!actionLoading} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:text-xs disabled:opacity-50">
						<Icon icon="mdi:close" class="h-3 w-3 text-red-500" /> Decline
					</button>
					<button on:click={() => (showQuoteForm = !showQuoteForm)} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:text-xs">
						<Icon icon="mdi:message-outline" class="h-3 w-3" /> Message
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
				{#if quoteSentSuccess}
					<div class="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Quote sent successfully! The organizer will receive an email with payment details.
					</div>
				{/if}

				<!-- Hero Image -->
				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 sm:h-52">
					<Icon icon="mdi:handshake-outline" class="h-20 w-20 text-purple-300" />
				</div>

				<!-- Title -->
				<div class="mb-1 flex items-center gap-2">
					<span class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-400">Private Event</span>
					<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(collab.status)}">{collab.status}</span>
				</div>
				<h2 class="text-lg font-bold text-gray-900 leading-tight sm:text-xl">
					Order Request from {collab.organizerName || collab.creatorId?.username || 'Organizer'}
				</h2>
				{#if collab.title}<p class="mt-0.5 text-sm text-gray-500">{collab.title}</p>{/if}

				<!-- ═══ Organizer & Event Info ═══ -->
				<div class="mt-6 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Organizer and event info</h3>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<img src={collab.organizerProfilePicture || collab.creatorId?.avatar || '/rondwell-attendee.png'} alt="" class="h-9 w-9 rounded-full object-cover" />
							<div>
								<div class="flex items-center gap-1.5">
									<span class="text-sm font-medium text-gray-900">{collab.organizerName || collab.creatorId?.username || 'Organizer'}</span>
									<span class="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-600">Organizer</span>
								</div>
								<p class="text-xs text-gray-400">{collab.organizerEmail || collab.creatorId?.email || ''}</p>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex items-start gap-2">
								<Icon icon="mdi:email-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
								<div><p class="text-[10px] text-gray-400">Email Address</p><p class="text-xs font-medium text-gray-800">{collab.organizerEmail || collab.creatorId?.email || '—'}</p></div>
							</div>
							<div class="flex items-start gap-2">
								<Icon icon="mdi:phone-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
								<div><p class="text-[10px] text-gray-400">Phone Number</p><p class="text-xs font-medium text-gray-800">—</p></div>
							</div>
						</div>
						{#if collab.startDate || collab.endDate}
							<div class="flex items-start gap-2">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[9px] font-bold text-blue-600">
									{new Date(collab.startDate || collab.createdAt).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}<br/>{new Date(collab.startDate || collab.createdAt).getDate()}
								</div>
								<div><p class="text-xs font-medium text-gray-800">{formatDateTime(collab.startDate || collab.createdAt)}</p></div>
							</div>
						{/if}
						{#if collab.venue}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:map-marker-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
								<p class="text-xs font-medium text-gray-800">{collab.venue}</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- ═══ Requested Service/Product ═══ -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Requested Service/Product</h3>
					<div class="space-y-3">
						<div class="flex items-start gap-2">
							<Icon icon="mdi:package-variant-closed" class="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
							<div><p class="text-[10px] text-gray-400">Product/Service Name</p><p class="text-xs font-medium text-gray-800">{collab.title || collab.description || 'Not specified'}</p></div>
						</div>
						{#if collab.duration}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:clock-outline" class="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
								<div><p class="text-[10px] text-gray-400">Requested Quantity/Duration</p><p class="text-xs font-medium text-gray-800">{collab.duration} minutes</p></div>
							</div>
						{/if}
						{#if collab.proposal}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:note-text-outline" class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
								<div><p class="text-[10px] text-gray-400">Specific Notes/Requirements</p><p class="text-xs font-medium text-gray-800">{collab.proposal}</p></div>
							</div>
						{/if}
					</div>
				</div>

				<!-- ═══ Pricing & Payment ═══ -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Pricing & Payment (if applicable)</h3>
					<div class="space-y-3">
						<div class="flex items-start gap-2">
							<Icon icon="mdi:cash" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
							<div><p class="text-[10px] text-gray-400">Product Price</p><p class="text-xs font-bold text-gray-900">{collab.budget ? `₦${collab.budget.toLocaleString()}` : '—'}</p></div>
						</div>
						<div class="flex items-start gap-2">
							<Icon icon="mdi:tag-outline" class="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
							<div>
								<p class="text-[10px] text-gray-400">Product Status</p>
								<span class="mt-0.5 inline-block rounded px-2 py-0.5 text-[10px] font-medium {getStatusClass(collab.status)}">{collab.status === 'PENDING' ? 'Awaiting your Quote' : collab.status}</span>
							</div>
						</div>
						{#if collab.category}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:shape-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
								<div><p class="text-[10px] text-gray-400">Package and price</p><p class="text-xs font-medium text-gray-800">{collab.category}</p></div>
							</div>
						{/if}
					</div>

					<!-- Files -->
					{#if collab.deliverables?.length > 0}
						<div class="mt-3 border-t border-gray-100 pt-3">
							<p class="mb-2 text-[10px] text-gray-400">Files/Attachments</p>
							<div class="space-y-2">
								{#each collab.deliverables as file, idx}
									<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2">
										<div class="flex items-center gap-2 min-w-0">
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-50 text-[8px] font-bold text-red-500">PDF</div>
											<div class="min-w-0"><p class="truncate text-xs font-medium text-gray-800">Event brief.pdf</p><p class="text-[10px] text-gray-400">Uploaded</p></div>
										</div>
										<button class="shrink-0 p-1 text-gray-300 hover:text-red-400" aria-label="Delete"><Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /></button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- ═══ Conversation History ═══ -->
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
						<label class="mb-1 block text-xs font-medium text-gray-700">Message to Organizer <span class="text-gray-400">(Optional)</span></label>
						<div class="relative">
							<textarea bind:value={messageText} maxlength="200" rows="2" placeholder="Describe your company..." class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-14 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
							<span class="pointer-events-none absolute right-3 bottom-2 text-[9px] text-gray-400">{messageText.length}/200</span>
						</div>
						<p class="mt-1 flex items-center gap-1 text-[9px] text-gray-400"><Icon icon="mdi:information-outline" class="h-3 w-3" /> You can describe your company briefly.</p>
					</div>
				</div>

				<!-- ═══ Send Quote Form ═══ -->
				{#if showQuoteForm}
					<div class="mt-5 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50 p-4">
						<h3 class="mb-3 text-sm font-bold text-gray-900">Send Quote</h3>
						<div class="space-y-3">
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="mb-1 block text-xs font-medium text-gray-700">Amount</label>
									<input type="number" bind:value={quoteAmount} placeholder="0.00" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
								</div>
								<div>
									<label class="mb-1 block text-xs font-medium text-gray-700">Currency</label>
									<select bind:value={quoteCurrency} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none">
										<option value="NGN">NGN (₦)</option>
										<option value="USD">USD ($)</option>
									</select>
								</div>
							</div>
							<div>
								<label class="mb-1 block text-xs font-medium text-gray-700">Message</label>
								<textarea bind:value={quoteMessage} rows="2" placeholder="Add a note..." class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none"></textarea>
							</div>
							<div class="flex gap-2">
								<button on:click={() => (showQuoteForm = false)} class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
								<button on:click={handleSendQuote} disabled={quoteSending || !quoteAmount} class="rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50">
									{quoteSending ? 'Sending...' : 'Send Quote'}
								</button>
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<span class="text-[10px] text-gray-400 sm:text-xs">{collab?.createdAt ? `Received ${formatDate(collab.createdAt)}` : ''}</span>
			{#if collab?.status === 'PENDING'}
				<button on:click={() => (showQuoteForm = !showQuoteForm)} class="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800">
					<Icon icon="mdi:currency-usd" class="h-3.5 w-3.5" /> Send Quote
				</button>
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
