<script lang="ts">
	import Icon from '@iconify/svelte';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { REST_ENDPOINTS, SCOPE_REFERENCE, WEBHOOK_EVENTS_DOC, ERROR_CODES_DOC } from './docsData';
	import TryItConsole from './TryItConsole.svelte';
	import SdkPlayground from './SdkPlayground.svelte';
	import Footer from '../(homePage)/components/Footer.svelte';
	import { toast } from '$lib/stores/toast.store';

	let search = '';
	let lang: 'curl' | 'node' | 'python' = 'curl';
	let activeSection = 'overview';
	let mobileNavOpen = false;

	const NAV_SECTIONS = [
		{ id: 'overview', shortLabel: 'Overview', label: 'Overview & Base URLs' },
		{ id: 'auth-keys', shortLabel: 'Auth & Keys', label: 'API Keys & IP Whitelisting' },
		{ id: 'sdk-event-page', shortLabel: 'Event SDK', label: 'Event Page Web SDK (Modal & Seats)' },
		{ id: 'sdk-collection', shortLabel: 'Collection SDK', label: 'Collection Web SDK' },
		{ id: 'rest-api', shortLabel: 'REST API', label: 'REST API Reference' },
		{ id: 'console', shortLabel: 'Console', label: 'Interactive API Console' },
		{ id: 'webhooks', shortLabel: 'Webhooks', label: 'Webhooks & Signatures' },
		{ id: 'errors', shortLabel: 'Errors', label: 'RFC 9457 Error Codes' },
	];

	$: filteredEndpoints = REST_ENDPOINTS.filter((ep) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return (
			ep.title.toLowerCase().includes(q) ||
			ep.path.toLowerCase().includes(q) ||
			ep.summary.toLowerCase().includes(q)
		);
	});

	function copyCode(text: string) {
		navigator.clipboard?.writeText(text);
		toast.success('Copied to clipboard');
	}

	function selectSection(id: string) {
		activeSection = id;
		mobileNavOpen = false;
	}

	// csp-ignore-next-line — copyable SDK HTML installation snippet for external websites
	const eventHtmlSnippet = `<button\n  data-rondwell-event="your-event-slug"\n  data-rondwell-pk="rw_live_pub_your_sdk_key"\n  data-rondwell-theme="light"\n  data-rondwell-primary="#7C3AED"\n  data-rondwell-radius="12"\n  data-rondwell-redirect="https://yoursite.com/thank-you"\n>\n  Register for Event\n</button>\n<script src="https://rondwell.com/sdk/v1/rondwell.js" async><\/script>`;

	const eventJsSnippet = `import Rondwell from '@rondwell/web-sdk';\n\nRondwell.init({ publishableKey: 'rw_live_pub_your_sdk_key', primaryColor: '#7C3AED' });\n\ndocument.getElementById('buy-btn').addEventListener('click', () => {\n  Rondwell.openEventModal('your-event-slug', {\n    theme: 'light',\n    showSeatMap: true,\n    redirectUrl: 'https://yoursite.com/confirmed',\n    onSeatSelected: ({ seatNumber }) => console.log('Seat chosen:', seatNumber),\n    onSuccess: (reg) => {\n      // Persist reg.registrationId, reg.seatId, reg.email to your database\n      console.log('Completed registration:', reg);\n    },\n  });\n});`;

	// csp-ignore-next-line — copyable Collection SDK HTML snippet for external websites
	const collectionSnippet = `<div\n  id="my-collection-events"\n  data-rondwell-collection="lagos-tech-week"\n  data-rondwell-pk="rw_live_pub_your_sdk_key"\n  data-rondwell-layout="grid"\n  data-rondwell-open-mode="modal"\n  data-rondwell-primary="#7C3AED"\n  data-rondwell-redirect="https://yoursite.com/registered"\n></div>\n<script src="https://rondwell.com/sdk/v1/rondwell.js" async><\/script>`;

	const webhookVerifyNode = `import crypto from 'crypto';\n\nexport function verifyRondwellSignature(rawBody, signatureHeader, secret) {\n  const parts = Object.fromEntries(signatureHeader.split(',').map((kv) => kv.trim().split('=')));\n  const expected = crypto.createHmac('sha256', secret).update(\`\${parts.t}.\${rawBody}\`).digest('hex');\n  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parts.v1 || '', 'hex'));\n}`;
