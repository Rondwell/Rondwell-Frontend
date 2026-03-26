<script lang="ts">
	import {
		createSeatLayout,
		getSeatLayoutById,
		getTicketTypes,
		publishSeatLayout,
		updateSeatLayout
	} from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let eventId: string;
	export let layoutId: string | null = null;

	const dispatch = createEventDispatcher();

	// Canvas state
	interface CanvasElement {
		id: string;
		type: string;
		x: number;
		y: number;
		width: number;
		height: number;
		rotation: number;
		label?: string;
		seatNumber?: string;
		ticketTypeId?: string;
		ticketColor?: string;
		seatCount?: number;
		row?: string;
		section?: string;
		locked?: boolean;
		zIndex?: number;
	}

	let elements: CanvasElement[] = [];
	let title = 'Untitled Layout';
	let layoutType = 'CUSTOM';
	let canvasWidth = 1200;
	let canvasHeight = 800;
	let currentLayoutId: string | null = layoutId;
	let status = 'DRAFT';
	let saving = false;
	let ticketTypes: any[] = [];

	// Viewport / pan / zoom
	let viewport = { x: 0, y: 0, zoom: 1 };
	let isPanning = false;
	let lastMousePos: { x: number; y: number } | null = null;
	let canvasRef: HTMLDivElement;

	// Drag state
	let dragElementId: string | null = null;
	let selectedElementId: string | null = null;

	// Resize state
	let resizingElementId: string | null = null;
	let resizeHandle: string | null = null;
	let resizeStart: { x: number; y: number; w: number; h: number; ex: number; ey: number } | null = null;

	// History
	let history: CanvasElement[][] = [];
	let historyIndex = -1;
	let isHistoryAction = false;

	// Right sidebar
	let selectedTicketTypeId = '';
	let selectedTicketColor = '#F5A623';

	// Multi-select state
	let selectedElementIds: Set<string> = new Set();
	let isShiftHeld = false;
	let isMarqueeSelecting = false;
	let marqueeStart: { x: number; y: number } | null = null;
	let marqueeEnd: { x: number; y: number } | null = null;

	// Layout types
	const layoutTypes = ['STADIUM', 'THEATRE', 'ROUND_TABLE', 'CONFERENCE', 'CUSTOM'];

	// Element library
	const layoutElements = [
		{ type: 'ROUND_TABLE', label: 'Round Table', icon: 'mdi:circle-outline', w: 80, h: 80 },
		{ type: 'SQUARE_TABLE', label: 'Square Table', icon: 'mdi:square-outline', w: 80, h: 80 },
		{ type: 'CHAIR', label: 'Chair', icon: 'mdi:seat', w: 50, h: 50 },
		{ type: 'BIG_CHAIR', label: 'Big Chair', icon: 'mdi:seat-recline-extra', w: 80, h: 80 },
		{ type: 'DOOR', label: 'Door', icon: 'mdi:door', w: 60, h: 40 },
		{ type: 'STAGE', label: 'Stage', icon: 'mdi:podium', w: 200, h: 80 },
		{ type: 'RESTROOM', label: 'Rest room', icon: 'mdi:toilet', w: 80, h: 80 },
		{ type: 'RECTANGLE', label: 'Rectangle', icon: 'mdi:rectangle-outline', w: 120, h: 60 },
		{ type: 'CIRCLE', label: 'Circle', icon: 'mdi:circle-outline', w: 60, h: 60 },
		{ type: 'STRAIGHT', label: 'Straight', icon: 'mdi:minus', w: 4, h: 80 }
	];

	const shapeElements = [
		{ type: 'CIRCLE', label: 'Circle', w: 60, h: 60 },
		{ type: 'SQUARE', label: 'Square', w: 60, h: 60 },
		{ type: 'TRIANGLE', label: 'Triangle', w: 60, h: 60 }
	];

	$: selectedElement = elements.find((e) => e.id === selectedElementId) ?? null;
	$: hasMultiSelect = selectedElementIds.size > 1;
	$: multiSelectedElements = elements.filter((e) => selectedElementIds.has(e.id));

	onMount(async () => {
		// Load ticket types
		try {
			ticketTypes = await getTicketTypes(eventId);
		} catch {
			ticketTypes = [];
		}

		// Load existing layout if editing
		if (layoutId) {
			try {
				const data = await getSeatLayoutById(eventId, layoutId);
				title = data.title;
				layoutType = data.layoutType;
				canvasWidth = data.canvasWidth;
				canvasHeight = data.canvasHeight;
				elements = data.elements || [];
				status = data.status;
				currentLayoutId = data.layoutId;
			} catch {
				// new layout
			}
		}

		saveHistory();

		// Center canvas
		if (canvasRef) {
			const rect = canvasRef.getBoundingClientRect();
			viewport = {
				x: rect.width / 2 - (canvasWidth / 2) * 0.6,
				y: rect.height / 2 - (canvasHeight / 2) * 0.6,
				zoom: 0.6
			};
		}
	});

	// ===== History =====
	function saveHistory() {
		if (isHistoryAction) return;
		history = history.slice(0, historyIndex + 1);
		history.push(JSON.parse(JSON.stringify(elements)));
		historyIndex++;
		if (history.length > 50) { history.shift(); historyIndex--; }
	}

	function undo() {
		if (historyIndex > 0) {
			isHistoryAction = true;
			historyIndex--;
			elements = JSON.parse(JSON.stringify(history[historyIndex]));
			isHistoryAction = false;
		}
	}

	function redo() {
		if (historyIndex < history.length - 1) {
			isHistoryAction = true;
			historyIndex++;
			elements = JSON.parse(JSON.stringify(history[historyIndex]));
			isHistoryAction = false;
		}
	}

	// ===== Zoom =====
	function handleWheel(e: WheelEvent) {
		if (!canvasRef) return;
		e.preventDefault();
		const scaleAmount = -e.deltaY * 0.001;
		const newZoom = Math.min(Math.max(viewport.zoom + scaleAmount, 0.2), 3);
		const rect = canvasRef.getBoundingClientRect();
		const cx = e.clientX - rect.left;
		const cy = e.clientY - rect.top;
		const ratio = newZoom / viewport.zoom;
		viewport = { x: cx - (cx - viewport.x) * ratio, y: cy - (cy - viewport.y) * ratio, zoom: newZoom };
	}

	// ===== Pan =====
	function handleCanvasMouseDown(e: MouseEvent) {
		if (e.button === 0) {
			const target = e.target as HTMLElement;
			const isCanvas = target === canvasRef || target.classList.contains('canvas-bg');

			if (isCanvas && !isShiftHeld) {
				// Start marquee selection on empty canvas area
				const rect = canvasRef.getBoundingClientRect();
				const mx = (e.clientX - rect.left - viewport.x) / viewport.zoom;
				const my = (e.clientY - rect.top - viewport.y) / viewport.zoom;
				isMarqueeSelecting = true;
				marqueeStart = { x: mx, y: my };
				marqueeEnd = { x: mx, y: my };
				selectedElementId = null;
				selectedElementIds = new Set();
			} else if (isCanvas) {
				// Shift+click on empty space: start panning
				isPanning = true;
			}

			lastMousePos = { x: e.clientX, y: e.clientY };

			if (isCanvas && !isShiftHeld && !isMarqueeSelecting) {
				selectedElementId = null;
				selectedElementIds = new Set();
				isPanning = true;
			}
		}
	}

	// ===== Element Drag =====
	function handleElementMouseDown(e: MouseEvent, elId: string) {
		e.stopPropagation();
		const el = elements.find((x) => x.id === elId);
		if (el?.locked) return;

		if (isShiftHeld) {
			// Shift+click: toggle in multi-select
			const newSet = new Set(selectedElementIds);
			if (newSet.has(elId)) {
				newSet.delete(elId);
			} else {
				newSet.add(elId);
			}
			selectedElementIds = newSet;
			selectedElementId = newSet.size === 1 ? [...newSet][0] : null;
			return;
		}

		// If clicking an already multi-selected element, drag all of them
		if (selectedElementIds.has(elId) && selectedElementIds.size > 1) {
			dragElementId = elId;
			lastMousePos = { x: e.clientX, y: e.clientY };
			return;
		}

		// Normal click: single select
		dragElementId = elId;
		selectedElementId = elId;
		selectedElementIds = new Set([elId]);
		lastMousePos = { x: e.clientX, y: e.clientY };
	}

	// ===== Resize =====
	function handleResizeMouseDown(e: MouseEvent, elId: string, handle: string) {
		e.stopPropagation();
		const el = elements.find((x) => x.id === elId);
		if (!el || el.locked) return;
		resizingElementId = elId;
		resizeHandle = handle;
		resizeStart = { x: e.clientX, y: e.clientY, w: el.width, h: el.height, ex: el.x, ey: el.y };
		selectedElementId = elId;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!lastMousePos && !resizeStart && !isMarqueeSelecting) return;

		// Marquee selection
		if (isMarqueeSelecting && canvasRef) {
			const rect = canvasRef.getBoundingClientRect();
			const mx = (e.clientX - rect.left - viewport.x) / viewport.zoom;
			const my = (e.clientY - rect.top - viewport.y) / viewport.zoom;
			marqueeEnd = { x: mx, y: my };
			return;
		}

		if (resizingElementId && resizeStart) {
			const dx = (e.clientX - resizeStart.x) / viewport.zoom;
			const dy = (e.clientY - resizeStart.y) / viewport.zoom;
			elements = elements.map((el) => {
				if (el.id !== resizingElementId) return el;
				let { w, h, ex, ey } = resizeStart!;
				if (resizeHandle?.includes('e')) w = Math.max(10, w + dx);
				if (resizeHandle?.includes('s')) h = Math.max(10, h + dy);
				if (resizeHandle?.includes('w')) { w = Math.max(10, w - dx); ex = ex + dx; }
				if (resizeHandle?.includes('n')) { h = Math.max(10, h - dy); ey = ey + dy; }
				return { ...el, x: ex, y: ey, width: w, height: h };
			});
			return;
		}

		if (!lastMousePos) return;
		const deltaX = e.clientX - lastMousePos.x;
		const deltaY = e.clientY - lastMousePos.y;
		lastMousePos = { x: e.clientX, y: e.clientY };

		if (isPanning && !dragElementId) {
			viewport = { ...viewport, x: viewport.x + deltaX, y: viewport.y + deltaY };
		} else if (dragElementId) {
			// Multi-drag: move all selected elements together
			const idsToMove = selectedElementIds.size > 1 && selectedElementIds.has(dragElementId)
				? selectedElementIds
				: new Set([dragElementId]);
			elements = elements.map((el) => {
				if (idsToMove.has(el.id)) {
					return { ...el, x: el.x + deltaX / viewport.zoom, y: el.y + deltaY / viewport.zoom };
				}
				return el;
			});
		}
	}

	function handleMouseUp() {
		// Finalize marquee selection
		if (isMarqueeSelecting && marqueeStart && marqueeEnd) {
			const x1 = Math.min(marqueeStart.x, marqueeEnd.x);
			const y1 = Math.min(marqueeStart.y, marqueeEnd.y);
			const x2 = Math.max(marqueeStart.x, marqueeEnd.x);
			const y2 = Math.max(marqueeStart.y, marqueeEnd.y);

			// Only select if the marquee is big enough (not just a click)
			if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
				const ids = new Set<string>();
				for (const el of elements) {
					const elCx = el.x + el.width / 2;
					const elCy = el.y + el.height / 2;
					if (elCx >= x1 && elCx <= x2 && elCy >= y1 && elCy <= y2) {
						ids.add(el.id);
					}
				}
				selectedElementIds = ids;
				selectedElementId = ids.size === 1 ? [...ids][0] : null;
			}
			isMarqueeSelecting = false;
			marqueeStart = null;
			marqueeEnd = null;
		}

		if (dragElementId || resizingElementId) saveHistory();
		isPanning = false;
		dragElementId = null;
		lastMousePos = null;
		resizingElementId = null;
		resizeHandle = null;
		resizeStart = null;
	}

	// ===== Drag from sidebar =====
	function handleDragStart(e: DragEvent, elType: string, w: number, h: number) {
		e.dataTransfer!.setData('elType', elType);
		e.dataTransfer!.setData('elW', String(w));
		e.dataTransfer!.setData('elH', String(h));
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'copy';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const elType = e.dataTransfer!.getData('elType');
		const w = parseInt(e.dataTransfer!.getData('elW')) || 60;
		const h = parseInt(e.dataTransfer!.getData('elH')) || 60;
		if (!elType || !canvasRef) return;

		const rect = canvasRef.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;
		const cx = (mx - viewport.x) / viewport.zoom;
		const cy = (my - viewport.y) / viewport.zoom;

		const newEl: CanvasElement = {
			id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			type: elType,
			x: cx - w / 2,
			y: cy - h / 2,
			width: w,
			height: h,
			rotation: 0,
			label: elType === 'STAGE' ? 'Stage' : undefined,
			ticketColor: selectedTicketColor,
			ticketTypeId: selectedTicketTypeId || undefined,
			zIndex: elements.length
		};

		elements = [...elements, newEl];
		selectedElementId = newEl.id;
		saveHistory();
	}

	// ===== Delete =====
	function deleteElement(id: string) {
		elements = elements.filter((e) => e.id !== id);
		selectedElementId = null;
		selectedElementIds.delete(id);
		selectedElementIds = selectedElementIds;
		saveHistory();
	}

	// ===== Delete multiple =====
	function deleteSelectedElements() {
		if (selectedElementIds.size > 0) {
			elements = elements.filter((e) => !selectedElementIds.has(e.id));
			selectedElementIds = new Set();
			selectedElementId = null;
			saveHistory();
		} else if (selectedElementId) {
			deleteElement(selectedElementId);
		}
	}

	// ===== Apply color to all selected =====
	function applyColorToSelected(color: string) {
		if (selectedElementIds.size > 0) {
			elements = elements.map((el) => {
				if (selectedElementIds.has(el.id)) return { ...el, ticketColor: color };
				return el;
			});
			saveHistory();
		}
	}

	// ===== Apply ticket type to all selected =====
	function applyTicketTypeToSelected(ticketTypeId: string) {
		if (selectedElementIds.size > 0) {
			elements = elements.map((el) => {
				if (selectedElementIds.has(el.id)) return { ...el, ticketTypeId };
				return el;
			});
			saveHistory();
		}
	}

	// ===== Duplicate =====
	function duplicateElement(id: string) {
		const el = elements.find((e) => e.id === id);
		if (!el) return;
		const dup: CanvasElement = {
			...JSON.parse(JSON.stringify(el)),
			id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			x: el.x + 20,
			y: el.y + 20
		};
		elements = [...elements, dup];
		selectedElementId = dup.id;
		saveHistory();
	}

	// ===== Update selected element properties =====
	function updateSelectedProp(prop: string, value: any) {
		if (!selectedElementId) return;
		elements = elements.map((el) => {
			if (el.id === selectedElementId) return { ...el, [prop]: value };
			return el;
		});
		saveHistory();
	}

	// ===== Save / Publish =====
	async function handleSave(publish = false) {
		saving = true;
		try {
			const payload = { title, layoutType, canvasWidth, canvasHeight, elements };
			if (currentLayoutId) {
				await updateSeatLayout(eventId, currentLayoutId, payload);
				if (publish) await publishSeatLayout(eventId, currentLayoutId!);
			} else {
				const created = await createSeatLayout(eventId, payload);
				currentLayoutId = created.layoutId;
				if (publish && currentLayoutId) await publishSeatLayout(eventId, currentLayoutId);
			}
			status = publish ? 'PUBLISHED' : 'DRAFT';
		} catch (err: any) {
			alert(err.message ?? 'Failed to save');
		} finally {
			saving = false;
		}
	}

	// ===== Keyboard shortcuts =====
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Shift') isShiftHeld = true;
		if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
		if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
		if (e.key === 'Delete') { e.preventDefault(); deleteSelectedElements(); }
		if (e.ctrlKey && e.key === 'd' && selectedElementId) { e.preventDefault(); duplicateElement(selectedElementId); }
		if (e.ctrlKey && e.key === 'a') { e.preventDefault(); selectAll(); }
	}

	function handleKeyup(e: KeyboardEvent) {
		if (e.key === 'Shift') isShiftHeld = false;
	}

	function selectAll() {
		selectedElementIds = new Set(elements.map((e) => e.id));
		selectedElementId = null;
	}

	// Mobile sidebar
	let showMobileSidebar = false;
	let activeTab: 'layout' | 'shapes' = 'layout';
	let searchQuery = '';

	$: filteredLayoutElements = searchQuery
		? layoutElements.filter((e) => e.label.toLowerCase().includes(searchQuery.toLowerCase()))
		: layoutElements;

	$: filteredShapeElements = searchQuery
		? shapeElements.filter((e) => e.label.toLowerCase().includes(searchQuery.toLowerCase()))
		: shapeElements;
