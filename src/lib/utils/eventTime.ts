/**
 * H-75 — the two halves of the event-timezone bug, and the helpers that fix
 * them.
 *
 * ── What was wrong ───────────────────────────────────────────────────────
 *
 * The platform stores an explicit `event.timeZone`, transports it, and displays
 * it. **Nothing ever computed with it.**
 *
 * **The write side ignored the zone the organizer picked.** `buildDateTime`
 * assembled `"YYYY-MM-DDTHH:mm:00"` and handed it to `new Date(...)`, which
 * parses a string with no offset as **browser-local**. So a Lagos-based
 * organizer creating a New York event, selecting `America/New_York` and typing
 * 7:00 PM, stored `19:00 WAT` = `18:00 UTC`. The correct instant is `23:00 UTC`.
 * **Five hours wrong, at creation.**
 *
 * **The read side rendered in the viewer's zone and labelled it with the
 * event's.** `toLocaleTimeString` with no `timeZone` option formats in the
 * *runtime's* zone, while the `tz` string printed beside it came from
 * `event.timeZone` — **the digits and the label were computed from different
 * zones.** A 7:00 PM Lagos event viewed from New York rendered
 * **"2:00 PM Africa/Lagos"**. The same defect in `formatEventDate` means an
 * evening event can show **the wrong day**.
 *
 * **The two bugs cancel exactly when organizer zone = viewer zone = event
 * zone** — which is every case anyone is likely to have tested by hand. That is
 * why this survived: it is correct in the demo and wrong for the customer who
 * flew in. **People miss events they paid for.**
 *
 * ── Why the offset is computed rather than looked up ─────────────────────
 *
 * Converting a wall-clock time in an arbitrary IANA zone to a UTC instant needs
 * that zone's offset **on that date** — which changes with daylight saving, and
 * which no built-in JavaScript API exposes directly.
 *
 * `Intl.DateTimeFormat` *can* format an instant into a zone. So the offset is
 * recovered by formatting a candidate instant into the target zone, comparing
 * the result with the wall-clock time that was wanted, and correcting by the
 * difference. One correction pass is enough except within the one ambiguous
 * hour at a DST boundary, so a second pass runs to settle it.
 *
 * This is the standard technique and it avoids shipping a timezone database.
 */

/** A wall-clock time, as the organizer typed it. */
export interface WallClock {
	year: number;
	/** 1-12. */
	month: number;
	day: number;
	hour: number;
	minute: number;
}

/**
 * The parts of an instant, as they read in a given IANA zone.
 *
 * `formatToParts` is used rather than string parsing because the format varies
 * by locale and `en-CA`'s ISO-like output is not guaranteed across runtimes.
 */
function partsInZone(instant: Date, timeZone: string): WallClock {
	const fmt = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});

	const parts: Record<string, string> = {};
	for (const p of fmt.formatToParts(instant)) {
		if (p.type !== 'literal') parts[p.type] = p.value;
	}

	return {
		year: Number(parts.year),
		month: Number(parts.month),
		day: Number(parts.day),
		// `hour12: false` yields "24" for midnight on some runtimes.
		hour: Number(parts.hour) % 24,
		minute: Number(parts.minute)
	};
}

/** Milliseconds between two wall-clock readings, treated as naive times. */
function wallClockDeltaMs(a: WallClock, b: WallClock): number {
	return Date.UTC(a.year, a.month - 1, a.day, a.hour, a.minute) -
		Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute);
}

/**
 * Convert a wall-clock time in `timeZone` to the UTC instant it names.
 *
 * This is what the write side needs: the organizer said "7:00 PM, New York",
 * and the database stores an instant.
 *
 * Falls back to treating the input as UTC if the zone is unusable — wrong, but
 * deterministic and loud in the data, rather than silently browser-local, which
 * is the failure this replaces.
 */
