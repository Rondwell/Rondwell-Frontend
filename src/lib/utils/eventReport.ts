/**
 * Full event report generation.
 *
 * Produces the single "everything about this event" download organisers ask for
 * after an event closes: attendees, seating, statuses, admins, participants,
 * agenda, ticket sales, engagement and financial summary in one file.
 *
 * Assembled client-side from the existing analytics and event endpoints, so it
 * needs no new backend surface. Every section degrades independently — an
 * endpoint that fails is reported as unavailable inside the file rather than
 * taking the whole report down, because a report missing one table is far more
 * useful than no report at all.
 *
 * Output is a multi-section CSV: Excel, Numbers and Google Sheets all open it,
 * and unlike a PDF the organiser can actually filter and pivot it.
 */

import {
	getAllEventSessionsForEvent,
	getEventAdmins,
	getEventAttendeesPaginated,
	getEventById,
	getEventChecklists,
	getEventDays,
	getEventFaqs,
	getEventMedia,
	getPublicParticipants,
	getPublicSeats,
	getTicketTypes
} from '$lib/services/event.services';
import { getFeedbackResponses } from '$lib/services/eventEmailSettings.services';
import { csvCell, toCsv, type CsvColumn } from './csv';

/** One titled block in the report. */
export interface ReportSection {
	title: string;
	lines: string[];
}

export interface ReportProgress {
	/** Human-readable label for what is being fetched right now. */
	step: string;
	done: number;
	total: number;
}

/** Render a "Field,Value" block. */
function keyValueSection(title: string, pairs: Array<[string, unknown]>): ReportSection {
	const lines = [
		[csvCell('Field'), csvCell('Value')].join(','),
		...pairs.map(([k, v]) => [csvCell(k), csvCell(v)].join(','))
	];
	return { title, lines };
}

/** Render a table block, or a friendly placeholder when there are no rows. */
function tableSection<T>(title: string, rows: T[], columns: CsvColumn<T>[]): ReportSection {
	if (!rows || rows.length === 0) {
		return { title, lines: [csvCell('No records.')] };
	}
	return { title, lines: toCsv(rows, columns).split('\r\n') };
}

function unavailableSection(title: string): ReportSection {
	return { title, lines: [csvCell('Not available — this data could not be loaded.')] };
}

const fmtDate = (v: any): string => {
	if (!v) return '';
	const d = new Date(v);
	return isNaN(d.getTime()) ? '' : d.toISOString();
};

const fmtLocal = (v: any): string => {
	if (!v) return '';
	const d = new Date(v);
	return isNaN(d.getTime()) ? '' : d.toLocaleString();
};

