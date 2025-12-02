<script>
	import Icon from '@iconify/svelte';

	export let open = false;
	export let type = 'create';

	let name = '';
	let showDescription = false;
	let description = '';
	let allowApproval = false;
	let allowSalesStart = false;
	let allowSalesEnd = false;
	let salesStartDate = 'Tue, Oct 8';
	let salesStartTime = '02:00 PM';
	let salesEndDate = 'Tue, Oct 8';
	let salesEndTime = '02:00 PM';
	let totalTickets = '';
	let ticketPrice = '';
	let restrict = true;

	function toggleAllowApproval() {
		allowApproval = !allowApproval;
	}

	function toggleAllowSalesStart() {
		allowSalesStart = !allowSalesStart;
	}

	function toggleAllowSalesEnd() {
		allowSalesEnd = !allowSalesEnd;
	}

	function updateTicket() {
		console.log('Updated ticket type:', {
			name,
			description,
			allowApproval,
			allowSalesStart,
			salesStartDate,
			salesStartTime,
			salesEndDate,
			salesEndTime,
			totalTickets,
			ticketPrice
		});
		open = false;
	}
</script>

{#if open}
	<div
		id="ticket"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 backdrop-blur-sm"
	>
		<div class="inline-block text-left sm:right-0">
			<div
				class="custom-scrollbar relative {type === 'update'
					? 'h-102'
					: 'h-97'} w-[315px] max-w-lg overflow-y-auto rounded-lg bg-[#FFFCFC] p-4 shadow-lg"
			>
				<!-- Collapse Icon -->
				<div class="mb-4 flex items-start justify-between">
					<div
						class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]"
					>
						<div class="flex h-9 w-9 items-center justify-center">
							<svg
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									opacity="0.4"
									d="M34.2712 21.6511C34.9125 21.6511 35.4222 21.1249 35.4222 20.4672V19.0203C35.4222 12.5583 33.449 10.6016 27.0035 10.6016H16.6445V14.5972C17.2858 14.5972 17.812 15.1233 17.812 15.7646V20.1713C17.812 20.8125 17.2858 21.3387 16.6445 21.3387V25.4658C17.2858 25.4658 17.812 25.992 17.812 26.6333V31.0399C17.812 31.6812 17.2858 32.2074 16.6445 32.2074V36.1701H27.0035C33.449 36.1701 35.4222 34.1969 35.4222 27.7514C35.4222 27.1101 34.9125 26.5839 34.2712 26.5839C32.89 26.5839 31.7883 25.4823 31.7883 24.1175C31.7883 22.7528 32.89 21.6511 34.2712 21.6511Z"
									fill="#737577"
								/>
								<path
									opacity="0.4"
									d="M30.0147 11.049H13.418L18.7676 5.6625C23.1313 1.26875 25.3223 1.26875 29.686 5.6625L30.7815 6.76553C29.6313 7.92371 29.3574 9.63341 30.0147 11.049Z"
									stroke="#737577"
									stroke-width="2.36776"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M15.4785 15.7716V20.1783C15.4785 20.8195 16.0047 21.3457 16.6459 21.3457V25.4728C16.0047 25.4728 15.4785 25.999 15.4785 26.6403V31.0469C15.4785 31.6882 16.0047 32.2144 16.6459 32.2144V36.1771H12.4695C6.02391 36.1771 4.05078 34.2039 4.05078 27.7584V27.0513C4.05078 26.3936 4.56051 25.8839 5.20178 25.8839C6.58297 25.8839 7.68463 24.7658 7.68463 23.401C7.68463 22.0363 6.58297 20.9182 5.20178 20.9182C4.56051 20.9182 4.05078 20.4085 4.05078 19.7507V19.0437C4.05078 12.5817 6.02391 10.625 12.4695 10.625H16.6295V14.6206C16.0047 14.6206 15.4785 15.1468 15.4785 15.7716Z"
									fill="#737577"
								/>
							</svg>
						</div>
					</div>
					<button
						on:click={() => (open = false)}
						class="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EBECED] text-[#616265]"
					>
						<Icon icon="mdi:close" class="text-xl" />
					</button>
				</div>

				<h2 class="text-lg font-semibold text-black">
					{type !== 'update' ? 'New Ticket Type' : 'Edit Ticket Type'}
				</h2>

				{#if type === 'update'}
					<p class="text-xs text-[#8E8E90]">Existing ticket holders won’t be affected.</p>
				{/if}

				<!-- Header -->
				<div class="my-4">
					<label for="" class="mb-1 block text-sm font-medium text-gray-700">Ticket Name</label>
					<input
						type="text"
						bind:value={name}
						class="h-[40px] w-full rounded-md border border-gray-500 bg-[#FFFFFF] px-3 py-1 text-sm text-black focus:ring-0 focus:outline-none"
						placeholder="Friends & Family"
					/>
				</div>

				<!-- Add Description -->
				{#if !showDescription}
					<button
						class="flex items-center text-sm text-gray-500 hover:text-gray-700"
						on:click={() => (showDescription = true)}
					>
						<Icon icon="mdi:plus" class="mr-1 h-4 w-4" />
						Add Ticket Description
					</button>
				{:else}
					<div class="mt-3">
						<div class="flex items-center justify-between">
							<label for="" class="text-sm font-medium text-gray-700">Description</label>
							<button
								class="text-gray-400 hover:text-gray-600"
								on:click={() => (showDescription = false)}
							>
								<Icon icon="mdi:close" class="h-4 w-4" />
							</button>
						</div>
						<input
							type="text"
							bind:value={description}
							class="mt-1 h-[40px] w-full rounded-md border border-gray-300 bg-[#FFFFFF] px-3 py-1 text-sm text-black focus:ring-0 focus:outline-none"
							placeholder="Exclusively for friends & family."
						/>
					</div>
				{/if}

				<!-- Require Approval -->
				<div class="mt-4 flex items-center justify-between">
					<label for="" class="text-sm font-medium text-gray-700">Require Approval</label>
					<button
						aria-label="toggle approval"
						class="relative h-6 w-10 rounded-full transition-colors duration-300"
						class:bg-gray-300={!allowApproval}
						class:bg-gray-800={allowApproval}
						on:click={toggleAllowApproval}
					>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
							class:translate-x-4={allowApproval}
						></span>
					</button>
				</div>

				<!-- Conditional: if approval is on -->
				{#if !restrict}
					<!-- Sales Start -->
					<div class="mt-4 flex items-center justify-between">
						<label for="" class="text-sm font-medium text-gray-700">Sales Start</label>
						<button
							aria-label="toggle start"
							class="relative h-6 w-10 rounded-full transition-colors duration-300"
							class:bg-gray-300={!allowSalesStart}
							class:bg-gray-800={allowSalesStart}
							on:click={toggleAllowSalesStart}
						>
							<span
								class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
								class:translate-x-4={allowSalesStart}
							></span>
						</button>
					</div>

					{#if allowSalesStart}
						<div class="mt-2 flex items-center">
							<input
								type="text"
								bind:value={salesStartDate}
								class="h-[38px] w-full rounded-l-md border bg-white px-2 text-sm focus:outline-none"
							/>
							<input
								type="text"
								bind:value={salesStartTime}
								class="h-[38px] w-1/2 rounded-r-md border bg-white px-2 text-sm focus:outline-none"
							/>
						</div>
					{/if}

					<!-- Sales End -->
					<div class="mt-4 flex items-center justify-between">
						<label for="" class="text-sm font-medium text-gray-700">Sales End</label>
						<button
							aria-label="toggle end"
							class="relative h-6 w-10 rounded-full transition-colors duration-300"
							class:bg-gray-300={!allowSalesEnd}
							class:bg-gray-800={allowSalesEnd}
							on:click={toggleAllowSalesEnd}
						>
							<span
								class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
								class:translate-x-4={allowSalesEnd}
							></span>
						</button>
					</div>

					{#if allowSalesEnd}
						<div class="mt-2 flex items-center">
							<input
								type="text"
								bind:value={salesEndDate}
								class="h-[38px] w-full rounded-l-md border bg-white px-2 text-sm focus:outline-none"
							/>
							<input
								type="text"
								bind:value={salesEndTime}
								class="h-[38px] w-1/2 rounded-r-md border bg-white px-2 text-sm focus:outline-none"
							/>
						</div>
					{/if}

					<!-- Total Tickets -->
					<div class="mt-4 flex items-center justify-between">
						<label for="" class="text-sm font-medium text-gray-700">Total Tickets</label>
						<input
							type="number"
							min="0"
							bind:value={totalTickets}
							class="mt-1 h-[40px] w-20 rounded-md border bg-white px-3 text-sm focus:outline-none"
						/>
					</div>

					<!-- Ticket Price -->
					<div class="mt-4 flex items-center justify-between">
						<label for="" class="text-sm font-medium text-gray-700">Ticket Price</label>
						<div class="mt-1 flex gap-2">
							<select
								class="h-[40px] w-20 rounded-md border bg-white px-2 text-sm focus:outline-none"
							>
								<option>NGN</option>
								<option>USD</option>
								<option>EUR</option>
							</select>
							<input
								type="number"
								min="0"
								bind:value={ticketPrice}
								class="h-[40px] w-20 rounded-md border bg-white px-3 text-sm focus:outline-none"
							/>
						</div>
					</div>
				{/if}

				<button
					on:click={() => (restrict = !restrict)}
					class="mt-3 flex items-center gap-1 text-xs font-medium text-[#B2B3B3]"
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M7.125 0.666992C8.93819 0.666992 9.96636 1.24554 10.5371 2.05762C11.104 2.86422 11.208 3.88589 11.208 4.75V5.9375C11.208 6.22237 10.9724 6.45801 10.6875 6.45801C10.4027 6.4579 10.167 6.2223 10.167 5.9375V4.75C10.167 3.81825 10.0345 3.0622 9.59668 2.53809C9.16138 2.01715 8.40893 1.70801 7.125 1.70801C5.84105 1.70802 5.0886 2.0171 4.65332 2.53809C4.21549 3.0622 4.08302 3.81825 4.08301 4.75V5.9375C4.08301 6.22237 3.84737 6.45801 3.5625 6.45801C3.27764 6.458 3.04199 6.22236 3.04199 5.9375V4.75C3.042 3.88592 3.14606 2.8642 3.71289 2.05762C4.28363 1.24556 5.31188 0.667013 7.125 0.666992Z"
							fill="#A6A7A7"
							stroke="#A6A7A7"
							stroke-width="0.150004"
						/>
						<path
							d="M7.125 7.49512C8.22925 7.49512 9.12986 8.39576 9.12988 9.5C9.12988 10.6043 8.22926 11.5049 7.125 11.5049C6.02076 11.5049 5.12012 10.6042 5.12012 9.5C5.12014 8.39578 6.02078 7.49514 7.125 7.49512ZM7.125 8.53613C6.59645 8.53616 6.16116 8.97145 6.16113 9.5C6.16113 10.0286 6.59643 10.4638 7.125 10.4639C7.65359 10.4639 8.08887 10.0286 8.08887 9.5C8.08884 8.97143 7.65358 8.53613 7.125 8.53613Z"
							fill="#A6A7A7"
							stroke="#A6A7A7"
							stroke-width="0.150004"
						/>
						<path
							d="M10.0938 5.41699C11.4055 5.41699 12.2869 5.61514 12.8359 6.16406C13.385 6.71309 13.583 7.59446 13.583 8.90625V10.0938C13.583 11.4056 13.385 12.2869 12.8359 12.8359C12.2869 13.3849 11.4055 13.583 10.0938 13.583H4.15625C2.84446 13.583 1.96309 13.385 1.41406 12.8359C0.8651 12.2869 0.666992 11.4055 0.666992 10.0938V8.90625C0.667001 7.59446 0.865036 6.71309 1.41406 6.16406C1.96309 5.61504 2.84446 5.417 4.15625 5.41699H10.0938ZM4.15625 6.45801C3.62621 6.45801 3.20921 6.48343 2.88086 6.55273C2.55338 6.62186 2.31929 6.73314 2.15039 6.90234C1.98154 7.07153 1.87046 7.30572 1.80176 7.63281C1.73289 7.96092 1.70801 8.37765 1.70801 8.90625V10.0938C1.70801 10.6224 1.73289 11.0391 1.80176 11.3672C1.87045 11.6944 1.98152 11.9284 2.15039 12.0977C2.3193 12.2669 2.55332 12.3791 2.88086 12.4482C3.20919 12.5175 3.6263 12.542 4.15625 12.542H10.0938C10.6236 12.542 11.0408 12.5175 11.3691 12.4482C11.6966 12.3791 11.9307 12.2668 12.0996 12.0977C12.2685 11.9284 12.3795 11.6944 12.4482 11.3672C12.5171 11.0391 12.543 10.6224 12.543 10.0938V8.90625C12.543 8.37765 12.5171 7.96092 12.4482 7.63281C12.3795 7.30575 12.2684 7.07152 12.0996 6.90234C11.9307 6.73323 11.6965 6.62184 11.3691 6.55273C11.0408 6.48347 10.6237 6.45801 10.0938 6.45801H4.15625Z"
							fill="#A6A7A7"
							stroke="#A6A7A7"
							stroke-width="0.150004"
						/>
					</svg>

					{restrict ? 'Unrestrict' : 'Restrict'} Dates / Capacity / Price
				</button>

				<!-- Button -->
				<button
					class="mt-4 w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800"
					on:click={updateTicket}
				>
					Create Ticket Type
				</button>
			</div>
		</div>
	</div>
{/if}
