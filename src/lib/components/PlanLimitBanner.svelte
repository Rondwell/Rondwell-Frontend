<script lang="ts">
	/**
	 * FE-P3-01 (NEW-8.1) — Reusable plan-limit banner.
	 *
	 * Renders user-friendly copy when a server action raises
	 * `PLAN_LIMIT_EXCEEDED` (HTTP 403). Drop into any catch block:
	 *
	 *   try { await action(); }
	 *   catch (e) {
	 *     if (isPlanLimitError(e)) limitError = mapPlanLimit(e);
	 *   }
	 *
	 *   <PlanLimitBanner copy={limitError} on:dismiss={() => limitError = null} />
	 *
	 * Or render proactively from `usageStore` for at-a-glance dashboard
	 * banners (see `Subscription.svelte`'s "Usage this period" block).
	 */
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	import type { PlanLimitCopy } from '$lib/utils/planLimitErrors';

	export let copy: PlanLimitCopy | null = null;
	export let dismissible = true;
	export let compact = false;

	const dispatch = createEventDispatcher<{ dismiss: void; upgrade: void }>();

	function handleUpgrade() {
		dispatch('upgrade');
		goto(copy?.ctaHref ?? '/settings?tab=subscription');
	}
</script>

{#if copy}
	<div
		class="rounded-xl border border-amber-200 bg-amber-50 {compact ? 'p-3' : 'p-4'} text-sm"
		role="alert"
	>
		<div class="flex items-start gap-3">
			<Icon icon="mdi:alert-circle-outline" class="mt-0.5 flex-shrink-0 text-lg text-amber-600" />
			<div class="flex-1">
				<p class="font-medium text-amber-900">{copy.title}</p>
				<p class="mt-0.5 text-amber-800">{copy.body}</p>

				{#if copy.limit !== undefined && copy.current !== undefined && copy.limit > 0}
					<!-- Progress bar — visualises current/limit to make consumption obvious. -->
					<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
						<div
							class="h-full bg-amber-500 transition-all"
							style="width: {Math.min(100, Math.round((copy.current / copy.limit) * 100))}%;"
						></div>
					</div>
					<p class="mt-1 text-[11px] text-amber-700">
						{copy.current} / {copy.limit} used
						{#if copy.tier}· {copy.tier} plan{/if}
					</p>
				{/if}

				<div class="mt-3 flex flex-wrap items-center gap-2">
					<button
						type="button"
						on:click={handleUpgrade}
						class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
					>
						{copy.cta}
					</button>
					{#if dismissible}
						<button
							type="button"
							on:click={() => dispatch('dismiss')}
							class="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
						>
							Dismiss
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
