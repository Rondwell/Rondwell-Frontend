<!-- src/routes/help-center/+page.svelte -->
<script>
	let searchQuery = '';

	const events = [
		{
			title: 'Event Registration Process',
			excerpt:
				'The most important week of free events of the tech ecosystem in LATAM +150 funds & invest.'
		},
		{
			title: 'Event Registration Process',
			excerpt:
				'The most important week of free events of the tech ecosystem in LATAM +150 funds & invest.'
		},
		{
			title: 'Event Registration Process',
			excerpt:
				'The most important week of free events of the tech ecosystem in LATAM +150 funds & invest.'
		},
		{
			title: 'Event Registration Process',
			excerpt:
				'The most important week of free events of the tech ecosystem in LATAM +150 funds & invest.'
		},
		{
			title: 'Event Registration Process',
			excerpt:
				'The most important week of free events of the tech ecosystem in LATAM +150 funds & invest.'
		},
		{
			title: 'Event Registration Process',
			excerpt:
				'The most important week of free events of the tech ecosystem in LATAM +150 funds & invest.'
		}
	];
</script>

<div class="mx-auto max-w-4xl py-10">
	<!-- Hero -->
	<div class="mb-10 flex flex-col items-center gap-6 text-center">
		<img src="logo.png" alt="" class="h-8" />
		<h1 class="mb-4 text-4xl font-bold">Welcome. How can we help?</h1>
		<div class="relative w-full max-w-2xl lg:max-w-3xl">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search help docs, tutorials, and more..."
				class="h-[43px] w-full rounded-lg border border-gray-300 bg-[#FFFFFF] py-2 pr-4 pl-10 text-[#C5C6C6] focus:ring-2 focus:ring-purple-500 focus:outline-none"
			/>
			<span class="absolute top-2.5 left-3 text-gray-400">
				<img src="search-favorite.png" alt="search icon" class="h-5 w-5" />
			</span>
		</div>
	</div>

	<!-- Events Grid -->
	<div>
		<h3 class="mb-4 text-2xl font-bold">Events</h3>

		<div class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each events as event}
				<a href="/help-center/event-registration">
					<article
						class="h-[164px] rounded-lg border border-gray-100 bg-[#FDFDFD] p-5 shadow-sm transition hover:shadow-md"
					>
						<h2 class="mb-2 text-lg font-semibold">{event.title}</h2>
						<p class="text-sm text-[#949596]">{event.excerpt}</p>
					</article>
				</a>
			{/each}
		</div>
	</div>

	<!-- Contact Section -->
	<div class="flex flex-col items-center gap-4 py-8 text-center">
		<p class="text-2xl font-bold">Didn’t find what you are looking for?</p>
		<button
			class="flex cursor-pointer items-center gap-1 rounded-md bg-black px-6 py-2 text-white transition hover:bg-gray-800"
		>
			<img src="direct-normal.png" alt="icon" class="h-5 w-5" />
			Contact Us
		</button>
	</div>
</div>
