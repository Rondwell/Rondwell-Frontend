<script lang="ts">
	import { createEventSession, deleteEventMediaByUrl, getEventRooms, getEventSpeakers, updateEventSession, uploadSessionThumbnail } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, tick } from 'svelte';
	import DatePickerModal from '../../../../../../create-event/components/DatePickerModal.svelte';
	import TimeModal from '../../../../../../create-event/components/TimeModal.svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';
	export let session: any = null;

	$: isEdit = !!session;
	$: modalTitle = isEdit ? 'Edit Event Session' : 'Create Event Session';

	let title = '';
	let description = '';
	let selectedRoomId = '';
	let startDate: Date = new Date();
	let endDate: Date = new Date();
	let startTime = '07:30 PM';
	let endTime = '08:30 PM';
	let sessionType = '';
	let selectedSpeakers: any[] = [];
	let liveStreamEnabled = false;
	let isPublic = true;
	let saving = false;
	let error = '';

	let showRoomDropdown = false;
	let showTypeDropdown = false;
	let showSpeakerDropdown = false;
	let speakerSearch = '';

	let openStartDatePicker = false;
	let openEndDatePicker = false;
	let openStartTimePicker = false;
	let openEndTimePicker = false;

	let fileInput: HTMLInputElement;
	let uploadedFiles: { name: string; size: string; status: 'uploading' | 'completed' | 'error'; url?: string }[] = [];
	let thumbnailUrl = '';

	let rooms: any[] = [];
	let speakers: any[] = [];

	const sessionTypes = [
		{ label: 'Keynote', value: 'TALK' },
		{ label: 'Workshop', value: 'WORKSHOP' },
		{ label: 'Panel', value: 'PANEL' },
		{ label: 'Networking', value: 'NETWORKING' },
		{ label: 'Breakout', value: 'BREAKOUT' },
		{ label: 'Exhibition', value: 'EXHIBITION' },
		{ label: 'Q&A', value: 'QNA' },
	];

	$: if (open) { loadData(); initForm(); }

	async function loadData() {
		try { [rooms, speakers] = await Promise.all([getEventRooms(eventId), getEventSpeakers(eventId)]); }
		catch (e) { console.error('Failed to load data:', e); }
	}

	function initForm() {
		if (session) {
			title = session.title || ''; description = session.description || '';
			selectedRoomId = session.roomId || ''; sessionType = session.type || '';
			selectedSpeakers = (session.speakers || []).map((s: any) => ({ ...s }));
			liveStreamEnabled = session.communityChatEnabled ?? false;
			isPublic = session.isPublic ?? true;
			thumbnailUrl = (session.mediaUrls || []).find((m: any) => m.type === 'thumbnail')?.url || '';
			uploadedFiles = thumbnailUrl ? [{ name: 'Session Thumbnail', size: '', status: 'completed' as const, url: thumbnailUrl }] : [];
			if (session.startTime) {
				startDate = new Date(session.startTime);
				const h = startDate.getHours(), m = startDate.getMinutes();
				startTime = `${h % 12 === 0 ? 12 : h % 12}:${m === 0 ? '00' : '30'} ${h >= 12 ? 'PM' : 'AM'}`;
			}
			if (session.endTime) {
				endDate = new Date(session.endTime);
				const h = endDate.getHours(), m = endDate.getMinutes();
				endTime = `${h % 12 === 0 ? 12 : h % 12}:${m === 0 ? '00' : '30'} ${h >= 12 ? 'PM' : 'AM'}`;
			}
		} else {
			title = ''; description = ''; selectedRoomId = ''; sessionType = '';
			selectedSpeakers = []; liveStreamEnabled = false; isPublic = true;
			startDate = new Date(); endDate = new Date();
			startTime = '07:30 PM'; endTime = '08:30 PM';
			thumbnailUrl = ''; uploadedFiles = [];
		}
		error = '';
	}

	function formatDate(date: Date): string { return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }

	function buildDateTime(date: Date, timeStr: string): string {
		const [timePart, meridiem] = timeStr.split(' ');
		let [hours, minutes] = timePart.split(':').map(Number);
		if (meridiem === 'PM' && hours !== 12) hours += 12;
		if (meridiem === 'AM' && hours === 12) hours = 0;
		const d = new Date(date); d.setHours(hours, minutes, 0, 0); return d.toISOString();
	}

	function scrollToId(id: string) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
	function getRoomName(roomId: string): string { return rooms.find(r => (r.id || r._id) === roomId)?.name || 'Select Room'; }
	function getTypeName(type: string): string { return sessionTypes.find(t => t.value === type)?.label || 'Select Session Type'; }
	function getSpeakerName(speaker: any): string { return speaker.displayName || speaker.name || `${speaker.firstName || ''} ${speaker.lastName || ''}`.trim() || 'Anonymous'; }
	function getProfilePicColor(i: number): string { return ['bg-pink-200', 'bg-orange-200', 'bg-blue-200', 'bg-purple-200', 'bg-green-200'][i % 5]; }

	function toggleSpeakerSelection(speaker: any) {
		const id = speaker.participantProfileId || speaker._id || speaker.id;
		if (selectedSpeakers.find(s => s.speakerProfileId === id)) {
			selectedSpeakers = selectedSpeakers.filter(s => s.speakerProfileId !== id);
		} else {
			selectedSpeakers = [...selectedSpeakers, { speakerProfileId: id, name: getSpeakerName(speaker), isLeadSpeaker: false }];
		}
	}

	$: filteredSpeakersList = speakers.filter(s => !speakerSearch || getSpeakerName(s).toLowerCase().includes(speakerSearch.toLowerCase()));

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
		if (file.size > 100 * 1024 * 1024) { error = 'File size must be under 100 MB'; input.value = ''; return; }
		const sizeKB = Math.round(file.size / 1024);
		uploadedFiles = [{ name: file.name, size: `${sizeKB} KB`, status: 'uploading' }];
		try { const result = await uploadSessionThumbnail(eventId, file); thumbnailUrl = result.url; uploadedFiles = [{ name: file.name, size: `${sizeKB} KB`, status: 'completed', url: result.url }]; }
		catch { uploadedFiles = [{ name: file.name, size: `${sizeKB} KB`, status: 'error' }]; }
		finally { input.value = ''; }
	}

	async function removeFile(fileName: string) {
		const urlToDelete = uploadedFiles.find(f => f.name === fileName)?.url || thumbnailUrl;
		uploadedFiles = []; thumbnailUrl = '';
		if (urlToDelete && eventId) { try { await deleteEventMediaByUrl(eventId, urlToDelete); } catch (e) { console.error(e); } }
	}

	async function handleSave() {
		if (!title.trim()) { error = 'Session title is required'; return; }
		if (!selectedRoomId) { error = 'Please assign a room'; return; }
		if (!sessionType) { error = 'Please select a session type'; return; }
		saving = true; error = '';
		try {
			const mediaUrls = thumbnailUrl ? [{ type: 'thumbnail', url: thumbnailUrl }] : [];
			const payload: any = { title: title.trim(), description: description.trim() || undefined, startTime: buildDateTime(startDate, startTime), endTime: buildDateTime(endDate, endTime), type: sessionType, speakers: selectedSpeakers, tags: [getTypeName(sessionType)], isPublic, communityChatEnabled: liveStreamEnabled, mediaUrls };
			if (isEdit) { await updateEventSession(eventId, session.roomId, session.id, payload); }
			else { await createEventSession(eventId, selectedRoomId, payload); }
			dispatch('saved'); open = false;
		} catch (e: any) { error = e.message || 'Failed to save session'; }
		finally { saving = false; }
	}
