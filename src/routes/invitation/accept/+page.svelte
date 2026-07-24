<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getToken } from '$lib/stores/auth.store';
	import { acceptParticipantInvite } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';

	type State = 'checking' | 'accepting' | 'success' | 'error';

	let state: State = 'checking';
	let message = '';
	let role = 'speaker';

	function dashboardPath(r: string): string {
		if (r === 'vendor') return '/vendor';
		if (r === 'exhibitor') return '/exhibitor';
		return '/speaker';
	}

	function roleLabel(r: string): string {
		if (r === 'vendor') return 'Vendor';
		if (r === 'exhibitor') return 'Exhibitor';
		return 'Speaker';
	}

	onMount(async () => {
		const participantId = $page.url.searchParams.get('participantId') || '';
		const token = $page.url.searchParams.get('token') || '';
		const eventId = $page.url.searchParams.get('eventId') || '';
		role = ($page.url.searchParams.get('role') || 'speaker').toLowerCase();

		if (!participantId || !token || !eventId) {
			state = 'error';
			message = 'This acceptance link is missing information. Please open the link from your email again.';
			return;
		}

		// Must be signed in so the backend can link this account to the invite.
		// Brand-new invitees get bounced to /auth to sign up + onboard, then
		// returned here to complete acceptance.
		if (!getToken()) {
			const returnUrl = `${$page.url.pathname}${$page.url.search}`;
			goto(`/auth?returnUrl=${encodeURIComponent(returnUrl)}&inviteRole=${role}`);
			return;
		}

		state = 'accepting';
		try {
			await acceptParticipantInvite(eventId, participantId, token);
			state = 'success';
			message = `You're in! Your ${roleLabel(role)} collaboration has been added to your dashboard.`;
			// Give the user a moment to read, then send them to their dashboard.
			setTimeout(() => goto(dashboardPath(role)), 2200);
		} catch (e: any) {
			const msg = (e?.message || '').toLowerCase();
			if (msg.includes('expired')) {
				state = 'error';
				message = 'This invitation link has expired. Please ask the organizer to resend it.';
			} else if (msg.includes('already')) {
				state = 'success';
				message = 'This invitation was already accepted. Redirecting you to your dashboard.';
				setTimeout(() => goto(dashboardPath(role)), 2000);
			} else {
				state = 'error';
				message = e?.message || 'We could not accept this invitation. Please try again.';
			}
		}
	});
</script>

<svelte:head>
	<title>Accepting Invitation — Rondwell</title>
</svelte:head>

<section class="flex min-h-screen flex-col items-center justify-center bg-[#FDFCFB] px-4">
	<div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
		{#if state === 'checking' || state === 'accepting'}
			<div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
				<Icon icon="line-md:loading-twotone-loop" class="text-3xl text-gray-700" />
			</div>
			<h1 class="text-lg font-semibold text-gray-800">
				{state === 'checking' ? 'Checking your invitation…' : 'Accepting your invitation…'}
			</h1>
			<p class="mt-2 text-sm text-gray-500">Hang tight, this only takes a moment.</p>
		{:else if state === 'success'}
			<div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
				<Icon icon="mdi:check-bold" class="text-3xl text-green-600" />
			</div>
			<h1 class="text-lg font-semibold text-gray-800">Invitation accepted</h1>
			<p class="mt-2 text-sm text-gray-500">{message}</p>
			<button
				on:click={() => goto(dashboardPath(role))}
				class="mt-6 rounded-md bg-black px-5 py-2.5 text-sm text-white shadow-xs"
			>
				Go to my dashboard
			</button>
		{:else}
			<div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
				<Icon icon="mdi:alert-circle-outline" class="text-3xl text-red-600" />
			</div>
			<h1 class="text-lg font-semibold text-gray-800">Something went wrong</h1>
			<p class="mt-2 text-sm text-gray-500">{message}</p>
			<button
				on:click={() => goto('/')}
				class="mt-6 rounded-md bg-gray-100 px-5 py-2.5 text-sm text-gray-700 shadow-xs"
			>
				Back to home
			</button>
		{/if}
	</div>
</section>
