<script lang="ts">
	import {
		createSpeakerPortfolio,
		deleteSpeakerPortfolioMedia,
		updateSpeakerPortfolio,
		uploadSpeakerPortfolioMedia
	} from '$lib/services/speaker.services';
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';

	export let show = false;
	export let onSuccess: () => void = () => {};
	export let editPortfolio: any = null;

	$: isEditMode = !!editPortfolio;
	$: if (show && editPortfolio) populateFromPortfolio(editPortfolio);
	$: if (!show) { lastPopulatedId = ''; }

	type Section = 'details' | 'media' | 'testimonials' | 'fees';
	let openSection: Section | null = null;
	let submitting = false;
	let error = '';

	// ─── Form Fields ──────────────────────────────────────────────────────
	let title = '';
	let description = '';
	let category = 'General';
	let originalEventName = '';
	let originalEventDate = '';
	let engagementStyle = '';
	let learningOutcomes: string[] = [];
	let videoLinks: string[] = [];
	let testimonials: Array<{ eventName: string; organizerName: string; quote: string }> = [];
	let generalAvailability = '';
	let feeType = '';
	let feeAmount = '';
	let feeCurrency = 'USD';
	let feeNotes = '';
	let status: 'ACTIVE' | 'DRAFT' = 'DRAFT';
	let isPublic = true;

	const CATEGORIES = [
		'Keynote', 'Workshop', 'Panel Discussion', 'Fireside Chat',
		'Masterclass', 'Webinar', 'Conference Talk', 'Seminar',
		'Corporate Training', 'Motivational', 'Technical', 'General'
	];

	const ENGAGEMENT_STYLES = [
		'Interactive', 'Q&A', 'Workshop', 'Panel Discussion',
		'Fireside Chat', 'Keynote', 'Lecture', 'Hands-on'
	];

	// ─── File Upload ──────────────────────────────────────────────────────
	type UploadedFile = { file: File; preview: string };
	type ExistingMedia = { url: string; type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' };
	let files: UploadedFile[] = [];
	let existingMedia: ExistingMedia[] = [];
	let removedMediaUrls: string[] = [];
	let isDragging = false;
	let fileInput: HTMLInputElement;
	const MAX_FILE_SIZE = 5 * 1024 * 1024;

	function browseFiles() { fileInput?.click(); }
	function handleFiles(fl: FileList | null) {
		if (!fl) return;
		for (const f of Array.from(fl)) {
			if (f.size > MAX_FILE_SIZE) { error = `File "${f.name}" exceeds 5MB limit.`; continue; }
			files = [...files, { file: f, preview: URL.createObjectURL(f) }];
		}
	}
	function removeFile(i: number) {
		URL.revokeObjectURL(files[i].preview);
		files = files.filter((_, idx) => idx !== i);
	}
	function removeExistingMedia(i: number) {
		removedMediaUrls = [...removedMediaUrls, existingMedia[i].url];
		existingMedia = existingMedia.filter((_, idx) => idx !== i);
	}

	onDestroy(() => files.forEach((f) => URL.revokeObjectURL(f.preview)));

	function toggle(s: Section) { openSection = openSection === s ? null : s; }
	function closeModal() { show = false; editPortfolio = null; resetForm(); }

	function resetForm() {
		title = ''; description = ''; category = 'General'; originalEventName = '';
		originalEventDate = ''; engagementStyle = ''; learningOutcomes = [];
		videoLinks = []; testimonials = []; generalAvailability = '';
		feeType = ''; feeAmount = ''; feeCurrency = 'USD'; feeNotes = '';
		status = 'DRAFT'; isPublic = true; error = '';
		files.forEach((f) => URL.revokeObjectURL(f.preview));
		files = []; existingMedia = []; removedMediaUrls = []; openSection = null;
	}

	let lastPopulatedId = '';
	function populateFromPortfolio(p: any) {
		if (!p || lastPopulatedId === p._id) return;
		lastPopulatedId = p._id;
		title = p.title || '';
		description = p.description || '';
		category = p.category || 'General';
		originalEventName = p.originalEventName || '';
		originalEventDate = p.originalEventDate ? new Date(p.originalEventDate).toISOString().split('T')[0] : '';
		engagementStyle = p.engagementStyle || '';
		learningOutcomes = p.learningOutcomes || [];
		videoLinks = p.videoLinks || [];
		testimonials = (p.testimonials || []).map((t: any) => ({ eventName: t.eventName, organizerName: t.organizerName, quote: t.quote }));
		generalAvailability = p.generalAvailability || '';
		feeType = p.feeType || '';
		feeAmount = p.feeAmount ? String(p.feeAmount) : '';
		feeCurrency = p.feeCurrency || 'USD';
		feeNotes = p.feeNotes || '';
		status = p.status || 'DRAFT';
		isPublic = p.isPublic ?? true;
		existingMedia = (p.media || []).map((m: any) => ({ url: m.url, type: m.type }));
		files = []; removedMediaUrls = [];
	}

	// ─── Learning Outcomes ────────────────────────────────────────────────
	let newOutcome = '';
	function addOutcome() {
		if (newOutcome.trim()) { learningOutcomes = [...learningOutcomes, newOutcome.trim()]; newOutcome = ''; }
	}
	function removeOutcome(i: number) { learningOutcomes = learningOutcomes.filter((_, idx) => idx !== i); }

	// ─── Video Links ──────────────────────────────────────────────────────
	let newVideoLink = '';
	function addVideoLink() {
		if (newVideoLink.trim()) { videoLinks = [...videoLinks, newVideoLink.trim()]; newVideoLink = ''; }
	}
	function removeVideoLink(i: number) { videoLinks = videoLinks.filter((_, idx) => idx !== i); }

	// ─── Testimonials ─────────────────────────────────────────────────────
	let newTestimonial = { eventName: '', organizerName: '', quote: '' };
	function addTestimonial() {
		if (newTestimonial.eventName.trim() && newTestimonial.organizerName.trim()) {
			testimonials = [...testimonials, { ...newTestimonial }];
			newTestimonial = { eventName: '', organizerName: '', quote: '' };
		}
	}
	function removeTestimonial(i: number) { testimonials = testimonials.filter((_, idx) => idx !== i); }

	async function handleSubmit() {
		error = '';
		if (!title.trim()) { error = 'Title is required.'; openSection = 'details'; return; }
		if (!description.trim() || description.trim().length < 10) { error = 'Description must be at least 10 characters.'; openSection = 'details'; return; }
		submitting = true;
		try {
			// 1. Upload new media files
			const newMedia: { url: string; type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' }[] = [];
			for (const f of files) {
				try {
					const url = await uploadSpeakerPortfolioMedia(f.file);
					const fileType = f.file.type.startsWith('video') ? 'VIDEO' : f.file.type === 'application/pdf' ? 'DOCUMENT' : 'IMAGE';
					newMedia.push({ url, type: fileType });
				} catch (uploadErr: any) {
					console.error('Upload failed for', f.file.name, uploadErr);
				}
			}

			// 2. Delete removed media from S3
			if (isEditMode) {
				for (const url of removedMediaUrls) {
					try { await deleteSpeakerPortfolioMedia(url); } catch (e) { console.error('Failed to delete media:', e); }
				}
			}

			// 3. Combine media
			const allMedia = [...existingMedia, ...newMedia];

			// 4. Build payload
			const payload: Record<string, unknown> = {
				title: title.trim(),
				description: description.trim(),
				category,
				media: allMedia,
				isPublic,
				status: isPublic ? 'ACTIVE' : 'DRAFT'
			};
			if (originalEventName.trim()) payload.originalEventName = originalEventName.trim();
			if (originalEventDate) payload.originalEventDate = originalEventDate;
			if (engagementStyle) payload.engagementStyle = engagementStyle;
			if (learningOutcomes.length > 0) payload.learningOutcomes = learningOutcomes;
			if (videoLinks.length > 0) payload.videoLinks = videoLinks;
			if (testimonials.length > 0) payload.testimonials = testimonials;
			if (generalAvailability.trim()) payload.generalAvailability = generalAvailability.trim();
			if (feeType) payload.feeType = feeType;
			if (feeAmount) payload.feeAmount = parseFloat(feeAmount);
			if (feeCurrency) payload.feeCurrency = feeCurrency;
			if (feeNotes.trim()) payload.feeNotes = feeNotes.trim();

			if (isEditMode) {
				await updateSpeakerPortfolio(editPortfolio._id, payload);
			} else {
				await createSpeakerPortfolio(payload);
			}
			closeModal();
			onSuccess();
		} catch (e: any) {
			error = e.message || `Failed to ${isEditMode ? 'update' : 'create'} portfolio entry.`;
		} finally {
			submitting = false;
		}
	}
</script>

{#if show}
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
	on:click|self={closeModal}
	on:keydown={(e) => e.key === 'Escape' && closeModal()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div
		class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#FDFCFB]"
		on:click|stopPropagation
		on:keydown|stopPropagation
		role="document"
	>
		<!-- ═══ HEADER ═══ -->
		<div class="relative border-b border-[#EBEBEB] px-6 pb-5 pt-6">
			<button on:click={closeModal} class="absolute right-4 top-4 rounded-full bg-[#EBECED] p-2 hover:bg-gray-200" aria-label="Close modal">
				<Icon icon="heroicons:x-mark" class="h-4 w-4 text-[#5C5C5C]" />
			</button>
			<div class="flex flex-col items-center text-center">
				<div class="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F0F0F0]">
					<Icon icon="mdi:microphone-variant" class="h-8 w-8 text-gray-500" />
				</div>
				<h2 class="text-xl font-semibold text-[#171717]">{isEditMode ? 'Edit Portfolio Entry' : 'Add Portfolio Entry'}</h2>
				<p class="text-sm text-[#5C5C5C]">{isEditMode ? 'Update the details of your speaking engagement.' : 'Provide details of your speaking engagement.'}</p>
			</div>
		</div>

		<!-- ═══ SCROLLABLE BODY ═══ -->
		<div class="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6">
			{#if error}
				<div class="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
			{/if}

			<!-- Upload Area -->
			<div class="mb-5">
				<p class="mb-2 text-sm font-medium text-[#171717]">Images/Videos</p>
				<div
					class="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition {isDragging ? 'border-black bg-gray-50' : 'border-gray-300 bg-white'}"
					on:drop|preventDefault={(e) => { isDragging = false; handleFiles(e.dataTransfer?.files ?? null); }}
					on:dragover|preventDefault={() => (isDragging = true)}
					on:dragleave={() => (isDragging = false)}
					role="region"
					aria-label="File upload area"
				>
					<img src="/upload.svg" alt="" class="mb-2 h-7 w-7 opacity-50" />
					<p class="text-sm text-[#171717]">Choose a file or drag & drop it here.</p>
					<p class="mt-1 text-xs text-[#737373]">JPEG, PNG, PDF, and MP4 formats, up to 5 MB.</p>
					<button type="button" on:click={browseFiles} class="mt-3 rounded-lg border border-gray-300 px-5 py-1.5 text-sm font-medium text-[#5C5C5C] hover:bg-gray-50">Browse File</button>
					<input bind:this={fileInput} type="file" class="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.mp4" on:change={(e) => handleFiles((e.target as HTMLInputElement).files)} />
				</div>

				<!-- Existing media -->
				{#if existingMedia.length > 0}
					<div class="mt-3 space-y-2">
						{#each existingMedia as item, idx}
							<div class="flex items-center justify-between rounded-lg border bg-white p-2.5">
								<div class="flex items-center gap-2 min-w-0">
									{#if item.type === 'IMAGE'}
										<img src={item.url} alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
									{:else if item.type === 'VIDEO'}
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-bold text-blue-500">VID</div>
									{:else}
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-50 text-[10px] font-bold text-red-500">PDF</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate text-xs font-medium">Existing file</p>
										<p class="text-[10px] text-gray-400"><span class="text-green-600">✓ Uploaded</span></p>
									</div>
								</div>
								<button on:click={() => removeExistingMedia(idx)} class="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remove file">
									<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- New files -->
				{#if files.length > 0}
					<div class="mt-3 space-y-2">
						{#each files as item, idx}
							<div class="flex items-center justify-between rounded-lg border bg-white p-2.5">
								<div class="flex items-center gap-2 min-w-0">
									{#if item.file.type.startsWith('image')}
										<img src={item.preview} alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
									{:else if item.file.type.startsWith('video')}
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-bold text-blue-500">VID</div>
									{:else}
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-50 text-[10px] font-bold text-red-500">PDF</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate text-xs font-medium">{item.file.name}</p>
										<p class="text-[10px] text-gray-400">{(item.file.size / 1024).toFixed(0)} KB · <span class="text-green-600">✓ Completed</span></p>
									</div>
								</div>
								<button on:click={() => removeFile(idx)} class="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remove file">
									<Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- ═══ ACCORDIONS ═══ -->
			<div class="space-y-3">
				<!-- ── Details ── -->
				<div>
					<button on:click={() => toggle('details')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:help-circle-outline" class="h-4 w-4 text-gray-400" /> Details</span>
						<Icon icon={openSection === 'details' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'details'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<!-- Title -->
							<div>
								<label for="port-title" class="mb-1 flex items-center gap-1 text-sm font-medium">Title of Session / Talk <Icon icon="mdi:information-outline" class="h-3.5 w-3.5 text-gray-400" /></label>
								<input id="port-title" bind:value={title} placeholder="e.g. The Future of AI in Business" class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
							</div>
							<!-- Category -->
							<div>
								<label for="port-category" class="mb-1 block text-sm font-medium">Category <span class="text-[#335CFF]">*</span></label>
								<select id="port-category" bind:value={category} class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300">
									{#each CATEGORIES as cat}
										<option value={cat}>{cat}</option>
									{/each}
								</select>
							</div>
							<!-- Original Event Name -->
							<div>
								<label for="port-event" class="mb-1 block text-sm font-medium">Original Event Name <span class="text-gray-400">(Optional)</span></label>
								<input id="port-event" bind:value={originalEventName} placeholder="Rondwell Tech Summit, May 2024" class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
							</div>
							<!-- Original Event Date -->
							<div>
								<label for="port-date" class="mb-1 block text-sm font-medium">Original Event Date <span class="text-gray-400">(Optional)</span></label>
								<input id="port-date" type="date" bind:value={originalEventDate} class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
							</div>
							<!-- Description -->
							<div>
								<label for="port-desc" class="mb-1 block text-sm font-medium">Description of Talk <span class="text-[#335CFF]">*</span></label>
								<div class="relative">
									<textarea id="port-desc" bind:value={description} maxlength="5000" rows="3" placeholder="Provide a detailed overview of your session, target audience, and key takeaways." class="w-full resize-none rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 pr-16 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
									<span class="pointer-events-none absolute right-3 bottom-2 text-[10px] text-gray-400">{description.length}/5000</span>
								</div>
								<p class="mt-1 flex items-center gap-1 text-[10px] text-gray-400"><Icon icon="mdi:information-outline" class="h-3 w-3" /> Describe your session, target audience, and key takeaways.</p>
							</div>
							<!-- Engagement Style -->
							<div>
								<label class="mb-1 block text-sm font-medium">Audience Engagement Style <span class="text-gray-400">(Optional)</span></label>
								<div class="grid grid-cols-2 gap-2 text-sm text-gray-700">
									{#each ENGAGEMENT_STYLES as style}
										<label class="flex items-center gap-2 cursor-pointer">
											<input type="radio" name="engagementStyle" value={style} bind:group={engagementStyle} class="h-3.5 w-3.5 accent-black" />
											<span class="text-xs">{style}</span>
										</label>
									{/each}
								</div>
							</div>
							<!-- Learning Outcomes -->
							<div>
								<div class="mb-2 flex items-center justify-between">
									<label class="text-sm font-medium">Key Learning Outcomes <span class="text-gray-400">(Optional)</span></label>
								</div>
								<div class="flex items-center gap-2 mb-2">
									<input bind:value={newOutcome} on:keydown={(e) => e.key === 'Enter' && addOutcome()} placeholder="Type a learning outcome..." class="flex-1 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
									<button type="button" on:click={addOutcome} class="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800">Add</button>
								</div>
								{#if learningOutcomes.length > 0}
									<div class="space-y-1.5">
										{#each learningOutcomes as outcome, idx}
											<div class="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
												<span class="text-xs text-gray-700">{outcome}</span>
												<button on:click={() => removeOutcome(idx)} class="p-1 text-gray-400 hover:text-red-500" aria-label="Remove outcome">
													<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" />
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- ── Media ── -->
				<div>
					<button on:click={() => toggle('media')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:play-circle-outline" class="h-4 w-4 text-gray-400" /> Media & Video Links</span>
						<Icon icon={openSection === 'media' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'media'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<div>
								<div class="mb-2 flex items-center justify-between">
									<label class="text-sm font-medium">Speaker Reels / Demo Videos <span class="text-gray-400">(Optional)</span></label>
								</div>
								<div class="flex items-center gap-2 mb-2">
									<input bind:value={newVideoLink} on:keydown={(e) => e.key === 'Enter' && addVideoLink()} placeholder="https://youtube.com/watch?v=..." class="flex-1 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
									<button type="button" on:click={addVideoLink} class="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800">Add</button>
								</div>
								{#if videoLinks.length > 0}
									<div class="space-y-1.5">
										{#each videoLinks as link, idx}
											<div class="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
												<span class="text-xs text-blue-600 truncate">{link}</span>
												<button on:click={() => removeVideoLink(idx)} class="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remove link">
													<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" />
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- ── References & Testimonials ── -->
				<div>
					<button on:click={() => toggle('testimonials')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:message-text-outline" class="h-4 w-4 text-gray-400" /> References & Testimonials</span>
						<Icon icon={openSection === 'testimonials' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'testimonials'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<div class="space-y-3 rounded-lg border border-gray-100 p-3">
								<div>
									<label for="test-event" class="mb-1 block text-xs font-medium">Event Name <span class="text-[#335CFF]">*</span></label>
									<input id="test-event" bind:value={newTestimonial.eventName} placeholder="Event name..." class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
								</div>
								<div>
									<label for="test-org" class="mb-1 block text-xs font-medium">Name of Organizer/Company <span class="text-[#335CFF]">*</span></label>
									<input id="test-org" bind:value={newTestimonial.organizerName} placeholder="Organizer name..." class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
								</div>
								<div>
									<label for="test-quote" class="mb-1 block text-xs font-medium">Testimonial Quote <span class="text-gray-400">(Optional)</span></label>
									<textarea id="test-quote" bind:value={newTestimonial.quote} maxlength="500" rows="2" placeholder="Enter testimonial quote..." class="w-full resize-none rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
								</div>
								<button type="button" on:click={addTestimonial} class="flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800">
									<Icon icon="mdi:plus" class="h-3 w-3" /> Add Testimonial
								</button>
							</div>
							{#if testimonials.length > 0}
								<div class="overflow-hidden rounded-lg border">
									<table class="w-full text-xs">
										<thead class="bg-gray-50 text-gray-500">
											<tr>
												<th class="px-3 py-2 text-left font-medium">Testimonial</th>
												<th class="px-3 py-2 text-left font-medium">Event</th>
												<th class="px-3 py-2 text-left font-medium">Organizer</th>
												<th class="px-3 py-2 text-center font-medium w-16">Action</th>
											</tr>
										</thead>
										<tbody class="divide-y">
											{#each testimonials as t, idx}
												<tr>
													<td class="px-3 py-2 truncate max-w-[120px]">{t.quote || '—'}</td>
													<td class="px-3 py-2 truncate max-w-[120px]">{t.eventName}</td>
													<td class="px-3 py-2 truncate max-w-[120px]">{t.organizerName}</td>
													<td class="px-3 py-2 text-center">
														<button on:click={() => removeTestimonial(idx)} class="p-1 text-gray-400 hover:text-red-500" aria-label="Remove testimonial">
															<Icon icon="mdi:trash-can-outline" class="h-3.5 w-3.5" />
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- ── Availability & Fees ── -->
				<div>
					<button on:click={() => toggle('fees')} class="flex w-full items-center justify-between rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm font-medium text-[#171717] transition hover:bg-gray-200">
						<span class="flex items-center gap-2"><Icon icon="mdi:currency-usd" class="h-4 w-4 text-gray-400" /> Availability & Fees</span>
						<Icon icon={openSection === 'fees' ? 'mdi:minus' : 'mdi:plus'} class="h-4 w-4 text-[#5C5C5C]" />
					</button>
					{#if openSection === 'fees'}
						<div class="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
							<!-- General Availability -->
							<div>
								<label for="port-avail" class="mb-1 block text-sm font-medium">General Availability <span class="text-gray-400">(Optional)</span></label>
								<div class="relative">
									<textarea id="port-avail" bind:value={generalAvailability} maxlength="1000" rows="2" placeholder="Generally available for engagements on Tuesdays and Thursdays. Can travel." class="w-full resize-none rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 pr-16 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
									<span class="pointer-events-none absolute right-3 bottom-2 text-[10px] text-gray-400">{generalAvailability.length}/1000</span>
								</div>
							</div>
							<!-- Speaking Fees -->
							<div>
								<label class="mb-2 block text-sm font-medium">Speaking Fees <span class="text-gray-400">(Optional)</span></label>
								<div class="grid grid-cols-2 gap-2 text-sm text-gray-700">
									<label class="flex items-center gap-2 cursor-pointer">
										<input type="radio" name="feeType" value="FIXED" bind:group={feeType} class="h-3.5 w-3.5 accent-black" />
										<span class="text-xs">Fixed Fee per Engagement</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer">
										<input type="radio" name="feeType" value="PRO_BONO" bind:group={feeType} class="h-3.5 w-3.5 accent-black" />
										<span class="text-xs">Pro Bono / Negotiable</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer">
										<input type="radio" name="feeType" value="VARIABLE" bind:group={feeType} class="h-3.5 w-3.5 accent-black" />
										<span class="text-xs">Variable / Custom Quote</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer">
										<input type="radio" name="feeType" value="NOT_APPLICABLE" bind:group={feeType} class="h-3.5 w-3.5 accent-black" />
										<span class="text-xs">Not Applicable / Private</span>
									</label>
								</div>
							</div>
							{#if feeType === 'FIXED' || feeType === 'VARIABLE'}
								<div class="grid grid-cols-2 gap-3">
									<div>
										<label for="port-fee" class="mb-1 block text-sm font-medium">Fee Amount</label>
										<input id="port-fee" type="number" bind:value={feeAmount} placeholder="0.00" min="0" step="0.01" class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300" />
									</div>
									<div>
										<label for="port-currency" class="mb-1 block text-sm font-medium">Currency</label>
										<select id="port-currency" bind:value={feeCurrency} class="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300">
											<option value="USD">USD ($)</option>
											<option value="NGN">NGN (₦)</option>
											<option value="GBP">GBP (£)</option>
											<option value="EUR">EUR (€)</option>
										</select>
									</div>
								</div>
							{/if}
							<!-- Fee Notes -->
							<div>
								<label for="port-fee-notes" class="mb-1 block text-sm font-medium">Additional Fee Notes <span class="text-gray-400">(Optional)</span></label>
								<textarea id="port-fee-notes" bind:value={feeNotes} maxlength="2000" rows="2" placeholder="Any additional details about your fees..." class="w-full resize-none rounded-lg border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"></textarea>
							</div>
							<!-- Visibility -->
							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" bind:checked={isPublic} class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" />
								<div>
									<span class="text-sm font-medium text-[#171717]">Make publicly visible</span>
									<p class="text-[10px] text-gray-400">When enabled, this entry will be visible on your public speaker profile.</p>
								</div>
							</label>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ═══ FOOTER ═══ -->
		<div class="border-t border-[#EBEBEB] px-6 py-4">
			<div class="flex items-center justify-end gap-3">
				<button on:click={closeModal} class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-[#5C5C5C] hover:bg-gray-50">
					Cancel
				</button>
				<button
					on:click={handleSubmit}
					disabled={submitting}
					class="flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if submitting}
						<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
						{isEditMode ? 'Saving...' : 'Creating...'}
					{:else}
						<Icon icon={isEditMode ? 'mdi:content-save-outline' : 'mdi:plus'} class="h-4 w-4" />
						{isEditMode ? 'Save Changes' : 'Create Entry'}
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
</style>
