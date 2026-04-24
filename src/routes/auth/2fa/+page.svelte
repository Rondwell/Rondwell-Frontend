<!-- src/routes/auth/2fa/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { verify2FALogin, getPostLoginRedirect } from '$lib/services/auth.services';
  import { authState } from '$lib/stores/auth.store';
  import { consumePostAuthRedirect } from '$lib/utils/redirect';
  import { onMount } from 'svelte';
  import Header from '../components/Header.svelte';

  let code = Array(6).fill('');
  let email = '';
  let message = '';
  let loading = false;
  let useBackupCode = false;
  let backupCodeInput = '';

  onMount(() => {
    email = $page.url.searchParams.get('email') || localStorage.getItem('2fa-pending-email') || '';
    if (!email) {
      message = 'No email found. Please go back and try again.';
    }
  });

  function handleInput(e: Event, index: number) {
    const target = e.target as HTMLInputElement;
    const value = target.value.replace(/[^0-9]/g, '').slice(0, 1);
    code[index] = value;
    code = [...code];
    if (value && index < 5) {
      const next = document.getElementById(`tfa-${index + 1}`) as HTMLInputElement | null;
      next?.focus();
    }
    if (value && index === 5) submit();
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prev = document.getElementById(`tfa-${index - 1}`) as HTMLInputElement | null;
      prev?.focus();
    }
  }

  async function submit() {
    if (!useBackupCode && code.join('').length !== 6) { message = 'Enter a 6-digit code'; return; }
    if (useBackupCode && !backupCodeInput.trim()) { message = 'Enter a backup code'; return; }
    loading = true;
    message = '';
    try {
      const { token } = await verify2FALogin(
        email,
        useBackupCode ? '' : code.join(''),
        useBackupCode ? backupCodeInput.trim() : undefined
      );
      localStorage.removeItem('2fa-pending-email');
      localStorage.removeItem('pending-email');
      localStorage.removeItem('pending-is-phone');
      localStorage.removeItem('pending-is-new-user');

      const storedRedirect = consumePostAuthRedirect();
      const redirect = storedRedirect || await getPostLoginRedirect(token);
      goto(redirect);
    } catch (err) {
      message = err instanceof Error ? err.message : '2FA verification failed';
      code = Array(6).fill('');
      document.getElementById('tfa-0')?.focus();
    } finally {
      loading = false;
    }
  }

  async function pasteCode() {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/[^0-9]/g, '').slice(0, 6).split('');
      code = [...digits, ...Array(6).fill('')].slice(0, 6);
      if (digits.length === 6) submit();
    } catch { message = 'Could not read clipboard'; }
  }

  $: loading = $authState.loading;
</script>

<svelte:head>
  <title>Two-Factor Authentication | Rondwell</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="bg flex h-full min-h-screen flex-col items-stretch">
  <Header />
  <div class="flex h-full flex-1 items-center justify-center px-4 py-15">
    <div class="mx-auto w-full max-w-[405px] rounded-[12px] bg-[#FDFCFB] px-4 py-6 md:px-6 shadow-sm">
      <div class="mb-6 space-y-3 text-left">
        <button type="button" on:click={() => history.back()} class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F3F3]">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.32471 0.252009C8.81153 0.252009 9.28374 0.441866 9.65858 0.806975C10.2671 1.40089 10.4131 2.27715 10.0334 3.03658L9.24479 4.61385C9.07927 4.94488 9.07927 5.34407 9.24479 5.67997L10.0334 7.26211C10.4131 8.02154 10.2671 8.8978 9.65858 9.49172C9.05007 10.0856 8.1738 10.2171 7.41924 9.81788L1.77708 6.84832C1.14422 6.51729 0.749907 5.86496 0.749907 5.14935C0.749907 4.43373 1.14422 3.7814 1.77708 3.45037L7.41924 0.480811C7.71133 0.325031 8.01802 0.252009 8.32471 0.252009Z" fill="#131517"/>
          </svg>
        </button>

        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F3F3]">
          <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.78906 8.90031L7.99656 10.1078L11.2216 6.88281" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.4436 4.59187C15.4436 3.66937 14.7386 2.64937 13.8761 2.32687L10.1336 0.924375C9.51109 0.691875 8.49109 0.691875 7.86859 0.924375L4.12609 2.33438C3.26359 2.65688 2.55859 3.67687 2.55859 4.59187V10.1644C2.55859 11.0494 3.14359 12.2119 3.85609 12.7444L7.08109 15.1519C8.13859 15.9469 9.87859 15.9469 10.9361 15.1519L14.1611 12.7444C14.8736 12.2119 15.4586 11.0494 15.4586 10.1644V7.52437" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <h2 class="text-2xl font-semibold">Two-Factor Authentication</h2>
        <p class="text-sm text-[#919091]">
          {#if useBackupCode}
            Enter one of your backup codes to sign in.
          {:else}
            Enter the 6-digit code from your authenticator app.
          {/if}
        </p>
      </div>

      <div class="space-y-4">
        {#if !useBackupCode}
          <div class="flex space-x-2">
            {#each code as _, i (i)}
              <input
                id={`tfa-${i}`}
                on:input={(e) => handleInput(e, i)}
                on:keydown={(e) => handleKeydown(e, i)}
                on:paste={pasteCode}
                type="text"
                maxlength="1"
                pattern="[0-9]"
                inputmode="numeric"
                autocomplete="one-time-code"
                disabled={loading}
                class="h-[48.75px] w-[42px] sm:w-[48.75px] rounded-md border border-gray-300 text-center text-lg focus:ring-2 focus:ring-black focus:outline-none md:w-full"
                value={_}
              />
            {/each}
          </div>

          <div class="flex justify-between text-xs">
            <button on:click={pasteCode} class="flex items-center gap-1 rounded-md bg-[#F4F1F1] px-3 py-1 text-[#646466]">
              Paste Code
            </button>
            <button on:click={() => { useBackupCode = true; message = ''; }} class="text-[#646466] hover:underline">
              Use backup code
            </button>
          </div>
        {:else}
          <div>
            <input
              type="text"
              bind:value={backupCodeInput}
              placeholder="Enter backup code"
              disabled={loading}
              class="h-[48px] w-full rounded-md border border-gray-300 px-3 text-center font-mono text-lg tracking-wider focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>
          <button on:click={() => { useBackupCode = false; message = ''; }} class="text-xs text-[#646466] hover:underline">
            Use authenticator code instead
          </button>
        {/if}

        {#if message}
          <p class="text-sm text-center {message.includes('success') ? 'text-green-600' : 'text-red-500'}">{message}</p>
        {/if}

        <button
          on:click={submit}
          disabled={loading || (!useBackupCode && code.join('').length !== 6) || (useBackupCode && !backupCodeInput.trim())}
          class="w-full rounded-md bg-black py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  </div>
</main>

<style>
  .bg {
    background: conic-gradient(from 10.7deg at 50.03% 44.27%, rgba(242,243,246,0.923391) -135.02deg, rgba(240,245,245,0.985181) 34.46deg, #f0f5f5 75.11deg, #fae9fa 134.76deg, #ffefec 175.96deg, #fbebf6 184.8deg, rgba(250,233,250,0.36) 203.89deg, rgba(242,243,246,0.923391) 224.98deg, rgba(240,245,245,0.985181) 394.46deg);
  }
</style>
