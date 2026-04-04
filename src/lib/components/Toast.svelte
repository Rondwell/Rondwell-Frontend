<script lang="ts">
  import { removeToast, toasts, type ToastType } from '$lib/stores/toast.store';
  import { flip } from 'svelte/animate';
  import { fade, fly } from 'svelte/transition';

  const icons: Record<ToastType, string> = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="8"/><line x1="12" x2="12" y1="12" y2="16"/></svg>`,
  };

  const styles: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-300',
    error:   'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300',
    warning: 'bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-300',
    info:    'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300',
  };
</script>

<div
  class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 w-full max-w-md pointer-events-none px-4"
  aria-live="polite"
  aria-atomic="false"
>
  {#each $toasts as toast (toast.id)}
    <div
      animate:flip={{ duration: 200 }}
      in:fly={{ y: 20, duration: 250 }}
      out:fade={{ duration: 200 }}
      class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium {styles[toast.type]}"
      role="alert"
    >
      <span class="mt-0.5 shrink-0">{@html icons[toast.type]}</span>
      <span class="flex-1 leading-snug">{toast.message}</span>
      <button
        on:click={() => removeToast(toast.id)}
        class="shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  {/each}
</div>
