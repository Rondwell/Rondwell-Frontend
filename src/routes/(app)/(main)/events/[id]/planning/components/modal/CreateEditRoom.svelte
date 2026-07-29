<script lang="ts">
	import { createEventRoom, deleteEventMediaByUrl, getAllEventSessionsForEvent, updateEventRoom, updateEventSession, uploadRoomBanner } from '$lib/services/event.services';
	import { getRoomChatState, roomCommunityUrl, syncRoomCommunityChannel } from '$lib/services/roomChat';
	import { clickOutside } from '$lib/utils/constant';
	import { combineDateAndTime, defaultScheduleWithin, formatDayLabel, toTimeLabel } from '$lib/utils/schedule';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, tick } from 'svelte';
	import DatePickerModal from '../../../../../../create-event/components/DatePickerModal.svelte';
	import TimeModal from '../../../../../../create-event/components/TimeModal.svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';
	export let room: any = null;
	export let eventStartDate: Date | null = null;
	export let eventEndDate: Date | null = null;

	$: isEdit = !!room;
	$: modalTitle = isEdit ? 'Edit Room' : 'Create New Room';

	let name = '';
	let description = '';
	let startDate: Date = new Date();
	let endDate: Date = new Date();
	let startTime = '7:30 PM';
	let endTime = '8:30 PM';
	let chatEnabled = false;
	let communityChatRoomId = '';
	let saving = false;
	let error = '';
	let warning = '';

	// Event-wide community state — a room channel lives *inside* it.
	let communityEnabled = false;
	let communityExists = false;
	let alsoEnableEventCommunity = false;

	// Date/time picker states
	let openStartDatePicker = false;
	let openEndDatePicker = false;
	let openStartTimePicker = false;
	let openEndTimePicker = false;

	// File upload states
	let fileInput: HTMLInputElement;
	let uploadedFiles: { name: string; size: string; status: 'uploading' | 'completed' | 'error'; url?: string; progress?: number }[] = [];
	let bannerUrl = '';
	let bannerTitle = '';
	let uploading = false;

	// Session management
	let allSessions: any[] = [];
	let roomSessions: any[] = [];
	let pendingSessionIds: string[] = []; // for create mode — sessions to move after room is created
	let showSessionDropdown = false;
	let sessionSearch = '';

	$: availableSessions = allSessions.filter(s => {
		const sid = s.id || s._id;
		const inRoom = roomSessions.some(rs => (rs.id || rs._id) === sid);
		const isPending = pendingSessionIds.includes(sid);
		if (inRoom || isPending) return false;
		if (sessionSearch && !s.title?.toLowerCase().includes(sessionSearch.toLowerCase())) return false;
		return true;
	});

	$: pendingSessions = allSessions.filter(s => pendingSessionIds.includes(s.id || s._id));

	async function loadSessions() {
		if (!eventId) return;
		try {
			allSessions = await getAllEventSessionsForEvent(eventId);
			if (room) {
				roomSessions = allSessions.filter(s => s.roomId === (room?.id || room?._id));
			}
		} catch (e) { console.error('Failed to load sessions:', e); }
	}

	async function loadCommunityState() {
		const state = await getRoomChatState(eventId);
		communityEnabled = state.communityEnabled;
		communityExists = state.communityExists;
	}

	async function addSessionToRoom(session: any) {
		const sid = session.id || session._id;
		if (isEdit && room?.id) {
			try {
				// The URL carries the session's *current* room; the body carries the
				// destination. Sending only the body silently did nothing before.
				await updateEventSession(eventId, session.roomId || room.id, sid, { roomId: room.id });
				await loadSessions();
			} catch (e: any) { error = e.message || 'Failed to add session'; }
		} else {
			// Create mode — queue it for after room creation
			pendingSessionIds = [...pendingSessionIds, sid];
		}
		showSessionDropdown = false;
		sessionSearch = '';
	}

	function removePendingSession(sid: string) {
		pendingSessionIds = pendingSessionIds.filter(id => id !== sid);
	}

	/**
	 * Populates the form for the room being opened.
	 *
	 * Deliberately a plain function called from an open-transition guard rather
	 * than a `$: if (open) { ... }` block. That reactive form also depended on
	 * `startDate`/`endDate` (it reads them back to derive the time labels), so
	 * every date selection re-ran the whole block — wiping the chosen date back
	 * to today and resetting the community-chat toggle. That was the root cause
	 * of both "the date picker won't select" and "the toggle deselects itself".
	 */
	function initForm() {
		const fallback = defaultScheduleWithin(eventStartDate, eventEndDate, 60);

		if (room) {
			name = room.name || '';
			description = room.description || '';
			chatEnabled = room.communityChatEnabled ?? false;
			communityChatRoomId = room.communityChatRoomId || '';
			bannerUrl = room.bannerImageUrl || '';
			bannerTitle = room.bannerImageTitle || '';
			uploadedFiles = room.bannerImageUrl
				? [{ name: room.bannerImageTitle || 'Room Banner', size: '', status: 'completed' as const, url: room.bannerImageUrl }]
				: [];

			if (room.scheduledStartDate) {
				startDate = new Date(room.scheduledStartDate);
				startTime = toTimeLabel(startDate);
			} else {
				startDate = fallback.startDate;
				startTime = fallback.startTime;
			}
			if (room.scheduledEndDate) {
				endDate = new Date(room.scheduledEndDate);
				endTime = toTimeLabel(endDate);
			} else {
				endDate = fallback.endDate;
				endTime = fallback.endTime;
			}
		} else {
			name = '';
			description = '';
			chatEnabled = false;
			communityChatRoomId = '';
			bannerUrl = '';
			bannerTitle = '';
			uploadedFiles = [];
			pendingSessionIds = [];
			roomSessions = [];
			// Default to the event's own start, not "now" — an organiser scheduling
			// a room for a future event should never have to correct today's date.
			startDate = fallback.startDate;
			startTime = fallback.startTime;
			endDate = fallback.endDate;
			endTime = fallback.endTime;
		}

		error = '';
		warning = '';
		alsoEnableEventCommunity = false;
		openStartDatePicker = openEndDatePicker = openStartTimePicker = openEndTimePicker = false;
	}

	let wasOpen = false;
	$: if (open !== wasOpen) {
		wasOpen = open;
		if (open) {
			initForm();
			loadSessions();
			loadCommunityState();
		}
	}

	// Keep the end of the window at or after its start as the organiser edits.
	function normalizeEnd() {
		const start = combineDateAndTime(startDate, startTime);
		const end = combineDateAndTime(endDate, endTime);
		if (end <= start) {
			const bumped = new Date(start.getTime() + 60 * 60_000);
			endDate = bumped;
			endTime = toTimeLabel(bumped);
		}
	}

	$: sameDay = startDate.toDateString() === endDate.toDateString();
	// On a single-day window the end time cannot precede the start time.
	$: endMinTime = sameDay ? startTime : null;

	function scrollToId(id: string) {
		const el = document.getElementById(id);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			error = 'File size must be under 5 MB';
			input.value = '';
			return;
		}

		const totalKB = Math.round(file.size / 1024);
		// Replace any existing files — only one banner at a time
		uploadedFiles = [{ name: file.name, size: `0 KB of ${totalKB} KB`, status: 'uploading' as const, progress: 0 }];
		uploading = true;

		try {
			const result = await uploadRoomBanner(eventId, file);
			bannerUrl = result.url;
			bannerTitle = file.name;
			uploadedFiles = [{ name: file.name, size: `${totalKB} KB of ${totalKB} KB`, status: 'completed' as const, url: result.url }];
		} catch (err: any) {
			uploadedFiles = [{ name: file.name, size: `${totalKB} KB`, status: 'error' as const }];
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function removeFile(fileName: string) {
		const fileToRemove = uploadedFiles.find(f => f.name === fileName);
		const urlToDelete = fileToRemove?.url || bannerUrl;

		uploadedFiles = [];
		bannerUrl = '';
		bannerTitle = '';

		// If editing an existing room, clear the banner on the server and delete the media
		if (isEdit && room?.id) {
			try {
				await updateEventRoom(eventId, room.id, { bannerImageUrl: '', bannerImageTitle: '' });
			} catch (e) {
				console.error('Failed to clear banner on server:', e);
			}
		}

		// Delete the actual media file from DB and S3
		if (urlToDelete && eventId) {
			try {
				await deleteEventMediaByUrl(eventId, urlToDelete);
			} catch (e) {
				console.error('Failed to delete media:', e);
			}
		}
	}

	async function handleSave() {
		if (!name.trim()) { error = 'Room name is required'; return; }
		if (uploading) { error = 'Wait for the banner upload to finish'; return; }

		const start = combineDateAndTime(startDate, startTime);
		const end = combineDateAndTime(endDate, endTime);
		if (end <= start) { error = 'Room end date/time must be after the start'; return; }
		if (eventStartDate && start < new Date(new Date(eventStartDate).setHours(0, 0, 0, 0))) {
			error = 'Room cannot start before the event starts'; return;
		}
		if (eventEndDate && end > new Date(new Date(eventEndDate).setHours(23, 59, 59, 999))) {
			error = 'Room cannot end after the event ends'; return;
		}

		saving = true; error = ''; warning = '';
		try {
			// Provision / tear down the community channel first: if this fails we
			// surface it instead of persisting a room that claims to have chat.
			const chatSync = await syncRoomCommunityChannel({
				eventId,
				name: name.trim(),
				description: description.trim() || undefined,
				enabled: chatEnabled,
				communityChatRoomId,
				alsoEnableEventCommunity: chatEnabled && alsoEnableEventCommunity,
			});
			communityChatRoomId = chatSync.communityChatRoomId;
			communityEnabled = chatSync.communityEnabled;

			const payload: any = {
				name: name.trim(),
				description: description.trim() || undefined,
				communityChatEnabled: chatEnabled,
				communityChatRoomId: communityChatRoomId || '',
				scheduledStartDate: start.toISOString(),
				scheduledEndDate: end.toISOString(),
			};
			if (bannerUrl) {
				payload.bannerImageUrl = bannerUrl;
				payload.bannerImageTitle = bannerTitle;
			} else {
				// Banner was removed — clear it
				payload.bannerImageUrl = '';
				payload.bannerImageTitle = '';
			}

			if (isEdit) {
				await updateEventRoom(eventId, room.id, payload);
			} else {
				const newRoom = await createEventRoom(eventId, payload);
				const newRoomId = newRoom.id || newRoom._id;
				// Move queued sessions to the newly created room
				if (newRoomId && pendingSessionIds.length > 0) {
					for (const sid of pendingSessionIds) {
						const session = allSessions.find(s => (s.id || s._id) === sid);
						if (session) {
							try {
								await updateEventSession(eventId, session.roomId || newRoomId, sid, { roomId: newRoomId });
							} catch (e) { console.error('Failed to move session to new room:', e); }
						}
					}
				}
			}

			if (chatSync.warning) {
				// The room saved, but the chat channel didn't. Keep the modal open so
				// the organiser sees why rather than assuming chat is live.
				warning = chatSync.warning;
				dispatch('saved', { keepOpen: true });
				return;
			}

			dispatch('saved');
			open = false;
		} catch (e: any) {
			error = e.message || 'Failed to save room';
		} finally {
			saving = false;
		}
	}
</script>

<input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" bind:this={fileInput} on:change={handleFileSelect} />

{#if open}
	<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex items-center gap-3">
					<button aria-label="Close" on:click={() => (open = false)}>
						<Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" />
					</button>
					<p class="font-medium">{modalTitle}</p>
				</div>
				<div class="flex items-center gap-3">
					<button on:click={handleSave} disabled={saving} class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
						<Icon icon="mdi:plus" class="text-sm" />
						{saving ? 'Saving...' : isEdit ? 'Save' : 'Create New Room'}
					</button>
					<button on:click={() => (open = false)} class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]">
						Cancel <Icon icon="mdi:close" class="text-sm" />
					</button>
				</div>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
				<h2 class="text-2xl font-semibold text-gray-900">{isEdit ? `Edit Room: ${room?.name || ''}` : 'Create New Event Room'}</h2>

				{#if error}
					<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
				{/if}
				{#if warning}
					<p class="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
						<Icon icon="mdi:alert-outline" class="mt-0.5 flex-shrink-0 text-base" />
						<span>{warning}</span>
					</p>
				{/if}

				<!-- Room Name -->
				<div>
					<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">
						Room Name <Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
					</label>
					<input type="text" bind:value={name} placeholder="e.g., Main Stage, Breakout Room 1, Networking Lounge" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none" />
				</div>

				<!-- Room Description -->
				<div>
					<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">
						Room Description <Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
					</label>
					<div class="relative">
						<textarea bind:value={description} placeholder="Describe the purpose or content of this room" rows="3" maxlength="100" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
						<span class="absolute right-3 bottom-3 text-xs text-gray-400">{description.length}/100</span>
					</div>
					<p class="mt-1 flex items-center gap-1 text-xs text-gray-500">
						<Icon icon="mdi:information-outline" width="12" class="text-gray-400" />
						You can describe your room message briefly.
					</p>
				</div>

				<!-- Date/Time Pickers -->
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<!-- Start Date/Time -->
					<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
						<div class="flex items-center gap-2">
							<div class="h-2.5 w-2.5 rounded-full bg-gray-500"></div>
							<span class="text-sm text-gray-400">Room Start Date</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="relative" use:clickOutside={() => (openStartDatePicker = false)}>
								<button on:click={async () => { openStartDatePicker = !openStartDatePicker; await tick(); scrollToId('date'); }} class="rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-gray-700">
									{formatDayLabel(startDate)}
								</button>
								<DatePickerModal
									bind:open={openStartDatePicker}
									bind:selectedDate={startDate}
									minDate={eventStartDate}
									maxDate={eventEndDate}
									on:select={() => { openStartDatePicker = false; normalizeEnd(); }}
								/>
							</div>
							<div class="relative" use:clickOutside={() => (openStartTimePicker = false)}>
								<button on:click={() => (openStartTimePicker = !openStartTimePicker)} class="rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-gray-700">
									{startTime}
								</button>
								<TimeModal bind:open={openStartTimePicker} bind:selectedTime={startTime} on:select={() => { openStartTimePicker = false; normalizeEnd(); }} />
							</div>
						</div>
					</div>

					<div class="my-2 ml-1 h-6 border-l border-dashed border-gray-300"></div>

					<!-- End Date/Time -->
					<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
						<div class="flex items-center gap-2">
							<div class="h-2.5 w-2.5 rounded-full border-2 border-gray-400"></div>
							<span class="text-sm text-gray-400">Room End Date</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="relative" use:clickOutside={() => (openEndDatePicker = false)}>
								<button on:click={async () => { openEndDatePicker = !openEndDatePicker; await tick(); scrollToId('date'); }} class="rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-gray-700">
									{formatDayLabel(endDate)}
								</button>
								<DatePickerModal
									bind:open={openEndDatePicker}
									bind:selectedDate={endDate}
									{startDate}
									minDate={startDate}
									maxDate={eventEndDate}
									on:select={() => { openEndDatePicker = false; normalizeEnd(); }}
								/>
							</div>
							<div class="relative" use:clickOutside={() => (openEndTimePicker = false)}>
								<button on:click={() => (openEndTimePicker = !openEndTimePicker)} class="rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-gray-700">
									{endTime}
								</button>
								<TimeModal
									bind:open={openEndTimePicker}
									bind:selectedTime={endTime}
									referenceTime={startTime}
									minTime={endMinTime}
									afterReference={sameDay}
									on:select={() => (openEndTimePicker = false)}
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Community Chat Toggle -->
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-900">Enable Community Chat</span>
							<Icon icon="mdi:information-outline" width="14" class="text-gray-400" />
						</div>
						<button type="button" aria-label="Toggle community chat" on:click={() => (chatEnabled = !chatEnabled)} class="relative h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-300" class:bg-gray-300={!chatEnabled} class:bg-gray-800={chatEnabled}>
							<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={chatEnabled}></span>
						</button>
					</div>

					{#if chatEnabled}
						<p class="mt-2 text-xs text-gray-500">
							Creates a dedicated <span class="font-medium">{name.trim() || 'room'}</span> channel inside this event's Community, so attendees can discuss this room specifically.
						</p>

						{#if !communityEnabled}
							<!--
								A room channel is a child of the event community. With the event
								community off, the channel exists but attendees can't reach it.
								We ask before flipping an event-wide setting.
							-->
							<div class="mt-3 rounded-md bg-amber-50 p-3">
								<p class="flex items-start gap-2 text-xs text-amber-800">
									<Icon icon="mdi:alert-outline" class="mt-0.5 flex-shrink-0 text-base" />
									<span>
										Community is currently <span class="font-semibold">off</span> for this event, so
										attendees won't see this room's chat{communityExists ? '' : ' and the channel cannot be created yet'}.
									</span>
								</p>
								<label class="mt-2 flex cursor-pointer items-start gap-2 text-xs text-amber-900">
									<input type="checkbox" bind:checked={alsoEnableEventCommunity} class="mt-0.5 h-3.5 w-3.5 rounded border-amber-400" />
									<span>Turn on Community for this event as well</span>
								</label>
							</div>
						{:else if communityChatRoomId}
							<a href={roomCommunityUrl(eventId, communityChatRoomId)} target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline">
								<Icon icon="mdi:open-in-new" class="text-sm" /> View this room's channel
							</a>
						{/if}
					{/if}
				</div>

				<!-- Sessions Management -->
				<div>
					<p class="mb-2 text-sm font-medium text-gray-900">Sessions in this Room</p>

					<!-- Assigned sessions (edit mode) -->
					{#if isEdit && roomSessions.length > 0}
						<div class="mb-3 space-y-2">
							{#each roomSessions as s}
								<div class="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
									<div class="flex items-center gap-2">
										<Icon icon="mdi:calendar-clock" class="text-gray-400" />
										<span class="text-sm font-medium">{s.title}</span>
									</div>
									<span class="text-xs text-gray-400">{s.type}</span>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Pending sessions (create mode) -->
					{#if !isEdit && pendingSessions.length > 0}
						<div class="mb-3 space-y-2">
							{#each pendingSessions as s}
								<div class="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
									<div class="flex items-center gap-2">
										<Icon icon="mdi:calendar-clock" class="text-gray-400" />
										<span class="text-sm font-medium">{s.title}</span>
									</div>
									<button on:click={() => removePendingSession(s.id || s._id)} class="text-gray-400 hover:text-red-500">
										<Icon icon="mdi:close" class="text-base" />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					{#if (isEdit && roomSessions.length === 0) || (!isEdit && pendingSessions.length === 0)}
						<p class="mb-3 text-xs text-gray-400">No sessions assigned to this room yet.</p>
					{/if}

					<!-- Add session dropdown -->
					<div class="relative" use:clickOutside={() => (showSessionDropdown = false)}>
						<button on:click={() => (showSessionDropdown = !showSessionDropdown)} class="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-500 hover:border-gray-400">
							<Icon icon="mdi:plus" class="text-lg" /> Add Session to Room
						</button>
						{#if showSessionDropdown}
							<div class="absolute left-0 z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
								<div class="p-2">
									<input type="text" bind:value={sessionSearch} placeholder="Search sessions..." class="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
								</div>
								<div class="max-h-40 overflow-y-auto">
									{#if availableSessions.length > 0}
										{#each availableSessions as s}
											<button on:click={() => addSessionToRoom(s)} class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50">
												<Icon icon="mdi:calendar-clock" class="text-gray-400" />
												<span>{s.title}</span>
												<span class="ml-auto text-xs text-gray-400">{s.type}</span>
											</button>
										{/each}
									{:else}
										<p class="px-3 py-2 text-xs text-gray-400">{allSessions.length === 0 ? 'No sessions created yet.' : 'No available sessions to add.'}</p>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Room Banner Image Upload -->
				<div>
					<p class="mb-2 text-sm font-medium text-gray-900">Room Banner Image</p>

					{#if bannerUrl && uploadedFiles.length > 0}
						<div class="mb-3 overflow-hidden rounded-lg border">
							<img src={bannerUrl} alt="Room banner" class="h-32 w-full object-cover" />
						</div>
					{/if}

					<button on:click={() => fileInput?.click()} class="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 transition-colors hover:border-gray-400">
						<Icon icon="mdi:cloud-upload-outline" class="mb-2 text-3xl text-gray-400" />
						<p class="text-sm text-gray-600">Choose a file or drag & drop it here.</p>
						<p class="text-xs text-gray-400">JPEG, PNG formats, up to 5 MB.</p>
						<span class="mt-3 rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600">Browse File</span>
					</button>

					<!-- Uploaded files list -->
					{#each uploadedFiles as file}
						<div class="mt-3 flex items-center justify-between rounded-lg border bg-white p-3">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
									{#if file.name.endsWith('.pdf')}
										<span class="text-xs font-medium text-red-500">PDF</span>
									{:else}
										<Icon icon="mdi:image-outline" class="text-xl text-gray-400" />
									{/if}
								</div>
								<div>
									<p class="text-sm font-medium text-gray-700">{file.name}</p>
									<div class="flex items-center gap-2 text-xs text-gray-400">
										<span>{file.size}</span>
										<span>·</span>
										{#if file.status === 'uploading'}
											<span class="flex items-center gap-1"><Icon icon="mdi:loading" class="animate-spin text-sm" /> Uploading...</span>
										{:else if file.status === 'completed'}
											<span class="flex items-center gap-1 text-green-600"><Icon icon="mdi:check-circle" class="text-sm" /> Completed</span>
										{:else}
											<span class="text-red-500">Failed</span>
										{/if}
									</div>
									{#if file.status === 'uploading'}
										<div class="mt-1 h-1 w-32 overflow-hidden rounded-full bg-gray-200">
											<div class="h-full rounded-full bg-blue-500 transition-all" style="width: 60%"></div>
										</div>
									{/if}
								</div>
							</div>
							<button on:click={() => removeFile(file.name)} class="text-gray-400 hover:text-gray-600">
								{#if file.status === 'uploading'}
									<Icon icon="mdi:close" class="text-lg" />
								{:else}
									<Icon icon="mdi:trash-can-outline" class="text-lg" />
								{/if}
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
