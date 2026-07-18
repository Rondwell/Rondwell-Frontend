<script lang="ts">
	import { page } from '$app/stores';
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import {
		addPostComment,
		connectFeed,
		createCommunityPost,
		createCommunityRoom,
		deleteCommunityPost,
		deleteCommunityRoom,
		getEventOverview,
		getPostComments,
		getRoomPosts,
		pinCommunityPost,
		togglePostLike,
		type CommunityOverview,
		type CommunityPost,
		type CommunityRoom,
		type CommunitySettings,
		type FeedEvent
	} from '$lib/services/community.services';
	import Icon from '@iconify/svelte';
	import { onDestroy, onMount } from 'svelte';
	import PostComposerModal from './components/PostComposerModal.svelte';

	$: eventId = $page.params.id ?? '';
	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	// ─── State ───────────────────────────────────────────────────────────────
	type View = 'rooms' | 'room' | 'post';
	let view: View = 'rooms';

	let enabled = false;
	let community: CommunityOverview['community'] = null;
	let settings: CommunitySettings | null = null;
	let rooms: CommunityRoom[] = [];
	let stats = { activeUsers: 0, totalPosts: 0, chatRooms: 0 };
	let loading = true;
	let live = false;

	let selectedRoom: CommunityRoom | null = null;
	let roomPosts: CommunityPost[] = [];
	let postsLoading = false;

	let selectedPost: CommunityPost | null = null;
	let comments: any[] = [];
	let commentsLoading = false;
	let commentDraft = '';
	let commentBusy = false;

	// Composer / room modals
	let showComposer = false;
	let composerSubmitting = false;
	let composer: PostComposerModal;
	let showRoomModal = false;
	let roomName = '';
	let roomDesc = '';
	let roomEmoji = '💬';
	let roomBusy = false;

	// ─── Current user ──────────────────────────────────────────────────────────
	$: currentUserId = $authState.user?.id ?? '';
	$: currentName = $authState.activeProfile?.name ?? $authState.user?.email ?? 'Attendee';
	$: currentAvatar = $authState.activeProfile?.profilePictureUrl ?? '';
	$: isOrganizer = !!community && !!currentUserId && community.organizerId === currentUserId;

	$: canPost = enabled && settings?.allowPosts !== false;
	$: canComment = settings?.allowComments !== false;
	$: canReact = settings?.allowReactions !== false;

	let disposeFeed: (() => void) | null = null;

	onMount(async () => {
		if (!eventId) return;
		await load();
		disposeFeed = connectFeed(eventId, handleFeedEvent);
		live = true;
	});

	onDestroy(() => { disposeFeed?.(); live = false; });

	async function load() {
		loading = true;
		try {
			const overview = await getEventOverview(eventId);
			enabled = overview.enabled;
			community = overview.community;
			settings = overview.community?.settings ?? null;
			rooms = overview.rooms;
			stats = overview.stats;
		} finally {
			loading = false;
		}
	}

	// ─── Navigation ──────────────────────────────────────────────────────────
	async function openRoom(room: CommunityRoom) {
		selectedRoom = room;
		view = 'room';
		postsLoading = true;
		try { roomPosts = await getRoomPosts(room._id); }
		finally { postsLoading = false; }
	}

	async function openPost(post: CommunityPost) {
		selectedPost = post;
		view = 'post';
		commentsLoading = true;
		try { comments = await getPostComments(post._id); }
		finally { commentsLoading = false; }
	}

	function backToRooms() { view = 'rooms'; selectedRoom = null; roomPosts = []; }
	function backToRoom() { view = 'room'; selectedPost = null; comments = []; }

	// ─── Realtime ──────────────────────────────────────────────────────────────
	function sortPosts(list: CommunityPost[]): CommunityPost[] {
		return [...list].sort((a, b) => {
			if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}

	function bumpRoomCount(roomId: string, delta: number) {
		rooms = rooms.map((r) => (r._id === roomId ? { ...r, postCount: Math.max(0, (r.postCount || 0) + delta) } : r));
	}

	function handleFeedEvent(e: FeedEvent) {
		switch (e.type) {
			case 'ROOM_CREATED':
				if (!rooms.some((r) => r._id === e.room._id)) rooms = [...rooms, e.room];
				stats = { ...stats, chatRooms: stats.chatRooms + 1 };
				break;
			case 'ROOM_UPDATED':
				rooms = rooms.map((r) => (r._id === e.room._id ? { ...r, ...e.room } : r));
				if (selectedRoom?._id === e.room._id) selectedRoom = { ...selectedRoom, ...e.room };
				break;
			case 'ROOM_DELETED':
				rooms = rooms.filter((r) => r._id !== e.roomId);
				stats = { ...stats, chatRooms: Math.max(0, stats.chatRooms - 1) };
				if (selectedRoom?._id === e.roomId) backToRooms();
				break;
			case 'POST_CREATED':
				bumpRoomCount(e.roomId, 1);
				stats = { ...stats, totalPosts: stats.totalPosts + 1 };
				if (selectedRoom?._id === e.roomId && !roomPosts.some((p) => p._id === e.post._id)) {
					roomPosts = sortPosts([e.post, ...roomPosts]);
				}
				break;
			case 'POST_LIKED':
				roomPosts = roomPosts.map((p) => (p._id === e.postId ? applyLike(p, e) : p));
				if (selectedPost?._id === e.postId) selectedPost = applyLike(selectedPost, e);
				break;
			case 'COMMENT_CREATED':
				roomPosts = roomPosts.map((p) => (p._id === e.postId ? { ...p, commentCount: e.commentCount } : p));
				if (selectedPost?._id === e.postId) {
					selectedPost = { ...selectedPost, commentCount: e.commentCount };
					if (!comments.some((c) => c._id === e.comment._id)) comments = [...comments, e.comment];
				}
				break;
			case 'POST_PINNED':
				roomPosts = sortPosts(roomPosts.map((p) => (p._id === e.postId ? { ...p, pinned: e.pinned } : p)));
				if (selectedPost?._id === e.postId) selectedPost = { ...selectedPost, pinned: e.pinned };
				break;
			case 'POST_DELETED':
				bumpRoomCount(e.roomId, -1);
				roomPosts = roomPosts.filter((p) => p._id !== e.postId);
				if (selectedPost?._id === e.postId) backToRoom();
				break;
			case 'SETTINGS_UPDATED':
				settings = { ...(settings ?? ({} as CommunitySettings)), ...e.settings };
				if (community) community = { ...community, settings: settings! };
				break;
			case 'COMMUNITY_TOGGLED':
				enabled = e.enabled;
				if (e.enabled) load();
				break;
		}
	}

	function applyLike(p: CommunityPost, e: any): CommunityPost {
		const likes = new Set(p.likes ?? []);
		if (e.liked) likes.add(e.userId); else likes.delete(e.userId);
		return { ...p, likes: Array.from(likes) };
	}

	// ─── Actions ────────────────────────────────────────────────────────────────
	async function submitPost(evt: CustomEvent) {
		if (!selectedRoom) return;
		composerSubmitting = true;
		try {
			const created = await createCommunityPost(selectedRoom._id, {
				...evt.detail,
				authorName: currentName,
				authorAvatar: currentAvatar
			});
			if (created && !roomPosts.some((p) => p._id === created._id)) {
				roomPosts = sortPosts([created, ...roomPosts]);
				bumpRoomCount(selectedRoom._id, 1);
				stats = { ...stats, totalPosts: stats.totalPosts + 1 };
			}
			showComposer = false;
			composer?.resetAfterSubmit();
		} catch (err: any) {
			alert(err?.message ?? 'Failed to post');
		} finally {
			composerSubmitting = false;
		}
	}

	function hasLiked(post: CommunityPost): boolean {
		return !!currentUserId && (post.likes ?? []).includes(currentUserId);
	}

	async function like(post: CommunityPost) {
		if (!$isAuthenticated || !canReact) return;
		const liked = hasLiked(post);
		const apply = (p: CommunityPost) => applyLike(p, { liked: !liked, userId: currentUserId });
		roomPosts = roomPosts.map((p) => (p._id === post._id ? apply(p) : p));
		if (selectedPost?._id === post._id) selectedPost = apply(selectedPost);
		try { await togglePostLike(post._id); } catch { load(); }
	}

	async function submitComment() {
		if (!selectedPost) return;
		const text = commentDraft.trim();
		if (!text) return;
		commentBusy = true;
		try {
			await addPostComment(selectedPost._id, { content: text, authorName: currentName, authorAvatar: currentAvatar });
			commentDraft = '';
		} catch (err: any) {
			alert(err?.message ?? 'Failed to comment');
		} finally {
			commentBusy = false;
		}
	}

	async function pin(post: CommunityPost) {
		try { await pinCommunityPost(post._id); } catch (err: any) { alert(err?.message ?? 'Failed to pin'); }
	}

	async function removePost(post: CommunityPost) {
		if (!confirm('Delete this post?')) return;
		try {
			await deleteCommunityPost(post._id);
			roomPosts = roomPosts.filter((p) => p._id !== post._id);
			if (selectedPost?._id === post._id) backToRoom();
		} catch (err: any) { alert(err?.message ?? 'Failed to delete'); }
	}

	async function createRoom() {
		if (!roomName.trim()) return;
		roomBusy = true;
		try {
			const room = await createCommunityRoom(eventId, { name: roomName.trim(), description: roomDesc.trim() || undefined, emoji: roomEmoji });
			if (!rooms.some((r) => r._id === room._id)) rooms = [...rooms, { ...room, postCount: 0 }];
			showRoomModal = false;
			roomName = ''; roomDesc = ''; roomEmoji = '💬';
		} catch (err: any) { alert(err?.message ?? 'Failed to create room'); }
		finally { roomBusy = false; }
	}

	async function removeRoom(room: CommunityRoom) {
		if (!confirm(`Delete room "${room.name}"? All its posts will be removed.`)) return;
		try {
			await deleteCommunityRoom(room._id);
			rooms = rooms.filter((r) => r._id !== room._id);
		} catch (err: any) { alert(err?.message ?? 'Failed to delete room'); }
	}

	// ─── Helpers ────────────────────────────────────────────────────────────────
	function stripHtml(html: string | undefined): string {
		if (!html) return '';
		return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
	}

	// New posts store rich HTML; legacy posts are plain text. Detect so we render
	// each correctly (HTML via {@html}, plain text with preserved line breaks).
	function isHtml(s: string | undefined): boolean {
		return !!s && /<[a-z][\s\S]*>/i.test(s);
	}

	function formatTimeAgo(dateStr: string): string {
		if (!dateStr) return '';
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}
</script>

<div class="w-full max-w-4xl">
	<!-- Banner -->
	<!-- NOTE: no `overflow-hidden` here — the logo overhangs the bottom edge and
	     must not be clipped. The gradient layers carry their own rounded corners. -->
	<div class="relative mb-16 rounded-2xl">
		<div class="h-36 w-full rounded-2xl" style="background: linear-gradient(135deg, {themeColor.button}, {themeColor.toggle});"></div>
		<div class="absolute inset-0 rounded-2xl opacity-30" style="background: radial-gradient(circle at 20% 20%, {themeColor.buttonText}22, transparent 40%), radial-gradient(circle at 80% 60%, {themeColor.buttonText}22, transparent 35%);"></div>
		<div class="absolute -bottom-8 left-5 flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg" style="background-color: {themeColor.cover}; border: 2px solid {themeColor.toggle};">
			<span class="text-3xl">💬</span>
		</div>
		{#if live}
		<div class="absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur" style="background-color: {themeColor.cover}dd; color: {themeColor.text};">
			<span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style="background-color:#22c55e;"></span><span class="relative inline-flex h-2 w-2 rounded-full" style="background-color:#22c55e;"></span></span>
			LIVE
		</div>
		{/if}
	</div>

	<!-- Header / breadcrumb -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-2">
			{#if view !== 'rooms'}
			<button class="flex h-8 w-8 items-center justify-center rounded-full" style="background-color: {themeColor.smallCover}; color: {themeColor.text};" on:click={() => (view === 'post' ? backToRoom() : backToRooms())}>
				<Icon icon="mdi:arrow-left" width="18" />
			</button>
			{/if}
			<div>
				<h1 class="text-2xl font-bold" style="color: {themeColor.text};">
					{#if view === 'rooms'}Community{:else if view === 'room'}{selectedRoom?.emoji ?? '💬'} {selectedRoom?.name}{:else}{selectedRoom?.name}{/if}
				</h1>
				<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
					{#if view === 'rooms'}Pick a room to join the conversation{:else if view === 'room'}{selectedRoom?.description || 'Share, discuss, and connect'}{:else}Post{/if}
				</p>
			</div>
		</div>

		{#if view === 'rooms' && isOrganizer && enabled}
		<button class="flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-xs font-medium transition-transform hover:-translate-y-0.5" style="background-color: {themeColor.button}; color: {themeColor.buttonText};" on:click={() => (showRoomModal = true)}>
			<Icon icon="solar:add-square-linear" width="15" /> New Room
		</button>
		{:else if view === 'room' && $isAuthenticated && canPost}
		<button class="flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-xs font-medium transition-transform hover:-translate-y-0.5" style="background-color: {themeColor.button}; color: {themeColor.buttonText};" on:click={() => (showComposer = true)}>
			<Icon icon="solar:pen-new-square-linear" width="15" /> Add Post
		</button>
		{/if}
	</div>

	<!-- Stats (rooms view only) -->
	{#if view === 'rooms' && enabled}
	<div class="mb-6 grid grid-cols-3 gap-3">
		{#each [
			{ label: 'Members', value: stats.activeUsers, icon: 'solar:users-group-rounded-linear' },
			{ label: 'Posts', value: stats.totalPosts, icon: 'solar:chat-square-like-linear' },
			{ label: 'Rooms', value: stats.chatRooms, icon: 'solar:chat-round-dots-linear' }
		] as s}
		<div class="rounded-2xl p-4 transition-shadow hover:shadow-md" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
			<div class="mb-1 flex items-center gap-1.5" style="color: {themeColor.button};"><Icon icon={s.icon} width="16" /></div>
			<p class="text-xl font-bold" style="color: {themeColor.text};">{s.value}</p>
			<p class="text-xs" style="color: {themeColor.lightText};">{s.label}</p>
		</div>
		{/each}
	</div>
	{/if}

	{#if loading}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#each [1, 2, 3, 4] as _}<div class="h-32 animate-pulse rounded-2xl" style="background-color: {themeColor.cover};"></div>{/each}
	</div>

	{:else if !enabled || !community}
	<div class="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl" style="background-color: {themeColor.cover};">
		<span class="text-3xl">🔒</span>
		<p class="text-sm" style="color: {themeColor.lightText};">Community is not enabled for this event.</p>
	</div>

	<!-- ROOMS GRID ------------------------------------------------------------->
	{:else if view === 'rooms'}
		{#if rooms.length === 0}
		<div class="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl" style="background-color: {themeColor.cover};">
			<span class="text-3xl">🏗️</span>
			<p class="text-sm" style="color: {themeColor.lightText};">No rooms yet.</p>
		</div>
		{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each rooms as room (room._id)}
			<!-- No `overflow-hidden`: the emoji chip overhangs the cover's bottom edge
			     (same pattern as the community banner) so it's never clipped/covered.
			     Corners are rounded on the cover (top) and body (bottom) instead. -->
			<div class="group relative flex flex-col rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
				{#if room.coverImageUrl}
				<img src={room.coverImageUrl} alt={room.name} class="h-24 w-full rounded-t-2xl object-cover" />
				{:else}
				<div class="h-24 w-full rounded-t-2xl" style="background: linear-gradient(135deg, {themeColor.button}, {themeColor.toggle}); opacity:0.85;"></div>
				{/if}
				<!-- Overhanging room icon — absolute so it paints above the cover. -->
				<div class="absolute left-4 top-[4.5rem] z-10 flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-md" style="background-color: {themeColor.bg}; border: 2px solid {themeColor.cover};">{room.emoji ?? '💬'}</div>
				<button class="flex flex-1 flex-col rounded-b-2xl p-4 pt-7 text-left" on:click={() => openRoom(room)}>
					<div class="flex items-center gap-2">
						<h3 class="text-sm font-semibold" style="color: {themeColor.text};">{room.name}</h3>
						{#if room.isDefault}<span class="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">Default</span>{/if}
					</div>
					{#if room.description}<p class="mt-1 line-clamp-2 text-xs" style="color: {themeColor.lightText};">{room.description}</p>{/if}
					<div class="mt-3 flex items-center gap-1.5 text-xs" style="color: {themeColor.lightText};">
						<Icon icon="solar:chat-square-like-linear" width="14" /> {room.postCount} {room.postCount === 1 ? 'post' : 'posts'}
					</div>
				</button>
				{#if isOrganizer && !room.isDefault}
				<button title="Delete room" class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100" on:click|stopPropagation={() => removeRoom(room)}>
					<Icon icon="solar:trash-bin-trash-linear" width="14" />
				</button>
				{/if}
			</div>
			{/each}
		</div>
		{/if}

	<!-- ROOM POSTS ------------------------------------------------------------->
	{:else if view === 'room'}
		{#if postsLoading}
		<div class="space-y-4 animate-pulse">{#each [1, 2, 3] as _}<div class="h-32 rounded-2xl" style="background-color: {themeColor.cover};"></div>{/each}</div>
		{:else if roomPosts.length === 0}
		<div class="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl" style="background-color: {themeColor.cover};">
			<span class="text-3xl">💬</span>
			<p class="text-sm" style="color: {themeColor.lightText};">No posts yet. Be the first to start a conversation!</p>
		</div>
		{:else}
		<div class="flex flex-col gap-4">
			{#each roomPosts as post (post._id)}
			<button class="overflow-hidden rounded-2xl text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style="background-color: {themeColor.cover}; border: 1px solid {post.pinned ? themeColor.button : themeColor.toggle};" on:click={() => openPost(post)}>
				{#if post.mediaUrl}<img src={post.mediaUrl} alt={post.title} class="h-40 w-full object-cover" />{/if}
				<div class="p-4">
					<div class="mb-3 flex items-center justify-between">
						<div class="flex items-center gap-2">
							{#if post.authorAvatar}<img src={post.authorAvatar} alt={post.authorName} class="h-8 w-8 rounded-full object-cover" />
							{:else}<div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style="background: linear-gradient(135deg, {themeColor.button}, {themeColor.toggle}); color: {themeColor.buttonText};">{(post.authorName ?? 'U').charAt(0).toUpperCase()}</div>{/if}
							<div>
								<p class="text-xs font-semibold" style="color: {themeColor.text};">{post.authorName}</p>
								<p class="text-xs" style="color: {themeColor.lightText};">{formatTimeAgo(post.createdAt)}</p>
							</div>
						</div>
						{#if post.pinned}<span class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.button};"><Icon icon="solar:pin-bold" width="11" /> Pinned</span>{/if}
					</div>
					<h3 class="mb-1 text-sm font-semibold leading-snug" style="color: {themeColor.text};">{post.title}</h3>
					{#if post.content}<p class="mb-3 line-clamp-2 text-xs leading-relaxed" style="color: {themeColor.lightText};">{stripHtml(post.content)}</p>{/if}
					<div class="flex items-center gap-4 border-t pt-3" style="border-color: {themeColor.toggle};">
						<span class="flex items-center gap-1.5 text-xs" style="color: {hasLiked(post) ? themeColor.button : themeColor.lightText};"><Icon icon={hasLiked(post) ? 'solar:heart-bold' : 'solar:heart-linear'} width="15" /> {(post.likes ?? []).length}</span>
						<span class="flex items-center gap-1.5 text-xs" style="color: {themeColor.lightText};"><Icon icon="solar:chat-round-line-linear" width="15" /> {post.commentCount ?? 0}</span>
					</div>
				</div>
			</button>
			{/each}
		</div>
		{/if}

	<!-- POST DETAIL ------------------------------------------------------------>
	{:else if view === 'post' && selectedPost}
	<div class="overflow-hidden rounded-2xl" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
		{#if selectedPost.mediaUrl}<img src={selectedPost.mediaUrl} alt={selectedPost.title} class="max-h-80 w-full object-cover" />{/if}
		<div class="p-5">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					{#if selectedPost.authorAvatar}<img src={selectedPost.authorAvatar} alt={selectedPost.authorName} class="h-9 w-9 rounded-full object-cover" />
					{:else}<div class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style="background: linear-gradient(135deg, {themeColor.button}, {themeColor.toggle}); color: {themeColor.buttonText};">{(selectedPost.authorName ?? 'U').charAt(0).toUpperCase()}</div>{/if}
					<div>
						<p class="text-sm font-semibold" style="color: {themeColor.text};">{selectedPost.authorName}</p>
						<p class="text-xs" style="color: {themeColor.lightText};">{formatTimeAgo(selectedPost.createdAt)}</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					{#if isOrganizer}<button title="Pin" style="color: {selectedPost.pinned ? themeColor.button : themeColor.lightText};" on:click={() => pin(selectedPost)}><Icon icon={selectedPost.pinned ? 'solar:pin-bold' : 'solar:pin-linear'} width="16" /></button>{/if}
					{#if isOrganizer || selectedPost.authorId === currentUserId}<button title="Delete" style="color: {themeColor.lightText};" on:click={() => removePost(selectedPost)}><Icon icon="solar:trash-bin-trash-linear" width="16" /></button>{/if}
				</div>
			</div>

			<h2 class="mb-3 text-xl font-bold" style="color: {themeColor.text};">{selectedPost.title}</h2>
			{#if selectedPost.content}
				{#if isHtml(selectedPost.content)}
				<div class="post-content text-sm leading-relaxed" style="color: {themeColor.text};">{@html selectedPost.content}</div>
				{:else}
				<div class="whitespace-pre-wrap text-sm leading-relaxed" style="color: {themeColor.text};">{selectedPost.content}</div>
				{/if}
			{/if}

			<div class="mt-5 flex items-center gap-4 border-t pt-4" style="border-color: {themeColor.toggle};">
				{#if canReact}
				<button class="flex items-center gap-1.5 text-sm disabled:opacity-40" style="color: {hasLiked(selectedPost) ? themeColor.button : themeColor.lightText};" on:click={() => like(selectedPost)} disabled={!$isAuthenticated}>
					<Icon icon={hasLiked(selectedPost) ? 'solar:heart-bold' : 'solar:heart-linear'} width="17" /> {(selectedPost.likes ?? []).length}
				</button>
				{/if}
				<span class="flex items-center gap-1.5 text-sm" style="color: {themeColor.lightText};"><Icon icon="solar:chat-round-line-linear" width="17" /> {selectedPost.commentCount ?? 0} comments</span>
			</div>
		</div>
	</div>

	<!-- Comments -->
	<div class="mt-4 rounded-2xl p-5" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
		<h3 class="mb-4 text-sm font-semibold" style="color: {themeColor.text};">Comments</h3>

		{#if $isAuthenticated && canComment}
		<div class="mb-5 flex items-center gap-2">
			<input bind:value={commentDraft} placeholder="Write a comment…" class="flex-1 rounded-full border px-4 py-2 text-sm outline-none" style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text};" on:keydown={(e) => e.key === 'Enter' && submitComment()} />
			<button class="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50" style="background-color: {themeColor.button}; color: {themeColor.buttonText};" on:click={submitComment} disabled={commentBusy || !commentDraft.trim()}>Send</button>
		</div>
		{:else if !canComment}
		<p class="mb-4 text-xs italic" style="color: {themeColor.lightText};">Commenting is turned off by the organizer.</p>
		{/if}

		{#if commentsLoading}
		<div class="space-y-3 animate-pulse">{#each [1, 2] as _}<div class="h-12 rounded-xl" style="background-color: {themeColor.bg};"></div>{/each}</div>
		{:else if comments.length === 0}
		<p class="text-xs" style="color: {themeColor.lightText};">No comments yet. Be the first!</p>
		{:else}
		<div class="space-y-3">
			{#each comments as c (c._id)}
			<div class="flex items-start gap-2">
				{#if c.authorAvatar}<img src={c.authorAvatar} alt={c.authorName} class="h-7 w-7 rounded-full object-cover" />
				{:else}<div class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold" style="background-color: {themeColor.smallCover}; color: {themeColor.text};">{(c.authorName ?? 'U').charAt(0).toUpperCase()}</div>{/if}
				<div class="flex-1 rounded-xl px-3 py-2" style="background-color: {themeColor.bg};">
					<p class="text-xs font-semibold" style="color: {themeColor.text};">{c.authorName} <span class="font-normal" style="color: {themeColor.lightText};">· {formatTimeAgo(c.createdAt)}</span></p>
					<p class="text-sm" style="color: {themeColor.lightText};">{c.content}</p>
				</div>
			</div>
			{/each}
		</div>
		{/if}
	</div>
	{/if}
</div>

<!-- Post composer modal -->
<PostComposerModal
	bind:this={composer}
	bind:open={showComposer}
	{eventId}
	roomName={selectedRoom?.name ?? ''}
	{themeColor}
	submitting={composerSubmitting}
	on:submit={submitPost}
	on:close={() => (showComposer = false)}
/>

<!-- Create room modal -->
{#if showRoomModal}
<div class="fixed inset-0 z-[999] flex items-center justify-center p-4">
	<button class="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Close" on:click={() => (showRoomModal = false)}></button>
	<div class="relative z-10 w-full max-w-md rounded-2xl p-5 shadow-2xl" style="background-color: {themeColor.bg};">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-base font-semibold" style="color: {themeColor.text};">New Room</h2>
			<button class="flex h-8 w-8 items-center justify-center rounded-full" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};" on:click={() => (showRoomModal = false)}><Icon icon="mdi:close" width="18" /></button>
		</div>
		<div class="flex items-center gap-2">
			<input bind:value={roomEmoji} maxlength="2" class="w-14 rounded-lg border px-3 py-2.5 text-center text-lg outline-none" style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};" />
			<input bind:value={roomName} placeholder="Room name" maxlength="60" class="flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none" style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};" />
		</div>
		<textarea bind:value={roomDesc} placeholder="What's this room about? (optional)" rows="2" class="mt-3 w-full resize-none rounded-lg border px-4 py-2.5 text-sm outline-none" style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text};"></textarea>
		<div class="mt-4 flex justify-end gap-2">
			<button class="rounded-lg px-4 py-2 text-sm" style="color: {themeColor.lightText};" on:click={() => (showRoomModal = false)}>Cancel</button>
			<button class="rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50" style="background-color: {themeColor.button}; color: {themeColor.buttonText};" on:click={createRoom} disabled={roomBusy || !roomName.trim()}>{roomBusy ? 'Creating…' : 'Create Room'}</button>
		</div>
	</div>
</div>
{/if}

<style>
	:global(.post-content h1) { font-size: 1.4rem; font-weight: 700; margin: 0.6rem 0 0.4rem; }
	:global(.post-content h2) { font-size: 1.15rem; font-weight: 600; margin: 0.5rem 0 0.3rem; }
	:global(.post-content p) { margin-bottom: 0.6rem; }
	:global(.post-content ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.6rem; }
	:global(.post-content ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.6rem; }
	:global(.post-content blockquote) { border-left: 3px solid currentColor; opacity: 0.85; padding-left: 0.75rem; margin: 0.5rem 0; }
	:global(.post-content a) { color: #7c3aed; text-decoration: underline; }
	:global(.post-content img) { max-width: 100%; height: auto; border-radius: 0.6rem; margin: 0.6rem 0; display: block; }
</style>
