/**
 * CSV parsing for contact imports (attendee invitations, collection subscribers).
 *
 * Replaces the `text.split('\n')` + `line.split(',')` approach that both import
 * modals previously used. That shortcut silently corrupted or dropped rows in
 * several common cases, all of which real organiser spreadsheets hit:
 *
 *  • **Quoted commas.** `"Doe, John",john@x.com` split into three fields, so the
 *    email landed in the wrong column and the row was discarded as invalid.
 *  • **Header false-positives.** The header check tested whether the whole first
 *    line contained the substring "email", so a headerless file beginning with
 *    `john@email.com` was treated as a header and that person was silently
 *    dropped.
 *  • **Excel BOM.** Excel writes UTF-8 with a leading ﻿, which became part
 *    of the first cell — turning `email` into `﻿email`, or corrupting the
 *    first address in a headerless file.
 *  • **Lone-CR line endings.** Files exported by older Mac tooling parsed as a
 *    single enormous line.
 *
 * Everything here is intentionally dependency-free and synchronous.
 */

/** Hard ceiling on rows accepted from one file, to protect the UI and the quota. */
export const CSV_MAX_ROWS = 5000;
/** Hard ceiling on file size. Contact lists are text; anything larger is a mistake. */
export const CSV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export interface CsvContact {
	email: string;
	name: string;
	firstName: string;
	lastName: string;
}

export interface CsvImportResult {
	/** Valid, de-duplicated contacts, in file order. */
	contacts: CsvContact[];
	stats: {
		/** Data rows found (excludes the header). */
		totalRows: number;
		/** Rows that produced a usable contact. */
		imported: number;
		/** Rows rejected because the email was missing or malformed. */
		invalid: number;
		/** Rows dropped because the same email appeared earlier in the file. */
		duplicates: number;
		/** Rows beyond CSV_MAX_ROWS that were not read. */
		truncated: number;
	};
	/** Human-readable notes about the first few rejected rows, for the UI. */
	issues: string[];
	/** Set when the file itself could not be used at all. */
	fatalError?: string;
}

/**
 * Pragmatic email check.
 *
 * Deliberately not RFC 5322 — that regex accepts things no mail server does and
 * rejects nothing users actually type. This catches the realistic mistakes:
 * missing @, missing domain, missing TLD, stray whitespace.
 */
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;

export function isValidEmail(value: string): boolean {
	return EMAIL_RE.test(value.trim());
}

/**
 * Parse CSV text into a grid, honouring RFC 4180 quoting.
 *
 * Handles quoted fields containing commas, escaped quotes (`""`), and newlines
 * inside quotes. Normalises CRLF and lone CR to LF, and strips a UTF-8 BOM.
 */
export function parseCsvGrid(input: string): string[][] {
	const text = input.replace(/^﻿/, '').replace(/\r\n?/g, '\n');

	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];

		if (inQuotes) {
			if (ch === '"') {
				// A doubled quote inside quotes is a literal quote.
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += ch;
			}
			continue;
		}

		if (ch === '"') {
			inQuotes = true;
		} else if (ch === ',') {
			row.push(field);
			field = '';
		} else if (ch === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += ch;
		}
	}

	// Flush whatever the last line left behind.
	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	// Drop rows that are entirely empty (trailing newlines, blank separator lines).
	return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Column aliases we recognise, so exports from other tools work unmodified. */
const EMAIL_HEADERS = ['email', 'email address', 'e-mail', 'emailaddress', 'mail'];
const NAME_HEADERS = ['name', 'full name', 'fullname', 'display name'];
const FIRST_HEADERS = ['first name', 'firstname', 'first', 'given name'];
const LAST_HEADERS = ['last name', 'lastname', 'last', 'surname', 'family name'];

const norm = (s: string) => s.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

/**
 * Decide whether row 0 is a header, by testing whether any *cell* is a known
 * column name — not whether the line happens to contain the text "email".
 */
function detectHeader(first: string[]): boolean {
	return first.some((cell) => {
		const c = norm(cell);
		return (
			EMAIL_HEADERS.includes(c) ||
			NAME_HEADERS.includes(c) ||
			FIRST_HEADERS.includes(c) ||
			LAST_HEADERS.includes(c)
		);
	});
}

