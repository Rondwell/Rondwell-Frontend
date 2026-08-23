<script lang="ts">
	/**
	 * GAP 5 — event budget.
	 *
	 * The differentiator is AUTO-RECONCILIATION: rows that came from a real
	 * settled vendor invoice carry a 🔗 badge and are read-only for `actual`.
	 * That is deliberate and worth surfacing in the UI — a number the ledger
	 * already knows must not be editable here, or the budget and the money
	 * start disagreeing and neither can be trusted.
	 *
	 * Per-guest cost is computed from `expectedGuestCount` and is the number
	 * competitors don't give you. It reads null (not Infinity) when the guest
	 * count is unset.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { formatMoney, majorToKobo, koboToMajor } from '$lib/utils/money';
	import { invalidateEventCache } from '$lib/stores/eventCache.store';
	import {
		BUDGET_CATEGORIES,
		addBudgetExpense,
		addBudgetLineItem,
		budgetExportUrl,
		createBudget,
		deleteBudgetLineItem,
		getBudgetSummary,
		getEventBudget,
		updateBudget,
		updateBudgetLineItem,
		type BudgetCategory,
		type BudgetLineItem,
		type BudgetSummary,
		type EventBudget
	} from '$lib/services/budget.services';
	import { authFetch } from '$lib/services/api.client';

	export let eventTitle = '';

	$: eventId = $page.params.id ?? '';

	let loading = true;
	let saving = false;
	let error = '';
	let budget: EventBudget | null = null;
	let lineItems: BudgetLineItem[] = [];
	let summary: BudgetSummary | null = null;

	// Inline add row
	let showAdd = false;
	let newLabel = '';
	let newCategory: BudgetCategory = 'OTHER';
	let newEstimate = '';

	// Expense modal
	let expenseFor: BudgetLineItem | null = null;
	let expenseAmount = '';
	let expenseNote = '';

	let editingId = '';
	let editLabel = '';
	let editEstimate = '';
	let editCategory: BudgetCategory = 'OTHER';

	// Enable form
	let guestCountInput = '';
	let currencyInput: 'NGN' | 'USD' = 'NGN';

	/**
	 * One colour per category, used by both the donut and the chips so a slice
	 * and its row are recognisably the same thing. Hand-picked rather than
	 * generated: adjacent hues on a 12-slice donut need to be tellable apart at
	 * a glance, which an evenly-spaced hue ramp does not achieve.
	 */
	const CATEGORY_COLORS: Record<string, string> = {
		VENUE: '#F31A7C',
		CATERING: '#F59E0B',
		DRINKS: '#06B6D4',
		DECOR: '#A855F7',
		ENTERTAINMENT: '#3B82F6',
		PHOTOGRAPHY: '#EC4899',
		RENTALS: '#14B8A6',
		LOGISTICS: '#84CC16',
		GIFTS: '#F97316',
		STAFF: '#6366F1',
		MARKETING: '#0EA5E9',
		OTHER: '#83808D'
	};

	const CATEGORY_LABELS: Record<string, string> = {
		VENUE: 'Venue',
		CATERING: 'Catering',
		DRINKS: 'Drinks',
		DECOR: 'Decor',
		ENTERTAINMENT: 'Entertainment',
		PHOTOGRAPHY: 'Photography',
		RENTALS: 'Rentals',
		LOGISTICS: 'Logistics',
		GIFTS: 'Gifts',
		STAFF: 'Staff',
		MARKETING: 'Marketing',
		OTHER: 'Other'
	};

	const STATUS_STYLES: Record<string, string> = {
		PLANNED: 'bg-[#EBECED] text-[#5D646F]',
		COMMITTED: 'bg-[#FFF4E5] text-[#B26A00]',
		PAID: 'bg-[#E3F4E1] text-[#3CBD2C]'
	};

	$: currency = budget?.currency ?? 'NGN';
	$: totals = budget?.totals ?? { estimatedKobo: 0, committedKobo: 0, paidKobo: 0, varianceKobo: 0 };
	$: overBudget = totals.varianceKobo < 0;
	$: spendPercent =
		totals.estimatedKobo > 0
			? Math.min(100, Math.round((totals.paidKobo / totals.estimatedKobo) * 100))
			: 0;

	async function load() {
		if (!eventId) return;
		loading = true;
		error = '';
		try {
			const [data, sum] = await Promise.all([getEventBudget(eventId), getBudgetSummary(eventId)]);
			budget = data.budget;
			lineItems = data.lineItems;
			summary = sum;
		} catch (e: any) {
			error = e?.message ?? 'Could not load the budget';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function enableBudget() {
		saving = true;
		error = '';
		try {
			const guests = parseInt(guestCountInput, 10);
			await createBudget(eventId, {
				currency: currencyInput,
				expectedGuestCount: Number.isFinite(guests) && guests > 0 ? guests : undefined
			});
			// The event document now carries `budget.enabled`; the cached copy
			// would otherwise keep saying it doesn't.
			invalidateEventCache(eventId);
			await load();
		} catch (e: any) {
			error = e?.message ?? 'Could not enable budgeting';
		} finally {
			saving = false;
		}
	}

	async function saveGuestCount(value: string) {
		const guests = parseInt(value, 10);
		if (!Number.isFinite(guests) || guests <= 0) return;
		try {
			budget = await updateBudget(eventId, { expectedGuestCount: guests } as any);
			summary = await getBudgetSummary(eventId);
		} catch (e: any) {
			error = e?.message ?? 'Could not save the guest count';
		}
	}

	async function addLine() {
		if (!newLabel.trim()) return;
		saving = true;
		error = '';
		try {
			await addBudgetLineItem(eventId, {
				label: newLabel.trim(),
				category: newCategory,
				estimatedKobo: majorToKobo(newEstimate, currency)
			});
			newLabel = '';
			newEstimate = '';
			newCategory = 'OTHER';
			showAdd = false;
			await load();
		} catch (e: any) {
			error = e?.message ?? 'Could not add the line item';
		} finally {
			saving = false;
		}
	}

	function startEdit(item: BudgetLineItem) {
		editingId = item._id;
		editLabel = item.label;
		editCategory = item.category;
		editEstimate = String(koboToMajor(item.estimatedKobo, currency));
	}

	async function saveEdit() {
		if (!editingId) return;
		saving = true;
		try {
			await updateBudgetLineItem(eventId, editingId, {
				label: editLabel.trim(),
				category: editCategory,
				estimatedKobo: majorToKobo(editEstimate, currency)
			} as any);
			editingId = '';
			await load();
		} catch (e: any) {
			error = e?.message ?? 'Could not save the line item';
		} finally {
			saving = false;
		}
	}

	async function removeLine(item: BudgetLineItem) {
		if (!confirm(`Remove "${item.label}" from the budget?`)) return;
		try {
			await deleteBudgetLineItem(eventId, item._id);
			await load();
		} catch (e: any) {
			// A 409 here is the server refusing to delete a row backed by a real
			// payment. Surfaced verbatim — it tells them to re-categorise.
			error = e?.message ?? 'Could not remove the line item';
		}
	}

	async function recordExpense() {
		if (!expenseFor) return;
		const kobo = majorToKobo(expenseAmount, currency);
		if (kobo <= 0) {
			error = 'Enter an amount greater than zero';
			return;
		}
		saving = true;
		try {
			await addBudgetExpense(eventId, expenseFor._id, { amountKobo: kobo, note: expenseNote });
			expenseFor = null;
			expenseAmount = '';
			expenseNote = '';
			await load();
		} catch (e: any) {
			error = e?.message ?? 'Could not record the expense';
		} finally {
			saving = false;
		}
	}

	/**
	 * CSV export goes through `authFetch` + a blob rather than a bare href:
	 * the endpoint needs the Authorization header, and a plain link cannot
	 * carry one — it would download a 401 body saved as a .csv.
	 */
	async function downloadCsv() {
		try {
			const res = await authFetch(budgetExportUrl(eventId));
			if (!res.ok) throw new Error('Export failed');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${(eventTitle || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-budget.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e: any) {
			error = e?.message ?? 'Could not export the budget';
		}
	}

	/**
	 * Donut geometry. Inline SVG with no chart library, matching the house
	 * style of `SalesTimelineChart.svelte`.
	 *
	 * Uses `stroke-dasharray` on a single circle per slice — cheaper than arc
	 * paths and it animates for free. Slices are ordered largest-first so the
	 * eye lands on the biggest cost.
	 */
	const R = 60;
	const CIRCUMFERENCE = 2 * Math.PI * R;

	$: donutData = (summary?.byCategory ?? [])
		.filter((c) => c.actualKobo > 0)
		.sort((a, b) => b.actualKobo - a.actualKobo);
	$: donutTotal = donutData.reduce((s, c) => s + c.actualKobo, 0);
	$: donutSlices = (() => {
		let offset = 0;
		return donutData.map((c) => {
			const fraction = donutTotal > 0 ? c.actualKobo / donutTotal : 0;
			const slice = {
				...c,
				color: CATEGORY_COLORS[c.category] ?? '#83808D',
				dash: fraction * CIRCUMFERENCE,
				gap: CIRCUMFERENCE - fraction * CIRCUMFERENCE,
				offset: -offset,
				percent: Math.round(fraction * 100)
			};
			offset += fraction * CIRCUMFERENCE;
			return slice;
		});
	})();
</script>

<div>
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-xl font-semibold text-[#131517]">Budget</h2>
			<p class="mt-1 text-sm text-[#83808D]">
				Plan what the event costs — and let vendor payments reconcile themselves.
			</p>
		</div>
		{#if budget}
			<div class="flex items-center gap-2">
				<button
					on:click={downloadCsv}
					class="flex items-center gap-1.5 rounded-lg border border-[#EBECED] px-3 py-2 text-sm font-medium text-[#5D646F] transition-colors hover:bg-[#F7F7F8]"
				>
					<Icon icon="mdi:download-outline" class="h-4 w-4" />
					Export CSV
				</button>
				<button
					on:click={() => (showAdd = !showAdd)}
					class="flex items-center gap-1.5 rounded-lg bg-[#F31A7C] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
				>
					<Icon icon="mdi:plus" class="h-4 w-4" />
					Add item
				</button>
			</div>
		{/if}
	</div>

	{#if error}
		<div class="mb-4 flex items-start gap-2 rounded-lg bg-[#FDECEC] px-4 py-3 text-sm text-[#D92D20]">
			<Icon icon="mdi:alert-circle-outline" class="mt-0.5 h-4 w-4 flex-shrink-0" />
			<span>{error}</span>
			<button class="ml-auto text-[#D92D20]/70 hover:text-[#D92D20]" on:click={() => (error = '')}>
				<Icon icon="mdi:close" class="h-4 w-4" />
			</button>
		</div>
	{/if}

	{#if loading}
		<div class="space-y-3">
			{#each Array(4) as _}
				<div class="h-16 animate-pulse rounded-xl bg-[#F0EFF1]"></div>
			{/each}
		</div>
	{:else if !budget}
		<!-- Empty state: budgeting is opt-in, so this is a normal state, not an error. -->
		<div class="rounded-2xl border border-[#EBECED] bg-[#FDFDFD] p-8 text-center">
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF0F6]">
				<Icon icon="mdi:wallet-outline" class="h-7 w-7 text-[#F31A7C]" />
			</div>
			<h3 class="mb-1 text-lg font-semibold text-[#131517]">Track what this event costs</h3>
			<p class="mx-auto mb-6 max-w-md text-sm text-[#83808D]">
				Set estimates per category, record what you actually spend, and see the per-guest cost.
				When you book and pay a vendor through Rondwell, the budget updates itself.
			</p>
			<div class="mx-auto flex max-w-sm flex-col gap-3">
				<label class="text-left">
					<span class="mb-1 block text-xs font-medium text-[#5D646F]">Expected guests (optional)</span>
					<input
						type="number"
						min="1"
						bind:value={guestCountInput}
						placeholder="e.g. 150"
						class="w-full rounded-lg border border-[#EBECED] px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none"
					/>
				</label>
				<label class="text-left">
					<span class="mb-1 block text-xs font-medium text-[#5D646F]">Currency</span>
					<select
						bind:value={currencyInput}
						class="w-full rounded-lg border border-[#EBECED] px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none"
					>
						<option value="NGN">NGN (₦)</option>
						<option value="USD">USD ($)</option>
					</select>
				</label>
				<button
					on:click={enableBudget}
					disabled={saving}
					class="rounded-lg bg-[#F31A7C] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{saving ? 'Setting up…' : 'Start budgeting'}
				</button>
			</div>
		</div>
	{:else}
		<!-- Header cards -->
		<div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Estimated</p>
				<p class="text-lg font-semibold text-[#131517]">{formatMoney(totals.estimatedKobo, currency)}</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Committed</p>
				<p class="text-lg font-semibold text-[#131517]">{formatMoney(totals.committedKobo, currency)}</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">Paid</p>
				<p class="text-lg font-semibold text-[#131517]">{formatMoney(totals.paidKobo, currency)}</p>
			</div>
			<div class="rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
				<p class="mb-1 text-xs font-medium text-[#83808D]">
					{overBudget ? 'Over budget' : 'Remaining'}
				</p>
				<!-- Signed on purpose: "how far over am I" is the number they look for. -->
				<p class="text-lg font-semibold {overBudget ? 'text-[#D92D20]' : 'text-[#3CBD2C]'}">
					{formatMoney(Math.abs(totals.varianceKobo), currency)}
				</p>
			</div>
		</div>

		<!-- Progress + per-guest -->
		<div class="mb-6 rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-4">
			<div class="mb-2 flex items-center justify-between text-sm">
				<span class="font-medium text-[#131517]">
					{formatMoney(totals.paidKobo, currency)} of {formatMoney(totals.estimatedKobo, currency)} spent
				</span>
				<span class="text-[#83808D]">{spendPercent}%</span>
			</div>
			<div class="h-2 w-full overflow-hidden rounded-full bg-[#F0EFF1]">
				<div
					class="h-full rounded-full transition-all duration-500 {overBudget ? 'bg-[#D92D20]' : 'bg-[#F31A7C]'}"
					style="width: {spendPercent}%"
				></div>
			</div>

			<div class="mt-4 flex flex-wrap items-center gap-4 border-t border-[#F0EFF1] pt-4">
				<label class="flex items-center gap-2 text-sm">
					<span class="text-[#83808D]">Expected guests</span>
					<input
						type="number"
						min="1"
						value={budget.expectedGuestCount ?? ''}
						on:change={(e) => saveGuestCount(e.currentTarget.value)}
						placeholder="—"
						class="w-24 rounded-lg border border-[#EBECED] px-2 py-1 text-sm focus:border-[#F31A7C] focus:outline-none"
					/>
				</label>
				{#if summary?.perGuestKobo !== null && summary?.perGuestKobo !== undefined}
					<div class="flex items-center gap-1.5 rounded-lg bg-[#F7F7F8] px-3 py-1.5 text-sm">
						<Icon icon="mdi:account-cash-outline" class="h-4 w-4 text-[#83808D]" />
						<span class="text-[#5D646F]">
							<span class="font-semibold text-[#131517]">{formatMoney(summary.perGuestKobo, currency)}</span>
							per guest
						</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Donut by category -->
		{#if donutSlices.length > 0}
			<div class="mb-6 rounded-xl border border-[#EBECED] bg-[#FDFDFD] p-5">
				<h3 class="mb-4 text-sm font-semibold text-[#131517]">Where the money went</h3>
				<div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
					<svg viewBox="0 0 160 160" class="h-40 w-40 flex-shrink-0 -rotate-90">
						{#each donutSlices as slice}
							<circle
								cx="80"
								cy="80"
								r={R}
								fill="none"
								stroke={slice.color}
								stroke-width="20"
								stroke-dasharray="{slice.dash} {slice.gap}"
								stroke-dashoffset={slice.offset}
							/>
						{/each}
						<!-- Centre label sits upright despite the group rotation. -->
						<text
							x="80"
							y="76"
							text-anchor="middle"
							class="fill-[#83808D] text-[9px]"
							transform="rotate(90 80 80)">Total spent</text
						>
						<text
							x="80"
							y="90"
							text-anchor="middle"
							class="fill-[#131517] text-[12px] font-semibold"
							transform="rotate(90 80 80)">{formatMoney(donutTotal, currency)}</text
						>
					</svg>

					<div class="w-full flex-1 space-y-2">
						{#each donutSlices as slice}
							<div class="flex items-center gap-2 text-sm">
								<span class="h-2.5 w-2.5 flex-shrink-0 rounded-full" style="background:{slice.color}"></span>
								<span class="flex-1 truncate text-[#5D646F]">{CATEGORY_LABELS[slice.category] ?? slice.category}</span>
								<span class="text-xs text-[#83808D]">{slice.percent}%</span>
								<span class="w-24 text-right font-medium text-[#131517]">
									{formatMoney(slice.actualKobo, currency)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Inline add row -->
		{#if showAdd}
			<div class="mb-4 rounded-xl border border-[#F31A7C]/30 bg-[#FDF0F6]/40 p-4">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
					<label class="flex-1">
						<span class="mb-1 block text-xs font-medium text-[#5D646F]">Item</span>
						<input
							bind:value={newLabel}
							placeholder="e.g. Catering — main course"
							class="w-full rounded-lg border border-[#EBECED] bg-white px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none"
						/>
					</label>
					<label class="sm:w-44">
						<span class="mb-1 block text-xs font-medium text-[#5D646F]">Category</span>
						<select
							bind:value={newCategory}
							class="w-full rounded-lg border border-[#EBECED] bg-white px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none"
						>
							{#each BUDGET_CATEGORIES as cat}
								<option value={cat}>{CATEGORY_LABELS[cat]}</option>
							{/each}
						</select>
					</label>
					<label class="sm:w-36">
						<span class="mb-1 block text-xs font-medium text-[#5D646F]">Estimate</span>
						<input
							type="number"
							min="0"
							step="0.01"
							bind:value={newEstimate}
							placeholder="0.00"
							class="w-full rounded-lg border border-[#EBECED] bg-white px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none"
						/>
					</label>
					<div class="flex gap-2">
						<button
							on:click={addLine}
							disabled={saving || !newLabel.trim()}
							class="rounded-lg bg-[#F31A7C] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
						>
							Add
						</button>
						<button
							on:click={() => (showAdd = false)}
							class="rounded-lg border border-[#EBECED] bg-white px-3 py-2 text-sm text-[#5D646F] hover:bg-[#F7F7F8]"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Line items -->
		{#if lineItems.length === 0}
			<div class="rounded-xl border border-dashed border-[#EBECED] p-8 text-center">
				<p class="text-sm text-[#83808D]">
					No line items yet. Add your first cost, or book a vendor and watch it appear here.
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto rounded-xl border border-[#EBECED]">
				<table class="w-full min-w-[720px] text-sm">
					<thead class="bg-[#F7F7F8] text-left text-xs font-medium text-[#83808D]">
						<tr>
							<th class="px-4 py-3">Item</th>
							<th class="px-4 py-3">Category</th>
							<th class="px-4 py-3 text-right">Estimated</th>
							<th class="px-4 py-3 text-right">Actual</th>
							<th class="px-4 py-3 text-right">Variance</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[#F0EFF1] bg-white">
						{#each lineItems as item (item._id)}
							{@const variance = item.estimatedKobo - item.actualKobo}
							<tr class="hover:bg-[#FCFCFD]">
								{#if editingId === item._id}
									<td class="px-4 py-2">
										<input
											bind:value={editLabel}
											class="w-full rounded border border-[#EBECED] px-2 py-1 text-sm focus:border-[#F31A7C] focus:outline-none"
										/>
									</td>
									<td class="px-4 py-2">
										<select
											bind:value={editCategory}
											class="w-full rounded border border-[#EBECED] px-2 py-1 text-sm focus:border-[#F31A7C] focus:outline-none"
										>
											{#each BUDGET_CATEGORIES as cat}
												<option value={cat}>{CATEGORY_LABELS[cat]}</option>
											{/each}
										</select>
									</td>
									<td class="px-4 py-2">
										<input
											type="number"
											min="0"
											step="0.01"
											bind:value={editEstimate}
											class="w-24 rounded border border-[#EBECED] px-2 py-1 text-right text-sm focus:border-[#F31A7C] focus:outline-none"
										/>
									</td>
									<td colspan="3" class="px-4 py-2 text-right text-xs text-[#83808D]">
										Actual is set by expenses and vendor payments
									</td>
									<td class="px-4 py-2">
										<div class="flex justify-end gap-1">
											<button
												on:click={saveEdit}
												disabled={saving}
												class="rounded p-1.5 text-[#3CBD2C] hover:bg-[#E3F4E1]"
												aria-label="Save"
											>
												<Icon icon="mdi:check" class="h-4 w-4" />
											</button>
											<button
												on:click={() => (editingId = '')}
												class="rounded p-1.5 text-[#83808D] hover:bg-[#F0EFF1]"
												aria-label="Cancel"
											>
												<Icon icon="mdi:close" class="h-4 w-4" />
											</button>
										</div>
									</td>
								{:else}
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<span class="font-medium text-[#131517]">{item.label}</span>
											{#if item.autoCreated}
												<!-- The differentiator, made visible. -->
												<span
													class="flex items-center gap-1 rounded-full bg-[#E8F0FE] px-2 py-0.5 text-[10px] font-medium text-[#1A73E8]"
													title="Created from a vendor booking you paid through Rondwell"
												>
													<Icon icon="mdi:link-variant" class="h-3 w-3" />
													From vendor booking
												</span>
											{/if}
										</div>
									</td>
									<td class="px-4 py-3">
										<span
											class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
											style="background:{(CATEGORY_COLORS[item.category] ?? '#83808D')}1A; color:{CATEGORY_COLORS[item.category] ?? '#83808D'}"
										>
											{CATEGORY_LABELS[item.category] ?? item.category}
										</span>
									</td>
									<td class="px-4 py-3 text-right text-[#5D646F]">
										{formatMoney(item.estimatedKobo, item.currency)}
									</td>
									<td class="px-4 py-3 text-right font-medium text-[#131517]">
										{formatMoney(item.actualKobo, item.currency)}
									</td>
									<td class="px-4 py-3 text-right {variance < 0 ? 'text-[#D92D20]' : 'text-[#83808D]'}">
										{variance < 0 ? '−' : ''}{formatMoney(Math.abs(variance), item.currency)}
									</td>
									<td class="px-4 py-3">
										<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {STATUS_STYLES[item.status]}">
											{item.status.charAt(0) + item.status.slice(1).toLowerCase()}
										</span>
									</td>
									<td class="px-4 py-3">
										<div class="flex justify-end gap-1">
											<button
												on:click={() => (expenseFor = item)}
												class="rounded p-1.5 text-[#5D646F] hover:bg-[#F0EFF1]"
												title="Record a payment"
												aria-label="Record a payment"
											>
												<Icon icon="mdi:cash-plus" class="h-4 w-4" />
											</button>
											<button
												on:click={() => startEdit(item)}
												class="rounded p-1.5 text-[#5D646F] hover:bg-[#F0EFF1]"
												title="Edit"
												aria-label="Edit"
											>
												<Icon icon="mdi:pencil-outline" class="h-4 w-4" />
											</button>
											<button
												on:click={() => removeLine(item)}
												class="rounded p-1.5 text-[#D92D20] hover:bg-[#FDECEC]"
												title="Remove"
												aria-label="Remove"
											>
												<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
											</button>
										</div>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>

<!-- Record-expense modal -->
{#if expenseFor}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
			<div class="mb-4 flex items-start justify-between">
				<div>
					<h3 class="text-base font-semibold text-[#131517]">Record a payment</h3>
					<p class="mt-0.5 text-sm text-[#83808D]">{expenseFor.label}</p>
				</div>
				<button
					on:click={() => (expenseFor = null)}
					class="rounded p-1 text-[#83808D] hover:bg-[#F0EFF1]"
					aria-label="Close"
				>
					<Icon icon="mdi:close" class="h-5 w-5" />
				</button>
			</div>

			<label class="mb-3 block">
				<span class="mb-1 block text-xs font-medium text-[#5D646F]">Amount</span>
				<input
					type="number"
					min="0"
					step="0.01"
					bind:value={expenseAmount}
					placeholder="0.00"
					class="w-full rounded-lg border border-[#EBECED] px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none"
				/>
			</label>
			<label class="mb-4 block">
				<span class="mb-1 block text-xs font-medium text-[#5D646F]">Note (optional)</span>
				<input
					bind:value={expenseNote}
					placeholder="e.g. 50% deposit"
					class="w-full rounded-lg border border-[#EBECED] px-3 py-2 text-sm focus:border-[#F31A7C] focus:outline-none"
				/>
			</label>

			<button
				on:click={recordExpense}
				disabled={saving}
				class="w-full rounded-lg bg-[#F31A7C] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
			>
				{saving ? 'Saving…' : 'Record payment'}
			</button>
		</div>
	</div>
{/if}
