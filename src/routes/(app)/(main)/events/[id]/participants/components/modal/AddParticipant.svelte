<script lang="ts">
	import { inviteExhibitorByEmail, inviteExhibitorByProfile, inviteSpeakerByEmail, inviteSpeakerByProfile, inviteVendorByEmail, inviteVendorByProfile, manualAddExhibitor, manualAddSpeaker, manualAddVendor, searchRondwellProfiles } from '$lib/services/event.services';
	import { getVendorPublicProducts } from '$lib/services/vendor.services';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Detects the backend's "already added / already invited" error so we can
	// surface a friendly toast instead of a raw error string.
	function isAlreadyInvitedError(msg: string): boolean {
		const m = (msg || '').toLowerCase();
		return m.includes('already been added') || m.includes('already added') || m.includes('already invited') || m.includes('already exist');
	}

	let activeTab = 'rondwell';
	let searchQuery = '';

	export let open = false;
	export let participant = 'Speaker';
	export let eventId = '';
	export let eventTitle = '';
	$: participantLowerCase = participant.toLocaleLowerCase();
	// Backend role key for the current participant type.
	$: roleKey = (participant === 'Exhibitor' ? 'EXHIBITOR' : participant === 'Vendor' ? 'VENDOR' : 'SPEAKER') as 'SPEAKER' | 'EXHIBITOR' | 'VENDOR';

	let selectedS: string[] = [];
	let rondwellSpeakers: any[] = [];
	let searchingRondwell = false;
	let searchTimer: ReturnType<typeof setTimeout>;
	let hasSearched = false;

	// VENDOR-only: browse a vendor's products/services (with pricing) and pick
	// one to invite them against — the invite doubles as a request-for-quote.
	let expandedVendor: string | null = null;
	let vendorProducts: Record<string, any[]> = {};
	let loadingProducts: Record<string, boolean> = {};
	let selectedProduct: Record<string, any> = {};

	function productPrice(p: any): number | undefined {
		if (p?.price === undefined || p?.price === null) return undefined;
		const raw = typeof p.price === 'object' ? p.price.$numberDecimal : p.price;
		const n = Number(raw);
		return Number.isFinite(n) ? n : undefined;
	}
	function productPriceLabel(p: any): string {
		const amt = productPrice(p);
		if (amt === undefined || amt === 0) return p?.pricingType === 'CUSTOM_QUOTE' ? 'Custom Quote' : 'Free';
		const ccy = p.currency || 'NGN';
		return formatMoney(majorToKobo(amt, ccy), ccy);
	}

	async function toggleVendorProducts(vendorId: string) {
		if (expandedVendor === vendorId) { expandedVendor = null; return; }
		expandedVendor = vendorId;
		if (!vendorProducts[vendorId]) {
			loadingProducts = { ...loadingProducts, [vendorId]: true };
			try {
				vendorProducts = { ...vendorProducts, [vendorId]: await getVendorPublicProducts(vendorId) };
			} catch {
				vendorProducts = { ...vendorProducts, [vendorId]: [] };
			} finally {
				loadingProducts = { ...loadingProducts, [vendorId]: false };
			}
		}
	}

	function chooseProduct(vendorId: string, product: any) {
		// Toggle selection; auto-select the vendor when a product is picked.
		if (selectedProduct[vendorId]?._id === product._id) {
			const { [vendorId]: _drop, ...rest } = selectedProduct;
			selectedProduct = rest;
		} else {
			selectedProduct = { ...selectedProduct, [vendorId]: product };
			if (!selectedS.includes(vendorId)) selectedS = [...selectedS, vendorId];
		}
	}

	// Single source of truth for "an action is in flight" so the footer button
	// shows a spinner + disabled state consistently across all three tabs.
	$: busy = inviting || manualAdding;

	// Email invite form
	let emailFirstName = '';
	let emailLastName = '';
	let emailAddress = '';
	let emailMessage = '';
	let inviting = false;
	let inviteError = '';
	let inviteSuccess = '';

	// Manual add form
	let manualFirstName = '';
	let manualLastName = '';
	let manualEmail = '';
	let manualTitle = '';
	let manualBio = '';
	let manualLinkedin = '';
	let manualTwitter = '';
	let manualWebsite = '';
	let manualAdding = false;
	let manualError = '';
	let manualSuccess = '';

	function toggleSelect(id: string) {
		// Don't allow selecting a profile that's already on this event.
		const profile = rondwellSpeakers.find((s: any) => (s.id || s._id) === id);
		if (profile?.alreadyInvited) {
			toast.info(`${profile.name || 'This ' + participantLowerCase} is already added to this event.`);
			return;
		}
		if (selectedS.includes(id)) {
			selectedS = selectedS.filter((s) => s !== id);
		} else {
			selectedS = [...selectedS, id];
		}
	}

	const tabs = [
		{ id: 'rondwell', label: `Add From Rondwell ${participant}` },
		{ id: 'email', label: 'Invite by Email' },
		{ id: 'manual', label: 'Manual Add' }
	];

	async function handleEmailInvite() {
		if (!emailFirstName || !emailLastName || !emailAddress) {
			inviteError = 'Please fill in all required fields';
			return;
		}
		inviting = true;
		inviteError = '';
		inviteSuccess = '';
		try {
			const payload = {
				firstName: emailFirstName,
				lastName: emailLastName,
				email: emailAddress,
				message: emailMessage || undefined,
			};
			if (participant === 'Exhibitor') {
				await inviteExhibitorByEmail(eventId, payload);
			} else if (participant === 'Vendor') {
				await inviteVendorByEmail(eventId, payload);
			} else {
				await inviteSpeakerByEmail(eventId, payload);
			}
			inviteSuccess = 'Invitation sent successfully!';
			toast.success('Invitation sent successfully!');
			emailFirstName = '';
			emailLastName = '';
			emailAddress = '';
			emailMessage = '';
			dispatch('added');
			setTimeout(() => { open = false; inviteSuccess = ''; }, 1500);
		} catch (e: any) {
			if (isAlreadyInvitedError(e?.message)) {
				inviteError = `${emailAddress} has already been invited to this event.`;
				toast.info(inviteError);
			} else {
				inviteError = cleanErrorMessage(e?.message || 'Failed to send invitation');
				toast.error(inviteError);
			}
		} finally {
			inviting = false;
		}
	}

	async function handleManualAdd() {
		if (!manualFirstName || !manualLastName) {
			manualError = 'Please fill in the required fields';
			return;
		}
		manualAdding = true;
		manualError = '';
		manualSuccess = '';
		try {
			const payload = {
				firstName: manualFirstName,
				lastName: manualLastName,
				email: manualEmail || undefined,
				bio: manualBio || undefined,
				socialLinks: {
					linkedin: manualLinkedin || undefined,
					twitter: manualTwitter || undefined,
					website: manualWebsite || undefined,
				},
			};
			if (participant === 'Exhibitor') {
				await manualAddExhibitor(eventId, payload);
			} else if (participant === 'Vendor') {
				await manualAddVendor(eventId, payload);
			} else {
				await manualAddSpeaker(eventId, payload);
			}
			manualSuccess = `${participant} added successfully!`;
			toast.success(`${participant} added successfully!`);
			manualFirstName = '';
			manualLastName = '';
			manualEmail = '';
			manualTitle = '';
			manualBio = '';
			manualLinkedin = '';
			manualTwitter = '';
			manualWebsite = '';
			dispatch('added');
			setTimeout(() => { open = false; manualSuccess = ''; }, 1500);
		} catch (e: any) {
			if (isAlreadyInvitedError(e?.message)) {
				manualError = `This ${participantLowerCase} is already added to this event.`;
				toast.info(manualError);
			} else {
				manualError = cleanErrorMessage(e?.message || `Failed to add ${participantLowerCase}`);
				toast.error(manualError);
			}
		} finally {
			manualAdding = false;
		}
	}

	async function handleSearchRondwell() {
		if (!searchQuery.trim()) {
			rondwellSpeakers = [];
			hasSearched = false;
			return;
		}
		searchingRondwell = true;
		hasSearched = true;
		try {
			rondwellSpeakers = await searchRondwellProfiles(eventId, searchQuery.trim(), roleKey);
		} catch {
			rondwellSpeakers = [];
		} finally {
			searchingRondwell = false;
		}
	}

	// Debounce typing so results refresh without spamming the API.
	function onSearchInput() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(handleSearchRondwell, 400);
	}

	async function inviteByProfileForRole(payload: { participantProfileId: string; participantUserId: string; displayName?: string; email?: string; profilePictureUrl?: string; bio?: string; productId?: string; productName?: string; productPrice?: number; productCurrency?: string; productImageUrl?: string; productDescription?: string }) {
		if (roleKey === 'EXHIBITOR') return inviteExhibitorByProfile(eventId, payload);
		if (roleKey === 'VENDOR') return inviteVendorByProfile(eventId, payload);
		return inviteSpeakerByProfile(eventId, payload);
	}

	async function handleAddSelectedSpeakers() {
		if (selectedS.length === 0) {
			inviteError = `Select at least one ${participantLowerCase} to add`;
			return;
		}
		inviting = true;
		inviteError = '';
		inviteSuccess = '';
		try {
			// Fire all invites in parallel (was serial → N sequential round-trips,
			// which is what made the button hang). allSettled so one failure
			// doesn't discard the others.
			const targets = selectedS
				.map((id) => rondwellSpeakers.find((s: any) => s.id === id || s._id === id))
				.filter(Boolean);

			const results = await Promise.allSettled(
				targets.map((speaker: any) => {
					const vId = speaker.id || speaker._id;
					const prod = roleKey === 'VENDOR' ? selectedProduct[vId] : undefined;
					return inviteByProfileForRole({
						participantProfileId: vId,
						participantUserId: speaker.userId || vId,
						// Carry the onboarding identity so the participant row isn't blank.
						displayName: speaker.name || undefined,
						email: speaker.email || undefined,
						profilePictureUrl: speaker.profilePictureUrl || undefined,
						bio: speaker.bio || undefined,
						// RFQ: the product/service the organizer picked for this vendor.
						...(prod
							? {
									productId: prod._id,
									productName: prod.productName,
									productPrice: productPrice(prod),
									productCurrency: prod.currency || 'NGN',
									productImageUrl: prod.media?.[0]?.url || undefined,
									productDescription: prod.description || undefined,
								}
							: {}),
					});
				})
			);

			const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
			const alreadyInvitedCount = rejected.filter((r) => isAlreadyInvitedError(r.reason?.message)).length;
			const otherFailures = rejected.length - alreadyInvitedCount;
			const succeeded = results.length - rejected.length;

			if (succeeded > 0) {
				selectedS = [];
				dispatch('added');
				toast.success(`Added ${succeeded} ${participantLowerCase}${succeeded > 1 ? 's' : ''} to the event.`);
			}

			// Surface already-invited profiles as a friendly info toast.
			if (alreadyInvitedCount > 0) {
				toast.info(
					alreadyInvitedCount === 1
						? `1 ${participantLowerCase} was already invited to this event.`
						: `${alreadyInvitedCount} ${participantLowerCase}s were already invited to this event.`
				);
			}

			if (rejected.length === 0) {
				open = false;
			} else if (succeeded === 0 && otherFailures === 0) {
				// Everything selected was already invited — nothing to report as an error.
				inviteError = '';
				open = false;
			} else if (otherFailures > 0) {
				const firstOther = rejected.find((r) => !isAlreadyInvitedError(r.reason?.message));
				inviteError = cleanErrorMessage(firstOther?.reason?.message || `Failed to add ${participantLowerCase}(s)`);
				toast.error(inviteError);
			}
		} catch (e: any) {
			inviteError = cleanErrorMessage(e?.message || `Failed to add ${participantLowerCase}s`);
			toast.error(inviteError);
		} finally {
			inviting = false;
		}
	}

	function getButtonLabel() {
		if (activeTab === 'email') return inviting ? 'Sending...' : 'Send Invitation';
		if (activeTab === 'rondwell') return inviting ? 'Adding...' : `Add Selected ${participant}(s) to Event`;
		if (activeTab === 'manual') return manualAdding ? 'Adding...' : `Add ${participant} Manually`;
		return 'Submit';
	}

	function handleSubmit() {
		if (activeTab === 'email') handleEmailInvite();
		else if (activeTab === 'rondwell') handleAddSelectedSpeakers();
		else if (activeTab === 'manual') handleManualAdd();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#FDFCFB] px-4 py-5 shadow-xl md:p-6">
			<!-- Modal Header -->
			<div class="relative flex w-full flex-shrink-0 flex-col items-center">
				<div class="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M19.2529 25.4017L21.2796 27.4283L25.3329 23.375" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16.2135 14.4907C16.0801 14.4774 15.9201 14.4774 15.7735 14.4907C12.6001 14.3841 10.0801 11.7841 10.0801 8.58406C10.0668 5.3174 12.7201 2.66406 15.9868 2.66406C19.2535 2.66406 21.9068 5.3174 21.9068 8.58406C21.9068 11.7841 19.3735 14.3841 16.2135 14.4907Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M15.9867 29.077C13.5601 29.077 11.1467 28.4636 9.30672 27.237C6.08005 25.077 6.08005 21.557 9.30672 19.4103C12.9734 16.957 18.9867 16.957 22.6534 19.4103" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
				</div>

				<h2 class="text-xl font-semibold text-gray-800">Add {participant} to {eventTitle || 'Event'}</h2>
				<p class="text-sm text-gray-500">Provide details of {participantLowerCase} to proceed.</p>
				<button class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700" on:click={() => (open = false)}>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<!-- Tabs -->
			<div class="mt-4 flex-shrink-0 overflow-hidden border-t pt-4">
				<div class="custom-scrollbar flex items-center gap-2 overflow-x-auto rounded-lg bg-white p-1 shadow-xs">
					{#each tabs as t}
						<button class="flex-shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-all {activeTab === t.id ? 'bg-[#EBECED] text-black' : ' text-gray-400 '}" on:click={() => (activeTab = t.id)}>
							{t.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- TAB CONTENT -->
			<div class="custom-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg border p-4">
				<!-- Invite by Email -->
				{#if activeTab === 'email'}
					<div>
						<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
							Send a direct invitation to a {participantLowerCase}
							<img src="/warning-icon.svg" alt="" />
						</h3>

						{#if inviteError}
							<p class="mb-3 text-sm text-red-500">{inviteError}</p>
						{/if}
						{#if inviteSuccess}
							<p class="mb-3 text-sm text-green-600">{inviteSuccess}</p>
						{/if}

						<div class="mt-4 flex w-full flex-wrap items-center gap-3">
							<div>
								<label class="flex text-gray-900" for="email_first_name">{participant}'s First Name <span class="text-blue-600">*</span></label>
								<input id="email_first_name" type="text" placeholder="James" bind:value={emailFirstName} class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
							</div>
							<div>
								<label class="flex text-gray-900" for="email_last_name">{participant}'s Last Name <span class="text-blue-600">*</span></label>
								<input id="email_last_name" type="text" placeholder="Brown" bind:value={emailLastName} class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
							</div>
							<div>
								<label class="flex text-gray-900" for="email_address">{participant}'s Email Address <span class="text-blue-600">*</span></label>
								<input id="email_address" type="email" placeholder="jamesbrown@email.com" bind:value={emailAddress} class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
							</div>
						</div>

						<div class="mt-6">
							<label class="flex text-gray-900" for="email_message">Personal Message <span class="ml-1 text-gray-700">(Optional)</span></label>
							<textarea id="email_message" placeholder="Add a personalized note for the {participantLowerCase}..." rows="4" bind:value={emailMessage} class="mt-2 w-full resize-none rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"></textarea>
							<p class="flex items-center gap-1 text-xs font-light text-gray-500">
								<img src="/information-fill.svg" alt="" />
								They will receive an email to join your event. If they have a Rondwell Speaker profile, they can link it.
							</p>
						</div>
					</div>
				{/if}

				<!-- Rondwell Participants -->
				{#if activeTab === 'rondwell'}
					<div>
						<h3 class="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-700">
							Browse existing {participantLowerCase} profiles on Rondwell
							<img src="/warning-icon.svg" alt="" />
						</h3>
						<div class="mb-4 flex items-center gap-2">
							<div class="relative w-full max-w-xl">
								<input type="text" bind:value={searchQuery} on:input={onSearchInput} on:keydown={(e) => e.key === 'Enter' && handleSearchRondwell()} placeholder="Search by email, or {participantLowerCase} name / keyword..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#616265] focus:ring-0 focus:outline-none" />
								<span class="absolute top-2.5 left-3 text-gray-400">
									<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
								</span>
							</div>
							<button on:click={handleSearchRondwell} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
								{searchingRondwell ? 'Searching...' : 'Search'}
							</button>
						</div>

						{#if rondwellSpeakers.length > 0}
							<div class="divide-y rounded-lg border">
								{#each rondwellSpeakers as speaker}
									{@const speakerId = speaker.id || speaker._id}
									<div class="flex items-start justify-between gap-2 p-3 md:flex-row md:items-center {speaker.alreadyInvited ? 'opacity-60' : 'hover:bg-gray-50'}">
										<div class="flex flex-col gap-2 md:flex-row md:items-center">
											<div class="flex items-center gap-2">
												<button on:click={() => toggleSelect(speakerId)} disabled={speaker.alreadyInvited} class="flex h-5 w-5 items-center justify-center rounded-full border-2 {speaker.alreadyInvited ? 'cursor-not-allowed border-gray-200 bg-gray-100' : selectedS.includes(speakerId) ? 'bg-black' : 'border-gray-300'}">
													{#if selectedS.includes(speakerId) && !speaker.alreadyInvited}
														<Icon icon="mdi:tick" class="text-2xl text-white" />
													{/if}
												</button>
												<div class="flex items-center gap-2">
													<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
														{(speaker.name || 'S').charAt(0)}
													</div>
													<div class="font-medium">{speaker.name || 'Unknown'}</div>
												</div>
											</div>
											<div class="max-w-[250px] truncate text-sm text-[#B6B7B7] md:max-w-[150px] lg:max-w-[250px]">
												{speaker.bio || ''}
											</div>
										</div>
										<div class="flex flex-col items-end gap-2 sm:flex-row md:items-center">
											{#if speaker.alreadyInvited}
												<span class="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
													<Icon icon="mdi:check-circle-outline" class="text-sm" />
													Already invited
												</span>
											{:else if roleKey === 'VENDOR'}
												{#if selectedProduct[speakerId]}
													<span class="max-w-[150px] truncate rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-600" title={selectedProduct[speakerId].productName}>
														{selectedProduct[speakerId].productName} · {productPriceLabel(selectedProduct[speakerId])}
													</span>
												{/if}
												<button type="button" on:click={() => toggleVendorProducts(speakerId)} class="flex items-center gap-1 rounded-md bg-[#EBECED] px-2.5 py-1 text-xs font-medium text-[#616265] hover:bg-gray-300">
													<Icon icon="mdi:package-variant-closed" class="text-sm" />
													{expandedVendor === speakerId ? 'Hide' : 'Products'}
												</button>
											{:else}
												{#each (speaker.expertise || []).slice(0, 2) as tag}
													<button class="rounded-md bg-gray-200 px-3 py-1 text-gray-400">{tag}</button>
												{/each}
											{/if}
										</div>
									</div>

									{#if roleKey === 'VENDOR' && expandedVendor === speakerId}
										<div class="border-t bg-gray-50 p-3">
											{#if loadingProducts[speakerId]}
												<p class="py-3 text-center text-xs text-gray-400">Loading products &amp; services…</p>
											{:else if (vendorProducts[speakerId] || []).length === 0}
												<p class="py-3 text-center text-xs text-gray-400">This vendor has no public products or services yet. You can still invite them and they'll send you an invoice.</p>
											{:else}
												<p class="mb-2 text-xs font-medium text-gray-500">Select a product / service to request a quote for:</p>
												<div class="space-y-2">
													{#each vendorProducts[speakerId] as product (product._id)}
														<button type="button" on:click={() => chooseProduct(speakerId, product)} class="flex w-full items-center gap-3 rounded-lg border bg-white p-2 text-left transition {selectedProduct[speakerId]?._id === product._id ? 'border-[#DB3EC6] ring-1 ring-[#DB3EC6]' : 'border-gray-200 hover:border-gray-300'}">
															<div class="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
																{#if product.media?.[0]?.url}
																	<img src={product.media[0].url} alt={product.productName} class="h-full w-full object-cover" />
																{:else}
																	<div class="flex h-full w-full items-center justify-center"><Icon icon="mdi:image-outline" class="h-5 w-5 text-gray-300" /></div>
																{/if}
															</div>
															<div class="min-w-0 flex-1">
																<p class="truncate text-xs font-semibold text-gray-900">{product.productName}</p>
																{#if product.description}<p class="truncate text-[11px] text-gray-400">{product.description}</p>{/if}
															</div>
															<span class="shrink-0 text-xs font-bold text-gray-900">{productPriceLabel(product)}</span>
															<span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 {selectedProduct[speakerId]?._id === product._id ? 'border-[#DB3EC6] bg-[#DB3EC6]' : 'border-gray-300'}">
																{#if selectedProduct[speakerId]?._id === product._id}<Icon icon="mdi:check" class="text-xs text-white" />{/if}
															</span>
														</button>
													{/each}
												</div>
											{/if}
										</div>
									{/if}
								{/each}
							</div>
						{:else}
							<p class="py-8 text-center text-sm text-gray-400">
								{searchingRondwell
									? 'Searching...'
									: hasSearched
										? `No ${participantLowerCase}s found. Try their exact email, or a different name/keyword.`
										: `Search by email to invite a specific person, or by name to browse ${participantLowerCase} profiles.`}
							</p>
						{/if}
					</div>
				{/if}

				<!-- Manual Add -->
				{#if activeTab === 'manual'}
					<div>
						<h3 class="mb-2 flex items-center gap-1 text-lg font-semibold text-gray-700">
							Add a {participantLowerCase} manually without sending an invitation
							<img src="/warning-icon.svg" alt="" />
						</h3>
						<p class="mb-4 text-xs text-gray-500">This creates a basic entry for display purposes only. The speaker won't have a linked Rondwell profile.</p>

						{#if manualError}
							<p class="mb-3 text-sm text-red-500">{manualError}</p>
						{/if}
						{#if manualSuccess}
							<p class="mb-3 text-sm text-green-600">{manualSuccess}</p>
						{/if}

						<div class="mt-4 flex w-full flex-wrap items-center gap-3">
							<div>
								<label class="flex text-gray-900" for="manual_first_name">{participant}'s First Name <span class="text-blue-600">*</span></label>
								<input id="manual_first_name" type="text" placeholder="James" bind:value={manualFirstName} class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
							</div>
							<div>
								<label class="flex text-gray-900" for="manual_last_name">{participant}'s Last Name <span class="text-blue-600">*</span></label>
								<input id="manual_last_name" type="text" placeholder="Brown" bind:value={manualLastName} class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
							</div>
							<div>
								<label class="flex text-gray-900" for="manual_email">{participant}'s Email <span class="ml-1 text-gray-700">(Optional)</span></label>
								<input id="manual_email" type="email" placeholder="jamesbrown@email.com" bind:value={manualEmail} class="mt-2 rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
							</div>
						</div>

						<div class="mt-6">
							<label class="flex text-gray-900" for="manual_bio">{participant} Bio <span class="ml-1 text-gray-700">(Optional)</span></label>
							<textarea id="manual_bio" placeholder="Brief bio for the {participantLowerCase}..." rows="4" bind:value={manualBio} class="mt-2 w-full resize-none rounded-sm bg-[#FFFFFF] px-3 py-2 shadow-xs"></textarea>
						</div>

						<div class="mt-6 flex w-full flex-wrap items-center gap-3">
							<div>
								<label class="flex text-gray-900" for="manual_linkedin">LinkedIn</label>
								<div class="mt-2 flex items-center">
									<div class="rounded-l-sm border-r bg-[#FFFFFF] p-2 text-gray-600 shadow-xs">linkedin.com/</div>
									<input id="manual_linkedin" placeholder="username" bind:value={manualLinkedin} class="rounded-r-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
								</div>
							</div>
							<div>
								<label class="flex text-gray-900" for="manual_twitter">X</label>
								<div class="mt-2 flex items-center">
									<div class="rounded-l-sm border-r bg-[#FFFFFF] p-2 text-gray-600 shadow-xs">x.com/</div>
									<input id="manual_twitter" placeholder="username" bind:value={manualTwitter} class="rounded-r-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
								</div>
							</div>
							<div>
								<label class="flex text-gray-900" for="manual_website">Website URL</label>
								<div class="mt-2 flex items-center">
									<div class="rounded-l-sm border-r bg-[#FFFFFF] px-3 py-2 text-gray-600 shadow-xs">https://</div>
									<input id="manual_website" placeholder="www.example.com" bind:value={manualWebsite} class="rounded-r-sm bg-[#FFFFFF] px-3 py-2 shadow-xs" />
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-4 flex flex-shrink-0 items-center gap-2">
				<button on:click={() => (open = false)} disabled={busy} class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs disabled:opacity-50">Cancel</button>
				<button on:click={handleSubmit} disabled={busy} class="flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-white shadow-xs disabled:cursor-not-allowed disabled:opacity-60">
					{#if busy}
						<Icon icon="line-md:loading-twotone-loop" class="text-lg" />
					{/if}
					<span>{getButtonLabel()}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn {
		animation: fade 0.15s ease-out;
	}
	@keyframes fade {
		from { opacity: 0; transform: scale(0.97); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
