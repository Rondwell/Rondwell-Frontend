<script lang="ts">
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast.store';
	import {
		createEventTag,
		createMemberTag,
		deleteEventTag,
		deleteMemberTag,
		getEventTags,
		getMemberTags,
		updateEventTag,
		updateMemberTag,
		type CollectionTag
	} from '$lib/services/collectionTag.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: collectionId = $page.params.id ?? '';

	const PALETTE = [
		'#DB3EC6',
		'#513BE2',
		'#EAAB26',
		'#EA2630',
		'#3CBD2C',
		'#2C9BBD',
		'#9B59B6',
		'#E67E22',
		'#1ABC9C',
		'#34495E'
	];

	let eventTags: CollectionTag[] = [];
	let memberTags: CollectionTag[] = [];
	let loadingEvent = true;
	let loadingMember = true;

	// Editor state (shared modal for create + edit of either tag type)
	let editorOpen = false;
	let editorKind: 'EVENT' | 'MEMBER' = 'EVENT';
	let editorTag: CollectionTag | null = null;
	let editorName = '';
	let editorColor = PALETTE[0];
	let editorSaving = false;
	let editorError = '';

	// Kebab menu state
	let openMenuId = '';

	async function loadEventTags() {
		loadingEvent = true;
		try {
			eventTags = await getEventTags(collectionId);
		} catch (e) {
			console.error('Failed to load event tags', e);
			eventTags = [];
		} finally {
			loadingEvent = false;
		}
	}

	async function loadMemberTags() {
		loadingMember = true;
		try {
			memberTags = await getMemberTags(collectionId);
		} catch (e) {
			console.error('Failed to load member tags', e);
			memberTags = [];
		} finally {
			loadingMember = false;
		}
	}

	onMount(() => {
		if (collectionId) {
			loadEventTags();
			loadMemberTags();
		}
	});

	function openCreate(kind: 'EVENT' | 'MEMBER') {
		editorKind = kind;
		editorTag = null;
		editorName = '';
		editorColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
		editorError = '';
		editorOpen = true;
	}

	function openEdit(kind: 'EVENT' | 'MEMBER', tag: CollectionTag) {
		editorKind = kind;
		editorTag = tag;
		editorName = tag.name;
		editorColor = tag.color || PALETTE[0];
		editorError = '';
		editorOpen = true;
		openMenuId = '';
	}

	async function saveEditor() {
		const name = editorName.trim();
		if (!name) {
			editorError = 'Tag name is required';
			return;
		}
		editorSaving = true;
		editorError = '';
		try {
			if (editorKind === 'EVENT') {
				if (editorTag) {
					await updateEventTag(collectionId, editorTag.id, { name, color: editorColor });
				} else {
					await createEventTag(collectionId, name, editorColor);
				}
				await loadEventTags();
			} else {
				if (editorTag) {
					await updateMemberTag(collectionId, editorTag.id, { name, color: editorColor });
				} else {
					await createMemberTag(collectionId, name, editorColor);
				}
				await loadMemberTags();
			}
			editorOpen = false;
			toast.success(editorTag ? 'Tag updated.' : 'Tag created.');
		} catch (e: any) {
			editorError = e?.message ?? 'Failed to save tag';
		} finally {
			editorSaving = false;
		}
	}

	async function removeTag(kind: 'EVENT' | 'MEMBER', tag: CollectionTag) {
		openMenuId = '';
		const noun = kind === 'EVENT' ? 'event tag' : 'member tag';
		if (!confirm(`Delete the "${tag.name}" ${noun}? This removes it from all associated ${kind === 'EVENT' ? 'events' : 'members'}.`)) return;
		try {
			if (kind === 'EVENT') {
				await deleteEventTag(collectionId, tag.id);
				await loadEventTags();
			} else {
				await deleteMemberTag(collectionId, tag.id);
				await loadMemberTags();
			}
			toast.success('Tag deleted.');
		} catch (e: any) {
			toast.error(e?.message ?? 'Failed to delete tag');
		}
	}
</script>