/** Money values are held in minor units (kobo/cents) across the platform. */
const fmtMoney = (minor: any, currency = 'NGN'): string => {
	const n = Number(minor);
	if (!isFinite(n)) return '';
	return `${currency} ${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};

/** Run a loader and fall back to null instead of throwing, so one failure can't sink the report. */
async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
	try {
		return await fn();
	} catch (err) {
		console.error(`[event-report] ${label} failed:`, err);
		return null;
	}
}

export interface EventReportSources {
	event: any;
	analytics: any | null;
	attendees: any[] | null;
	admins: any[] | null;
	participants: { speakers: any[]; exhibitors: any[]; vendors: any[] } | null;
	sessions: any[] | null;
	ticketTypes: any[] | null;
	seats: { layout: any; seats: any[] } | null;
	faqs: any[] | null;
	media: any[] | null;
	/** Planning checklists and their assignees. */
	checklists: any[] | null;
	/** Multi-day event schedule. */
	eventDays: any[] | null;
	/** Post-event survey responses plus their aggregate summary. */
	feedback: { responses: any[]; summary: any } | null;
}

/**
 * Union of custom registration question labels across all attendees.
 *
 * Organisers build their own registration forms; a report that omits those
 * answers is unusable for catering, access and accessibility planning. The
 * column set is derived from every row so the header stays stable even when
 * only some attendees answered a given question.
 */
export function customAnswerLabels(rows: any[]): string[] {
	const keys = new Set<string>();
	for (const r of rows ?? []) {
		const answers = r.customFormAnswers ?? r.registrationAnswers ?? r.customAnswers;
		if (!answers) continue;
		if (Array.isArray(answers)) {
			for (const a of answers) {
				const label = a?.label ?? a?.fieldLabel ?? a?.question ?? a?.fieldId;
				if (label) keys.add(String(label));
			}
		} else if (typeof answers === 'object') {
			for (const k of Object.keys(answers)) keys.add(k);
		}
	}
	return [...keys];
}

/** Read one custom answer off an attendee row. */
export function customAnswerValue(row: any, label: string): string {
	const answers = row.customFormAnswers ?? row.registrationAnswers ?? row.customAnswers;
	if (!answers) return '';
	if (Array.isArray(answers)) {
		const hit = answers.find(
			(a: any) => (a?.label ?? a?.fieldLabel ?? a?.question ?? a?.fieldId) === label
		);
		const v = hit?.value ?? hit?.answer ?? '';
		return Array.isArray(v) ? v.join('; ') : String(v ?? '');
	}
	const v = answers[label];
	return Array.isArray(v) ? v.join('; ') : String(v ?? '');
}

/**
 * Assemble the report sections from already-fetched data.
 *
 * Kept pure and separate from fetching so it is easy to reason about and to
 * extend with new sections.
 */
export function buildEventReportSections(src: EventReportSources): ReportSection[] {
	const sections: ReportSection[] = [];
	const ev = src.event ?? {};
	const a = src.analytics ?? {};
	const currency = a?.tickets?.currency ?? 'NGN';

	/* 1 ── Event summary */
	const physical = ev.locationDetails?.physical;
	const virtual = ev.locationDetails?.virtual;
	sections.push(
		keyValueSection('1. Event Summary', [
			['Report generated', new Date().toLocaleString()],
			['Event title', ev.title ?? a.eventTitle ?? ''],
			['Event ID', ev._id ?? ev.id ?? ''],
			['Public link', ev.customLinkSlug ? `https://rondwell.com/e/${ev.customLinkSlug}` : ''],
			['Organizer', ev.eventOrganizerName ?? ''],
			['Category', ev.category ?? ''],
			['Event type', ev.eventType ?? ''],
			['Registration type', ev.registrationType ?? ''],
			['Status', ev.eventStatus ?? ''],
			['Visibility', ev.visibility ?? ''],
			['Starts', fmtLocal(ev.startDateTime)],
			['Ends', fmtLocal(ev.endDateTime)],
			['Time zone', ev.timeZone ?? ''],
			['Venue', physical?.venueName ?? ''],
			['Address', physical?.resolvedAddress?.formatted_address ?? physical?.venueAddress ?? ''],
			['Virtual platform', virtual?.platform ?? ''],
			['Capacity', ev.maxAttendees || 'Unlimited'],
			['Registration deadline', fmtLocal(ev.registrationDeadline)],
			['Registration open', ev.registrationOpen === false ? 'No' : 'Yes'],
			['Waitlist enabled', ev.waitlistEnabled ? 'Yes' : 'No'],
			[
				'Group registration',
				ev.groupRegistrationEnabled ? `Yes (max ${ev.maxGroupSize ?? '—'})` : 'No'
			],
			['Check-in enabled', ev.checkinSettings?.isCheckinEnabled ? 'Yes' : 'No']
		])
	);

	/* 2 ── Registration summary */
	if (src.analytics) {
		const reg = a.registrations ?? {};
		sections.push(
			keyValueSection('2. Registration Summary', [
				['Total registrations', reg.total ?? 0],
				['Attending', reg.attending ?? 0],
				['Pending', reg.pending ?? 0],
				['Checked in', reg.checkedIn ?? 0],
				['Waitlisted', reg.waitlisted ?? 0],
				['Declined', reg.declined ?? 0],
				['Cancelled', reg.cancelled ?? 0],
				[
					'Check-in rate',
					reg.total ? `${(((reg.checkedIn ?? 0) / reg.total) * 100).toFixed(1)}%` : '0%'
				],
				[
					'Capacity used',
					ev.maxAttendees
						? `${(((reg.attending ?? 0) / ev.maxAttendees) * 100).toFixed(1)}%`
						: 'N/A'
				]
			])
		);
	} else {
		sections.push(unavailableSection('2. Registration Summary'));
	}

	/* 3 ── Ticket sales by type
	 * Prefer the analytics roll-up; fall back to the configured ticket types so
	 * the section still lists what was on sale when analytics has no breakdown.
	 * (The ticket-type fetch previously happened but its result was discarded.) */
	const byType: any[] = a?.tickets?.byType?.length ? a.tickets.byType : src.ticketTypes ?? [];
	sections.push(
		tableSection('3. Ticket Sales by Type', byType, [
			{ header: 'Ticket Type', value: (t) => t.name ?? t.ticketTypeName ?? t.title ?? '' },
			{ header: 'Price', value: (t) => fmtMoney(t.priceKobo ?? t.price, currency) },
			{ header: 'Sold', value: (t) => t.sold ?? t.count ?? t.quantitySold ?? 0 },
			{
				header: 'Available',
				value: (t) => t.available ?? t.remaining ?? t.quantityAvailable ?? t.quantity ?? ''
			},
			{ header: 'Revenue', value: (t) => fmtMoney(t.revenueKobo ?? t.revenue, currency) },
			{ header: 'Sales Start', value: (t) => fmtLocal(t.salesStartDate) },
			{ header: 'Sales End', value: (t) => fmtLocal(t.salesEndDate) }
		])
	);

	/* 4 ── Financial summary */
	if (src.analytics?.tickets) {
		const t = a.tickets;
		sections.push(
			keyValueSection('4. Financial Summary', [
				['Currency', currency],
				['Gross revenue', fmtMoney(t.grossRevenueKobo ?? t.grossRevenue ?? t.revenue, currency)],
				['Net revenue', fmtMoney(t.netRevenueKobo ?? t.netRevenue, currency)],
				['Platform fees', fmtMoney(t.platformFeesKobo ?? t.platformFees, currency)],
				['Refunded', fmtMoney(t.refundedKobo ?? t.refunded, currency)],
				['Tickets sold', t.totalSold ?? t.sold ?? 0],
				['Average ticket price', fmtMoney(t.averagePriceKobo ?? t.averagePrice, currency)]
			])
		);
	} else {
		sections.push(unavailableSection('4. Financial Summary'));
	}

	/* 5 ── Full attendee list, including custom registration answers */
	if (src.attendees) {
		const customCols: CsvColumn<any>[] = customAnswerLabels(src.attendees).map((label) => ({
			header: label,
			value: (x: any) => customAnswerValue(x, label)
		}));

		sections.push(
			tableSection('5. Attendee List', src.attendees, [
				{ header: 'First Name', value: (x) => x.firstName ?? '' },
				{ header: 'Last Name', value: (x) => x.lastName ?? '' },
				{ header: 'Email', value: (x) => x.email ?? '' },
				{ header: 'Phone', value: (x) => x.phone ?? x.phoneNumber ?? '' },
				{ header: 'Status', value: (x) => x.attendeeStatus ?? '' },
				{ header: 'Invitation Status', value: (x) => x.invitationStatus ?? '' },
				{ header: 'Source', value: (x) => x.source ?? '' },
				{ header: 'Ticket Type', value: (x) => x.ticketTypeName ?? x.ticketType?.name ?? '' },
				{ header: 'Ticket ID', value: (x) => x.ticketId ?? '' },
				{ header: 'Seat', value: (x) => x.seatLabel ?? x.seat?.label ?? '' },
				{ header: 'Group', value: (x) => x.groupName ?? x.groupRegistrationId ?? '' },
				{ header: 'Checked In At', value: (x) => fmtDate(x.checkedInAt) },
				{ header: 'Registered At', value: (x) => fmtDate(x.createdAt) },
				{ header: 'Tags', value: (x) => (Array.isArray(x.tags) ? x.tags.join('; ') : '') },
				{ header: 'Notes', value: (x) => x.notes ?? '' },
				{ header: 'Attendee ID', value: (x) => x._id ?? x.id ?? '' },
				...customCols
			])
		);
	} else {
		sections.push(unavailableSection('5. Attendee List'));
	}

	/* 6 ── Seating */
	if (src.seats) {
		const seats = src.seats.seats ?? [];
		const taken = seats.filter((s: any) => s.status && s.status !== 'AVAILABLE').length;
		sections.push(
			keyValueSection('6. Seating Overview', [
				['Layout name', src.seats.layout?.name ?? 'No seat map configured'],
				['Total seats', seats.length],
				['Assigned / unavailable', taken],
				['Free', seats.length - taken]
			])
		);
		sections.push(
			tableSection('6a. Seat Allocation', seats, [
				{ header: 'Seat', value: (s: any) => s.label ?? s.seatNumber ?? '' },
				{ header: 'Section', value: (s: any) => s.section ?? s.sectionName ?? '' },
				{ header: 'Row', value: (s: any) => s.row ?? '' },
				{ header: 'Status', value: (s: any) => s.status ?? '' },
				{ header: 'Ticket Type', value: (s: any) => s.ticketTypeName ?? s.ticketTypeId ?? '' },
				{ header: 'Assigned To', value: (s: any) => s.attendeeEmail ?? s.assignedTo ?? '' }
			])
		);
	} else {
		sections.push(unavailableSection('6. Seating Overview'));
	}

	/* 7 ── Admins & access */
	if (src.admins) {
		sections.push(
			tableSection('7. Event Admins & Access', src.admins, [
				{
					header: 'Name',
					value: (x) => x.name ?? [x.firstName, x.lastName].filter(Boolean).join(' ')
				},
				{ header: 'Email', value: (x) => x.email ?? '' },
				{ header: 'Role', value: (x) => x.role ?? x.roleName ?? '' },
				{ header: 'Status', value: (x) => x.status ?? x.invitationStatus ?? '' },
				{ header: 'Added', value: (x) => fmtDate(x.createdAt) }
			])
		);
	} else {
		sections.push(unavailableSection('7. Event Admins & Access'));
	}

	/* 8 ── Participants */
	if (src.participants) {
		const p = src.participants;
		sections.push(
			tableSection('8a. Speakers', p.speakers ?? [], [
				{ header: 'Name', value: (x: any) => x.fullName ?? x.name ?? '' },
				{ header: 'Title', value: (x: any) => x.title ?? '' },
				{ header: 'Organisation', value: (x: any) => x.affiliation ?? x.company ?? '' },
				{ header: 'Email', value: (x: any) => x.email ?? '' },
				{ header: 'Status', value: (x: any) => x.status ?? x.collaborationStatus ?? '' }
			])
		);
		sections.push(
			tableSection('8b. Exhibitors', p.exhibitors ?? [], [
				{ header: 'Company', value: (x: any) => x.companyName ?? x.name ?? '' },
				{ header: 'Industry', value: (x: any) => x.industry ?? '' },
				{ header: 'Email', value: (x: any) => x.email ?? '' },
				{ header: 'Status', value: (x: any) => x.status ?? x.collaborationStatus ?? '' }
			])
		);
		sections.push(
			tableSection('8c. Vendors', p.vendors ?? [], [
				{ header: 'Business', value: (x: any) => x.businessName ?? x.name ?? '' },
				{ header: 'Type', value: (x: any) => x.businessType ?? '' },
				{ header: 'Email', value: (x: any) => x.email ?? '' },
				{ header: 'Status', value: (x: any) => x.status ?? x.collaborationStatus ?? '' }
			])
		);
	} else {
		sections.push(unavailableSection('8. Participants'));
	}

	/* 9 ── Agenda */
	if (src.sessions) {
		sections.push(
			tableSection('9. Agenda & Sessions', src.sessions, [
				{ header: 'Session', value: (x) => x.title ?? '' },
				{ header: 'Starts', value: (x) => fmtLocal(x.startTime ?? x.startDateTime) },
				{ header: 'Ends', value: (x) => fmtLocal(x.endTime ?? x.endDateTime) },
				{ header: 'Room', value: (x) => x.roomName ?? x.room?.name ?? '' },
				{
					header: 'Speakers',
					value: (x) =>
						Array.isArray(x.speakers)
							? x.speakers.map((s: any) => s.fullName ?? s.name ?? s).join('; ')
							: ''
				},
				{ header: 'Description', value: (x) => x.description ?? '' }
			])
		);
	} else {
		sections.push(unavailableSection('9. Agenda & Sessions'));
	}

	/* 10 ── Engagement & communications */
	if (src.analytics) {
		const e = a.engagement ?? {};
		const c = a.communications ?? {};
		sections.push(
			keyValueSection('10. Engagement & Communications', [
				['Page views', e.pageViews ?? e.views ?? 0],
				['Unique visitors', e.uniqueVisitors ?? 0],
				['Shares', e.shares ?? 0],
				['Community posts', e.communityPosts ?? e.posts ?? 0],
				['Comments', e.comments ?? 0],
				['Emails sent', c.emailsSent ?? c.sent ?? 0],
				['Emails opened', c.emailsOpened ?? c.opened ?? 0],
				['Open rate', c.openRate != null ? `${c.openRate}%` : ''],
				['Invitations sent', c.invitationsSent ?? ''],
				['Waitlist size', a.waitlist?.total ?? 0],
				['Waitlist promoted', a.waitlist?.promoted ?? 0]
			])
		);
	} else {
		sections.push(unavailableSection('10. Engagement & Communications'));
	}

	/* 11 ── Daily activity */
	const snapshots: any[] = a?.dailySnapshots ?? [];
	sections.push(
		tableSection('11. Daily Activity', snapshots, [
			{ header: 'Date', value: (s) => s.date ?? '' },
			{ header: 'Registrations', value: (s) => s.registrations ?? 0 },
			{ header: 'Check-ins', value: (s) => s.checkIns ?? 0 },
			{ header: 'Cancellations', value: (s) => s.cancellations ?? 0 },
			{ header: 'Revenue', value: (s) => fmtMoney(s.revenueKobo ?? s.revenue, currency) }
		])
	);

	/* 12 ── Event days (multi-day schedule) */
	sections.push(
		tableSection('12. Event Days', src.eventDays ?? [], [
			{ header: 'Day', value: (d: any) => d.title ?? d.name ?? d.label ?? '' },
			{ header: 'Date', value: (d: any) => fmtLocal(d.date ?? d.startDateTime) },
			{ header: 'Starts', value: (d: any) => fmtLocal(d.startTime ?? d.startDateTime) },
			{ header: 'Ends', value: (d: any) => fmtLocal(d.endTime ?? d.endDateTime) },
			{ header: 'Description', value: (d: any) => d.description ?? '' }
		])
	);

	/* 13 ── Planning checklists */
	sections.push(
		tableSection('13. Planning Checklists', src.checklists ?? [], [
			{ header: 'Task', value: (c: any) => c.title ?? '' },
			{ header: 'Status', value: (c: any) => c.status ?? '' },
			{ header: 'Due', value: (c: any) => fmtLocal(c.dueDate) },
			{
				header: 'Assigned To',
				value: (c: any) =>
					Array.isArray(c.assignedTo) ? c.assignedTo.join('; ') : c.assignedTo ?? ''
			},
			{ header: 'Description', value: (c: any) => c.description ?? '' },
			{ header: 'Created', value: (c: any) => fmtDate(c.createdAt) }
		])
	);

	/* 14 ── Feedback & surveys */
	if (src.feedback) {
		const sum = src.feedback.summary ?? {};
		sections.push(
			keyValueSection('14. Feedback Summary', [
				['Responses', sum.total ?? src.feedback.responses?.length ?? 0],
				['Average rating', sum.averageRating ?? sum.average ?? ''],
				['Recommend rate', sum.recommendRate != null ? `${sum.recommendRate}%` : '']
			])
		);
		sections.push(
			tableSection('14a. Feedback Responses', src.feedback.responses ?? [], [
				{ header: 'Submitted', value: (f: any) => fmtDate(f.createdAt ?? f.submittedAt) },
				{ header: 'Rating', value: (f: any) => f.rating ?? '' },
				{ header: 'Attendee', value: (f: any) => f.attendeeEmail ?? f.email ?? 'Anonymous' },
				{ header: 'Comment', value: (f: any) => f.comment ?? f.feedback ?? '' }
			])
		);
	} else {
		sections.push(unavailableSection('14. Feedback & Surveys'));
	}

	/* 15 ── Content */
	sections.push(
		tableSection('15. FAQs', src.faqs ?? [], [
			{ header: 'Question', value: (f: any) => f.question ?? '' },
			{ header: 'Answer', value: (f: any) => f.answer ?? '' },
			{ header: 'Category', value: (f: any) => f.category ?? '' }
		])
	);
	sections.push(
		tableSection('16. Media', src.media ?? [], [
			{ header: 'Title', value: (m: any) => m.title ?? '' },
			{ header: 'Type', value: (m: any) => m.type ?? '' },
			{ header: 'Category', value: (m: any) => m.category ?? '' },
			{ header: 'Public', value: (m: any) => (m.isPublic ? 'Yes' : 'No') },
			{ header: 'URL', value: (m: any) => m.url ?? '' },
			{ header: 'Uploaded', value: (m: any) => fmtDate(m.createdAt) }
		])
	);

	return sections;
}

