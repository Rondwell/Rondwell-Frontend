<script lang="ts">
	import { getSpeakerCollaboration, getSpeakerCollaborations, sendSpeakerMessage, updateSpeakerCollaborationStatus } from '$lib/services/speaker.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let loading = true;
	let events: any[] = [];
	let searchQuery = '';
	let statusFilter = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let showStatusDropdown = false;
	let currentPage = 1;
	let totalPages = 1;
	const limit = 20;

	// Detail modal state
	let showDetailModal = false;
	let selectedId = '';
	let selectedCollab: any = null;
	let detailLoading = false;
	let messageText = '';
	let messageSending = false;
	let actionLoading = '';

	const statusOptions = [
		{ label: 'Accepted', value: 'ACCEPTED' },
		{ label: 'Awaiting Payment', value: 'PAYMENT_PENDING' },
		{ label: 'Confirmed (Paid)', value: 'CONFIRMED' },
	];

	async function fetchEvents() {
		loading = true;
		try {
			const filters: any = { page: currentPage, limit, sortBy: 'createdAt', sortOrder: 'desc', status: statusFilter || 'ACCEPTED' };
			if (searchQuery) filters.search = searchQuery;
			if (statusFilter) filters.status = statusFilter;
			const result = await getSpeakerCollaborations(filters);
			events = result?.collaborations || result?.data || [];
			if (!Array.isArray(events)) events = [];
			const pg = result?.pagination;
			if (pg) totalPages = pg.totalPages || 1;
		} catch { events = []; }
		finally { loading = false; }
	}

	onMount(() => { fetchEvents(); });
	function handleSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { currentPage = 1; fetchEvents(); }, 300); }
	function selectStatus(v: string) { statusFilter = v; showStatusDropdown = false; currentPage = 1; fetchEvents(); }
	function goToPage(p: number) { if (p >= 1 && p <= totalPages) { currentPage = p; fetchEvents(); } }

	function openDetail(c: any) { selectedId = c._id; selectedCollab = c; showDetailModal = true; loadDetail(); }
	async function loadDetail() {
		detailLoading = true;
		try { selectedCollab = await getSpeakerCollaboration(selectedId); } catch {}
		finally { detailLoading = false; }
	}

	async function handleSendMessage() {
		if (!messageText.trim()) return;
		messageSending = true;
		try { await sendSpeakerMessage(selectedId, messageText.trim()); messageText = ''; await loadDetail(); } catch (e) { console.error(e); }
		finally { messageSending = false; }
	}

	async function handleCancel() {
		actionLoading = 'CANCELLED';
		try { await updateSpeakerCollaborationStatus(selectedId, 'CANCELLED'); fetchEvents(); showDetailModal = false; } catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''; }
	function formatDateLong(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
	function formatDateTime(d: string) {
		if (!d) return '';
		const dt = new Date(d);
		return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + ' · ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}
	function getStatusClass(s: string) {
		switch (s) {
			case 'ACCEPTED': return 'text-[#3CBD2C]';
			case 'CONFIRMED': return 'text-[#3CBD2C]';
			case 'PAYMENT_PENDING': return 'text-[#EAAB26]';
			case 'CANCELLED': return 'text-[#E53935]';
			default: return 'text-[#616265]';
		}
	}
	function getStatusLabel(s: string) {
		switch (s) {
			case 'ACCEPTED': return 'Accepted';
			case 'PAYMENT_PENDING': return 'Awaiting Payment';
			case 'CONFIRMED': return 'Paid & Confirmed';
			case 'CANCELLED': return 'Cancelled';
			default: return s;
		}
	}
	function getStatusBadgeClass(s: string) {
		switch (s) {
			case 'ACCEPTED': case 'CONFIRMED': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'PAYMENT_PENDING': return 'bg-orange-100 text-orange-600';
			case 'CANCELLED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}
	function getTypeLabel(t: string) {
		switch (t) {
			case 'INVITATION': return 'Inbound';
			case 'SENT_REQUEST': return 'Sent';
			case 'APPLICATION': return 'Applied';
			default: return t;
		}
	}
	function getTypeBadgeClass(t: string) {
		switch (t) {
			case 'INVITATION': return 'bg-blue-50 text-blue-600';
			case 'SENT_REQUEST': return 'bg-orange-50 text-orange-600';
			default: return 'bg-gray-100 text-gray-600';
		}
	}
</script>

<div>
	<div class="mb-5">
		<h2 class="flex items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">Accepted Collaborations <Icon icon="mdi:information-outline" class="h-4 w-4 text-gray-400" /></h2>
		<p class="mt-0.5 text-xs text-gray-400 sm:text-sm">All collaborations that have been accepted — both invitations you accepted and requests organizers approved.</p>
	</div>

	<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative w-full sm:max-w-sm">
			<img src="/search-favorite.svg" alt="" class="absolute left-3 top-2.5 h-4 w-4" />
			<input type="text" bind:value={searchQuery} on:input={handleSearch} placeholder="Search collaborations..." class="h-10 w-full rounded-lg bg-white py-2 pl-10 pr-3 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none" />
		</div>
		<div class="relative">
			<button on:click={() => (showStatusDropdown = !showStatusDropdown)} class="flex items-center gap-2 rounded-lg bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265]">
				Status <Icon icon="mdi:chevron-down" class="h-3 w-3" />
			</button>
			{#if showStatusDropdown}
				<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showStatusDropdown = false)} aria-label="Close"></button>
				<div class="absolute right-0 z-20 mt-1 w-40 rounded-lg border bg-white p-1 shadow-lg">
					{#each statusOptions as opt}
						<button on:click={() => selectStatus(opt.value)} class="flex w-full items-center rounded-md px-3 py-2 text-left text-xs hover:bg-gray-50 {statusFilter === opt.value ? 'bg-gray-50 font-medium' : ''}">{opt.label}</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="rounded-lg bg-white">
			{#each Array(5) as _}
				<div class="flex animate-pulse items-center gap-4 border-b px-4 py-3 last:border-b-0">
					<div class="h-8 w-8 rounded-full bg-gray-200"></div><div class="h-4 w-28 rounded bg-gray-200"></div><div class="h-4 w-36 rounded bg-gray-100"></div><div class="ml-auto h-4 w-16 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if events.length > 0}
		<div class="hidden rounded-lg bg-white sm:block">
			{#each events as ev (ev._id)}
				<div class="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50">
					<div class="col-span-3 flex items-center gap-2 min-w-0">
						<img src={ev.organizerProfilePicture || '/rondwell-attendee.png'} alt="" class="h-7 w-7 shrink-0 rounded-full object-cover" />
						<span class="truncate font-medium text-gray-900">{ev.organizerName || 'Organizer'}</span>
					</div>
					<div class="col-span-3 truncate text-gray-600">{ev.eventName || ev.title || '—'}</div>
					<div class="col-span-1"><span class="rounded px-1.5 py-0.5 text-[10px] font-medium {getTypeBadgeClass(ev.type)}">{getTypeLabel(ev.type)}</span></div>
					<div class="col-span-2 truncate text-gray-400">{ev.trackName || ev.category || '—'}</div>
					<div class="col-span-1 text-xs text-gray-400">{formatDate(ev.createdAt)}</div>
					<div class="col-span-2 flex items-center justify-end gap-2">
						<span class="text-xs font-medium {getStatusClass(ev.status)}">{getStatusLabel(ev.status)}</span>
						<button on:click={() => openDetail(ev)} class="rounded-md bg-[#EBECED] px-2.5 py-1 text-[10px] font-medium text-[#616265] hover:bg-gray-300">View</button>
					</div>
				</div>
			{/each}
		</div>
		<div class="space-y-2 sm:hidden">
			{#each events as ev (ev._id)}
				<button on:click={() => openDetail(ev)} class="flex w-full items-center justify-between rounded-lg bg-white p-3 text-left">
					<div class="flex items-center gap-2.5 min-w-0">
						<img src={ev.organizerProfilePicture || '/rondwell-attendee.png'} alt="" class="h-8 w-8 shrink-0 rounded-full object-cover" />
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-gray-900">{ev.organizerName || 'Organizer'}</p>
							<p class="truncate text-xs text-gray-400">{ev.eventName || ev.title || '—'}</p>
						</div>
					</div>
					<div class="flex flex-col items-end gap-0.5 shrink-0">
						<span class="rounded px-1.5 py-0.5 text-[10px] font-medium {getTypeBadgeClass(ev.type)}">{getTypeLabel(ev.type)}</span>
						<span class="text-[10px] font-medium {getStatusClass(ev.status)}">{getStatusLabel(ev.status)}</span>
						<span class="text-[10px] text-gray-400">{formatDate(ev.createdAt)}</span>
					</div>
				</button>
			{/each}
		</div>
		{#if totalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40">Previous</button>
				{#each Array(Math.min(totalPages, 5)) as _, i}
					{@const pg = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i}
					<button on:click={() => goToPage(pg)} class="h-8 w-8 rounded-md text-sm {currentPage === pg ? 'bg-[#7C3AED] text-white' : 'text-gray-500 hover:bg-gray-100'}">{pg}</button>
				{/each}
				<button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40">Next</button>
			</div>
		{/if}
	{:else}
		<div class="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-center">
			<Icon icon="mdi:check-decagram-outline" class="mb-3 h-16 w-16 text-gray-200" />
			<p class="text-sm font-medium text-gray-500">No accepted collaborations yet</p>
			<p class="mt-1 text-xs text-gray-400">Collaborations you've accepted or that organizers have approved will appear here.</p>
		</div>
	{/if}
</div>

<!-- Accepted Detail Side Modal -->
{#if showDetailModal}
<div on:click={() => (showDetailModal = false)} on:keydown={(e) => e.key === 'Escape' && (showDetailModal = false)}
	class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0 lg:pr-10"
	role="dialog" aria-modal="true" tabindex="-1">
	<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
		role="document" on:click|stopPropagation on:keydown|stopPropagation>

		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<button aria-label="Close" on:click={() => (showDetailModal = false)}><Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" /></button>
			<div class="flex items-center gap-1.5 sm:gap-2">
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
			{#if detailLoading && !selectedCollab}
				<div class="animate-pulse space-y-4"><div class="h-44 w-full rounded-xl bg-gray-200"></div><div class="h-6 w-48 rounded bg-gray-200"></div><div class="h-32 w-full rounded-lg bg-gray-100"></div></div>
			{:else if selectedCollab}
				<!-- Hero -->
				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-teal-100 sm:h-52">
					<Icon icon="mdi:check-decagram" class="h-20 w-20 text-green-300" />
				</div>

				<div class="mb-1 flex items-center gap-2">
					<span class="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-500">Speaking Engagement</span>
					<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusBadgeClass(selectedCollab.status)}">{getStatusLabel(selectedCollab.status)}</span>
				</div>
				<h2 class="text-lg font-bold text-gray-900 leading-tight sm:text-xl">{selectedCollab.title || selectedCollab.eventName || 'Collaboration'}</h2>

				<!-- Status & Event Info -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Organizer & Event Info</h3>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<img src={selectedCollab.organizerProfilePicture || '/rondwell-attendee.png'} alt="" class="h-9 w-9 rounded-full object-cover" />
							<div>
								<div class="flex items-center gap-1.5">
									<span class="text-sm font-medium text-gray-900">{selectedCollab.organizerName || 'Organizer'}</span>
									<span class="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-600">Organizer</span>
								</div>
								<p class="text-xs text-gray-400">{selectedCollab.organizerEmail || ''}</p>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="flex items-start gap-2">
								<Icon icon="mdi:calendar-star" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
								<div><p class="text-[10px] text-gray-400">Event</p><p class="text-xs font-medium text-gray-800">{selectedCollab.eventName || '—'}</p></div>
							</div>
							<div class="flex items-start gap-2">
								<Icon icon="mdi:map-marker-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
								<div><p class="text-[10px] text-gray-400">Location</p><p class="text-xs font-medium text-gray-800">{selectedCollab.eventLocation || selectedCollab.venue || '—'}</p></div>
							</div>
						</div>
						{#if selectedCollab.startDate}
							<div class="flex items-start gap-2">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[9px] font-bold text-blue-600">
									{new Date(selectedCollab.startDate).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}<br/>{new Date(selectedCollab.startDate).getDate()}
								</div>
								<p class="text-xs font-medium text-gray-800">{formatDateTime(selectedCollab.startDate)}</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Attached Portfolios -->
				{#if selectedCollab.portfolios?.length > 0}
					<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="mb-3 text-sm font-bold text-gray-900">
							<span class="flex items-center gap-1.5">
								<Icon icon="mdi:briefcase-outline" class="h-4 w-4 text-purple-500" />
								Speaker Portfolio ({selectedCollab.portfolios.length})
							</span>
						</h3>
						<div class="space-y-2">
							{#each selectedCollab.portfolios as p}
								<div class="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
									{#if p.mediaUrl}
										<img src={p.mediaUrl} alt="" class="h-10 w-10 rounded-lg object-cover shrink-0" />
									{:else}
										<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 shrink-0">
											<Icon icon="mdi:microphone-variant" class="h-4 w-4 text-purple-400" />
										</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate text-xs font-medium text-gray-900">{p.title}</p>
										{#if p.category}
											<span class="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">{p.category}</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Quote / Payment Info -->
				{#if selectedCollab.quote?.invoiceNumber}
					<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="mb-3 text-sm font-bold text-gray-900">Payment Details</h3>
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Invoice #</span>
								<span class="text-xs font-medium text-gray-800">{selectedCollab.quote.invoiceNumber}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Amount</span>
								<span class="text-sm font-bold text-gray-900">{selectedCollab.quote.quotedCurrency === 'USD' ? '$' : '₦'}{Number(selectedCollab.quote.quotedAmount).toLocaleString()}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-400">Payment Status</span>
								<span class="rounded px-2 py-0.5 text-[10px] font-medium {selectedCollab.quote.quoteStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}">{selectedCollab.quote.quoteStatus === 'PAID' ? 'Paid' : 'Awaiting Payment'}</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Conversation -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Direct Message Organizer</h3>
					{#if selectedCollab.messages?.length > 0}
						<div class="mb-3 max-h-40 space-y-2 overflow-y-auto">
							{#each selectedCollab.messages as msg}
								<div class="rounded-lg bg-gray-50 p-2">
									<p class="text-xs font-medium text-gray-700">{msg.senderId}</p>
									<p class="text-xs text-gray-600">{msg.content}</p>
									<p class="mt-0.5 text-[9px] text-gray-400">{formatDateLong(msg.timestamp)}</p>
								</div>
							{/each}
						</div>
					{/if}
					<div>
						<label for="acc-msg" class="mb-1 block text-xs font-medium text-gray-700">Message <span class="text-gray-400">(Optional)</span></label>
						<div class="relative">
							<textarea id="acc-msg" bind:value={messageText} maxlength="200" rows="2" placeholder="Send a message to the organizer..." class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-14 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"></textarea>
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
			<span class="text-[10px] text-gray-400 sm:text-xs">{selectedCollab?.updatedAt ? `Updated ${formatDateLong(selectedCollab.updatedAt)}` : ''}</span>
			<div class="flex items-center gap-2">
				{#if selectedCollab?.status !== 'CANCELLED' && selectedCollab?.status !== 'CONFIRMED'}
					<button on:click={handleCancel} disabled={!!actionLoading} class="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
						<Icon icon="mdi:close" class="h-3.5 w-3.5" /> Cancel
					</button>
				{/if}
				{#if selectedCollab?.status === 'CONFIRMED'}
					<span class="flex items-center gap-1.5 rounded-lg bg-green-100 px-4 py-2 text-xs font-bold text-green-700">
						<Icon icon="mdi:check" class="h-3.5 w-3.5" /> Confirmed
					</span>
				{:else if selectedCollab?.status === 'PAYMENT_PENDING'}
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
