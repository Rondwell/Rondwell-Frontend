<!-- src/routes/pricing/+page.svelte -->
<script>
	import Header from './components/Header.svelte';

	let isAnnual = false;

	const plans = {
		free: {
			name: 'Roundwell',
			price: 'Free',
			tag: 'Go nuts',
			subtitle: 'Free forever',
			cta: 'Get Started',
			features: [
				{ text: 'AI Event Creation:', bold: '2 prompts/month' },
				{ text: 'Multi-currency ticketing: USD, NGN, EUR' },
				{ text: 'Unlimited Event collections' },
				{ text: '3D seating & capacity', bold: '(5 events / month)' },
				{ text: 'Community & real-time chat' },
				{ text: 'Vendor / Speaker / Exhibitor management', bold: '(max 3 participants per event)', separator: true },
				{ text: 'Wallets (NGN & USD)' },
				{ text: 'Unlimited forms & tickets', highlight: true, separator: true },
				{ text: 'Basic analytics' },
				{ text: 'Max', bold: '3 active paid events/month' },
				{ text: 'Emails:', bold: '250/month' },
				{ text: 'Paid Events: NGN:', bold: '5% + gateway,', text2: 'USD/FX:', bold2: '6% + FX' },
				{ text: 'Vendor bookings:', bold: '6%' },
				{ text: 'FX conversion:', bold: '1–2%' },
				{ text: 'USD wallet settlement:', bold: '1%' },
				{ text: 'OTC withdrawal:', bold: '3%' }
			]
		},
		plus: {
			name: 'Rondwell Plus',
			monthlyPrice: '$59',
			annualPrice: '$49',
			tag: 'Save 14%',
			subtitle: 'Per month, billed annually',
			cta: 'Get Rondwell Plus',
			features: [
				{ text: 'Everything in Free, plus:', bold: true },
				{ text: 'Unlimited vendors / speakers / exhibitors (participants)' },
				{ text: 'Advanced marketing tools' },
				{ text: 'Advanced budgeting & finance tools' },
				{ text: 'Advanced analytics & exports' },
				{ text: 'API + Webhooks', separator: true },
				{ text: 'Custom embeds' },
				{ text: 'Web & Mobile SDK (white-label lite)', highlight: true, separator: true },
				{ text: 'Priority support' },
				{ text: 'Emails:', bold: 'Up to 10,000/month' },
				{ text: 'Higher revenue thresholds' },
				{ text: 'Paid Events: NGN:', bold: '2% + gateway,', text2: 'USD/FX:', bold2: '3% + FX' },
				{ text: 'Vendor bookings:', bold: '3%' },
				{ text: 'FX conversion:', bold: '1%' },
				{ text: 'OTC withdrawal:', bold: '3%' },
				{ text: 'USD wallet settlement:', bold: 'No fee' }
			]
		}
	};

	const addOns = [
		{ guests: 10_000, price: 'Included' },
		{ guests: 25_000, price: '$26' },
		{ guests: 50_000, price: '$66' },
		{ guests: 75_000, price: '$111' },
		{ guests: 100_000, price: '$151' },
		{ guests: 150_000, price: '$191' }
	];
</script>

