<!-- src/routes/auth/google/callback/+page.svelte -->
<!-- This page handles the Google OAuth popup redirect. It extracts the id_token
     from the URL fragment and posts it back to the opener window. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  onMount(() => {
    if (!browser) return;

    // The id_token comes in the URL hash fragment: #id_token=xxx&...
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const credential = params.get('id_token');

    if (credential && window.opener) {
      window.opener.postMessage({ credential }, window.location.origin);
      window.close();
    } else if (!credential) {
      // No token found — might be an error or user cancelled
      document.body.innerText = 'Google sign-in failed. You can close this window.';
      setTimeout(() => window.close(), 2000);
    }
  });
</script>

<main class="flex h-screen items-center justify-center">
  <p class="text-gray-500">Completing Google sign-in...</p>
</main>
