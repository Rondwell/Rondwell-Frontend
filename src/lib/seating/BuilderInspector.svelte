<script lang="ts">
	/**
	 * Element inspector.
	 *
	 * The old right-hand panel exposed rotation, a colour, a lock and three
	 * free-text fields (seat number / row / section). The generator
	 * parameters the schema already had — `rows`, `cols`, `seatCount` — were
	 * not editable anywhere, so the only way to shape a venue was to place
	 * and nudge individual sprites.
	 *
	 * Everything that changes the geometry is here, grouped by the question
	 * the organizer is asking: how big, how is it shaped, how are the seats
	 * labelled, what tier are they.
	 *
	 * Numeric inputs commit under a shared coalesce key, so dragging a
	 * number field is one undo step rather than one per value.
	 */
	import Icon from '@iconify/svelte';
	import type { LayoutElement, SeatType, SeatNumbering } from './types';
	import { isMultiSeat, isSeatGenerating } from './types';
	import { countSeatsForElement } from './geometry';
	import { describeElement } from './palette';

	export let element: LayoutElement | null = null;
	/** More than one selected: only shared properties are editable. */
	export let multiCount = 0;
	export let seatTypes: SeatType[] = [];
	export let layoutNumbering: SeatNumbering = {};
	/** Ticket types from the event, for binding tiers. */
	export let ticketTypes: Array<{ id: string; name: string; price?: number; currency?: string }> = [];

	export let onPatch: (patch: Partial<LayoutElement>, coalesceKey?: string | null) => void = () => {};
	export let onPatchAll: (patch: Partial<LayoutElement>, coalesceKey?: string | null) => void = () => {};
	export let onDuplicate: () => void = () => {};
	export let onDelete: () => void = () => {};
	export let onAlign: (mode: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY') => void = () => {};
	export let onDistribute: (axis: 'x' | 'y') => void = () => {};
	export let onReorder: (dir: 'front' | 'back') => void = () => {};
	export let onEditSeatTypes: () => void = () => {};

	$: seatCount = element && isSeatGenerating(element.type)
		? countSeatsForElement(element, layoutNumbering)
		: 0;

	$: numbering = { ...layoutNumbering, ...(element?.numbering ?? {}) };

	/** Patch the element's numbering override. */
	function patchNumbering(patch: Partial<SeatNumbering>, key: string) {
		if (!element) return;
		onPatch({ numbering: { ...(element.numbering ?? {}), ...patch } }, key);
	}

	function num(v: string, fallback: number): number {
		const n = Number(v);
		return Number.isFinite(n) ? n : fallback;
	}

	/**
	 * Resize the element's box to match its generated seats.
	 *
	 * Changing `rows` or `cols` changes how many seats exist but not the
	 * box that selection, marquee hit-testing and zoom-to-fit use. Keeping
	 * them in step means the outline always matches what is drawn — a box
	 * that disagrees with its contents looks fine until you try to click it.
	 */
	function syncBox(patch: Partial<LayoutElement>, key: string) {
		if (!element) return;
		const next = { ...element, ...patch };
		if (isMultiSeat(next.type) && next.type !== 'ROUND_TABLE' && next.type !== 'SQUARE_TABLE') {
			const cols = next.cols ?? 1;
			const rows = next.rows ?? 1;
			const aisles = (next.aisleAfter ?? []).length;
			patch = {
				...patch,
				width: (cols + aisles) * (next.seatSpacing ?? 34),
				height: rows * (next.rowSpacing ?? 40)
			};
		}
		onPatch(patch, key);
	}

	/** Aisle list ⇄ comma-separated text. */
	$: aisleText = (element?.aisleAfter ?? []).join(', ');
	function commitAisles(text: string) {
		if (!element) return;
		const list = text
			.split(/[,\s]+/)
			.map((s) => parseInt(s, 10))
			.filter((n) => Number.isFinite(n) && n > 0);
		syncBox({ aisleAfter: list.length ? list : undefined }, 'aisles');
	}

	const LABEL_PATTERNS = [
		{ value: '{row}{seat}', label: 'A12' },
		{ value: '{row}-{seat}', label: 'A-12' },
		{ value: '{section}-{row}{seat}', label: 'VIP-A12' },
		{ value: '{section} {row}{seat}', label: 'VIP A12' },
		{ value: '{seat}', label: '12' }
	];
</script>

{#if multiCount > 1}
	<!-- ── Multi-selection ── -->
	<div class="space-y-4">
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
			<p class="text-xs font-semibold text-blue-800">{multiCount} elements selected</p>
			<p class="mt-0.5 text-[11px] text-blue-600">Changes apply to all of them.</p>
		</div>

		<div>
			<h3 class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Align</h3>
			<div class="grid grid-cols-6 gap-1">
				{#each [['left', 'mdi:align-horizontal-left'], ['centerX', 'mdi:align-horizontal-center'], ['right', 'mdi:align-horizontal-right'], ['top', 'mdi:align-vertical-top'], ['centerY', 'mdi:align-vertical-center'], ['bottom', 'mdi:align-vertical-bottom']] as [mode, icon]}
					<button
						type="button"
						class="flex h-8 items-center justify-center rounded border hover:bg-gray-50"
						title={`Align ${mode}`}
						on:click={() => onAlign(mode as any)}
					>
						<Icon {icon} class="h-4 w-4 text-gray-600" />
					</button>
				{/each}
			</div>
			<div class="mt-1.5 grid grid-cols-2 gap-1">
				<button
					type="button"
					class="rounded border px-2 py-1.5 text-[11px] hover:bg-gray-50"
					on:click={() => onDistribute('x')}
				>
					Space evenly ↔
				</button>
				<button
					type="button"
					class="rounded border px-2 py-1.5 text-[11px] hover:bg-gray-50"
					on:click={() => onDistribute('y')}
				>
					Space evenly ↕
				</button>
			</div>
		</div>

		<div>
			<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
				Seat type for all
			</h3>
			<select
				class="w-full rounded-lg border bg-white p-2 text-sm"
				on:change={(e) => onPatchAll({ seatTypeId: e.currentTarget.value || null })}
			>
				<option value="">— Leave unchanged —</option>
				{#each seatTypes as t (t.seatTypeId)}
					<option value={t.seatTypeId}>{t.name}</option>
				{/each}
			</select>
		</div>

		<div>
			<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">Section</h3>
			<input
				type="text"
				placeholder="e.g. Stalls"
				class="w-full rounded-lg border bg-white p-2 text-sm"
				on:change={(e) => onPatchAll({ section: e.currentTarget.value || undefined })}
			/>
		</div>

		<div class="flex gap-1.5">
			<button
				type="button"
				class="flex-1 rounded-lg border px-2 py-2 text-xs hover:bg-gray-50"
				on:click={onDuplicate}
			>
				<Icon icon="mdi:content-copy" class="mr-1 inline h-3.5 w-3.5" /> Duplicate
			</button>
			<button
				type="button"
				class="flex-1 rounded-lg border border-red-300 px-2 py-2 text-xs text-red-600 hover:bg-red-50"
				on:click={onDelete}
			>
				<Icon icon="mdi:delete-outline" class="mr-1 inline h-3.5 w-3.5" /> Delete
			</button>
		</div>
	</div>
{:else if element}
	<!-- ── Single element ── -->
	<div class="space-y-4">
		<div>
			<p class="text-sm font-semibold text-gray-900">
				{element.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
			</p>
			<p class="text-[11px] text-gray-500">{describeElement(element, seatCount)}</p>
		</div>

		<!-- Seats: how many -->
		{#if isMultiSeat(element.type)}
			<div>
				<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">Seats</h3>
				{#if element.type === 'ROUND_TABLE' || element.type === 'SQUARE_TABLE'}
					<label class="block">
						<span class="text-[11px] text-gray-500">Seats around the table</span>
						<input
							type="number"
							min="1"
							max="40"
							value={element.cols ?? 8}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:input={(e) => onPatch({ cols: num(e.currentTarget.value, 8) }, 'cols')}
						/>
					</label>
				{:else}
					<div class="grid grid-cols-2 gap-2">
						{#if element.type === 'SEAT_BLOCK'}
							<label class="block">
								<span class="text-[11px] text-gray-500">Rows</span>
								<input
									type="number"
									min="1"
									max="500"
									value={element.rows ?? 1}
									class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
									on:input={(e) => syncBox({ rows: num(e.currentTarget.value, 1) }, 'rows')}
								/>
							</label>
						{/if}
						<label class="block" class:col-span-2={element.type !== 'SEAT_BLOCK'}>
							<span class="text-[11px] text-gray-500">Seats per row</span>
							<input
								type="number"
								min="1"
								max="500"
								value={element.cols ?? 1}
								class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
								on:input={(e) => syncBox({ cols: num(e.currentTarget.value, 1) }, 'cols')}
							/>
						</label>
					</div>
				{/if}
			</div>

			<!-- Spacing -->
			<div>
				<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
					Spacing
				</h3>
				<div class="grid grid-cols-2 gap-2">
					<label class="block">
						<span class="text-[11px] text-gray-500">Seat pitch</span>
						<input
							type="number"
							min="8"
							max="200"
							value={element.seatSpacing ?? 34}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:input={(e) => syncBox({ seatSpacing: num(e.currentTarget.value, 34) }, 'pitch')}
						/>
					</label>
					<label class="block">
						<span class="text-[11px] text-gray-500">Row pitch</span>
						<input
							type="number"
							min="8"
							max="200"
							value={element.rowSpacing ?? 40}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:input={(e) => syncBox({ rowSpacing: num(e.currentTarget.value, 40) }, 'rowpitch')}
						/>
					</label>
					<label class="col-span-2 block">
						<span class="text-[11px] text-gray-500">Seat size</span>
						<input
							type="range"
							min="10"
							max="60"
							value={element.seatSize ?? 28}
							class="mt-1 w-full"
							on:input={(e) => onPatch({ seatSize: num(e.currentTarget.value, 28) }, 'seatsize')}
						/>
					</label>
				</div>
			</div>

			<!-- Shape: curvature, rake, aisles -->
			{#if element.type !== 'ROUND_TABLE' && element.type !== 'SQUARE_TABLE'}
				<div>
					<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
						Shape
					</h3>

					<label class="block">
						<span class="flex items-center justify-between text-[11px] text-gray-500">
							<span>Curve toward stage</span>
							<span class="font-mono">{Math.round(element.curvature ?? 0)}°</span>
						</span>
						<input
							type="range"
							min="0"
							max="120"
							value={element.curvature ?? 0}
							class="mt-1 w-full"
							on:input={(e) => onPatch({ curvature: num(e.currentTarget.value, 0) }, 'curve')}
						/>
					</label>

					<label class="mt-2 block">
						<span class="flex items-center justify-between text-[11px] text-gray-500">
							<span>Rake (rise per row)</span>
							<span class="font-mono">{Math.round(element.elevationStep ?? 0)}</span>
						</span>
						<input
							type="range"
							min="0"
							max="40"
							value={element.elevationStep ?? 0}
							class="mt-1 w-full"
							on:input={(e) => onPatch({ elevationStep: num(e.currentTarget.value, 0) }, 'rake')}
						/>
						<span class="text-[10px] text-gray-400">
							Steps each row up. Shows in the 3D view.
						</span>
					</label>

					<label class="mt-2 block">
						<span class="text-[11px] text-gray-500">Aisles after seat…</span>
						<input
							type="text"
							placeholder="e.g. 8, 16"
							value={aisleText}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:change={(e) => commitAisles(e.currentTarget.value)}
						/>
						<span class="text-[10px] text-gray-400">
							Gaps in the row. Seat numbering runs straight through.
						</span>
					</label>
				</div>
			{/if}
		{/if}

		<!-- Position, size, elevation, rotation -->
		<div>
			<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
				Position
			</h3>
			<div class="grid grid-cols-2 gap-2">
				<label class="block">
					<span class="text-[11px] text-gray-500">X</span>
					<input
						type="number"
						value={Math.round(element.x)}
						class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
						on:input={(e) => onPatch({ x: num(e.currentTarget.value, element?.x ?? 0) }, 'x')}
					/>
				</label>
				<label class="block">
					<span class="text-[11px] text-gray-500">Y</span>
					<input
						type="number"
						value={Math.round(element.y)}
						class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
						on:input={(e) => onPatch({ y: num(e.currentTarget.value, element?.y ?? 0) }, 'y')}
					/>
				</label>
				{#if !isMultiSeat(element.type)}
					<label class="block">
						<span class="text-[11px] text-gray-500">Width</span>
						<input
							type="number"
							min="1"
							value={Math.round(element.width)}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:input={(e) => onPatch({ width: num(e.currentTarget.value, element?.width ?? 1) }, 'w')}
						/>
					</label>
					<label class="block">
						<span class="text-[11px] text-gray-500">Height</span>
						<input
							type="number"
							min="1"
							value={Math.round(element.height)}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:input={(e) => onPatch({ height: num(e.currentTarget.value, element?.height ?? 1) }, 'h')}
						/>
					</label>
				{/if}
				<label class="block">
					<span class="text-[11px] text-gray-500">Rotation</span>
					<input
						type="number"
						value={Math.round(element.rotation ?? 0)}
						class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
						on:input={(e) => onPatch({ rotation: num(e.currentTarget.value, 0) }, 'rot')}
					/>
				</label>
				<label class="block">
					<span class="text-[11px] text-gray-500">Elevation</span>
					<input
						type="number"
						value={Math.round(element.z ?? 0)}
						class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
						on:input={(e) => onPatch({ z: num(e.currentTarget.value, 0) }, 'z')}
					/>
				</label>
			</div>
			<p class="mt-1 text-[10px] text-gray-400">
				Elevation lifts the whole block — use it for a balcony or upper tier.
			</p>
		</div>

		<!-- Seat type -->
		{#if isSeatGenerating(element.type)}
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<h3 class="text-xs font-semibold tracking-wide text-gray-500 uppercase">Seat type</h3>
					<button
						type="button"
						class="text-[11px] text-pink-600 underline"
						on:click={onEditSeatTypes}
					>
						Manage
					</button>
				</div>
				<select
					class="w-full rounded-lg border bg-white p-2 text-sm"
					value={element.seatTypeId ?? ''}
					on:change={(e) => onPatch({ seatTypeId: e.currentTarget.value || null })}
				>
					<option value="">— None —</option>
					{#each seatTypes as t (t.seatTypeId)}
						<option value={t.seatTypeId}>
							{t.name}{t.ticketTypeId ? '' : ' (no ticket type)'}
						</option>
					{/each}
				</select>

				{#if element.seatTypeId}
					{@const st = seatTypes.find((t) => t.seatTypeId === element?.seatTypeId)}
					{#if st && !st.ticketTypeId}
						<p class="mt-1 rounded bg-amber-50 p-1.5 text-[10px] text-amber-700">
							“{st.name}” has no ticket type, so these seats cannot be sold yet.
						</p>
					{:else if st}
						<!--
							Show what these seats will actually cost. The seat type
							carries the binding, but the price lives on the ticket
							type — so without resolving it here the organizer has to
							leave the builder to find out what they just priced.
						-->
						{@const tt = ticketTypes.find((t) => t.id === st.ticketTypeId)}
						<p class="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
							<Icon icon="mdi:ticket-outline" class="h-3.5 w-3.5 shrink-0" />
							<span class="truncate">
								{tt ? tt.name : 'Ticket type'}
								{#if st.priceOverride != null}
									· {st.priceOverride}{tt?.currency ? ` ${tt.currency}` : ''} (override)
								{:else if tt?.price != null}
									· {tt.price}{tt.currency ? ` ${tt.currency}` : ''}
								{/if}
							</span>
						</p>
						{#if !tt}
							<p class="mt-1 rounded bg-amber-50 p-1.5 text-[10px] text-amber-700">
								This seat type points at a ticket type that no longer exists. Reattach it
								under Manage.
							</p>
						{/if}
					{/if}
				{:else}
					<p class="mt-1 text-[10px] text-gray-400">
						Seats with no type are created but shown to nobody.
					</p>
				{/if}
			</div>

			<!-- Labelling -->
			<div>
				<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
					Labelling
				</h3>

				<label class="block">
					<span class="text-[11px] text-gray-500">Section</span>
					<input
						type="text"
						placeholder="e.g. Stalls"
						value={element.section ?? ''}
						class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
						on:change={(e) => onPatch({ section: e.currentTarget.value || undefined })}
					/>
				</label>

				{#if element.type === 'ROUND_TABLE' || element.type === 'SQUARE_TABLE'}
					<label class="mt-2 block">
						<span class="text-[11px] text-gray-500">Table name</span>
						<input
							type="text"
							placeholder="e.g. T1"
							value={element.rowLabel ?? element.label ?? ''}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:change={(e) =>
								onPatch({ rowLabel: e.currentTarget.value, label: e.currentTarget.value })}
						/>
					</label>
				{:else if (element.rows ?? 1) <= 1}
					<label class="mt-2 block">
						<span class="text-[11px] text-gray-500">Row label</span>
						<input
							type="text"
							placeholder="auto"
							value={element.rowLabel ?? ''}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:change={(e) => onPatch({ rowLabel: e.currentTarget.value || undefined })}
						/>
					</label>
				{/if}

				<label class="mt-2 block">
					<span class="text-[11px] text-gray-500">Label format</span>
					<select
						class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
						value={numbering.pattern ?? '{row}{seat}'}
						on:change={(e) => patchNumbering({ pattern: e.currentTarget.value }, 'pattern')}
					>
						{#each LABEL_PATTERNS as p}
							<option value={p.value}>{p.label}</option>
						{/each}
					</select>
				</label>

				<div class="mt-2 grid grid-cols-2 gap-2">
					<label class="block">
						<span class="text-[11px] text-gray-500">Row order</span>
						<select
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							value={numbering.rowOrder ?? 'ASC'}
							on:change={(e) => patchNumbering({ rowOrder: e.currentTarget.value as any }, 'roworder')}
						>
							<option value="ASC">A at front</option>
							<option value="DESC">A at back</option>
						</select>
					</label>
					<label class="block">
						<span class="text-[11px] text-gray-500">Seat order</span>
						<select
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							value={numbering.seatOrder ?? 'LTR'}
							on:change={(e) => patchNumbering({ seatOrder: e.currentTarget.value as any }, 'seatorder')}
						>
							<option value="LTR">Left to right</option>
							<option value="RTL">Right to left</option>
						</select>
					</label>
					<label class="block">
						<span class="text-[11px] text-gray-500">First seat #</span>
						<input
							type="number"
							min="0"
							value={numbering.seatNumberStart ?? 1}
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							on:input={(e) =>
								patchNumbering({ seatNumberStart: num(e.currentTarget.value, 1) }, 'seatstart')}
						/>
					</label>
					<label class="block">
						<span class="text-[11px] text-gray-500">Step</span>
						<select
							class="mt-0.5 w-full rounded-lg border bg-white p-2 text-sm"
							value={String(numbering.seatStep ?? 1)}
							on:change={(e) => patchNumbering({ seatStep: num(e.currentTarget.value, 1) }, 'step')}
						>
							<option value="1">1, 2, 3…</option>
							<option value="2">Odd / even</option>
						</select>
					</label>
				</div>
			</div>

			<!-- 3D chair style -->
			<div>
				<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
					3D chair
				</h3>
				<select
					class="w-full rounded-lg border bg-white p-2 text-sm"
					value={element.model ?? 'CHAIR'}
					on:change={(e) => onPatch({ model: e.currentTarget.value as any })}
				>
					<option value="CHAIR">Chair</option>
					<option value="ARMCHAIR">Armchair</option>
					<option value="BENCH">Bench</option>
					<option value="STOOL">Stool</option>
					<option value="SOFA">Sofa</option>
				</select>
			</div>
		{:else}
			<!-- Fixture / annotation -->
			<div>
				<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">Label</h3>
				<input
					type="text"
					value={element.label ?? ''}
					class="w-full rounded-lg border bg-white p-2 text-sm"
					on:change={(e) => onPatch({ label: e.currentTarget.value })}
				/>
			</div>
			<div>
				<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">Colour</h3>
				<div class="flex items-center gap-2 rounded-lg border p-2">
					<input
						type="color"
						value={element.color ?? '#e5e7eb'}
						class="h-7 w-7 cursor-pointer border-none bg-transparent p-0"
						on:input={(e) => onPatch({ color: e.currentTarget.value }, 'color')}
					/>
					<span class="font-mono text-xs text-gray-600">{element.color ?? 'default'}</span>
					{#if element.color}
						<button
							type="button"
							class="ml-auto text-[11px] text-gray-400 underline"
							on:click={() => onPatch({ color: undefined })}
						>
							Reset
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Actions -->
		<div class="space-y-1.5 border-t pt-3">
			<div class="grid grid-cols-2 gap-1.5">
				<button
					type="button"
					class="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50"
					on:click={() => onReorder('front')}
				>
					Bring to front
				</button>
				<button
					type="button"
					class="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50"
					on:click={() => onReorder('back')}
				>
					Send to back
				</button>
			</div>
			<div class="grid grid-cols-3 gap-1.5">
				<button
					type="button"
					class="flex items-center justify-center rounded-lg border py-2 hover:bg-gray-50"
					title={element.locked ? 'Unlock' : 'Lock'}
					on:click={() => onPatch({ locked: !element?.locked })}
				>
					<Icon
						icon={element.locked ? 'mdi:lock' : 'mdi:lock-open-outline'}
						class="h-4 w-4 text-gray-600"
					/>
				</button>
				<button
					type="button"
					class="flex items-center justify-center rounded-lg border py-2 hover:bg-gray-50"
					title="Duplicate"
					on:click={onDuplicate}
				>
					<Icon icon="mdi:content-copy" class="h-4 w-4 text-gray-600" />
				</button>
				<button
					type="button"
					class="flex items-center justify-center rounded-lg border border-red-300 py-2 text-red-600 hover:bg-red-50"
					title="Delete"
					on:click={onDelete}
				>
					<Icon icon="mdi:delete-outline" class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>
{:else}
	<!-- ── Nothing selected ── -->
	<div class="flex flex-col items-center justify-center py-10 text-center">
		<Icon icon="mdi:gesture-tap" class="mb-2 h-8 w-8 text-gray-300" />
		<p class="text-sm font-medium text-gray-500">Nothing selected</p>
		<p class="mt-1 max-w-[200px] text-xs text-gray-400">
			Tap an element on the canvas to edit it, or pick a tool to add one.
		</p>
	</div>
{/if}
