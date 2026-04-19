<script lang="ts">
	import { page } from '$app/stores';
	import { cancelEventBlast, getBlastQuota, getEventBlasts, sendBlastNow } from '$lib/services/event.services';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import SendPostModal from '../../components/SendPostModal.svelte';

	export let eventId = '';
	export let eventData: any = null;

	let showSendPostModal = false;
	let blasts: any[] = [];
	let blastsLoading = true;
	let quota = { used: 0, limit: 250, tier: 'FREE' };
	let actionLoading = '';

	$: eventTitle = eventData?.title ?? 'Untitled Event';
	$: emailsRemaining = Math.max(0, quota.limit - quota.used);
	$: scheduledBlasts = blasts.filter((b) => b.status === 'SCHEDULED');
	$: sentBlasts = blasts.filter((b) => b.status === 'SENT');
	$: sendingBlasts = blasts.filter((b) => b.status === 'SENDING');
	$: failedBlasts = blasts.filter((b) => b.status === 'FAILED');

	onMount(() => { loadData(); });

	async function loadData() {
		blastsLoading = true;
		try {
			const [blastData, quotaData] = await Promise.all([
				getEventBlasts(eventId, { limit: '50' }),
				getBlastQuota(eventId),
			]);
			blasts = blastData.blasts || [];
			quota = quotaData;
		} catch { blasts = []; }
		finally { blastsLoading = false; }
	}

	async function handleCancel(blastId: string) {
		actionLoading = blastId;
		try { await cancelEventBlast(eventId, blastId); loadData(); }
		catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	async function handleSendNow(blastId: string) {
		actionLoading = blastId;
		try { await sendBlastNow(eventId, blastId); loadData(); }
		catch (e) { console.error(e); }
		finally { actionLoading = ''; }
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'SENT': return 'bg-[#E3F4E1] text-[#3CBD2C]';
			case 'SCHEDULED': return 'bg-[#E2E8FC] text-[#146AEB]';
			case 'SENDING': return 'bg-[#FFF8E1] text-[#EAAB26]';
			case 'FAILED': return 'bg-[#FDEAEA] text-[#E53935]';
			case 'CANCELLED': return 'bg-[#EBECED] text-[#616265]';
			default: return 'bg-[#EBECED] text-[#616265]';
		}
	}

	function formatDate(d: string): string {
		if (!d) return '';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}

	// Registration notification toggle
	let notifyOnRegistration = true;

	const systemMessages = [
		{ id: 'registration', title: 'Attendee Registration Notification', description: 'Email sent to you when an attendee registers.', icon: 'mdi:email-check-outline', iconBg: '#E2E8FC', iconColor: '#146AEB', action: 'toggle', enabled: true },
		{ id: 'reminders', title: 'Event Reminders', description: 'Automatic reminders via email, SMS, and push.', icon: 'mdi:bell-ring-outline', iconBg: '#F2E4F8', iconColor: '#AB46DD', action: 'manage' },
		{ id: 'feedback', title: 'Post-Event Feedback', description: 'Schedule a feedback email after the event.', icon: 'mdi:message-star-outline', iconBg: '#FFF7D8', iconColor: '#D79917', action: 'schedule' },
	];
</script>

