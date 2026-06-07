<!--
	FE-P2-02-C — Customer purchases.

	Backend:
	  - GET /api/v1/products/me/purchases
-->
<script lang="ts">
	import TransactionStatusBadge from '$lib/components/TransactionStatusBadge.svelte';
	import {
		listMyPurchases,
		type CustomerPurchase,
	} from '$lib/services/marketplace.services';
	import { financialErrorMessage } from '$lib/utils/financialErrorCopy';
	import { formatMoney } from '$lib/utils/money';
	import SettingsBackButton from '$lib/components/SettingsBackButton.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let purchases: CustomerPurchase[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			const result = await listMyPurchases({ limit: 50 });
			purchases = result.items;
		} catch (e: any) {
			error = financialErrorMessage(e);
		} finally {
			loading = false;
		}
	});

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});
		} catch {
			return iso;
		}
	}
</script>

<svelte:head><title>My purchases — Rondwell</title></svelte:head>

<div class="max-w-4xl">
	<SettingsBackButton fallbackTab="orders" />
	<div class="mb-6">
		<h1 class="text-2xl font-bold sm:text-3xl">My purchases</h1>
		<p class="mt-1 text-sm text-[#8C8F93]">
			Products and bookings you've bought through Rondwell.
		</p>
	</div>

	{#if error}
		<p class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<div class="space-y-2">
			{#each [1, 2, 3] as _}
				<div class="flex animate-pulse items-center gap-4 rounded-lg bg-white p-4">
					<div class="h-10 w-10 rounded-lg bg-gray-200"></div>
					<div class="h-4 w-40 rounded bg-gray-200"></div>
					<div class="ml-auto h-4 w-20 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if purchases.length === 0}
		<div class="flex h-60 flex-col items-center justify-center rounded-xl bg-white">
			<Icon icon="mdi:basket-outline" class="mb-2 text-4xl text-gray-300" />
			<p class="text-lg font-medium text-[#A2ACB2]">No purchases yet</p>
			<p class="mt-1 text-sm text-gray-400">
				Browse the <a href="/marketplace" class="text-pink-600 hover:underline">marketplace</a> to find vendor products and services.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each purchases as p}
				<a
					href={`/account/purchases/${p.id}`}
					class="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
				>
					<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div class="flex items-start gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
								<Icon icon="mdi:package-variant" class="text-xl" />
							</div>
							<div>
								<p class="text-sm font-semibold">{p.productName}</p>
								{#if p.vendorName}
									<p class="text-xs text-gray-500">from {p.vendorName}</p>
								{/if}
								<p class="mt-1 text-xs text-gray-400">
									{formatDate(p.createdAt)}
									{#if p.bookingSlotStart}
										<span> · slot {new Date(p.bookingSlotStart).toLocaleString()}</span>
									{/if}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-3 lg:flex-col lg:items-end">
							<TransactionStatusBadge status={p.status} />
							<p class="text-base font-semibold text-gray-900">{formatMoney(p.amountKobo, p.currency)}</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
