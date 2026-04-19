<script lang="ts">
	import { deleteBooth, duplicateBooth, getMyBooths, type BoothFilters } from '$lib/services/exhibitor.services';
	import { getActiveProfile } from '$lib/services/profile.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AddBoothModal from '../../components/AddBoothModal.svelte';
	import ConfirmActionModal from '../../components/ConfirmActionModal.svelte';
	import ViewBoothModal from '../../components/ViewBoothModal.svelte';

	let loading = true;
	let exhibitorName = '';
	let logoUrl = '';
	let booths: any[] = [];
	let showModal = false;
	let editingBooth: any = null;
	let viewMode: 'grid' | 'list' = 'grid';
	let searchQuery = '';
	let statusFilter = '';
	let showStatusDropdown = false;
	let showActionMenu: string | null = null;

	// Delete confirmation state
	let showDeleteConfirm = false;
	let deleteTargetBooth: any = null;
	let deleting = false;

	// Duplicate confirmation state
	let showDuplicateConfirm = false;
	let duplicateTargetBooth: any = null;
	let duplicating = false;

	// View modal state
	let showViewModal = false;
	let viewingBooth: any = null;

	const statusStyles: Record<string, string> = {
		PUBLISHED: 'bg-green-100 text-green-700',
		DRAFT: 'bg-purple-100 text-purple-700',
		ARCHIVED: 'bg-pink-100 text-pink-700',
	};

	const statusOptions = [
		{ value: '', label: 'All Statuses' },
		{ value: 'PUBLISHED', label: 'Published' },
		{ value: 'DRAFT', label: 'Draft' },
		{ value: 'ARCHIVED', label: 'Archived' },
	];

	async function loadBooths() {
		loading = true;
		try {
			const filters: BoothFilters = { limit: 100 };
			if (statusFilter) filters.status = statusFilter;
			if (searchQuery) filters.search = searchQuery;
			const result = await getMyBooths(filters);
			booths = result?.data || result?.booths || result || [];
			if (!Array.isArray(booths)) booths = [];
		} catch {
			booths = [];
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		try {
			const profile = await getActiveProfile();
			const ed = (profile as any)?.exhibitorDetails;
			exhibitorName = ed?.companyName || profile?.name || 'Exhibitor';
			logoUrl = ed?.logoUrl || profile?.profilePictureUrl || '';
		} catch {
			// silent
		}
		await loadBooths();
	});

	function handleSearch() {
		loadBooths();
	}

	function selectStatus(value: string) {
		statusFilter = value;
		showStatusDropdown = false;
		loadBooths();
	}

	// ─── View / Edit ──────────────────────────────────────────────────────
	function handleView(booth: any) {
		viewingBooth = booth;
		showViewModal = true;
		showActionMenu = null;
	}

	function handleEdit(booth: any) {
		editingBooth = booth;
		showModal = true;
		showActionMenu = null;
	}

	function handleBoothSuccess() {
		showModal = false;
		editingBooth = null;
		loadBooths();
	}

	$: if (!showModal) editingBooth = null;

	// ─── Delete ───────────────────────────────────────────────────────────
	function promptDelete(booth: any) {
		deleteTargetBooth = booth;
		showDeleteConfirm = true;
		showActionMenu = null;
	}

	async function confirmDelete() {
		if (!deleteTargetBooth) return;
		deleting = true;
		try {
			await deleteBooth(deleteTargetBooth._id);
			booths = booths.filter((b) => b._id !== deleteTargetBooth._id);
			showDeleteConfirm = false;
			deleteTargetBooth = null;
		} catch (e) {
			console.error('Failed to delete booth', e);
		} finally {
			deleting = false;
		}
	}

	// ─── Duplicate ────────────────────────────────────────────────────────
	function promptDuplicate(booth: any) {
		duplicateTargetBooth = booth;
		showDuplicateConfirm = true;
		showActionMenu = null;
	}

	async function confirmDuplicate() {
		if (!duplicateTargetBooth) return;
		duplicating = true;
		try {
			await duplicateBooth(duplicateTargetBooth._id);
			showDuplicateConfirm = false;
			duplicateTargetBooth = null;
			await loadBooths();
		} catch (e) {
			console.error('Failed to duplicate booth', e);
		} finally {
			duplicating = false;
		}
	}

	function timeAgo(dateStr: string) {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		return `${days}d ago`;
	}
