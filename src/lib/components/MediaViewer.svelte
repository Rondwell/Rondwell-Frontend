<script lang="ts">
	/**
	 * Full-screen media viewer (lightbox).
	 *
	 * Opens any mixed gallery of images, video, audio and documents in an
	 * immersive overlay. Built to feel native rather than "a modal with an image
	 * in it":
	 *
	 *  • Images zoom (double-click / wheel / pinch) and pan when zoomed.
	 *  • Swipe left/right on touch, arrow keys on desktop, buttons everywhere.
	 *  • Video autoplays on open and is paused the moment you navigate away, so
	 *    audio never bleeds between slides.
	 *  • A filmstrip keeps your place in long galleries.
	 *
	 * Fully themed: every surface derives from the event/collection palette that
	 * is passed in, so the viewer always belongs to the page that opened it.
	 *
	 * Accessibility: focus is trapped while open and restored on close, the
	 * backdrop is inert to screen readers, and all controls are real buttons with
	 * labels. Honours prefers-reduced-motion.
	 */
	import { createEventDispatcher, onDestroy, tick } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';

	export let open = false;
	export let items: any[] = [];
	export let index = 0;
	export let theme: Color = colors[0];

	const dispatch = createEventDispatcher<{ close: void; change: { index: number } }>();

	/** Zoom ceiling. Beyond ~4x most event photos are just pixels. */
	const MAX_ZOOM = 4;
	const MIN_ZOOM = 1;
	/** Horizontal travel (px) before a swipe counts as "next/previous". */
	const SWIPE_THRESHOLD = 60;

	let dialogEl: HTMLDivElement | null = null;
	let stageEl: HTMLDivElement | null = null;
	let filmstripEl: HTMLDivElement | null = null;
	let previouslyFocused: HTMLElement | null = null;

	// ── Zoom / pan state (images only) ──
	let zoom = 1;
	let panX = 0;
	let panY = 0;

	// ── Gesture state ──
	let pointers = new Map<number, { x: number; y: number }>();
	let dragging = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragOriginX = 0;
	let dragOriginY = 0;
	let swipeOffset = 0;
	let pinchStartDistance = 0;
	let pinchStartZoom = 1;

	let loaded = new Set<number>();
	let failed = new Set<number>();
	let showChrome = true;
	let chromeTimer: ReturnType<typeof setTimeout> | null = null;

	$: current = items?.[index] ?? null;
	$: total = items?.length ?? 0;
	$: kind = mediaKind(current);
	$: isZoomed = zoom > 1.01;

	/**
	 * Normalise a media record to one of four render modes.
	 *
	 * The API's `type` is authoritative, but older records sometimes carry a
	 * *category* ("GENERAL") in that slot, so we fall back to sniffing the file
	 * extension rather than rendering a broken tile.
	 */
	function mediaKind(item: any): 'image' | 'video' | 'audio' | 'document' {
		if (!item) return 'document';
		const t = String(item.type ?? '').toUpperCase();
		if (t === 'IMAGE') return 'image';
		if (t === 'VIDEO') return 'video';
		if (t === 'AUDIO') return 'audio';
		if (t === 'DOCUMENT') return 'document';

		const ext =
			String(item.url ?? '')
				.split(/[?#]/)[0]
				.split('.')
				.pop()
				?.toLowerCase() ?? '';
		if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp'].includes(ext)) return 'image';
		if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) return 'video';
		if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext)) return 'audio';
		return 'document';
	}

	function labelOf(item: any, i: number): string {
		return item?.title || item?.description || `Media ${i + 1}`;
	}

	function resetView() {
		zoom = 1;
		panX = 0;
		panY = 0;
		swipeOffset = 0;
	}

	function close() {
		dispatch('close');
	}

	function go(next: number) {
		if (total === 0) return;
		// Wrap around — long galleries feel broken when the arrows dead-end.
		const target = (next + total) % total;
		if (target === index) return;
		pauseAllMedia();
		index = target;
		resetView();
		dispatch('change', { index });
		scrollFilmstripToActive();
	}

	const next = () => go(index + 1);
	const prev = () => go(index - 1);

	/**
	 * Stop any playing media in the viewer.
	 *
	 * Without this, navigating away from a video leaves its audio running
	 * underneath the next slide.
	 */
	function pauseAllMedia() {
		if (!dialogEl) return;
		dialogEl.querySelectorAll('video, audio').forEach((el) => {
			const m = el as HTMLMediaElement;
			if (!m.paused) m.pause();
		});
	}

	async function scrollFilmstripToActive() {
		await tick();
		const active = filmstripEl?.querySelector('[data-active="true"]') as HTMLElement | null;
		active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	}

	// ── Zoom ──

	function zoomTo(nextZoom: number, originX = 0.5, originY = 0.5) {
		const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
		if (clamped === MIN_ZOOM) {
			zoom = MIN_ZOOM;
			panX = 0;
			panY = 0;
			return;
		}
		// Keep the point under the cursor stationary while scaling.
		const rect = stageEl?.getBoundingClientRect();
		if (rect) {
			const dx = (originX - 0.5) * rect.width;
			const dy = (originY - 0.5) * rect.height;
			const ratio = clamped / zoom;
			panX = (panX - dx) * ratio + dx;
			panY = (panY - dy) * ratio + dy;
		}
		zoom = clamped;
		clampPan();
	}

	/** Keep the image from being dragged entirely off-screen. */
	function clampPan() {
		const rect = stageEl?.getBoundingClientRect();
		if (!rect) return;
		const maxX = (rect.width * (zoom - 1)) / 2;
		const maxY = (rect.height * (zoom - 1)) / 2;
		panX = Math.min(maxX, Math.max(-maxX, panX));
		panY = Math.min(maxY, Math.max(-maxY, panY));
	}

	function toggleZoom(e: MouseEvent) {
		if (kind !== 'image') return;
		const rect = stageEl?.getBoundingClientRect();
		const ox = rect ? (e.clientX - rect.left) / rect.width : 0.5;
		const oy = rect ? (e.clientY - rect.top) / rect.height : 0.5;
		zoomTo(isZoomed ? MIN_ZOOM : 2.5, ox, oy);
	}

	function onWheel(e: WheelEvent) {
		if (kind !== 'image') return;
		e.preventDefault();
		const rect = stageEl?.getBoundingClientRect();
		const ox = rect ? (e.clientX - rect.left) / rect.width : 0.5;
		const oy = rect ? (e.clientY - rect.top) / rect.height : 0.5;
		zoomTo(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), ox, oy);
	}

	// ── Pointer gestures (drag to pan, swipe to navigate, pinch to zoom) ──

	function onPointerDown(e: PointerEvent) {
		// Let native controls (video scrubber, audio) handle their own pointers.
		if ((e.target as HTMLElement)?.closest('video, audio, button, a')) return;

		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);

		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinchStartDistance = Math.hypot(a.x - b.x, a.y - b.y);
			pinchStartZoom = zoom;
			dragging = false;
			return;
		}

		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragOriginX = panX;
		dragOriginY = panY;
	}

	function onPointerMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		// Two fingers → pinch zoom.
		if (pointers.size === 2 && pinchStartDistance > 0) {
			const [a, b] = [...pointers.values()];
			const dist = Math.hypot(a.x - b.x, a.y - b.y);
			zoomTo(pinchStartZoom * (dist / pinchStartDistance));
			return;
		}

		if (!dragging) return;
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;

		if (isZoomed) {
			// Zoomed in → drag pans the image.
			panX = dragOriginX + dx;
			panY = dragOriginY + dy;
			clampPan();
		} else if (total > 1) {
			// Not zoomed → horizontal drag previews the next/previous slide.
			swipeOffset = dx;
		}
	}

	function onPointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
		if (pointers.size < 2) pinchStartDistance = 0;

		if (dragging && !isZoomed && total > 1) {
			if (swipeOffset <= -SWIPE_THRESHOLD) next();
			else if (swipeOffset >= SWIPE_THRESHOLD) prev();
			else swipeOffset = 0;
		}
		dragging = false;
	}

	// ── Keyboard ──

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		switch (e.key) {
			case 'Escape':
				e.preventDefault();
				close();
				break;
			case 'ArrowRight':
				e.preventDefault();
				next();
				break;
			case 'ArrowLeft':
				e.preventDefault();
				prev();
				break;
			case 'Home':
				e.preventDefault();
				go(0);
				break;
			case 'End':
				e.preventDefault();
				go(total - 1);
				break;
			case '0':
				e.preventDefault();
				resetView();
				break;
			case '+':
			case '=':
				e.preventDefault();
				zoomTo(zoom * 1.25);
				break;
			case '-':
				e.preventDefault();
				zoomTo(zoom / 1.25);
				break;
			case 'Tab':
				trapFocus(e);
				break;
		}
	}

	/** Keep Tab cycling inside the dialog while it is open. */
	function trapFocus(e: KeyboardEvent) {
		if (!dialogEl) return;
		const focusables = dialogEl.querySelectorAll<HTMLElement>(
			'button:not([disabled]), a[href], video[controls], audio[controls], [tabindex]:not([tabindex="-1"])'
		);
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement as HTMLElement | null;

		if (e.shiftKey && active === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}

	/** Auto-hide the chrome during quiet viewing, bring it back on any input. */
	function wakeChrome() {
		showChrome = true;
		if (chromeTimer) clearTimeout(chromeTimer);
		if (kind === 'video') chromeTimer = setTimeout(() => (showChrome = false), 2800);
	}

	// ── Open / close lifecycle ──

	let bodyOverflow = '';
	let bodyPaddingRight = '';

	$: if (typeof document !== 'undefined') {
		if (open) lockScroll();
		else unlockScroll();
	}

	function lockScroll() {
		if (document.body.dataset.viewerLocked === '1') return;
		// Compensate for the vanishing scrollbar so the page doesn't jump.
		const gap = window.innerWidth - document.documentElement.clientWidth;
		bodyOverflow = document.body.style.overflow;
		bodyPaddingRight = document.body.style.paddingRight;
		document.body.style.overflow = 'hidden';
		if (gap > 0) document.body.style.paddingRight = `${gap}px`;
		document.body.dataset.viewerLocked = '1';
	}

	function unlockScroll() {
		if (document.body.dataset.viewerLocked !== '1') return;
		document.body.style.overflow = bodyOverflow;
		document.body.style.paddingRight = bodyPaddingRight;
		delete document.body.dataset.viewerLocked;
	}

	/** Focus the dialog on open; hand focus back to the trigger on close. */
	async function onOpenChange(isOpen: boolean) {
		if (isOpen) {
			previouslyFocused = (document.activeElement as HTMLElement) ?? null;
			resetView();
			loaded = new Set();
			failed = new Set();
			wakeChrome();
			await tick();
			dialogEl?.focus();
			scrollFilmstripToActive();
		} else {
			pauseAllMedia();
			if (chromeTimer) clearTimeout(chromeTimer);
			previouslyFocused?.focus?.();
			previouslyFocused = null;
		}
	}

	$: if (typeof window !== 'undefined') onOpenChange(open);

	// If the route changes while the viewer is open the component unmounts
	// without ever running the close path, which would leave the page scroll
	// locked and the timer running.
	onDestroy(() => {
		if (chromeTimer) clearTimeout(chromeTimer);
		if (typeof document !== 'undefined') unlockScroll();
	});

	function markLoaded(i: number) {
		loaded = new Set(loaded).add(i);
	}
	function markFailed(i: number) {
		failed = new Set(failed).add(i);
		markLoaded(i);
	}

	/** Neighbours to warm the cache with, so navigation feels instant. */
	$: preload =
		total > 1 ? [(index + 1) % total, (index - 1 + total) % total].filter((i) => i !== index) : [];
</script>

<svelte:window on:keydown={onKeydown} />

{#if open && current}
	<!-- Backdrop -->
	<div
		class="viewer-root"
		role="dialog"
		aria-modal="true"
		aria-label="Media viewer"
		tabindex="-1"
		bind:this={dialogEl}
		transition:fade={{ duration: 160 }}
		style="--vw-bg: {theme.bg}; --vw-cover: {theme.cover}; --vw-small: {theme.smallCover}; --vw-text: {theme.text}; --vw-light: {theme.lightText}; --vw-toggle: {theme.toggle}; --vw-button: {theme.button}; --vw-button-text: {theme.buttonText};"
		on:mousemove={wakeChrome}
	>
		<!-- Click-through backdrop: closes when you click the empty space -->
		<button class="viewer-scrim" aria-label="Close media viewer" on:click={close}></button>

		<!-- Top bar -->
		<div class="viewer-topbar" class:hidden-chrome={!showChrome}>
			<div class="viewer-meta">
				<span class="viewer-counter">{index + 1} / {total}</span>
				{#if current.title}
					<span class="viewer-title" title={current.title}>{current.title}</span>
				{/if}
			</div>

			<div class="viewer-actions">
				{#if kind === 'image'}
					<button
						class="viewer-iconbtn"
						aria-label="Zoom out"
						disabled={zoom <= MIN_ZOOM}
						on:click={() => zoomTo(zoom / 1.25)}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
							<path
								d="M8 11h6M20 20l-3.5-3.5"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</button>
					<button
						class="viewer-iconbtn"
						aria-label="Zoom in"
						disabled={zoom >= MAX_ZOOM}
						on:click={() => zoomTo(zoom * 1.25)}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
							<path
								d="M11 8v6M8 11h6M20 20l-3.5-3.5"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</button>
				{/if}

				<a
					class="viewer-iconbtn"
					href={current.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Open original in a new tab"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M14 4h6v6M20 4l-8 8"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</a>

				<button class="viewer-iconbtn viewer-close" aria-label="Close" on:click={close}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Stage -->
		<div
			class="viewer-stage"
			bind:this={stageEl}
			on:pointerdown={onPointerDown}
			on:pointermove={onPointerMove}
			on:pointerup={onPointerUp}
			on:pointercancel={onPointerUp}
			on:wheel={onWheel}
		>
			{#key index}
				<div
					class="viewer-slide"
					class:grabbing={dragging && isZoomed}
					class:zoomable={kind === 'image'}
					style="transform: translate3d({isZoomed ? panX : swipeOffset}px, {isZoomed
						? panY
						: 0}px, 0) scale({zoom}); transition: {dragging
						? 'none'
						: 'transform 260ms cubic-bezier(.2,.8,.2,1)'};"
					in:scale={{ duration: 180, start: 0.97, opacity: 0 }}
				>
					{#if kind === 'image'}
						{#if !loaded.has(index)}
							<div class="viewer-spinner" aria-hidden="true"></div>
						{/if}
						{#if failed.has(index)}
							<div class="viewer-fallback">
								<span class="viewer-fallback-icon">🖼️</span>
								<p>This image could not be loaded.</p>
								<a
									class="viewer-fallback-link"
									href={current.url}
									target="_blank"
									rel="noopener noreferrer">Open original</a
								>
							</div>
						{:else}
							<img
								src={current.url}
								alt={current.title || current.description || 'Event media'}
								class="viewer-media"
								class:is-hidden={!loaded.has(index)}
								draggable="false"
								on:load={() => markLoaded(index)}
								on:error={() => markFailed(index)}
								on:dblclick={toggleZoom}
							/>
						{/if}
					{:else if kind === 'video'}
						<!-- svelte-ignore a11y-media-has-caption -->
						<video
							src={current.url}
							poster={current.thumbnailUrl}
							class="viewer-media"
							controls
							autoplay
							playsinline
							preload="metadata"
							on:loadeddata={() => markLoaded(index)}
							on:error={() => markFailed(index)}
						></video>
					{:else if kind === 'audio'}
						<div class="viewer-audio">
							<div class="viewer-audio-art" aria-hidden="true">🎵</div>
							<p class="viewer-audio-title">{current.title || 'Audio'}</p>
							<audio src={current.url} controls preload="metadata" class="viewer-audio-player"
							></audio>
						</div>
					{:else}
						<div class="viewer-fallback">
							<span class="viewer-fallback-icon">📄</span>
							<p>{current.title || 'Document'}</p>
							<a
								class="viewer-fallback-link"
								href={current.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								Open document
							</a>
						</div>
					{/if}
				</div>
			{/key}

			<!-- Warm the neighbouring images so arrow-key navigation is instant -->
			{#each preload as p (p)}
				{#if mediaKind(items[p]) === 'image'}
					<img src={items[p].url} alt="" aria-hidden="true" class="viewer-preload" />
				{/if}
			{/each}
		</div>

		<!-- Navigation arrows -->
		{#if total > 1}
			<button
				class="viewer-nav viewer-nav-prev"
				class:hidden-chrome={!showChrome}
				aria-label="Previous media"
				on:click={prev}
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M15 5l-7 7 7 7"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			<button
				class="viewer-nav viewer-nav-next"
				class:hidden-chrome={!showChrome}
				aria-label="Next media"
				on:click={next}
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M9 5l7 7-7 7"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		{/if}

		<!-- Caption + filmstrip -->
		<div class="viewer-bottom" class:hidden-chrome={!showChrome}>
			{#if current.description}
				<p class="viewer-caption">{current.description}</p>
			{/if}

			{#if total > 1}
				<div
					class="viewer-filmstrip"
					bind:this={filmstripEl}
					role="tablist"
					aria-label="Media thumbnails"
				>
					{#each items as item, i}
						{@const k = mediaKind(item)}
						<button
							class="viewer-thumb"
							class:active={i === index}
							data-active={i === index}
							role="tab"
							aria-selected={i === index}
							aria-label={labelOf(item, i)}
							on:click={() => go(i)}
						>
							{#if k === 'image'}
								<img src={item.thumbnailUrl || item.url} alt="" loading="lazy" />
							{:else if k === 'video'}
								{#if item.thumbnailUrl}
									<img src={item.thumbnailUrl} alt="" loading="lazy" />
								{:else}
									<span class="viewer-thumb-glyph">▶</span>
								{/if}
								<span class="viewer-thumb-badge" aria-hidden="true">▶</span>
							{:else if k === 'audio'}
								<span class="viewer-thumb-glyph">🎵</span>
							{:else}
								<span class="viewer-thumb-glyph">📄</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.viewer-root {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		outline: none;
		/* Tint the scrim with the event's own background so the viewer reads as
		   part of the page rather than a generic black overlay. */
		background: radial-gradient(
				120% 120% at 50% 40%,
				color-mix(in srgb, var(--vw-bg) 28%, transparent),
				transparent 70%
			),
			rgba(12, 10, 16, 0.92);
		backdrop-filter: blur(18px) saturate(120%);
		-webkit-backdrop-filter: blur(18px) saturate(120%);
		/* Respect notches and home indicators on mobile. */
		padding: max(env(safe-area-inset-top), 0px) max(env(safe-area-inset-right), 0px)
			max(env(safe-area-inset-bottom), 0px) max(env(safe-area-inset-left), 0px);
	}

	/* Full-bleed close target behind the media. */
	.viewer-scrim {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: zoom-out;
	}

	/* ── Chrome ── */
	.viewer-topbar,
	.viewer-bottom {
		position: absolute;
		left: 0;
		right: 0;
		z-index: 2;
		display: flex;
		transition:
			opacity 240ms ease,
			transform 240ms ease;
	}

	.viewer-topbar {
		top: 0;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
		background: linear-gradient(rgba(0, 0, 0, 0.55), transparent);
	}

	.viewer-topbar.hidden-chrome,
	.viewer-bottom.hidden-chrome {
		opacity: 0;
		pointer-events: none;
	}
	.viewer-topbar.hidden-chrome {
		transform: translateY(-8px);
	}
	.viewer-bottom.hidden-chrome {
		transform: translateY(8px);
	}

	.viewer-meta {
		display: flex;
		align-items: baseline;
		gap: 12px;
		min-width: 0;
	}

	.viewer-counter {
		flex-shrink: 0;
		border-radius: 999px;
		background: color-mix(in srgb, var(--vw-cover) 22%, transparent);
		border: 1px solid color-mix(in srgb, var(--vw-toggle) 45%, transparent);
		padding: 4px 12px;
		font-size: 12px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: #fff;
	}

	.viewer-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 14px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.92);
	}

	.viewer-actions {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 8px;
	}

	.viewer-iconbtn {
		display: inline-flex;
		height: 38px;
		width: 38px;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		border: 1px solid color-mix(in srgb, var(--vw-toggle) 45%, transparent);
		background: color-mix(in srgb, var(--vw-cover) 18%, transparent);
		color: #fff;
		cursor: pointer;
		transition:
			background 160ms ease,
			transform 160ms ease,
			opacity 160ms ease;
	}

	.viewer-iconbtn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--vw-button) 55%, transparent);
		transform: translateY(-1px);
	}

	.viewer-iconbtn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.viewer-iconbtn:focus-visible,
	.viewer-nav:focus-visible,
	.viewer-thumb:focus-visible {
		outline: 2px solid var(--vw-button);
		outline-offset: 2px;
	}

	.viewer-close:hover {
		background: rgba(220, 38, 38, 0.75);
	}

	/* ── Stage ── */
	.viewer-stage {
		position: relative;
		z-index: 1;
		display: flex;
		height: 100%;
		width: 100%;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		touch-action: none;
		padding: 68px 16px 132px;
	}

	.viewer-slide {
		display: flex;
		max-height: 100%;
		max-width: min(1400px, 100%);
		align-items: center;
		justify-content: center;
		will-change: transform;
	}

	.viewer-slide.zoomable {
		cursor: zoom-in;
	}
	.viewer-slide.grabbing {
		cursor: grabbing;
	}

	.viewer-media {
		display: block;
		max-height: calc(100vh - 210px);
		max-width: 100%;
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: 14px;
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
		-webkit-user-select: none;
		user-select: none;
	}

	.viewer-media.is-hidden {
		opacity: 0;
	}

	.viewer-preload {
		position: absolute;
		height: 1px;
		width: 1px;
		opacity: 0;
		pointer-events: none;
	}

	/* ── Loading / fallback ── */
	.viewer-spinner {
		height: 42px;
		width: 42px;
		border-radius: 50%;
		border: 3px solid color-mix(in srgb, var(--vw-toggle) 50%, transparent);
		border-top-color: var(--vw-button);
		animation: viewer-spin 720ms linear infinite;
	}

	@keyframes viewer-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.viewer-fallback {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		border-radius: 18px;
		border: 1px solid color-mix(in srgb, var(--vw-toggle) 45%, transparent);
		background: color-mix(in srgb, var(--vw-cover) 16%, transparent);
		padding: 40px 44px;
		color: #fff;
		text-align: center;
	}

	.viewer-fallback-icon {
		font-size: 40px;
	}

	.viewer-fallback-link {
		border-radius: 10px;
		background: var(--vw-button);
		padding: 9px 18px;
		font-size: 13px;
		font-weight: 600;
		color: var(--vw-button-text);
		text-decoration: none;
	}

	/* ── Audio ── */
	.viewer-audio {
		display: flex;
		width: min(440px, 86vw);
		flex-direction: column;
		align-items: center;
		gap: 16px;
		border-radius: 20px;
		border: 1px solid color-mix(in srgb, var(--vw-toggle) 45%, transparent);
		background: color-mix(in srgb, var(--vw-cover) 16%, transparent);
		padding: 32px;
	}

	.viewer-audio-art {
		display: grid;
		height: 96px;
		width: 96px;
		place-items: center;
		border-radius: 20px;
		background: color-mix(in srgb, var(--vw-button) 40%, transparent);
		font-size: 40px;
	}

	.viewer-audio-title {
		font-size: 15px;
		font-weight: 600;
		color: #fff;
	}

	.viewer-audio-player {
		width: 100%;
	}

	/* ── Navigation ── */
	.viewer-nav {
		position: absolute;
		top: 50%;
		z-index: 2;
		display: grid;
		height: 46px;
		width: 46px;
		translate: 0 -50%;
		place-items: center;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--vw-toggle) 45%, transparent);
		background: color-mix(in srgb, var(--vw-cover) 20%, transparent);
		color: #fff;
		cursor: pointer;
		transition:
			background 160ms ease,
			scale 160ms ease,
			opacity 240ms ease;
	}

	.viewer-nav:hover {
		background: var(--vw-button);
		scale: 1.06;
	}

	.viewer-nav.hidden-chrome {
		opacity: 0;
		pointer-events: none;
	}

	.viewer-nav-prev {
		left: 16px;
	}
	.viewer-nav-next {
		right: 16px;
	}

	/* ── Bottom: caption + filmstrip ── */
	.viewer-bottom {
		bottom: 0;
		flex-direction: column;
		gap: 10px;
		padding: 16px 16px calc(16px + max(env(safe-area-inset-bottom), 0px));
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
	}

	.viewer-caption {
		margin: 0 auto;
		max-width: 760px;
		text-align: center;
		font-size: 13px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.86);
	}

	.viewer-filmstrip {
		display: flex;
		justify-content: flex-start;
		gap: 8px;
		overflow-x: auto;
		padding: 4px;
		scrollbar-width: thin;
		scroll-snap-type: x proximity;
	}

	/* Centre the strip when it is short enough to fit. */
	@media (min-width: 640px) {
		.viewer-filmstrip {
			justify-content: safe center;
		}
	}

	.viewer-filmstrip::-webkit-scrollbar {
		height: 6px;
	}
	.viewer-filmstrip::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: color-mix(in srgb, var(--vw-toggle) 60%, transparent);
	}

	.viewer-thumb {
		position: relative;
		display: grid;
		height: 54px;
		width: 54px;
		flex: 0 0 auto;
		place-items: center;
		overflow: hidden;
		border-radius: 10px;
		border: 2px solid transparent;
		background: color-mix(in srgb, var(--vw-cover) 22%, transparent);
		padding: 0;
		cursor: pointer;
		opacity: 0.6;
		scroll-snap-align: center;
		transition:
			opacity 160ms ease,
			border-color 160ms ease,
			transform 160ms ease;
	}

	.viewer-thumb:hover {
		opacity: 1;
		transform: translateY(-2px);
	}

	.viewer-thumb.active {
		border-color: var(--vw-button);
		opacity: 1;
	}

	.viewer-thumb img {
		height: 100%;
		width: 100%;
		object-fit: cover;
	}

	.viewer-thumb-glyph {
		font-size: 18px;
		color: #fff;
	}

	.viewer-thumb-badge {
		position: absolute;
		right: 3px;
		bottom: 3px;
		display: grid;
		height: 16px;
		width: 16px;
		place-items: center;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.65);
		font-size: 8px;
		color: #fff;
	}

	/* ── Small screens ── */
	@media (max-width: 640px) {
		.viewer-stage {
			padding: 60px 8px 118px;
		}
		.viewer-media {
			max-height: calc(100vh - 190px);
			border-radius: 10px;
		}
		/* Arrows are redundant next to swipe, and they crowd a phone screen. */
		.viewer-nav {
			display: none;
		}
		.viewer-title {
			display: none;
		}
		.viewer-thumb {
			height: 46px;
			width: 46px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.viewer-slide,
		.viewer-topbar,
		.viewer-bottom,
		.viewer-nav,
		.viewer-thumb,
		.viewer-iconbtn {
			transition: none !important;
		}
		.viewer-spinner {
			animation-duration: 1600ms;
		}
	}
</style>
