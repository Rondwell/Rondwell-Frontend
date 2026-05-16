<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		acceptAdminInvite,
		declineAdminInvite,
		getAdminInvitation
	} from '$lib/services/event.services';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { setPostAuthRedirect } from '$lib/utils/redirect';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	type Status =
		| 'loading'
		| 'loaded'
		| 'accepting'
		| 'accepted'
		| 'declining'
		| 'declined'
		| 'expired'
		| 'already_processed'
		| 'wrong_account'
		| 'error';

	let mounted = false;
	let status: Status = 'loading';
	let message = '';
	let invitation: any = null;
	let floatingItems: { x: number; y: number; size: number; delay: number; duration: number }[] = [];

	$: token = ($page.params as any).token as string;
	$: eventId = $page.url.searchParams.get('eventId') || '';

	onMount(async () => {
		mounted = true;
		floatingItems = Array.from({ length: 15 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 6 + 2,
			delay: Math.random() * 5,
			duration: Math.random() * 4 + 4
		}));

		if (!token || !eventId) {
			status = 'error';
			message = 'Invalid invitation link. Please check the link from your email.';
			return;
		}

		try {
			invitation = await getAdminInvitation(eventId, token);
			status = 'loaded';

			// If the page was opened with action=accept (post-login redirect), auto-accept.
			const action = $page.url.searchParams.get('action');
			if (action === 'accept' && browser && $isAuthenticated) {
				await handleAccept();
			}
		} catch (e: any) {
			if (e.code === 'EXPIRED') {
				status = 'expired';
				message = 'This invitation link has expired. Ask the organizer to resend the invite.';
			} else if (e.code === 'ALREADY_PROCESSED') {
				status = 'already_processed';
				message = e.message || 'This invitation has already been responded to.';
			} else if (e.code === 'NOT_FOUND') {
				status = 'error';
				message = 'We couldn’t find this invitation. The link may be incorrect.';
			} else {
				status = 'error';
				message = e.message || 'Unable to load invitation details. Please try again later.';
			}
		}
	});

	function getInitials(name: string): string {
		if (!name) return '?';
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.charAt(0).toUpperCase();
	}

	function formatDate(d: string | undefined): string {
		if (!d) return '';
		const date = new Date(d);
		if (isNaN(date.getTime())) return '';
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatExpiry(d: string | undefined): string {
		if (!d) return '';
		const date = new Date(d);
		if (isNaN(date.getTime())) return '';
		return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
	}

	async function handleAccept() {
		if (!token || !eventId) return;

		// If not logged in, save redirect target and bounce to /auth.
		if (browser && !$isAuthenticated) {
			setPostAuthRedirect(`/admin-invitation/${token}?eventId=${eventId}&action=accept`);
			goto(`/auth?returnUrl=${encodeURIComponent(`/admin-invitation/${token}?eventId=${eventId}&action=accept`)}`);
			return;
		}

		status = 'accepting';
		try {
			await acceptAdminInvite(eventId, token);
			status = 'accepted';
			message = 'Welcome aboard! Redirecting you to the event…';
			setTimeout(() => {
				goto(`/events/${eventId}`);
			}, 1600);
		} catch (e: any) {
			if (e.status === 403) {
				status = 'wrong_account';
				message =
					e.message ||
					'This invitation was sent to a different email address. Log in with the matching account.';
			} else if (e.status === 410) {
				status = 'expired';
				message = 'This invitation has expired.';
			} else if (e.status === 409) {
				status = 'already_processed';
				message = e.message || 'This invitation has already been responded to.';
			} else if (e.status === 401) {
				setPostAuthRedirect(`/admin-invitation/${token}?eventId=${eventId}&action=accept`);
				goto(`/auth?returnUrl=${encodeURIComponent(`/admin-invitation/${token}?eventId=${eventId}&action=accept`)}`);
			} else {
				status = 'error';
				message = e.message || 'Failed to accept invitation. Please try again.';
			}
		}
	}

	async function handleDecline() {
		if (!token || !eventId) return;
		status = 'declining';
		try {
			await declineAdminInvite(eventId, token);
			status = 'declined';
			message = 'You have declined this invitation. The organizer will be notified.';
		} catch (e: any) {
			status = 'error';
			message = e.message || 'Something went wrong. Please try again.';
		}
	}
</script>

<svelte:head>
	<title>{invitation?.event?.title ? `Co-organizer Invitation — ${invitation.event.title}` : 'Co-organizer Invitation'} — Rondwell</title>
</svelte:head>

<section
	class="invitation-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10"
>
	<div class="highlight highlight-1"></div>
	<div class="highlight highlight-2"></div>
	<div class="highlight highlight-3"></div>
	<div class="grid-overlay"></div>

	{#each floatingItems as particle}
		<span
			class="floating-particle"
			style="left: {particle.x}%; top: {particle.y}%; width: {particle.size}px; height: {particle.size}px; animation-delay: {particle.delay}s; animation-duration: {particle.duration}s;"
		></span>
	{/each}

	<div class="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center">
		{#if status === 'loading'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-purple-500/10">
					<div class="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#DB3EC6]"></div>
				</div>
			</div>
			<div class="message-entrance" class:mounted>
				<p class="mt-6 text-sm text-[#919091]">Loading invitation details…</p>
			</div>

		{:else if (status === 'loaded' || status === 'accepting' || status === 'declining') && invitation}
			<div class="status-icon-wrapper" class:mounted>
				<div
					class="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 shadow-lg shadow-purple-500/20"
				>
					<span class="text-2xl font-semibold text-[#DB3EC6]">
						{getInitials(invitation.displayName || invitation.email || invitation.organizerName || '')}
					</span>
				</div>
			</div>

			<a href="/" class="logo-entrance mb-2 mt-5 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>

			<div class="message-entrance" class:mounted>
				<p class="mb-1 text-xs font-medium uppercase tracking-wider text-[#DB3EC6]">
					Co-organizer Invitation
				</p>
				<h1 class="mb-2 text-2xl font-semibold text-[#131517]">You're Invited to Co-organize</h1>
				<p class="mx-auto mb-6 max-w-md text-sm leading-relaxed text-[#919091]">
					<strong class="text-[#131517]">{invitation.organizerName}</strong> wants you to help manage
					their event as a
					<strong class="text-[#131517]">{invitation.roleLabel}</strong>.
				</p>
				{#if invitation.roleDescription}
					<p class="mb-2 text-xs text-[#B3B5B7]">{invitation.roleDescription}</p>
				{/if}
			</div>

			<div class="actions-entrance w-full" class:mounted>
				<div
					class="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white/90 text-left shadow-lg shadow-purple-500/5 backdrop-blur-sm"
				>
					{#if invitation.event?.coverImageUrl}
						<div class="h-36 w-full overflow-hidden">
							<img
								src={invitation.event.coverImageUrl}
								alt={invitation.event.title}
								class="h-full w-full object-cover"
							/>
						</div>
					{:else}
						<div
							class="flex h-28 w-full items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50"
						>
							<Icon icon="mdi:calendar-star" class="h-10 w-10 text-[#DB3EC6]/30" />
						</div>
					{/if}

					<div class="p-5">
						<h2 class="mb-3 text-lg font-bold text-[#131517]">
							{invitation.event?.title || 'Event'}
						</h2>

						<div class="space-y-2.5">
							{#if invitation.event?.startDate}
								<div class="flex items-center gap-2.5">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
										<Icon icon="mdi:calendar-outline" class="h-4 w-4 text-[#DB3EC6]" />
									</div>
									<div>
										<p class="text-xs text-[#919091]">Date</p>
										<p class="text-sm font-medium text-[#131517]">{formatDate(invitation.event.startDate)}</p>
									</div>
								</div>
							{/if}

							{#if invitation.event?.location}
								<div class="flex items-center gap-2.5">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
										<Icon icon="mdi:map-marker-outline" class="h-4 w-4 text-blue-500" />
									</div>
									<div>
										<p class="text-xs text-[#919091]">Location</p>
										<p class="text-sm font-medium text-[#131517]">{invitation.event.location}</p>
									</div>
								</div>
							{/if}

							{#if invitation.organizerName}
								<div class="flex items-center gap-2.5">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
										<Icon icon="mdi:account-outline" class="h-4 w-4 text-green-500" />
									</div>
									<div>
										<p class="text-xs text-[#919091]">Organized by</p>
										<p class="text-sm font-medium text-[#131517]">{invitation.organizerName}</p>
									</div>
								</div>
							{/if}

							<div class="flex items-center gap-2.5">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-50">
									<Icon icon="mdi:shield-account-outline" class="h-4 w-4 text-[#DB3EC6]" />
								</div>
								<div>
									<p class="text-xs text-[#919091]">Your role</p>
									<p class="text-sm font-medium text-[#131517]">{invitation.roleLabel}</p>
								</div>
							</div>

							{#if invitation.expiresAt}
								<div class="flex items-center gap-2.5">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
										<Icon icon="mdi:clock-outline" class="h-4 w-4 text-orange-500" />
									</div>
									<div>
										<p class="text-xs text-[#919091]">Expires</p>
										<p class="text-sm font-medium text-[#131517]">{formatExpiry(invitation.expiresAt)}</p>
									</div>
								</div>
							{/if}
						</div>

						{#if invitation.personalMessage}
							<div class="mt-4 rounded-lg border-l-2 border-[#DB3EC6] bg-gray-50 p-3">
								<p class="text-xs text-[#919091]">Personal message</p>
								<p class="mt-1 text-sm italic text-[#131517]">“{invitation.personalMessage}”</p>
							</div>
						{/if}

						<div class="mt-5 flex gap-3">
							<button
								on:click={handleAccept}
								disabled={status === 'accepting' || status === 'declining'}
								class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#131517] py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg disabled:opacity-60"
							>
								{#if status === 'accepting'}
									<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
										<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"></circle>
										<path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
									</svg>
									Accepting…
								{:else}
									<Icon icon="mdi:check-bold" class="h-4 w-4" />
									Accept Invitation
								{/if}
							</button>
							<button
								on:click={handleDecline}
								disabled={status === 'accepting' || status === 'declining'}
								class="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-60"
							>
								{status === 'declining' ? 'Declining…' : 'Decline'}
							</button>
						</div>
					</div>
				</div>
			</div>

		{:else if status === 'accepted'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-green-500/10">
					<Icon icon="mdi:check-circle-outline" class="h-12 w-12 text-green-500" />
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Welcome aboard!</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>

		{:else if status === 'declined'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-gray-500/10">
					<Icon icon="mdi:close-circle-outline" class="h-12 w-12 text-gray-400" />
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Invitation Declined</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>
			<div class="actions-entrance" class:mounted>
				<a
					href="/"
					class="inline-flex h-12 items-center gap-2 rounded-xl bg-[#333537] px-7 text-sm text-white transition-all duration-300 hover:bg-gray-900"
				>
					Explore Rondwell
				</a>
			</div>

		{:else if status === 'already_processed'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-blue-500/10">
					<Icon icon="mdi:information-outline" class="h-12 w-12 text-blue-500" />
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Already Responded</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>
			<div class="actions-entrance" class:mounted>
				<a
					href="/auth"
					class="inline-flex h-12 items-center gap-2 rounded-xl bg-[#333537] px-7 text-sm text-white transition-all duration-300 hover:bg-gray-900"
				>
					Go to Dashboard
				</a>
			</div>

		{:else if status === 'expired'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-yellow-500/10">
					<Icon icon="mdi:clock-alert-outline" class="h-12 w-12 text-yellow-500" />
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Invitation Expired</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>

		{:else if status === 'wrong_account'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-orange-500/10">
					<Icon icon="mdi:account-alert-outline" class="h-12 w-12 text-orange-500" />
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Different account needed</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>
			<div class="actions-entrance flex gap-3" class:mounted>
				<a
					href={`/auth?returnUrl=${encodeURIComponent(`/admin-invitation/${token}?eventId=${eventId}&action=accept`)}`}
					class="inline-flex h-12 items-center gap-2 rounded-xl bg-[#333537] px-7 text-sm text-white transition-all duration-300 hover:bg-gray-900"
				>
					Switch account
				</a>
			</div>

		{:else}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-red-500/10">
					<Icon icon="mdi:alert-circle-outline" class="h-12 w-12 text-red-500" />
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Something Went Wrong</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>
		{/if}

		<div class="mt-10 flex items-center gap-2.5">
			<span class="dot dot-1"></span>
			<span class="dot dot-2"></span>
			<span class="dot dot-3"></span>
		</div>
	</div>
</section>

<style>
	.invitation-page {
		background: linear-gradient(0deg, rgba(251, 219, 231, 0.2), rgba(251, 219, 231, 0.2)), #ffffff;
		font-family: 'Merriweather Sans', system-ui, sans-serif;
	}
	.grid-overlay {
		position: absolute; inset: 0;
		background-image: linear-gradient(rgba(219, 62, 198, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(219, 62, 198, 0.03) 1px, transparent 1px);
		background-size: 60px 60px; z-index: 0;
	}
	.highlight { position: absolute; border-radius: 50%; z-index: 0; pointer-events: none; }
	.highlight-1 { width: 550px; height: 550px; left: -150px; top: -100px; background: rgba(231, 126, 231, 0.35); filter: blur(160px); animation: float-1 8s ease-in-out infinite; }
	.highlight-2 { width: 450px; height: 450px; right: -120px; bottom: 40px; background: rgba(81, 59, 226, 0.25); filter: blur(160px); animation: float-2 10s ease-in-out infinite; }
	.highlight-3 { width: 350px; height: 350px; left: 50%; top: 15%; transform: translateX(-50%); background: rgba(255, 195, 124, 0.2); filter: blur(140px); animation: float-3 12s ease-in-out infinite; }
	@keyframes float-1 { 0%, 100% { transform: translateY(0) translateX(0); } 33% { transform: translateY(-25px) translateX(10px); } 66% { transform: translateY(10px) translateX(-15px); } }
	@keyframes float-2 { 0%, 100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-30px) translateX(-10px); } }
	@keyframes float-3 { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-20px); } }
	.floating-particle { position: absolute; border-radius: 50%; background: linear-gradient(135deg, #DB3EC6, #513BE2); opacity: 0.15; z-index: 1; pointer-events: none; animation: particle-float linear infinite; }
	@keyframes particle-float { 0% { transform: translateY(0) scale(1); opacity: 0; } 10% { opacity: 0.15; } 90% { opacity: 0.15; } 100% { transform: translateY(-120px) scale(0.5); opacity: 0; } }
	.status-icon-wrapper { opacity: 0; transform: translateY(30px) scale(0.9); transition: opacity 1s ease, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
	.status-icon-wrapper.mounted { opacity: 1; transform: translateY(0) scale(1); }
	.logo-entrance { opacity: 0; transform: translateY(15px); transition: opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s; }
	.logo-entrance.mounted { opacity: 1; transform: translateY(0); }
	.message-entrance { opacity: 0; transform: translateY(15px); transition: opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s; }
	.message-entrance.mounted { opacity: 1; transform: translateY(0); }
	.actions-entrance { opacity: 0; transform: translateY(15px); transition: opacity 0.6s ease 0.7s, transform 0.6s ease 0.7s; }
	.actions-entrance.mounted { opacity: 1; transform: translateY(0); }
	.dot { display: block; width: 7px; height: 7px; border-radius: 50%; animation: pulse-dot 2s ease-in-out infinite; }
	.dot-1 { background: #DB3EC6; animation-delay: 0s; }
	.dot-2 { background: #8B3AD4; animation-delay: 0.3s; }
	.dot-3 { background: #513BE2; animation-delay: 0.6s; }
	@keyframes pulse-dot { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } }
</style>
