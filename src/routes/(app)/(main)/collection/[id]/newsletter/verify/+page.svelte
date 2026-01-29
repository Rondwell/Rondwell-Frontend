<script>
	let estimatedAudience = 100;

	let eventsInfo = '';
	let guestsInfo = '';

	let confirmInactive = false;
	let confirmOptIn = false;
	const increment = () => {
		estimatedAudience += 1;
	};

	const decrement = () => {
		if (estimatedAudience > 1) {
			estimatedAudience -= 1;
		}
	};
</script>

<div class="px-4 py-2">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<h1 class="text-lg md:text-2xl">Verify Collection</h1>
		</div>
		<p class="mt-2 text-[#828587]">
			Every week, we feature some of our favorite <br class="block md:hidden" />
			events in cities like New York and London. You can <br class="block md:hidden" /> also
			<br class="hidden md:block" />check out some great Collections from the
			<br class="block md:hidden" />
			community.
		</p>
	</div>

	<!-- Collection Card -->
	<div class="mb-8 w-full rounded-lg border bg-[#FDFDFD] p-4 md:max-w-[630px]">
		<div class="mb-3 flex items-center gap-3">
			<img src="/tech-icon.svg" alt="icon" class="h-8 w-8" />
			<div class="flex flex-col">
				<p class="text-sm text-[#ABADAD]">For Collection</p>
				<p class="font-medium">John Collection</p>
			</div>
		</div>
		<div class="border-t pt-1 md:ml-10">
			<p class="mt-2 text-sm text-gray-500">
				To ensure timely verification, please <br class="block sm:hidden" />complete your calendar<br
					class="hidden sm:block"
				/>
				information with a <br class="block sm:hidden" /> profile picture and description.
			</p>

			<button class="mt-2 flex items-center justify-center gap-1 text-sm font-medium text-pink-600">
				<span>Complete Calendar Info</span>
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect
						x="12.3965"
						y="10.5022"
						width="1.50004"
						height="6.75017"
						transform="rotate(180 12.3965 10.5022)"
						fill="#F31A88"
					/>
					<rect
						x="4.8926"
						y="5.25221"
						width="1.50004"
						height="6.75017"
						transform="rotate(-90 4.8926 5.25221)"
						fill="#F31A88"
					/>
					<rect
						x="11.666"
						y="5.25611"
						width="10.6455"
						height="1.56983"
						transform="rotate(135 11.666 5.25611)"
						fill="#F31A88"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Audience size -->
	<div class="mb-8">
		<label class="mb-2 block text-lg font-medium">
			How many people would you like to invite or send newsletter to?
		</label>
		<p class="mb-2 text-sm text-[#8F8F91]">
			Please share an estimate of the number of <br class="block sm:hidden" /> messages you plan to
			send at <br class="hidden sm:block" /> once.
		</p>

		<div
			class="inline-flex h-13 w-full items-center overflow-hidden rounded-md border bg-[#fff] sm:max-w-50"
		>
			<!-- Buttons -->
			<div class="flex flex-col gap-2">
				<button type="button" class="px-3 pt-3 text-sm text-[#D9D9D9]" on:click={increment}>
					<svg
						width="12"
						height="6"
						viewBox="0 0 12 6"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M5.84587 0L11.6917 5.78586H5.43594e-05L5.84587 0Z" fill="#D9D9D9" />
					</svg>
				</button>
				<button type="button" class="px-3 pb-3 text-sm text-[#D9D9D9]" on:click={decrement}>
					<svg
						width="12"
						height="6"
						viewBox="0 0 12 6"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M5.84578 5.78589L-3.91006e-05 2.95639e-05L11.6916 2.95639e-05L5.84578 5.78589Z"
							fill="#D9D9D9"
						/>
					</svg>
				</button>
			</div>

			<!-- Input -->
			<input
				type="number"
				min="1"
				bind:value={estimatedAudience}
				class="w-full px-3 py-2 text-right text-lg text-[#C8C9C9] focus:outline-none sm:w-40"
			/>
		</div>
	</div>

	<!-- Events info -->
	<div class="mb-8">
		<label class="block text-lg font-medium">
			Please share some information about your events.
		</label>
		<p class="mb-2 text-sm text-gray-500">
			What kind of events are you hosting? How often? How do you plan to market them?
		</p>

		<textarea
			bind:value={eventsInfo}
			rows="4"
			class="w-full resize-none rounded-md border bg-[#fdfdfd] px-3 py-2 md:max-w-[630px]"
		/>
	</div>

	<!-- Guests info -->
	<div class="mb-8">
		<label class="mb-2 block text-lg font-medium">
			Please share some information about your guests.
		</label>
		<p class="mb-2 text-sm text-gray-500">
			How did you build your contact list? Did people opt in to receive emails?
		</p>

		<textarea
			bind:value={guestsInfo}
			rows="4"
			class="w-full resize-none rounded-md border bg-[#fdfdfd] px-3 py-2 md:w-[630px]"
		/>
	</div>

	<!-- Confirmations -->
	<div class="mb-6 space-y-4">
		<label class="flex items-start gap-2">
			<input
				type="checkbox"
				bind:checked={confirmInactive}
				class="h-5 w-5 rounded-sm checked:bg-black checked:text-[#fdfdfd]"
			/>
			<span class="text-sm">
				I confirm I will not import or contact people with inactive email addresses or who have
				unsubscribed.
			</span>
		</label>

		<label class="flex items-start gap-2">
			<input
				type="checkbox"
				bind:checked={confirmOptIn}
				class="h-5 w-5 rounded-sm checked:bg-black checked:text-[#fdfdfd]"
			/>
			<span class="text-sm">
				I confirm that I will only message people who have opted in and consented to receiving
				emails.
			</span>
		</label>
	</div>

	<!-- Submit -->
	<button class="rounded-md bg-gray-900 px-6 py-2 text-white disabled:opacity-40">
		Submit Request
	</button>
</div>

<style>
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
