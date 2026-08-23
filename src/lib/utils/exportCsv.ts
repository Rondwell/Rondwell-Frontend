/**
 * Lightweight client-side CSV export used by the participant-management tables
 * (Speakers / Vendors / Exhibitors / Collaboration Requests). Turns an array of
 * plain objects into a downloadable .csv — no backend round-trip needed.
 */

/**
 * H-28 — this module's own `escapeCell` is gone; it delegates to `csvCell`.
 *
 * The version it replaced quoted correctly per RFC 4180 and **had no formula
 * guard at all** — no leading-character test anywhere. Quoting protects the
 * *file format*: it stops a comma inside a value becoming a column break. It
 * does not stop Excel, Sheets, LibreOffice or Numbers evaluating a cell whose
 * text begins with `=`, `+`, `-` or `@`, because quotes are stripped during
 * parsing and evaluation happens afterwards.
 *
 * The consumers are the participant-management tables — Speakers, Vendors,
 * Exhibitors, Collaboration Requests — every column of which is **text a third
 * party typed about themselves**. A vendor sets their business name to a
 * `=HYPERLINK(...)` formula, the organizer exports the table, and it executes
 * when they open it.
 *
 * `csvCell` in `./csv.ts` already had the guard and was already the correct
 * one. Two implementations of the same function, one safe and one not, IS the
 * finding — so this file now has none of its own.
 */
import { csvCell } from './csv';

const escapeCell = csvCell;

export interface CsvColumn<T> {
	header: string;
	/** Accessor returning the cell value for a row. */
	value: (row: T) => unknown;
}

/**
 * Build a CSV string from rows + column definitions.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
	const headerLine = columns.map((c) => escapeCell(c.header)).join(',');
	const dataLines = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(','));
	return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Trigger a browser download of a CSV file built from rows + columns.
 * Returns false (no-op) when there are no rows.
 */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): boolean {
	if (!rows || rows.length === 0) return false;
	const csv = toCsv(rows, columns);
	// Prepend a UTF-8 BOM so Excel opens accented characters correctly.
	const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	// Revoke on the next tick so the click has time to register.
	setTimeout(() => URL.revokeObjectURL(url), 0);
	return true;
}

/** Slugify a title into a safe filename fragment. */
export function safeFilePart(input: string): string {
	return (input || 'export')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
		.slice(0, 60) || 'export';
}
