<script lang="ts">
	import { getUser, getUsers, updateUserStatus } from '$lib/services/admin.services';
	import { onMount } from 'svelte';

	let users: any[] = [];
	let total = 0;
	let currentPage = 1;
	let totalPages = 1;
	let limit = 20;
	let loading = true;

	// Filters
	let searchQuery = '';
	let searchTimeout: ReturnType<typeof setTimeout>;
	let statusFilter = 'ALL';
	let sortBy = 'createdAt';
	let sortOrder: 'asc' | 'desc' = 'desc';
	let showStatusDropdown = false;
	let showSortDropdown = false;

	// Modal
	let showModal = false;
	let selectedUser: any = null;
	let modalLoading = false;
	let statusUpdating = false;

	const statusOptions = [
		{ label: 'All Users', value: 'ALL' },
		{ label: 'Active', value: 'ACTIVE' },
		{ label: 'Inactive', value: 'INACTIVE' },
		{ label: 'Pending', value: 'PENDING_VERIFICATION' },
		{ label: 'Deleted', value: 'DELETED' },
	];

	const sortOptions = [
		{ label: 'Joined Date', value: 'createdAt' },
		{ label: 'Email', value: 'email' },
		{ label: 'Status', value: 'status' },
	];

	$: selectedStatusLabel = statusOptions.find((s) => s.value === statusFilter)?.label ?? 'All Users';
	$: selectedSortLabel = sortOptions.find((s) => s.value === sortBy)?.label ?? 'Joined Date';

	onMount(() => fetchUsers());

	async function fetchUsers() {
		loading = true;
		try {
			const params: Record<string, string> = {
				page: currentPage.toString(),
				limit: limit.toString(),
				sortBy,
				sortOrder,
			};
			if (searchQuery) params.search = searchQuery;
			if (statusFilter !== 'ALL') params.status = statusFilter;

			const data = await getUsers(params);
			users = data.users;
			total = data.total;
			totalPages = data.totalPages;
		} catch {
			users = [];
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => { currentPage = 1; fetchUsers(); }, 300);
	}

	function selectStatus(value: string) {
		statusFilter = value;
		showStatusDropdown = false;
		currentPage = 1;
		fetchUsers();
	}

	function selectSort(value: string) {
		if (sortBy === value) sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
		else { sortBy = value; sortOrder = 'desc'; }
		showSortDropdown = false;
		currentPage = 1;
		fetchUsers();
	}

	function goToPage(p: number) {
		if (p < 1 || p > totalPages) return;
		currentPage = p;
		fetchUsers();
	}

	async function openUserModal(user: any) {
		selectedUser = user;
		showModal = true;
		modalLoading = true;
		try {
			const detail = await getUser(user._id);
			selectedUser = detail;
		} catch { /* use basic data */ }
		finally { modalLoading = false; }
	}

	async function handleStatusChange(userId: string, newStatus: string) {
		statusUpdating = true;
		try {
			await updateUserStatus(userId, newStatus);
			if (selectedUser?._id === userId) selectedUser.status = newStatus;
			const idx = users.findIndex((u) => u._id === userId);
			if (idx >= 0) users[idx].status = newStatus;
			users = users;
		} catch (e) { console.error(e); }
		finally { statusUpdating = false; }
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'ACTIVE': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'INACTIVE': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'DELETED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}

	function timeAgo(dateStr: string): string {
		if (!dateStr) return '';
		const now = new Date();
		const date = new Date(dateStr);
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
		if (diffDays < 1) return 'Today';
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head><title>Users | Rondwell HQ</title></svelte:head>

<div>
	<div class="mb-6">
		<h1 class="text-3xl font-semibold text-gray-900">User Management</h1>
		<p class="mt-1 text-sm text-gray-500">Manage all platform users</p>
	</div>

	<!-- Search -->
	<div class="relative mb-4 w-full">
		<input type="text" bind:value={searchQuery} on:input={handleSearch} placeholder="Search by email or phone..."
			class="h-[44px] w-full rounded-xl bg-white py-2 pr-4 pl-10 text-sm shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
		<svg class="absolute top-3 left-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex items-center justify-between">
		<div class="relative">
			<button on:click={() => { showStatusDropdown = !showStatusDropdown; showSortDropdown = false; }}
				class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-[#616265] shadow-sm">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
				{selectedStatusLabel}
				<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
			</button>
			{#if showStatusDropdown}
				<div class="absolute left-0 z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
					{#each statusOptions as option}
						<button on:click={() => selectStatus(option.value)}
							class="flex w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 {statusFilter === option.value ? 'font-medium text-[#513BE2]' : 'text-[#616265]'}">
							{option.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="relative">
			<button on:click={() => { showSortDropdown = !showSortDropdown; showStatusDropdown = false; }}
				class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-[#616265] shadow-sm">
				{selectedSortLabel} {sortOrder === 'asc' ? '↑' : '↓'}
			</button>
			{#if showSortDropdown}
				<div class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
					{#each sortOptions as option}
						<button on:click={() => selectSort(option.value)}
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 {sortBy === option.value ? 'font-medium text-[#513BE2]' : 'text-[#616265]'}">
							{option.label}
							{#if sortBy === option.value}<span class="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- User List -->
	{#if loading}
		<div class="rounded-xl bg-white p-4">
			{#each Array(5) as _}
				<div class="flex animate-pulse items-center justify-between border-b py-3 last:border-b-0">
					<div class="flex items-center gap-3">
						<div class="h-9 w-9 rounded-full bg-gray-200"></div>
						<div><div class="h-4 w-36 rounded bg-gray-200"></div><div class="mt-1 h-3 w-48 rounded bg-gray-200"></div></div>
					</div>
					<div class="h-6 w-20 rounded-full bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if users.length > 0}
		<div class="rounded-xl bg-white">
			{#each users as user}
				<button class="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50"
					on:click={() => openUserModal(user)}>
					<div class="flex items-center gap-3">
						{#if user.profilePictureUrl}
							<img src={user.profilePictureUrl} alt="" class="h-9 w-9 rounded-full object-cover" />
						{:else}
							<div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2E4F8] text-xs font-semibold text-[#AB46DD]">
								{(user.name || user.email || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							<p class="text-sm font-medium text-gray-800">{user.name || 'Unknown'}</p>
							<p class="text-xs text-gray-400">{user.email}</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<span class="rounded-full px-2.5 py-0.5 text-[10px] font-medium {getStatusClass(user.status)}">{user.status}</span>
						<span class="hidden text-xs text-gray-400 sm:block">{timeAgo(user.createdAt)}</span>
					</div>
				</button>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
					class="rounded-lg px-3 py-1.5 text-sm text-[#616265] transition hover:bg-white disabled:opacity-40">Previous</button>
				{#each Array(Math.min(totalPages, 5)) as _, i}
					{@const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i}
					<button on:click={() => goToPage(pageNum)}
						class="h-8 w-8 rounded-lg text-sm transition {currentPage === pageNum ? 'bg-[#513BE2] text-white' : 'text-[#616265] hover:bg-white'}">
						{pageNum}
					</button>
				{/each}
				<button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
					class="rounded-lg px-3 py-1.5 text-sm text-[#616265] transition hover:bg-white disabled:opacity-40">Next</button>
			</div>
		{/if}
	{:else}
		<div class="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-white">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="text-gray-300"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zM3 21c0-3.314 4.03-6 9-6s9 2.686 9 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
			<p class="text-lg font-medium text-[#646568]">No Users Found</p>
			<p class="text-sm text-gray-400">Try adjusting your search or filters</p>
		</div>
	{/if}
</div>

<!-- User Detail Modal -->
{#if showModal && selectedUser}
	<div on:click={() => (showModal = false)} on:keydown={(e) => e.key === 'Escape' && (showModal = false)}
		class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5 lg:justify-end lg:p-0 lg:pr-10"
		role="dialog" aria-modal="true" tabindex="-1">
		<div class="flex h-full w-full max-w-xl flex-col rounded-xl bg-[#F4F5F6] shadow-xl lg:max-w-lg lg:rounded-none"
			role="document" on:click|stopPropagation on:keydown|stopPropagation>

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<button on:click={() => (showModal = false)} class="text-gray-500 hover:text-gray-700">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<span class="text-sm font-medium text-gray-500">User Details</span>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-6 pt-5 pb-6">
				{#if modalLoading}
					<div class="animate-pulse space-y-4">
						<div class="flex items-center gap-3"><div class="h-12 w-12 rounded-full bg-gray-200"></div><div><div class="h-5 w-40 rounded bg-gray-200"></div><div class="mt-1 h-3 w-52 rounded bg-gray-200"></div></div></div>
						{#each Array(4) as _}<div class="h-10 w-full rounded bg-gray-200"></div>{/each}
					</div>
				{:else}
					<!-- User Info -->
					<div class="flex items-center gap-4">
						{#if selectedUser.profilePictureUrl}
							<img src={selectedUser.profilePictureUrl} alt="" class="h-14 w-14 rounded-full object-cover" />
						{:else}
							<div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2E4F8] text-lg font-semibold text-[#AB46DD]">
								{(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							<p class="text-lg font-semibold text-gray-900">{selectedUser.name || 'Unknown'}</p>
							<p class="text-sm text-gray-400">{selectedUser.email}</p>
						</div>
					</div>

					<!-- Status -->
					<div class="mt-5 flex flex-wrap items-center gap-4">
						<div class="border-r border-gray-200 pr-4">
							<p class="text-xs text-[#C1C2C2]">Status</p>
							<span class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusClass(selectedUser.status)}">{selectedUser.status}</span>
						</div>
						<div class="border-r border-gray-200 pr-4">
							<p class="text-xs text-[#C1C2C2]">Joined</p>
							<p class="text-sm font-medium text-gray-800">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
						</div>
						{#if selectedUser.lastLoginAt}
							<div>
								<p class="text-xs text-[#C1C2C2]">Last Login</p>
								<p class="text-sm font-medium text-gray-800">{timeAgo(selectedUser.lastLoginAt)}</p>
							</div>
						{/if}
					</div>

					<!-- Details -->
					<div class="mt-6 space-y-4 border-t border-gray-200 pt-6">
						{#if selectedUser.phoneNumber}
							<div><p class="text-xs text-[#C1C2C2]">Phone</p><p class="text-sm font-medium text-gray-800">{selectedUser.phoneNumber}</p></div>
						{/if}
						<div><p class="text-xs text-[#C1C2C2]">Email Verified</p><p class="text-sm font-medium text-gray-800">{selectedUser.isEmailVerified ? '✓ Yes' : '✗ No'}</p></div>
						{#if selectedUser.role}
							<div><p class="text-xs text-[#C1C2C2]">Role</p><p class="text-sm font-medium text-gray-800">{selectedUser.role}</p></div>
						{/if}
						{#if selectedUser.bio}
							<div><p class="text-xs text-[#C1C2C2]">Bio</p><p class="text-sm text-gray-700">{selectedUser.bio}</p></div>
						{/if}
					</div>

					<!-- Actions -->
					<div class="mt-6 border-t border-gray-200 pt-6">
						<h3 class="mb-3 text-sm font-semibold text-gray-700">Actions</h3>
						<div class="flex flex-wrap gap-2">
							{#if selectedUser.status !== 'ACTIVE'}
								<button on:click={() => handleStatusChange(selectedUser._id, 'ACTIVE')} disabled={statusUpdating}
									class="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50">
									{statusUpdating ? '...' : 'Activate'}
								</button>
							{/if}
							{#if selectedUser.status !== 'INACTIVE'}
								<button on:click={() => handleStatusChange(selectedUser._id, 'INACTIVE')} disabled={statusUpdating}
									class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
									{statusUpdating ? '...' : 'Deactivate'}
								</button>
							{/if}
							{#if selectedUser.status !== 'DELETED'}
								<button on:click={() => handleStatusChange(selectedUser._id, 'DELETED')} disabled={statusUpdating}
									class="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
									{statusUpdating ? '...' : 'Delete'}
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