export function zonedWallClockToUtc(wall: WallClock, timeZone: string): Date {
	// First guess: pretend the wall-clock time is already UTC.
	let instant = new Date(
		Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute)
	);

	try {
		// Two correction passes. The first lands within an hour in every case;
		// the second settles the DST-boundary hour where the offset used by the
		// first pass was the wrong side of the transition.
		for (let pass = 0; pass < 2; pass++) {
			const seen = partsInZone(instant, timeZone);
			const driftMs = wallClockDeltaMs(wall, seen);
			if (driftMs === 0) break;
			instant = new Date(instant.getTime() + driftMs);
		}
	} catch {
		// An invalid IANA name. Return the UTC reading rather than throwing:
		// the caller is a form submission, and failing it helps nobody.
		return instant;
	}

	return instant;
}

/**
 * Parse `"7:00 PM"` (or `"19:00"`) into hours and minutes.
 *
 * Returns `null` on anything unrecognised so the caller can decide, rather than
 * silently producing midnight.
 */
export function parseTimeOfDay(timeStr: string): { hour: number; minute: number } | null {
	const value = String(timeStr ?? '').trim();
	if (!value) return null;

	const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
	if (!match) return null;

	let hour = Number(match[1]);
	const minute = Number(match[2]);
	const meridiem = match[3]?.toUpperCase();

	if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
	if (minute < 0 || minute > 59) return null;

	if (meridiem === 'PM' && hour !== 12) hour += 12;
	if (meridiem === 'AM' && hour === 12) hour = 0;

	if (hour < 0 || hour > 23) return null;
	return { hour, minute };
}

/**
 * Build the UTC instant for a date + time-of-day in a given zone.
 *
 * This is the replacement for the six `buildDateTime` clones. The `timeZone`
 * argument is **required** — the whole finding is that it was available and
 * unused, so an optional parameter would let a caller reintroduce it.
 *
 * `date` supplies only the calendar day, read in **local** terms: it comes from
 * a date picker where the user chose a day on a calendar, and that day is what
 * they meant regardless of zone.
 */
export function buildZonedInstant(date: Date, timeStr: string, timeZone: string): string {
	const time = parseTimeOfDay(timeStr) ?? { hour: 0, minute: 0 };

	return zonedWallClockToUtc(
		{
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			hour: time.hour,
			minute: time.minute
		},
		timeZone
	).toISOString();
}

/**
 * Format an instant **in the event's zone**, so the digits and the label agree.
 *
 * This is the read-side fix. Every caller that prints a time next to
 * `event.timeZone` must use this rather than a bare `toLocaleTimeString`.
 */
export function formatInZone(
	instant: Date | string | number,
	timeZone: string,
	options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
): string {
	const d = instant instanceof Date ? instant : new Date(instant);
	if (Number.isNaN(d.getTime())) return '';

	try {
		return new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(d);
	} catch {
		// Unknown zone — format without one rather than showing nothing, and
		// let the caller's label be the (now honest) signal that we are not
		// certain of the zone.
		return new Intl.DateTimeFormat('en-US', options).format(d);
	}
}

/** Date in the event's zone. Same reasoning as `formatInZone`. */
export function formatDateInZone(
	instant: Date | string | number,
	timeZone: string,
	options: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}
): string {
	return formatInZone(instant, timeZone, options);
}

/**
 * A short label for a zone, e.g. `WAT` or `GMT+1`.
 *
 * Printing the raw IANA name (`Africa/Lagos`) beside a time is what made the
 * original mismatch hard to spot — it looks authoritative. A short offset-based
 * label is both shorter and harder to misread.
 */
export function zoneAbbreviation(instant: Date | string | number, timeZone: string): string {
	const d = instant instanceof Date ? instant : new Date(instant);
	if (Number.isNaN(d.getTime())) return '';

	try {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone,
			timeZoneName: 'short'
		}).formatToParts(d);
		return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
	} catch {
		return timeZone;
	}
}
