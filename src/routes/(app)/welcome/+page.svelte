<script lang="ts">
	import { page } from '$app/stores';
	import { safeInternalPath } from '$lib/security/safeUrl';

	$: fromEventPage = $page.url.searchParams.get('from') === 'event';
	$: eventName = $page.url.searchParams.get('eventName') ?? 'SPREAD THE WORD';
	$: userName = $page.url.searchParams.get('name') ?? '';

	$: header = fromEventPage ? 'Your Event is Launched 🎉' : 'Welcome to Rondwell';
	$: displayName = fromEventPage ? eventName.toUpperCase() : (userName.toUpperCase() || 'WELCOME');

	/**
	 * H-73 — the redirect target is validated as a same-origin PATH.
	 *
	 * This read `?redirect=` straight into `window.location.href` below with no
	 * scheme, host or same-origin check. The only gate was `?from=event`, which
	 * the attacker supplies too.
	 *
	 * That made it an open redirect — and because `javascript:…` is a valid
	 * value for `window.location.href`, **the only reflected XSS on the
	 * platform**: a link to
	 * `/welcome?from=event&redirect=javascript:fetch(...)` executed in the
	 * victim's session, on a page that looks like a normal post-signup screen.
	 *
	 * `safeInternalPath` accepts only a root-relative path and rejects the
	 * protocol-relative (`//evil.com`) and backslash (`/\evil.com`) forms
	 * browsers resolve externally. The one legitimate caller —
	 * `create-event/+page.svelte` — only ever passes a path.
	 */
	$: redirectTo = fromEventPage
		? safeInternalPath($page.url.searchParams.get('redirect'), '/overview')
		: '/overview';

	$: if (typeof window !== 'undefined') {
		setTimeout(() => {
			window.location.href = redirectTo;
		}, 2500);
	}
</script>

<section class="relative flex min-h-screen items-center justify-center bg-[#f4f1f0]">
	<div class="highlight highlight-1"></div>
	<div class="highlight highlight-2"></div>

	<div class="z-50 mx-auto space-y-4 text-center">
		<img src={fromEventPage ? '/add.svg' : '/face.svg'} alt="" class="mx-auto" />
		<span class="space-y-2">
			<h1 class="text-2xl font-medium text-white">{header}</h1>
			<p class="text-lg font-light text-white">{displayName}</p>
		</span>
	</div>
</section>

<style>
	.highlight {
		position: absolute;
		border-radius: 50%;
		z-index: 1;
	}

	.highlight-1 {
		width: 456.75px;
		height: 459.75px;
		left: 492px;
		top: 79.5px;
		background: rgba(231, 126, 231, 0.66);
		filter: blur(112.5px);
	}

	.highlight-2 {
		width: 392.25px;
		height: 273px;
		left: 514.5px;
		top: 36px;
		background: #dac5fe;
		filter: blur(112.5px);
	}
</style>
