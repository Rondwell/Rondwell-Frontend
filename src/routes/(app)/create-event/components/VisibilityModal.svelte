<script>
	import Icon from '@iconify/svelte';
	import { VISIBILITY_OPTIONS, visibilityIcon } from '$lib/constants/event-visibility';

	export let open = false;
	let buttonOpen = false;

	$: if (open === false) {
		buttonOpen = false;
	}

	/**
	 * C-13 — this modal used to hold its own `options` array keyed on a
	 * CAPITALISED DISPLAY LABEL ('Public' / 'Private') and assign that label
	 * straight into the bound `visibility` prop. The create-event payload then
	 * compared `visibility === 'public'` — lowercase — so an organizer who
	 * opened this picker and clicked **Public** created a **PRIVATE** event:
	 * absent from /discover, excluded from collection listings, ineligible to
	 * be featured. The pill still read "Public". No error, no signal.
	 *
	 * It survived testing because the two other writers of `visibility` (the
	 * initial value and the AI prefill) were lowercase and correct — the ONLY
	 * way to reach the bug was to open the picker and click, so the one
	 * organizer guaranteed to get Private was the one who deliberately chose
	 * Public. The same mismatch broke the icon lookup.
	 *
	 * The fix is not `.toLowerCase()` — that patches this instance and leaves
	 * the class intact. The modal now emits the WIRE ENUM ('PUBLIC' /
	 * 'PRIVATE'), and the display label and icon are both derived from that
	 * one value through a shared lookup, so what is shown and what is
	 * transported cannot drift apart again.
	 */
	const options = VISIBILITY_OPTIONS;

	/** @type {'PUBLIC' | 'PRIVATE'} */
	export let visibility = options[0].value;
	export let visibility_icon = options[0].icon;

	$: visibility_icon = visibilityIcon(visibility);

	function updateVisibility() {
		open = false;
		buttonOpen = false;
	}
</script>

{#if open}
	<div class="triangle absolute right-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Icon -->
			<div class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
				<img src="/global-edit.svg" alt="icon" class="h-7 w-7" />
			</div>

			<!-- Title -->
			<h2 class="text-lg font-semibold text-gray-900">Public Event</h2>
			<p class="mt-1 text-sm text-gray-500">
				This event is listed on your collection and is eligible to be featured by Rondwell or listed
				by other community Collection.
			</p>

			<!-- Dropdown -->
			<label for="" class="mt-4 mb-1 block text-sm font-medium text-gray-700">New Visibility</label>

			<div class="relative">
				<button
					type="button"
					class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors {buttonOpen
						? 'bg-[#656668] text-white'
						: 'bg-[#F0F0F0] text-gray-500'}"
					on:click={() => (buttonOpen = !buttonOpen)}
				>
					<span class="flex items-center gap-2">
						<!-- C-13 — both the icon and the text are DERIVED from the wire
						     value, so the control cannot display one thing and transport
						     another. -->
						<Icon icon={visibilityIcon(visibility)} class="text-lg" />
						{options.find((o) => o.value === visibility)?.label ?? options[0].label}
					</span>

					<Icon icon="mdi:menu-down" class="h-6 w-6" />
				</button>

				{#if buttonOpen}
					<div
						class="absolute right-0 left-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg"
					>
						{#each options as option}
							<button
								class="w-full px-3 py-2 text-left text-sm transition hover:bg-gray-50"
								on:click={() => {
									// C-13 — emit the WIRE VALUE, not the display label.
									// `visibility = option.label` here is the entire bug.
									visibility = option.value;
									buttonOpen = false;
								}}
							>
								<div class="flex items-start justify-between gap-2">
									<div class="flex gap-2">
										<Icon icon={option.icon} class="h-5 w-5 text-gray-600" />
										<div>
											<p class="font-medium text-gray-800">{option.label}</p>
											<p class="text-xs text-gray-500">{option.description}</p>
										</div>
									</div>
									{#if visibility === option.value}
										<Icon icon="mdi:tick" class="text-3xl text-black" />
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Update Button -->
			<button
				class="mt-5 w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
				on:click={updateVisibility}
			>
				Update Visibility
			</button>
		</div>
	</div>
{/if}

<style>
	/* Triangle pointer */
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		right: 60px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
