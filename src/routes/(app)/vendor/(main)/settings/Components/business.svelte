<script lang="ts">
	import {
		type UserProfileData,
		updateSocialLinks,
		updateVendorDetails
	} from '$lib/services/profile.services';
	import { uploadVendorCover, uploadVendorLogo } from '$lib/services/vendor.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let profile: UserProfileData | null = null;

	let loading = true;
	let saving = false;
	let saveSuccess = false;
	let saveError = '';

	// ─── Form State ───────────────────────────────────────────────────────
	let businessName = '';
	let businessType = '';
	let businessDescription = '';
	let businessLocation = '';
	let contactEmail = '';
	let contactPhone = '';
	let contactWebsite = '';

	// Social links
	let socialInstagram = '';
	let socialX = '';
	let socialLinkedin = '';
	let socialWebsite = '';
	let socialYoutube = '';
	let socialTiktok = '';

	// Images
	let logoUrl = '';
	let coverImageUrl = '';
	let logoUploading = false;
	let coverUploading = false;
	let logoInput: HTMLInputElement;
	let coverInput: HTMLInputElement;

	const BUSINESS_TYPES = [
		'Catering', 'Photography', 'Videography', 'Event Venue', 'Sound & Lighting',
		'Entertainment', 'Cake & Confectionery', 'Floristry', 'Security',
		'Transportation', 'Printing & Branding', 'Decoration', 'MC / Host',
		'DJ Services', 'Makeup & Styling', 'Event Planning', 'AV Equipment',
		'Furniture Rental', 'Cleaning Services', 'Stage Design', 'Ushering',
		'Live Band / Music', 'Photo Booth', 'Cocktail / Bartending', 'Tent & Canopy',
		'Power / Generator', 'Invitation & Stationery', 'Gift & Souvenirs',
		'Drone / Aerial', 'Content Creation', 'Consulting', 'Technology', 'Other'
	];

	let showTypeDropdown = false;

	function populateForm(p: any) {
		if (!p) return;
		const vd = p.vendorDetails || {};
		businessName = vd.businessName || p.name || '';
		businessType = vd.businessType || '';
		businessDescription = vd.businessDescription || p.bio || '';
		businessLocation = vd.businessLocation || '';
		contactEmail = vd.contactInfo?.email || '';
		contactPhone = vd.contactInfo?.phone || '';
		contactWebsite = vd.contactInfo?.website || '';
		logoUrl = vd.logoUrl || p.profilePictureUrl || '';
		coverImageUrl = vd.coverImageUrl || '';

		const sl = p.socialLinks || {};
		socialInstagram = sl.instagram || '';
		socialX = sl.x || '';
		socialLinkedin = sl.linkedin || '';
		socialWebsite = sl.website || '';
		socialYoutube = sl.youtube || '';
		socialTiktok = sl.tiktok || '';
	}

	onMount(() => {
		if (profile) {
			populateForm(profile);
			loading = false;
		} else {
			// Wait a bit for profile to arrive via prop
			const timer = setTimeout(() => { loading = false; }, 2000);
			return () => clearTimeout(timer);
		}
	});

	$: if (profile && loading) {
		populateForm(profile);
		loading = false;
	}

	// ─── Logo Upload ──────────────────────────────────────────────────────
	async function handleLogoUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file || !profile) return;
		logoUploading = true;
		try {
			const result = await uploadVendorLogo(profile._id, file);
			logoUrl = result.logoUrl || result.profilePictureUrl || logoUrl;
		} catch (err: any) {
			saveError = err.message || 'Failed to upload logo';
		} finally {
			logoUploading = false;
		}
	}

	// ─── Cover Upload ─────────────────────────────────────────────────────
	async function handleCoverUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file || !profile) return;
		coverUploading = true;
		try {
			const result = await uploadVendorCover(profile._id, file);
			coverImageUrl = result.coverImageUrl || coverImageUrl;
		} catch (err: any) {
			saveError = err.message || 'Failed to upload cover image';
		} finally {
			coverUploading = false;
		}
	}

	// ─── Save ─────────────────────────────────────────────────────────────
	async function handleSave() {
		if (!profile) return;
		saving = true;
		saveError = '';
		saveSuccess = false;
		try {
			// Update vendor details
			await updateVendorDetails(profile._id, {
				businessName: businessName.trim(),
				businessType,
				businessDescription: businessDescription.trim(),
				businessLocation: businessLocation.trim(),
				contactInfo: {
					email: contactEmail.trim(),
					phone: contactPhone.trim(),
					website: contactWebsite.trim(),
				},
			});

			// Update social links
			await updateSocialLinks(profile._id, {
				instagram: socialInstagram.trim(),
				x: socialX.trim(),
				linkedin: socialLinkedin.trim(),
				website: socialWebsite.trim(),
				youtube: socialYoutube.trim(),
				tiktok: socialTiktok.trim(),
			});

			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 3000);
		} catch (err: any) {
			saveError = err.message || 'Failed to save changes';
		} finally {
			saving = false;
		}
	}
