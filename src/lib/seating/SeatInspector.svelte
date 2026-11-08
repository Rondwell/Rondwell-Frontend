<script lang="ts">
	/**
	 * Per-seat inspector — shown when individual seats are selected.
	 *
	 * The block inspector edits the *rule* (10 rows × 20, pitch 34, tier
	 * Standard). This edits the *exceptions*: the four aisle seats that
	 * are premium, the wheelchair space in row C, the two behind a pillar
	 * that do not exist.
	 *
	 * Everything here writes `seatOverrides` on the owning element rather
	 * than converting seats into standalone elements, so the block stays
	 * parametric and changing its row count later still works.
	 */
	import Icon from '@iconify/svelte';
	import type { SeatType } from './types';
	import type { RenderSeat } from './render2d';

	/** The selected seats, already resolved from the canvas. */
	export let seats: RenderSeat[] = [];
	export let seatTypes: SeatType[] = [];
	export let ticketTypes: Array<{ id: string; name: string; price?: number; currency?: string }> = [];

	export let onAssignType: (seatTypeId: string | null) => void = () => {};
	export let onSetLabel: (label: string | undefined) => void = () => {};
	export let onRemove: () => void = () => {};
	export let onRestore: () => void = () => {};
	export let onNudge: (dx: number, dy: number) => void = () => {};
	export let onReset: () => void = () => {};
	export let onSelectWholeRow: () => void = () => {};
	export let onSelectWholeBlock: () => void = () => {};
	export let onDuplicate: () => void = () => {};
	export let onEditSeatTypes: () => void = () => {};
	export let onClear: () => void = () => {};

	$: count = seats.length;
	$: single = count === 1 ? seats[0] : null;
	$: removedCount = seats.filter((s) => s.removed).length;
	$: liveCount = count - removedCount;

	/** The tier shared by the whole selection, or null when mixed. */
	$: commonTypeId = (() => {
		if (!count) return null;
		const first = seats[0].seatTypeId ?? null;
		return seats.every((s) => (s.seatTypeId ?? null) === first) ? first : null;
	})();
	$: mixedTypes =
		count > 1 && new Set(seats.map((s) => s.seatTypeId ?? '')).size > 1;

	/** Rows covered, so "select whole row" can say what it will do. */
	$: rowsCovered = new Set(seats.map((s) => `${s.section ?? ''}·${s.rowLabel ?? ''}`)).size;

	const NUDGE = 4;
</script>

