<script lang="ts">
	import { page } from '$app/stores';
	import { getPublicCollectionBySlug } from '$lib/services/event.services';
	import { resolveCollectionThemeColor } from '$lib/stores/collectionTheme';
	import { colors, type Color } from '$lib/utils/colors';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: slug = $page.params.slug;

	let loading = true;
	let notFound = false;
	let collection: any = null;
	let events: any[] = [];
	let themeColor: Color = colors[0];

	let activeTab: 'overview' | 'community' = 'overview';
	let dateFilter: 'all' | 'upcoming' | 'past' = 'all';
	let typeFilter = '';
	let searchQuery = '';
	let showTypeDropdown = false;
	let showFullDescription = false;

	const eventTypes = [
		{ value: '', label: 'All Types' },
		{ value: 'PHYSICAL', label: 'Physical' },
		{ value: 'VIRTUAL', label: 'Virtual' },
		{ value: 'HYBRID', label: 'Hybrid' }
	];

	const socialIconMap: Record<string, string> = {
		instagram: 'mdi:instagram', twitter: 'ri:twitter-x-fill', x: 'ri:twitter-x-fill',
		youtube: 'mdi:youtube', tiktok: 'ic:baseline-tiktok', linkedin: 'mdi:linkedin', website: 'mdi:web',
	};

	onMount(async () => {
		if (!slug) { notFound = true; loading = false; return; }
		try {
			const data = await getPublicCollectionBySlug(slug);
			collection = data.collection;
			events = data.events;
			themeColor = resolveCollectionThemeColor(collection.themeColor);
		} catch { notFound = true; }
		finally { loading = false; }
	});

	$: filteredEvents = events.filter((e: any) => {
		const now = new Date();
		const end = new Date(e.endDateTime);
		if (dateFilter === 'upcoming' && end < now) return false;
		if (dateFilter === 'past' && end >= now) return false;
		if (typeFilter && e.eventType !== typeFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			const title = (e.title ?? '').toLowerCase();
			const org = (e.eventOrganizerName ?? '').toLowerCase();
			const venue = (e.locationDetails?.physical?.venueName ?? '').toLowerCase();
			const addr = (e.locationDetails?.physical?.resolvedAddress?.formatted_address ?? '').toLowerCase();
			if (!title.includes(q) && !org.includes(q) && !venue.includes(q) && !addr.includes(q)) return false;
		}
		return true;
	});

	function formatEventDate(dateStr: string) {
		const d = new Date(dateStr);
		return {
			month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
			day: d.getDate(),
			full: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
			time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
		};
	}

	function stripHtml(html: string): string {
		return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
	}
</script>

