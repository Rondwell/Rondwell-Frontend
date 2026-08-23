<!--
	GAP 3 — the public Gifts tab on an event page.

	Deliberately reachable WITHOUT signing in (see the sub-page exemption in
	`+layout.svelte`): the whole point of a registry is that someone opens the
	link their friend sent and buys something. A sign-in wall here would kill
	the feature.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import { colors, type Color } from '$lib/utils/colors';
	import GiftRegistryView from '$lib/components/GiftRegistryView.svelte';
	import {
		getPublicWishlistForEvent,
		type PublicWishlistView
	} from '$lib/services/wishlist.services';
	import { getPublicEventPage } from '$lib/services/event.services';

	$: eventId = $page.params.id ?? '';
	let themeColor: Color = colors[0];
	$: if (eventId) themeColor = getEventTheme(eventId);

	let view: PublicWishlistView | null = null;
	let eventTitle = '';
	let loading = true;

	async function load() {
		loading = true;
		const [registry, ev] = await Promise.all([
			getPublicWishlistForEvent(eventId),
			// Only for the host's name in the surprise-preservation line. A
			// failure here must not stop the registry rendering.
			getPublicEventPage(eventId).catch(() => null)
		]);
		view = registry;
		eventTitle = ev?.event?.eventOrganizerName || ev?.event?.title || '';
		loading = false;
	}

	onMount(load);
</script>

<svelte:head>
	<title>{view?.registry?.title ?? 'Gift registry'} · Rondwell</title>
</svelte:head>

{#if loading}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each [1, 2, 3] as _}
			<div class="h-64 animate-pulse rounded-2xl" style="background-color: {themeColor.cover};"></div>
		{/each}
	</div>
{:else}
	<!-- `funded` / `claimed` re-read the authoritative totals from the server
	     rather than letting the child guess at them. -->
	<GiftRegistryView {view} {themeColor} {eventTitle} on:funded={load} on:claimed={load} />
{/if}
