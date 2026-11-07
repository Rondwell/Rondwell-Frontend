/**
 * ════════════════════════════════════════════════════════════════════════
 *  VIEWPORT + GESTURES
 * ════════════════════════════════════════════════════════════════════════
 *
 * Pan / zoom / drag / marquee for the seat canvas, on one input model.
 *
 * ── Why this module exists ──────────────────────────────────────────────
 *
 * The previous builder was unusable on touch devices, and not by degrees:
 *
 *   - Elements were placed with **HTML5 drag-and-drop** (`draggable`,
 *     `dragstart`, `drop`). Those events do not fire on touch at all, so
 *     there was no way to put a single element on the canvas from a phone
 *     or tablet.
 *   - Every canvas interaction was `mousedown` / `mousemove` / `mouseup`.
 *     No `pointer*`, no `touch*`, no `touch-action`. So nothing could be
 *     selected, dragged, or resized either.
 *   - Zoom was `wheel`-only — no pinch.
 *
 * Pointer Events fix all three at once: one code path handles mouse, pen
 * and touch, and `setPointerCapture` keeps a drag alive when the finger
 * leaves the element. Multi-touch is handled explicitly because pinch has
 * no mouse equivalent to fall back on.
 *
 * ── Coordinate spaces ───────────────────────────────────────────────────
 *
 *   world  — layout coordinates, what elements and seats are stored in
 *   screen — CSS pixels relative to the container's top-left
 *
 * `screen = world * zoom + offset`. Every hit test converts to world
 * first, so hit areas stay correct at any zoom — the old code mixed the
 * two and lost accuracy as you zoomed out.
 */

export interface Viewport {
	x: number;
	y: number;
	zoom: number;
}

export interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface Point {
	x: number;
	y: number;
}

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;

/**
 * Movement in screen pixels before a press becomes a drag.
 *
 * Needed for touch specifically: a finger never holds perfectly still,
 * so without a threshold every tap registers as a 1–3px drag and a
 * "select this seat" becomes "nudge this seat". 6px is below the ~9px
 * most platforms use for scroll detection, which keeps the canvas
 * feeling responsive while still absorbing jitter.
 */
export const DRAG_THRESHOLD = 6;

// ── Conversions ────────────────────────────────────────────────────────

export function screenToWorld(vp: Viewport, sx: number, sy: number): Point {
	return { x: (sx - vp.x) / vp.zoom, y: (sy - vp.y) / vp.zoom };
}

export function worldToScreen(vp: Viewport, wx: number, wy: number): Point {
	return { x: wx * vp.zoom + vp.x, y: wy * vp.zoom + vp.y };
}

