<script>
  import Button from "$lib/components/Button.svelte";
  import { Calendar, Compass, PlusCircle, Menu, X } from "lucide-svelte";

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
  import { onDestroy } from "svelte";
  onDestroy(() => clearInterval(interval));

  // mobile menu toggle
  let isOpen = false;
</script>

<header class="flex items-center justify-between px-6 py-4 relative">
  <!-- Logo -->
  <div class="flex items-center gap-2">
    <img src="https://res.cloudinary.com/dksfuytfd/image/upload/v1747893120/Rodwell_uedn7l.png" alt="Rondwell Logo" class="h-8 w-auto" />
  </div>

  <!-- Navigation (desktop) -->
  <nav class="hidden md:flex items-center gap-8 text-[#909EA3]">
    <button class="flex items-center gap-1 hover:text-[#000000] transition">
      <Compass size={16} /> Discover Events
    </button>
    <button class="flex items-center gap-1 hover:text-[#000000] transition">
      <Calendar size={16} /> Explore Experiences
    </button>
  </nav>

  <!-- Right side (desktop) -->
  <div class="hidden md:flex items-center gap-6 text-[#909EA3]">
    <!-- Current time -->
    <span class="text-sm">{now}</span>

    <!-- Create Event -->
    <button class="flex items-center gap-1 hover:text-[#000000] transition">
      <PlusCircle size={16} /> Create Event
    </button>

    <!-- Buttons -->
    <Button
      class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] text-white rounded-full px-6 py-2 shadow-md"
    >
      Sign in
    </Button>
  </div>

  <!-- Hamburger (mobile only) -->
  <button
    class="md:hidden p-2 rounded-lg bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] text-white"
    on:click={() => (isOpen = !isOpen)}
  >
    {#if isOpen}
      <X size={24} />
    {:else}
      <Menu size={24} />
    {/if}
  </button>

  <!-- Mobile menu -->
  {#if isOpen}
    <div
      class="absolute top-full left-0 w-full bg-white shadow-md border-t border-gray-200 flex flex-col p-6 space-y-4 md:hidden z-50"
    >
      <button class="flex items-center gap-2 text-[#909EA3] hover:text-black">
        <Compass size={18} /> Discover Events
      </button>
      <button class="flex items-center gap-2 text-[#909EA3] hover:text-black">
        <Calendar size={18} /> Explore Experiences
      </button>
      <button class="flex items-center gap-2 text-[#909EA3] hover:text-black">
        <PlusCircle size={18} /> Create Event
      </button>

      <Button
        class="bg-gradient-to-r from-[#DB3EC6] to-[#513BE2] text-white rounded-full px-6 py-2 shadow-md w-fit"
      >
        Sign in
      </Button>
    </div>
  {/if}
</header>
