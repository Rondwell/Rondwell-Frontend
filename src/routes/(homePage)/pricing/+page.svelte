<script>
	import { onMount } from 'svelte';
	import Header from './components/Header.svelte';

	let isAnnual = false;
	let plansLoaded = false;

	let freePlan = {
		name: 'Rondwell',
		features: [],
		limits: { emails: 250, aiPrompts: 10, activePaidEvents: 3, maxParticipantsPerEvent: 3, seatingLayoutEvents: 5 },
		commissionStructure: { ticketFees: { NGN: 0.06, USD: 0.06 }, vendorBookingFee: 0.06, withdrawalFee: 0.03, usdSettlementFee: 0.01 }
	};

	let plusPlan = {
		name: 'Rondwell Plus',
		pricing: { monthly: 500000, yearly: 5000000, currency: 'NGN' },
		features: [],
		limits: { emails: 10000, aiPrompts: 50, activePaidEvents: 999999, maxParticipantsPerEvent: 999999, seatingLayoutEvents: -1 },
		commissionStructure: { ticketFees: { NGN: 0.03, USD: 0.03 }, vendorBookingFee: 0.03, withdrawalFee: 0.03, usdSettlementFee: 0 }
	};

	onMount(async () => {
		try {
			const BASE_URL = import.meta.env.VITE_API_URL;
			const res = await fetch(`${BASE_URL}/api/v1/payment/subscription/plans`);
			const data = await res.json();
			const plans = data.data ?? [];
			for (const p of plans) {
				if (p.planId === 'FREE') Object.assign(freePlan, p);
				if (p.planId === 'PLUS') Object.assign(plusPlan, p);
			}
		} catch { /* use defaults */ }
		plansLoaded = true;
	});

	$: freeNGN = Math.round(freePlan.commissionStructure.ticketFees.NGN * 100);
	$: freeUSD = Math.round(freePlan.commissionStructure.ticketFees.USD * 100);
	$: plusNGN = Math.round(plusPlan.commissionStructure.ticketFees.NGN * 100);
	$: plusUSD = Math.round(plusPlan.commissionStructure.ticketFees.USD * 100);
	$: freeVendor = Math.round(freePlan.commissionStructure.vendorBookingFee * 100);
	$: plusVendor = Math.round(plusPlan.commissionStructure.vendorBookingFee * 100);
	$: freeWithdrawal = Math.round(freePlan.commissionStructure.withdrawalFee * 100);
	$: plusWithdrawal = Math.round(plusPlan.commissionStructure.withdrawalFee * 100);

	$: plusMonthlyUSD = '$59';
	$: plusAnnualUSD = '$49';

	$: freeFeatures = [
		{ text: 'Unlimited free event creation' },
		{ text: 'AI Event Creation:', bold: `${freePlan.limits.aiPrompts} prompts/month` },
		{ text: 'Multi-currency ticketing: USD, NGN, EUR' },
		{ text: 'Unlimited Event collections' },
		{ text: '3D seating & capacity', bold: `(${freePlan.limits.seatingLayoutEvents} events / month)` },
		{ text: 'Community & real-time chat' },
		{ text: 'Vendor / Speaker / Exhibitor management', bold: `(max ${freePlan.limits.maxParticipantsPerEvent} per event)`, separator: true },
		{ text: 'Wallets (NGN & USD)' },
		{ text: 'Unlimited forms & tickets', highlight: true, separator: true },
		{ text: 'Basic analytics' },
		{ text: 'Max', bold: `${freePlan.limits.activePaidEvents} active paid events` },
		{ text: 'Emails:', bold: `${freePlan.limits.emails.toLocaleString()}/month` },
		{ text: `Paid Events: NGN:`, bold: `${freeNGN}% + gateway,`, text2: ' USD/FX:', bold2: `${freeUSD}% + FX` },
		{ text: 'Vendor bookings:', bold: `${freeVendor}%` },
		{ text: 'FX conversion:', bold: '1–2%' },
		{ text: 'USD wallet settlement:', bold: `${Math.round((freePlan.commissionStructure.usdSettlementFee ?? 0.01) * 100)}%` },
		{ text: 'OTC withdrawal:', bold: `${freeWithdrawal}% (capped at ₦500)` }
	];

	$: plusFeatures = [
		{ text: 'Everything in Free, plus:', isBold: true },
		{ text: `AI Event Creation:`, bold: `${plusPlan.limits.aiPrompts} prompts/month` },
		{ text: 'Unlimited active paid events' },
		{ text: 'Unlimited participants per event' },
		{ text: 'Unlimited 3D seating capacity/layout' },
		{ text: 'Unlimited vendors / speakers / exhibitors (participants)' },
		{ text: 'Advanced marketing tools' },
		{ text: 'Advanced budgeting & finance tools' },
		{ text: 'Advanced analytics & exports' },
		{ text: 'API + Webhooks', separator: true },
		{ text: 'Custom embeds' },
		{ text: 'Web & Mobile SDK (white-label lite)', highlight: true, separator: true },
		{ text: 'Priority support' },
		{ text: 'Emails:', bold: `Up to ${plusPlan.limits.emails.toLocaleString()}/month` },
		{ text: 'Higher revenue thresholds' },
		{ text: `Paid Events: NGN:`, bold: `${plusNGN}% + gateway,`, text2: ' USD/FX:', bold2: `${plusUSD}% + FX` },
		{ text: 'Vendor bookings:', bold: `${plusVendor}%` },
		{ text: 'FX conversion:', bold: '1%' },
		{ text: 'OTC withdrawal:', bold: `${plusWithdrawal}%` },
		{ text: 'USD wallet settlement:', bold: plusPlan.commissionStructure.usdSettlementFee === 0 ? 'No fee' : `${Math.round(plusPlan.commissionStructure.usdSettlementFee * 100)}%` }
	];

	const addOns = [
		{ guests: 10_000, price: 'Included' },
		{ guests: 25_000, price: '$26' },
		{ guests: 50_000, price: '$66' },
		{ guests: 75_000, price: '$111' },
		{ guests: 100_000, price: '$151' },
		{ guests: 150_000, price: '$191' }
	];
