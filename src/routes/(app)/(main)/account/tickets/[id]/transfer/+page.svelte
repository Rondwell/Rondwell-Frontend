<!--
	FE-P3-08 (NEW-10.3) — Ticket transfer / resale form.

	Recipient email + optional resale price → preview platform fee → submit.
	Maps the structured error codes (TICKET_REFUNDED,
	TICKET_REFUND_IN_PROGRESS, TRANSFER_CUTOFF_PASSED) via the central
	`mapFinancialError` registry so the user sees specific copy.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		getMyTicket,
		previewTicketTransfer,
		transferTicket,
		type MyTicket,
		type TransferPreview,
	} from '$lib/services/ticket.services';
	import { mapFinancialError } from '$lib/utils/financialErrorCopy';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	$: registrationId = $page.params.id ?? '';

	let ticket: MyTicket | null = null;
	let loading = true;
	let recipientEmail = '';
	let recipientName = '';
	let resalePriceMajor = '';
	let messageNote = '';
	let preview: TransferPreview | null = null;
	let previewing = false;
	let submitting = false;
	let errorCopy: { title: string; body: string } | null = null;
	let success = false;

	onMount(async () => {
		try {
			ticket = await getMyTicket(registrationId);
		} finally {
			loading = false;
		}
	});

	$: currency = ticket?.currency ?? 'NGN';
	$: feePercent = ticket ? ((ticket.resalePlatformFeePercent ?? 1000) / 100).toFixed(1) : '10.0';

	async function runPreview() {
		errorCopy = null;
		preview = null;
		const major = parseFloat(resalePriceMajor || '0');
		if (!Number.isFinite(major) || major <= 0) return;
		previewing = true;
		try {
			preview = await previewTicketTransfer(registrationId, majorToKobo(major, currency));
		} catch (e: any) {
			errorCopy = mapFinancialError(e);
		} finally {
			previewing = false;
		}
	}

	async function handleSubmit() {
		errorCopy = null;
		if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
			errorCopy = { title: 'Invalid email', body: 'Enter a valid recipient email.' };
			return;
		}
		const major = parseFloat(resalePriceMajor || '0');
		const resalePriceKobo = Number.isFinite(major) && major > 0 ? majorToKobo(major, currency) : undefined;
		submitting = true;
		try {
			await transferTicket(registrationId, {
				recipientEmail: recipientEmail.trim().toLowerCase(),
				recipientName: recipientName.trim() || undefined,
				resalePriceKobo,
				message: messageNote.trim() || undefined,
			});
			success = true;
		} catch (e: any) {
			errorCopy = mapFinancialError(e);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Transfer Ticket · Rondwell</title>
</svelte:head>

<div class="mx-auto max-w-2xl p-4 sm:p-6">
	<button
		type="button"
		on:click={() => goto('/account/tickets')}
		class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" class="text-lg" /> Back to tickets
	</button>

	{#if loading}
		<div class="space-y-3">
			<div class="h-32 animate-pulse rounded-xl bg-gray-100"></div>
			<div class="h-48 animate-pulse rounded-xl bg-gray-100"></div>
		</div>
	{:else if !ticket}
		<div class="rounded-xl border border-dashed bg-white p-8 text-center">
			<p class="text-sm text-gray-500">Ticket not found.</p>
		</div>
	{:else if success}
		<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
			<Icon icon="mdi:check-circle-outline" class="mx-auto mb-2 text-3xl text-emerald-600" />
			<h2 class="text-lg font-semibold text-emerald-900">Transfer requested</h2>
			<p class="mt-1 text-sm text-emerald-800">
				We've emailed {recipientEmail} with a link to claim the ticket.
				{#if resalePriceMajor}They'll be asked to pay before the transfer completes.{/if}
			</p>
			<button
				on:click={() => goto('/account/tickets')}
				class="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
			>
				Back to tickets
			</button>
		</div>
	{:else}
		<div class="mb-4 rounded-xl border bg-white p-4">
			<p class="text-xs text-gray-500">Transferring ticket</p>
			<p class="mt-0.5 text-base font-semibold">{ticket.eventTitle}</p>
			<p class="text-xs text-gray-500">{ticket.ticketTypeName} · {ticket.currency}</p>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="space-y-4 rounded-xl border bg-white p-4">
			<h2 class="text-base font-semibold">Recipient</h2>

			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="recipient-email">Recipient email *</label>
				<input
					id="recipient-email"
					type="email"
					bind:value={recipientEmail}
					placeholder="friend@example.com"
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				/>
			</div>

			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="recipient-name">Recipient name (optional)</label>
				<input
					id="recipient-name"
					type="text"
					bind:value={recipientName}
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				/>
			</div>

			<h2 class="pt-2 text-base font-semibold">Resale (optional)</h2>
			<p class="-mt-2 text-xs text-gray-500">
				Leave blank to gift the ticket. If you set a price, the platform takes a {feePercent}% fee.
			</p>

			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="resale-price">Resale price ({ticket.currency})</label>
				<input
					id="resale-price"
					type="number"
					min="0"
					step="0.01"
					bind:value={resalePriceMajor}
					on:blur={runPreview}
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				/>
			</div>

			{#if preview}
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
					<div class="flex justify-between">
						<span>Platform fee ({feePercent}%)</span>
						<span class="text-red-500">-{formatMoney(preview.platformFeeKobo, preview.currency)}</span>
					</div>
					<div class="mt-1 flex justify-between border-t pt-1 font-medium">
						<span>You'll receive</span>
						<span class="text-green-600">{formatMoney(preview.youReceiveKobo, preview.currency)}</span>
					</div>
				</div>
			{:else if previewing}
				<div class="text-xs text-gray-400">Calculating fee…</div>
			{/if}

			<div>
				<label class="mb-1 block text-xs font-medium text-gray-700" for="message">Message (optional)</label>
				<textarea
					id="message"
					rows="3"
					bind:value={messageNote}
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
				></textarea>
			</div>

			{#if errorCopy}
				<div class="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
					<p class="font-medium">{errorCopy.title}</p>
					<p class="mt-0.5">{errorCopy.body}</p>
				</div>
			{/if}

			<button
				type="submit"
				disabled={submitting || !recipientEmail}
				class="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
			>
				{submitting ? 'Submitting…' : resalePriceMajor && parseFloat(resalePriceMajor) > 0 ? 'Send resale offer' : 'Send transfer'}
			</button>
		</form>
	{/if}
</div>
