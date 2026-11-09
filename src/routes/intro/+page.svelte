<script lang="ts">
	import { onMount } from 'svelte';

	// Master image definition — strictly using only the original file
	const IMAGE_PATH = '/marketing/rondwell%20poster.jpeg';
	const DOWNLOAD_FILENAME = 'rondwell poster.jpeg';

	// Natural image dimensions of the master poster (4800 x 7200, 2:3 aspect ratio)
	const NATURAL_WIDTH = 4800;
	const NATURAL_HEIGHT = 7200;

	// Viewport & layout
	let viewportEl: HTMLDivElement | null = null;
	let containerWidth = 0;
	let containerHeight = 0;
	let isMobile = false;

	// Zoom & Pan state
	let zoom = 1.0; // 1.0 = fit to viewport
	let panX = 0;
	let panY = 0;
	let isDragging = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let panStartX = 0;
	let panStartY = 0;
	let isAnimating = false;
	let animationTimeout: any = null;

	// Touch gestures
	let isPinching = false;
	let initialPinchDist = 0;
	let initialPinchZoom = 1.0;
	let initialPinchPanX = 0;
	let initialPinchPanY = 0;
	let pinchMidX = 0;
	let pinchMidY = 0;

	// UI & View states
	let imageLoaded = false;
	let isFullscreen = false;
	let showMinimap = true;
	let showHelp = false;
	let showSections = false;
	let toastText: string | null = null;
	let toastTimeout: any = null;
	let activeSectionId = 'overview';

	// Zoom boundaries
	const MIN_ZOOM = 0.6;
	const MAX_ZOOM = 6.0;

	// Mini-map dimensions
	const MINI_WIDTH = 100;
	const MINI_HEIGHT = 150;

	// Section highlights for quick-jumping to parts of the poster
	const SECTIONS = [
		{
			id: 'overview',
			label: 'Full Overview',
			desc: 'Fit full poster on screen',
			zoom: 1.0,
			normY: 0.5
		},
		{
			id: 'vision',
			label: 'Vision & Ecosystem',
			desc: 'Every event. Every person. One connected platform.',
			zoom: 1.75,
			normY: 0.16
		},
		{
			id: 'orbit',
			label: 'Interactive Network Orbit',
			desc: 'Organizers, Attendees, Speakers, Promoters & Live Cards',
			zoom: 2.15,
			normY: 0.36
		},
		{
			id: 'modules',
			label: '9 Core Platform Modules',
			desc: 'Event creation, ticketing, smart check-in, community, payments...',
			zoom: 1.85,
			normY: 0.67
		},
		{
			id: 'cta',
			label: 'Scan & Launch',
			desc: 'QR code & onboarding features',
			zoom: 2.25,
			normY: 0.94
		}
	];

	// Fit calculations
	$: paddingX = isMobile ? 12 : 36;
	$: paddingY = isMobile ? 16 : 48;
	$: availWidth = Math.max(100, containerWidth - paddingX * 2);
	$: availHeight = Math.max(100, containerHeight - paddingY * 2);
	$: fitScale = Math.min(availWidth / NATURAL_WIDTH, availHeight / NATURAL_HEIGHT) || 0.15;
	$: baseWidth = NATURAL_WIDTH * fitScale;
	$: baseHeight = NATURAL_HEIGHT * fitScale;

	// Scaled dimensions & UI stats
	$: currentWidth = baseWidth * zoom;
	$: currentHeight = baseHeight * zoom;
	$: zoomPercentage = Math.round(zoom * 100);

	// Mini-map viewport indicator math
	$: vpWidth = Math.max(12, Math.min(MINI_WIDTH, (containerWidth / (currentWidth || 1)) * MINI_WIDTH));
	$: vpHeight = Math.max(14, Math.min(MINI_HEIGHT, (containerHeight / (currentHeight || 1)) * MINI_HEIGHT));
	$: normCenterX = 0.5 - (panX / (currentWidth || 1));
	$: normCenterY = 0.5 - (panY / (currentHeight || 1));
	$: vpLeft = Math.max(0, Math.min(MINI_WIDTH - vpWidth, normCenterX * MINI_WIDTH - vpWidth / 2));
	$: vpTop = Math.max(0, Math.min(MINI_HEIGHT - vpHeight, normCenterY * MINI_HEIGHT - vpHeight / 2));

	function showToast(msg: string) {
		toastText = msg;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toastText = null;
		}, 2400);
	}

	function clampPan(targetX: number, targetY: number, targetZoom: number) {
		const w = baseWidth * targetZoom;
		const h = baseHeight * targetZoom;
		const overflowX = Math.max(0, (w - containerWidth) / 2);
		const overflowY = Math.max(0, (h - containerHeight) / 2);
		const slack = 80;
		const limitX = overflowX + slack;
		const limitY = overflowY + slack;
		return {
			x: Math.max(-limitX, Math.min(limitX, targetX)),
			y: Math.max(-limitY, Math.min(limitY, targetY))
		};
	}

	function setAnimated(duration = 450) {
		isAnimating = true;
		if (animationTimeout) clearTimeout(animationTimeout);
		animationTimeout = setTimeout(() => {
			isAnimating = false;
		}, duration);
	}

	function setZoomAndPan(newZoom: number, newPanX: number, newPanY: number, animate = true) {
		const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
		const clamped = clampPan(newPanX, newPanY, clampedZoom);
		if (animate) setAnimated();
		zoom = clampedZoom;
		panX = clamped.x;
		panY = clamped.y;
	}

	function resetView() {
		setAnimated();
		zoom = 1.0;
		panX = 0;
		panY = 0;
		activeSectionId = 'overview';
		showToast('Reset to fit screen');
	}

	function zoomIn() {
		const targetZoom = Math.min(MAX_ZOOM, zoom * 1.35);
		zoomTowards(containerWidth / 2, containerHeight / 2, targetZoom);
	}

	function zoomOut() {
		const targetZoom = Math.max(MIN_ZOOM, zoom / 1.35);
		zoomTowards(containerWidth / 2, containerHeight / 2, targetZoom);
	}

	function setActualSize() {
		const targetZoom = 1 / fitScale;
		setAnimated();
		zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom));
		panX = 0;
		panY = 0;
		activeSectionId = 'custom';
		showToast(`100% Native Resolution (${zoomPercentage}%)`);
	}

	function fitWidth() {
		const targetZoom = (containerWidth - paddingX * 2) / (baseWidth || 1);
		setAnimated();
		zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom));
		panX = 0;
		panY = 0;
		activeSectionId = 'custom';
	}

	function zoomTowards(clientX: number, clientY: number, targetZoom: number, animate = true) {
		const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
		const cx = containerWidth / 2;
		const cy = containerHeight / 2;
		const ox = clientX - cx;
		const oy = clientY - cy;

		const relX = ox - panX;
		const relY = oy - panY;

		const newPanX = ox - relX * (clampedZoom / zoom);
		const newPanY = oy - relY * (clampedZoom / zoom);

		setZoomAndPan(clampedZoom, newPanX, newPanY, animate);
	}

	function jumpToSection(section: (typeof SECTIONS)[0]) {
		activeSectionId = section.id;
		showSections = false;
		setAnimated(550);
		zoom = section.zoom;
		panX = 0;
		panY = -(section.normY - 0.5) * baseHeight * section.zoom;
		const clamped = clampPan(panX, panY, zoom);
		panX = clamped.x;
		panY = clamped.y;
		showToast(section.label);
	}

	// Mouse Wheel zoom towards cursor
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const zoomFactor = e.deltaY < 0 ? 1.18 : 0.85;
		const targetZoom = zoom * zoomFactor;
		zoomTowards(e.clientX, e.clientY, targetZoom, false);
	}

	// Mouse dragging
	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		panStartX = panX;
		panStartY = panY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;
		const clamped = clampPan(panStartX + dx, panStartY + dy, zoom);
		panX = clamped.x;
		panY = clamped.y;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Double click to toggle zoom
	function handleDoubleClick(e: MouseEvent) {
		if (zoom > 1.25) {
			resetView();
		} else {
			zoomTowards(e.clientX, e.clientY, 2.5, true);
			showToast('Zoomed in (Double-click to reset)');
		}
	}

	// Touch gestures
	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			isDragging = true;
			isPinching = false;
			dragStartX = e.touches[0].clientX;
			dragStartY = e.touches[0].clientY;
			panStartX = panX;
			panStartY = panY;
		} else if (e.touches.length === 2) {
			isDragging = false;
			isPinching = true;
			const t1 = e.touches[0];
			const t2 = e.touches[1];
			initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
			initialPinchZoom = zoom;
			initialPinchPanX = panX;
			initialPinchPanY = panY;
			pinchMidX = (t1.clientX + t2.clientX) / 2;
			pinchMidY = (t1.clientY + t2.clientY) / 2;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		e.preventDefault();
		if (isPinching && e.touches.length === 2) {
			const t1 = e.touches[0];
			const t2 = e.touches[1];
			const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
			const factor = dist / (initialPinchDist || 1);
			const targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialPinchZoom * factor));

			const cx = containerWidth / 2;
			const cy = containerHeight / 2;
			const ox = pinchMidX - cx;
			const oy = pinchMidY - cy;

			const relX = ox - initialPinchPanX;
			const relY = oy - initialPinchPanY;

			const newPanX = ox - relX * (targetZoom / initialPinchZoom);
			const newPanY = oy - relY * (targetZoom / initialPinchZoom);

			const clamped = clampPan(newPanX, newPanY, targetZoom);
			zoom = targetZoom;
			panX = clamped.x;
			panY = clamped.y;
		} else if (isDragging && e.touches.length === 1) {
			const dx = e.touches[0].clientX - dragStartX;
			const dy = e.touches[0].clientY - dragStartY;
			const clamped = clampPan(panStartX + dx, panStartY + dy, zoom);
			panX = clamped.x;
			panY = clamped.y;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			isDragging = false;
			isPinching = false;
		} else if (e.touches.length === 1) {
			isPinching = false;
			isDragging = true;
			dragStartX = e.touches[0].clientX;
			dragStartY = e.touches[0].clientY;
			panStartX = panX;
			panStartY = panY;
		}
	}

	// Mini-map radar click
	function handleMinimapClick(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		const targetNormX = clickX / MINI_WIDTH;
		const targetNormY = clickY / MINI_HEIGHT;

		setAnimated();
		const targetPanX = (0.5 - targetNormX) * currentWidth;
		const targetPanY = (0.5 - targetNormY) * currentHeight;
		const clamped = clampPan(targetPanX, targetPanY, zoom);
		panX = clamped.x;
		panY = clamped.y;
	}

	// Fullscreen toggle
	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(() => {});
			isFullscreen = true;
			showToast('Fullscreen mode (Esc to exit)');
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen().catch(() => {});
			}
			isFullscreen = false;
			showToast('Exited fullscreen');
		}
	}

	// Share / Copy link
	async function copyPageLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			showToast('Link copied to clipboard!');
		} catch {
			showToast('URL: ' + window.location.href);
		}
	}

	// Keyboard controls
	function handleKeyDown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

		switch (e.key) {
			case '+':
			case '=':
				e.preventDefault();
				zoomIn();
				break;
			case '-':
			case '_':
				e.preventDefault();
				zoomOut();
				break;
			case '0':
			case 'r':
			case 'R':
				e.preventDefault();
				resetView();
				break;
			case '1':
				e.preventDefault();
				setActualSize();
				break;
			case 'f':
			case 'F':
				e.preventDefault();
				toggleFullscreen();
				break;
			case 'm':
			case 'M':
				e.preventDefault();
				showMinimap = !showMinimap;
				break;
			case 'h':
			case 'H':
			case '?':
				e.preventDefault();
				showHelp = !showHelp;
				break;
			case 'Escape':
				if (showHelp) showHelp = false;
				else if (showSections) showSections = false;
				else resetView();
				break;
			case 'ArrowUp':
				e.preventDefault();
				panY = clampPan(panX, panY + 120, zoom).y;
				break;
			case 'ArrowDown':
				e.preventDefault();
				panY = clampPan(panX, panY - 120, zoom).y;
				break;
			case 'ArrowLeft':
				e.preventDefault();
				panX = clampPan(panX + 120, panY, zoom).x;
				break;
			case 'ArrowRight':
				e.preventDefault();
				panX = clampPan(panX - 120, panY, zoom).x;
				break;
		}
	}

	function updateDimensions() {
		if (!viewportEl) return;
		containerWidth = viewportEl.clientWidth;
		containerHeight = viewportEl.clientHeight;
		isMobile = containerWidth < 768;
	}

	onMount(() => {
		updateDimensions();
		window.addEventListener('resize', updateDimensions);
		window.addEventListener('keydown', handleKeyDown);

		const handleFsChange = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', handleFsChange);

		return () => {
			window.removeEventListener('resize', updateDimensions);
			window.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('fullscreenchange', handleFsChange);
			if (animationTimeout) clearTimeout(animationTimeout);
			if (toastTimeout) clearTimeout(toastTimeout);
		};
	});
