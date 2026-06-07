<!-- Preferences section (language). Rendered as a section inside the Account tab. -->
<script lang="ts">
	import { clickOutside } from '$lib/utils/constant';

	let open = false;
	let options = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
	let language = options[0];

	function selectOption(option: string) {
		language = option;
		open = false;
	}
</script>

<div class="mb-12 border-t pt-12">
	<h2 class="mb-1 text-lg font-semibold">Preferences</h2>
	<p class="mb-4 text-sm text-[#8C8F93]">Set your language and regional preferences.</p>

	<!-- Language Selection -->
	<div>
		<label for="language" class="mb-2 block text-sm font-medium text-[#8C8F93]">Language</label>
		<div
			class="relative inline-block text-left"
			use:clickOutside={() => {
				open = false;
			}}
		>
			<!-- Trigger button -->
			<button
				on:click={() => (open = !open)}
				class="flex w-[282.01px] items-center gap-2 rounded-sm bg-[#FFFFFF] px-3 py-2 text-sm font-medium text-[#616265] shadow-sm"
			>
				<span>{language}</span>
				<img src="/arrow-down.svg" alt="arrow" class="ml-auto h-2 w-3" />
			</button>

			<!-- Dropdown -->
			{#if open}
				<div
					class="absolute left-0 z-10 mt-1 flex w-full flex-col items-start rounded-sm bg-[#FFFFFF] shadow-lg"
				>
					{#each options as option}
						<button
							class="w-full cursor-pointer px-3 py-2 text-start text-sm text-gray-700 hover:bg-gray-100"
							on:click={() => selectOption(option)}
						>
							{option}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
