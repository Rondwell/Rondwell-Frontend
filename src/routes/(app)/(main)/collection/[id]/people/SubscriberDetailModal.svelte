<script lang="ts">
	import {
		addSubscriberTag,
		getSubscriberDetail,
		removeSubscriberTag,
		resendSubscriptionConfirmation
	} from '$lib/services/collection.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import CreateSubscriberTagModal from './components/CreateSubscriberTagModal.svelte';
	import SubscriberModal from './components/SubscriberModal.svelte';

	export let subscriber: any;
	export let collectionId = '';
	const dispatch = createEventDispatcher();
	let openSubscriberModal = false;
	let showCreateTagModal = false;
	let resending = false;
	let resendSuccess = '';

	let detailLoading = true;
	let detailEvents: any[] = [];
	let stats = { eventsCount: 0, checkInsCount: 0, revenue: 0 };

	onMount(() => {
		document.body.style.overflow = 'hidden';
		const subId = subscriber?.id ?? subscriber?._id;
		const colId = collectionId || subscriber?.collectionId;
		if (colId && subId) {
			getSubscriberDetail(colId, subId)
				.then((result) => {
					if (result?.events) detailEvents = result.events;
					if (result?.stats) stats = result.stats;
					if (result?.subscriber) {
						subscriber = {
							...subscriber,
							tags: result.subscriber.tags ?? subscriber.tags ?? [],
							verificationStatus: result.subscriber.verificationStatus ?? subscriber.verificationStatus ?? 'ACTIVE',
							events: detailEvents,
							eventsCount: stats.eventsCount,
							checkIns: stats.checkInsCount,
							revenue: stats.revenue
						};
					}
				})
				.catch(() => {})
				.finally(() => { detailLoading = false; });
		} else {
			detailLoading = false;
		}
		return () => { document.body.style.overflow = ''; };
	});

	async function handleTagAssigned(e: CustomEvent<{ tagName: string }>) {
		const subId = subscriber?.id ?? subscriber?._id;
		if (!subId || !collectionId) return;
		try {
			await addSubscriberTag(collectionId, subId, e.detail.tagName);
			if (!subscriber.tags?.includes(e.detail.tagName)) {
				subscriber.tags = [...(subscriber.tags || []), e.detail.tagName];
			}
			subscriber = subscriber;
		} catch (err) { console.error(err); }
	}

	async function handleRemoveTag(tagName: string) {
		const subId = subscriber?.id ?? subscriber?._id;
		if (!subId || !collectionId) return;
		try {
			await removeSubscriberTag(collectionId, subId, tagName);
			subscriber.tags = (subscriber.tags || []).filter((t: string) => t !== tagName);
			subscriber = subscriber;
		} catch (e) { console.error(e); }
	}

	function handleSubscriberAction() {
		dispatch('close');
		dispatch('refresh');
	}

	async function handleResendConfirmation() {
		const subId = subscriber?.id ?? subscriber?._id;
		if (!subId || !collectionId || resending) return;
		resending = true;
		resendSuccess = '';
		try {
			await resendSubscriptionConfirmation(collectionId, subId);
			resendSuccess = 'Confirmation email sent';
			subscriber.verificationStatus = 'PENDING_VERIFICATION';
			subscriber = subscriber;
			setTimeout(() => { resendSuccess = ''; }, 3000);
		} catch (e: any) {
			console.error(e);
		} finally {
			resending = false;
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm lg:inset-y-0 lg:justify-end lg:pr-10"
	on:click={() => dispatch('close')}
>
	<div
		class="flex max-h-[70vh] w-full max-w-lg flex-col rounded-md bg-[#F8F9F9] shadow-lg lg:w-lg lg:max-w-none lg:shadow-none"
		on:click|stopPropagation
	>
		<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
			<button aria-label="Close" on:click={() => dispatch('close')}>
				<svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect y="12.8203" width="9.9258" height="1.96151" rx="0.980754" transform="rotate(-45 0 12.8203)" fill="#68696B" />
					<rect x="1.38867" width="10.0318" height="1.96151" rx="0.980754" transform="rotate(45 1.38867 0)" fill="#68696B" />
					<rect x="7.10547" y="12.8203" width="9.9258" height="1.96151" rx="0.980754" transform="rotate(-45 7.10547 12.8203)" fill="#68696B" />
					<rect x="8.49414" width="10.0318" height="1.96151" rx="0.980754" transform="rotate(45 8.49414 0)" fill="#68696B" />
				</svg>
			</button>
			<div class="flex gap-2">
				<button aria-label="revert" class="bg-[#F5F5F5] p-1 text-[#68696B]">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</button>
				<button aria-label="forward" class="bg-[#F5F5F5] p-1 text-[#68696B]">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>
		</div>

		<div class="custom-scrollbar flex-1 overflow-y-auto px-5">
			<header class="flex w-full justify-between py-4">
				<div class="flex w-full items-center justify-between">
					<div class="flex items-center gap-2">
						<img src="/rondwell-attendee.png" alt="profile icon" class="h-10 w-10 rounded-full" />
						<div>
							<p class="font-semibold text-gray-900">{subscriber.name || 'Anonymous'}</p>
							<p class="text-xs text-[#828486]">{subscriber.email}</p>
						</div>
					</div>
					<div>
						<div class="relative w-full md:w-fit" use:clickOutside={() => { openSubscriberModal = false; }}>
							<button class="text-gray-500 hover:text-gray-700" on:click={() => { openSubscriberModal = !openSubscriberModal; }}>...</button>
							<SubscriberModal bind:open={openSubscriberModal} {subscriber} {collectionId} on:removed={handleSubscriberAction} on:blocked={handleSubscriberAction} />
						</div>
					</div>
				</div>
			</header>

			{#if detailLoading}
				<section class="flex flex-col gap-4 border-b pb-4">
					<div class="flex gap-4">
						{#each [1, 2, 3, 4] as _}
							<div class="h-10 w-20 animate-pulse rounded bg-gray-200"></div>
						{/each}
					</div>
					<div class="flex gap-2">
						<div class="h-7 w-20 animate-pulse rounded-full bg-gray-200"></div>
						<div class="h-7 w-16 animate-pulse rounded-full bg-gray-200"></div>
					</div>
				</section>
			{:else}
				<section class="flex flex-col gap-4 border-b pb-4">
					<div class="flex gap-4 text-sm text-[#131517]">
						<div class="border-r pr-2">
							<p class="text-xs">Joined On</p>
							<p class="font-medium text-[#000]">{subscriber.joinedAt}</p>
						</div>
						<div class="border-r pr-2">
							<p class="text-xs"># Events</p>
							<p class="font-medium text-[#000]">{stats.eventsCount}</p>
						</div>
						<div class="border-r pr-2">
							<p class="text-xs"># Check Ins</p>
							<p class="font-medium text-[#000]">{stats.checkInsCount}</p>
						</div>
						<div class="pr-2">
							<p class="text-xs">Revenue</p>
							<p class="font-medium text-[#000]">₦{stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<button
							class="flex items-center rounded-2xl bg-[#EFEFEF] px-2 py-0.5 text-xs text-[#A0A1A3] transition hover:bg-gray-200"
							on:click={() => (showCreateTagModal = true)}
						>
							<Icon icon="mdi:plus" class="text-lg" /> Add Tag
						</button>
						{#if subscriber.verificationStatus === 'PENDING_VERIFICATION'}
							<span class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">Pending Verification</span>
							<button
								on:click={handleResendConfirmation}
								disabled={resending}
								class="flex items-center gap-1 rounded-full bg-[#EFEFEF] px-2.5 py-1 text-xs text-[#616265] transition hover:bg-gray-200 disabled:opacity-50"
							>
								<Icon icon="mdi:email-send-outline" class="text-sm" />
								{resending ? 'Sending...' : 'Resend Email'}
							</button>
						{:else if subscriber.verificationStatus === 'EXPIRED'}
							<span class="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">Expired</span>
							<button
								on:click={handleResendConfirmation}
								disabled={resending}
								class="flex items-center gap-1 rounded-full bg-[#EFEFEF] px-2.5 py-1 text-xs text-[#616265] transition hover:bg-gray-200 disabled:opacity-50"
							>
								<Icon icon="mdi:email-send-outline" class="text-sm" />
								{resending ? 'Sending...' : 'Resend Email'}
							</button>
						{:else}
							<span class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Active</span>
						{/if}
						{#if resendSuccess}
							<span class="text-xs text-green-600">{resendSuccess}</span>
						{/if}
						{#each subscriber.tags ?? [] as tag}
							<button class="rounded-[22px] bg-[#F4ECDA] px-2.5 py-1 text-xs font-medium text-[#D79B1B]">
								{tag} <span class="ml-1 cursor-pointer font-semibold" on:click|stopPropagation={() => handleRemoveTag(tag)}>×</span>
							</button>
						{/each}
					</div>
				</section>
			{/if}

			<div class="border-b py-6">
				<h2 class="mb-2 text-sm font-semibold">Events</h2>
				{#if detailLoading}
					<div class="h-16 w-full animate-pulse rounded bg-gray-200"></div>
				{:else if detailEvents.length > 0}
					<div class="space-y-3">
						{#each detailEvents as event}
							{@const isGoing = event.status === 'ATTENDING' || event.status === 'CHECKED_IN'}
							<div class="flex items-center justify-between rounded-lg border bg-white p-3">
								<div>
									<p class="text-sm font-medium">{event.title}</p>
									<p class="text-xs text-gray-400">
										{event.startDateTime ? new Date(event.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
										{event.startDateTime ? ', ' + new Date(event.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
									</p>
								</div>
								<span class="rounded-full px-2 py-1 text-xs font-medium {isGoing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
									{isGoing ? 'Going' : event.status === 'PENDING' ? 'Pending' : 'Not Going'}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-400">No events attended.</p>
				{/if}
			</div>

			<section class="py-6">
				<h2 class="mb-2 text-sm font-semibold">Payments</h2>
				{#if stats.revenue > 0}
					<p class="text-sm font-medium text-gray-900">Total Paid: ₦{stats.revenue.toLocaleString()}</p>
				{:else}
					<p class="text-sm text-gray-400">This member hasn't paid you, yet.</p>
				{/if}
			</section>
		</div>
	</div>
</div>

<CreateSubscriberTagModal bind:open={showCreateTagModal} {collectionId} on:tagAssigned={handleTagAssigned} />
