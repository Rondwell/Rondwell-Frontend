<script lang="ts">
	import { searchProfiles } from '$lib/services/profile.services';
	import { deleteSpeakerCollaboration, discoverEvents, getSpeakerCollaboration, getSpeakerPortfolios, resendSpeakerCollaborationEmail, sendSpeakerCollaborationRequest, withdrawSpeakerCollaboration } from '$lib/services/speaker.services';
	import Icon from '@iconify/svelte';
	import DatePickerModal from '../../../../create-event/components/DatePickerModal.svelte';

	export let open = false;
	export let collaborationId = '';
	export let initialData: any = null;
	export let mode: 'view' | 'create' = 'view';
	export let speakerName = '';
	export let speakerProfilePictureUrl = '';
	export let onStatusChanged: () => void = () => {};

	let loading = true;
	let collab: any = null;
	let actionLoading = '';
	let resendLoading = false;
	let resendMessage = '';
	let showDeleteConfirm = false;
	let deleteLoading = false;

	// ─── Organizer Search ─────────────────────────────────────────────────
	let organizerSearch = '';
	let organizerResults: any[] = [];
	let selectedOrganizer: any = null;
	let organizerSearching = false;
	let showOrganizerDropdown = false;
	let orgSearchTimeout: ReturnType<typeof setTimeout>;

	// ─── Event Search ─────────────────────────────────────────────────────
	let eventSearch = '';
	let eventResults: any[] = [];
	let selectedEvent: any = null;
	let eventSearching = false;
	let showEventDropdown = false;
	let eventSearchTimeout: ReturnType<typeof setTimeout>;

	// ─── Date Picker ──────────────────────────────────────────────────────
	let showDatePicker = false;
	let selectedDate: Date | null = null;

	// ─── Topic & Proposal ─────────────────────────────────────────────────
	let topicTitle = '';
	let proposalText = '';
	let categoryText = '';
	let creating = false;

	// ─── Portfolio Selection ───────────────────────────────────────────────
	let portfolioSearch = '';
	let portfolioResults: any[] = [];
	let selectedPortfolios: any[] = [];
	let portfolioSearching = false;
	let showPortfolioDropdown = false;
	let portfolioSearchTimeout: ReturnType<typeof setTimeout>;
	let allPortfoliosLoaded = false;
	let allPortfolios: any[] = [];
	let portfoliosLoading = false;

	$: if (open && collaborationId && mode === 'view') loadDetail();
	$: if (open && mode === 'create') { loading = false; collab = null; loadPortfoliosOnce(); }
	$: if (!open) { resetForm(); showDeleteConfirm = false; resendMessage = ''; }

	async function loadPortfoliosOnce() {
		if (allPortfoliosLoaded) return;
		portfoliosLoading = true;
		try {
			const result = await getSpeakerPortfolios({ limit: 100 });
			allPortfolios = result?.data || [];
			if (!Array.isArray(allPortfolios)) allPortfolios = [];
			// Filter out archived ones client-side
			allPortfolios = allPortfolios.filter((p: any) => p.status !== 'ARCHIVED' && !p.archived);
			allPortfoliosLoaded = true;
		} catch (e) { console.error('Failed to load portfolios:', e); allPortfolios = []; allPortfoliosLoaded = true; }
		finally { portfoliosLoading = false; }
	}

	function handlePortfolioSearch() {
		clearTimeout(portfolioSearchTimeout);
		portfolioSearchTimeout = setTimeout(() => {
			const q = portfolioSearch.trim().toLowerCase();
			if (q.length < 1) { portfolioResults = allPortfolios.filter((p: any) => !selectedPortfolios.some((s: any) => s._id === p._id)); showPortfolioDropdown = portfolioResults.length > 0; return; }
			portfolioResults = allPortfolios.filter((p: any) =>
				!selectedPortfolios.some((s: any) => s._id === p._id) &&
				((p.title || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
			);
			showPortfolioDropdown = portfolioResults.length > 0;
		}, 150);
	}

	function openPortfolioDropdown() {
		portfolioResults = allPortfolios.filter((p: any) => !selectedPortfolios.some((s: any) => s._id === p._id));
		showPortfolioDropdown = portfolioResults.length > 0;
	}

	function selectPortfolio(p: any) {
		if (!selectedPortfolios.some((s: any) => s._id === p._id)) {
			selectedPortfolios = [...selectedPortfolios, p];
		}
		portfolioSearch = '';
		showPortfolioDropdown = false;
	}

	function removePortfolio(id: string) {
		selectedPortfolios = selectedPortfolios.filter((p: any) => p._id !== id);
	}
	$: formattedDate = selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';

	async function loadDetail() {
		collab = initialData; loading = true;
		try { collab = await getSpeakerCollaboration(collaborationId); } catch {}
		finally { loading = false; }
	}

	// ─── Organizer Search ─────────────────────────────────────────────────
	function handleOrganizerSearch() {
		clearTimeout(orgSearchTimeout);
		if (organizerSearch.trim().length < 2) { organizerResults = []; showOrganizerDropdown = false; return; }
		orgSearchTimeout = setTimeout(async () => {
			organizerSearching = true;
			try {
				organizerResults = await searchProfiles(organizerSearch.trim(), 'ORGANIZER', 10);
				showOrganizerDropdown = organizerResults.length > 0;
			} catch { organizerResults = []; }
			finally { organizerSearching = false; }
		}, 300);
	}
	function selectOrganizer(org: any) {
		selectedOrganizer = org;
		organizerSearch = org.name || org.username || org.email;
		showOrganizerDropdown = false;
		selectedEvent = null; eventSearch = '';
	}

	// ─── Event Search ─────────────────────────────────────────────────────
	function handleEventSearch() {
		clearTimeout(eventSearchTimeout);
		if (eventSearch.trim().length < 2) { eventResults = []; showEventDropdown = false; return; }
		eventSearchTimeout = setTimeout(async () => {
			eventSearching = true;
			try {
				const organizerId = selectedOrganizer?.userId || selectedOrganizer?._id || '';
				eventResults = await discoverEvents({ search: eventSearch.trim(), limit: 10, organizerId });
				if (!Array.isArray(eventResults)) eventResults = [];
				showEventDropdown = eventResults.length > 0;
			} catch { eventResults = []; }
			finally { eventSearching = false; }
		}, 300);
	}
	function selectEvent(evt: any) {
		selectedEvent = evt;
		eventSearch = evt.title || evt.name;
		showEventDropdown = false;
	}

	// ─── Actions ──────────────────────────────────────────────────────────
	async function handleWithdraw() {
		actionLoading = 'withdraw';
		try { await withdrawSpeakerCollaboration(collaborationId); onStatusChanged(); open = false; } catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	async function handleResendEmail() {
		if (resendLoading) return;
		resendLoading = true; resendMessage = '';
		try {
			const result = await resendSpeakerCollaborationEmail(collaborationId);
			resendMessage = result.message || 'Email resent!';
			setTimeout(() => (resendMessage = ''), 4000);
		} catch (e: any) {
			resendMessage = e.message || 'Failed to resend';
			setTimeout(() => (resendMessage = ''), 4000);
		} finally { resendLoading = false; }
	}

	async function handleDelete() {
		deleteLoading = true;
		try { await deleteSpeakerCollaboration(collaborationId); onStatusChanged(); open = false; } catch (e) { console.error(e); }
		finally { deleteLoading = false; showDeleteConfirm = false; }
	}

	async function handleSendRequest() {
		if (!selectedOrganizer || !selectedEvent) return;
		creating = true;
		try {
			let fullDate: string | undefined;
			if (selectedDate) {
				const d = new Date(selectedDate);
				fullDate = d.toISOString();
			}
			await sendSpeakerCollaborationRequest({
				organizerId: selectedOrganizer._id || selectedOrganizer.userId,
				organizerName: selectedOrganizer.name || selectedOrganizer.username || '',
				organizerEmail: selectedOrganizer.email || '',
				organizerProfilePicture: selectedOrganizer.profilePictureUrl || '',
				speakerName: speakerName || '',
				speakerProfilePictureUrl: speakerProfilePictureUrl || '',
				eventId: selectedEvent._id || selectedEvent.id,
				eventName: selectedEvent.title || selectedEvent.name || '',
				eventLocation: selectedEvent.locationDetails?.address || selectedEvent.eventType || '',
				title: topicTitle || selectedEvent.title || 'Speaking Engagement',
				description: proposalText,
				proposal: proposalText,
				category: categoryText || undefined,
				startDate: fullDate || selectedEvent.startDateTime || undefined,
				portfolios: selectedPortfolios.map((p: any) => ({
					portfolioId: p._id,
					title: p.title || '',
					category: p.category || '',
					description: (p.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
					mediaUrl: p.media?.[0]?.url || '',
				})),
			});
			onStatusChanged();
			open = false;
		} catch (e) { console.error(e); }
		finally { creating = false; }
	}

	function resetForm() {
		organizerSearch = ''; selectedOrganizer = null; organizerResults = []; showOrganizerDropdown = false;
		eventSearch = ''; selectedEvent = null; eventResults = []; showEventDropdown = false;
		selectedDate = null; showDatePicker = false; topicTitle = ''; proposalText = ''; categoryText = '';
		portfolioSearch = ''; selectedPortfolios = []; portfolioResults = []; showPortfolioDropdown = false;
	}

	function formatDateShort(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
	function formatDateTime(d: string) {
		if (!d) return '';
		const dt = new Date(d);
		return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + ' · ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}
	function getStatusClass(s: string) {
		switch (s) {
			case 'ACCEPTED': case 'CONFIRMED': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'PENDING': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'DECLINED': case 'CANCELLED': return 'bg-[#FDEAEA] text-[#E53935]';
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
			<button aria-label="Close" on:click={() => (open = false)}><Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" /></button>
			<div class="flex items-center gap-1.5 sm:gap-2">
				{#if mode === 'create'}
					<button on:click={handleSendRequest} disabled={creating || !selectedOrganizer || !selectedEvent} class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-[10px] font-bold text-white hover:bg-gray-800 sm:text-xs disabled:opacity-50">
						<Icon icon="mdi:send" class="h-3 w-3" /> {creating ? 'Sending...' : 'Send Request'}
					</button>
					<button on:click={() => (open = false)} class="rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:text-xs">Cancel</button>
				{:else if collab?.status === 'PENDING'}
					<button on:click={handleResendEmail} disabled={resendLoading} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-blue-600 shadow-sm hover:bg-blue-50 sm:text-xs disabled:opacity-50">
						<Icon icon="mdi:email-fast-outline" class="h-3 w-3" /> {resendLoading ? 'Sending...' : 'Resend Email'}
					</button>
					<button on:click={handleWithdraw} disabled={!!actionLoading} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-red-500 shadow-sm hover:bg-red-50 sm:text-xs disabled:opacity-50">
						<Icon icon="mdi:close-circle-outline" class="h-3 w-3" /> Withdraw
					</button>
				{/if}
				{#if mode === 'view' && collab && collab?.status !== 'CONFIRMED'}
					<button on:click={() => (showDeleteConfirm = true)} disabled={deleteLoading} class="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-red-500 shadow-sm hover:bg-red-50 sm:text-xs disabled:opacity-50" title="Delete this request permanently">
						<Icon icon="mdi:trash-can-outline" class="h-3 w-3" />
					</button>
				{/if}
				<button aria-label="Prev" class="rounded-md bg-[#F0F1F1] p-1.5 text-[#68696B] hover:bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></button>
				<button aria-label="Next" class="rounded-md bg-[#F0F1F1] p-1.5 text-[#68696B] hover:bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></button>
			</div>
		</div>

		<!-- Content -->
		<div class="custom-scrollbar flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-6 sm:pt-5">
			{#if mode === 'create'}
				<div class="mb-4 flex h-32 w-full items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 sm:h-40">
					<Icon icon="mdi:microphone-outline" class="h-14 w-14 text-orange-300" />
				</div>
				<div class="mb-1"><span class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-400">New Request</span></div>
				<h2 class="mb-5 text-lg font-bold text-gray-900 sm:text-xl">Send Speaker Collaboration Request</h2>

				<div class="space-y-4">
					<!-- 1. Target Organizer -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="org-s" class="mb-1.5 block text-xs font-medium text-gray-700">Target Organizer <span class="text-red-400">*</span></label>
						{#if selectedOrganizer}
							<div class="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
								<div class="flex items-center gap-2">
									<img src={selectedOrganizer.profilePictureUrl || '/rondwell-attendee.png'} alt="" class="h-7 w-7 rounded-full object-cover" />
									<div><p class="text-xs font-medium text-gray-900">{selectedOrganizer.name || selectedOrganizer.username}</p><p class="text-[10px] text-gray-400">{selectedOrganizer.email || ''}</p></div>
								</div>
								<button on:click={() => { selectedOrganizer = null; organizerSearch = ''; selectedEvent = null; eventSearch = ''; }} class="text-gray-400 hover:text-red-500"><Icon icon="mdi:close" class="h-4 w-4" /></button>
							</div>
						{:else}
							<div class="relative">
								<input id="org-s" type="text" bind:value={organizerSearch} on:input={handleOrganizerSearch} placeholder="Search by organizer name or email..." class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" />
								{#if organizerSearching}<Icon icon="mdi:loading" class="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />{/if}
								{#if showOrganizerDropdown}
									<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showOrganizerDropdown = false)} aria-label="Close"></button>
									<div class="absolute left-0 z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
										{#each organizerResults as org}
											<button on:click={() => selectOrganizer(org)} class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50">
												<img src={org.profilePictureUrl || '/rondwell-attendee.png'} alt="" class="h-6 w-6 rounded-full object-cover" />
												<div class="min-w-0"><p class="truncate text-xs font-medium text-gray-900">{org.name || org.username}</p><p class="truncate text-[10px] text-gray-400">{org.email || ''}</p></div>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- 2. Event -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="evt-s" class="mb-1.5 block text-xs font-medium text-gray-700">Event <span class="text-red-400">*</span></label>
						{#if selectedEvent}
							<div class="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
								<div class="flex items-center gap-2">
									{#if selectedEvent.displayPictureUrl || selectedEvent.coverPictureUrl}
										<img src={selectedEvent.displayPictureUrl || selectedEvent.coverPictureUrl} alt="" class="h-7 w-7 rounded object-cover" />
									{:else}
										<div class="flex h-7 w-7 items-center justify-center rounded bg-blue-100"><Icon icon="mdi:calendar-star" class="h-3.5 w-3.5 text-blue-500" /></div>
									{/if}
									<div><p class="text-xs font-medium text-gray-900">{selectedEvent.title || selectedEvent.name}</p><p class="text-[10px] text-gray-400">{selectedEvent.startDateTime ? formatDateShort(selectedEvent.startDateTime) : ''}</p></div>
								</div>
								<button on:click={() => { selectedEvent = null; eventSearch = ''; }} class="text-gray-400 hover:text-red-500"><Icon icon="mdi:close" class="h-4 w-4" /></button>
							</div>
						{:else}
							<div class="relative">
								<input id="evt-s" type="text" bind:value={eventSearch} on:input={handleEventSearch} placeholder="Search for an event..." class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" />
								{#if eventSearching}<Icon icon="mdi:loading" class="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />{/if}
								{#if showEventDropdown}
									<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showEventDropdown = false)} aria-label="Close"></button>
									<div class="absolute left-0 z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
										{#each eventResults as evt}
											<button on:click={() => selectEvent(evt)} class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50">
												<div class="flex h-6 w-6 items-center justify-center rounded bg-blue-50"><Icon icon="mdi:calendar-star" class="h-3 w-3 text-blue-500" /></div>
												<div class="min-w-0"><p class="truncate text-xs font-medium text-gray-900">{evt.title || evt.name}</p><p class="truncate text-[10px] text-gray-400">{evt.startDateTime ? formatDateShort(evt.startDateTime) : ''} · {evt.locationDetails?.address || evt.eventType || 'Event'}</p></div>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- 3. Topic Title -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="topic-title" class="mb-1.5 block text-xs font-medium text-gray-700">Proposed Topic <span class="text-gray-400">(Optional)</span></label>
						<input id="topic-title" type="text" bind:value={topicTitle} placeholder="e.g. The Future of AI in Business" class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" />
					</div>

					<!-- 4. Category -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="spk-cat" class="mb-1.5 block text-xs font-medium text-gray-700">Category / Expertise <span class="text-gray-400">(Optional)</span></label>
						<input id="spk-cat" type="text" bind:value={categoryText} placeholder="e.g. Technology, Leadership, Marketing" class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" />
					</div>

					<!-- 5. Proposed Date -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label class="mb-1.5 block text-xs font-medium text-gray-700">Proposed Date <span class="text-gray-400">(Optional)</span></label>
						<div class="relative">
							<button on:click={() => (showDatePicker = !showDatePicker)} class="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-left text-xs text-gray-900 focus:border-gray-400 focus:outline-none">
								<span class={formattedDate ? 'text-gray-900' : 'text-gray-400'}>{formattedDate || 'Select a date'}</span>
								<Icon icon="mdi:calendar" class="h-4 w-4 text-gray-400" />
							</button>
							<DatePickerModal bind:open={showDatePicker} bind:selectedDate minDate={new Date()} />
						</div>
					</div>

					<!-- 6. Attach Portfolio -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label class="mb-1.5 block text-xs font-medium text-gray-700">
							<span class="flex items-center gap-1.5">
								<Icon icon="mdi:briefcase-outline" class="h-4 w-4 text-purple-500" />
								Attach Portfolio Entries <span class="text-gray-400">(Optional)</span>
							</span>
						</label>
						<p class="mb-2.5 text-[10px] text-gray-400">Showcase your past speaking engagements to strengthen your proposal.</p>

						<!-- Selected Portfolios -->
						{#if selectedPortfolios.length > 0}
							<div class="mb-3 space-y-2">
								{#each selectedPortfolios as p (p._id)}
									<div class="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
										<div class="flex items-center gap-2.5 min-w-0">
											{#if p.media?.[0]?.url}
												<img src={p.media[0].url} alt="" class="h-9 w-9 rounded-lg object-cover shrink-0" />
											{:else}
												<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 shrink-0">
													<Icon icon="mdi:microphone-variant" class="h-4 w-4 text-purple-500" />
												</div>
											{/if}
											<div class="min-w-0">
												<p class="truncate text-xs font-medium text-gray-900">{p.title}</p>
												<p class="truncate text-[10px] text-gray-400">{p.category || 'General'}</p>
											</div>
										</div>
										<button on:click={() => removePortfolio(p._id)} class="shrink-0 text-gray-400 hover:text-red-500">
											<Icon icon="mdi:close" class="h-4 w-4" />
										</button>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Search / Dropdown -->
						<div class="relative">
							<div class="flex items-center gap-2">
								<input type="text" bind:value={portfolioSearch} on:input={handlePortfolioSearch} on:focus={openPortfolioDropdown} placeholder={portfoliosLoading ? 'Loading portfolios...' : 'Search your portfolio entries...'} disabled={portfoliosLoading} class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:cursor-wait" />
								{#if portfoliosLoading}<Icon icon="mdi:loading" class="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />{/if}
							</div>
							{#if showPortfolioDropdown && portfolioResults.length > 0}
								<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showPortfolioDropdown = false)} aria-label="Close"></button>
								<div class="absolute left-0 z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
									{#each portfolioResults as p}
										<button on:click={() => selectPortfolio(p)} class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50">
											{#if p.media?.[0]?.url}
												<img src={p.media[0].url} alt="" class="h-8 w-8 rounded-lg object-cover" />
											{:else}
												<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
													<Icon icon="mdi:microphone-variant" class="h-3.5 w-3.5 text-gray-400" />
												</div>
											{/if}
											<div class="min-w-0">
												<p class="truncate text-xs font-medium text-gray-900">{p.title}</p>
												<p class="truncate text-[10px] text-gray-400">{p.category || 'General'}{p.originalEventName ? ` · ${p.originalEventName}` : ''}{p.status === 'DRAFT' ? ' · Draft' : ''}</p>
											</div>
										</button>
									{/each}
								</div>
							{/if}
							{#if showPortfolioDropdown && portfolioResults.length === 0 && !portfoliosLoading && portfolioSearch.length > 0}
								<div class="absolute left-0 z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
									<p class="text-center text-[10px] text-gray-400">No matching portfolios found.</p>
								</div>
							{/if}
						</div>
						{#if allPortfoliosLoaded && allPortfolios.length === 0 && !portfoliosLoading}
							<p class="mt-1.5 text-[10px] text-gray-400">No portfolio entries found. <a href="/speaker/portfolio" class="text-purple-500 underline">Create one first</a>.</p>
						{/if}
					</div>

					<!-- 7. Proposal / Pitch -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="spk-proposal" class="mb-1.5 block text-xs font-medium text-gray-700">Your Pitch / Proposal <span class="text-gray-400">(Optional)</span></label>
						<div class="relative">
							<textarea id="spk-proposal" bind:value={proposalText} maxlength="500" rows="4" placeholder="Describe your expertise, what you'll speak about, and why you'd be a great fit..." class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 pr-14 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
							<span class="pointer-events-none absolute right-3 bottom-2 text-[9px] text-gray-400">{proposalText.length}/500</span>
						</div>
					</div>
				</div>
			{:else if loading && !collab}
				<div class="animate-pulse space-y-4"><div class="h-44 w-full rounded-xl bg-gray-200"></div><div class="h-6 w-48 rounded bg-gray-200"></div><div class="h-32 w-full rounded-lg bg-gray-100"></div></div>
			{:else if collab}
				<!-- View Mode -->
				{#if resendMessage}
					<div class="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm {resendMessage.includes('Failed') || resendMessage.includes('limit') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}">
						{resendMessage}
					</div>
				{/if}

				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 sm:h-52">
					<Icon icon="mdi:microphone-outline" class="h-20 w-20 text-orange-300" />
				</div>

				<div class="mb-1 flex items-center gap-2">
					<span class="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-500">Speaker Request</span>
					<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(collab.status)}">{collab.status}</span>
				</div>
				<h2 class="text-lg font-bold text-gray-900 leading-tight sm:text-xl">{collab.title || 'Speaker Collaboration Request'}</h2>

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
								<div><p class="text-[10px] text-gray-400">Location</p><p class="text-xs font-medium text-gray-800">{collab.eventLocation || collab.venue || '—'}</p></div>
							</div>
						</div>
					</div>
				</div>

				<!-- Speaking Details -->
				<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-900">Speaking Details</h3>
					<div class="space-y-3">
						{#if collab.category}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:shape-outline" class="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
								<div><p class="text-[10px] text-gray-400">Category / Expertise</p><p class="text-xs font-medium text-gray-800">{collab.category}</p></div>
							</div>
						{/if}
						{#if collab.startDate}
							<div class="flex items-start gap-2">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[9px] font-bold text-blue-600">
									{new Date(collab.startDate).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}<br/>{new Date(collab.startDate).getDate()}
								</div>
								<div><p class="text-xs font-medium text-gray-800">{formatDateTime(collab.startDate)}</p></div>
							</div>
						{/if}
						{#if collab.proposal || collab.description}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:note-text-outline" class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
								<div><p class="text-[10px] text-gray-400">Your Pitch</p><p class="text-xs font-medium text-gray-800">{collab.proposal || collab.description}</p></div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Attached Portfolios -->
				{#if collab.portfolios?.length > 0}
					<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="mb-3 text-sm font-bold text-gray-900">
							<span class="flex items-center gap-1.5">
								<Icon icon="mdi:briefcase-outline" class="h-4 w-4 text-purple-500" />
								Attached Portfolio ({collab.portfolios.length})
							</span>
						</h3>
						<div class="space-y-2">
							{#each collab.portfolios as p}
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
										{#if p.description}
											<p class="mt-0.5 truncate text-[10px] text-gray-400">{p.description}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Status History -->
				{#if collab.statusHistory?.length > 0}
					<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="mb-3 text-sm font-bold text-gray-900">Status History</h3>
						<div class="space-y-2">
							{#each collab.statusHistory as entry}
								<div class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
									<span class="rounded px-2 py-0.5 text-[10px] font-medium {getStatusClass(entry.status)}">{entry.status}</span>
									<span class="text-[10px] text-gray-400">{formatDateShort(entry.changedAt)}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Messages -->
				{#if collab.messages?.length > 0}
					<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
						<h3 class="mb-3 text-sm font-bold text-gray-900">Messages</h3>
						<div class="max-h-40 space-y-2 overflow-y-auto">
							{#each collab.messages as msg}
								<div class="rounded-lg bg-gray-50 p-2">
									<p class="text-xs font-medium text-gray-700">{msg.senderId}</p>
									<p class="text-xs text-gray-600">{msg.content}</p>
									<p class="mt-0.5 text-[9px] text-gray-400">{formatDateShort(msg.timestamp)}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<span class="text-[10px] text-gray-400 sm:text-xs">{collab?.createdAt ? `Sent ${formatDateShort(collab.createdAt)}` : mode === 'create' ? 'New speaker request' : ''}</span>
			{#if mode === 'create'}
				<button on:click={handleSendRequest} disabled={creating || !selectedOrganizer || !selectedEvent} class="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50">
					<Icon icon="mdi:send" class="h-3.5 w-3.5" /> {creating ? 'Sending...' : 'Send Request'}
				</button>
			{:else if collab?.status === 'PENDING'}
				<div class="flex items-center gap-2">
					<button on:click={handleResendEmail} disabled={resendLoading} class="flex items-center gap-1.5 rounded-lg border border-blue-200 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50">
						<Icon icon="mdi:email-fast-outline" class="h-3.5 w-3.5" /> {resendLoading ? 'Sending...' : 'Resend Email'}
					</button>
					<button on:click={handleWithdraw} disabled={!!actionLoading} class="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50">
						<Icon icon="mdi:close-circle-outline" class="h-3.5 w-3.5" /> Withdraw
					</button>
				</div>
			{:else if mode === 'view' && collab && collab?.status !== 'CONFIRMED'}
				<button on:click={() => (showDeleteConfirm = true)} disabled={deleteLoading} class="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50">
					<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /> Delete Request
				</button>
			{:else if mode === 'view' && collab?.status === 'CONFIRMED'}
				<span class="flex items-center gap-1.5 rounded-lg bg-green-100 px-4 py-2 text-xs font-bold text-green-700">
					<Icon icon="mdi:check" class="h-3.5 w-3.5" /> Confirmed
				</span>
			{/if}
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal Overlay -->
{#if showDeleteConfirm}
<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
	role="dialog" aria-modal="true" tabindex="-1" on:click={() => (showDeleteConfirm = false)} on:keydown={(e) => e.key === 'Escape' && (showDeleteConfirm = false)}>
	<div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" on:click|stopPropagation on:keydown|stopPropagation role="document">
		<div class="mb-4 flex items-center justify-center">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
				<Icon icon="mdi:trash-can-outline" class="h-6 w-6 text-red-600" />
			</div>
		</div>
		<h3 class="mb-2 text-center text-base font-bold text-gray-900">Delete this request?</h3>
		<p class="mb-4 text-center text-xs text-gray-500">
			This will permanently delete this speaker collaboration request. This action cannot be undone.
		</p>
		<div class="flex gap-3">
			<button on:click={() => (showDeleteConfirm = false)} class="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
			<button on:click={handleDelete} disabled={deleteLoading} class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
				{#if deleteLoading}<div class="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>{/if}
				{deleteLoading ? 'Deleting...' : 'Delete'}
			</button>
		</div>
	</div>
</div>
{/if}
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
</style>
