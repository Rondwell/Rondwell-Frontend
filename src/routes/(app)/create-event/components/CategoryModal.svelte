<script lang="ts">
	export let open = false;

	const categories = [
		'🎨 Art',
		'🎭 Culture',
		'💼 Business',
		'📈 Career',
		'📣 Speaker',
		'🛠 Workshop',
		'🤝 Networking',
		'🛍 Trade Show',
		'🏟 Expo',
		'🎉 Festival',
		'🎊 Party',
		'🎵 Concert',
		'🎭 Performance',
		'🎧 DJ',
		'😂 Comedy',
		'🎬 Film',
		'👀 Screening',
		'🎮 Gaming',
		'🏅 Sports',
		'🏋️ Fitness',
		'🏃 Race',
		'🧘 Retreat',
		'🌿 Wellness',
		'❤️ Health',
		'🎗 Charity',
		'🤝 Community',
		'🎓 Education',
		'🔬 Science',
		'💡 Technology',
		'🖥 Technology',
		'🚀 Startup',
		'👨‍👩‍👧‍👦 Family',
		'🧒 Kids',
		'🛐 Religion',
		'🧳 Travel'
	];

	let selected: string[] = [];

	function toggleCategory(category: string) {
		if (selected.includes(category)) {
			selected = selected.filter((c) => c !== category);
		} else {
			selected = [...selected, category];
		}
	}

	function done() {
		console.log('Selected categories:', selected);
		open = false;
	}
</script>

{#if open}
	<!-- Overlay -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
		<!-- Modal -->
		<div class="w-full max-w-2xl rounded-[16px] bg-[#EBECED] p-7 shadow-lg">
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-black">Select event category</h2>
				<button
					class="cursor-pointer text-xl leading-none text-gray-500 hover:text-gray-800"
					on:click={() => (open = false)}
				>
					✕
				</button>
			</div>

			<!-- Category List -->
			<div
				class="custom-scrollbar mt-6 flex max-h-[60vh] flex-wrap gap-4 overflow-y-auto md:grid md:grid-cols-4"
			>
				{#each categories as category}
					<button
						class="flex flex-shrink-0 items-center justify-center gap-1 rounded-[20px] px-3 py-2 text-sm transition
              {selected.includes(category)
							? 'bg-gray-800 text-white'
							: 'bg-[#FDFDFD] text-[#909EA3] hover:bg-white hover:text-gray-800'}"
						on:click={() => toggleCategory(category)}
					>
						{category}
					</button>
				{/each}
			</div>

			<div class="flex items-center justify-between bg-[#EBECED] pt-4">
				<button
					class="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
					on:click={done}
				>
					Done
				</button>
				<p class="text-sm font-semibold text-gray-800">
					{selected.length} Selected
				</p>
			</div>
		</div>
	</div>
{/if}
