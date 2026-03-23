<script lang="ts">
	import { smartRequestOTP, smartVerifyOTP } from '$lib/services/auth.services';
	import { authState } from '$lib/stores/auth.store';
	import { createEventDispatcher } from 'svelte';

	export let open = false;

	const dispatch = createEventDispatcher<{ authenticated: void; close: void }>();

	let step: 'email' | 'otp' = 'email';
	let contact = '';
	let otp = '';
	let isNewUser = true;
	let loading = false;
	let error = '';
	let resendTimer = 0;
	let timerInterval: ReturnType<typeof setInterval>;

	function startTimer() {
		resendTimer = 60;
		clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			resendTimer--;
			if (resendTimer <= 0) clearInterval(timerInterval);
		}, 1000);
	}

	async function sendOTP() {
		if (!contact.trim()) { error = 'Please enter your email or phone'; return; }
		loading = true; error = '';
		try {
			const result = await smartRequestOTP(contact.trim());
			isNewUser = result.isNewUser;
			step = 'otp';
			startTimer();
		} catch (e: any) {
			error = e.message ?? 'Failed to send OTP';
		} finally {
			loading = false;
		}
	}

	async function verifyOTP() {
		if (!otp.trim()) { error = 'Please enter the OTP'; return; }
		loading = true; error = '';
		try {
			await smartVerifyOTP(contact.trim(), otp.trim(), false, isNewUser);
			dispatch('authenticated');
			open = false;
		} catch (e: any) {
			error = e.message ?? 'Invalid OTP';
		} finally {
			loading = false;
		}
	}

	async function resend() {
		if (resendTimer > 0) return;
		loading = true; error = '';
		try {
			const result = await smartRequestOTP(contact.trim());
			isNewUser = result.isNewUser;
			startTimer();
		} catch (e: any) {
			error = e.message ?? 'Failed to resend OTP';
		} finally {
			loading = false;
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
		<div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold text-gray-900">
						{step === 'email' ? 'Sign in to create your event' : 'Enter verification code'}
					</h2>
					<p class="mt-1 text-sm text-gray-500">
						{step === 'email'
							? 'Your event details are saved. Sign in to publish.'
							: `We sent a code to ${contact}`}
					</p>
				</div>
				<button
					on:click={() => { open = false; dispatch('close'); }}
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
				>✕</button>
			</div>

			{#if error}
				<p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
			{/if}

			{#if step === 'email'}
				<div class="space-y-4">
					<input
						type="text"
						bind:value={contact}
						placeholder="Email or phone number"
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none"
						on:keydown={(e) => e.key === 'Enter' && sendOTP()}
					/>
					<button
						on:click={sendOTP}
						disabled={loading}
						class="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
					>
						{loading ? 'Sending...' : 'Continue'}
					</button>
				</div>
			{:else}
				<div class="space-y-4">
					<input
						type="text"
						bind:value={otp}
						placeholder="6-digit code"
						maxlength={6}
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg tracking-widest focus:border-gray-400 focus:outline-none"
						on:keydown={(e) => e.key === 'Enter' && verifyOTP()}
					/>
					<button
						on:click={verifyOTP}
						disabled={loading}
						class="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
					>
						{loading ? 'Verifying...' : 'Verify & Create Event'}
					</button>
					<div class="text-center text-sm text-gray-500">
						{#if resendTimer > 0}
							Resend in {resendTimer}s
						{:else}
							<button on:click={resend} class="text-gray-800 underline">Resend code</button>
						{/if}
					</div>
					<button
						on:click={() => { step = 'email'; otp = ''; error = ''; }}
						class="w-full text-center text-sm text-gray-400 hover:text-gray-600"
					>← Change email/phone</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
