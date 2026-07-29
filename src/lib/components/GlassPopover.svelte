<!--
  GlassPopover — anchored "liquid glass" popover panel.

  A single, reusable primitive behind every discover dropdown (search, category,
  event type, location). It handles the parts that are easy to get wrong:

  - Portals to <body>, so parent `overflow`/`transform` never clips it.
  - Fixed positioning against a trigger element, re-measured on scroll, resize
    and content size changes.
  - Flips above the trigger and clamps to the viewport when space is tight.
  - Collapses to a bottom sheet on small screens.
  - Closes on outside pointerdown and Escape, and restores focus to the trigger.

  Props are deliberately layout-only; content comes from the default slot.
-->
<script lang="ts">
	import { createEventDispatcher, onDestroy, tick } from 'svelte';
	import { portal } from '$lib/utils/portal';

	export let open = false;
	/** Trigger element the panel is anchored to. */
	export let anchor: HTMLElement | null = null;
	export let align: 'start' | 'end' | 'center' = 'start';
	export let offset = 10;
	export let minWidth = 300;
	export let maxWidth = 460;
	export let maxHeight = 460;
	/** Force the panel to the trigger's width (used by the hero search field). */
	export let matchAnchorWidth = false;
	export let sheetOnMobile = true;
	export let label = '';
	export let panelClass = '';
	/** Extra elements that should not count as "outside" (e.g. a second trigger). */
	export let ignore: Array<HTMLElement | null> = [];

	const dispatch = createEventDispatcher<{ close: null }>();

	let panel: HTMLDivElement | null = null;
	let placement: 'bottom' | 'top' = 'bottom';
	let isSheet = false;
	let positionStyle = '';
	let availableHeight = maxHeight;

	let resizeObserver: ResizeObserver | null = null;
	let rafId = 0;

	const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

	function measure() {
		if (!open || typeof window === 'undefined') return;

		const vw = window.innerWidth;
		const vh = window.innerHeight;

		isSheet = sheetOnMobile && vw < 640;
		if (isSheet) {
			availableHeight = Math.min(maxHeight, Math.round(vh * 0.72));
			positionStyle = '';
			return;
		}

		if (!anchor) return;
		const rect = anchor.getBoundingClientRect();

		const hardMax = vw - 24;
		const width = matchAnchorWidth
			? clamp(rect.width, Math.min(minWidth, hardMax), hardMax)
			: clamp(panel?.offsetWidth || minWidth, Math.min(minWidth, hardMax), Math.min(maxWidth, hardMax));

		const spaceBelow = vh - rect.bottom - offset - 12;
		const spaceAbove = rect.top - offset - 12;
		placement = spaceBelow >= Math.min(maxHeight, 260) || spaceBelow >= spaceAbove ? 'bottom' : 'top';

		availableHeight = clamp(placement === 'bottom' ? spaceBelow : spaceAbove, 180, maxHeight);

		let left =
			align === 'end'
				? rect.right - width
				: align === 'center'
					? rect.left + rect.width / 2 - width / 2
					: rect.left;
		left = clamp(left, 12, Math.max(12, vw - width - 12));

		const vertical =
			placement === 'bottom'
				? `top:${Math.round(rect.bottom + offset)}px;`
				: `bottom:${Math.round(vh - rect.top + offset)}px;`;

		positionStyle = `left:${Math.round(left)}px;${vertical}width:${Math.round(width)}px;`;
	}

	function scheduleMeasure() {
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			measure();
		});
	}

	function isInside(target: Node | null): boolean {
		if (!target) return false;
		if (panel?.contains(target)) return true;
		if (anchor?.contains(target)) return true;
		return ignore.some((el) => el?.contains(target));
	}

	function handlePointerDown(event: PointerEvent) {
		if (!isInside(event.target as Node)) dispatch('close', null);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			dispatch('close', null);
			anchor?.focus?.();
		}
	}

	function attach() {
		if (typeof window === 'undefined') return;
		window.addEventListener('scroll', scheduleMeasure, true);
		window.addEventListener('resize', scheduleMeasure);
		document.addEventListener('pointerdown', handlePointerDown, true);
		window.addEventListener('keydown', handleKeydown, true);

		if ('ResizeObserver' in window) {
			resizeObserver = new ResizeObserver(scheduleMeasure);
			if (anchor) resizeObserver.observe(anchor);
			if (panel) resizeObserver.observe(panel);
		}
	}

	function detach() {
		if (typeof window === 'undefined') return;
		window.removeEventListener('scroll', scheduleMeasure, true);
		window.removeEventListener('resize', scheduleMeasure);
		document.removeEventListener('pointerdown', handlePointerDown, true);
		window.removeEventListener('keydown', handleKeydown, true);
		resizeObserver?.disconnect();
		resizeObserver = null;
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
	}

	// Attach/detach as the panel opens and closes.
	$: if (open) {
		tick().then(() => {
			measure();
			detach();
			attach();
			// A second pass after layout settles (fonts, images, async content).
			requestAnimationFrame(measure);
		});
	} else {
		detach();
		// Drop the stale rect so the next open measures from scratch.
		positionStyle = '';
	}

	onDestroy(detach);

	/**
	 * Until the first measurement lands, park the panel offscreen and invisible so
	 * an unsized frame never flashes in the corner of the viewport.
	 */
	$: styleAttr = isSheet
		? ''
		: positionStyle
			? `${positionStyle}min-width:${minWidth}px;max-width:${maxWidth}px;`
			: `left:-9999px;top:0;opacity:0;min-width:${minWidth}px;max-width:${maxWidth}px;`;

	function pop(_node: HTMLElement, { duration = 170 }: { duration?: number } = {}) {
		const shift = isSheet ? 24 : placement === 'bottom' ? -8 : 8;
		return {
			duration,
			css: (t: number, u: number) =>
				`opacity:${t};transform:translate3d(0,${u * shift}px,0) scale(${0.985 + 0.015 * t});`
		};
	}
