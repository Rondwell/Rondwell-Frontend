<!-- src/routes/auth/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { smartRequestOTP, googleSignIn, getPostLoginRedirect, beginPasskeyAuth, completePasskeyAuth } from '$lib/services/auth.services';
  import { authState, setUser, setVerified } from '$lib/stores/auth.store';
  import { toast } from '$lib/stores/toast.store';
  import { setPostAuthRedirect, consumePostAuthRedirect } from '$lib/utils/redirect';
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';

  let email = $page.url.searchParams.get('email') || '';
  let phone = '';
  let usePhone = false;
  let errorMsg = '';
  let googleLoading = false;
  let passkeyLoading = false;

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Persist the returnUrl so the verify page can redirect back after auth
  const returnUrl = $page.url.searchParams.get('returnUrl');
  if (returnUrl) {
    setPostAuthRedirect(returnUrl);
  }

  onMount(() => {
    // Initialize Google Identity Services
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      // Wait for the GSI script to load
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          initGoogleSignIn();
        }
      }, 100);
      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  });

  let googleBtnContainer: HTMLDivElement;

  function initGoogleSignIn() {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    // Render Google's official button
    if (googleBtnContainer) {
      window.google.accounts.id.renderButton(googleBtnContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 357,
      });
    }
  }

  async function handleGoogleResponse(response: any) {
    if (response.credential) {
      await completeGoogleSignIn(response.credential);
    } else {
      googleLoading = false;
      errorMsg = 'Google sign-in was cancelled.';
    }
  }

  async function completeGoogleSignIn(credential: string) {
    googleLoading = true;
    errorMsg = '';
    try {
      const result = await googleSignIn(credential);

      // Check if 2FA is required
      if (result.status === '2FA_REQUIRED') {
        localStorage.setItem('2fa-pending-email', result.user.email);
        goto(`/auth/2fa?email=${encodeURIComponent(result.user.email)}`);
        return;
      }

      toast.success(result.isNewUser ? 'Account created successfully!' : 'Signed in successfully!');

      const storedRedirect = consumePostAuthRedirect();
      const redirect = storedRedirect || await getPostLoginRedirect(result.token);
      goto(redirect);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
    } finally {
      googleLoading = false;
    }
  }

  async function handlePasskeySignIn() {
    if (!email && !usePhone) {
      errorMsg = 'Please enter your email first to sign in with a passkey.';
      return;
    }
    const contact = usePhone ? phone : email;
    if (!contact) { errorMsg = 'Please enter your email first.'; return; }

    passkeyLoading = true;
    errorMsg = '';
    try {
      // 1. Get authentication options from server (includes userId)
      const options = await beginPasskeyAuth(contact);
      const userId = options.userId;

      // 2. Convert base64url to Uint8Array for WebAuthn API
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

      // 3. Trigger browser passkey prompt
      const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
      if (!assertion) throw new Error('Passkey authentication cancelled');

      const cred = assertion as PublicKeyCredential;
      const response = cred.response as AuthenticatorAssertionResponse;

      // 4. Send assertion to server
      const result = await completePasskeyAuth(userId, {
        email: contact,
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

      // 5. Check if 2FA is required
      if (result.status === '2FA_REQUIRED') {
        localStorage.setItem('2fa-pending-email', contact);
        goto(`/auth/2fa?email=${encodeURIComponent(contact)}`);
        return;
      }

      // 6. Save auth state and redirect
      const { token, refreshToken, user } = result;
      setUser(user, token, refreshToken);
      setVerified();
      toast.success('Signed in with passkey!');

      const storedRedirect = consumePostAuthRedirect();
      const redirect = storedRedirect || await getPostLoginRedirect(token);
      goto(redirect);
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        errorMsg = err.message || 'Passkey sign-in failed. Please try again.';
      }
    } finally {
      passkeyLoading = false;
    }
  }

  const toggleInputType = () => {
    usePhone = !usePhone;
    errorMsg = '';
  };

  async function handleClick() {
    if (!usePhone && !email) { errorMsg = 'Please enter your email'; return; }
    if (usePhone && !phone) { errorMsg = 'Please enter your phone number'; return; }

    const contact = usePhone ? phone : email;
    errorMsg = '';

    try {
      const { isNewUser } = await smartRequestOTP(contact, usePhone);
      localStorage.setItem('pending-email', contact);
      localStorage.setItem('pending-is-phone', usePhone ? '1' : '0');
      localStorage.setItem('pending-is-new-user', isNewUser ? '1' : '0');
      goto(`/auth/verify?email=${encodeURIComponent(contact)}`);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
    }
  }

  $: loading = $authState.loading;
</script>

<svelte:head>
	<title>Sign In | Rondwell</title>
	<meta name="description" content="Sign in or create your Rondwell account. Manage events, collections, and more." />
	<meta property="og:title" content="Sign In | Rondwell" />
	<meta property="og:description" content="Sign in or create your Rondwell account." />
	<meta property="og:url" content="https://rondwell.com/auth" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Rondwell" />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="bg flex h-full min-h-screen flex-col items-stretch">
	<Header />

	<div class="h-full flex-1 px-4 py-15">
		<div class="mx-auto w-full max-w-[405px] rounded-[12px] bg-[#FDFCFB] p-6 shadow-sm">
			<div class="mb-6 space-y-3 text-left">
				<div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F3F3]">
					<img src="/logo1.svg" alt="logo" />
				</div>
				<h2 class="text-2xl font-semibold">
					Welcome to <span class="gradient-text">Rondwell</span>
				</h2>
				<p class="text-sm text-[#919091]">Please sign in or sign up below</p>
			</div>

			<div class="space-y-4">
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label for="contact" class="mb-1 block text-sm font-medium">
							{usePhone ? 'Phone Number' : 'Email'}
						</label>
						<!-- Toggle between phone/emails -->
						<button
							type="button"
							disabled
							class="flex items-center gap-1 text-xs text-gray-400 cursor-not-allowed opacity-50"
							title="Phone number login coming soon"
						>
							<svg
								width="14"
								height="17"
								viewBox="0 0 14 17"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M8.0625 3.75H5.0625C4.755 3.75 4.5 3.495 4.5 3.1875C4.5 2.88 4.755 2.625 5.0625 2.625H8.0625C8.37 2.625 8.625 2.88 8.625 3.1875C8.625 3.495 8.37 3.75 8.0625 3.75Z"
									fill="#A9A8A7"
								/>
								<path
									d="M6.56094 13.9578C5.60844 13.9578 4.83594 13.1853 4.83594 12.2328C4.83594 11.2803 5.60844 10.5078 6.56094 10.5078C7.51344 10.5078 8.28594 11.2803 8.28594 12.2328C8.28594 13.1853 7.51344 13.9578 6.56094 13.9578ZM6.56094 11.6253C6.23094 11.6253 5.96094 11.8953 5.96094 12.2253C5.96094 12.5553 6.23094 12.8253 6.56094 12.8253C6.89094 12.8253 7.16094 12.5553 7.16094 12.2253C7.16094 11.8953 6.89094 11.6253 6.56094 11.6253Z"
									fill="#A9A8A7"
								/>
								<path
									d="M8.8125 16.125H4.3125C1.005 16.125 0 15.12 0 11.8125V4.3125C0 1.005 1.005 0 4.3125 0H8.8125C12.12 0 13.125 1.005 13.125 4.3125V11.8125C13.125 15.12 12.12 16.125 8.8125 16.125ZM4.3125 1.125C1.6275 1.125 1.125 1.635 1.125 4.3125V11.8125C1.125 14.49 1.6275 15 4.3125 15H8.8125C11.4975 15 12 14.49 12 11.8125V4.3125C12 1.635 11.4975 1.125 8.8125 1.125H4.3125Z"
									fill="#A9A8A7"
								/>
							</svg>

							Use {usePhone ? 'Email' : 'Phone Number'}
						</button>
					</div>

					{#if usePhone}
						<input
							bind:value={phone}
							type="tel"
							placeholder="+1 234 567 8901"
							class="h-[41.25px] w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
						/>
					{:else}
						<input
							bind:value={email}
							type="email"
							placeholder="you@email.com"
							class="h-[41.25px] w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
						/>
					{/if}
				</div>


				<div class="hidden justify-between text-sm">
					<a href="/auth" class="text-purple-600 hover:underline">Forgot password?</a>
				</div>

				<!-- Main action button -->
				<button
					on:click={handleClick}
					disabled={loading}
					class="w-full rounded-md bg-black py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
				>
					{loading ? 'Sending OTP...' : `Continue With ${usePhone ? 'Phone' : 'Email'}`}
				</button>

				{#if errorMsg}
					<p class="text-sm text-center text-red-500">{errorMsg}</p>
				{/if}

				<!-- Google Sign-In (rendered by Google Identity Services) -->
				<div bind:this={googleBtnContainer} class="w-full overflow-hidden rounded-md"></div>

				<!-- Passkey sign in button -->
				<button
					on:click={handlePasskeySignIn}
					disabled={passkeyLoading || loading}
					class="flex w-full items-center justify-center space-x-2 rounded-md bg-[#F4F2F1] py-2 text-[#7C7C7E] hover:bg-[#EBE9E8] disabled:opacity-60"
				>
					<svg
						width="21"
						height="20"
						viewBox="0 0 21 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							opacity="0.4"
							d="M14.4701 8.45339C12.861 8.45611 11.5542 9.76299 11.5569 11.3666C11.5514 12.4884 12.1858 13.4604 13.1115 13.9504L13.1115 16.5097C13.1143 16.6921 13.234 16.9372 13.3838 17.0488L14.059 17.5607C14.285 17.7268 14.6526 17.7295 14.8758 17.5607L15.551 17.0488C15.7008 16.9372 15.8233 16.6949 15.8206 16.507L15.8206 16.0605C15.8233 15.9543 15.7362 15.8672 15.6273 15.8672L14.5709 15.8672C14.413 15.8672 14.2823 15.7365 14.2823 15.5786C14.2823 15.4207 14.413 15.29 14.5709 15.29L15.6327 15.29C15.7362 15.29 15.8233 15.2029 15.8233 15.0994L15.826 13.9477C16.7517 13.4631 17.3834 12.4884 17.3861 11.3694C17.3861 9.76299 16.0765 8.45339 14.4701 8.45339ZM15.1481 12.0119C14.7723 12.3876 14.1625 12.3876 13.7867 12.0119C13.411 11.6362 13.411 11.0263 13.7867 10.6506C14.1625 10.2748 14.7723 10.2748 15.1481 10.6506C15.5238 11.0263 15.5238 11.6362 15.1481 12.0119Z"
							fill="#292D32"
						/>
						<path
							d="M15.1475 12.0166C15.5234 11.6407 15.5234 11.0312 15.1475 10.6553C14.7715 10.2794 14.1621 10.2794 13.7861 10.6553C13.4102 11.0312 13.4102 11.6407 13.7861 12.0166C14.1621 12.3925 14.7715 12.3925 15.1475 12.0166Z"
							fill="#292D32"
						/>
						<path
							d="M6.99885 7.70083C9.12538 7.70083 10.8493 5.97694 10.8493 3.85042C10.8493 1.72389 9.12538 0 6.99885 0C4.87233 0 3.14844 1.72389 3.14844 3.85042C3.14844 5.97694 4.87233 7.70083 6.99885 7.70083Z"
							fill="#292D32"
						/>
						<path
							opacity="0.4"
							d="M7 9.63281C8.18471 9.63281 9.30183 9.87719 10.2812 10.3076C10.1102 10.6907 10.0146 11.1149 10.0146 11.5615C10.0147 12.701 10.6349 13.6928 11.5547 14.2256V15.793H0.385742C0.170194 15.793 0.000117394 15.6237 0 15.4082C0 12.2201 3.14202 9.63295 7 9.63281Z"
							fill="#292D32"
						/>
					</svg>

					<span>{passkeyLoading ? 'Authenticating...' : 'Sign in with Passkey'}</span>
				</button>
			</div>
		</div>
	</div>
</main>

<style>
	.gradient-text {
		background: linear-gradient(90deg, #db3ec6 0%, #513be2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		color: transparent;
	}

	.bg {
		background: conic-gradient(
			from 10.7deg at 50.03% 44.27%,
			rgba(242, 243, 246, 0.923391) -135.02deg,
			rgba(240, 245, 245, 0.985181) 34.46deg,
			#f0f5f5 75.11deg,
			#fae9fa 134.76deg,
			#ffefec 175.96deg,
			#fbebf6 184.8deg,
			rgba(250, 233, 250, 0.36) 203.89deg,
			rgba(242, 243, 246, 0.923391) 224.98deg,
			rgba(240, 245, 245, 0.985181) 394.46deg
		);
	}
</style>
