<!-- src/routes/+page.svelte -->
<script lang="ts">
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	import EventCard from '$lib/components/EventCard.svelte';

	let activeTab = 'Upcoming';
	// Mock data for the page
	const events = [
		{
			date: '2024-06-25',
			time: '12:00 PM',
			title: "Geegpay's Geegs & Groove",
			organizers: 'By Cynthia Orji & Beverly',
			location: 'Lagos',
			locationIcon: '/location.svg',
			status: 'Attending',
			availability: 'sold out',
			attendees: '+1.5K',
			image: '/eventcard.png',
			tag: 'Tech Cabal'
		}
	];

	// Grouped map: only created if needed
	let groupedEvents = new Map();

	events.forEach((event) => {
		const eventDate = event.date;
		if (!groupedEvents.has(eventDate)) {
			groupedEvents.set(eventDate, []);
		}
		groupedEvents.get(eventDate).push(event);
	});

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return {
			formatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
		};
	}

	const collections = [
		{
			name: 'The GenAI Collective',
			image: '/eventcard.png',
			events: [
				{ title: '💕  GenAI Collective NTC 💕 Resarch Roundatable ', date: 'Thu, Sep 19, 6:30 PM' },
				{ title: '💕  GenAI Collective NTC 💕 Resarch Roundatable ', date: 'Thu, Sep 19, 6:30 PM' }
			]
		}
	];
</script>

<div class="w-full">
	<!-- Welcome Aboard Section -->
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-medium">Welcome Aboard</h1>

		<div
			class="flex h-full min-h-[181.5px] flex-col items-start gap-4 rounded-lg bg-[#FDFDFD] p-3 md:flex-row md:p-6"
		>
			<!-- <div class="flex h-full items-start gap-4"> -->
			<div
				class="flex w-full items-center justify-center rounded bg-[#F4F5F6] p-5 md:h-[144px] md:max-w-[195.09px]"
			>
				<img src="/folder-icon.png" alt="folder icon" class="w-full" />
			</div>

			<div
				class="flex h-full min-h-[144px] flex-1 flex-col justify-between text-center md:text-left"
			>
				<span>
					<h2 class="font-mediun mb-1 text-xl">Welcome to Rondwell</h2>
					<p class="mb-3 max-w-[724px] text-sm text-[#B9BABA]">
						Rondwell lets you easily share and manage your events. Every event on Rondwell is part
						of a calendar. Let's see how they work.
					</p>
				</span>

				<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
					<div class="mt-4 flex items-center gap-1">
						<span class="h-1 w-8 rounded bg-black"></span>
						<span class="h-1 w-8 rounded-full bg-gray-400"></span>
						<span class="h-1 w-8 rounded-full bg-gray-400"></span>
						<span class="h-1 w-8 rounded-full bg-gray-400"></span>
					</div>
					<button
						class="h-[38px] w-full rounded bg-black px-3 py-1 text-sm font-medium text-white md:w-fit"
					>
						Next
					</button>
				</div>
			</div>
			<!-- </div> -->
		</div>
	</div>

	<!-- Events Section -->
	<div class="mb-8 w-full">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-medium">Events</h2>

			<div class="h-[50px] w-fit rounded bg-[#E0E9EC] p-1 text-[#98A1A4]">
				<button
					class={`h-full w-25 cursor-pointer rounded px-3 py-1 text-sm ${
						activeTab === 'Upcoming' ? 'bg-white text-black shadow-md' : ''
					}`}
					on:click={() => (activeTab = 'Upcoming')}
				>
					Upcoming
				</button>
				<button
					class={`h-full w-25 cursor-pointer rounded px-3 py-1 text-sm ${
						activeTab === 'Past' ? 'bg-white text-black shadow-md' : ''
					}`}
					on:click={() => (activeTab = 'Past')}
				>
					Past
				</button>
			</div>
		</div>

		<!-- <EventCard {events} /> -->
		<div class="mb-12 w-full space-y-10">
			{#each Array.from(groupedEvents) as [date, dayEvents]}
				<!-- Date Label -->
				<div class="flex flex-col items-stretch gap-4 md:flex-row">
					<div class="flex w-full max-w-[120px] justify-between">
						<div>
							<div class="text-lg">{formatDate(date).formatted}</div>
							<div class="text-lg text-[#B9BABA]">{formatDate(date).weekday}</div>
						</div>
						<div class="hidden w-[11.75px] flex-col items-center justify-center gap-1 md:flex">
							<span class="h-[11.75px] w-[11.75px] rounded-full bg-[#D9D9D9]"></span>
							<span class="ml-1 h-full border-2 border-dashed border-[#D9D9D9]"></span>
						</div>
					</div>
					<div class="flex w-full max-w-[687px] flex-col gap-4">
						{#each dayEvents as event, index (index)}
							<EventCard {event} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Subscribed Collections Section -->
	<div>
		<h2 class="mb-4 text-2xl font-medium">Subscribed Collections</h2>

		<div class="mb-12 flex w-full max-w-[1020px] flex-col gap-4">
			{#each collections as collection, index (index)}
				<CollectionCard {collection} />
			{/each}
		</div>
	</div>
</div>
