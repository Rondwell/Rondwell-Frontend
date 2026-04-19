<script lang="ts">
	import { searchProfiles } from '$lib/services/profile.services';
	import { deleteCollaboration, discoverEvents, getCollaboration, getProducts, resendCollaborationEmail, sendOutboundCollaboration, withdrawCollaboration } from '$lib/services/vendor.services';
	import Icon from '@iconify/svelte';
	import DatePickerModal from '../../../../create-event/components/DatePickerModal.svelte';

	export let open = false;
	export let collaborationId = '';
	export let initialData: any = null;
	export let mode: 'view' | 'create' = 'view';
	export let vendorName = '';
	export let vendorProfilePictureUrl = '';
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

	// ─── Event Search (after organizer selected) ──────────────────────────
	let eventSearch = '';
	let eventResults: any[] = [];
	let selectedEvent: any = null;
	let eventSearching = false;
	let showEventDropdown = false;
	let eventSearchTimeout: ReturnType<typeof setTimeout>;

	// ─── Product Search ───────────────────────────────────────────────────
	let productSearch = '';
	let productResults: any[] = [];
	let selectedProduct: any = null;
	let productSearching = false;
	let showProductDropdown = false;
	let prodSearchTimeout: ReturnType<typeof setTimeout>;

	// ─── Date Picker ──────────────────────────────────────────────────────
	let showDatePicker = false;
	let selectedDate: Date | null = null;

	// ─── Time Picker ──────────────────────────────────────────────────────
	let showTimePicker = false;
	let selectedHour = 12;
	let selectedMinute = 0;
	let selectedPeriod: 'AM' | 'PM' = 'AM';
	$: formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedPeriod}`;

	function setTime(h: number, m: number, p: 'AM' | 'PM') {
		selectedHour = h; selectedMinute = m; selectedPeriod = p;
		showTimePicker = false;
	}

	// ─── Currency Dropdown ────────────────────────────────────────────────
	let showCurrencyDropdown = false;
	const currencies = [
		{ code: 'NGN', symbol: '₦', label: 'Naira (₦)' },
		{ code: 'USD', symbol: '$', label: 'US Dollar ($)' },
		{ code: 'GBP', symbol: '£', label: 'British Pound (£)' },
		{ code: 'EUR', symbol: '€', label: 'Euro (€)' },
	];
	$: selectedCurrencyLabel = currencies.find(c => c.code === priceCurrency)?.label || 'Naira (₦)';

	// ─── Price & Message ──────────────────────────────────────────────────
	let proposedPrice = '';
	let priceCurrency = 'NGN';
	let messageText = '';
	let creating = false;

	$: if (open && collaborationId && mode === 'view') loadDetail();
	$: if (open && mode === 'create') { loading = false; collab = null; }
	$: if (!open) resetForm();
	$: formattedDate = selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';

	async function loadDetail() {
		collab = initialData; loading = true;
		try { collab = await getCollaboration(collaborationId); } catch {}
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
		// Reset event when organizer changes
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

	// ─── Product Search ───────────────────────────────────────────────────
	function handleProductSearch() {
		clearTimeout(prodSearchTimeout);
		if (productSearch.trim().length < 2) { productResults = []; showProductDropdown = false; return; }
		prodSearchTimeout = setTimeout(async () => {
			productSearching = true;
			try {
				const result = await getProducts({ search: productSearch.trim(), limit: 10 });
				productResults = result?.data || result || [];
				if (!Array.isArray(productResults)) productResults = [];
				showProductDropdown = productResults.length > 0;
			} catch { productResults = []; }
			finally { productSearching = false; }
		}, 300);
	}
	function selectProduct(prod: any) {
		selectedProduct = prod;
		productSearch = prod.productName;
		showProductDropdown = false;
		// Auto-fill price from product if it has one (and it's not a custom quote)
		const isCustomQuote = prod.pricingType === 'custom_quote' || prod.isCustomQuote;
		if (!isCustomQuote && prod.price) {
			const p = parseFloat(prod.price?.$numberDecimal || prod.price || 0);
			if (p > 0) proposedPrice = String(p);
		}
		if (prod.currency) priceCurrency = prod.currency;
	}

	// Whether the price field should be read-only (product has a fixed price)
	$: priceIsFromProduct = selectedProduct && !selectedProduct.isCustomQuote && selectedProduct.pricingType !== 'custom_quote' && proposedPrice && parseFloat(proposedPrice) > 0;

	// ─── Actions ──────────────────────────────────────────────────────────
	async function handleWithdraw() {
		actionLoading = 'withdraw';
		try { await withdrawCollaboration(collaborationId); onStatusChanged(); open = false; } catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	async function handleDelete() {
		deleteLoading = true;
		try {
			await deleteCollaboration(collaborationId);
			onStatusChanged();
			open = false;
		} catch (e) { console.error(e); }
		finally { deleteLoading = false; showDeleteConfirm = false; }
	}

	async function handleResendEmail() {
		if (resendLoading) return;
		resendLoading = true;
		resendMessage = '';
		try {
			const result = await resendCollaborationEmail(collaborationId);
			resendMessage = result.message || 'Email resent!';
			setTimeout(() => (resendMessage = ''), 4000);
		} catch (e: any) {
			resendMessage = e.message || 'Failed to resend';
			setTimeout(() => (resendMessage = ''), 4000);
		} finally {
			resendLoading = false;
		}
	}

	async function handleSendRequest() {
		if (!selectedOrganizer || !selectedEvent) return;
		creating = true;
		try {
			// Build full datetime from date picker + time picker
			let fullDate: string | undefined;
			if (selectedDate) {
				const d = new Date(selectedDate);
				let h24 = selectedHour;
				if (selectedPeriod === 'PM' && h24 < 12) h24 += 12;
				if (selectedPeriod === 'AM' && h24 === 12) h24 = 0;
				d.setHours(h24, selectedMinute, 0, 0);
				fullDate = d.toISOString();
			}
			await sendOutboundCollaboration({
				organizerId: selectedOrganizer._id || selectedOrganizer.userId,
				organizerName: selectedOrganizer.name || selectedOrganizer.username || '',
				organizerEmail: selectedOrganizer.email || '',
				vendorBusinessName: vendorName || '',
				vendorProfilePictureUrl: vendorProfilePictureUrl || '',
				productId: selectedProduct?._id || undefined,
				productImageUrl: selectedProduct?.media?.[0]?.url || '',
				requestedProductName: selectedProduct?.productName || productSearch || 'Custom Service',
				eventId: selectedEvent._id || selectedEvent.id,
				eventDetails: {
					eventName: selectedEvent.title || selectedEvent.name || '',
					eventDate: fullDate || selectedEvent.startDateTime || new Date().toISOString(),
					eventLocation: selectedEvent.locationDetails?.address || selectedEvent.eventType || '',
				},
				requestedDate: fullDate || new Date().toISOString(),
				proposedPrice: proposedPrice ? parseFloat(proposedPrice) : undefined,
				proposedCurrency: priceCurrency,
				message: messageText,
				title: selectedProduct?.productName || productSearch || 'Collaboration Request',
				description: selectedProduct?.description || productSearch,
				proposal: messageText,
				budget: proposedPrice ? parseFloat(proposedPrice) : undefined,
				category: selectedProduct?.tags?.[0] || undefined,
				deadline: fullDate || undefined,
			});
			onStatusChanged();
			open = false;
		} catch (e) { console.error(e); }
		finally { creating = false; }
	}

	function resetForm() {
		organizerSearch = ''; selectedOrganizer = null; organizerResults = []; showOrganizerDropdown = false;
		eventSearch = ''; selectedEvent = null; eventResults = []; showEventDropdown = false;
		productSearch = ''; selectedProduct = null; productResults = []; showProductDropdown = false;
		selectedDate = null; showDatePicker = false; proposedPrice = ''; priceCurrency = 'NGN'; messageText = '';
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
					<Icon icon="mdi:send-outline" class="h-14 w-14 text-orange-300" />
				</div>
				<div class="mb-1"><span class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-400">New Request</span></div>
				<h2 class="mb-5 text-lg font-bold text-gray-900 sm:text-xl">Send Collaboration Request</h2>

				<div class="space-y-4">
					<!-- ═══ 1. Target Organizer ═══ -->
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
							{#if organizerSearch.length >= 2 && !organizerSearching && organizerResults.length === 0}
								<p class="mt-1 text-[10px] text-gray-400">No organizers found.</p>
							{/if}
						{/if}
					</div>

					<!-- ═══ 2. Event (Optional — searchable after organizer selected) ═══ -->
					<!-- ═══ 2. Event (Required — searchable) ═══ -->
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

					<!-- ═══ 3. Proposed Service/Product ═══ -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="prod-s" class="mb-1.5 block text-xs font-medium text-gray-700">Proposed Service/Product <span class="text-red-400">*</span></label>
						{#if selectedProduct}
							<div class="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
								<div class="flex items-center gap-2">
									{#if selectedProduct.media?.[0]?.url}
										<img src={selectedProduct.media[0].url} alt="" class="h-7 w-7 rounded object-cover" />
									{:else}
										<div class="flex h-7 w-7 items-center justify-center rounded bg-gray-200"><Icon icon="mdi:package-variant-closed" class="h-3.5 w-3.5 text-gray-400" /></div>
									{/if}
									<div><p class="text-xs font-medium text-gray-900">{selectedProduct.productName}</p><p class="text-[10px] text-gray-400">{selectedProduct.pricingType || ''}</p></div>
								</div>
								<button on:click={() => { selectedProduct = null; productSearch = ''; }} class="text-gray-400 hover:text-red-500"><Icon icon="mdi:close" class="h-4 w-4" /></button>
							</div>
						{:else}
							<div class="relative">
								<input id="prod-s" type="text" bind:value={productSearch} on:input={handleProductSearch} placeholder="Search your products/services..." class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none" />
								{#if productSearching}<Icon icon="mdi:loading" class="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />{/if}
								{#if showProductDropdown}
									<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showProductDropdown = false)} aria-label="Close"></button>
									<div class="absolute left-0 z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
										{#each productResults as prod}
											<button on:click={() => selectProduct(prod)} class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50">
												{#if prod.media?.[0]?.url}
													<img src={prod.media[0].url} alt="" class="h-6 w-6 rounded object-cover" />
												{:else}
													<div class="flex h-6 w-6 items-center justify-center rounded bg-gray-100"><Icon icon="mdi:package-variant-closed" class="h-3 w-3 text-gray-400" /></div>
												{/if}
												<div class="min-w-0"><p class="truncate text-xs font-medium text-gray-900">{prod.productName}</p><p class="truncate text-[10px] text-gray-400">{prod.pricingType}{prod.price ? ` · ₦${parseFloat(prod.price?.$numberDecimal || prod.price || 0).toLocaleString()}` : ''}</p></div>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- ═══ 4. Date, Time & Price ═══ -->
					<div class="space-y-4">
						<!-- Date & Time row -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- Date with custom picker -->
							<div class="rounded-xl border border-gray-200 bg-white p-4">
								<label class="mb-1.5 block text-xs font-medium text-gray-700">Proposed Date <span class="text-red-400">*</span></label>
								<div class="relative">
									<button on:click={() => (showDatePicker = !showDatePicker)} class="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-left text-xs text-gray-900 focus:border-gray-400 focus:outline-none">
										<span class={formattedDate ? 'text-gray-900' : 'text-gray-400'}>{formattedDate || 'Select a date'}</span>
										<Icon icon="mdi:calendar" class="h-4 w-4 text-gray-400" />
									</button>
									<DatePickerModal bind:open={showDatePicker} bind:selectedDate minDate={new Date()} />
								</div>
							</div>

							<!-- Time picker -->
							<div class="rounded-xl border border-gray-200 bg-white p-4">
								<label class="mb-1.5 block text-xs font-medium text-gray-700">Proposed Time <span class="text-gray-400">(Optional)</span></label>
								<div class="relative">
									<button on:click={() => (showTimePicker = !showTimePicker)} class="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-left text-xs text-gray-900 focus:border-gray-400 focus:outline-none">
										<span class="text-gray-900">{formattedTime}</span>
										<Icon icon="mdi:clock-outline" class="h-4 w-4 text-gray-400" />
									</button>
									{#if showTimePicker}
										<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showTimePicker = false)} aria-label="Close"></button>
										<div class="absolute left-0 z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
											<div class="flex items-center gap-2">
												<!-- Hour -->
												<div class="flex-1">
													<p class="mb-1 text-center text-[9px] text-gray-400">Hour</p>
													<div class="custom-scrollbar max-h-32 overflow-y-auto rounded border border-gray-100">
														{#each Array(12) as _, i}
															<button on:click={() => (selectedHour = i + 1)} class="w-full py-1 text-center text-xs hover:bg-gray-50 {selectedHour === i + 1 ? 'bg-[#F31A7C] text-white font-medium' : ''}">{String(i + 1).padStart(2, '0')}</button>
														{/each}
													</div>
												</div>
												<!-- Minute -->
												<div class="flex-1">
													<p class="mb-1 text-center text-[9px] text-gray-400">Min</p>
													<div class="custom-scrollbar max-h-32 overflow-y-auto rounded border border-gray-100">
														{#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as m}
															<button on:click={() => (selectedMinute = m)} class="w-full py-1 text-center text-xs hover:bg-gray-50 {selectedMinute === m ? 'bg-[#F31A7C] text-white font-medium' : ''}">{String(m).padStart(2, '0')}</button>
														{/each}
													</div>
												</div>
												<!-- AM/PM -->
												<div class="flex flex-col gap-1">
													<p class="mb-1 text-center text-[9px] text-gray-400">Period</p>
													<button on:click={() => (selectedPeriod = 'AM')} class="rounded px-3 py-1.5 text-xs font-medium {selectedPeriod === 'AM' ? 'bg-[#F31A7C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">AM</button>
													<button on:click={() => (selectedPeriod = 'PM')} class="rounded px-3 py-1.5 text-xs font-medium {selectedPeriod === 'PM' ? 'bg-[#F31A7C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">PM</button>
												</div>
											</div>
											<button on:click={() => (showTimePicker = false)} class="mt-2 w-full rounded-lg bg-black py-1.5 text-xs font-bold text-white hover:bg-gray-800">Done</button>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Price with custom currency dropdown -->
						<div class="rounded-xl border border-gray-200 bg-white p-4">
							<label for="collab-fee" class="mb-1.5 block text-xs font-medium text-gray-700">
								Proposed Price/Fee
								{#if priceIsFromProduct}
									<span class="text-green-600">(from product)</span>
								{:else}
									<span class="text-gray-400">(Optional)</span>
								{/if}
							</label>
							<div class="flex items-center gap-2">
								<!-- Custom currency dropdown -->
								<div class="relative shrink-0">
									<button on:click={() => (showCurrencyDropdown = !showCurrencyDropdown)} disabled={!!priceIsFromProduct} class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed">
										{selectedCurrencyLabel}
										<Icon icon="mdi:chevron-down" class="h-3 w-3 text-gray-400" />
									</button>
									{#if showCurrencyDropdown}
										<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showCurrencyDropdown = false)} aria-label="Close"></button>
										<div class="absolute left-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
											{#each currencies as cur}
												<button on:click={() => { priceCurrency = cur.code; showCurrencyDropdown = false; }} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-gray-50 {priceCurrency === cur.code ? 'bg-gray-50 font-medium' : ''}">
													<span class="text-sm">{cur.symbol}</span> {cur.label}
													{#if priceCurrency === cur.code}<Icon icon="mdi:check" class="ml-auto h-3 w-3 text-green-600" />{/if}
												</button>
											{/each}
										</div>
									{/if}
								</div>
								<input id="collab-fee" type="number" bind:value={proposedPrice} placeholder="0.00" min="0" step="0.01" disabled={!!priceIsFromProduct} class="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed" />
							</div>
						</div>
					</div>

					<!-- ═══ 5. Message ═══ -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label for="collab-msg" class="mb-1.5 block text-xs font-medium text-gray-700">Message to Organizer <span class="text-gray-400">(Optional)</span></label>
						<div class="relative">
							<textarea id="collab-msg" bind:value={messageText} maxlength="500" rows="4" placeholder="Describe your proposal, what you offer, and why you'd be a great fit..." class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 pr-14 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
							<span class="pointer-events-none absolute right-3 bottom-2 text-[9px] text-gray-400">{messageText.length}/500</span>
						</div>
						<p class="mt-1 flex items-center gap-1 text-[9px] text-gray-400"><Icon icon="mdi:information-outline" class="h-3 w-3" /> Include details about your service, pricing, and availability.</p>
					</div>

					<!-- ═══ 6. Attachments ═══ -->
					<div class="rounded-xl border border-gray-200 bg-white p-4">
						<label class="mb-1.5 block text-xs font-medium text-gray-700">Attachments <span class="text-gray-400">(Optional)</span></label>
						<div class="flex min-h-[80px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-3 text-center" role="region" aria-label="Upload area">
							<Icon icon="mdi:cloud-upload-outline" class="mb-1 h-5 w-5 text-gray-400" />
							<p class="text-[10px] text-gray-600">Choose a file or drag & drop it here.</p>
							<p class="text-[9px] text-gray-400">JPEG, PNG, PDF, MP4 up to 10 MB.</p>
							<button class="mt-2 rounded-lg border border-gray-300 px-3 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50">Browse File</button>
						</div>
					</div>
				</div>

			{:else}
				<!-- ═══ View Existing Request ═══ -->
				{#if loading && !collab}
					<div class="animate-pulse space-y-4"><div class="h-32 w-full rounded-xl bg-gray-200"></div><div class="h-6 w-48 rounded bg-gray-200"></div><div class="h-32 w-full rounded-lg bg-gray-100"></div></div>
				{:else if collab}
					<div class="mb-4 flex h-32 w-full items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 sm:h-40">
						<Icon icon="mdi:send-outline" class="h-14 w-14 text-orange-300" />
					</div>
					<div class="mb-1 flex items-center gap-2">
						<span class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-400">Sent Request</span>
						<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(collab.status)}">{collab.status}</span>
					</div>
					<h2 class="text-lg font-bold text-gray-900 leading-tight sm:text-xl">{collab.title || 'Collaboration Request'}</h2>
					{#if collab.createdAt}<p class="mt-1 text-xs text-gray-400">Sent {formatDateShort(collab.createdAt)}</p>{/if}

					<div class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
						<div class="space-y-3">
							{#if collab.organizerName || collab.creatorId}
								<div class="flex items-start gap-2"><Icon icon="mdi:account-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /><div><p class="text-[10px] text-gray-400">Target Organizer</p><p class="text-xs font-medium text-gray-800">{collab.organizerName || collab.creatorId?.username || collab.creatorId || 'Organizer'}</p>{#if collab.organizerEmail}<p class="text-[10px] text-gray-400">{collab.organizerEmail}</p>{/if}</div></div>
							{/if}
							{#if collab.eventName || collab.eventId}
								<div class="flex items-start gap-2"><Icon icon="mdi:calendar-star" class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" /><div><p class="text-[10px] text-gray-400">Event</p><p class="text-xs font-medium text-gray-800">{collab.eventName || collab.eventId}</p>{#if collab.eventLocation}<p class="text-[10px] text-gray-400">{collab.eventLocation}</p>{/if}</div></div>
							{/if}
							{#if collab.description}
								<div class="flex items-start gap-2"><Icon icon="mdi:package-variant-closed" class="mt-0.5 h-4 w-4 shrink-0 text-purple-500" /><div><p class="text-[10px] text-gray-400">Proposed Service</p><p class="text-xs font-medium text-gray-800">{collab.description}</p></div></div>
							{/if}
							{#if collab.budget}
								<div class="flex items-start gap-2"><Icon icon="mdi:cash" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" /><div><p class="text-[10px] text-gray-400">Proposed Price</p><p class="text-xs font-bold text-gray-900">₦{collab.budget.toLocaleString()}</p></div></div>
							{/if}
							{#if collab.deadline}
								<div class="flex items-start gap-2"><Icon icon="mdi:calendar" class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" /><div><p class="text-[10px] text-gray-400">Proposed Date</p><p class="text-xs font-medium text-gray-800">{formatDateShort(collab.deadline)}</p></div></div>
							{/if}
							{#if collab.proposal}
								<div class="flex items-start gap-2"><Icon icon="mdi:message-text-outline" class="mt-0.5 h-4 w-4 shrink-0 text-gray-500" /><div><p class="text-[10px] text-gray-400">Message</p><p class="text-xs font-medium text-gray-800">{collab.proposal}</p></div></div>
							{/if}
						</div>
					</div>

					<!-- Delete confirmation is now a modal overlay (see below) -->
				{/if}
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<span class="text-[10px] text-gray-400 sm:text-xs">{#if mode === 'view' && collab?.updatedAt}Last updated {formatDateShort(collab.updatedAt)}{/if}</span>
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
			{:else if collab && collab?.status !== 'CONFIRMED'}
				<button on:click={() => (showDeleteConfirm = true)} disabled={deleteLoading} class="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50">
					<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /> Delete Request
				</button>
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
			This will permanently delete this collaboration request and remove your application from the organizer's participant list. This cannot be undone.
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
