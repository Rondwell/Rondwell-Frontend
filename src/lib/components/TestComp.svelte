<script>
  import { theme } from '$lib/stores/theme';
  
  function setLight() { theme.set('light'); }
  function setDark() { theme.set('dark'); }
  function setSystem() { theme.set('system'); }
</script>

<div class="p-4 bg-white dark:bg-gray-800 text-black dark:text-white">
  <p>Current theme: {$theme}</p>
  <button on:click={setLight} class="mr-2 px-3 py-1 bg-blue-500 text-white">Light</button>
  <button on:click={setDark} class="mr-2 px-3 py-1 bg-blue-500 text-white">Dark</button>
  <button on:click={setSystem} class="mr-2 px-3 py-1 bg-blue-500 text-white">System</button>
</div>