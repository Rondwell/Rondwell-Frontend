<script lang="ts">
	import AddressAutocomplete from '$lib/components/AddressAutocomplete.svelte';

	export let open = false;
	export let link = '';
	export let address = '';
	export let resolvedLat = 0;
	export let resolvedLng = 0;
	export let venueName = '';
	export let eventType: 'Virtual' | 'Physical' | 'Hybrid' = 'Virtual';

	function handleLinkInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement | null;
		link = target ? target.value.trim() : '';
	}

	function closeModal() {
		open = false;
	}

	function handleAddressSelect(detail: any) {
		address = detail.formatted_address;
		venueName = detail.venueName;
		resolvedLat = detail.lat;
		resolvedLng = detail.lng;
	}

	let platform = '';
	$: {
		if (link.includes('zoom.us')) platform = 'Zoom';
		else if (link.includes('meet.google.com')) platform = 'Google Meet';
		else platform = '';
	}

	$: showVirtual = eventType === 'Virtual' || eventType === 'Hybrid';
	$: showPhysical = eventType === 'Physical' || eventType === 'Hybrid';
</script>

{#if open}
	<div id="location" class="absolute top-full left-0 z-40 mt-2 w-full max-w-[662.8px]">
		<div class="relative w-full max-w-[662.8px] rounded-sm bg-[#FFFCFC] shadow-lg border border-gray-100 space-y-1">

			{#if showVirtual}
				<div class="p-1">
					<p class="px-2 pt-2 text-xs text-[#A7A9AA] font-medium">Virtual Link</p>
					<input
						type="text"
						class="h-[50px] w-full bg-[#E2E4E5] px-2 text-sm text-gray-800 focus:ring-0 focus:outline-none"
						placeholder="Paste Zoom, Google Meet or other link"
						value={link}
						on:input={handleLinkInput}
					/>
					{#if link}
						<button
							class="custom-scrollbar mt-1 h-[50px] w-full cursor-pointer overflow-x-auto rounded-[3.93px] bg-[#EEEFF0] p-2 text-left"
							on:click={closeModal}
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
					{:else}
						<div class="space-y-2 p-2 text-sm text-black">
							<p class="text-[#A7A9AA]">Virtual Options</p>
							<div class="flex cursor-pointer items-center gap-2 bg-[#EEEFF0] p-1 rounded">
								<img src="/zoom-icon.svg" alt="icon" class="h-4 w-4" />
								<p>Create Zoom meeting</p>
							</div>
							<span class="flex items-center gap-1">
								<img src="/information.png" alt="icon" class="h-4 w-4" />
								<p class="text-xs text-[#B9B7B7]">Paste a virtual link above.</p>
							</span>
						</div>
					{/if}
				</div>
			{/if}

			{#if showPhysical}
				<div class="p-1">
					<p class="px-2 pt-2 text-xs text-[#A7A9AA] font-medium">Physical Address</p>
					<div class="px-1">
						<AddressAutocomplete
							bind:value={address}
							placeholder="Search for a venue or address..."
							inputClass="!bg-[#E2E4E5] !rounded-none !border-none !h-[50px]"
							on:select={(e) => handleAddressSelect(e.detail)}
						/>
					</div>
					{#if address}
						<button
							class="mt-1 flex items-center gap-2 w-full rounded-[3.93px] bg-[#EEEFF0] p-2 text-left"
							on:click={closeModal}
						>
							<img src="/location.svg" alt="icon" class="h-4 w-4" />
							<div class="min-w-0 flex-1">
								{#if venueName && venueName !== address}
								<p class="truncate text-[13px] font-medium text-[#4A4A4A]">{venueName}</p>
								{/if}
								<p class="truncate text-[13px] text-[#5B5B5B]">{address}</p>
							</div>
						</button>
					{/if}
				</div>
			{/if}

		</div>
	</div>
{/if}
