<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  const theme = writable('light');
  let mounted = false;

  onMount(() => {
    mounted = true;
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (stored) {
      theme.set(stored);
    } else if (prefersDark) {
      theme.set('dark');
    }

    const unsubscribe = theme.subscribe((value) => {
      if (mounted) {
        localStorage.setItem('theme', value);
        if (value === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });

    return unsubscribe;
  });

  function toggleTheme() {
    theme.update(t => t === 'light' ? 'dark' : 'light');
  }
</script>

{#if mounted}
  <button
    on:click={toggleTheme}
    class="p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white/90 transition-colors"
    aria-label="Toggle theme"
  >
    {#if $theme === 'light'}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    {:else}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    {/if}
  </button>
{/if}