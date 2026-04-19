<script lang="ts">
	import { respondToCollaborationRequest } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let open = false;
	export let eventId = '';
	export let eventTitle = '';
	export let request: any = null;

	let accepting = false;
	let declining = false;
	let error = '';
	let declineReason = '';
	let showDeclineForm = false;

	$: senderName = request?.senderName || 'Unknown';
	$: senderEmail = request?.senderEmail || '';
	$: role = request?.role || 'SPEAKER';
	$: roleLabel = role === 'SPEAKER' ? 'Speaker' : role === 'EXHIBITOR' ? 'Exhibitor' : 'Vendor';
	$: proposal = request?.proposal || '';
	$: status = request?.status || 'PENDING';
	$: isPending = status === 'PENDING' || status === 'APPLIED';
	$: profileUrl = request?.publicProfileUrl || '';
	$: attachments = request?.attachments || [];
	$: additionalInfo = request?.additionalInfo || {};
	$: serviceName = additionalInfo?.serviceName || '';
	$: serviceDescription = additionalInfo?.serviceDescription || '';
	$: productImageUrl = additionalInfo?.productImageUrl || '';
	$: budget = additionalInfo?.budget;
	$: currency = additionalInfo?.currency || 'NGN';
	$: deadline = additionalInfo?.deadline;
	$: companyName = request?.companyName || senderName;

	function getRoleBadgeColor(): string {
		if (role === 'SPEAKER') return 'bg-[#EFEBFF] text-purple-500';
		if (role === 'EXHIBITOR') return 'bg-blue-100 text-blue-600';
		return 'bg-teal-100 text-teal-600';
	}

	async function handleAccept() {
		if (!request?.id || !eventId) return;
		accepting = true;
		error = '';
		try {
			await respondToCollaborationRequest(eventId, request.id, 'ACCEPT');
			dispatch('responded');
		} catch (e: any) {
			error = e.message || 'Failed to accept request';
		} finally {
			accepting = false;
		}
	}

	async function handleDecline() {
		if (!request?.id || !eventId) return;
		declining = true;
		error = '';
		try {
			await respondToCollaborationRequest(eventId, request.id, 'DECLINE', declineReason || undefined);
			dispatch('responded');
		} catch (e: any) {
			error = e.message || 'Failed to decline request';
		} finally {
			declining = false;
		}
	}

	function close() {
		open = false;
		showDeclineForm = false;
		declineReason = '';
		error = '';
		dispatch('close');
	}
</script>

