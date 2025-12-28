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
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events'
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
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events',
				'0% platform fees for paid events'
			]
		}
	};

	const addOns = [
		{ guests: 5_000, price: '$26' },
		{ guests: 10_000, price: '$36' },
		{ guests: 25_000, price: '$88' },
		{ guests: 50_000, price: '$118' },
		{ guests: 75_000, price: '$125' },
		{ guests: 100_000, price: '$199' }
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
					<button
						class="w-full rounded-md bg-gray-800 py-2 text-white transition hover:bg-gray-700"
					>
						{plans.free.cta}
					</button>
					<p class="mt-3 text-sm text-gray-300">Use Rondwell for free with:</p>
					<ul class="mt-2 space-y-3">
						{#each plans.free.features as feature, i}
							<li
								class="flex items-center gap-2 text-sm
      {i === 5 ? 'border-t border-gray-300 pt-2' : ''}
      {i === 6 ? 'border-b border-gray-300 pb-2 text-[#F31A7C]' : ''}"
							>
								<img src="/tick.png" alt="tick" class="h-4 w-4 rounded-full" />
								{feature}
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
					<button
						class="w-full rounded-md bg-pink-600 py-2 text-white transition hover:bg-pink-700"
					>
						{plans.plus.cta}
					</button>
					<p class="mt-3 text-sm text-gray-300">Per month, billed annually</p>

					<ul class="mt-6 space-y-3">
						{#each plans.plus.features as feature, i}
							<li
								class="flex items-center gap-2 text-sm
      {i === 5 ? 'border-t border-gray-300 pt-2' : ''}
      {i === 6 ? 'border-b border-gray-300 pb-2 text-[#F31A7C]' : ''}"
							>
								<img src="/tick.png" alt="tick" class="h-4 w-4 rounded-full" />
								{feature}
							</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="text-sm text-gray-300">
				<p>
					Stripe, our payment processor, charges a credit card fee (typically 2.9% + 30 cents). The
					platform fee is on top of the Stripe fee.
				</p>
				<p>Price for Rondwell Plus Subscription are in US dollars.</p>
			</div>

			<!-- Add-Ons Section -->
			<div class="my-8 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
				<div class="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
					<!-- Left side text -->
					<div class="relative h-full p-6">
						<div class="flex items-start">
							<img src="/ads-on.png" alt="" />
							<div>
								<h3 class="text-lg font-semibold">Add-Ons</h3>
								<span class="text-sm text-gray-600">
									Rondwell Plus comes with 5,000 invites and newsletter sends per week. Need more?
									We’ve got you covered.
								</span>
							</div>
						</div>

						<p class="bottom-0 mt-2 max-w-max text-center text-sm text-gray-500 md:absolute">
							You can always send unlimited Marketing to event guests.
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
											{i === 0 ? 'Included' : `${addOn.price}/mo`}
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
						<button
							class="flex items-start gap-1 rounded-md bg-[#939597] px-6 py-2 text-gray-300 transition hover:bg-gray-800"
						>
							Contact Us
							<img src="/send-icon1.png" alt="send icon" class="h-4 w-4" />
						</button>
					</div>
				</div>
				<p class="mt-2 text-xs text-[#B0B1B1]">
					Advanced Integration - Additional APIs - Custom Domain - Custom-Built Features -
					Organization Account - Security Restrictions - Community Events - Token Support
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
