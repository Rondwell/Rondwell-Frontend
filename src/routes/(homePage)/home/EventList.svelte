<script lang="ts">
	import EventCard from '$lib/components/EventCard.svelte';
	import { discoverEvents } from '$lib/services/event.services';
	import { onMount } from 'svelte';

	let events: any[] = [];
	let loading = true;

	onMount(async () => {
		try {
			const data = await discoverEvents({ page: 1, limit: 6 });
			events = data.events.map(normalizeEvent);
		} catch { events = []; }
		finally { loading = false; }
	});

	function normalizeEvent(e: any) {
		const locDetails = e.locationDetails;
		let location = 'TBD';
		let locationIcon = '/location.svg';

		if (e.eventType === 'VIRTUAL' && locDetails?.virtual?.platform) {
			location = locDetails.virtual.platform;
			locationIcon = '/zoom.svg';
		} else if (locDetails?.physical?.venueName) {
			location = locDetails.physical.venueName;
			locationIcon = '/location.svg';
		} else if (e.eventType === 'HYBRID') {
			location = 'Hybrid';
			locationIcon = '/hybrid.svg';
		}

		return {
			id: e._id ?? e.id,
			time: e.startDateTime
				? new Date(e.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
				  new Date(e.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
				: '',
			title: e.title ?? 'Untitled Event',
			organizers: e.eventOrganizerName ? `By ${e.eventOrganizerName}` : '',
			location,
			locationIcon,
			status: e.registrationType === 'FREE' ? 'Free' : 'Paid',
			availability: e.registrationOpen === false ? 'sold out' : (e.category ?? ''),
			attendees: e.attendeeCount > 0 ? `+${e.attendeeCount}` : '0',
			image: e.displayPictureUrl ?? e.coverPictureUrl ?? '/event_pic1.png',
			tag: e.collectionName ?? '',
			organizerAvatar: e.organizerAvatarUrl ?? '',
		};
	}
</script>

<section id="events" class="px-5 pt-10 pb-20 md:px-20">
	<div class="mx-auto max-w-7xl">
		<h2 class="mb-12 text-center text-[40px] font-medium whitespace-nowrap text-gray-900 md:text-[56px]">
			Popular <span class="text-[#7B2CBF]">Events.</span>
		</h2>

		<div class="mb-12 grid gap-4 lg:grid-cols-2">
			{#if loading}
				{#each Array(6) as _}
					<div class="flex animate-pulse gap-4 rounded-md bg-[#FDFDFD] p-6">
						<div class="flex-1 space-y-3">
							<div class="h-3 w-24 rounded bg-gray-200"></div>
							<div class="h-5 w-48 rounded bg-gray-200"></div>
							<div class="h-3 w-32 rounded bg-gray-200"></div>
							<div class="h-3 w-20 rounded bg-gray-200"></div>
							<div class="flex gap-2">
								<div class="h-6 w-16 rounded bg-gray-200"></div>
								<div class="h-6 w-12 rounded bg-gray-200"></div>
							</div>
						</div>
						<div class="h-30 w-30 flex-shrink-0 rounded-xl bg-gray-200"></div>
					</div>
				{/each}
			{:else if events.length > 0}
				{#each events as event (event.id)}
					<EventCard {event} eventId={event.id} />
				{/each}
			{:else}
				<div class="col-span-2 py-12 text-center text-gray-400">
					<p class="text-lg">No events available yet</p>
					<p class="text-sm">Check back soon for upcoming events</p>
				</div>
			{/if}
		</div>

		<div class="flex justify-center">
			<a
				href="/discover"
				class="flex h-[60px] w-[300px] items-center justify-center gap-2 rounded-[13px] bg-[#333537] px-8 py-3 text-center text-[20px] text-white transition-colors duration-200 hover:bg-gray-900 hover:text-white"
			>
				<img src="/Disc1.svg" alt="Discover Icon" class="h-6 w-6 object-contain" />
				Discover more events
			</a>
		</div>
	</div>
</section>
