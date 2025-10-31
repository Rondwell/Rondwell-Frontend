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
</script>

{#if open}
	<div id="Category" class="absolute z-50 mt-2 rounded-lg bg-[#EBECED]">
		<div class="w-full max-w-2xl rounded-[16px] bg-[#EBECED] p-7">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Select event category</h2>
				<button
					class="cursor-pointer text-gray-500 hover:text-gray-800"
					on:click={() => (open = false)}>✕</button
				>
			</div>

			<div
				class="custom-scrollbar mt-6 flex max-h-[70vh] flex-wrap gap-4 overflow-y-auto md:grid md:grid-cols-4"
			>
				{#each categories as category}
					<button
						class="flex flex-shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[20px] bg-[#FDFDFD] px-3 py-2 text-sm text-[#909EA3]"
					>
						{category}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
