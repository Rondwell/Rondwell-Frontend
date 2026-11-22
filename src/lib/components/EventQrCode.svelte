<script lang="ts">
	/** Deterministic 21x21 QR-style matrix SVG seeded from event ID/slug/title. */
	export let seed: string = 'rondwell-event';
	export let size: number = 46;
	export let fg: string = '#141414';
	export let bg: string = '#FFFFFF';
	export let className: string = '';

	const MODULES = 21;

	function hashString(input: string): number {
		let h = 2166136261;
		for (let i = 0; i < input.length; i++) {
			h ^= input.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}

	function createRng(initialSeed: number): () => number {
		let s = initialSeed || 1337;
		return () => {
			s = (s + 0x6d2b79f5) | 0;
			let t = Math.imul(s ^ (s >>> 15), 1 | s);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function isInFinder(r: number, c: number, top: number, left: number): boolean {
		return r >= top && r < top + 7 && c >= left && c < left + 7;
	}

	function finderValue(r: number, c: number, top: number, left: number): boolean {
		const dr = r - top;
		const dc = c - left;
		if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
		if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
		return false;
	}

	function isInSeparator(r: number, c: number): boolean {
		if (r === 7 && c <= 7) return true;
		if (c === 7 && r <= 7) return true;
		if (r === 7 && c >= MODULES - 8) return true;
		if (c === MODULES - 8 && r <= 7) return true;
		if (r === MODULES - 8 && c <= 7) return true;
		if (c === 7 && r >= MODULES - 8) return true;
		return false;
	}

	function buildMatrix(rawSeed: string): { x: number; y: number }[] {
		const rng = createRng(hashString(rawSeed || 'rondwell-event'));
		const rects: { x: number; y: number }[] = [];

		for (let r = 0; r < MODULES; r++) {
			for (let c = 0; c < MODULES; c++) {
				let on = false;
				if (isInFinder(r, c, 0, 0)) {
					on = finderValue(r, c, 0, 0);
				} else if (isInFinder(r, c, 0, MODULES - 7)) {
					on = finderValue(r, c, 0, MODULES - 7);
				} else if (isInFinder(r, c, MODULES - 7, 0)) {
					on = finderValue(r, c, MODULES - 7, 0);
				} else if (isInSeparator(r, c)) {
					on = false;
				} else if (r === 6 || c === 6) {
					on = (r + c) % 2 === 0;
				} else {
					on = rng() > 0.46;
				}

				if (on) {
					rects.push({ x: c, y: r });
				}
			}
		}

		return rects;
	}

	$: cells = buildMatrix(seed);
</script>

<svg
	width={size}
	height={size}
	viewBox={`-1.5 -1.5 ${MODULES + 3} ${MODULES + 3}`}
	shape-rendering="crispEdges"
	aria-hidden="true"
	class={className}
	style={`display: block; background: ${bg}; border-radius: 6px;`}
>
	<rect x="-1.5" y="-1.5" width={MODULES + 3} height={MODULES + 3} fill={bg} />
	{#each cells as cell}
		<rect x={cell.x} y={cell.y} width="0.96" height="0.96" fill={fg} />
	{/each}
</svg>
