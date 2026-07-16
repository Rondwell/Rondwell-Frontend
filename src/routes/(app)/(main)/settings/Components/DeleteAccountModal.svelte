<script lang="ts">
	/**
	 * Account deletion — OTP-confirmed, immediate.
	 *
	 * Flow:
	 *   1. Intro screen with the consequences.
	 *   2. "Send confirmation code" → backend emails a 6-digit OTP.
	 *   3. User enters the OTP → account is closed immediately, the user is
	 *      signed out everywhere, local auth is cleared and we redirect to /auth.
	 *
	 * Backend reference:
	 *   POST /api/v1/profile/me/deletion/request   → emails OTP
	 *   POST /api/v1/profile/me/deletion/confirm   → verifies OTP + deletes
	 */
	import { confirmAccountDeletion, requestAccountDeletion } from '$lib/services/wallet.services';
	import { clearUser } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let open = false;

	// Kept for API compatibility with the parent (Account.svelte); emitted as
	// null on close and after deletion completes.
	const dispatch = createEventDispatcher<{ statusChange: { scheduledFor: string | null } }>();

	let reason = '';
	let otp = '';
	let maskedEmail = '';
	let submitting = false;
	let error = '';
	let mode: 'intro' | 'otp' | 'done' = 'intro';

	async function handleRequest() {
		submitting = true;
		error = '';
		try {
			const result = await requestAccountDeletion(reason);
			maskedEmail = result.email;
			mode = 'otp';
		} catch (e: any) {
			error = e?.message ?? 'Failed to send confirmation code. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function handleConfirm() {
		if (otp.trim().length < 6) {
			error = 'Enter the 6-digit code from your email.';
			return;
		}
		submitting = true;
		error = '';
		try {
			await confirmAccountDeletion(otp.trim());
			mode = 'done';
			dispatch('statusChange', { scheduledFor: null });
			// Kick the user out: clear local auth and send them to the auth screen.
			clearUser();
			setTimeout(() => goto('/auth'), 1500);
		} catch (e: any) {
			error = e?.message ?? 'Invalid or expired code. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function resendCode() {
		submitting = true;
		error = '';
		try {
			const result = await requestAccountDeletion(reason);
			maskedEmail = result.email;
		} catch (e: any) {
			error = e?.message ?? 'Failed to resend code.';
		} finally {
			submitting = false;
		}
	}

	function close() {
		if (mode === 'done') return; // deletion in progress — don't allow dismiss
		open = false;
		reason = '';
		otp = '';
		error = '';
		mode = 'intro';
	}
</script>

{#if open}
	<div
		on:click={close}
		on:keydown={(e) => e.key === 'Escape' && close()}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			{#if mode === 'done'}
				<!-- Deletion complete — brief confirmation before redirect. -->
				<div class="flex flex-col items-center py-4 text-center">
					<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
						<Icon icon="mdi:check-circle-outline" class="text-3xl text-emerald-600" />
					</div>
					<h2 class="text-lg font-semibold text-gray-900">Account deleted</h2>
					<p class="mt-2 text-sm text-gray-500">
						You've been signed out. Redirecting you now…
					</p>
				</div>
			{:else if mode === 'otp'}
				<!-- OTP confirmation step. -->
				<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
					<Icon icon="mdi:email-lock-outline" class="text-2xl text-red-600" />
				</div>
				<h2 class="text-lg font-semibold text-gray-900">Enter confirmation code</h2>
				<p class="mt-2 text-sm text-gray-500">
					We sent a 6-digit code to <strong>{maskedEmail || 'your email'}</strong>. Enter it below to
					permanently delete your account. This cannot be undone.
				</p>

				<input
					bind:value={otp}
					inputmode="numeric"
					maxlength="6"
					placeholder="______"
					class="mt-4 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-center text-lg tracking-[0.5em] focus:border-red-400 focus:outline-none"
				/>

				{#if error}
					<p class="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>
				{/if}

				<div class="mt-3 text-xs text-gray-500">
					Didn't get it?
					<button
						on:click={resendCode}
						disabled={submitting}
						class="font-medium text-red-600 underline disabled:opacity-50"
					>
						Resend code
					</button>
				</div>

				<div class="mt-5 flex flex-col gap-2 sm:flex-row">
					<button
						on:click={close}
						class="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
					>
						Cancel
					</button>
					<button
						on:click={handleConfirm}
						disabled={submitting}
						class="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
					>
						{submitting ? 'Deleting…' : 'Delete my account'}
					</button>
				</div>
			{:else}
				<!-- Intro / consequences. -->
				<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
					<Icon icon="mdi:trash-can-outline" class="text-2xl text-red-600" />
				</div>
				<h2 class="text-lg font-semibold text-gray-900">Delete your account</h2>
				<p class="mt-2 text-sm text-gray-500">
					We'll email you a confirmation code. Once you confirm, your account is closed
					immediately and you're signed out on all devices.
				</p>
				<ul class="mt-3 space-y-2 text-sm text-gray-600">
					<li class="flex items-start gap-2">
						<Icon icon="mdi:alert-circle-outline" class="mt-0.5 flex-shrink-0 text-base text-red-500" />
						<span>This is permanent and cannot be undone.</span>
					</li>
					<li class="flex items-start gap-2">
						<Icon icon="mdi:shield-check-outline" class="mt-0.5 flex-shrink-0 text-base text-emerald-600" />
						<span>Your personal data is anonymised; financial records are kept for 7 years to meet regulatory requirements.</span>
					</li>
					<li class="flex items-start gap-2">
						<Icon icon="mdi:email-check-outline" class="mt-0.5 flex-shrink-0 text-base text-emerald-600" />
						<span>You can sign up again later with this same email.</span>
					</li>
				</ul>

				<label class="mt-4 block">
					<span class="text-xs font-medium text-gray-700">Reason (optional)</span>
					<textarea
						bind:value={reason}
						rows="3"
						class="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
					></textarea>
				</label>

				{#if error}
					<p class="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>
				{/if}

				<div class="mt-5 flex flex-col gap-2 sm:flex-row">
					<button
						on:click={close}
						class="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
					>
						Cancel
					</button>
					<button
						on:click={handleRequest}
						disabled={submitting}
						class="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
					>
						{submitting ? 'Sending…' : 'Send confirmation code'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
