<script lang="ts">
	import { page } from '$app/stores';
	import { getCollectionSubscribers } from '$lib/services/collection.services';
	import {
		getEmailUsage,
		getEventAttendees,
		inviteAttendees
	} from '$lib/services/event.services';
	import { authState } from '$lib/stores/auth.store';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let open = false;

	$: eventId = $page.params.id as string;
	$: ({
		event: eventStore,
		collections: collectionsStore
	} = getEventCache(eventId));
	$: rawEvent = $eventStore;
	$: cachedCollections = $collectionsStore;

	// Current user
	$: userId = $authState.user?.id ?? '';
	$: organizerName = rawEvent?.eventOrganizerName ?? $authState.activeProfile?.name ?? 'Organizer';
	$: eventName = rawEvent?.title ?? 'Event';
	$: eventSlug = rawEvent?.customLinkSlug ?? eventId;
	$: eventPageUrl = `rondwell.com/e/${eventSlug}`;

	// Tabs & state
	let activeTab = 'suggestions';
	let email = '';
	let enteredName = '';
	let step = 1;
	let customMessage = '';
	let searchQuery = '';
	let sending = false;
	let sendResult: { success: any[]; failed: any[] } | null = null;
	let csvFileInput: HTMLInputElement;

	// Email usage / limits
	let emailUsage = { used: 0, limit: 15, tier: 'FREE' };
	$: weeklyLimit = emailUsage.limit;
	$: remaining = Math.max(0, weeklyLimit - emailUsage.used);

	// Collections (sidebar subscriber groups)
	interface CollectionItem {
		id: string;
		name: string;
		profilePictureUrl?: string;
		color: string;
		subscriberCount: number;
	}
	let collections: CollectionItem[] = [];

	// Email list (unified list of people from all sources)
	interface EmailItem {
		email: string;
		name: string;
		firstName?: string;
		lastName?: string;
		initial: string;
		selected: boolean;
		inEvent: boolean;
		source: string; // 'suggestions' | 'entered' | collectionId
		profilePicture?: string;
	}
	let emailList: EmailItem[] = [];

	// Existing attendees (to mark "In Event")
	let existingAttendeeEmails = new Set<string>();

	const defaultColors = ['#808080', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#f59e0b', '#ec4899'];

	onMount(async () => {
		await Promise.all([loadEmailUsage(), loadExistingAttendees(), loadCollections()]);
	});

	// Reset state when modal opens
	$: if (open) {
		step = 1;
		activeTab = 'suggestions';
		sendResult = null;
		customMessage = '';
		searchQuery = '';
		// Reload data
		loadEmailUsage();
		loadExistingAttendees();
		loadCollections();
	}

	async function loadEmailUsage() {
		if (!userId) return;
		try {
			emailUsage = await getEmailUsage(userId);
		} catch {
			emailUsage = { used: 0, limit: 15, tier: 'FREE' };
		}
	}

	async function loadExistingAttendees() {
		if (!eventId) return;
		try {
			const attendees = await getEventAttendees(eventId);
			existingAttendeeEmails = new Set(attendees.map((a: any) => a.email?.toLowerCase()));
		} catch {
			existingAttendeeEmails = new Set();
		}
	}

	async function loadCollections() {
		if (!cachedCollections?.length) return;
		collections = cachedCollections.map((c: any, i: number) => ({
			id: c._id || c.id,
			name: c.name,
			profilePictureUrl: c.profilePictureUrl,
			color: defaultColors[i % defaultColors.length],
			subscriberCount: 0
		}));

		// Load subscriber counts and "Everyone" (all subscribers across all collections)
		let allSubscribers: EmailItem[] = [];
		for (const col of collections) {
			try {
				const result = await getCollectionSubscribers(col.id, { limit: 200 });
				const subs = result?.subscribers ?? result ?? [];
				col.subscriberCount = result?.total ?? subs.length;

				for (const sub of subs) {
					const emailLower = sub.email?.toLowerCase();
					if (!emailLower) continue;
					const alreadyAdded = allSubscribers.some((s) => s.email === emailLower);
					if (!alreadyAdded) {
						allSubscribers.push({
							email: emailLower,
							name: [sub.firstName, sub.lastName].filter(Boolean).join(' ') || '',
							firstName: sub.firstName,
							lastName: sub.lastName,
							initial: (sub.firstName?.[0] || sub.email?.[0] || '?').toUpperCase(),
							selected: false,
							inEvent: existingAttendeeEmails.has(emailLower),
							source: col.id,
							profilePicture: undefined
						});
					}
					// Also add to suggestions (all subscribers = suggestions)
					const inSuggestions = emailList.some(
						(e) => e.email === emailLower && e.source === 'suggestions'
					);
					if (!inSuggestions) {
						emailList = [
							...emailList,
							{
								email: emailLower,
								name: [sub.firstName, sub.lastName].filter(Boolean).join(' ') || '',
								firstName: sub.firstName,
								lastName: sub.lastName,
								initial: (sub.firstName?.[0] || sub.email?.[0] || '?').toUpperCase(),
								selected: false,
								inEvent: existingAttendeeEmails.has(emailLower),
								source: 'suggestions',
								profilePicture: undefined
							}
						];
					}
				}
			} catch {
				// skip failed collection
			}
		}

		// Add collection-sourced subscribers to emailList
		for (const sub of allSubscribers) {
			const exists = emailList.some(
				(e) => e.email === sub.email && e.source === sub.source
			);
			if (!exists) {
				emailList = [...emailList, sub];
			}
		}

		// Update collections reactively
		collections = [...collections];
	}

	// Add manually entered email
	function addEmail() {
		const trimmed = email.trim().toLowerCase();
		if (!trimmed || !trimmed.includes('@')) return;
		const alreadyExists = emailList.some((e) => e.email === trimmed && e.source === 'entered');
		if (alreadyExists) {
			email = '';
			enteredName = '';
			return;
		}
		const isInEvent = existingAttendeeEmails.has(trimmed);
		const nameParts = enteredName.trim().split(' ');
		const firstName = nameParts[0] || '';
		const lastName = nameParts.slice(1).join(' ') || '';
		emailList = [
			...emailList,
			{
				email: trimmed,
				name: enteredName.trim(),
				firstName,
				lastName,
				initial: (firstName?.[0] || trimmed[0]).toUpperCase(),
				selected: !isInEvent,
				inEvent: isInEvent,
				source: 'entered'
			}
		];
		email = '';
		enteredName = '';
	}

	function handleEmailKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addEmail();
		}
	}

	// CSV template download
	function downloadCsvTemplate() {
		const csv = 'email,name\njohn@example.com,John Doe\njane@example.com,Jane Smith';
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'attendee_invitation_template.csv';
		a.click();
		URL.revokeObjectURL(url);
	}

	// CSV file upload
	function handleCsvUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
			const start = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
			const parsed = lines.slice(start).map((line) => {
				const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
				return { email: (parts[0] || '').toLowerCase(), name: parts[1] || '' };
			}).filter((p) => p.email.includes('@'));

			for (const p of parsed) {
				const alreadyExists = emailList.some((e) => e.email === p.email && e.source === 'entered');
				if (alreadyExists) continue;
				const nameParts = p.name.split(' ');
				emailList = [
					...emailList,
					{
						email: p.email,
						name: p.name,
						firstName: nameParts[0] || '',
						lastName: nameParts.slice(1).join(' ') || '',
						initial: (p.name?.[0] || p.email[0]).toUpperCase(),
						selected: true,
						inEvent: existingAttendeeEmails.has(p.email),
						source: 'entered'
					}
				];
			}
		};
		reader.readAsText(file);
		// Reset input so same file can be re-uploaded
		if (csvFileInput) csvFileInput.value = '';
	}

	// Select all visible items for a source
	function selectAllForSource(source: string) {
		emailList = emailList.map((e) =>
			e.source === source && !e.inEvent ? { ...e, selected: true } : e
		);
	}

	function toggleSelect(item: EmailItem) {
		if (item.inEvent) return;
		emailList = emailList.map((e) => (e === item ? { ...e, selected: !e.selected } : e));
	}

	function removeSelected(item: EmailItem) {
		emailList = emailList.map((e) => (e === item ? { ...e, selected: false } : e));
	}

	// Counting
	$: selectedCount = emailList.filter((e) => e.selected).length;
	$: canSendMore = selectedCount <= remaining;

	// Filtered list for current tab
	$: filteredList = (() => {
		let source = activeTab;
		let list = emailList.filter((e) => e.source === source);
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(e) => e.email.includes(q) || e.name.toLowerCase().includes(q)
			);
		}
		return list;
	})();

	$: currentCollectionName =
		collections.find((c) => c.id === activeTab)?.name ?? activeTab;

	// Send invitations
	async function handleSendInvites() {
		if (sending || selectedCount === 0) return;
		sending = true;
		sendResult = null;
		try {
			const selected = emailList.filter((e) => e.selected && !e.inEvent);
			const attendees = selected.map((e) => ({
				email: e.email,
				firstName: e.firstName || e.name?.split(' ')[0] || '',
				lastName: e.lastName || e.name?.split(' ').slice(1).join(' ') || ''
			}));
			sendResult = await inviteAttendees(eventId, attendees, customMessage || undefined);
			// Refresh email usage after sending
			await loadEmailUsage();
			// Mark sent emails as inEvent
			const sentEmails = new Set(sendResult.success.map((s: any) => s.email?.toLowerCase()));
			emailList = emailList.map((e) =>
				sentEmails.has(e.email) ? { ...e, selected: false, inEvent: true } : e
			);
			existingAttendeeEmails = new Set([...existingAttendeeEmails, ...sentEmails]);
		} catch (err: any) {
			sendResult = { success: [], failed: [{ email: 'all', reason: err.message }] };
		} finally {
			sending = false;
		}
	}

	function handleNextOrSend() {
		if (step === 1) {
			step = 2;
		} else {
			handleSendInvites();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3"
		on:click={() => (open = false)}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex h-full max-h-140 w-full max-w-3xl flex-col rounded-lg bg-[#F8F8F9] shadow-lg md:max-h-120"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 p-3">
				<div class="flex h-full w-full max-w-85 items-center justify-between">
					<h2 class="font-semibold">Invite Attendee</h2>

					{#if activeTab === 'limit_details'}
						<div class="hidden items-center gap-2 md:flex">
							<button
								on:click={() => (activeTab = 'suggestions')}
								class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
							>
								<img src="/arrow-right.svg" alt="arrow back" />
							</button>
							Invite Limit
						</div>
					{/if}
				</div>

				<div class="flex items-center gap-5">
					{#if step === 1}
						<button
							on:click={() => (activeTab = 'limit_details')}
							class="flex w-[120px] items-center gap-2 rounded-full border-2 px-3 py-1 {activeTab === 'limit_details' ? 'border-black' : 'border-[#E5E6E6]'}"
						>
							<span class="h-[22px] w-[22px] rounded-full border-3 border-[#E5E6E6]"></span>
							<p class="text-[#A8A9A9]">
								{remaining - selectedCount < 0 ? 0 : remaining - selectedCount} Left
							</p>
						</button>
					{/if}
					<button
						class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
						on:click={() => (open = false)}
					>
						<Icon icon="mdi:close" class="text-lg font-bold" />
					</button>
				</div>
			</div>

			<div class="custom-scrollbar flex-1 overflow-y-auto">
				{#if step === 1}
					<div class="flex">
						<!-- Sidebar -->
						<aside class="hidden h-full w-80 flex-col justify-between px-3 py-1 md:flex">
							<div class="w-full space-y-1">
								<button
									on:click={() => (activeTab = 'suggestions')}
									class="flex w-full items-center gap-1 rounded px-3 py-2 text-left text-[16px] text-[#A5A6A6]
									{activeTab === 'suggestions' ? 'bg-[#EBEBEB] font-medium' : ''}"
								>
									<Icon icon="mdi:sparkles" />
									Suggestions
								</button>

								<button
									on:click={() => (activeTab = 'enter')}
									class="flex w-full items-center gap-1 rounded px-3 py-2 text-left text-[16px] text-[#A5A6A6]
									{activeTab === 'enter' ? 'bg-[#EBEBEB] font-medium' : ''}"
								>
									<Icon icon="mdi:at" class="h-4 w-4" />
									Enter Emails
								</button>
							</div>
							<div class="mt-3 space-y-3 border-t pt-3">
								<p class="text-sm text-[#A5A6A6]">subscribers</p>
								<div class="flex flex-col gap-1">
									{#each collections as col}
										<button
											on:click={() => (activeTab = col.id)}
											class="flex w-full items-center justify-between rounded px-3 py-2 {activeTab === col.id ? 'bg-[#EBEBEB] font-medium' : ''}"
										>
											<div class="flex items-center gap-2">
												{#if col.profilePictureUrl}
													<img src={col.profilePictureUrl} alt={col.name} class="h-3 w-3 rounded-full object-cover" />
												{:else}
													<p class="h-3 w-3 rounded-full" style="background-color: {col.color};"></p>
												{/if}
												<p class="text-[#3E4041]">{col.name}</p>
											</div>
											<p class="text-[#A6A7A7]">{col.subscriberCount}</p>
										</button>
									{/each}
								</div>
								<p class="border-t pt-3 text-[#A5A6A6]">
									Events: <span class="text-gray-800">{eventName}</span>
								</p>
							</div>
						</aside>

						<!-- Main Panel -->
						<main class="custom-scrollbar flex w-full flex-col gap-4 overflow-y-auto border-l px-3 py-3">
							<!-- Mobile Tabs -->
							<div class="custom-scrollbar flex gap-2 overflow-x-auto md:hidden">
								<div class="flex w-full gap-2">
									<button
										on:click={() => (activeTab = 'suggestions')}
										class="flex flex-shrink-0 items-center gap-1 rounded px-3 py-2 text-left text-[16px] text-[#A5A6A6]
										{activeTab === 'suggestions' ? 'bg-[#EBEBEB] font-medium' : ''}"
									>
										<Icon icon="mdi:sparkles" />
										Suggestions
									</button>

									<button
										on:click={() => (activeTab = 'enter')}
										class="flex flex-shrink-0 items-center gap-1 rounded px-3 py-2 text-left text-[16px] text-[#A5A6A6]
										{activeTab === 'enter' ? 'bg-[#EBEBEB] font-medium' : ''}"
									>
										<Icon icon="mdi:at" class="h-4 w-4" />
										Enter Emails
									</button>

									{#each collections as col}
										<button
											on:click={() => (activeTab = col.id)}
											class="flex flex-shrink-0 items-center justify-between rounded px-3 py-2 {activeTab === col.id ? 'bg-[#EBEBEB] font-medium' : ''}"
										>
											<div class="flex items-center gap-2">
												{#if col.profilePictureUrl}
													<img src={col.profilePictureUrl} alt={col.name} class="h-3 w-3 rounded-full object-cover" />
												{:else}
													<p class="h-3 w-3 rounded-full" style="background-color: {col.color};"></p>
												{/if}
												<p class="text-[#3E4041]">{col.name}</p>
											</div>
										</button>
									{/each}
								</div>
							</div>
							<div>
								<!-- TAB: ENTER EMAILS -->
								{#if activeTab === 'enter'}
									<div class="space-y-3">
										<label for="email" class="block text-sm font-medium text-[#666769]">Add Emails</label>
										<div class="flex gap-1">
											<input
												type="email"
												placeholder="Paste or enter email here"
												bind:value={email}
												on:keydown={handleEmailKeydown}
												class="flex-1 rounded-md border bg-[#EFF0F0] px-3 py-2 text-sm focus:ring-0 focus:outline-none"
											/>
											<input
												type="text"
												placeholder="Name (Optional)"
												bind:value={enteredName}
												on:keydown={handleEmailKeydown}
												class="flex-1 rounded-md border bg-[#EFF0F0] px-3 py-2 text-sm focus:ring-0 focus:outline-none"
											/>
											<button
												disabled={!email.trim()}
												on:click={addEmail}
												class="rounded-md {!email.trim() ? 'bg-[#EFF0F0] text-[#666769]' : 'bg-[#666769] text-white'} px-4 py-2 text-sm"
											>
												Add
											</button>
										</div>

										{#if emailList.filter((e) => e.source === 'entered').length > 0}
											<div class="space-y-2">
												{#each emailList.filter((e) => e.source === 'entered') as item}
													<div class="flex items-center justify-between">
														<div class="flex items-center gap-2">
															<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-[#9A9B9B]">
																{item.initial}
															</div>
															<div class="flex flex-col">
																{#if item.name}
																	<span class="text-sm font-medium">{item.name}</span>
																{/if}
																<span class="text-xs text-[#A9AAAA]">{item.email}</span>
															</div>
														</div>
														{#if item.inEvent}
															<span class="rounded px-2 py-1 text-xs bg-[#F1F1F1] text-[#969798]">In Event</span>
														{:else}
															<button
																on:click={() => toggleSelect(item)}
																class="flex h-7 w-7 items-center justify-center rounded-full {item.selected ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}"
															>
																<Icon icon="mdi:tick" class="text-xl" />
															</button>
														{/if}
													</div>
												{/each}
											</div>
										{/if}

										<!-- CSV Import Section (always visible) -->
										<div class="mt-3 space-y-2 border-t pt-3">
											<p class="block text-sm font-medium text-[#666769]">Import CSV</p>
											<button
												on:click={() => csvFileInput?.click()}
												class="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-[#EFF0F0] p-6 text-center"
											>
												<img src="/csv-icon.svg" alt="" />
												<p class="text-lg text-[#666769]">Import CSV File</p>
												<p class="text-sm text-gray-400">Drop file or click here to choose file.</p>
											</button>
											<input bind:this={csvFileInput} type="file" accept=".csv" class="hidden" on:change={handleCsvUpload} />
											<button on:click={downloadCsvTemplate} class="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
												<img src="/document-download.svg" alt="" />
												Download CSV Template
											</button>
										</div>
									</div>

								<!-- TAB: LIMIT DETAILS -->
								{:else if activeTab === 'limit_details'}
									<div>
										<div class="mb-3 flex items-center gap-2">
											{#if cachedCollections?.[0]?.profilePictureUrl}
												<img src={cachedCollections[0].profilePictureUrl} class="h-8 w-8 rounded-full object-cover" alt="collection" />
											{:else}
												<img src="/tech-icon.svg" class="h-full w-8" alt="avatar" />
											{/if}
											<div>
												<div class="text-md font-semibold">{cachedCollections?.[0]?.name ?? 'My Collection'}</div>
												<div class="text-xs text-[#ABADAD]">{emailUsage.tier === 'PLUS' ? 'Rondwell Plus' : 'Rondwell Free'}</div>
											</div>
										</div>

										<div class="mb-2 text-sm">
											You can send {weeklyLimit} invites from this calendar each month.
										</div>

										<!-- Progress -->
										<div class="space-y-2">
											<div class="flex justify-between text-sm text-gray-600">
												<span>{emailUsage.used} Used</span>
												<span>{remaining} Available</span>
											</div>
											<div class="h-2 w-full rounded bg-gray-200">
												<div
													class="h-2 rounded bg-blue-500"
													style="width: {weeklyLimit > 0 ? (emailUsage.used / weeklyLimit) * 100 : 0}%;"
												></div>
											</div>
										</div>

										{#if emailUsage.tier !== 'PLUS'}
											<div class="border-t pt-4">
												<div class="font-medium">How to increase your invite limit</div>
												<div class="mt-3 space-y-3 rounded-lg bg-[#FDFDFD] p-3">
													<div class="flex flex-col justify-between gap-2 md:flex-row md:items-center">
														<div class="flex items-center gap-1">
															<img src="/logo1.svg" alt="" class="h-6 w-6" />
															<div>
																<div class="font-medium">Upgrade to Rondwell Plus</div>
																<div class="text-sm font-light text-[#7F766A]">Get 5,000 to 100,000 sends per month</div>
															</div>
														</div>
														<button class="w-full rounded-md bg-gray-800 px-4 py-2 text-white md:w-fit">Upgrade</button>
													</div>
												</div>
											</div>
										{/if}
									</div>

								<!-- TAB: SUGGESTIONS / COLLECTION SUBSCRIBERS -->
								{:else}
									<div class="space-y-3">
										<div class="relative mb-4 w-full">
											<input
												type="text"
												bind:value={searchQuery}
												placeholder={activeTab === 'suggestions'
													? 'Search in Suggestions'
													: `Search in "${currentCollectionName}"`}
												class="h-[43px] w-full rounded-lg bg-[#EFF0F0] py-2 pr-4 pl-10 text-[#b5b6b6] focus:ring-0 focus:outline-none"
											/>
											<span class="absolute top-2.5 left-3 text-gray-400">
												<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
											</span>
										</div>

										<div class="flex items-center justify-between border-b pb-2 text-sm text-gray-500">
											<span>{filteredList.length} People</span>
											<button on:click={() => selectAllForSource(activeTab)}>Select All</button>
										</div>

										{#if filteredList.length > 0}
											<div class="space-y-2">
												{#each filteredList as person}
													<button
														class="flex w-full cursor-pointer items-center justify-between"
														on:click={() => toggleSelect(person)}
														disabled={person.inEvent}
													>
														<div class="flex items-center gap-2">
															{#if person.profilePicture}
																<img src={person.profilePicture} alt="" class="h-7 w-7 rounded-full" />
															{:else}
																<div class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-[#9A9B9B]">
																	{person.initial}
																</div>
															{/if}
															<div class="flex flex-col items-start text-sm {person.selected || person.inEvent ? '' : 'text-[#D3D3D3]'}">
																{#if person.name}
																	<span class="text-sm font-medium">{person.name}</span>
																{/if}
																<span class="text-xs {person.selected || person.inEvent ? 'text-[#A9AAAA]' : ''}">{person.email}</span>
															</div>
														</div>

														<div class="flex items-center gap-2">
															{#if person.selected && !person.inEvent}
																<div class="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
																	<Icon icon="mdi:tick" class="text-xl" />
																</div>
															{/if}
															{#if person.inEvent}
																<span class="rounded px-2 py-1 text-xs bg-[#F1F1F1] text-[#969798]">In Event</span>
															{/if}
														</div>
													</button>
												{/each}
											</div>
										{:else}
											<div class="flex h-full flex-col items-center justify-center py-8">
												<img src="/profile-2user.svg" alt="" />
												<p class="text-center text-[#646568]">No Result found.</p>
												<p class="text-[#BABBBB]">
													Search for someone else or <button class="text-pink-600" on:click={() => (activeTab = 'enter')}>add people by email.</button>
												</p>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</main>
					</div>

				<!-- STEP 2: Review & Send -->
				{:else if step === 2}
					<div class="flex flex-col gap-2 md:flex-row">
						<aside class="flex w-80 flex-col gap-2 px-3 py-1">
							<p class="mt-2 text-sm text-gray-500">
								Inviting {emailList.filter((e) => e.selected && !e.inEvent).length} People
							</p>
							<div class="space-y-2 max-h-60 overflow-y-auto">
								{#each emailList.filter((e) => e.selected && !e.inEvent) as item}
									<div class="flex items-center justify-between gap-2">
										<div class="flex items-center gap-2">
											<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
												{item.initial}
											</div>
											<div class="flex flex-col">
												{#if item.name}
													<span class="text-sm font-medium truncate">{item.name}</span>
												{/if}
												<span class="text-xs text-[#A9AAAA] truncate">{item.email}</span>
											</div>
										</div>
										<button on:click={() => removeSelected(item)} class="text-gray-400 hover:text-gray-600 flex-shrink-0">
											<Icon icon="mdi:close" class="text-sm" />
										</button>
									</div>
								{/each}
							</div>
						</aside>

						<div class="flex flex-col border-l p-4 flex-1">
							{#if sendResult}
								<!-- Send Result -->
								<div class="space-y-3">
									{#if sendResult.success.length > 0}
										<div class="rounded-md bg-green-50 p-3">
											<p class="text-sm text-green-700">
												{sendResult.success.length} invitation{sendResult.success.length > 1 ? 's' : ''} sent successfully.
											</p>
										</div>
									{/if}
									{#if sendResult.failed.length > 0}
										<div class="rounded-md bg-red-50 p-3">
											<p class="text-sm text-red-700 font-medium">Failed to invite:</p>
											{#each sendResult.failed as fail}
												<p class="text-xs text-red-600">{fail.email}: {fail.reason}</p>
											{/each}
										</div>
									{/if}
									<button
										on:click={() => { sendResult = null; step = 1; }}
										class="rounded-md bg-gray-800 px-4 py-2 text-sm text-white"
									>
										Done
									</button>
								</div>
							{:else}
								<div class="mb-4 rounded-md bg-[#FEFEFE]">
									<p class="text-md p-4 leading-relaxed">
										Hi, {organizerName} invites you to join {eventName}.
									</p>
									<!-- Rich text editor -->
									<div class="relative">
										<div class="flex items-center gap-1 border-b bg-[#F5F5F5] px-3 py-1">
											<button
												type="button"
												on:click={() => document.execCommand('bold')}
												class="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
												title="Bold"
											>
												<Icon icon="mdi:format-bold" class="text-base" />
											</button>
											<button
												type="button"
												on:click={() => document.execCommand('italic')}
												class="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
												title="Italic"
											>
												<Icon icon="mdi:format-italic" class="text-base" />
											</button>
											<button
												type="button"
												on:click={() => document.execCommand('underline')}
												class="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
												title="Underline"
											>
												<Icon icon="mdi:format-underline" class="text-base" />
											</button>
											<span class="mx-1 h-4 w-px bg-gray-300"></span>
											<button
												type="button"
												on:click={() => document.execCommand('insertUnorderedList')}
												class="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
												title="Bullet List"
											>
												<Icon icon="mdi:format-list-bulleted" class="text-base" />
											</button>
										</div>
										<div
											contenteditable="true"
											role="textbox"
											tabindex="0"
											class="custom-scrollbar h-24 w-full overflow-y-auto bg-[#F5F5F5] px-3 py-2 text-sm focus:ring-0 focus:outline-0"
											placeholder="Add a custom message here..."
											on:input={(e) => { customMessage = e.currentTarget.innerHTML; }}
										></div>
									</div>
									<p class="text-md p-4 font-medium">RSVP: {eventPageUrl}</p>
								</div>

								<!-- Info note -->
								<div class="flex items-start gap-1 text-xs">
									<div class="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#EFF0F0]">
										<svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path opacity="0.4" d="M34.2712 21.6511C34.9125 21.6511 35.4222 21.1249 35.4222 20.4672V19.0203C35.4222 12.5583 33.449 10.6016 27.0035 10.6016H16.6445V14.5972C17.2858 14.5972 17.812 15.1233 17.812 15.7646V20.1713C17.812 20.8125 17.2858 21.3387 16.6445 21.3387V25.4658C17.2858 25.4658 17.812 25.992 17.812 26.6333V31.0399C17.812 31.6812 17.2858 32.2074 16.6445 32.2074V36.1701H27.0035C33.449 36.1701 35.4222 34.1969 35.4222 27.7514C35.4222 27.1101 34.9125 26.5839 34.2712 26.5839C32.89 26.5839 31.7883 25.4823 31.7883 24.1175C31.7883 22.7528 32.89 21.6511 34.2712 21.6511Z" fill="#737577" />
											<path opacity="0.4" d="M30.0147 11.049H13.418L18.7676 5.6625C23.1313 1.26875 25.3223 1.26875 29.686 5.6625L30.7815 6.76553C29.6313 7.92371 29.3574 9.63341 30.0147 11.049Z" stroke="#737577" stroke-width="2.36776" stroke-linecap="round" stroke-linejoin="round" />
											<path d="M15.4785 15.7716V20.1783C15.4785 20.8195 16.0047 21.3457 16.6459 21.3457V25.4728C16.0047 25.4728 15.4785 25.999 15.4785 26.6403V31.0469C15.4785 31.6882 16.0047 32.2144 16.6459 32.2144V36.1771H12.4695C6.02391 36.1771 4.05078 34.2039 4.05078 27.7584V27.0513C4.05078 26.3936 4.56051 25.8839 5.20178 25.8839C6.58297 25.8839 7.68463 24.7658 7.68463 23.401C7.68463 22.0363 6.58297 20.9182 5.20178 20.9182C4.56051 20.9182 4.05078 20.4085 4.05078 19.7507V19.0437C4.05078 12.5817 6.02391 10.625 12.4695 10.625H16.6295V14.6206C16.0047 14.6206 15.4785 15.1468 15.4785 15.7716Z" fill="#737577" />
										</svg>
									</div>
									<div>
										<p>We will send attendees an invite link to register for the event.</p>
										<p class="text-[#AFB1B1]">Attendees will be automatically approved when they complete their registration.</p>
									</div>
								</div>

								<p class="mt-4 border-t pt-4 text-xs leading-tight text-gray-500">
									You can bypass registration and payment by changing attendee status to <span class="font-medium text-gray-700">"Attending"</span>.
								</p>

								{#if !canSendMore}
									<div class="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-700">
										You've selected more invites than your remaining limit ({remaining} left).
										<button on:click={() => (activeTab = 'limit_details')} class="underline">Upgrade</button> or reduce your selection.
									</div>
								{/if}
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Bottom Footer -->
			<div class="flex h-15 items-center justify-between border-t border-gray-200 p-3">
				{#if step === 1}
					<span class="text-[#B9BABA]">{selectedCount} Selected</span>
				{:else if step === 2 && !sendResult}
					<button
						on:click={() => (step = 1)}
						class="flex items-center gap-1 rounded-md border bg-gray-100 px-4 py-2 text-sm text-[#626365]"
					>
						<img src="/arrow-right.svg" alt="" />
						Back
					</button>
				{:else}
					<span></span>
				{/if}

				{#if !sendResult}
					<button
						on:click={handleNextOrSend}
						class="flex items-center gap-1 rounded-md px-6 py-2 text-white {selectedCount === 0 || sending || (step === 2 && !canSendMore) ? 'bg-[#969798]' : 'bg-gray-800'}"
						disabled={selectedCount === 0 || sending || (step === 2 && !canSendMore)}
					>
						{#if sending}
							Sending...
						{:else}
							{step === 1 ? 'Next' : 'Send Invites'}
						{/if}
						<svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M0.871094 0.841797C1.5721 0.157615 2.58659 0.00457658 3.45703 0.464844L9.39453 3.58984L9.52832 3.66602C10.1806 4.06709 10.5811 4.77826 10.5811 5.55273C10.5809 6.32719 10.1807 7.0385 9.52832 7.43945L9.39453 7.51465L3.45703 10.6387L3.45801 10.6396C3.12189 10.8189 2.76691 10.9033 2.41211 10.9033C1.84716 10.9033 1.30127 10.6826 0.871094 10.2637V10.2627C0.16927 9.57763 -0.000216478 8.56312 0.4375 7.6875L1.26758 6.02734C1.41356 5.73526 1.41438 5.38069 1.26758 5.08203L0.4375 3.41699C-0.000180173 2.54137 0.169252 1.52684 0.871094 0.841797ZM2.41797 1.36426C2.12646 1.36426 1.86586 1.50002 1.68457 1.67676L1.68359 1.67773C1.41317 1.93952 1.22744 2.3971 1.47754 2.90234L2.30664 4.5625L2.30762 4.56348C2.61652 5.18723 2.61666 5.92317 2.30762 6.54688H2.30664L1.47754 8.20703L1.47656 8.20801C1.22284 8.71154 1.41204 9.16866 1.68359 9.43164C1.95736 9.69658 2.41563 9.87688 2.91504 9.61426L8.85254 6.48926L8.97852 6.41211C9.25687 6.21531 9.41791 5.90557 9.41797 5.55762C9.41797 5.16005 9.20777 4.81236 8.85254 4.62598L8.85156 4.625L2.91406 1.49023V1.48926C2.73942 1.3978 2.57161 1.36433 2.41797 1.36426Z" fill="white" stroke="white" stroke-width="0.394627" />
							<rect x="5.32622" y="6.17388" width="3.55164" height="1.18388" rx="0.59194" transform="rotate(-180 5.32622 6.17388)" fill="white" stroke="white" stroke-width="0.394627" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	[contenteditable]:empty:before {
		content: attr(placeholder);
		color: #9ca3af;
		pointer-events: none;
	}
</style>