</script>

<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf" class="hidden" bind:this={fileInput} on:change={handleFileSelect} />

{#if open}
<div on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
<div class="w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
<!-- Header -->
<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
	<div class="flex items-center gap-3">
		<button aria-label="Close" on:click={() => (open = false)}><Icon icon="mdi:chevron-double-right" class="text-lg text-gray-500" /></button>
		<p class="font-medium">{modalTitle}</p>
	</div>
	<div class="flex items-center gap-3">
		<button on:click={handleSave} disabled={saving} class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
			<Icon icon="mdi:plus" class="text-sm" />
			{saving ? 'Saving...' : isEdit ? 'Save' : 'Create Session'}
		</button>
		<button on:click={() => (open = false)} class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375]">Cancel <Icon icon="mdi:close" class="text-sm" /></button>
	</div>
</div>
<!-- Body -->
<div class="custom-scrollbar max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
	<h2 class="text-2xl font-semibold text-gray-900">{isEdit ? `Edit Session: ${session?.title || ''}` : 'Create New Event Session'}</h2>
	{#if error}<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>{/if}

	<!-- Session Title -->
	<div>
		<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Session Title <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
		<input type="text" bind:value={title} placeholder="e.g., The Future of AI in Event Planning" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none" />
	</div>

	<!-- Session Description -->
	<div>
		<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Session Description <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
		<div class="relative">
			<textarea bind:value={description} placeholder="Provide a concise overview of what this session will cover" rows="3" maxlength="100" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"></textarea>
			<span class="absolute right-3 bottom-3 text-xs text-gray-400">{description.length}/100</span>
		</div>
		<p class="mt-1 flex items-center gap-1 text-xs text-gray-500"><Icon icon="mdi:information-outline" width="12" class="text-gray-400" /> You can describe your room message briefly.</p>
	</div>

	<!-- Assign to Room -->
	<div>
		<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Assign to Room <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
		<div class="relative" use:clickOutside={() => (showRoomDropdown = false)}>
			<button on:click={() => (showRoomDropdown = !showRoomDropdown)} class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
				<span class={selectedRoomId ? 'text-gray-800' : 'text-gray-400'}>{selectedRoomId ? getRoomName(selectedRoomId) : 'Select Room'}</span>
				<Icon icon="mdi:chevron-down" class="text-lg text-gray-400" />
			</button>
			{#if showRoomDropdown}
			<div class="absolute left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
				<button on:click={() => { selectedRoomId = ''; showRoomDropdown = false; }} class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50"><Icon icon="mdi:minus-circle-outline" class="text-lg" /> No Room Assigned</button>
				{#each rooms as room}
				{@const roomId = room.id || room._id}
				<button on:click={() => { selectedRoomId = roomId; showRoomDropdown = false; }} class="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 {selectedRoomId === roomId ? 'bg-gray-50 font-medium' : ''}"><Icon icon="mdi:door-open" class="text-lg text-gray-400" /> {room.name}</button>
				{/each}
			</div>
			{/if}
		</div>
	</div>

	<!-- Date/Time Pickers -->
	<div class="rounded-lg border border-gray-200 bg-white p-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
			<div class="flex items-center gap-2"><div class="h-2.5 w-2.5 rounded-full bg-gray-500"></div><span class="text-sm text-gray-400">Session Start Date</span></div>
			<div class="flex items-center gap-2">
				<div class="relative" use:clickOutside={() => (openStartDatePicker = false)}>
					<button on:click={async () => { openStartDatePicker = !openStartDatePicker; await tick(); scrollToId('date'); }} class="rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-gray-700">{formatDate(startDate)}</button>
					<DatePickerModal open={openStartDatePicker} bind:selectedDate={startDate} />
				</div>
				<div class="relative" use:clickOutside={() => (openStartTimePicker = false)}>
					<button on:click={() => (openStartTimePicker = !openStartTimePicker)} class="rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-gray-700">{startTime}</button>
					<TimeModal open={openStartTimePicker} bind:selectedTime={startTime} />
				</div>
			</div>
		</div>
		<div class="my-2 ml-1 h-6 border-l border-dashed border-gray-300"></div>
		<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
			<div class="flex items-center gap-2"><div class="h-2.5 w-2.5 rounded-full border-2 border-gray-400"></div><span class="text-sm text-gray-400">Session End Date</span></div>
			<div class="flex items-center gap-2">
				<div class="relative" use:clickOutside={() => (openEndDatePicker = false)}>
					<button on:click={async () => { openEndDatePicker = !openEndDatePicker; await tick(); scrollToId('date'); }} class="rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-gray-700">{formatDate(endDate)}</button>
					<DatePickerModal open={openEndDatePicker} bind:selectedDate={endDate} {startDate} />
				</div>
				<div class="relative" use:clickOutside={() => (openEndTimePicker = false)}>
					<button on:click={() => (openEndTimePicker = !openEndTimePicker)} class="rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-sm font-medium text-gray-700">{endTime}</button>
					<TimeModal open={openEndTimePicker} bind:selectedTime={endTime} referenceTime={startTime} />
				</div>
			</div>
		</div>
	</div>

	<!-- Session Type -->
	<div>
		<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Session Type <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
		<div class="relative" use:clickOutside={() => (showTypeDropdown = false)}>
			<button on:click={() => (showTypeDropdown = !showTypeDropdown)} class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
				<span class={sessionType ? 'text-gray-800' : 'text-gray-400'}>{sessionType ? getTypeName(sessionType) : 'Select Session Type'}</span>
				<Icon icon="mdi:chevron-down" class="text-lg text-gray-400" />
			</button>
			{#if showTypeDropdown}
			<div class="absolute left-0 z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
				{#each sessionTypes as type}
				<button on:click={() => { sessionType = type.value; showTypeDropdown = false; }} class="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 {sessionType === type.value ? 'bg-gray-50 font-medium' : ''}"><Icon icon="mdi:checkbox-blank-circle" class="text-xs text-gray-400" /> {type.label}</button>
				{/each}
			</div>
			{/if}
		</div>
	</div>

	<!-- Assign Speaker -->
	<div>
		<label class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-900">Assign Speaker <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></label>
		<div class="relative" use:clickOutside={() => (showSpeakerDropdown = false)}>
			<button on:click={() => (showSpeakerDropdown = !showSpeakerDropdown)} class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
				{#if selectedSpeakers.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each selectedSpeakers as sp, i}
					<span class="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs"><span class="flex h-5 w-5 items-center justify-center rounded-full {getProfilePicColor(i)} text-[10px]">😊</span>{sp.name}</span>
					{/each}
				</div>
				{:else}<span class="text-gray-400">Select Speaker</span>{/if}
				<Icon icon="mdi:chevron-down" class="ml-2 flex-shrink-0 text-lg text-gray-400" />
			</button>
			{#if showSpeakerDropdown}
			<div class="absolute left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
				<div class="sticky top-0 border-b bg-white p-2"><input type="text" bind:value={speakerSearch} placeholder="Search speakers..." class="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none" /></div>
				{#each filteredSpeakersList as speaker, i}
				{@const speakerId = speaker.participantProfileId || speaker._id || speaker.id}
				{@const isSelected = selectedSpeakers.some(s => s.speakerProfileId === speakerId)}
				<button on:click={() => toggleSpeakerSelection(speaker)} class="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
					<div class="flex items-center gap-2">
						{#if speaker.profilePictureUrl}<img src={speaker.profilePictureUrl} alt="" class="h-6 w-6 rounded-full object-cover" />{:else}<span class="flex h-6 w-6 items-center justify-center rounded-full {getProfilePicColor(i)} text-[10px]">😊</span>{/if}
						<span class={isSelected ? 'font-medium' : ''}>{getSpeakerName(speaker)}</span>
					</div>
					{#if isSelected}<Icon icon="mdi:check" class="text-lg text-gray-800" />{/if}
				</button>
				{/each}
				{#if filteredSpeakersList.length === 0}<p class="px-4 py-3 text-center text-sm text-gray-400">No speakers found</p>{/if}
			</div>
			{/if}
		</div>
	</div>

	<!-- Session Thumbnail/Image -->
	<div>
		<p class="mb-2 text-sm font-medium text-gray-900">Session Thumbnail/Image</p>
		{#if thumbnailUrl && uploadedFiles.length > 0}
		<div class="mb-3 overflow-hidden rounded-lg border"><img src={thumbnailUrl} alt="Session thumbnail" class="h-32 w-full object-cover" /></div>
		{/if}
		<button on:click={() => fileInput?.click()} class="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 transition-colors hover:border-gray-400">
			<Icon icon="mdi:cloud-upload-outline" class="mb-2 text-3xl text-gray-400" />
			<p class="text-sm text-gray-600">Choose a file or drag & drop it here.</p>
			<p class="text-xs text-gray-400">JPEG, PNG, PDF, and MP4 formats, up to 100 MB.</p>
			<span class="mt-3 rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600">Browse File</span>
		</button>
		{#each uploadedFiles as file}
		<div class="mt-3 flex items-center justify-between rounded-lg border bg-white p-3">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><Icon icon="mdi:image-outline" class="text-xl text-gray-400" /></div>
				<div>
					<p class="text-sm font-medium text-gray-700">{file.name}</p>
					<div class="flex items-center gap-2 text-xs text-gray-400">
						<span>{file.size}</span><span>·</span>
						{#if file.status === 'uploading'}<span class="flex items-center gap-1"><Icon icon="mdi:loading" class="animate-spin text-sm" /> Uploading...</span>
						{:else if file.status === 'completed'}<span class="flex items-center gap-1 text-green-600"><Icon icon="mdi:check-circle" class="text-sm" /> Completed</span>
						{:else}<span class="text-red-500">Failed</span>{/if}
					</div>
				</div>
			</div>
			<button on:click={() => removeFile(file.name)} class="text-gray-400 hover:text-gray-600"><Icon icon={file.status === 'uploading' ? 'mdi:close' : 'mdi:trash-can-outline'} class="text-lg" /></button>
		</div>
		{/each}
	</div>

	<!-- Enable Live Stream Toggle -->
	<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
		<div class="flex items-center gap-2"><span class="text-sm font-medium text-gray-900">Enable Live Stream / Video Conferencing</span><Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></div>
		<button aria-label="Toggle live stream" on:click={() => (liveStreamEnabled = !liveStreamEnabled)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!liveStreamEnabled} class:bg-gray-800={liveStreamEnabled}>
			<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={liveStreamEnabled}></span>
		</button>
	</div>

	<!-- Show on Public Agenda Toggle -->
	<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
		<div class="flex items-center gap-2"><span class="text-sm font-medium text-gray-900">Show on Public Agenda</span><Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></div>
		<button aria-label="Toggle public agenda" on:click={() => (isPublic = !isPublic)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!isPublic} class:bg-gray-800={isPublic}>
			<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={isPublic}></span>
		</button>
	</div>
</div>
</div>
</div>
{/if}