</script>

{#if loading}
	<!-- Skeleton Loader -->
	<div class="animate-pulse space-y-6">
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-6">
				<div class="h-5 w-40 rounded bg-gray-200"></div>
				<div class="mt-2 h-3 w-64 rounded bg-gray-100"></div>
			</div>
			<div class="grid gap-6 md:grid-cols-10">
				<div class="space-y-5 md:col-span-4">
					{#each [1, 2, 3] as _}
						<div>
							<div class="mb-2 h-3 w-24 rounded bg-gray-200"></div>
							<div class="h-10 w-full rounded-lg bg-gray-100"></div>
						</div>
					{/each}
				</div>
				<div class="md:col-span-6">
					<div class="h-56 w-full rounded-xl bg-gray-100"></div>
				</div>
			</div>
		</div>
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-4 h-5 w-32 rounded bg-gray-200"></div>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each [1, 2, 3, 4] as _}
					<div class="h-10 rounded-lg bg-gray-100"></div>
				{/each}
			</div>
		</div>
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-4 h-5 w-28 rounded bg-gray-200"></div>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each [1, 2, 3, 4] as _}
					<div class="h-10 rounded-lg bg-gray-100"></div>
				{/each}
			</div>
		</div>
	</div>

{:else}
	<div class="space-y-6">
		<!-- Success / Error Banners -->
		{#if saveSuccess}
			<div class="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
				<Icon icon="mdi:check-circle" class="h-4 w-4" /> Changes saved successfully.
			</div>
		{/if}
		{#if saveError}
			<div class="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
				<Icon icon="mdi:alert-circle" class="h-4 w-4" /> {saveError}
			</div>
		{/if}

		<!-- ═══ SECTION 1: Company Info + Cover/Logo ═══ -->
		<div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
			<div class="mb-6">
				<h2 class="text-lg font-bold text-gray-900">Business Details</h2>
				<p class="mt-1 text-sm text-gray-400">Manage your company information and branding.</p>
			</div>

			<div class="grid gap-6 lg:grid-cols-10">
				<!-- Left: Form Fields -->
				<div class="space-y-5 lg:col-span-4">
					<!-- Company Name -->
					<div>
						<label for="biz-name" class="mb-1.5 block text-sm font-medium text-gray-700">Company Name</label>
						<input id="biz-name" type="text" bind:value={businessName} placeholder="Your business name" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
					</div>

					<!-- Business Type -->
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-700">Business Category</label>
						<div class="relative">
							<button type="button" on:click={() => (showTypeDropdown = !showTypeDropdown)} class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300">
								<span class={businessType ? 'text-gray-900' : 'text-gray-400'}>{businessType || 'Select category'}</span>
								<Icon icon="mdi:chevron-down" class="h-4 w-4 text-gray-400 transition {showTypeDropdown ? 'rotate-180' : ''}" />
							</button>
							{#if showTypeDropdown}
								<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showTypeDropdown = false)} aria-label="Close"></button>
								<div class="absolute left-0 z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
									{#each BUSINESS_TYPES as type}
										<button type="button" on:click={() => { businessType = type; showTypeDropdown = false; }} class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 {businessType === type ? 'bg-gray-50 font-medium' : ''}">
											{type}
											{#if businessType === type}<Icon icon="mdi:check" class="ml-auto h-3.5 w-3.5 text-gray-500" />{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Description -->
					<div>
						<label for="biz-desc" class="mb-1.5 block text-sm font-medium text-gray-700">Business Description</label>
						<div class="relative">
							<textarea id="biz-desc" bind:value={businessDescription} maxlength="500" rows="4" placeholder="Describe what your business does..." class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-14 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
							<span class="pointer-events-none absolute right-3 bottom-2 text-[10px] text-gray-400">{businessDescription.length}/500</span>
						</div>
					</div>
				</div>

				<!-- Right: Cover Image + Logo -->
				<div class="lg:col-span-6">
					<div class="relative h-56 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-64 lg:h-72">
						{#if coverImageUrl}
							<img src={coverImageUrl} alt="Business cover" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
								<Icon icon="mdi:image-outline" class="h-16 w-16 text-gray-300" />
							</div>
						{/if}

						<!-- Logo overlay -->
						<div class="absolute left-3 top-3">
							<div class="relative h-14 w-14">
								{#if logoUrl}
									<img src={logoUrl} alt="Logo" class="h-full w-full rounded-full border-2 border-white object-cover shadow-sm" />
								{:else}
									<img src="/loader.svg" alt="Logo" class="h-full w-full rounded-full border-2 border-white object-cover shadow-sm" />
								{/if}
								<button on:click={() => logoInput?.click()} disabled={logoUploading} class="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shadow hover:bg-gray-800 disabled:opacity-50" aria-label="Upload logo">
									{#if logoUploading}
										<Icon icon="mdi:loading" class="h-3 w-3 animate-spin" />
									{:else}
										<Icon icon="mdi:camera" class="h-3 w-3" />
									{/if}
								</button>
								<input bind:this={logoInput} type="file" class="hidden" accept=".jpg,.jpeg,.png,.webp" on:change={handleLogoUpload} />
							</div>
						</div>

						<!-- Cover upload button -->
						<button on:click={() => coverInput?.click()} disabled={coverUploading} class="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80 disabled:opacity-50" aria-label="Upload cover">
							{#if coverUploading}
								<Icon icon="mdi:loading" class="h-3.5 w-3.5 animate-spin" />
								Uploading...
							{:else}
								<Icon icon="mdi:camera" class="h-3.5 w-3.5" />
								Change Cover
							{/if}
						</button>
						<input bind:this={coverInput} type="file" class="hidden" accept=".jpg,.jpeg,.png,.webp" on:change={handleCoverUpload} />
					</div>
					<p class="mt-2 text-[10px] text-gray-400">Recommended: 1200×400px. JPG, PNG or WebP.</p>
				</div>
			</div>
		</div>

		<!-- ═══ SECTION 2: Location & Contact ═══ -->
		<div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
			<div class="mb-5">
				<h3 class="text-base font-bold text-gray-900">Location & Contact</h3>
				<p class="mt-1 text-sm text-gray-400">How clients can reach and find your business.</p>
			</div>

			<!-- Business Location -->
			<div class="mb-5">
				<label for="biz-location" class="mb-1.5 block text-sm font-medium text-gray-700">Business Location / Service Area</label>
				<div class="relative">
					<Icon icon="mdi:map-marker-outline" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<input id="biz-location" type="text" bind:value={businessLocation} placeholder="e.g. Lagos, Nigeria or Virtual" class="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
			</div>

			<!-- Contact Grid -->
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="contact-email" class="mb-1.5 block text-sm font-medium text-gray-700">Contact Email</label>
					<div class="relative">
						<Icon icon="mdi:email-outline" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<input id="contact-email" type="email" bind:value={contactEmail} placeholder="hello@yourbusiness.com" class="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
					</div>
				</div>
				<div>
					<label for="contact-phone" class="mb-1.5 block text-sm font-medium text-gray-700">Contact Phone</label>
					<div class="relative">
						<Icon icon="mdi:phone-outline" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<input id="contact-phone" type="tel" bind:value={contactPhone} placeholder="+234 800 000 0000" class="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
					</div>
				</div>
				<div class="sm:col-span-2">
					<label for="contact-website" class="mb-1.5 block text-sm font-medium text-gray-700">Business Website</label>
					<div class="relative">
						<Icon icon="mdi:web" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<input id="contact-website" type="url" bind:value={contactWebsite} placeholder="https://yourbusiness.com" class="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
					</div>
				</div>
			</div>
		</div>

		<!-- ═══ SECTION 3: Social Links ═══ -->
		<div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
			<div class="mb-5">
				<h3 class="text-base font-bold text-gray-900">Social Links</h3>
				<p class="mt-1 text-sm text-gray-400">Connect your social media profiles so clients can find you.</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="social-ig" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="mdi:instagram" class="h-4 w-4 text-pink-500" /> Instagram
					</label>
					<input id="social-ig" type="url" bind:value={socialInstagram} placeholder="https://instagram.com/yourbusiness" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-x" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="ri:twitter-x-fill" class="h-3.5 w-3.5 text-gray-800" /> X (Twitter)
					</label>
					<input id="social-x" type="url" bind:value={socialX} placeholder="https://x.com/yourbusiness" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-li" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="mdi:linkedin" class="h-4 w-4 text-blue-600" /> LinkedIn
					</label>
					<input id="social-li" type="url" bind:value={socialLinkedin} placeholder="https://linkedin.com/company/yourbusiness" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-yt" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="mdi:youtube" class="h-4 w-4 text-red-600" /> YouTube
					</label>
					<input id="social-yt" type="url" bind:value={socialYoutube} placeholder="https://youtube.com/@yourbusiness" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-tt" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="ic:baseline-tiktok" class="h-4 w-4 text-gray-800" /> TikTok
					</label>
					<input id="social-tt" type="url" bind:value={socialTiktok} placeholder="https://tiktok.com/@yourbusiness" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-web" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="mdi:web" class="h-4 w-4 text-gray-500" /> Website
					</label>
					<input id="social-web" type="url" bind:value={socialWebsite} placeholder="https://yourbusiness.com" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
			</div>
		</div>

		<!-- ═══ SAVE BUTTON ═══ -->
		<div class="flex items-center justify-end gap-3 pb-4">
			<button
				on:click={handleSave}
				disabled={saving}
				class="flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if saving}
					<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Icon icon="mdi:content-save-outline" class="h-4 w-4" />
					Save Changes
				{/if}
			</button>
		</div>
	</div>
{/if}
