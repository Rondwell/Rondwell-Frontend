<!-- src/routes/pricing/+page.svelte -->
<script lang="ts">
	let isAnnual = false;

	const plans = {
		plus: {
			name: 'Rondwell Plus',
			upgrade: 'Upgrade to',
			monthlyPrice: '$59',
			annualPrice: '$49',
			tag: 'Save 14%',
			subtitle: 'Per month, billed annually',
			cta: 'Get Rondwell Plus',
			features: [
				{ text: '0% Platfrom Fees for Paid Events', bold: true },
				{ text: 'Priority Support' },
				{ text: '5 Admins Included' }
			]
		}
	};

	type Feature = {
		icon: any;
		title: string;
		oldValue?: string;
		footnote?: string;
		alt: string;
	};

	const features: Feature[] = [
		{
			icon: '/dollar-coin.svg',
			oldValue: '5%',
			title: '0% Platform Fee',
			footnote: '1',
			alt: 'dollar'
		},
		{
			icon: '/direct.svg',
			title: '5,000 event invites per week',
			oldValue: '500',
			footnote: '2',
			alt: 'event invite'
		},
		{
			icon: '/messages.svg',
			title: 'Priority Support',
			alt: 'Priority support'
		},
		{
			icon: '/hierarchy-square-2.svg',
			title: 'API + Zapier Access',
			alt: 'Api Zapier Access'
		}
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

<section>
	<main class="md:w-175 rounded-md bg-white py-8">
		<div class="w-full py-10 md:w-full">
			<!-- Plans Grid -->
			<div class="mb-2 grid w-full grid-cols-1 gap-8">
				<!-- Plus Plan -->
				<div class="relative w-full border border-gray-100 bg-white p-6 shadow-sm">
					<div class="mb-3">
						<div class="mb-3 flex items-center justify-between">
							<div>
								<span class="text-xs text-gray-400">{plans.plus.upgrade} </span>
								<h1 class="mb-2 text-lg font-bold text-[#F31A7C]">{plans.plus.name}</h1>
							</div>

							<div class=" flex w-fit justify-center gap-1 rounded-md bg-[#F4F4F4] p-1">
								<button
									class={`rounded-md px-2 py-2 transition ${
										!isAnnual ? 'bg-[#FFFFFF] text-black shadow-sm' : 'text-gray-600'
									}`}
									on:click={() => (isAnnual = false)}
								>
									Monthly
								</button>
								<button
									class={`rounded-md px-2 py-2 transition ${
										isAnnual ? 'bg-[#FFFFFF] text-black shadow-sm' : 'text-gray-600'
									}`}
									on:click={() => (isAnnual = true)}
								>
									Annual
								</button>
							</div>
						</div>

						<div class="mb-2 flex items-center gap-2">
							<span class="text-4xl">
								{isAnnual ? plans.plus.annualPrice : plans.plus.monthlyPrice}
							</span>
							<div class="">
								<span class="rounded-sm bg-[#FDE0EE] px-2 py-1 text-xs text-[#F31A7C]"
									>{plans.plus.tag}</span
								>
								<p class="mt-1 text-sm text-gray-300">Per month, billed annually</p>
							</div>
						</div>

						<ul class="mt-6 space-y-3">
							{#each plans.plus.features as feature, i}
								<li class="flex items-center gap-2 text-sm">
									<img src="/red-tick.svg" alt="tick" class="h-4 w-4 shrink-0 rounded-full" />
									<span>
										{feature.text}
									</span>
								</li>
							{/each}
						</ul>
					</div>

					<a
						href="/auth"
						class="block w-full rounded-md bg-pink-600 py-2 text-center text-white transition hover:bg-pink-700"
					>
						{plans.plus.cta}
					</a>

					<div class="my-4 flex items-center justify-between">
						<span class="text-gray-300">Additional admin</span>
						<span class="text-gray-500">$9/mo </span>
					</div>
				</div>
			</div>
		</div>
		<h1 class="mb-2 px-4 text-lg font-bold text-[#F31A7C]">
			{plans.plus.name} <span class="text-md text-gray-300">Benefit</span>
		</h1>

		<div class="grid grid-cols-1 overflow-hidden bg-[#FFFFFF] px-4 sm:grid-cols-2 md:w-[680px]">
			{#each features as feature}
				<div class="m-0.5 items-center gap-4 bg-gray-100 p-4">
					<!-- Icon Container -->
					<div class=" items-center justify-center bg-gray-100">
						<img src={feature.icon} alt={feature.alt} />
					</div>

					<!-- Content -->
					<div class="w-full text-sm text-gray-700">
						{#if feature.oldValue}
							<span class="mr-1 text-gray-400 line-through">
								{feature.oldValue}
							</span>
						{/if}

						<span class="font-medium">
							{feature.title}
						</span>

						{#if feature.footnote}
							<sup class="ml-1 text-xs text-gray-400">
								{feature.footnote}
							</sup>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</main>
</section>

<style>
	.bg-color {
		background: linear-gradient(180deg, #f5efec 0%, #f4edea 17%, #f4f5f6 43%);
	}
</style>
