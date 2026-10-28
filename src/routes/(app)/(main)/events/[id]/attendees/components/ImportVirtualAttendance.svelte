<script lang="ts">
	/**
	 * Import virtual attendance from the conferencing provider.
	 *
	 * ── Why this closes the biggest gap in the product ─────────────────────
	 *
	 * A physical event produces real attendance: someone scans a QR code and the
	 * attendee flips to `CHECKED_IN`. A virtual event produced none — the
	 * organizer could see who registered and had no idea who actually turned up.
	 * This pulls Zoom's participant report onto the same `CHECKED_IN` state a
	 * door scan produces, so the attendee list, exports and analytics all work
	 * on a virtual event without knowing it was virtual.
	 *
	 * ── Why the result is reported in full, including the misses ───────────
	 *
	 * Zoom reports whatever email someone was signed in with, which is often not
	 * the one they registered with. A summary that showed only "42 marked
	 * present" would quietly understate a 60-person event and look authoritative
	 * doing it. The unmatched count and a sample of those identities are shown
	 * next to the success number, so the organizer can see the real shape of the
	 * data and reconcile by hand if they care to.
	 *
	 * Only rendered for a finished virtual or hybrid event: Zoom's report returns
	 * nothing useful mid-meeting, and offering the button then just produces an
	 * error.
	 */
	import Icon from '@iconify/svelte';
	import {
		importMeetingAttendance,
		type AttendanceImportResult
	} from '$lib/services/calendar.services';
	import { toast } from '$lib/stores/toast.store';

	export let eventId: string;
	/** The loaded event, for the eligibility checks below. */
	export let event: {
		eventType?: string;
		endDateTime?: string;
		locationDetails?: { virtual?: { platformKey?: string; meetingId?: string } };
		provisionedMeeting?: { provider?: string };
	} | null = null;
	/** Called after a successful import so the list can refresh. */
	export let onImported: (() => void) | undefined = undefined;

	let importing = false;
	let result: AttendanceImportResult | null = null;
	let minMinutes = 2;

	$: isVirtual = event?.eventType === 'VIRTUAL' || event?.eventType === 'HYBRID';
	$: hasEnded = event?.endDateTime
		? new Date(event.endDateTime).getTime() < Date.now()
		: false;
	/**
	 * Zoom only, for now.
	 *
	 * Google Meet's attendance report is available through the Admin SDK reports
	 * API, which needs Workspace-admin consent the organizer usually does not
	 * have. Teams' is in Graph but only for the meeting organizer's own tenant.
	 * Offering a button for either would mostly produce permission errors, so
	 * this stays scoped to the provider where it reliably works.
	 */
	$: isZoom =
		event?.provisionedMeeting?.provider === 'ZOOM' ||
		event?.locationDetails?.virtual?.platformKey === 'ZOOM';
	$: eligible = isVirtual && hasEnded && isZoom;

	async function run() {
		importing = true;
		try {
			result = await importMeetingAttendance(eventId, minMinutes);
			if (result.matched > 0) {
				toast.success(`${result.matched} attendee${result.matched === 1 ? '' : 's'} marked present.`);
				onImported?.();
			} else {
				toast.info('No new attendees were matched. See the breakdown below.');
			}
		} catch (e: any) {
			toast.error(e?.message ?? 'Could not import attendance');
		} finally {
			importing = false;
		}
	}
</script>

{#if eligible}
	<div class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex items-start gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50"
				>
					<Icon icon="logos:zoom-icon" class="text-[20px]" />
				</div>
				<div>
					<h3 class="text-sm font-semibold text-gray-900">Import attendance from Zoom</h3>
					<p class="mt-0.5 max-w-xl text-xs text-gray-500">
						Marks registered attendees who actually joined the meeting as checked in —
						the same state a QR scan produces at a physical event.
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<label for="min-minutes" class="whitespace-nowrap text-xs text-gray-500">
					Min. minutes
				</label>
				<select
					id="min-minutes"
					bind:value={minMinutes}
					disabled={importing}
					class="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-gray-400 focus:outline-none disabled:opacity-50"
				>
					<option value={0}>Any</option>
					<option value={2}>2</option>
					<option value={5}>5</option>
					<option value={15}>15</option>
					<option value={30}>30</option>
				</select>
				<button
					type="button"
					disabled={importing}
					on:click={run}
					class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
				>
					{#if importing}
						<Icon icon="mdi:loading" class="animate-spin text-[14px]" />
						Importing…
					{:else}
						<Icon icon="mdi:account-check-outline" class="text-[14px]" />
						Import attendance
					{/if}
				</button>
			</div>
		</div>

		{#if result}
			<div class="mt-4 border-t border-gray-100 pt-4">
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{#each [
						{ label: 'Marked present', value: result.matched, tone: 'text-green-700' },
						{ label: 'Already checked in', value: result.alreadyCheckedIn, tone: 'text-gray-700' },
						{ label: 'Not matched', value: result.unmatched, tone: 'text-amber-700' },
						{ label: `Under ${minMinutes}m`, value: result.belowThreshold, tone: 'text-gray-500' }
					] as stat (stat.label)}
						<div class="rounded-lg bg-[#FBFBFD] px-3 py-2.5">
							<div class="text-lg font-semibold {stat.tone}">{stat.value}</div>
							<div class="text-[11px] text-gray-500">{stat.label}</div>
						</div>
					{/each}
				</div>

				{#if result.unmatched > 0}
					<div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
						<p class="text-xs text-amber-900">
							<Icon icon="mdi:information-outline" class="mr-1 inline text-sm" />
							{result.unmatched} participant{result.unmatched === 1 ? '' : 's'} joined with
							an email that doesn't match a registration — usually because they signed
							into Zoom with a different account, or joined without signing in.
						</p>
						{#if result.unmatchedSample.length}
							<p class="mt-1.5 break-words font-mono text-[11px] text-amber-800">
								{result.unmatchedSample.join(' · ')}{result.unmatched >
								result.unmatchedSample.length
									? ` … and ${result.unmatched - result.unmatchedSample.length} more`
									: ''}
							</p>
						{/if}
					</div>
				{/if}

				<p class="mt-2 text-[11px] text-gray-400">
					Zoom reported {result.participantsReported} unique participant{result.participantsReported ===
					1
						? ''
						: 's'} for meeting {result.meetingId}. Rejoins are merged before the minimum is
					applied.
				</p>
			</div>
		{/if}
	</div>
{/if}
