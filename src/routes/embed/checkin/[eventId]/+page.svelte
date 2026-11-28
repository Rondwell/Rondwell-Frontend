<script lang="ts">
	import { page } from '$app/stores';

	const GATEWAY_URL = import.meta.env.VITE_API_URL || '';
	$: eventId = ($page.params as Record<string, string>).eventId ?? '';
	$: embedToken = $page.url.searchParams.get('embedToken') || '';
	$: primaryColor = $page.url.searchParams.get('primary') || '#7C3AED';

	let method: 'QR_CODE' | 'PASSCODE' = 'PASSCODE';
	let credential = '';
	let apiKeyInput = '';
	let statusMsg = '';
	let statusOk = false;
	let busy = false;

	async function verifyAndCheckin() {
		if (!credential.trim()) return;
		busy = true;
		statusMsg = '';
		try {
			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			if (apiKeyInput.trim()) headers['Authorization'] = `Bearer ${apiKeyInput.trim()}`;
			else if (embedToken) headers['Authorization'] = `Bearer ${embedToken}`;

			const res = await fetch(`${GATEWAY_URL}/v1/events/${encodeURIComponent(eventId)}/checkins`, {
				method: 'POST',
				headers,
				body: JSON.stringify(
					method === 'QR_CODE'
						? { method: 'QR_CODE', qr_token: credential.trim() }
						: { method: 'PASSCODE', passcode: credential.trim() }
				),
			});
			const data = await res.json();
			statusOk = res.ok;
			statusMsg = res.ok
				? `Checked in: ${data?.data?.attendee?.first_name || 'Attendee'}`
				: data?.detail || data?.message || 'Check-in failed';
		} catch (e: any) {
			statusOk = false;
			statusMsg = e?.message || 'Network error';
		} finally {
			busy = false;
		}
	}
</script>

<div class="mx-auto max-w-md space-y-4 p-6">
	<div>
		<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style="background-color:{primaryColor};">
			Door Check-In Embed
		</span>
		<h1 class="mt-2 text-lg font-bold">Verify Attendee Pass</h1>
		<p class="text-xs opacity-70">Event ID: {eventId}</p>
	</div>

	<div class="flex gap-2">
		<button
			type="button"
			on:click={() => (method = 'PASSCODE')}
			class="flex-1 rounded-lg border py-2 text-xs font-semibold"
			style={method === 'PASSCODE' ? `background-color:${primaryColor};color:#fff;border-color:${primaryColor};` : ''}
		>
			Door Passcode
		</button>
		<button
			type="button"
			on:click={() => (method = 'QR_CODE')}
			class="flex-1 rounded-lg border py-2 text-xs font-semibold"
			style={method === 'QR_CODE' ? `background-color:${primaryColor};color:#fff;border-color:${primaryColor};` : ''}
		>
			QR Token
		</button>
	</div>

	{#if !embedToken}
		<input
			type="password"
			bind:value={apiKeyInput}
			placeholder="Organizer Check-in API Key (rw_live_...)"
			class="w-full rounded-lg border px-3 py-2 text-sm"
		/>
	{/if}

	<input
		type="text"
		bind:value={credential}
		placeholder={method === 'PASSCODE' ? 'Enter attendee door passcode' : 'Paste scanned QR check-in payload'}
		class="w-full rounded-lg border px-3 py-2 text-sm"
	/>

	<button
		type="button"
		disabled={busy}
		on:click={verifyAndCheckin}
		class="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
		style="background-color:{primaryColor};"
	>
		{busy ? 'Verifying…' : 'Verify & Check In'}
	</button>

	{#if statusMsg}
		<div class="rounded-lg p-3 text-sm {statusOk ? 'bg-emerald-500/15 text-emerald-700' : 'bg-rose-500/15 text-rose-700'}">
			{statusMsg}
		</div>
	{/if}
</div>
