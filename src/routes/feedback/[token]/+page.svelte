<!--
	Post-event feedback response page.

	Reached from the emailed link. There is no login: the signed token in the
	URL is bound to one attendee and one event, and it is the only thing that
	says who is answering — nothing here is taken on trust from the page.

	Two shapes of arrival:
	  · `?rating=4` — the attendee already tapped a face in the email. The score
	    is recorded IMMEDIATELY on load, because that tap was a complete answer.
	    The page then just invites a comment.
	  · no rating — they clicked "leave a comment". They pick a face here first.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import {
		FEEDBACK_RATINGS,
		resolveFeedbackLink,
		submitFeedback,
		type FeedbackLinkContext
	} from '$lib/services/eventEmailSettings.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let loading = true;
	let error = '';
	let context: FeedbackLinkContext | null = null;

	let rating = 0;
	let comment = '';
	let submitting = false;
	/** True once a rating is safely stored, which is what makes this "done". */
	let recorded = false;
	let commentSaved = false;

	$: token = $page.params.token ?? '';

	onMount(async () => {
		try {
			context = await resolveFeedbackLink(token);

			// Restore an earlier answer so a second visit shows what they said
			// rather than an empty form that looks like it was never submitted.
			if (context.existing) {
				rating = context.existing.rating;
				comment = context.existing.comment ?? '';
				recorded = true;
			}

			// The tap in the email is the answer. Persist it before anything
			// else — most people never scroll past this point.
			const fromEmail = Number($page.url.searchParams.get('rating'));
			if (Number.isInteger(fromEmail) && fromEmail >= 1 && fromEmail <= 5) {
				rating = fromEmail;
				await persist(fromEmail, undefined);
			}
		} catch (e: any) {
			error = e?.message || 'That feedback link is not valid.';
		} finally {
			loading = false;
		}
	});

	async function persist(nextRating: number, nextComment?: string) {
		submitting = true;
		error = '';
		try {
			await submitFeedback(token, { rating: nextRating, comment: nextComment });
			recorded = true;
			if (nextComment !== undefined) commentSaved = true;
		} catch (e: any) {
			error = e?.message || 'Could not record that — please try again.';
		} finally {
			submitting = false;
		}
	}

	async function chooseRating(value: number) {
		rating = value;
		commentSaved = false;
		await persist(value, comment.trim() || undefined);
	}

	async function sendComment() {
		if (!rating) {
			error = 'Pick a face first so we know how it went.';
			return;
		}
		await persist(rating, comment.trim() || undefined);
	}
</script>

