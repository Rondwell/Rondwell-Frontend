<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import { portal } from '$lib/utils/portal';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
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
	let copiedCode = false;
	let previewModalOpen = false;
	let initializedForId = '';

	const COLOR_PRESETS = ['#513BE2', '#7C3AED', '#DB3E6C', '#0EA5E9', '#10B981', '#17161E'];

	$: pkOptions = publishableKeys.map(
		(k): SelectOption<string> => ({
			value: `${k.keyPrefix}...`,
			label: k.name,
			description: `${k.keyPrefix}...`,
			badge: k.environment?.toUpperCase() || 'LIVE',
			badgeTone: k.environment === 'test' ? 'amber' : 'emerald',
			icon: 'solar:code-square-bold-duotone',
		})
	);

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

	$: activeSnippet =
		snippetTab === 'html' ? htmlSnippet : snippetTab === 'js' ? jsSnippet : snippetTab === 'react' ? reactSnippet : restSnippet;

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
		copiedCode = true;
		toast.success('Snippet copied to clipboard');
		setTimeout(() => (copiedCode = false), 2000);
	}
</script>

<div class="space-y-6">
	<!-- Obsidian Hero Header -->
	<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#17161E] via-[#1F1A36] to-[#291C4F] p-5 text-white shadow-[0_20px_50px_-20px_rgba(23,22,30,0.45)] sm:p-6">
		<div class="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#7C3AED]/25 blur-3xl"></div>
		<div class="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<div class="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold text-violet-200">
					<Icon icon="solar:code-square-bold-duotone" class="h-3.5 w-3.5 text-violet-300" />
					Event Page Web SDK &amp; API Studio
				</div>
				<h2 class="text-lg font-bold tracking-tight text-white sm:text-xl">Embed Registration Directly Into Your Site</h2>
				<p class="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
					Full ticket checkout, interactive seat selection, and post-registration redirect persistence.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2.5">
				<a
					href="/settings?tab=developers"
					class="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.15]"
				>
					<Icon icon="solar:key-linear" class="h-3.5 w-3.5 text-violet-300" />
					API Keys &amp; IP Whitelist
				</a>
				<a
					href="/api-docs#sdk-event-page"
					class="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#17161E] shadow-md transition hover:bg-violet-50"
				>
					<Icon icon="solar:book-2-bold-duotone" class="h-3.5 w-3.5 text-[#513BE2]" />
					SDK &amp; Analytics Docs
				</a>
			</div>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-12">
		<!-- Left Configurator -->
		<div class="space-y-5 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-[0_4px_20px_-8px_rgba(23,22,30,0.08)] lg:col-span-5">
			<div class="flex items-center gap-2.5 border-b border-gray-100 pb-3.5">
				<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#513BE2]/10 text-[#513BE2]">
					<Icon icon="solar:palette-bold-duotone" class="h-4 w-4" />
				</span>
				<div>
					<h3 class="text-sm font-bold text-[#17161E]">Customize Event Page SDK</h3>
					<p class="text-[11px] text-gray-500">Live updates preview &amp; code snippets</p>
				</div>
			</div>

			<div>
				<label for="event-sdk-pk" class="mb-1.5 block text-xs font-semibold text-gray-700">Account Publishable Key</label>
				{#if pkOptions.length > 0}
					<CustomSelect
						id="event-sdk-pk"
						options={pkOptions}
						bind:value={selectedPk}
						size="sm"
						ariaLabel="Select publishable key"
					/>
				{:else}
					<div class="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
						<Icon icon="solar:shield-warning-bold-duotone" class="h-4 w-4 shrink-0 text-amber-600" />
						<span>
							No publishable SDK key yet. <a href="/settings?tab=developers" class="font-bold underline">Create one in Account Settings</a>.
						</span>
					</div>
				{/if}
			</div>

			<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
				<div>
					<p class="mb-1.5 text-xs font-semibold text-gray-700">Display Mode</p>
					<div class="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-[#F3F2F8] p-1">
						<button
							type="button"
							on:click={() => (mode = 'modal')}
							class="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition {mode === 'modal' ? 'bg-white text-[#17161E] shadow-sm' : 'text-gray-500 hover:text-[#17161E]'}"
						>
							<Icon icon="solar:window-frame-linear" class="h-3.5 w-3.5" />
							Modal
						</button>
						<button
							type="button"
							on:click={() => (mode = 'inline')}
							class="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition {mode === 'inline' ? 'bg-white text-[#17161E] shadow-sm' : 'text-gray-500 hover:text-[#17161E]'}"
						>
							<Icon icon="solar:sidebar-minimalistic-linear" class="h-3.5 w-3.5" />
							Inline
						</button>
					</div>
				</div>

				<div>
					<p class="mb-1.5 text-xs font-semibold text-gray-700">Theme</p>
					<div class="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-[#F3F2F8] p-1">
						<button
							type="button"
							on:click={() => (theme = 'light')}
							class="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition {theme === 'light' ? 'bg-white text-[#17161E] shadow-sm' : 'text-gray-500 hover:text-[#17161E]'}"
						>
							<Icon icon="solar:sun-2-bold-duotone" class="h-3.5 w-3.5 text-amber-500" />
							Light
						</button>
						<button
							type="button"
							on:click={() => (theme = 'dark')}
							class="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition {theme === 'dark' ? 'bg-[#17161E] text-white shadow-sm' : 'text-gray-500 hover:text-[#17161E]'}"
						>
							<Icon icon="solar:moon-bold-duotone" class="h-3.5 w-3.5 text-violet-400" />
							Dark
						</button>
					</div>
				</div>
			</div>

			<!-- Brand Accent Swatches + Custom Color -->
			<div>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs font-semibold text-gray-700">Brand Accent Color</span>
					<span class="font-mono text-[11px] font-medium text-gray-500">{primaryColor.toUpperCase()}</span>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					{#each COLOR_PRESETS as swatch}
						<button
							type="button"
							on:click={() => (primaryColor = swatch)}
							aria-label="Pick brand color {swatch}"
							class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-105 {primaryColor.toLowerCase() === swatch.toLowerCase() ? 'border-[#17161E] ring-2 ring-[#513BE2]/25 scale-105' : 'border-white shadow-sm'}"
							style="background-color: {swatch}"
						></button>
					{/each}
					<label class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100">
						<input type="color" bind:value={primaryColor} class="h-4 w-4 cursor-pointer border-0 bg-transparent p-0" />
						Custom
					</label>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3.5">
				<div>
					<label for="sdk-bg-color" class="mb-1.5 block text-xs font-semibold text-gray-700">Surface Background</label>
					<label class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
						<input id="sdk-bg-color" type="color" bind:value={backgroundColor} class="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0" />
						<span class="font-mono text-xs text-gray-700">{backgroundColor.toUpperCase()}</span>
					</label>
				</div>
				<div>
					<div class="mb-1.5 flex items-center justify-between">
						<label for="sdk-border-radius" class="text-xs font-semibold text-gray-700">Corner Radius</label>
						<span class="font-mono text-xs font-bold text-[#513BE2]">{borderRadius}px</span>
					</div>
					<input
						id="sdk-border-radius"
						type="range"
						min="0"
						max="24"
						bind:value={borderRadius}
						class="mt-2 h-2 w-full cursor-pointer accent-[#513BE2]"
					/>
				</div>
			</div>

			<div>
				<label for="sdk-button-label" class="mb-1.5 block text-xs font-semibold text-gray-700">Trigger Button Label</label>
				<input
					id="sdk-button-label"
					bind:value={buttonText}
					class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-medium text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
				/>
			</div>

			<div>
				<label for="sdk-redirect-url" class="mb-1.5 block text-xs font-semibold text-gray-700">Post-Registration Redirect URL (Optional)</label>
				<!-- csp-ignore-next-line — placeholder text -->
				<input
					id="sdk-redirect-url"
					bind:value={redirectUrl}
					placeholder="https://yoursite.com/thank-you"
					class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-[#17161E] outline-none focus:border-[#513BE2] focus:ring-2 focus:ring-[#513BE2]/15"
				/>
				<p class="mt-1 text-[11px] text-gray-500">Appends <code class="font-mono">rondwell_registration_id</code> &amp; status on return.</p>
			</div>

			<!-- Tactile Toggle Switches -->
			<div class="grid grid-cols-2 gap-2.5 pt-1">
				{#each [
					{ key: 'showCover', label: 'Show Cover', val: showCover, toggle: () => (showCover = !showCover) },
					{ key: 'showDescription', label: 'Description', val: showDescription, toggle: () => (showDescription = !showDescription) },
					{ key: 'showSeatMap', label: 'Seat Map', val: showSeatMap, toggle: () => (showSeatMap = !showSeatMap) },
					{ key: 'showAttendeeCount', label: 'Attendee Count', val: showAttendeeCount, toggle: () => (showAttendeeCount = !showAttendeeCount) },
				] as item}
					<button
						type="button"
						on:click={item.toggle}
						role="switch"
						aria-checked={item.val}
						class="flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition {item.val ? 'border-[#513BE2]/30 bg-[#513BE2]/[0.04] text-[#17161E]' : 'border-gray-200 bg-white text-gray-500'}"
					>
						<span>{item.label}</span>
						<span class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors {item.val ? 'bg-[#513BE2]' : 'bg-gray-300'}">
							<span class="inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform {item.val ? 'translate-x-4.5' : 'translate-x-0.5'}"></span>
						</span>
					</button>
				{/each}
			</div>

			<button
				type="button"
				disabled={saving}
				on:click={saveSdkConfig}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#513BE2] to-[#7C3AED] py-3 text-xs font-bold text-white shadow-[0_8px_20px_-6px_rgba(81,59,226,0.6)] transition hover:brightness-110 disabled:opacity-50"
			>
				<Icon icon="solar:diskette-bold-duotone" class="h-4 w-4" />
				{saving ? 'Saving…' : 'Save SDK Settings'}
			</button>
		</div>

		<!-- Right Preview & Snippets -->
		<div class="space-y-5 lg:col-span-7">
			<!-- Browser Frame Preview -->
			<div class="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_4px_20px_-8px_rgba(23,22,30,0.08)]">
				<div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
					<div class="flex items-center gap-3">
						<div class="flex gap-1.5">
							<span class="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
							<span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
							<span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
						</div>
						<span class="rounded-lg border border-gray-200 bg-white px-2.5 py-1 font-mono text-[11px] text-gray-500">
							yoursite.com/events
						</span>
					</div>
					<button
						type="button"
						on:click={() => (previewModalOpen = true)}
						class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
						style="background-color:{primaryColor}; border-radius:{borderRadius}px;"
					>
						<Icon icon="solar:play-circle-bold" class="h-3.5 w-3.5" />
						{buttonText}
					</button>
				</div>

				<div class="p-4 sm:p-5">
					{#if mode === 'inline'}
						<iframe
							title="Event Inline SDK Preview"
							src={previewSrc}
							class="h-[460px] w-full rounded-2xl border border-gray-200"
						></iframe>
					{:else}
						<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white px-6 py-12 text-center">
							<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#513BE2]/10 text-[#513BE2]">
								<Icon icon="solar:window-frame-bold-duotone" class="h-6 w-6" />
							</span>
							<p class="mt-3 text-sm font-bold text-[#17161E]">Interactive Modal Overlay Preview</p>
							<p class="mt-1 max-w-sm text-xs text-gray-500">
								Click the live CTA button below to inspect ticket tiers, seat selection, and your exact accent color inside the Web SDK modal.
							</p>
							<button
								type="button"
								on:click={() => (previewModalOpen = true)}
								class="mt-5 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:opacity-95"
								style="background-color:{primaryColor}; border-radius:{borderRadius}px;"
							>
								{buttonText}
								<Icon icon="solar:arrow-right-linear" class="h-4 w-4" />
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Code Snippet Terminal -->
			<div class="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-xl">
				<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-900/70 px-4 py-3">
					<div class="flex flex-wrap gap-1.5">
						{#each [['html', 'HTML'], ['js', 'JavaScript SDK'], ['react', 'React'], ['rest', 'REST API']] as [tabId, label]}
							<button
								type="button"
								on:click={() => (snippetTab = tabId as any)}
								class="rounded-xl px-3 py-1.5 text-xs font-semibold transition {snippetTab === tabId ? 'bg-[#513BE2] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}"
							>
								{label}
							</button>
						{/each}
					</div>
					<button
						type="button"
						on:click={() => copySnippet(activeSnippet)}
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
					>
						<Icon icon={copiedCode ? 'solar:check-circle-bold' : 'solar:copy-linear'} class="h-3.5 w-3.5 {copiedCode ? 'text-emerald-400' : ''}" />
						{copiedCode ? 'Copied' : 'Copy Snippet'}
					</button>
				</div>
				<pre class="max-h-72 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-100"><code>{activeSnippet}</code></pre>
			</div>
		</div>
	</div>
</div>

{#if previewModalOpen}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		use:portal
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Event Web SDK live preview"
		tabindex="-1"
		on:click={() => (previewModalOpen = false)}
		on:keydown={(e) => e.key === 'Escape' && (previewModalOpen = false)}
		transition:fade={{ duration: 140 }}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="relative h-[85vh] w-full max-w-2xl overflow-hidden border border-gray-100 bg-white shadow-2xl"
			style="border-radius:{borderRadius}px;"
			on:click|stopPropagation
			transition:scale={{ duration: 160, start: 0.97 }}
		>
			<button
				type="button"
				on:click={() => (previewModalOpen = false)}
				aria-label="Close modal preview"
				class="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/85 text-lg text-white transition hover:bg-slate-900"
			>
				×
			</button>
			<iframe title="Event Modal Preview" src={previewSrc} class="h-full w-full border-0"></iframe>
		</div>
	</div>
{/if}
