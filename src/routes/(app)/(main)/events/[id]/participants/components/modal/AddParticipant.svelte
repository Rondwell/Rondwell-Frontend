<script lang="ts">
	import { inviteExhibitorByEmail, inviteSpeakerByEmail, inviteSpeakerByProfile, inviteVendorByEmail, manualAddExhibitor, manualAddSpeaker, manualAddVendor, searchRondwellSpeakers } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let activeTab = 'rondwell';
	let searchQuery = '';

	export let open = false;
	export let participant = 'Speaker';
	export let eventId = '';
	export let eventTitle = '';
	let participantLowerCase = participant.toLocaleLowerCase();

	let selectedS: string[] = [];
	let rondwellSpeakers: any[] = [];
	let searchingRondwell = false;

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
	let manualTitle = '';
	let manualBio = '';
	let manualLinkedin = '';
	let manualTwitter = '';
	let manualWebsite = '';
	let manualAdding = false;
	let manualError = '';
	let manualSuccess = '';

	function toggleSelect(id: string) {
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
			emailFirstName = '';
			emailLastName = '';
			emailAddress = '';
			emailMessage = '';
			dispatch('added');
			setTimeout(() => { open = false; inviteSuccess = ''; }, 1500);
		} catch (e: any) {
			inviteError = e.message || 'Failed to send invitation';
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
			manualSuccess = 'Speaker added successfully!';
			manualFirstName = '';
			manualLastName = '';
			manualTitle = '';
			manualBio = '';
			manualLinkedin = '';
			manualTwitter = '';
			manualWebsite = '';
			dispatch('added');
			setTimeout(() => { open = false; manualSuccess = ''; }, 1500);
		} catch (e: any) {
			manualError = e.message || 'Failed to add speaker';
		} finally {
			manualAdding = false;
		}
	}

	async function handleSearchRondwell() {
		if (!searchQuery.trim()) return;
		searchingRondwell = true;
		try {
			rondwellSpeakers = await searchRondwellSpeakers(eventId, searchQuery);
		} catch {
			rondwellSpeakers = [];
		} finally {
			searchingRondwell = false;
		}
	}

	async function handleAddSelectedSpeakers() {
		inviting = true;
		try {
			for (const id of selectedS) {
				const speaker = rondwellSpeakers.find((s: any) => s.id === id || s._id === id);
				if (speaker) {
					await inviteSpeakerByProfile(eventId, {
						participantProfileId: speaker.id || speaker._id,
						participantUserId: speaker.userId || speaker.id || speaker._id,
					});
				}
			}
			selectedS = [];
			dispatch('added');
			open = false;
		} catch (e: any) {
			inviteError = e.message || 'Failed to add speakers';
		} finally {
			inviting = false;
		}
	}

	function getButtonLabel() {
		if (activeTab === 'email') return inviting ? 'Sending...' : 'Send Invitation';
		if (activeTab === 'rondwell') return inviting ? 'Adding...' : `Add Selected ${participant}(s) to Event`;
		if (activeTab === 'manual') return manualAdding ? 'Adding...' : 'Add Speaker Manually';
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
		<div class="animate-fadeIn max-h-180 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 shadow-xl md:max-h-150 md:p-6">
			<!-- Modal Header -->
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
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
			<div class="mt-6 overflow-hidden border-t pt-6">
				<div class="custom-scrollbar flex items-center gap-2 overflow-x-auto rounded-lg bg-white p-1 shadow-xs">
					{#each tabs as t}
						<button class="flex-shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-all {activeTab === t.id ? 'bg-[#EBECED] text-black' : ' text-gray-400 '}" on:click={() => (activeTab = t.id)}>
							{t.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- TAB CONTENT -->
			<div class="custom-scrollbar mt-6 max-h-80 overflow-y-auto rounded-lg border p-4 md:h-60">
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
								<input type="text" bind:value={searchQuery} on:keydown={(e) => e.key === 'Enter' && handleSearchRondwell()} placeholder="Search {participantLowerCase}s by name, expertise, or keywords..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
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
									<div class="flex items-start justify-between gap-2 p-3 hover:bg-gray-50 md:flex-row md:items-center">
										<div class="flex flex-col gap-2 md:flex-row md:items-center">
											<div class="flex items-center gap-2">
												<button on:click={() => toggleSelect(speakerId)} class="flex h-5 w-5 items-center justify-center rounded-full border-2 {selectedS.includes(speakerId) ? 'bg-black' : 'border-gray-300'}">
													{#if selectedS.includes(speakerId)}
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
											{#each (speaker.expertise || []).slice(0, 2) as tag}
												<button class="rounded-md bg-gray-200 px-3 py-1 text-gray-400">{tag}</button>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="py-8 text-center text-sm text-gray-400">
								{searchQuery ? 'No speakers found. Try a different search.' : 'Search for speakers to add them to your event.'}
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

			<div class="mt-6 flex items-center gap-2">
				<button on:click={() => (open = false)} class="rounded-md bg-white px-4 py-2 text-gray-600 shadow-xs">Cancel</button>
				<button on:click={handleSubmit} disabled={inviting || manualAdding} class="rounded-md bg-black px-4 py-2 text-white shadow-xs disabled:opacity-50">
					{getButtonLabel()}
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
