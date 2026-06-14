<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast.store';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import DatePickerModal from '../../../../../create-event/components/DatePickerModal.svelte';
	import TimeModal from '../../../../../create-event/components/TimeModal.svelte';
	import {
		listCoupons,
		createCoupon,
		deleteCoupon,
		activateCoupon,
		deactivateCoupon,
		type Coupon,
		type DiscountType,
		type CouponCurrency
	} from '$lib/services/coupon.services';
	import { getMyEvents } from '$lib/services/event.services';

	$: collectionId = $page.params.id ?? '';

	// ── Payment methods ───────────────────────────────────────────────────
	// Only Paystack is currently supported. Flutterwave and Stripe are shown
	// as "coming soon" and are intentionally not toggleable yet.
	let paymentOptions = [
		{ id: 'paystack', label: 'Paystack', icon: '/paystack.svg', enabled: true, available: true },
		{ id: 'flutterwave', label: 'Flutterwave', icon: '/Logo_Flutterwave Logo.svg', enabled: false, available: false },
		{ id: 'stripe', label: 'Stripe', icon: '/Stripe.svg', enabled: false, available: false }
	];
	const toggleOption = (id: string) => {
		paymentOptions = paymentOptions.map((o) =>
			o.id === id && o.available ? { ...o, enabled: !o.enabled } : o
		);
	};

	// ── Coupons ───────────────────────────────────────────────────────────
	let coupons: Coupon[] = [];
	let loadingCoupons = true;
	let events: Array<{ id: string; title: string }> = [];

	let showCreate = false;
	let saving = false;
	let busyCode: string | null = null;

	// Create form
	let code = '';
	let discountType: DiscountType = 'PERCENTAGE';
	let discountValue: number | string = '';
	let currency: CouponCurrency = 'NGN';
	let scope: 'ALL' | 'EVENT' = 'ALL';
	let selectedEventId = '';
	let usageLimit: number | string = '';
	let maxUsesPerUser: number | string = '';

	// Date / time state (reusing the ticket-modal pickers)
	let startDateObj: Date = new Date();
	let startTime = '9:00 AM';
	let endDateObj: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	let endTime = '11:59 PM';

	// Custom dropdown / picker open state
	let typeOpen = false;
	let currencyOpen = false;
	let scopeOpen = false;
	let eventOpen = false;
	let startDateOpen = false;
	let startTimeOpen = false;
	let endDateOpen = false;
	let endTimeOpen = false;

	const typeLabels: Record<DiscountType, string> = {
		PERCENTAGE: 'Percentage',
		AMOUNT: 'Fixed amount'
	};
	const currencies: CouponCurrency[] = ['NGN', 'USD'];

	$: selectedEventTitle =
		events.find((e) => e.id === selectedEventId)?.title ?? 'Select an event';

	function resetForm() {
		code = '';
		discountType = 'PERCENTAGE';
		discountValue = '';
		currency = 'NGN';
		scope = 'ALL';
		selectedEventId = '';
		usageLimit = '';
		maxUsesPerUser = '';
		startDateObj = new Date();
		startTime = '9:00 AM';
		endDateObj = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
		endTime = '11:59 PM';
	}

	function buildDateTime(date: Date, timeStr: string): Date {
		const [timePart, meridiem] = timeStr.split(' ');
		let [hours, minutes] = timePart.split(':').map(Number);
		if (meridiem === 'PM' && hours !== 12) hours += 12;
		if (meridiem === 'AM' && hours === 12) hours = 0;
		const d = new Date(date);
		d.setHours(hours, minutes, 0, 0);
		return d;
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	async function loadCoupons() {
		if (!collectionId) return;
		loadingCoupons = true;
		try {
			const res = await listCoupons({ collectionId, limit: 100 });
			coupons = res.items ?? [];
		} catch (e: any) {
			toast.error(e?.message ?? 'Failed to load coupons');
			coupons = [];
		} finally {
			loadingCoupons = false;
		}
	}

	async function loadEvents() {
		try {
			const all = await getMyEvents();
			events = (all ?? [])
				.filter((e: any) => String(e.collectionId ?? '') === String(collectionId))
				.map((e: any) => ({ id: e._id ?? e.id, title: e.title ?? 'Untitled event' }));
		} catch {
			events = [];
		}
	}

	onMount(() => {
		loadCoupons();
		loadEvents();
	});

	function fmtDiscount(c: Coupon): string {
		if (c.discountType === 'PERCENTAGE') return `${c.discountValue}% off`;
		return `${c.currency} ${(c.discountValue / 100).toLocaleString()} off`;
	}

	function fmtScope(c: Coupon): string {
		if (c.eventId) {
			const ev = events.find((e) => e.id === c.eventId);
			return ev ? `Event: ${ev.title}` : 'Specific event';
		}
		if (c.collectionId) return 'All events in collection';
		return 'All events (global)';
	}

	function validateForm(): string | null {
		if (!code.trim()) return 'Enter a coupon code.';
		const val = Number(discountValue);
		if (!val || val <= 0) return 'Enter a discount value greater than 0.';
		if (discountType === 'PERCENTAGE' && val > 100) return 'Percentage cannot exceed 100.';
		const startDt = buildDateTime(startDateObj, startTime);
		const endDt = buildDateTime(endDateObj, endTime);
		if (startDt >= endDt) return 'Start must be before end.';
		if (scope === 'EVENT' && !selectedEventId) return 'Pick an event for this coupon.';
		return null;
	}

	async function handleCreate() {
		const err = validateForm();
		if (err) {
			toast.error(err);
			return;
		}
		saving = true;
		try {
			const val = Number(discountValue);
			await createCoupon({
				code: code.trim().toUpperCase(),
				discountType,
				discountValue: discountType === 'AMOUNT' ? Math.round(val * 100) : val,
				currency,
				startDate: buildDateTime(startDateObj, startTime).toISOString(),
				endDate: buildDateTime(endDateObj, endTime).toISOString(),
				collectionId: scope === 'ALL' ? collectionId : null,
				eventId: scope === 'EVENT' ? selectedEventId : null,
				usageLimit: usageLimit ? Number(usageLimit) : null,
				maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : null,
				isActive: true
			});
			toast.success('Coupon created');
			showCreate = false;
			resetForm();
			await loadCoupons();
		} catch (e: any) {
			toast.error(e?.message ?? 'Failed to create coupon');
		} finally {
			saving = false;
		}
	}

	async function toggleActive(c: Coupon) {
		busyCode = c.code;
		try {
			if (c.isActive) await deactivateCoupon(c.id, c.code);
			else await activateCoupon(c.code);
			await loadCoupons();
		} catch (e: any) {
			toast.error(e?.message ?? 'Failed to update coupon');
		} finally {
			busyCode = null;
		}
	}

	async function handleDelete(c: Coupon) {
		if (!confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
		busyCode = c.code;
		try {
			await deleteCoupon(c.id);
			toast.success('Coupon deleted');
			await loadCoupons();
		} catch (e: any) {
			toast.error(e?.message ?? 'Failed to delete coupon');
		} finally {
			busyCode = null;
		}
	}
</script>

<div class="mb-6 overflow-x-hidden">
	<!-- Payment Method -->
	<div class="mb-8 mt-4">
		<h2 class="text-lg font-semibold">Payment Method</h2>
		<p class="mb-4 text-sm text-[#84857A]">
			Choose how attendees pay for tickets across events in this collection.
		</p>
		<div class="flex flex-col gap-3">
			{#each paymentOptions as option (option.id)}
				<div
					class="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3"
					class:opacity-60={!option.available}
				>
					<div class="flex items-center gap-2">
						<img src={option.icon} alt={option.label} class="h-6 w-6" class:grayscale={!option.available} />
						<span class="text-sm font-medium">{option.label}</span>
						{#if !option.available}
							<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
								Coming soon
							</span>
						{/if}
					</div>
					<button
						type="button"
						class="relative h-6 w-10 rounded-full transition-colors duration-300"
						class:bg-gray-300={!option.enabled}
						class:bg-gray-800={option.enabled}
						class:cursor-not-allowed={!option.available}
						aria-label={`Toggle ${option.label}`}
						disabled={!option.available}
						title={option.available ? '' : `${option.label} is not available yet`}
						on:click={() => toggleOption(option.id)}
					>
						<span
							class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
							class:translate-x-4={option.enabled}
						></span>
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Coupons -->
	<div class="rounded-md bg-white p-4">
		<div class="flex items-center justify-between">
			<div class="flex flex-col">
				<span class="text-base font-semibold">Coupons</span>
				<span class="text-sm text-[#84857A]">
					Create discount codes that apply to all events in this calendar or to a specific event.
				</span>
			</div>
			<button
				type="button"
				class="flex items-center gap-1 rounded-md bg-gray-800 px-3 py-2 text-sm text-white"
				on:click={() => {
					resetForm();
					showCreate = true;
				}}
			>
				<Icon icon="mdi:plus" class="text-base" />
				New coupon
			</button>
		</div>

		<div class="mt-5">
			{#if loadingCoupons}
				<p class="py-8 text-center text-sm text-gray-400">Loading coupons…</p>
			{:else if coupons.length === 0}
				<div class="flex flex-col items-center gap-1 py-10 text-center">
					<span class="font-medium">No coupons yet</span>
					<span class="text-sm text-gray-400">Create your first discount code to get started.</span>
				</div>
			{:else}
				<div class="flex flex-col divide-y divide-gray-100">
					{#each coupons as c (c.id)}
						<div class="flex flex-wrap items-center justify-between gap-3 py-3">
							<div class="flex flex-col">
								<div class="flex items-center gap-2">
									<span class="font-mono text-sm font-semibold">{c.code}</span>
									<span
										class="rounded-full px-2 py-0.5 text-xs"
										class:bg-green-100={c.isActive}
										class:text-green-700={c.isActive}
										class:bg-gray-100={!c.isActive}
										class:text-gray-500={!c.isActive}
									>
										{c.isActive ? 'Active' : 'Inactive'}
									</span>
								</div>
								<span class="text-xs text-gray-500">
									{fmtDiscount(c)} · {fmtScope(c)} ·
									Used {c.timesUsed}{c.usageLimit ? `/${c.usageLimit}` : ''}
								</span>
							</div>
							<div class="flex items-center gap-2">
								<button
									type="button"
									class="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
									disabled={busyCode === c.code}
									on:click={() => toggleActive(c)}
								>
									{c.isActive ? 'Deactivate' : 'Activate'}
								</button>
								<button
									type="button"
									class="rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
									disabled={busyCode === c.code}
									on:click={() => handleDelete(c)}
								>
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Create coupon modal -->
{#if showCreate}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm"
		on:click={() => (showCreate = false)}
		on:keydown={(e) => { if (e.key === 'Escape') showCreate = false; }}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="flex h-full max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-lg"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="document"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-5 py-3">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF0F0]">
						<Icon icon="mdi:ticket-percent-outline" class="text-xl text-[#737577]" />
					</div>
					<div>
						<h2 class="font-semibold text-gray-800">New coupon</h2>
						<p class="text-xs text-[#A5A6A6]">Create a discount code for this collection</p>
					</div>
				</div>
				<button
					class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED] text-gray-700"
					aria-label="Close"
					on:click={() => (showCreate = false)}
				>
					<Icon icon="mdi:close" class="text-lg" />
				</button>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
				<!-- Code -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Coupon Code</label>
					<input
						bind:value={code}
						placeholder="e.g. EARLYBIRD20"
						class="w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm uppercase text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
					/>
				</div>

				<!-- Type + value -->
				<div class="mb-4 flex gap-3">
					<div class="w-1/2">
						<label class="mb-1.5 block text-xs font-medium text-[#666769]">Type</label>
						<div class="relative" use:clickOutside={() => (typeOpen = false)}>
							<button
								type="button"
								class="flex w-full items-center justify-between rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-left text-sm text-gray-700"
								on:click={() => (typeOpen = !typeOpen)}
							>
								{typeLabels[discountType]}
								<Icon icon="mdi:chevron-down" class="text-base text-gray-400" />
							</button>
							{#if typeOpen}
								<div class="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
									{#each Object.entries(typeLabels) as [val, label]}
										<button
											type="button"
											class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {discountType === val ? 'bg-gray-100 font-medium' : ''}"
											on:click={() => { discountType = val as DiscountType; typeOpen = false; }}
										>
											{label}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
					<div class="w-1/2">
						<label class="mb-1.5 block text-xs font-medium text-[#666769]">
							{discountType === 'PERCENTAGE' ? 'Percent (%)' : 'Amount'}
						</label>
						<input
							type="number"
							min="0"
							bind:value={discountValue}
							placeholder={discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 1000'}
							class="w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Currency -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Currency</label>
					<div class="relative" use:clickOutside={() => (currencyOpen = false)}>
						<button
							type="button"
							class="flex w-full items-center justify-between rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-left text-sm text-gray-700"
							on:click={() => (currencyOpen = !currencyOpen)}
						>
							{currency}
							<Icon icon="mdi:chevron-down" class="text-base text-gray-400" />
						</button>
						{#if currencyOpen}
							<div class="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
								{#each currencies as cur}
									<button
										type="button"
										class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {currency === cur ? 'bg-gray-100 font-medium' : ''}"
										on:click={() => { currency = cur; currencyOpen = false; }}
									>
										{cur}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Applies to -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Applies to</label>
					<div class="relative" use:clickOutside={() => (scopeOpen = false)}>
						<button
							type="button"
							class="flex w-full items-center justify-between rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-left text-sm text-gray-700"
							on:click={() => (scopeOpen = !scopeOpen)}
						>
							{scope === 'ALL' ? 'All events in this collection' : 'A specific event'}
							<Icon icon="mdi:chevron-down" class="text-base text-gray-400" />
						</button>
						{#if scopeOpen}
							<div class="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
								<button
									type="button"
									class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {scope === 'ALL' ? 'bg-gray-100 font-medium' : ''}"
									on:click={() => { scope = 'ALL'; scopeOpen = false; }}
								>
									All events in this collection
								</button>
								<button
									type="button"
									class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {scope === 'EVENT' ? 'bg-gray-100 font-medium' : ''}"
									on:click={() => { scope = 'EVENT'; scopeOpen = false; }}
								>
									A specific event
								</button>
							</div>
						{/if}
					</div>

					{#if scope === 'EVENT'}
						<div class="relative mt-2" use:clickOutside={() => (eventOpen = false)}>
							<button
								type="button"
								class="flex w-full items-center justify-between rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-left text-sm text-gray-700"
								on:click={() => (eventOpen = !eventOpen)}
							>
								<span class="truncate">{selectedEventTitle}</span>
								<Icon icon="mdi:chevron-down" class="text-base text-gray-400" />
							</button>
							{#if eventOpen}
								<div class="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
									{#if events.length === 0}
										<p class="px-3 py-2 text-sm text-gray-400">No events in this collection.</p>
									{:else}
										{#each events as ev (ev.id)}
											<button
												type="button"
												class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {selectedEventId === ev.id ? 'bg-gray-100 font-medium' : ''}"
												on:click={() => { selectedEventId = ev.id; eventOpen = false; }}
											>
												{ev.title}
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Starts -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Starts</label>
					<div class="flex gap-2">
						<div class="relative flex-1" use:clickOutside={() => (startDateOpen = false)}>
							<button
								type="button"
								class="w-full rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2.5 text-left text-sm font-medium text-gray-700"
								on:click={() => (startDateOpen = !startDateOpen)}
							>
								{formatDate(startDateObj)}
							</button>
							<DatePickerModal open={startDateOpen} bind:selectedDate={startDateObj} minDate={new Date()} />
						</div>
						<div class="relative w-[130px]" use:clickOutside={() => (startTimeOpen = false)}>
							<button
								type="button"
								class="w-full rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2.5 text-left text-sm font-medium text-gray-700"
								on:click={() => (startTimeOpen = !startTimeOpen)}
							>
								{startTime}
							</button>
							<TimeModal open={startTimeOpen} bind:selectedTime={startTime} />
						</div>
					</div>
				</div>

				<!-- Ends -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Ends</label>
					<div class="flex gap-2">
						<div class="relative flex-1" use:clickOutside={() => (endDateOpen = false)}>
							<button
								type="button"
								class="w-full rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2.5 text-left text-sm font-medium text-gray-700"
								on:click={() => (endDateOpen = !endDateOpen)}
							>
								{formatDate(endDateObj)}
							</button>
							<DatePickerModal open={endDateOpen} bind:selectedDate={endDateObj} startDate={startDateObj} minDate={startDateObj} />
						</div>
						<div class="relative w-[130px]" use:clickOutside={() => (endTimeOpen = false)}>
							<button
								type="button"
								class="w-full rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2.5 text-left text-sm font-medium text-gray-700"
								on:click={() => (endTimeOpen = !endTimeOpen)}
							>
								{endTime}
							</button>
							<TimeModal open={endTimeOpen} bind:selectedTime={endTime} referenceTime={startTime} />
						</div>
					</div>
				</div>

				<!-- Usage limits -->
				<div class="mb-2 flex gap-3">
					<div class="w-1/2">
						<label class="mb-1.5 block text-xs font-medium text-[#666769]">Total uses (optional)</label>
						<input
							type="number"
							min="1"
							bind:value={usageLimit}
							placeholder="Unlimited"
							class="w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
						/>
					</div>
					<div class="w-1/2">
						<label class="mb-1.5 block text-xs font-medium text-[#666769]">Per user (optional)</label>
						<input
							type="number"
							min="1"
							bind:value={maxUsesPerUser}
							placeholder="Unlimited"
							class="w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
				<button
					type="button"
					class="rounded-md border bg-gray-100 px-4 py-2 text-sm text-[#626365]"
					on:click={() => (showCreate = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium text-white {saving ? 'cursor-not-allowed bg-[#969798]' : 'bg-gray-800'}"
					disabled={saving}
					on:click={handleCreate}
				>
					{#if saving}
						<Icon icon="mdi:loading" class="animate-spin text-base" />
						Creating…
					{:else}
						Create coupon
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
