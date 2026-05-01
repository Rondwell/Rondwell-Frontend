<!--
  InsightsSkeleton.svelte
  =======================
  Reusable skeleton loader for all 5 analytics/insight pages.
  Renders a shimmer animation that mirrors the real layout:
  stats cards → charts → detail panels.

  Props:
    variant: 'event' | 'collection' | 'speaker' | 'vendor' | 'exhibitor'
    (controls the accent color of the shimmer)
-->
<script lang="ts">
  export let variant: 'event' | 'collection' | 'speaker' | 'vendor' | 'exhibitor' = 'event';

  const accentMap: Record<string, string> = {
    event: 'from-blue-100 via-blue-50',
    collection: 'from-indigo-100 via-indigo-50',
    speaker: 'from-purple-100 via-purple-50',
    vendor: 'from-green-100 via-green-50',
    exhibitor: 'from-amber-100 via-amber-50',
  };

  $: shimmer = accentMap[variant] || accentMap.event;
</script>

<div class="max-w-6xl animate-pulse space-y-6">
  <!-- Header skeleton -->
  <div class="mb-6">
    <div class="mb-3 h-5 w-32 rounded bg-gray-200"></div>
    <div class="mb-4 h-10 w-72 rounded-lg bg-gray-200"></div>
    <div class="flex gap-1 rounded-lg bg-gray-100 p-1">
      <div class="h-9 w-24 rounded-md bg-gray-200"></div>
      <div class="h-9 w-24 rounded-md bg-gray-100"></div>
    </div>
  </div>

  <!-- Stats cards skeleton (4 cards) -->
  <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
    {#each Array(4) as _}
      <div class="rounded-xl bg-white p-4 shadow-sm">
        <div class="mb-2 h-3 w-24 rounded bg-gray-200"></div>
        <div class="mb-2 h-8 w-20 rounded bg-gradient-to-r {shimmer} to-gray-100"></div>
        <div class="h-3 w-32 rounded bg-gray-100"></div>
      </div>
    {/each}
  </div>

  <!-- Charts skeleton -->
  <div class="rounded-2xl bg-[#FDFDFD] p-1">
    <div class="flex w-full flex-col gap-10 p-4 lg:flex-row">
      <!-- Area chart skeleton -->
      <div class="w-full">
        <div class="mb-3 h-4 w-40 rounded bg-gray-200"></div>
        <div class="relative h-80 w-full overflow-hidden rounded-lg bg-gray-100">
          <!-- Fake chart lines -->
          <svg class="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="skeleton-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:0.5" />
                <stop offset="50%" style="stop-color:#f3f4f6;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:0.5" />
              </linearGradient>
            </defs>
            <path d="M0,200 Q80,180 160,160 T320,120 T480,140 T640,100 T800,80" 
                  fill="none" stroke="url(#skeleton-grad)" stroke-width="3" />
            <path d="M0,240 Q80,220 160,200 T320,180 T480,190 T640,160 T800,140" 
                  fill="none" stroke="url(#skeleton-grad)" stroke-width="2" opacity="0.5" />
          </svg>
          <!-- Shimmer overlay -->
          <div class="skeleton-shimmer absolute inset-0"></div>
        </div>
        <!-- Legend skeleton -->
        <div class="mt-3 flex justify-center gap-4">
          <div class="flex items-center gap-1.5">
            <div class="h-2.5 w-2.5 rounded-full bg-gray-200"></div>
            <div class="h-3 w-16 rounded bg-gray-200"></div>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="h-2.5 w-2.5 rounded-full bg-gray-200"></div>
            <div class="h-3 w-16 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      <!-- Donut chart skeleton -->
      <div class="flex w-full max-w-100 flex-col items-center justify-center">
        <div class="mb-3 h-4 w-32 rounded bg-gray-200"></div>
        <div class="relative h-56 w-56">
          <svg viewBox="0 0 100 100" class="h-full w-full">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="16" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" stroke-width="16"
                    stroke-dasharray="100 151.4" stroke-dashoffset="0" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="16"
                    stroke-dasharray="50 201.4" stroke-dashoffset="-100" opacity="0.6" />
          </svg>
          <div class="skeleton-shimmer absolute inset-0 rounded-full"></div>
        </div>
        <div class="mt-3 flex gap-3">
          {#each Array(3) as _}
            <div class="flex items-center gap-1.5">
              <div class="h-2.5 w-2.5 rounded-full bg-gray-200"></div>
              <div class="h-3 w-12 rounded bg-gray-200"></div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Detail panel skeleton -->
    <div class="flex w-full flex-col items-start gap-6 rounded-b-2xl bg-[#F4F4F4] p-4 lg:flex-row">
      <!-- Left column -->
      <div class="w-full space-y-4">
        <div class="h-4 w-36 rounded bg-gray-300"></div>
        <div class="flex gap-4">
          {#each Array(3) as _}
            <div>
              <div class="mb-1 h-3 w-16 rounded bg-gray-200"></div>
              <div class="h-7 w-12 rounded bg-gray-200"></div>
            </div>
          {/each}
        </div>
        <div class="h-4 w-28 rounded bg-gray-300"></div>
        <div class="space-y-2">
          {#each Array(2) as _}
            <div class="flex items-center justify-between rounded-lg bg-white/60 p-3">
              <div class="flex items-center gap-3">
                <div class="h-4 w-4 rounded bg-gray-200"></div>
                <div>
                  <div class="mb-1 h-3.5 w-28 rounded bg-gray-200"></div>
                  <div class="h-3 w-20 rounded bg-gray-100"></div>
                </div>
              </div>
              <div class="h-3 w-8 rounded bg-gray-200"></div>
            </div>
          {/each}
        </div>
      </div>

      <div class="h-0 w-full border border-gray-200/50 lg:h-full lg:w-0"></div>

      <!-- Right column -->
      <div class="w-full space-y-3">
        <div class="h-4 w-28 rounded bg-gray-300"></div>
        {#each Array(4) as _}
          <div class="flex justify-between">
            <div class="h-3.5 w-24 rounded bg-gray-200"></div>
            <div class="h-3.5 w-10 rounded bg-gray-200"></div>
          </div>
        {/each}
        <div class="mt-3 h-4 w-24 rounded bg-gray-300"></div>
        {#each Array(3) as _}
          <div class="flex justify-between">
            <div class="h-3.5 w-28 rounded bg-gray-200"></div>
            <div class="h-3.5 w-14 rounded bg-gray-200"></div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Bottom section skeleton -->
  <div class="rounded-xl bg-white p-6 shadow-sm">
    <div class="mb-4 h-5 w-40 rounded bg-gray-200"></div>
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      {#each Array(4) as _}
        <div class="text-center">
          <div class="mx-auto mb-2 h-8 w-16 rounded bg-gray-200"></div>
          <div class="mx-auto h-3 w-20 rounded bg-gray-100"></div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
