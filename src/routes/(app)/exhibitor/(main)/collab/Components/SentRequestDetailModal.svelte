<script lang="ts">
	import { deleteExhibitorCollaboration, discoverEvents, getExhibitorCollaboration, getMyBooths, resendExhibitorCollaborationEmail, sendExhibitorCollaborationRequest, withdrawExhibitorCollaboration } from '$lib/services/exhibitor.services';
	import { searchProfiles } from '$lib/services/profile.services';
	import Icon from '@iconify/svelte';

	export let open = false;
	export let collaborationId = '';
	export let initialData: any = null;
	export let mode: 'view' | 'create' = 'view';
	export let exhibitorName = '';
	export let exhibitorProfilePictureUrl = '';
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

	// ─── Booth / Stand Selection ──────────────────────────────────────────
	let booths: any[] = [];
	let selectedBooth: any = null;
	let showBoothDropdown = false;
	let boothsLoading = false;

	// ─── Proposal & Category ──────────────────────────────────────────────
	let proposalText = '';
	let categoryText = '';
	let titleText = '';
	let creating = false;

	$: if (open && collaborationId && mode === 'view') loadDetail();
	$: if (open && mode === 'create') { loading = false; collab = null; loadBooths(); }
	$: if (!open) { resetForm(); showDeleteConfirm = false; resendMessage = ''; }

	async function loadDetail() {
		collab = initialData; loading = true;
		try { collab = await getExhibitorCollaboration(collaborationId); } catch {}
		finally { loading = false; }
	}

	async function loadBooths() {
		if (booths.length > 0) return;
		boothsLoading = true;
		try {
			const result = await getMyBooths({ limit: 50 });
			booths = result?.data || result?.booths || [];
			if (!Array.isArray(booths)) booths = [];
		} catch { booths = []; }
		finally { boothsLoading = false; }
	}

	function selectBooth(booth: any) {
		selectedBooth = booth;
		showBoothDropdown = false;
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
		try { await withdrawExhibitorCollaboration(collaborationId); onStatusChanged(); open = false; } catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	async function handleResendEmail() {
		if (resendLoading) return;
		resendLoading = true;
		resendMessage = '';
		try {
			const result = await resendExhibitorCollaborationEmail(collaborationId);
			resendMessage = result.message || 'Email resent!';
			setTimeout(() => (resendMessage = ''), 4000);
		} catch (e: any) {
			resendMessage = e.message || 'Failed to resend';
			setTimeout(() => (resendMessage = ''), 4000);
		} finally {
			resendLoading = false;
		}
	}

	async function handleDelete() {
		deleteLoading = true;
		try {
			await deleteExhibitorCollaboration(collaborationId);
			onStatusChanged();
			open = false;
		} catch (e) { console.error(e); }
		finally { deleteLoading = false; showDeleteConfirm = false; }
	}

	async function handleSendRequest() {
		if (!selectedOrganizer || !selectedEvent) return;
		creating = true;
		try {
			await sendExhibitorCollaborationRequest({
				organizerId: selectedOrganizer._id || selectedOrganizer.userId,
				organizerName: selectedOrganizer.name || selectedOrganizer.username || '',
				organizerEmail: selectedOrganizer.email || '',
				eventId: selectedEvent._id || selectedEvent.id,
				eventName: selectedEvent.title || selectedEvent.name || '',
				title: titleText || selectedEvent.title || 'Exhibition Request',
				proposal: proposalText,
				category: categoryText || undefined,
				boothId: selectedBooth?._id || undefined,
				boothName: selectedBooth?.name || selectedBooth?.title || undefined,
				exhibitorBusinessName: exhibitorName || '',
				exhibitorProfilePictureUrl: exhibitorProfilePictureUrl || '',
			});
			onStatusChanged();
			open = false;
		} catch (e) { console.error(e); }
		finally { creating = false; }
	}

	function resetForm() {
		organizerSearch = ''; selectedOrganizer = null; organizerResults = []; showOrganizerDropdown = false;
		eventSearch = ''; selectedEvent = null; eventResults = []; showEventDropdown = false;
		selectedBooth = null; showBoothDropdown = false;
		proposalText = ''; categoryText = ''; titleText = '';
	}

	function formatDateShort(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
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
					<Icon icon="mdi:store-plus-outline" class="h-14 w-14 text-orange-300" />
				</div>
				<div class="mb-1"><span class="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-500">New Request</span></div>
				<h2 class="mb-5 text-lg font-bold text-gray-900 sm:text-xl">Send Exhibition Request</h2>

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

					<!-- 3. Title -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="req-title" class="mb-1.5 block text-xs font-medium text-gray-700">Request Title <span class="text-gray-400">(Optional)</span></label>
						<input id="req-title" type="text" bind:value={titleText} placeholder="e.g. Exhibition at Tech Summit 2025" class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" />
					</div>

					<!-- 4. Booth Category Preference -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="req-cat" class="mb-1.5 block text-xs font-medium text-gray-700">Booth Package Preference <span class="text-gray-400">(Optional)</span></label>
						<input id="req-cat" type="text" bind:value={categoryText} placeholder="e.g. Premium Booth, Standard Booth" class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" />
					</div>

					<!-- 5. Select Booth / Stand -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label class="mb-1.5 block text-xs font-medium text-gray-700">
							<span class="flex items-center gap-1.5">
								<Icon icon="mdi:store-marker-outline" class="h-4 w-4 text-purple-500" />
								Select Your Booth / Stand <span class="text-gray-400">(Optional)</span>
							</span>
						</label>
						<p class="mb-2.5 text-[10px] text-gray-400">Choose a booth from your inventory to showcase at this event.</p>
						{#if selectedBooth}
							<div class="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5">
								<div class="flex items-center gap-2.5">
									{#if selectedBooth.media?.[0]?.url || selectedBooth.coverImage}
										<img src={selectedBooth.media?.[0]?.url || selectedBooth.coverImage} alt="" class="h-9 w-9 rounded-lg object-cover" />
									{:else}
										<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
											<Icon icon="mdi:store-outline" class="h-4 w-4 text-purple-500" />
										</div>
									{/if}
									<div>
										<p class="text-xs font-medium text-gray-900">{selectedBooth.name || selectedBooth.title || 'Booth'}</p>
										<p class="text-[10px] text-gray-400">{selectedBooth.description?.slice(0, 40) || selectedBooth.status || ''}{selectedBooth.description?.length > 40 ? '...' : ''}</p>
									</div>
								</div>
								<button on:click={() => { selectedBooth = null; }} class="text-gray-400 hover:text-red-500">
									<Icon icon="mdi:close" class="h-4 w-4" />
								</button>
							</div>
						{:else}
							<div class="relative">
								<button
									on:click={() => (showBoothDropdown = !showBoothDropdown)}
									class="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-left text-xs text-gray-900 hover:border-gray-300 focus:border-gray-400 focus:outline-none"
								>
									<span class="text-gray-400">{boothsLoading ? 'Loading booths...' : booths.length > 0 ? 'Select a booth or stand...' : 'No booths available — create one first'}</span>
									<Icon icon="mdi:chevron-down" class="h-4 w-4 text-gray-400" />
								</button>
								{#if showBoothDropdown && booths.length > 0}
									<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showBoothDropdown = false)} aria-label="Close"></button>
									<div class="absolute left-0 z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
										{#each booths as booth}
											<button on:click={() => selectBooth(booth)} class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50">
												{#if booth.media?.[0]?.url || booth.coverImage}
													<img src={booth.media?.[0]?.url || booth.coverImage} alt="" class="h-8 w-8 rounded-lg object-cover" />
												{:else}
													<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
														<Icon icon="mdi:store-outline" class="h-3.5 w-3.5 text-gray-400" />
													</div>
												{/if}
												<div class="min-w-0">
													<p class="truncate text-xs font-medium text-gray-900">{booth.name || booth.title || 'Booth'}</p>
													<p class="truncate text-[10px] text-gray-400">{booth.description?.slice(0, 50) || booth.status || ''}</p>
												</div>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- 6. Proposal / Pitch -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="req-proposal" class="mb-1.5 block text-xs font-medium text-gray-700">Your Pitch / Proposal <span class="text-gray-400">(Optional)</span></label>
						<div class="relative">
							<textarea id="req-proposal" bind:value={proposalText} maxlength="500" rows="4" placeholder="Describe what you'll showcase, why you'd be a great fit for this event..." class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 pr-14 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
							<span class="pointer-events-none absolute right-3 bottom-2 text-[9px] text-gray-400">{proposalText.length}/500</span>
						</div>
					</div>
				</div>
			{:else if loading && !collab}
				<div class="animate-pulse space-y-4"><div class="h-44 w-full rounded-xl bg-gray-200"></div><div class="h-6 w-48 rounded bg-gray-200"></div><div class="h-32 w-full rounded-lg bg-gray-100"></div></div>
			{:else if collab}
				<!-- View Mode -->
				<div class="mb-5 flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 sm:h-52">
					<Icon icon="mdi:store-outline" class="h-20 w-20 text-orange-300" />
				</div>

				<div class="mb-1 flex items-center gap-2">
					<span class="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-500">Exhibition Request</span>
					<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(collab.status)}">{collab.status}</span>
				</div>
				<h2 class="text-lg font-bold text-gray-900 leading-tight sm:text-xl">{collab.title || 'Exhibition Request'}</h2>

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
						{#if collab.category}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:package-variant-closed" class="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
								<div><p class="text-[10px] text-gray-400">Booth Package Preference</p><p class="text-xs font-medium text-gray-800">{collab.category}</p></div>
							</div>
						{/if}
						{#if collab.boothId || collab.boothName}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:store-marker-outline" class="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
								<div><p class="text-[10px] text-gray-400">Selected Booth / Stand</p><p class="text-xs font-medium text-gray-800">{collab.boothName || collab.boothId || '—'}</p></div>
							</div>
						{/if}
						{#if collab.proposal}
							<div class="flex items-start gap-2">
								<Icon icon="mdi:note-text-outline" class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
								<div><p class="text-[10px] text-gray-400">Your Pitch</p><p class="text-xs font-medium text-gray-800">{collab.proposal}</p></div>
							</div>
						{/if}
					</div>
				</div>

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
			<span class="text-[10px] text-gray-400 sm:text-xs">{collab?.createdAt ? `Sent ${formatDateShort(collab.createdAt)}` : mode === 'create' ? 'New exhibition request' : ''}</span>
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
			{#if resendMessage}
				<span class="text-xs font-medium {resendMessage.includes('Failed') || resendMessage.includes('limit') ? 'text-red-500' : 'text-green-600'}">{resendMessage}</span>
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
			This will permanently delete this exhibition request and remove your application from the organizer's participant list. This cannot be undone.
		</p>
		{#if collab && ['ACCEPTED', 'PAYMENT_PENDING', 'REVIEWING'].includes(collab?.status)}
			<div class="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
				<Icon icon="mdi:alert" class="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
				<p class="text-[11px] font-medium text-red-700">
					This collaboration is currently <strong>{collab.status === 'PAYMENT_PENDING' ? 'awaiting payment' : collab.status === 'ACCEPTED' ? 'accepted' : 'under review'}</strong>. Deleting it will cancel the process.
				</p>
			</div>
		{/if}
		<div class="flex gap-3">
			<button on:click={() => (showDeleteConfirm = false)} class="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
				Cancel
			</button>
			<button on:click={handleDelete} disabled={deleteLoading} class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
				{#if deleteLoading}
					<div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
					Deleting...
				{:else}
					<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" />
					Delete
				{/if}
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
