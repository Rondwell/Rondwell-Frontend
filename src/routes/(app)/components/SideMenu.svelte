<aside class="w-64 border-r border-purple-100 bg-[#f6e8fa] p-4">
	<div class="space-y-8">
		<button class="flex items-center space-x-2 font-bold text-purple-700">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-xl text-white"
			>
				+
			</div>
			<span>Create Event</span>
		</button>

		<nav class="space-y-4">
			{#each ['Event', 'Collections', 'Discover', 'Experience'] as item}
				<button
					class="flex w-full items-center space-x-2 text-left text-gray-700 hover:text-purple-700"
				>
					<div class="h-5 w-5 rounded-sm bg-gray-400"></div>
					<!-- Placeholder for icon -->
					<span>{item}</span>
				</button>
			{/each}
		</nav>

		<div class="mt-20">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-300 text-sm text-white"
			>
				🙂
			</div>
		</div>
	</div>
</aside>