</script>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

<!-- MAIN WRAPPER -->
<div class="fixed inset-0 z-50 flex h-screen w-full flex-col bg-[#F6F3F7]">
	<!-- TOP BAR -->
	<div class="border-b bg-white">
		<!-- MOBILE HEADER -->
		<div class="relative md:hidden">
			<div class="flex items-center justify-between px-4 py-3">
				<button on:click={() => dispatch('close')} class="text-sm text-gray-600">
					<Icon icon="mdi:arrow-left" class="text-xl" />
				</button>
				<input
					bind:value={title}
					class="max-w-[50%] border-none bg-transparent text-center text-sm font-semibold outline-none"
					placeholder="Layout title"
				/>
				<button
					on:click={() => handleSave(true)}
					disabled={saving}
					class="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1.5 text-sm text-white"
				>
					{saving ? '...' : 'Publish'}
				</button>
			</div>
			<div class="flex items-center gap-2 border-t px-4 py-2">
				<button on:click={undo} class="rounded-md border p-1.5 hover:bg-gray-100">
					<Icon icon="mdi:undo" class="h-4 w-4" />
				</button>
				<button on:click={redo} class="rounded-md border p-1.5 hover:bg-gray-100">
					<Icon icon="mdi:redo" class="h-4 w-4" />
				</button>
				<button
					on:click={() => (viewport = { ...viewport, zoom: Math.min(viewport.zoom + 0.2, 3) })}
					class="rounded-md border p-1.5 hover:bg-gray-100"
				>
					<Icon icon="mdi:magnify-plus-outline" class="h-4 w-4" />
				</button>
				<button
					on:click={() => (viewport = { ...viewport, zoom: Math.max(viewport.zoom - 0.2, 0.2) })}
					class="rounded-md border p-1.5 hover:bg-gray-100"
				>
					<Icon icon="mdi:magnify-minus-outline" class="h-4 w-4" />
				</button>
				<span class="text-xs text-gray-500">{Math.round(viewport.zoom * 100)}%</span>
				<button
					on:click={() => handleSave(false)}
					disabled={saving}
					class="ml-auto rounded-md border px-3 py-1 text-xs"
				>
					{saving ? 'Saving...' : 'Save Draft'}
				</button>
			</div>
		</div>

		<!-- DESKTOP HEADER -->
		<div class="hidden items-center justify-between px-6 py-3 md:flex">
			<div class="flex items-center gap-6">
				<button
					on:click={() => dispatch('close')}
					class="rounded-lg border border-pink-300 px-5 py-2 text-black hover:bg-pink-50"
				>
					New project
				</button>
				<input
					bind:value={title}
					class="border-none bg-transparent text-lg font-semibold outline-none"
					placeholder="Title of the project"
				/>
			</div>
			<div class="flex items-center gap-3">
				<button on:click={undo} class="rounded-md border p-2 hover:bg-gray-100" title="Undo (Ctrl+Z)">
					<Icon icon="mdi:undo" class="h-5 w-5" />
				</button>
				<button on:click={redo} class="rounded-md border p-2 hover:bg-gray-100" title="Redo (Ctrl+Y)">
					<Icon icon="mdi:redo" class="h-5 w-5" />
				</button>
				<div class="flex items-center gap-2 rounded-md border p-2">
					<button on:click={() => (viewport = { ...viewport, zoom: Math.min(viewport.zoom + 0.1, 3) })}>
						<Icon icon="mdi:magnify-plus-outline" class="h-5 w-5" />
					</button>
					<button on:click={() => (viewport = { ...viewport, zoom: Math.max(viewport.zoom - 0.1, 0.2) })}>
						<Icon icon="mdi:magnify-minus-outline" class="h-5 w-5 text-gray-500" />
					</button>
					<span class="text-sm text-gray-700">{Math.round(viewport.zoom * 100)}%</span>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<button on:click={() => dispatch('close')} class="rounded-md border px-4 py-2 text-gray-700">
					Exit
				</button>
				<button
					on:click={() => handleSave(false)}
					disabled={saving}
					class="rounded-md border px-4 py-2 text-gray-700"
				>
					{saving ? 'Saving...' : 'Save Draft'}
				</button>
				<button
					on:click={() => handleSave(true)}
					disabled={saving}
					class="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-white"
				>
					{saving ? 'Saving...' : 'Save & Publish'}
				</button>
			</div>
		</div>
	</div>

	<!-- BODY -->
	<div class="flex flex-1 overflow-hidden">
		<!-- LEFT SIDEBAR (Desktop) -->
		<div class="hidden w-[240px] shrink-0 flex-col overflow-y-auto border-r bg-white p-4 md:flex">
			<!-- Search -->
			<div class="mb-4 flex items-center rounded-lg bg-[#F6F6F7] p-2">
				<Icon icon="mdi:magnify" class="mr-2 text-gray-500" />
				<input
					bind:value={searchQuery}
					type="text"
					placeholder="Search element"
					class="w-full bg-transparent text-sm outline-none"
				/>
			</div>

			<!-- Layout Elements -->
			<h2 class="mb-2 text-sm font-semibold text-gray-700">Layout Element</h2>
			<div class="mb-4 grid grid-cols-3 gap-3">
				{#each filteredLayoutElements as el}
					<div
						draggable="true"
						role="listitem"
						on:dragstart={(e) => handleDragStart(e, el.type, el.w, el.h)}
						class="flex cursor-grab flex-col items-center text-xs text-gray-700 active:cursor-grabbing"
					>
						<div
							class="mb-1 flex h-14 w-14 items-center justify-center rounded-xl border border-[#A7A7A7] transition-colors hover:border-pink-400 hover:bg-pink-50"
						>
							<Icon icon={el.icon} class="h-7 w-7 text-gray-400" />
						</div>
						{el.label}
					</div>
				{/each}
			</div>

			<!-- Shapes -->
			<h2 class="mb-2 text-sm font-semibold text-gray-700">Shapes Element</h2>
			<div class="grid grid-cols-3 gap-3">
				{#each filteredShapeElements as sh}
					<div
						draggable="true"
						role="listitem"
						on:dragstart={(e) => handleDragStart(e, sh.type, sh.w, sh.h)}
						class="flex cursor-grab flex-col items-center text-xs text-gray-700 active:cursor-grabbing"
					>
						{#if sh.type === 'CIRCLE'}
							<div class="mb-1 h-8 w-8 rounded-full border-2 border-gray-300"></div>
						{:else if sh.type === 'SQUARE'}
							<div class="mb-1 h-8 w-8 rounded border-2 border-gray-300"></div>
						{:else if sh.type === 'TRIANGLE'}
							<div
								class="mb-1 h-0 w-0 border-b-[30px] border-l-[18px] border-r-[18px] border-b-gray-500 border-l-transparent border-r-transparent"
							></div>
						{/if}
						{sh.label}
					</div>
				{/each}
			</div>

			<!-- Pro tip -->
			<div class="mt-auto rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50 to-purple-50 p-3">
				<p class="text-xs leading-relaxed text-purple-800">
					<strong>Tip:</strong> Drag elements onto the canvas. Scroll to zoom. Drag empty space to pan.
					Use Ctrl+Z/Y for undo/redo. Shift+click to multi-select. Drag over elements to marquee select. Ctrl+A to select all.
				</p>
			</div>
		</div>

		<!-- CANVAS AREA -->
		<div
			bind:this={canvasRef}
			on:wheel={handleWheel}
			on:mousedown={handleCanvasMouseDown}
			on:mousemove={handleMouseMove}
			on:mouseup={handleMouseUp}
			on:mouseleave={handleMouseUp}
			on:dragover={handleDragOver}
			on:drop={handleDrop}
			role="application"
			tabindex="0"
			class="relative flex-1 overflow-hidden {isPanning && !dragElementId ? 'cursor-grabbing' : 'cursor-default'}"
		>
			<!-- Transform container -->
			<div
				class="absolute inset-0 h-full w-full origin-top-left"
				style="transform: translate({viewport.x}px, {viewport.y}px) scale({viewport.zoom})"
			>
				<!-- Grid background -->
				<div
					class="canvas-bg absolute inset-[-200%] h-[500%] w-[500%]"
					style="background-image: radial-gradient(#ddd 1px, transparent 1px); background-size: 20px 20px;"
				></div>

				<!-- Canvas boundary -->
				<rect
					class="pointer-events-none absolute"
					style="left: 0; top: 0; width: {canvasWidth}px; height: {canvasHeight}px; border: 2px dashed #ccc; background: white; border-radius: 8px;"
				></rect>
				<div
					class="absolute rounded-lg border-2 border-dashed border-gray-300 bg-white shadow-sm"
					style="left: 0; top: 0; width: {canvasWidth}px; height: {canvasHeight}px;"
				>
					{#if elements.length === 0}
						<div class="flex h-full items-center justify-center">
							<span class="text-lg text-gray-300">Drag elements here to start designing</span>
						</div>
					{/if}
				</div>

				<!-- Render elements -->
				{#each elements as el (el.id)}
					<div
						class="absolute select-none {el.locked ? 'cursor-not-allowed opacity-70' : 'cursor-grab active:cursor-grabbing'}
						{selectedElementId === el.id ? 'ring-2 ring-pink-500 ring-offset-1' : ''}
						{selectedElementIds.has(el.id) && selectedElementId !== el.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''}"
						style="left: {el.x}px; top: {el.y}px; width: {el.width}px; height: {el.height}px;
						transform: rotate({el.rotation}deg); z-index: {el.zIndex ?? 0};"
						on:mousedown={(e) => handleElementMouseDown(e, el.id)}
						role="button"
						tabindex="0"
					>
						<!-- Element rendering by type -->
						{#if el.type === 'CHAIR'}
							<div
								class="flex h-full w-full items-center justify-center rounded"
								style="background-color: {el.ticketColor || '#F5A623'};"
							>
								<Icon icon="mdi:seat" class="text-white" style="width: {Math.min(el.width * 0.6, 32)}px; height: {Math.min(el.height * 0.6, 32)}px;" />
							</div>
						{:else if el.type === 'BIG_CHAIR'}
							<div
								class="flex h-full w-full items-center justify-center rounded-lg"
								style="background-color: {el.ticketColor || '#8B5CF6'};"
							>
								<Icon icon="mdi:seat-recline-extra" class="text-white" style="width: {Math.min(el.width * 0.6, 48)}px; height: {Math.min(el.height * 0.6, 48)}px;" />
							</div>
						{:else if el.type === 'ROUND_TABLE'}
							<div
								class="flex h-full w-full items-center justify-center rounded-full"
								style="background-color: {el.ticketColor || '#D4A574'};"
							>
								<Icon icon="mdi:circle-outline" class="h-6 w-6 text-white/60" />
							</div>
						{:else if el.type === 'SQUARE_TABLE'}
							<div
								class="flex h-full w-full items-center justify-center rounded"
								style="background-color: {el.ticketColor || '#D4A574'};"
							>
								<Icon icon="mdi:square-outline" class="h-6 w-6 text-white/60" />
							</div>
						{:else if el.type === 'STAGE'}
							<div class="flex h-full w-full items-center justify-center rounded-lg bg-gray-200 border-2 border-gray-300">
								<span class="text-sm font-semibold text-gray-600">{el.label || 'Stage'}</span>
							</div>
						{:else if el.type === 'DOOR'}
							<div class="flex h-full w-full items-center justify-center rounded bg-amber-100 border border-amber-300">
								<Icon icon="mdi:door" class="text-amber-600" style="width: {Math.min(el.width * 0.5, 28)}px; height: {Math.min(el.height * 0.5, 28)}px;" />
							</div>
						{:else if el.type === 'RESTROOM'}
							<div class="flex h-full w-full items-center justify-center rounded bg-blue-50 border border-blue-200">
								<Icon icon="mdi:toilet" class="text-blue-400" style="width: {Math.min(el.width * 0.5, 40)}px; height: {Math.min(el.height * 0.5, 40)}px;" />
							</div>
						{:else if el.type === 'RECTANGLE'}
							<div class="h-full w-full rounded border-2 border-gray-400"></div>
						{:else if el.type === 'CIRCLE'}
							<div class="h-full w-full rounded-full border-2 border-gray-400"></div>
						{:else if el.type === 'SQUARE'}
							<div class="h-full w-full rounded border-2 border-gray-400"></div>
						{:else if el.type === 'TRIANGLE'}
							<div class="flex h-full w-full items-center justify-center">
								<div
									class="h-0 w-0 border-b-[{el.height}px] border-l-[{el.width / 2}px] border-r-[{el.width / 2}px] border-b-gray-500 border-l-transparent border-r-transparent"
								></div>
							</div>
						{:else if el.type === 'STRAIGHT'}
							<div class="h-full w-full bg-gray-400 rounded-full"></div>
						{:else}
							<div class="flex h-full w-full items-center justify-center rounded bg-gray-200">
								<span class="text-xs text-gray-500">{el.type}</span>
							</div>
						{/if}

						<!-- Seat label -->
						{#if el.seatNumber}
							<div class="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1 py-0.5 text-[9px] text-white">
								{el.seatNumber}
							</div>
						{/if}

						<!-- Resize handles (when selected) -->
						{#if (selectedElementId === el.id || selectedElementIds.has(el.id)) && !el.locked}
							<div
								on:mousedown={(e) => handleResizeMouseDown(e, el.id, 'se')}
								class="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-se-resize rounded-full border-2 border-pink-500 bg-white"
								role="button" tabindex="0"
							></div>
							<div
								on:mousedown={(e) => handleResizeMouseDown(e, el.id, 'sw')}
								class="absolute -bottom-1.5 -left-1.5 h-3 w-3 cursor-sw-resize rounded-full border-2 border-pink-500 bg-white"
								role="button" tabindex="0"
							></div>
							<div
								on:mousedown={(e) => handleResizeMouseDown(e, el.id, 'ne')}
								class="absolute -top-1.5 -right-1.5 h-3 w-3 cursor-ne-resize rounded-full border-2 border-pink-500 bg-white"
								role="button" tabindex="0"
							></div>
							<div
								on:mousedown={(e) => handleResizeMouseDown(e, el.id, 'nw')}
								class="absolute -top-1.5 -left-1.5 h-3 w-3 cursor-nw-resize rounded-full border-2 border-pink-500 bg-white"
								role="button" tabindex="0"
							></div>
							<!-- Delete button -->
							<button
								on:mousedown|stopPropagation={() => deleteElement(el.id)}
								class="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
							>
								<Icon icon="mdi:close" class="h-3 w-3" />
							</button>
						{/if}
					</div>
				{/each}

				<!-- Marquee selection rectangle -->
				{#if isMarqueeSelecting && marqueeStart && marqueeEnd}
					{@const mx = Math.min(marqueeStart.x, marqueeEnd.x)}
					{@const my = Math.min(marqueeStart.y, marqueeEnd.y)}
					{@const mw = Math.abs(marqueeEnd.x - marqueeStart.x)}
					{@const mh = Math.abs(marqueeEnd.y - marqueeStart.y)}
					<div
						class="pointer-events-none absolute rounded border-2 border-blue-500 bg-blue-500/10"
						style="left: {mx}px; top: {my}px; width: {mw}px; height: {mh}px; z-index: 9999;"
					></div>
				{/if}
			</div>

			<!-- Zoom indicator -->
			<div class="absolute bottom-4 left-4 z-20 rounded-full bg-gray-900/80 px-3 py-1.5 text-xs font-mono font-bold text-white">
				{Math.round(viewport.zoom * 100)}%
			</div>
		</div>

		<!-- RIGHT SIDEBAR (Desktop) -->
		<div class="hidden w-[280px] shrink-0 flex-col gap-5 overflow-y-auto border-l bg-white p-5 md:flex">
			<!-- Multi-select toolbar -->
			{#if hasMultiSelect}
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
					<p class="mb-2 text-xs font-semibold text-blue-700">
						{selectedElementIds.size} elements selected
					</p>
					<div class="flex flex-col gap-2">
						<div>
							<span class="mb-1 block text-xs text-blue-600">Apply color to all</span>
							<div class="flex items-center gap-2 rounded-lg border bg-white p-2">
								<input
									type="color"
									bind:value={selectedTicketColor}
									on:change={() => applyColorToSelected(selectedTicketColor)}
									class="h-6 w-6 cursor-pointer border-none p-0 outline-none"
								/>
								<input
									bind:value={selectedTicketColor}
									class="flex-1 bg-transparent text-sm outline-none"
								/>
								<button
									on:click={() => applyColorToSelected(selectedTicketColor)}
									class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
								>Apply</button>
							</div>
						</div>
						<div>
							<span class="mb-1 block text-xs text-blue-600">Apply ticket type to all</span>
							<div class="flex items-center gap-2">
								<select
									bind:value={selectedTicketTypeId}
									class="flex-1 rounded-lg border bg-white p-2 text-sm"
								>
									<option value="">None</option>
									{#each ticketTypes as tt}
										<option value={tt._id || tt.id}>{tt.name}</option>
									{/each}
								</select>
								<button
									on:click={() => applyTicketTypeToSelected(selectedTicketTypeId)}
									class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
								>Apply</button>
							</div>
						</div>
						<button
							on:click={deleteSelectedElements}
							class="mt-1 flex items-center justify-center gap-1 rounded-lg border border-red-300 bg-red-50 py-2 text-sm text-red-600 hover:bg-red-100"
						>
							<Icon icon="mdi:delete-outline" class="h-4 w-4" />
							Delete all selected
						</button>
					</div>
				</div>
			{/if}

			<!-- Layout Type -->
			<div>
				<h2 class="mb-1 text-sm font-semibold text-gray-700">Layout type</h2>
				<select bind:value={layoutType} class="w-full rounded-lg border bg-white p-2 text-sm">
					{#each layoutTypes as t}
						<option value={t}>{t.replace('_', ' ')}</option>
					{/each}
				</select>
			</div>

			<!-- Canvas Size -->
			<div>
				<h2 class="mb-2 text-sm font-semibold text-gray-700">Layout</h2>
				<div class="mb-2 grid grid-cols-2 gap-2">
					<div class="flex items-center rounded-lg border bg-[#F7F8F9] px-2">
						<span class="text-xs text-gray-400">W</span>
						<input
							type="number"
							bind:value={canvasWidth}
							class="w-full bg-transparent p-2 text-sm outline-none"
						/>
					</div>
					<div class="flex items-center rounded-lg border bg-[#F7F8F9] px-2">
						<span class="text-xs text-gray-400">H</span>
						<input
							type="number"
							bind:value={canvasHeight}
							class="w-full bg-transparent p-2 text-sm outline-none"
						/>
					</div>
				</div>
				{#if selectedElement}
					<div class="flex items-center gap-2">
						<input
							type="number"
							value={Math.round(selectedElement.rotation)}
							on:change={(e) => updateSelectedProp('rotation', parseInt(e.currentTarget.value) || 0)}
							placeholder="0°"
							class="w-[60px] rounded-lg border bg-[#F7F8F9] p-2 text-sm"
						/>
						<button
							on:click={() => updateSelectedProp('locked', !selectedElement?.locked)}
							class="rounded-md border p-2 hover:bg-gray-100"
							title={selectedElement.locked ? 'Unlock' : 'Lock'}
						>
							<Icon icon={selectedElement.locked ? 'mdi:lock' : 'mdi:lock-open-outline'} class="h-4 w-4" />
						</button>
						<button
							on:click={() => duplicateElement(selectedElementId ?? '')}
							class="rounded-md border p-2 hover:bg-gray-100"
							title="Duplicate"
						>
							<Icon icon="mdi:content-copy" class="h-4 w-4" />
						</button>
						<button
							on:click={() => deleteElement(selectedElementId ?? '')}
							class="rounded-md border p-2 text-red-500 hover:bg-red-50"
							title="Delete"
						>
							<Icon icon="mdi:delete-outline" class="h-4 w-4" />
						</button>
					</div>
				{/if}
			</div>

			<!-- Ticket Type -->
			<div>
				<h2 class="mb-1 text-sm font-semibold text-gray-700">Select Ticket Type</h2>
				<select
					bind:value={selectedTicketTypeId}
					on:change={(e) => {
						const val = e.currentTarget.value;
						if (hasMultiSelect) {
							applyTicketTypeToSelected(val);
						} else if (selectedElementId) {
							updateSelectedProp('ticketTypeId', val);
						}
					}}
					class="w-full rounded-lg border bg-white p-2 text-sm"
				>
					<option value="">None</option>
					{#each ticketTypes as tt}
						<option value={tt._id || tt.id}>{tt.name}</option>
					{/each}
				</select>
			</div>

			<!-- Ticket Price (display only) -->
			{#if selectedTicketTypeId}
				{@const tt = ticketTypes.find((t) => (t._id || t.id) === selectedTicketTypeId)}
				{#if tt}
					<div>
						<h2 class="mb-1 text-sm font-semibold text-gray-700">Ticket price</h2>
						<input
							value="{tt.price ?? 0} {tt.currency ?? 'USD'}"
							readonly
							class="w-full rounded-lg border bg-[#F7F8F9] p-2 text-sm"
						/>
					</div>
				{/if}
			{/if}

			<!-- Ticket Color -->
			<div>
				<h2 class="mb-1 text-sm font-semibold text-gray-700">Ticket color</h2>
				<div class="flex items-center gap-2 rounded-lg border p-2">
					<input
						type="color"
						bind:value={selectedTicketColor}
						on:input={() => {
							if (hasMultiSelect) {
								applyColorToSelected(selectedTicketColor);
							} else if (selectedElementId) {
								updateSelectedProp('ticketColor', selectedTicketColor);
							}
						}}
						class="h-6 w-6 cursor-pointer border-none p-0 outline-none"
					/>
					<input
						bind:value={selectedTicketColor}
						on:input={() => {
							if (hasMultiSelect) {
								applyColorToSelected(selectedTicketColor);
							} else if (selectedElementId) {
								updateSelectedProp('ticketColor', selectedTicketColor);
							}
						}}
						class="flex-1 bg-transparent text-sm outline-none"
					/>
				</div>
			</div>

			<!-- Seat Number (for selected element) -->
			{#if selectedElement && (selectedElement.type === 'CHAIR' || selectedElement.type === 'BIG_CHAIR' || selectedElement.type === 'ROUND_TABLE' || selectedElement.type === 'SQUARE_TABLE')}
				<div>
					<h2 class="mb-1 text-sm font-semibold text-gray-700">Seat / Table label</h2>
					<input
						value={selectedElement.seatNumber ?? ''}
						on:change={(e) => updateSelectedProp('seatNumber', e.currentTarget.value)}
						placeholder="e.g. A-12"
						class="w-full rounded-lg border bg-[#F7F8F9] p-2 text-sm"
					/>
				</div>
				<div>
					<h2 class="mb-1 text-sm font-semibold text-gray-700">Row</h2>
					<input
						value={selectedElement.row ?? ''}
						on:change={(e) => updateSelectedProp('row', e.currentTarget.value)}
						placeholder="e.g. A"
						class="w-full rounded-lg border bg-[#F7F8F9] p-2 text-sm"
					/>
				</div>
				<div>
					<h2 class="mb-1 text-sm font-semibold text-gray-700">Section</h2>
					<input
						value={selectedElement.section ?? ''}
						on:change={(e) => updateSelectedProp('section', e.currentTarget.value)}
						placeholder="e.g. VIP"
						class="w-full rounded-lg border bg-[#F7F8F9] p-2 text-sm"
					/>
				</div>
			{/if}

			<!-- Element Label (for stage, etc.) -->
			{#if selectedElement && (selectedElement.type === 'STAGE' || selectedElement.type === 'DOOR' || selectedElement.type === 'RESTROOM')}
				<div>
					<h2 class="mb-1 text-sm font-semibold text-gray-700">Label</h2>
					<input
						value={selectedElement.label ?? ''}
						on:change={(e) => updateSelectedProp('label', e.currentTarget.value)}
						placeholder="Label"
						class="w-full rounded-lg border bg-[#F7F8F9] p-2 text-sm"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- MOBILE BOTTOM PANEL -->
	<div class="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-2 md:hidden">
		<div class="flex items-center gap-2 overflow-x-auto rounded-xl border bg-[#F7F7F8] p-2">
			<button
				on:click={() => (showMobileSidebar = true)}
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
			>
				<Icon icon="mdi:plus" class="h-5 w-5" />
			</button>
			<select
				bind:value={selectedTicketTypeId}
				on:change={(e) => {
					if (selectedElementId) updateSelectedProp('ticketTypeId', e.currentTarget.value);
				}}
				class="h-10 rounded-md border border-[#B0B0B0] bg-white px-2 py-1 text-xs"
			>
				<option value="">Ticket</option>
				{#each ticketTypes as tt}
					<option value={tt._id || tt.id}>{tt.name}</option>
				{/each}
			</select>
			{#if selectedElement}
				<input
					value={selectedElement.seatNumber ?? ''}
					on:change={(e) => updateSelectedProp('seatNumber', e.currentTarget.value)}
					placeholder="Seat no"
					class="h-10 w-[70px] rounded-md border border-[#B0B0B0] bg-white px-2 py-1 text-xs"
				/>
			{/if}
			<div class="flex h-10 items-center gap-1 rounded-md border border-[#B0B0B0] px-2 py-1">
				<input
					type="color"
					bind:value={selectedTicketColor}
					on:input={() => {
						if (selectedElementId) updateSelectedProp('ticketColor', selectedTicketColor);
					}}
					class="h-4 w-4 border-none p-0 outline-none"
				/>
				<span class="text-xs text-gray-600">{selectedTicketColor}</span>
			</div>
		</div>
	</div>

	<!-- MOBILE ADD ELEMENT SHEET -->
	{#if showMobileSidebar}
		<div class="fixed inset-0 z-50 flex items-end bg-black/30 md:hidden">
			<div class="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-sm font-semibold">Add element</h2>
					<button on:click={() => (showMobileSidebar = false)}>
						<Icon icon="mdi:close" class="h-5 w-5 text-gray-500" />
					</button>
				</div>
				<div class="mb-4 flex items-center rounded-lg border px-3 py-2">
					<Icon icon="mdi:magnify" class="mr-2 text-gray-400" />
					<input bind:value={searchQuery} type="text" placeholder="Search element" class="w-full text-sm outline-none" />
				</div>
				<div class="mb-2 flex gap-2">
					<button
						on:click={() => (activeTab = 'layout')}
						class="flex-1 rounded-lg py-2 text-xs font-medium {activeTab === 'layout' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}"
					>Layout</button>
					<button
						on:click={() => (activeTab = 'shapes')}
						class="flex-1 rounded-lg py-2 text-xs font-medium {activeTab === 'shapes' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}"
					>Shapes</button>
				</div>
				{#if activeTab === 'layout'}
					<div class="grid grid-cols-3 gap-4">
						{#each filteredLayoutElements as el}
							<div
								draggable="true"
								role="listitem"
								on:dragstart={(e) => { handleDragStart(e, el.type, el.w, el.h); showMobileSidebar = false; }}
								class="flex cursor-grab flex-col items-center text-xs"
							>
								<div class="mb-1 flex h-14 w-14 items-center justify-center rounded-xl border">
									<Icon icon={el.icon} class="h-7 w-7 text-gray-400" />
								</div>
								{el.label}
							</div>
						{/each}
					</div>
				{:else}
					<div class="grid grid-cols-3 gap-4">
						{#each filteredShapeElements as sh}
							<div
								draggable="true"
								role="listitem"
								on:dragstart={(e) => { handleDragStart(e, sh.type, sh.w, sh.h); showMobileSidebar = false; }}
								class="flex cursor-grab flex-col items-center text-xs"
							>
								{#if sh.type === 'CIRCLE'}
									<div class="mb-1 h-8 w-8 rounded-full border-2 border-gray-300"></div>
								{:else if sh.type === 'SQUARE'}
									<div class="mb-1 h-8 w-8 rounded border-2 border-gray-300"></div>
								{:else}
									<div class="mb-1 h-0 w-0 border-b-[25px] border-l-[15px] border-r-[15px] border-b-gray-500 border-l-transparent border-r-transparent"></div>
								{/if}
								{sh.label}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
