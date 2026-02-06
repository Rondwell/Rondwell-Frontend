<script lang="ts">
	import CreateBoothModal from '../../component/CreateBoothModal.svelte';
	let showModal = false;

	function openModal() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	function handleBoothCreated(event: CustomEvent) {
		// Handle the created booth data
		console.log('Booth created:', event.detail);
		closeModal();
	}
	const groups = [
    {
      date: 'January 25',
      day: 'Monday',
      items: [
        { status: 'Published' },
        { status: 'Draft' }
      ]
    },
    {
      date: 'Sep 25',
      day: 'Wednesday',
      items: [
        { status: 'Archived' },
        { status: 'Active' }
      ]
    },
    {
      date: 'Sep 25',
      day: 'Wednesday',
      items: [
        { status: 'Archived' },
        { status: 'Draft' }
      ]
    }
  ];

  const statusStyles: Record<string, string> = {
    Published: 'bg-green-100 text-green-700',
    Draft: 'bg-purple-100 text-purple-700',
    Archived: 'bg-pink-100 text-pink-700',
    Active: 'bg-emerald-100 text-emerald-700'
  };
  let viewMode: 'grid' | 'list' = 'grid';

function setGridView() {
  viewMode = 'grid';
}

function setListView() {
  viewMode = 'list';
}
$: pageTitle =
  viewMode === 'list'
    ? 'My Products & Services'
    : 'My Speaking Portfolio';

</script>

<div class="min-h-screen bg-gradient-to-b ">
	<!-- Top Header -->
	<div class="flex items-center justify-between mb-8">
		<div class="flex items-center gap-2 text-lg font-semibold">
			<span class="w-6 h-6 bg-yellow-400 rounded-full inline-flex items-center justify-center text-sm"><img src="/tech-icon.svg" alt="Tech Icon"/></span>
			Innocent James
		</div>

		<div class="flex items-center gap-3">
			<button class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm shadow" onclick={() => (showModal = true)}>
				<span class="text-lg">+</span>
				Add New Engagement
			</button>

			<div class="flex rounded-lg bg-white shadow overflow-hidden">
  <button
    class="p-2 transition"
    class:bg-gray-100={viewMode === 'grid'}
    onclick={setGridView}
  >
    <img src="/category.svg" alt="grid Icon" />
  </button>

  <button
    class="p-2 transition"
    class:bg-gray-100={viewMode === 'list'}
    onclick={setListView}
  >
    <img src="/list.svg" alt="list Icon" />
  </button>
</div>

		</div>
	</div>

	<!-- Title + Search -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
		<h1 class="text-xl font-semibold">{pageTitle}</h1>

		<div class="flex gap-3">
			<div class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow text-sm">
				<span><img src="/search.svg" alt="Search Icon" /></span>
				<input
					type="text"
					placeholder="Search portfolio entries..."
					class="outline-none bg-transparent w-48"
				/>
			</div>

			<button class="bg-white px-4 py-2 rounded-lg shadow text-sm flex items-center gap-1">
				Category
				<span><img src="/arrow-dropdown.svg" alt="Category Icon" /></span>
			</button>
		</div>
	</div>
<!-- PORTFOLIO ENTRIES -->
<div class="flex w-full flex-col">
  <div class="space-y-6 w-full">
    {#each groups as group}
      <div class="flex items-start gap-4 w-full">

        <!-- DATE COLUMN (far left) -->
        <div class="flex w-[90px] flex-col items-start shrink-0">
          <div class="whitespace-nowrap text-sm font-medium">
            {group.date}
          </div>
          <div class="whitespace-nowrap text-sm text-gray-400">
            {group.day}
          </div>
        </div>

        <!-- RIGHT SIDE: TIMELINE + CONTENT -->
<div class="ml-auto flex items-start gap-6">

  <!-- TIMELINE COLUMN (CONTINUOUS) -->
  <div class="relative hidden md:flex w-[11px] shrink-0 justify-center self-stretch">
    <!-- CONTINUOUS DASHED LINE -->
    <span class="absolute top-0 bottom-0 border-l-2 border-dashed border-[#D9D9D9]"></span>

    <!-- DOT -->
    <span class="relative z-10 mt-2 h-[11px] w-[11px] rounded-full bg-[#D9D9D9]"></span>
  </div>

  <!-- CONTENT GRID (far right) -->
 <!-- CONTENT -->
{#if viewMode === 'grid'}
  <!-- GRID VIEW -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {#each group.items as item}
      <!-- EXISTING CARD (UNCHANGED) -->
      <div class="w-[320px] rounded-xl border bg-white p-3 shadow-sm">
        <!-- image, text, actions -->
         <!-- IMAGE -->
        <div class="relative mb-3 h-[180px] overflow-hidden rounded-lg bg-gray-200">
          <img
            src="/Megaexe-party.png"
            alt="cover"
            class="h-full w-full object-cover"
          />
          <span
            class={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}
          >
            {item.status}
          </span>
        </div>

        <!-- TEXT -->
        <h3 class="text-base font-semibold leading-tight pt-5">
          Shaping the future<br />with AI
        </h3>
        <p class="mt-1 text-sm text-gray-500 pt-5">
          How AI transforms education
        </p>

        <p class="mt-1 text-xs text-gray-400">
          12 Minutes Ago
        </p>

        <!-- ACTIONS -->
        <div class="mt-3 flex items-center gap-2">
          <button
            class="flex items-center gap-1 rounded-md bg-black px-3 py-1 text-xs text-white"
          >
            <img src="/eye.svg" alt="view-icon" class="h-3 w-3" />
            <span>View</span>
          </button>
          <button
            class="flex items-center gap-1 rounded-md border border-black px-3 py-1 text-xs"
          >
            <img src="/edit-icon3.svg" alt="edit-icon" class="h-3 w-3" />
            <span>Edit</span>
          </button>

          <button>
            <img src="/more-square.svg" alt="more-icon" class="h-6 w-6" />
          </button>
        </div>
      </div>
    {/each}
  </div>

{:else}
  <!-- LIST VIEW -->
  <div class="flex flex-col gap-6 w-full">
    {#each group.items as item}
      <div class="flex flex-1 items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm">

  <!-- LEFT CONTENT -->
  <div class="flex flex-col gap-1 flex-1 pr-60">
    <h3 class="text-base font-semibold">
      Shaping the future with AI
    </h3>

    <p class="text-sm text-gray-500">
      How AI transforms education
    </p>

    <p class="text-xs text-gray-400">
      12 Minutes Ago
    </p>

    <div class="mt-2 flex items-center gap-2">
      <button class="flex items-center gap-1 rounded-md bg-black px-3 py-1 text-xs text-white">
        <img src="/eye.svg" class="h-3 w-3" alt="view" />
        View
      </button>

      <button class="flex items-center gap-1 rounded-md border border-black px-3 py-1 text-xs">
        <img src="/edit-icon3.svg" class="h-3 w-3" alt="edit" />
        Edit
      </button>

      <button class="text-gray-400">
        <img src="/more-square.svg" class="h-5 w-5" alt="more" />
      </button>
    </div>
  </div>

  <!-- RIGHT IMAGE -->
  <div class="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-lg">
    <img src="/Megaexe-party.png" alt="cover" class="h-full w-full object-cover" />
    <span class={`absolute right-1 top-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}>
      {item.status}
    </span>
  </div>

</div>

    {/each}
  </div>
{/if}



</div>

      </div>
    {/each}
  </div>
</div>




</div>

<CreateBoothModal bind:show={showModal} on:close={closeModal} on:submit={handleBoothCreated} />