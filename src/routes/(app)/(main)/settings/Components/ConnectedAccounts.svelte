<script lang="ts">
	/**
	 * Connected calendar & conferencing accounts.
	 *
	 * ── What this is for ────────────────────────────────────────────────────
	 *
	 * Connecting Google, Microsoft or Zoom lets Rondwell write an event straight
	 * into an organizer's calendar and — once meeting provisioning ships — create
	 * the meeting room for them instead of asking them to paste a link.
	 *
	 * ── Design ──────────────────────────────────────────────────────────────
	 *
	 * Matches the other settings sections: `mb-12 border-t pt-12` wrapper, an
	 * `text-lg font-semibold` heading, and `rounded-xl border bg-white` cards.
	 * Each provider is one row, so the list reads at a glance and the state —
	 * connected, needs reconnecting, unavailable on this deployment — is on the
	 * row rather than hidden in a modal.
	 *
	 * The three states that are easy to get wrong and are handled explicitly:
	 *
	 *   - **Not configured on this deployment.** The OAuth credentials are
	 *     optional server config, so a provider may genuinely have none. The row
	 *     is disabled with an explanation instead of offering a button that 503s.
	 *   - **Connected but expired.** A refresh fails when the user revokes access
	 *     at the provider. The row says "reconnect needed" rather than silently
	 *     looking fine while writing nothing.
	 *   - **Returning from the consent screen.** The callback redirects back here
	 *     with `?integration=…&status=…`, which is read once and cleared from the
	 *     URL so a refresh does not re-toast.
	 */
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';
	import { browser } from '$app/environment';
	import {
		connectIntegration,
		disconnectIntegration,
		listIntegrations,
		type IntegrationEntry,
		type IntegrationPlatform
	} from '$lib/services/integration.services';
	import { toast } from '$lib/stores/toast.store';

	interface ProviderMeta {
		id: IntegrationPlatform;
		label: string;
		description: string;
		icon: string;
		color: string;
	}

	const PROVIDERS: ProviderMeta[] = [
		{
			id: 'GOOGLE',
			label: 'Google Calendar',
			description: 'Add events to your calendar and create Google Meet links automatically.',
			icon: 'logos:google-calendar',
			color: '#4285F4'
		},
		{
			id: 'OUTLOOK',
			label: 'Microsoft 365',
			description: 'Outlook calendar, plus Microsoft Teams meeting links.',
			icon: 'logos:microsoft-icon',
			color: '#0078D4'
		},
		{
			id: 'ZOOM',
			label: 'Zoom',
			description: 'Create Zoom meetings for your events and import attendance afterwards.',
			icon: 'logos:zoom-icon',
			color: '#2D8CFF'
		}
	];

	let integrations: IntegrationEntry[] = [];
	let available: Record<string, boolean> = {};
	let loading = true;
	let loadError = '';
	let busy: string | null = null;

	onMount(async () => {
		readCallbackResult();
		await refresh();
	});

	/**
	 * Surface the outcome of a consent round trip, then clean the URL.
	 *
	 * Without the cleanup, a refresh or a back-navigation re-shows the toast —
	 * and "Connected!" appearing again on a page the user has merely revisited
	 * is the kind of thing that makes people doubt whether it worked.
	 */
	function readCallbackResult() {
		if (!browser) return;
		const params = $page.url.searchParams;
		const platform = params.get('integration');
		const status = params.get('status');
		if (!platform || !status) return;

		const label = PROVIDERS.find((p) => p.id === platform.toUpperCase())?.label ?? platform;
		if (status === 'connected') {
			toast.success(`${label} connected.`);
		} else {
			const reason = params.get('reason');
			toast.error(
				reason === 'access_denied'
					? `You declined the ${label} permission request.`
					: `Could not connect ${label}. Please try again.`
			);
		}

		const cleaned = new URL($page.url);
		cleaned.searchParams.delete('integration');
		cleaned.searchParams.delete('status');
		cleaned.searchParams.delete('reason');
		replaceState(cleaned.pathname + cleaned.search, {});
	}

	async function refresh() {
		loading = true;
		loadError = '';
		try {
			const res = await listIntegrations();
			integrations = res.integrations;
			available = res.available;
		} catch (e: any) {
			loadError = e?.message ?? 'Could not load your connected accounts';
		} finally {
			loading = false;
		}
	}

	function connectedFor(id: IntegrationPlatform): IntegrationEntry | undefined {
		return integrations.find((i) => i.platform === id);
	}

	async function handleConnect(provider: ProviderMeta) {
		busy = provider.id;
		try {
			const url = await connectIntegration(provider.id);
			// A full navigation, not a popup: the consent screens block framing,
			// and a popup blocked by the browser is a dead end with no feedback.
			window.location.href = url;
		} catch (e: any) {
			toast.error(e?.message ?? `Could not start the ${provider.label} connection`);
			busy = null;
		}
	}

	async function handleDisconnect(provider: ProviderMeta, entry: IntegrationEntry) {
		if (
			!confirm(
				`Disconnect ${provider.label}? Rondwell will stop adding events to this calendar.`
			)
		) {
			return;
		}
		busy = provider.id;
		try {
			await disconnectIntegration(entry.id);
			toast.success(`${provider.label} disconnected.`);
			await refresh();
		} catch (e: any) {
			toast.error(e?.message ?? 'Could not disconnect that account');
		} finally {
			busy = null;
		}
	}

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '';
		}
	}
