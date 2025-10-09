<script>
	import Scroll from '../../../../lib/components/Scroll.svelte';

	let events = Array(8).fill({
		time: 'Jun 28, 12:00 PM',
		title: "Geegpay's Geegs & Groove",
		organizers: 'By Cynthia Orji & Beverly',
		location: 'Lagos',
		status: 'Attending',
		attendees: '+1.5K',
		image: '/eventcard.png'
	});
</script>

<section class="relative max-w-6xl">
	<h1 class="">Featured Events</h1>
	<main class="h-full py-5">
		<div class="grid gap-4 md:grid-cols-2">
			{#each events as event, index (index)}
				<div
					class="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row"
				>
					<div class="flex-1 space-y-3">
						<!-- Event Time -->
						<div class="flex items-center gap-2">
							<span class="text-sm text-gray-500">{event.time}</span>
						</div>

						<!-- Title + Organizers -->
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<img src="/star.png" alt="Featured" class="h-4 w-4" />
								<h3 class="font-semibold text-gray-900">{event.title}</h3>
							</div>

							<div class="flex items-center gap-2 text-sm font-bold text-gray-500">
								<img src="/moon.png" alt="Organizer" class="h-5 w-7" />
								<span>{event.organizers}</span>
							</div>

							<div class="flex items-center gap-2 text-sm text-gray-500">
								<img src="/location.png" alt="Location" class="h-4 w-4" />
								<span>{event.location}</span>
							</div>
						</div>

						<!-- Status + Attendees -->
						<div class="flex items-center gap-4">
							<span class="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
								{event.status}
							</span>
							<div class="flex items-center gap-1 text-sm text-gray-600">
								<span>👥</span>
								<span>{event.attendees}</span>
							</div>
						</div>
					</div>

					<!-- Event Image -->
					<div class="h-[218px] w-full flex-shrink-0 overflow-hidden rounded-xl md:h-24 md:w-24">
						<img
							src={event.image || '/favicon.png'}
							alt={event.title}
							class="h-full w-full object-cover"
						/>
					</div>
				</div>
			{/each}
		</div>
	</main>
	<Scroll />
</section>
