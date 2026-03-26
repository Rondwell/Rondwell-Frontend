<script lang="ts">
	import { page } from '$app/stores';
	import { getEventAdmins } from '$lib/services/event.services';
	import { getActiveProfile } from '$lib/services/profile.services';
	import { getMe } from '$lib/services/settings.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AddAdmin from './modal/AddAdmin.svelte';
	import UpdateAdmin from './modal/UpdateAdmin.svelte';

	export let eventTitle = '';
	$: eventId = $page.params.id ?? '';

	let searchQuery = '';
	let showAddModal = false;
	let showUpdateModal = false;
	let editAdmin: any = null;
	let admins: any[] = [];
	let loading = true;
	let currentUserProfile: any = null;
	let showRoleFilter = false;
	let showSortFilter = false;
	let roleFilter = 'All';
	let sortOrder = 'recent';

	const roleLabels: Record<string, { label: string; color: string }> = {
		EVENT_MANAGER: { label: 'Manager', color: 'bg-yellow-100 text-yellow-700' },
		COMMUNITY_MANAGER: { label: 'Community Manager', color: 'bg-purple-100 text-purple-700' },
		REGISTRATION_MANAGER: { label: 'Check-In Only', color: 'bg-blue-100 text-blue-700' },
		SUPPORT_MANAGER: { label: 'Support', color: 'bg-gray-100 text-gray-600' },
	};

	async function loadAdmins() {
		if (!eventId) return;
		loading = true;
		try {
			const [adminList, profile, me] = await Promise.all([
				getEventAdmins(eventId),
				getActiveProfile().catch(() => null),
				getMe().catch(() => null),
			]);
			currentUserProfile = profile;
			const myEmail = me?.email || '';
			const myName = profile?.name || profile?.username || '';

			admins = adminList.map((a: any) => {
				const needsEmail = !a.email || /^[a-f\d]{24}$/i.test(a.email);
				const needsName = !a.displayName || a.displayName === 'User' || /^[a-f\d]{24}$/i.test(a.displayName);
				// Only enrich the organizer's own record (self-invited), not other admins
				const isSelfInvited = a.invitedBy === a.userId;
				if (isSelfInvited) {
					return {
						...a,
						email: needsEmail ? myEmail : a.email,
						displayName: needsName ? myName : a.displayName,
					};
				}
				// For invited admins with no name, use email prefix
				if (needsName && a.email) {
					return { ...a, displayName: a.email.split('@')[0] };
				}
				return a;
			});
		} catch (e) { console.error('Failed to load admins:', e); admins = []; }
		finally { loading = false; }
	}

	onMount(() => { loadAdmins(); });

	$: filteredAdmins = admins
		.filter(a => {
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (!(a.email || '').toLowerCase().includes(q) && !(a.role || '').toLowerCase().includes(q) && !(a.displayName || '').toLowerCase().includes(q)) return false;
			}
			if (roleFilter !== 'All' && a.role !== roleFilter) return false;
			return true;
		})
		.sort((a, b) => {
			if (sortOrder === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			if (sortOrder === 'name') return (getAdminName(a)).localeCompare(getAdminName(b));
			return 0;
		});

	function isObjectId(str: string): boolean {
		return /^[a-f\d]{24}$/i.test(str);
	}

	function getAdminName(admin: any): string {
		if (admin.displayName) return admin.displayName;
		if (admin.email && !isObjectId(admin.email)) return admin.email.split('@')[0];
		return 'Anonymous';
	}

	function getAdminEmail(admin: any): string {
		if (admin.email && !isObjectId(admin.email)) return admin.email;
		return '';
	}

	function getRoleInfo(admin: any): { label: string; color: string } {
		return roleLabels[admin.role] || { label: admin.role, color: 'bg-gray-100 text-gray-600' };
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function openUpdate(admin: any) { editAdmin = admin; showUpdateModal = true; }
	function handleSaved() { showAddModal = false; showUpdateModal = false; loadAdmins(); }
</script>

<div>
	<div class="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
		<span>
			<span class="flex items-center gap-1">
				<h4 class="text-lg font-medium">Admins</h4>
				<p class="hidden h-[22px] w-[22px] items-center justify-center rounded-full border border-black bg-[#EBECED] lg:flex">{admins.length}</p>
			</span>
			<p class="text-sm text-[#737577]">Admins have full access to the calendar and can approve events.</p>
		</span>
		<button on:click={() => (showAddModal = true)} class="flex w-full items-center justify-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 sm:w-fit md:text-sm">
			<img src="/profile-add-2.svg" alt="" class="h-4 w-4" /> Add Admin
		</button>
	</div>

	<!-- Search -->
	<div class="mb-4 flex items-center gap-3">
		<div class="relative w-full">
			<input type="text" bind:value={searchQuery} placeholder="Search" class="h-[43px] w-full rounded-lg bg-white py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-0 focus:outline-none" />
			<span class="absolute top-2.5 left-3"><img src="/search-favorite.png" alt="" class="h-5 w-5" /></span>
			<span class="absolute top-2.5 right-0 border-l px-4 py-1.5 text-gray-400"><img src="/search-download.svg" alt="" class="h-4 w-4" /></span>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex items-center justify-between">
		<button class="hidden flex-shrink-0 items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:flex md:text-sm">
			<img src="/filter-edit.svg" alt="" class="h-5 w-5" /> Filter <img src="/arrow-down.svg" alt="" class="h-2 w-3" />
		</button>
		<div class="flex items-center gap-3">
			<div use:clickOutside={() => (showRoleFilter = false)} class="relative">
				<button on:click={() => (showRoleFilter = !showRoleFilter)} class="flex flex-shrink-0 items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<img src="/filter-edit.svg" alt="" class="h-5 w-5" /> {roleFilter === 'All' ? 'All Admin' : roleLabels[roleFilter]?.label || roleFilter} <img src="/arrow-down.svg" alt="" class="h-2 w-3" />
				</button>
				{#if showRoleFilter}
				<div class="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg">
					<button on:click={() => { roleFilter = 'All'; showRoleFilter = false; }} class="flex w-full items-center gap-2 rounded-md p-2 hover:bg-[#EBECED] {roleFilter === 'All' ? 'bg-[#EBECED]' : ''}"><Icon icon="mdi:view-grid-outline" class="text-lg" /> All Admin</button>
					{#each Object.entries(roleLabels) as [key, val]}
					<button on:click={() => { roleFilter = key; showRoleFilter = false; }} class="flex w-full items-center gap-2 rounded-md p-2 hover:bg-[#EBECED] {roleFilter === key ? 'bg-[#EBECED]' : ''}"><Icon icon="mdi:account-outline" class="text-lg" /> {val.label}</button>
					{/each}
				</div>
				{/if}
			</div>
			<div use:clickOutside={() => (showSortFilter = false)} class="relative">
				<button on:click={() => (showSortFilter = !showSortFilter)} class="flex flex-shrink-0 items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm">
					<img src="/filter-edit.svg" alt="" class="h-5 w-5" /> {sortOrder === 'recent' ? 'Recently Joined' : sortOrder === 'oldest' ? 'Oldest First' : 'By Name'} <img src="/arrow-down.svg" alt="" class="h-2 w-3" />
				</button>
				{#if showSortFilter}
				<div class="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white p-2 text-[15px] text-[#768387] shadow-lg">
					<button on:click={() => { sortOrder = 'recent'; showSortFilter = false; }} class="flex w-full items-center gap-2 rounded-md p-2 hover:bg-[#EBECED] {sortOrder === 'recent' ? 'bg-[#EBECED]' : ''}"><Icon icon="mdi:sort-clock-descending" class="text-lg" /> Recently Joined</button>
					<button on:click={() => { sortOrder = 'oldest'; showSortFilter = false; }} class="flex w-full items-center gap-2 rounded-md p-2 hover:bg-[#EBECED] {sortOrder === 'oldest' ? 'bg-[#EBECED]' : ''}"><Icon icon="mdi:sort-clock-ascending" class="text-lg" /> Oldest First</button>
					<button on:click={() => { sortOrder = 'name'; showSortFilter = false; }} class="flex w-full items-center gap-2 rounded-md p-2 hover:bg-[#EBECED] {sortOrder === 'name' ? 'bg-[#EBECED]' : ''}"><Icon icon="mdi:sort-alphabetical-ascending" class="text-lg" /> By Name</button>
				</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Admin List -->
	{#if loading}
	<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
		{#each [1, 2] as _}
		<div class="flex animate-pulse items-center justify-between border-b py-3 last:border-b-0">
			<div class="flex items-center gap-2"><div class="h-6 w-6 rounded-full bg-gray-200"></div><div class="h-4 w-40 rounded bg-gray-200"></div></div>
			<div class="h-4 w-16 rounded bg-gray-200"></div>
		</div>
		{/each}
	</div>
	{:else if filteredAdmins.length > 0}
	<div class="flex flex-col rounded-md bg-[#FDFDFD] px-3">
		{#each filteredAdmins as admin}
		{@const roleInfo = getRoleInfo(admin)}
		<div class="flex items-center justify-between rounded-md border-b py-3 last:border-b-0">
			<div class="flex items-start gap-2">
				<img src="/you-rondwell.png" alt="" class="h-6 w-6 rounded-full" />
				<div class="flex flex-col items-start gap-1 lg:flex-row lg:items-center">
					<span class="flex items-center gap-1">
						<p class="font-medium">{getAdminName(admin)}</p>
						{#if getAdminEmail(admin)}
						<span class="text-[#3CBD2C]">●</span>
						<p class="text-sm text-gray-500">{getAdminEmail(admin)}</p>
						{/if}
					</span>
					<span class="rounded-full px-2 py-0.5 text-xs {roleInfo.color}">{roleInfo.label}</span>
					{#if admin.status === 'PENDING'}
					<span class="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">Pending</span>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-400">{formatDate(admin.createdAt)}</span>
				<button on:click={() => openUpdate(admin)} class="text-gray-400 hover:text-gray-600">
					<Icon icon="mdi:pencil-outline" class="text-lg" />
				</button>
			</div>
		</div>
		{/each}
	</div>
	{:else}
	<div class="flex h-40 flex-col items-center justify-center rounded-md bg-[#FDFDFD]">
		<Icon icon="mdi:account-group-outline" class="mb-2 text-4xl text-gray-300" />
		<p class="text-sm text-gray-400">No admins yet. Add one to get started.</p>
	</div>
	{/if}
</div>

<AddAdmin bind:open={showAddModal} {eventId} on:saved={handleSaved} />
<UpdateAdmin bind:open={showUpdateModal} {eventId} admin={editAdmin} on:saved={handleSaved} />
