<!-- src/routes/event/edit/+page.svelte -->
<script>
	// Mock data for editing event
	let eventData = {
		calendar: 'John Calendar',
		description: '',
		tintColor: '#6B7280', // Default gray
		publicUrl: 'ron.d/somecalendar',
		location: {
			type: 'City',
			city: 'Lagos'
		},
		links: {
			instagram: '',
			youtube: '',
			linkedin: '',
			x: '',
			website: ''
		},
		socialPreviewImage: null
	};

	// Available tint colors
	const tintColors = [
		{ value: '#6B7280', label: 'Gray' },
		{ value: '#EC4899', label: 'Pink' },
		{ value: '#8B5CF6', label: 'Purple' },
		{ value: '#10B981', label: 'Green' },
		{ value: '#F59E0B', label: 'Yellow' },
		{ value: '#F97316', label: 'Orange' },
		{ value: '#EF4444', label: 'Red' },
		{ value: '#3B82F6', label: 'Blue' }
	];

	// Function to handle color selection
	const selectTintColor = (color) => {
		eventData.tintColor = color;
	};

	// Function to handle location type change
	const setLocationType = (type) => {
		eventData.location.type = type;
	};

	// Function to handle form submission
	const saveChanges = () => {
		console.log('Saving changes:', eventData);
		// In a real app, this would send data to your backend
	};

	// Function to handle file upload for social preview image
	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				eventData.socialPreviewImage = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	};

	// Function to handle drag and drop for social preview image
	const handleDragOver = (event) => {
		event.preventDefault();
	};

	const handleDrop = (event) => {
		event.preventDefault();
		const file = event.dataTransfer.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				eventData.socialPreviewImage = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	};
</script>

