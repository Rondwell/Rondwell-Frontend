<script lang="ts">
	import { page } from '$app/stores';
	import { enableEventCommunity, updateCommunitySettings, updateEvent } from '$lib/services/event.services';
	import { createCommunityRoom, updateCommunityRoom, deleteCommunityRoom, getEventOverview, setCommunityEnabled } from '$lib/services/community.services';
	import { getEventCache } from '$lib/stores/eventCache.store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let eventTitle = '';
	$: eventId = $page.params.id ?? '';

	// Use cached event data for communityEnabled state
	$: ({ event: eventStore } = getEventCache(eventId));
	$: cachedEvent = $eventStore;

	let community: any = null;
	let rooms: any[] = [];
	let overviewStats = { activeUsers: 0, totalPosts: 0, chatRooms: 0 };
	let loading = true;
	let showBanner = true;
	let saving = false;

	// Create / edit room modal
	let showAddRoomModal = false;
	let newRoomName = '';
	let newRoomDesc = '';
	let newRoomEmoji = '💬';
	let creatingRoom = false;
	let editingRoom: any = null; // when set, the modal edits this room instead of creating

	// Community settings
	let communityEnabled = false;
	let allowPosts = true;
	let allowComments = true;
	let allowReactions = true;
	let allowPolls = false;
	let allowPrivateChat = false;
	let allowFileSharing = false;
	let allowUpvoteDownvote = false;
	let profanityFilterEnabled = false;
	let profanityKeywords = '';
	let searchQuery = '';

	async function loadData() {
		if (!eventId) return;
		loading = true;
		try {
			// Single source of truth: the community service overview (community +
			// rooms + live stats). Rooms shown here are the SAME rooms attendees
			// see on the event page community tab.
			const overview = await getEventOverview(eventId);
			community = overview.community;
			rooms = overview.rooms;
			overviewStats = overview.stats;
			communityEnabled = cachedEvent?.communityEnabled ?? overview.enabled;
			if (community) {
				const s = community.settings || {};
				allowPosts = s.allowPosts ?? true;
				allowComments = s.allowComments ?? true;
				allowReactions = s.allowReactions ?? true;
				allowPolls = s.allowPolls ?? false;
				allowPrivateChat = s.allowPrivateChat ?? false;
				allowFileSharing = s.allowFileSharing ?? false;
				allowUpvoteDownvote = s.allowUpvoteDownvote ?? false;
				profanityFilterEnabled = s.profanityFilterEnabled ?? false;
				profanityKeywords = Array.isArray(s.profanityKeywords) ? s.profanityKeywords.join(', ') : (s.profanityKeywords ?? '');
			}
		} catch (e) { console.error('Failed to load community:', e); }
		finally { loading = false; }
	}

	onMount(() => { loadData(); });

	$: chatRooms = rooms;

	async function toggleCommunity() {
		if (!communityEnabled) {
			// Optimistic — flip immediately so the UI is responsive.
			communityEnabled = true;
			loading = true;
			try {
				// Persist the event flag and provision the community in parallel.
				// (The community RPC now has a real responder, so this is fast.)
				const [, comm] = await Promise.all([
					updateEvent(eventId, { communityEnabled: true } as any),
					enableEventCommunity(eventId),
				]);
				// enableEventCommunity returns { community } — refresh from it if present.
				await loadData();
			} catch (e: any) {
				console.warn('Enable community failed, keeping toggle on:', e.message);
				loading = false;
			}
		} else {
			communityEnabled = false;
			try {
				await Promise.all([
					updateEvent(eventId, { communityEnabled: false } as any),
					// Flip the master switch directly on the community service so the
					// public event page locks immediately (broadcasts COMMUNITY_TOGGLED
					// to connected clients). This no longer depends on community._id
					// being loaded or on a cross-service RPC round-trip.
					setCommunityEnabled(eventId, false),
				]);
			} catch (e: any) { console.warn('Failed to save community state:', e.message); }
		}
	}

	function parseKeywords(input: string): string[] {
		return input.split(',').map((w) => w.trim()).filter(Boolean);
	}

	async function saveSettings() {
		const communityId = community?._id || community?.id;
		if (!communityId) { alert('Community is still being set up. Try again in a moment.'); return; }
		saving = true;
		try {
			await updateCommunitySettings(communityId, {
				allowPosts,
				allowComments,
				allowReactions,
				allowPolls,
				allowPrivateChat,
				allowFileSharing,
				allowUpvoteDownvote,
				profanityFilterEnabled,
				profanityKeywords: parseKeywords(profanityKeywords),
			});
		} catch (e: any) { alert(e.message || 'Failed to save settings'); }
		finally { saving = false; }
	}

	async function createRoom() {
		if (!newRoomName.trim()) return;
		creatingRoom = true;
		try {
			if (editingRoom) {
				await updateCommunityRoom(editingRoom._id, {
					name: newRoomName.trim(),
					description: newRoomDesc.trim(),
					emoji: newRoomEmoji,
				});
			} else {
				await createCommunityRoom(eventId, {
					name: newRoomName.trim(),
					description: newRoomDesc.trim() || undefined,
					emoji: newRoomEmoji,
				});
			}
			closeRoomModal();
			await loadData();
		} catch (e: any) { alert(e.message || 'Failed to save room'); }
		finally { creatingRoom = false; }
	}

	function openAddRoom() {
		editingRoom = null;
		newRoomName = ''; newRoomDesc = ''; newRoomEmoji = '💬';
		showAddRoomModal = true;
	}

	function startEditRoom(room: any) {
		editingRoom = room;
		newRoomName = room.name ?? '';
		newRoomDesc = room.description ?? '';
		newRoomEmoji = room.emoji || '💬';
		showAddRoomModal = true;
	}

	function closeRoomModal() {
		showAddRoomModal = false;
		editingRoom = null;
		newRoomName = ''; newRoomDesc = ''; newRoomEmoji = '💬';
	}

	async function deleteRoom(room: any) {
		if (room.isDefault) { alert('The default room cannot be deleted.'); return; }
		if (!confirm(`Delete "${room.name}"? All its posts will be removed.`)) return;
		try {
			await deleteCommunityRoom(room._id);
			await loadData();
		} catch (e: any) { alert(e.message || 'Failed to delete room'); }
	}

	function viewLiveCommunity() {
		window.open(`/event-page/${eventId}/community`, '_blank');
	}

	$: filteredChatRooms = chatRooms.filter(r => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()));
