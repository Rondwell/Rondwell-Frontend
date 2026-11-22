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

	/**
	 * H-74 — tags are stripped WITHOUT parsing the HTML.
	 *
	 * This used `tmp.innerHTML = html` to extract text, which **parses the
	 * attacker's HTML into a live DOM** before reading `textContent` off it.
	 * Assigning `innerHTML` does not run `<script>`, but it does run every
	 * other execution vector the parser supports —
	 * `<img src=x onerror=...>`, `<svg onload=...>`, `<iframe srcdoc=...>` —
	 * because those fire on insertion, not on script evaluation.
	 *
	 * The field is `collection.description`, organizer-authored, and this card
	 * renders on the dashboard overview and the collection list. The irony is
	 * that the function's entire purpose is to *discard* the HTML: it never
	 * needed to parse it.
	 *
	 * `DOMParser` with `text/html` builds an **inert** document — no script
	 * execution, no resource loading, no event handlers — which is exactly the
	 * "give me the text" operation intended. The regex path is kept for SSR,
	 * where there is no `DOMParser`, and it is safe there because the result is
	 * interpolated as text rather than as markup.
	 */
	function stripHtml(html: string): string {
		if (!html) return '';

		if (typeof DOMParser !== 'undefined') {
			try {
				const doc = new DOMParser().parseFromString(html, 'text/html');
				return (doc.body?.textContent ?? '').replace(/\s+/g, ' ').trim();
			} catch {
				// fall through to the regex path
			}
		}

		return html
			.replace(/<[^>]*>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	$: plainDescription = stripHtml(collection?.description ?? '');
</script>

{#if type === 'subscription'}
	<!-- SUBSCRIBED COLLECTION CARD -->
	<div class="group w-full overflow-hidden rounded-[22px] border border-black/8 bg-white/88 shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md transition-all duration-200 hover:border-black/15 hover:shadow-[0_10px_28px_-10px_rgba(19,21,23,0.12)]">
		<div class="flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
			<!-- Image -->
			<div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/6">
				<img
					src={collection.image || collection.profilePictureUrl || '/events.png'}
					alt={collection.name}
					class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
					on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/events.png'; }}
				/>
			</div>

			<!-- Info -->
			<div class="flex min-w-0 flex-1 flex-col justify-between gap-3">
				<div>
					<h3 class="text-base font-bold tracking-tight text-[#17161E] line-clamp-1">{collection.name}</h3>
					{#if plainDescription}
						<p class="mt-0.5 text-xs text-[#6B6878] line-clamp-1">{plainDescription}</p>
					{/if}
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<span class="inline-flex items-center gap-1 text-xs font-medium text-[#5F5C6D]">
							<Icon icon="solar:users-group-rounded-bold-duotone" class="h-3.5 w-3.5 text-[#8E8B99]" />
							{subscribersCount} subscriber{subscribersCount !== 1 ? 's' : ''}
						</span>
						<span class="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#7C3AED]">
							<Icon icon="solar:calendar-bold-duotone" class="h-3 w-3" />
							{eventCount} event{eventCount !== 1 ? 's' : ''}
						</span>
					</div>
				</div>

				<!-- Upcoming events preview -->
				{#if collection?.events?.length > 0 || collection?.upcomingEvents?.length > 0}
					{@const events = collection.upcomingEvents ?? collection.events ?? []}
					<div class="space-y-1.5 rounded-xl bg-black/[0.03] px-3 py-2">
						{#each events.slice(0, 2) as event}
							<div class="flex items-center gap-2 text-xs">
								<span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7C3AED]"></span>
								<span class="truncate font-medium text-[#2A2836]">{event.title}</span>
								{#if event.date || event.startDateTime}
									<span class="flex-shrink-0 text-[#6B6878]">
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
						class="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-semibold text-[#17161E] no-underline shadow-2xs transition hover:bg-[#17161E] hover:text-white"
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
	<div class="group w-full rounded-[22px] border border-black/8 bg-white/88 p-4 shadow-[0_1px_3px_rgba(19,21,23,0.04)] backdrop-blur-md transition-all duration-200 hover:border-black/15 hover:shadow-[0_10px_28px_-10px_rgba(19,21,23,0.12)] sm:p-5">
		<div class="flex flex-col gap-3">
			<div class="flex items-start gap-3.5">
				<div class="h-16 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/6">
					<img
						src={collection.image || collection.profilePictureUrl || '/events.png'}
						alt={collection.name}
						class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
						on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/events.png'; }}
					/>
				</div>
				<div class="min-w-0 flex-1">
					<h3 class="text-sm font-bold tracking-tight text-[#17161E] line-clamp-1 sm:text-base">{collection.name}</h3>
					<div class="mt-1.5 flex flex-wrap items-center gap-2">
						<span class="text-xs font-medium text-[#5F5C6D]">
							{#if subscribersCount > 0}
								{subscribersCount} Subscriber{subscribersCount > 1 ? 's' : ''}
							{:else}
								No subscribers
							{/if}
						</span>
						<span class="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#7C3AED]">
							<Icon icon="solar:calendar-bold-duotone" class="h-3 w-3" />
							{eventCount} event{eventCount !== 1 ? 's' : ''}
						</span>
					</div>
				</div>
			</div>

			{#if adminsCount > 0}
				<div class="flex items-center gap-1.5 text-xs font-medium text-[#6B6878]">
					<Icon icon="solar:shield-user-bold-duotone" class="h-3.5 w-3.5 text-[#8E8B99]" />
					{adminsCount} Admin{adminsCount > 1 ? 's' : ''}
				</div>
			{/if}
		</div>
	</div>
{/if}
