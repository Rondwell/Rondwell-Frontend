<script lang="ts">
	import Icon from '@iconify/svelte';


  const invitations = [
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
      status: "Declined",
      statusClass: "bg-red-100 text-red-600"
    },
    {
      event: "Megaeex Award Ceremony",
      speaker: "John Odoemenem",
      date: "20/07/2025",
      topic: "The future of AI in business",
      status: "Pending",
      statusClass: "bg-yellow-100 text-yellow-700"
    }
  ];
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <!-- HEADER -->
  <div class="flex items-center justify-between mb-6">
    <!-- Left -->
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold text-gray-900">Invitations from Organizers
        </h1>
        <span class="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
          {invitations.length}
        </span>
      </div>
      <p class="text-sm text-gray-500 mt-1">
        Review direct invitations to speak at events.
      </p>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
      >
        Category
       <Icon icon="heroicons:paper-airplane" class="h-3 w-3 rotate-90" />
      </button>
    </div>
  </div>

  <!-- APPLICATION LIST -->
  <div class="space-y-3">
  {#each invitations as app}
    <div
      class="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm"
    >
      <!-- LEFT CONTENT (ONE LINE) -->
      <div class="flex items-center gap-4 flex-nowrap whitespace-nowrap overflow-hidden">
        
        <!-- Event -->
        <span class="font-medium text-gray-900 truncate max-w-[220px]">
          {app.event}
        </span>

        <!-- Info Icon -->
        <img
										src="/edit-cover-photo.svg"
										alt="avatar"
										class="h-10 w-10 shrink-0 rounded-full bg-gray-200"
									/>

        <!-- Speaker -->
        <span class="text-gray-700 truncate max-w-[160px]">
          {app.speaker}
        </span>

        <!-- Date -->
        <span class="text-sm text-gray-400 shrink-0">
          {app.date}
        </span>

        <!-- Topic -->
        <span class="text-gray-800 font-medium truncate max-w-[260px]">
          {app.topic}
        </span>
      </div>

      <!-- RIGHT CONTENT (ONE LINE) -->
      <div class="flex items-center gap-4 flex-nowrap whitespace-nowrap shrink-0">
        
        <!-- Status -->
        <span
          class={`text-xs font-medium px-3 py-1 rounded-full ${app.statusClass}`}
        >
          {app.status}
        </span>

        <!-- View Details -->
        <button class="text-sm text-gray-700 hover:text-gray-900">
          View Details
        </button>

        <!-- Three Dots Menu -->
<div class="relative">
  <button
    class="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <circle cx="10" cy="4" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="10" cy="16" r="1.5" />
    </svg>
  </button>

  <!-- Dropdown -->
  <div
    class="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover:block"
  >
    <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
      View Details
    </button>
    <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
      Withdraw
    </button>
    <button class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
      Delete
    </button>
  </div>
</div>

      </div>
    </div>
  {/each}
</div>

</div>
