<script>
  import Button from "$lib/components/Button.svelte";
  import { onDestroy } from "svelte";

  // live time
  let now = new Date().toLocaleString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });

  const updateTime = () => {
    now = new Date().toLocaleString("en-GB", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });
  };

  const interval = setInterval(updateTime, 60000);
  onDestroy(() => clearInterval(interval));

  // mobile menu toggle
  let isOpen = false;
</script>

<div class="w-full bg-gradient-to-r from-pink-200 via-purple-100 to-pink-100">
  <header class="flex items-center justify-between px-6 py-4 relative max-w-screen-2xl mx-auto">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <img src="/logo.png" alt="Rondwell Logo" class="h-8 w-auto" />
    </div>

    <!-- Navigation (desktop) -->
    <nav class="hidden md:flex items-center gap-8 text-[#909EA3]">
      <button class="flex items-center gap-1 hover:text-[#000000] transition">
        <img src="/Disc.png" alt="Discover" class="w-4 h-4 object-contain" />
        Discover Events
      </button>

      <button class="flex items-center gap-1 hover:text-[#000000] transition">
        <img src="/Verified.png" alt="Verified" class="w-5 h-5 object-contain" />
        Explore Experiences
      </button>
    </nav>

    <!-- Right side -->
    <div class="flex items-center gap-4 text-[#909EA3]">
      <!-- Current time (desktop only) -->
      <span class="text-sm hidden md:inline">{now}</span>

      <!-- Create Event (desktop only) -->
      <button class="hidden md:flex items-center gap-1 hover:text-[#000000] transition">
        <img src="/vec.png" alt="Vector" class="w-[18px] h-[18px] object-contain" />
        Create Event
      </button>

      <!-- Sign in (always visible) -->
      <Button class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] text-white rounded-full px-4 py-2 shadow-md">
        Sign in
      </Button>

      <!-- Toggle (mobile only, AFTER sign in) -->
      <button
        class="md:hidden p-2 rounded-lg"
        on:click={() => (isOpen = !isOpen)}
        aria-label="Toggle menu"
      >
        {#if isOpen}
          <img src="/closeicon.png" alt="Close menu" class="w-6 h-6 object-contain" />
        {:else}
          <img src="/mobicon.png" alt="Open menu" class="w-6 h-6 object-contain" />
        {/if}
      </button>
    </div>

    <!-- Mobile menu -->
    {#if isOpen}
      <div
        class="absolute top-full left-0 w-full bg-gradient-to-r from-pink-200 via-purple-100 to-pink-100 shadow-md border-t border-gray-200 rounded-b-xl flex flex-col p-6 space-y-4 md:hidden z-50"
      >
        <button class="flex items-center gap-2 text-[#909EA3] hover:text-black">
          <img src="/Disc.png" alt="Discover" class="w-[18px] h-[18px] object-contain" />
          Discover Events
        </button>

        <button class="flex items-center gap-2 text-[#909EA3] hover:text-black">
          <img src="/Verified.png" alt="Verified" class="w-[18px] h-[18px] object-contain" />
          Explore Experiences
        </button>

        <button class="flex items-center gap-2 text-[#909EA3] hover:text-black">
          <img src="/vec.png" alt="Vector" class="w-[18px] h-[18px] object-contain" />
          Create Event
        </button>

        <Button class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] text-white rounded-full px-6 py-2 shadow-md w-fit">
          Sign in
        </Button>
      </div>
    {/if}
  </header>
</div>