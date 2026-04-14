<!-- src/routes/(app)/(main)/collection/+page.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	import { getMyCollections, getMySubscribedCollections } from '$lib/services/event.services';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { onMount } from 'svelte';

	let myCollections: any[] = [];
	let subscribedCollections: any[] = [];
	let loading = true;

	$: if (browser && !$isAuthenticated) goto('/discover?show=true');

	onMount(async () => {
		if (!$isAuthenticated) return;
		try {
			const [all, subs] = await Promise.all([
				getMyCollections(),
				getMySubscribedCollections(),
			]);
			myCollections = all;
			subscribedCollections = subs;
		} catch (e) {
			myCollections = [];
			subscribedCollections = [];
		} finally {
			loading = false;
		}
	});

	function normalizeCollection(c: any) {
		return {
			_id: c._id ?? c.id,
			name: c.name ?? 'Unnamed Collection',
			image: c.profilePictureUrl ?? c.coverBannerUrl ?? '/events.png',
			subscriberCount: c.subscriberCount ?? c.subscribers?.length ?? 0,
			subscribers: c.subscribers ?? [],
			admins: c.admins ?? [],
			eventCount: c.eventCount ?? 0,
			events: (c.upcomingEvents ?? c.events ?? []).map((e: any) => ({
				title: e.title ?? e.name ?? '',
				date: e.startDateTime
					? new Date(e.startDateTime).toLocaleString('en-US', {
							weekday: 'short',
							month: 'short',
							day: 'numeric',
							hour: 'numeric',
							minute: '2-digit'
						})
					: e.date ?? ''
			}))
		};
	}

	function normalizeSubscribedCollection(c: any) {
		return {
			_id: c._id ?? c.id,
			name: c.name ?? 'Unnamed Collection',
			description: c.description ?? '',
			image: c.profilePictureUrl ?? c.coverBannerUrl ?? '/events.png',
			profilePictureUrl: c.profilePictureUrl,
			slug: c.slug,
			subscriberCount: c.subscriberCount ?? 0,
			eventCount: c.eventCount ?? 0,
			upcomingEvents: (c.upcomingEvents ?? []).map((e: any) => ({
				title: e.title ?? '',
				date: e.startDateTime
					? new Date(e.startDateTime).toLocaleDateString('en-US', {
							weekday: 'short',
							month: 'short',
							day: 'numeric',
							hour: 'numeric',
							minute: '2-digit'
						})
					: '',
			})),
		};
	}
</script>

<div class="w-full">
	<!-- Welcome Aboard Section -->
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-medium">Collection</h1>

		<div
			class="flex h-full min-h-[181.5px] flex-col items-start gap-4 rounded-lg bg-[#FDFDFD] p-3 md:flex-row md:p-6"
		>
			<div
				class="flex w-full items-center justify-center rounded bg-[#F4F5F6] p-5 md:h-[144px] md:max-w-[195.09px]"
			>
				<img src="/folder-icon.png" alt="folder icon" class="w-full" />
			</div>

			<div
				class="flex h-full min-h-[144px] flex-1 flex-col justify-between text-center md:text-left"
			>
				<span>
					<h2 class="font-mediun mb-1 text-xl">Welcome to Rondwell Collection</h2>
					<p class="mb-3 max-w-[724px] text-sm text-[#B9BABA]">
						Rondwell Collection lets you easily share and manage your events. Every event on
						Rondwell is part of a collection. Users can subscribe to your collections. 
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
		</div>
	</div>

	<!-- My Collection -->
	<div class="mb-8 w-full">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-medium">My Collection</h2>

			<button
				on:click={() => goto('/collection/create')}
				class="flex h-[35.75px] w-fit items-center gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-lg text-[#616265]"
			>
				<svg
					width="18"
					height="14"
					viewBox="0 0 18 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g opacity="0.4">
						<path
							d="M0.75 6.75H17.1978"
							stroke="#02091D"
							stroke-width="1.50004"
							stroke-linecap="round"
						/>
						<path
							d="M8.97266 12.7503V0.75"
							stroke="#02091D"
							stroke-width="1.50004"
							stroke-linecap="round"
						/>
					</g>
				</svg>
				create
			</button>
		</div>

		{#if loading}
			<div class="mb-12 grid w-full max-w-[1020px] gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each [1, 2, 3] as _}
					<div class="animate-pulse rounded-md bg-[#FDFDFD] p-6">
						<div class="mb-3 h-20 w-20 rounded-[7.5px] bg-gray-200"></div>
						<div class="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
						<div class="h-3 w-1/2 rounded bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if myCollections.length === 0}
			<div class="mb-12 flex w-full max-w-[1020px] items-center justify-center rounded-md bg-[#FDFDFD] py-12">
				<p class="text-sm text-[#B9BABA]">No collections yet. Create your first one.</p>
			</div>
		{:else}
			<div class="mb-12 grid w-full max-w-[1020px] gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each myCollections as collection (collection._id ?? collection.id)}
					{@const c = normalizeCollection(collection)}
					<a href="/collection/{c._id}/events" class="w-full">
						<CollectionCard collection={c} type="mine" />
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Subscribed Collections -->
	<div class="mb-8 w-full">
		<h2 class="mb-4 text-2xl font-medium">Subscribed Collections</h2>

		{#if loading}
			<div class="flex w-full max-w-[1020px] flex-col gap-4">
				{#each [1, 2] as _}
					<div class="animate-pulse rounded-xl bg-[#FDFDFD] p-5">
						<div class="flex gap-4">
							<div class="h-20 w-20 rounded-lg bg-gray-200"></div>
							<div class="flex-1 space-y-2">
								<div class="h-4 w-1/3 rounded bg-gray-200"></div>
								<div class="h-3 w-1/4 rounded bg-gray-200"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if subscribedCollections.length === 0}
			<div class="flex w-full max-w-[1020px] items-center justify-center rounded-xl bg-[#FDFDFD] py-12">
				<p class="text-sm text-gray-400">No subscribed collections yet.</p>
			</div>
		{:else}
			<div class="flex w-full max-w-[1020px] flex-col gap-4">
				{#each subscribedCollections as collection (collection._id ?? collection.id)}
					<CollectionCard collection={normalizeSubscribedCollection(collection)} type="subscription" />
				{/each}
			</div>
		{/if}
	</div>
</div>