</script>

<svelte:head>
	<title>Rondwell — All-In-One Event Infrastructure</title>
	<meta name="description" content="Every event. Every person. One connected platform. Explore Rondwell's complete architecture and capabilities." />
	<meta name="theme-color" content="#070614" />

	<!-- OpenGraph -->
	<meta property="og:title" content="Rondwell — All-In-One Event Infrastructure" />
	<meta property="og:description" content="Every event. Every person. One connected platform. Across physical, virtual and hybrid events." />
	<meta property="og:image" content="https://rondwell.com/marketing/rondwell%20poster.jpeg" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://rondwell.com/intro" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Rondwell — All-In-One Event Infrastructure" />
	<meta name="twitter:description" content="Every event. Every person. One connected platform. Across physical, virtual and hybrid events." />
	<meta name="twitter:image" content="https://rondwell.com/marketing/rondwell%20poster.jpeg" />
</svelte:head>

<!-- Fullscreen Viewer Container -->
<div
	bind:this={viewportEl}
	class="relative w-screen h-screen overflow-hidden select-none bg-[#070614] text-white font-sans touch-none"
	role="region"
	aria-label="Rondwell Intro Poster Viewer"
	on:wheel={handleWheel}
	on:mousedown={handleMouseDown}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:mouseleave={handleMouseUp}
	on:touchstart={handleTouchStart}
	on:touchmove={handleTouchMove}
	on:touchend={handleTouchEnd}
	on:touchcancel={handleTouchEnd}
	on:dblclick={handleDoubleClick}
	style="cursor: {isDragging ? 'grabbing' : 'grab'};"