<section class="px-1 py-4 sm:p-4">
	<!-- ── Event Tags ─────────────────────────────────────────────── -->
	<div class="mb-3 flex items-center justify-between">
		<h2 class="flex items-center gap-2 text-lg font-semibold">
			<span>Event Tags</span>
			<span
				class="flex h-6 w-6 items-center justify-center rounded-full border border-black bg-[#EBECED] text-xs"
				>{eventTags.length}</span
			>
		</h2>
	</div>
	<p class="mb-4 text-sm text-[#737577]">
		Allow visitors to filter events by categories on the collection page.
	</p>

	<div class="mb-3 flex flex-col rounded-md bg-[#FDFDFD]">
		{#if loadingEvent}
			{#each [1, 2] as _}
				<div class="flex animate-pulse items-center justify-between border-b px-3 py-3 last:border-b-0">
					<div class="h-4 w-32 rounded bg-gray-200"></div>
					<div class="h-4 w-16 rounded bg-gray-200"></div>
				</div>
			{/each}
		{:else if eventTags.length === 0}
			<div class="flex flex-col items-center justify-center gap-1 px-3 py-8 text-center">
				<Icon icon="mdi:tag-multiple-outline" class="text-3xl text-gray-300" />
				<p class="text-sm text-gray-400">No event tags yet.</p>
			</div>
		{:else}
			{#each eventTags as tag}
				<div class="flex items-center justify-between border-b px-3 py-3 last:border-b-0">
					<div class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full" style="background-color: {tag.color}"></span>
						<span class="text-sm font-medium text-[#131517]">{tag.name}</span>
					</div>
					<div class="flex items-center gap-4">
						<span class="text-sm text-[#A9AAAA]">{tag.eventCount ?? 0} Events</span>
						<div use:clickOutside={() => openMenuId === `e-${tag.id}` && (openMenuId = '')} class="relative">
							<button
								class="border-l px-3 text-gray-400 hover:text-gray-600"
								aria-label="Tag options"
								on:click={() => (openMenuId = openMenuId === `e-${tag.id}` ? '' : `e-${tag.id}`)}
							>
								<Icon icon="mdi:dots-horizontal" class="text-lg" />
							</button>
							{#if openMenuId === `e-${tag.id}`}
								<div class="absolute right-0 z-50 mt-1 w-36 rounded-lg bg-white p-1 text-sm shadow-lg">
									<button
										class="flex w-full items-center gap-2 rounded-md p-2 text-[#616265] hover:bg-[#EBECED]"
										on:click={() => openEdit('EVENT', tag)}
									>
										<Icon icon="mdi:pencil-outline" /> Edit
									</button>
									<button
										class="flex w-full items-center gap-2 rounded-md p-2 text-red-500 hover:bg-red-50"
										on:click={() => removeTag('EVENT', tag)}
									>
										<Icon icon="mdi:trash-can-outline" /> Delete
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<button
		on:click={() => openCreate('EVENT')}
		class="mb-8 flex items-center gap-2 rounded-md bg-[#333537] px-3 py-2 text-sm text-white hover:bg-black"
	>
		<Icon icon="mdi:plus" /> Create Tag
	</button>

	<!-- ── Member Tags ────────────────────────────────────────────── -->
	<div class="mb-3 flex items-center justify-between">
		<h2 class="flex items-center gap-2 text-lg font-semibold">
			<span>Member Tags</span>
			<span
				class="flex h-6 w-6 items-center justify-center rounded-full border border-black bg-[#EBECED] text-xs"
				>{memberTags.length}</span
			>
		</h2>
	</div>
	<p class="mb-4 text-sm text-[#737577]">
		Organize your audience with member tags. These tags are only visible to admins.
	</p>

	<div class="mb-3 flex flex-col rounded-md bg-[#FDFDFD]">
		{#if loadingMember}
			{#each [1, 2] as _}
				<div class="flex animate-pulse items-center justify-between border-b px-3 py-3 last:border-b-0">
					<div class="h-4 w-32 rounded bg-gray-200"></div>
					<div class="h-4 w-16 rounded bg-gray-200"></div>
				</div>
			{/each}
		{:else if memberTags.length === 0}
			<div class="flex flex-col items-center justify-center gap-1 px-3 py-8 text-center">
				<Icon icon="mdi:account-multiple-outline" class="text-3xl text-gray-300" />
				<p class="text-sm text-gray-400">No member tags yet.</p>
			</div>
		{:else}
			{#each memberTags as tag}
				<div class="flex items-center justify-between border-b px-3 py-3 last:border-b-0">
					<div class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full" style="background-color: {tag.color}"></span>
						<span class="text-sm font-medium text-[#131517]">{tag.name}</span>
					</div>
					<div class="flex items-center gap-4">
						<span class="text-sm text-[#A9AAAA]">{tag.memberCount ?? 0} Members</span>
						<div use:clickOutside={() => openMenuId === `m-${tag.id}` && (openMenuId = '')} class="relative">
							<button
								class="border-l px-3 text-gray-400 hover:text-gray-600"
								aria-label="Tag options"
								on:click={() => (openMenuId = openMenuId === `m-${tag.id}` ? '' : `m-${tag.id}`)}
							>
								<Icon icon="mdi:dots-horizontal" class="text-lg" />
							</button>
							{#if openMenuId === `m-${tag.id}`}
								<div class="absolute right-0 z-50 mt-1 w-36 rounded-lg bg-white p-1 text-sm shadow-lg">
									<button
										class="flex w-full items-center gap-2 rounded-md p-2 text-[#616265] hover:bg-[#EBECED]"
										on:click={() => openEdit('MEMBER', tag)}
									>
										<Icon icon="mdi:pencil-outline" /> Edit
									</button>
									<button
										class="flex w-full items-center gap-2 rounded-md p-2 text-red-500 hover:bg-red-50"
										on:click={() => removeTag('MEMBER', tag)}
									>
										<Icon icon="mdi:trash-can-outline" /> Delete
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<button
		on:click={() => openCreate('MEMBER')}
		class="flex items-center gap-2 rounded-md bg-[#333537] px-3 py-2 text-sm text-white hover:bg-black"
	>
		<Icon icon="mdi:plus" /> Create Tag
	</button>
</section>

<!-- ── Create / Edit modal ─────────────────────────────────────────── -->
{#if editorOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		on:click={() => (editorOpen = false)}
		on:keydown={(e) => e.key === 'Escape' && (editorOpen = false)}
	>
		<div
			class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">
					{editorTag ? 'Edit' : 'Create'}
					{editorKind === 'EVENT' ? 'Event Tag' : 'Member Tag'}
				</h3>
				<button on:click={() => (editorOpen = false)} aria-label="Close">
					<Icon icon="mdi:close" class="text-xl text-gray-400" />
				</button>
			</div>

			{#if editorError}
				<p class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{editorError}</p>
			{/if}

			<label class="mb-1 block text-sm font-medium text-gray-900">Tag name</label>
			<input
				type="text"
				bind:value={editorName}
				maxlength="60"
				placeholder="e.g. Conferences"
				on:keydown={(e) => e.key === 'Enter' && saveEditor()}
				class="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
			/>

			<label class="mb-2 block text-sm font-medium text-gray-900">Color</label>
			<div class="mb-5 flex flex-wrap gap-2">
				{#each PALETTE as c}
					<button
						type="button"
						aria-label="Choose color"
						class="h-7 w-7 rounded-full ring-offset-2 transition {editorColor === c
							? 'ring-2 ring-gray-800'
							: ''}"
						style="background-color: {c}"
						on:click={() => (editorColor = c)}
					></button>
				{/each}
			</div>

			<div class="flex justify-end gap-3">
				<button
					on:click={() => (editorOpen = false)}
					class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					on:click={saveEditor}
					disabled={editorSaving}
					class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
				>
					{editorSaving ? 'Saving…' : editorTag ? 'Save changes' : 'Create tag'}
				</button>
			</div>
		</div>
	</div>
{/if}