export function clampZoom(zoom: number): number {
	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Zoom about a fixed screen point.
 *
 * The anchor stays put, which is what makes wheel-zoom and pinch-zoom
 * feel attached to the cursor or the fingers rather than to the canvas
 * origin.
 */
export function zoomAt(vp: Viewport, screenX: number, screenY: number, nextZoom: number): Viewport {
	const zoom = clampZoom(nextZoom);
	const ratio = zoom / vp.zoom;
	return {
		x: screenX - (screenX - vp.x) * ratio,
		y: screenY - (screenY - vp.y) * ratio,
		zoom
	};
}

/**
 * Frame `bounds` inside a viewport of `width` × `height`.
 *
 * Zoom is capped at 1 so a tiny layout is centred at natural size rather
 * than magnified into blur.
 */
export function fitBounds(
	bounds: Bounds | null,
	width: number,
	height: number,
	padding = 64,
	maxZoom = 1
): Viewport {
	if (!bounds || width <= 0 || height <= 0) return { x: 0, y: 0, zoom: 1 };

	const bw = Math.max(1, bounds.maxX - bounds.minX);
	const bh = Math.max(1, bounds.maxY - bounds.minY);
	const zoom = clampZoom(
		Math.min((width - padding * 2) / bw, (height - padding * 2) / bh, maxZoom)
	);

	return {
		x: width / 2 - (bounds.minX + bw / 2) * zoom,
		y: height / 2 - (bounds.minY + bh / 2) * zoom,
		zoom
	};
}

// ── Gesture controller ─────────────────────────────────────────────────

export type GestureMode = 'idle' | 'pan' | 'drag' | 'marquee' | 'pinch';

export interface GestureHandlers {
	/** World point of a press that did not become a drag. */
	onTap?(world: Point, ev: PointerEvent): void;
	/** Press-and-hold without moving. Used for the touch context menu. */
	onLongPress?(world: Point, ev: PointerEvent): void;
	/**
	 * Decide what a press starts. Return 'drag' to move something,
	 * 'marquee' to rubber-band select, 'pan' to move the canvas.
	 */
	decideMode?(world: Point, ev: PointerEvent): GestureMode;
	onDragStart?(world: Point, ev: PointerEvent): void;
	/** `delta` is in world units, already divided by zoom. */
	onDragMove?(world: Point, delta: Point, ev: PointerEvent): void;
	onDragEnd?(world: Point, ev: PointerEvent): void;
	onMarquee?(from: Point, to: Point): void;
	onMarqueeEnd?(from: Point, to: Point): void;
	onViewportChange?(vp: Viewport): void;
	/** Pointer moved with nothing pressed — for hover highlighting. */
	onHover?(world: Point, ev: PointerEvent): void;
}

export interface GestureController {
	readonly viewport: Viewport;
	readonly mode: GestureMode;
	readonly marquee: { from: Point; to: Point } | null;
	setViewport(vp: Viewport): void;
	attach(el: HTMLElement): () => void;
	/** Programmatic zoom about the container's centre. */
	zoomBy(factor: number): void;
	fit(bounds: Bounds | null, padding?: number, maxZoom?: number): void;
	destroy(): void;
}

/**
 * Long-press delay. Matches the platform convention closely enough that
 * it does not feel broken, while staying short enough that an organizer
 * does not think the press was missed.
 */
const LONG_PRESS_MS = 500;

export function createGestureController(
	handlers: GestureHandlers = {},
	initial: Viewport = { x: 0, y: 0, zoom: 1 }
): GestureController {
	let viewport: Viewport = { ...initial };
	let mode: GestureMode = 'idle';
	let marquee: { from: Point; to: Point } | null = null;

	let host: HTMLElement | null = null;

	/** Live pointers, keyed by pointerId. Multi-touch needs all of them. */
	const pointers = new Map<number, { sx: number; sy: number }>();

	let pressScreen: Point | null = null;
	let pressWorld: Point | null = null;
	let lastScreen: Point | null = null;
	let pendingMode: GestureMode = 'idle';
	let movedPastThreshold = false;
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;

	// Pinch baseline.
	let pinchStartDist = 0;
	let pinchStartZoom = 1;

	function rect(): DOMRect {
		return (
			host?.getBoundingClientRect() ??
			({ left: 0, top: 0, width: 0, height: 0 } as DOMRect)
		);
	}

	function toScreen(ev: { clientX: number; clientY: number }): Point {
		const r = rect();
		return { x: ev.clientX - r.left, y: ev.clientY - r.top };
	}

	function commit(vp: Viewport) {
		viewport = vp;
		handlers.onViewportChange?.(viewport);
	}

	function cancelLongPress() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	function pinchDistance(): number {
		const [a, b] = [...pointers.values()];
		if (!a || !b) return 0;
		return Math.hypot(a.sx - b.sx, a.sy - b.sy);
	}

	function pinchCentre(): Point {
		const [a, b] = [...pointers.values()];
		if (!a || !b) return { x: 0, y: 0 };
		return { x: (a.sx + b.sx) / 2, y: (a.sy + b.sy) / 2 };
	}

	function onPointerDown(ev: PointerEvent) {
		if (!host) return;

		// Ignore the right button: it opens the context menu, and treating
		// it as a pan start leaves the canvas stuck mid-gesture when the
		// menu swallows the matching pointerup.
		if (ev.pointerType === 'mouse' && ev.button !== 0) return;

		const s = toScreen(ev);
		pointers.set(ev.pointerId, { sx: s.x, sy: s.y });

		// Second finger down: switch to pinch and abandon whatever the
		// first finger had started. Without this, a one-finger pan that
		// becomes a two-finger pinch keeps panning by the midpoint and the
		// canvas lurches.
		if (pointers.size === 2) {
			cancelLongPress();
			if (mode === 'drag') handlers.onDragEnd?.(pressWorld ?? { x: 0, y: 0 }, ev);
			if (mode === 'marquee' && marquee) handlers.onMarqueeEnd?.(marquee.from, marquee.to);
			marquee = null;
			mode = 'pinch';
			pinchStartDist = pinchDistance();
			pinchStartZoom = viewport.zoom;
			return;
		}
		if (pointers.size > 2) return;

		/**
		 * Capture the pointer so the gesture keeps receiving events after
		 * it leaves this element. The old mouse implementation ended a
		 * drag on `mouseleave`, so dragging an element toward the edge of
		 * the canvas dropped it unpredictably.
		 */
		try {
			host.setPointerCapture(ev.pointerId);
		} catch {
			/* capture is best-effort */
		}

		pressScreen = s;
		pressWorld = screenToWorld(viewport, s.x, s.y);
		lastScreen = s;
		movedPastThreshold = false;
		pendingMode = handlers.decideMode?.(pressWorld, ev) ?? 'pan';
		mode = 'idle';

		if (handlers.onLongPress) {
			longPressTimer = setTimeout(() => {
				longPressTimer = null;
				if (!movedPastThreshold && pressWorld) {
					mode = 'idle';
					handlers.onLongPress?.(pressWorld, ev);
				}
			}, LONG_PRESS_MS);
		}
	}

	function onPointerMove(ev: PointerEvent) {
		const s = toScreen(ev);

		if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, { sx: s.x, sy: s.y });

		// ── Pinch ──
		if (mode === 'pinch' && pointers.size >= 2) {
			const dist = pinchDistance();
			if (pinchStartDist > 0 && dist > 0) {
				const centre = pinchCentre();
				commit(zoomAt(viewport, centre.x, centre.y, pinchStartZoom * (dist / pinchStartDist)));
			}
			return;
		}

		// ── Hover (nothing pressed) ──
		if (!pressScreen) {
			if (handlers.onHover) handlers.onHover(screenToWorld(viewport, s.x, s.y), ev);
			return;
		}

		const dxScreen = s.x - (lastScreen?.x ?? s.x);
		const dyScreen = s.y - (lastScreen?.y ?? s.y);

		if (!movedPastThreshold) {
			const travelled = Math.hypot(s.x - pressScreen.x, s.y - pressScreen.y);
			if (travelled < DRAG_THRESHOLD) {
				lastScreen = s;
				return;
			}
			// Threshold crossed — the press is now a gesture.
			movedPastThreshold = true;
			cancelLongPress();
			mode = pendingMode === 'idle' ? 'pan' : pendingMode;
			if (mode === 'drag') handlers.onDragStart?.(pressWorld!, ev);
			if (mode === 'marquee') {
				marquee = { from: pressWorld!, to: pressWorld! };
			}
		}

		const world = screenToWorld(viewport, s.x, s.y);

		if (mode === 'pan') {
			commit({ ...viewport, x: viewport.x + dxScreen, y: viewport.y + dyScreen });
		} else if (mode === 'drag') {
			handlers.onDragMove?.(
				world,
				{ x: dxScreen / viewport.zoom, y: dyScreen / viewport.zoom },
				ev
			);
		} else if (mode === 'marquee' && marquee) {
			marquee = { from: marquee.from, to: world };
			handlers.onMarquee?.(marquee.from, marquee.to);
		}

		lastScreen = s;
	}

	function endPointer(ev: PointerEvent) {
		cancelLongPress();
		pointers.delete(ev.pointerId);

		try {
			host?.releasePointerCapture(ev.pointerId);
		} catch {
			/* already released */
		}

		// Lifting one finger out of a pinch: stay out of gesture mode
		// until the remaining finger is lifted too. Resuming a pan from
		// the survivor makes the canvas jump by the distance between the
		// two fingers.
		if (mode === 'pinch') {
			if (pointers.size < 2) {
				mode = 'idle';
				pressScreen = null;
				pressWorld = null;
				lastScreen = null;
			}
			return;
		}

		const world = pressWorld;

		if (!movedPastThreshold && world) {
			handlers.onTap?.(world, ev);
		} else if (mode === 'drag' && world) {
			handlers.onDragEnd?.(screenToWorld(viewport, toScreen(ev).x, toScreen(ev).y), ev);
		} else if (mode === 'marquee' && marquee) {
			handlers.onMarqueeEnd?.(marquee.from, marquee.to);
		}

		marquee = null;
		mode = 'idle';
		pressScreen = null;
		pressWorld = null;
		lastScreen = null;
		movedPastThreshold = false;
		pendingMode = 'idle';
	}

	function onWheel(ev: WheelEvent) {
		if (!host) return;
		ev.preventDefault();
		const s = toScreen(ev);

		/**
		 * Ctrl+wheel is how a trackpad pinch arrives, and how most apps
		 * expect an explicit zoom. A plain wheel also zooms here because
		 * the canvas fills its pane and has nothing to scroll.
		 *
		 * `deltaMode` matters: a mouse wheel reports lines (1) or pages
		 * (2) while a trackpad reports pixels (0). Treating a line delta
		 * as pixels made one wheel click jump several zoom steps.
		 */
		const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 100 : 1;
		const delta = ev.deltaY * unit;
		const factor = Math.exp(-delta * 0.0015);
		commit(zoomAt(viewport, s.x, s.y, viewport.zoom * factor));
	}

	function onContextMenu(ev: Event) {
		// Suppressed so a long-press on touch does not also raise the
		// browser menu over the canvas.
		ev.preventDefault();
	}

	return {
		get viewport() {
			return viewport;
		},
		get mode() {
			return mode;
		},
		get marquee() {
			return marquee;
		},

		setViewport(vp: Viewport) {
			viewport = { ...vp, zoom: clampZoom(vp.zoom) };
		},

		attach(el: HTMLElement) {
			host = el;

			/**
			 * `touch-action: none` is what actually makes touch work. Without
			 * it the browser claims the gesture for page scroll / pinch-zoom
			 * and the canvas receives a `pointercancel` mid-drag.
			 */
			el.style.touchAction = 'none';

			el.addEventListener('pointerdown', onPointerDown);
			el.addEventListener('pointermove', onPointerMove);
			el.addEventListener('pointerup', endPointer);
			el.addEventListener('pointercancel', endPointer);
			el.addEventListener('wheel', onWheel, { passive: false });
			el.addEventListener('contextmenu', onContextMenu);

			return () => {
				el.removeEventListener('pointerdown', onPointerDown);
				el.removeEventListener('pointermove', onPointerMove);
				el.removeEventListener('pointerup', endPointer);
				el.removeEventListener('pointercancel', endPointer);
				el.removeEventListener('wheel', onWheel);
				el.removeEventListener('contextmenu', onContextMenu);
				pointers.clear();
				cancelLongPress();
				host = null;
			};
		},

		zoomBy(factor: number) {
			const r = rect();
			commit(zoomAt(viewport, r.width / 2, r.height / 2, viewport.zoom * factor));
		},

		fit(bounds: Bounds | null, padding = 64, maxZoom = 1) {
			const r = rect();
			commit(fitBounds(bounds, r.width, r.height, padding, maxZoom));
		},

		destroy() {
			cancelLongPress();
			pointers.clear();
			host = null;
		}
	};
}

