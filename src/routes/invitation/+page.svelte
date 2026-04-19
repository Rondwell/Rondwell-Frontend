<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let mounted = false;
	let status: 'loading' | 'loaded' | 'expired' | 'error' | 'declined' | 'already_processed' = 'loading';
	let message = '';
	let invitation: any = null;
	let declining = false;
	let floatingItems: { x: number; y: number; size: number; delay: number; duration: number }[] = [];

	const EVENT_URL = import.meta.env.VITE_EVENT_API_URL || import.meta.env.VITE_API_URL;

	onMount(async () => {
		mounted = true;
		floatingItems = Array.from({ length: 15 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 6 + 2,
			delay: Math.random() * 5,
			duration: Math.random() * 4 + 4
		}));

		const token = $page.url.searchParams.get('token');
		const eventId = $page.url.searchParams.get('eventId');
		const participantId = $page.url.searchParams.get('participantId');

		if (!token || !eventId || !participantId) {
			status = 'error';
			message = 'Invalid invitation link. Please check the link from your email.';
			return;
		}

		try {
			const res = await fetch(
				`${EVENT_URL}/api/v1/events/${eventId}/participants/invitation/${participantId}?token=${encodeURIComponent(token)}`
			);
			const data = await res.json();

			if (!res.ok) {
				if (data.message?.toLowerCase().includes('expired') || data.message?.toLowerCase().includes('not found')) {
					status = 'expired';
					message = 'This invitation link has expired or is no longer valid.';
				} else if (data.message?.toLowerCase().includes('already')) {
					status = 'already_processed';
					message = 'This invitation has already been responded to.';
				} else {
					status = 'error';
					message = data.message || 'Something went wrong loading this invitation.';
				}
				return;
			}

			invitation = data.data;

			if (invitation.status !== 'INVITED') {
				status = 'already_processed';
				message = invitation.status === 'APPROVED' || invitation.status === 'ACCEPTED'
					? 'You have already accepted this invitation.'
					: 'This invitation has already been processed.';
				return;
			}

			status = 'loaded';
		} catch (err: any) {
			status = 'error';
			message = 'Unable to load invitation details. Please try again later.';
		}
	});

	function getRoleLabel(role: string): string {
		if (role === 'SPEAKER') return 'Speaker';
		if (role === 'EXHIBITOR') return 'Exhibitor';
		if (role === 'VENDOR') return 'Vendor';
		return role;
	}

	function getRoleColor(role: string): { bg: string; text: string } {
		if (role === 'SPEAKER') return { bg: 'bg-purple-100', text: 'text-purple-600' };
		if (role === 'EXHIBITOR') return { bg: 'bg-orange-100', text: 'text-orange-600' };
		if (role === 'VENDOR') return { bg: 'bg-teal-100', text: 'text-teal-600' };
		return { bg: 'bg-gray-100', text: 'text-gray-600' };
	}

	function getInitials(name: string): string {
		if (!name) return '?';
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.charAt(0).toUpperCase();
	}

	function getRolePath(role: string): string {
		if (role === 'SPEAKER') return 'speaker';
		if (role === 'EXHIBITOR') return 'exhibitor';
		if (role === 'VENDOR') return 'vendor';
		return 'speaker';
	}

	function formatDate(d: string): string {
		if (!d) return '';
		return new Date(d).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function handleAccept() {
		const token = $page.url.searchParams.get('token');
		const eventId = $page.url.searchParams.get('eventId');
		const participantId = $page.url.searchParams.get('participantId');
		const role = invitation?.role || 'SPEAKER';
		const rolePath = getRolePath(role);

		// Redirect to auth with return URL pointing to the accept-invite endpoint
		const returnUrl = `/${rolePath}/invitations/${participantId}?token=${token}&eventId=${eventId}&action=accept`;
		goto(`/auth?returnUrl=${encodeURIComponent(returnUrl)}&inviteRole=${rolePath}`);
	}

	async function handleDecline() {
		const token = $page.url.searchParams.get('token');
		const eventId = $page.url.searchParams.get('eventId');
		const participantId = $page.url.searchParams.get('participantId');

		if (!token || !eventId || !participantId) return;

		declining = true;
		try {
			const res = await fetch(
				`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/decline-invite`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ inviteToken: token })
				}
			);

			if (res.ok) {
				status = 'declined';
				message = 'You have declined this invitation. The organizer will be notified.';
			} else {
				const data = await res.json();
				message = data.message || 'Failed to decline invitation.';
			}
		} catch {
			message = 'Something went wrong. Please try again.';
		} finally {
			declining = false;
		}
	}
</script>

<svelte:head>
	<title>{invitation?.event?.title ? `Invitation — ${invitation.event.title}` : 'Event Invitation'} — Rondwell</title>
</svelte:head>

