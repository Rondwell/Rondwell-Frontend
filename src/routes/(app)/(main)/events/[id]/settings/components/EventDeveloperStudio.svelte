<script lang="ts">
	import { onMount } from 'svelte';
	import { updateEvent } from '$lib/services/event.services';
	import { listApiKeys, type ApiKeyItem } from '$lib/services/developer.services';
	import { toast } from '$lib/stores/toast.store';

	export let event: any = null;
	export let eventId: string = '';

	let publishableKeys: ApiKeyItem[] = [];
	let selectedPk = 'rw_live_pub_your_publishable_key';
	let snippetTab: 'html' | 'js' | 'react' | 'rest' = 'html';

	// SDK Appearance & Behavior Config
	let mode: 'modal' | 'inline' = 'modal';
	let theme: 'light' | 'dark' = 'light';
	let primaryColor = '#7C3AED';
	let backgroundColor = '#FFFFFF';
	let textColor = '#111827';
	let borderRadius = 12;
	let buttonText = 'Register for Event';
	let showCover = true;
	let showDescription = true;
	let showSeatMap = true;
	let showAttendeeCount = true;
	let redirectUrl = '';

	let saving = false;
	let previewModalOpen = false;
	let initializedForId = '';

	$: if (event && eventId && initializedForId !== eventId) {
		initializedForId = eventId;
		const cfg = event.embedConfig || {};
		mode = cfg.mode || 'modal';
		theme = cfg.theme === 'dark' ? 'dark' : 'light';
		primaryColor = cfg.primaryColor || '#7C3AED';
		backgroundColor = cfg.backgroundColor || (theme === 'dark' ? '#0B0F19' : '#FFFFFF');
		textColor = cfg.textColor || (theme === 'dark' ? '#F8FAFC' : '#111827');
		borderRadius = cfg.borderRadius ?? 12;
		buttonText = cfg.buttonText || 'Register for Event';
		showCover = cfg.showCover !== false;
		showDescription = cfg.showDescription !== false;
		showSeatMap = cfg.showSeatMap !== false;
		showAttendeeCount = cfg.showAttendeeCount !== false;
		redirectUrl = cfg.redirectUrl || '';
	}

	onMount(async () => {
		try {
			const keys = await listApiKeys();
			publishableKeys = (keys || []).filter((k) => k.keyType === 'PUBLISHABLE' && k.status === 'ACTIVE');
			if (publishableKeys[0]?.keyPrefix) {
				selectedPk = `${publishableKeys[0].keyPrefix}...`;
			}
		} catch {
			/* not loaded yet */
		}
	});

	$: embedQuery = new URLSearchParams({
		theme,
		primary: primaryColor,
		bg: backgroundColor,
		text: textColor,
		radius: String(borderRadius),
		showCover: String(showCover),
		showDescription: String(showDescription),
		showSeatMap: String(showSeatMap),
		...(redirectUrl ? { redirectUrl } : {}),
	}).toString();

	$: previewSrc = `/embed/event/${encodeURIComponent(eventId)}?${embedQuery}`;
	$: eventIdentifier = event?.customLinkSlug || eventId;

	$: htmlSnippet =
		mode === 'modal'
			? `<!-- Rondwell Event Page SDK Modal Button -->\n<button\n  data-rondwell-event="${eventIdentifier}"\n  data-rondwell-pk="${selectedPk}"\n  data-rondwell-theme="${theme}"\n  data-rondwell-primary="${primaryColor}"\n  data-rondwell-bg="${backgroundColor}"\n  data-rondwell-radius="${borderRadius}"${redirectUrl ? `\n  data-rondwell-redirect="${redirectUrl}"` : ''}\n  style="background:${primaryColor};color:#fff;padding:12px 22px;border-radius:${borderRadius}px;border:0;font-weight:600;cursor:pointer;"\n>\n  ${buttonText}\n</button>\n\n` +
				// csp-ignore-next-line — copyable external SDK script snippet for organizer websites
				`<script src="https://rondwell.com/sdk/v1/rondwell.js" async><\/script>`
			: `<div\n  data-rondwell-event="${eventIdentifier}"\n  data-rondwell-mode="inline"\n  data-rondwell-pk="${selectedPk}"\n  data-rondwell-theme="${theme}"\n  data-rondwell-primary="${primaryColor}"\n  data-rondwell-radius="${borderRadius}"${redirectUrl ? `\n  data-rondwell-redirect="${redirectUrl}"` : ''}\n></div>\n\n` +
				// csp-ignore-next-line — copyable external SDK script snippet for organizer websites
				`<script src="https://rondwell.com/sdk/v1/rondwell.js" async><\/script>`;

	$: jsSnippet =
		// csp-ignore-next-line — copyable JS SDK snippet
		`import Rondwell from '@rondwell/web-sdk';\n\nRondwell.init({ publishableKey: '${selectedPk}' });\n\n` +
		(mode === 'modal'
			? `document.getElementById('register-btn').addEventListener('click', () => {\n  Rondwell.openEventModal('${eventIdentifier}', {\n    theme: '${theme}',\n    primaryColor: '${primaryColor}',\n    backgroundColor: '${backgroundColor}',\n    borderRadius: ${borderRadius},${redirectUrl ? `\n    redirectUrl: '${redirectUrl}',` : ''}\n    onSuccess: (reg) => {\n      console.log('Attendee registered:', reg.registrationId);\n    },\n  });\n});`
			: `Rondwell.mountEvent('#rondwell-event-embed', '${eventIdentifier}', {\n  theme: '${theme}',\n  primaryColor: '${primaryColor}',\n  borderRadius: ${borderRadius},${redirectUrl ? `\n  redirectUrl: '${redirectUrl}',` : ''}\n  onSuccess: (reg) => console.log('Registered:', reg.registrationId),\n});`);

	$: reactSnippet = `import { createRondwellEventTrigger } from '@rondwell/web-sdk/react';\n\nexport function RegisterButton() {\n  const openCheckout = createRondwellEventTrigger('${eventIdentifier}', {\n    publishableKey: '${selectedPk}',\n    theme: '${theme}',\n    primaryColor: '${primaryColor}',\n    borderRadius: ${borderRadius},${redirectUrl ? `\n    redirectUrl: '${redirectUrl}',` : ''}\n    onSuccess: (reg) => console.log('Confirmed:', reg.registrationId),\n  });\n\n  return (\n    <button onClick={openCheckout} style={{ backgroundColor: '${primaryColor}', color: '#fff', borderRadius: ${borderRadius} }}>\n      ${buttonText}\n    </button>\n  );\n}`;

	$: restSnippet =
		// csp-ignore-next-line — copyable REST API example snippet
		`curl -X GET "https://api.rondwell.com/v1/events/${eventId}/analytics/comprehensive" \\\n  -H "Authorization: Bearer rw_live_your_secret_key"\n\n# Live Seat Capacity\n` +
		// csp-ignore-next-line — copyable REST API example snippet
		`curl -X GET "https://api.rondwell.com/v1/events/${eventId}/seating/capacity" \\\n  -H "Authorization: Bearer rw_live_your_secret_key"`;

	async function saveSdkConfig() {
		if (!eventId) return;
		saving = true;
		try {
			await updateEvent(eventId, {
				embedConfig: {
					enabled: true,
					mode,
					theme,
					primaryColor,
					backgroundColor,
					textColor,
					borderRadius: Number(borderRadius),
					buttonText: buttonText.trim() || 'Register for Event',
					showCover,
					showDescription,
					showSeatMap,
					showAttendeeCount,
					redirectUrl: redirectUrl.trim(),
				},
			} as any);
			toast.success('Event SDK customization saved.');
		} catch (e: any) {
			toast.error(e?.message || 'Failed to save SDK settings');
		} finally {
			saving = false;
		}
	}

	function copySnippet(code: string) {
		navigator.clipboard?.writeText(code);
		toast.success('Snippet copied to clipboard');
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
		<div>
			<h2 class="text-lg font-bold text-gray-900">Event Page Web SDK &amp; API Studio</h2>
			<p class="mt-0.5 text-sm text-gray-600">
				Embed this event on your own site with full ticket, seat-map, and redirect persistence.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<a href="/settings?tab=developers" class="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50">
				Manage API Keys &amp; IP Whitelist
			</a>
			<a href="/api-docs#sdk-event-page" class="rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800">
				SDK &amp; Analytics Docs
			</a>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-12">
		<div class="space-y-4 rounded-xl border border-gray-200 bg-white p-5 lg:col-span-5">
			<h3 class="text-sm font-bold text-gray-900">Customize Event Page SDK</h3>

			<div>
				<label class="text-xs font-semibold text-gray-700">Account Publishable Key</label>
				{#if publishableKeys.length > 0}
					<select bind:value={selectedPk} class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono">
						{#each publishableKeys as k}
							<option value="{k.keyPrefix}...">{k.name} ({k.keyPrefix}…)</option>
						{/each}
					</select>
				{:else}
					<p class="mt-1 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
						No publishable SDK key yet. <a href="/settings?tab=developers" class="font-semibold underline">Create one in Account Settings</a>.
					</p>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="text-xs font-semibold text-gray-700">Display Mode</label>
					<select bind:value={mode} class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs">
						<option value="modal">Modal Popup</option>
						<option value="inline">Inline Embed</option>
					</select>
				</div>
				<div>
					<label class="text-xs font-semibold text-gray-700">Theme</label>
					<select bind:value={theme} class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs">
						<option value="light">Light</option>
						<option value="dark">Dark</option>
					</select>
				</div>
			</div>

			<div class="grid grid-cols-3 gap-3">
				<div>
					<label class="text-xs font-semibold text-gray-700">Brand Color</label>
					<input type="color" bind:value={primaryColor} class="mt-1 h-9 w-full cursor-pointer rounded border border-gray-300" />
				</div>
				<div>
					<label class="text-xs font-semibold text-gray-700">Background</label>
					<input type="color" bind:value={backgroundColor} class="mt-1 h-9 w-full cursor-pointer rounded border border-gray-300" />
				</div>
				<div>
					<label class="text-xs font-semibold text-gray-700">Radius ({borderRadius}px)</label>
					<input type="range" min="0" max="24" bind:value={borderRadius} class="mt-3 w-full" />
				</div>
			</div>

			<div>
				<label class="text-xs font-semibold text-gray-700">Trigger Button Label</label>
				<input bind:value={buttonText} class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs" />
			</div>

			<div>
				<label class="text-xs font-semibold text-gray-700">Post-Registration Redirect URL (Optional)</label>
				<!-- csp-ignore-next-line — placeholder text -->
				<input bind:value={redirectUrl} placeholder="https://yoursite.com/thank-you" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs" />
				<p class="mt-1 text-[11px] text-gray-500">Appends <code class="font-mono">rondwell_registration_id</code> &amp; status on return.</p>
			</div>

			<div class="grid grid-cols-2 gap-2 text-xs">
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={showCover} /> Show Cover</label>
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={showDescription} /> Show Description</label>
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={showSeatMap} /> Seat Map</label>
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={showAttendeeCount} /> Attendee Count</label>
			</div>

			<button
				type="button"
				disabled={saving}
				on:click={saveSdkConfig}
				class="w-full rounded-lg bg-gray-900 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
			>
				{saving ? 'Saving…' : 'Save SDK Settings'}
			</button>
		</div>

		<div class="space-y-5 lg:col-span-7">
			<div class="rounded-xl border border-gray-200 bg-white p-5">
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<h3 class="text-sm font-bold text-gray-900">Live Interactive Preview</h3>
					<button
						type="button"
						on:click={() => (previewModalOpen = true)}
						class="px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
						style="background-color:{primaryColor}; border-radius:{borderRadius}px;"
					>
						{buttonText} (Launch Modal)
					</button>
				</div>

				{#if mode === 'inline'}
					<iframe
						title="Event Inline SDK Preview"
						src={previewSrc}
						class="h-[460px] w-full rounded-xl border border-gray-200"
					></iframe>
				{:else}
					<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
						<p class="text-xs text-gray-500">Click the styled trigger above to test the live Event Page SDK Modal with ticket &amp; seat selection.</p>
						<button
							type="button"
							on:click={() => (previewModalOpen = true)}
							class="mt-4 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
							style="background-color:{primaryColor}; border-radius:{borderRadius}px;"
						>
							{buttonText}
						</button>
					</div>
				{/if}
			</div>

			<div class="rounded-xl border border-gray-200 bg-white p-5">
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<div class="flex gap-1.5">
						{#each [['html', 'HTML'], ['js', 'JavaScript SDK'], ['react', 'React'], ['rest', 'REST API']] as [id, label]}
							<button
								type="button"
								on:click={() => (snippetTab = id as any)}
								class="rounded-lg px-3 py-1.5 text-xs font-semibold {snippetTab === id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}"
							>
								{label}
							</button>
						{/each}
					</div>
					<button
						type="button"
						on:click={() => copySnippet(snippetTab === 'html' ? htmlSnippet : snippetTab === 'js' ? jsSnippet : snippetTab === 'react' ? reactSnippet : restSnippet)}
						class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
					>
						Copy Snippet
					</button>
				</div>
				<pre class="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-100"><code>{snippetTab === 'html' ? htmlSnippet : snippetTab === 'js' ? jsSnippet : snippetTab === 'react' ? reactSnippet : restSnippet}</code></pre>
			</div>
		</div>
	</div>
</div>

{#if previewModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
		<div class="relative h-[85vh] w-full max-w-2xl overflow-hidden bg-white shadow-2xl" style="border-radius:{borderRadius}px;">
			<button
				type="button"
				on:click={() => (previewModalOpen = false)}
				class="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-lg text-white"
			>
				×
			</button>
			<iframe title="Event Modal Preview" src={previewSrc} class="h-full w-full border-0"></iframe>
		</div>
	</div>
{/if}
