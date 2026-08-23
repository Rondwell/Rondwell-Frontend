<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fade, fly } from 'svelte/transition';

	export let open = false;
	export let publicGuestListEnabled = false;
	export let postEventFeedbackEnabled = false;
	export let waitlistEnabled = false;
	/**
	 * Master ON/OFF for guest cash contributions. The server treats effective
	 * enablement as `donationsEnabled && guestContributions.enabled`, so the
	 * create flow flips BOTH together — see `create-event/+page.svelte`.
	 */
	export let donationsEnabled = false;

	// ── Celebration layer ────────────────────────────────────────────────
	// Each is a named sub-document on the event, matching the convention the
	// model already uses. Full configuration lives on the event's Settings
	// page; the create flow only decides on/off (plus the one number an
	// organizer genuinely expects to set up front — the minimum age).
	export let ageRestrictionEnabled = false;
	export let ageRestrictionMinimumAge = 18;
	export let giftRegistryEnabled = false;
	export let memoriesEnabled = false;
	export let promoterEnabled = false;
	export let budgetEnabled = false;

	function closeModal() {
		open = false;
	}

	/**
	 * `key` drives `toggle()`; the getter/setter pair keeps each card bound to
	 * its own exported prop so `bind:` still propagates to the parent.
	 */
	$: toggleCards = [
		{
			icon: 'mdi:account-group',
			iconBg: 'bg-purple-200',
			iconColor: 'text-purple-600',
			title: 'Public Guest List',
			description: 'Show Public Guest List',
			key: 'publicGuestListEnabled',
			get enabled() { return publicGuestListEnabled; }
		},
		{
			icon: 'mdi:comment-question-outline',
			iconBg: 'bg-blue-200',
			iconColor: 'text-blue-600',
			title: 'Post Event Feedback',
			description: 'Send feedback form to guests automatically',
			key: 'postEventFeedbackEnabled',
			get enabled() { return postEventFeedbackEnabled; }
		},
		{
			icon: 'mdi:clock-outline',
			iconBg: 'bg-pink-200',
			iconColor: 'text-pink-600',
			title: 'Waitlist',
			description: 'Allow guests to join a waitlist if tickets run out or registration closes',
			key: 'waitlistEnabled',
			get enabled() { return waitlistEnabled; }
		},
		{
			icon: 'mdi:cash-multiple',
			iconBg: 'bg-green-200',
			iconColor: 'text-green-600',
			title: 'Guest Contributions',
			description: 'Guests can add a cash gift when they RSVP',
			key: 'donationsEnabled',
			get enabled() { return donationsEnabled; }
		},
		{
			icon: 'mdi:gift-outline',
			iconBg: 'bg-fuchsia-200',
			iconColor: 'text-fuchsia-600',
			title: 'Gift Registry',
			description: 'A wishlist guests can shop from or chip in towards',
			key: 'giftRegistryEnabled',
			get enabled() { return giftRegistryEnabled; }
		},
		{
			icon: 'mdi:camera-outline',
			iconBg: 'bg-amber-200',
			iconColor: 'text-amber-600',
			title: 'Memories',
			description: 'Let guests upload their photos after the event',
			key: 'memoriesEnabled',
			get enabled() { return memoriesEnabled; }
		},
		{
			icon: 'mdi:bullhorn-outline',
			iconBg: 'bg-orange-200',
			iconColor: 'text-orange-600',
			title: 'Promoters',
			description: 'Pay a commission to people who bring you ticket sales',
			key: 'promoterEnabled',
			get enabled() { return promoterEnabled; }
		},
		{
			icon: 'mdi:wallet-outline',
			iconBg: 'bg-teal-200',
			iconColor: 'text-teal-600',
			title: 'Budget',
			description: 'Track spend, and auto-reconcile it against vendor bookings',
			key: 'budgetEnabled',
			get enabled() { return budgetEnabled; }
		},
		{
			icon: 'mdi:human-male-boy',
			iconBg: 'bg-red-200',
			iconColor: 'text-red-600',
			title: 'Age restriction',
			description: 'Require guests to declare their date of birth to register',
			key: 'ageRestrictionEnabled',
			get enabled() { return ageRestrictionEnabled; }
		}
	];

	function toggle(key: string) {
		if (key === 'publicGuestListEnabled') publicGuestListEnabled = !publicGuestListEnabled;
		else if (key === 'postEventFeedbackEnabled') postEventFeedbackEnabled = !postEventFeedbackEnabled;
		else if (key === 'waitlistEnabled') waitlistEnabled = !waitlistEnabled;
		else if (key === 'donationsEnabled') donationsEnabled = !donationsEnabled;
		else if (key === 'giftRegistryEnabled') giftRegistryEnabled = !giftRegistryEnabled;
		else if (key === 'memoriesEnabled') memoriesEnabled = !memoriesEnabled;
		else if (key === 'promoterEnabled') promoterEnabled = !promoterEnabled;
		else if (key === 'budgetEnabled') budgetEnabled = !budgetEnabled;
		else if (key === 'ageRestrictionEnabled') ageRestrictionEnabled = !ageRestrictionEnabled;
	}

	// Clamp mirrors the server (13..99). Anything outside is meaningless as a
	// restriction, and the server would silently clamp it anyway — better the
	// organizer sees the real value they are saving.
	function clampAge(v: number) {
		const n = Math.round(Number(v));
		ageRestrictionMinimumAge = Number.isFinite(n) ? Math.max(13, Math.min(99, n)) : 18;
	}
