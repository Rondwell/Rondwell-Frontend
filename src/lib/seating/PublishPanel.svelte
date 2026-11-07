<script lang="ts">
	/**
	 * Publish pre-flight.
	 *
	 * Publishing used to be a one-line status flip that created no
	 * inventory, so there was nothing to report and no way to be wrong.
	 * Now it materializes seats, which means it can legitimately refuse —
	 * duplicate labels, a renamed seat somebody already holds a ticket
	 * for, a tier with no ticket type.
	 *
	 * Those are all things only the organizer can fix, so the report is
	 * rendered as a checklist naming the offending seats rather than
	 * collapsed into a toast. The same report comes back from the dry run,
	 * so the problems are visible *before* committing.
	 */
	import Icon from '@iconify/svelte';
	import type { MaterializationReport } from './types';

	export let open = false;
	export let report: MaterializationReport | null = null;
	export let loading = false;
	export let publishing = false;
	/** Already-live layouts get "Update" rather than "Publish". */
	export let isPublished = false;
	export let onPublish: () => void = () => {};
	export let onClose: () => void = () => {};

	$: blocked = (report?.errors?.length ?? 0) > 0;
	$: canPublish = !!report && !blocked && report.generated > 0;

	const ERROR_TITLE: Record<string, string> = {
		DUPLICATE_LABELS: 'Duplicate seat labels',
		LABEL_CONFLICT_WITH_BOOKED: 'Would rename sold seats',
		NO_SEATS: 'No seats to publish',
		TOO_MANY_SEATS: 'Too many seats',
		SEAT_TYPE_WITHOUT_TICKET_TYPE: 'Seat type not for sale',
		UNKNOWN_SEAT_TYPE: 'Missing seat type'
	};

	/** What each blocking error means and how to clear it. */
	const ERROR_FIX: Record<string, string> = {
		DUPLICATE_LABELS:
			'Two seats cannot share a label. Give the blocks different sections, or switch the label format to include the section.',
		LABEL_CONFLICT_WITH_BOOKED:
			'These seats are already sold or held, and their attendees’ tickets show the old label. Move those attendees first, or leave the labelling alone.',
		NO_SEATS: 'Add a seat row, block or table before publishing.',
		TOO_MANY_SEATS: 'Split the venue across fewer seats, or contact support to raise the limit.',
		SEAT_TYPE_WITHOUT_TICKET_TYPE: 'Attach a ticket type to each seat type so its seats can be priced.',
		UNKNOWN_SEAT_TYPE: 'Some elements point at a seat type that was deleted. Reassign them.'
	};
</script>

{#if open}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
			<div class="flex items-start justify-between border-b px-5 py-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">
						{isPublished ? 'Update the live seat map' : 'Publish the seat map'}
					</h2>
					<p class="mt-0.5 text-xs text-gray-500">
						Publishing creates the bookable seats attendees choose from.
					</p>
				</div>
				<button
					type="button"
					aria-label="Close"
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-gray-500 hover:bg-gray-50"
					on:click={onClose}
				>
					<Icon icon="mdi:close" class="h-4 w-4" />
				</button>
			</div>

			<div class="flex-1 overflow-y-auto px-5 py-4">
				{#if loading}
					<div class="flex items-center gap-3 py-8 text-sm text-gray-500">
						<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
						Checking the design…
					</div>
				{:else if !report}
					<p class="py-8 text-sm text-gray-500">
						Save the layout first so it can be checked.
					</p>
				{:else}
					<!-- Counts -->
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
						<div class="rounded-lg border bg-gray-50 p-2.5">
							<p class="text-lg font-semibold text-gray-900">
								{report.generated.toLocaleString()}
							</p>
							<p class="text-[11px] text-gray-500">total seats</p>
						</div>
						<div class="rounded-lg border bg-emerald-50 p-2.5">
							<p class="text-lg font-semibold text-emerald-700">
								{report.created.toLocaleString()}
							</p>
							<p class="text-[11px] text-emerald-600">new</p>
						</div>
						<div class="rounded-lg border bg-amber-50 p-2.5">
							<p class="text-lg font-semibold text-amber-700">
								{report.removed.toLocaleString()}
							</p>
							<p class="text-[11px] text-amber-600">removed</p>
						</div>
						<div class="rounded-lg border bg-blue-50 p-2.5">
							<p class="text-lg font-semibold text-blue-700">
								{report.preserved.toLocaleString()}
							</p>
							<p class="text-[11px] text-blue-600">sold / held</p>
						</div>
					</div>

					{#if report.preserved > 0}
						<p class="mt-2 text-[11px] text-gray-500">
							Seats that are already sold or held keep their labels and their attendees.
						</p>
					{/if}

					<!-- Blocking errors -->
					{#if report.errors?.length}
						<div class="mt-4 space-y-3">
							{#each report.errors as err}
								<div class="rounded-lg border border-red-200 bg-red-50 p-3">
									<div class="flex items-start gap-2">
										<Icon
											icon="mdi:alert-circle"
											class="mt-0.5 h-4 w-4 shrink-0 text-red-500"
										/>
										<div class="min-w-0">
											<p class="text-sm font-semibold text-red-800">
												{ERROR_TITLE[err.code] ?? 'Problem'}
											</p>
											<p class="mt-0.5 text-xs text-red-700">{err.message}</p>
											{#if ERROR_FIX[err.code]}
												<p class="mt-1 text-xs text-red-600">{ERROR_FIX[err.code]}</p>
											{/if}
											{#if err.detail?.length}
												<div class="mt-1.5 flex flex-wrap gap-1">
													{#each err.detail.slice(0, 24) as d}
														<span
															class="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-red-700 ring-1 ring-red-200"
														>
															{d}
														</span>
													{/each}
													{#if err.detail.length > 24}
														<span class="px-1 text-[10px] text-red-600">
															+{err.detail.length - 24} more
														</span>
													{/if}
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Non-blocking warnings -->
					{#if report.warnings?.length}
						<div class="mt-3 space-y-2">
							{#each report.warnings as w}
								<div class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
									<Icon icon="mdi:alert-outline" class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
									<p class="text-xs text-amber-800">{w}</p>
								</div>
							{/each}
						</div>
					{/if}

					{#if !report.errors?.length && !report.warnings?.length}
						<div class="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
							<Icon icon="mdi:check-circle" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
							<p class="text-xs text-emerald-800">
								This design is ready. Attendees will be able to pick any of its
								{report.generated.toLocaleString()} seats.
							</p>
						</div>
					{/if}

					{#if isPublished}
						<p class="mt-3 text-[11px] text-gray-500">
							This event already has a live seat map. Publishing replaces it, and the previous
							design is archived.
						</p>
					{/if}
				{/if}
			</div>

			<div class="flex items-center justify-end gap-2 border-t px-5 py-3">
				<button type="button" class="rounded-lg border px-3 py-2 text-sm" on:click={onClose}>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-lg bg-gradient-to-r from-pink-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!canPublish || publishing}
					on:click={onPublish}
				>
					{#if publishing}
						<Icon icon="mdi:loading" class="mr-1 inline h-4 w-4 animate-spin" />
						Publishing…
					{:else if blocked}
						Fix the problems above
					{:else}
						{isPublished ? 'Update live map' : 'Publish'}
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
