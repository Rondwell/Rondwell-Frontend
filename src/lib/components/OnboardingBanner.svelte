<!--
  OnboardingBanner.svelte
  A dismissable, multi-slide intro card. "Next" advances through the slides;
  on the last slide the button becomes "Close" and permanently dismisses the
  banner (persisted in localStorage under `storageKey`). The pager dots are
  clickable so the user can jump between slides.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	export let storageKey: string;
	export let slides: { title: string; body: string }[] = [];
	export let image = '/folder-icon.png';

	let ready = false; // avoid a flash before the localStorage check runs
	let dismissed = false;
	let current = 0;
	let direction = 1; // 1 = forward, -1 = backward (drives the slide animation)

	$: isLast = current >= slides.length - 1;

	onMount(() => {
		if (browser) dismissed = localStorage.getItem(storageKey) === '1';
		ready = true;
	});

	function goTo(i: number) {
		direction = i >= current ? 1 : -1;
		current = Math.max(0, Math.min(slides.length - 1, i));
	}

	function next() {
		if (isLast) dismiss();
		else goTo(current + 1);
	}

	function dismiss() {
		dismissed = true;
		if (browser) localStorage.setItem(storageKey, '1');
	}
</script>

{#if ready && !dismissed && slides.length}
	<div
		class="relative flex h-full min-h-[181.5px] flex-col items-start gap-4 rounded-lg bg-[#FDFDFD] p-3 md:flex-row md:p-6"
	>
		<!-- Quick dismiss (kept subtle; the primary flow is Next → Close) -->
		<button
			type="button"
			on:click={dismiss}
			aria-label="Dismiss"
			class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
		>
			<Icon icon="mdi:close" width="16" />
		</button>

		<div
			class="flex w-full items-center justify-center rounded bg-[#F4F5F6] p-5 md:h-[144px] md:max-w-[195.09px]"
		>
			<img src={image} alt="" class="w-full" />
		</div>

		<div class="flex h-full min-h-[144px] flex-1 flex-col justify-between overflow-hidden text-center md:text-left">
			{#key current}
				<span class="block" in:fly={{ x: 24 * direction, duration: 220 }}>
					<h2 class="mb-1 text-xl font-medium">{slides[current].title}</h2>
					<p class="mb-3 max-w-[724px] text-sm text-[#B9BABA]">{slides[current].body}</p>
				</span>
			{/key}

			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<div class="mt-4 flex items-center gap-1">
					{#each slides as _, i}
						<button
							type="button"
							aria-label={`Go to slide ${i + 1}`}
							aria-current={i === current}
							on:click={() => goTo(i)}
							class="h-1 rounded-full transition-all duration-200 {i === current
								? 'w-8 bg-black'
								: 'w-8 bg-gray-400 hover:bg-gray-500'}"
						></button>
					{/each}
				</div>
				<button
					type="button"
					on:click={next}
					class="h-[38px] w-full rounded bg-black px-3 py-1 text-sm font-medium text-white transition-opacity hover:opacity-90 md:w-fit md:min-w-[96px]"
				>
					{isLast ? 'Close' : 'Next'}
				</button>
			</div>
		</div>
	</div>
{/if}
