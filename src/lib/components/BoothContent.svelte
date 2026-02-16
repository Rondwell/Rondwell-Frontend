<script>
    export let groups
    export let statusStyles
    export let viewMode
</script>

<div class="flex flex-wrap  flex-col  items-center justify-center py-10">
<div class="space-y-6 w-full">
    {#each groups as group}
    <div class="flex flex-wrap gap-4 w-full">

        <!-- DATE COLUMN (far left) -->
        <div class="flex w-[90px] ml-3 flex-col items-start shrink-0">
        <div class="whitespace-nowrap text-sm font-medium">
            {group.date}
        </div>
        <div class="whitespace-nowrap text-sm text-gray-400">
            {group.day}
        </div>
        </div>

        <!-- RIGHT SIDE: TIMELINE + CONTENT -->
<div class="ml-auto flex  items-start gap-6">

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
<div class="flex flex-wrap justify-around gap-4 ">
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
            width=""
        />
        <span
            class={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}
        >
            {item.status}
        </span>
        </div>

        <!-- TEXT -->
        <h3 class="text-2xl font-semibold leading-tight pt-5">
            Innovative Tech Showcase 2025
        </h3>
        <div class="flex gap-4">
            <div class="flex gap-1 mt-1 text-sm text-gray-500 pt-5">
                <img src="/eye.svg" alt="view-icon" class="h-5 w-5"/>
                <span>Views</span>
            </div>

            <div class="flex gap-1 mt-1 text-sm text-gray-500 pt-5">
                <img src="/eye.svg" alt="view-icon" class="h-5 w-5"/>
                <span>Leads</span>
            </div>
        </div>

        <!-- ACTIONS -->
        <div class="mt-3 grid grid-col-3 pt-5 items-center gap-2">
        <button
            class=" gap-1 rounded-md bg-black px-3 py-1 text-xs text-white"
        >
            <div class="flex p-2 justify-center gap-4">
                <img src="/eye.svg" alt="view-icon" class="h-5 w-5" />
                <span>View Public Page</span>
            </div>
        </button>
        <div class="grid grid-cols-12">
            <button class="rounded-md border border-black col-span-10 gap-1"
                >
                <div class="flex p-2 justify-center gap-4">
                    <img src="/edit-icon3.svg" alt="edit-icon" class="h-5 w-5" />
                    <span>Edit Booth</span>
                </div>
            </button>

            <button class="col-span-2  px-3 py-1  ">
                <img src="/more-square.svg" alt="more-icon" class="h-6 w-6" />
            </button>
        </div>
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
