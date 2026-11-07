/**
 * ════════════════════════════════════════════════════════════════════════
 *  3D SEAT SCENE
 * ════════════════════════════════════════════════════════════════════════
 *
 * A Three.js renderer for a seat layout, shared by the organizer builder
 * (preview) and the attendee picker (selection).
 *
 * ── Why instanced rendering ─────────────────────────────────────────────
 *
 * An arena layout is tens of thousands of seats. One `Mesh` per seat
 * means one draw call per seat, and a browser gives up long before
 * 50,000 of those. A single `InstancedMesh` draws every seat in **one**
 * call, with a per-instance transform and a per-instance colour, so the
 * cost of a bigger venue is GPU memory rather than frame time.
 *
 * Per-instance colour is what makes it practical: a seat changing from
 * available to held is one `setColorAt` plus an update flag, not a
 * material swap or a re-partitioned scene.
 *
 * ── Coordinate mapping ──────────────────────────────────────────────────
 *
 * Layout space is the 2D canvas: x right, y **down**, z up (elevation).
 * Three.js is y-up. The mapping, applied once here so no other module
 * has to think about it:
 *
 *   three.x =  layout.x - centreX     (right)
 *   three.y =  layout.z               (up — the rake)
 *   three.z =  layout.y - centreY     (away from camera)
 *
 * The builder puts the stage at the top of the canvas (small y), so the
 * stage lands at negative z and the default camera looks along -z at it.
 * That is why "front of house" needs no extra configuration.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { LayoutElement, Seat, SeatType, StageView } from './types';
import { isFixture } from './types';
import { generateSeatsForElement } from './geometry';

export interface SceneSeat {
	seatId: string;
	x: number;
	y: number;
	z: number;
	status: string;
	seatTypeId?: string | null;
	label: string;
	section?: string;
	isAccessible?: boolean;
}

export interface SeatSceneOptions {
	/** Attendee picker allows selection; builder preview does not. */
	interactive?: boolean;
	onPick?(seat: SceneSeat | null): void;
	onHover?(seat: SceneSeat | null): void;
	/** Called once the first frame has rendered, to hide a loading state. */
	onReady?(): void;
}

export interface SeatScene {
	setLayout(
		elements: LayoutElement[],
		seats: SceneSeat[],
		seatTypes: SeatType[],
		stageView?: StageView | null
	): void;
	setSeatStatus(seatId: string, status: string): void;
	setSelection(seatIds: string[]): void;
	/** Fly the camera to a seat's eye position, looking at the stage. */
	viewFromSeat(seatId: string): void;
	resetView(): void;
	resize(): void;
	dispose(): void;
}

// ── Palette ────────────────────────────────────────────────────────────

/**
 * Status colours take precedence over a seat's tier colour.
 *
 * An attendee's first question is "can I have this one?", not "what tier
 * is it?" — so availability is encoded in the fill and tier only shows
 * through on available seats. Doing it the other way round made sold
 * seats in a gold tier read as premium-and-buyable.
 */
const STATUS_COLOR: Record<string, number> = {
	OCCUPIED: 0x9ca3af,
	RESERVED: 0xfbbf24,
	BLOCKED: 0x4b5563,
	SELECTED: 0x22c55e
};

const FLOOR_COLOR: Record<string, number> = {
	CARPET: 0x2d2a3e,
	WOOD: 0x6b4f33,
	CONCRETE: 0x3f3f46,
	GRASS: 0x2f5d3a,
	NONE: 0x18181b
};

/** Above this seat count, chairs degrade to flat quads. See `buildSeatGeometry`. */
const LOD_SEAT_THRESHOLD = 18_000;

/**
 * A low-poly chair: seat pad plus backrest, 24 triangles.
 *
 * Triangle budget is the constraint, not visual richness — 50,000 seats
 * at 24 triangles is 1.2M, which instancing draws comfortably. A
 * rounded, upholstered chair at ~600 triangles would be 30M and would
 * not render at all. Past `LOD_SEAT_THRESHOLD` even this is dropped for
 * a single quad: at stadium scale an individual chair is sub-pixel, so
 * the geometry is invisible and only its colour matters.
 */
