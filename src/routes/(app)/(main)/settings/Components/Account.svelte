<script lang="ts">
	import { goto } from '$app/navigation';
	import { getActiveProfile } from '$lib/services/profile.services';
	import {
		begin2FASetup,
		changePrimaryEmail,
		confirm2FASetup,
		disable2FA,
		getActiveSessions,
		getMe,
		invalidateSession,
		requestPasswordSetup,
		updatePersonalInfo,
		updatePhoneNumber,
		updateSocialLinks,
		uploadProfilePicture
	} from '$lib/services/settings.services';
	import { authState, clearUser, setActiveProfile } from '$lib/stores/auth.store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import DeleteAccountModal from './DeleteAccountModal.svelte';

	// ── State ──────────────────────────────────────────────────────────────────
	let token = '';
	let profileId = '';

	let profile = { name: '', username: '', bio: '', profilePicture: '/you-rondwell.png' };
	let socialLinks: Record<string, string> = {
		instagram: '', x: '', youtube: '', tiktok: '', linkedin: '', website: ''
	};

	let userEmail = '';
	let userPhone = '';
	let phoneInput = '';
	let hasPassword = false;
	let twoFactorEnabled = false;
	let sessions: any[] = [];
	let showAllSessions = false;

	// UI state
	let saving = false;
	let savingLinks = false;
	let showChangeEmailInput = false;
	let newEmailInput = '';
	let changingEmail = false;
	let updatingPhone = false;
	let requestingPassword = false;
	let twoFALoading = false;
	let twoFAStep: 'idle' | 'qr' | 'disable' = 'idle';
	let twoFAQr = '';
	let twoFACode = '';
	let twoFABackupCodes: string[] = [];
	let disableCode = '';

	let toast = '';
	let toastType: 'success' | 'error' = 'success';
	let showDeleteModal = false;

	const socialLinksMeta = [
		{ key: 'instagram', icon: 'mdi:instagram', label: 'instagram.com/' },
		{ key: 'x', icon: 'ri:twitter-x-fill', label: 'x.com/' },
		{ key: 'youtube', icon: 'mdi:youtube', label: 'youtube.com/' },
		{ key: 'tiktok', icon: 'ic:baseline-tiktok', label: 'tiktok.com/@' },
		{ key: 'linkedin', icon: 'mdi:linkedin', label: 'linkedin.com/in/' },
		{ key: 'website', icon: 'mdi:web', label: null }
	];

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		toast = msg;
		toastType = type;
		setTimeout(() => (toast = ''), 3500);
	}

	onMount(async () => {
		const currentToken = get(authState).token ?? '';
		if (!currentToken) return;
		token = currentToken;
		try {
			const [user, ap, sess] = await Promise.all([
				getMe(),
				getActiveProfile(),
				getActiveSessions()
			]);
			userEmail = user.email ?? '';
			userPhone = user.phoneNumber ?? '';
			phoneInput = userPhone;
			hasPassword = user.hasPassword;
			twoFactorEnabled = user.twoFactorEnabled;
			sessions = sess ?? [];
			profileId = ap._id;
			profile.name = ap.name ?? '';
			profile.username = (ap as any).username ?? '';
			profile.bio = (ap as any).bio ?? '';
			profile.profilePicture = ap.profilePictureUrl ?? '/you-rondwell.png';
			const sl = (ap as any).socialLinks ?? {};
			socialLinks = {
				instagram: sl.instagram ?? '',
				x: sl.x ?? '',
				youtube: sl.youtube ?? '',
				tiktok: sl.tiktok ?? '',
				linkedin: sl.linkedin ?? '',
				website: sl.website ?? ''
			};
			setActiveProfile(ap);
		} catch (e) {
			console.error('Failed to load settings', e);
			showToast('Failed to load settings data', 'error');
		}
	});
</script>

