<script lang="ts">
	import { goto } from '$app/navigation';
	import { getActiveProfile } from '$lib/services/profile.services';
	import {
		begin2FASetup,
		beginPasskeyRegistration,
		changePrimaryEmail,
		verifyPrimaryEmailChange,
		addAdditionalEmail,
		verifyAdditionalEmail,
		removeAdditionalEmail,
		completePasskeyRegistration,
		confirm2FASetup,
		disable2FA,
		getActiveSessions,
		getMe,
		invalidateSession,
		listPasskeys,
		removePasskey,
		regenerateBackupCodes,
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
	let additionalEmails: string[] = [];
	let hasPassword = false;
	let twoFactorEnabled = false;
	let sessions: any[] = [];
	let showAllSessions = false;

	// UI state
	let saving = false;
	let savingLinks = false;
	// ── Primary email change (2-step: request OTP → verify) ──────────────────────
	let showChangeEmailInput = false;
	let newEmailInput = '';
	let changingEmail = false;
	let emailStep: 'enter' | 'verify' = 'enter';
	let emailOtpInput = '';
	let verifyingEmail = false;
	let pendingEmail = '';
	// ── Secondary email add (2-step: request OTP → verify) ───────────────────────
	let showAddEmailInput = false;
	let newSecondaryEmail = '';
	let addingSecondary = false;
	let secondaryStep: 'enter' | 'verify' = 'enter';
	let secondaryOtpInput = '';
	let verifyingSecondary = false;
	let pendingSecondaryEmail = '';
	let removingEmail = '';
	let updatingPhone = false;
	let requestingPassword = false;
	let twoFALoading = false;
	let twoFAStep: 'idle' | 'qr' | 'disable' | 'backup' = 'idle';
	let twoFAQr = '';
	let twoFACode = '';
	let twoFABackupCodes: string[] = [];
	let backupCodesContext: 'setup' | 'regenerate' = 'setup';
	let regeneratingCodes = false;
	let disableCode = '';

	let toast = '';
	let toastType: 'success' | 'error' = 'success';
	let showDeleteModal = false;
	// FE-P3-10 — pending soft-delete state. Banner / button copy adapt when set.
	let deletionScheduledFor: string | null = null;

	// Passkey state
	let passkeys: Array<{ id: string; name: string; createdIndex: number; createdAt: string }> = [];
	let passkeyLoading = false;
	let passkeyRegistering = false;
	let passkeyNameInput = '';

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

	// ── 2FA backup code helpers ─────────────────────────────────────────────────
	async function copyBackupCodes() {
		try {
			await navigator.clipboard.writeText(twoFABackupCodes.join('\n'));
			showToast('Backup codes copied to clipboard');
		} catch {
			showToast('Could not copy. Please copy them manually.', 'error');
		}
	}

	function downloadBackupCodes() {
		const content =
			`Rondwell two-factor backup codes\n` +
			`Generated: ${new Date().toLocaleString()}\n\n` +
			`Each code can be used once. Store them somewhere safe.\n\n` +
			twoFABackupCodes.join('\n') + '\n';
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'rondwell-backup-codes.txt';
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleRegenerateBackupCodes() {
		regeneratingCodes = true;
		try {
			const result = await regenerateBackupCodes();
			twoFABackupCodes = result.backupCodes;
			backupCodesContext = 'regenerate';
			twoFAStep = 'backup';
		} catch (e: any) {
			showToast(e.message, 'error');
		} finally {
			regeneratingCodes = false;
		}
	}

	// ── Primary email change handlers ────────────────────────────────────────────
	function resetEmailChange() {
		showChangeEmailInput = false;
		emailStep = 'enter';
		newEmailInput = '';
		emailOtpInput = '';
		pendingEmail = '';
	}

	async function handleRequestEmailChange() {
		if (!newEmailInput) return;
		changingEmail = true;
		try {
			await changePrimaryEmail(newEmailInput);
			pendingEmail = newEmailInput;
			emailStep = 'verify';
			showToast('Verification code sent to your new email');
		} catch (e: any) {
			showToast(e.message, 'error');
		} finally {
			changingEmail = false;
		}
	}

	async function handleVerifyEmailChange() {
		if (!emailOtpInput) return;
		verifyingEmail = true;
		try {
			const res = await verifyPrimaryEmailChange(emailOtpInput);
			userEmail = res?.data?.email ?? pendingEmail;
			showToast('Your primary email has been updated');
			resetEmailChange();
		} catch (e: any) {
			showToast(e.message, 'error');
		} finally {
			verifyingEmail = false;
		}
	}

	// ── Secondary email handlers ─────────────────────────────────────────────────
	function resetAddEmail() {
		showAddEmailInput = false;
		secondaryStep = 'enter';
		newSecondaryEmail = '';
		secondaryOtpInput = '';
		pendingSecondaryEmail = '';
	}

	async function handleRequestAddEmail() {
		if (!newSecondaryEmail) return;
		addingSecondary = true;
		try {
			await addAdditionalEmail(newSecondaryEmail);
			pendingSecondaryEmail = newSecondaryEmail;
			secondaryStep = 'verify';
			showToast('Verification code sent to that email');
		} catch (e: any) {
			showToast(e.message, 'error');
		} finally {
			addingSecondary = false;
		}
	}

	async function handleVerifyAddEmail() {
		if (!secondaryOtpInput) return;
		verifyingSecondary = true;
		try {
			const data = await verifyAdditionalEmail(secondaryOtpInput);
			additionalEmails = data?.additionalEmails ?? [...additionalEmails, pendingSecondaryEmail];
			showToast('Email added successfully');
			resetAddEmail();
		} catch (e: any) {
			showToast(e.message, 'error');
		} finally {
			verifyingSecondary = false;
		}
	}

	async function handleRemoveEmail(email: string) {
		removingEmail = email;
		try {
			const data = await removeAdditionalEmail(email);
			additionalEmails = data?.additionalEmails ?? additionalEmails.filter((e) => e !== email);
			showToast('Email removed');
		} catch (e: any) {
			showToast(e.message, 'error');
		} finally {
			removingEmail = '';
		}
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
			additionalEmails = user.additionalEmails ?? [];
			// If a primary-email change is awaiting verification, resume at the OTP step.
			if (user.pendingEmail) {
				pendingEmail = user.pendingEmail;
				newEmailInput = user.pendingEmail;
				emailStep = 'verify';
				showChangeEmailInput = true;
			}
			if (user.pendingAdditionalEmail) {
				pendingSecondaryEmail = user.pendingAdditionalEmail;
				newSecondaryEmail = user.pendingAdditionalEmail;
				secondaryStep = 'verify';
				showAddEmailInput = true;
			}
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
			// Load passkeys
			try { passkeys = await listPasskeys(); } catch { /* no passkeys */ }
			// FE-P3-10 — load any pending soft-delete request so the banner
			// surfaces immediately on mount.
			try {
				const { getAccountDeletionStatus } = await import('$lib/services/wallet.services');
				const s = await getAccountDeletionStatus();
				deletionScheduledFor = s?.scheduledFor ?? null;
			} catch { /* no pending request */ }
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
	<p class="mb-4 text-sm text-[#8C8F93]">Choose how you are displayed as an organizer or attendee.</p>

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
			<div class="flex items-center gap-2">
				<button on:click={() => { if (showChangeEmailInput) { resetEmailChange(); } else { showChangeEmailInput = true; } }} class="flex items-center gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm font-medium text-[#616265] hover:bg-gray-200">
					<Icon icon="mdi:pencil-outline" class="text-lg" /> {showChangeEmailInput ? 'Cancel' : 'Change Email'}
				</button>
				<button on:click={() => { if (showAddEmailInput) { resetAddEmail(); } else { showAddEmailInput = true; } }} class="flex items-center gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm font-medium text-[#616265] hover:bg-gray-200">
					<Icon icon="mdi:plus" class="text-xl" /> {showAddEmailInput ? 'Cancel' : 'Add Email'}
				</button>
			</div>
		</div>

		<!-- Primary email -->
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

		<!-- Additional emails -->
		{#each additionalEmails as email}
			<div class="relative mb-2 rounded-md bg-[#FDFDFD] p-3 shadow-sm">
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-2 text-sm font-medium">
						{email}
						<span class="w-fit rounded-md bg-[#EBECED] px-2 py-1 text-xs text-[#616265]">Additional</span>
					</span>
					<button on:click={() => handleRemoveEmail(email)} disabled={removingEmail === email} class="text-xs text-red-500 hover:underline disabled:opacity-50">
						{removingEmail === email ? 'Removing...' : 'Remove'}
					</button>
				</div>
			</div>
		{/each}

		<!-- Change primary email flow -->
		{#if showChangeEmailInput}
			<div class="mt-3 rounded-md bg-[#FDFDFD] p-3 shadow-sm">
				{#if emailStep === 'enter'}
					<div class="flex gap-2">
						<input type="email" bind:value={newEmailInput} placeholder="New primary email address" class="h-[42px] flex-1 rounded-[7.5px] bg-white px-3 shadow-sm focus:outline-none" />
						<button on:click={handleRequestEmailChange} disabled={changingEmail} class="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
							{changingEmail ? 'Sending...' : 'Send Code'}
						</button>
					</div>
					<p class="mt-2 text-xs text-[#8C8F93]">We'll send a verification code to the new address. Your email only changes once you confirm the code.</p>
				{:else}
					<p class="mb-2 text-sm text-gray-600">Enter the 6-digit code we sent to <strong>{pendingEmail}</strong>.</p>
					<div class="flex gap-2">
						<input type="text" inputmode="numeric" maxlength={6} bind:value={emailOtpInput} placeholder="6-digit code" class="h-[42px] w-40 rounded-[7.5px] bg-white px-3 shadow-sm focus:outline-none" />
						<button on:click={handleVerifyEmailChange} disabled={verifyingEmail} class="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
							{verifyingEmail ? 'Verifying...' : 'Verify & Update'}
						</button>
						<button on:click={handleRequestEmailChange} disabled={changingEmail} class="rounded-md bg-gray-200 px-3 py-2 text-sm">
							{changingEmail ? '...' : 'Resend'}
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Add additional email flow -->
		{#if showAddEmailInput}
			<div class="mt-3 rounded-md bg-[#FDFDFD] p-3 shadow-sm">
				{#if secondaryStep === 'enter'}
					<div class="flex gap-2">
						<input type="email" bind:value={newSecondaryEmail} placeholder="Additional email address" class="h-[42px] flex-1 rounded-[7.5px] bg-white px-3 shadow-sm focus:outline-none" />
						<button on:click={handleRequestAddEmail} disabled={addingSecondary} class="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
							{addingSecondary ? 'Sending...' : 'Send Code'}
						</button>
					</div>
					<p class="mt-2 text-xs text-[#8C8F93]">We'll send a verification code to confirm you own this address.</p>
				{:else}
					<p class="mb-2 text-sm text-gray-600">Enter the 6-digit code we sent to <strong>{pendingSecondaryEmail}</strong>.</p>
					<div class="flex gap-2">
						<input type="text" inputmode="numeric" maxlength={6} bind:value={secondaryOtpInput} placeholder="6-digit code" class="h-[42px] w-40 rounded-[7.5px] bg-white px-3 shadow-sm focus:outline-none" />
						<button on:click={handleVerifyAddEmail} disabled={verifyingSecondary} class="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
							{verifyingSecondary ? 'Verifying...' : 'Verify & Add'}
						</button>
						<button on:click={handleRequestAddEmail} disabled={addingSecondary} class="rounded-md bg-gray-200 px-3 py-2 text-sm">
							{addingSecondary ? '...' : 'Resend'}
						</button>
					</div>
				{/if}
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
				<div class="flex gap-2">
					<button on:click={handleRegenerateBackupCodes} disabled={regeneratingCodes} class="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
						{regeneratingCodes ? '...' : 'Backup Codes'}
					</button>
					<button on:click={() => (twoFAStep = 'disable')} class="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700">
						Disable 2FA
					</button>
				</div>
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
							twoFACode = '';
							backupCodesContext = 'setup';
							twoFAStep = 'backup';
							showToast('2FA enabled successfully');
						} catch (e: any) { showToast(e.message, 'error'); } finally { twoFALoading = false; }
					}} disabled={twoFALoading} class="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
						{twoFALoading ? '...' : 'Verify'}
					</button>
					<button on:click={() => { twoFAStep = 'idle'; twoFACode = ''; }} class="rounded bg-gray-200 px-4 py-2 text-sm">Cancel</button>
				</div>
			</div>
		{/if}

		{#if twoFAStep === 'backup'}
			<div class="mt-4 border-t pt-4">
				<p class="text-sm font-medium text-gray-800">
					{backupCodesContext === 'setup' ? 'Two-factor authentication is on.' : 'New backup codes generated.'}
				</p>
				<p class="mt-1 mb-3 text-xs text-gray-500">
					Save these backup codes somewhere safe. Each code can be used once to sign in if you lose access to your authenticator app.
					{#if backupCodesContext === 'regenerate'}Your previous backup codes are no longer valid.{/if}
				</p>
				<div class="rounded bg-yellow-50 p-3">
					<div class="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm text-gray-800">
						{#each twoFABackupCodes as code}<span>{code}</span>{/each}
					</div>
				</div>
				<div class="mt-3 flex flex-wrap gap-2">
					<button on:click={copyBackupCodes} class="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">Copy</button>
					<button on:click={downloadBackupCodes} class="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">Download</button>
					<button on:click={() => { twoFAStep = 'idle'; twoFABackupCodes = []; }} class="rounded bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800">I've saved them</button>
				</div>
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

<!-- Passkeys -->
<div class="mb-12 border-t pt-12">
	<h1 class="mb-1 text-xl font-bold">Passkeys</h1>
	<p class="mb-4 text-sm text-[#8C8F93]">Sign in faster and more securely with passkeys. You can register multiple devices.</p>

	<div class="mb-4 rounded-lg bg-[#FDFDFD] p-4">
		<div class="flex flex-col items-start justify-between gap-3 md:flex-row">
			<div class="flex items-start gap-3">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.25 6.75C11.25 8.82 9.57 10.5 7.5 10.5C5.43 10.5 3.75 8.82 3.75 6.75C3.75 4.68 5.43 3 7.5 3C9.57 3 11.25 4.68 11.25 6.75Z" stroke="#A3A5A5" stroke-width="1.5"/><path d="M12.75 10.5V15L14.25 13.875L15.75 15V10.5" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.0075 13.2675C3.0075 13.2675 4.5 12 7.5 12C8.1 12 8.6475 12.0675 9.135 12.18" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
				<div>
					<h3 class="font-medium">Registered Passkeys</h3>
					<p class="mt-1 text-xs text-gray-500">
						{passkeys.length === 0 ? 'No passkeys registered yet. Add one to enable passwordless sign-in.' : `${passkeys.length} passkey${passkeys.length > 1 ? 's' : ''} registered.`}
					</p>
				</div>
			</div>
		</div>

		<!-- Add passkey form -->
		<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
			<input type="text" bind:value={passkeyNameInput} placeholder="e.g. Work Laptop, iPhone, Security Key" class="h-[42px] w-full rounded-[7.5px] bg-white px-3 shadow-sm focus:outline-none text-sm" />
			<button on:click={async () => {
				if (!passkeyNameInput.trim()) { showToast('Please enter a name for this passkey', 'error'); return; }
				passkeyRegistering = true;
				try {
					const options = await beginPasskeyRegistration(userEmail);
					// Use WebAuthn browser API
					const publicKeyOptions = {
						...options,
						challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), (c: string) => c.charCodeAt(0)),
						user: { ...options.user, id: Uint8Array.from(atob(options.user.id.replace(/-/g, '+').replace(/_/g, '/')), (c: string) => c.charCodeAt(0)) },
						excludeCredentials: (options.excludeCredentials || []).map((c: any) => ({
							...c,
							id: Uint8Array.from(atob(c.id.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0)),
						})),
					};
					const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
					if (!credential) throw new Error('Passkey creation cancelled');
					const cred = credential as PublicKeyCredential;
					const response = cred.response as AuthenticatorAttestationResponse;
					const userId = get(authState).user?.id;
					if (!userId) throw new Error('Not authenticated');

					// Convert ArrayBuffers to base64url for @simplewebauthn/server
					function bufferToBase64url(buffer: ArrayBuffer): string {
						const bytes = new Uint8Array(buffer);
						let binary = '';
						for (const b of bytes) binary += String.fromCharCode(b);
						return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
					}

					await completePasskeyRegistration(userId, {
						email: userEmail,
						passkeyName: passkeyNameInput.trim(),
						response: {
							id: cred.id,
							rawId: bufferToBase64url(cred.rawId),
							type: cred.type,
							response: {
								attestationObject: bufferToBase64url(response.attestationObject),
								clientDataJSON: bufferToBase64url(response.clientDataJSON),
							},
							clientExtensionResults: cred.getClientExtensionResults(),
						},
					});
					passkeys = await listPasskeys();
					passkeyNameInput = '';
					showToast('Passkey registered successfully');
				} catch (e: any) {
					if (e.name !== 'NotAllowedError') showToast(e.message || 'Failed to register passkey', 'error');
				} finally { passkeyRegistering = false; }
			}} disabled={passkeyRegistering} class="h-[42px] w-full rounded bg-black px-4 text-sm font-medium text-white whitespace-nowrap disabled:opacity-50 sm:w-auto">
				{passkeyRegistering ? 'Registering...' : 'Add Passkey'}
			</button>
		</div>

		{#if passkeys.length > 0}
			<div class="mt-4 border-t pt-3 space-y-2">
				{#each passkeys as pk, i}
					<div class="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
						<div class="flex items-center gap-2">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6.667V5.333C4 3.124 4.667 1.333 8 1.333c3.333 0 4 1.791 4 4v1.334" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.333 14.667H4.667c-2.667 0-3.334-.667-3.334-3.334v-1.333c0-2.667.667-3.333 3.334-3.333h6.666c2.667 0 3.334.666 3.334 3.333v1.333c0 2.667-.667 3.334-3.334 3.334z" stroke="#A3A5A5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
							<div>
								<span class="text-sm font-medium">{pk.name}</span>
								<p class="text-xs text-gray-400">Added {new Date(pk.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
							</div>
						</div>
						<button on:click={async () => {
							passkeyLoading = true;
							try {
								await removePasskey(pk.id);
								passkeys = passkeys.filter(p => p.id !== pk.id);
								showToast('Passkey removed');
							} catch (e: any) { showToast(e.message, 'error'); } finally { passkeyLoading = false; }
						}} disabled={passkeyLoading} class="text-xs text-red-500 hover:underline disabled:opacity-50">Remove</button>
					</div>
				{/each}
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
		<!--
			FE-P3-10 (NEW-9.2): Self-service deletion with a 30-day grace
			window. The modal handles the request / cancel / status flow;
			the banner below is a quick-glance state hint when a deletion
			is already pending.
		-->
		<p class="mb-4 text-sm text-[#8C8F93]">
			Account deletion is a 30-day grace flow. Your personal data is anonymised after the window;
			financial records are retained for 7 years to meet regulatory requirements.
		</p>

		{#if deletionScheduledFor}
			<div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
				<p class="font-medium">
					Your account is scheduled for deletion on
					{new Date(deletionScheduledFor).toLocaleDateString(undefined, {
						month: 'long',
						day: 'numeric',
						year: 'numeric',
					})}.
				</p>
				<button
					type="button"
					on:click={() => (showDeleteModal = true)}
					class="mt-1 text-xs font-medium text-amber-900 underline"
				>
					Manage request →
				</button>
			</div>
		{/if}

		<button on:click={() => (showDeleteModal = true)} class="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6.75V10.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.99958 16.0584H4.45458C1.85208 16.0584 0.764583 14.1984 2.02458 11.9259L4.36458 7.71094L6.56958 3.75094C7.90458 1.34344 10.0946 1.34344 11.4296 3.75094L13.6346 7.71844L15.9746 11.9334C17.2346 14.2059 16.1396 16.0659 13.5446 16.0659H8.99958V16.0584Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.99609 12.75H9.00283" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			{deletionScheduledFor ? 'Manage deletion request' : 'Delete Account'}
		</button>
	</div>
</div>

<DeleteAccountModal
	bind:open={showDeleteModal}
	on:statusChange={(e) => (deletionScheduledFor = e.detail.scheduledFor)}
/>
