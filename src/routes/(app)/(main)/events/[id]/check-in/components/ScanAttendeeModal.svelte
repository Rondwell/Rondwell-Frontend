<script lang="ts">
	import { checkinByPasscode, checkinByQrCode, verifyCheckinPasscode, verifyCheckinQr } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onDestroy, tick } from 'svelte';

	export let open = false;
	export let eventId = '';

	const dispatch = createEventDispatcher();

	let phase: 'scan' | 'preview' | 'success' | 'error' = 'scan';
	let passcode = '';
	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let stream: MediaStream | null = null;
	let verifying = false;
	let checkingIn = false;
	let errorMessage = '';
	let scanInterval: ReturnType<typeof setInterval> | null = null;

	// Verified attendee data (from verify endpoint)
	let verifiedData: any = null;
	// The passcode/token used for verification (needed to do actual check-in)
	let verifiedPasscode = '';
	let verifiedQrToken = '';

	$: if (open && phase === 'scan') { initScan(); }
	$: if (!open) { cleanup(); resetState(); }

	async function initScan() {
		await tick();
		startCamera();
	}

	async function startCamera() {
		try {
			const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: isMobile ? 'environment' : 'user', width: { ideal: 640 }, height: { ideal: 480 } }
			});
			if (videoElement) {
				videoElement.srcObject = stream;
				videoElement.onloadedmetadata = () => { startQrScanning(); };
			}
		} catch (err) { console.error('Camera error:', err); }
	}

	function startQrScanning() {
		if (scanInterval) clearInterval(scanInterval);
		scanInterval = setInterval(() => { scanFrame(); }, 300);
	}

	async function scanFrame() {
		if (!videoElement || !canvasElement || videoElement.readyState < 2 || phase !== 'scan') return;
		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;
		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;
		ctx.drawImage(videoElement, 0, 0);

		// Try BarcodeDetector API (Chrome, Edge, Android)
		if ('BarcodeDetector' in window) {
			try {
				const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
				const barcodes = await detector.detect(canvasElement);
				if (barcodes.length > 0) {
					const raw = barcodes[0].rawValue;
					if (raw) { await handleQrDetected(raw); return; }
				}
			} catch { /* fallthrough */ }
		}
	}

	async function handleQrDetected(rawValue: string) {
		if (verifying || phase !== 'scan') return;
		stopScanning();
		verifying = true;
		errorMessage = '';
		try {
			// The QR code contains JSON: {"registration_id":"...","eventId":"...","attendeeId":"...","ticketTypeId":"..."}
			let token = rawValue;
			try {
				const parsed = JSON.parse(rawValue);
				// Encode as base64 for the backend decodeCheckinToken
				token = btoa(JSON.stringify({ attendeeId: parsed.attendeeId, eventId: parsed.eventId }));
			} catch { /* use raw value as token */ }

			const result = await verifyCheckinQr(eventId, token);
			verifiedData = result;
			verifiedQrToken = token;
			verifiedPasscode = '';
			phase = 'preview';
			stopCamera();
		} catch (e: any) {
			errorMessage = e.message || 'QR verification failed';
			phase = 'error';
		} finally {
			verifying = false;
		}
	}

	function stopScanning() {
		if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
	}

	function stopCamera() {
		stopScanning();
		if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
	}

	function cleanup() { stopCamera(); }

	function resetState() {
		phase = 'scan';
		passcode = '';
		verifiedData = null;
		verifiedPasscode = '';
		verifiedQrToken = '';
		errorMessage = '';
		verifying = false;
		checkingIn = false;
	}

	async function handleVerifyPasscode() {
		if (!passcode.trim() || verifying) return;
		verifying = true;
		errorMessage = '';
		try {
			const result = await verifyCheckinPasscode(eventId, passcode.trim());
			verifiedData = result;
			verifiedPasscode = passcode.trim();
			verifiedQrToken = '';
			phase = 'preview';
			stopCamera();
		} catch (e: any) {
			errorMessage = e.message || 'Verification failed';
			phase = 'error';
		} finally {
			verifying = false;
		}
	}

	async function handleConfirmCheckin() {
		if (checkingIn) return;
		checkingIn = true;
		errorMessage = '';
		try {
			if (verifiedPasscode) {
				await checkinByPasscode(eventId, verifiedPasscode);
			} else if (verifiedQrToken) {
				await checkinByQrCode(eventId, verifiedQrToken);
			}
			phase = 'success';
			dispatch('checkedIn');
		} catch (e: any) {
			errorMessage = e.message || 'Check-in failed';
			phase = 'error';
		} finally {
			checkingIn = false;
		}
	}

	function handleClose() {
		open = false;
		cleanup();
		resetState();
	}

	function handleRetry() {
		resetState();
		initScan();
	}

	$: attendeeName = verifiedData
		? `${verifiedData.attendee_details?.firstName || ''} ${verifiedData.attendee_details?.lastName || ''}`.trim() || 'Attendee'
		: '';
	$: attendeeEmail = verifiedData?.attendee_details?.email || '';
	$: attendeeStatus = verifiedData?.attendee_status || '';
	$: ticketTypeName = verifiedData?.ticketTypeName || '';
	$: ticketPrice = verifiedData?.ticketPrice ?? 0;
	$: ticketCurrency = verifiedData?.ticketCurrency ?? 'NGN';
	$: isFree = verifiedData?.isFree ?? true;
	$: formattedPrice = isFree || ticketPrice === 0
		? 'Free'
		: new Intl.NumberFormat('en-NG', { style: 'currency', currency: ticketCurrency, minimumFractionDigits: 0 }).format(ticketPrice);
	$: registeredAt = verifiedData?.registered_at
		? new Date(verifiedData.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
		  new Date(verifiedData.registered_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
		: '';
	$: checkedInAt = verifiedData?.checked_in_at
		? new Date(verifiedData.checked_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
		  new Date(verifiedData.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
		: '–';
	$: isAlreadyCheckedIn = attendeeStatus === 'CHECKED_IN';

	onDestroy(() => { cleanup(); });
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div class="animate-fadeIn max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#FDFCFB] px-4 py-6 shadow-xl md:p-6">
			<!-- Header -->
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
							<path d="M19.2529 25.4017L21.2796 27.4283L25.3329 23.375" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16.2135 14.4907C16.0801 14.4774 15.9201 14.4774 15.7735 14.4907C12.6001 14.3841 10.0801 11.7841 10.0801 8.58406C10.0668 5.3174 12.7201 2.66406 15.9868 2.66406C19.2535 2.66406 21.9068 5.3174 21.9068 8.58406C21.9068 11.7841 19.3735 14.3841 16.2135 14.4907Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M15.9867 29.077C13.5601 29.077 11.1467 28.4636 9.30672 27.237C6.08005 25.077 6.08005 21.557 9.30672 19.4103C12.9734 16.957 18.9867 16.957 22.6534 19.4103" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
				</div>
				<h2 class="text-xl font-semibold text-gray-800">Check-in Attendee</h2>
				{#if phase === 'scan'}
					<p class="text-sm text-gray-500">Scan QR code or enter passcode to check in attendee.</p>
				{/if}
				<button class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
					on:click={handleClose}>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<div class="mt-6 overflow-hidden border-t pt-6">
				{#if phase === 'scan'}
					<div class="custom-scrollbar max-h-80 overflow-y-auto rounded-lg border p-4 md:max-h-96">
						<!-- Camera View with QR Scanner Overlay -->
						<div class="relative mb-4 flex items-center justify-center overflow-hidden rounded-lg bg-gray-900">
							<video bind:this={videoElement} autoplay playsinline muted class="h-60 w-full rounded-lg object-cover">
								<track kind="captions" />
							</video>
							<canvas bind:this={canvasElement} class="hidden"></canvas>
							<!-- QR Scanner Overlay -->
							<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
								<div class="relative h-44 w-44">
									<!-- Corner brackets -->
									<div class="absolute top-0 left-0 h-8 w-8 border-t-3 border-l-3 border-white rounded-tl-md"></div>
									<div class="absolute top-0 right-0 h-8 w-8 border-t-3 border-r-3 border-white rounded-tr-md"></div>
									<div class="absolute bottom-0 left-0 h-8 w-8 border-b-3 border-l-3 border-white rounded-bl-md"></div>
									<div class="absolute bottom-0 right-0 h-8 w-8 border-b-3 border-r-3 border-white rounded-br-md"></div>
									<!-- Scanning line animation -->
									<div class="scan-line absolute left-2 right-2 h-0.5 bg-[#DB3EC6] opacity-80"></div>
								</div>
							</div>
							<!-- Dim overlay outside scanner area -->
							<div class="pointer-events-none absolute inset-0 bg-black/40" style="mask-image: radial-gradient(circle 88px at center, transparent 85px, black 86px); -webkit-mask-image: radial-gradient(circle 88px at center, transparent 85px, black 86px);"></div>
						</div>
						<p class="mb-3 text-center text-xs text-gray-400">Point camera at attendee's QR code</p>
						<!-- Passcode Input -->
						<div class="mt-4">
							<label for="passcode-input" class="mb-2 block text-sm font-medium text-gray-700">Enter Attendee Passcode</label>
							<div class="flex gap-2">
								<input id="passcode-input" type="text" bind:value={passcode} placeholder="Enter passcode"
									on:keydown={(e) => e.key === 'Enter' && handleVerifyPasscode()}
									class="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
								<button on:click={handleVerifyPasscode} disabled={!passcode.trim() || verifying}
									class="rounded-md bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300">
									{verifying ? 'Verifying...' : 'Verify'}
								</button>
							</div>
						</div>
					</div>
					<div class="mt-6">
						<button on:click={handleClose} class="w-full rounded-md bg-black px-4 py-2 text-white shadow-xs">Cancel</button>
					</div>

				{:else if phase === 'preview'}
					<!-- Attendee Details Preview -->
					<div class="custom-scrollbar max-h-80 overflow-y-auto rounded-lg bg-[#F6FBF5] p-4 md:max-h-96">
						<!-- Attendee Info -->
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-3">
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
									<span class="text-lg">😊</span>
								</div>
								<div>
									<p class="text-base font-semibold text-gray-900">{attendeeName}</p>
									<p class="text-sm text-gray-500">{attendeeEmail}</p>
								</div>
							</div>
							<span class="rounded-full border px-3 py-1 text-xs font-medium
								{isAlreadyCheckedIn ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-green-200 bg-green-50 text-green-600'}">
								{isAlreadyCheckedIn ? 'Checked In ✓' : 'Attending ✓'}
							</span>
						</div>

						<!-- Details Grid -->
						<div class="mt-5 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">
							<div>
								<p class="text-xs text-gray-400">Registration Time</p>
								<p class="mt-1 text-sm font-medium text-gray-900">{registeredAt}</p>
							</div>
							<div>
								<p class="text-xs text-gray-400">Amount Paid</p>
								<p class="mt-1 text-sm font-medium text-gray-900">{formattedPrice}</p>
							</div>
							<div>
								<p class="text-xs text-gray-400">Checked-in Time</p>
								<p class="mt-1 text-sm font-medium text-gray-900">{checkedInAt}</p>
							</div>
						</div>

						{#if ticketTypeName}
						<div class="mt-4 border-t border-gray-200 pt-4">
							<p class="text-xs text-gray-400">Ticket Type</p>
							<p class="mt-1 text-sm font-medium text-gray-900">{ticketTypeName}</p>
						</div>
						{/if}
					</div>

					<!-- Action Buttons -->
					<div class="mt-6 flex items-center gap-3">
						<button on:click={handleClose} class="flex-1 rounded-md bg-[#EBECED] px-4 py-2.5 text-sm font-medium text-gray-600">Cancel</button>
						{#if isAlreadyCheckedIn}
							<button disabled class="flex-1 cursor-not-allowed rounded-md bg-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500">Already Checked In</button>
						{:else}
							<button on:click={handleConfirmCheckin} disabled={checkingIn}
								class="flex-1 rounded-md bg-[#3CBD2C] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
								{checkingIn ? 'Checking In...' : 'Check In'}
							</button>
						{/if}
					</div>

				{:else if phase === 'success'}
					<div class="custom-scrollbar max-h-80 overflow-y-auto rounded-lg border p-4 md:max-h-96">
						<div class="flex flex-col items-center gap-3 py-4">
							<div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#E3F4E1]">
								<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#3CBD2C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="#3CBD2C" stroke-width="2"/></svg>
							</div>
							<h3 class="text-lg font-semibold text-gray-900">Check-in Successful</h3>
							<p class="text-sm text-gray-500">{attendeeName} has been checked in.</p>
						</div>
						<div class="mt-2 space-y-3">
							<div class="flex justify-between border-b pb-2">
								<span class="text-sm text-gray-500">Name</span>
								<span class="text-sm font-medium">{attendeeName}</span>
							</div>
							<div class="flex justify-between border-b pb-2">
								<span class="text-sm text-gray-500">Email</span>
								<span class="text-sm font-medium">{attendeeEmail}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-sm text-gray-500">Status</span>
								<span class="rounded-full bg-[#E3F4E1] px-2 py-1 text-xs text-[#3CBD2C]">Checked-In</span>
							</div>
						</div>
					</div>
					<div class="mt-6">
						<button on:click={handleClose} class="w-full rounded-md bg-[#3CBD2C] px-4 py-2 text-white shadow-xs">Done</button>
					</div>

				{:else if phase === 'error'}
					<div class="custom-scrollbar max-h-80 overflow-y-auto rounded-lg border p-4 md:max-h-96">
						<div class="flex flex-col items-center gap-3 py-4">
							<div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3F2]">
								<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#D92D20" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="#D92D20" stroke-width="2" stroke-linecap="round"/></svg>
							</div>
							<h3 class="text-lg font-semibold text-gray-900">Check-in Failed</h3>
							<p class="text-sm text-center text-gray-500">{errorMessage}</p>
						</div>
					</div>
					<div class="mt-6 flex items-center gap-2">
						<button on:click={handleClose} class="flex-1 rounded-md bg-[#EBECED] px-4 py-2 text-gray-600 shadow-xs">Close</button>
						<button on:click={handleRetry} class="flex-1 rounded-md bg-black px-4 py-2 text-white shadow-xs">Try Again</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn { animation: fade 0.15s ease-out; }
	@keyframes fade { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
	.scan-line {
		animation: scanMove 2s ease-in-out infinite;
	}
	@keyframes scanMove {
		0%, 100% { top: 8px; }
		50% { top: calc(100% - 10px); }
	}
</style>
