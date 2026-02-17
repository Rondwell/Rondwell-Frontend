<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import SelectDropdown from './SelectDropdown.svelte';

	let selected = 'Main';
	const options = ['Main', 'New Tag', 'Crypto'];

	type Theme = 'light' | 'dark';

	const theme = writable<Theme>('light');
	let mounted = false;

	onMount(() => {
		mounted = true;

		const stored = localStorage.getItem('theme') as Theme | null;
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		if (stored) {
			theme.set(stored);
		} else if (prefersDark) {
			theme.set('dark');
		}

		const unsubscribe = theme.subscribe((value) => {
			localStorage.setItem('theme', value);

			if (value === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		});

		return unsubscribe;
	});

	function toggleTheme() {
		theme.update((t) => (t === 'light' ? 'dark' : 'light'));
	}

	let copied = false;

	const embedCode = `<iframe
  src="https://rondwell.com/embed/calendar/cal-QxJCmyPBjw5PKsT/events?"
  width="600"
  height="450"
  frameborder="0"
  style="border: 1px solid #bfcbd8; border-radius: 4px;"
  allowfullscreen=""
  aria-hidden="false"
  tabindex="0">
</iframe>`;

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(embedCode);
			copied = true;

			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Copy failed', err);
		}
	}
</script>