</script>

<div class="w-full text-[#101828]">
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			{#if logoUrl}
				<img src={logoUrl} alt="logo" class="h-8 w-8 rounded-lg object-cover" />
			{:else}
				<img src="/loader.svg" alt="logo" class="h-8 w-8 rounded-lg object-cover" />
			{/if}
			<h1 class="text-2xl font-bold text-gray-900">{exhibitorName}</h1>
		</div>

		<div class="flex items-center gap-2">
			<button
				on:click={() => { editingBooth = null; showModal = true; }}
				class="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-gray-800"
			>
				<Icon icon="mdi:plus" class="h-4 w-4" />
				Add New Booth
			</button>
			<div class="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
				<button
					class="p-2 transition {viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}"
					on:click={() => (viewMode = 'grid')}
					aria-label="Grid view"
				>
					<Icon icon="mdi:view-grid-outline" class="h-4 w-4 text-gray-600" />
				</button>
				<button
					class="p-2 transition {viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}"
					on:click={() => (viewMode = 'list')}
					aria-label="List view"
				>
					<Icon icon="mdi:view-list-outline" class="h-4 w-4 text-gray-600" />
				</button>
			</div>
		</div>
	</div>

	<!-- Title + Filters -->
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h2 class="text-lg font-bold text-gray-900">My Digital Booths</h2>
		<div class="flex flex-wrap items-center gap-2">
			<!-- Search -->
			<div class="relative flex h-9 w-full items-center rounded-lg border border-gray-200 bg-white sm:w-56">
				<img class="absolute left-3 h-4 w-4" alt="search" src="/search.svg" />
				<input
					type="text"
					placeholder="Search booths..."
					bind:value={searchQuery}
					on:input={handleSearch}
					class="w-full py-2 pr-3 pl-9 text-xs text-gray-600 placeholder:text-gray-400 focus:outline-none"
				/>
			</div>
			<!-- Status Filter -->
			<div class="relative">
				<button
					on:click={() => (showStatusDropdown = !showStatusDropdown)}
					class="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600"
				>
					<Icon icon="mdi:filter-variant" class="h-4 w-4" />
					{statusFilter ? statusOptions.find(s => s.value === statusFilter)?.label : 'Status'}
					<Icon icon="mdi:chevron-down" class="h-3 w-3" />
				</button>
				{#if showStatusDropdown}
					<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showStatusDropdown = false)} aria-label="Close dropdown"></button>
					<div class="absolute left-0 z-50 mt-1 w-40 rounded-lg border bg-white p-1 shadow-lg sm:left-auto sm:right-0">
						{#each statusOptions as opt}
							<button
								on:click={() => selectStatus(opt.value)}
								class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-gray-50 {statusFilter === opt.value ? 'bg-gray-50 font-medium' : ''}"
							>
								{#if opt.value}
									<span class="h-2 w-2 rounded-full {statusStyles[opt.value]?.split(' ')[0] || 'bg-gray-200'}"></span>
								{/if}
								{opt.label}
								{#if statusFilter === opt.value}
									<Icon icon="mdi:check" class="ml-auto h-3 w-3" />
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Content -->
	{#if loading}
		<!-- Skeleton Loader -->
		<div class="animate-pulse">
			{#if viewMode === 'grid'}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each [1, 2, 3, 4, 5, 6] as _}
						<div class="rounded-xl border bg-white p-3">
							<div class="mb-3 h-[180px] rounded-lg bg-gray-200"></div>
							<div class="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
							<div class="mb-2 h-3 w-1/2 rounded bg-gray-100"></div>
							<div class="h-3 w-1/3 rounded bg-gray-100"></div>
							<div class="mt-3 flex gap-2">
								<div class="h-7 w-16 rounded-md bg-gray-200"></div>
								<div class="h-7 w-14 rounded-md bg-gray-200"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="space-y-3">
					{#each [1, 2, 3, 4] as _}
						<div class="flex items-center gap-4 rounded-xl border bg-white p-4">
							<div class="h-20 w-20 shrink-0 rounded-lg bg-gray-200"></div>
							<div class="flex-1">
								<div class="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
								<div class="mb-2 h-3 w-1/3 rounded bg-gray-100"></div>
								<div class="h-3 w-1/4 rounded bg-gray-100"></div>
							</div>
							<div class="h-7 w-20 rounded-md bg-gray-200"></div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

	{:else if booths.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
			<div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
				<Icon icon="mdi:store-plus-outline" class="h-10 w-10 text-gray-300" />
			</div>
			<h3 class="mb-1 text-sm font-bold text-gray-900">No Booths or Stands yet</h3>
			<p class="mb-6 max-w-[260px] text-xs text-gray-400">
				Start showcasing your brand to event attendees. Add your first booth or stand to get discovered.
			</p>
			<button
				on:click={() => { editingBooth = null; showModal = true; }}
				class="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800"
			>
				<Icon icon="mdi:plus" class="h-4 w-4" />
				Add Your First Booth
			</button>
		</div>

	{:else}
		<!-- Grid View -->
		{#if viewMode === 'grid'}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each booths as booth (booth._id)}
					<div class="group relative rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md">
						<!-- Image -->
						<div class="relative mb-3 h-[180px] overflow-hidden rounded-lg bg-gray-100">
							{#if booth.media?.[0]?.url}
								<img src={booth.media[0].url} alt={booth.title} class="h-full w-full object-cover" />
							{:else if booth.bannerUrl}
								<img src={booth.bannerUrl} alt={booth.title} class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<Icon icon="mdi:image-outline" class="h-12 w-12 text-gray-300" />
								</div>
							{/if}
							<span class="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium {statusStyles[booth.status] || 'bg-gray-100 text-gray-600'}">
								{booth.status}
							</span>
						</div>

						<!-- Text -->
						<h3 class="text-sm font-semibold leading-tight text-gray-900 line-clamp-2">{booth.title}</h3>
						<p class="mt-1 text-xs text-gray-500 line-clamp-1">{booth.description || ''}</p>
						<div class="mt-1 flex items-center gap-2">
							{#if booth.media?.length}
								<span class="text-[10px] text-gray-400">{booth.media.length} media</span>
							{/if}
							{#if booth.resources?.length}
								<span class="text-[10px] text-gray-400">· {booth.resources.length} resources</span>
							{/if}
							{#if booth.createdAt}
								<span class="text-[10px] text-gray-400">· {timeAgo(booth.createdAt)}</span>
							{/if}
						</div>

						<!-- Actions -->
						<div class="mt-3 flex items-center gap-2">
							<button on:click={() => handleView(booth)} class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-[10px] font-bold text-white">
								<Icon icon="mdi:eye-outline" class="h-3 w-3" /> View
							</button>
							<button on:click={() => handleEdit(booth)} class="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
								<Icon icon="mdi:pencil-outline" class="h-3 w-3" /> Edit
							</button>
							<div class="relative ml-auto">
								<button on:click={() => (showActionMenu = showActionMenu === booth._id ? null : booth._id)} class="rounded p-1 hover:bg-gray-100">
									<Icon icon="mdi:dots-horizontal" class="h-4 w-4 text-gray-400" />
								</button>
								{#if showActionMenu === booth._id}
									<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showActionMenu = null)} aria-label="Close menu"></button>
									<div class="absolute right-0 bottom-full z-50 mb-1 w-36 rounded-lg border bg-white p-1 shadow-lg">
										<button on:click={() => promptDuplicate(booth)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-gray-50">
											<Icon icon="mdi:content-duplicate" class="h-3.5 w-3.5 text-gray-500" /> Duplicate
										</button>
										<button on:click={() => promptDelete(booth)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-500 hover:bg-red-50">
											<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /> Delete
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

		{:else}
			<!-- List View -->
			<div class="space-y-3">
				{#each booths as booth (booth._id)}
					<div class="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
						<!-- Image -->
						<div class="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
							{#if booth.media?.[0]?.url}
								<img src={booth.media[0].url} alt={booth.title} class="h-full w-full object-cover" />
							{:else if booth.bannerUrl}
								<img src={booth.bannerUrl} alt={booth.title} class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<Icon icon="mdi:image-outline" class="h-8 w-8 text-gray-300" />
								</div>
							{/if}
							<span class="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:hidden {statusStyles[booth.status] || 'bg-gray-100 text-gray-600'}">
								{booth.status}
							</span>
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h3 class="text-sm font-semibold text-gray-900 truncate">{booth.title}</h3>
							<p class="text-xs text-gray-500 truncate">{booth.description || ''}</p>
							<div class="mt-1 flex items-center gap-2">
								<span class="hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline {statusStyles[booth.status] || 'bg-gray-100 text-gray-600'}">
									{booth.status}
								</span>
								{#if booth.createdAt}
									<span class="text-[10px] text-gray-400">{timeAgo(booth.createdAt)}</span>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex items-center gap-2 shrink-0">
							<button on:click={() => handleView(booth)} class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-[10px] font-bold text-white">
								<Icon icon="mdi:eye-outline" class="h-3 w-3" /> View
							</button>
							<button on:click={() => handleEdit(booth)} class="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
								<Icon icon="mdi:pencil-outline" class="h-3 w-3" /> Edit
							</button>
							<div class="relative">
								<button on:click={() => (showActionMenu = showActionMenu === booth._id ? null : booth._id)} class="rounded p-1 hover:bg-gray-100">
									<Icon icon="mdi:dots-horizontal" class="h-4 w-4 text-gray-400" />
								</button>
								{#if showActionMenu === booth._id}
									<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showActionMenu = null)} aria-label="Close menu"></button>
									<div class="absolute right-0 bottom-full z-50 mb-1 w-36 rounded-lg border bg-white p-1 shadow-lg">
										<button on:click={() => promptDuplicate(booth)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-gray-50">
											<Icon icon="mdi:content-duplicate" class="h-3.5 w-3.5 text-gray-500" /> Duplicate
										</button>
										<button on:click={() => promptDelete(booth)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-500 hover:bg-red-50">
											<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /> Delete
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Add/Edit Booth Modal -->
<AddBoothModal bind:show={showModal} editBooth={editingBooth} onSuccess={handleBoothSuccess} />

<!-- View Booth Modal -->
<ViewBoothModal bind:open={showViewModal} booth={viewingBooth} onEdit={handleEdit} />

<!-- Delete Confirmation Modal -->
<ConfirmActionModal
	bind:show={showDeleteConfirm}
	title="Delete Booth"
	message="Are you sure you want to delete &quot;{deleteTargetBooth?.title || 'this booth'}&quot;? This will permanently remove the booth and all associated files. This action cannot be undone."
	confirmLabel={deleting ? 'Deleting...' : 'Delete Booth'}
	confirmColor="red"
	icon="mdi:trash-can-outline"
	iconColor="text-red-500"
	loading={deleting}
	onConfirm={confirmDelete}
	onCancel={() => { deleteTargetBooth = null; }}
/>

<!-- Duplicate Confirmation Modal -->
<ConfirmActionModal
	bind:show={showDuplicateConfirm}
	title="Duplicate Booth"
	message="This will create a copy of &quot;{duplicateTargetBooth?.title || 'this booth'}&quot; with all basic information. The duplicate will be created as a draft."
	confirmLabel={duplicating ? 'Duplicating...' : 'Duplicate Booth'}
	confirmColor="black"
	icon="mdi:content-duplicate"
	iconColor="text-gray-600"
	loading={duplicating}
	onConfirm={confirmDuplicate}
	onCancel={() => { duplicateTargetBooth = null; }}
/>