{#if count === 0}
	<div class="flex flex-col items-center justify-center py-10 text-center">
		<Icon icon="mdi:cursor-default-click-outline" class="mb-2 h-8 w-8 text-gray-300" />
		<p class="text-sm font-medium text-gray-500">No seats selected</p>
		<p class="mt-1 max-w-[210px] text-xs text-gray-400">
			Tap a seat to edit it, or drag across the canvas to select a group.
		</p>
	</div>
{:else}
	<div class="space-y-4">
		<!-- Summary -->
		<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
			<p class="text-xs font-semibold text-emerald-800">
				{count.toLocaleString()} seat{count === 1 ? '' : 's'} selected
			</p>
			{#if single}
				<p class="mt-0.5 text-[11px] text-emerald-700">
					{single.section ? `${single.section} · ` : ''}Row {single.rowLabel} · Seat
					{single.seatIndex} — <span class="font-mono">{single.label}</span>
				</p>
			{:else if rowsCovered > 1}
				<p class="mt-0.5 text-[11px] text-emerald-700">across {rowsCovered} rows</p>
			{/if}
			{#if removedCount > 0}
				<p class="mt-0.5 text-[11px] text-emerald-700">
					{removedCount} of them removed
				</p>
			{/if}
		</div>

		<!-- Seat type / colour -->
		<div>
			<div class="mb-1.5 flex items-center justify-between">
				<h3 class="text-xs font-semibold tracking-wide text-gray-500 uppercase">
					Seat type
				</h3>
				<button type="button" class="text-[11px] text-pink-600 underline" on:click={onEditSeatTypes}>
					Manage
				</button>
			</div>

			<!--
				Swatches rather than a <select>: assigning a tier is the most
				frequent seat edit by far, and colour is how the organizer
				reads the map back. One tap, and it is visible on the canvas
				immediately.
			-->
			<div class="flex flex-wrap gap-1.5">
				{#each seatTypes as t (t.seatTypeId)}
					<button
						type="button"
						class="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] transition-all {commonTypeId ===
						t.seatTypeId
							? 'border-gray-900 ring-1 ring-gray-900'
							: 'hover:border-gray-400'}"
						title={t.ticketTypeId ? t.name : `${t.name} — no ticket type attached`}
						on:click={() => onAssignType(t.seatTypeId)}
					>
						<span class="h-3 w-3 rounded-sm" style="background-color: {t.color};"></span>
						<span class="text-gray-700">{t.name}</span>
						{#if !t.ticketTypeId}
							<Icon icon="mdi:alert-outline" class="h-3 w-3 text-amber-500" />
						{/if}
					</button>
				{/each}
				<button
					type="button"
					class="rounded-lg border px-2 py-1.5 text-[11px] text-gray-500 hover:border-gray-400 {commonTypeId ===
					null && !mixedTypes
						? 'border-gray-900 ring-1 ring-gray-900'
						: ''}"
					on:click={() => onAssignType(null)}
				>
					None
				</button>
			</div>

			{#if mixedTypes}
				<p class="mt-1 text-[10px] text-gray-400">
					Selection has mixed types. Choosing one applies it to all.
				</p>
			{/if}

			{#if commonTypeId}
				{@const st = seatTypes.find((t) => t.seatTypeId === commonTypeId)}
				{#if st && !st.ticketTypeId}
					<p class="mt-1 rounded bg-amber-50 p-1.5 text-[10px] text-amber-700">
						“{st.name}” has no ticket type, so these seats cannot be sold yet.
					</p>
				{:else if st}
					{@const tt = ticketTypes.find((t) => t.id === st.ticketTypeId)}
					{#if tt}
						<p class="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
							<Icon icon="mdi:ticket-outline" class="h-3.5 w-3.5 shrink-0" />
							<span class="truncate">
								{tt.name}{tt.price != null ? ` · ${tt.price}${tt.currency ? ` ${tt.currency}` : ''}` : ''}
							</span>
						</p>
					{/if}
				{/if}
			{/if}
		</div>

		<!-- Label, single seat only -->
		{#if single}
			<div>
				<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
					Seat label
				</h3>
				<input
					type="text"
					value={single.label}
					placeholder="auto"
					class="w-full rounded-lg border bg-white p-2 text-sm"
					on:change={(e) => onSetLabel(e.currentTarget.value || undefined)}
				/>
				<p class="mt-1 text-[10px] text-gray-400">
					Overrides the generated label. Clear it to go back to automatic numbering.
				</p>
			</div>
		{/if}

		<!-- Position -->
		<div>
			<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
				Nudge
			</h3>
			<div class="flex items-center gap-2">
				<div class="grid grid-cols-3 gap-1">
					<span></span>
					<button
						type="button"
						aria-label="Nudge up"
						class="flex h-7 w-7 items-center justify-center rounded border hover:bg-gray-50"
						on:click={() => onNudge(0, -NUDGE)}
					>
						<Icon icon="mdi:chevron-up" class="h-4 w-4 text-gray-600" />
					</button>
					<span></span>
					<button
						type="button"
						aria-label="Nudge left"
						class="flex h-7 w-7 items-center justify-center rounded border hover:bg-gray-50"
						on:click={() => onNudge(-NUDGE, 0)}
					>
						<Icon icon="mdi:chevron-left" class="h-4 w-4 text-gray-600" />
					</button>
					<button
						type="button"
						aria-label="Reset position"
						class="flex h-7 w-7 items-center justify-center rounded border hover:bg-gray-50"
						on:click={() => onNudge(0, 0)}
					>
						<Icon icon="mdi:circle-small" class="h-4 w-4 text-gray-400" />
					</button>
					<button
						type="button"
						aria-label="Nudge right"
						class="flex h-7 w-7 items-center justify-center rounded border hover:bg-gray-50"
						on:click={() => onNudge(NUDGE, 0)}
					>
						<Icon icon="mdi:chevron-right" class="h-4 w-4 text-gray-600" />
					</button>
					<span></span>
					<button
						type="button"
						aria-label="Nudge down"
						class="flex h-7 w-7 items-center justify-center rounded border hover:bg-gray-50"
						on:click={() => onNudge(0, NUDGE)}
					>
						<Icon icon="mdi:chevron-down" class="h-4 w-4 text-gray-600" />
					</button>
					<span></span>
				</div>
				<p class="flex-1 text-[10px] text-gray-400">
					Moves seats out of their grid position — for a seat pulled clear of a doorway or
					a camera platform. You can also just drag them.
				</p>
			</div>
		</div>

		<!-- Selection helpers -->
		<div>
			<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
				Select more
			</h3>
			<div class="grid grid-cols-2 gap-1.5">
				<button
					type="button"
					class="rounded-lg border px-2 py-2 text-[11px] hover:bg-gray-50"
					on:click={onSelectWholeRow}
				>
					Whole row{rowsCovered > 1 ? 's' : ''}
				</button>
				<button
					type="button"
					class="rounded-lg border px-2 py-2 text-[11px] hover:bg-gray-50"
					on:click={onSelectWholeBlock}
				>
					Whole block
				</button>
			</div>
		</div>

		<!-- Actions -->
		<div class="space-y-1.5 border-t pt-3">
			<button
				type="button"
				class="flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs hover:bg-gray-50"
				on:click={onDuplicate}
			>
				<Icon icon="mdi:content-duplicate" class="h-3.5 w-3.5" />
				Duplicate as loose seats
			</button>

			{#if liveCount > 0}
				<button
					type="button"
					class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-300 px-2 py-2 text-xs text-red-600 hover:bg-red-50"
					on:click={onRemove}
				>
					<Icon icon="mdi:seat-outline" class="h-3.5 w-3.5" />
					Remove {liveCount} seat{liveCount === 1 ? '' : 's'}
				</button>
			{/if}

			{#if removedCount > 0}
				<button
					type="button"
					class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400 px-2 py-2 text-xs text-emerald-700 hover:bg-emerald-50"
					on:click={onRestore}
				>
					<Icon icon="mdi:restore" class="h-3.5 w-3.5" />
					Restore {removedCount} seat{removedCount === 1 ? '' : 's'}
				</button>
			{/if}

			<div class="grid grid-cols-2 gap-1.5">
				<button
					type="button"
					class="rounded-lg border px-2 py-2 text-[11px] text-gray-600 hover:bg-gray-50"
					on:click={onReset}
				>
					Reset to block
				</button>
				<button
					type="button"
					class="rounded-lg border px-2 py-2 text-[11px] text-gray-600 hover:bg-gray-50"
					on:click={onClear}
				>
					Deselect
				</button>
			</div>
			<p class="text-[10px] text-gray-400">
				“Reset to block” clears every change on these seats and lets the block decide again.
			</p>
		</div>
	</div>
{/if}
