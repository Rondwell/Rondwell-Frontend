<!--
	Automated event emails — the countdown reminders and the post-event
	thank-you.

	Distinct from the blast composer next door: nothing here is sent by hand.
	The organizer picks WHICH automatic emails go out and, optionally, what they
	say; a scheduler does the rest. That is why every row shows its send state —
	once a reminder has gone out it can no longer be edited, and pretending
	otherwise would let someone "change" an email that is already in inboxes.
-->
<script lang="ts">
	import {
		getEventEmailSettings,
		updateEventEmailSettings,
		type EventEmailSettings,
		type ReminderCatalogEntry,
		type ReminderSlot
	} from '$lib/services/eventEmailSettings.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let eventId = '';
	export let eventTitle = '';
	/** Event start, so a reminder that could never fire is shown as such. */
	export let eventStart: string | null = null;

	const dispatch = createEventDispatcher<{ saved: EventEmailSettings }>();

	let loading = false;
	let saving = false;
	let error = '';
	let successMsg = '';

	let settings: EventEmailSettings | null = null;
	let catalog: ReminderCatalogEntry[] = [];

	// Local working copy — nothing is written until the organizer saves.
	let remindersEnabled = true;
	let slots: ReminderSlot[] = [];
	let expandedKey: string | null = null;
	let thankYouEnabled = true;
	let thankYouMessage = '';

	let loadedFor = '';
	$: if (open && eventId && loadedFor !== eventId) {
		loadedFor = eventId;
		load();
	}
	$: if (!open) loadedFor = '';

	$: startMs = eventStart ? new Date(eventStart).getTime() : NaN;

	async function load() {
		loading = true;
		error = '';
		successMsg = '';
		try {
			const data = await getEventEmailSettings(eventId);
			settings = data.settings;
			catalog = data.reminderCatalog ?? [];
			remindersEnabled = data.settings.remindersEnabled;
			slots = (data.settings.reminders ?? []).map((s) => ({ ...s }));
			thankYouEnabled = data.settings.thankYou?.enabled ?? true;
			thankYouMessage = data.settings.thankYou?.customMessage ?? '';
		} catch (e: any) {
			error = e?.message || 'Could not load these settings';
		} finally {
			loading = false;
		}
	}

	function labelFor(key: string): string {
		return catalog.find((c) => c.key === key)?.label ?? key;
	}

	/**
	 * A reminder whose moment has already passed can never fire, so it is shown
	 * disabled rather than as a toggle that quietly does nothing.
	 */
	function isPast(slot: ReminderSlot): boolean {
		if (!Number.isFinite(startMs)) return false;
		return Date.now() > startMs - slot.offsetMinutes * 60_000;
	}

	function toggleSlot(slot: ReminderSlot) {
		if (slot.sentAt || isPast(slot)) return;
		slot.enabled = !slot.enabled;
		slots = slots;
	}

	async function save() {
		saving = true;
		error = '';
		successMsg = '';
		try {
			const updated = await updateEventEmailSettings(eventId, {
				remindersEnabled,
				reminders: slots.map((s) => ({
					key: s.key,
					enabled: s.enabled,
					customMessage: s.customMessage?.trim() || null
				})),
				thankYou: { enabled: thankYouEnabled, customMessage: thankYouMessage.trim() || null }
			});
			settings = updated;
			successMsg = 'Saved';
			dispatch('saved', updated);
			setTimeout(() => (successMsg = ''), 2500);
		} catch (e: any) {
			error = e?.message || 'Could not save these settings';
		} finally {
			saving = false;
		}
	}

	$: activeCount = remindersEnabled ? slots.filter((s) => s.enabled).length : 0;
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4"
	>
		<div
			class="flex h-[100dvh] w-full flex-col bg-white shadow-xl sm:h-full sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl"
		>
			<!-- Header -->
			<div class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3.5 sm:px-6">
				<div class="flex min-w-0 items-center gap-3">
					<div
						class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2E4F8] sm:flex"
					>
						<Icon icon="mdi:bell-ring-outline" class="h-5 w-5 text-[#AB46DD]" />
					</div>
					<div class="min-w-0">
						<h2 class="truncate text-base font-semibold text-gray-900">Event emails</h2>
						<p class="truncate text-xs text-[#A5A6A6]">
							Sent automatically for {eventTitle || 'this event'}
						</p>
					</div>
				</div>
				<button
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBECED]"
					on:click={() => (open = false)}
					aria-label="Close"
				>
					<Icon icon="mdi:close" class="text-lg text-gray-700" />
				</button>
			</div>

			<div class="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6">
				{#if loading}
					<div class="space-y-3">
						{#each Array(4) as _}
							<div class="h-[68px] animate-pulse rounded-xl bg-gray-100"></div>
						{/each}
					</div>
				{:else}
					<!-- ── Reminders ──────────────────────────────────────────── -->
					<div class="mb-6">
						<div class="mb-3 flex items-start justify-between gap-3">
							<div>
								<h3 class="text-sm font-semibold text-gray-900">Countdown reminders</h3>
								<p class="mt-0.5 text-xs text-[#A5A6A6]">
									Sent to everyone attending. {activeCount === 0
										? 'None are switched on.'
										: `${activeCount} switched on.`}
								</p>
							</div>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								role="switch"
								aria-checked={remindersEnabled}
								aria-label="All reminders"
								on:click={() => (remindersEnabled = !remindersEnabled)}
								class="relative mt-0.5 h-6 w-10 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300"
								class:bg-gray-300={!remindersEnabled}
								class:bg-[#131517]={remindersEnabled}
							>
								<span
									class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
									class:translate-x-4={remindersEnabled}
								></span>
							</div>
						</div>

						<div class="space-y-2" class:opacity-50={!remindersEnabled}>
							{#each slots as slot (slot.key)}
								{@const sent = Boolean(slot.sentAt)}
								{@const past = isPast(slot)}
								{@const locked = sent || past || !remindersEnabled}
								<div class="rounded-xl border border-gray-100 bg-[#FDFDFD] shadow-sm">
									<div class="flex items-center gap-3 px-4 py-3">
										<div class="min-w-0 flex-1">
											<p class="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800">
												{labelFor(slot.key)}
												{#if sent}
													<span
														class="rounded-full bg-[#E3F4E1] px-2 py-0.5 text-[10px] font-medium text-[#3CBD2C]"
													>
														Sent{slot.recipientCount ? ` · ${slot.recipientCount}` : ''}
													</span>
												{:else if past}
													<span
														class="rounded-full bg-[#EBECED] px-2 py-0.5 text-[10px] font-medium text-[#8A8B95]"
													>
														Window passed
													</span>
												{/if}
											</p>
											<p class="mt-0.5 truncate text-xs text-[#B9BABA]">
												{slot.customMessage
													? slot.customMessage
													: 'Uses the default reminder wording.'}
											</p>
										</div>

										{#if !sent && !past}
											<button
												type="button"
												on:click={() =>
													(expandedKey = expandedKey === slot.key ? null : slot.key)}
												class="flex-shrink-0 rounded-lg p-1.5 text-[#A5A6A6] transition hover:bg-gray-100 hover:text-gray-700"
												aria-label="Edit message for {labelFor(slot.key)}"
											>
												<Icon
													icon="mdi:pencil-outline"
													class="text-base {expandedKey === slot.key ? 'text-gray-800' : ''}"
												/>
											</button>
										{/if}

										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<div
											role="switch"
											aria-checked={slot.enabled}
											aria-label={labelFor(slot.key)}
											on:click={() => toggleSlot(slot)}
											class="relative h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-300 {locked
												? 'cursor-not-allowed opacity-60'
												: 'cursor-pointer'}"
											class:bg-gray-300={!slot.enabled}
											class:bg-[#131517]={slot.enabled}
										>
											<span
												class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
												class:translate-x-4={slot.enabled}
											></span>
										</div>
									</div>

									{#if expandedKey === slot.key && !sent && !past}
										<div class="border-t border-gray-100 px-4 py-3">
											<label
												for="reminder-msg-{slot.key}"
												class="mb-1.5 block text-xs font-medium text-[#666769]"
											>
												Your message <span class="font-normal text-gray-400">(optional)</span>
											</label>
											<textarea
												id="reminder-msg-{slot.key}"
												bind:value={slot.customMessage}
												rows="3"
												maxlength="600"
												placeholder="e.g. Doors open at 6pm — bring a photo ID for check-in."
												class="w-full resize-none rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none"
											></textarea>
											<p class="mt-1 text-[11px] text-gray-400">
												Replaces the default wording. Leave it empty and we'll write it for you.
												The date, place and buttons are always included.
											</p>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- ── Thank-you ──────────────────────────────────────────── -->
					<div class="mb-2">
						<h3 class="mb-3 text-sm font-semibold text-gray-900">After the event</h3>

						<div class="rounded-xl border border-gray-100 bg-[#FDFDFD] shadow-sm">
							<div class="flex items-center gap-3 px-4 py-3">
								<div
									class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FDE8F6]"
								>
									<Icon icon="mdi:heart-outline" class="h-5 w-5 text-[#DB3EC6]" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800">
										Thank-you email
										{#if settings?.thankYou?.sentAt}
											<span
												class="rounded-full bg-[#E3F4E1] px-2 py-0.5 text-[10px] font-medium text-[#3CBD2C]"
											>
												Sent{settings.thankYou.recipientCount
													? ` · ${settings.thankYou.recipientCount}`
													: ''}
											</span>
										{/if}
									</p>
									<p class="text-xs text-[#B9BABA]">
										Goes out an hour after the event ends.
									</p>
								</div>
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<div
									role="switch"
									aria-checked={thankYouEnabled}
									aria-label="Thank-you email"
									on:click={() => {
										if (!settings?.thankYou?.sentAt) thankYouEnabled = !thankYouEnabled;
									}}
									class="relative h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-300 {settings
										?.thankYou?.sentAt
										? 'cursor-not-allowed opacity-60'
										: 'cursor-pointer'}"
									class:bg-gray-300={!thankYouEnabled}
									class:bg-[#131517]={thankYouEnabled}
								>
									<span
										class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
										class:translate-x-4={thankYouEnabled}
									></span>
								</div>
							</div>

							{#if thankYouEnabled && !settings?.thankYou?.sentAt}
								<div class="border-t border-gray-100 px-4 py-3">
									<label
										for="thankyou-msg"
										class="mb-1.5 block text-xs font-medium text-[#666769]"
									>
										A note from you <span class="font-normal text-gray-400">(optional)</span>
									</label>
									<textarea
										id="thankyou-msg"
										bind:value={thankYouMessage}
										rows="3"
										maxlength="600"
										placeholder="e.g. Thank you for making the room what it was. Photos are going up this week."
										class="w-full resize-none rounded-lg border border-gray-200 bg-[#F8F8F9] px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none"
									></textarea>
									<p class="mt-1 text-[11px] text-gray-400">
										Quoted in the email under your name.
									</p>
								</div>
							{/if}
						</div>
					</div>

					{#if error}
						<p class="mt-4 text-sm text-red-500">{error}</p>
					{/if}
				{/if}
			</div>

			<!-- Footer -->
			<div
				class="flex items-center gap-2 border-t border-gray-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
			>
				{#if successMsg}
					<span class="flex items-center gap-1.5 text-xs font-medium text-[#3CBD2C]">
						<Icon icon="mdi:check-circle" class="text-base" />
						{successMsg}
					</span>
				{/if}
				<div class="ml-auto flex items-center gap-2">
					<button
						on:click={() => (open = false)}
						class="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#626365] transition hover:bg-gray-50"
					>
						Close
					</button>
					<button
						on:click={save}
						disabled={saving || loading}
						class="flex items-center justify-center gap-2 rounded-lg bg-[#131517] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2A2B30] disabled:cursor-not-allowed disabled:bg-[#969798]"
					>
						{#if saving}
							<Icon icon="mdi:loading" class="animate-spin text-base" /> Saving…
						{:else}
							Save changes
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