</script>

<svelte:head>
	<title>Rondwell Developer Platform — API &amp; Web SDK Documentation</title>
</svelte:head>

<div class="min-h-screen overflow-x-clip bg-slate-50 text-slate-900">
	<!-- Top Bar -->
	<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
		<div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4 sm:px-6">
			<div class="flex min-w-0 items-center gap-2 sm:gap-3">
				<a href="/" class="flex shrink-0 items-center gap-2">
					<img src="/logo.svg" alt="Rondwell" class="h-6 w-auto" />
				</a>
				<span class="truncate rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 sm:text-xs">
					API v1 &amp; Web SDK
				</span>
			</div>

			<!-- Desktop Header Actions -->
			<div class="hidden items-center gap-2 lg:flex">
				{#if $isAuthenticated}
					<a href="/settings?tab=developers" class="rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white no-underline hover:bg-purple-700">
						Manage API Keys &amp; Webhooks
					</a>
					<a href="/events" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 no-underline hover:bg-slate-50">
						Event SDK Settings
					</a>
					<a href="/collection" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 no-underline hover:bg-slate-50">
						Collection SDK Settings
					</a>
				{:else}
					<a href="/auth?returnUrl=/api-docs" class="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white no-underline hover:bg-slate-800">
						Sign in to Generate API Keys
					</a>
				{/if}
			</div>

			<!-- Mobile Header Actions + Menu Drawer Button -->
			<div class="flex shrink-0 items-center gap-2 lg:hidden">
				{#if $isAuthenticated}
					<a href="/settings?tab=developers" class="inline-flex min-h-[36px] items-center rounded-lg bg-purple-600 px-3 text-xs font-semibold text-white no-underline">
						API Keys
					</a>
				{:else}
					<a href="/auth?returnUrl=/api-docs" class="inline-flex min-h-[36px] items-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white no-underline">
						Sign in
					</a>
				{/if}
				<button
					type="button"
					aria-label={mobileNavOpen ? 'Close documentation menu' : 'Open documentation menu'}
					aria-expanded={mobileNavOpen}
					on:click={() => (mobileNavOpen = !mobileNavOpen)}
					class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50"
				>
					<Icon icon={mobileNavOpen ? 'solar:close-circle-bold-duotone' : 'solar:hamburger-menu-linear'} class="h-5 w-5" />
				</button>
			</div>
		</div>

		<!-- Mobile Sticky Quick-Jump Pill Strip -->
		<div class="border-t border-slate-100 bg-slate-50/90 px-4 py-2 lg:hidden">
			<div class="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
				{#each NAV_SECTIONS as sec}
					<a
						href="#{sec.id}"
						on:click={() => selectSection(sec.id)}
						class="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold no-underline transition {activeSection === sec.id ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'}"
					>
						{sec.shortLabel}
					</a>
				{/each}
			</div>
		</div>

		<!-- Mobile Slide-Down Search & Endpoint Directory -->
		{#if mobileNavOpen}
			<div class="max-h-[75dvh] overflow-y-auto border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
				<div class="space-y-3">
					<input
						type="search"
						bind:value={search}
						placeholder="Search endpoints & topics…"
						class="min-h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-purple-500 focus:bg-white"
					/>

					{#if $isAuthenticated}
						<div class="grid grid-cols-2 gap-2">
							<a href="/events" on:click={() => (mobileNavOpen = false)} class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 no-underline">
								Event SDK Settings
							</a>
							<a href="/collection" on:click={() => (mobileNavOpen = false)} class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 no-underline">
								Collection SDK Settings
							</a>
						</div>
					{/if}

					<div>
						<p class="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Guides &amp; Sections</p>
						<div class="grid grid-cols-2 gap-1.5">
							{#each NAV_SECTIONS as sec}
								<a
									href="#{sec.id}"
									on:click={() => selectSection(sec.id)}
									class="rounded-lg px-2.5 py-2 text-xs font-semibold no-underline {activeSection === sec.id ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-50'}"
								>
									{sec.shortLabel}
								</a>
							{/each}
						</div>
					</div>

					<div>
						<p class="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoints ({filteredEndpoints.length})</p>
						<div class="space-y-1">
							{#each filteredEndpoints as ep}
								<a
									href="#{ep.id}"
									on:click={() => (mobileNavOpen = false)}
									class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-700 no-underline hover:bg-slate-50"
								>
									<span class="w-10 shrink-0 font-mono text-[10px] font-bold {ep.method === 'GET' ? 'text-emerald-600' : 'text-purple-600'}">{ep.method}</span>
									<span class="truncate">{ep.title}</span>
								</a>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</header>

	<div class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-12">
		<!-- Desktop Left Sidebar -->
		<aside class="hidden min-w-0 lg:block lg:col-span-3">
			<div class="sticky top-20 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto pr-1">
				<input
					type="search"
					bind:value={search}
					placeholder="Filter endpoints & topics…"
					class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-sm outline-none focus:border-purple-500"
				/>
				<nav class="space-y-1 rounded-2xl border border-slate-200 bg-white p-3">
					{#each NAV_SECTIONS as sec}
						<a
							href="#{sec.id}"
							on:click={() => (activeSection = sec.id)}
							class="block rounded-lg px-3 py-2 text-xs font-semibold no-underline transition {activeSection === sec.id ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
						>
							{sec.label}
						</a>
					{/each}
					<div class="my-2 border-t border-slate-100"></div>
					<p class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoints</p>
					{#each filteredEndpoints as ep}
						<a href="#{ep.id}" class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-600 no-underline hover:bg-slate-50">
							<span class="w-10 shrink-0 font-mono text-[10px] font-bold {ep.method === 'GET' ? 'text-emerald-600' : 'text-purple-600'}">{ep.method}</span>
							<span class="truncate">{ep.title}</span>
						</a>
					{/each}
				</nav>
			</div>
		</aside>

		<!-- Main Content (`min-w-0` prevents grid tracks from blowing past 100vw on mobile) -->
		<main class="min-w-0 space-y-8 sm:space-y-10 lg:col-span-9 lg:space-y-12">
			<!-- Hero / Overview -->
			<section id="overview" class="min-w-0 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-24 lg:p-8">
				<h1 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Rondwell Event Infrastructure API &amp; Web SDKs</h1>
				<p class="mt-3 text-sm leading-relaxed text-slate-600">
					Power ticketing, interactive seat-map checkout modals, collection storefronts, bulk attendee imports, signed QR door check-in, and real-time 360° analytics directly inside your own web applications.
				</p>

				{#if $isAuthenticated}
					<div class="mt-5 flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="min-w-0 text-xs text-purple-900">
							<p class="font-bold">Signed in and ready to integrate</p>
							<p class="mt-0.5 opacity-80">Generate account-wide API keys &amp; IP whitelists in Account Settings, or customize colors per Event/Collection.</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<a href="/settings?tab=developers" class="rounded-lg bg-purple-700 px-3 py-2 text-xs font-semibold text-white no-underline">Account API Settings</a>
							<a href="/events" class="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-800 no-underline">Pick Event to Embed</a>
						</div>
					</div>
				{/if}

				<div class="mt-6 grid gap-3 text-xs sm:grid-cols-3">
					<div class="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
						<p class="font-semibold text-slate-500">REST API Base URL</p>
						<!-- csp-ignore-next-line — documentation display string -->
						<code class="mt-1 block break-all font-mono font-bold text-slate-900">https://api.rondwell.com/v1</code>
					</div>
					<div class="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
						<p class="font-semibold text-slate-500">Browser Web SDK CDN</p>
						<!-- csp-ignore-next-line — documentation display string -->
						<code class="mt-1 block break-all font-mono font-bold text-slate-900">https://rondwell.com/sdk/v1/rondwell.js</code>
					</div>
					<div class="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
						<p class="font-semibold text-slate-500">Wire Format &amp; Spec</p>
						<p class="mt-1 break-words font-semibold text-slate-900">snake_case JSON · OpenAPI 3.1 (<code class="font-mono">/v1/openapi.json</code>)</p>
					</div>
				</div>
			</section>

			<!-- Auth, Keys & IP Whitelisting -->
			<section id="auth-keys" class="min-w-0 scroll-mt-28 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-24 lg:p-8">
				<h2 class="text-lg font-bold sm:text-xl">Authentication, Keys &amp; IP Whitelisting</h2>
				<p class="text-sm text-slate-600">
					Rondwell separates server credentials from browser SDK credentials so a single account cleanly governs every event and collection you own:
				</p>
				<div class="grid gap-4 text-xs sm:grid-cols-2">
					<div class="min-w-0 rounded-xl border border-slate-200 p-4">
						<span class="inline-block rounded-full bg-purple-100 px-2.5 py-0.5 font-bold text-purple-700">Secret Keys (`rw_live_...`)</span>
						<p class="mt-2 leading-relaxed text-slate-600">
							Passed via <code class="break-all font-mono">Authorization: Bearer rw_live_...</code> from your backend. Supports granular scopes, zero-downtime 24h key rolling, idempotency keys, and strict IPv4/IPv6 CIDR <strong>IP Whitelisting</strong>.
						</p>
					</div>
					<div class="min-w-0 rounded-xl border border-slate-200 p-4">
						<span class="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 font-bold text-indigo-700">Publishable SDK Keys (`rw_live_pub_...`)</span>
						<p class="mt-2 leading-relaxed text-slate-600">
							Safe to embed in frontend HTML/React apps. Restricted by <strong>Allowed Origins</strong> (including wildcard subdomains like <code class="break-all font-mono">https://*.yoursite.com</code>) and read-only/SDK scopes.
						</p>
					</div>
				</div>

				<h3 class="pt-2 text-sm font-bold text-slate-900">Supported Scopes ({SCOPE_REFERENCE.length})</h3>
				<div class="grid gap-2 text-xs sm:grid-cols-2">
					{#each SCOPE_REFERENCE as item}
						<div class="flex min-w-0 flex-col items-start gap-1.5 rounded-lg bg-slate-50 p-2.5 sm:flex-row sm:items-center sm:gap-2">
							<code class="shrink-0 rounded border bg-white px-1.5 py-0.5 font-mono font-semibold text-purple-700">{item.scope}</code>
							<span class="text-slate-600">{item.description}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- Event Page Web SDK -->
			<section id="sdk-event-page" class="min-w-0 scroll-mt-28 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-24 lg:p-8">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-lg font-bold sm:text-xl">Event Page Web SDK (Modal Checkout, Seat Picker &amp; Redirect)</h2>
					<a href="/events" class="text-xs font-semibold text-purple-700 hover:underline">Configure colors per Event →</a>
				</div>
				<p class="text-sm text-slate-600">
					Launch a branded Rondwell registration modal right over your own website when visitors click a button. Supports ticket tier selection, interactive 2D/3D seat picking, coupons, Paystack/Stripe settlement, <code class="font-mono">onSuccess</code> callbacks, and post-registration <code class="font-mono">redirectUrl</code> persistence.
				</p>

				<div class="min-w-0 space-y-3">
					<div class="flex items-center justify-between gap-2">
						<p class="text-xs font-bold uppercase tracking-wider text-slate-500">1. Declarative HTML Button</p>
						<button type="button" on:click={() => copyCode(eventHtmlSnippet)} class="shrink-0 rounded px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50">Copy</button>
					</div>
					<pre class="max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100 sm:p-4 sm:text-xs"><code>{eventHtmlSnippet}</code></pre>

					<div class="flex items-center justify-between gap-2 pt-2">
						<p class="text-xs font-bold uppercase tracking-wider text-slate-500">2. Imperative JavaScript / TypeScript SDK</p>
						<button type="button" on:click={() => copyCode(eventJsSnippet)} class="shrink-0 rounded px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50">Copy</button>
					</div>
					<pre class="max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100 sm:p-4 sm:text-xs"><code>{eventJsSnippet}</code></pre>
				</div>

				<SdkPlayground />
			</section>

			<!-- Collection Web SDK -->
			<section id="sdk-collection" class="min-w-0 scroll-mt-28 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-24 lg:p-8">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-lg font-bold sm:text-xl">Collection Web SDK</h2>
					<a href="/collection" class="text-xs font-semibold text-purple-700 hover:underline">Customize in Collection Settings →</a>
				</div>
				<p class="text-sm text-slate-600">
					Automatically pull all events in a Rondwell Collection with tag filters, search, and custom Grid/List/Cards layouts. Clicking Register on any event inside the widget seamlessly opens the Event Page SDK Modal on your site.
				</p>
				<div class="flex items-center justify-between gap-2">
					<p class="text-xs font-bold uppercase tracking-wider text-slate-500">Embed Collection Feed</p>
					<button type="button" on:click={() => copyCode(collectionSnippet)} class="shrink-0 rounded px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50">Copy</button>
				</div>
				<pre class="max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100 sm:p-4 sm:text-xs"><code>{collectionSnippet}</code></pre>
			</section>

			<!-- REST API Reference -->
			<section id="rest-api" class="min-w-0 scroll-mt-28 space-y-5 lg:scroll-mt-24">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h2 class="text-lg font-bold sm:text-xl">REST API Endpoints</h2>
					<div class="grid grid-cols-3 gap-1.5 sm:flex">
						{#each [['curl', 'cURL'], ['node', 'Node.js'], ['python', 'Python']] as [id, label]}
							<button
								type="button"
								on:click={() => (lang = id as any)}
								class="min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition {lang === id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'}"
							>
								{label}
							</button>
						{/each}
					</div>
				</div>

				{#each filteredEndpoints as ep}
					<article id={ep.id} class="min-w-0 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-24">
						<div class="flex flex-wrap items-center gap-2">
							<span class="rounded-md px-2 py-0.5 font-mono text-xs font-bold {ep.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}">{ep.method}</span>
							<code class="break-all font-mono text-xs font-bold text-slate-900 sm:text-sm">{ep.path}</code>
							<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 sm:ml-auto">Scope: {ep.scope}</span>
						</div>
						<h3 class="mt-3 text-base font-bold text-slate-900">{ep.title}</h3>
						<p class="mt-1 text-sm leading-relaxed text-slate-600">{ep.summary}</p>

						{#if ep.params.length > 0}
							<!-- Mobile Stacked Params -->
							<div class="mt-4 space-y-2 sm:hidden">
								{#each ep.params as p}
									<div class="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
										<div class="flex items-center justify-between gap-2">
											<span class="font-mono font-bold text-slate-900">{p.name}{p.required ? '*' : ''}</span>
											<span class="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{p.location} · {p.type}</span>
										</div>
										<p class="mt-1 text-slate-600">{p.description}</p>
									</div>
								{/each}
							</div>

							<!-- Desktop Parameter Table -->
							<div class="mt-4 hidden overflow-x-auto sm:block">
								<table class="w-full text-left text-xs">
									<thead><tr class="border-b text-slate-500"><th class="py-1.5 pr-3">Parameter</th><th class="py-1.5 pr-3">In</th><th class="py-1.5 pr-3">Type</th><th class="py-1.5">Description</th></tr></thead>
									<tbody>
										{#each ep.params as p}
											<tr class="border-b border-slate-100">
												<td class="py-1.5 pr-3 font-mono font-semibold">{p.name}{p.required ? '*' : ''}</td>
												<td class="py-1.5 pr-3 text-slate-500">{p.location}</td>
												<td class="py-1.5 pr-3 font-mono">{p.type}</td>
												<td class="py-1.5 text-slate-600">{p.description}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}

						<div class="mt-4 grid gap-4 lg:grid-cols-2">
							<div class="min-w-0">
								<p class="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Request ({lang})</p>
								<pre class="max-h-56 max-w-full overflow-auto rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100 sm:text-xs"><code>{lang === 'curl' ? ep.curlExample : lang === 'node' ? ep.nodeExample : ep.pythonExample}</code></pre>
							</div>
							<div class="min-w-0">
								<p class="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sample Response</p>
								<pre class="max-h-56 max-w-full overflow-auto rounded-xl bg-slate-900 p-3.5 font-mono text-[11px] leading-relaxed text-emerald-300 sm:text-xs"><code>{ep.responseExample}</code></pre>
							</div>
						</div>
					</article>
				{/each}
			</section>

			<!-- Interactive Console -->
			<section id="console" class="min-w-0 scroll-mt-28 lg:scroll-mt-24">
				<TryItConsole />
			</section>

			<!-- Webhooks -->
			<section id="webhooks" class="min-w-0 scroll-mt-28 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-24 lg:p-8">
				<h2 class="text-lg font-bold sm:text-xl">Webhooks &amp; HMAC-SHA256 Verification</h2>
				<p class="text-sm text-slate-600">
					Every delivery includes <code class="break-all font-mono">Rondwell-Signature: t=&lt;unix_ts&gt;,v1=&lt;hmac_hex&gt;</code>, SSRF protection, and automatic exponential backoff retries across 6 attempts.
				</p>
				<pre class="max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100 sm:p-4 sm:text-xs"><code>{webhookVerifyNode}</code></pre>
				<div class="grid gap-2 text-xs sm:grid-cols-2">
					{#each WEBHOOK_EVENTS_DOC as wh}
						<div class="min-w-0 rounded-lg bg-slate-50 p-2.5">
							<code class="break-all font-mono font-bold text-purple-700">{wh.event}</code>
							<p class="mt-0.5 text-slate-600">{wh.description}</p>
						</div>
					{/each}
				</div>
			</section>

			<!-- Error Codes -->
			<section id="errors" class="min-w-0 scroll-mt-28 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-24 lg:p-8">
				<h2 class="text-lg font-bold sm:text-xl">RFC 9457 Error Reference (<code class="font-mono text-xs sm:text-sm">application/problem+json</code>)</h2>

				<!-- Mobile Stacked Error Cards -->
				<div class="space-y-2 sm:hidden">
					{#each ERROR_CODES_DOC as er}
						<div class="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
							<div class="flex items-center gap-2">
								<span class="rounded bg-slate-900 px-2 py-0.5 font-mono font-bold text-white">{er.status}</span>
								<code class="break-all font-mono font-semibold text-rose-700">{er.code}</code>
							</div>
							<p class="mt-1.5 text-slate-600">{er.description}</p>
						</div>
					{/each}
				</div>

				<!-- Desktop Error Table -->
				<div class="hidden overflow-x-auto sm:block">
					<table class="w-full text-left text-xs">
						<thead><tr class="border-b text-slate-500"><th class="py-2 pr-3">HTTP</th><th class="py-2 pr-3">Canonical Code</th><th class="py-2">Meaning</th></tr></thead>
						<tbody>
							{#each ERROR_CODES_DOC as er}
								<tr class="border-b border-slate-100">
									<td class="py-2 pr-3 font-mono font-bold">{er.status}</td>
									<td class="py-2 pr-3 font-mono text-rose-700">{er.code}</td>
									<td class="py-2 text-slate-600">{er.description}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		</main>
	</div>

	<Footer />
</div>