<svelte:head>
	{#if collection}
		<title>{collection.name} | Rondwell</title>
		<meta name="description" content={collection.description ? stripHtml(collection.description).slice(0, 160) : `${collection.name} on Rondwell`} />
		<meta property="og:title" content={`${collection.name} | Rondwell`} />
		<meta property="og:description" content={collection.description ? stripHtml(collection.description).slice(0, 160) : ''} />
		{#if collection.coverBannerUrl}<meta property="og:image" content={collection.coverBannerUrl} />{/if}
	{/if}
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center" style="background-color: {themeColor.bg}">
		<div class="flex flex-col items-center gap-3">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200" style="border-top-color: {themeColor.button}"></div>
			<p class="text-sm" style="color: {themeColor.lightText}">Loading collection...</p>
		</div>
	</div>
{:else if notFound}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
		<p class="text-5xl">📂</p>
		<h1 class="text-2xl font-semibold text-gray-900">Collection Not Found</h1>
		<p class="text-sm text-gray-500">The collection you're looking for doesn't exist or has been removed.</p>
		<a href="/discover" class="mt-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">Discover Events</a>
	</div>
{:else}
	<div class="min-h-screen" style="background-color: {themeColor.bg}">
		<!-- COVER BANNER with rounded corners -->
		<div class="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
			<div class="relative">
				<!-- Cover image container -->
				<div class="overflow-hidden rounded-2xl" style="background-color: {themeColor.cover}">
					<div class="h-48 w-full sm:h-56 md:h-64">
						{#if collection.coverBannerUrl}
							<img src={collection.coverBannerUrl} alt="Cover" class="h-full w-full object-cover" />
						{/if}
					</div>
				</div>
				<!-- Profile Picture — sits on top of cover bottom-left, fully visible -->
				<div class="absolute bottom-0 left-6 translate-y-1/2 sm:left-8">
					<div class="h-20 w-20 overflow-hidden rounded-2xl border-4 shadow-lg sm:h-24 sm:w-24"
						style="border-color: {themeColor.bg}; background-color: {themeColor.smallCover}">
						{#if collection.profilePictureUrl}
							<img src={collection.profilePictureUrl} alt={collection.name} class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center">
								<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/><path d="M8 10h8M8 14h5" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/></svg>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- HEADER -->
		<div class="mx-auto max-w-5xl px-4 sm:px-6">
			<div class="mt-14 flex flex-col gap-4 sm:mt-16 sm:flex-row sm:items-start sm:justify-between">
				<div class="flex-1">
					<h1 class="text-2xl font-bold sm:text-3xl" style="color: {themeColor.text}">{collection.name}</h1>
					<p class="mt-1 text-sm" style="color: {themeColor.lightText}">
						{collection?.subscriberCount ?? 0} subscriber{(collection?.subscriberCount ?? 0) !== 1 ? 's' : ''}
					</p>
					{#if collection.socialLinks}
						{@const links = Object.entries(collection.socialLinks).filter(([, v]) => v)}
						{#if links.length > 0}
							<div class="mt-3 flex flex-wrap items-center gap-2">
								{#each links as [key, value]}
									<a href={key === 'website' ? String(value) : `https://${key === 'twitter' || key === 'x' ? 'x.com' : key + '.com'}/${value}`}
										target="_blank" rel="noopener noreferrer"
										class="flex h-8 w-8 items-center justify-center rounded-full transition hover:opacity-80"
										style="background-color: {themeColor.smallCover}">
										<Icon icon={socialIconMap[key] ?? 'mdi:link'} class="h-4 w-4" style="color: {themeColor.text}" />
									</a>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
				<button class="w-fit rounded-lg px-6 py-2.5 text-sm font-medium transition hover:opacity-90"
					style="background-color: {themeColor.button}; color: {themeColor.buttonText}">Subscribe</button>
			</div>

			<!-- ABOUT section — right below header, before tabs -->
			{#if collection.description}
				<div class="mt-5 rounded-2xl p-5" style="background-color: {themeColor.cover}">
					<div class="mb-3 flex items-center gap-2 border-b pb-2" style="border-color: {themeColor.toggle}">
						<svg width="18" height="18" viewBox="0 0 20 20" fill="none">
							<path d="M10.8 19H6.1C1.8 19 0 17 0 12.2V6.8C0 2 1.8 0 6.1 0h4c.3 0 .6.3.6.7 0 .3-.3.6-.6.6H6.1C2.5 1.3 1.2 2.8 1.2 6.8v5.3c0 4.1 1.3 5.5 4.9 5.5h4.7c3.6 0 4.9-1.4 4.9-5.5V7.7c0-.3.3-.6.6-.6.3 0 .6.3.6.7v4.4C17 17 15.1 19 10.8 19z" fill="{themeColor.lightText}"/>
							<path d="M16.4 8.4h-3.2c-2.7 0-3.7-1.2-3.7-4.2V.7c0-.3.1-.5.4-.6.2-.1.5 0 .6.2l6.3 7.1c.2.2.2.5.1.7-.1.2-.3.3-.5.3zM10.6 2.3v1.9c0 2.3.5 2.9 2.6 2.9h1.7l-4.3-4.8z" fill="{themeColor.lightText}"/>
						</svg>
						<h2 class="text-base font-medium" style="color: {themeColor.text}">About</h2>
					</div>
					<div class="relative">
						<div class="prose prose-sm max-w-none text-sm leading-relaxed {showFullDescription ? '' : 'line-clamp-2'}" style="color: {themeColor.lightText}">
							{@html collection.description}
						</div>
						{#if stripHtml(collection.description).length > 120}
							<button
								on:click={() => (showFullDescription = !showFullDescription)}
								class="mt-2 text-xs font-medium transition hover:opacity-80"
								style="color: {themeColor.button}">
								{showFullDescription ? 'View less' : 'View more'}
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- TABS -->
			<div class="mt-6 flex gap-1 border-b" style="border-color: {themeColor.toggle}">
				<button on:click={() => (activeTab = 'overview')}
					class="relative px-5 py-3 text-sm font-medium transition"
					style="color: {activeTab === 'overview' ? themeColor.text : themeColor.lightText}">
					Overview
					{#if activeTab === 'overview'}<div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style="background-color: {themeColor.button}"></div>{/if}
				</button>
				<button on:click={() => (activeTab = 'community')}
					class="relative px-5 py-3 text-sm font-medium transition"
					style="color: {activeTab === 'community' ? themeColor.text : themeColor.lightText}">
					Community
					{#if activeTab === 'community'}<div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style="background-color: {themeColor.button}"></div>{/if}
				</button>
			</div>

			{#if activeTab === 'overview'}
			<div class="mt-6">
				<!-- Filters row -->
				<div class="flex flex-wrap items-center gap-3">
					<div class="flex rounded-xl p-1" style="background-color: {themeColor.toggle}">
						{#each ([['all', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past']] as const) as [val, label]}
							<button on:click={() => (dateFilter = val)}
								class="rounded-lg px-4 py-2 text-sm font-medium transition"
								style="{dateFilter === val
									? `background-color: ${themeColor.bg}; color: ${themeColor.text}; box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
									: `color: ${themeColor.lightText}`}">
								{label}
							</button>
						{/each}
					</div>

					<!-- Type dropdown -->
					<div class="relative" data-type-dropdown>
						<button on:click={() => (showTypeDropdown = !showTypeDropdown)}
							class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-90"
							style="background-color: {themeColor.cover}; color: {themeColor.text}; border: 1px solid {themeColor.toggle}">
							{eventTypes.find(t => t.value === typeFilter)?.label ?? 'All Types'}
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="transition-transform {showTypeDropdown ? 'rotate-180' : ''}">
								<path d="M3 4.5l3 3 3-3" stroke="{themeColor.text}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
						{#if showTypeDropdown}
							<div class="absolute left-0 z-50 mt-1 w-44 overflow-hidden rounded-xl shadow-lg"
								style="background-color: {themeColor.bg}; border: 1px solid {themeColor.toggle}">
								{#each eventTypes as type}
									<button on:click={() => { typeFilter = type.value; showTypeDropdown = false; }}
										class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition"
										style="color: {themeColor.text}; {typeFilter === type.value ? `background-color: ${themeColor.cover}` : ''}">
										{#if typeFilter === type.value}
											<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="{themeColor.button}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
										{:else}<span class="w-[14px]"></span>{/if}
										{type.label}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Search by name and location (themed) -->
					<div class="relative w-full max-w-xs">
						<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" viewBox="0 0 24 24" fill="none">
							<circle cx="11" cy="11" r="7" stroke="{themeColor.lightText}" stroke-width="1.5"/>
							<path d="M20 20l-3-3" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/>
						</svg>
						<input type="text" bind:value={searchQuery}
							placeholder="Search by name or location"
							class="w-full rounded-xl border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-0"
							style="background-color: {themeColor.cover}; color: {themeColor.text}; border-color: {themeColor.toggle}; --tw-placeholder-opacity: 1;"
						/>
					</div>
				</div>

				<!-- Events list -->
				<div class="mt-6 pb-16">
					{#if filteredEvents.length === 0}
						<div class="flex flex-col items-center justify-center gap-3 rounded-2xl py-20" style="background-color: {themeColor.cover}">
							<svg width="64" height="64" viewBox="0 0 24 24" fill="none">
								<rect x="3" y="4" width="18" height="18" rx="2" stroke="{themeColor.lightText}" stroke-width="1.5"/>
								<path d="M3 10h18M8 2v4M16 2v4" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/>
							</svg>
							<p class="text-lg font-medium" style="color: {themeColor.text}">No events found</p>
							<p class="text-sm" style="color: {themeColor.lightText}">
								{dateFilter === 'upcoming' ? 'No upcoming events in this collection.' : dateFilter === 'past' ? 'No past events yet.' : 'This collection has no events yet.'}
							</p>
						</div>
					{:else}
						<div class="grid gap-4 sm:grid-cols-2">
							{#each filteredEvents as event (event._id)}
								{@const dt = formatEventDate(event.startDateTime)}
								{@const loc = event.locationDetails?.physical?.venueName ?? (event.eventType === 'VIRTUAL' ? (event.locationDetails?.virtual?.platform ?? 'Online') : event.eventType === 'HYBRID' ? 'Hybrid' : 'TBD')}

								<a href={event.customLinkSlug ? `/e/${event.customLinkSlug}` : `/event-page/${event._id}`}
									target="_blank" rel="noopener noreferrer"
									class="group flex flex-col gap-4 overflow-hidden rounded-2xl p-4 no-underline transition-shadow hover:shadow-md md:flex-row md:p-5"
									style="background-color: {themeColor.cover}">
									<!-- Event Image -->
									<div class="relative h-44 w-full flex-shrink-0 overflow-hidden rounded-xl md:h-32 md:w-32">
										{#if event.displayPictureUrl || event.coverPictureUrl}
											<img src={event.displayPictureUrl || event.coverPictureUrl} alt={event.title}
												class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
										{:else}
											<div class="flex h-full w-full items-center justify-center" style="background-color: {themeColor.smallCover}">
												<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
													<rect x="3" y="4" width="18" height="18" rx="2" stroke="{themeColor.lightText}" stroke-width="1.5"/>
													<path d="M3 10h18M8 2v4M16 2v4" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/>
													<circle cx="12" cy="16" r="2" stroke="{themeColor.lightText}" stroke-width="1.5"/>
												</svg>
											</div>
										{/if}
										<!-- Date badge -->
										<div class="absolute top-2 left-2 flex flex-col items-center rounded-lg px-2 py-1 text-center shadow-sm"
											style="background-color: {themeColor.bg}">
											<span class="text-[9px] font-bold" style="color: {themeColor.button}">{dt.month}</span>
											<span class="text-base font-bold leading-tight" style="color: {themeColor.text}">{dt.day}</span>
										</div>
										<!-- Type badge -->
										<div class="absolute top-2 right-2 rounded-md px-2 py-0.5 text-[10px] font-medium"
											style="background-color: {themeColor.bg}; color: {themeColor.text}">
											{event.eventType}
										</div>
									</div>

									<!-- Event Info -->
									<div class="flex flex-1 flex-col justify-between">
										<div>
											<p class="text-xs font-medium" style="color: {themeColor.button}">{dt.full}, {dt.time}</p>
											<h3 class="mt-1 text-base font-semibold leading-snug" style="color: {themeColor.text}">{event.title}</h3>
											{#if event.eventOrganizerName}
												<div class="mt-1.5 flex items-center gap-1.5">
													{#if event.organizerAvatarUrl}
														<img src={event.organizerAvatarUrl} alt="" class="h-4 w-4 rounded-full object-cover" />
													{/if}
													<span class="text-xs" style="color: {themeColor.lightText}">By {event.eventOrganizerName}</span>
												</div>
											{/if}
											<div class="mt-2 flex items-center gap-1.5">
												<!-- Location icon (inline SVG for theme compatibility) -->
												{#if event.eventType === 'VIRTUAL'}
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
														<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
													</svg>
												{:else}
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
														<path d="M12 21C12 21 20 15 20 9.5C20 5.36 16.42 2 12 2C7.58 2 4 5.36 4 9.5C4 15 12 21 12 21Z" stroke="{themeColor.lightText}" stroke-width="1.5"/>
														<circle cx="12" cy="9.5" r="2.5" stroke="{themeColor.lightText}" stroke-width="1.5"/>
													</svg>
												{/if}
												<span class="text-xs" style="color: {themeColor.lightText}">{loc}</span>
											</div>
										</div>
										<div class="mt-3 flex items-center justify-between">
											<div class="flex items-center gap-1.5">
												<!-- People icon -->
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
													<path d="M17 20c0-1.657-2.239-3-5-3s-5 1.343-5 3" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/>
													<circle cx="12" cy="10" r="3" stroke="{themeColor.lightText}" stroke-width="1.5"/>
													<path d="M20 18c0-1.105-1.343-2-3-2-.552 0-1.072.1-1.533.28" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/>
													<circle cx="17" cy="10" r="2" stroke="{themeColor.lightText}" stroke-width="1.5"/>
												</svg>
												<span class="text-xs font-medium" style="color: {themeColor.lightText}">
													{event.attendeeCount ?? 0} attending
												</span>
											</div>
											<span class="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
												style="background-color: {themeColor.smallCover}; color: {themeColor.text}">
												{event.registrationType === 'FREE' ? 'Free' : 'Paid'}
											</span>
										</div>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			{:else}
			<!-- COMMUNITY TAB -->
			<div class="mt-6 pb-16">
				<div class="rounded-2xl p-6" style="background-color: {themeColor.cover}">
					<div class="flex flex-col items-center justify-center gap-4 py-12">
						<div class="flex h-20 w-20 items-center justify-center rounded-full" style="background-color: {themeColor.smallCover}">
							<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
								<path d="M17 20c0-1.657-2.239-3-5-3s-5 1.343-5 3" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/>
								<circle cx="12" cy="10" r="3" stroke="{themeColor.lightText}" stroke-width="1.5"/>
								<path d="M20 18c0-1.105-1.343-2-3-2-.552 0-1.072.1-1.533.28" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/>
								<circle cx="17" cy="10" r="2" stroke="{themeColor.lightText}" stroke-width="1.5"/>
								<path d="M4 18c0-1.105 1.343-2 3-2 .552 0 1.072.1 1.533.28" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/>
								<circle cx="7" cy="10" r="2" stroke="{themeColor.lightText}" stroke-width="1.5"/>
							</svg>
						</div>
						<div class="text-center">
							<h3 class="text-lg font-semibold" style="color: {themeColor.text}">Community</h3>
							<p class="mt-2 max-w-sm text-sm leading-relaxed" style="color: {themeColor.lightText}">
								Connect with other subscribers and attendees. Community features are coming soon.
							</p>
						</div>
						<button class="mt-2 rounded-lg px-6 py-2.5 text-sm font-medium transition hover:opacity-90"
							style="background-color: {themeColor.button}; color: {themeColor.buttonText}">
							Subscribe to Get Notified
						</button>
					</div>
				</div>
			</div>
			{/if}
		</div>
	</div>
{/if}

<svelte:window on:click={(e) => {
	if (showTypeDropdown) {
		const target = e.target;
		if (target instanceof HTMLElement && !target.closest('[data-type-dropdown]')) {
			showTypeDropdown = false;
		}
	}
}} />

<style>
	input::placeholder { opacity: 0.5; }
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	:global(.prose h1) { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; }
	:global(.prose h2) { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.4rem; }
	:global(.prose ul) { list-style: disc; padding-left: 1.5rem; }
	:global(.prose ol) { list-style: decimal; padding-left: 1.5rem; }
	:global(.prose p) { margin-bottom: 0.5rem; }
	:global(.prose strong) { font-weight: 700; }
	:global(.prose em) { font-style: italic; }
	:global(.prose a) { text-decoration: underline; }
</style>
