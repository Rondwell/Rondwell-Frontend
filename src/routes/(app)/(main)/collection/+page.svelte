<!-- src/routes/+page.svelte -->
<script lang="ts">
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	import { goto } from '$app/navigation';

	const collections = [
		{
			name: 'The GenAI Collective',
			image: '/eventcard.png',
			events: [
				{ title: '💕  GenAI Collective NTC 💕 Resarch Roundatable ', date: 'Thu, Sep 19, 6:30 PM' },
				{ title: '💕  GenAI Collective NTC 💕 Resarch Roundatable ', date: 'Thu, Sep 19, 6:30 PM' }
			]
		}
	];

	const myCollection = [
		{
			name: 'The GenAI Collective',
			image: '/eventcard.png'
		}
	];

	const InactiveCollection = [
		{
			name: 'The GenAI Collective',
			image: '/eventcard.png'
		},
		{
			name: 'The GenAI Collective',
			image: '/eventcard.png'
		},
		{
			name: 'The GenAI Collective',
			image: '/eventcard.png'
		}
	];
</script>

<div class="w-full">
	<!-- Welcome Aboard Section -->
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-medium">Collection</h1>

		<div
			class="flex h-full min-h-[181.5px] flex-col items-start gap-4 rounded-lg bg-[#FDFDFD] p-3 md:flex-row md:p-6"
		>
			<div
				class="flex w-full items-center justify-center rounded bg-[#F4F5F6] p-5 md:h-[144px] md:max-w-[195.09px]"
			>
				<img src="/folder-icon.png" alt="folder icon" class="w-full" />
			</div>

			<div
				class="flex h-full min-h-[144px] flex-1 flex-col justify-between text-center md:text-left"
			>
				<span>
					<h2 class="font-mediun mb-1 text-xl">Welcome to Rondwell Collection</h2>
					<p class="mb-3 max-w-[724px] text-sm text-[#B9BABA]">
						Rondwell Collection lets you easily share and manage your events. Every event on
						Rondwell is part of a calendar. Let’s see how they work.
					</p>
				</span>

				<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
					<div class="mt-4 flex items-center gap-1">
						<span class="h-1 w-8 rounded bg-black"></span>
						<span class="h-1 w-8 rounded-full bg-gray-400"></span>
						<span class="h-1 w-8 rounded-full bg-gray-400"></span>
						<span class="h-1 w-8 rounded-full bg-gray-400"></span>
					</div>
					<button
						class="h-[38px] w-full rounded bg-black px-3 py-1 text-sm font-medium text-white md:w-fit"
					>
						Next
					</button>
				</div>
			</div>
			<!-- </div> -->
		</div>
	</div>

	<!-- My Collection -->
	<div class="mb-8 w-full">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-medium">My Collection</h2>

			<button
				on:click={() => goto('/collection/create')}
				class="flex h-[35.75px] w-fit items-center gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-lg text-[#616265]"
			>
				<svg
					width="18"
					height="14"
					viewBox="0 0 18 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g opacity="0.4">
						<path
							d="M0.75 6.75H17.1978"
							stroke="#02091D"
							stroke-width="1.50004"
							stroke-linecap="round"
						/>
						<path
							d="M8.97266 12.7503V0.75"
							stroke="#02091D"
							stroke-width="1.50004"
							stroke-linecap="round"
						/>
					</g>
					<g opacity="0.4">
						<path
							d="M0.75 6.75H17.1978"
							stroke="#02091D"
							stroke-width="1.50004"
							stroke-linecap="round"
						/>
						<path
							d="M8.97266 12.7503V0.75"
							stroke="#02091D"
							stroke-width="1.50004"
							stroke-linecap="round"
						/>
					</g>
				</svg>
				create
			</button>
		</div>
		<div class="mb-12 grid w-full max-w-[1020px] gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each myCollection as collection, index (index)}
				<a href="/collection/1/events" class="w-full">
					<CollectionCard {collection} type="mine" />
				</a>
			{/each}
		</div>
	</div>

	<!-- Subscribed Collections Section -->
	<div>
		<h2 class="mb-4 text-2xl font-medium">Subscribed Collections</h2>

		<div class="mb-12 flex w-full max-w-[1020px] flex-col gap-4">
			{#each collections as collection, index (index)}
				<CollectionCard {collection} />
			{/each}
		</div>

		<div>
			<p class="mb-4 flex items-center gap-1 text-sm text-[#A9AAAA]">
				3 Inactive Collection

				<svg
					width="11"
					height="11"
					viewBox="0 0 11 11"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9.75098 0.828125C10.401 1.49438 10.546 2.45899 10.1084 3.28613V3.28516L7.13965 8.92773V8.92676C6.7762 9.62158 6.05956 10.0546 5.27441 10.0547C4.48922 10.0547 3.77365 9.62159 3.41016 8.92676L0.439453 3.28516L0.44043 3.28418C0.270666 2.9653 0.189524 2.62953 0.189453 2.29297C0.189453 1.75592 0.399584 1.23701 0.797852 0.828125C1.44887 0.161097 2.41298 1.20916e-05 3.24512 0.416016L4.82227 1.20508C5.10007 1.34398 5.43768 1.34397 5.72168 1.2041H5.72266L7.30273 0.416016L7.46094 0.344727C8.2549 0.0221156 9.14068 0.202821 9.75098 0.828125ZM9.25391 2.29785C9.25391 2.02072 9.12508 1.77287 8.95703 1.60059H8.95605C8.70723 1.34347 8.27235 1.16629 7.79199 1.4043L6.21484 2.19238H6.21387C5.6953 2.44927 5.09559 2.48166 4.55664 2.28906L4.3291 2.19238L2.75098 1.4043V1.40332C2.27217 1.16187 1.83684 1.34233 1.58691 1.60059C1.33545 1.86073 1.16492 2.29536 1.41406 2.76953L4.38379 8.41211L4.45703 8.53223C4.64408 8.79685 4.93876 8.9502 5.26953 8.9502C5.60011 8.95014 5.89403 8.79662 6.08105 8.53223L6.15527 8.41211L9.13379 2.77051C9.22111 2.60417 9.25384 2.44416 9.25391 2.29785Z"
						fill="#A9AAAA"
						stroke="#A9AAAA"
						stroke-width="0.375009"
					/>
					<rect
						x="4.6875"
						y="5.0625"
						width="3.37508"
						height="1.12503"
						rx="0.562514"
						transform="rotate(-90 4.6875 5.0625)"
						fill="#A9AAAA"
						stroke="#A9AAAA"
						stroke-width="0.375009"
					/>
				</svg>
			</p>

			<div class="mb-12 grid w-full max-w-[1020px] gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each InactiveCollection as collection, index (index)}
					<CollectionCard {collection} type="inactive" />
				{/each}
			</div>
		</div>
	</div>
</div>
