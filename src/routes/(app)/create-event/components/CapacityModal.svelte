<script lang="ts">
	import { onMount } from 'svelte';
	import { usageStore, loadUsage } from '$lib/stores/usage.store';

	export let open = false;
	export let maxAttendees: number | null = null;
	export let waitlistEnabled = false;
	/**
	 * GAP 5 — expected guests and a rough budget.
	 *
	 * Asked HERE, not on a separate screen, because this is already the "how
	 * big is this?" step and the two numbers answer the same question. They
	 * seed the budget so the Budget tab opens with a target and a per-guest
	 * cost instead of an empty form.
	 *
	 * Both are optional and independent of the capacity cap: expected guests
	 * is a planning estimate, `maxAttendees` is an enforcement limit, and
	 * conflating them would either over-order catering or refuse registrations.
	 */
	export let expectedGuestCount: number | null = null;
	/** Major units in the UI; converted to kobo when the event is created. */
	export let roughBudget: number | null = null;

	let capacityInput = 50;
	let overCapacityWaitlist = false;
	let guestInput: number | null = null;
	let budgetInput: number | null = null;

	onMount(() => { loadUsage().catch(() => {}); });

	// The per-event ATTENDEE cap from the organizer's plan. -1 / 999999 =
	// unlimited. This mirrors the backend guard (`checkMaxAttendeesAgainstPlan`)
	// so the limit is honest at the point the toggle is set, not a surprise
	// rejection later.
	$: tier = $usageStore.tier ?? 'FREE';
	$: attendeeCap = $usageStore.limits?.maxParticipantsPerEvent ?? -1;
	$: unlimited = attendeeCap < 0 || attendeeCap >= 999999;
	$: overCap = !unlimited && Number(capacityInput) > attendeeCap;

	function toggleWaitlist() {
		overCapacityWaitlist = !overCapacityWaitlist;
	}

	/** Planning estimates are kept on both paths — they are not part of the cap. */
	function commitPlanningInputs() {
		expectedGuestCount =
			guestInput !== null && Number(guestInput) > 0 ? Math.round(Number(guestInput)) : null;
		roughBudget = budgetInput !== null && Number(budgetInput) > 0 ? Number(budgetInput) : null;
	}

	function setLimit() {
		if (overCap) return; // guarded by the disabled button; belt-and-braces
		maxAttendees = capacityInput;
		waitlistEnabled = overCapacityWaitlist;
		commitPlanningInputs();
		open = false;
	}

	function removeLimit() {
		maxAttendees = null;
		waitlistEnabled = false;
		// Removing the CAP must not wipe the planning estimates — they mean
		// different things and an organizer who typed both would lose one.
		commitPlanningInputs();
		open = false;
	}
</script>

