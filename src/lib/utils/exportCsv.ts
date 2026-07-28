/**
 * Lightweight client-side CSV export used by the participant-management tables
 * (Speakers / Vendors / Exhibitors / Collaboration Requests). Turns an array of
 * plain objects into a downloadable .csv — no backend round-trip needed.
 */

function escapeCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	let s: string;
	if (value instanceof Date) {
		s = value.toISOString();
	} else if (typeof value === 'object') {
		s = JSON.stringify(value);
	} else {
		s = String(value);
	}
	// Quote when the cell contains a comma, quote, or newline; escape quotes.
	if (/[",\n\r]/.test(s)) {
		s = `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

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
