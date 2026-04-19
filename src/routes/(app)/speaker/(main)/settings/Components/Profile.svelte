<script lang="ts">
	import {
		type UserProfileData,
		updateSocialLinks
	} from '$lib/services/profile.services';
	import { updateSpeakerDetails, uploadSpeakerPhoto } from '$lib/services/speaker.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let profile: UserProfileData | null = null;

	let loading = true;
	let saving = false;
	let saveSuccess = false;
	let saveError = '';

	// ─── Form State ───────────────────────────────────────────────────────
	let fullName = '';
	let professionalTitle = '';
	let affiliation = '';
	let speakerBio = '';
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
	let profilePhotoUrl = '';
	let photoUploading = false;
	let photoInput: HTMLInputElement;

	// Expertise
	const EXPERTISE_AREAS = [
		'Technology & Software', 'Financial Services', 'Healthcare & Wellness',
		'Education & Training', 'Entertainment', 'Manufacturing',
		'Retail & E-commerce', 'Marketing & Advertising', 'Professional Services',
		'Transportation & Mobility', 'Food & Hospitality', 'Leadership & Management',
		'Entrepreneurship', 'Artificial Intelligence', 'Blockchain & Web3',
		'Sustainability & Climate', 'Diversity & Inclusion', 'Personal Development',
		'Science & Research', 'Government & Policy', 'Sports & Fitness',
		'Art & Design', 'Real Estate', 'Legal', 'Non-Profit & Social Impact', 'Other'
	];

	let selectedExpertise: string[] = [];
	let showExpertiseDropdown = false;

	function populateForm(p: any) {
		if (!p) return;
		const sd = p.speakerDetails || {};
		fullName = sd.fullName || p.name || '';
		professionalTitle = sd.title || '';
		affiliation = sd.affiliation || '';
		speakerBio = sd.bio || p.bio || '';
		profilePhotoUrl = sd.profilePhotoUrl || p.profilePictureUrl || '';

		// Parse expertise — could be string or array
		if (sd.expertise) {
			if (Array.isArray(sd.expertise)) {
				selectedExpertise = sd.expertise;
			} else if (typeof sd.expertise === 'string') {
				selectedExpertise = sd.expertise.split(',').map((s: string) => s.trim()).filter(Boolean);
			}
		}

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
			const timer = setTimeout(() => { loading = false; }, 2000);
			return () => clearTimeout(timer);
		}
	});

	$: if (profile && loading) {
		populateForm(profile);
		loading = false;
	}

	// ─── Photo Upload ─────────────────────────────────────────────────────
	async function handlePhotoUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file || !profile) return;
		photoUploading = true;
		try {
			const result = await uploadSpeakerPhoto(profile._id, file);
			profilePhotoUrl = result.profilePhotoUrl || result.profilePictureUrl || profilePhotoUrl;
		} catch (err: any) {
			saveError = err.message || 'Failed to upload photo';
		} finally {
			photoUploading = false;
		}
	}

	// ─── Expertise helpers ────────────────────────────────────────────────
	function addExpertise(area: string) {
		if (!selectedExpertise.includes(area)) {
			selectedExpertise = [...selectedExpertise, area];
		}
		showExpertiseDropdown = false;
	}

	function removeExpertise(area: string) {
		selectedExpertise = selectedExpertise.filter(e => e !== area);
	}

	// ─── Save ─────────────────────────────────────────────────────────────
	async function handleSave() {
		if (!profile) return;
		saving = true;
		saveError = '';
		saveSuccess = false;
		try {
			await updateSpeakerDetails(profile._id, {
				fullName: fullName.trim(),
				title: professionalTitle.trim(),
				affiliation: affiliation.trim(),
				bio: speakerBio.trim(),
				expertise: selectedExpertise,
			});

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
					{#each [1, 2, 3, 4] as _}
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

		<!-- ═══ SECTION 1: Speaker Info + Photo ═══ -->
		<div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
			<div class="mb-6">
				<h2 class="text-lg font-bold text-gray-900">Profile Details</h2>
				<p class="mt-1 text-sm text-gray-400">Manage your public speaker profile and branding.</p>
			</div>

			<div class="grid gap-6 lg:grid-cols-10">
				<!-- Left: Form Fields -->
				<div class="space-y-5 lg:col-span-4">
					<!-- Full Name -->
					<div>
						<label for="speaker-name" class="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
						<input id="speaker-name" type="text" bind:value={fullName} placeholder="Your full name" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
					</div>

					<!-- Professional Title -->
					<div>
						<label for="speaker-title" class="mb-1.5 block text-sm font-medium text-gray-700">Professional Title</label>
						<input id="speaker-title" type="text" bind:value={professionalTitle} placeholder="e.g. Keynote Speaker, CEO, Professor" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
					</div>

					<!-- Affiliation -->
					<div>
						<label for="speaker-affiliation" class="mb-1.5 block text-sm font-medium text-gray-700">Professional/Affiliation</label>
						<input id="speaker-affiliation" type="text" bind:value={affiliation} placeholder="e.g. Company, University, Organization" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
					</div>

					<!-- Speaker Bio -->
					<div>
						<label for="speaker-bio" class="mb-1.5 block text-sm font-medium text-gray-700">Speaker Bio</label>
						<div class="relative">
							<textarea id="speaker-bio" bind:value={speakerBio} maxlength="500" rows="4" placeholder="Share a little about your background, expertise, and speaking style..." class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-14 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
							<span class="pointer-events-none absolute right-3 bottom-2 text-[10px] text-gray-400">{speakerBio.length}/500</span>
						</div>
					</div>
				</div>

				<!-- Right: Profile Photo -->
				<div class="lg:col-span-6">
					<div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
						<!-- Profile Photo -->
						<div class="flex flex-col items-center">
							<div class="relative h-32 w-32">
								{#if profilePhotoUrl}
									<img src={profilePhotoUrl} alt="Speaker photo" class="h-full w-full rounded-full border-2 border-gray-200 object-cover shadow-sm" />
								{:else}
									<div class="flex h-full w-full items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100">
										<Icon icon="heroicons:user" class="h-12 w-12 text-gray-400" />
									</div>
								{/if}
								<button on:click={() => photoInput?.click()} disabled={photoUploading} class="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow hover:bg-gray-800 disabled:opacity-50" aria-label="Upload photo">
									{#if photoUploading}
										<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
									{:else}
										<Icon icon="mdi:camera" class="h-4 w-4" />
									{/if}
								</button>
								<input bind:this={photoInput} type="file" class="hidden" accept=".jpg,.jpeg,.png,.webp" on:change={handlePhotoUpload} />
							</div>
							<p class="mt-2 text-center text-[10px] text-gray-400">Max file size: 1MB<br />JPG, PNG or WebP</p>
						</div>

						<!-- Expertise Dropdown -->
						<div class="w-full flex-1">
							<label class="mb-1.5 block text-sm font-medium text-gray-700">Areas of Expertise / Speaking Topics</label>
							<div class="relative">
								<button
									type="button"
									on:click={() => (showExpertiseDropdown = !showExpertiseDropdown)}
									class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
								>
									<span class={selectedExpertise.length > 0 ? 'text-gray-900' : 'text-gray-400'}>
										{selectedExpertise.length > 0 ? `${selectedExpertise.length} selected` : 'Select areas of expertise'}
									</span>
									<Icon icon="mdi:chevron-down" class="h-4 w-4 text-gray-400 transition {showExpertiseDropdown ? 'rotate-180' : ''}" />
								</button>
								{#if showExpertiseDropdown}
									<button class="fixed inset-0 z-10 cursor-default" on:click={() => (showExpertiseDropdown = false)} aria-label="Close dropdown"></button>
									<div class="absolute left-0 z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
										{#each EXPERTISE_AREAS as area}
											<button
												type="button"
												on:click={() => addExpertise(area)}
												disabled={selectedExpertise.includes(area)}
												class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 {selectedExpertise.includes(area) ? 'bg-gray-50 font-medium' : ''}"
											>
												{area}
												{#if selectedExpertise.includes(area)}<Icon icon="mdi:check" class="ml-auto h-3.5 w-3.5 text-gray-500" />{/if}
											</button>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Selected Chips -->
							{#if selectedExpertise.length > 0}
								<div class="mt-2 flex flex-wrap gap-2">
									{#each selectedExpertise as area}
										<span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
											{area}
											<button type="button" on:click={() => removeExpertise(area)} class="ml-0.5 text-gray-400 hover:text-gray-700" aria-label="Remove {area}">
												<Icon icon="mdi:close" class="h-3 w-3" />
											</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ═══ SECTION 2: Contact Information ═══ -->
		<div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
			<div class="mb-5">
				<h3 class="text-base font-bold text-gray-900">Contact Information</h3>
				<p class="mt-1 text-sm text-gray-400">How organizers and event hosts can reach you.</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="contact-email" class="mb-1.5 block text-sm font-medium text-gray-700">Contact Email</label>
					<div class="relative">
						<Icon icon="mdi:email-outline" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<input id="contact-email" type="email" bind:value={contactEmail} placeholder="hello@yourdomain.com" class="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
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
					<label for="contact-website" class="mb-1.5 block text-sm font-medium text-gray-700">Personal Website</label>
					<div class="relative">
						<Icon icon="mdi:web" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<input id="contact-website" type="url" bind:value={contactWebsite} placeholder="https://yourwebsite.com" class="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
					</div>
				</div>
			</div>
		</div>

		<!-- ═══ SECTION 3: Social Links ═══ -->
		<div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
			<div class="mb-5">
				<h3 class="text-base font-bold text-gray-900">Social Links</h3>
				<p class="mt-1 text-sm text-gray-400">Connect your social media profiles so organizers and attendees can find you.</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="social-ig" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="mdi:instagram" class="h-4 w-4 text-pink-500" /> Instagram
					</label>
					<input id="social-ig" type="url" bind:value={socialInstagram} placeholder="https://instagram.com/yourprofile" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-x" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="ri:twitter-x-fill" class="h-3.5 w-3.5 text-gray-800" /> X (Twitter)
					</label>
					<input id="social-x" type="url" bind:value={socialX} placeholder="https://x.com/yourprofile" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-li" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="mdi:linkedin" class="h-4 w-4 text-blue-600" /> LinkedIn
					</label>
					<input id="social-li" type="url" bind:value={socialLinkedin} placeholder="https://linkedin.com/in/yourprofile" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-yt" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="mdi:youtube" class="h-4 w-4 text-red-600" /> YouTube
					</label>
					<input id="social-yt" type="url" bind:value={socialYoutube} placeholder="https://youtube.com/@yourchannel" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-tt" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="ic:baseline-tiktok" class="h-4 w-4 text-gray-800" /> TikTok
					</label>
					<input id="social-tt" type="url" bind:value={socialTiktok} placeholder="https://tiktok.com/@yourprofile" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
				</div>
				<div>
					<label for="social-web" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Icon icon="mdi:web" class="h-4 w-4 text-gray-500" /> Website
					</label>
					<input id="social-web" type="url" bind:value={socialWebsite} placeholder="https://yourwebsite.com" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
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
