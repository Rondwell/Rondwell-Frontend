<script lang="ts">
	/**
	 * Seat type (tier) manager.
	 *
	 * Seat types are what make a seat map commercial rather than
	 * decorative: a tier carries the colour attendees see, and the
	 * `ticketTypeId` that lets a seat be priced and sold. Without the
	 * binding, publishing creates inventory no checkout can price — which
	 * the materializer warns about but cannot fix on the organizer's
	 * behalf, since only they know which tier is which product.
	 *
	 * There was no UI for any of this. Elements carried a raw
	 * `ticketTypeId` plus a free-text `ticketColor`, set per element, so
	 * recolouring "VIP" meant editing every VIP element and nothing
	 * guaranteed they agreed.
	 */
	import Icon from '@iconify/svelte';
	import type { SeatType } from './types';

	export let open = false;
	export let seatTypes: SeatType[] = [];
	export let ticketTypes: Array<{ id: string; name: string; price?: number; currency?: string }> = [];
	/** Live seat count per tier, so the organizer sees what each covers. */
	export let counts: Record<string, number> = {};

	export let onUpsert: (type: SeatType) => void = () => {};
	export let onRemove: (seatTypeId: string) => void = () => {};
	export let onClose: () => void = () => {};

	/** Palette offered for new tiers — distinguishable at small sizes. */
	const SWATCHES = [
		'#6366F1', '#F5A623', '#10B981', '#EF4444',
		'#8B5CF6', '#06B6D4', '#EC4899', '#64748B'
	];

	let draftName = '';
	let draftColor = SWATCHES[0];
	let draftTicketTypeId = '';
	let draftAccessible = false;
	let error = '';

	function slugify(name: string): string {
		return (
			name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '')
				.slice(0, 40) || `tier-${Date.now().toString(36)}`
		);
	}

	function addType() {
		const name = draftName.trim();
		if (!name) {
			error = 'Give the seat type a name.';
			return;
		}
		// Ids are derived from the name, so a duplicate name would collide
		// and silently overwrite the existing tier.
		let seatTypeId = slugify(name);
		if (seatTypes.some((t) => t.seatTypeId === seatTypeId)) {
			error = `A seat type called “${name}” already exists.`;
			return;
		}

		error = '';
		onUpsert({
			seatTypeId,
			name,
			color: draftColor,
			ticketTypeId: draftTicketTypeId || null,
			isAccessible: draftAccessible,
			rank: seatTypes.length + 1
		});

		draftName = '';
		draftTicketTypeId = '';
		draftAccessible = false;
		draftColor = SWATCHES[seatTypes.length % SWATCHES.length];
	}

	function patch(t: SeatType, change: Partial<SeatType>) {
		onUpsert({ ...t, ...change });
	}

	function confirmRemove(t: SeatType) {
		const n = counts[t.seatTypeId] ?? 0;
		const warning = n
			? `Delete “${t.name}”? ${n} seat${n === 1 ? '' : 's'} will be left with no type and will not be sellable until you assign another.`
			: `Delete “${t.name}”?`;
		if (confirm(warning)) onRemove(t.seatTypeId);
	}

	function priceLabel(tt: { price?: number; currency?: string }): string {
		if (tt.price === undefined || tt.price === null) return '';
		return ` · ${tt.price} ${tt.currency ?? ''}`.trimEnd();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
			<!-- Header -->
			<div class="flex items-start justify-between border-b px-5 py-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Seat types</h2>
					<p class="mt-0.5 text-xs text-gray-500">
						Each type gets a colour on the map and a ticket type that sets its price.
					</p>
				</div>
				<button
					type="button"
					aria-label="Close"
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-gray-500 hover:bg-gray-50"
					on:click={onClose}
				>
					<Icon icon="mdi:close" class="h-4 w-4" />
				</button>
			</div>

			<!-- Existing types -->
			<div class="flex-1 overflow-y-auto px-5 py-4">
				{#if seatTypes.length === 0}
					<p class="py-6 text-center text-sm text-gray-400">
						No seat types yet. Add one below.
					</p>
				{/if}

				<div class="space-y-3">
					{#each seatTypes as t (t.seatTypeId)}
						<div class="rounded-xl border p-3">
							<div class="flex items-start gap-3">
								<input
									type="color"
									aria-label={`Colour for ${t.name}`}
									value={t.color}
									class="mt-0.5 h-8 w-8 shrink-0 cursor-pointer rounded border-none bg-transparent p-0"
									on:input={(e) => patch(t, { color: e.currentTarget.value })}
								/>

								<div class="min-w-0 flex-1 space-y-2">
									<div class="flex items-center gap-2">
										<input
											type="text"
											aria-label="Seat type name"
											value={t.name}
											class="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1.5 text-sm font-medium"
											on:change={(e) => patch(t, { name: e.currentTarget.value })}
										/>
										<span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
											{counts[t.seatTypeId] ?? 0} seats
										</span>
									</div>

									<label class="block">
										<span class="text-[11px] text-gray-500">Ticket type (sets the price)</span>
										<select
											class="mt-0.5 w-full rounded-lg border bg-white px-2 py-1.5 text-sm"
											value={t.ticketTypeId ?? ''}
											on:change={(e) => patch(t, { ticketTypeId: e.currentTarget.value || null })}
										>
											<option value="">— Not for sale yet —</option>
											{#each ticketTypes as tt (tt.id)}
												<option value={tt.id}>{tt.name}{priceLabel(tt)}</option>
											{/each}
										</select>
									</label>

									{#if !t.ticketTypeId}
										<p class="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
											Seats in this type will be created but cannot be bought until a ticket
											type is attached.
										</p>
									{/if}

									<div class="flex items-center gap-4">
										<label class="flex items-center gap-1.5 text-[11px] text-gray-600">
											<input
												type="checkbox"
												checked={t.isAccessible ?? false}
												on:change={(e) => patch(t, { isAccessible: e.currentTarget.checked })}
											/>
											Wheelchair space
										</label>
										<label class="flex items-center gap-1.5 text-[11px] text-gray-600">
											<input
												type="checkbox"
												checked={t.isCompanion ?? false}
												on:change={(e) => patch(t, { isCompanion: e.currentTarget.checked })}
											/>
											Companion seat
										</label>
										<button
											type="button"
											class="ml-auto text-[11px] text-red-600 underline"
											on:click={() => confirmRemove(t)}
										>
											Delete
										</button>
									</div>

									{#if t.isAccessible}
										<p class="text-[10px] text-gray-400">
											Accessible spaces are never handed out by “best available” — they are
											allocated on request.
										</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Add new -->
			<div class="border-t bg-gray-50 px-5 py-4">
				<h3 class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
					Add a seat type
				</h3>
				<div class="flex flex-wrap items-end gap-2">
					<div class="flex items-center gap-1.5">
						{#each SWATCHES as sw}
							<button
								type="button"
								aria-label={`Use colour ${sw}`}
								class="h-6 w-6 rounded-full ring-offset-1 transition-all {draftColor === sw
									? 'ring-2 ring-gray-900'
									: ''}"
								style="background-color: {sw};"
								on:click={() => (draftColor = sw)}
							></button>
						{/each}
					</div>

					<input
						type="text"
						placeholder="Name, e.g. Balcony"
						bind:value={draftName}
						class="min-w-[140px] flex-1 rounded-lg border bg-white px-2 py-2 text-sm"
						on:keydown={(e) => e.key === 'Enter' && addType()}
					/>

					<select
						bind:value={draftTicketTypeId}
						class="rounded-lg border bg-white px-2 py-2 text-sm"
					>
						<option value="">No ticket type</option>
						{#each ticketTypes as tt (tt.id)}
							<option value={tt.id}>{tt.name}</option>
						{/each}
					</select>

					<button
						type="button"
						class="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
						on:click={addType}
					>
						Add
					</button>
				</div>

				{#if error}
					<p class="mt-1.5 text-[11px] text-red-600">{error}</p>
				{/if}

				{#if ticketTypes.length === 0}
					<p class="mt-2 rounded bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700">
						This event has no ticket types yet. Create them on the Tickets tab, then come back
						to attach each seat type to one.
					</p>
				{/if}
			</div>

			<div class="flex justify-end border-t px-5 py-3">
				<button
					type="button"
					class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
					on:click={onClose}
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