<div class="max-w-4xl">
	<!-- Page Header -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 text-gray-500"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
					clip-rule="evenodd"
				/>
			</svg>
			<h1 class="text-xl font-bold">Edit Event</h1>
		</div>
		<button
			class="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
		>
			Change Cover
		</button>
	</div>

	<!-- Calendar Section -->
	<div class="mb-6">
		<div class="mb-4 flex items-center gap-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 text-gray-600"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path d="M9 2a1 1 0 000 2h2a1 1 0 000-2H9z" />
					<path
						fill-rule="evenodd"
						d="M4 5a2 2 0 012-2 3 3 0 013 3h2a3 3 0 013-3 2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div>
				<div class="font-semibold">{eventData.calendar}</div>
				<input
					type="text"
					placeholder="Add a short description."
					value={eventData.description}
					on:input={(e) => (eventData.description = e.target.value)}
					class="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>
		</div>
	</div>

	<!-- Customization Section -->
	<div class="mb-6 rounded-lg border border-gray-200 bg-white p-4">
		<h2 class="mb-3 font-semibold">Customization</h2>

		<!-- Tint Color -->
		<div class="mb-4">
			<label class="mb-2 block text-sm font-medium text-gray-700">Tint Color</label>
			<div class="flex items-center gap-2">
				{#each tintColors as color}
					<button
						on:click={() => selectTintColor(color.value)}
						class={`h-6 w-6 rounded-full ${eventData.tintColor === color.value ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
						style="background-color: {color.value}"
						title={color.label}
					></button>
				{/each}
			</div>
		</div>

		<!-- Public URL -->
		<div class="mb-4">
			<label class="mb-2 block text-sm font-medium text-gray-700">Public URL</label>
			<div class="flex items-center">
				<span class="rounded-l-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm">ron.d/</span
				>
				<input
					type="text"
					value={eventData.publicUrl.split('/')[1]}
					on:input={(e) => (eventData.publicUrl = `ron.d/${e.target.value}`)}
					class="flex-1 rounded-r-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>
		</div>

		<!-- Location -->
		<div class="mb-4">
			<label class="mb-2 block text-sm font-medium text-gray-700">Location</label>
			<div class="mb-2 flex items-center gap-2">
				<button
					on:click={() => setLocationType('City')}
					class={`rounded-md px-4 py-2 text-sm font-medium ${eventData.location.type === 'City' ? 'border border-blue-300 bg-blue-50 text-blue-700' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
				>
					City
				</button>
				<button
					on:click={() => setLocationType('Global')}
					class={`rounded-md px-4 py-2 text-sm font-medium ${eventData.location.type === 'Global' ? 'border border-blue-300 bg-blue-50 text-blue-700' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
				>
					Global
				</button>
			</div>

			{#if eventData.location.type === 'City'}
				<div class="relative">
					<input
						type="text"
						value={eventData.location.city}
						on:input={(e) => (eventData.location.city = e.target.value)}
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-gray-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 019.9-9.9l-4.95 4.95a7 7 0 01-9.9-9.9l4.95 4.95z"
								clip-rule="evenodd"
							/>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="absolute inset-y-0 right-0 flex items-center pr-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 cursor-pointer text-gray-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm3 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6zm6 3a1 1 0 11-2 0 1 1 0 012 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				</div>
			{:else}
				<div class="rounded-md bg-gray-100 p-3">
					<div class="text-sm text-gray-500">Global events are visible worldwide.</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Links Section -->
	<div class="mb-6 rounded-lg border border-gray-200 bg-white p-4">
		<h2 class="mb-3 font-semibold">Links</h2>

		<!-- Instagram -->
		<div class="mb-2 flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-gray-600"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 7.75C5.76 7.75 5 8.51 5 9.5c0 .99.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75 0-.99-.76-1.75-1.75-1.75H6.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H10.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H14.75z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<span class="text-xs text-gray-500">instagram.com/</span>
			<input
				type="text"
				value={eventData.links.instagram}
				on:input={(e) => (eventData.links.instagram = e.target.value)}
				placeholder="username"
				class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<!-- YouTube -->
		<div class="mb-2 flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-gray-600"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 7.75C5.76 7.75 5 8.51 5 9.5c0 .99.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75 0-.99-.76-1.75-1.75-1.75H6.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H10.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H14.75z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<span class="text-xs text-gray-500">youtube.com/@</span>
			<input
				type="text"
				value={eventData.links.youtube}
				on:input={(e) => (eventData.links.youtube = e.target.value)}
				placeholder="username"
				class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<!-- LinkedIn -->
		<div class="mb-2 flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-gray-600"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 7.75C5.76 7.75 5 8.51 5 9.5c0 .99.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75 0-.99-.76-1.75-1.75-1.75H6.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H10.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H14.75z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<span class="text-xs text-gray-500">linkedin.com</span>
			<input
				type="text"
				value={eventData.links.linkedin}
				on:input={(e) => (eventData.links.linkedin = e.target.value)}
				placeholder="username"
				class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<!-- X (Twitter) -->
		<div class="mb-2 flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-gray-600"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 7.75C5.76 7.75 5 8.51 5 9.5c0 .99.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75 0-.99-.76-1.75-1.75-1.75H6.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H10.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H14.75z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<span class="text-xs text-gray-500">x.com/</span>
			<input
				type="text"
				value={eventData.links.x}
				on:input={(e) => (eventData.links.x = e.target.value)}
				placeholder="username"
				class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<!-- Website -->
		<div class="flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-gray-600"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 7.75C5.76 7.75 5 8.51 5 9.5c0 .99.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75 0-.99-.76-1.75-1.75-1.75H6.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H10.75zm4 0c-.99 0-1.75.76-1.75 1.75s.76 1.75 1.75 1.75h1.5c.99 0 1.75-.76 1.75-1.75s-.76-1.75-1.75-1.75H14.75z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<span class="text-xs text-gray-500">Your website</span>
			<input
				type="text"
				value={eventData.links.website}
				on:input={(e) => (eventData.links.website = e.target.value)}
				placeholder="Your website"
				class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>
	</div>

	<!-- Sharing Section -->
	<div class="rounded-lg border border-gray-200 bg-white p-4">
		<h2 class="mb-3 font-semibold">Sharing</h2>
		<p class="mb-4 text-sm text-gray-600">Social Preview Image</p>

		<!-- Social Preview Image Upload -->
		<div
			on:dragover={handleDragOver}
			on:drop={handleDrop}
			on:click={() => document.getElementById('social-preview-image').click()}
			class="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-gray-400"
		>
			{#if eventData.socialPreviewImage}
				<img
					src={eventData.socialPreviewImage}
					alt="Social Preview"
					class="mx-auto h-auto max-w-full rounded"
				/>
			{:else}
				<div class="flex flex-col items-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-4 h-12 w-12 text-gray-400"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
							clip-rule="evenodd"
						/>
						<path d="M11 7a1 1 0 112 0v6a1 1 0 11-2 0V7z" />
					</svg>
					<p class="text-sm text-gray-500">Drag & Drop or Click Here</p>
				</div>
			{/if}
			<input
				id="social-preview-image"
				type="file"
				accept="image/*"
				on:change={handleFileUpload}
				class="hidden"
			/>
		</div>

		<p class="mt-4 text-xs text-gray-500">
			You can use images of any size. For best result, choose an aspect ration close to 1.9:1.
		</p>
	</div>

	<!-- Save Changes Button -->
	<div class="mt-6">
		<button
			on:click={saveChanges}
			class="flex items-center gap-2 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0z"
					clip-rule="evenodd"
				/>
			</svg>
			Save Changes
		</button>
	</div>
</div>
