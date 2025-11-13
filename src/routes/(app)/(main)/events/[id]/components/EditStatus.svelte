<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';

	export let open = false;
	export let attendee: any = {};

	let buttonOpen = false;

	$: if (open === false) {
		buttonOpen = false;
	}

	const options = [
		{
			label: 'Attending',
			icon: 'mdi:check-circle-outline'
		},
		{
			label: 'Pending',
			icon: `<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="1.58008" width="14.2066" height="2.36776" fill="#A8A9A9"/>
<rect x="1.58008" y="7.10156" width="14.2066" height="2.36776" fill="#A8A9A9"/>
<rect x="8.68555" y="13.4141" width="9.47104" height="2.36776" fill="#A8A9A9"/>
<path d="M7.10352 14.5985L1.77606 17.6743V11.5227L7.10352 14.5985Z" fill="#A8A9A9"/>
</svg>
`,
			svg: true
		},
		{
			label: 'Waitlist',
			icon: 'mdi:hourglass-empty'
		}
	];

	let status = options[0].label;
	let status_icon = options[0].icon;

	$: {
		const current = options.find((o) => o.label === status);
		status_icon = current ? current.icon : options[0].icon;
	}

	function updateStatus() {
		console.log(`status updated to: ${status}`);
		open = false;
		buttonOpen = false;
	}

	function getCurrentIcon() {
		const current = options.find((o) => o.label === status);
		return current ? current.icon : options[0].icon;
	}

	let notify = false;
</script>

{#if open}
	<div class="triangle absolute right-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<!-- Icon -->

			<img src="/face-1.svg" alt="icon" class="h-10 w-10" />
			<div class="mt-3 flex items-center justify-between gap-2">
				<div>
					<p class="font-semibold text-gray-900">{attendee.name}</p>
					<p class="text-xs text-gray-400">{attendee.email}</p>
				</div>

				<div
					class="flex items-center gap-1 rounded-md bg-[#DCDCDC] px-3 py-1 text-xs text-[#A9AAAA]"
				>
					{attendee.status}
				</div>
			</div>

			<!-- Dropdown -->
			<label for="" class="mt-4 mb-1 block text-sm font-medium text-gray-700"
				>Change status to:</label
			>

			<div class="relative">
				<button
					type="button"
					class="flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm
											text-gray-500 transition-colors"
					placeholder="Please select the new status"
					on:click={() => (buttonOpen = !buttonOpen)}
				>
					<span class="flex items-center gap-2">
						{#if getCurrentIcon().startsWith('<svg')}
							<span class="inline-block text-lg" style="width: 1.25rem; height: 1.25rem;">
								{@html getCurrentIcon()}
							</span>
						{:else}
							<Icon icon={getCurrentIcon()} class="text-lg" />
						{/if}

						{status}
					</span>

					<Icon icon="mdi:menu-down" class="h-6 w-6" />
				</button>

				{#if buttonOpen}
					<div
						class="absolute right-0 left-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg"
					>
						{#each options as option}
							<button
								class="w-full px-3 py-2 text-left text-sm transition hover:bg-gray-50 {status ===
								option.label
									? 'bg-[#E5E5E5]'
									: ''}"
								on:click={() => {
									status = option.label;
									buttonOpen = false;
								}}
							>
								<div class="flex gap-2">
									{#if option.svg}
										<p>{@html option.icon}</p>
									{:else}
										<Icon icon={option.icon} class="h-5 w-5 text-gray-400" />
									{/if}
									<p class="font-medium text-gray-800">{option.label}</p>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="mt-4 flex items-center space-x-2">
				<input
					type="checkbox"
					bind:checked={notify}
					class="h-[22px] w-[22px] rounded border-gray-300 accent-black focus:ring-0"
					id="notify"
				/>
				<label for="notify" class="text-sm">Notify Attendee</label>
			</div>

			{#if notify}
				<div class="mt-4" transition:fade>
					<textarea
						rows="4"
						placeholder="Add an optional, custom message..."
						class="w-full resize-none rounded-md border bg-white p-2 text-xs text-gray-400 outline-none focus:ring-0"
					></textarea>
					<p class="mt-1 text-xs font-light text-[#BCBCBC]">
						Any message you specified in the registration emails will always be included.
					</p>
				</div>
			{/if}
			<!-- Update Button -->
			<button
				class="mt-5 w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
				on:click={updateStatus}
			>
				Update Status
			</button>
		</div>
	</div>
{/if}
