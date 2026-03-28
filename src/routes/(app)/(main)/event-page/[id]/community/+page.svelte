<script lang="ts">
	import { page } from '$app/stores';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import { onMount } from 'svelte';

	$: eventId = $page.params.id ?? '';
	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

	let community: any = null;
	let posts: any[] = [];
	let loading = true;
	let showNewThread = false;
	let newThreadTitle = '';
	let newThreadContent = '';
	let submitting = false;

	let likedPosts: Set<string> = new Set();

	onMount(async () => {
		if (!eventId) return;
		try {
			const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/community`);
			if (res.ok) {
				const data = await res.json();
				community = data.community ?? data;
				posts = data.posts ?? data.threads ?? [];
			}
		} catch { /* community not enabled */ }
		finally { loading = false; }
	});

	function toggleLike(id: string) {
		if (likedPosts.has(id)) likedPosts.delete(id);
		else likedPosts.add(id);
		likedPosts = new Set(likedPosts);
	}

	function formatTimeAgo(dateStr: string): string {
		if (!dateStr) return '';
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<div class="w-full max-w-4xl">
	<!-- Banner -->
	<div class="relative mb-16 overflow-hidden rounded-2xl">
		<div class="h-36 w-full rounded-2xl" style="background: linear-gradient(135deg, {themeColor.button}, {themeColor.toggle});"></div>
		<div
			class="absolute -bottom-10 left-5 flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
			style="background-color: {themeColor.cover}; border: 2px solid {themeColor.toggle};"
		>
			<span class="text-3xl">💬</span>
		</div>
	</div>

	<!-- Header -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold" style="color: {themeColor.text};">Community</h1>
			<p class="mt-1 text-sm" style="color: {themeColor.lightText};">Share, discuss, and connect with other attendees</p>
		</div>
		{#if $isAuthenticated}
		<button
			class="flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-xs font-medium transition-colors"
			style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
			on:click={() => showNewThread = !showNewThread}
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 18 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
			Start Thread
		</button>
		{/if}
	</div>

	<!-- New Thread Form -->
	{#if showNewThread}
	<div class="mb-6 rounded-2xl p-5" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
		<input
			bind:value={newThreadTitle}
			placeholder="Thread title..."
			class="mb-3 w-full rounded-lg border px-4 py-2.5 text-sm"
			style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text};"
		/>
		<textarea
			bind:value={newThreadContent}
			placeholder="What's on your mind?"
			rows="3"
			class="mb-3 w-full resize-none rounded-lg border px-4 py-2.5 text-sm"
			style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text};"
		></textarea>
		<div class="flex gap-2">
			<button
				class="rounded-lg px-4 py-2 text-sm font-medium"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
				disabled={submitting || !newThreadTitle.trim()}
			>
				Post
			</button>
			<button
				class="rounded-lg px-4 py-2 text-sm"
				style="color: {themeColor.lightText};"
				on:click={() => showNewThread = false}
			>
				Cancel
			</button>
		</div>
	</div>
	{/if}

	{#if loading}
	<div class="space-y-4 animate-pulse">
		{#each [1, 2, 3] as _}
		<div class="h-48 rounded-2xl" style="background-color: {themeColor.cover};"></div>
		{/each}
	</div>

	{:else if !community}
	<div class="flex h-40 items-center justify-center rounded-2xl" style="background-color: {themeColor.cover};">
		<p class="text-sm" style="color: {themeColor.lightText};">Community is not enabled for this event.</p>
	</div>

	{:else if posts.length === 0}
	<div class="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl" style="background-color: {themeColor.cover};">
		<span class="text-3xl">💬</span>
		<p class="text-sm" style="color: {themeColor.lightText};">No posts yet. Be the first to start a conversation!</p>
	</div>

	{:else}
	<div class="flex flex-col gap-4">
		{#each posts as post}
		{@const postId = post._id ?? post.id ?? String(Math.random())}
		<div class="overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
			style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
			{#if post.image || post.mediaUrl}
			<img src={post.image ?? post.mediaUrl} alt={post.title} class="h-44 w-full object-cover" />
			{/if}
			<div class="p-4">
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style="background-color: {themeColor.smallCover}; color: {themeColor.text};">
							{(post.authorName ?? post.author ?? 'U').charAt(0)}
						</div>
						<div>
							<p class="text-xs font-semibold" style="color: {themeColor.text};">{post.authorName ?? post.author ?? 'User'}</p>
							<p class="text-xs" style="color: {themeColor.lightText};">{formatTimeAgo(post.createdAt)}</p>
						</div>
					</div>
					{#if post.pinned}
					<span class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style="background-color: {themeColor.smallCover}; color: {themeColor.lightText};">
						⭐ Pinned
					</span>
					{/if}
				</div>
				<h3 class="mb-2 text-sm font-semibold leading-snug" style="color: {themeColor.text};">{post.title}</h3>
				{#if post.content ?? post.description}
				<p class="mb-3 text-xs leading-relaxed" style="color: {themeColor.lightText};">{post.content ?? post.description}</p>
				{/if}
				<div class="flex items-center gap-4 border-t pt-3" style="border-color: {themeColor.toggle};">
					<button
						class="flex items-center gap-1.5 text-xs transition-colors"
						style="color: {likedPosts.has(postId) ? themeColor.button : themeColor.lightText};"
						on:click={() => toggleLike(postId)}
					>
						❤️ {(post.likes ?? 0) + (likedPosts.has(postId) ? 1 : 0)}
					</button>
					<span class="flex items-center gap-1.5 text-xs" style="color: {themeColor.lightText};">
						💬 {post.comments ?? post.commentCount ?? 0} comments
					</span>
				</div>
			</div>
		</div>
		{/each}
	</div>
	{/if}
</div>
