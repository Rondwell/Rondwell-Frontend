<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import CreateBoothModal from '../../components/CreateBoothModal.svelte';

	let showModal = false;
	let viewMode = 'grid'; // 'grid' or 'list'
	let searchQuery = '';
	let selectedCategory = 'all';
	let selectedStatus = 'all';
	let sortBy = 'recent';

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
</script>

<div class="min-h-screen">
	<!-- Header -->
	<div class="py-6 xl:px-8">
		<div class="flex items-center justify-between">
			<div class="mb:mb-2 mb-5 flex items-center gap-5">
				<img alt="loader" src="/loader.svg" class="hidden h-[28.5px] w-[28.5px] md:block" />
				<h1 class="text-[24px] font-bold text-gray-900 md:font-normal xl:text-[35.25px]">
					Sleekwareandslides
				</h1>
			</div>
		</div>
		<div class="ml-auto flex justify-end gap-5">
			<button
				on:click={openModal}
				class="flex items-center gap-3 rounded-[10px] bg-black px-6 py-2.5 text-[18.45px] font-normal text-white transition-colors hover:bg-gray-800"
			>
				<img src="/plus.svg" alt="plus" class="w-[16px]" />
				Add New Booth
			</button>
			<!-- View Mode Toggle -->
			<div class="flex items-center gap-1 rounded-[12.3px] bg-[#0000001A] p-[5px]">
				<button
					class="rounded-[7.38px] p-2 {viewMode === 'grid'
						? 'bg-white shadow-md'
						: 'hover:bg-gray-50 hover:shadow-md'}"
					on:click={() => (viewMode = 'grid')}
				>
					<img src="/grid.svg" alt="grid" class="w-[24.6px]" />
				</button>
				<button
					class="rounded-[7.38px] p-2 {viewMode === 'list'
						? 'bg-white shadow-md'
						: 'hover:bg-white hover:shadow-md'}"
					on:click={() => (viewMode = 'list')}
				>
					<img alt="list" src="/list.svg" class="w-[24.6px]" />
				</button>
			</div>
		</div>
	</div>

	<!-- Page Content -->
	<div class="py-6 xl:px-8">
		<!-- Title and Filters -->
		<div class="mb-6 flex flex-col items-start justify-between 2xl:flex-row 2xl:items-center">
			<div class="flex w-full items-center justify-between space-y-10 xl:w-auto 2xl:space-y-0">
				<h2 class="text-[24.68px] font-normal text-[#192226]">My Digital Booths</h2>
				<button
					class="relative flex h-[44.7px] items-center justify-center gap-3 rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-2 text-[17.22px] font-normal text-[#5C5C5C] shadow-sm lg:hidden"
				>
					Status
					<img src="/arrow-dropdown.svg" alt="arrow-dropdown" class="w-3" />
				</button>
			</div>
			<div
				class="grid w-full grid-cols-2 items-center gap-4 md:w-auto lg:grid-cols-3 lg:items-start 2xl:flex"
			>
				<!-- Search -->
				<div
					class="relative col-span-2 flex h-[44.7px] w-full items-center rounded-[10px] border border-[#EBEBEB] bg-white shadow-sm lg:col-span-3 xl:w-auto"
				>
					<input
						type="text"
						placeholder="Search by booth name..."
						bind:value={searchQuery}
						class="w-80 py-2 pr-5 pl-11 text-[17.22px] font-normal text-[#5C5C5C] placeholder:text-[#A3A3A3] focus:ring-2 focus:ring-transparent focus:outline-none"
					/>

					<img class="absolute top-2 left-3 h-[24.6px] w-[24.6px]" alt="search" src="/search.svg" />
				</div>

				<!-- Category Filter -->
				<button
					class="relative flex h-[44.7px] items-center justify-center gap-3 rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-2 text-[17.22px] text-[#5C5C5C] shadow-sm md:max-w-[131px]"
				>
					Category
					<img src="/arrow-dropdown.svg" alt="arrow-dropdown" class="w-3" />
				</button>

				<!-- Status Filter -->
				<button
					class="relative hidden h-[44.7px] items-center justify-center gap-3 rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-2 text-[17.22px] font-normal text-[#5C5C5C] shadow-sm md:max-w-[131px] lg:flex"
				>
					Status
					<img src="/arrow-dropdown.svg" alt="arrow-dropdown" class="w-3" />
				</button>

				<!-- Sort Filter -->
				<button
					class="relative flex h-[44.7px] items-center justify-center gap-3 rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-2 text-[17.22px] text-[#5C5C5C] shadow-sm md:max-w-[131px]"
				>
					Sort by
					<img src="/arrow-dropdown.svg" alt="arrow-dropdown" class="w-3" />
				</button>
			</div>
		</div>

		<!-- Empty State -->

		<div class="flex flex-col items-center justify-center py-20">
			<div class="relative mx-auto mb-20 h-[283.9px] w-[283.9px]">
				<img src="/empty.svg" alt="eempty" class="relative z-10 w-full" />
				<div class="absolute top-22 left-10 z-0 h-[160.8px] w-[180px] bg-[#D9D9D9]"></div>
			</div>

			<!-- <div class="mb-8">
				<svg class="h-48 w-48 text-gray-300" viewBox="0 0 200 200" fill="none">
					<circle cx="100" cy="100" r="80" fill="#F3F4F6" />
					<rect x="60" y="80" width="30" height="40" rx="4" fill="white" />
					<rect x="100" y="70" width="40" height="30" rx="4" fill="white" />
					<rect x="60" y="130" width="50" height="20" rx="4" fill="white" />
					<rect x="120" y="110" width="20" height="40" rx="4" fill="white" />
					<text x="160" y="60" font-size="80" fill="#D1D5DB" font-weight="bold">0</text>
				</svg>
			</div> -->

			<h3 class="mb-2 text-[31.97px] font-normal text-[#646568]">No Booths / Stands, yet</h3>
			<p class="mb-8 max-w-[440.2px] text-center text-[20.36px] font-light text-[#A2ACB2]">
				You haven't added any boot yet. Start by adding your first one!
			</p>

			<button
				on:click={openModal}
				class="flex items-center gap-2 rounded-[12.33px] bg-[#E2E4E5] px-4 py-3 text-[17.28px] font-medium text-gray-900 transition-colors hover:bg-gray-300"
			>
				<Plus class="h-5 w-5" />
				Add New Booth
			</button>
		</div>
	</div>
</div>

<!-- Modal Component -->
<CreateBoothModal bind:show={showModal} on:close={closeModal} on:submit={handleBoothCreated} />