</script>

<svelte:head>
	<title>Pricing | Rondwell</title>
	<meta name="description" content="Explore Rondwell pricing plans. From free to enterprise, find the right plan for your event management needs." />
	<meta property="og:title" content="Pricing | Rondwell" />
	<meta property="og:description" content="Explore Rondwell pricing plans. From free to enterprise, find the right plan for your event management needs." />
	<meta property="og:url" content="https://rondwell.com/pricing" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Rondwell" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Pricing | Rondwell" />
	<meta name="twitter:description" content="Explore Rondwell pricing plans. From free to enterprise, find the right plan for your event management needs." />
	<meta name="twitter:site" content="@rondwellhq" />
	<link rel="canonical" href="https://rondwell.com/pricing" />
</svelte:head>

<section>
	<Header />
	<main class="bg-color px-6 py-8">
		<div class="mx-auto max-w-4xl py-10">
			<div class="mb-12 flex flex-col items-center gap-6 text-center">
				<img src="/logo.svg" alt="" class="h-8" />
				<h1 class="mb-4 text-5xl font-semibold">Pricing</h1>
				<p class="mx-auto max-w-xl text-lg font-semibold text-[#7A7B7D]">
					Use Rondwell for free with unlimited events and guests. Upgrade for more invites, 0% platform fee, and more.
				</p>
				<div class="mx-auto flex w-fit justify-center gap-2 rounded-full border-2 border-[#C0C1C1] p-1">
					<button class={`rounded-full px-4 py-2 transition ${!isAnnual ? 'bg-white text-black shadow-sm' : 'text-gray-600'}`} on:click={() => (isAnnual = false)}>Monthly</button>
					<button class={`rounded-full px-4 py-2 transition ${isAnnual ? 'bg-white text-black shadow-sm' : 'text-gray-600'}`} on:click={() => (isAnnual = true)}>Annual</button>
				</div>
			</div>

			<div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
				<!-- Free Plan -->
				<div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
					<div class="mb-3">
						<h3 class="mb-2 text-sm font-bold">Rondwell</h3>
						<div class="mb-2 flex items-center gap-2">
							<span class="text-3xl font-bold">Free</span>
							<span class="rounded-md bg-[#FDE0EE] px-2 py-1 text-xs text-[#F31A7C]">Go nuts</span>
						</div>
						<span class="text-gray-500">Free forever</span>
					</div>
					<a href="/auth" class="block w-full rounded-md bg-gray-800 py-2 text-center text-white transition hover:bg-gray-700">Get Started</a>
					<p class="mt-3 text-sm text-gray-300">Use Rondwell for free with:</p>
					<ul class="mt-2 space-y-3">
						{#each freeFeatures as feature}
							<li class="flex items-center gap-2 text-sm {feature.separator ? 'border-b border-gray-300 pb-3' : ''} {feature.highlight ? 'text-[#F31A7C]' : ''}">
								<img src="/tick.png" alt="tick" class="h-4 w-4 flex-shrink-0 rounded-full" />
								<span>
									{feature.text}
									{#if feature.bold}<strong class="font-semibold">{feature.bold}</strong>{/if}
									{#if feature.text2}{feature.text2}{/if}
									{#if feature.bold2}<strong class="font-semibold">{feature.bold2}</strong>{/if}
								</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Plus Plan -->
				<div class="relative rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
					{#if isAnnual}
						<div class="absolute top-4 right-4 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Save 14%</div>
					{/if}
					<div class="mb-3">
						<h3 class="mb-2 text-sm font-bold text-[#F31A7C]">Rondwell Plus</h3>
						<div class="mb-2 flex items-center gap-2">
							<span class="text-2xl font-bold">{isAnnual ? plusAnnualUSD : plusMonthlyUSD}</span>
							<span class="rounded-md bg-[#FDE0EE] px-2 py-1 text-xs text-[#F31A7C]">Save 14%</span>
						</div>
						<span class="text-gray-500">Per month, billed annually</span>
					</div>
					<a href="/auth" class="block w-full rounded-md bg-pink-600 py-2 text-center text-white transition hover:bg-pink-700">Get Rondwell Plus</a>
					<p class="mt-3 text-sm text-gray-300">Per month, billed annually</p>
					<ul class="mt-6 space-y-3">
						{#each plusFeatures as feature}
							<li class="flex items-center gap-2 text-sm {feature.separator ? 'border-b border-gray-300 pb-3' : ''} {feature.highlight ? 'text-[#F31A7C]' : ''}">
								<img src="/tick.png" alt="tick" class="h-4 w-4 flex-shrink-0 rounded-full" />
								<span class="{feature.isBold ? 'font-semibold' : ''}">
									{feature.text}
									{#if feature.bold && typeof feature.bold === 'string'}<strong class="font-semibold">{feature.bold}</strong>{/if}
									{#if feature.text2}{feature.text2}{/if}
									{#if feature.bold2}<strong class="font-semibold">{feature.bold2}</strong>{/if}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<div class="text-sm text-[#B9BABA]">
				<p>Stripe, Flutterwave and Paystack, our payment processor, charges a credit card fee (typically 2% - 5% plus caps). The platform fee is on top of the gateway fee. Prices for Rondwell Plus Subscription are in USD.</p>
			</div>

			<!-- Add-Ons -->
			<div class="my-8 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
				<div class="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
					<div class="relative h-full p-6">
						<div class="flex items-start">
							<img src="/ads-on.png" alt="" class="mr-3 mt-3 h-8 w-8 opacity-40" />
							<div>
								<h3 class="text-lg font-semibold text-[#131517]">Add-Ons</h3>
								<span class="text-sm text-[#B0B1B1]">Rondwell Plus comes with 10,000 emails and newsletter sends per week. Need even more? We've got you covered.</span>
							</div>
						</div>
						<p class="bottom-0 mt-2 max-w-max text-center text-sm text-gray-500 md:absolute">You can always send unlimited marketing to event attendees.</p>
					</div>
					<div class="bg-[#F6F6F6] p-3">
						<table class="w-full text-left text-sm text-gray-400">
							<thead><tr><th class="pb-2 font-semibold">Weekly Send</th><th class="pb-2 text-right font-semibold">Price</th></tr></thead>
							<tbody>
								{#each addOns as addOn}
									<tr class="border-t border-gray-100 text-sm text-black">
										<td class="py-2">{addOn.guests.toLocaleString()}</td>
										<td class="py-2 text-right font-semibold">{addOn.price === 'Included' ? addOn.price : `${addOn.price}/mo`}</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<p class="mt-4 flex w-full justify-end text-xs text-gray-400 italic">Billed annually (save up to 18%)</p>
					</div>
				</div>
			</div>

			<!-- Enterprise -->
			<div>
				<div class="flex flex-col items-center justify-between gap-3 rounded-xl bg-[#FFFFFF] px-6 py-3 md:flex-row">
					<div class="flex flex-1 items-center gap-2">
						<img src="/diamond.png" alt="" />
						<span class="flex flex-col">
							<h3 class="text-lg font-semibold">Enterprise</h3>
							<p class="text-sm text-[#B0B1B1]">Need something else? Get in touch to request an enterprise plan.</p>
						</span>
					</div>
					<div class="flex w-full justify-end md:w-fit md:justify-start">
						<a class="flex cursor-pointer items-center gap-1 rounded-md bg-black px-4 md:px-6 py-2 text-white transition hover:bg-gray-800" href="/contact">
							<img src="/direct-normal.png" alt="icon" class="h-5 w-5" /> Contact Us
						</a>
					</div>
				</div>
				<p class="mt-2 text-xs text-[#949999]">Dedicated infrastructure - SLA & uptime guarantees - Advanced AI workflows - Blockchain ticketing & verification - Multi-org & role management - Admin dashboards - Custom integrations - Dedicated account manager - Onsite QR hardware (rental) - AR / VR & immersive integrations</p>
			</div>
		</div>
	</main>
</section>

<style>
	.bg-color {
		background: linear-gradient(180deg, #f5efec 0%, #f4edea 17%, #f4f5f6 43%);
	}
</style>
