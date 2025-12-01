<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import EditStatus from '../../../components/EditStatus.svelte';
	import AddTag from '../../../components/AddTag.svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let participant = 'Speaker';
	participant = participant.charAt(0).toUpperCase() + participant.slice(1);

	let showEditStatus = false;
	let showAddTag = false;

	let attendee = {
		name: 'Sleekwareandslides',
		email: 'johnmedoc23@gmail.com',
		registrationTime: 'Sep 23, 9:31 PM',
		amountPaid: '$0.00',
		tag: 'Main',
		status: 'Not Attending'
	};
</script>

{#if open}
	<div
		on:click={() => (open = false)}
		class="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/50 px-3 py-10 md:items-center"
	>
		<!-- Modal container -->
		<div class="max-h-130 w-full max-w-2xl rounded-xl bg-white shadow-xl" on:click|stopPropagation>
			<!-- Header -->
			<div
				class="flex items-start justify-between border-b border-gray-200 px-6 py-4 md:items-center"
			>
				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex items-center gap-3">
						<button aria-label="Close" on:click={() => (open = false)}>
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
						<p>Manage {participant} Contribution</p>
					</div>
					<div class="flex w-full items-center gap-3 md:w-auto">
						<button class="flex items-center gap-1 rounded-lg border p-2 text-sm font-medium">
							Mark as Paid
						</button>
						<button class="5 text-sm font-medium underline"> View Payment History </button>
					</div>
				</div>

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

			<!-- Content -->
			<div
				class="custom-scrollbar h-75 space-y-6 overflow-hidden overflow-y-auto px-6 py-6"
				style="background-image: linear-gradient(180deg, #DBD4F1 0%, #DBE5F5 17%, #FFFFFF 35%);"
			>
				<h3 class="mb-4 flex items-center gap-1 text-xl font-semibold text-gray-700">
					Manage Contribution for {attendee.name}
				</h3>
				<!-- Attendee Info -->
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div class="flex items-center gap-2">
						<img src="/face-1.svg" alt="profile icon" class="h-10 w-10" />
						<div>
							<p class="font-semibold text-gray-900">{attendee.name}</p>
							<p class="text-xs text-gray-400">{attendee.email}</p>
						</div>
					</div>
					<div
						class="relative"
						use:clickOutside={() => {
							showEditStatus = false;
						}}
					>
						<button
							class="flex items-center gap-1 rounded-md bg-[#DCDCDC] px-3 py-1 text-xs text-[#A9AAAA]"
							on:click={() => (showEditStatus = !showEditStatus)}
						>
							{attendee.status}
							<img src="/edit-icon.svg" alt="" />
						</button>
						<EditStatus bind:open={showEditStatus} {attendee} />
					</div>
				</div>

				<!-- Registration Time / Amount -->
				<div class="mt-4 flex items-center gap-10 text-gray-400">
					<div class="border-r pr-10">
						<p class="text-xs text-[#C1C2C2]">Registration Time</p>
						<p class="text-sm font-semibold text-black">{attendee.registrationTime}</p>
					</div>
					<div>
						<p class="text-xs text-[#C1C2C2]">Amount Paid</p>
						<p class="text-sm font-semibold text-black">{attendee.amountPaid}</p>
					</div>
				</div>

				<!-- Tags -->
				<div class="mt-5 flex items-center gap-2">
					<div
						class="relative"
						use:clickOutside={() => {
							showAddTag = false;
						}}
					>
						<button
							class="flex items-center rounded-2xl bg-[#EFEFEF] px-1 py-0.5 text-xs text-[#A0A1A3]"
							on:click={() => (showAddTag = !showAddTag)}
						>
							<Icon icon="mdi:plus" class="text-xl" /> Add Tag
						</button>
						<AddTag bind:open={showAddTag} />
					</div>
					<button class="rounded-[22px] bg-[#F4ECDA] px-2 py-1 text-xs text-[#D79B1B]">
						{attendee.tag} <span class="ml-1 cursor-pointer font-semibold">×</span>
					</button>
				</div>
			</div>

			<div class="mt-4 flex items-center gap-2 border-t p-6">
				<button
					on:click={() => (open = false)}
					class="rounded-md bg-[#F4F5F6] px-4 py-2 text-gray-600 shadow-xs"
				>
					close
				</button>

				<button
					on:click={() => (open = false)}
					class="rounded-md bg-black px-4 py-2 text-white shadow-xs"
				>
					Send Payment Request
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Scrollbar styling for webkit */
	::-webkit-scrollbar {
		width: 6px;
	}
	::-webkit-scrollbar-thumb {
		background: rgba(107, 114, 128, 0.5);
		border-radius: 3px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: rgba(107, 114, 128, 0.8);
	}
</style>
