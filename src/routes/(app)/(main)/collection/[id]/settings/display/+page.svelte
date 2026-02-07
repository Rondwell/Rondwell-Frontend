 <script lang="ts">
    import Icon from '@iconify/svelte';
	import { colors } from '$lib/utils/colors';
type SocialLinkKey = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'linkedin' | 'website';
    const socialLinks: { key: SocialLinkKey; icon: string; label: string; prefix: string }[] = [
		{ key: 'instagram', icon: 'mdi:instagram', label: 'instagram.com/', prefix: '' },
		{ key: 'x', icon: 'mdi:twitter', label: 'x.com/', prefix: '' },
		{ key: 'youtube', icon: 'mdi:youtube', label: 'youtube.com/@', prefix: '' },
		{ key: 'tiktok', icon: 'simple-icons:tiktok', label: 'tiktok.com/@', prefix: '' },
		{ key: 'linkedin', icon: 'mdi:linkedin', label: 'linkedin.com/in/', prefix: '' },
		{ key: 'website', icon: 'mdi:web', label: '', prefix: 'Your website' }
	];

    interface Profile {
		name: string;
		username: string;
		bio: string;
		profilePicture: string;
		socialLinks: Record<SocialLinkKey, string>;
	}
    function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

    

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement | null;
		if (!input?.files?.[0]) return;
		const file = input.files[0];
		const reader = new FileReader();
		reader.onload = (e: ProgressEvent<FileReader>) => {
			const result = e.target?.result;
			if (typeof result === 'string') eventData.socialPreviewImage = result;
		};
		reader.readAsDataURL(file);
	}

    function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e: ProgressEvent<FileReader>) => {
			const result = e.target?.result;
			if (typeof result === 'string') eventData.socialPreviewImage = result;
		};
		reader.readAsDataURL(file);
	}

	// Mock data for the settings page
	let profile: Profile = {
		name: 'JOHN HOUSEMAN',
		username: '',
		bio: '',
		socialLinks: {
			instagram: '',
			x: '',
			youtube: '',
			tiktok: '',
			linkedin: '',
			website: ''
		},
		profilePicture: '/face-1.svg'
	};
	type EventData = {
		name: string;
		description: string;
		tintColor: string;
		publicUrl: string;
		location: {
			type: 'City' | 'Global';
			city: string;
		};
        socialPreviewImage: string | null;
	};

	let eventData: EventData = {
		name: 'John Doe',
		description: '',
		tintColor: '#6B7280',
		publicUrl: '',
		location: { type: 'City', city: 'Lagos' },
        socialPreviewImage: null
	};

	function selectTintColor(color: string) {
		eventData.tintColor = color;
	}

	let search = '';
	let activeTab = 'City';

	type Location = { name: string; region: string };

	const cityLocations: Location[] = [
		{ name: 'Lagos', region: 'Portugal' },
		{ name: 'Laguna Beach', region: 'CA, USA' }
	];

	const globalLocations: Location[] = [
		{ name: 'Laguna Beach', region: '' },
		{ name: 'Berlin', region: 'Germany' }
	];

	let selectedLocations: Location[] = [];
	let filteredLocations: Location[] = [];

	$: selectedLocations = activeTab === 'City' ? cityLocations : globalLocations;

	$: filteredLocations = search
		? selectedLocations.filter((loc) => loc.name.toLowerCase().startsWith(search.toLowerCase()))
		: selectedLocations;

	function selectLocation(loc: Location) {
		// dispatch('select', loc);
		// dispatch('close');
	}

	function handlePublicUrlInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		eventData.publicUrl = `ron.d/${value}`;
	}

	async function saveChanges() {
		try {
			// Add your API call here to save the collection settings
			console.log('Saving changes:', { eventData, profile });
			// Example: await fetch('/api/collection/settings', { method: 'POST', body: JSON.stringify({ eventData, profile }) })
		} catch (error) {
			console.error('Error saving changes:', error);
		}
	}
</script>

