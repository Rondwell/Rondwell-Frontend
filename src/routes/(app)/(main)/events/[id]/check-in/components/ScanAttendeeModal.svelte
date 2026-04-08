<script lang="ts">
	import { checkinByPasscode, checkinByQrCode, verifyCheckinPasscode, verifyCheckinQr } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onDestroy, tick } from 'svelte';

	export let open = false;
	export let eventId = '';

	const dispatch = createEventDispatcher();

	let phase: 'scan' | 'preview' | 'success' | 'error' = 'scan';
	let passcode = '';
	let verifying = false;
	let checkingIn = false;
	let errorMessage = '';

	let verifiedData: any = null;
	let verifiedPasscode = '';
	let verifiedQrToken = '';

	let scannerContainerId = 'qr-reader-' + Math.random().toString(36).slice(2);
	let html5QrScanner: any = null;
	let scannerReady = false;

	$: if (open && phase === 'scan') { initScan(); }
	$: if (!open) { cleanup(); resetState(); }

	async function initScan() {
		await tick();
		// Wait for the DOM element to exist
		await tick();
		startHtml5QrScanner();
	}

	async function startHtml5QrScanner() {
		// Cleanup any existing scanner first
		await stopScanner();
		scannerReady = false;

		try {
			// Dynamic import to avoid SSR issues
			const { Html5Qrcode } = await import('html5-qrcode');

			const container = document.getElementById(scannerContainerId);
			if (!container) {
				console.error('Scanner container not found');
				return;
			}

			html5QrScanner = new Html5Qrcode(scannerContainerId);

			await html5QrScanner.start(
				{ facingMode: 'environment' },
				{
					fps: 10,
					qrbox: { width: 250, height: 250 },
					aspectRatio: 1.0,
					disableFlip: false,
				},
				async (decodedText: string) => {
					// QR code successfully scanned
					await handleQrDetected(decodedText);
				},
				() => {
					// QR code not found in this frame — this is normal, ignore
				}
			);
			scannerReady = true;
		} catch (err) {
			console.error('Failed to start QR scanner:', err);
		}
	}

	async function handleQrDetected(rawValue: string) {
		if (verifying || phase !== 'scan') return;
		verifying = true;
		errorMessage = '';

		// Stop scanner immediately to prevent duplicate scans
		await stopScanner();

		try {
			let token = rawValue;
			try {
				const parsed = JSON.parse(rawValue);
				// Encode as base64 for the backend decodeCheckinToken
				token = btoa(JSON.stringify({ attendeeId: parsed.attendeeId, eventId: parsed.eventId }));
			} catch {
				// If it's not JSON, try using raw value as token directly
			}

			const result = await verifyCheckinQr(eventId, token);
			verifiedData = result;
			verifiedQrToken = token;
			verifiedPasscode = '';
			phase = 'preview';
		} catch (e: any) {
			errorMessage = e.message || 'QR verification failed';
			phase = 'error';
		} finally {
			verifying = false;
		}
	}

	async function stopScanner() {
		if (html5QrScanner) {
			try {
				const state = html5QrScanner.getState();
				// State 2 = SCANNING, State 3 = PAUSED
				if (state === 2 || state === 3) {
					await html5QrScanner.stop();
				}
			} catch {
				// Ignore stop errors
			}
			try {
				html5QrScanner.clear();
			} catch {
				// Ignore clear errors
			}
			html5QrScanner = null;
		}
		scannerReady = false;
	}

	async function cleanup() {
		await stopScanner();
	}

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
			await stopScanner();
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

	async function handleClose() {
		open = false;
		await cleanup();
		resetState();
	}

	async function handleRetry() {
		await cleanup();
		resetState();
		await tick();
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
						<!-- QR Scanner powered by html5-qrcode -->
						<div class="relative mb-4 overflow-hidden rounded-lg bg-gray-900">
							<div id={scannerContainerId} class="qr-scanner-container"></div>
							{#if verifying}
								<div class="absolute inset-0 flex items-center justify-center bg-black/60">
									<p class="text-sm text-white">Verifying QR code...</p>
								</div>
							{/if}
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

	/* Style the html5-qrcode scanner container */
	.qr-scanner-container {
		width: 100%;
		min-height: 280px;
	}
	:global(#qr-shaded-region) {
		border-color: rgba(219, 62, 198, 0.5) !important;
	}
	/* Hide the default html5-qrcode branding/header */
	.qr-scanner-container :global(img[alt="Info icon"]),
	.qr-scanner-container :global(span:has(> a[href*="scanapp"])),
	.qr-scanner-container :global(a[href*="scanapp"]) {
		display: none !important;
	}
</style>
