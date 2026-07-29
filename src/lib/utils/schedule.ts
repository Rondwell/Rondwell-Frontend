/**
 * Shared date/time helpers for the schedule pickers (rooms, sessions, agenda).
 *
 * The pickers work with a `Date` for the day plus a 30-minute-granular label
 * like "7:30 PM" for the time. Keeping the conversions in one place avoids the
 * drift that produced wrong times before (e.g. a 12:45 start being rendered as
 * "12:30" because the minutes were flattened with `m === 0 ? '00' : '30'`).
 */

const TIME_STEP_MINUTES = 30;

/** "7:30 PM" for a Date, snapped down to the nearest 30 minutes. */
export function toTimeLabel(date: Date): string {
	const snapped = Math.floor(date.getMinutes() / TIME_STEP_MINUTES) * TIME_STEP_MINUTES;
	const hours24 = date.getHours();
	const meridiem = hours24 >= 12 ? 'PM' : 'AM';
	const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
	return `${hours12}:${String(snapped).padStart(2, '0')} ${meridiem}`;
}

/** Minutes since midnight for a "7:30 PM" style label. */
export function timeLabelToMinutes(label: string): number {
	const [time, meridiem] = label.trim().split(' ');
	let [hours, minutes] = time.split(':').map(Number);
	if (meridiem?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
	if (meridiem?.toUpperCase() === 'AM' && hours === 12) hours = 0;
	return hours * 60 + (minutes || 0);
}

/** Inverse of {@link timeLabelToMinutes}, wrapping within a single day. */
export function minutesToTimeLabel(totalMinutes: number): string {
	const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
	const hours24 = Math.floor(wrapped / 60);
	const minutes = wrapped % 60;
	const meridiem = hours24 >= 12 ? 'PM' : 'AM';
	const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
	return `${hours12}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

/** A Date on `date`'s calendar day at the clock time in `label`. */
export function combineDateAndTime(date: Date, label: string): Date {
	const minutes = timeLabelToMinutes(label);
	const combined = new Date(date);
	combined.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
	return combined;
}

/** "Wed, Jul 29" — the label shown on the date buttons. */
export function formatDayLabel(date: Date): string {
	return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/** Clamps a date into the [min, max] window, comparing whole days. */
export function clampToDayWindow(date: Date, min?: Date | null, max?: Date | null): Date {
	const startOfDay = (d: Date) => {
		const copy = new Date(d);
		copy.setHours(0, 0, 0, 0);
		return copy;
	};
	if (min && startOfDay(date) < startOfDay(min)) return new Date(min);
	if (max && startOfDay(date) > startOfDay(max)) return new Date(max);
	return date;
}

/**
 * Sensible default schedule for a child entity (room / session) of an event:
 * it starts when the event starts and runs for `durationMinutes`, never
 * spilling past the event's own end.
 */
export function defaultScheduleWithin(
	windowStart: Date | null | undefined,
	windowEnd: Date | null | undefined,
	durationMinutes = 60
): { startDate: Date; startTime: string; endDate: Date; endTime: string } {
	const start = windowStart ? new Date(windowStart) : new Date();
	// Snap to the 30-minute grid the time picker offers, so the label the
	// organiser sees is always one they could have selected themselves.
	start.setMinutes(Math.floor(start.getMinutes() / TIME_STEP_MINUTES) * TIME_STEP_MINUTES, 0, 0);

	let end = new Date(start.getTime() + durationMinutes * 60_000);
	if (windowEnd && end > new Date(windowEnd)) end = new Date(windowEnd);
	if (end <= start) end = new Date(start.getTime() + durationMinutes * 60_000);

	return {
		startDate: start,
		startTime: toTimeLabel(start),
		endDate: end,
		endTime: toTimeLabel(end),
	};
}
