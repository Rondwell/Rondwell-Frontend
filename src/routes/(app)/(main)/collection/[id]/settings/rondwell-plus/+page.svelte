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
<div class="lg-block hidden sm:justify-between md:mb-10 md:flex">
		<div class="flex items-center justify-between">
			<img src="/tech-icon.svg" alt="icon" class="h-7 w-7" />
			<h1 class="text-md ml-2 lg:text-2xl">Business Collection</h1>
		</div>
		<button
			class="flex w-fit items-center gap-2 whitespace-nowrap rounded-md bg-[#DCE4EE] px-3 text-[#5D646F] md:text-sm"
		>
			<span class="md:text-sm">Calendar Page</span>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M1.24306 6.4387C1.40611 5.40243 2.12888 4.62786 3.0931 4.47826L9.69034 3.43935L9.8408 3.42097C10.5948 3.35739 11.3249 3.72187 11.7721 4.3912C12.2195 5.06073 12.3131 5.92902 12.0244 6.68931L11.9618 6.83923L9.01457 13.3413L9.01326 13.3411C8.84871 13.7088 8.61528 14.0066 8.33157 14.2308C7.8792 14.5883 7.31432 14.7405 6.72781 14.6481C5.77143 14.4963 5.05093 13.7247 4.89305 12.6922L4.591 10.7138C4.53659 10.3578 4.3245 10.0403 4.02548 9.86912L4.02494 9.8683L2.3872 8.94152C1.53287 8.45922 1.08026 7.47484 1.24306 6.4387ZM2.76439 5.88928C2.52769 6.07636 2.39626 6.36366 2.35324 6.63719L2.35378 6.638C2.28828 7.04462 2.40721 7.57568 2.91465 7.86476L4.55152 8.78851L4.66279 8.85692C5.17357 9.19045 5.53909 9.73754 5.67294 10.3689L5.69839 10.5051L6.00044 12.4835L6.00098 12.4843C6.09306 13.0997 6.52266 13.3845 6.9 13.4426C7.27991 13.5012 7.75745 13.3662 8.00792 12.8142L10.9559 6.31145C11.1348 5.91836 11.1012 5.47237 10.8636 5.11651C10.6258 4.7606 10.2457 4.58735 9.84651 4.65089L9.84575 4.6515L3.24253 5.68148C3.04601 5.71271 2.88934 5.79056 2.76439 5.88928Z"
					fill="#5D646F"
					stroke="#5D646F"
					stroke-width="0.37461"
				/>
				<rect
					x="7.25931"
					y="8.68484"
					width="3.5114"
					height="1.15881"
					rx="0.579404"
					transform="rotate(144 7.25931 8.68484)"
					fill="#5D646F"
					stroke="#5D646F"
					stroke-width="0.37461"
				/>
			</svg>
		</button>
	</div>
	<main class="bg-white rounded-md md:w-175 py-8">
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
			{plans.plus.name} <span class="text-gray-300 text-md">Benefit</span>
		</h1>

		<div
			class="grid grid-cols-1 px-4 overflow-hidden  bg-[#FFFFFF] sm:grid-cols-2 md:w-[680px]"
		>
			

			{#each features as feature}
				<div
					class="m-0.5  items-center gap-4    bg-gray-100 p-4 "
				>
					<!-- Icon Container -->
					<div class=" items-center justify-center bg-gray-100 ">
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
