<!-- src/routes/event/more/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';

	// Mock data for the event
	const eventData = {
		title: 'Megaexe Party',
		collection: 'John Collection',
		publicUrl: 'ron.d/applikhek',
		embedCode: `
<a
  href="https://rondwell.com/event/evt-j22Np2szPIjRlBQ"
  class="rondwell-checkout--button"
  data-rondwell-action="checkout"
  data-rondwell-event-id="evt-j22Np2szPIjRlBQ"
>
  Register for Event
</a>

<script id="rondwell-checkout" src="https://embed.rondwell.com/checkout-button.js"><\/script>
`
	};

	const embedAs = [
		{
			name: 'Embed as Button',
			svg: `<svg width="27" height="30" viewBox="0 0 27 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="25.4735" height="16.4828" rx="3.7461" fill="#F31A7C"/>
                <path d="M7.57626 12.4795C7.17085 11.2996 8.30046 10.17 9.4803 10.5754L19.6875 14.0827C20.7353 14.4428 21.0435 15.776 20.2601 16.5594L13.5602 23.2593C12.7768 24.0427 11.4436 23.7345 11.0836 22.6867L7.57626 12.4795Z" fill="url(#paint0_linear_3940_40212)"/>
                <rect x="14.9871" y="20.1016" width="2.99688" height="7.63574" rx="1.49844" transform="rotate(-45 14.9871 20.1016)" fill="#F31A7C"/>
                <defs>
                <linearGradient id="paint0_linear_3940_40212" x1="12.7395" y1="7.1224" x2="13.1141" y2="23.9798" gradientUnits="userSpaceOnUse">
                <stop offset="0.42" stop-color="white"/>
                <stop offset="0.455" stop-color="#F31A7C"/>
                </linearGradient>
                </defs>
                </svg>`
		},
		{
			name: 'Embed Event Page',
			svg: `<svg width="21" height="26" viewBox="0 0 21 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="20.9781" height="25.4735" rx="3.7461" fill="#F21A7C"/>
                <path d="M2.9978 5.9961C2.9978 3.92719 4.67499 2.25 6.7439 2.25H14.2361C16.305 2.25 17.9822 3.92718 17.9822 5.9961V10.4914H2.9978V5.9961Z" fill="#FBDEEC"/>
                <rect x="3.74707" y="14.2344" width="5.24454" height="2.24766" rx="1.12383" fill="#FBDEEC"/>
                <rect x="3.74707" y="18.7344" width="8.99063" height="2.24766" rx="1.12383" fill="#FBDEEC"/>
                </svg>`
		}
	];

	$: selectedEmbed = embedAs[0].name;

	function escapeHtml(str: any) {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	// Function to copy code to clipboard
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

	// Function to update public URL
	const updatePublicUrl = () => {
		console.log('Updating public URL...');
		// In a real app, this would send the updated URL to your backend
	};

	// Function to clone event
	const cloneEvent = () => {
		console.log('Cloning event...');
		// In a real app, this would create a new event with the same information
	};

	// Function to transfer event
	const transferEvent = () => {
		console.log('Transferring event...');
		// In a real app, this would move the event to another collection
	};

	// Function to cancel event
	const cancelEvent = () => {
		if (
			confirm(
				'Are you sure you want to permanently delete this event? This operation cannot be undone.'
			)
		) {
			console.log('Canceling event...');
			// In a real app, this would permanently delete the event
		}
	};
</script>

<div class="max-w-6xl">
	<!-- Event Header -->
	<div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-sm text-[#83808D]">John Collection</span>
				<svg
					width="11"
					height="11"
					viewBox="0 0 11 11"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M0.827148 0.795898C1.49266 0.146359 2.45588 0.00140483 3.28223 0.438477L8.91895 3.4043H8.91797C9.61211 3.76739 10.0449 4.48319 10.0449 5.26758C10.0449 6.05184 9.61196 6.76678 8.91797 7.12988L8.91895 7.13086L3.28223 10.0957C2.96323 10.2657 2.62676 10.3467 2.29004 10.3467C1.75372 10.3466 1.23549 10.137 0.827148 9.73926C0.160836 9.0889 0.000384912 8.12521 0.416016 7.29395L1.2041 5.71875C1.34288 5.44119 1.34292 5.10404 1.20312 4.82031V4.81934L0.416016 3.24023C0.000612916 2.4091 0.161042 1.44617 0.827148 0.795898ZM2.29492 1.29199C2.01826 1.29212 1.77162 1.42109 1.59961 1.58887L1.59863 1.58984C1.34194 1.83849 1.16551 2.27322 1.40332 2.75293L2.19043 4.32812L2.28711 4.55469C2.47977 5.09324 2.44715 5.69271 2.19043 6.21094V6.21191L1.40234 7.78711V7.78809C1.16122 8.26626 1.34076 8.7005 1.59863 8.9502C1.85851 9.20169 2.2935 9.37235 2.76758 9.12305L8.40332 6.15723H8.4043C8.74149 5.98034 8.94037 5.64982 8.94043 5.27246C8.94043 4.89509 8.74146 4.56463 8.4043 4.3877H8.40332L2.76758 1.41113C2.60129 1.32386 2.44117 1.29199 2.29492 1.29199Z"
						fill="#83808D"
						stroke="#83808D"
						stroke-width="0.37461"
					/>
					<rect
						x="5.0584"
						y="5.85137"
						width="3.37149"
						height="1.12383"
						rx="0.561915"
						transform="rotate(-180 5.0584 5.85137)"
						fill="#83808D"
						stroke="#83808D"
						stroke-width="0.37461"
					/>
				</svg>
			</div>
			<button
				class="flex items-start gap-1 rounded-md bg-[#DCE4EE] px-3 py-1 text-sm font-medium text-[#5D646F]"
			>
				Event Page
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
		<h1 class="mb-10 text-3xl font-bold md:text-4xl">{eventData.title}</h1>
	</div>

	<!-- Clone Event Section -->
	<div class="mb-6 flex flex-col">
		<div class="mb-1 flex items-center justify-between gap-3">
			<h2 class="text-xl font-semibold">Clone Event</h2>
			<button
				class="flex items-start gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-sm font-medium text-[#5D646F] transition-colors hover:bg-gray-200"
			>
				Learn More
				<img src="/send-icon.png" alt="icon" class="h-3 w-3" />
			</button>
		</div>
		<p class="text-sm text-gray-600">
			Create a new event with the same information as this one. Everything except the guest list and
			event Marketing will be copied over.
		</p>

		<button
			on:click={cloneEvent}
			class="mt-3 flex w-fit items-center gap-2 rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800"
		>
			<svg
				width="17"
				height="17"
				viewBox="0 0 17 17"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect
					x="0.936525"
					y="0.936525"
					width="10.1145"
					height="10.1145"
					rx="1.31113"
					stroke="white"
					stroke-width="1.87305"
				/>
				<rect
					x="5.43189"
					y="5.43652"
					width="10.1145"
					height="10.1145"
					rx="1.31113"
					fill="#333537"
					stroke="white"
					stroke-width="1.87305"
				/>
			</svg>

			Clone Event
		</button>
	</div>

	<!-- Event Page Section -->
	<div class="mt-8 mb-6 border-t pt-8">
		<h2 class="mb-1 text-xl font-semibold">Event Page</h2>
		<p class="text-sm text-gray-600">
			When you choose a new URL, the current one will no longer work. Do not change your URL if you
			have already shared the event.
		</p>

		<div class="mt-3 mb-4 rounded-lg bg-[#DADCDD] px-3 py-2">
			<div class="mb-2 flex flex-col justify-between gap-2 md:mb-0 md:flex-row md:items-center">
				<div class="text-sm text-[#7A7C7E]">
					Upgrade to Rondwell Plus to set a custom URL for this event.
				</div>
				<button
					class="flex w-fit items-start gap-1 rounded-md bg-[#E3E4E5] px-3 py-2 text-sm font-medium text-[#7A7C7E] transition-colors hover:bg-gray-200"
				>
					Learn More
					<img src="/send-icon.png" alt="icon" class="h-3 w-3" />
				</button>
			</div>
		</div>

		<div class="max-w-60">
			<label for="url" class="mb-1 block text-sm font-medium text-gray-700">Public URL</label>
			<div class="flex items-center">
				<span class="rounded-l-md bg-[#EBECED] px-3 py-2.5 text-sm">ron.d/</span>
				<input
					type="text"
					value={eventData.publicUrl.split('/')[1]}
					on:input={(e: Event) => {
						const target = e.target as HTMLInputElement | null;
						if (target) eventData.publicUrl = `ron.d/${target.value}`;
					}}
					class="flex-1 rounded-r-md border border-gray-300 bg-[#F4F5F6] px-3 py-2 text-sm focus:ring-0 focus:outline-none"
				/>
				<button
					on:click={updatePublicUrl}
					class="ml-1 md:ml-2 rounded-md bg-[#939596] px-3 py-2 text-sm font-medium text-white transition-colors"
				>
					Update
				</button>
			</div>
		</div>
	</div>

	<!-- Embed Event Section -->
	<div class="mt-8 mb-6 border-t pt-8">
		<h2 class="mb-1 text-xl font-semibold">Embed Event</h2>
		<p class="text-sm text-gray-600">
			Have your own site? Embed the event to let visitors know about it.
		</p>

		<div class="my-4 flex flex-col items-center gap-4 md:flex-row">
			{#each embedAs as embed}
				<button
					class="flex w-full items-center justify-between gap-2 rounded-[12.75px] bg-[#FDFDFD] p-2 text-sm font-medium shadow-sm sm:min-w-90 md:w-fit"
					on:click={() => (selectedEmbed = embed.name)}
				>
					<div class="flex items-center gap-2">
						<div class="flex h-[44px] w-[44px] items-center justify-center rounded-sm bg-[#FBDEEC]">
							<p>{@html embed.svg}</p>
						</div>
						{embed.name}
					</div>
					{#if selectedEmbed === embed.name}
						<div class="flex h-6 w-6 items-center justify-center rounded-full bg-[#F31A7C]">
							<Icon icon="mdi:tick" class="text-xl text-white" />
						</div>
					{/if}
				</button>
			{/each}
		</div>

		<div class="my-4">
			<p class="mb-2 text-lg text-gray-600">Paste the following HTML code snippet to your page.</p>
			<div class="relative">
				<div class="overflow-x-auto rounded-lg bg-white p-5 text-sm">
					<pre class="max-w-90 p-3">
		                <code>{escapeHtml(eventData.embedCode)}</code>
	                </pre>
				</div>
				<button
					on:click={() => copyToClipboard(eventData.embedCode)}
					class="absolute top-4 right-4 flex items-center gap-1 rounded-md bg-[#F6F6F6] p-2 text-xs font-medium text-[#616265]"
				>
					<img src="/copy.svg" alt="" />
					Copy
				</button>
			</div>
		</div>

		<div class="mb-4">
			<p class="my-2 text-sm text-gray-600">
				This gives you the following button. Click to see it in action!
			</p>
			<div class="relative flex justify-center">
				<img src="/embed-bg.png" alt="" class="w-full h-full min-h-40" />
				<button
					class="absolute top-15 rounded-xl bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800"
				>
					Register for Event
				</button>
			</div>
		</div>

		<div class="mb-4">
			<p class="mb-2 text-sm text-gray-600">
				If you want to use your own styling for the button, simply remove the luma-checkout--button
				class from the snippet above.
			</p>
			<p class="text-sm text-gray-600">
				For advanced usage, check out our <span
					class="cursor-pointer text-pink-600 hover:text-pink-700"
					>example code and documentation</span
				>.
			</p>
		</div>
	</div>

	<!-- Transfer Event Section -->
	<div class="mt-8 mb-6 border-t pt-8">
		<h2 class="mb-2 text-xl font-semibold">Transfer Event</h2>
		<p class="mb-4 text-sm text-gray-600 lg:max-w-[70%]">
			This event is managed by <span class="text-pink-600">John Collection</span>, with the admins
			of the calendar having manage access to the event. You can move it to a different calendar if
			you want.
		</p>
		<button
			on:click={transferEvent}
			class="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-900 px-4 py-2 font-medium text-white "
		>
			<svg
				width="21"
				height="20"
				viewBox="0 0 21 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M5.9646 1.625V4.05996"
					stroke="white"
					stroke-width="1.49844"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M14.2644 1.625V4.05996"
					stroke="white"
					stroke-width="1.49844"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M2.94995 8.125H17.2788"
					stroke="white"
					stroke-width="1.49844"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M10.1144 17.8594H6.74292C3.79287 17.8594 2.52856 16.236 2.52856 13.8011V6.90202C2.52856 4.46706 3.79287 2.84375 6.74292 2.84375H13.4859C16.436 2.84375 17.7003 4.46706 17.7003 6.90202V9.74281"
					stroke="white"
					stroke-width="1.49844"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path d="M11.2461 12.7375L14.6176 10.1421V15.3329L11.2461 12.7375Z" fill="white" />
				<rect
					x="14.0557"
					y="13.4844"
					width="1.49844"
					height="3.9334"
					transform="rotate(-90 14.0557 13.4844)"
					fill="white"
				/>
				<path d="M18.7383 16.4813L15.3668 19.0766V13.8859L18.7383 16.4813Z" fill="white" />
				<rect
					x="15.9287"
					y="15.7344"
					width="1.49844"
					height="3.9334"
					transform="rotate(90 15.9287 15.7344)"
					fill="white"
				/>
			</svg>

			Move to Another Collection
		</button>
	</div>

	<!-- Cancel Event Section -->
	<div class="mt-8 border-t pt-8">
		<h2 class="mb-2 text-xl font-semibold">Cancel Event</h2>
		<p class="mb-4 text-sm text-gray-600 lg:max-w-[70%]">
			Cancel and permanently delete this event. This operation cannot be undone. If there are any
			registered guests, we will notify them that the event has been canceled.
		</p>
		<button
			on:click={cancelEvent}
			class="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors"
		>
			<svg
				width="17"
				height="17"
				viewBox="0 0 17 17"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M10.4877 10.4875L5.99243 5.99219"
					stroke="white"
					stroke-width="1.49844"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M10.4877 5.99219L5.99243 10.4875"
					stroke="white"
					stroke-width="1.49844"
					stroke-miterlimit="10"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<circle cx="8.24142" cy="8.24142" r="7.4922" stroke="white" stroke-width="1.49844" />
			</svg>

			Cancel Event
		</button>
	</div>
</div>
