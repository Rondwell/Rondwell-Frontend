<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	export let event: any;
	export let type: string = 'attending';
	export let variant: 'default' | 'subscriber' = 'default';
	export let eventId: string = '';
	export let slug: string = '';

	$: eventHref = slug ? `/e/${slug}` : eventId ? `/event-page/${eventId}` : undefined;
</script>

{#if variant === 'subscriber'}
	<!-- SUBSCRIBER COMPACT CARD -->
	<div class="flex items-start justify-between rounded-xl bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-2">
			<h3 class="text-base font-semibold text-gray-900">{event.title}</h3>
			<p class="text-sm text-[#A4A4A5]">{event.date}, {event.time}</p>
			<div class="mt-2">
				<p class="text-xs text-[#828486]">Tickets</p>
				<div class="flex items-center">
					<span class="text-sm font-medium text-[#828486]">{event.ticketCount}×</span>
					<span> {event.ticketType}</span>
				</div>
			</div>
		</div>
		<span class="h-fit rounded-full px-3 py-1 text-xs font-medium {event.status === 'Going' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}">
			{event.status}
		</span>
	</div>
{:else}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<svelte:element
		this={eventHref ? 'a' : 'div'}
		href={eventHref}
		target={eventHref ? '_blank' : undefined}
		rel={eventHref ? 'noopener noreferrer' : undefined}
		class="flex cursor-pointer gap-3 rounded-xl bg-[#FDFDFD] p-3 no-underline transition-shadow hover:shadow-md sm:gap-4 sm:p-4 md:p-5"
	>
		<!-- Left content -->
		<div class="flex min-w-0 flex-1 flex-col justify-between">
			<!-- Top section -->
			<div class="space-y-1 sm:space-y-1.5">
				<!-- Time -->
				<span class="text-[11px] text-[#B9BABA] sm:text-xs">{event.time}</span>

				<!-- Title (clamped to 2 lines) -->
				<div class="flex items-start gap-1.5">
					{#if type !== 'mine'}
						<img src="/star.svg" alt="Featured" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
					{/if}
					<h3 class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 sm:text-[15px]">
						{event.title}
					</h3>
				</div>

				<!-- Organizer -->
				{#if type !== 'mine'}
					<div class="flex items-center gap-1.5 text-xs text-[#B9BABA] sm:text-[13px]">
						<img
							src={event.organizerAvatar || '/you-rondwell.png'}
							alt="Organizer"
							class="h-4 w-4 rounded-full object-cover sm:h-5 sm:w-5"
							on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/you-rondwell.png'; }}
						/>
						<span class="truncate">{event.organizers}</span>
					</div>
				{/if}

				<!-- Location -->
				<div class="flex items-center gap-1.5 text-[11px] text-[#B9BABA] sm:text-xs">
					<img src={event.locationIcon} alt="Location" class="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
					<span class="truncate">{event.location}</span>
				</div>

				{#if type === 'mine'}
					<div class="flex items-center gap-1.5 text-[11px] text-[#B9BABA] sm:text-xs">
						<img src="/group-icon.svg" alt="Attendees" class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
						<span>{event.attendees ?? 0} Attendees</span>
					</div>
				{/if}
			</div>

			<!-- Bottom tags -->
			<div class="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
				{#if type !== 'mine'}
					<span class="rounded-full bg-[#F0FFF0] px-2 py-0.5 text-[10px] font-medium text-[#3CBD2C] sm:text-[11px]">
						{event.status}
					</span>
					{#if event.availability}
						<span class="rounded-full bg-[#F3F0FF] px-2 py-0.5 text-[10px] font-medium text-[#7C3AED] sm:text-[11px]">
							{event.availability}
						</span>
					{/if}
					{#if event.attendees && event.attendees !== '0'}
						<div class="flex items-center gap-1 rounded-full bg-[#F4F4F4] px-2 py-0.5">
							<img src="/attendee-icon.svg" alt="Attendees" class="h-3.5 w-3.5" />
							<span class="text-[10px] font-medium text-[#7F7F81] sm:text-[11px]">{event.attendees}</span>
						</div>
					{/if}
					{#if event.category}
						<div class="flex items-center gap-1 rounded-full bg-[#F4F4F4] px-2 py-0.5 text-[10px] text-[#7F7F81] sm:text-[11px]">
							<span class="text-[9px]">#</span>
							<span>{event.category}</span>
						</div>
					{/if}
					{#if event.collectionName}
						<div class="flex items-center gap-1 rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] text-[#6D28D9] sm:text-[11px]">
							<Icon icon="mdi:folder-outline" class="h-3 w-3" />
							<span class="truncate">{event.collectionName}</span>
						</div>
					{/if}
				{:else}
					{#if event.category}
						<div class="flex items-center gap-1 rounded-full bg-[#F4F4F4] px-2 py-0.5 text-[10px] text-[#7F7F81] sm:text-[11px]">
							<span class="text-[9px]">#</span>
							<span>{event.category}</span>
						</div>
					{/if}
				{/if}
				{#if event.tag}
					<div class="flex items-center gap-1 rounded-full bg-[#F4F4F4] px-2 py-0.5 text-[10px] sm:text-[11px]">
						<img src="/tech-icon.svg" alt="icon" class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
						<span class="truncate text-[#7F7F81]">{event.tag}</span>
					</div>
				{/if}

				{#if type === 'mine'}
					<button
						on:click|stopPropagation|preventDefault={() => goto(`/events/${event.id}`)}
						class="flex items-center gap-1 rounded-md bg-[#F4F4F4] px-2.5 py-1.5 text-[11px] font-medium text-[#616265] sm:px-3 sm:text-xs"
					>
						Manage Event
						<Icon icon="mdi:chevron-right" class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>
		</div>

		<!-- Event Image -->
		<div class="h-[140px] w-[100px] flex-shrink-0 overflow-hidden rounded-xl sm:h-[160px] sm:w-[120px] md:h-[170px] md:w-[130px]">
			<img
				src={event.image || '/events.png'}
				alt={event.title}
				class="h-full w-full object-cover"
				on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/events.png'; }}
			/>
		</div>
	</svelte:element>
{/if}