interface ColumnMap {
	email: number;
	name: number;
	first: number;
	last: number;
}

function mapColumns(header: string[] | null): ColumnMap {
	// Positional default matches the template we hand out: email,name
	const map: ColumnMap = { email: 0, name: 1, first: -1, last: -1 };
	if (!header) return map;

	map.email = -1;
	map.name = -1;
	header.forEach((cell, i) => {
		const c = norm(cell);
		if (map.email === -1 && EMAIL_HEADERS.includes(c)) map.email = i;
		else if (map.first === -1 && FIRST_HEADERS.includes(c)) map.first = i;
		else if (map.last === -1 && LAST_HEADERS.includes(c)) map.last = i;
		else if (map.name === -1 && NAME_HEADERS.includes(c)) map.name = i;
	});

	// A header without a recognisable email column: fall back to the first cell
	// that looks like an address rather than refusing the file outright.
	if (map.email === -1) map.email = 0;
	return map;
}

function splitName(full: string): { firstName: string; lastName: string } {
	const trimmed = full.trim();

	// "Smith, John" — the surname-first convention most CRM and mail tools export.
	// Only treated as such when there is exactly one comma with text on both
	// sides, so "Jr., Bob" style noise does not silently invert a name.
	const commaParts = trimmed.split(',');
	if (commaParts.length === 2) {
		const last = commaParts[0].trim();
		const first = commaParts[1].trim();
		if (last && first) return { firstName: first, lastName: last };
	}

	const parts = trimmed.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
	return {
		firstName: parts[0] ?? '',
		lastName: parts.slice(1).join(' ')
	};
}

/**
 * Parse a contact list, de-duplicating by email (case-insensitive) and
 * reporting exactly what was skipped and why.
 */
export function parseContactCsv(text: string, maxRows = CSV_MAX_ROWS): CsvImportResult {
	const result: CsvImportResult = {
		contacts: [],
		stats: { totalRows: 0, imported: 0, invalid: 0, duplicates: 0, truncated: 0 },
		issues: []
	};

	let grid: string[][];
	try {
		grid = parseCsvGrid(text);
	} catch {
		result.fatalError = 'This file could not be read as CSV.';
		return result;
	}

	if (grid.length === 0) {
		result.fatalError = 'The file is empty.';
		return result;
	}

	const hasHeader = detectHeader(grid[0]);
	const cols = mapColumns(hasHeader ? grid[0] : null);
	const dataRows = hasHeader ? grid.slice(1) : grid;

	result.stats.totalRows = dataRows.length;

	if (dataRows.length > maxRows) {
		result.stats.truncated = dataRows.length - maxRows;
	}

	const seen = new Set<string>();
	const cell = (row: string[], i: number) => (i >= 0 ? (row[i] ?? '').trim() : '');

	for (const row of dataRows.slice(0, maxRows)) {
		const rawEmail = cell(row, cols.email);
		const email = rawEmail.toLowerCase();

		if (!email) {
			result.stats.invalid++;
			continue;
		}
		if (!isValidEmail(email)) {
			result.stats.invalid++;
			if (result.issues.length < 5)
				result.issues.push(`Skipped "${rawEmail}" — not a valid email address.`);
			continue;
		}
		if (seen.has(email)) {
			result.stats.duplicates++;
			continue;
		}
		seen.add(email);

		// Prefer explicit first/last columns; otherwise split a single name column.
		let firstName = cell(row, cols.first);
		let lastName = cell(row, cols.last);
		const nameCell = cell(row, cols.name);

		if (!firstName && !lastName && nameCell) {
			({ firstName, lastName } = splitName(nameCell));
		}

		const name = [firstName, lastName].filter(Boolean).join(' ') || nameCell || '';

		result.contacts.push({ email, name, firstName, lastName });
	}

	result.stats.imported = result.contacts.length;

	if (result.stats.truncated > 0) {
		result.issues.push(
			`Only the first ${maxRows.toLocaleString()} rows were imported (${result.stats.truncated.toLocaleString()} more were ignored).`
		);
	}

	return result;
}

