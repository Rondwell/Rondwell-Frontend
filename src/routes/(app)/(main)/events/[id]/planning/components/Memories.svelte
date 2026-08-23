<script lang="ts">
	/**
	 * GAP 10 — the Memories moderation panel.
	 *
	 * Lives inside Media rather than as its own tab, because "curated media"
	 * and "candid guest photos" are the same job to an organizer even though
	 * they are different trust boundaries underneath.
	 *
	 * The settings block writes the `memories` sub-document. Two of those
	 * settings are genuinely consequential and are labelled as such rather
	 * than left as bare switches:
	 *
	 *   - `visibility: PUBLIC` puts photographs of real guests on a page
	 *     anyone can open. It is not the default and the copy says why.
	 *   - `requireApproval` is what stands between an upload and that page.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import MediaViewer from '$lib/components/MediaViewer.svelte';
	import { colors } from '$lib/utils/colors';
	import { invalidateEventCache } from '$lib/stores/eventCache.store';
	import { updateEvent } from '$lib/services/event.services';
	import {
		bulkModerateMemories,
		deleteMemory,
		getMemoriesStats,
		getModerationQueue,
		moderateMemory,
		type Memory
	} from '$lib/services/memories.services';

	export let eventData: any = null;

	$: eventId = $page.params.id ?? '';
	$: memories = eventData?.memories ?? {};
	$: enabled = memories.enabled === true;

	let loading = true;
	let error = '';
	let notice = '';
	let savingSettings = false;

	let pending: Memory[] = [];
	let reported: Memory[] = [];
	let stats = { photoCount: 0, pendingCount: 0, reportedCount: 0, contributorCount: 0 };
	let queueTab: 'pending' | 'reported' = 'pending';
	let selected = new Set<string>();
	let showSettings = false;

	let viewerOpen = false;
	let viewerIndex = 0;

	$: queue = queueTab === 'pending' ? pending : reported;
	$: viewerItems = queue.map((m) => ({ url: m.url, type: m.type, title: m.title }));

	async function load() {
		if (!eventId || !enabled) {
			loading = false;
			return;
		}
		loading = true;
		try {
			const [q, s] = await Promise.all([getModerationQueue(eventId), getMemoriesStats(eventId)]);
			pending = q.pending;
			reported = q.reported;
			stats = s;
		} catch (e: any) {
			error = e?.message ?? 'Could not load the moderation queue';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	/**
	 * Re-run when the organizer switches the feature on from the settings
	 * block. Guarded on `loadedFor` so this does NOT fire a second, racing
	 * fetch alongside `onMount` — a bare reactive statement here would run on
	 * first render too and the two responses could land out of order.
	 */
	let loadedFor = '';
	$: if (enabled && eventId && loadedFor !== eventId) {
		loadedFor = eventId;
		void load();
	}

	function toggleSelect(id: string) {
		// Reassigned, not mutated — a Set mutation alone doesn't retrigger Svelte.
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	async function act(memory: Memory, action: 'approve' | 'hide') {
		error = '';
		try {
			await moderateMemory(eventId, memory.id, action);
			notice = action === 'approve' ? 'Photo approved' : 'Photo hidden';
			await load();
		} catch (e: any) {
			error = e?.message ?? `Could not ${action} the photo`;
		}
	}

	async function remove(memory: Memory) {
		if (!confirm('Delete this photo permanently? The guest will not be told.')) return;
		try {
			await deleteMemory(eventId, memory.id);
			notice = 'Photo deleted';
			await load();
		} catch (e: any) {
			error = e?.message ?? 'Could not delete the photo';
		}
	}

	async function bulk(action: 'APPROVE' | 'HIDE') {
		if (selected.size === 0) return;
		try {
			const n = await bulkModerateMemories(eventId, [...selected], action);
			selected = new Set();
			notice = `${n} photo${n === 1 ? '' : 's'} ${action === 'APPROVE' ? 'approved' : 'hidden'}`;
			await load();
		} catch (e: any) {
			error = e?.message ?? 'Bulk moderation failed';
		}
	}

	/**
	 * Settings are PATCHed as a whole sub-document.
	 *
	 * Sending only the changed key would work today, but the server normalises
	 * this block as a unit, and a partial write is how a half-set config ends
	 * up with an undefined cap.
	 */
	async function saveSettings(patch: Record<string, any>) {
		savingSettings = true;
		error = '';
		try {
			const next = { ...memories, ...patch };
			await updateEvent(eventId, { memories: next } as any);
			invalidateEventCache(eventId);
			eventData = { ...(eventData ?? {}), memories: next };
			notice = 'Memory settings saved';
		} catch (e: any) {
			error = e?.message ?? 'Could not save the settings';
		} finally {
			savingSettings = false;
		}
	}
</script>

<div class="mt-10 border-t border-[#EBECED] pt-8">
	<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="flex items-center gap-2 text-xl font-semibold text-[#131517]">
				📸 Memories
				{#if stats.pendingCount > 0}
					<span class="rounded-full bg-[#FFF4E5] px-2 py-0.5 text-xs font-medium text-[#B26A00]">
						{stats.pendingCount} waiting
					</span>
				{/if}
			</h2>
			<p class="mt-1 text-sm text-[#83808D]">
				Photos your guests shared. Separate from the media you curate above.
			</p>
		</div>
		<button
			on:click={() => (showSettings = !showSettings)}
			class="flex items-center gap-1.5 rounded-lg border border-[#EBECED] px-3 py-2 text-sm font-medium text-[#5D646F] transition-colors hover:bg-[#F7F7F8]"
		>
			<Icon icon="mdi:cog-outline" class="h-4 w-4" />
			Settings
		</button>
	</div>

	{#if notice}
		<div class="mb-4 flex items-center gap-2 rounded-lg bg-[#E3F4E1] px-4 py-3 text-sm text-[#2E7D22]">
			<Icon icon="mdi:check-circle-outline" class="h-4 w-4 flex-shrink-0" />
			<span>{notice}</span>
			<button class="ml-auto opacity-70 hover:opacity-100" on:click={() => (notice = '')} aria-label="Dismiss">
				<Icon icon="mdi:close" class="h-4 w-4" />
			</button>
		</div>
	{/if}
	{#if error}
		<div class="mb-4 flex items-start gap-2 rounded-lg bg-[#FDECEC] px-4 py-3 text-sm text-[#D92D20]">
			<Icon icon="mdi:alert-circle-outline" class="mt-0.5 h-4 w-4 flex-shrink-0" />
			<span>{error}</span>
			<button class="ml-auto opacity-70 hover:opacity-100" on:click={() => (error = '')} aria-label="Dismiss">
				<Icon icon="mdi:close" class="h-4 w-4" />
			</button>
		</div>
	{/if}

	{#if showSettings}
		<div class="mb-6 space-y-4 rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-5">
			<label class="flex items-start justify-between gap-4">
				<span>
					<span class="block text-sm font-medium text-[#131517]">Collect guest photos</span>
					<span class="block text-xs text-[#83808D]">
						Attendees can add photos from a Memories tab on your event page.
					</span>
				</span>
				<input
					type="checkbox"
					checked={enabled}
					disabled={savingSettings}
					on:change={(e) => saveSettings({ enabled: e.currentTarget.checked })}
					class="mt-0.5 h-5 w-5 flex-shrink-0 accent-[#F31A7C]"
				/>
			</label>

			{#if enabled}
				<label class="flex items-start justify-between gap-4 border-t border-[#F0EFF1] pt-4">
					<span>
						<span class="block text-sm font-medium text-[#131517]">Review before showing</span>
						<span class="block text-xs text-[#83808D]">
							Nothing a guest uploads appears until you approve it.
						</span>
					</span>
					<input
						type="checkbox"
						checked={memories.requireApproval === true}
						disabled={savingSettings}
						on:change={(e) => saveSettings({ requireApproval: e.currentTarget.checked })}
						class="mt-0.5 h-5 w-5 flex-shrink-0 accent-[#F31A7C]"
					/>
				</label>

				<div class="border-t border-[#F0EFF1] pt-4">
					<span class="mb-1 block text-sm font-medium text-[#131517]">Who can see them</span>
					<select
						value={memories.visibility ?? 'ATTENDEES_ONLY'}
						disabled={savingSettings}
						on:change={(e) => saveSettings({ visibility: e.currentTarget.value })}
						class="w-full rounded-lg border border-[#EBECED] px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none sm:w-72"
					>
						<option value="ATTENDEES_ONLY">Only people who attended</option>
						<option value="PUBLIC">Anyone with the event link</option>
					</select>
					{#if (memories.visibility ?? 'ATTENDEES_ONLY') === 'PUBLIC'}
						<p class="mt-2 flex items-start gap-1.5 text-xs text-[#B26A00]">
							<Icon icon="mdi:alert-outline" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
							Approved guest photos will show on your public event page. These are pictures of real
							people — make sure your guests expect that.
						</p>
					{/if}
				</div>

				<div class="border-t border-[#F0EFF1] pt-4">
					<span class="mb-1 block text-sm font-medium text-[#131517]">When guests can upload</span>
					<select
						value={memories.allowedFrom ?? 'AFTER_EVENT_START'}
						disabled={savingSettings}
						on:change={(e) => saveSettings({ allowedFrom: e.currentTarget.value })}
						class="w-full rounded-lg border border-[#EBECED] px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none sm:w-72"
					>
						<option value="AFTER_EVENT_START">Once the event starts</option>
						<option value="AFTER_CHECKIN">Only after they check in</option>
						<option value="ANY_TIME">Any time</option>
					</select>
				</div>

				<label class="block border-t border-[#F0EFF1] pt-4">
					<span class="mb-1 block text-sm font-medium text-[#131517]">Photos per guest</span>
					<input
						type="number"
						min="1"
						max="200"
						value={memories.maxUploadsPerAttendee ?? 20}
						disabled={savingSettings}
						on:change={(e) => saveSettings({ maxUploadsPerAttendee: Number(e.currentTarget.value) })}
						class="w-32 rounded-lg border border-[#EBECED] px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none"
					/>
				</label>
			{/if}
		</div>
	{/if}

	{#if !enabled}
		<div class="rounded-xl border border-dashed border-[#EBECED] p-8 text-center">
			<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F8]">
				<Icon icon="mdi:camera-outline" class="h-6 w-6 text-[#83808D]" />
			</div>
			<p class="mb-1 text-sm font-medium text-[#131517]">Guest photos are off</p>
			<p class="mx-auto max-w-sm text-sm text-[#83808D]">
				Turn Memories on and your attendees can add their own photos after the event — the shots
				you never got.
			</p>
		</div>
	{:else}
		<div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Shared</p>
				<p class="text-lg font-semibold text-[#131517]">{stats.photoCount}</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Contributors</p>
				<p class="text-lg font-semibold text-[#131517]">{stats.contributorCount}</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Awaiting review</p>
				<p class="text-lg font-semibold {stats.pendingCount > 0 ? 'text-[#B26A00]' : 'text-[#131517]'}">
					{stats.pendingCount}
				</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Reported</p>
				<p class="text-lg font-semibold {stats.reportedCount > 0 ? 'text-[#D92D20]' : 'text-[#131517]'}">
					{stats.reportedCount}
				</p>
			</div>
		</div>

		<div class="mb-4 flex flex-wrap items-center gap-2">
			<button
				on:click={() => {
					queueTab = 'pending';
					selected = new Set();
				}}
				class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors {queueTab === 'pending'
					? 'bg-[#131517] text-white'
					: 'bg-[#EBECED] text-[#5D646F] hover:bg-[#E4E3E6]'}"
			>
				Awaiting review ({pending.length})
			</button>
			<button
				on:click={() => {
					queueTab = 'reported';
					selected = new Set();
				}}
				class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors {queueTab === 'reported'
					? 'bg-[#131517] text-white'
					: 'bg-[#EBECED] text-[#5D646F] hover:bg-[#E4E3E6]'}"
			>
				Reported ({reported.length})
			</button>

			{#if selected.size > 0}
				<div class="ml-auto flex items-center gap-2">
					<span class="text-xs text-[#83808D]">{selected.size} selected</span>
					<button
						on:click={() => bulk('APPROVE')}
						class="rounded-lg bg-[#3CBD2C] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
					>
						Approve
					</button>
					<button
						on:click={() => bulk('HIDE')}
						class="rounded-lg border border-[#EBECED] px-3 py-1.5 text-xs font-medium text-[#5D646F] hover:bg-[#F7F7F8]"
					>
						Hide
					</button>
				</div>
			{/if}
		</div>

		{#if loading}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{#each Array(4) as _}
					<div class="aspect-square animate-pulse rounded-xl bg-[#F0EFF1]"></div>
				{/each}
			</div>
		{:else if queue.length === 0}
			<div class="rounded-xl border border-dashed border-[#EBECED] p-8 text-center">
				<p class="text-sm text-[#83808D]">
					{queueTab === 'pending'
						? stats.photoCount > 0
							? 'Nothing waiting — you are all caught up.'
							: 'No guest photos yet. They arrive once the event is under way.'
						: 'Nothing has been reported.'}
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{#each queue as memory, i (memory.id)}
					<div class="group relative overflow-hidden rounded-xl border border-[#EBECED] bg-white">
						<button
							class="block aspect-square w-full overflow-hidden bg-[#F0EFF1]"
							on:click={() => {
								viewerIndex = i;
								viewerOpen = true;
							}}
						>
							{#if memory.type === 'VIDEO'}
								<div class="flex h-full w-full items-center justify-center bg-[#131517]/90">
									<Icon icon="mdi:play-circle-outline" class="h-10 w-10 text-white" />
								</div>
							{:else}
								<img
									src={memory.thumbnailUrl || memory.url}
									alt={memory.title || 'Guest photo'}
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									loading="lazy"
								/>
							{/if}
						</button>

						<label class="absolute left-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-white/90 shadow-sm">
							<input
								type="checkbox"
								checked={selected.has(memory.id)}
								on:change={() => toggleSelect(memory.id)}
								class="h-3.5 w-3.5 accent-[#F31A7C]"
							/>
							<span class="sr-only">Select photo</span>
						</label>

						{#if memory.reportCount > 0}
							<span class="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#D92D20] px-2 py-0.5 text-[10px] font-medium text-white">
								<Icon icon="mdi:flag-outline" class="h-3 w-3" />
								{memory.reportCount}
							</span>
						{/if}

						<div class="p-2.5">
							<div class="mb-2 flex items-center gap-1.5">
								{#if memory.uploaderAvatarUrl}
									<img src={memory.uploaderAvatarUrl} alt="" class="h-5 w-5 rounded-full object-cover" />
								{:else}
									<span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#EBECED] text-[9px] font-medium text-[#5D646F]">
										{(memory.uploaderName || 'G').charAt(0).toUpperCase()}
									</span>
								{/if}
								<span class="truncate text-xs text-[#5D646F]">{memory.uploaderName}</span>
							</div>
							<div class="flex gap-1">
								<button
									on:click={() => act(memory, 'approve')}
									class="flex-1 rounded-md bg-[#E3F4E1] px-2 py-1 text-[11px] font-medium text-[#2E7D22] hover:bg-[#D4EDD0]"
								>
									Approve
								</button>
								<button
									on:click={() => act(memory, 'hide')}
									class="flex-1 rounded-md bg-[#EBECED] px-2 py-1 text-[11px] font-medium text-[#5D646F] hover:bg-[#E4E3E6]"
								>
									Hide
								</button>
								<button
									on:click={() => remove(memory)}
									class="rounded-md bg-[#FDECEC] px-2 py-1 text-[11px] font-medium text-[#D92D20] hover:bg-[#FBDCDC]"
									aria-label="Delete permanently"
								>
									<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<MediaViewer
	bind:open={viewerOpen}
	bind:index={viewerIndex}
	items={viewerItems}
	theme={colors[0]}
	on:close={() => (viewerOpen = false)}
/>