{#if open}
	<div id="capacity" class="absolute right-0 bottom-[30px] z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Collapse Icon -->
			<div
				class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
			>
				<div class="flex h-9 w-9 items-center justify-center">
					<svg
						width="41"
						height="41"
						viewBox="0 0 41 41"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M19.8061 8.42059C23.361 8.42059 26.9327 8.9934 30.3191 10.1222C30.9762 10.3412 31.33 11.0657 31.111 11.7227C30.8919 12.3798 30.1675 12.7505 29.5104 12.5146C23.243 10.4255 16.3523 10.4255 10.0849 12.5146C9.42783 12.7336 8.70338 12.3798 8.48436 11.7227C8.26533 11.0657 8.61914 10.3412 9.2762 10.1222C12.6795 8.97655 16.2512 8.42059 19.8061 8.42059Z"
							fill="#737577"
						/>
						<path
							d="M25.2712 38.3321H15.1625C6.01416 38.3321 2.10547 34.4234 2.10547 25.2751V15.1664C2.10547 6.01806 6.01416 2.10938 15.1625 2.10938H25.2712C34.4195 2.10938 38.3282 6.01806 38.3282 15.1664V25.2751C38.3282 34.4234 34.4195 38.3321 25.2712 38.3321ZM15.1625 4.63654C7.39567 4.63654 4.63264 7.39958 4.63264 15.1664V25.2751C4.63264 33.0419 7.39567 35.805 15.1625 35.805H25.2712C33.038 35.805 35.801 33.0419 35.801 25.2751V15.1664C35.801 7.39958 33.038 4.63654 25.2712 4.63654H15.1625Z"
							fill="#737577"
						/>
						<path
							d="M26.1637 27.314C25.8436 27.314 25.5235 27.196 25.2707 26.9433L20.2164 21.889L15.1621 26.9433C14.6735 27.4319 13.8648 27.4319 13.3762 26.9433C12.8876 26.4547 12.8876 25.646 13.3762 25.1575L19.3235 19.2102C19.8121 18.7216 20.6208 18.7216 21.1093 19.2102L27.0566 25.1575C27.5452 25.646 27.5452 26.4547 27.0566 26.9433C26.8039 27.196 26.4838 27.314 26.1637 27.314Z"
							fill="#737577"
						/>
					</svg>
				</div>
			</div>

			<!-- Header -->
			<h2 class="text-lg font-semibold text-black">Max Capacity</h2>
			<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
				Auto-close registration when the capacity is reached. Only approved guests count toward the
				cap.
			</p>

			<!-- Capacity Input -->
			<label for="capacity" class="mb-1 block text-sm font-medium text-gray-700">Capacity</label>
			<input
				type="number"
				min="1"
				max={unlimited ? undefined : attendeeCap}
				bind:value={capacityInput}
				class="h-[40px] w-full rounded-md border bg-[#FFFFFF] px-3 py-1 text-sm text-black focus:ring-2 focus:outline-none {overCap ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-gray-400'}"
			/>

			<!-- Plan attendee-cap hint / warning -->
			{#if !unlimited}
				{#if overCap}
					<p class="mt-2 text-xs text-red-600">
						Your {tier} plan allows up to <strong>{attendeeCap}</strong> attendees per event.
						<a href="/subscription" class="font-semibold text-[#F31A7C] underline">Upgrade to PLUS</a>
						for unlimited attendees.
					</p>
				{:else}
					<p class="mt-2 text-xs text-gray-400">
						{tier} plan: up to {attendeeCap} attendees per event.
					</p>
				{/if}
			{/if}

			<!-- Toggle -->
			<div class="mt-4 flex items-center justify-between">
				<label for="" class="text-sm font-medium text-gray-700">Over-Capacity Waitlist</label>

				<!-- Custom Toggle Switch -->
				<button
					aria-label="toggle"
					class="relative h-6 w-10 rounded-full transition-colors duration-300"
					class:bg-gray-300={!overCapacityWaitlist}
					class:bg-gray-800={overCapacityWaitlist}
					on:click={toggleWaitlist}
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
						class:translate-x-4={overCapacityWaitlist}
					></span>
				</button>
			</div>

			<!-- GAP 5 — planning estimates. Separate block, separate meaning:
			     these seed the budget, they don't cap registrations. -->
			<div class="mt-5 border-t border-gray-200 pt-4">
				<p class="mb-3 text-xs font-medium tracking-wide text-[#8E8E90] uppercase">
					Planning (optional)
				</p>

				<label for="expected-guests" class="mb-1 block text-sm font-medium text-gray-700">
					Expected guests
				</label>
				<input
					id="expected-guests"
					type="number"
					min="1"
					placeholder="e.g. 150"
					bind:value={guestInput}
					class="h-[40px] w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-black focus:ring-2 focus:ring-gray-400 focus:outline-none"
				/>

				<label for="rough-budget" class="mt-3 mb-1 block text-sm font-medium text-gray-700">
					Rough budget
				</label>
				<input
					id="rough-budget"
					type="number"
					min="0"
					step="1000"
					placeholder="e.g. 2,000,000"
					bind:value={budgetInput}
					class="h-[40px] w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-black focus:ring-2 focus:ring-gray-400 focus:outline-none"
				/>
				<p class="mt-1.5 text-xs text-gray-400">
					Sets up your Budget tab with a target and a per-guest cost. You can change both later.
				</p>
			</div>

			<!-- Buttons -->
			<div class="mt-6 flex justify-between gap-4">
				<button
					class="w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={overCap}
					on:click={setLimit}
				>
					Set Limit
				</button>
				<button
					class="w-full rounded-lg bg-[#F0F0F0] py-2.5 font-medium text-[#636466] transition"
					on:click={removeLimit}
				>
					Remove Limit
				</button>
			</div>
		</div>
	</div>
{/if}
