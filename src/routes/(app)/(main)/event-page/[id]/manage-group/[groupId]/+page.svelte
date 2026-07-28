<!--
	FE-P5-05 — Group lead console.

	Reached from the "Manage your group" link in the lead's email:
	  /event-page/{eventId}/manage-group/{groupId}?t=<manage-token>

	── Why this page exists ───────────────────────────────────────────────────

	Members always got an invite email. The LEAD — who actually paid — got nothing
	beyond their own ticket, so there was no way to discover they could see who had
	confirmed, resend an invite, or hand a seat to someone who dropped out. The
	backend endpoints existed and nothing linked to them, which is also why
	"decline" was effectively a dead end: a member declined, the seat sat paid-for
	and empty, and nobody found out.

	── Auth ──────────────────────────────────────────────────────────────────

	The `?t=` token is read once on mount and then STRIPPED FROM THE URL, and every
	request sends it in the `x-group-manage-token` header. Keeping a bearer
	credential in the address bar is exactly how `leadRegistrationId` leaked (it
	rides the payment callback URL into browser history and `Referer` headers).

	Reassigning a seat additionally requires a one-time code emailed to the lead —
	link possession alone must not be enough to move a paid seat to an address the
	holder controls.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import {
		getGroupConsole,
		requestGroupActionOtp,
		reassignGroupSeat,
		resendGroupInvite,
		revokeGroupManageLinks,
		sendGroupManageLink,
		type GroupConsole,
		type GroupConsoleSeat
	} from '$lib/services/groupConsole.services';
	import { toast } from '$lib/stores/toast.store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	// NOTE: the route param is `[id]` (matching the existing
	// `/event-page/[id]/...` tree, e.g. `complete-registration`), not `[eventId]`.
	// Two different param names at the same route level is a SvelteKit conflict.
	$: eventId = $page.params.id ?? '';
	$: groupId = $page.params.groupId ?? '';

	let manageToken = '';
	let console_: GroupConsole | null = null;
	let loading = true;
	let error = '';
	let busyEmail = '';

	// Reassign flow
	let reassignSeat: GroupConsoleSeat | null = null;
	let newEmail = '';
	let newFirstName = '';
	let newLastName = '';
	let otp = '';
	let otpSentTo = '';
	let otpRequesting = false;
	let reassignSubmitting = false;
	let reassignError = '';

	// Revoke flow
	let showRevoke = false;
	let revokeOtp = '';
	let revokeOtpSentTo = '';
	let revokeBusy = false;
	let revokeError = '';

	// Recovery (expired / invalid link)
	let recoverySent = false;
	let recoveryBusy = false;

	onMount(async () => {
		if (!browser) return;
		const url = new URL(window.location.href);
		manageToken = url.searchParams.get('t') ?? '';

		// Strip the credential from the address bar immediately. It stays in memory
		// for the session; leaving it in the URL would put it in history and in the
		// `Referer` of every outbound request from this page.
		if (manageToken) {
			url.searchParams.delete('t');
			window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash);
		}

		if (!manageToken) {
			error =
				'This page needs the secure link from your ticket email. Open the link in that email, or ask us to send you a fresh one.';
			loading = false;
			return;
		}
		await load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			console_ = await getGroupConsole(eventId, groupId, manageToken);
		} catch (e: any) {
			error = e?.message ?? 'Could not open your group page';
		} finally {
			loading = false;
		}
	}

	async function handleResend(seat: GroupConsoleSeat) {
		busyEmail = seat.email;
		try {
			const result = await resendGroupInvite(eventId, groupId, manageToken, seat.email);
			toast.success(`Invite resent to ${seat.email}.`);
			// Reflect the new count without a full reload.
			if (console_) {
				console_.seats = console_.seats.map((s) =>
					s.email === seat.email
						? {
								...s,
								inviteSentCount: result.inviteSentCount,
								lastInviteSentAt: new Date().toISOString(),
								resendCapReached: result.inviteSentCount >= console_!.limits.maxInviteSends,
								canResend: result.inviteSentCount < console_!.limits.maxInviteSends
							}
						: s
				);
			}
		} catch (e: any) {
			toast.error(e?.message ?? 'Could not resend that invite');
		} finally {
			busyEmail = '';
		}
	}

	function openReassign(seat: GroupConsoleSeat) {
		reassignSeat = seat;
		newEmail = '';
		newFirstName = '';
		newLastName = '';
		otp = '';
		otpSentTo = '';
		reassignError = '';
	}

	function closeReassign() {
		reassignSeat = null;
	}

	/**
	 * Step 1 of reassignment: request the code.
	 *
	 * The code is bound server-side to this exact (from → to) pair, so it cannot be
	 * reused to move a different seat — which is why the new email must be entered
	 * BEFORE the code is requested.
	 */
	async function handleRequestOtp() {
		if (!reassignSeat) return;
		const to = newEmail.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
			reassignError = 'Enter a valid email address for the new attendee.';
			return;
		}
		otpRequesting = true;
		reassignError = '';
		try {
			const result = await requestGroupActionOtp(eventId, groupId, manageToken, {
				action: 'REASSIGN_SEAT',
				oldEmail: reassignSeat.email,
				newEmail: to
			});
			otpSentTo = result.sentToMasked;
		} catch (e: any) {
			reassignError = e?.message ?? 'Could not send a verification code';
		} finally {
			otpRequesting = false;
		}
	}

	/** Step 2: confirm with the code. */
	async function handleReassign() {
		if (!reassignSeat) return;
		reassignSubmitting = true;
		reassignError = '';
		try {
			await reassignGroupSeat(eventId, groupId, manageToken, otp.trim(), reassignSeat.email, {
				email: newEmail.trim().toLowerCase(),
				firstName: newFirstName.trim() || undefined,
				lastName: newLastName.trim() || undefined
			});
			toast.success(`Seat moved to ${newEmail.trim().toLowerCase()}. They've been emailed an invite.`);
			closeReassign();
			await load();
		} catch (e: any) {
			reassignError = e?.message ?? 'Could not reassign that seat';
		} finally {
			reassignSubmitting = false;
		}
	}

	async function handleRequestRevokeOtp() {
		revokeBusy = true;
		revokeError = '';
		try {
			const result = await requestGroupActionOtp(eventId, groupId, manageToken, {
				action: 'REVOKE_LINKS'
			});
			revokeOtpSentTo = result.sentToMasked;
		} catch (e: any) {
			revokeError = e?.message ?? 'Could not send a verification code';
		} finally {
			revokeBusy = false;
		}
	}

	async function handleRevoke() {
		revokeBusy = true;
		revokeError = '';
		try {
			await revokeGroupManageLinks(eventId, groupId, manageToken, revokeOtp.trim());
			toast.success("Old links are dead. We've emailed you a new one.");
			showRevoke = false;
			// This link is now invalid too — send them back to the event page rather
			// than leaving a page open that will 401 on the next action.
			goto(`/event-page/${eventId}`);
		} catch (e: any) {
			revokeError = e?.message ?? 'Could not revoke your links';
		} finally {
			revokeBusy = false;
		}
	}

	async function handleRecovery() {
		recoveryBusy = true;
		try {
			await sendGroupManageLink(eventId, groupId);
			recoverySent = true;
		} catch (e: any) {
			toast.error(e?.message ?? 'Could not email your link');
		} finally {
			recoveryBusy = false;
		}
	}

	function seatName(s: GroupConsoleSeat): string {
		return [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email;
	}

	function statusChip(s: GroupConsoleSeat): { label: string; cls: string } {
		if (s.checkedIn) return { label: 'Checked in', cls: 'bg-green-100 text-green-700' };
		switch (s.status) {
			case 'CONFIRMED':
				return { label: 'Confirmed', cls: 'bg-green-100 text-green-700' };
			case 'DECLINED':
				return { label: 'Declined', cls: 'bg-amber-100 text-amber-700' };
			case 'CANCELLED':
				return { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-600' };
			default:
				return { label: 'Awaiting confirmation', cls: 'bg-blue-100 text-blue-700' };
		}
	}

	function fmtDate(iso?: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
		} catch {
			return '—';
		}
	}
</script>

<svelte:head><title>Manage your group — Rondwell</title></svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	{#if loading}
		<div class="space-y-3">
			<div class="h-24 animate-pulse rounded-xl bg-gray-100"></div>
			<div class="h-64 animate-pulse rounded-xl bg-gray-100"></div>
		</div>
	{:else if error}
		<div class="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
			<Icon icon="mdi:link-variant-off" class="mb-2 text-5xl text-amber-500" />
			<h1 class="text-xl font-semibold text-amber-900">We can't open this group page</h1>
			<p class="mx-auto mt-2 max-w-md text-sm text-amber-800">{error}</p>

			{#if recoverySent}
				<p class="mt-4 rounded-lg bg-white p-3 text-sm text-amber-900">
					Sent. Check the inbox of the email address used to buy the tickets — the new link works
					straight away.
				</p>
			{:else}
				<button
					on:click={handleRecovery}
					disabled={recoveryBusy}
					class="mt-4 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
				>
					{recoveryBusy ? 'Sending…' : 'Email me a new link'}
				</button>
				<p class="mt-2 text-xs text-amber-700">
					We'll only ever send it to the address that bought the tickets.
				</p>
			{/if}
		</div>
	{:else if console_}
		<!-- Header -->
		<div class="mb-6">
			<a
				href={`/event-page/${eventId}`}
				class="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
			>
				<Icon icon="mdi:arrow-left" /> Back to event
			</a>
			<h1 class="text-2xl font-bold text-gray-900">
				{console_.event?.title ?? 'Your group'}
			</h1>
			<p class="mt-1 text-sm text-gray-500">
				{console_.counts.total} seat{console_.counts.total === 1 ? '' : 's'} ·
				{console_.counts.confirmed} confirmed ·
				{console_.counts.invited} awaiting
				{#if console_.counts.declined > 0} · {console_.counts.declined} declined{/if}
			</p>
		</div>

		{#if console_.group.isTerminal}
			<!--
				A refunded / cancelled group must not offer any seat action. Before the
				cascade fix, a fully refunded group stayed ACTIVE and its invite links
				kept working — a member could complete their profile and be issued a
				free ticket after the money had gone back.
			-->
			<div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
				<div class="flex items-start gap-3">
					<Icon icon="mdi:alert-circle-outline" class="mt-0.5 text-xl text-red-600" />
					<div>
						<p class="text-sm font-semibold text-red-900">
							This group booking is {console_.group.status.toLowerCase()}.
						</p>
						<p class="mt-1 text-sm text-red-800">
							{#if console_.group.status === 'REFUNDED'}
								The booking was refunded, so all seats have been released and the invite links no
								longer work. Nothing here can be changed.
							{:else}
								No further changes can be made to this booking.
							{/if}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Lead's own ticket -->
		{#if console_.lead.qrCodeUrl || console_.lead.qrCodeData}
			<div class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
				<h2 class="text-sm font-semibold text-gray-700">Your ticket</h2>
				<div class="mt-3 flex flex-wrap items-center gap-4">
					<img
						src={console_.lead.qrCodeUrl || console_.lead.qrCodeData}
						alt="Your ticket QR code"
						class="h-28 w-28 rounded-lg border border-gray-100"
					/>
					<div class="text-sm">
						<p class="font-medium text-gray-900">
							{[console_.lead.firstName, console_.lead.lastName].filter(Boolean).join(' ') ||
								console_.lead.email}
						</p>
						<p class="text-gray-500">{console_.lead.email}</p>
						{#if console_.lead.eventPasscode}
							<p class="mt-1 text-xs text-gray-400">
								Passcode <span class="font-mono">{console_.lead.eventPasscode}</span>
							</p>
						{/if}
						{#if console_.lead.checkedIn}
							<span class="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
								Checked in
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Seats -->
		<div class="rounded-xl border border-gray-200 bg-white">
			<div class="border-b border-gray-100 px-5 py-4">
				<h2 class="text-sm font-semibold text-gray-700">Your guests</h2>
				<p class="mt-0.5 text-xs text-gray-500">
					Every seat below is already paid for. If someone can't come, hand their seat to
					someone else — you won't be charged again.
				</p>
			</div>

			<div class="divide-y divide-gray-100">
				{#each console_.seats as seat (seat.email)}
					{@const chip = statusChip(seat)}
					<div class="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<p class="truncate text-sm font-medium text-gray-900">{seatName(seat)}</p>
								<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {chip.cls}">
									{chip.label}
								</span>
							</div>
							<p class="truncate text-xs text-gray-500">{seat.email}</p>

							{#if seat.status === 'DECLINED'}
								<p class="mt-1 text-xs text-amber-700">
									Declined {fmtDate(seat.declinedAt)}{#if seat.declineReason} — “{seat.declineReason}”{/if}.
									<span class="text-gray-500">The seat is still paid for.</span>
								</p>
							{:else if seat.status === 'INVITED'}
								<p class="mt-1 text-xs text-gray-400">
									Invited {fmtDate(seat.invitedAt)} · sent {seat.inviteSentCount} time{seat.inviteSentCount === 1 ? '' : 's'}
								</p>
							{:else if seat.status === 'CONFIRMED'}
								<p class="mt-1 text-xs text-gray-400">Confirmed {fmtDate(seat.confirmedAt)}</p>
							{/if}

							{#if seat.replacedEmail}
								<p class="mt-1 text-xs text-gray-400">Replaced {seat.replacedEmail}</p>
							{/if}
						</div>

						{#if !console_.group.isTerminal}
							<div class="flex shrink-0 flex-wrap gap-2">
								{#if seat.canResend}
									<button
										on:click={() => handleResend(seat)}
										disabled={busyEmail === seat.email}
										class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
									>
										{busyEmail === seat.email ? 'Sending…' : 'Resend invite'}
									</button>
								{:else if seat.resendCapReached && seat.status !== 'CONFIRMED'}
									<span class="rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-400">
										Resend limit reached
									</span>
								{/if}

								{#if seat.canReassign}
									<button
										on:click={() => openReassign(seat)}
										class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
									>
										Give to someone else
									</button>
								{:else if seat.checkedIn}
									<!-- A seat that has been scanned at the door can't be moved: that
									     person attended, and reassigning would hand a second person the
									     same admitted seat. -->
									<span class="rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-400">
										Already used
									</span>
								{:else if seat.status === 'CONFIRMED'}
									<span class="rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-400">
										Ticket claimed
									</span>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Link hygiene -->
		{#if !console_.group.isTerminal}
			<div class="mt-6 rounded-xl border border-gray-200 bg-white p-5">
				<h2 class="text-sm font-semibold text-gray-700">Link security</h2>
				<p class="mt-1 text-xs text-gray-500">
					Anyone who opens your management link can see this page. If you've forwarded it or think
					someone else has it, revoke it — every old link stops working immediately and we'll email
					you a new one.
				</p>
				{#if !showRevoke}
					<button
						on:click={() => {
							showRevoke = true;
							revokeError = '';
							revokeOtp = '';
							revokeOtpSentTo = '';
						}}
						class="mt-3 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
					>
						Revoke my management links
					</button>
				{:else}
					<div class="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
						{#if !revokeOtpSentTo}
							<p class="text-xs text-red-800">
								We'll email a 6-digit code to confirm it's you, then kill every existing link.
							</p>
							<button
								on:click={handleRequestRevokeOtp}
								disabled={revokeBusy}
								class="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
							>
								{revokeBusy ? 'Sending…' : 'Send code'}
							</button>
						{:else}
							<p class="text-xs text-red-800">Code sent to {revokeOtpSentTo}.</p>
							<input
								type="text"
								inputmode="numeric"
								maxlength="6"
								bind:value={revokeOtp}
								placeholder="000000"
								class="mt-2 w-32 rounded-md border border-red-200 px-3 py-2 font-mono text-sm tracking-widest focus:ring-1 focus:ring-red-300 focus:outline-none"
							/>
							<div class="mt-2 flex gap-2">
								<button
									on:click={handleRevoke}
									disabled={revokeBusy || revokeOtp.trim().length < 6}
									class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
								>
									{revokeBusy ? 'Revoking…' : 'Confirm revoke'}
								</button>
								<button
									on:click={() => (showRevoke = false)}
									class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
								>
									Cancel
								</button>
							</div>
						{/if}
						{#if revokeError}
							<p class="mt-2 text-xs text-red-700">{revokeError}</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<!-- Reassign modal -->
{#if reassignSeat}
	<div
		on:click={() => !reassignSubmitting && closeReassign()}
		on:keydown={(e) => e.key === 'Escape' && !reassignSubmitting && closeReassign()}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<h3 class="text-lg font-semibold text-gray-900">Give this seat to someone else</h3>
			<p class="mt-1 text-sm text-gray-500">
				Moving <span class="font-medium text-gray-800">{seatName(reassignSeat)}</span>'s seat. They'll
				lose access and the new person will get their own invite. No new charge.
			</p>

			{#if !otpSentTo}
				<div class="mt-4 space-y-3">
					<label class="block">
						<span class="text-xs text-gray-500">New attendee's email</span>
						<input
							type="email"
							bind:value={newEmail}
							placeholder="name@example.com"
							class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-pink-300 focus:outline-none"
						/>
					</label>
					<div class="grid grid-cols-2 gap-3">
						<label class="block">
							<span class="text-xs text-gray-500">First name (optional)</span>
							<input
								type="text"
								bind:value={newFirstName}
								class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-pink-300 focus:outline-none"
							/>
						</label>
						<label class="block">
							<span class="text-xs text-gray-500">Last name (optional)</span>
							<input
								type="text"
								bind:value={newLastName}
								class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-pink-300 focus:outline-none"
							/>
						</label>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-[#F8F9F9] p-3 text-xs text-gray-500">
					For your security we'll email a 6-digit code to the address that bought the tickets before
					making this change.
				</div>

				{#if reassignError}
					<p class="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-600">{reassignError}</p>
				{/if}

				<div class="mt-5 flex justify-end gap-2">
					<button
						on:click={closeReassign}
						class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						on:click={handleRequestOtp}
						disabled={otpRequesting || !newEmail.trim()}
						class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
					>
						{otpRequesting ? 'Sending code…' : 'Send code'}
					</button>
				</div>
			{:else}
				<div class="mt-4 rounded-lg bg-[#F8F9F9] p-3 text-xs text-gray-600">
					We emailed a 6-digit code to <span class="font-medium">{otpSentTo}</span>. Enter it below to
					move the seat to <span class="font-medium">{newEmail.trim().toLowerCase()}</span>.
				</div>

				<input
					type="text"
					inputmode="numeric"
					maxlength="6"
					bind:value={otp}
					placeholder="000000"
					class="mt-3 w-36 rounded-lg border border-gray-200 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:ring-1 focus:ring-pink-300 focus:outline-none"
				/>

				{#if reassignError}
					<p class="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-600">{reassignError}</p>
				{/if}

				<div class="mt-5 flex justify-end gap-2">
					<button
						on:click={() => (otpSentTo = '')}
						disabled={reassignSubmitting}
						class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						Back
					</button>
					<button
						on:click={handleReassign}
						disabled={reassignSubmitting || otp.trim().length < 6}
						class="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
					>
						{reassignSubmitting ? 'Moving seat…' : 'Confirm'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
