<script lang="ts">
	import Icon from '@iconify/svelte';

	export let collection: any;
	export let type: string = 'subscription';

	$: subscribersCount = collection?.subscriberCount ?? collection?.subscribers?.length ?? 0;
	$: adminsCount = collection?.admins?.length ?? 1;
	$: eventCount = collection?.eventCount ?? collection?.events?.length ?? 0;
	$: collectionHref = collection?.slug
		? `/c/${collection.slug}`
		: collection?._id
			? `/collection/${collection._id}/events`
			: undefined;

	function stripHtml(html: string): string {
		if (!html) return '';
		// Use a temporary element to extract text content from HTML
		if (typeof document !== 'undefined') {
			const tmp = document.createElement('div');
			tmp.innerHTML = html;
			return tmp.textContent || tmp.innerText || '';
		}
		// SSR fallback: strip tags with regex
		return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
	}

	$: plainDescription = stripHtml(collection?.description ?? '');
</script>

{#if type === 'subscription'}
	<!-- SUBSCRIBED COLLECTION CARD -->
	<div class="group w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
		<div class="flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
			<!-- Image -->
			<div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
				<img
					src={collection.image || collection.profilePictureUrl || '/events.png'}
					alt={collection.name}
					class="h-full w-full object-cover"
					on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/events.png'; }}
				/>
			</div>

			<!-- Info -->
			<div class="flex min-w-0 flex-1 flex-col justify-between gap-3">
				<div>
					<h3 class="text-base font-semibold text-gray-900 line-clamp-1">{collection.name}</h3>
					{#if plainDescription}
						<p class="mt-0.5 text-xs text-gray-400 line-clamp-1">{plainDescription}</p>
					{/if}
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<span class="inline-flex items-center gap-1 text-xs text-gray-500">
							<Icon icon="mdi:account-group-outline" class="h-3.5 w-3.5" />
							{subscribersCount} subscriber{subscribersCount !== 1 ? 's' : ''}
						</span>
						<span class="inline-flex items-center gap-1 rounded-full bg-[#F0EAFF] px-2 py-0.5 text-[11px] font-medium text-[#7C3AED]">
							<Icon icon="mdi:calendar-outline" class="h-3 w-3" />
							{eventCount} event{eventCount !== 1 ? 's' : ''}
						</span>
					</div>
				</div>

				<!-- Upcoming events preview -->
				{#if collection?.events?.length > 0 || collection?.upcomingEvents?.length > 0}
					{@const events = collection.upcomingEvents ?? collection.events ?? []}
					<div class="space-y-1.5">
						{#each events.slice(0, 2) as event}
							<div class="flex items-center gap-2 text-xs">
								<span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7C3AED]"></span>
								<span class="truncate text-gray-700">{event.title}</span>
								{#if event.date || event.startDateTime}
									<span class="flex-shrink-0 text-gray-400">
										{event.date ?? new Date(event.startDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Action button -->
			{#if collectionHref}
				<div class="flex flex-shrink-0 items-center">
					<a
						href={collectionHref}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F4F4] px-3 py-2 text-xs font-medium text-[#616265] no-underline transition hover:bg-gray-200"
					>
						View
						<Icon icon="mdi:open-in-new" class="h-3.5 w-3.5" />
					</a>
				</div>
			{/if}
		</div>
	</div>

{:else}
	<!-- MINE / DEFAULT CARD -->
	<div class="w-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
		<div class="flex flex-col gap-3">
			<div class="flex items-start gap-3">
				<img
					src={collection.image || collection.profilePictureUrl || '/events.png'}
					alt={collection.name}
					class="h-16 w-20 flex-shrink-0 rounded-lg object-cover"
					on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/events.png'; }}
				/>
				<div class="min-w-0 flex-1">
					<h3 class="text-sm font-semibold text-gray-900 line-clamp-1 sm:text-base">{collection.name}</h3>
					<div class="mt-1.5 flex flex-wrap items-center gap-2">
						<span class="text-xs text-gray-500">
							{#if subscribersCount > 0}
								{subscribersCount} Subscriber{subscribersCount > 1 ? 's' : ''}
							{:else}
								No subscribers
							{/if}
						</span>
						<span class="inline-flex items-center gap-1 rounded-full bg-[#F0EAFF] px-2 py-0.5 text-[11px] font-medium text-[#7C3AED]">
							<Icon icon="mdi:calendar-outline" class="h-3 w-3" />
							{eventCount} event{eventCount !== 1 ? 's' : ''}
						</span>
					</div>
				</div>
			</div>

			{#if adminsCount > 0}
				<div class="flex items-center gap-1 text-xs text-gray-500">
					<Icon icon="mdi:shield-account-outline" class="h-3.5 w-3.5" />
					{adminsCount} Admin{adminsCount > 1 ? 's' : ''}
				</div>
			{/if}
		</div>
	</div>
{/if}
