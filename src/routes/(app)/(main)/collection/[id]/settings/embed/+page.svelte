<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import SelectDropdown from './SelectDropdown.svelte';

	let selected: string | null = null;
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

	function setTheme(value: Theme) {
		theme.set(value);
	}

	let copied = false;

	const embedCode = `<iframe 
  src="https://rondwell.com/embed/calendar/cal-QxJCmyPBjw5PKsT/events?" 
  width="600" 
  height="450" 
  frameborder="0" 
  style="border: 1px solid #bfcbda88; border-radius: 4px;" 
  allowfullscreen=" 
  aria-hidden="false" 
  tabindex="0" 
X/iframe>`;
function escapeHtml(str: any) {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				console.log('Copied to clipboard');
				// In a real app, you might show a toast notification
			})
			.catch((err) => {
				console.error('Failed to copy: ', err);
			});
	};
</script>

<section class="p-4">
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
				<div class="flex items-center justify-between rounded-md p-1 gap-2 bg-[#F4F4F4]">
					{#if mounted}
						<button
							on:click={() => setTheme('light')}
							class="rounded-lg p-2 shadow-sm transition hover:scale-105"
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
									d="M9.06641 1.00488C13.1415 1.20045 16.3857 4.56689 16.3857 8.69043V9.31055C16.3857 13.4341 13.1415 16.7995 9.06641 16.9951V1.00488Z"
									fill="#131517"
									stroke="#131517"
									stroke-width="0.75"
								/>
								<circle cx="9" cy="9" r="7.875" stroke="#131517" stroke-width="2.25" />
							</svg>
						</button>

						<button
							class="rounded-lg  shadow-sm transition hover:scale-105 "
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

						<div class=" ">
							<button
								on:click={() => setTheme('dark')}
								class="rounded-lg p-2 shadow-sm transition hover:scale-105 "
								aria-label="Toggle theme"
							>
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
							</button>
						</div>
					{/if}
				</div>

				<div class="flex gap-2 rounded-md p-1 bg-[#F4F4F4]">
					<button
						class="rounded-lg p-2 shadow-sm transition hover:scale-105"
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
						class="rounded-lg p-2.5 shadow-sm transition hover:scale-105 "
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

	<div class="my-4 sm:my-6">
			<p class="mb-2 text-sm text-[#838486] sm:mb-3 sm:text-base">
				Code to Copy
			</p>
			<div class="relative md:max-w-158 lg:max-w-auto">
				<div
					class="custom-scrollbar overflow-x-auto rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-sm sm:p-5 sm:text-sm"
				>
					<pre class=""><code>{escapeHtml(embedCode)}</code></pre>
				</div>
				<button
					on:click={() => copyToClipboard(embedCode)}
					class="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-[#F6F6F6] p-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-100 sm:top-4 sm:right-4"
				>
					<img src="/copy.svg" alt="" />
					Copy
				</button>
			</div>
		</div>

	<div class="text-md mt-4 rounded-md px-3 py-1 text-[#838486] transition">
		You can change the width and height attributes above to fit the size of your page.
	</div>
</section>
