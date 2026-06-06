<script lang="ts">
	/**
	 * FE-P3-10 (NEW-9.2) — Soft-delete + 7-year retention.
	 *
	 * Replaces the FE-P0-07 transitional copy. The user clicks "Request
	 * deletion" → backend schedules a soft-delete on a 30-day grace window.
	 * They keep access during the window and can cancel any time. After
	 * the window the cron runs anonymise (PII scrubbed, financial records
	 * retained 7y for regulatory compliance).
	 *
	 * Backend reference:
	 *   POST /api/v1/profile/me/deletion/request
	 *   POST /api/v1/profile/me/deletion/cancel
	 *   GET  /api/v1/profile/me/deletion/status
	 */
	import {
		cancelAccountDeletion,
		getAccountDeletionStatus,
		requestAccountDeletion,
	} from '$lib/services/wallet.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let open = false;

	const dispatch = createEventDispatcher<{ statusChange: { scheduledFor: string | null } }>();

	let reason = '';
	let scheduledFor: string | null = null;
	let loadingStatus = true;
	let submitting = false;
	let error = '';
	let mode: 'idle' | 'request' | 'cancel-confirm' = 'idle';

	$: if (open) refreshStatus();

	onMount(refreshStatus);

	async function refreshStatus() {
		loadingStatus = true;
		try {
			const s = await getAccountDeletionStatus();
			scheduledFor = s?.scheduledFor ?? null;
			dispatch('statusChange', { scheduledFor });
		} finally {
			loadingStatus = false;
		}
	}

	async function handleRequest() {
		submitting = true;
		error = '';
		try {
			const result = await requestAccountDeletion(reason);
			scheduledFor = result.scheduledFor;
			dispatch('statusChange', { scheduledFor });
			mode = 'idle';
		} catch (e: any) {
			error = e?.message ?? 'Failed to schedule deletion. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function handleCancel() {
		submitting = true;
		error = '';
		try {
			await cancelAccountDeletion();
			scheduledFor = null;
			dispatch('statusChange', { scheduledFor: null });
			mode = 'idle';
		} catch (e: any) {
			error = e?.message ?? 'Failed to cancel deletion request.';
		} finally {
			submitting = false;
		}
	}

	function close() {
		open = false;
		reason = '';
		mode = 'idle';
		error = '';
	}

	function fmtDate(iso: string | null): string {
		if (!iso) return '';
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
			});
		} catch {
			return iso;
		}
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
			{#if loadingStatus}
				<div class="flex h-32 items-center justify-center">
					<Icon icon="mdi:loading" class="animate-spin text-2xl text-gray-400" />
				</div>
			{:else if scheduledFor}
				<!-- Pending deletion — show the grace-window banner with cancel CTA. -->
				<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
					<Icon icon="mdi:clock-alert-outline" class="text-2xl text-amber-600" />
				</div>
				<h2 class="text-lg font-semibold text-gray-900">Deletion scheduled</h2>
				<p class="mt-2 text-sm text-gray-600">
					Your account will be deleted on <strong>{fmtDate(scheduledFor)}</strong>. PII will be
					anonymised; financial history is retained for 7 years to meet regulatory requirements.
				</p>

				{#if mode === 'cancel-confirm'}
					<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
						<p class="font-medium">Cancel this request?</p>
						<p class="mt-1">Your account will continue as normal.</p>
						<div class="mt-3 flex gap-2">
							<button
								on:click={() => (mode = 'idle')}
								class="rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700"
							>
								Keep deletion
							</button>
							<button
								on:click={handleCancel}
								disabled={submitting}
								class="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
							>
								{submitting ? 'Cancelling…' : 'Cancel deletion'}
							</button>
						</div>
					</div>
				{:else}
					<div class="mt-5 flex flex-col gap-2 sm:flex-row">
						<button
							on:click={close}
							class="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
						>
							Close
						</button>
						<button
							on:click={() => (mode = 'cancel-confirm')}
							class="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
						>
							Cancel deletion
						</button>
					</div>
				{/if}
			{:else if mode === 'request'}
				<!-- Confirmation step. -->
				<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
					<Icon icon="mdi:alert-outline" class="text-2xl text-red-600" />
				</div>
				<h2 class="text-lg font-semibold text-gray-900">Request account deletion</h2>
				<p class="mt-2 text-sm text-gray-500">
					This schedules a soft-delete on a 30-day grace window. You can cancel any time before then.
				</p>
				<ul class="mt-3 space-y-2 text-sm text-gray-600">
					<li class="flex items-start gap-2">
						<Icon icon="mdi:check-circle" class="mt-0.5 flex-shrink-0 text-base text-emerald-600" />
						<span>You keep access for 30 days. Your account is locked from financial actions.</span>
					</li>
					<li class="flex items-start gap-2">
						<Icon icon="mdi:check-circle" class="mt-0.5 flex-shrink-0 text-base text-emerald-600" />
						<span>After the window, your PII is anonymised; financial records are kept for 7 years.</span>
					</li>
					<li class="flex items-start gap-2">
						<Icon icon="mdi:check-circle" class="mt-0.5 flex-shrink-0 text-base text-emerald-600" />
						<span>Wallet balances will be returned to you before the deletion is finalised.</span>
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
						on:click={() => (mode = 'idle')}
						class="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
					>
						Back
					</button>
					<button
						on:click={handleRequest}
						disabled={submitting}
						class="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
					>
						{submitting ? 'Scheduling…' : 'Schedule deletion'}
					</button>
				</div>
			{:else}
				<!-- Initial state. -->
				<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
					<Icon icon="mdi:trash-can-outline" class="text-2xl text-red-600" />
				</div>
				<h2 class="text-lg font-semibold text-gray-900">Delete your account</h2>
				<p class="mt-2 text-sm text-gray-500">
					Account deletion is a 30-day grace flow. Your personal data will be anonymised after the
					window; financial records are retained for 7 years to meet regulatory requirements.
				</p>

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
						on:click={() => (mode = 'request')}
						class="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
					>
						Request deletion
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