</script>

<div>
	<!-- Live View Banner -->
	{#if showBanner}
	<div class="mb-4 rounded-lg border p-4">
		<div class="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
			<div class="flex flex-col items-start gap-2 md:flex-row md:items-center">
				<div class="flex -space-x-3">
					<img src="/rondwell-attendee.png" alt="" class="h-8 w-8 rounded-full border" />
					<img src="/face-2.svg" alt="" class="h-8 w-8 rounded-full border" />
					<img src="/face.svg" alt="" class="h-8 w-8 rounded-full border" />
					<p class="mx-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-600">+ 4</p>
				</div>
				<p class="flex flex-col gap-1 text-sm text-gray-600">
					<span class="font-medium text-black">See what's happening</span>
				</p>
			</div>
			<div class="flex w-full items-center gap-2 md:w-fit">
				<button on:click={viewLiveCommunity} class="flex w-full items-center justify-center gap-1 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 md:w-fit md:text-sm">
					<img src="/link-2.svg" alt="" class="brightness-0 invert" /> View Live Community
				</button>
				<button on:click={() => (showBanner = false)}><Icon icon="mdi:close" class="h-4 w-4 text-gray-600" /></button>
			</div>
		</div>
	</div>
	{/if}

	<!-- Header -->
	<div class="my-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
		<div>
			<h1 class="text-2xl font-semibold">Event Community for {eventTitle || 'Event'}</h1>
			<p class="text-sm text-gray-500">Manage your event's community forums, chats, and engagement features.</p>
		</div>
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
			<div class="flex items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-sm text-[#5D646F]">
				<span class="font-medium">Event-Wide Community Forum</span>
				<button aria-label="Toggle community" on:click={toggleCommunity} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-300={!communityEnabled} class:bg-gray-800={communityEnabled}>
					<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={communityEnabled}></span>
				</button>
			</div>
		</div>
	</div>

	{#if loading}
	<div class="space-y-4">
		{#each [1, 2, 3] as _}<div class="h-16 animate-pulse rounded-xl bg-gray-100"></div>{/each}
	</div>
	{:else if !communityEnabled}
	<!-- Disabled State -->
	<div class="flex h-70 flex-col items-center justify-center">
		<Icon icon="mdi:forum-outline" class="mb-3 text-6xl text-gray-300" />
		<p class="text-lg font-medium text-[#A2ACB2]">Community is disabled</p>
		<p class="mt-1 text-sm text-gray-400">Toggle the Event-Wide Community Forum switch above to activate</p>
	</div>
	{:else}
	<!-- Stats Cards -->
	<div class="mb-6 flex w-full flex-wrap gap-3">
		<div class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-[200px] md:w-fit">
			<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#DBF4DA]">
				<Icon icon="mdi:account-group" class="text-2xl text-[#3CBD2C]" />
			</div>
			<div><p>{overviewStats.activeUsers}</p><p class="text-xs text-[#B8BABA]">Active Users</p></div>
		</div>
		<div class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-[200px] md:w-fit">
			<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#F8E8E0]">
				<Icon icon="mdi:message-text" class="text-2xl text-[#F87937]" />
			</div>
			<div><p>{overviewStats.totalPosts}</p><p class="text-xs text-[#B8BABA]">Total Posts</p></div>
		</div>
		<div class="flex w-full items-center gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-[200px] md:w-fit">
			<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#E4E0FF]">
				<Icon icon="mdi:chat-processing-outline" class="text-2xl text-[#7762F6]" />
			</div>
			<div><p>{overviewStats.chatRooms}</p><p class="text-xs text-[#B8BABA]">Chat Rooms</p></div>
		</div>
	</div>

	<!-- Community Settings -->
	<div class="mt-6">
		<h2 class="text-lg font-semibold">Community Settings</h2>
		<div class="mt-4 space-y-4 rounded-xl bg-white p-4 shadow-sm md:p-6">
			<h3 class="border-b pb-3 font-semibold">General Community Settings</h3>
			<p class="text-xs text-gray-400">Changes apply to the live event page community in real time.</p>
			<div class="rounded-xl border p-4">
				<div class="flex items-center justify-between border-b pb-4">
					<span class="text-sm">Allow Attendees to Create Posts</span>
					<button aria-label="Toggle posts" on:click={() => (allowPosts = !allowPosts)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!allowPosts} class:bg-gray-800={allowPosts}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={allowPosts}></span>
					</button>
				</div>
				<div class="mt-4 flex items-center justify-between border-b pb-4">
					<span class="text-sm">Allow Comments on Posts</span>
					<button aria-label="Toggle comments" on:click={() => (allowComments = !allowComments)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!allowComments} class:bg-gray-800={allowComments}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={allowComments}></span>
					</button>
				</div>
				<div class="mt-4 flex items-center justify-between border-b pb-4">
					<span class="text-sm">Allow Reactions (Likes) on Posts</span>
					<button aria-label="Toggle reactions" on:click={() => (allowReactions = !allowReactions)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!allowReactions} class:bg-gray-800={allowReactions}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={allowReactions}></span>
					</button>
				</div>
				<div class="mt-4 flex items-center justify-between border-b pb-4">
					<span class="text-sm">Allow Attendees to Create Public Polls</span>
					<button aria-label="Toggle polls" on:click={() => (allowPolls = !allowPolls)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!allowPolls} class:bg-gray-800={allowPolls}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={allowPolls}></span>
					</button>
				</div>
				<div class="mt-4 flex items-center justify-between border-b pb-4">
					<span class="text-sm">Allow Attendees to Initiate Private Chats</span>
					<button aria-label="Toggle private chats" on:click={() => (allowPrivateChat = !allowPrivateChat)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!allowPrivateChat} class:bg-gray-800={allowPrivateChat}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={allowPrivateChat}></span>
					</button>
				</div>
				<div class="mt-4 flex items-center justify-between border-b pb-4">
					<span class="text-sm">Allow File Sharing in Public Chats</span>
					<button aria-label="Toggle file sharing" on:click={() => (allowFileSharing = !allowFileSharing)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!allowFileSharing} class:bg-gray-800={allowFileSharing}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={allowFileSharing}></span>
					</button>
				</div>
				<div class="mt-4 flex items-center justify-between">
					<span class="text-sm">Enable Upvote/Downvote on Posts</span>
					<button aria-label="Toggle upvote" on:click={() => (allowUpvoteDownvote = !allowUpvoteDownvote)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!allowUpvoteDownvote} class:bg-gray-800={allowUpvoteDownvote}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={allowUpvoteDownvote}></span>
					</button>
				</div>
			</div>

			<!-- Profanity Filter -->
			<div>
				<div class="flex items-center justify-between">
					<p class="flex items-center gap-1 text-sm font-medium">Enable Profanity Filter <Icon icon="mdi:information-outline" width="14" class="text-gray-400" /></p>
					<button aria-label="Toggle profanity filter" on:click={() => (profanityFilterEnabled = !profanityFilterEnabled)} class="relative h-6 w-10 rounded-full transition-colors duration-300" class:bg-gray-200={!profanityFilterEnabled} class:bg-gray-800={profanityFilterEnabled}>
						<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" class:translate-x-4={profanityFilterEnabled}></span>
					</button>
				</div>
				<textarea bind:value={profanityKeywords} disabled={!profanityFilterEnabled} class="mt-2 h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:opacity-60" placeholder="e.g., damn, crap, idiot"></textarea>
				<p class="mt-1 flex items-center gap-1 text-xs text-gray-500"><Icon icon="mdi:information-outline" width="12" class="text-gray-400" /> Comma-separated words to auto-filter from community posts and comments.</p>
			</div>

			<!-- Save -->
			<button on:click={saveSettings} disabled={saving} class="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">
				<Icon icon="mdi:content-save-check-outline" class="text-lg" />
				{saving ? 'Saving...' : 'Save Community Settings'}
			</button>
		</div>
	</div>

	<!-- Chat Rooms -->
	<div class="mt-8">
		<h2 class="mb-4 text-lg font-semibold">Chat Rooms</h2>
		<div class="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
			<div class="relative w-full max-w-xl">
				<input type="text" bind:value={searchQuery} placeholder="Search room name" class="h-[43px] w-full rounded-lg bg-white py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
				<span class="absolute top-2.5 left-3"><img src="/search-favorite.png" alt="" class="h-5 w-5" /></span>
			</div>
			<button on:click={openAddRoom} class="flex items-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 sm:w-fit">
				<Icon icon="mdi:plus" class="text-xl" /> Add New Room
			</button>
		</div>

		{#if filteredChatRooms.length > 0}
		<div class="overflow-visible rounded-xl bg-white shadow-sm">
			{#each filteredChatRooms as room}
			<div class="flex flex-col justify-between gap-3 border-b px-4 py-3 last:border-none md:flex-row md:items-center">
				<div class="flex w-full flex-col justify-between gap-3 md:w-[70%] md:flex-row md:items-center">
					<div class="flex items-center gap-3">
						<span class="flex h-7 w-7 items-center justify-center text-lg">{room.emoji || '💬'}</span>
						<div class="flex items-center gap-2">
							<span class="font-medium">{room.name}</span>
							{#if room.isDefault}<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Default</span>{/if}
						</div>
					</div>
					<div class="truncate text-sm text-gray-500">{room.description || 'No description'}</div>
				</div>
				<div class="flex items-center gap-3">
					<span class="flex items-center gap-1 text-xs text-gray-400"><Icon icon="mdi:message-text-outline" width="14" /> {room.postCount ?? 0}</span>
					<button on:click={() => startEditRoom(room)} class="text-gray-400 hover:text-gray-700" aria-label="Edit room">
						<Icon icon="mdi:pencil-outline" class="text-lg" />
					</button>
					{#if !room.isDefault}
					<button on:click={() => deleteRoom(room)} class="text-gray-400 hover:text-red-500" aria-label="Delete room">
						<Icon icon="mdi:trash-can-outline" class="text-lg" />
					</button>
					{/if}
				</div>
			</div>
			{/each}
		</div>
		{:else}
		<div class="flex h-40 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:chat-outline" class="mb-2 text-4xl text-gray-300" />
			<p class="text-sm text-gray-400">No chat rooms yet. Add one to get started.</p>
		</div>
		{/if}
	</div>
	{/if}
</div>

<!-- Create / Edit Room modal -->
{#if showAddRoomModal}
<div class="fixed inset-0 z-[999] flex items-center justify-center p-4">
	<button class="absolute inset-0 bg-black/40" aria-label="Close" on:click={closeRoomModal}></button>
	<div class="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-base font-semibold">{editingRoom ? 'Edit Room' : 'New Room'}</h2>
			<button class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500" on:click={closeRoomModal}><Icon icon="mdi:close" width="18" /></button>
		</div>
		<div class="flex items-center gap-2">
			<input bind:value={newRoomEmoji} maxlength="2" class="w-14 rounded-lg border border-gray-200 px-3 py-2.5 text-center text-lg outline-none focus:border-gray-400" />
			<input bind:value={newRoomName} placeholder="Room name" maxlength="60" class="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
		</div>
		<textarea bind:value={newRoomDesc} placeholder="What's this room about? (optional)" rows="2" class="mt-3 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400"></textarea>
		{#if editingRoom?.isDefault}<p class="mt-2 text-xs text-gray-400">This is the default room — renaming it is allowed, but it can't be deleted.</p>{/if}
		<div class="mt-4 flex justify-end gap-2">
			<button class="rounded-lg px-4 py-2 text-sm text-gray-500" on:click={closeRoomModal}>Cancel</button>
			<button class="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50" on:click={createRoom} disabled={creatingRoom || !newRoomName.trim()}>{creatingRoom ? 'Saving…' : editingRoom ? 'Save Changes' : 'Create Room'}</button>
		</div>
	</div>
</div>
{/if}
