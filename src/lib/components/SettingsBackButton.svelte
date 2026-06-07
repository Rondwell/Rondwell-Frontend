<script lang="ts">
	/**
	 * Back button for account pages reached from the Settings tabs.
	 *
	 * When the user arrives via a settings entry card the link carries a
	 * `?from=<tab>` query param (e.g. `?from=payments`). The button then
	 * returns to that exact tab instead of dumping the user on the default
	 * Account tab. When there's no `from` param (direct link, email, etc.)
	 * it falls back to the provided tab.
	 */
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	// Tab to return to when no `from` param is present.
	export let fallbackTab = 'account';

	const tabLabels: Record<string, string> = {
		account: 'Account',
		wallet: 'Wallet',
		payments: 'Payments',
		subscription: 'Subscription',
		orders: 'Orders',
	};

	$: from = $page.url.searchParams.get('from');
	$: targetTab = from && tabLabels[from] ? from : fallbackTab;
	$: label = `Back to ${tabLabels[targetTab] ?? 'Settings'}`;
</script>

<button
	on:click={() => goto(`/settings?tab=${targetTab}`)}
	class="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
>
	<Icon icon="mdi:arrow-left" class="text-base" />
	{label}
</button>
