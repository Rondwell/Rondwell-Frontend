<script lang="ts">
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { REST_ENDPOINTS, SCOPE_REFERENCE, WEBHOOK_EVENTS_DOC, ERROR_CODES_DOC } from './docsData';
	import TryItConsole from './TryItConsole.svelte';
	import SdkPlayground from './SdkPlayground.svelte';
	import { toast } from '$lib/stores/toast.store';

	let search = '';
	let lang: 'curl' | 'node' | 'python' = 'curl';
	let activeSection = 'overview';

	const NAV_SECTIONS = [
		{ id: 'overview', label: 'Overview & Base URLs' },
		{ id: 'auth-keys', label: 'API Keys & IP Whitelisting' },
		{ id: 'sdk-event-page', label: 'Event Page Web SDK (Modal & Seats)' },
		{ id: 'sdk-collection', label: 'Collection Web SDK' },
		{ id: 'rest-api', label: 'REST API Reference' },
		{ id: 'webhooks', label: 'Webhooks & Signatures' },
		{ id: 'errors', label: 'RFC 9457 Error Codes' },
		{ id: 'console', label: 'Interactive API Console' },
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

<div class="min-h-screen bg-slate-50 text-slate-900">
	<!-- Top Bar -->
	<header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
		<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
			<div class="flex items-center gap-3">
				<a href="/" class="flex items-center gap-2">
					<img src="/logo.svg" alt="Rondwell" class="h-6 w-auto" />
				</a>
				<span class="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">API v1 &amp; Web SDK</span>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#if $isAuthenticated}
					<a href="/settings?tab=developers" class="rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-700">
						Manage API Keys &amp; Webhooks
					</a>
					<a href="/events" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
						Event SDK Settings
					</a>
					<a href="/collection" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
						Collection SDK Settings
					</a>
				{:else}
					<a href="/auth?returnUrl=/api-docs" class="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
						Sign in to Generate API Keys
					</a>
				{/if}
			</div>
		</div>
	</header>

	<div class="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12">
		<!-- Left Sidebar -->
		<aside class="lg:col-span-3">
			<div class="sticky top-20 space-y-4">
				<input
					type="search"
					bind:value={search}
					placeholder="Filter endpoints &amp; topics…"
					class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-sm outline-none focus:border-purple-500"
				/>
				<nav class="space-y-1 rounded-2xl border border-slate-200 bg-white p-3">
					{#each NAV_SECTIONS as sec}
						<a
							href="#{sec.id}"
							on:click={() => (activeSection = sec.id)}
							class="block rounded-lg px-3 py-2 text-xs font-semibold transition {activeSection === sec.id ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
						>
							{sec.label}
						</a>
					{/each}
					<div class="my-2 border-t border-slate-100"></div>
					<p class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoints</p>
					{#each filteredEndpoints as ep}
						<a href="#{ep.id}" class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
							<span class="w-10 shrink-0 font-mono text-[10px] font-bold {ep.method === 'GET' ? 'text-emerald-600' : 'text-purple-600'}">{ep.method}</span>
							<span class="truncate">{ep.title}</span>
						</a>
					{/each}
				</nav>
			</div>
		</aside>

		<!-- Main Content -->
		<main class="space-y-12 lg:col-span-9">
			<!-- Hero / Overview -->
			<section id="overview" class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
				<h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Rondwell Event Infrastructure API &amp; Web SDKs</h1>
				<p class="mt-3 text-sm leading-relaxed text-slate-600">
					Power ticketing, interactive seat-map checkout modals, collection storefronts, bulk attendee imports, signed QR door check-in, and real-time 360° analytics directly inside your own web applications.
				</p>

				{#if $isAuthenticated}
					<div class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
						<div class="text-xs text-purple-900">
							<p class="font-bold">Signed in and ready to integrate</p>
							<p class="mt-0.5 opacity-80">Generate account-wide API keys &amp; IP whitelists in Account Settings, or customize colors per Event/Collection.</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<a href="/settings?tab=developers" class="rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white">Account API Settings</a>
							<a href="/events" class="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-purple-800 border border-purple-200">Pick Event to Embed</a>
						</div>
					</div>
				{/if}

				<div class="mt-6 grid gap-3 sm:grid-cols-3 text-xs">
					<div class="rounded-xl bg-slate-50 p-4 border border-slate-200">
						<p class="font-semibold text-slate-500">REST API Base URL</p>
						<!-- csp-ignore-next-line — documentation display string -->
						<code class="mt-1 block font-mono font-bold text-slate-900">https://api.rondwell.com/v1</code>
					</div>
					<div class="rounded-xl bg-slate-50 p-4 border border-slate-200">
						<p class="font-semibold text-slate-500">Browser Web SDK CDN</p>
						<!-- csp-ignore-next-line — documentation display string -->
						<code class="mt-1 block font-mono font-bold text-slate-900">https://rondwell.com/sdk/v1/rondwell.js</code>
					</div>
					<div class="rounded-xl bg-slate-50 p-4 border border-slate-200">
						<p class="font-semibold text-slate-500">Wire Format &amp; Spec</p>
						<p class="mt-1 font-semibold text-slate-900">snake_case JSON · OpenAPI 3.1 (<code class="font-mono">/v1/openapi.json</code>)</p>
					</div>
				</div>
			</section>

			<!-- Auth, Keys & IP Whitelisting -->
			<section id="auth-keys" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
				<h2 class="text-xl font-bold">Authentication, Keys &amp; IP Whitelisting</h2>
				<p class="text-sm text-slate-600">
					Rondwell separates server credentials from browser SDK credentials so a single account cleanly governs every event and collection you own:
				</p>
				<div class="grid gap-4 sm:grid-cols-2 text-xs">
					<div class="rounded-xl border border-slate-200 p-4">
						<span class="rounded-full bg-purple-100 px-2.5 py-0.5 font-bold text-purple-700">Secret Keys (`rw_live_...`)</span>
						<p class="mt-2 leading-relaxed text-slate-600">
							Passed via <code class="font-mono">Authorization: Bearer rw_live_...</code> from your backend. Supports granular scopes, zero-downtime 24h key rolling, idempotency keys, and strict IPv4/IPv6 CIDR <strong>IP Whitelisting</strong>.
						</p>
					</div>
					<div class="rounded-xl border border-slate-200 p-4">
						<span class="rounded-full bg-indigo-100 px-2.5 py-0.5 font-bold text-indigo-700">Publishable SDK Keys (`rw_live_pub_...`)</span>
						<p class="mt-2 leading-relaxed text-slate-600">
							Safe to embed in frontend HTML/React apps. Restricted by <strong>Allowed Origins</strong> (including wildcard subdomains like <code class="font-mono">https://*.yoursite.com</code>) and read-only/SDK scopes.
						</p>
					</div>
				</div>

				<h3 class="pt-2 text-sm font-bold text-slate-900">Supported Scopes ({SCOPE_REFERENCE.length})</h3>
				<div class="grid gap-2 sm:grid-cols-2 text-xs">
					{#each SCOPE_REFERENCE as item}
						<div class="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
							<code class="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono font-semibold text-purple-700 border">{item.scope}</code>
							<span class="text-slate-600">{item.description}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- Event Page Web SDK -->
			<section id="sdk-event-page" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-xl font-bold">Event Page Web SDK (Modal Checkout, Seat Picker &amp; Redirect)</h2>
					<a href="/events" class="text-xs font-semibold text-purple-700 hover:underline">Configure colors per Event →</a>
				</div>
				<p class="text-sm text-slate-600">
					Launch a branded Rondwell registration modal right over your own website when visitors click a button. Supports ticket tier selection, interactive 2D/3D seat picking, coupons, Paystack/Stripe settlement, <code class="font-mono">onSuccess</code> callbacks, and post-registration <code class="font-mono">redirectUrl</code> persistence.
				</p>

				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<p class="text-xs font-bold uppercase tracking-wider text-slate-500">1. Declarative HTML Button</p>
						<button type="button" on:click={() => copyCode(eventHtmlSnippet)} class="text-xs font-semibold text-purple-700">Copy</button>
					</div>
					<pre class="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100"><code>{eventHtmlSnippet}</code></pre>

					<div class="flex items-center justify-between pt-2">
						<p class="text-xs font-bold uppercase tracking-wider text-slate-500">2. Imperative JavaScript / TypeScript SDK</p>
						<button type="button" on:click={() => copyCode(eventJsSnippet)} class="text-xs font-semibold text-purple-700">Copy</button>
					</div>
					<pre class="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100"><code>{eventJsSnippet}</code></pre>
				</div>

				<SdkPlayground />
			</section>

			<!-- Collection Web SDK -->
			<section id="sdk-collection" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-xl font-bold">Collection Web SDK</h2>
					<a href="/collection" class="text-xs font-semibold text-purple-700 hover:underline">Customize in Collection Settings →</a>
				</div>
				<p class="text-sm text-slate-600">
					Automatically pull all events in a Rondwell Collection with tag filters, search, and custom Grid/List/Cards layouts. Clicking Register on any event inside the widget seamlessly opens the Event Page SDK Modal on your site.
				</p>
				<div class="flex items-center justify-between">
					<p class="text-xs font-bold uppercase tracking-wider text-slate-500">Embed Collection Feed</p>
					<button type="button" on:click={() => copyCode(collectionSnippet)} class="text-xs font-semibold text-purple-700">Copy</button>
				</div>
				<pre class="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100"><code>{collectionSnippet}</code></pre>
			</section>

			<!-- REST API Reference -->
			<section id="rest-api" class="space-y-6">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<h2 class="text-xl font-bold">REST API Endpoints</h2>
					<div class="flex gap-1.5">
						{#each [['curl', 'cURL'], ['node', 'Node.js'], ['python', 'Python']] as [id, label]}
							<button type="button" on:click={() => (lang = id as any)} class="rounded-lg px-3 py-1.5 text-xs font-semibold {lang === id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}">
								{label}
							</button>
						{/each}
					</div>
				</div>

				{#each filteredEndpoints as ep}
					<article id={ep.id} class="rounded-2xl border border-slate-200 bg-white p-6">
						<div class="flex flex-wrap items-center gap-2.5">
							<span class="rounded-md px-2 py-0.5 font-mono text-xs font-bold {ep.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}">{ep.method}</span>
							<code class="font-mono text-sm font-bold text-slate-900">{ep.path}</code>
							<span class="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">Scope: {ep.scope}</span>
						</div>
						<h3 class="mt-3 text-base font-bold text-slate-900">{ep.title}</h3>
						<p class="mt-1 text-sm text-slate-600">{ep.summary}</p>

						{#if ep.params.length > 0}
							<div class="mt-4 overflow-x-auto">
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
							<div>
								<p class="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Request ({lang})</p>
								<pre class="max-h-56 overflow-auto rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-slate-100"><code>{lang === 'curl' ? ep.curlExample : lang === 'node' ? ep.nodeExample : ep.pythonExample}</code></pre>
							</div>
							<div>
								<p class="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sample Response</p>
								<pre class="max-h-56 overflow-auto rounded-xl bg-slate-900 p-3.5 font-mono text-xs text-emerald-300"><code>{ep.responseExample}</code></pre>
							</div>
						</div>
					</article>
				{/each}
			</section>

			<!-- Interactive Console -->
			<section id="console">
				<TryItConsole />
			</section>

			<!-- Webhooks -->
			<section id="webhooks" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
				<h2 class="text-xl font-bold">Webhooks &amp; HMAC-SHA256 Verification</h2>
				<p class="text-sm text-slate-600">
					Every delivery includes <code class="font-mono">Rondwell-Signature: t=&lt;unix_ts&gt;,v1=&lt;hmac_hex&gt;</code>, SSRF protection, and automatic exponential backoff retries across 6 attempts.
				</p>
				<pre class="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100"><code>{webhookVerifyNode}</code></pre>
				<div class="grid gap-2 sm:grid-cols-2 text-xs">
					{#each WEBHOOK_EVENTS_DOC as wh}
						<div class="rounded-lg bg-slate-50 p-2.5">
							<code class="font-mono font-bold text-purple-700">{wh.event}</code>
							<p class="mt-0.5 text-slate-600">{wh.description}</p>
						</div>
					{/each}
				</div>
			</section>

			<!-- Error Codes -->
			<section id="errors" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
				<h2 class="text-xl font-bold">RFC 9457 Error Reference (<code class="font-mono text-sm">application/problem+json</code>)</h2>
				<div class="overflow-x-auto">
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
</div>
