<script>
	import Icon from '@iconify/svelte';
	export let open = false;
	let buttonOpen = false;

	$: if (open === false) {
		buttonOpen = false;
	}

	const options = [
		{
			label: 'Public',
			icon: 'mdi:web',
			description: 'Shown on your collection and eligible to be featured.'
		},
		{
			label: 'Private',
			icon: 'mdi:sparkles',
			description: 'Unlisted. Only people with the link can register.'
		}
	];

	export let visibility = options[0].label;
	export let visibility_icon = options[0].icon;

	$: {
		const current = options.find((o) => o.label === visibility);
		visibility_icon = current ? current.icon : options[0].icon;
	}

	function updateVisibility() {
		console.log(`Visibility updated to: ${visibility}`);
		open = false;
		buttonOpen = false;
	}

	function getCurrentIcon() {
		const current = options.find((o) => o.label === visibility);
		return current ? current.icon : options[0].icon;
	}
</script>

{#if open}
	<div class="traingle absolute right-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Icon -->
			<div class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
				<img src="/global-edit.svg" alt="icon" class="h-7 w-7" />
			</div>

			<!-- Title -->
			<h2 class="text-lg font-semibold text-gray-900">Public Event</h2>
			<p class="mt-1 text-sm text-gray-500">
				This event is listed on your collection and is eligible to be featured by Rondwell or listed
				by other community Collection.
			</p>

			<!-- Dropdown -->
			<label for="" class="mt-4 mb-1 block text-sm font-medium text-gray-700">New Visibility</label>

			<div class="relative">
				<button
					type="button"
					class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors {buttonOpen
						? 'bg-[#656668] text-white'
						: 'bg-[#F0F0F0] text-gray-500'}"
					on:click={() => (buttonOpen = !buttonOpen)}
				>
					<span class="flex items-center gap-2">
						<Icon icon={getCurrentIcon()} class="text-lg" />
						{visibility}
					</span>

					<Icon icon="mdi:menu-down" class="h-6 w-6" />
				</button>

				{#if buttonOpen}
					<div
						class="absolute right-0 left-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg"
					>
						{#each options as option}
							<button
								class="w-full px-3 py-2 text-left text-sm transition hover:bg-gray-50"
								on:click={() => {
									visibility = option.label;
									buttonOpen = false;
								}}
							>
								<div class="flex items-start justify-between gap-2">
									<div class="flex gap-2">
										<Icon icon={option.icon} class="h-5 w-5 text-gray-600" />
										<div>
											<p class="font-medium text-gray-800">{option.label}</p>
											<p class="text-xs text-gray-500">{option.description}</p>
										</div>
									</div>
									{#if visibility === option.label}
										<Icon icon="mdi:tick" class="text-3xl text-black" />
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Update Button -->
			<button
				class="mt-5 w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
				on:click={updateVisibility}
			>
				Update Visibility
			</button>
		</div>
	</div>
{/if}

<style>
	/* Triangle pointer */
	.traingle::before {
		content: '';
		position: absolute;
		top: -18px;
		right: 60px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
