<script>
	import { fly, fade } from 'svelte/transition';
	import Icon from '@iconify/svelte';

	export let open = false;

	function closeModal() {
		open = false;
	}

	let toggleCards = [
		{
			icon: 'mdi:account-group',
			iconBg: 'bg-purple-200',
			iconColor: 'text-purple-600',
			title: 'Public Guest List',
			description: 'Show Public Guest List',
			enabled: false
		},
		{
			icon: 'mdi:comment-question-outline',
			iconBg: 'bg-blue-200',
			iconColor: 'text-blue-600',
			title: 'Post Event Feedback',
			description: 'Send feedback form to guests automatically',
			enabled: false
		},
		{
			icon: 'mdi:clock-outline',
			iconBg: 'bg-pink-200',
			iconColor: 'text-pink-600',
			title: 'Waitlist',
			description: 'Allow guests to join a waitlist if tickets run out or registration closes',
			enabled: false
		},
		{
			icon: 'mdi:cash-multiple',
			iconBg: 'bg-green-200',
			iconColor: 'text-green-600',
			title: 'Donations',
			description: 'Guests can optionally donate during registration',
			enabled: false
		}
	];
</script>

{#if open}
	<!-- Modal sliding up from bottom -->
	<div
		class="bg fixed inset-x-0 bottom-0 z-50 flex min-h-[236.25px] w-full flex-col gap-4 p-6"
		style="max-height: 70vh; overflow-y: auto;"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<div
			class="custom-scrollbar relative flex h-full w-full flex-col items-start justify-between gap-6 overflow-y-auto text-gray-500 lg:flex-row lg:items-stretch"
		>
			<!-- Left Side: Input Section -->
			<div
				class="flex h-auto w-full max-w-[300px] flex-col items-start justify-between gap-4 lg:w-[35%]"
			>
				<h2 class="gradient-text text-lg font-semibold text-gray-800">Custom Event Link</h2>

				<div class="w-full">
					<label for="link" class="mb-1 block text-sm text-gray-400">Enter Custom Event Link</label>
					<div class="flex w-full items-center overflow-hidden rounded-lg border border-gray-300">
						<span class="bg-gray-200 px-3 py-2 text-gray-600 select-none">Rondwell.com/</span>
						<input
							type="text"
							placeholder="Custom Link"
							class="flex-grow bg-white px-3 py-2 text-gray-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- Right Side: Toggle Cards -->
			<div class="grid h-full max-h-[60vh] w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each toggleCards as card}
					<div class="card-bg flex min-h-[160px] flex-col justify-between rounded-lg p-6">
						<div class="flex items-center justify-between">
							<div
								class={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconBg} ${card.iconColor}`}
							>
								<Icon icon={card.icon} class="text-xl" />
							</div>
							<input
								type="checkbox"
								bind:checked={card.enabled}
								class="toggle toggle-primary"
								aria-label={`Toggle ${card.title}`}
							/>
						</div>
						<div>
							<h3 class="font-semibold text-gray-900">{card.title}</h3>
							<p class="mt-1 text-xs font-medium text-gray-500">{card.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.bg {
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(20px);
		border-radius: 18.75px 18.75px 0px 0px;
	}

	.card-bg {
		background: rgba(243, 245, 247, 0.7);
		backdrop-filter: blur(5px);
		border-radius: 8px;
	}

	.gradient-text {
		background: linear-gradient(90deg, #db3ec6 0%, #963dd4 50%, #513be2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		color: transparent;
	}

	input[type='checkbox'].toggle {
		appearance: none;
		width: 40px;
		height: 25px;
		background: #ddd;
		border-radius: 15px;
		position: relative;
		cursor: pointer;
		transition: background 0.3s;
	}

	input[type='checkbox'].toggle:checked {
		background: black;
	}

	input[type='checkbox'].toggle::before {
		content: '';
		position: absolute;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		top: 1px;
		left: 1px;
		background: white;
		transition: transform 0.3s;
	}

	input[type='checkbox'].toggle:checked::before {
		transform: translateX(15px);
	}
</style>
