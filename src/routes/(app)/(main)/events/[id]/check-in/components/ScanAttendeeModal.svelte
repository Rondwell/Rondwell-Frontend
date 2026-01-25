<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount, onDestroy } from 'svelte';
	import CheckedInAttendeeModal from './CheckedInAttendeeModal.svelte';

	export let open = false;
	
	let phase: 'scan' | 'verified' = 'scan';
	let passcode = '';
	let videoElement: HTMLVideoElement;
	let stream: MediaStream | null = null;
	let showAttendeeDetail = false;

	// Start camera when modal opens
	$: if (open && phase === 'scan') {
		startCamera();
	} else if (!open) {
		stopCamera();
	}

	async function startCamera() {
		try {
			// Check if on mobile or desktop
			const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
			
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: isMobile ? 'environment' : 'user' // back camera on mobile, front on desktop
				}
			});
			
			if (videoElement) {
				videoElement.srcObject = stream;
			}
		} catch (err) {
			console.error('Error accessing camera:', err);
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
	}

	function handleVerify() {
		// Simulate verification
		if (passcode) {
			phase = 'verified';
			stopCamera();
		}
	}

	function handleCheckIn() {
		// Handle check-in logic
		open = false;
		phase = 'scan';
		passcode = '';
	}

	function handleCancel() {
		open = false;
		phase = 'scan';
		passcode = '';
		stopCamera();
	}

	onDestroy(() => {
		stopCamera();
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div
			class="animate-fadeIn max-h-180 w-full max-w-2xl rounded-2xl bg-[#FDFCFB] px-4 py-6 shadow-xl md:max-h-150 md:p-6"
		>
			<!-- Modal Header -->
			<div class="relative flex w-full flex-col items-center">
				<div class="mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gray-100">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
						<svg
							width="32"
							height="32"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M19.2529 25.4017L21.2796 27.4283L25.3329 23.375"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M16.2135 14.4907C16.0801 14.4774 15.9201 14.4774 15.7735 14.4907C12.6001 14.3841 10.0801 11.7841 10.0801 8.58406C10.0668 5.3174 12.7201 2.66406 15.9868 2.66406C19.2535 2.66406 21.9068 5.3174 21.9068 8.58406C21.9068 11.7841 19.3735 14.3841 16.2135 14.4907Z"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M15.9867 29.077C13.5601 29.077 11.1467 28.4636 9.30672 27.237C6.08005 25.077 6.08005 21.557 9.30672 19.4103C12.9734 16.957 18.9867 16.957 22.6534 19.4103"
								stroke="black"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				</div>

				<h2 class="text-xl font-semibold text-gray-800">Check-in Attendee</h2>
				<p class="text-sm text-gray-500">Scan QR code or enter passcode to check in attendee.</p>
				<button
					class="absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
					on:click={handleCancel}
				>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<!-- Content Area -->
			<div class="mt-6 overflow-hidden border-t pt-6">
				{#if phase === 'scan'}
					<!-- Camera Scan Phase -->
					<div class="custom-scrollbar max-h-80 overflow-y-auto rounded-lg border p-4 md:h-60">
						<!-- Camera View -->
						<div class="mb-4 flex items-center justify-center rounded-lg bg-gray-900">
							<video
								bind:this={videoElement}
								autoplay
								playsinline
								class="h-60 w-full rounded-lg object-cover"
							>
								<track kind="captions" />
							</video>
						</div>

						<!-- Passcode Input -->
						<div class="mt-4">
							<label for="passcode-input" class="mb-2 block text-sm font-medium text-gray-700">
								Enter Event Passcode
							</label>
							<div class="flex gap-2">
								<input
									id="passcode-input"
									type="text"
									bind:value={passcode}
									placeholder="Enter passcode"
									class="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
								/>
								<button
									on:click={handleVerify}
									disabled={!passcode}
									class="rounded-md bg-black px-4 py-2 text-sm text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									Verify
								</button>
							</div>
						</div>
					</div>

					<!-- Cancel Button -->
					<div class="mt-6">
						<button
							on:click={handleCancel}
							class="w-full rounded-md bg-black px-4 py-2 text-white shadow-xs"
						>
							Cancel
						</button>
					</div>
				{:else if phase === 'verified'}
					<!-- Attendee Detail Phase -->
					<div class="custom-scrollbar max-h-80 overflow-y-auto rounded-lg border p-4 md:h-60">
						<!-- Attendee Info -->
						<div class="flex items-center gap-3">
							<img src="/face-1.svg" alt="profile icon" class="h-12 w-12" />
							<div>
								<p class="font-semibold text-gray-900">John Odoemenem</p>
								<p class="text-sm text-gray-500">johnmedoc23@gmail.com</p>
							</div>
						</div>

						<!-- Details -->
						<div class="mt-4 space-y-3">
							<div class="flex justify-between border-b pb-2">
								<span class="text-sm text-gray-500">Ticket Type</span>
								<span class="text-sm font-medium">Standard Ticket</span>
							</div>
							<div class="flex justify-between border-b pb-2">
								<span class="text-sm text-gray-500">Registration Time</span>
								<span class="text-sm font-medium">Sep 23, 9:31 PM</span>
							</div>
							<div class="flex justify-between border-b pb-2">
								<span class="text-sm text-gray-500">Amount Paid</span>
								<span class="text-sm font-medium">$0.00</span>
							</div>
							<div class="flex justify-between">
								<span class="text-sm text-gray-500">Status</span>
								<span class="rounded-full bg-[#E3F4E1] px-2 py-1 text-xs text-[#3CBD2C]">
									Attending
								</span>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="mt-6 flex items-center gap-2">
						<button
							on:click={handleCancel}
							class="flex-1 rounded-md bg-[#EBECED] px-4 py-2 text-gray-600 shadow-xs"
						>
							Cancel
						</button>

						<button
							on:click={handleCheckIn}
							class="flex-1 rounded-md bg-[#3CBD2C] px-4 py-2 text-white shadow-xs"
						>
							Check In
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn {
		animation: fade 0.15s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
