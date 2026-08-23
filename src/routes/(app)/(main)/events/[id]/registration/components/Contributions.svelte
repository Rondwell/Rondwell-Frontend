<!--
	GAP 6 — Guest contributions.

	Two halves in one tab, deliberately:
	  - the CONFIG the organizer controls (suggested chips, bounds, ask copy)
	  - the MONEY that has actually arrived, with a thank-you action.

	Splitting them would mean an organizer configuring a feature they can't see
	working. Every bound saved here is re-clamped server-side — the payment
	service treats these values as the authority for what a guest may be
	charged, so `normalizeGuestContributions` is the real gate, not this form.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { toast } from '$lib/stores/toast.store';
	import { cleanErrorMessage } from '$lib/utils/errorMessage';
	import { formatMoney, majorToKobo, koboToMajor } from '$lib/utils/money';
	import {
		getEventContributions,
		sendThankYou,
		type ContributionRow,
		type ContributionRollupRow
	} from '$lib/services/contribution.services';

	export let eventId: string;
	export let eventData: any = null;

	// ── Settings ──────────────────────────────────────────────────────────
	// `donationsEnabled` is the legacy MASTER switch; `guestContributions` is
	// the config block. The server requires BOTH to be true before it will
	// take a guest's money, so this UI writes them together and never lets
	// them disagree.
	let enabled = false;
	let allowCustom = true;
	let minMajor = 500;
	let maxMajor: number | null = null;
	let currency: 'NGN' | 'USD' = 'NGN';
	let askMessage = '';
	let showOnPublicPage = true;
	let suggestedMajor: number[] = [2000, 5000, 10000];
	let seeded = false;
	let saving = false;

	$: if (eventData && !seeded) {
		const gc = eventData.guestContributions ?? {};
		// Effective enablement is the AND — see above.
		enabled = eventData.donationsEnabled === true && gc.enabled === true;
		allowCustom = gc.allowCustom !== false;
		currency = gc.currency === 'USD' ? 'USD' : 'NGN';
		minMajor = koboToMajor(gc.minKobo ?? 50000, currency);
		maxMajor = gc.maxKobo ? koboToMajor(gc.maxKobo, currency) : null;
		askMessage = gc.message ?? '';
		showOnPublicPage = gc.showOnPublicPage !== false;
		suggestedMajor = Array.isArray(gc.suggestedAmountsKobo) && gc.suggestedAmountsKobo.length
			? gc.suggestedAmountsKobo.map((k: number) => koboToMajor(k, currency))
			: [2000, 5000, 10000];
		seeded = true;
	}

	function addSuggestion() {
		if (suggestedMajor.length >= 6) return;
		suggestedMajor = [...suggestedMajor, 0];
	}
	function removeSuggestion(i: number) {
		suggestedMajor = suggestedMajor.filter((_, idx) => idx !== i);
	}

	async function saveSettings() {
		saving = true;
		try {
			const { updateEvent } = await import('$lib/services/event.services');
			const suggestedAmountsKobo = suggestedMajor
				.map((v) => majorToKobo(v, currency))
				.filter((k) => k > 0)
				.slice(0, 6);
			const minKobo = Math.max(0, majorToKobo(minMajor, currency));
			// 0 / blank means UNCAPPED, never a literal zero cap — a zero cap
			// would clamp every contribution to nothing while the UI looked fine.
			const maxKobo = maxMajor && maxMajor > 0 ? majorToKobo(maxMajor, currency) : undefined;

			await updateEvent(eventId, {
				donationsEnabled: enabled,
				guestContributions: {
					enabled,
					suggestedAmountsKobo,
					allowCustom,
					minKobo,
					maxKobo,
					currency,
					message: askMessage.slice(0, 300),
					showOnPublicPage
				}
			} as any);
			seeded = false; // re-seed from whatever the server normalised
			toast.success('Contribution settings saved.');
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Failed to save contribution settings'));
		} finally {
			saving = false;
		}
	}

	// ── Received contributions ────────────────────────────────────────────
	let rows: ContributionRow[] = [];
	let rollup: ContributionRollupRow[] = [];
	let total = 0;
	let loadingRows = true;
	let loadError = '';
	let thanking = new Set<string>();
	let bulkThanking = false;

	async function loadRows() {
		loadingRows = true;
		loadError = '';
		try {
			const res = await getEventContributions(eventId, { limit: 100 });
			rows = res.data;
			rollup = res.rollup;
			total = res.pagination.total;
		} catch (e: any) {
			loadError = cleanErrorMessage(e.message || 'Could not load contributions');
		} finally {
			loadingRows = false;
		}
	}

	onMount(loadRows);

	$: rsvpRollup = rollup.find((r) => r.kind === 'RSVP_CONTRIBUTION');
	$: settledRows = rows.filter((r) => r.status === 'COMPLETED');
	$: unthanked = settledRows.filter((r) => !r.thankYouSentAt);
	$: displayCurrency = settledRows[0]?.currency ?? currency;

	async function thankOne(row: ContributionRow) {
		if (row.thankYouSentAt) return;
		thanking = new Set(thanking).add(row._id);
		try {
			await sendThankYou([row._id]);
			// Optimistic: the endpoint is idempotent, so a refresh would show the
			// same thing. Reflect it immediately rather than re-fetching a page.
			rows = rows.map((r) =>
				r._id === row._id ? { ...r, thankYouSentAt: new Date().toISOString() } : r
			);
			toast.success(`Thank-you sent to ${row.contributorName}.`);
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Failed to send thank-you'));
		} finally {
			const next = new Set(thanking);
			next.delete(row._id);
			thanking = next;
		}
	}

	async function thankAll() {
		if (unthanked.length === 0) return;
		bulkThanking = true;
		try {
			const { sent } = await sendThankYou(unthanked.map((r) => r._id));
			const now = new Date().toISOString();
			const ids = new Set(unthanked.map((r) => r._id));
			rows = rows.map((r) => (ids.has(r._id) ? { ...r, thankYouSentAt: now } : r));
			toast.success(`Thank-you sent to ${sent} contributor${sent === 1 ? '' : 's'}.`);
		} catch (e: any) {
			toast.error(cleanErrorMessage(e.message || 'Failed to send thank-yous'));
		} finally {
			bulkThanking = false;
		}
	}

	function fmtDate(d?: string) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-8">
	<!-- ── Money received ─────────────────────────────────────────────── -->
	<section>
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">Contributions received</h2>
				<p class="text-xs text-[#83808D]">
					Gifts guests added at RSVP. Charged separately from their ticket, so refunding a ticket
					never claws back the gift.
				</p>
			</div>
			{#if unthanked.length > 0}
				<button
					on:click={thankAll}
					disabled={bulkThanking}
					class="flex items-center gap-1.5 rounded-md bg-[#F31A7C] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d81869] disabled:opacity-50"
				>
					<Icon icon="mdi:email-heart-outline" class="text-base" />
					{bulkThanking ? 'Sending…' : `Thank all (${unthanked.length})`}
				</button>
			{/if}
		</div>

		<div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-xl bg-[#FDFDFD] p-4 shadow-sm">
				<p class="text-xs text-[#83808D]">Gross</p>
				<p class="mt-1 text-lg font-semibold">
					{formatMoney(rsvpRollup?.gross ?? 0, displayCurrency)}
				</p>
			</div>
			<div class="rounded-xl bg-[#FDFDFD] p-4 shadow-sm">
				<p class="text-xs text-[#83808D]">Platform fee</p>
				<p class="mt-1 text-lg font-semibold">
					{formatMoney(rsvpRollup?.platformFee ?? 0, displayCurrency)}
				</p>
			</div>
			<div class="rounded-xl bg-[#FDFDFD] p-4 shadow-sm">
				<p class="text-xs text-[#83808D]">Net to you</p>
				<p class="mt-1 text-lg font-semibold text-[#3CBD2C]">
					{formatMoney(rsvpRollup?.net ?? 0, displayCurrency)}
				</p>
			</div>
			<div class="rounded-xl bg-[#FDFDFD] p-4 shadow-sm">
				<p class="text-xs text-[#83808D]">Contributors</p>
				<p class="mt-1 text-lg font-semibold">{rsvpRollup?.count ?? 0}</p>
			</div>
		</div>

		{#if loadingRows}
			<div class="space-y-2">
				{#each [1, 2, 3] as _}
					<div class="h-14 animate-pulse rounded-lg bg-gray-100"></div>
				{/each}
			</div>
		{:else if loadError}
			<div class="rounded-lg bg-red-50 p-4 text-sm text-red-600">{loadError}</div>
		{:else if settledRows.length === 0}
			<div class="rounded-xl border border-dashed border-gray-200 p-8 text-center">
				<p class="text-sm font-medium text-gray-700">No contributions yet</p>
				<p class="mt-1 text-xs text-[#83808D]">
					{enabled
						? 'Guests will see the gift step right after they register.'
						: 'Turn contributions on below to start accepting gifts.'}
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto rounded-xl bg-[#FDFDFD] shadow-sm">
				<table class="w-full min-w-[640px] text-left text-sm">
					<thead class="border-b border-gray-100 text-xs text-[#83808D]">
						<tr>
							<th class="px-4 py-3 font-medium">Contributor</th>
							<th class="px-4 py-3 font-medium">Amount</th>
							<th class="px-4 py-3 font-medium">Note</th>
							<th class="px-4 py-3 font-medium">Date</th>
							<th class="px-4 py-3 font-medium"></th>
						</tr>
					</thead>
					<tbody>
						{#each settledRows as row (row._id)}
							<tr class="border-b border-gray-50 last:border-0">
								<td class="px-4 py-3">
									<div class="font-medium text-gray-900">{row.contributorName}</div>
									<div class="text-xs text-[#83808D]">{row.contributorEmail}</div>
									{#if row.isAnonymous}
										<!-- The HOST always sees the name; anonymity only hides it
										     from the PUBLIC wall. Say so, or this looks like a bug. -->
										<span
											class="mt-1 inline-block rounded bg-[#EBECED] px-1.5 py-0.5 text-[10px] text-[#5D646F]"
											title="Hidden on the public page — you can still see it so you can say thank you"
										>
											Anonymous publicly
										</span>
									{/if}
								</td>
								<td class="px-4 py-3 font-medium">
									{formatMoney(row.amountKobo, row.currency)}
									<div class="text-xs text-[#83808D]">
										net {formatMoney(row.netKobo, row.currency)}
									</div>
								</td>
								<td class="max-w-[240px] px-4 py-3 text-[#5D646F]">
									{row.message || '—'}
								</td>
								<td class="px-4 py-3 text-[#83808D]">{fmtDate(row.paidAt)}</td>
								<td class="px-4 py-3 text-right">
									{#if row.thankYouSentAt}
										<span class="inline-flex items-center gap-1 text-xs text-[#3CBD2C]">
											<Icon icon="mdi:check-circle-outline" class="text-sm" />
											Thanked
										</span>
									{:else}
										<button
											on:click={() => thankOne(row)}
											disabled={thanking.has(row._id)}
											class="rounded-md bg-[#EBECED] px-2.5 py-1.5 text-xs font-medium text-[#5D646F] transition-colors hover:bg-gray-200 disabled:opacity-50"
										>
											{thanking.has(row._id) ? 'Sending…' : 'Send thank-you'}
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if total > settledRows.length}
				<p class="mt-2 text-xs text-[#83808D]">
					Showing {settledRows.length} of {total}. See the Earnings page for the full history.
				</p>
			{/if}
		{/if}
	</section>

	<!-- ── Settings ───────────────────────────────────────────────────── -->
	<section class="border-t pt-6">
		<h2 class="mb-2 text-lg font-semibold">Contribution settings</h2>
		<p class="mb-5 text-xs text-[#83808D] sm:text-sm lg:max-w-[70%]">
			Guests are offered the gift step right after they register — never bundled into their ticket
			payment. Declining costs them nothing.
		</p>

		<div class="space-y-4">
			<div class="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
				<div>
					<p class="text-sm font-medium text-gray-900">Accept guest contributions</p>
					<p class="mt-0.5 text-xs text-[#83808D]">
						Shows an optional "Add a gift" step after registration.
					</p>
				</div>
				<button
					type="button"
					on:click={() => (enabled = !enabled)}
					aria-pressed={enabled}
					aria-label="Toggle guest contributions"
					class="relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors {enabled
						? 'bg-pink-600'
						: 'bg-gray-300'}"
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform {enabled
							? 'translate-x-5'
							: ''}"
					></span>
				</button>
			</div>

			{#if enabled}
				<div class="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
					<div>
						<label class="mb-1 block text-xs font-medium text-gray-700" for="ask-message">
							Your ask (optional)
						</label>
						<input
							id="ask-message"
							type="text"
							maxlength="300"
							bind:value={askMessage}
							placeholder="Help us cover the cake 🎂"
							class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
						/>
						<p class="mt-1 text-xs text-gray-400">Shown above the amount chips at RSVP.</p>
					</div>

					<div>
						<span class="mb-1 block text-xs font-medium text-gray-700">Suggested amounts</span>
						<div class="flex flex-wrap items-center gap-2">
							{#each suggestedMajor as _, i}
								<div class="flex items-center gap-1">
									<input
										type="number"
										min="0"
										bind:value={suggestedMajor[i]}
										class="w-24 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none"
									/>
									<button
										type="button"
										on:click={() => removeSuggestion(i)}
										aria-label="Remove amount"
										class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
									>
										<Icon icon="mdi:close" class="text-sm" />
									</button>
								</div>
							{/each}
							{#if suggestedMajor.length < 6}
								<button
									type="button"
									on:click={addSuggestion}
									class="rounded-md border border-dashed border-gray-300 px-2.5 py-1.5 text-xs text-[#83808D] hover:bg-gray-50"
								>
									+ Add
								</button>
							{/if}
						</div>
					</div>

					<div class="flex flex-wrap items-end gap-4">
						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700" for="gc-currency">Currency</label>
							<select
								id="gc-currency"
								bind:value={currency}
								class="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none"
							>
								<option value="NGN">NGN (₦)</option>
								<option value="USD">USD ($)</option>
							</select>
						</div>
						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700" for="gc-min">Minimum</label>
							<input
								id="gc-min"
								type="number"
								min="0"
								bind:value={minMajor}
								class="w-28 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none"
							/>
						</div>
						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700" for="gc-max">Maximum</label>
							<input
								id="gc-max"
								type="number"
								min="0"
								bind:value={maxMajor}
								placeholder="No limit"
								class="w-28 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none"
							/>
							<p class="mt-1 text-xs text-gray-400">Leave blank for no cap.</p>
						</div>
					</div>

					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={allowCustom} class="h-4 w-4 rounded" />
						Let guests type their own amount
					</label>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={showOnPublicPage} class="h-4 w-4 rounded" />
						Show a contributor wall on the public event page
					</label>
					{#if showOnPublicPage}
						<p class="rounded-md bg-[#F6F6F6] p-2 text-xs text-[#5D646F]">
							Names and notes only — how much each person gave is never published.
						</p>
					{/if}
				</div>
			{/if}
		</div>

		<button
			on:click={saveSettings}
			disabled={saving}
			class="mt-5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
		>
			{saving ? 'Saving…' : 'Save contribution settings'}
		</button>
	</section>
</div>