// ── Snapping ───────────────────────────────────────────────────────────

export interface SnapResult {
	x: number;
	y: number;
	/** World-space guide lines to draw, so the organizer sees why it snapped. */
	guides: Array<{ axis: 'x' | 'y'; at: number }>;
}

/**
 * Snap a dragged box to a grid and to its neighbours' edges and centres.
 *
 * Alignment is the difference between a layout that looks drawn and one
 * that looks designed, and by hand at any zoom it is guesswork — the
 * previous builder had no snapping at all, so blocks ended up a few
 * pixels out and the 3D view made every one of those obvious.
 *
 * Neighbour snapping wins over grid snapping when both are in range:
 * lining up with the block next to you is almost always the intent, and
 * the grid is only a fallback when nothing is nearby.
 */
export function snapBox(
	box: { x: number; y: number; width: number; height: number },
	others: Array<{ x: number; y: number; width: number; height: number }>,
	opts: { grid?: number; threshold?: number; enabled?: boolean } = {}
): SnapResult {
	const { grid = 10, threshold = 8, enabled = true } = opts;
	if (!enabled) return { x: box.x, y: box.y, guides: [] };

	const guides: SnapResult['guides'] = [];

	// Candidate lines on each axis: leading edge, centre, trailing edge.
	const selfX = [box.x, box.x + box.width / 2, box.x + box.width];
	const selfY = [box.y, box.y + box.height / 2, box.y + box.height];

	let bestX: { delta: number; at: number } | null = null;
	let bestY: { delta: number; at: number } | null = null;

	for (const o of others) {
		const otherX = [o.x, o.x + o.width / 2, o.x + o.width];
		const otherY = [o.y, o.y + o.height / 2, o.y + o.height];

		for (const sx of selfX) {
			for (const ox of otherX) {
				const d = ox - sx;
				if (Math.abs(d) <= threshold && (!bestX || Math.abs(d) < Math.abs(bestX.delta))) {
					bestX = { delta: d, at: ox };
				}
			}
		}
		for (const sy of selfY) {
			for (const oy of otherY) {
				const d = oy - sy;
				if (Math.abs(d) <= threshold && (!bestY || Math.abs(d) < Math.abs(bestY.delta))) {
					bestY = { delta: d, at: oy };
				}
			}
		}
	}

	let x = box.x;
	let y = box.y;

	if (bestX) {
		x += bestX.delta;
		guides.push({ axis: 'x', at: bestX.at });
	} else if (grid > 0) {
		x = Math.round(box.x / grid) * grid;
	}

	if (bestY) {
		y += bestY.delta;
		guides.push({ axis: 'y', at: bestY.at });
	} else if (grid > 0) {
		y = Math.round(box.y / grid) * grid;
	}

	return { x, y, guides };
}
