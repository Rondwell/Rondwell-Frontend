<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { cancelCollectionBlast, getCollectionBlastQuota, getCollectionBlasts, getCollectionVerificationStatus, sendCollectionBlastNow } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import CollectionBlastModal from './CollectionBlastModal.svelte';

	$: collectionId = $page.params.id ?? '';

	let approvalStatus = 'PENDING';
	let loading = true;
	let showBlastModal = false;

	// Blast data
	let blasts: any[] = [];
	let blastsLoading = true;
	let quota = { used: 0, limit: 250, tier: 'FREE' };
	let actionLoading = '';

	$: isVerified = approvalStatus === 'APPROVED';
	$: isPending = approvalStatus === 'PENDING';
	$: isRejected = approvalStatus === 'REJECTED';
	$: emailsRemaining = Math.max(0, quota.limit - quota.used);
	$: scheduledBlasts = blasts.filter((b) => b.status === 'SCHEDULED');
	$: sentBlasts = blasts.filter((b) => b.status === 'SENT');
	$: sendingBlasts = blasts.filter((b) => b.status === 'SENDING');
	$: failedBlasts = blasts.filter((b) => b.status === 'FAILED');

	onMount(async () => {
		try {
			const data = await getCollectionVerificationStatus(collectionId);
			approvalStatus = data.approvalStatus || 'PENDING';
		} catch { approvalStatus = 'PENDING'; }
		finally { loading = false; }

		if (approvalStatus === 'APPROVED') loadBlastData();
	});

	async function loadBlastData() {
		blastsLoading = true;
		try {
			const [blastData, quotaData] = await Promise.all([
				getCollectionBlasts(collectionId, { limit: '50' }),
				getCollectionBlastQuota(collectionId),
			]);
			blasts = blastData.blasts || [];
			quota = quotaData;
		} catch { blasts = []; }
		finally { blastsLoading = false; }
	}

	async function handleCancel(blastId: string) {
		actionLoading = blastId;
		try { await cancelCollectionBlast(collectionId, blastId); loadBlastData(); }
		catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	async function handleSendNow(blastId: string) {
		actionLoading = blastId;
		try { await sendCollectionBlastNow(collectionId, blastId); loadBlastData(); }
		catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'SENT': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'SCHEDULED': return 'bg-[#E2E8FC] text-[#146AEB]';
			case 'SENDING': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'FAILED': return 'bg-[#FDEAEA] text-[#E53935]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}

	function formatDate(d: string): string {
		if (!d) return '';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}
</script>

<div class="py-4">
	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-6 w-32 rounded bg-gray-200"></div>
			<div class="h-16 w-full rounded-lg bg-gray-200"></div>
		</div>
	{:else if isVerified}
		<!-- ✅ VERIFIED — Full blast UI -->

		<!-- Send Newsletter Input -->
		<button on:click={() => (showBlastModal = true)} class="mb-6 flex w-full items-center gap-3 rounded-xl bg-[#FDFDFD] px-4 py-3.5 shadow-sm transition hover:bg-[#F9F9F9]">
			<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#D79917] to-[#E8913A]">
				<Icon icon="mdi:email-newsletter" class="h-4 w-4 text-white" />
			</div>
			<span class="text-sm text-[#B9BABA]">Send a newsletter to your subscribers...</span>
		</button>

		<!-- Quota -->
		<div class="mb-6 rounded-xl border border-gray-100 bg-[#FDFDFD] p-4 shadow-sm">
			<div class="flex items-center justify-between text-xs">
				<div class="flex items-center gap-1.5">
					<Icon icon="mdi:email-outline" class="text-sm text-[#A5A6A6]" />
					<span class="text-[#666769]">Monthly email limit ({quota.tier})</span>
				</div>
				<span class="font-medium text-gray-800">{quota.used} / {quota.limit} used</span>
			</div>
			<div class="mt-2 h-1.5 w-full rounded-full bg-gray-200">
				<div class="h-1.5 rounded-full transition-all {emailsRemaining > 50 ? 'bg-green-400' : emailsRemaining > 10 ? 'bg-yellow-400' : 'bg-red-400'}" style="width: {Math.min((quota.used / quota.limit) * 100, 100)}%;"></div>
			</div>
			<div class="mt-1.5 flex items-center justify-between text-xs text-[#A5A6A6]">
				<span>{emailsRemaining} emails remaining</span>
				{#if quota.tier === 'FREE'}<button class="text-pink-600 hover:underline">Upgrade Plan</button>{/if}
			</div>
		</div>

		<!-- Scheduled -->
		{#if scheduledBlasts.length > 0}
			<div class="mb-6">
				<h2 class="mb-3 flex items-center gap-2 text-lg font-medium text-gray-900">
					<Icon icon="mdi:clock-outline" class="text-[#146AEB]" /> Scheduled
					<span class="rounded-full bg-[#E2E8FC] px-2 py-0.5 text-xs text-[#146AEB]">{scheduledBlasts.length}</span>
				</h2>
				<div class="space-y-2">
					{#each scheduledBlasts as blast}
						<div class="flex items-center gap-3 rounded-xl bg-[#FDFDFD] px-4 py-3 shadow-sm">
							<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E2E8FC]">
								<Icon icon="mdi:clock-outline" class="h-4 w-4 text-[#146AEB]" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-800">{blast.subject}</p>
								<p class="text-xs text-gray-400">{blast.recipientCount} subscribers · {formatDate(blast.scheduledAt)}</p>
							</div>
							<div class="flex flex-shrink-0 items-center gap-2">
								<button on:click={() => handleSendNow(blast._id)} disabled={actionLoading === blast._id} class="rounded-lg bg-gray-800 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-gray-700 disabled:opacity-50">
									{actionLoading === blast._id ? '...' : 'Send Now'}
								</button>
								<button on:click={() => handleCancel(blast._id)} disabled={actionLoading === blast._id} class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Sending -->
		{#if sendingBlasts.length > 0}
			<div class="mb-6">
				{#each sendingBlasts as blast}
					<div class="flex items-center gap-3 rounded-xl bg-[#FFF8E1] px-4 py-3">
						<Icon icon="mdi:loading" class="h-5 w-5 animate-spin text-[#EAAB26]" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-800">{blast.subject}</p>
							<p class="text-xs text-[#EAAB26]">Sending to {blast.recipientCount} subscribers...</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Empty state -->
		{#if blasts.length === 0 && !blastsLoading}
			<div class="mb-8 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-[#FDFDFD] px-6 py-8 text-center">
				<h3 class="text-lg font-medium text-gray-800">Send Newsletters</h3>
				<p class="max-w-md text-sm text-[#B9BABA]">Share updates with your subscribers via email.</p>
				<div class="mt-2 flex -space-x-2">
					<div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#FFF7D8]"><Icon icon="mdi:email-newsletter" class="h-4 w-4 text-[#D79917]" /></div>
					<div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#F2E4F8]"><Icon icon="mdi:account-group" class="h-4 w-4 text-[#AB46DD]" /></div>
					<div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#E2E8FC]"><Icon icon="mdi:star-four-points" class="h-4 w-4 text-[#146AEB]" /></div>
				</div>
			</div>
		{/if}

		<!-- Sent Blasts -->
		{#if sentBlasts.length > 0 || failedBlasts.length > 0}
			<div class="mb-6">
				<h2 class="mb-3 text-lg font-medium text-gray-900">Sent Newsletters</h2>
				<div class="space-y-2">
					{#each [...sentBlasts, ...failedBlasts] as blast}
						<div class="flex items-center gap-3 rounded-xl bg-[#FDFDFD] px-4 py-3 shadow-sm">
							<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full {blast.status === 'SENT' ? 'bg-[#E3F4E1]' : 'bg-[#FDEAEA]'}">
								<Icon icon={blast.status === 'SENT' ? 'mdi:check-circle' : 'mdi:alert-circle'} class="h-4 w-4 {blast.status === 'SENT' ? 'text-[#3CBD2C]' : 'text-[#E53935]'}" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-800">{blast.subject}</p>
								<p class="text-xs text-gray-400">
									{blast.recipientCount} subscribers · {formatDate(blast.sentAt || blast.createdAt)}
									{#if blast.openCount > 0}<span class="ml-1 text-[#146AEB]">· {blast.openCount} opens</span>{/if}
								</p>
							</div>
							<span class="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(blast.status)}">{blast.status}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if blastsLoading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="flex animate-pulse items-center gap-3 rounded-xl bg-[#FDFDFD] px-4 py-3">
						<div class="h-9 w-9 rounded-full bg-gray-200"></div>
						<div class="flex-1"><div class="h-4 w-48 rounded bg-gray-200"></div><div class="mt-1 h-3 w-32 rounded bg-gray-200"></div></div>
					</div>
				{/each}
			</div>
		{/if}

		<CollectionBlastModal bind:open={showBlastModal} collectionName="" {emailsRemaining} onBlastSent={loadBlastData} />

	{:else}
		<!-- ❌ NOT VERIFIED — Verification prompt -->
		<div class="mb-4 flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				Drafts
				<div class="relative inline-flex items-center justify-center">
					<img src="/circle.svg" alt="" class="h-6 w-6" />
					<span class="absolute text-xs">0</span>
				</div>
			</h2>
			<button disabled class="flex gap-1 rounded-md bg-[#EBECED] px-3 py-1 text-sm text-[#616265] opacity-50">
				<Icon icon="mdi:email-plus-outline" class="text-lg" /> Create
			</button>
		</div>

		<p class="text-sm text-[#737577]">
			Manage your subscribers and events attendees.
			<span class="inline-block sm:inline">Events guests are automatically added to this list</span>
		</p>

		{#if isPending}
			<div class="mt-4 mb-8 flex-col items-center justify-start rounded-md bg-[#F0E8D7] px-4 py-3 sm:flex sm:flex-row sm:justify-between">
				<div class="mb-4 flex items-center gap-2 sm:mb-0">
					<img src="/verify.svg" alt="verify" class="h-4 w-4" />
					<div class="flex flex-col">
						<h2 class="text-[#D69712]">Please verify your collection.</h2>
						<p class="text-[#737577]">Share information about your collection to send newsletters.</p>
					</div>
				</div>
				<button on:click={() => goto(`/collection/${collectionId}/engage/verify`)}
					class="flex w-[90px] items-center justify-center gap-1 rounded-md bg-[#E8E0D0] px-1 py-1 text-sm text-[#616265]">
					Verify
					<Icon icon="mdi:arrow-right" class="text-sm" />
				</button>
			</div>
		{:else if isRejected}
			<div class="mt-4 mb-8 flex-col items-center justify-start rounded-md bg-[#FDEAEA] px-4 py-3 sm:flex sm:flex-row sm:justify-between">
				<div class="mb-4 flex items-center gap-2 sm:mb-0">
					<Icon icon="mdi:close-circle" class="text-[#E53935]" />
					<div class="flex flex-col">
						<h2 class="text-[#E53935]">Verification was declined.</h2>
						<p class="text-[#737577]">Please review the feedback and resubmit your verification request.</p>
					</div>
				</div>
				<button on:click={() => goto(`/collection/${collectionId}/engage/verify`)}
					class="flex w-[110px] items-center justify-center gap-1 rounded-md bg-[#F5D5D5] px-2 py-1 text-sm text-[#E53935]">
					Resubmit
				</button>
			</div>
		{/if}

		<!-- Published (empty) -->
		<div class="mt-4 border-t py-4">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				Published
				<div class="relative inline-flex items-center justify-center">
					<img src="/circle.svg" alt="" class="h-6 w-6" />
					<span class="absolute text-xs">0</span>
				</div>
			</h2>
			<div class="mt-4 flex flex-col items-center justify-center gap-4">
				<img src="/noEvent.svg" alt="No newsletters" class="ml-4 h-60 w-60" />
				<h2 class="text-lg font-semibold text-[#646568]">No Published Newsletters, yet</h2>
				<p class="max-w-md text-center text-[#A2ACB2]">When you publish newsletters, they will appear here.</p>
			</div>
		</div>
	{/if}
</div>
