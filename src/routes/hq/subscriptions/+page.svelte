<script lang="ts">
	/**
	 * Admin — Subscription Management.
	 *
	 * Lists the plan catalog (FREE / PLUS) in a table and opens an editable
	 * detail view to modify any number: pricing, commission and limits.
	 *
	 * ── Units ────────────────────────────────────────────────────────────────
	 *   - Pricing is stored in MINOR units (kobo / cents); the form edits MAJOR
	 *     units (₦ / $) and converts on save.
	 *   - Commission is stored as a FRACTION (0.04); the form edits PERCENT (4)
	 *     and converts on save.
	 *   - `maxParticipantsPerEvent` is the per-event ATTENDEE cap. The
	 *     vendor/speaker/exhibitor caps are the "participant" limits.
	 *   - A limit of -1 (or 999999) means unlimited.
	 */
	import { onMount } from 'svelte';
	import {
		getSubscriptionPlans,
		updateSubscriptionPlan,
		type SubscriptionPlan,
	} from '$lib/services/admin.services';
	import { toast } from '$lib/stores/toast.store';
	import Icon from '@iconify/svelte';

	let plans: SubscriptionPlan[] = [];
	let loading = true;
	let error = '';

	let selected: SubscriptionPlan | null = null;
	let showDetail = false;
	let saving = false;

	// ── Editable form model (major units / percents) ──────────────────────────
	let form = {
		ngnMonthly: 0,
		ngnYearly: 0,
		usdMonthly: 0,
		usdYearly: 0,
		ticketNGN: 0,
		ticketUSD: 0,
		fxMarkup: 0,
		vendorFee: 0,
		exhibitorFee: 0,
		withdrawalFee: 0,
		usdSettlementFee: 0,
		limits: {
			emails: 0,
			aiPrompts: 0,
			activePaidEvents: 0,
			maxParticipantsPerEvent: 0,
			seatingLayoutEvents: 0,
			maxCollections: 0,
			maxAdminsPerEvent: 0,
			maxVendorsPerEvent: 0,
			maxSpeakersPerEvent: 0,
			maxExhibitorsPerEvent: 0,
		},
		features: '',
		isActive: true,
	};

	const UNLIMITED = (n: number) => n === -1 || n >= 999999;
	const fmtLimit = (n: number) => (UNLIMITED(n) ? 'Unlimited' : String(n));
	const money = (minor: number, sym: string) =>
		`${sym}${((minor ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
	const pct = (frac: number) => `${Math.round((frac ?? 0) * 1000) / 10}%`;

	async function load() {
		loading = true;
		error = '';
		try {
			plans = await getSubscriptionPlans();
		} catch (e: any) {
			error = e?.message || 'Failed to load subscription plans';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function openDetail(plan: SubscriptionPlan) {
		selected = plan;
		const bc = plan.pricing?.byCurrency ?? {};
		form = {
			ngnMonthly: (bc.NGN?.monthly ?? plan.pricing?.monthly ?? 0) / 100,
			ngnYearly: (bc.NGN?.yearly ?? plan.pricing?.yearly ?? 0) / 100,
			usdMonthly: (bc.USD?.monthly ?? 0) / 100,
			usdYearly: (bc.USD?.yearly ?? 0) / 100,
			ticketNGN: (plan.commissionStructure?.ticketFees?.NGN ?? 0) * 100,
			ticketUSD: (plan.commissionStructure?.ticketFees?.USD ?? 0) * 100,
			fxMarkup: (plan.commissionStructure?.ticketFees?.FX_Markup ?? 0) * 100,
			vendorFee: (plan.commissionStructure?.vendorBookingFee ?? 0) * 100,
			exhibitorFee: (plan.commissionStructure?.exhibitorBookingFee ?? 0) * 100,
			withdrawalFee: (plan.commissionStructure?.withdrawalFee ?? 0) * 100,
			usdSettlementFee: (plan.commissionStructure?.usdSettlementFee ?? 0) * 100,
			limits: {
				emails: plan.limits?.emails ?? 0,
				aiPrompts: plan.limits?.aiPrompts ?? 0,
				activePaidEvents: plan.limits?.activePaidEvents ?? 0,
				maxParticipantsPerEvent: plan.limits?.maxParticipantsPerEvent ?? 0,
				seatingLayoutEvents: plan.limits?.seatingLayoutEvents ?? 0,
				maxCollections: plan.limits?.maxCollections ?? 0,
				maxAdminsPerEvent: plan.limits?.maxAdminsPerEvent ?? 0,
				maxVendorsPerEvent: plan.limits?.maxVendorsPerEvent ?? 0,
				maxSpeakersPerEvent: plan.limits?.maxSpeakersPerEvent ?? 0,
				maxExhibitorsPerEvent: plan.limits?.maxExhibitorsPerEvent ?? 0,
			},
			features: (plan.features ?? []).join('\n'),
			isActive: plan.isActive ?? true,
		};
		showDetail = true;
	}

	function closeDetail() {
		showDetail = false;
		selected = null;
	}

	/** Percent (e.g. 4) → fraction (0.04), rounded to avoid float noise. */
	const toFraction = (p: number) => Math.round(Number(p) * 100) / 10000;
	/** Major (₦/$) → minor units (kobo/cents). */
	const toMinor = (major: number) => Math.round(Number(major) * 100);

	async function save() {
		if (!selected) return;
		// Guard the fat-finger: percents must be 0..100, prices non-negative.
		const pctFields = [form.ticketNGN, form.ticketUSD, form.fxMarkup, form.vendorFee, form.exhibitorFee, form.withdrawalFee, form.usdSettlementFee];
		if (pctFields.some((v) => Number(v) < 0 || Number(v) > 100)) {
			toast.error('Commission percentages must be between 0 and 100.');
			return;
		}
		const limitVals = Object.values(form.limits);
		if (limitVals.some((v) => !Number.isInteger(Number(v)) || Number(v) < -1)) {
			toast.error('Limits must be whole numbers ≥ -1 (-1 = unlimited).');
			return;
		}

		saving = true;
		try {
			const updated = await updateSubscriptionPlan(selected.planId, {
				pricing: {
					byCurrency: {
						NGN: { monthly: toMinor(form.ngnMonthly), yearly: toMinor(form.ngnYearly) },
						USD: { monthly: toMinor(form.usdMonthly), yearly: toMinor(form.usdYearly) },
					},
				},
				commissionStructure: {
					ticketFees: {
						NGN: toFraction(form.ticketNGN),
						USD: toFraction(form.ticketUSD),
						FX_Markup: toFraction(form.fxMarkup),
					},
					vendorBookingFee: toFraction(form.vendorFee),
					exhibitorBookingFee: toFraction(form.exhibitorFee),
					withdrawalFee: toFraction(form.withdrawalFee),
					usdSettlementFee: toFraction(form.usdSettlementFee),
				},
				limits: { ...form.limits },
				features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
				isActive: form.isActive,
			});
			// Refresh the row in the table.
			plans = plans.map((p) => (p.planId === updated.planId ? updated : p));
			toast.success(`${updated.planId} plan updated.`);
			closeDetail();
		} catch (e: any) {
			toast.error(e?.message || 'Failed to update plan');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>Subscriptions | Rondwell HQ</title></svelte:head>

<div class="mb-6">
	<h1 class="text-xl font-semibold text-gray-900">Subscription Management</h1>
	<p class="mt-1 text-sm text-gray-500">
		Edit the FREE and PLUS plan numbers — pricing, commission and limits. Changes apply to new
		settlements and checks. <span class="font-medium text-gray-700">Max attendees</span> is the
		per-event attendee cap; vendor / speaker / exhibitor are the participant caps.
	</p>
</div>

{#if loading}
	<div class="rounded-xl bg-white p-6">
		{#each Array(2) as _}
			<div class="mb-3 h-12 animate-pulse rounded-lg bg-gray-100"></div>
		{/each}
	</div>
{:else if error}
	<div class="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">
		<p class="text-sm text-red-700">{error}</p>
		<button on:click={load} class="text-sm font-medium text-red-700 underline">Retry</button>
	</div>
{:else}
	<div class="overflow-hidden rounded-xl bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-gray-100 text-xs uppercase text-gray-400">
					<tr>
						<th class="px-4 py-3">Plan</th>
						<th class="px-4 py-3">Monthly</th>
						<th class="px-4 py-3">Yearly</th>
						<th class="px-4 py-3">Ticket fee</th>
						<th class="px-4 py-3">Attendees / event</th>
						<th class="px-4 py-3">Vendors / Speakers / Exhibitors</th>
						<th class="px-4 py-3">Status</th>
						<th class="px-4 py-3 text-right">Action</th>
					</tr>
				</thead>
				<tbody>
					{#each plans as plan (plan.planId)}
						<tr class="border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
							<td class="px-4 py-3">
								<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold {plan.planId === 'PLUS' ? 'bg-[#FDE0EE] text-[#F31A7C]' : 'bg-gray-100 text-gray-700'}">
									Rondwell {plan.planId === 'PLUS' ? 'PLUS' : 'Free'}
								</span>
							</td>
							<td class="px-4 py-3 text-gray-700">
								{money(plan.pricing?.byCurrency?.NGN?.monthly ?? plan.pricing?.monthly ?? 0, '₦')}
								<span class="text-gray-400">/ {money(plan.pricing?.byCurrency?.USD?.monthly ?? 0, '$')}</span>
							</td>
							<td class="px-4 py-3 text-gray-700">
								{money(plan.pricing?.byCurrency?.NGN?.yearly ?? plan.pricing?.yearly ?? 0, '₦')}
								<span class="text-gray-400">/ {money(plan.pricing?.byCurrency?.USD?.yearly ?? 0, '$')}</span>
							</td>
							<td class="px-4 py-3 text-gray-700">{pct(plan.commissionStructure?.ticketFees?.NGN ?? 0)}</td>
							<td class="px-4 py-3 text-gray-700">{fmtLimit(plan.limits?.maxParticipantsPerEvent ?? 0)}</td>
							<td class="px-4 py-3 text-gray-700">{fmtLimit(plan.limits?.maxVendorsPerEvent ?? 0)}</td>
							<td class="px-4 py-3">
								{#if plan.isActive}
									<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
								{:else}
									<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Inactive</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right">
								<button on:click={() => openDetail(plan)}
									class="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
									Edit
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}

<!-- ─── Editable detail drawer ─── -->
{#if showDetail && selected}
	<div class="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" tabindex="-1"
		on:click|self={closeDetail} on:keydown={(e) => e.key === 'Escape' && closeDetail()}>
		<div class="h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl">
			<div class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
				<div>
					<h2 class="text-base font-semibold text-gray-900">Edit Rondwell {selected.planId === 'PLUS' ? 'PLUS' : 'Free'}</h2>
					<p class="text-xs text-gray-400">Numbers apply platform-wide. Use -1 for unlimited.</p>
				</div>
				<button on:click={closeDetail} aria-label="Close" class="text-gray-400 hover:text-gray-600">
					<Icon icon="mdi:close" class="text-xl" />
				</button>
			</div>

			<div class="space-y-6 px-6 py-5">
				<!-- Pricing -->
				<section>
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Pricing (major units)</h3>
					<div class="grid grid-cols-2 gap-3">
						<label class="text-xs text-gray-600">NGN Monthly (₦)
							<input type="number" min="0" bind:value={form.ngnMonthly} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">NGN Yearly (₦)
							<input type="number" min="0" bind:value={form.ngnYearly} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">USD Monthly ($)
							<input type="number" min="0" bind:value={form.usdMonthly} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">USD Yearly ($)
							<input type="number" min="0" bind:value={form.usdYearly} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
					</div>
				</section>

				<!-- Commission -->
				<section>
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Commission (%)</h3>
					<div class="grid grid-cols-2 gap-3">
						<label class="text-xs text-gray-600">Ticket fee — NGN
							<input type="number" min="0" max="100" step="0.01" bind:value={form.ticketNGN} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Ticket fee — USD
							<input type="number" min="0" max="100" step="0.01" bind:value={form.ticketUSD} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">FX markup
							<input type="number" min="0" max="100" step="0.01" bind:value={form.fxMarkup} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Vendor booking fee
							<input type="number" min="0" max="100" step="0.01" bind:value={form.vendorFee} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Exhibitor booking fee
							<input type="number" min="0" max="100" step="0.01" bind:value={form.exhibitorFee} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Withdrawal fee
							<input type="number" min="0" max="100" step="0.01" bind:value={form.withdrawalFee} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">USD settlement fee
							<input type="number" min="0" max="100" step="0.01" bind:value={form.usdSettlementFee} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
					</div>
				</section>

				<!-- Limits -->
				<section>
					<h3 class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Limits</h3>
					<p class="mb-3 text-[11px] text-gray-400">Whole numbers. -1 = unlimited. Max attendees = per-event attendee cap.</p>
					<div class="grid grid-cols-2 gap-3">
						<label class="text-xs text-gray-600">Max attendees / event
							<input type="number" step="1" bind:value={form.limits.maxParticipantsPerEvent} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Active paid events
							<input type="number" step="1" bind:value={form.limits.activePaidEvents} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Max vendors / event
							<input type="number" step="1" bind:value={form.limits.maxVendorsPerEvent} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Max speakers / event
							<input type="number" step="1" bind:value={form.limits.maxSpeakersPerEvent} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Max exhibitors / event
							<input type="number" step="1" bind:value={form.limits.maxExhibitorsPerEvent} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Max admins / event
							<input type="number" step="1" bind:value={form.limits.maxAdminsPerEvent} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">3D seating events / month
							<input type="number" step="1" bind:value={form.limits.seatingLayoutEvents} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Max collections
							<input type="number" step="1" bind:value={form.limits.maxCollections} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">Emails / month
							<input type="number" step="1" bind:value={form.limits.emails} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
						<label class="text-xs text-gray-600">AI prompts / month
							<input type="number" step="1" bind:value={form.limits.aiPrompts} class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
						</label>
					</div>
				</section>

				<!-- Features -->
				<section>
					<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Features (one per line)</h3>
					<textarea bind:value={form.features} rows="8"
						class="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"></textarea>
				</section>

				<!-- Active -->
				<label class="flex items-center gap-2 text-sm text-gray-700">
					<input type="checkbox" bind:checked={form.isActive} class="h-4 w-4 rounded border-gray-300" />
					Plan is active (visible on pricing page)
				</label>
			</div>

			<div class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
				<button on:click={closeDetail} disabled={saving}
					class="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
					Cancel
				</button>
				<button on:click={save} disabled={saving}
					class="rounded-lg bg-[#F31A7C] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#d1176b] disabled:opacity-50">
					{saving ? 'Saving…' : 'Save changes'}
				</button>
			</div>
		</div>
	</div>
{/if}
