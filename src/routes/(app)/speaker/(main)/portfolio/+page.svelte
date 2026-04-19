<script lang="ts">
	import { getActiveProfile } from '$lib/services/profile.services';
	import {
		archiveSpeakerPortfolio,
		duplicateSpeakerPortfolio,
		getSpeakerPortfolios,
		type PortfolioFilters
	} from '$lib/services/speaker.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import ConfirmActionModal from '../../../vendor/component/ConfirmActionModal.svelte';
	import AddPortfolioModal from '../../component/AddPortfolioModal.svelte';
	import ViewPortfolioModal from '../../component/ViewPortfolioModal.svelte';

	let loading = true;
	let speakerName = '';
	let photoUrl = '';
	let portfolios: any[] = [];
	let showModal = false;
	let editingPortfolio: any = null;
	let viewMode: 'grid' | 'list' = 'grid';
	let searchQuery = '';
	let statusFilter = '';
	let categoryFilter = '';
	let showStatusDropdown = false;
	let showCategoryDropdown = false;
	let showActionMenu: string | null = null;

	// Delete confirmation
	let showDeleteConfirm = false;
	let deleteTarget: any = null;
	let deleting = false;

	// Duplicate confirmation
	let showDuplicateConfirm = false;
	let duplicateTarget: any = null;
	let duplicating = false;

	// View modal
	let showViewModal = false;
	let viewingPortfolio: any = null;

	const statusStyles: Record<string, string> = {
		ACTIVE: 'bg-green-100 text-green-700',
		DRAFT: 'bg-purple-100 text-purple-700',
		ARCHIVED: 'bg-pink-100 text-pink-700'
	};

	const statusOptions = [
		{ value: '', label: 'All Statuses' },
		{ value: 'ACTIVE', label: 'Active' },
		{ value: 'DRAFT', label: 'Draft' },
		{ value: 'ARCHIVED', label: 'Archived' }
	];

	const categoryOptions = [
		{ value: '', label: 'All Categories' },
		{ value: 'Keynote', label: 'Keynote' },
		{ value: 'Workshop', label: 'Workshop' },
		{ value: 'Panel Discussion', label: 'Panel Discussion' },
		{ value: 'Fireside Chat', label: 'Fireside Chat' },
		{ value: 'Masterclass', label: 'Masterclass' },
		{ value: 'Webinar', label: 'Webinar' },
		{ value: 'General', label: 'General' }
	];

	async function loadPortfolios() {
		loading = true;
		try {
			const filters: PortfolioFilters = { limit: 100 };
			if (statusFilter) filters.status = statusFilter;
			if (categoryFilter) filters.category = categoryFilter;
			if (searchQuery) filters.search = searchQuery;
			const result = await getSpeakerPortfolios(filters);
			portfolios = result?.data || [];
			if (!Array.isArray(portfolios)) portfolios = [];
		} catch {
			portfolios = [];
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		try {
			const profile = await getActiveProfile();
			const sd = (profile as any)?.speakerDetails;
			speakerName = sd?.fullName || profile?.name || 'Speaker';
			photoUrl = sd?.profilePhotoUrl || profile?.profilePictureUrl || '';
		} catch {
			// silent
		}
		await loadPortfolios();
	});

	function handleSearch() { loadPortfolios(); }

	function selectStatus(value: string) {
		statusFilter = value;
		showStatusDropdown = false;
		loadPortfolios();
	}

	function selectCategory(value: string) {
		categoryFilter = value;
		showCategoryDropdown = false;
		loadPortfolios();
	}

	function handleView(portfolio: any) {
		viewingPortfolio = portfolio;
		showViewModal = true;
		showActionMenu = null;
	}

	function handleEdit(portfolio: any) {
		editingPortfolio = portfolio;
		showModal = true;
		showActionMenu = null;
	}

	function handleSuccess() {
		showModal = false;
		editingPortfolio = null;
		loadPortfolios();
	}

	$: if (!showModal) editingPortfolio = null;

	function promptDelete(portfolio: any) {
		deleteTarget = portfolio;
		showDeleteConfirm = true;
		showActionMenu = null;
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		deleting = true;
		try {
			await archiveSpeakerPortfolio(deleteTarget._id);
			portfolios = portfolios.filter((p) => p._id !== deleteTarget._id);
			showDeleteConfirm = false;
			deleteTarget = null;
		} catch (e) {
			console.error('Failed to archive portfolio', e);
		} finally {
			deleting = false;
		}
	}

	function promptDuplicate(portfolio: any) {
		duplicateTarget = portfolio;
		showDuplicateConfirm = true;
		showActionMenu = null;
	}

	async function confirmDuplicate() {
		if (!duplicateTarget) return;
		duplicating = true;
		try {
			await duplicateSpeakerPortfolio(duplicateTarget._id);
			showDuplicateConfirm = false;
			duplicateTarget = null;
			await loadPortfolios();
		} catch (e) {
			console.error('Failed to duplicate portfolio', e);
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
			{#if photoUrl}
				<img src={photoUrl} alt="avatar" class="h-8 w-8 rounded-lg object-cover" />
			{:else}
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200">
					<Icon icon="mdi:microphone-variant" class="h-4 w-4 text-gray-500" />
				</div>
			{/if}
			<h1 class="text-2xl font-bold text-gray-900">{speakerName}</h1>
		</div>

		<div class="flex items-center gap-2">
			<button
				on:click={() => { editingPortfolio = null; showModal = true; }}
				class="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-gray-800"
			>
				<Icon icon="mdi:plus" class="h-4 w-4" />
				Add New Engagement
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
		<h2 class="text-lg font-bold text-gray-900">My Speaking Portfolio</h2>
		<div class="flex flex-wrap items-center gap-2">
			<!-- Search -->
			<div class="relative flex h-9 w-full items-center rounded-lg border border-gray-200 bg-white sm:w-56">
				<Icon icon="mdi:magnify" class="absolute left-3 h-4 w-4 text-gray-400" />
				<input
					type="text"
					placeholder="Search portfolio entries..."
					bind:value={searchQuery}
					on:input={handleSearch}
					class="w-full py-2 pr-3 pl-9 text-xs text-gray-600 placeholder:text-gray-400 focus:outline-none"
				/>
			</div>
			<!-- Status Filter -->
			<div class="relative">
				<button
					on:click={() => { showStatusDropdown = !showStatusDropdown; showCategoryDropdown = false; }}
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
			<!-- Category Filter -->
			<div class="relative">
				<button
					on:click={() => { showCategoryDropdown = !showCategoryDropdown; showStatusDropdown = false; }}
					class="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600"
				>
					{categoryFilter || 'Category'}
					<Icon icon="mdi:chevron-down" class="h-3 w-3" />
				</button>
				{#if showCategoryDropdown}
					<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showCategoryDropdown = false)} aria-label="Close dropdown"></button>
					<div class="absolute right-0 z-50 mt-1 w-44 rounded-lg border bg-white p-1 shadow-lg">
						{#each categoryOptions as opt}
							<button
								on:click={() => selectCategory(opt.value)}
								class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-gray-50 {categoryFilter === opt.value ? 'bg-gray-50 font-medium' : ''}"
							>
								{opt.label}
								{#if categoryFilter === opt.value}
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

	{:else if portfolios.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
			<div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
				<Icon icon="mdi:microphone-variant" class="h-10 w-10 text-gray-300" />
			</div>
			<h3 class="mb-1 text-sm font-bold text-gray-900">No Portfolio Entries Yet</h3>
			<p class="mb-6 max-w-[280px] text-xs text-gray-400">
				Start showcasing your speaking engagements to event organizers. Add your first portfolio entry to get discovered.
			</p>
			<button
				on:click={() => { editingPortfolio = null; showModal = true; }}
				class="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800"
			>
				<Icon icon="mdi:plus" class="h-4 w-4" />
				Add Your First Engagement
			</button>
		</div>

	{:else}
		<!-- Grid View -->
		{#if viewMode === 'grid'}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each portfolios as portfolio (portfolio._id)}
					<div class="group relative rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md">
						<!-- Image -->
						<div class="relative mb-3 h-[180px] overflow-hidden rounded-lg bg-gray-100">
							{#if portfolio.media?.[0]?.url}
								<img src={portfolio.media[0].url} alt={portfolio.title} class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<Icon icon="mdi:microphone-variant" class="h-12 w-12 text-gray-300" />
								</div>
							{/if}
							<span class="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium {statusStyles[portfolio.status] || 'bg-gray-100 text-gray-600'}">
								{portfolio.status}
							</span>
						</div>

						<!-- Text -->
						<h3 class="text-sm font-semibold leading-tight text-gray-900 line-clamp-2">{portfolio.title}</h3>
						<p class="mt-1 text-xs text-gray-500 line-clamp-1">{portfolio.description || ''}</p>
						<div class="mt-1 flex items-center gap-2">
							{#if portfolio.category}
								<span class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">{portfolio.category}</span>
							{/if}
							{#if portfolio.createdAt}
								<span class="text-[10px] text-gray-400">{timeAgo(portfolio.createdAt)}</span>
							{/if}
						</div>

						<!-- Actions -->
						<div class="mt-3 flex items-center gap-2">
							<button on:click={() => handleView(portfolio)} class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-[10px] font-bold text-white">
								<Icon icon="mdi:eye-outline" class="h-3 w-3" /> View
							</button>
							<button on:click={() => handleEdit(portfolio)} class="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
								<Icon icon="mdi:pencil-outline" class="h-3 w-3" /> Edit
							</button>
							<div class="relative ml-auto">
								<button on:click={() => (showActionMenu = showActionMenu === portfolio._id ? null : portfolio._id)} class="rounded p-1 hover:bg-gray-100">
									<Icon icon="mdi:dots-horizontal" class="h-4 w-4 text-gray-400" />
								</button>
								{#if showActionMenu === portfolio._id}
									<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showActionMenu = null)} aria-label="Close menu"></button>
									<div class="absolute right-0 bottom-full z-50 mb-1 w-36 rounded-lg border bg-white p-1 shadow-lg">
										<button on:click={() => promptDuplicate(portfolio)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-gray-50">
											<Icon icon="mdi:content-duplicate" class="h-3.5 w-3.5 text-gray-500" /> Duplicate
										</button>
										<button on:click={() => promptDelete(portfolio)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-500 hover:bg-red-50">
											<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /> Archive
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
				{#each portfolios as portfolio (portfolio._id)}
					<div class="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
						<!-- Image -->
						<div class="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
							{#if portfolio.media?.[0]?.url}
								<img src={portfolio.media[0].url} alt={portfolio.title} class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<Icon icon="mdi:microphone-variant" class="h-8 w-8 text-gray-300" />
								</div>
							{/if}
							<span class="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:hidden {statusStyles[portfolio.status] || 'bg-gray-100 text-gray-600'}">
								{portfolio.status}
							</span>
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h3 class="text-sm font-semibold text-gray-900 truncate">{portfolio.title}</h3>
							<p class="text-xs text-gray-500 truncate">{portfolio.description || ''}</p>
							<div class="mt-1 flex items-center gap-2">
								{#if portfolio.category}
									<span class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">{portfolio.category}</span>
								{/if}
								<span class="hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline {statusStyles[portfolio.status] || 'bg-gray-100 text-gray-600'}">
									{portfolio.status}
								</span>
								{#if portfolio.createdAt}
									<span class="text-[10px] text-gray-400">{timeAgo(portfolio.createdAt)}</span>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex items-center gap-2 shrink-0">
							<button on:click={() => handleView(portfolio)} class="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-[10px] font-bold text-white">
								<Icon icon="mdi:eye-outline" class="h-3 w-3" /> View
							</button>
							<button on:click={() => handleEdit(portfolio)} class="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
								<Icon icon="mdi:pencil-outline" class="h-3 w-3" /> Edit
							</button>
							<div class="relative">
								<button on:click={() => (showActionMenu = showActionMenu === portfolio._id ? null : portfolio._id)} class="rounded p-1 hover:bg-gray-100">
									<Icon icon="mdi:dots-horizontal" class="h-4 w-4 text-gray-400" />
								</button>
								{#if showActionMenu === portfolio._id}
									<button class="fixed inset-0 z-40 cursor-default" on:click={() => (showActionMenu = null)} aria-label="Close menu"></button>
									<div class="absolute right-0 bottom-full z-50 mb-1 w-36 rounded-lg border bg-white p-1 shadow-lg">
										<button on:click={() => promptDuplicate(portfolio)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-gray-50">
											<Icon icon="mdi:content-duplicate" class="h-3.5 w-3.5 text-gray-500" /> Duplicate
										</button>
										<button on:click={() => promptDelete(portfolio)} class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-500 hover:bg-red-50">
											<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" /> Archive
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

<!-- Add/Edit Portfolio Modal -->
<AddPortfolioModal bind:show={showModal} editPortfolio={editingPortfolio} onSuccess={handleSuccess} />

<!-- View Portfolio Modal -->
<ViewPortfolioModal bind:open={showViewModal} portfolio={viewingPortfolio} onEdit={handleEdit} />

<!-- Delete Confirmation Modal -->
<ConfirmActionModal
	bind:show={showDeleteConfirm}
	title="Archive Engagement"
	message="Are you sure you want to archive &quot;{deleteTarget?.title || 'this entry'}&quot;? This will remove it from your active portfolio. You can restore it later."
	confirmLabel={deleting ? 'Archiving...' : 'Archive Entry'}
	confirmColor="red"
	icon="mdi:trash-can-outline"
	iconColor="text-red-500"
	loading={deleting}
	onConfirm={confirmDelete}
	onCancel={() => { deleteTarget = null; }}
/>

<!-- Duplicate Confirmation Modal -->
<ConfirmActionModal
	bind:show={showDuplicateConfirm}
	title="Duplicate Engagement"
	message="This will create a copy of &quot;{duplicateTarget?.title || 'this entry'}&quot; with all details. The duplicate will be created as a draft."
	confirmLabel={duplicating ? 'Duplicating...' : 'Duplicate Entry'}
	confirmColor="black"
	icon="mdi:content-duplicate"
	iconColor="text-gray-600"
	loading={duplicating}
	onConfirm={confirmDuplicate}
	onCancel={() => { duplicateTarget = null; }}
/>
