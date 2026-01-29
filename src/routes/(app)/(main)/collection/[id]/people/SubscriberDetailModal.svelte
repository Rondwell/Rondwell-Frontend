<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import SubscriberModal from './components/SubscriberModal.svelte';
	export let subscriber;
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	const dispatch = createEventDispatcher();
	let openSubscriberModal = false;

	onMount(() => {
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = '';
		};
	});
	//  Reactive Event
	$: attendingEvent = subscriber?.events?.length
		? {
				title: subscriber.events[0].title,
				date: 'Sep 25, 2024',
				time: '11:30 PM',
				status: subscriber.events[0].status === 'Attending' ? 'Going' : 'Not Going',
				ticketCount: 1,
				ticketType: 'Standard'
			}
		: null;
</script>

<!-- Overlay -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm lg:inset-y-0 lg:justify-end lg:pr-10"
	on:click={() => dispatch('close')}
>
	<!-- Modal -->
	<div
		class="flex max-h-[70vh] w-full max-w-lg flex-col rounded-md bg-[#F8F9F9] shadow-lg lg:w-lg lg:max-w-none lg:shadow-none"
		on:click|stopPropagation
	>
		<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
			<button aria-label="Close" on:click={() => dispatch('close')}>
				<svg
					width="16"
					height="15"
					viewBox="0 0 16 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect
						y="12.8203"
						width="9.9258"
						height="1.96151"
						rx="0.980754"
						transform="rotate(-45 0 12.8203)"
						fill="#68696B"
					/>
					<rect
						x="1.38867"
						width="10.0318"
						height="1.96151"
						rx="0.980754"
						transform="rotate(45 1.38867 0)"
						fill="#68696B"
					/>
					<rect
						x="7.10547"
						y="12.8203"
						width="9.9258"
						height="1.96151"
						rx="0.980754"
						transform="rotate(-45 7.10547 12.8203)"
						fill="#68696B"
					/>
					<rect
						x="8.49414"
						width="10.0318"
						height="1.96151"
						rx="0.980754"
						transform="rotate(45 8.49414 0)"
						fill="#68696B"
					/>
				</svg>
			</button>
			<!-- will it sc -->
			<div class="flex gap-2">
				<button
					aria-label="revert"
					class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 rotate-90"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</button>
				<button
					aria-label="forward"
					class="bg-[#F5F5F5] p-1 text-[#68696B] transition-transform duration-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 -rotate-90"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>
		</div>

		<div class="custom-scrollbar flex-1 overflow-y-auto px-5">
			<!-- HEADER -->

			<header class=" flex w-full justify-between py-4">
				<div class="flex w-full items-center justify-between">
					<!-- Avatar -->
					<div class="flex items-center gap-2">
						<img src="/face-1.svg" alt="profile icon" class="h-10 w-10" />
						<div>
							<p class="font-semibold text-gray-900">{subscriber.name || 'Anonymous'}</p>
							<p class="text-xs text-[#828486]">{subscriber.email}</p>
						</div>
					</div>

					<!-- Close -->
					<div>
						<div
							class="relative w-full md:w-fit"
							use:clickOutside={() => {
								openSubscriberModal = false;
							}}
						>
							<button
								class="text-gray-500 hover:text-gray-700"
								on:click={() => {
									openSubscriberModal = !openSubscriberModal;
								}}
							>
								...
							</button>
							<SubscriberModal bind:open={openSubscriberModal} {subscriber} />
						</div>
					</div>
				</div>
			</header>

			<!-- BODY -->
			<section class="flex flex-col gap-4 border-b pb-4">
				<div class="flex gap-4 text-sm text-[#131517]">
					<div class="border-r pr-2">
						<p class="text-xs">Joined On</p>
						<p class="font-medium text-[#000]">{subscriber.joinedAt}</p>
					</div>

					<div class="border-r pr-2">
						<p class="text-xs"># Events</p>
						<p class="font-medium text-[#000]">{subscriber.events.length}</p>
					</div>

					<div class="border-r pr-2">
						<p class="text-xs"># Check Ins</p>
						<p class="font-medium text-[#000]">{subscriber.checkIns}</p>
					</div>

					<div class="pr-2">
						<p class="text-xs">Revenue</p>
						<p class="font-medium text-[#000]">
							${subscriber.revenue.toFixed(2)}
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<div
						class="flex w-[85px] cursor-pointer justify-start rounded-2xl bg-[#EBECEC] px-1 py-0.5 text-sm text-[#939597]"
					>
						<Icon icon="mdi:plus" class="mt-0.5 text-sm" />
						<span>Add Tag</span>
					</div>

					<button
						class="flex items-center justify-center gap-1 rounded-full bg-[#F4ECDA] px-3 py-1 text-xs text-[#D79B1B]"
					>
						Main <img src="/cancel-cion.svg" alt="block" class="h-2 w-2" />
					</button>
				</div>
			</section>

			<!-- EVENTS -->
			<div class="border-b py-6">
				<h2 class="mb-2 text-sm font-semibold">Events</h2>
				{#if attendingEvent}
					<EventCard event={attendingEvent} variant="subscriber" />
				{:else}
					<p class="text-sm text-gray-400">No events attended.</p>
				{/if}
			</div>

			<!-- PAYMENTS -->
			<section class="py-6">
				<h2 class="mb-2 text-sm font-semibold">Payments</h2>
				{#if subscriber.payment}
					<p class="text-sm font-medium text-gray-900">
						Amount Paid: {subscriber.payment}
					</p>
				{:else}
					<p class="text-sm text-gray-400">This member hasn’t paid you, yet.</p>
				{/if}
			</section>
		</div>
	</div>
</div>
