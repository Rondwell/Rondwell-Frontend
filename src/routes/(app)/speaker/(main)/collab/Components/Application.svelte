<script lang="ts">
	import Icon from '@iconify/svelte';


  const applications = [
    {
      event: "Megaeex Award Ceremony",
      speaker: "John Odoemenem",
      date: "20/07/2025",
      topic: "The future of AI in business",
      status: "Accepted",
      statusClass: "bg-green-100 text-green-700"
    },
    {
      event: "Megaeex Award Ceremony",
      speaker: "John Odoemenem",
      date: "20/07/2025",
      topic: "The future of AI in business",
      status: "Rejected",
      statusClass: "bg-red-100 text-red-600"
    },
    {
      event: "Megaeex Award Ceremony",
      speaker: "John Odoemenem",
      date: "20/07/2025",
      topic: "The future of AI in business",
      status: "Pending",
      statusClass: "bg-yellow-100 text-yellow-700"
    },
    {
      event: "Megaeex Award Ceremony",
      speaker: "John Odoemenem",
      date: "20/07/2025",
      topic: "The future of AI in business",
      status: "Withdrawn",
      statusClass: "bg-purple-100 text-purple-700"
    }
  ];
</script>

<div class="min-h-screen p-6">
  <!-- HEADER -->
  <div class="flex items-center justify-between mb-6">
    <!-- Left -->
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold text-gray-900">My Applications</h1>
        <span class="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>
      <p class="text-sm text-gray-500 mt-1">
        Track the status of your applications to speak at events.
      </p>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
      >
        <img src="/file-upload.svg" class="w-4" />
        Browse Events
      </button>

      <button
        class="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
      >
        Category
       <Icon icon="heroicons:paper-airplane" class="h-3 w-3 rotate-90" />
      </button>
    </div>
  </div>

  <!-- APPLICATION LIST -->
<div class="space-y-4">
  {#each applications as app}
    <div class="bg-white rounded-xl px-4 py-4 shadow-sm">

      <!-- MOBILE VIEW -->
      <div class="flex flex-col gap-3 md:hidden">

        <!-- Top row -->
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">
            {app.event}
          </h3>

          <span class={`text-xs font-medium px-3 py-1 rounded-full ${app.statusClass}`}>
            {app.status}
          </span>
        </div>

        <!-- Speaker -->
        <div class="flex items-center gap-3">
          <img
            src="/Profile Gravater.svg"
            alt="avatar"
            class="h-8 w-8 rounded-full bg-gray-200"
          />
          <span class="text-sm text-gray-700">
            {app.speaker}
          </span>
        </div>

        <!-- Topic -->
        <p class="text-sm text-gray-600">
          {app.topic}
        </p>

        <!-- Bottom row -->
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">
            {app.date}
          </span>

          <div class="flex items-center gap-3">
            <button class="text-sm text-gray-700">
              View
            </button>

            <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- DESKTOP VIEW (UNCHANGED) -->
      <div class="hidden md:flex items-center justify-between">

        <!-- LEFT -->
        <div class="flex items-center gap-4 flex-nowrap whitespace-nowrap overflow-hidden">

          <span class="font-medium text-gray-900 truncate max-w-[220px]">
            {app.event}
          </span>

          <img
            src="/Profile Gravater.svg"
            alt="avatar"
            class="h-10 w-10 shrink-0 rounded-full bg-gray-200"
          />

          <span class="text-gray-700 truncate max-w-[160px]">
            {app.speaker}
          </span>

          <span class="text-sm text-gray-400 shrink-0">
            {app.date}
          </span>

          <span class="text-gray-800 font-medium truncate max-w-[260px]">
            {app.topic}
          </span>
        </div>

        <!-- RIGHT -->
        <div class="flex items-center gap-4 shrink-0">

          <span class={`text-xs font-medium px-3 py-1 rounded-full ${app.statusClass}`}>
            {app.status}
          </span>

          <button class="text-sm text-gray-700 hover:text-gray-900">
            View Details
          </button>

          <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  {/each}
</div>


</div>