<!-- Toast -->
{#if toast}
	<div class="fixed top-6 right-6 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg {toastType === 'success' ? 'bg-green-600' : 'bg-red-600'}">
		{toast}
	</div>
{/if}

<!-- Your Profile Section -->
<div class="mb-12">
	<h2 class="mb-1 text-2xl font-medium">Your Profile</h2>
	<p class="mb-4 text-sm text-[#8C8F93]">Choose how you are displayed as a host or guest.</p>

	<div class="flex w-full flex-col-reverse gap-6 md:flex-row md:gap-12">
		<div class="w-full max-w-[350px] space-y-4 text-[#84857A]">
			<div>
				<label for="profile-name" class="mb-1 block text-sm font-medium">Name</label>
				<input id="profile-name" type="text" bind:value={profile.name} class="h-[42px] w-full rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:outline-none" />
			</div>
			<div>
				<label for="profile-username" class="mb-1 block text-sm font-medium">Username</label>
				<div class="flex h-[42px] items-center shadow-sm">
					<div class="pointer-events-none flex h-full items-center rounded-tl-[7.5px] rounded-bl-[7.5px] bg-[#EBECED] p-3">
						<Icon icon="mdi:at" class="h-4 w-4 text-[#616265]" />
					</div>
					<input id="profile-username" type="text" bind:value={profile.username} class="h-full w-full rounded-tr-[7.5px] rounded-br-[7.5px] bg-[#FFFFFF] px-3 py-2 focus:outline-none" />
				</div>
			</div>
			<div>
				<label for="profile-bio" class="mb-1 block text-sm font-medium">Bio</label>
				<textarea id="profile-bio" rows="3" bind:value={profile.bio} placeholder="Share a little about your background and interests." class="w-full resize-none rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:outline-none"></textarea>
			</div>
		</div>

		<!-- Profile Picture -->
		<div>
			<label for="profile-pic-upload" class="mb-2 block text-sm font-medium text-[#84857A]">Profile Picture</label>
			<div class="relative h-30 w-30">
				<img src={profile.profilePicture} alt="Profile" class="h-full w-full rounded-full object-cover" />
				<label for="profile-pic-upload" class="absolute right-0 bottom-0 cursor-pointer">
					<input id="profile-pic-upload" type="file" accept="image/*" class="hidden" on:change={async (e) => {
						const file = (e.target as HTMLInputElement).files?.[0];
						if (!file || !profileId) return;
						try {
							const result = await uploadProfilePicture(profileId, file);
							profile.profilePicture = result.profilePictureUrl;
							showToast('Profile picture updated');
						} catch (err: any) { showToast(err.message, 'error'); }
					}} />
					<svg width="31" height="32" viewBox="0 0 31 32" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M28.6875 13.0528H24.0816C20.3044 13.0528 17.2284 9.97687 17.2284 6.19969V1.59375C17.2284 0.717187 16.5113 0 15.6347 0H8.87719C3.96844 0 0 3.1875 0 8.87719V22.9978C0 28.6875 3.96844 31.875 8.87719 31.875H21.4041C26.3128 31.875 30.2812 28.6875 30.2812 22.9978V14.6466C30.2812 13.77 29.5641 13.0528 28.6875 13.0528ZM14.3916 18.3759C14.1525 18.615 13.8497 18.7266 13.5469 18.7266C13.2441 18.7266 12.9413 18.615 12.7022 18.3759L11.5547 17.2284V23.9062C11.5547 24.5597 11.0128 25.1016 10.3594 25.1016C9.70594 25.1016 9.16406 24.5597 9.16406 23.9062V17.2284L8.01656 18.3759C7.55438 18.8381 6.78937 18.8381 6.32719 18.3759C5.865 17.9137 5.865 17.1488 6.32719 16.6866L9.51469 13.4991C9.62625 13.4034 9.73781 13.3237 9.86531 13.26C9.89719 13.2441 9.945 13.2281 9.97688 13.2122C10.0725 13.1803 10.1681 13.1644 10.2797 13.1484C10.3275 13.1484 10.3594 13.1484 10.4072 13.1484C10.5347 13.1484 10.6622 13.1803 10.7897 13.2281C10.8056 13.2281 10.8056 13.2281 10.8216 13.2281C10.9491 13.2759 11.0766 13.3716 11.1722 13.4672C11.1881 13.4831 11.2041 13.4831 11.2041 13.4991L14.3916 16.6866C14.8537 17.1488 14.8537 17.9137 14.3916 18.3759Z" fill="#292D32"/>
						<path d="M23.7969 10.8527C25.3109 10.8687 27.4147 10.8687 29.2156 10.8687C30.1241 10.8687 30.6022 9.80086 29.9647 9.16336C27.6697 6.85243 23.5578 2.69274 21.1991 0.33399C20.5456 -0.319448 19.4141 0.126802 19.4141 1.03524V6.59743C19.4141 8.9243 21.3903 10.8527 23.7969 10.8527Z" fill="#292D32"/>
					</svg>
				</label>
			</div>
		</div>
	</div>

	<!-- Social Links -->
	<div class="mt-6 text-[#84857A]">
		<h3 class="mb-3 text-sm font-medium">Social Links</h3>
		<div class="grid w-fit grid-cols-1 gap-6 md:grid-cols-2">
			{#each socialLinksMeta as { key, icon, label }}
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
						<Icon {icon} class="h-4 w-4" />
					</div>
					<div class="flex h-[42px] w-full items-center shadow-sm">
						{#if label}
							<div class="pointer-events-none flex h-full items-center rounded-tl-[7.5px] rounded-bl-[7.5px] bg-[#EBECED] p-3 text-xs text-[#84857A]">{label}</div>
						{/if}
						<input type="text" bind:value={socialLinks[key]} placeholder={key === 'website' ? 'https://yoursite.com' : 'username'} class="h-full w-full {key === 'website' ? 'rounded-[7.5px]' : 'rounded-tr-[7.5px] rounded-br-[7.5px]'} bg-[#FFFFFF] px-3 py-2 focus:outline-none" />
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="mt-6 flex gap-3">
		<button on:click={async () => {
			if (!profileId) return;
			saving = true;
			try {
				await updatePersonalInfo(profileId, { name: profile.name, username: profile.username, bio: profile.bio });
				await updateSocialLinks(profileId, socialLinks);
				showToast('Changes saved');
			} catch (e: any) { showToast(e.message, 'error'); } finally { saving = false; }
		}} disabled={saving} class="flex items-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50">
			{saving ? 'Saving...' : 'Save Changes'}
		</button>
	</div>
</div>

<!-- Emails & Phone -->
<div class="mb-12 border-t pt-12">
	<div class="mb-5">
		<div class="mb-2 flex items-center justify-between">
			<span>
				<h2 class="mb-1 text-lg font-semibold">Emails</h2>
				<p class="mb-4 text-sm text-[#8C8F93]">Add additional emails to receive event invites sent to those addresses.</p>
			</span>
			<button on:click={() => (showChangeEmailInput = !showChangeEmailInput)} class="flex items-center gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm font-medium text-[#616265] hover:bg-gray-200">
				<Icon icon="mdi:plus" class="text-xl" /> {showChangeEmailInput ? 'Cancel' : 'Change Email'}
			</button>
		</div>

		<div class="relative mb-2 rounded-md bg-[#FDFDFD] p-3 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<span class="flex items-center gap-2 text-sm font-medium">
						{userEmail || 'Loading...'}
						<p class="w-fit rounded-md bg-[#EBECED] px-2 py-1 text-xs text-[#616265]">Primary</p>
					</span>
					<p class="mt-2 text-xs text-gray-500">This email will be shared with hosts when you register for their events.</p>
				</div>
			</div>
		</div>

		{#if showChangeEmailInput}
			<div class="mt-3 flex gap-2">
				<input type="email" bind:value={newEmailInput} placeholder="New email address" class="h-[42px] flex-1 rounded-[7.5px] bg-white px-3 shadow-sm focus:outline-none" />
				<button on:click={async () => {
					if (!newEmailInput) return;
					changingEmail = true;
					try {
						await changePrimaryEmail(newEmailInput);
						showToast('Verification sent to new email');
						showChangeEmailInput = false; newEmailInput = '';
					} catch (e: any) { showToast(e.message, 'error'); } finally { changingEmail = false; }
				}} disabled={changingEmail} class="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
					{changingEmail ? 'Sending...' : 'Send Verification'}
				</button>
			</div>
		{/if}
	</div>

	<!-- Phone -->
	<div>
		<h2 class="mb-1 text-lg font-semibold">Phone Number</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">Manage the phone number you use to sign in and receive SMS updates.</p>
		<div class="mb-3 flex h-[42px] max-w-70 items-center gap-2">
			<input type="text" bind:value={phoneInput} class="h-[42px] w-full rounded-[7.5px] bg-[#FFFFFF] px-3 py-2 shadow-sm focus:outline-none" />
			<button on:click={async () => {
				updatingPhone = true;
				try {
					await updatePhoneNumber(phoneInput);
					showToast('Verification sent to new number');
				} catch (e: any) { showToast(e.message, 'error'); } finally { updatingPhone = false; }
			}} disabled={updatingPhone} class="h-full rounded-md bg-[#939596] px-3 py-2 font-medium text-white hover:bg-gray-700 disabled:opacity-50">
				{updatingPhone ? '...' : 'Update'}
			</button>
		</div>
		<p class="text-xs text-[#8C8F93]">For your security, we will send you a code to verify any change to your phone number.</p>
	</div>
</div>

<!-- Password & Security -->
<div class="mb-12 border-t pt-12">
	<h1 class="mb-1 text-xl font-bold">Password & Security</h1>
	<p class="mb-4 text-sm text-[#8C8F93]">Secure your account with password and two-factor authentication.</p>

	<!-- Account Password -->
	<div class="mb-4 rounded-lg bg-[#FDFDFD] p-4">
		<div class="flex flex-col items-start justify-between gap-3 md:flex-row">
			<div class="flex items-start gap-3">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 7.5V6C4.5 3.5175 5.25 1.5 9 1.5C12.75 1.5 13.5 3.5175 13.5 6V7.5" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.125 12C7.125 13.035 7.965 13.875 9 13.875C10.035 13.875 10.875 13.035 10.875 12C10.875 10.965 10.035 10.125 9 10.125" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 12.75V11.25C16.5 8.25 15.75 7.5 12.75 7.5H5.25C2.25 7.5 1.5 8.25 1.5 11.25V12.75C1.5 15.75 2.25 16.5 5.25 16.5H12.75C14.07 16.5 14.955 16.3575 15.5325 15.9375" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
				<div>
					<h3 class="font-medium">Account Password</h3>
					<p class="mt-1 text-xs text-gray-500">
						{hasPassword ? 'Your account has a password set.' : 'No password set. Click to receive a setup link via email.'}
					</p>
				</div>
			</div>
			<button on:click={async () => {
				requestingPassword = true;
				try {
					await requestPasswordSetup();
					showToast('Password setup link sent to your email');
				} catch (e: any) { showToast(e.message, 'error'); } finally { requestingPassword = false; }
			}} disabled={requestingPassword} class="rounded bg-black px-3 py-1 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
				{requestingPassword ? 'Sending...' : hasPassword ? 'Change Password' : 'Set Password'}
			</button>
		</div>
	</div>

	<!-- Two-Factor Authentication -->
	<div class="mb-4 rounded-lg bg-[#FDFDFD] p-4">
		<div class="flex flex-col items-start justify-between gap-3 md:flex-row">
			<div class="flex items-start gap-3">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.78906 8.90031L7.99656 10.1078L11.2216 6.88281" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.4436 4.59187C15.4436 3.66937 14.7386 2.64937 13.8761 2.32687L10.1336 0.924375C9.51109 0.691875 8.49109 0.691875 7.86859 0.924375L4.12609 2.33438C3.26359 2.65688 2.55859 3.67687 2.55859 4.59187V10.1644C2.55859 11.0494 3.14359 12.2119 3.85609 12.7444L7.08109 15.1519C8.13859 15.9469 9.87859 15.9469 10.9361 15.1519L14.1611 12.7444C14.8736 12.2119 15.4586 11.0494 15.4586 10.1644V7.52437" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
				<div>
					<h3 class="font-medium">Two-Factor Authentication</h3>
					<p class="mt-1 text-xs text-gray-500">
						{twoFactorEnabled ? '2FA is enabled on your account.' : 'Add an extra layer of security with an authenticator app.'}
					</p>
				</div>
			</div>
			{#if !twoFactorEnabled}
				<button on:click={async () => {
					twoFALoading = true;
					try {
						const data = await begin2FASetup();
						twoFAQr = data.qrCode;
						twoFAStep = 'qr';
					} catch (e: any) { showToast(e.message, 'error'); } finally { twoFALoading = false; }
				}} disabled={twoFALoading} class="rounded bg-black px-3 py-1 text-sm font-medium text-white disabled:opacity-50">
					{twoFALoading ? '...' : 'Enable 2FA'}
				</button>
			{:else}
				<button on:click={() => (twoFAStep = 'disable')} class="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700">
					Disable 2FA
				</button>
			{/if}
		</div>

		{#if twoFAStep === 'qr'}
			<div class="mt-4 border-t pt-4">
				<p class="mb-2 text-sm text-gray-600">Scan this QR code with your authenticator app, then enter the code below.</p>
				{#if twoFAQr}<img src={twoFAQr} alt="2FA QR Code" class="mb-3 h-40 w-40" />{/if}
				<div class="flex gap-2">
					<input type="text" bind:value={twoFACode} placeholder="6-digit code" maxlength={6} class="h-[42px] w-40 rounded-[7.5px] bg-white px-3 shadow-sm focus:outline-none" />
					<button on:click={async () => {
						twoFALoading = true;
						try {
							const result = await confirm2FASetup(twoFACode);
							twoFABackupCodes = result.backupCodes;
							twoFactorEnabled = true;
							twoFAStep = 'idle';
							showToast('2FA enabled successfully');
						} catch (e: any) { showToast(e.message, 'error'); } finally { twoFALoading = false; }
					}} disabled={twoFALoading} class="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
						{twoFALoading ? '...' : 'Verify'}
					</button>
					<button on:click={() => (twoFAStep = 'idle')} class="rounded bg-gray-200 px-4 py-2 text-sm">Cancel</button>
				</div>
				{#if twoFABackupCodes.length > 0}
					<div class="mt-3 rounded bg-yellow-50 p-3 text-xs">
						<p class="mb-1 font-semibold">Save these backup codes:</p>
						{#each twoFABackupCodes as code}<p class="font-mono">{code}</p>{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#if twoFAStep === 'disable'}
			<div class="mt-4 border-t pt-4">
				<p class="mb-2 text-sm text-gray-600">Enter your authenticator code to disable 2FA.</p>
				<div class="flex gap-2">
					<input type="text" bind:value={disableCode} placeholder="6-digit code" maxlength={6} class="h-[42px] w-40 rounded-[7.5px] bg-white px-3 shadow-sm focus:outline-none" />
					<button on:click={async () => {
						twoFALoading = true;
						try {
							await disable2FA(disableCode);
							twoFactorEnabled = false; twoFAStep = 'idle'; disableCode = '';
							showToast('2FA disabled');
						} catch (e: any) { showToast(e.message, 'error'); } finally { twoFALoading = false; }
					}} disabled={twoFALoading} class="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50">
						{twoFALoading ? '...' : 'Confirm Disable'}
					</button>
					<button on:click={() => (twoFAStep = 'idle')} class="rounded bg-gray-200 px-4 py-2 text-sm">Cancel</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Active Devices / Sessions -->
<div class="border-t pt-12 mb-12">
	<div class="mb-8">
		<h2 class="mb-1 text-lg font-semibold">Active Devices</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">See the list of devices you are currently signed into Rondwell from.</p>

		{#if sessions.length === 0}
			<p class="text-sm text-gray-400">No active sessions found.</p>
		{/if}
		{#each (showAllSessions ? sessions : sessions.slice(0, 3)) as session, i}
			<div class="mb-3 rounded-lg bg-[#FDFDFD] p-4">
				<div class="flex items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.83 1.5H13.1625C15.8325 1.5 16.5 2.1675 16.5 4.83V9.5775C16.5 12.2475 15.8325 12.9075 13.17 12.9075H4.83C2.1675 12.915 1.5 12.2475 1.5 9.585V4.83C1.5 2.1675 2.1675 1.5 4.83 1.5Z" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12.9141V16.4991" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.625 16.5H12.375" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						<div>
							<div class="flex items-center gap-2">
								<span class="font-medium">{session.deviceInfo?.userAgent?.slice(0, 40) ?? 'Unknown device'}</span>
								{#if i === 0}<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">This Device</span>{/if}
							</div>
							<div class="mt-1 text-sm font-light text-gray-500">
								{session.deviceInfo?.ipAddress ?? ''} | {new Date(session.lastActivityAt).toLocaleDateString()}
							</div>
						</div>
					</div>
					{#if i !== 0}
						<button on:click={async () => {
							try {
								await invalidateSession(session._id);
								sessions = sessions.filter((_: any, idx: number) => idx !== i);
								showToast('Session removed');
							} catch (e: any) { showToast(e.message, 'error'); }
						}} class="text-xs text-red-500 hover:underline">Remove</button>
					{/if}
				</div>
			</div>
		{/each}

		{#if sessions.length > 3}
		<button
			on:click={() => showAllSessions = !showAllSessions}
			class="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
		>
			{#if showAllSessions}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 15l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
				View Less
			{:else}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
				Load More ({sessions.length - 3} more)
			{/if}
		</button>
		{/if}
	</div>

	<!-- Delete Account -->
	<div>
		<h2 class="mb-1 text-lg font-semibold">Delete Account</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">If you no longer wish to use Rondwell, you can permanently delete your account.</p>
		<button on:click={() => (showDeleteModal = true)} class="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6.75V10.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.99958 16.0584H4.45458C1.85208 16.0584 0.764583 14.1984 2.02458 11.9259L4.36458 7.71094L6.56958 3.75094C7.90458 1.34344 10.0946 1.34344 11.4296 3.75094L13.6346 7.71844L15.9746 11.9334C17.2346 14.2059 16.1396 16.0659 13.5446 16.0659H8.99958V16.0584Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.99609 12.75H9.00283" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			Delete Account
		</button>
	</div>
</div>

<DeleteAccountModal bind:open={showDeleteModal} />