<section class="invitation-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
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
		<!-- Loading State -->
		{#if status === 'loading'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-purple-500/10">
					<div class="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#DB3EC6]"></div>
				</div>
			</div>
			<div class="message-entrance" class:mounted>
				<p class="mt-6 text-sm text-[#919091]">Loading invitation details...</p>
			</div>

		<!-- Invitation Loaded -->
		{:else if status === 'loaded' && invitation}
			{@const roleColor = getRoleColor(invitation.role)}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-20 w-20 items-center justify-center rounded-full {roleColor.bg} shadow-lg">
					<span class="text-2xl font-semibold {roleColor.text}">{getInitials(invitation.displayName || invitation.email || '')}</span>
				</div>
			</div>

			<a href="/" class="logo-entrance mb-2 mt-5 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>

			<div class="message-entrance" class:mounted>
				<p class="mb-1 text-xs font-medium uppercase tracking-wider text-[#DB3EC6]">
					{getRoleLabel(invitation.role)} Invitation
				</p>
				<h1 class="mb-2 text-2xl font-semibold text-[#131517]">You're Invited!</h1>
				<p class="mb-6 max-w-md text-sm leading-relaxed text-[#919091]">
					You've been invited to participate as a <strong class="text-[#131517]">{getRoleLabel(invitation.role)}</strong> at an event on Rondwell.
				</p>
			</div>

			<!-- Event Card -->
			<div class="actions-entrance w-full" class:mounted>
				<div class="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white/90 shadow-lg shadow-purple-500/5 backdrop-blur-sm">
					<!-- Event Cover -->
					{#if invitation.event?.coverImageUrl}
						<div class="h-36 w-full overflow-hidden">
							<img src={invitation.event.coverImageUrl} alt={invitation.event.title} class="h-full w-full object-cover" />
						</div>
					{:else}
						<div class="flex h-28 w-full items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
							<svg class="h-10 w-10 text-[#DB3EC6]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
							</svg>
						</div>
					{/if}

					<div class="p-5 text-left">
						<h2 class="mb-3 text-lg font-bold text-[#131517]">{invitation.event?.title || 'Event'}</h2>

						<div class="space-y-2.5">
							{#if invitation.event?.startDate}
								<div class="flex items-center gap-2.5">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
										<svg class="h-4 w-4 text-[#DB3EC6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
										</svg>
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
										<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
										</svg>
									</div>
									<div>
										<p class="text-xs text-[#919091]">Location</p>
										<p class="text-sm font-medium text-[#131517]">{invitation.event.location}</p>
									</div>
								</div>
							{/if}

							{#if invitation.event?.organizerName}
								<div class="flex items-center gap-2.5">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
										<svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
										</svg>
									</div>
									<div>
										<p class="text-xs text-[#919091]">Organized by</p>
										<p class="text-sm font-medium text-[#131517]">{invitation.event.organizerName}</p>
									</div>
								</div>
							{/if}

							{#if invitation.event?.eventType}
								<div class="flex items-center gap-2.5">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
										<svg class="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
										</svg>
									</div>
									<div>
										<p class="text-xs text-[#919091]">Event Type</p>
										<p class="text-sm font-medium capitalize text-[#131517]">{invitation.event.eventType}</p>
									</div>
								</div>
							{/if}
						</div>

						{#if invitation.displayName}
							<div class="mt-4 rounded-lg bg-gray-50 p-3">
								<p class="text-xs text-[#919091]">Invited as</p>
								<p class="text-sm font-medium text-[#131517]">{invitation.displayName}</p>
							</div>
						{/if}

						<!-- Action Buttons -->
						<div class="mt-5 flex gap-3">
							<button
								on:click={handleAccept}
								class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#131517] py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
								</svg>
								Accept Invitation
							</button>
							<button
								on:click={handleDecline}
								disabled={declining}
								class="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
							>
								{declining ? 'Declining...' : 'Decline'}
							</button>
						</div>
					</div>
				</div>
			</div>

		<!-- Declined -->
		{:else if status === 'declined'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-gray-500/10">
					<svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
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
				<a href="/" class="inline-flex h-12 items-center gap-2 rounded-xl bg-[#333537] px-7 text-sm text-white transition-all duration-300 hover:bg-gray-900">
					Explore Rondwell
				</a>
			</div>

		<!-- Already Processed -->
		{:else if status === 'already_processed'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-blue-500/10">
					<svg class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
					</svg>
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
				<a href="/auth" class="inline-flex h-12 items-center gap-2 rounded-xl bg-[#333537] px-7 text-sm text-white transition-all duration-300 hover:bg-gray-900">
					Go to Dashboard
				</a>
			</div>

		<!-- Expired -->
		{:else if status === 'expired'}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-yellow-500/10">
					<svg class="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
				</div>
			</div>
			<a href="/" class="logo-entrance mb-4 mt-6 transition-opacity hover:opacity-80" class:mounted>
				<img src="/logo.svg" alt="Rondwell" class="h-7" />
			</a>
			<div class="message-entrance" class:mounted>
				<h1 class="mb-3 text-2xl font-semibold text-[#131517]">Invitation Expired</h1>
				<p class="mb-8 max-w-md text-sm leading-relaxed text-[#919091]">{message}</p>
			</div>

		<!-- Error -->
		{:else}
			<div class="status-icon-wrapper" class:mounted>
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-red-500/10">
					<svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
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