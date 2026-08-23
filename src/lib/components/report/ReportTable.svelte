<script lang="ts">
	/**
	 * Report table.
	 *
	 * The single table primitive used by the printed event report. It exists so
	 * every section renders identically and so print behaviour — repeating
	 * headers across pages, no row split across a page break — is defined once
	 * rather than per section.
	 *
	 * `thead` repeats automatically on every printed page because it is a real
	 * `<thead>`; that only works if the header lives there, which is why this
	 * takes columns as data instead of a slot.
	 */
	export let title = '';
	export let columns: { header: string; value: (row: any) => unknown }[] = [];
	export let rows: any[] = [];
	/** Cap very long tables in the PDF; the CSV always carries every row. */
	export let maxRows = 0;
	export let emptyText = 'No records.';
	/** Right-align numeric-looking columns for readability. */
	export let numericColumns: string[] = [];

	$: shown = maxRows > 0 ? rows.slice(0, maxRows) : rows;
	$: truncated = maxRows > 0 && rows.length > maxRows ? rows.length - maxRows : 0;

	function display(v: unknown): string {
		if (v === null || v === undefined) return '—';
		const s = String(v);
		return s.trim() === '' ? '—' : s;
	}
</script>

<section class="rt-section">
	{#if title}
		<h3 class="rt-title">{title}</h3>
	{/if}

	{#if !rows || rows.length === 0}
		<p class="rt-empty">{emptyText}</p>
	{:else}
		<div class="rt-scroll">
			<table class="rt-table">
				<thead>
					<tr>
						{#each columns as col}
							<th class:num={numericColumns.includes(col.header)}>{col.header}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each shown as row}
						<tr>
							{#each columns as col}
								<td class:num={numericColumns.includes(col.header)}>{display(col.value(row))}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if truncated > 0}
			<p class="rt-note">
				Showing the first {shown.length.toLocaleString()} of {rows.length.toLocaleString()} rows. Download
				the CSV for the complete list.
			</p>
		{/if}
	{/if}
</section>

<style>
	.rt-section {
		margin-bottom: 22px;
		/* Keep a section's heading with at least the start of its table. */
		break-inside: auto;
	}

	.rt-title {
		margin: 0 0 8px;
		font-size: 12.5px;
		font-weight: 700;
		letter-spacing: 0.01em;
		color: var(--rp-ink, #14121a);
		break-after: avoid;
		page-break-after: avoid;
	}

	.rt-scroll {
		overflow-x: auto;
	}

	.rt-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 9.5px;
		line-height: 1.45;
	}

	.rt-table th {
		background: var(--rp-head-bg, #f4f2f8);
		border-bottom: 1.5px solid var(--rp-accent, #6b46c1);
		padding: 6px 8px;
		text-align: left;
		font-weight: 700;
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.045em;
		color: var(--rp-muted-ink, #4a4458);
		white-space: nowrap;
	}

	.rt-table td {
		border-bottom: 1px solid var(--rp-rule, #e8e5ef);
		padding: 5px 8px;
		vertical-align: top;
		color: var(--rp-ink, #14121a);
		/* Long emails and URLs must wrap rather than blow out the page width. */
		word-break: break-word;
	}

	.rt-table th.num,
	.rt-table td.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.rt-table tbody tr:nth-child(even) td {
		background: var(--rp-zebra, #faf9fc);
	}

	.rt-empty {
		margin: 0;
		padding: 10px 12px;
		border: 1px dashed var(--rp-rule, #e8e5ef);
		border-radius: 6px;
		font-size: 10px;
		color: var(--rp-muted-ink, #4a4458);
	}

	.rt-note {
		margin: 6px 0 0;
		font-size: 8.5px;
		font-style: italic;
		color: var(--rp-muted-ink, #4a4458);
	}

	@media print {
		/* Repeat the header on every page the table spans. */
		.rt-table thead {
			display: table-header-group;
		}
		.rt-table tr {
			break-inside: avoid;
			page-break-inside: avoid;
		}
		.rt-scroll {
			overflow: visible;
		}
		/* Zebra striping must survive the browser's "background graphics" default. */
		.rt-table th,
		.rt-table tbody tr:nth-child(even) td {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
	}
</style>
