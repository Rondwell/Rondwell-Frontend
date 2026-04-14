<script lang="ts">
	import { page } from '$app/stores';
	import { getEventRooms, updateEventRoom } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import CreateEditRoom from './modal/CreateEditRoom.svelte';
	import ManageAccess from './modal/ManageAccess.svelte';
	import RoomDropdown from './modal/RoomDropdown.svelte';
	import RoomFilter from './modal/RoomFilter.svelte';

	export let eventTitle = '';
	export let eventData: any = null;
	$: eventId = $page.params.id;

	let searchQuery = '';
	let showCreateModal = false;
	let showAccessModal = false;
	let showChatFilter = false;
	let showAccessFilter = false;
	let showActionModal: string | null = null;
	let buttonEls: Record<string, HTMLElement> = {};
	let editRoom: any = null;
	let accessRoom: any = null;
	let showBanner = true;

	let rooms: any[] = [];
	let loading = true;
	let chatFilter = 'All';
	let accessFilter = 'All';

	async function loadRooms() {
		if (!eventId) return;
		loading = true;
		try {
			rooms = await getEventRooms(eventId);
		} catch (e) {
			console.error('Failed to load rooms:', e);
			rooms = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => { loadRooms(); });

	$: filteredRooms = rooms.filter(r => {
		if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
		if (chatFilter === 'Enabled' && !r.communityChatEnabled) return false;
		if (chatFilter === 'Disabled' && r.communityChatEnabled) return false;
		if (accessFilter === 'Public' && r.accessType !== 'PUBLIC') return false;
		if (accessFilter === 'Restricted' && r.accessType === 'PUBLIC') return false;
		return true;
	});

	function getStatusInfo(room: any): { label: string; color: string } {
		if (!room.isActive) return { label: 'Inactive', color: 'bg-yellow-100 text-yellow-700' };
		if (room.isActive) return { label: 'Active', color: 'bg-green-100 text-green-700' };
		return { label: 'Draft', color: 'bg-gray-200 text-gray-700' };
	}

	function getAccessLabel(room: any): string {
		if (room.accessType === 'PUBLIC') return 'Public';
		if (room.accessType === 'TICKET_TIERED') return `Restricted (${room.allowedTicketTypeIds?.length || 0} Ticket Types)`;
		return 'Private';
	}

	function openCreate() { editRoom = null; showCreateModal = true; }
	function openEdit(room: any) { editRoom = room; showCreateModal = true; }
	function openAccess(room: any) { accessRoom = room; showAccessModal = true; }

	async function toggleChat(room: any) {
		try {
			await updateEventRoom(eventId, room.id, { communityChatEnabled: !room.communityChatEnabled });
			loadRooms();
		} catch (e: any) { console.error(e); }
	}

	function handleDropdownAction(e: CustomEvent) {
		const { type, room } = e.detail;
		if (type === 'create') openCreate();
		else if (type === 'edit') openEdit(room);
		else if (type === 'manageAccess') openAccess(room);
	}

	function handleSaved() { showCreateModal = false; showAccessModal = false; loadRooms(); }
</script>

<div>
	<div class="mb-6">
		<!-- Add Room Banner -->
		{#if showBanner}
			<div class="relative mb-6 flex flex-col justify-between gap-3 rounded-lg border-3 border-dashed border-gray-300 p-4 lg:flex-row lg:items-center lg:pr-10">
				<div class="space-y-3">
					<h2 class="text-xl font-semibold text-gray-600">Add Room</h2>
					<p class="max-w-[70%] text-sm text-gray-400">Set up and manage the virtual or physical spaces where your event will take place.</p>
					<button on:click={openCreate} class="flex items-center gap-2 rounded-lg bg-[#EBECED] px-4 py-2 text-sm text-black">
						<Icon icon="mdi:plus" class="text-xl" /> Create New Room
					</button>
				</div>
				<img src="/rooms.svg" alt="" class="hidden w-50 lg:block" />
				<button on:click={() => (showBanner = false)} class="absolute top-2 right-2 flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]">
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>
		{/if}

		<!-- Section Header -->
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:flex-row">
			<div>
				<h2 class="mb-1 text-xl font-semibold">Event Rooms for {eventTitle || 'Event'}</h2>
				<p class="text-sm text-[#8C8F93]">Set up and manage the virtual or physical spaces where your event will take place.</p>
			</div>
			<button on:click={openCreate} class="flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 sm:w-fit">
				<Icon icon="mdi:plus" class="text-xl" /> Create New Room
			</button>
		</div>

		<!-- Search and Filters -->
		<div class="mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
			<div class="mb-4 flex items-center gap-2">
				<div class="relative w-full max-w-xl">
					<input type="text" bind:value={searchQuery} placeholder="Search room by name..." class="h-[43px] w-full rounded-lg bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
					<span class="absolute top-2.5 left-3 text-gray-400">
						<img src="/search-favorite.png" alt="search icon" class="h-5 w-5" />
					</span>
				</div>
			</div>

			<div class="flex items-center gap-1 md:flex-row">
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/download-icon.svg" alt="download icon" />
				</div>
				<div class="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-[#EBECED]">
					<img src="/export.svg" alt="export icon" />
				</div>

				<div use:clickOutside={() => (showChatFilter = false)} class="relative">
					<button on:click={() => (showChatFilter = !showChatFilter)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" /> Community Chat
					</button>
					<RoomFilter bind:open={showChatFilter} type="chat" on:select={(e) => { chatFilter = e.detail; showChatFilter = false; }} />
				</div>
				<div use:clickOutside={() => (showAccessFilter = false)} class="relative">
					<button on:click={() => (showAccessFilter = !showAccessFilter)} class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
						<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" /> Access
					</button>
					<RoomFilter bind:open={showAccessFilter} type="access" on:select={(e) => { accessFilter = e.detail; showAccessFilter = false; }} />
				</div>
			</div>
		</div>

		{#if loading}
			<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
				{#each [1, 2] as _}
					<div class="animate-pulse rounded-xl border bg-white p-6 shadow-sm">
						<div class="mb-4 h-5 w-16 rounded-full bg-gray-200"></div>
						<div class="mb-2 h-7 w-40 rounded bg-gray-200"></div>
						<div class="h-4 w-24 rounded bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if filteredRooms.length > 0}
			<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
				{#each filteredRooms as room}
					{@const status = getStatusInfo(room)}
					<div class="relative rounded-xl border bg-white p-6 shadow-sm">
						<!-- Status badge -->
						<span class="absolute top-4 left-4 rounded-full px-2 py-1 text-xs font-medium {status.color}">
							{status.label}
						</span>

						<!-- 3-dot menu -->
						<div class="absolute top-4 right-4" use:clickOutside={() => { if (showActionModal === room.id) showActionModal = null; }}>
							<button bind:this={buttonEls[room.id]} on:click={() => (showActionModal = showActionModal === room.id ? null : room.id)} class="text-gray-400 hover:text-gray-600">
								<Icon icon="mdi:dots-horizontal" class="h-5 w-5" />
							</button>
							<RoomDropdown open={showActionModal === room.id} buttonEl={buttonEls[room.id]} {room} {eventId} on:action={handleDropdownAction} on:updated={() => { showActionModal = null; loadRooms(); }} />
						</div>

						<!-- Room name (clickable to edit) -->
						<button on:click={() => openEdit(room)} class="mt-10 text-left">
							<h3 class="text-2xl font-semibold">{room.name}</h3>
						</button>

						<!-- Sessions count -->
						<div class="mt-1 flex items-center gap-2 text-sm text-gray-500">
							<img src="/task-square.svg" alt="" />
							{room.sessionCount || 0} Sessions
						</div>

						<!-- Footer -->
						<div class="mt-6 flex flex-col justify-between gap-2 border-t pt-6 md:flex-row md:items-center">
							<!-- Access -->
							<div class="flex items-center justify-between gap-2 text-sm text-gray-600 md:justify-normal">
								<span class="font-medium">Access:</span>
								<button on:click={() => openAccess(room)} class="flex items-center gap-2 rounded-xl bg-gray-100 px-2 py-1.5">
									<span class="flex items-center gap-1">
										<Icon icon={room.accessType === 'PUBLIC' ? 'mdi:web' : 'mdi:eye-off-outline'} class="text-xl" />
										{getAccessLabel(room)}
									</span>
									<img src="/arrow-left.svg" alt="" class="rotate-90 transform" />
								</button>
							</div>

							<!-- Community Chat toggle -->
							<div class="flex items-center justify-between gap-2 text-sm text-gray-600 md:justify-normal">
								<span>Community Chat</span>
								<button on:click={() => toggleChat(room)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!room.communityChatEnabled} class:bg-black={room.communityChatEnabled}>
									<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={room.communityChatEnabled}></span>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex h-70 flex-col items-center justify-center">
				<img src="/planning.svg" alt="" class="h-40" />
				<p class="-mt-2 text-lg font-medium text-[#A2ACB2]">No Rooms added, yet</p>
				<p class="mt-1 text-sm text-gray-400">Rooms will display when they are added</p>
			</div>
		{/if}
	</div>
</div>

<CreateEditRoom bind:open={showCreateModal} {eventId} room={editRoom} eventStartDate={eventData?.startDateTime ? new Date(eventData.startDateTime) : null} eventEndDate={eventData?.endDateTime ? new Date(eventData.endDateTime) : null} on:saved={handleSaved} />
<ManageAccess bind:open={showAccessModal} {eventId} room={accessRoom} on:saved={handleSaved} />
