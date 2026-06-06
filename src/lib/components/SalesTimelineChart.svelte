<script lang="ts">
	/**
	 * FE-P3-12 (NEW-1.4 / FA-9.1) — Sales timeline chart.
	 *
	 * Lightweight inline-SVG line chart for an event's daily revenue
	 * timeline. Plots gross + net (kobo) and overlays the count of tickets
	 * sold on a secondary axis.
	 *
	 * No charting library to avoid a heavy dependency for this single use.
	 * The chart auto-fits its container via a viewBox.
	 */
	import { formatMoney } from '$lib/utils/money';

	export let data: Array<{ day: string; gross: number; net: number; count: number }> = [];
	export let currency: string = 'NGN';
	export let height: number = 220;

	const PADDING = { top: 16, right: 48, bottom: 32, left: 64 };
	const VIEW_W = 800;
	$: VIEW_H = height;

	$: maxAmount = Math.max(1, ...data.map((d) => Math.max(d.gross, d.net)));
	$: maxCount = Math.max(1, ...data.map((d) => d.count));

	function xFor(i: number): number {
		if (data.length <= 1) return PADDING.left;
		return PADDING.left + ((VIEW_W - PADDING.left - PADDING.right) * i) / (data.length - 1);
	}

	function yForAmount(v: number): number {
		const inner = VIEW_H - PADDING.top - PADDING.bottom;
		return PADDING.top + inner * (1 - v / maxAmount);
	}

	function yForCount(v: number): number {
		const inner = VIEW_H - PADDING.top - PADDING.bottom;
		return PADDING.top + inner * (1 - v / maxCount);
	}

	$: grossPath = data
		.map((d, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(2)},${yForAmount(d.gross).toFixed(2)}`)
		.join(' ');
	$: netPath = data
		.map((d, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(2)},${yForAmount(d.net).toFixed(2)}`)
		.join(' ');

	function fmtDay(iso: string): string {
		try {
			return new Date(iso + 'T00:00:00Z').toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
			});
		} catch {
			return iso;
		}
	}

	function tickStep(): number {
		// Show roughly 6 x-axis labels regardless of dataset size.
		return Math.max(1, Math.ceil(data.length / 6));
	}
</script>

{#if data.length === 0}
	<div class="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-400">
		No sales data for this period yet.
	</div>
{:else}
	<div class="rounded-xl border bg-white p-4">
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-3 text-xs">
				<span class="flex items-center gap-1.5"><span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span> Gross</span>
				<span class="flex items-center gap-1.5"><span class="inline-block h-2 w-2 rounded-full bg-pink-500"></span> Net</span>
				<span class="flex items-center gap-1.5"><span class="inline-block h-2 w-2 rounded-full bg-blue-400"></span> Tickets sold</span>
			</div>
		</div>
		<svg viewBox="0 0 {VIEW_W} {VIEW_H}" class="w-full" role="img" aria-label="Sales timeline">
			<!-- Grid -->
			<line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={VIEW_H - PADDING.bottom} stroke="#e5e7eb" />
			<line x1={PADDING.left} y1={VIEW_H - PADDING.bottom} x2={VIEW_W - PADDING.right} y2={VIEW_H - PADDING.bottom} stroke="#e5e7eb" />

			<!-- Y-axis (amount) tick labels -->
			{#each [0, 0.25, 0.5, 0.75, 1] as t}
				<text x={PADDING.left - 6} y={yForAmount(maxAmount * t) + 3} text-anchor="end" font-size="10" fill="#9ca3af">
					{formatMoney(Math.round(maxAmount * t), currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
				</text>
				<line
					x1={PADDING.left}
					y1={yForAmount(maxAmount * t)}
					x2={VIEW_W - PADDING.right}
					y2={yForAmount(maxAmount * t)}
					stroke="#f3f4f6"
				/>
			{/each}

			<!-- Right-axis (count) tick labels -->
			{#each [0, 0.5, 1] as t}
				<text
					x={VIEW_W - PADDING.right + 6}
					y={yForCount(maxCount * t) + 3}
					text-anchor="start"
					font-size="10"
					fill="#9ca3af"
				>
					{Math.round(maxCount * t)}
				</text>
			{/each}

			<!-- Count bars -->
			{#each data as d, i}
				{@const x = xFor(i)}
				{@const barHeight = (VIEW_H - PADDING.bottom) - yForCount(d.count)}
				{@const barWidth = Math.max(2, (VIEW_W - PADDING.left - PADDING.right) / Math.max(1, data.length) - 2)}
				<rect
					x={x - barWidth / 2}
					y={yForCount(d.count)}
					width={barWidth}
					height={Math.max(0, barHeight)}
					fill="rgba(96, 165, 250, 0.25)"
					rx="1.5"
				/>
			{/each}

			<!-- Lines -->
			<path d={grossPath} fill="none" stroke="#10b981" stroke-width="2" />
			<path d={netPath} fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="4 3" />

			<!-- Dots -->
			{#each data as d, i}
				<circle cx={xFor(i)} cy={yForAmount(d.gross)} r="2.5" fill="#10b981">
					<title>{fmtDay(d.day)} · gross {formatMoney(d.gross, currency)} · net {formatMoney(d.net, currency)} · {d.count} tickets</title>
				</circle>
			{/each}

			<!-- X-axis labels -->
			{#each data as d, i}
				{#if i % tickStep() === 0 || i === data.length - 1}
					<text x={xFor(i)} y={VIEW_H - PADDING.bottom + 16} text-anchor="middle" font-size="10" fill="#9ca3af">
						{fmtDay(d.day)}
					</text>
				{/if}
			{/each}
		</svg>
	</div>
{/if}
