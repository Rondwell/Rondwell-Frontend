<!--
	Post-event feedback.

	The organizer picks when the survey goes out, what it says, and what it
	asks; attendees answer with one tap on an emoji in the email and can add a
	comment on the page that opens. Responses land in the event's own feedback
	collection, summarised back here.

	The date and time controls are the same DatePickerModal / TimeModal used
	everywhere else on the platform, so scheduling a survey feels like
	scheduling anything else.
-->
<script lang="ts">
	import DatePickerModal from '../../../../../../create-event/components/DatePickerModal.svelte';
	import TimeModal from '../../../../../../create-event/components/TimeModal.svelte';
	import {
		FEEDBACK_RATINGS,
		getEventEmailSettings,
		getFeedbackResponses,
		updateEventEmailSettings,
		type EventEmailSettings,
		type FeedbackResponse,
		type FeedbackSummary
	} from '$lib/services/eventEmailSettings.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let eventId = '';
	export let eventTitle = '';
	/** Event end, so the panel can say "N days after the event ends". */
	export let eventEnd: string | null = null;

	const dispatch = createEventDispatcher<{ saved: EventEmailSettings }>();

	let loading = false;
	let saving = false;
	let error = '';
	let successMsg = '';

	let settings: EventEmailSettings | null = null;
	let summary: FeedbackSummary | null = null;
	let responses: FeedbackResponse[] = [];
	let responsesLoading = false;

	// Working copy
	let scheduledDate: Date | null = null;
	let scheduledTime = '';
	let showDatePicker = false;
	let showTimePicker = false;
	let subject = 'Thanks for joining {{eventName}}';
	let customMessage = '';
	let question = '';
	let tab: 'compose' | 'responses' = 'compose';

	let loadedFor = '';
	$: if (open && eventId && loadedFor !== eventId) {
		loadedFor = eventId;
		load();
	}
	$: if (!open) loadedFor = '';

	$: alreadySent = Boolean(settings?.feedback?.sentAt);
	$: endMs = eventEnd ? new Date(eventEnd).getTime() : NaN;

	/** Fold the two controls into one instant. Null until both are chosen. */
	function composeScheduledAt(): Date | null {
		if (!scheduledDate || !scheduledTime) return null;
		const [clock, meridiem] = scheduledTime.trim().split(' ');
		const [rawHours, rawMinutes] = clock.split(':').map(Number);
		if (Number.isNaN(rawHours) || Number.isNaN(rawMinutes)) return null;
		let hours = rawHours % 12;
		if (meridiem?.toUpperCase() === 'PM') hours += 12;
		const dt = new Date(scheduledDate);
		dt.setHours(hours, rawMinutes, 0, 0);
		return dt;
	}

	$: scheduledAt = scheduledDate && scheduledTime ? composeScheduledAt() : null;
	$: scheduleInPast = Boolean(scheduledAt && scheduledAt.getTime() < Date.now());

	/**
	 * "4 days after the event ends" — the relative phrasing from the mock, so
	 * the organizer sees the offset they are actually choosing rather than
	 * having to subtract two dates in their head.
	 */
	$: relativeToEnd = (() => {
		if (!scheduledAt || !Number.isFinite(endMs)) return '';
		const diffMs = scheduledAt.getTime() - endMs;
		if (diffMs < 0) return 'before the event ends';
		const hours = Math.round(diffMs / 3_600_000);
		if (hours < 1) return 'right after the event ends';
		if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} after the event ends`;
		const days = Math.round(hours / 24);
		return `${days} day${days === 1 ? '' : 's'} after the event ends`;
	})();

	$: subjectPreview = subject.replace(/\{\{\s*eventName\s*\}\}/gi, eventTitle || 'your event');
	$: questionPreview = question.trim() || `What did you think of ${eventTitle || 'the event'}?`;

	$: canSchedule = Boolean(scheduledAt) && !scheduleInPast && subject.trim().length >= 3 && !saving;

	async function load() {
		loading = true;
		error = '';
		successMsg = '';
		try {
			const data = await getEventEmailSettings(eventId);
			settings = data.settings;
			summary = data.feedbackSummary;

			const f = data.settings.feedback;
			subject = f?.subject || 'Thanks for joining {{eventName}}';
			customMessage = f?.customMessage ?? '';
			question = f?.question ?? '';

			if (f?.scheduledAt) {
				const d = new Date(f.scheduledAt);
				scheduledDate = d;
				const hour12 = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
				const meridiem = d.getHours() < 12 ? 'AM' : 'PM';
				scheduledTime = `${hour12}:${d.getMinutes() < 30 ? '00' : '30'} ${meridiem}`;
			} else {
				// A sensible starting point: two days after the event ends, at 2pm.
				// The organizer can move it; nobody has to invent a time from nothing.
				scheduledDate = null;
				scheduledTime = '';
				if (Number.isFinite(endMs)) {
					const suggested = new Date(endMs + 2 * 24 * 3_600_000);
					suggested.setHours(14, 0, 0, 0);
					if (suggested.getTime() > Date.now()) {
						scheduledDate = suggested;
						scheduledTime = '2:00 PM';
					}
				}
			}

			if ((data.feedbackSummary?.total ?? 0) > 0) loadResponses();
		} catch (e: any) {
			error = e?.message || 'Could not load the feedback settings';
		} finally {
			loading = false;
		}
	}

	async function loadResponses() {
		responsesLoading = true;
		try {
			const data = await getFeedbackResponses(eventId, { limit: 50 });
			responses = data.responses ?? [];
			summary = data.summary;
		} catch {
			responses = [];
		} finally {
			responsesLoading = false;
		}
	}

	async function save(enabled: boolean) {
		saving = true;
		error = '';
		successMsg = '';
		try {
			const updated = await updateEventEmailSettings(eventId, {
				feedback: {
					enabled,
					// A sent request cannot be rescheduled — the server refuses it —
					// so the time is only submitted while it is still changeable.
					...(alreadySent ? {} : { scheduledAt: enabled ? (scheduledAt?.toISOString() ?? null) : null }),
					subject: subject.trim(),
					customMessage: customMessage.trim() || null,
					question: question.trim() || null
				}
			});
			settings = updated;
			successMsg = enabled ? 'Feedback email scheduled' : 'Feedback email cancelled';
			dispatch('saved', updated);
			setTimeout(() => (successMsg = ''), 3000);
		} catch (e: any) {
			error = e?.message || 'Could not save the feedback settings';
		} finally {
			saving = false;
		}
	}

	function fmtDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function emojiFor(rating: number): string {
		return FEEDBACK_RATINGS.find((r) => r.value === rating)?.emoji ?? '🙂';
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4"
	>
		<div
			class="flex h-[100dvh] w-full flex-col bg-white shadow-xl sm:h-full sm:max-h-[94vh] sm:max-w-2xl sm:rounded-2xl"
		>
			<!-- Header -->
			<div class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3.5 sm:px-6">
				<div class="flex min-w-0 items-center gap-3">
					<div
						class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF7D8] sm:flex"
					>
						<Icon icon="mdi:message-star-outline" class="h-5 w-5 text-[#D79917]" />
					</div>
					<div class="min-w-0">
						<h2 class="truncate text-base font-semibold text-gray-900">Post-event feedback</h2>
						<p class="truncate text-xs text-[#A5A6A6]">
							{alreadySent ? 'Sent — collecting responses' : 'Schedule a feedback email'}
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

			<!-- Tabs — only meaningful once there is something to read. -->
			{#if summary && summary.total > 0}
				<div class="custom-scrollbar overflow-x-auto border-b border-gray-200 px-4 sm:px-6">
					<div class="flex w-max min-w-full gap-1">
						{#each [['compose', 'The email'], ['responses', `Responses (${summary.total})`]] as [value, label]}
							<button
								on:click={() => {
									tab = value as typeof tab;
									if (value === 'responses' && responses.length === 0) loadResponses();
								}}
								class="-mb-px flex-shrink-0 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition {tab ===
								value
									? 'border-[#131517] font-medium text-[#131517]'
									: 'border-transparent text-gray-500 hover:text-gray-700'}"
							>
								{label}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<div class="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6">
				{#if loading}
					<div class="space-y-3">
						{#each Array(4) as _}
							<div class="h-16 animate-pulse rounded-xl bg-gray-100"></div>
						{/each}
					</div>
				{:else if tab === 'responses'}
					<!-- ── Responses ──────────────────────────────────────────── -->
					{#if summary}
						<div class="mb-4 rounded-2xl border border-gray-100 bg-[#FDFDFD] p-4 shadow-sm">
							<div class="flex flex-wrap items-end justify-between gap-4">
								<div>
									<p class="text-xs text-[#A5A6A6]">Average rating</p>
									<p class="mt-1 text-3xl font-semibold text-gray-900">
										{summary.averageRating?.toFixed(1) ?? '—'}
										<span class="text-base font-normal text-[#B9BABA]">/ 5</span>
									</p>
								</div>
								<div class="text-right">
									<p class="text-xs text-[#A5A6A6]">
										{summary.total} response{summary.total === 1 ? '' : 's'}
									</p>
									<p class="text-xs text-[#A5A6A6]">{summary.withComments} with a comment</p>
								</div>
							</div>

							<div class="mt-4 space-y-1.5">
								{#each [...FEEDBACK_RATINGS].reverse() as r}
									{@const count = summary.distribution?.[r.value - 1] ?? 0}
									{@const pct = summary.total > 0 ? (count / summary.total) * 100 : 0}
									<div class="flex items-center gap-2">
										<span class="w-6 text-center text-base">{r.emoji}</span>
										<div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
											<div
												class="h-full rounded-full bg-gradient-to-r from-[#DB3EC6] to-[#513BE2]"
												style="width: {pct}%"
											></div>
										</div>
										<span class="w-8 text-right text-xs text-[#A5A6A6]">{count}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if responsesLoading}
						<div class="space-y-2">
							{#each Array(3) as _}
								<div class="h-16 animate-pulse rounded-xl bg-gray-100"></div>
							{/each}
						</div>
					{:else if responses.length === 0}
						<div class="rounded-xl border border-dashed border-gray-200 p-8 text-center">
							<p class="text-sm text-gray-500">No responses yet.</p>
						</div>
					{:else}
						<div class="space-y-2">
							{#each responses as r (r._id)}
								<div class="rounded-xl border border-gray-100 bg-[#FDFDFD] p-3.5 shadow-sm">
									<div class="flex items-start gap-3">
										<span class="text-2xl leading-none">{emojiFor(r.rating)}</span>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium text-gray-800">
												{r.attendeeName || r.attendeeEmail}
											</p>
											{#if r.comment}
												<p class="mt-1 text-sm whitespace-pre-line text-[#5C5D67]">{r.comment}</p>
											{/if}
											<p class="mt-1 text-[11px] text-[#B9BABA]">{fmtDate(r.submittedAt)}</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{:else}
					<!-- ── Compose ────────────────────────────────────────────── -->
					{#if alreadySent}
						<div
							class="mb-4 flex items-start gap-3 rounded-xl border border-[#CDE7C8] bg-[#F1FAF0] p-3.5"
						>
							<Icon icon="mdi:check-circle-outline" class="mt-0.5 shrink-0 text-lg text-[#3CBD2C]" />
							<div>
								<p class="text-sm font-medium text-[#2C7A22]">This feedback email has gone out.</p>
								<p class="mt-0.5 text-xs text-[#4C8A44]">
									Sent to {settings?.feedback?.recipientCount ?? 0} attendee{settings?.feedback
										?.recipientCount === 1
										? ''
										: 's'}. Responses arrive as people tap.
								</p>
							</div>
						</div>
					{:else}
						<!-- When -->
						<div class="mb-5">
							<span class="mb-2 block text-sm font-medium text-gray-900">
								When should the feedback email be sent?
							</span>
							<div class="flex flex-wrap items-center gap-2">
								<div class="relative" use:clickOutside={() => (showDatePicker = false)}>
									<button
										type="button"
										on:click={() => {
											showDatePicker = !showDatePicker;
											showTimePicker = false;
										}}
										class="flex h-[42px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-800 transition hover:border-gray-300"
									>
										<Icon icon="mdi:calendar-blank-outline" class="text-base text-gray-400" />
										{scheduledDate
											? scheduledDate.toLocaleDateString('en-US', {
													weekday: 'short',
													month: 'short',
													day: 'numeric'
												})
											: 'Pick a date'}
									</button>
									<DatePickerModal
										bind:open={showDatePicker}
										bind:selectedDate={scheduledDate}
										minDate={new Date()}
										on:select={() => (showDatePicker = false)}
									/>
								</div>

								<div class="relative" use:clickOutside={() => (showTimePicker = false)}>
									<button
										type="button"
										on:click={() => {
											showTimePicker = !showTimePicker;
											showDatePicker = false;
										}}
										class="flex h-[42px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-800 transition hover:border-gray-300"
									>
										<Icon icon="mdi:clock-outline" class="text-base text-gray-400" />
										{scheduledTime || 'Pick a time'}
									</button>
									<TimeModal bind:open={showTimePicker} bind:selectedTime={scheduledTime} />
								</div>
							</div>

							{#if scheduleInPast}
								<p class="mt-2 text-xs text-red-500">That time has already passed — pick a later one.</p>
							{:else if scheduledAt && relativeToEnd}
								<p class="mt-2 text-xs text-[#A5A6A6]">{relativeToEnd}</p>
							{:else if !scheduledAt}
								<p class="mt-2 text-xs text-[#A5A6A6]">
									Pick both a date and a time. Most organizers send this a day or two after the
									event, while it is still fresh.
								</p>
							{/if}
						</div>
					{/if}

					<!-- The email -->
					<div class="rounded-2xl border border-gray-100 bg-[#FDFDFD] p-4 shadow-sm">
						<div class="mb-4">
							<label for="fb-subject" class="mb-1.5 block text-xs font-medium text-[#666769]">
								Subject
							</label>
							<input
								id="fb-subject"
								type="text"
								bind:value={subject}
								maxlength="200"
								disabled={alreadySent}
								class="h-[42px] w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
							/>
							<p class="mt-1.5 text-[11px] text-gray-400">
								<code class="rounded bg-[#FDE8F6] px-1.5 py-0.5 font-medium text-[#DB3EC6]"
									>{'{{eventName}}'}</code
								>
								becomes the event's title. Preview:
								<span class="text-gray-600">{subjectPreview}</span>
							</p>
						</div>

						<div class="mb-4">
							<label for="fb-body" class="mb-1.5 block text-xs font-medium text-[#666769]">
								Body <span class="font-normal text-gray-400">(optional)</span>
							</label>
							<textarea
								id="fb-body"
								bind:value={customMessage}
								rows="3"
								maxlength="900"
								disabled={alreadySent}
								placeholder="Add your custom message here."
								class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
							></textarea>
							<p class="mt-1.5 text-[11px] text-gray-400">
								Replaces our default wording. Leave it empty and we'll write it for you.
							</p>
						</div>

						<div class="mb-4">
							<label for="fb-question" class="mb-1.5 block text-xs font-medium text-[#666769]">
								The question <span class="font-normal text-gray-400">(optional)</span>
							</label>
							<input
								id="fb-question"
								type="text"
								bind:value={question}
								maxlength="200"
								disabled={alreadySent}
								placeholder="What did you think of {eventTitle || 'the event'}?"
								class="h-[42px] w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
							/>
						</div>

						<!-- Exactly what lands in the inbox. -->
						<div class="rounded-xl border border-dashed border-gray-200 bg-white p-4">
							<p class="mb-3 text-[10px] tracking-wide text-gray-400 uppercase">Preview</p>
							<p class="text-center text-base font-semibold text-gray-900">{questionPreview}</p>
							<div class="mt-3 flex items-start justify-center gap-2">
								{#each FEEDBACK_RATINGS as r}
									<div class="text-center">
										<span
											class="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-[#F6F6F9] text-2xl"
										>
											{r.emoji}
										</span>
										<span class="mt-1.5 block text-[10px] text-[#A5A6A6]">{r.label}</span>
									</div>
								{/each}
							</div>
							<p class="mt-3 text-center text-[11px] text-[#B9BABA]">
								One tap records the rating. The page that opens invites a comment.
							</p>
						</div>
					</div>

					{#if error}
						<p class="mt-4 text-sm text-red-500">{error}</p>
					{/if}
				{/if}
			</div>

			<!-- Footer -->
			<div
				class="border-t border-gray-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
			>
				<div class="flex flex-wrap items-center gap-2">
					{#if successMsg}
						<span class="flex items-center gap-1.5 text-xs font-medium text-[#3CBD2C]">
							<Icon icon="mdi:check-circle" class="text-base" />
							{successMsg}
						</span>
					{:else if settings?.feedback?.enabled && settings.feedback.scheduledAt && !alreadySent}
						{@const scheduledLabel = fmtDate(settings.feedback.scheduledAt)}
						<span class="text-xs text-[#A5A6A6]">Scheduled for {scheduledLabel}</span>
					{/if}

					<div class="ml-auto flex items-center gap-2">
						{#if settings?.feedback?.enabled && !alreadySent}
							<button
								on:click={() => save(false)}
								disabled={saving}
								class="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#626365] transition hover:bg-gray-50 disabled:opacity-40"
							>
								Cancel send
							</button>
						{/if}
						<button
							on:click={() => save(true)}
							disabled={alreadySent ? saving : !canSchedule}
							class="flex items-center justify-center gap-2 rounded-lg bg-[#131517] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2A2B30] disabled:cursor-not-allowed disabled:bg-[#969798]"
						>
							{#if saving}
								<Icon icon="mdi:loading" class="animate-spin text-base" /> Saving…
							{:else if alreadySent}
								<Icon icon="mdi:content-save-outline" class="text-base" /> Save changes
							{:else}
								<Icon icon="mdi:bell-outline" class="text-base" />
								{settings?.feedback?.enabled ? 'Update schedule' : 'Schedule feedback email'}
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