function buildSeatGeometry(seatCount: number): THREE.BufferGeometry {
	if (seatCount > LOD_SEAT_THRESHOLD) {
		const plane = new THREE.PlaneGeometry(1, 1);
		plane.rotateX(-Math.PI / 2);
		return plane;
	}

	const pad = new THREE.BoxGeometry(0.9, 0.12, 0.85);
	pad.translate(0, 0.42, 0);

	const back = new THREE.BoxGeometry(0.9, 0.62, 0.12);
	back.translate(0, 0.73, -0.38);

	const merged = mergeGeometries([pad, back], false);
	pad.dispose();
	back.dispose();
	return merged ?? new THREE.BoxGeometry(0.9, 0.5, 0.85);
}

export function createSeatScene(
	canvas: HTMLCanvasElement,
	opts: SeatSceneOptions = {}
): SeatScene {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false,
		powerPreference: 'high-performance'
	});
	// Capped at 2: a 3x device pixel ratio triples fragment work for no
	// perceptible gain on a scene of flat-shaded boxes.
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x0b0b12);

	const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20_000);
	camera.position.set(0, 600, 900);

	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	// Clamped above the horizon so the camera cannot drop under the floor,
	// which renders the venue from below and reads as a glitch.
	controls.maxPolarAngle = Math.PI / 2.15;
	controls.minDistance = 20;
	controls.maxDistance = 8_000;

	// ── Lighting ──
	// Hemisphere + a single directional light: enough shape to read the
	// rake, with no shadow maps. Shadows on 50k instanced meshes are the
	// most expensive thing available and add nothing at this scale.
	scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a3a, 1.05));
	const sun = new THREE.DirectionalLight(0xffffff, 0.75);
	sun.position.set(400, 900, 500);
	scene.add(sun);

	// ── Mutable scene contents ──
	let seatMesh: THREE.InstancedMesh | null = null;
	let seatGeometry: THREE.BufferGeometry | null = null;
	let seatMaterial: THREE.Material | null = null;
	const disposables: Array<{ dispose(): void }> = [];
	const fixtureGroup = new THREE.Group();
	scene.add(fixtureGroup);

	let sceneSeats: SceneSeat[] = [];
	let seatIndexById = new Map<string, number>();
	let selected = new Set<string>();
	let typeColor = new Map<string, number>();
	let centre = { x: 0, y: 0 };
	let homeTarget = new THREE.Vector3(0, 0, 0);
	let homePosition = new THREE.Vector3(0, 600, 900);
	let stageCentre = new THREE.Vector3(0, 0, 0);

	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	let hoveredId: string | null = null;
	let disposed = false;
	let ready = false;

	/** Reusable scratch objects — allocating per frame would thrash GC. */
	const tmpMatrix = new THREE.Matrix4();
	const tmpColor = new THREE.Color();
	const tmpVec = new THREE.Vector3();

	function toWorld(x: number, y: number, z: number): THREE.Vector3 {
		return new THREE.Vector3(x - centre.x, z, y - centre.y);
	}

	/** Effective colour for a seat, given status, selection and tier. */
	function colorFor(seat: SceneSeat): number {
		if (selected.has(seat.seatId)) return STATUS_COLOR.SELECTED;
		const byStatus = STATUS_COLOR[seat.status];
		if (byStatus !== undefined) return byStatus;
		if (seat.isAccessible) return 0x10b981;
		const tier = seat.seatTypeId ? typeColor.get(seat.seatTypeId) : undefined;
		return tier ?? 0x6366f1;
	}

	function clearFixtures() {
		for (const child of [...fixtureGroup.children]) {
			fixtureGroup.remove(child);
			const mesh = child as THREE.Mesh;
			mesh.geometry?.dispose?.();
			const mat = mesh.material as THREE.Material | THREE.Material[];
			if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
			else mat?.dispose?.();
		}
	}

	function disposeSeatMesh() {
		if (seatMesh) {
			scene.remove(seatMesh);
			seatMesh.dispose();
			seatMesh = null;
		}
		seatGeometry?.dispose();
		seatGeometry = null;
		seatMaterial?.dispose();
		seatMaterial = null;
	}

	// ── Fixtures ──────────────────────────────────────────────────────

	const FIXTURE_STYLE: Record<string, { color: number; height: number }> = {
		STAGE: { color: 0x1f2937, height: 36 },
		SCREEN: { color: 0x111827, height: 120 },
		DANCEFLOOR: { color: 0x3b2f4a, height: 2 },
		BAR: { color: 0x4a3426, height: 48 },
		BUFFET: { color: 0x4a3f26, height: 40 },
		DOOR: { color: 0x7c5c3a, height: 8 },
		ENTRANCE: { color: 0x2f6b4a, height: 8 },
		EXIT: { color: 0x6b2f2f, height: 8 },
		RESTROOM: { color: 0x2a4a6b, height: 30 },
		AISLE: { color: 0x202028, height: 1 },
		WALL: { color: 0x33333d, height: 140 },
		PILLAR: { color: 0x3a3a44, height: 200 },
		BOOTH: { color: 0x3a2f4a, height: 60 }
	};

	function addFixture(el: LayoutElement) {
		const style = FIXTURE_STYLE[el.type] ?? { color: 0x3f3f46, height: 20 };
		const geo = new THREE.BoxGeometry(el.width, style.height, el.height);
		const mat = new THREE.MeshStandardMaterial({
			color: style.color,
			roughness: 0.85,
			metalness: 0.05
		});
		const mesh = new THREE.Mesh(geo, mat);

		const cx = el.x + el.width / 2;
		const cy = el.y + el.height / 2;
		mesh.position.copy(toWorld(cx, cy, (el.z ?? 0) + style.height / 2));
		if (el.rotation) mesh.rotation.y = -(el.rotation * Math.PI) / 180;
		fixtureGroup.add(mesh);

		if (el.type === 'STAGE') stageCentre.copy(mesh.position);
	}

	function addFloor(width: number, height: number, finish: string) {
		if (finish === 'NONE') return;
		const geo = new THREE.PlaneGeometry(width * 1.6, height * 1.6);
		geo.rotateX(-Math.PI / 2);
		const mat = new THREE.MeshStandardMaterial({
			color: FLOOR_COLOR[finish] ?? FLOOR_COLOR.CONCRETE,
			roughness: 0.95
		});
		const mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(0, -2, 0);
		fixtureGroup.add(mesh);
	}

	// ── Build ─────────────────────────────────────────────────────────

	function setLayout(
		elements: LayoutElement[],
		seats: SceneSeat[],
		seatTypes: SeatType[],
		stageView?: StageView | null
	) {
		if (disposed) return;

		clearFixtures();
		disposeSeatMesh();

		typeColor = new Map(
			(seatTypes ?? []).map((t) => [t.seatTypeId, new THREE.Color(t.color || '#6366F1').getHex()])
		);

		/**
		 * Seats come from materialized inventory when we have it, and from
		 * the client generator when we do not.
		 *
		 * The builder previews a layout that has never been published, so
		 * there are no `Seat` rows to render — without the fallback the
		 * organizer would design in 2D and see an empty 3D room, which is
		 * exactly when the 3D view is most useful. The attendee picker
		 * always passes real inventory, because only that carries live
		 * availability.
		 */
		let effective: SceneSeat[] = seats ?? [];
		if (effective.length === 0) {
			const derived: SceneSeat[] = [];
			for (const el of elements ?? []) {
				for (const g of generateSeatsForElement(el)) {
					derived.push({
						seatId: `${el.id}:${g.seatKey}`,
						x: g.x,
						y: g.y,
						z: g.z,
						status: 'AVAILABLE',
						seatTypeId: g.seatTypeId ?? null,
						label: g.label,
						section: g.section
					});
				}
			}
			effective = derived;
		}

		sceneSeats = effective;
		seatIndexById = new Map(effective.map((s, i) => [s.seatId, i]));

		// Centre the scene on its own content so orbiting feels anchored.
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const el of elements ?? []) {
			minX = Math.min(minX, el.x);
			minY = Math.min(minY, el.y);
			maxX = Math.max(maxX, el.x + el.width);
			maxY = Math.max(maxY, el.y + el.height);
		}
		for (const s of effective) {
			minX = Math.min(minX, s.x);
			minY = Math.min(minY, s.y);
			maxX = Math.max(maxX, s.x);
			maxY = Math.max(maxY, s.y);
		}
		if (!Number.isFinite(minX)) {
			minX = 0;
			minY = 0;
			maxX = 1000;
			maxY = 800;
		}
		centre = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
		const spanX = Math.max(1, maxX - minX);
		const spanY = Math.max(1, maxY - minY);

		addFloor(spanX, spanY, stageView?.floor ?? 'CONCRETE');
		stageCentre.set(0, 0, -spanY / 2);
		for (const el of elements ?? []) {
			if (isFixture(el.type)) addFixture(el);
		}

		// ── The seats ──
		if (effective.length > 0) {
			seatGeometry = buildSeatGeometry(effective.length);
			seatMaterial = new THREE.MeshStandardMaterial({
				roughness: 0.65,
				metalness: 0.05,
				// Instance colours are supplied per seat; the base must be
				// white or it would tint every one of them.
				color: 0xffffff
			});

			seatMesh = new THREE.InstancedMesh(seatGeometry, seatMaterial, effective.length);
			seatMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

			// Seat footprint in layout units. Scaling the unit chair here
			// rather than baking size into the geometry means one geometry
			// serves every seat size in the venue.
			const scale = 26;

			for (let i = 0; i < effective.length; i++) {
				const s = effective[i];
				tmpVec.copy(toWorld(s.x, s.y, s.z));
				tmpMatrix.makeScale(scale, scale, scale);
				tmpMatrix.setPosition(tmpVec);
				seatMesh.setMatrixAt(i, tmpMatrix);
				seatMesh.setColorAt(i, tmpColor.setHex(colorFor(s)));
			}
			seatMesh.instanceMatrix.needsUpdate = true;
			if (seatMesh.instanceColor) seatMesh.instanceColor.needsUpdate = true;
			// Required for raycasting to cull correctly — without it the
			// bounding sphere stays at the origin and picking misses.
			seatMesh.computeBoundingSphere();
			scene.add(seatMesh);
		}

		// ── Camera framing ──
		const diag = Math.hypot(spanX, spanY);
		homeTarget = new THREE.Vector3(
			stageView?.targetX ?? 0,
			stageView?.targetY ?? 0,
			stageView?.targetZ ?? -spanY * 0.25
		);
		homePosition = new THREE.Vector3(
			stageView?.cameraX ?? 0,
			stageView?.cameraY ?? diag * 0.45,
			stageView?.cameraZ ?? diag * 0.8
		);
		resetView();
	}

	function setSeatStatus(seatId: string, status: string) {
		const i = seatIndexById.get(seatId);
		if (i === undefined || !seatMesh) return;
		sceneSeats[i] = { ...sceneSeats[i], status };
		seatMesh.setColorAt(i, tmpColor.setHex(colorFor(sceneSeats[i])));
		if (seatMesh.instanceColor) seatMesh.instanceColor.needsUpdate = true;
	}

	function setSelection(seatIds: string[]) {
		if (!seatMesh) {
			selected = new Set(seatIds);
			return;
		}
		// Recolour only what changed — a full repaint of 50k instances on
		// every click is wasted bandwidth to the GPU.
		const next = new Set(seatIds);
		const touched = new Set<string>([...selected, ...next]);
		selected = next;
		for (const id of touched) {
			const i = seatIndexById.get(id);
			if (i === undefined) continue;
			seatMesh.setColorAt(i, tmpColor.setHex(colorFor(sceneSeats[i])));
		}
		if (seatMesh.instanceColor) seatMesh.instanceColor.needsUpdate = true;
	}

	/**
	 * Put the camera where the seat is, looking at the stage.
	 *
	 * This is the question every ticket buyer actually has — "what will I
	 * see from here?" — and the thing a flat seat map can never answer.
	 * Eye height is ~1.2m above the seat pad in layout units, i.e. a
	 * seated sightline rather than a standing one.
	 */
	function viewFromSeat(seatId: string) {
		const i = seatIndexById.get(seatId);
		if (i === undefined) return;
		const s = sceneSeats[i];
		const eye = toWorld(s.x, s.y, s.z);
		eye.y += 34;

		camera.position.copy(eye);
		controls.target.copy(stageCentre);
		// Pulled in so the seat's own neighbours do not clip the near plane.
		controls.minDistance = 1;
		controls.update();
	}

	function resetView() {
		camera.position.copy(homePosition);
		controls.target.copy(homeTarget);
		controls.minDistance = 20;
		controls.update();
	}

	// ── Picking ───────────────────────────────────────────────────────

	/**
	 * Raycast against the instanced mesh; Three.js reports `instanceId`,
	 * which indexes straight back into `sceneSeats`.
	 *
	 * One ray per pointer event, never per frame. An instanced raycast
	 * tests each instance, so at 50k seats this is a few milliseconds —
	 * fine for a click, which is why hover picking is throttled to
	 * animation frames below rather than run on every pointermove.
	 */
	function pickAt(clientX: number, clientY: number): SceneSeat | null {
		if (!seatMesh) return null;
		const rect = canvas.getBoundingClientRect();
		pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointer, camera);
		const hits = raycaster.intersectObject(seatMesh, false);
		const first = hits.find((h) => h.instanceId !== undefined);
		if (first?.instanceId === undefined) return null;
		return sceneSeats[first.instanceId] ?? null;
	}

	let pendingHover: { x: number; y: number } | null = null;
	let hoverScheduled = false;

	function onPointerMove(ev: PointerEvent) {
		if (!opts.interactive || !opts.onHover) return;
		pendingHover = { x: ev.clientX, y: ev.clientY };
		if (hoverScheduled) return;
		hoverScheduled = true;
		requestAnimationFrame(() => {
			hoverScheduled = false;
			if (!pendingHover || disposed) return;
			const seat = pickAt(pendingHover.x, pendingHover.y);
			const id = seat?.seatId ?? null;
			if (id !== hoveredId) {
				hoveredId = id;
				opts.onHover?.(seat);
			}
		});
	}

	/**
	 * Click-vs-orbit. A pick only fires when the pointer barely moved
	 * between down and up — otherwise every camera orbit that happens to
	 * end over a seat would also select it.
	 */
	let downAt: { x: number; y: number; t: number } | null = null;

	function onPointerDown(ev: PointerEvent) {
		downAt = { x: ev.clientX, y: ev.clientY, t: performance.now() };
	}

	function onPointerUp(ev: PointerEvent) {
		if (!opts.interactive || !opts.onPick || !downAt) return;
		const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y);
		const held = performance.now() - downAt.t;
		downAt = null;
		if (moved > 6 || held > 700) return;
		opts.onPick(pickAt(ev.clientX, ev.clientY));
	}

	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointerup', onPointerUp);

	// ── Render loop ───────────────────────────────────────────────────

	function resize() {
		const parent = canvas.parentElement;
		const w = parent?.clientWidth || canvas.clientWidth || 1;
		const h = parent?.clientHeight || canvas.clientHeight || 1;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	}
	resize();

	let frame = 0;
	function loop() {
		if (disposed) return;
		frame = requestAnimationFrame(loop);
		controls.update();
		renderer.render(scene, camera);
		if (!ready) {
			ready = true;
			opts.onReady?.();
		}
	}
	loop();

	// ── Teardown ──────────────────────────────────────────────────────

	function dispose() {
		if (disposed) return;
		disposed = true;
		cancelAnimationFrame(frame);

		canvas.removeEventListener('pointermove', onPointerMove);
		canvas.removeEventListener('pointerdown', onPointerDown);
		canvas.removeEventListener('pointerup', onPointerUp);

		controls.dispose();
		clearFixtures();
		disposeSeatMesh();
		for (const d of disposables) d.dispose();

		/**
		 * WebGL contexts are a scarce browser resource (~8–16 per page).
		 * Without an explicit release, switching between 2D and 3D or
		 * between layouts leaks one per mount and the canvas eventually
		 * refuses to initialise — with no error anyone can act on.
		 */
		renderer.dispose();
		renderer.forceContextLoss();
	}

	return {
		setLayout,
		setSeatStatus,
		setSelection,
		viewFromSeat,
		resetView,
		resize,
		dispose
	};
}
