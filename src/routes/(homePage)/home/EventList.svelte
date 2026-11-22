<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import { discoverEvents } from '$lib/services/event.services';

	interface NormalizedHomeEvent {
		id: string;
		slug?: string;
		title: string;
		startDateTime?: string;
		endDateTime?: string;
		date: string;
		time: string;
		location: string;
		locationDetails?: any;
		eventType?: string;
		displayPictureUrl?: string;
		coverPictureUrl?: string;
		image?: string;
		category?: string;
		tags?: string[];
		organizer?: string;
		eventOrganizerName?: string;
		registrationType?: string;
		price?: string;
		themeColor?: string;
		themeFont?: string;
		attendeeCount?: number;
	}

	const quickCategories = [
		{ id: 'all', label: 'All Happening' },
		{ id: 'Tech', label: 'Tech & AI' },
		{ id: 'Music', label: 'Music & Nightlife' },
		{ id: 'Arts', label: 'Arts & Culture' },
		{ id: 'Business', label: 'Business' },
		{ id: 'VIRTUAL', label: 'Virtual Live' }
	];

	let events: NormalizedHomeEvent[] = [];
	let loading = true;
	let selectedFilter = 'all';

	function normalizeHomeEvent(e: any): NormalizedHomeEvent {
		const start = e.startDateTime ? new Date(e.startDateTime) : null;
		const validStart = start && !Number.isNaN(start.getTime()) ? start : null;
		return {
			id: e._id || e.id,
			slug: e.customLinkSlug || e.slug,
			title: e.title || 'Untitled Event',
			startDateTime: e.startDateTime,
			endDateTime: e.endDateTime,
			date: validStart
				? validStart.toLocaleDateString('en-US', {
						weekday: 'short',
						month: 'short',
						day: 'numeric'
					})
				: 'Date TBA',
			time: validStart
				? validStart.toLocaleTimeString('en-US', {
						hour: 'numeric',
						minute: '2-digit'
					})
				: 'Time TBA',
			location: e.locationDetails?.physicalAddress || e.locationDetails?.city || e.eventType || '',
			locationDetails: e.locationDetails,
			eventType: e.eventType,
			displayPictureUrl: e.displayPictureUrl,
			coverPictureUrl: e.coverPictureUrl,
			image: e.displayPictureUrl || e.coverPictureUrl || '',
			category: e.category || '',
			tags: Array.isArray(e.tags) ? e.tags : [],
			organizer: e.eventOrganizerName || e.organizerName || 'Rondwell Host',
			eventOrganizerName: e.eventOrganizerName,
			registrationType: e.registrationType,
			price: e.registrationType === 'PAID' ? 'Paid' : 'Free',
			themeColor: e.themeColor,
			themeFont: e.themeFont,
			attendeeCount: e.attendeeCount
		};
	}

	onMount(async () => {
		try {
			const res = await discoverEvents({ page: 1, limit: 9, sort: 'upcoming' });
			const raw = Array.isArray(res?.events) ? res.events : [];
			events = raw.map(normalizeHomeEvent);
		} catch {
			events = [];
		} finally {
			loading = false;
		}
	});

	$: filteredEvents = events.filter((ev) => {
		if (selectedFilter === 'all') return true;
		if (selectedFilter === 'VIRTUAL') return String(ev.eventType).toUpperCase() === 'VIRTUAL';
		const hay = `${ev.category || ''} ${(ev.tags || []).join(' ')} ${ev.title}`.toLowerCase();
		return hay.includes(selectedFilter.toLowerCase());
	}).slice(0, 6);
</script>

<section class="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<span class="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-[#AB46DD] uppercase">
				<Icon icon="solar:flame-bold-duotone" class="h-4 w-4 text-[#DB3E6C]" />
				Happening on Rondwell
			</span>
			<h2 class="mt-1.5 text-3xl font-bold tracking-tight text-[#17161E]">
				Discover upcoming experiences
			</h2>
		</div>

		<a
			href="/discover"
			class="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-[#17161E] no-underline shadow-xs transition hover:border-black/20 hover:bg-[#FAF9FC]"
		>
			<img src="/Disc1.svg" alt="" class="h-4 w-4 object-contain" />
			<span>Browse Full Calendar</span>
			<Icon icon="solar:arrow-right-linear" class="h-3.5 w-3.5" />
		</a>
	</div>

	<!-- Category Filter Bar -->
	<div class="no-scrollbar mt-6 flex items-center gap-2 overflow-x-auto pb-2">
		{#each quickCategories as cat}
			<button
				type="button"
				on:click={() => (selectedFilter = cat.id)}
				class={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
					selectedFilter === cat.id
						? 'border-[#17161E] bg-[#17161E] text-white shadow-xs'
						: 'border-black/10 bg-white text-[#52505D] hover:border-black/20 hover:text-[#17161E]'
				}`}
			>
				{cat.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<!-- Ticket Skeleton Grid -->
		<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3, 4, 5, 6] as item (item)}
				<div class="flex h-[340px] animate-pulse flex-col rounded-[22px] border border-black/8 bg-white p-5 shadow-xs">
					<div class="flex justify-between">
						<div class="h-5 w-20 rounded-full bg-black/8"></div>
						<div class="h-5 w-14 rounded-full bg-black/8"></div>
					</div>
					<div class="mt-6 h-32 w-full rounded-2xl bg-black/6"></div>
					<div class="mt-5 h-5 w-3/4 rounded-md bg-black/8"></div>
					<div class="mt-auto flex items-center justify-between border-t border-dashed border-black/10 pt-4">
						<div class="space-y-2">
							<div class="h-3.5 w-24 rounded bg-black/8"></div>
							<div class="h-3 w-20 rounded bg-black/6"></div>
						</div>
						<div class="h-10 w-10 rounded-lg bg-black/8"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredEvents.length === 0}
		<div class="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-black/15 bg-[#FAF9FC] px-6 py-14 text-center">
			<Icon icon="solar:calendar-search-bold-duotone" class="h-10 w-10 text-[#AB46DD]" />
			<p class="mt-3 text-base font-bold text-[#17161E]">
				No public events matched this filter yet
			</p>
			<p class="mt-1 max-w-md text-sm text-[#6B6878]">
				Try clearing the category chip or explore the full Discover directory.
			</p>
			<div class="mt-5 flex items-center gap-3">
				{#if selectedFilter !== 'all'}
					<button
						type="button"
						on:click={() => (selectedFilter = 'all')}
						class="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-[#17161E]"
					>
						Show All Events
					</button>
				{/if}
				<a
					href="/discover"
					class="rounded-full bg-[#17161E] px-5 py-2 text-xs font-semibold text-white no-underline"
				>
					Open Discover
				</a>
			</div>
		</div>
	{:else}
		<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredEvents as ev (ev.id)}
				<EventCard
					event={ev}
					eventId={ev.id}
					slug={ev.slug}
					variant="ticket"
					interactiveTilt={true}
				/>
			{/each}
		</div>
	{/if}
</section>

<style>
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