<div class="max-w-4xl">
	<!-- Send Marketing Input -->
	<button on:click={() => (showSendPostModal = true)} class="mb-6 flex w-full items-center gap-3 rounded-xl bg-[#FDFDFD] px-4 py-3.5 shadow-sm transition hover:bg-[#F9F9F9]">
		<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#DB3EC6] to-[#513BE2]">
			<Icon icon="mdi:send-variant" class="h-4 w-4 text-white" />
		</div>
		<span class="text-sm text-[#B9BABA]">Send a Marketing to your attendees...</span>
	</button>

	<!-- Quota Bar -->
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

	<!-- Scheduled Blasts -->
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
							<p class="text-xs text-gray-400">{blast.recipientCount} recipients · Scheduled for {formatDate(blast.scheduledAt)}</p>
						</div>
						<div class="flex flex-shrink-0 items-center gap-2">
							<button on:click={() => handleSendNow(blast._id)} disabled={actionLoading === blast._id}
								class="rounded-lg bg-gray-800 px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-gray-700 disabled:opacity-50">
								{actionLoading === blast._id ? '...' : 'Send Now'}
							</button>
							<button on:click={() => handleCancel(blast._id)} disabled={actionLoading === blast._id}
								class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
								Cancel
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Sending Blasts -->
	{#if sendingBlasts.length > 0}
		<div class="mb-6">
			{#each sendingBlasts as blast}
				<div class="flex items-center gap-3 rounded-xl bg-[#FFF8E1] px-4 py-3">
					<Icon icon="mdi:loading" class="h-5 w-5 animate-spin text-[#EAAB26]" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-gray-800">{blast.subject}</p>
						<p class="text-xs text-[#EAAB26]">Sending to {blast.recipientCount} recipients...</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Send Marketings Card (empty state) -->
	{#if blasts.length === 0 && !blastsLoading}
		<div class="mb-8 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-[#FDFDFD] px-6 py-8 text-center">
			<h3 class="text-lg font-medium text-gray-800">Send Marketings</h3>
			<p class="max-w-md text-sm text-[#B9BABA]">Share updates with your attendees via email, SMS, and push notifications.</p>
			<div class="mt-2 flex -space-x-2">
				<div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#E2E8FC]"><Icon icon="mdi:send" class="h-4 w-4 text-[#146AEB]" /></div>
				<div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#F2E4F8]"><Icon icon="mdi:account-group" class="h-4 w-4 text-[#AB46DD]" /></div>
				<div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#FDEAEA]"><Icon icon="mdi:star-four-points" class="h-4 w-4 text-[#E53935]" /></div>
			</div>
		</div>
	{/if}

	<!-- Sent Blasts -->
	{#if sentBlasts.length > 0 || failedBlasts.length > 0}
		<div class="mb-6">
			<h2 class="mb-3 text-lg font-medium text-gray-900">Sent Blasts</h2>
			<div class="space-y-2">
				{#each [...sentBlasts, ...failedBlasts] as blast}
					<div class="flex items-center gap-3 rounded-xl bg-[#FDFDFD] px-4 py-3 shadow-sm">
						<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full {blast.status === 'SENT' ? 'bg-[#E3F4E1]' : 'bg-[#FDEAEA]'}">
							<Icon icon={blast.status === 'SENT' ? 'mdi:check-circle' : 'mdi:alert-circle'} class="h-4 w-4 {blast.status === 'SENT' ? 'text-[#3CBD2C]' : 'text-[#E53935]'}" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-800">{blast.subject}</p>
							<p class="text-xs text-gray-400">
								{blast.recipientCount} recipients · {formatDate(blast.sentAt || blast.createdAt)}
								{#if blast.openCount > 0}
									<span class="ml-1 text-[#146AEB]">· {blast.openCount} opens</span>
								{/if}
							</p>
						</div>
						<span class="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {getStatusClass(blast.status)}">{blast.status}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Loading -->
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

	<!-- System Messages -->
	<div class="mt-8 border-t border-gray-200 pt-6">
		<h2 class="mb-4 text-xl font-medium text-gray-900">System Messages</h2>
		<div class="space-y-3">
			{#each systemMessages as msg}
				<div class="flex items-center gap-4 rounded-xl bg-[#FDFDFD] px-4 py-3.5 shadow-sm">
					<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style="background-color: {msg.iconBg}">
						<Icon icon={msg.icon} class="h-5 w-5" style="color: {msg.iconColor}" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium text-gray-800">{msg.title}</p>
						<p class="text-xs text-[#B9BABA]">{msg.description}</p>
					</div>
					{#if msg.action === 'toggle'}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div on:click={() => { msg.enabled = !msg.enabled; notifyOnRegistration = msg.enabled; }}
							class="relative h-6 w-10 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300"
							class:bg-gray-300={!msg.enabled} class:bg-[#131517]={msg.enabled}>
							<span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300" class:translate-x-4={msg.enabled}></span>
						</div>
					{:else}
						<button class="flex-shrink-0 rounded-lg bg-[#F0EFF1] px-3 py-1.5 text-xs font-medium text-[#616265] transition hover:bg-[#E4E3E6]">
							{msg.action === 'manage' ? 'Manage' : 'Schedule'}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<SendPostModal bind:open={showSendPostModal} eventTitle={eventTitle} {emailsRemaining} onBlastSent={loadData} />
