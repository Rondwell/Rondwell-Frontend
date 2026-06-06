/**
 * FE-P3-07 (NEW-9.3) — Browser time-zone helper.
 *
 * Wallet earnings, transactions list, sales summary and other financial
 * endpoints accept a `tz` IANA query-string parameter. The frontend
 * defaults to the browser's resolved zone so an organizer in Lagos sees
 * Lagos days, not UTC days.
 *
 * Used by: wallet/earnings + sales-summary callers.
 */

export function getBrowserTz(): string {
	try {
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return tz || 'UTC';
	} catch {
		return 'UTC';
	}
}

/** Common zones surfaced in the TZ-override dropdown. */
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
	{ value: 'Africa/Lagos', label: 'Lagos (WAT)' },
	{ value: 'Africa/Accra', label: 'Accra (GMT)' },
	{ value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
	{ value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
	{ value: 'Europe/London', label: 'London' },
	{ value: 'Europe/Paris', label: 'Paris' },
	{ value: 'America/New_York', label: 'New York' },
	{ value: 'America/Los_Angeles', label: 'Los Angeles' },
	{ value: 'Asia/Dubai', label: 'Dubai' },
	{ value: 'Asia/Singapore', label: 'Singapore' },
	{ value: 'UTC', label: 'UTC' },
];