/** Validate the chosen file before we spend time reading it. */
export function validateCsvFile(file: File): string | null {
	if (file.size === 0) return 'That file is empty.';
	if (file.size > CSV_MAX_BYTES) {
		return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please upload a CSV under ${CSV_MAX_BYTES / 1024 / 1024} MB.`;
	}
	const name = file.name.toLowerCase();
	const looksCsv =
		name.endsWith('.csv') ||
		name.endsWith('.txt') ||
		file.type === 'text/csv' ||
		file.type === 'text/plain' ||
		file.type === '';
	if (!looksCsv) {
		// Spreadsheets are the common mistake — say what to do about it.
		if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
			return 'Excel files are not supported. In Excel choose File → Save As → CSV, then upload that.';
		}
		return 'Please upload a .csv file.';
	}
	return null;
}

/** Read a File as text with a hard failure path (FileReader errors are silent otherwise). */
export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ''));
		reader.onerror = () =>
			reject(new Error('The file could not be read. It may be open in another program.'));
		reader.readAsText(file);
	});
}

/* ─────────────────────────── Writing CSV ─────────────────────────── */

/**
 * Escape a single value for CSV output.
 *
 * Quotes any field containing a comma, quote, or newline, and doubles embedded
 * quotes — the inverse of the parser above, so a file we export re-imports
 * cleanly.
 *
 * Also defuses spreadsheet formula injection: a cell beginning with = + - or @
 * is executed as a formula by Excel and Sheets when the file is opened, which
 * turns an attendee-supplied name into a code-execution vector for whoever
 * opens the export. Prefixing a tab neutralises it while displaying normally.
 */
export function csvCell(value: unknown): string {
	if (value === null || value === undefined) return '';

	let s: string;
	if (value instanceof Date) s = isNaN(value.getTime()) ? '' : value.toISOString();
	else if (typeof value === 'object') s = JSON.stringify(value);
	else s = String(value);

	if (/^[=+\-@\t\r]/.test(s)) s = `\t${s}`;

	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

export interface CsvColumn<T> {
	/** Column heading written to the file. */
	header: string;
	/** Pull the value for one row. */
	value: (row: T) => unknown;
}

/** Build CSV text from rows and an explicit column spec. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
	const head = columns.map((c) => csvCell(c.header)).join(',');
	const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(','));
	return [head, ...body].join('\r\n');
}

/**
 * Build a multi-section CSV — several titled tables in one file.
 *
 * Excel and Sheets both open this fine, and it keeps a full event report to a
 * single download instead of a zip of files.
 */
export function toSectionedCsv(sections: Array<{ title: string; lines: string[] }>): string {
	const out: string[] = [];
	for (const section of sections) {
		out.push(csvCell(`── ${section.title} ──`));
		out.push(...section.lines);
		out.push('');
	}
	return out.join('\r\n');
}

/** Timestamped, filesystem-safe filename: "my-event-attendees-2026-08-02.csv". */
export function exportFilename(base: string, suffix: string, ext = 'csv'): string {
	const slug =
		base
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'event';
	const date = new Date().toISOString().split('T')[0];
	return `${slug}-${suffix}-${date}.${ext}`;
}

/** One-line summary of an import, for display under the upload control. */
export function summariseImport(stats: CsvImportResult['stats']): string {
	const bits = [
		`${stats.imported.toLocaleString()} contact${stats.imported === 1 ? '' : 's'} ready`
	];
	if (stats.duplicates > 0)
		bits.push(`${stats.duplicates} duplicate${stats.duplicates === 1 ? '' : 's'} merged`);
	if (stats.invalid > 0)
		bits.push(`${stats.invalid} invalid row${stats.invalid === 1 ? '' : 's'} skipped`);
	return bits.join(' · ');
}

/** Build the sample CSV we hand to organisers. */
export function contactCsvTemplate(): string {
	return [
		'email,first name,last name',
		'john@example.com,John,Doe',
		'jane@example.com,Jane,Smith',
		'"o.brien@example.com",Aisha,"O\'Brien"'
	].join('\n');
}

/** Trigger a client-side download of CSV text. */
export function downloadCsv(filename: string, csv: string) {
	// Prepend a BOM so Excel opens UTF-8 names correctly.
	const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	// Revoke on the next tick — revoking synchronously can cancel the download
	// in Safari before it starts.
	setTimeout(() => URL.revokeObjectURL(url), 0);
}
