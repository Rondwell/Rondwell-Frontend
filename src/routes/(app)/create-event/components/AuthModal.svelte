<script lang="ts">
	import { goto } from '$app/navigation';
	import { smartRequestOTP, smartVerifyOTP, googleSignIn, beginPasskeyAuth, completePasskeyAuth } from '$lib/services/auth.services';
	import { authState, setUser, setVerified } from '$lib/stores/auth.store';
	import { toast } from '$lib/stores/toast.store';
	import { isValidEmail, isValidPhone } from '$lib/utils/validation';
	import { createEventDispatcher, onMount } from 'svelte';

	export let open = false;

	const dispatch = createEventDispatcher<{ authenticated: void; close: void }>();

	const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

	let step: 'email' | 'otp' = 'email';
	let contact = '';
	let otp = '';
	let isNewUser = true;
	let loading = false;
	let googleLoading = false;
	let passkeyLoading = false;
	let error = '';
	let resendTimer = 0;
	let timerInterval: ReturnType<typeof setInterval>;
	let googleBtnContainer: HTMLDivElement;

	function startTimer() {
		resendTimer = 60;
		clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			resendTimer--;
			if (resendTimer <= 0) clearInterval(timerInterval);
		}, 1000);
	}

	// Google Sign-In setup
	function initGoogleSignIn() {
		if (!window.google?.accounts?.id) return;
		window.google.accounts.id.initialize({
			client_id: GOOGLE_CLIENT_ID,
			callback: handleGoogleResponse,
			auto_select: false,
			cancel_on_tap_outside: true,
		});
		if (googleBtnContainer) {
			window.google.accounts.id.renderButton(googleBtnContainer, {
				type: 'standard',
				theme: 'outline',
				size: 'large',
				width: 350,
			});
		}
	}

	$: if (open && typeof window !== 'undefined') {
		// Initialize Google when modal opens
		setTimeout(() => {
			if (window.google?.accounts?.id) {
				initGoogleSignIn();
			} else {
				const checkGoogle = setInterval(() => {
					if (window.google?.accounts?.id) {
						clearInterval(checkGoogle);
						initGoogleSignIn();
					}
				}, 100);
				setTimeout(() => clearInterval(checkGoogle), 10000);
			}
		}, 100);
	}

	function triggerGoogleSignIn() {
		if (!window.google?.accounts?.id) {
			error = 'Google Sign-In is not ready. Please try again.';
			return;
		}
		googleLoading = true;
		error = '';
		window.google.accounts.id.prompt((notification: any) => {
			if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
				googleLoading = false;
				const btn = googleBtnContainer?.querySelector('div[role="button"]') as HTMLElement;
				if (btn) {
					btn.click();
				} else {
					error = 'Google Sign-In unavailable. Please try again.';
				}
			}
		});
	}

	async function handleGoogleResponse(response: any) {
		if (response.credential) {
			await completeGoogleSignInFlow(response.credential);
		} else {
			googleLoading = false;
			error = 'Google sign-in was cancelled.';
		}
	}

	async function completeGoogleSignInFlow(credential: string) {
		googleLoading = true;
		error = '';
		try {
			const result = await googleSignIn(credential);
			if (result.status === '2FA_REQUIRED') {
				// For 2FA, redirect to the 2FA page
				localStorage.setItem('2fa-pending-email', result.user.email);
				open = false;
				goto(`/auth/2fa?email=${encodeURIComponent(result.user.email)}`);
				return;
			}
			toast.success(result.isNewUser ? 'Account created successfully!' : 'Signed in successfully!');
			dispatch('authenticated');
			open = false;
		} catch (err: any) {
			error = err.message || 'Google sign-in failed. Please try again.';
		} finally {
			googleLoading = false;
		}
	}

	// Passkey Sign-In
	async function handlePasskeySignIn() {
		if (!contact.trim()) {
			error = 'Please enter your email first to sign in with a passkey.';
			return;
		}
		passkeyLoading = true;
		error = '';
		try {
			const options = await beginPasskeyAuth(contact.trim());
			const userId = options.userId;

			function base64urlToBuffer(base64url: string): Uint8Array {
				const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
				const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
				return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
			}

			function bufferToBase64url(buffer: ArrayBuffer): string {
				const bytes = new Uint8Array(buffer);
				let binary = '';
				for (const b of bytes) binary += String.fromCharCode(b);
				return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
			}

			const publicKeyOptions = {
				...options,
				challenge: base64urlToBuffer(options.challenge),
				allowCredentials: (options.allowCredentials || []).map((c: any) => ({
					...c,
					id: base64urlToBuffer(c.id),
				})),
			};
			delete publicKeyOptions.userId;

			const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
			if (!assertion) throw new Error('Passkey authentication cancelled');

			const cred = assertion as PublicKeyCredential;
			const response = cred.response as AuthenticatorAssertionResponse;

			const result = await completePasskeyAuth(userId, {
				email: contact.trim(),
				credentialId: cred.id,
				assertionResponse: {
					id: cred.id,
					rawId: bufferToBase64url(cred.rawId),
					type: cred.type,
					response: {
						authenticatorData: bufferToBase64url(response.authenticatorData),
						clientDataJSON: bufferToBase64url(response.clientDataJSON),
						signature: bufferToBase64url(response.signature),
						userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
					},
				},
			});

			if (result.status === '2FA_REQUIRED') {
				localStorage.setItem('2fa-pending-email', contact.trim());
				open = false;
				goto(`/auth/2fa?email=${encodeURIComponent(contact.trim())}`);
				return;
			}

			const { token, refreshToken, user } = result;
			setUser(user, token, refreshToken);
			setVerified();
			toast.success('Signed in with passkey!');
			dispatch('authenticated');
			open = false;
		} catch (err: any) {
			if (err.name !== 'NotAllowedError') {
				error = err.message || 'Passkey sign-in failed. Please try again.';
			}
		} finally {
			passkeyLoading = false;
		}
	}

	// Email/Phone OTP flow
	async function sendOTP() {
		if (!contact.trim()) { error = 'Please enter your email or phone'; return; }
		// Reject malformed input before requesting an OTP.
		const value = contact.trim();
		const looksLikeEmail = value.includes('@');
		if (looksLikeEmail ? !isValidEmail(value) : !isValidPhone(value)) {
			error = looksLikeEmail
				? 'Please enter a valid email address (e.g. you@example.com)'
				: 'Please enter a valid email or phone number';
			return;
		}
		loading = true; error = '';
		try {
			const result = await smartRequestOTP(contact.trim());
			isNewUser = result.isNewUser;
			step = 'otp';
			startTimer();
		} catch (e: any) {
			error = e.message ?? 'Failed to send OTP';
		} finally {
			loading = false;
		}
	}

	async function verifyOTP() {
		if (!otp.trim()) { error = 'Please enter the OTP'; return; }
		loading = true; error = '';
		try {
			await smartVerifyOTP(contact.trim(), otp.trim(), false, isNewUser);
			toast.success('Signed in successfully!');
			dispatch('authenticated');
			open = false;
		} catch (e: any) {
			error = e.message ?? 'Invalid OTP';
		} finally {
			loading = false;
		}
	}

	async function resend() {
		if (resendTimer > 0) return;
		loading = true; error = '';
		try {
			const result = await smartRequestOTP(contact.trim());
			isNewUser = result.isNewUser;
			startTimer();
		} catch (e: any) {
			error = e.message ?? 'Failed to resend OTP';
		} finally {
			loading = false;
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
		<div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold text-gray-900">
						{step === 'email' ? 'Sign in to create your event' : 'Enter verification code'}
					</h2>
					<p class="mt-1 text-sm text-gray-500">
						{step === 'email'
							? 'Your event details are saved. Sign in to publish.'
							: `We sent a code to ${contact}`}
					</p>
				</div>
				<button
					on:click={() => { open = false; dispatch('close'); }}
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
				>✕</button>
			</div>

			{#if error}
				<p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
			{/if}

			{#if step === 'email'}
				<div class="space-y-4">
					<!-- Email input -->
					<input
						type="text"
						bind:value={contact}
						placeholder="Email or phone number"
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none"
						on:keydown={(e) => e.key === 'Enter' && sendOTP()}
					/>

					<!-- Continue with Email button -->
					<button
						on:click={sendOTP}
						disabled={loading}
						class="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
					>
						{loading ? 'Sending...' : 'Continue With Email'}
					</button>

					<!-- Divider -->
					<div class="flex items-center gap-3">
						<div class="h-px flex-1 bg-gray-200"></div>
						<span class="text-xs text-gray-400">or</span>
						<div class="h-px flex-1 bg-gray-200"></div>
					</div>

					<!-- Hidden Google rendered button (fallback) -->
					<div bind:this={googleBtnContainer} class="hidden"></div>

					<!-- Google sign in button -->
					<button
						on:click={triggerGoogleSignIn}
						disabled={googleLoading || loading}
						class="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-60"
					>
						<svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M16.6653 8.27563C16.6247 7.86126 16.2753 7.55249 15.8609 7.55249H9.72656C9.27969 7.55249 8.91406 7.91812 8.91406 8.36499V9.75439C8.91406 10.2013 9.27969 10.5669 9.72656 10.5669H13.3909C13.3016 11.3144 12.8141 12.4438 11.7334 13.1994C11.0428 13.6788 10.1247 14.0119 8.91406 14.0119C8.85719 14.0119 8.80844 14.0119 8.75157 14.0037C6.67969 13.9387 4.92469 12.5494 4.29094 10.64C4.12032 10.1281 4.02282 9.59187 4.02282 9.03125C4.02282 8.47063 4.12032 7.92624 4.28282 7.42249C4.33157 7.27624 4.38844 7.13001 4.45344 6.98376C5.20094 5.30188 6.83407 4.11563 8.75157 4.05875C8.80032 4.05063 8.85719 4.05062 8.91406 4.05062C10.0759 4.05062 10.9453 4.43249 11.5547 4.85499C11.8716 5.07436 12.2941 5.02562 12.5703 4.75749L13.6997 3.6525C14.0572 3.30313 14.0247 2.70999 13.6184 2.41749C12.3266 1.46686 10.7503 0.90625 8.91406 0.90625C8.85719 0.90625 8.80844 0.906258 8.75157 0.914383C5.63969 0.971258 2.96656 2.77501 1.65844 5.38313C1.10594 6.48813 0.789062 7.72312 0.789062 9.03125C0.789062 10.3394 1.10594 11.5744 1.65844 12.6794H1.66656C2.97469 15.2875 5.64782 17.0912 8.75157 17.1481C8.80844 17.1562 8.85719 17.1562 8.91406 17.1562C11.1078 17.1562 12.9522 16.4331 14.2928 15.19C15.8284 13.7681 16.7141 11.6881 16.7141 9.21C16.7141 8.86063 16.6978 8.56001 16.6653 8.27563Z" fill="black"/>
						</svg>
						<span>{googleLoading ? 'Signing in...' : 'Sign in with Google'}</span>
					</button>

					<!-- Passkey sign in button -->
					<button
						on:click={handlePasskeySignIn}
						disabled={passkeyLoading || loading}
						class="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-60"
					>
						<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path opacity="0.4" d="M14.4701 8.45339C12.861 8.45611 11.5542 9.76299 11.5569 11.3666C11.5514 12.4884 12.1858 13.4604 13.1115 13.9504L13.1115 16.5097C13.1143 16.6921 13.234 16.9372 13.3838 17.0488L14.059 17.5607C14.285 17.7268 14.6526 17.7295 14.8758 17.5607L15.551 17.0488C15.7008 16.9372 15.8233 16.6949 15.8206 16.507L15.8206 16.0605C15.8233 15.9543 15.7362 15.8672 15.6273 15.8672L14.5709 15.8672C14.413 15.8672 14.2823 15.7365 14.2823 15.5786C14.2823 15.4207 14.413 15.29 14.5709 15.29L15.6327 15.29C15.7362 15.29 15.8233 15.2029 15.8233 15.0994L15.826 13.9477C16.7517 13.4631 17.3834 12.4884 17.3861 11.3694C17.3861 9.76299 16.0765 8.45339 14.4701 8.45339ZM15.1481 12.0119C14.7723 12.3876 14.1625 12.3876 13.7867 12.0119C13.411 11.6362 13.411 11.0263 13.7867 10.6506C14.1625 10.2748 14.7723 10.2748 15.1481 10.6506C15.5238 11.0263 15.5238 11.6362 15.1481 12.0119Z" fill="#292D32"/>
							<path d="M15.1475 12.0166C15.5234 11.6407 15.5234 11.0312 15.1475 10.6553C14.7715 10.2794 14.1621 10.2794 13.7861 10.6553C13.4102 11.0312 13.4102 11.6407 13.7861 12.0166C14.1621 12.3925 14.7715 12.3925 15.1475 12.0166Z" fill="#292D32"/>
							<path d="M6.99885 7.70083C9.12538 7.70083 10.8493 5.97694 10.8493 3.85042C10.8493 1.72389 9.12538 0 6.99885 0C4.87233 0 3.14844 1.72389 3.14844 3.85042C3.14844 5.97694 4.87233 7.70083 6.99885 7.70083Z" fill="#292D32"/>
							<path opacity="0.4" d="M7 9.63281C8.18471 9.63281 9.30183 9.87719 10.2812 10.3076C10.1102 10.6907 10.0146 11.1149 10.0146 11.5615C10.0147 12.701 10.6349 13.6928 11.5547 14.2256V15.793H0.385742C0.170194 15.793 0.000117394 15.6237 0 15.4082C0 12.2201 3.14202 9.63295 7 9.63281Z" fill="#292D32"/>
						</svg>
						<span>{passkeyLoading ? 'Authenticating...' : 'Sign in with Passkey'}</span>
					</button>
				</div>
			{:else}
				<!-- OTP Verification Step -->
				<div class="space-y-4">
					<input
						type="text"
						bind:value={otp}
						placeholder="6-digit code"
						maxlength={6}
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg tracking-widest focus:border-gray-400 focus:outline-none"
						on:keydown={(e) => e.key === 'Enter' && verifyOTP()}
					/>
					<button
						on:click={verifyOTP}
						disabled={loading}
						class="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
					>
						{loading ? 'Verifying...' : 'Verify & Create Event'}
					</button>
					<div class="text-center text-sm text-gray-500">
						{#if resendTimer > 0}
							Resend in {resendTimer}s
						{:else}
							<button on:click={resend} class="text-gray-800 underline">Resend code</button>
						{/if}
					</div>
					<button
						on:click={() => { step = 'email'; otp = ''; error = ''; }}
						class="w-full text-center text-sm text-gray-400 hover:text-gray-600"
					>← Change email/phone</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