</script>

{#if open}
	<div
		class="glass-popover {isSheet ? 'is-sheet' : 'is-anchored'}"
		style={styleAttr}
		use:portal
		bind:this={panel}
		transition:pop
		role="dialog"
		aria-label={label || undefined}
		aria-modal="false"
	>
		{#if isSheet}
			<div class="sheet-grip" aria-hidden="true"></div>
		{/if}
		<div class="glass-panel {panelClass}" style="--gp-max-h:{availableHeight}px">
			<slot maxHeight={availableHeight} />
		</div>
	</div>
{/if}

<style>
	.glass-popover {
		position: fixed;
		z-index: 1000;
	}

	.glass-popover.is-sheet {
		right: 0;
		bottom: 0;
		left: 0;
		width: auto;
		padding: 0 0.5rem 0.5rem;
	}

	.glass-panel {
		position: relative;
		overflow: hidden;
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.7);
		background:
			linear-gradient(158deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.8) 48%, rgba(250, 246, 255, 0.86) 100%);
		-webkit-backdrop-filter: blur(28px) saturate(180%);
		backdrop-filter: blur(28px) saturate(180%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			inset 0 0 0 1px rgba(255, 255, 255, 0.35),
			0 2px 6px -2px rgba(31, 25, 53, 0.12),
			0 24px 56px -16px rgba(31, 25, 53, 0.28);
	}

	/* Specular sheen along the top edge — the "liquid" part of liquid glass. */
	.glass-panel::before {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 46%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0));
		pointer-events: none;
	}

	.glass-popover.is-sheet .glass-panel {
		border-radius: 22px;
	}

	.sheet-grip {
		margin: 0 auto 8px;
		height: 4px;
		width: 44px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.85);
		box-shadow: 0 1px 6px rgba(31, 25, 53, 0.2);
	}

	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.glass-panel {
			background: #fdfcff;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.glass-popover {
			transition: none !important;
		}
	}
</style>