</script>

{#if open}
	<!-- Modal sliding up from bottom -->
	<div
		class="bg fixed inset-x-0 bottom-0 z-50 flex min-h-[236.25px] w-full flex-col gap-4 p-6"
		style="max-height: 70vh; overflow-y: auto;"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<div
			class="custom-scrollbar relative flex h-full w-full flex-col items-start justify-between gap-6 overflow-y-auto text-gray-500"
		>
			<!-- Toggle Cards -->
			<div class="grid h-full max-h-[60vh] w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each toggleCards as card}
					<div class="card-bg flex min-h-[160px] flex-col justify-between rounded-lg p-6">
						<div class="flex items-center justify-between">
							<div
								class={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconBg} ${card.iconColor}`}
							>
								<Icon icon={card.icon} class="text-xl" />
							</div>
							<button
								aria-label={`Toggle ${card.title}`}
								class="relative h-6 w-10 rounded-full transition-colors duration-300"
								class:bg-gray-300={!card.enabled}
								class:bg-gray-800={card.enabled}
								on:click={() => toggle(card.key)}
							>
								<span
									class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
									class:translate-x-4={card.enabled}
								></span>
							</button>
						</div>
						<div>
							<h3 class="font-semibold text-gray-900">{card.title}</h3>
							<p class="mt-1 text-xs font-medium text-gray-500">{card.description}</p>

							{#if card.key === 'ageRestrictionEnabled' && ageRestrictionEnabled}
								<!-- The only inline config in this modal: an age gate with no
								     number is not a decision the organizer can defer. -->
								<div class="mt-3 flex items-center gap-2">
									<label class="text-xs font-medium text-gray-600" for="min-age">Minimum age</label>
									<input
										id="min-age"
										type="number"
										min="13"
										max="99"
										value={ageRestrictionMinimumAge}
										on:input={(e) => clampAge(+(e.currentTarget as HTMLInputElement).value)}
										class="w-16 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none"
									/>
									<span class="text-xs text-gray-400">years</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.bg {
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(20px);
		border-radius: 18.75px 18.75px 0px 0px;
	}

	.card-bg {
		background: rgba(243, 245, 247, 0.7);
		backdrop-filter: blur(5px);
		border-radius: 8px;
	}

	.gradient-text {
		background: linear-gradient(90deg, #db3ec6 0%, #963dd4 50%, #513be2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		color: transparent;
	}

	input[type='checkbox'].toggle {
		appearance: none;
		width: 40px;
		height: 25px;
		background: #ddd;
		border-radius: 15px;
		position: relative;
		cursor: pointer;
		transition: background 0.3s;
	}

	input[type='checkbox'].toggle:checked {
		background: black;
	}

	input[type='checkbox'].toggle::before {
		content: '';
		position: absolute;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		top: 1px;
		left: 1px;
		background: white;
		transition: transform 0.3s;
	}

	input[type='checkbox'].toggle:checked::before {
		transform: translateX(15px);
	}
</style>