<div class="w-full space-y-8">
	<!-- HEADER CARD -->
	<div class="rounded-lg">
		

		<div class="relative mb-6 rounded-t-lg bg-[#FDFDFD]">
			<div class="h-[191px] rounded-t-lg bg-[#D8D8DD]"></div>
			<button
				class="absolute top-2 right-3 rounded-md bg-[#E4E4E5] px-3 py-2 text-sm font-medium text-[#5D5E61]"
			>
				Change Cover
			</button>
			<img src="/edit-cover-photo.svg" alt="" class="absolute bottom-28 left-5 w-14" />
			<div class="mt-8 ml-4 w-full">
				<input
					type="text"
					placeholder="Collection name"
					bind:value={eventData.name}
					class="h-12 w-full px-4 py-2 text-3xl font-semibold focus:ring-0 focus:outline-none"
				/>
				<div class="mt-2 border-t">
					<input
						type="text"
						placeholder="Add a short description"
						bind:value={eventData.description}
						class="h-12 w-full px-4 py-2 focus:ring-0 focus:outline-none"
					/>
				</div>
			</div>
		</div>

		<!-- Customization -->
	<div class="mb-6 rounded-lg bg-[#FDFDFD] p-4">
		<h2 class="mb-3 text-2xl font-semibold">Customization</h2>

		<!-- Tint Color -->
		<div class="mb-4">
			<label for="color" class="mb-2 block text-sm font-medium text-gray-700">Tint Color</label>
			<div class="flex flex-wrap items-center justify-start gap-3">
				{#each colors as color}
					<button
						type="button"
						class="h-8 w-8 rounded-full border-2"
						style="background-color: {color.bg};"
						class:border-black={eventData.tintColor === color.bg}
						on:click={() => selectTintColor(color.bg)}
						aria-label={`Select color ${color.bg}`}
					></button>
				{/each}
			</div>
		</div>

		<!-- Public URL -->
		<div class="mb-4">
			<label for="" class="mb-2 block text-sm font-medium text-gray-700">Public URL</label>
			<div class="flex max-w-xl items-center">
				<span class="w-20 rounded-l-md bg-[#F4F4F4] p-3 text-sm">ron.d/</span>
				<input
					type="text"
					placeholder="some calendar"
					bind:value={eventData.publicUrl}
					on:input={handlePublicUrlInput}
					class="flex-1 rounded-r-md border border-gray-300 bg-[#FFFFFF] p-3 text-sm focus:ring-0 focus:outline-none"
				/>
			</div>
		</div>

		<!-- Location -->
		<div class="mb-4">
			<label for="location" class="mb-2 block text-sm font-medium text-gray-700">Location</label>

			<div class="relative w-full rounded-lg bg-white shadow-lg">
				<!-- Tabs -->
				<div
					class="mb-3 flex h-[175px] flex-col justify-between gap-2 p-2"
					style="background: url('/map.png'); background-size: cover;"
				>
					<div class="h-[40px] w-fit rounded bg-[#DCDCDC] p-1 text-[#A1A2A2]">
						<button
							class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${
								activeTab === 'City' ? 'bg-white text-black' : ''
							}`}
							on:click={() => (activeTab = 'City')}
						>
							City
						</button>
						<button
							class={`h-full cursor-pointer rounded px-3 py-1 text-sm ${
								activeTab === 'Global' ? 'bg-white text-black' : ''
							}`}
							on:click={() => (activeTab = 'Global')}
						>
							Global
						</button>
					</div>

					<!-- Input -->
					<div class="relative z-10">
						<input
							type="text"
							placeholder="Search location"
							bind:value={search}
							class="w-full rounded-md border border-black px-10 py-2 text-sm focus:outline-none"
						/>
						<span class="absolute top-2.5 left-3 text-gray-500">
							<svg
								width="19"
								height="19"
								viewBox="0 0 19 19"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M7.4375 8.75391H11.5626"
									stroke="#141415"
									stroke-width="1.50004"
									stroke-linecap="round"
								/>
								<path
									d="M9.5 10.8165V6.69141"
									stroke="#141415"
									stroke-width="1.50004"
									stroke-linecap="round"
								/>
								<path
									d="M4.98575 3.72997C8.26334 0.647395 14.616 1.70492 15.786 6.88755C16.6485 10.6976 14.2785 13.9227 12.2009 15.9178C10.6934 17.3728 8.30834 17.3728 6.7933 15.9178C4.72325 13.9152 2.34569 10.6901 3.21571 6.88005"
									stroke="#141415"
									stroke-width="1.50004"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</span>

						{#if search}
							<button
								aria-label="button"
								class="absolute top-1.5 right-3 text-gray-400"
								on:click={() => (search = '')}
							>
								<svg
									width="26"
									height="27"
									viewBox="0 0 26 27"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<rect
										x="0.0078125"
										y="13.4473"
										width="17.9532"
										height="17.9532"
										rx="8.97661"
										transform="rotate(-45 0.0078125 13.4473)"
										fill="#C7C7C8"
									/>
									<g opacity="0.4">
										<path
											d="M10.0312 16.1191L15.3764 10.7739"
											stroke="white"
											stroke-width="2.25006"
											stroke-linecap="round"
										/>
										<path
											d="M15.3764 16.1206L10.0312 10.7754"
											stroke="white"
											stroke-width="2.25006"
											stroke-linecap="round"
										/>
									</g>
									<g opacity="0.4">
										<path
											d="M10.0312 16.1191L15.3764 10.7739"
											stroke="white"
											stroke-width="2.25006"
											stroke-linecap="round"
										/>
										<path
											d="M15.3764 16.1206L10.0312 10.7754"
											stroke="white"
											stroke-width="2.25006"
											stroke-linecap="round"
										/>
									</g>
									<g opacity="0.4">
										<path
											d="M10.0312 10.7754L15.3764 16.1206"
											stroke="white"
											stroke-width="2.25006"
											stroke-linecap="round"
										/>
										<path
											d="M10.0298 16.1206L15.375 10.7754"
											stroke="white"
											stroke-width="2.25006"
											stroke-linecap="round"
										/>
									</g>
									<g opacity="0.4">
										<path
											d="M10.0312 10.7754L15.3764 16.1206"
											stroke="white"
											stroke-width="2.25006"
											stroke-linecap="round"
										/>
										<path
											d="M10.0298 16.1206L15.375 10.7754"
											stroke="white"
											stroke-width="2.25006"
											stroke-linecap="round"
										/>
									</g>
								</svg>
							</button>
						{/if}
					</div>
				</div>

				<!-- Suggestions -->
				<div class="relative z-10 hidden max-h-40 overflow-y-auto rounded-md bg-white">
					{#each filteredLocations as loc (loc.name)}
						<button
							class="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-gray-100"
							on:click={() => selectLocation(loc)}
						>
							<span class="text-sm font-medium text-gray-800">{loc.name}</span>
							{#if loc.region}
								<span class="text-xs text-gray-500">{loc.region}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

        
        <div class="mt-6 p-4 flex flex-col bg-[#FDFDFD]">
		<h3 class="mb-3 text-sm font-medium text-[#000]"> Links</h3>
		<div class=" w-fit flex flex-col gap-6">
			{#each socialLinks as { key, icon, label, prefix }}
				<div class="flex items-center gap-2">
					<!-- Icon -->
					<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
						<Icon {icon} class="h-4 w-4" />
					</div>

					<div class="flex h-[42px] w-full items-center shadow-sm">
						<!-- Label (optional) -->
						{#if label}
							<div
								class="pointer-events-none flex h-full items-center rounded-tl-[7.5px] rounded-bl-[7.5px] bg-[#EBECED] p-3 text-xs text-[#84857A]"
							>
								{label}
							</div>
						{/if}

						<!-- Input -->
						<input
							type="text"
							bind:value={profile.socialLinks[key]}
							placeholder={prefix || 'username'}
							class="h-full w-full {key === 'website'
								? 'rounded-[7.5px]'
								: 'rounded-tr-[7.5px] rounded-br-[7.5px]'} bg-[#FFFFFF] px-3 py-2 focus:ring-0 focus:outline-none"
						/>
					</div>
				</div>
			{/each}
		</div>
	    </div>
<!-- Social Preview -->
	<div class="rounded-lg border border-gray-200 bg-white p-4">
		<h2 class="mb-3 font-semibold">Sharing</h2>
		<p class="mb-4 text-sm text-gray-600">Social Preview Image</p>

		<button
			on:dragover={handleDragOver}
			on:drop={handleDrop}
			on:click={() => document.getElementById('social-preview-image')?.click()}
			class="h-[332.25px] w-full cursor-pointer items-center justify-center rounded-lg bg-[#F4F4F4] p-8 text-center"
		>
			{#if eventData.socialPreviewImage}
				<img
					src={eventData.socialPreviewImage}
					alt="Social Preview"
					class="mx-auto max-w-full rounded"
				/>
			{:else}
				<div class="flex flex-col items-center justify-center">
					<img src="/gallery-edit.svg" alt="" />
					<p class="text-sm text-gray-500">Drag & Drop or Click to Upload</p>
				</div>
			{/if}
			<input
				id="social-preview-image"
				type="file"
				accept="image/*"
				on:change={handleFileUpload}
				class="hidden"
			/>
		</button>

		<p class="mt-2 text-sm text-[#B3B4B4]">
			You can use images of any size. For best result, choose asn aspect ration close to 1.9:1.
		</p>
	</div>

		<!-- Save -->
	<div class="mt-6">
		<button
			on:click={saveChanges}
			class="flex items-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
		>
			<svg
				width="19"
				height="18"
				viewBox="0 0 19 18"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M5.30273 2.8125H6.63184V4.125C6.63184 4.50932 6.86845 4.8386 7.2002 4.9834V6.51367C6.86849 6.65838 6.63201 6.98787 6.63184 7.37207V10.6279C6.63201 11.012 6.86868 11.3406 7.2002 11.4854V13.0156C6.86826 13.1603 6.63184 13.4905 6.63184 13.875V15.1875H5.30273C3.64484 15.1875 2.693 14.9316 2.13574 14.3799C1.57986 13.8292 1.32227 12.8899 1.32227 11.25V10.875C1.32227 10.7781 1.40865 10.6875 1.51562 10.6875C2.44628 10.6874 3.21582 9.93052 3.21582 9C3.21582 8.06948 2.44628 7.31264 1.51562 7.3125C1.40865 7.3125 1.32227 7.22189 1.32227 7.125V6.75C1.32227 5.11009 1.57986 4.17077 2.13574 3.62012C2.693 3.06836 3.64484 2.8125 5.30273 2.8125Z"
					fill="white"
					stroke="white"
					stroke-width="0.75"
				/>
				<path
					d="M5.25977 3.375H6.05371V4.54297C6.05373 4.7594 6.12159 4.96875 6.24512 5.13184C6.2977 5.20121 6.36486 5.26483 6.44336 5.31641V6.7373C6.36468 6.78891 6.2978 6.85336 6.24512 6.92285C6.12162 7.08589 6.05377 7.29535 6.05371 7.51172V10.4883C6.05377 10.7047 6.12162 10.9141 6.24512 11.0771C6.2977 11.1465 6.36487 11.2102 6.44336 11.2617V12.6826C6.36467 12.7342 6.2978 12.7987 6.24512 12.8682C6.12159 13.0312 6.05373 13.2406 6.05371 13.457V14.625H5.25977C4.15078 14.625 3.55859 14.4003 3.20703 13.9365C2.82921 13.4377 2.64848 12.5685 2.64844 11.0576V10.7139C2.64853 10.6494 2.66955 10.6018 2.6875 10.5781C2.68894 10.5762 2.69025 10.5746 2.69141 10.5732C3.07256 10.5632 3.39106 10.3537 3.60352 10.0732C3.8215 9.78542 3.94727 9.40442 3.94727 9C3.94727 8.59558 3.8215 8.21458 3.60352 7.92676C3.39106 7.64628 3.07257 7.4358 2.69141 7.42578C2.69037 7.42454 2.68874 7.42352 2.6875 7.42188C2.66955 7.39818 2.64853 7.35059 2.64844 7.28613V6.94238C2.64848 5.43148 2.82921 4.56227 3.20703 4.06348C3.55859 3.59968 4.15078 3.37504 5.25977 3.375Z"
					fill="#858687"
					stroke="#858687"
					stroke-width="0.75"
				/>
				<path
					opacity="0.4"
					d="M12.8789 2.8125C14.5366 2.81254 15.4877 3.0684 16.0449 3.62012C16.601 4.17073 16.8594 5.10977 16.8594 6.75V7.5C16.8594 7.59687 16.773 7.68745 16.666 7.6875C15.7352 7.6875 14.9658 8.44439 14.9658 9.375C14.9658 10.3056 15.7352 11.0625 16.666 11.0625C16.773 11.0625 16.8594 11.1531 16.8594 11.25C16.8594 12.8902 16.601 13.8293 16.0449 14.3799C15.4877 14.9316 14.5366 15.1875 12.8789 15.1875H8.51953V13.875C8.51953 13.4905 8.28312 13.1603 7.95117 13.0156V11.4854C8.2827 11.3406 8.51936 11.012 8.51953 10.6279V7.37207C8.51936 6.98787 8.28289 6.65838 7.95117 6.51367V4.9834C8.28293 4.8386 8.51953 4.50933 8.51953 4.125V2.8125H12.8789Z"
					fill="white"
					stroke="white"
					stroke-width="0.75"
				/>
				<path
					d="M9.84375 5.98509L11.359 7.48535L14.619 4.5"
					stroke="white"
					stroke-width="1.125"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>

			Save Changes
		</button>
	</div>
	</div>
</div> -->