</script>

<div class="mb-12 border-t pt-12">
	<div class="mb-6">
		<h2 class="text-lg font-semibold">Connected accounts</h2>
		<p class="mt-1 text-sm text-gray-500">
			Link your calendar so Rondwell can add your events to it, and your conferencing
			account so it can create meeting rooms for you.
		</p>
	</div>

	{#if loadError}
		<p class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{loadError}</p>
	{/if}

	<div class="divide-y rounded-xl border bg-white">
		{#each PROVIDERS as provider (provider.id)}
			{@const entry = connectedFor(provider.id)}
			{@const isAvailable = available[provider.id] !== false}
			<div class="flex items-center gap-4 p-5">
				<div
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50"
				>
					<Icon icon={provider.icon} class="text-[22px]" />
				</div>

				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm font-semibold text-gray-900">{provider.label}</span>

						{#if loading}
							<span class="h-4 w-16 animate-pulse rounded bg-gray-100"></span>
						{:else if !isAvailable}
							<span
								class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
							>
								Unavailable
							</span>
						{:else if entry && entry.needsRefresh}
							<span
								class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
							>
								Reconnect needed
							</span>
						{:else if entry}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700"
							>
								<Icon icon="mdi:check-circle" class="text-[11px]" />
								Connected
							</span>
						{/if}
					</div>

					<p class="mt-0.5 text-xs text-gray-500">
						{#if !isAvailable}
							This provider isn’t set up on Rondwell yet.
						{:else if entry && entry.needsRefresh}
							Access expired or was revoked. Reconnect to resume syncing.
						{:else if entry}
							Connected {formatDate(entry.connectedAt)}
						{:else}
							{provider.description}
						{/if}
					</p>
				</div>

				<div class="shrink-0">
					{#if loading}
						<div class="h-8 w-24 animate-pulse rounded-lg bg-gray-100"></div>
					{:else if !isAvailable}
						<button
							type="button"
							disabled
							class="cursor-not-allowed rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400"
						>
							Connect
						</button>
					{:else if entry}
						<div class="flex items-center gap-2">
							{#if entry.needsRefresh}
								<button
									type="button"
									disabled={busy === provider.id}
									on:click={() => handleConnect(provider)}
									class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
								>
									Reconnect
								</button>
							{/if}
							<button
								type="button"
								disabled={busy === provider.id}
								on:click={() => handleDisconnect(provider, entry)}
								class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								{busy === provider.id ? 'Working…' : 'Disconnect'}
							</button>
						</div>
					{:else}
						<button
							type="button"
							disabled={busy === provider.id}
							on:click={() => handleConnect(provider)}
							class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
						>
							{busy === provider.id ? 'Redirecting…' : 'Connect'}
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!--
		Scope disclosure. Users consent to these on the provider's screen, but
		that screen lists raw scope names; saying plainly what we do with the
		access is the difference between a connection people accept and one they
		revoke a week later.
	-->
	<div class="mt-4 rounded-xl border border-gray-100 bg-[#FBFBFD] p-4">
		<div class="flex items-start gap-2">
			<Icon icon="mdi:shield-check-outline" class="mt-0.5 text-base text-gray-400" />
			<div class="text-xs text-gray-600">
				<p class="font-medium text-gray-700">What Rondwell does with this access</p>
				<ul class="mt-1.5 list-disc space-y-0.5 pl-4">
					<li>Creates and updates calendar entries for events you organize or attend.</li>
					<li>Creates meeting rooms when you ask it to, on events you organize.</li>
					<li>Reads your upcoming events only to show you that the link is working.</li>
					<li>Never posts, never emails on your behalf, and never shares your calendar.</li>
				</ul>
				<p class="mt-1.5">
					You can disconnect at any time here, which revokes Rondwell's access at the
					provider too.
				</p>
			</div>
		</div>
	</div>
</div>
