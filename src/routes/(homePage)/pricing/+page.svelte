<!-- src/routes/pricing/+page.svelte -->
<script>
	import Header from './components/Header.svelte';

	let isAnnual = false;

	const plans = {
		free: {
			name: 'Roundwell',
			price: 'Free',
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
				'0% platform fees for paid events'
			]
		},
		plus: {
			name: 'Rondwell Plus',
			monthlyPrice: '$59',
			annualPrice: '$49',
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
				<img src="logo.png" alt="" class="h-8" />
				<h1 class="mb-4 text-4xl font-bold">Pricing</h1>
				<p class="mx-auto max-w-xl text-lg font-semibold text-[#7A7B7D]">
					Use Rondwell for free with unlimited events and guests. Upgrade for more invites, 0%
					platfrom fee, and more.
				</p>

				<!-- Billing Toggle -->
				<div
					class="mx-auto flex w-fit justify-center gap-2 rounded-full border-2 border-[#C0C1C1] p-1"
				>
					<button
						class={`rounded-full px-4 py-2 text-lg transition ${
							!isAnnual ? 'bg-white text-black shadow-sm' : 'text-gray-600'
						}`}
						on:click={() => (isAnnual = false)}
					>
						Monthly
					</button>
					<button
						class={`rounded-full px-4 py-2 text-lg transition ${
							isAnnual ? 'bg-white text-black shadow-sm' : 'text-gray-600'
						}`}
						on:click={() => (isAnnual = true)}
					>
						Annual
					</button>
				</div>
			</div>

			<!-- Plans Grid -->
			<div class="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
				<!-- Free Plan -->
				<div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
					<div class="mb-4 flex items-center gap-2">
						<h2 class="text-xl font-bold">{plans.free.name}</h2>
						<span class="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600"
							>MOST POPULAR</span
						>
					</div>
					<div class="mb-4">
						<span class="text-2xl font-bold">{plans.free.price}</span>
						<span class="ml-1 text-gray-500">{plans.free.subtitle}</span>
					</div>
					<button
						class="w-full rounded-md bg-gray-800 py-2 text-white transition hover:bg-gray-700"
					>
						{plans.free.cta}
					</button>
					<ul class="mt-6 space-y-2">
						{#each plans.free.features as feature}
							<li class="flex items-center gap-2 text-sm">
								<span>✔️</span>
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
							Save 16%
						</div>
					{/if}
					<h2 class="mb-2 text-xl font-bold">{plans.plus.name}</h2>
					<div class="mb-4">
						<span class="text-2xl font-bold">
							{isAnnual ? plans.plus.annualPrice : plans.plus.monthlyPrice}
						</span>
						<span class="ml-1 text-gray-500">{plans.plus.subtitle}</span>
					</div>
					<button
						class="w-full rounded-md bg-pink-600 py-2 text-white transition hover:bg-pink-700"
					>
						{plans.plus.cta}
					</button>
					<ul class="mt-6 space-y-2">
						{#each plans.plus.features as feature}
							<li class="flex items-center gap-2 text-sm">
								<span>✔️</span>
								{feature}
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Add-Ons Section -->
			<div class="mb-12 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-semibold">Add-Ons</h3>
				<p class="mb-6 text-sm text-gray-600">
					Rondwell Plus comes with 5,000 invites and reminders sends per week. Need more? We’ve got
					you covered.
				</p>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{#each addOns as addOn}
						<div class="rounded-lg border border-gray-200 p-4 text-center">
							<div class="text-xl font-bold">{addOn.guests.toLocaleString()}</div>
							<div class="text-sm text-gray-500">Guests</div>
							<div class="mt-2 text-lg font-semibold">${addOn.price}</div>
						</div>
					{/each}
				</div>
				<p class="mt-4 text-sm text-gray-500">
					You can always send unlimited Marketing to event guests.
				</p>
			</div>

			<!-- Enterprise Section -->
			<div class="rounded-xl bg-gray-50 p-6 text-center">
				<h3 class="mb-2 text-lg font-semibold">Enterprise</h3>
				<p class="mb-4 text-sm text-gray-600">
					Need something else? Get in touch to request an enterprise plan.
				</p>
				<button class="rounded-md bg-black px-6 py-2 text-white transition hover:bg-gray-800">
					Contact Us →
				</button>
			</div>
		</div>
	</main>
</section>

<style>
	.bg-color {
		background: linear-gradient(180deg, #f5efec 0%, #f4edea 17%, #f4f5f6 43%);
	}
</style>
