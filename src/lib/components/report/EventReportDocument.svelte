<script lang="ts">
	/**
	 * Printable event report.
	 *
	 * Renders the complete event record as real, styled HTML and hands it to the
	 * browser's print engine ("Save as PDF"). Chosen over a canvas-rasterising
	 * library because it keeps text as vector text — selectable, searchable and
	 * sharp at any zoom — handles page breaks and repeating table headers
	 * natively, and adds no dependency or bundle weight.
	 *
	 * The document is always in the DOM but visually hidden; `@media print`
	 * hides the app and reveals this instead, so what prints is exactly what is
	 * composed here.
	 *
	 * Data comes from the same `EventReportSources` the CSV uses, so the two
	 * formats can never disagree.
	 */
	import { onDestroy, onMount } from 'svelte';
	import type { EventReportSources } from '$lib/utils/eventReport';
	import { customAnswerLabels, customAnswerValue } from '$lib/utils/eventReport';
	import ReportTable from './ReportTable.svelte';

	export let src: EventReportSources | null = null;
	/** Row cap per table so a 5,000-attendee event doesn't print 400 pages. */
	export let maxRowsPerTable = 250;

	let rootEl: HTMLDivElement | null = null;
	let printRoot: HTMLDivElement | null = null;

	/**
	 * Move the report to a direct child of <body>.
	 *
	 * The print rule hides every top-level body child except this wrapper, which
	 * only works if the report actually is one — rendered in place it would sit
	 * deep inside the app shell and be hidden along with it.
	 */
	onMount(() => {
		if (typeof document === 'undefined' || !rootEl) return;
		printRoot = document.getElementById('rondwell-print-root') as HTMLDivElement | null;
		if (!printRoot) {
			printRoot = document.createElement('div');
			printRoot.id = 'rondwell-print-root';
			document.body.appendChild(printRoot);
		}
		printRoot.appendChild(rootEl);
	});

	onDestroy(() => {
		// Svelte can no longer clean up a node it does not own, so remove it here.
		rootEl?.remove();
		if (printRoot && printRoot.childElementCount === 0) printRoot.remove();
	});

	/**
	 * Print the report.
	 *
	 * Flags <html> so the global print rule applies only for this job, waits a
	 * frame so styles settle, then restores state once the dialog closes.
	 * `afterprint` covers the normal path; the timeout is a fallback for
	 * browsers that fire it unreliably.
	 */
	export async function print(): Promise<void> {
		if (typeof window === 'undefined') return;

		const html = document.documentElement;
		html.classList.add('printing-report');

		// Let layout and fonts settle before handing off to the print engine.
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		if (document.fonts?.ready) {
			try {
				await document.fonts.ready;
			} catch {
				/* fonts API unavailable — proceed */
			}
		}

		const cleanup = () => {
			html.classList.remove('printing-report');
			window.removeEventListener('afterprint', cleanup);
		};
		window.addEventListener('afterprint', cleanup);

		try {
			window.print();
		} finally {
			// Safety net: some browsers never fire afterprint.
			setTimeout(cleanup, 1500);
		}
	}

	$: ev = src?.event ?? {};
	$: a = src?.analytics ?? {};
	$: reg = a?.registrations ?? {};
	$: tk = a?.tickets ?? {};
	$: currency = (tk?.currency ?? 'NGN').toUpperCase();
	$: generatedAt = new Date().toLocaleString();

	const fmtLocal = (v: any) => {
		if (!v) return '';
		const d = new Date(v);
		return isNaN(d.getTime()) ? '' : d.toLocaleString();
	};
	const fmtDay = (v: any) => {
		if (!v) return '';
		const d = new Date(v);
		return isNaN(d.getTime())
			? ''
			: d.toLocaleDateString(undefined, {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				});
	};
	/** Amounts are stored in minor units (kobo/cents) platform-wide. */
	const money = (minor: any, cur = currency) => {
		const n = Number(minor);
		if (!isFinite(n)) return '—';
		return `${cur} ${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
	};
	const num = (v: any) => (v === null || v === undefined ? '0' : Number(v).toLocaleString());
	const pct = (part: number, whole: number) =>
		whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '—';

	$: physical = ev?.locationDetails?.physical;
	$: virtual = ev?.locationDetails?.virtual;
	$: venue =
		physical?.venueName || physical?.resolvedAddress?.formatted_address || virtual?.platform || '—';

	$: title = ev?.title ?? a?.eventTitle ?? 'Event Report';

	// Headline figures for the cover.
	$: kpis = [
		{ label: 'Total Registrations', value: num(reg.total) },
		{ label: 'Attending', value: num(reg.attending) },
		{ label: 'Checked In', value: num(reg.checkedIn) },
		{ label: 'Tickets Sold', value: num(tk.totalSold ?? tk.sold) },
		{ label: 'Gross Revenue', value: money(tk.grossRevenueKobo ?? tk.grossRevenue ?? tk.revenue) },
		{ label: 'Check-in Rate', value: pct(reg.checkedIn ?? 0, reg.total ?? 0) }
	];

	$: summaryRows = [
		['Event ID', ev?._id ?? ev?.id ?? '—'],
		['Organizer', ev?.eventOrganizerName ?? '—'],
		['Category', ev?.category ?? '—'],
		['Event type', ev?.eventType ?? '—'],
		['Registration type', ev?.registrationType ?? '—'],
		['Status', ev?.eventStatus ?? '—'],
		['Visibility', ev?.visibility ?? '—'],
		['Starts', fmtLocal(ev?.startDateTime) || '—'],
		['Ends', fmtLocal(ev?.endDateTime) || '—'],
		['Time zone', ev?.timeZone ?? '—'],
		['Venue', venue],
		['Address', physical?.resolvedAddress?.formatted_address ?? physical?.venueAddress ?? '—'],
		['Capacity', ev?.maxAttendees ? num(ev.maxAttendees) : 'Unlimited'],
		['Capacity used', ev?.maxAttendees ? pct(reg.attending ?? 0, ev.maxAttendees) : '—'],
		['Registration deadline', fmtLocal(ev?.registrationDeadline) || '—'],
		['Registration open', ev?.registrationOpen === false ? 'No' : 'Yes'],
		['Waitlist', ev?.waitlistEnabled ? 'Enabled' : 'Disabled'],
		[
			'Group registration',
			ev?.groupRegistrationEnabled ? `Enabled (max ${ev?.maxGroupSize ?? '—'})` : 'Disabled'
		],
		['Check-in', ev?.checkinSettings?.isCheckinEnabled ? 'Enabled' : 'Disabled'],
		['Public link', ev?.customLinkSlug ? `rondwell.com/e/${ev.customLinkSlug}` : '—']
	] as [string, string][];

	$: statusRows = [
		{ status: 'Attending', count: reg.attending ?? 0 },
		{ status: 'Pending', count: reg.pending ?? 0 },
		{ status: 'Checked In', count: reg.checkedIn ?? 0 },
		{ status: 'Waitlisted', count: reg.waitlisted ?? 0 },
		{ status: 'Declined', count: reg.declined ?? 0 },
		{ status: 'Cancelled', count: reg.cancelled ?? 0 }
	].filter((r) => r.count > 0);

	$: totalStatus = statusRows.reduce((s, r) => s + r.count, 0);

	$: ticketRows = (a?.tickets?.byType?.length ? a.tickets.byType : src?.ticketTypes ?? []) as any[];

	$: financeRows = [
		['Currency', currency],
		['Gross revenue', money(tk.grossRevenueKobo ?? tk.grossRevenue ?? tk.revenue)],
		['Net revenue', money(tk.netRevenueKobo ?? tk.netRevenue)],
		['Platform fees', money(tk.platformFeesKobo ?? tk.platformFees)],
		['Refunded', money(tk.refundedKobo ?? tk.refunded)],
		['Average ticket price', money(tk.averagePriceKobo ?? tk.averageTicketPrice ?? tk.averagePrice)]
	] as [string, string][];

	// Custom registration questions become extra attendee columns.
	$: customLabels = customAnswerLabels(src?.attendees ?? []);

	$: attendeeColumns = [
		{ header: 'Name', value: (x: any) => [x.firstName, x.lastName].filter(Boolean).join(' ') },
		{ header: 'Email', value: (x: any) => x.email },
		{ header: 'Status', value: (x: any) => x.attendeeStatus },
		{ header: 'Ticket', value: (x: any) => x.ticketTypeName ?? x.ticketType?.name },
		{ header: 'Seat', value: (x: any) => x.seatLabel ?? x.seat?.label },
		{ header: 'Registered', value: (x: any) => fmtDay(x.createdAt) },
		...customLabels.map((l) => ({ header: l, value: (x: any) => customAnswerValue(x, l) }))
	];

	$: seats = src?.seats?.seats ?? [];
	$: seatsTaken = seats.filter((s: any) => s.status && s.status !== 'AVAILABLE').length;

	$: engagement = a?.engagement ?? {};
	$: comms = a?.communications ?? {};
	$: engagementRows = [
		['Page views', num(engagement.pageViews ?? engagement.views)],
		['Unique visitors', num(engagement.uniqueVisitors)],
		['Shares', num(engagement.shares)],
		['Community posts', num(engagement.communityPosts ?? engagement.posts)],
		['Comments', num(engagement.comments)],
		['Emails sent', num(comms.emailsSent ?? comms.sent)],
		['Emails opened', num(comms.emailsOpened ?? comms.opened)],
		['Open rate', comms.openRate != null ? `${comms.openRate}%` : '—'],
		['Waitlist size', num(a?.waitlist?.total)],
		['Waitlist promoted', num(a?.waitlist?.promoted)]
	] as [string, string][];

	$: feedbackSummary = src?.feedback?.summary ?? {};
</script>

<div class="report-root" id="rondwell-event-report" aria-hidden="true" bind:this={rootEl}>
	<!-- ── Cover ── -->
	<header class="cover">
		<div class="cover-brand">
			<span class="brand-mark">Rondwell</span>
			<span class="brand-kicker">Event Report</span>
		</div>

		<h1 class="cover-title">{title}</h1>

		<p class="cover-sub">
			{fmtDay(ev?.startDateTime) || 'Date not set'}{venue && venue !== '—' ? ` · ${venue}` : ''}
		</p>

		<div class="kpi-grid">
			{#each kpis as k}
				<div class="kpi">
					<span class="kpi-value">{k.value}</span>
					<span class="kpi-label">{k.label}</span>
				</div>
			{/each}
		</div>

		<p class="cover-meta">Generated {generatedAt}</p>
	</header>

	<!-- ── 1. Event summary ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">01</span> Event Summary</h2>
		<dl class="kv">
			{#each summaryRows as [k, v]}
				<div class="kv-row">
					<dt>{k}</dt>
					<dd>{v}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<!-- ── 2. Registrations ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">02</span> Registrations</h2>

		{#if statusRows.length > 0}
			<!-- Pure-CSS bar chart: prints reliably, no canvas rasterising. -->
			<div class="bars">
				{#each statusRows as r}
					<div class="bar-row">
						<span class="bar-label">{r.status}</span>
						<span class="bar-track">
							<span
								class="bar-fill"
								style="width: {totalStatus ? (r.count / totalStatus) * 100 : 0}%"
							></span>
						</span>
						<span class="bar-value">{num(r.count)} · {pct(r.count, totalStatus)}</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty">No registration data.</p>
		{/if}
	</section>

	<!-- ── 3. Tickets & finance ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">03</span> Tickets &amp; Revenue</h2>
		<ReportTable
			title="Sales by ticket type"
			rows={ticketRows}
			numericColumns={['Price', 'Sold', 'Available', 'Revenue']}
			columns={[
				{ header: 'Ticket Type', value: (t) => t.name ?? t.ticketTypeName ?? t.title },
				{ header: 'Price', value: (t) => money(t.priceKobo ?? t.price) },
				{ header: 'Sold', value: (t) => num(t.sold ?? t.count ?? t.quantitySold) },
				{
					header: 'Available',
					value: (t) => t.available ?? t.remaining ?? t.quantityAvailable ?? t.quantity
				},
				{ header: 'Revenue', value: (t) => money(t.revenueKobo ?? t.revenue) }
			]}
			emptyText="No ticket types configured."
		/>

		<dl class="kv">
			{#each financeRows as [k, v]}
				<div class="kv-row">
					<dt>{k}</dt>
					<dd>{v}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<!-- ── 4. Attendees ── -->
	<section class="break-before block">
		<h2 class="block-title"><span class="block-num">04</span> Attendee List</h2>
		<ReportTable
			rows={src?.attendees ?? []}
			columns={attendeeColumns}
			maxRows={maxRowsPerTable}
			emptyText="No attendees recorded."
		/>
	</section>

	<!-- ── 5. Seating ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">05</span> Seating</h2>
		{#if src?.seats?.layout}
			<dl class="kv">
				<div class="kv-row">
					<dt>Layout</dt>
					<dd>{src.seats.layout?.name ?? '—'}</dd>
				</div>
				<div class="kv-row">
					<dt>Total seats</dt>
					<dd>{num(seats.length)}</dd>
				</div>
				<div class="kv-row">
					<dt>Assigned / unavailable</dt>
					<dd>{num(seatsTaken)}</dd>
				</div>
				<div class="kv-row">
					<dt>Free</dt>
					<dd>{num(seats.length - seatsTaken)}</dd>
				</div>
			</dl>
			<ReportTable
				title="Seat allocation"
				rows={seats}
				maxRows={maxRowsPerTable}
				columns={[
					{ header: 'Seat', value: (s) => s.label ?? s.seatNumber },
					{ header: 'Section', value: (s) => s.section ?? s.sectionName },
					{ header: 'Row', value: (s) => s.row },
					{ header: 'Status', value: (s) => s.status },
					{ header: 'Assigned To', value: (s) => s.attendeeEmail ?? s.assignedTo }
				]}
				emptyText="No seats defined."
			/>
		{:else}
			<p class="empty">No seat map configured for this event.</p>
		{/if}
	</section>

	<!-- ── 6. Admins ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">06</span> Admins &amp; Access</h2>
		<ReportTable
			rows={src?.admins ?? []}
			columns={[
				{
					header: 'Name',
					value: (x) => x.name ?? [x.firstName, x.lastName].filter(Boolean).join(' ')
				},
				{ header: 'Email', value: (x) => x.email },
				{ header: 'Role', value: (x) => x.role ?? x.roleName },
				{ header: 'Status', value: (x) => x.status ?? x.invitationStatus },
				{ header: 'Added', value: (x) => fmtDay(x.createdAt) }
			]}
			emptyText="No additional admins."
		/>
	</section>

	<!-- ── 7. Participants ── -->
	<section class="break-before block">
		<h2 class="block-title"><span class="block-num">07</span> Participants</h2>
		<ReportTable
			title="Speakers"
			rows={src?.participants?.speakers ?? []}
			columns={[
				{ header: 'Name', value: (x) => x.fullName ?? x.name },
				{ header: 'Title', value: (x) => x.title },
				{ header: 'Organisation', value: (x) => x.affiliation ?? x.company },
				{ header: 'Status', value: (x) => x.status ?? x.collaborationStatus }
			]}
			emptyText="No speakers."
		/>
		<ReportTable
			title="Exhibitors"
			rows={src?.participants?.exhibitors ?? []}
			columns={[
				{ header: 'Company', value: (x) => x.companyName ?? x.name },
				{ header: 'Industry', value: (x) => x.industry },
				{ header: 'Status', value: (x) => x.status ?? x.collaborationStatus }
			]}
			emptyText="No exhibitors."
		/>
		<ReportTable
			title="Vendors"
			rows={src?.participants?.vendors ?? []}
			columns={[
				{ header: 'Business', value: (x) => x.businessName ?? x.name },
				{ header: 'Type', value: (x) => x.businessType },
				{ header: 'Status', value: (x) => x.status ?? x.collaborationStatus }
			]}
			emptyText="No vendors."
		/>
	</section>

	<!-- ── 8. Schedule ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">08</span> Schedule</h2>
		<ReportTable
			title="Event days"
			rows={src?.eventDays ?? []}
			columns={[
				{ header: 'Day', value: (d) => d.title ?? d.name ?? d.label },
				{ header: 'Date', value: (d) => fmtDay(d.date ?? d.startDateTime) },
				{ header: 'Starts', value: (d) => fmtLocal(d.startTime ?? d.startDateTime) },
				{ header: 'Ends', value: (d) => fmtLocal(d.endTime ?? d.endDateTime) }
			]}
			emptyText="Single-day event."
		/>
		<ReportTable
			title="Sessions"
			rows={src?.sessions ?? []}
			maxRows={maxRowsPerTable}
			columns={[
				{ header: 'Session', value: (s) => s.title },
				{ header: 'Starts', value: (s) => fmtLocal(s.startTime ?? s.startDateTime) },
				{ header: 'Ends', value: (s) => fmtLocal(s.endTime ?? s.endDateTime) },
				{ header: 'Room', value: (s) => s.roomName ?? s.room?.name },
				{
					header: 'Speakers',
					value: (s) =>
						Array.isArray(s.speakers)
							? s.speakers.map((x: any) => x.fullName ?? x.name ?? x).join(', ')
							: ''
				}
			]}
			emptyText="No sessions scheduled."
		/>
	</section>

	<!-- ── 9. Planning ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">09</span> Planning Checklists</h2>
		<ReportTable
			rows={src?.checklists ?? []}
			columns={[
				{ header: 'Task', value: (c) => c.title },
				{ header: 'Status', value: (c) => c.status },
				{ header: 'Due', value: (c) => fmtDay(c.dueDate) },
				{
					header: 'Assigned To',
					value: (c) => (Array.isArray(c.assignedTo) ? c.assignedTo.join(', ') : c.assignedTo)
				}
			]}
			emptyText="No checklists created."
		/>
	</section>

	<!-- ── 10. Engagement ── -->
	<section class="break-before block">
		<h2 class="block-title"><span class="block-num">10</span> Engagement &amp; Communications</h2>
		<dl class="kv">
			{#each engagementRows as [k, v]}
				<div class="kv-row">
					<dt>{k}</dt>
					<dd>{v}</dd>
				</div>
			{/each}
		</dl>
		<ReportTable
			title="Daily activity"
			rows={a?.dailySnapshots ?? []}
			numericColumns={['Registrations', 'Check-ins', 'Cancellations']}
			columns={[
				{ header: 'Date', value: (s) => s.date },
				{ header: 'Registrations', value: (s) => num(s.registrations) },
				{ header: 'Check-ins', value: (s) => num(s.checkIns) },
				{ header: 'Cancellations', value: (s) => num(s.cancellations) }
			]}
			emptyText="No daily activity recorded."
		/>
	</section>

	<!-- ── 11. Feedback ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">11</span> Feedback &amp; Surveys</h2>
		{#if src?.feedback}
			<dl class="kv">
				<div class="kv-row">
					<dt>Responses</dt>
					<dd>{num(feedbackSummary.total ?? src.feedback.responses?.length)}</dd>
				</div>
				<div class="kv-row">
					<dt>Average rating</dt>
					<dd>{feedbackSummary.averageRating ?? feedbackSummary.average ?? '—'}</dd>
				</div>
			</dl>
			<ReportTable
				rows={src.feedback.responses ?? []}
				maxRows={maxRowsPerTable}
				columns={[
					{ header: 'Submitted', value: (f) => fmtDay(f.createdAt ?? f.submittedAt) },
					{ header: 'Rating', value: (f) => f.rating },
					{ header: 'Attendee', value: (f) => f.attendeeEmail ?? f.email ?? 'Anonymous' },
					{ header: 'Comment', value: (f) => f.comment ?? f.feedback }
				]}
				emptyText="No feedback submitted."
			/>
		{:else}
			<p class="empty">Feedback data unavailable.</p>
		{/if}
	</section>

	<!-- ── 12. Content ── -->
	<section class="block">
		<h2 class="block-title"><span class="block-num">12</span> Content</h2>
		<ReportTable
			title="FAQs"
			rows={src?.faqs ?? []}
			columns={[
				{ header: 'Question', value: (f) => f.question },
				{ header: 'Answer', value: (f) => f.answer },
				{ header: 'Category', value: (f) => f.category }
			]}
			emptyText="No FAQs published."
		/>
		<ReportTable
			title="Media"
			rows={src?.media ?? []}
			maxRows={maxRowsPerTable}
			columns={[
				{ header: 'Title', value: (m) => m.title },
				{ header: 'Type', value: (m) => m.type },
				{ header: 'Category', value: (m) => m.category },
				{ header: 'Public', value: (m) => (m.isPublic ? 'Yes' : 'No') },
				{ header: 'Uploaded', value: (m) => fmtDay(m.createdAt) }
			]}
			emptyText="No media uploaded."
		/>
	</section>

	<footer class="doc-footer">
		<span>Rondwell · {title}</span>
		<span>Generated {generatedAt}</span>
	</footer>
</div>

<style>
	/* Hidden on screen; revealed only for print. Kept in the DOM (rather than
	   opened in a popup) so the print job uses the real component tree. */
	.report-root {
		position: fixed;
		left: -100000px;
		top: 0;
		width: 794px; /* A4 @ 96dpi */
		visibility: hidden;
		pointer-events: none;

		--rp-accent: #6b46c1;
		--rp-accent-soft: #ece7f8;
		--rp-ink: #14121a;
		--rp-muted-ink: #4a4458;
		--rp-rule: #e8e5ef;
		--rp-head-bg: #f4f2f8;
		--rp-zebra: #faf9fc;

		background: #fff;
		color: var(--rp-ink);
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
		font-size: 10px;
		line-height: 1.5;
	}

	/* ── Cover ── */
	.cover {
		padding: 0 0 20px;
		border-bottom: 2.5px solid var(--rp-accent);
		margin-bottom: 24px;
	}

	.cover-brand {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-bottom: 18px;
	}

	.brand-mark {
		font-size: 17px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--rp-accent);
	}

	.brand-kicker {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--rp-muted-ink);
	}

	.cover-title {
		margin: 0 0 6px;
		font-size: 26px;
		font-weight: 800;
		line-height: 1.18;
		letter-spacing: -0.02em;
	}

	.cover-sub {
		margin: 0 0 20px;
		font-size: 11px;
		color: var(--rp-muted-ink);
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 14px;
	}

	.kpi {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 11px 13px;
		border: 1px solid var(--rp-rule);
		border-left: 3px solid var(--rp-accent);
		border-radius: 6px;
		background: var(--rp-zebra);
	}

	.kpi-value {
		font-size: 17px;
		font-weight: 800;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}

	.kpi-label {
		font-size: 8px;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: var(--rp-muted-ink);
	}

	.cover-meta {
		margin: 0;
		font-size: 8.5px;
		color: var(--rp-muted-ink);
	}

	/* ── Sections ── */
	.block {
		margin-bottom: 26px;
	}

	.block-title {
		display: flex;
		align-items: center;
		gap: 9px;
		margin: 0 0 12px;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--rp-rule);
		font-size: 14px;
		font-weight: 800;
		letter-spacing: -0.01em;
		break-after: avoid;
		page-break-after: avoid;
	}

	.block-num {
		display: inline-grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		border-radius: 5px;
		background: var(--rp-accent);
		color: #fff;
		font-size: 9.5px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	/* ── Key/value grid ── */
	.kv {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0 22px;
		margin: 0 0 14px;
	}

	.kv-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 4.5px 0;
		border-bottom: 1px solid var(--rp-rule);
		break-inside: avoid;
	}

	.kv dt {
		font-size: 9.5px;
		color: var(--rp-muted-ink);
	}

	.kv dd {
		margin: 0;
		font-size: 9.5px;
		font-weight: 600;
		text-align: right;
		word-break: break-word;
	}

	/* ── CSS bar chart (prints reliably; no canvas) ── */
	.bars {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}

	.bar-row {
		display: grid;
		grid-template-columns: 92px 1fr 118px;
		align-items: center;
		gap: 10px;
		break-inside: avoid;
	}

	.bar-label {
		font-size: 9.5px;
		font-weight: 600;
	}

	.bar-track {
		height: 9px;
		border-radius: 999px;
		background: var(--rp-accent-soft);
		overflow: hidden;
	}

	.bar-fill {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: var(--rp-accent);
	}

	.bar-value {
		font-size: 9px;
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: var(--rp-muted-ink);
	}

	.empty {
		margin: 0;
		padding: 10px 12px;
		border: 1px dashed var(--rp-rule);
		border-radius: 6px;
		font-size: 10px;
		color: var(--rp-muted-ink);
	}

	.doc-footer {
		display: flex;
		justify-content: space-between;
		padding-top: 10px;
		border-top: 1px solid var(--rp-rule);
		font-size: 8px;
		color: var(--rp-muted-ink);
	}

	/* ───────────────────────── PRINT ───────────────────────── */
	@media print {
		.report-root {
			position: static;
			left: auto;
			width: auto;
			visibility: visible;
			pointer-events: auto;
		}

		.block.break-before {
			break-before: page;
			page-break-before: always;
		}

		.block-title,
		.kpi,
		.bar-row {
			break-inside: avoid;
			page-break-inside: avoid;
		}

		/* Backgrounds and the accent rules are structural here, not decoration —
		   without this the report prints as undifferentiated grey text. */
		.report-root,
		.kpi,
		.block-num,
		.bar-track,
		.bar-fill,
		.cover {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.doc-footer {
			display: none; /* @page margins carry the running footer instead */
		}
	}
</style>
