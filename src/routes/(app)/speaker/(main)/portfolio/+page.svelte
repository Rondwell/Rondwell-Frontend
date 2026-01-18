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
	const entries = [
		{
			date: 'January 25',
			day: 'Monday',
			items: [
				{ status: 'Published', badge: 'bg-green-100 text-green-700' },
				{ status: 'Draft', badge: 'bg-purple-100 text-purple-700' }
			]
		},
		{
			date: 'Sep 25',
			day: 'Wednesday',
			items: [
				{ status: 'Archived', badge: 'bg-pink-100 text-pink-700' },
				{ status: 'Active', badge: 'bg-green-100 text-green-700' }
			]
		},
		{
			date: 'Sep 25',
			day: 'Wednesday',
			items: [
				{ status: 'Archived', badge: 'bg-pink-100 text-pink-700' },
				{ status: 'Draft', badge: 'bg-purple-100 text-purple-700' }
			]
		}
	];
</script>

<div class="min-h-screen bg-gradient-to-b ">
	<!-- Top Header -->
	<div class="flex items-center justify-between mb-8">
		<div class="flex items-center gap-2 text-lg font-semibold">
			<span class="w-6 h-6 bg-yellow-400 rounded-full inline-flex items-center justify-center text-sm">★</span>
			Innocent James
		</div>

		<div class="flex items-center gap-3">
			<button class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm shadow" onclick={() => (showModal = true)}>
				<span class="text-lg">+</span>
				Add New Engagement
			</button>

			<div class="flex rounded-lg bg-white shadow">
				<button class="p-2">☷</button>
				<button class="p-2">≡</button>
			</div>
		</div>
	</div>

	<!-- Title + Search -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
		<h1 class="text-xl font-semibold">My Speaking Portfolio</h1>

		<div class="flex gap-3">
			<div class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow text-sm">
				<span>🔍</span>
				<input
					type="text"
					placeholder="Search portfolio entries..."
					class="outline-none bg-transparent w-48"
				/>
			</div>

			<button class="bg-white px-4 py-2 rounded-lg shadow text-sm flex items-center gap-1">
				Category
				<span>▾</span>
			</button>
		</div>
	</div>

	<!-- Timeline -->
	<div class="space-y-12">
		{#each entries as group}
			<div class="grid grid-cols-[80px_1fr] gap-6">
				<!-- Date Column -->
				 <div
								class="absolute top-0 -left-[29px] h-3 w-3 rounded-full bg-gray-300 ring-4 ring-gray-50"
							></div>
				<div class="text-sm text-gray-500">
					<p class="font-medium text-gray-700">{group.date}</p>
					<p>{group.day}</p>
				</div>

				<!-- Cards -->
				<div class="grid sm:grid-cols-2 gap-6">
					{#each group.items as item}
						<div class="bg-white rounded-xl shadow p-3">
							<div class="relative">
								<img
									src="/eventcard.png"
									alt="cover"
									class="rounded-lg h-36 w-full object-cover"
								/>
								<span
									class={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${item.badge}`}
								>
									{item.status}
								</span>
							</div>

							<div class="mt-4">
								<h3 class="font-semibold text-lg leading-tight">
									Shaping the future<br />with AI
								</h3>
								<p class="text-sm text-gray-500">
									How AI transforms education
								</p>
								<p class="text-xs text-gray-400 mt-1">
									12 Minutes Ago
								</p>
							</div>

							<div class="mt-4 flex items-center gap-3">
								<button
									class="bg-black text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"
								>
									👁 View
								</button>

								<button
									class="border px-4 py-2 rounded-lg text-sm flex items-center gap-1"
								>
									✎ Edit
								</button>

								<button class="ml-auto text-gray-400">⋯</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<CreateBoothModal bind:show={showModal} on:close={closeModal} on:submit={handleBoothCreated} />