<!--
	One number, stated plainly.

	Shared by the gifts overview and the per-link dashboard so the two never
	drift into looking like different products. Deliberately dumb: it formats
	nothing and fetches nothing, because the moment a tile owns its own data it
	stops being reusable.

	`tone` carries meaning rather than colour — `money` for what landed,
	`pending` for what has not cleared yet — so a future "in transit to a
	logistics partner" state can be added here once instead of in every caller.
-->
<script lang="ts">
	export let label: string;
	export let value: string;
	/** Small line under the value. Optional. */
	export let sub = '';
	export let tone: 'default' | 'money' | 'pending' = 'default';
	/** Inline SVG string, matching the sidebar/submenu icon convention. */
	export let icon = '';
	export let loading = false;

	const valueTone: Record<string, string> = {
		default: 'text-gray-900',
		money: 'text-[#3CBD2C]',
		pending: 'text-[#B7791F]'
	};
</script>

<div class="rounded-2xl bg-[#FDFDFD] p-4 shadow-sm">
	<div class="flex items-start justify-between gap-2">
		<p class="text-xs font-medium text-[#83808D]">{label}</p>
		{#if icon}
			<span class="text-[#B9B6C3]">{@html icon}</span>
		{/if}
	</div>

	{#if loading}
		<div class="mt-2 h-7 w-24 animate-pulse rounded bg-gray-100"></div>
		<div class="mt-1.5 h-3 w-16 animate-pulse rounded bg-gray-100"></div>
	{:else}
		<p class="mt-1 text-2xl font-semibold leading-tight {valueTone[tone]}">{value}</p>
		{#if sub}
			<p class="mt-0.5 text-xs text-[#83808D]">{sub}</p>
		{/if}
	{/if}
</div>
