<script lang="ts">
	/**
	 * Venue template picker.
	 *
	 * The previous modal showed four PNG screenshots with "Use Template"
	 * buttons that had **no click handler** — picking one did nothing at
	 * all. These apply real geometry (see `templates.ts`), and the preview
	 * is rendered from that same geometry rather than from a screenshot,
	 * so the card cannot drift from what you get.
	 */
	import Icon from '@iconify/svelte';
	import { VENUE_TEMPLATES, type VenueTemplate } from './templates';
	import { generateSeatsForLayout } from './geometry';
	import { isSeatGenerating } from './types';

	export let open = false;
	/** True when the current design has content that would be replaced. */
	export let hasExistingWork = false;
	export let onApply: (t: VenueTemplate) => void = () => {};
	export let onClose: () => void = () => {};

	let confirming: VenueTemplate | null = null;

	/**
	 * Build each card's preview once, lazily.
	 *
	 * Seven templates expand to a few thousand seats in total; doing it on
	 * every reactive pass would make the modal stutter as it opens.
	 */
	const previews = new Map<
		string,
		{ seats: Array<{ x: number; y: number }>; fixtures: Array<{ x: number; y: number; w: number; h: number }>; vb: string; total: number }
	>();

	function preview(t: VenueTemplate) {
		const cached = previews.get(t.id);
		if (cached) return cached;

		const built = t.build();
		const { seats } = generateSeatsForLayout(built.elements, built.numbering);
		const fixtures = built.elements
			.filter((el) => !isSeatGenerating(el.type))
			.map((el) => ({ x: el.x, y: el.y, w: el.width, h: el.height }));

		// Sample the seats for drawing: a stadium's 1,700 dots are
		// indistinguishable from 400 at thumbnail size, and drawing all of
		// them seven times over is wasted work.
		const step = Math.max(1, Math.ceil(seats.length / 420));
		const sampled = seats.filter((_, i) => i % step === 0).map((s) => ({ x: s.x, y: s.y }));

		const result = {
			seats: sampled,
			fixtures,
			vb: `0 0 ${built.canvasWidth} ${built.canvasHeight}`,
			total: seats.length
		};
		previews.set(t.id, result);
		return result;
	}

	function choose(t: VenueTemplate) {
		// Applying replaces the design. It is one undo step, but saying so
		// first is cheaper than making them discover that.
		if (hasExistingWork) {
			confirming = t;
			return;
		}
		onApply(t);
		onClose();
	}

	function confirmApply() {
		if (confirming) {
			onApply(confirming);
			confirming = null;
			onClose();
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
			<div class="flex items-start justify-between border-b px-5 py-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Start from a venue</h2>
					<p class="mt-0.5 text-xs text-gray-500">
						Each one is a complete, publishable layout you can then adjust.
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

			<div class="grid flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each VENUE_TEMPLATES as t (t.id)}
					{@const p = preview(t)}
					<button
						type="button"
						class="group flex flex-col overflow-hidden rounded-xl border text-left transition-all hover:border-pink-400 hover:shadow-md"
						on:click={() => choose(t)}
					>
						<!-- Preview rendered from the template's real geometry -->
						<div class="relative h-36 w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
							<svg viewBox={p.vb} class="h-full w-full" preserveAspectRatio="xMidYMid meet">
								{#each p.fixtures as f}
									<rect
										x={f.x}
										y={f.y}
										width={f.w}
										height={f.h}
										rx="6"
										fill="#d4d4d8"
										opacity="0.75"
									/>
								{/each}
								{#each p.seats as s}
									<circle cx={s.x} cy={s.y} r="7" fill="#6366f1" opacity="0.8" />
								{/each}
							</svg>
							<span
								class="absolute top-2 right-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-[10px] font-medium text-white"
							>
								{p.total.toLocaleString()} seats
							</span>
						</div>

						<div class="flex flex-1 flex-col p-3">
							<div class="flex items-center gap-2">
								<Icon icon={t.icon} class="h-4 w-4 shrink-0 text-gray-500" />
								<span class="text-sm font-semibold text-gray-900">{t.name}</span>
							</div>
							<p class="mt-1 flex-1 text-[11px] leading-snug text-gray-500">{t.description}</p>
							<div class="mt-2 flex flex-wrap gap-1">
								{#each t.tags as tag}
									<span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
										{tag}
									</span>
								{/each}
							</div>
							<span
								class="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-pink-600 opacity-0 transition-opacity group-hover:opacity-100"
							>
								Use this venue
								<Icon icon="mdi:arrow-right" class="h-3 w-3" />
							</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if confirming}
		<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
			<div class="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
				<h3 class="text-base font-semibold text-gray-900">Replace your current design?</h3>
				<p class="mt-1.5 text-sm text-gray-600">
					“{confirming.name}” will replace everything on the canvas. You can undo it with
					Ctrl+Z.
				</p>
				<div class="mt-4 flex gap-2">
					<button
						type="button"
						class="flex-1 rounded-lg border px-3 py-2 text-sm"
						on:click={() => (confirming = null)}
					>
						Cancel
					</button>
					<button
						type="button"
						class="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
						on:click={confirmApply}
					>
						Replace
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
