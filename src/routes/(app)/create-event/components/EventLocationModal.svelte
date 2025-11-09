<script lang="ts">
	export let open = false;
	export let link = '';

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement | null;
		if (!target) {
			link = '';
			return;
		}
		link = target.value.trim();
		if (link.includes('zoom.us') || link.includes('meet.google.com')) {
		}
	}

	function closeModal() {
		open = false;
	}

	function handleSelect(link: string) {
		console.log('Selected link:', link);
		closeModal();
	}

	let platform = '';

	// Detect platform from link
	$: {
		if (link.includes('zoom.us')) platform = 'Zoom';
		else if (link.includes('meet.google.com')) platform = 'Google Meet';
		else platform = '';
	}
</script>

{#if open}
	<div id="location" class="absolute top-full left-0 z-40 mt-2 w-full max-w-[662.8px]">
		<div class="relative w-full max-w-[662.8px] overflow-hidden rounded-sm bg-[#FFFCFC]">
			<input
				type="text"
				class="h-[50px] w-full bg-[#E2E4E5] px-2 text-sm text-gray-800 focus:ring-0 focus:outline-none"
				placeholder="Enter location or virtual link"
				on:input={handleInput}
			/>
			<div class="w-full p-1 pb-2">
				{#if link}
					<button
						class="custom-scrollbar h-[50px] w-full cursor-pointer overflow-x-auto rounded-[3.93px] bg-[#EEEFF0] p-2 text-left"
						on:click={() => handleSelect(link)}
					>
						{#if platform === 'Google Meet'}
							<div class="flex items-center gap-2">
								<img src="/google-meet-icon.svg" alt="meet" class="h-5 w-5" />
								<div>
									<p class="text-sm font-medium text-[#4A4A4A]">Google Meet</p>
									<p class="truncate text-xs text-[#A0A0A0]">{link}</p>
								</div>
							</div>
						{:else if platform === 'Zoom'}
							<div class="flex items-center gap-2">
								<img src="/zoom-icon.svg" alt="zoom" class="h-5 w-5" />
								<div>
									<p class="text-sm font-medium text-[#4A4A4A]">Zoom Meeting</p>
									<p class="truncate text-xs text-[#A0A0A0]">{link}</p>
								</div>
							</div>
						{:else}
							<p class="truncate text-[13px] text-[#5B5B5B]">{link}</p>
						{/if}
					</button>

					<div class="custom-scrollbar my-2 flex items-center gap-2 overflow-x-auto">
						<img src="/location.svg" alt="icon" class="h-4 w-4" />
						<span class="flex items-center gap-1 text-xs text-[#7A7A7A]">
							Use <p>“{link}”</p>
						</span>
					</div>
				{:else}
					<div class="space-y-3 p-2 text-sm text-black">
						<p class="text-[#A7A9AA]">Recent Locations</p>
						<p class="text-[#BFC0C1]">No recently used locations.</p>
						<p class="text-[#A7A9AA]">Virtual Options</p>
						<div class="flex cursor-pointer items-center gap-2 bg-[#EEEFF0] p-1">
							<img src="/zoom-icon.svg" alt="icon" class="h-4 w-4" />
							<p>Create Zoom meeting</p>
						</div>
						<div class="flex cursor-pointer items-center gap-2 p-1 hover:bg-[#EEEFF0]">
							<img src="/zoom-icon.svg" alt="icon" class="h-4 w-4" />
							<p>Select existing Zoom</p>
						</div>
						<span class="flex items-center gap-1">
							<img src="/information.png" alt="icon" class="h-4 w-4" />
							<p class="text-xs text-[#B9B7B7]">
								If you have a virtual link, you can enter or paste it above.
							</p>
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