<section class="p-4">
	<div class="mb-4 flex flex-col justify-between gap-2">
		<h2 class="text-lg font-semibold">Embed Collection</h2>
		<p class="text-[#8C8F93]">
			Have your own site? Embed your collection to easily share a live view of your upcoming events.
		</p>
	</div>

	<div
		class="lg:w-154.5 w-full rounded-md bg-gray-50 p-4 transition-colors duration-300 dark:bg-gray-950"
	>
		<div class="flex w-full flex-col items-center justify-between gap-2 lg:flex-row">
			<div class="lg:gap-15 flex w-full justify-between px-8 lg:justify-start lg:px-0">
				<div class="flex items-center justify-between gap-2">
					<button
						class="rounded-lg border border-gray-300 bg-white p-2 shadow-sm transition hover:scale-105 dark:border-gray-700 dark:bg-gray-800"
						aria-label="Toggle theme"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 18 18"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M13.6291 3.93359L13.5318 4.00398L9.0539 8.90641L8.99414 8.99735L9.01673 9.00701L13.6224 9.01422L13.6291 8.99735L17.9976 4.70878L13.6291 3.93359Z"
								fill="#A3A4A4"
							/>
							<path
								d="M13.6291 14.0638L13.6016 14.0702L9.01213 9.05751L8.99414 9H13.6291L17.9976 13.2355L13.6291 14.0638Z"
								fill="#A3A4A4"
							/>
							<path
								d="M8.99737 9L13.6323 14.0638L13.4182 18.0013L8.99737 13.4985L8.98593 13.4568L8.97656 9.06073L8.99737 9Z"
								fill="#A3A4A4"
							/>
							<path
								d="M4.08978 13.7816L4.08398 13.735L8.93964 9.03558L8.9982 9L8.99761 13.4988L4.60811 18.0016L4.08978 13.7816Z"
								fill="#A3A4A4"
							/>
							<path
								d="M8.9978 8.99781L4.08938 13.7794L0 13.2204L4.63729 8.99781L4.66271 8.97588L8.94236 8.97266L8.9978 8.99781Z"
								fill="#A3A4A4"
							/>
							<path
								d="M8.9978 9.00034L8.93924 8.90113L4.164 4.22396L4.08938 4.21875L0 4.81789L4.63729 9.00034H8.9978Z"
								fill="#A3A4A4"
							/>
							<path
								d="M4.08984 4.21742L8.99826 8.99901L9.02026 8.88063V4.58684L8.99767 4.5002L4.60252 0L4.08984 4.21742Z"
								fill="#A3A4A4"
							/>
							<path
								d="M8.99414 8.99871L13.6291 3.93495L13.3665 0L8.99414 4.5002V8.99871Z"
								fill="#A3A4A4"
							/>
						</svg>
					</button>

					{#if mounted}
						<div class=" ">
							<button
								on:click={toggleTheme}
								class="rounded-lg border border-gray-300 bg-white p-2 shadow-sm transition hover:scale-105 dark:border-gray-700 dark:bg-gray-800"
								aria-label="Toggle theme"
							>
								{#if $theme === 'light'}
									<!-- Moon Icon -->
									<svg
										class="h-5 w-5 text-gray-700"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
										/>
									</svg>
								{:else}
									<!-- Sun Icon -->
									<svg
										class="h-5 w-5 text-yellow-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
										/>
									</svg>
								{/if}
							</button>
						</div>
					{/if}
				</div>

				<div class="flex gap-2">
					<button
						class="rounded-lg border border-gray-300 bg-white p-2 shadow-sm transition hover:scale-105 dark:border-gray-700 dark:bg-gray-500"
						aria-label="Toggle theme"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 18 18"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								opacity="0.4"
								d="M12.1425 1.5H5.8575C3.1275 1.5 1.5 3.1275 1.5 5.8575V12.135C1.5 14.8725 3.1275 16.5 5.8575 16.5H12.135C14.865 16.5 16.4925 14.8725 16.4925 12.1425V5.8575C16.5 3.1275 14.8725 1.5 12.1425 1.5Z"
								fill="#292D32"
							/>
							<path
								d="M11.8125 7.3125H6.1875C5.88 7.3125 5.625 7.0575 5.625 6.75C5.625 6.4425 5.88 6.1875 6.1875 6.1875H11.8125C12.12 6.1875 12.375 6.4425 12.375 6.75C12.375 7.0575 12.12 7.3125 11.8125 7.3125Z"
								fill="#292D32"
							/>
							<path
								d="M11.8125 11.8125H6.1875C5.88 11.8125 5.625 11.5575 5.625 11.25C5.625 10.9425 5.88 10.6875 6.1875 10.6875H11.8125C12.12 10.6875 12.375 10.9425 12.375 11.25C12.375 11.5575 12.12 11.8125 11.8125 11.8125Z"
								fill="#292D32"
							/>
						</svg>
					</button>

					<button
						class="rounded-lg border border-gray-300 bg-white p-2.5 shadow-sm transition hover:scale-105 dark:border-gray-700 dark:bg-gray-800"
						aria-label="Toggle theme"
					>
						<svg
							width="17"
							height="15"
							viewBox="0 0 17 15"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<ellipse cx="1.5" cy="1.125" rx="1.5" ry="1.125" fill="#A5A6A5" />
							<ellipse cx="1.5" cy="6.375" rx="1.5" ry="1.125" fill="#A5A6A5" />
							<ellipse cx="1.5" cy="13.125" rx="1.5" ry="1.125" fill="#A5A6A5" />
							<rect x="5.25" width="11.25" height="2.25" rx="1.125" fill="#A5A6A5" />
							<rect x="5.25" y="6" width="11.25" height="2.25" rx="1.125" fill="#A5A6A5" />
							<rect x="5.25" y="12" width="11.25" height="2.25" rx="1.125" fill="#A5A6A5" />
						</svg>
					</button>
				</div>
			</div>

			<div class="item-center flex w-full justify-center">
				<SelectDropdown bind:value={selected} {options} placeholder="All Events" />
			</div>
		</div>

		<div class="mt-4 flex flex-col items-center justify-center gap-4 rounded-md bg-[#F4F5F6] pb-20">
			<img src="/noEvent.svg" alt="No Events" class="ml-4 h-60 w-60" />
			<h2 class="text-lg font-semibold text-[#646568]">No Upcoming Events, yet</h2>
			<p class="max-w-md text-center text-[#A2ACB2]">Check back later for new events.</p>
		</div>
	</div>

	<div class="my-4 w-full ">
		<div class="mb-2 flex items-center justify-between">
			<div
				
				class="text-md mt-4 cursor-pointer rounded-md px-3 py-1 text-[#838486] transition"
			>
				{copied ? 'Copied!' : ' Code to Copy'}
			</div>
		</div>

		<pre on:click={copyToClipboard}
			class=" cursor-pointer rounded-lg border border-gray-200 bg-gray-100 text-sm">
			<code>{embedCode}</code>
 	    </pre>
	</div>

	<div
	
		class="text-md mt-4 rounded-md px-3 py-1 text-[#838486] transition"
	>
		You can change the width and height attributes above to fit the size of your page.
	</div>
</section>
