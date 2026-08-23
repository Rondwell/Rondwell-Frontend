<!--
	GAP 10 — the public Memories tab.

	Unlike Gifts, this page is NOT open to everyone by default. The feed is
	gated server-side: when the organizer left `visibility` at the default
	(ATTENDEES_ONLY) only people who actually attended can read it, and the
	server answers 403 with a code rather than quietly returning an empty
	grid. Both states are rendered honestly here — an empty gallery and "you
	weren't at this event" are different messages and must not look the same.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import MediaViewer from '$lib/components/MediaViewer.svelte';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import { colors, type Color } from '$lib/utils/colors';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import {
		getMemories,
		likeMemory,
		memoryErrorCopy,
		reportMemory,
		uploadMemory,
		deleteMemory,
		type Memory
	} from '$lib/services/memories.services';

	$: eventId = $page.params.id ?? '';
	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	let memories: Memory[] = [];
	let loading = true;
	/** Set when the server refuses the feed — carries WHY, not just "no". */
	let gate: { message: string; code: string } | null = null;

	let uploading = false;
	let uploadError = '';
	let uploadNotice = '';
	let fileInput: HTMLInputElement;

	let viewerOpen = false;
	let viewerIndex = 0;

	$: viewerItems = memories.map((m) => ({ url: m.url, type: m.type, title: m.title }));

	async function load() {
		loading = true;
		gate = null;
		try {
			const res = await fetchFeed();
			memories = res;
		} finally {
			loading = false;
		}
	}

	/**
	 * The service swallows non-OK responses into an empty list, which is right
	 * for a grid but wrong here — a 403 has to be told apart from "no photos
	 * yet". So the gate is probed directly and the service is used for the
	 * happy path.
	 */
	async function fetchFeed(): Promise<Memory[]> {
		const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;
		const token = localStorage.getItem('auth_token');
		try {
			const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/memories?limit=100`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {}
			});
			if (res.status === 403 || res.status === 401) {
				const body = await res.json().catch(() => ({}));
				gate = {
					message: body?.message ?? 'These photos are only shared with the people who were there.',
					code: body?.code ?? 'ATTENDEES_ONLY'
				};
				return [];
			}
			if (!res.ok) return [];
			const json = await res.json();
			return json?.data ?? [];
		} catch {
			// A network failure is not a permission answer — fall back to the
			// service, which returns an empty list rather than a false 403.
			const fallback = await getMemories(eventId, { limit: 100 });
			return fallback.data;
		}
	}

	onMount(load);

	async function handleFiles(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length === 0) return;

		uploading = true;
		uploadError = '';
		uploadNotice = '';
		let uploaded = 0;
		let pendingApproval = false;

		// Sequential, not parallel: the server caps uploads per attendee, and a
		// parallel burst would race past the cap check and then fail some of
		// them halfway through with no clear message.
		for (const file of files) {
			try {
				const res = await uploadMemory(eventId, file);
				uploaded++;
				pendingApproval = pendingApproval || res.pendingApproval;
			} catch (err) {
				uploadError = memoryErrorCopy(err);
				break;
			}
		}

		if (uploaded > 0) {
			uploadNotice = pendingApproval
				? `Thanks! ${uploaded} photo${uploaded === 1 ? '' : 's'} sent — the host will review ${uploaded === 1 ? 'it' : 'them'} shortly.`
				: `Added ${uploaded} photo${uploaded === 1 ? '' : 's'} 🎉`;
			await load();
		}

		uploading = false;
		input.value = '';
	}

	async function toggleLike(memory: Memory) {
		try {
			const res = await likeMemory(eventId, memory.id);
			memories = memories.map((m) =>
				m.id === memory.id ? { ...m, likedByMe: res.liked, likeCount: res.likeCount } : m
			);
		} catch (err) {
			uploadError = memoryErrorCopy(err, 'Could not like this photo.');
		}
	}

	async function report(memory: Memory) {
		if (!confirm('Report this photo to the host?')) return;
		try {
			const res = await reportMemory(eventId, memory.id);
			uploadNotice = res.alreadyReported
				? 'You already reported this photo.'
				: 'Thanks — the host has been notified.';
			if (res.hidden) await load();
		} catch (err) {
			uploadError = memoryErrorCopy(err, 'Could not report this photo.');
		}
	}

	async function removeMine(memory: Memory) {
		if (!confirm('Remove your photo?')) return;
		try {
			await deleteMemory(eventId, memory.id);
			memories = memories.filter((m) => m.id !== memory.id);
		} catch (err) {
			uploadError = memoryErrorCopy(err, 'Could not remove the photo.');
		}
	}
</script>

<svelte:head>
	<title>Memories · Rondwell</title>
</svelte:head>

<div>
	<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-xl font-semibold" style="color: {themeColor.text};">Memories</h2>
			<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
				Photos from the people who were there.
			</p>
		</div>

		{#if !gate && $isAuthenticated}
			<button
				on:click={() => fileInput?.click()}
				disabled={uploading}
				class="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
			>
				<Icon icon={uploading ? 'mdi:loading' : 'mdi:camera-plus-outline'} class="h-4 w-4 {uploading ? 'animate-spin' : ''}" />
				{uploading ? 'Adding…' : 'Add your photos'}
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*,video/*"
				multiple
				class="hidden"
				on:change={handleFiles}
			/>
		{/if}
	</div>

	{#if uploadNotice}
		<div
			class="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
			style="background-color: {themeColor.cover}; color: {themeColor.text};"
		>
			<Icon icon="mdi:check-circle-outline" class="h-4 w-4 flex-shrink-0" />
			<span>{uploadNotice}</span>
		</div>
	{/if}
	{#if uploadError}
		<div class="mb-4 flex items-start gap-2 rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#D92D20]">
			<Icon icon="mdi:alert-circle-outline" class="mt-0.5 h-4 w-4 flex-shrink-0" />
			<span>{uploadError}</span>
		</div>
	{/if}

	{#if loading}
		<div class="columns-2 gap-3 sm:columns-3 lg:columns-4">
			{#each Array(8) as _}
				<div
					class="mb-3 h-40 animate-pulse rounded-2xl"
					style="background-color: {themeColor.cover};"
				></div>
			{/each}
		</div>
	{:else if gate}
		<!-- Not an error: a deliberate privacy decision by the host, explained. -->
		<div
			class="rounded-2xl p-10 text-center"
			style="background-color: {themeColor.cover};"
		>
			<div
				class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
				style="background-color: {themeColor.smallCover};"
			>
				<Icon icon="mdi:lock-outline" class="h-7 w-7" style="color: {themeColor.text};" />
			</div>
			<h3 class="mb-1 text-lg font-semibold" style="color: {themeColor.text};">
				{gate.code === 'MEMORIES_DISABLED' ? 'No shared photos here' : 'Guests only'}
			</h3>
			<p class="mx-auto max-w-sm text-sm" style="color: {themeColor.lightText};">
				{gate.message}
			</p>
			{#if gate.code === 'ATTENDEES_ONLY' || gate.code === 'AUTH_REQUIRED'}
				<a
					href="/event-page/{eventId}"
					class="mt-5 inline-flex rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90"
					style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
				>
					{gate.code === 'AUTH_REQUIRED' ? 'Sign in' : 'Register for this event'}
				</a>
			{/if}
		</div>
	{:else if memories.length === 0}
		<div class="rounded-2xl p-10 text-center" style="background-color: {themeColor.cover};">
			<div
				class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
				style="background-color: {themeColor.smallCover};"
			>
				<Icon icon="mdi:camera-outline" class="h-7 w-7" style="color: {themeColor.text};" />
			</div>
			<h3 class="mb-1 text-lg font-semibold" style="color: {themeColor.text};">
				Be the first to share a memory
			</h3>
			<p class="mx-auto max-w-sm text-sm" style="color: {themeColor.lightText};">
				Got photos from the day? Add them here so everyone gets the moments they missed.
			</p>
		</div>
	{:else}
		<!-- Masonry via CSS columns — no JS layout pass, and it reflows for free. -->
		<div class="columns-2 gap-3 sm:columns-3 lg:columns-4">
			{#each memories as memory, i (memory.id)}
				<div class="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl">
					<button
						class="block w-full"
						on:click={() => {
							viewerIndex = i;
							viewerOpen = true;
						}}
					>
						{#if memory.type === 'VIDEO'}
							<div
								class="flex h-40 w-full items-center justify-center"
								style="background-color: {themeColor.smallCover};"
							>
								<Icon icon="mdi:play-circle-outline" class="h-10 w-10" style="color: {themeColor.text};" />
							</div>
						{:else}
							<img
								src={memory.thumbnailUrl || memory.url}
								alt={memory.title || `Photo by ${memory.uploaderName}`}
								class="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
								loading="lazy"
							/>
						{/if}
					</button>

					{#if memory.moderationStatus === 'PENDING'}
						<!-- Only the uploader ever sees this — the feed hides other
						     people's pending items server-side. -->
						<span class="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
							Awaiting review
						</span>
					{/if}

					<div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
						<div class="pointer-events-auto flex items-center gap-2">
							{#if memory.uploaderAvatarUrl}
								<img src={memory.uploaderAvatarUrl} alt="" class="h-6 w-6 rounded-full object-cover" />
							{:else}
								<span class="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[10px] font-medium text-white">
									{(memory.uploaderName || 'G').charAt(0).toUpperCase()}
								</span>
							{/if}
							<span class="flex-1 truncate text-xs font-medium text-white">{memory.uploaderName}</span>

							<button
								on:click|stopPropagation={() => toggleLike(memory)}
								class="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] text-white backdrop-blur-sm transition-colors hover:bg-white/30"
								aria-label="Like"
							>
								<Icon
									icon={memory.likedByMe ? 'mdi:heart' : 'mdi:heart-outline'}
									class="h-3.5 w-3.5 {memory.likedByMe ? 'text-[#FF4D6D]' : ''}"
								/>
								{memory.likeCount || ''}
							</button>

							{#if memory.isMine}
								<button
									on:click|stopPropagation={() => removeMine(memory)}
									class="rounded-full bg-white/20 p-1 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
									aria-label="Remove my photo"
								>
									<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" />
								</button>
							{:else}
								<button
									on:click|stopPropagation={() => report(memory)}
									class="rounded-full bg-white/20 p-1 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-white/30 group-hover:opacity-100"
									aria-label="Report this photo"
								>
									<Icon icon="mdi:flag-outline" class="h-3.5 w-3.5" />
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<MediaViewer
	bind:open={viewerOpen}
	bind:index={viewerIndex}
	items={viewerItems}
	theme={themeColor}
	on:close={() => (viewerOpen = false)}
/>