/* ─────────────────── Loading ─────────────────── */

const ATTENDEE_PAGE_SIZE = 200;
/** Guard against a mis-reported totalPages turning into an infinite loop. */
const ATTENDEE_MAX_PAGES = 500;
/** Feedback responses are only summarised, so one generous page is enough. */
const FEEDBACK_LIMIT = 500;

/**
 * Fetch every source the report needs, exactly once.
 *
 * Both the CSV and the PDF render from this single result, so the two formats
 * can never drift apart — a section added here appears in both.
 *
 * Each source is loaded defensively: a failing endpoint yields `null` for that
 * section and the report still downloads.
 */
export async function loadEventReportData(
	eventId: string,
	analytics: any | null,
	onProgress?: (step: string) => void
): Promise<EventReportSources> {
	const step = (s: string) => onProgress?.(s);

	step('Loading event details…');
	const event = await safe('event', () => getEventById(eventId));

	// Attendees are paged, so walk them separately from the parallel batch.
	step('Loading attendees…');
	const attendees = await safe('attendees', async () => {
		const all: any[] = [];
		for (let p = 1; p <= ATTENDEE_MAX_PAGES; p++) {
			const res = await getEventAttendeesPaginated(eventId, {
				page: p,
				limit: ATTENDEE_PAGE_SIZE
			});
			all.push(...(res.attendees ?? []));
			step(`Loading attendees… ${all.length} of ${res.total ?? all.length}`);
			if (!res.attendees?.length || p >= (res.totalPages ?? 1)) break;
		}
		return all;
	});

	step('Loading event records…');
	const [
		admins,
		participants,
		sessions,
		ticketTypes,
		seats,
		faqs,
		media,
		checklists,
		eventDays,
		feedback
	] = await Promise.all([
		safe('admins', () => getEventAdmins(eventId)),
		safe('participants', () => getPublicParticipants(eventId)),
		safe('sessions', () => getAllEventSessionsForEvent(eventId)),
		safe('ticketTypes', () => getTicketTypes(eventId)),
		safe('seats', () => getPublicSeats(eventId)),
		safe('faqs', () => getEventFaqs(eventId)),
		safe('media', () => getEventMedia(eventId)),
		safe('checklists', () => getEventChecklists(eventId)),
		safe('eventDays', () => getEventDays(eventId)),
		safe('feedback', async () => {
			const r = await getFeedbackResponses(eventId, { page: 1, limit: FEEDBACK_LIMIT });
			return { responses: r.responses ?? [], summary: r.summary ?? {} };
		})
	]);

	return {
		event: event ?? { _id: eventId, title: analytics?.eventTitle },
		analytics,
		attendees,
		admins,
		participants,
		sessions,
		ticketTypes,
		seats,
		faqs,
		media,
		checklists,
		eventDays,
		feedback
	};
}

/** Serialise sections into the final CSV text. */
export function renderReport(sections: ReportSection[], eventTitle: string): string {
	const header = [
		csvCell(`RONDWELL EVENT REPORT`),
		csvCell(eventTitle),
		csvCell(`Generated ${new Date().toLocaleString()}`),
		''
	];
	const body: string[] = [];
	for (const s of sections) {
		body.push(csvCell(`===== ${s.title} =====`));
		body.push(...s.lines);
		body.push('');
	}
	return [...header, ...body].join('\r\n');
}