>
	<!-- Ambient Cosmic Glow -->
	<div
		class="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-1000"
		style="background: radial-gradient(circle at 50% 45%, rgba(138, 43, 226, 0.28) 0%, rgba(236, 72, 153, 0.15) 35%, rgba(7, 6, 20, 0.95) 75%);"
	></div>

	<!-- Loading Spinner (before image loads) -->
	{#if !imageLoaded}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
			<div class="flex flex-col items-center gap-3">
				<div class="w-10 h-10 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin"></div>
				<span class="text-xs tracking-wider uppercase text-white/50">Loading poster...</span>
			</div>
		</div>
	{/if}

	<!-- Poster Canvas -->
	{#if containerWidth > 0 && containerHeight > 0}
		<div
			class="absolute top-1/2 left-1/2 will-change-transform origin-center"
			style="
				width: {baseWidth}px;
				height: {baseHeight}px;
				transform: translate(calc(-50% + {panX}px), calc(-50% + {panY}px)) scale({zoom});
				transition: {isAnimating ? 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none'};
			"
		>
			<div
				class="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/10 bg-[#09071b]"
			>
				<!-- The Master Image -->
				<img
					src={IMAGE_PATH}
					alt="Rondwell — All-In-One Event Infrastructure"
					class="w-full h-full object-contain pointer-events-none transition-opacity duration-500 {imageLoaded ? 'opacity-100' : 'opacity-0'}"
					draggable="false"
					on:load={() => (imageLoaded = true)}
				/>

				<div class="pointer-events-none absolute inset-0 rounded-2xl md:rounded-3xl border border-white/10"></div>
			</div>
		</div>
	{/if}

	<!-- Top Bar Navigation -->
	<header class="pointer-events-none absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex items-center justify-between z-30">
		<!-- Left: Rondwell Brand Back Link -->
		<a
			href="/"
			class="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-white shadow-xl transition-all hover:scale-105 active:scale-95 group"
			title="Back to Rondwell Home"
		>
			<div class="flex items-center gap-1.5">
				<span class="font-semibold text-sm tracking-tight text-white group-hover:text-pink-400 transition-colors">Rondwell</span>
				<span class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-medium">Intro</span>
			</div>
			<svg class="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
			</svg>
		</a>

		<!-- Right: Quick Utilities Pill -->
		<div class="pointer-events-auto flex items-center gap-2">
			<!-- Section Highlights Toggle -->
			<div class="relative">
				<button
					type="button"
					on:click={() => (showSections = !showSections)}
					class="inline-flex items-center gap-1.5 px-3.5 py-2 md:px-4 md:py-2.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-sm font-medium text-white shadow-xl transition-all hover:border-pink-500/50"
					aria-expanded={showSections}
					aria-label="Sections Tour"
				>
					<svg class="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
					</svg>
					<span class="hidden sm:inline">Sections</span>
					<svg class="w-3.5 h-3.5 text-white/60 transition-transform {showSections ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				<!-- Sections Dropdown -->
				{#if showSections}
					<div
						class="absolute right-0 mt-2 w-72 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/15 p-2 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-150"
					>
						<div class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50 border-b border-white/10">
							Jump to Section
						</div>
						<div class="mt-1 space-y-1">
							{#each SECTIONS as sec}
								<button
									type="button"
									on:click={() => jumpToSection(sec)}
									class="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-start gap-2.5 {activeSectionId === sec.id ? 'bg-pink-600/25 text-pink-300 border border-pink-500/30' : 'text-white/80 hover:bg-white/10 hover:text-white'}"
								>
									<span class="mt-0.5 w-2 h-2 rounded-full {activeSectionId === sec.id ? 'bg-pink-400 animate-pulse' : 'bg-white/30'}"></span>
									<div>
										<div class="font-medium text-white">{sec.label}</div>
										<div class="text-xs text-white/50 line-clamp-1">{sec.desc}</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Download Poster -->
			<a
				href={IMAGE_PATH}
				download={DOWNLOAD_FILENAME}
				class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 md:px-4 md:py-2.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-sm font-medium text-white shadow-xl transition-all hover:border-pink-500/50"
				title="Download Full Master Poster"
			>
				<svg class="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
				</svg>
				<span>Download</span>
			</a>

			<!-- Share / Copy Link -->
			<button
				type="button"
				on:click={copyPageLink}
				class="p-2 md:p-2.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white shadow-xl transition-all"
				title="Copy page link"
				aria-label="Copy page link"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
				</svg>
			</button>

			<!-- Fullscreen Toggle -->
			<button
				type="button"
				on:click={toggleFullscreen}
				class="p-2 md:p-2.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white shadow-xl transition-all"
				title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}
				aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
			>
				{#if isFullscreen}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 11l5 5m0 0l-5 0m5 0l0-5M9 15l-5 5m0 0l5 0m-5 0l0-5m11-11l5-5m0 0l-5 0m5 0l0 5" />
					</svg>
				{:else}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
					</svg>
				{/if}
			</button>
		</div>
	</header>

	<!-- Mini-Map Radar (Bottom Left) using the same master image -->
	{#if showMinimap && !isMobile}
		<div
			class="pointer-events-auto absolute bottom-24 left-6 z-30 flex flex-col items-start gap-1.5 transition-all duration-300"
		>
			<div class="flex items-center justify-between w-[100px] px-1 text-[10px] font-semibold tracking-wider uppercase text-white/50">
				<span>Radar</span>
				<button
					type="button"
					on:click={() => (showMinimap = false)}
					class="hover:text-white transition-colors"
					title="Minimize Radar (M)"
				>
					✕
				</button>
			</div>

			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="relative w-[100px] h-[150px] rounded-xl overflow-hidden bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl cursor-crosshair group"
				on:click={handleMinimapClick}
				title="Click anywhere to pan"
				role="button"
				tabindex="0"
			>
				<img
					src={IMAGE_PATH}
					alt="Radar preview"
					class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none"
					draggable="false"
				/>

				<!-- Viewport Indicator Frame -->
				<div
					class="absolute border-2 border-pink-500 bg-pink-500/20 rounded shadow-[0_0_12px_rgba(236,72,153,0.6)] pointer-events-none transition-all duration-75"
					style="
						width: {vpWidth}px;
						height: {vpHeight}px;
						left: {vpLeft}px;
						top: {vpTop}px;
					"
				></div>
			</div>
		</div>
	{:else if !isMobile}
		<button
			type="button"
			on:click={() => (showMinimap = true)}
			class="pointer-events-auto absolute bottom-24 left-6 z-30 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-xs text-white/70 hover:text-white transition-all shadow-xl flex items-center gap-1.5"
			title="Show Radar Minimap (M)"
		>
			<svg class="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
			</svg>
			<span>Radar</span>
		</button>
	{/if}

	<!-- Floating Glassmorphic Control Dock (Bottom Center) -->
	<nav
		class="pointer-events-auto absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-all max-w-[94vw]"
		aria-label="Zoom controls"
	>
		<!-- Zoom Out -->
		<button
			type="button"
			on:click={zoomOut}
			class="p-2 md:p-2.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-95"
			disabled={zoom <= MIN_ZOOM}
			title="Zoom Out (-)"
			aria-label="Zoom Out"
		>
			<svg class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
			</svg>
		</button>

		<!-- Zoom Slider & Percent -->
		<div class="flex items-center gap-2 px-1">
			<input
				type="range"
				min={MIN_ZOOM}
				max={MAX_ZOOM}
				step="0.05"
				value={zoom}
				on:input={(e) => {
					const val = parseFloat((e.currentTarget as HTMLInputElement).value);
					zoomTowards(containerWidth / 2, containerHeight / 2, val, false);
				}}
				class="w-16 sm:w-24 md:w-32 accent-pink-500 cursor-pointer h-1.5 rounded-lg bg-white/20"
				aria-label="Zoom slider"
			/>
			<button
				type="button"
				on:click={resetView}
				class="text-xs md:text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md hover:bg-white/10 text-white/90 hover:text-white transition-colors"
				title="Click to reset view"
			>
				{zoomPercentage}%
			</button>
		</div>

		<!-- Zoom In -->
		<button
			type="button"
			on:click={zoomIn}
			class="p-2 md:p-2.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-95"
			disabled={zoom >= MAX_ZOOM}
			title="Zoom In (+)"
			aria-label="Zoom In"
		>
			<svg class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</button>

		<div class="w-px h-5 bg-white/20 mx-0.5"></div>

		<!-- Reset / Fit -->
		<button
			type="button"
			on:click={resetView}
			class="p-2 md:p-2.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors active:scale-95"
			title="Fit to Screen (R or 0)"
			aria-label="Fit to Screen"
		>
			<svg class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
			</svg>
		</button>

		<!-- 1:1 Actual Resolution -->
		<button
			type="button"
			on:click={setActualSize}
			class="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
			title="View 100% Actual Resolution (1)"
		>
			1:1
		</button>

		<!-- Fit Width -->
		<button
			type="button"
			on:click={fitWidth}
			class="hidden md:inline-flex items-center px-2 py-1 text-xs font-medium rounded-full hover:bg-white/15 text-white/70 hover:text-white transition-colors"
			title="Fit Poster Width"
		>
			Fit Width
		</button>

		<!-- Help / Shortcuts -->
		<button
			type="button"
			on:click={() => (showHelp = !showHelp)}
			class="p-2 md:p-2.5 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition-colors"
			title="Shortcuts & Gestures (?)"
			aria-label="Help"
		>
			<svg class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</button>
	</nav>

	<!-- Shortcuts Modal -->
	{#if showHelp}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
			on:click|self={() => (showHelp = false)}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div
				class="relative w-full max-w-md rounded-3xl bg-[#0c091d] border border-white/15 p-6 shadow-2xl text-white"
			>
				<div class="flex items-center justify-between pb-4 border-b border-white/10">
					<div class="flex items-center gap-2">
						<span class="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
						<h3 class="text-base font-semibold">Viewer Shortcuts & Gestures</h3>
					</div>
					<button
						type="button"
						on:click={() => (showHelp = false)}
						class="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
						aria-label="Close dialog"
					>
						✕
					</button>
				</div>

				<div class="mt-4 space-y-3 text-sm">
					<div class="flex items-center justify-between py-1.5 border-b border-white/5">
						<span class="text-white/70">Scroll Wheel / Pinch</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-pink-300">Zoom in/out to pointer</span>
					</div>
					<div class="flex items-center justify-between py-1.5 border-b border-white/5">
						<span class="text-white/70">Click & Drag</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-pink-300">Pan around poster</span>
					</div>
					<div class="flex items-center justify-between py-1.5 border-b border-white/5">
						<span class="text-white/70">Double Click / Double Tap</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-pink-300">Quick zoom / Reset</span>
					</div>
					<div class="flex items-center justify-between py-1.5 border-b border-white/5">
						<span class="text-white/70">Zoom In / Zoom Out</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-white/90">+ / -</span>
					</div>
					<div class="flex items-center justify-between py-1.5 border-b border-white/5">
						<span class="text-white/70">Reset View to Fit</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-white/90">0 or R</span>
					</div>
					<div class="flex items-center justify-between py-1.5 border-b border-white/5">
						<span class="text-white/70">Actual 100% Size</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-white/90">1</span>
					</div>
					<div class="flex items-center justify-between py-1.5 border-b border-white/5">
						<span class="text-white/70">Toggle Fullscreen</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-white/90">F</span>
					</div>
					<div class="flex items-center justify-between py-1.5 border-b border-white/5">
						<span class="text-white/70">Toggle Radar Minimap</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-white/90">M</span>
					</div>
					<div class="flex items-center justify-between py-1.5">
						<span class="text-white/70">Arrow Keys</span>
						<span class="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-white/90">Pan direction</span>
					</div>
				</div>

				<div class="mt-6 pt-4 border-t border-white/10 flex justify-end">
					<button
						type="button"
						on:click={() => (showHelp = false)}
						class="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-sm font-medium text-white transition-colors"
					>
						Got it
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Floating Toast -->
	{#if toastText}
		<div
			class="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-xs md:text-sm font-medium text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
		>
			{toastText}
		</div>
	{/if}
</div>

<style>
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		background: rgba(255, 255, 255, 0.15);
		outline: none;
		border-radius: 9999px;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #ec4899;
		cursor: pointer;
		box-shadow: 0 0 10px rgba(236, 72, 153, 0.7);
		transition: transform 0.1s ease;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.25);
	}

	input[type='range']::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #ec4899;
		cursor: pointer;
		border: none;
		box-shadow: 0 0 10px rgba(236, 72, 153, 0.7);
	}
</style>