<svelte:head>
	<title>{context ? `Feedback · ${context.eventName}` : 'Event feedback'} — Rondwell</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#F2F2F5] px-4 py-10">
	<div class="w-full max-w-lg">
		<!-- Brand -->
		<a href="/" class="mb-6 flex items-center justify-center gap-2">
			<img src="/logo.svg" alt="Rondwell" class="h-7 w-auto" />
		</a>

		<div class="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(20,21,26,0.04),0_12px_32px_rgba(20,21,26,0.06)]">
			<div class="h-1 bg-gradient-to-r from-[#DB3EC6] via-[#963DD4] to-[#513BE2]"></div>

			{#if loading}
				<div class="space-y-4 p-8">
					<div class="h-6 w-2/3 animate-pulse rounded bg-gray-100"></div>
					<div class="h-16 animate-pulse rounded-xl bg-gray-100"></div>
					<div class="h-24 animate-pulse rounded-xl bg-gray-100"></div>
				</div>
			{:else if error && !context}
				<div class="p-8 text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FDEAEA]">
						<Icon icon="mdi:link-variant-off" class="text-xl text-[#E53935]" />
					</div>
					<h1 class="text-lg font-semibold text-gray-900">This link isn't valid</h1>
					<p class="mx-auto mt-2 max-w-sm text-sm text-[#8A8B95]">{error}</p>
					<a
						href="/discover"
						class="mt-6 inline-block rounded-xl bg-[#131517] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2A2B30]"
					>
						Discover events
					</a>
				</div>
			{:else if context}
				{#if context.eventImageUrl}
					<img src={context.eventImageUrl} alt={context.eventName} class="h-40 w-full object-cover" />
				{/if}

				<div class="p-6 sm:p-8">
					<p class="text-[11px] font-semibold tracking-[0.14em] text-[#DB3EC6] uppercase">
						Your turn
					</p>
					<h1 class="mt-3 text-2xl leading-tight font-bold tracking-[-0.02em] text-[#14151A]">
						{context.question || `What did you think of ${context.eventName}?`}
					</h1>
					<p class="mt-2 text-sm leading-relaxed text-[#5C5D67]">
						{context.attendeeName ? `${context.attendeeName}, thanks` : 'Thanks'} for coming to
						{context.eventName}.
						{context.organizerName ? `${context.organizerName} reads` : 'The organizer reads'} every
						response.
					</p>

					<!-- Rating -->
					<div class="mt-7 flex items-start justify-center gap-1.5 sm:gap-3">
						{#each FEEDBACK_RATINGS as r}
							<button
								type="button"
								on:click={() => chooseRating(r.value)}
								disabled={submitting}
								aria-label={r.label}
								aria-pressed={rating === r.value}
								class="group flex-1 text-center disabled:opacity-60"
							>
								<span
									class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border text-3xl transition sm:h-16 sm:w-16 {rating ===
									r.value
										? 'border-[#131517] bg-[#F6F6F9] ring-2 ring-[#131517]'
										: 'border-gray-100 bg-[#F6F6F9] group-hover:border-gray-300'}"
								>
									{r.emoji}
								</span>
								<span
									class="mt-2 block text-[10px] sm:text-[11px] {rating === r.value
										? 'font-medium text-[#14151A]'
										: 'text-[#A5A6A6]'}"
								>
									{r.label}
								</span>
							</button>
						{/each}
					</div>

					{#if recorded}
						<div
							class="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#F1FAF0] px-4 py-2.5 text-sm text-[#2C7A22]"
						>
							<Icon icon="mdi:check-circle" class="text-base" />
							{commentSaved ? 'Thanks — your feedback is in.' : 'Rating saved. Anything else?'}
						</div>
					{/if}

					<!-- Comment -->
					<div class="mt-6">
						<label for="fb-comment" class="mb-1.5 block text-xs font-medium text-[#666769]">
							Anything you'd like to add? <span class="font-normal text-gray-400">(optional)</span>
						</label>
						<textarea
							id="fb-comment"
							bind:value={comment}
							on:input={() => (commentSaved = false)}
							rows="4"
							maxlength="2000"
							placeholder="What worked, what didn't, what you'd want next time…"
							class="w-full resize-none rounded-xl border border-gray-200 bg-[#FAFAFC] px-3.5 py-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
						></textarea>
						<p class="mt-1 text-right text-[11px] text-gray-400">{comment.length}/2000</p>
					</div>

					{#if error}
						<p class="mt-3 text-sm text-red-500">{error}</p>
					{/if}

					<button
						on:click={sendComment}
						disabled={submitting || !rating}
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#131517] py-3.5 text-sm font-medium text-white transition hover:bg-[#2A2B30] disabled:cursor-not-allowed disabled:bg-[#969798]"
					>
						{#if submitting}
							<Icon icon="mdi:loading" class="animate-spin text-base" /> Sending…
						{:else}
							<Icon icon="mdi:send-outline" class="text-base" />
							{commentSaved ? 'Update my feedback' : 'Send feedback'}
						{/if}
					</button>

					<p class="mt-4 text-center text-[11px] leading-relaxed text-[#A5A6A6]">
						Your answer goes to {context.organizerName || 'the organizer'} of {context.eventName}.
						It is linked to {context.attendeeEmail}.
					</p>
				</div>
			{/if}
		</div>

		<p class="mt-5 text-center text-[11px] text-[#AFB0B9]">
			Powered by <a href="/" class="text-[#8A8B95] hover:underline">Rondwell</a>
		</p>
	</div>
</div>