{#if open && request}
	<div on:click={close} on:keydown={(e) => e.key === 'Escape' && close()} class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10" role="dialog" aria-modal="true" tabindex="-1">
		<div class="w-full max-w-xl overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl" role="document" on:click|stopPropagation on:keydown|stopPropagation>
			<!-- Header -->
			<div class="flex items-start md:items-center justify-between border-b border-gray-200 px-6 py-4">
				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex items-center gap-3">
						<button aria-label="Close" on:click={close}>
							<Icon icon="mdi:close" class="text-lg text-gray-500" />
						</button>
						<p class="font-medium">Review & Respond</p>
					</div>
					{#if isPending}
						<div class="flex items-center gap-3">
							<button on:click={handleAccept} disabled={accepting || declining} class="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
								{accepting ? 'Accepting...' : 'Accept'}
							</button>
							<button on:click={() => (showDeclineForm = !showDeclineForm)} disabled={accepting || declining} class="flex items-center gap-1 rounded-lg bg-[#F0F1F1] px-3 py-1.5 text-sm font-medium text-[#727375] disabled:opacity-50">
								Decline
							</button>
						</div>
					{:else}
						<span class="rounded-md px-3 py-1 text-sm font-medium {status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
							{status === 'ACCEPTED' ? 'Accepted' : 'Declined'}
						</span>
					{/if}
				</div>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar max-h-[70vh] space-y-6 overflow-y-auto px-5 py-6 text-gray-700">
				{#if error}
					<p class="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
				{/if}

				<!-- Title -->
				<h2 class="text-2xl font-semibold text-gray-900">
					Collaboration Request from {senderName} ({roleLabel})
				</h2>

				<!-- Decline Form -->
				{#if showDeclineForm && isPending}
					<div class="rounded-xl bg-red-50 p-4">
						<p class="mb-2 text-sm font-medium text-red-800">Are you sure you want to decline this request?</p>
						<textarea bind:value={declineReason} placeholder="Reason for declining (optional)..." rows="3" class="w-full resize-none rounded-md border border-red-200 bg-white px-3 py-2 text-sm"></textarea>
						<div class="mt-3 flex gap-2">
							<button on:click={() => (showDeclineForm = false)} class="rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 shadow-xs">Cancel</button>
							<button on:click={handleDecline} disabled={declining} class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white shadow-xs disabled:opacity-50">
								{declining ? 'Declining...' : 'Confirm Decline'}
							</button>
						</div>
					</div>
				{/if}

				<!-- Sender Details -->
				<section class="rounded-xl bg-white p-4">
					<p class="mb-3 text-lg font-medium text-gray-900">Sender Details</p>
					<div class="mt-2 flex items-center gap-3 border-t pt-4">
						{#if request.senderProfilePicture}
							<img src={request.senderProfilePicture} class="h-10 w-10 rounded-full object-cover" alt={senderName} />
						{:else}
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-lg font-medium text-gray-600">
								{senderName.charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							<p class="flex items-center gap-2 font-semibold">
								{senderName}
								<span class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold {getRoleBadgeColor()}">
									<Icon icon="mdi:star" class="text-xs" />
									{roleLabel}
								</span>
							</p>
							{#if senderEmail}
								<p class="text-xs text-gray-500">{senderEmail}</p>
							{/if}
						</div>
					</div>

					{#if profileUrl}
						<div class="mt-4 flex items-start gap-2">
							<Icon icon="mdi:link-variant" class="mt-0.5 text-gray-400" />
							<div>
								<p class="mb-1 text-sm text-gray-400">Public Profile URL</p>
								<a href={profileUrl.startsWith('http') ? profileUrl : `https://${profileUrl}`} target="_blank" rel="noopener noreferrer" class="text-sm underline">{profileUrl}</a>
							</div>
						</div>
					{/if}

					{#if request.socialLinks && Object.keys(request.socialLinks).length > 0}
						<div class="mt-3 flex items-center gap-3">
							{#if request.socialLinks.linkedin}
								<a href="https://linkedin.com/in/{request.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer">
									<Icon icon="simple-icons:linkedin" width="20" class="text-gray-600 hover:text-blue-600" />
								</a>
							{/if}
							{#if request.socialLinks.twitter}
								<a href="https://x.com/{request.socialLinks.twitter}" target="_blank" rel="noopener noreferrer">
									<Icon icon="simple-icons:x" width="20" class="text-gray-600 hover:text-black" />
								</a>
							{/if}
						</div>
					{/if}
				</section>

				<!-- Vendor Service/Product Info -->
				{#if serviceName || budget || companyName}
					<section class="rounded-xl bg-white p-4">
						<p class="mb-3 text-lg font-medium text-gray-900">Service / Product Details</p>
						<div class="space-y-3">
							{#if serviceName}
								<div class="flex items-start gap-3">
									{#if productImageUrl}
										<img src={productImageUrl} alt={serviceName} class="h-12 w-12 shrink-0 rounded-lg object-cover" />
									{:else}
										<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-50">
											<Icon icon="mdi:package-variant-closed" class="h-6 w-6 text-purple-400" />
										</div>
									{/if}
									<div>
										<p class="text-xs text-gray-400">Product / Service Name</p>
										<p class="text-sm font-medium text-gray-800">{serviceName}</p>
										{#if serviceDescription}
											<p class="mt-1 text-xs leading-relaxed text-gray-500">{serviceDescription}</p>
										{/if}
									</div>
								</div>
							{/if}
							{#if companyName && companyName !== senderName}
								<div class="flex items-start gap-2">
									<Icon icon="mdi:domain" class="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
									<div>
										<p class="text-xs text-gray-400">Business Name</p>
										<p class="text-sm font-medium text-gray-800">{companyName}</p>
									</div>
								</div>
							{/if}
							{#if budget}
								<div class="flex items-start gap-2">
									<Icon icon="mdi:cash" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
									<div>
										<p class="text-xs text-gray-400">Proposed Price / Fee</p>
										<p class="text-sm font-bold text-gray-900">{currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency}{Number(budget).toLocaleString()}</p>
									</div>
								</div>
							{/if}
							{#if deadline}
								<div class="flex items-start gap-2">
									<Icon icon="mdi:calendar-clock" class="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
									<div>
										<p class="text-xs text-gray-400">Proposed Date</p>
										<p class="text-sm font-medium text-gray-800">{new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
									</div>
								</div>
							{/if}
							{#if request?.specialRequirements}
								<div class="flex items-start gap-2">
									<Icon icon="mdi:information-outline" class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
									<div>
										<p class="text-xs text-gray-400">Additional Info</p>
										<p class="text-sm text-gray-700">{request.specialRequirements}</p>
									</div>
								</div>
							{/if}
						</div>
					</section>
				{/if}

				<!-- Proposed Contribution -->
				<section class="rounded-xl bg-white p-4">
					<p class="mb-3 text-lg font-medium">Proposed Contribution</p>
					<div class="mb-4 flex items-start gap-2">
						<Icon icon="mdi:text-box-outline" class="mt-0.5 text-gray-400" />
						<div>
							<p class="mb-1 text-sm font-medium text-gray-400">Proposal Details</p>
							<p class="text-sm leading-relaxed whitespace-pre-wrap">{proposal || 'No proposal details provided.'}</p>
						</div>
					</div>

					<!-- Attachments -->
					{#if attachments.length > 0}
						<div>
							<div class="mb-1 flex items-start gap-2">
								<Icon icon="mdi:paperclip" class="mt-0.5 text-gray-400" />
								<div class="w-full">
									<p class="mb-2 text-sm text-gray-400">Attached Portfolio/Services</p>
									{#each attachments as attachment}
										<div class="mb-2 flex w-full items-center justify-between gap-3 rounded-lg border bg-gray-50 p-3">
											<div class="flex items-center gap-3">
												<Icon icon="mdi:file-document-outline" class="text-xl text-gray-400" />
												<a href={attachment} target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-blue-600 hover:underline">
													{attachment.split('/').pop() || 'Attachment'}
												</a>
											</div>
											<Icon icon="mdi:open-in-new" class="text-gray-400" />
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</section>
			</div>
		</div>
	</div>
{/if}

<style>
	::-webkit-scrollbar { width: 6px; }
	::-webkit-scrollbar-thumb { background: rgba(107, 114, 128, 0.5); border-radius: 3px; }
</style>