<section>
	<Header />

	<main class="bg-color px-6 py-8">
		<div class="mx-auto max-w-4xl py-10">
			<!-- Hero Section -->
			<div class="mb-12 flex flex-col items-center gap-6 text-center">
				<img src="/logo.svg" alt="" class="h-8" />
				<h1 class="mb-4 text-5xl font-semibold">Pricing</h1>
				<p class="mx-auto max-w-xl text-lg font-semibold text-[#7A7B7D]">
					Use Rondwell for free with unlimited events and guests. Upgrade for more invites, 0%
					platfrom fee, and more.
				</p>

				<!-- Billing Toggle -->
				<div
					class="mx-auto flex w-fit justify-center gap-2 rounded-full border-2 border-[#C0C1C1] p-1"
				>
					<button
						class={`rounded-full px-4 py-2 transition ${
							!isAnnual ? 'bg-white text-black shadow-sm' : 'text-gray-600'
						}`}
						on:click={() => (isAnnual = false)}
					>
						Monthly
					</button>
					<button
						class={`rounded-full px-4 py-2 transition ${
							isAnnual ? 'bg-white text-black shadow-sm' : 'text-gray-600'
						}`}
						on:click={() => (isAnnual = true)}
					>
						Annual
					</button>
				</div>
			</div>

			<!-- Plans Grid -->
			<div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
				<!-- Free Plan -->
				<div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
					<div class="mb-3">
						<h3 class="mb-2 text-sm font-bold">{plans.free.name}</h3>
						<div class="mb-2 flex items-center gap-2">
							<span class="text-3xl font-bold">{plans.free.price}</span>
							<span class="rounded-md bg-[#FDE0EE] px-2 py-1 text-xs text-[#F31A7C]"
								>{plans.free.tag}</span
							>
						</div>
						<span class="text-gray-500">{plans.free.subtitle}</span>
					</div>
					<a
				href="/auth"
				class="block w-full rounded-md bg-gray-800 py-2 text-center text-white transition hover:bg-gray-700"
			>
				{plans.free.cta}
			</a>
					<p class="mt-3 text-sm text-gray-300">Use Rondwell for free with:</p>
					<ul class="mt-2 space-y-3">
						{#each plans.free.features as feature, i}
							<li
								class="flex items-center gap-2 text-sm {feature.separator
								? 'border-b border-gray-300 pb-3'
								: ''} {feature.highlight ? 'text-[#F31A7C]' : ''}"
							>
								<img src="/tick.png" alt="tick" class="h-4 w-4 flex-shrink-0 rounded-full" />
								<span>
									{feature.text}
									{#if feature.bold}
										<strong class="font-semibold">{feature.bold}</strong>
									{/if}
									{#if feature.text2}
										{feature.text2}
									{/if}
									{#if feature.bold2}
										<strong class="font-semibold">{feature.bold2}</strong>
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Plus Plan -->
				<div class="relative rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
					{#if isAnnual}
						<div
							class="absolute top-4 right-4 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
						>
							Save 14%
						</div>
					{/if}
					<div class="mb-3">
						<h3 class="mb-2 text-sm font-bold text-[#F31A7C]">{plans.plus.name}</h3>
						<div class="mb-2 flex items-center gap-2">
							<span class="text-2xl font-bold">
								{isAnnual ? plans.plus.annualPrice : plans.plus.monthlyPrice}
							</span>
							<span class="rounded-md bg-[#FDE0EE] px-2 py-1 text-xs text-[#F31A7C]"
								>{plans.plus.tag}</span
							>
						</div>
						<span class="text-gray-500">{plans.plus.subtitle}</span>
					</div>
					<a
				href="/auth"
				class="block w-full rounded-md bg-pink-600 py-2 text-center text-white transition hover:bg-pink-700"
			>
				{plans.plus.cta}
			</a>
					<p class="mt-3 text-sm text-gray-300">Per month, billed annually</p>

					<ul class="mt-6 space-y-3">
						{#each plans.plus.features as feature, i}
							<li
								class="flex items-center gap-2 text-sm {feature.separator
								? 'border-b border-gray-300 pb-3'
								: ''} {feature.highlight ? 'text-[#F31A7C]' : ''}"
							>
								<img src="/tick.png" alt="tick" class="h-4 w-4 flex-shrink-0 rounded-full" />
								<span class="{feature.bold === true ? 'font-semibold' : ''}">
									{feature.text}
									{#if feature.bold && typeof feature.bold === 'string'}
										<strong class="font-semibold">{feature.bold}</strong>
									{/if}
									{#if feature.text2}
										{feature.text2}
									{/if}
									{#if feature.bold2}
										<strong class="font-semibold">{feature.bold2}</strong>
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="text-sm text-[#B9BABA]">
				<p>
					Stripe, Flutterwave and Paystack, our payment processor, charges a credit card fee
					(typically 2% - 5% plus caps). The platform fee is on top of the Stripe fee. Price for
					Rondwell Plus Subscription are in US.
				</p>
			</div>

			<!-- Add-Ons Section -->
			<div class="my-8 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
				<div class="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
					<!-- Left side text -->
					<div class="relative h-full p-6">
						<div class="flex items-start">
							<img src="/ads-on.png" alt="" class="mr-3 mt-3 h-8 w-8 opacity-40" />
							<div>
								<h3 class="text-lg font-semibold text-[#131517]">Add-Ons</h3>
								<span class="text-sm text-[#B0B1B1]">
									Rondwell Plus comes with 10,000 emails and newsletters sends per week. Need even more?
									We’ve got you covered.
								</span>
							</div>
						</div>

						<p class="bottom-0 mt-2 max-w-max text-center text-sm text-gray-500 md:absolute">
							You can always send unlimited Marketings to event attendees.
						</p>
					</div>

					<div class="bg-[#F6F6F6] p-3">
						<!-- Right side table -->
						<table class="w-full text-left text-sm text-gray-400">
							<thead>
								<tr>
									<th class="pb-2 font-semibold">Weekly Send</th>
									<th class="pb-2 text-right font-semibold">Price</th>
								</tr>
							</thead>
							<tbody>
								{#each addOns as addOn, i}
									<tr class="border-t border-gray-100 text-sm text-black">
										<td class="py-2">{addOn.guests.toLocaleString()}</td>
										<td class="py-2 text-right font-semibold">
											{addOn.price === 'Included' ? addOn.price : `${addOn.price}/mo`}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<p class="mt-4 flex w-full justify-end text-xs text-gray-400 italic">
							Billed annually (save up to 18%)
						</p>
					</div>
				</div>
			</div>

			<!-- Enterprise Section -->
			<div class="">
				<div
					class="flex flex-col items-center justify-between gap-3 rounded-xl bg-[#FFFFFF] px-6 py-3 md:flex-row"
				>
					<div class="flex flex-1 items-center gap-2">
						<img src="/diamond.png" alt="" />

						<span class="flex flex-col">
							<h3 class="text-lg font-semibold">Enterprise</h3>
							<p class="text-sm text-[#B0B1B1]">
								Need something else? Get in touch to request an enterprise plan.
							</p></span
						>
					</div>
					<div class="flex w-full justify-end md:w-fit md:justify-start">
						<a
							class="flex cursor-pointer items-center gap-1 rounded-md bg-black px-4 md:px-6 py-2 text-white transition hover:bg-gray-800"
							href="/contact"
						>
							<img src="/direct-normal.png" alt="icon" class="h-5 w-5" />
							Contact Us
					</a>
					</div>
				</div>
				<p class="mt-2 text-xs text-[#949999]">
					Dedicated infrastructure - SLA & uptime guarantees - Advanced AI workflows - Blockchain
					ticketing & verification- Multi-org & role management - Admin dashboards Custom
					integrations - Dedicated account manager - Onsite QR hardware (rental) - AR / VR &
					immersive integrations
				</p>
			</div>
		</div>
	</main>
</section>

<style>
	.bg-color {
		background: linear-gradient(180deg, #f5efec 0%, #f4edea 17%, #f4f5f6 43%);
	}
</style>
