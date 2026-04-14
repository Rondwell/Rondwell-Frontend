<script lang="ts">
	import { changeAdminPassword, getAdminProfile, getAdminUser, updateAdminProfile } from '$lib/services/admin.services';
	import { onMount } from 'svelte';

	let activeTab = 'profile';
	let profile = { name: '', email: '', role: '', lastLogin: '' };
	let loading = true;

	// Profile form
	let nameInput = '';
	let emailInput = '';
	let saving = false;

	// Password form
	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let changingPassword = false;

	// Toast
	let toast = '';
	let toastType: 'success' | 'error' = 'success';

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		toast = msg; toastType = type;
		setTimeout(() => (toast = ''), 3500);
	}

	onMount(async () => {
		try {
			const data = await getAdminProfile();
			profile = data;
			nameInput = data.name;
			emailInput = data.email;
		} catch (e) {
			const cached = getAdminUser();
			if (cached) { profile = cached; nameInput = cached.name; emailInput = cached.email; }
		} finally { loading = false; }
	});

	async function handleSaveProfile() {
		saving = true;
		try {
			const updated = await updateAdminProfile({ name: nameInput, email: emailInput });
			profile = { ...profile, ...updated };
			showToast('Profile updated');
		} catch (e: any) { showToast(e.message, 'error'); }
		finally { saving = false; }
	}

	async function handleChangePassword() {
		if (!currentPassword || !newPassword) { showToast('Fill in all fields', 'error'); return; }
		if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
		if (newPassword.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
		changingPassword = true;
		try {
			await changeAdminPassword(currentPassword, newPassword);
			showToast('Password changed');
			currentPassword = ''; newPassword = ''; confirmPassword = '';
		} catch (e: any) { showToast(e.message, 'error'); }
		finally { changingPassword = false; }
	}

	const tabs = [
		{ id: 'profile', label: 'Profile' },
		{ id: 'security', label: 'Security' },
	];
</script>

<svelte:head><title>Settings | Rondwell HQ</title></svelte:head>

<!-- Toast -->
{#if toast}
	<div class="fixed top-6 right-6 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg {toastType === 'success' ? 'bg-green-600' : 'bg-red-600'}">
		{toast}
	</div>
{/if}

<div class="max-w-2xl">
	<div class="mb-6">
		<h1 class="text-3xl font-semibold text-gray-900">Settings</h1>
		<p class="mt-1 text-sm text-gray-500">Manage your admin account</p>
	</div>

	<!-- Tabs -->
	<div class="mb-8">
		<nav class="flex gap-1 border-b border-gray-200">
			{#each tabs as tab}
				<button on:click={() => (activeTab = tab.id)}
					class="border-b-2 px-4 pb-3 text-sm font-medium transition {activeTab === tab.id ? 'border-[#DB3EC6] text-[#DB3EC6]' : 'border-transparent text-gray-500 hover:text-gray-700'}">
					{tab.label}
				</button>
			{/each}
		</nav>
	</div>

	{#if loading}
		<div class="animate-pulse space-y-4">
			{#each Array(4) as _}<div class="h-12 w-full rounded-lg bg-gray-200"></div>{/each}
		</div>
	{:else if activeTab === 'profile'}
		<!-- Profile Settings -->
		<div class="space-y-8">
			<div>
				<h2 class="mb-1 text-xl font-medium text-gray-900">Admin Profile</h2>
				<p class="mb-6 text-sm text-[#8C8F93]">Update your admin account details.</p>

				<div class="flex items-center gap-4 mb-6">
					<div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#513BE2]/10 text-xl font-semibold text-[#513BE2]">
						{profile.name?.charAt(0) || 'A'}
					</div>
					<div>
						<p class="font-medium text-gray-800">{profile.name}</p>
						<p class="text-sm text-gray-400">{profile.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="admin-name" class="mb-1 block text-sm font-medium text-[#84857A]">Name</label>
						<input id="admin-name" type="text" bind:value={nameInput}
							class="h-[44px] w-full rounded-lg bg-white px-4 shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
					</div>
					<div>
						<label for="admin-email-setting" class="mb-1 block text-sm font-medium text-[#84857A]">Email</label>
						<input id="admin-email-setting" type="email" bind:value={emailInput}
							class="h-[44px] w-full rounded-lg bg-white px-4 shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
					</div>
				</div>

				<button on:click={handleSaveProfile} disabled={saving}
					class="mt-6 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50">
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>

			{#if profile.lastLogin}
				<div class="border-t border-gray-200 pt-6">
					<p class="text-xs text-gray-400">Last login: {new Date(profile.lastLogin).toLocaleString()}</p>
				</div>
			{/if}
		</div>

	{:else if activeTab === 'security'}
		<!-- Security Settings -->
		<div>
			<h2 class="mb-1 text-xl font-medium text-gray-900">Change Password</h2>
			<p class="mb-6 text-sm text-[#8C8F93]">Update your admin password.</p>

			<div class="space-y-4">
				<div>
					<label for="current-pw" class="mb-1 block text-sm font-medium text-[#84857A]">Current Password</label>
					<input id="current-pw" type="password" bind:value={currentPassword}
						class="h-[44px] w-full rounded-lg bg-white px-4 shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
				</div>
				<div>
					<label for="new-pw" class="mb-1 block text-sm font-medium text-[#84857A]">New Password</label>
					<input id="new-pw" type="password" bind:value={newPassword} placeholder="Min 8 characters"
						class="h-[44px] w-full rounded-lg bg-white px-4 shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
				</div>
				<div>
					<label for="confirm-pw" class="mb-1 block text-sm font-medium text-[#84857A]">Confirm New Password</label>
					<input id="confirm-pw" type="password" bind:value={confirmPassword}
						class="h-[44px] w-full rounded-lg bg-white px-4 shadow-sm focus:ring-1 focus:ring-[#513BE2] focus:outline-none" />
				</div>
			</div>

			<button on:click={handleChangePassword} disabled={changingPassword}
				class="mt-6 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50">
				{changingPassword ? 'Changing...' : 'Change Password'}
			</button>
		</div>
	{/if}
</div>
