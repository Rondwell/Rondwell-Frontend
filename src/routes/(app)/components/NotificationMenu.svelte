<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import {
		listNotifications,
		markNotificationRead,
		markAllNotificationsRead,
		type InAppNotification
	} from '$lib/services/notification.services';
	import { unreadCount, refreshUnreadCount, decrementUnread, resetUnread } from '$lib/stores/notifications.store';

	export let showMenu = false;
	export let className = 'fixed bottom-24 left-30 hidden md:block';

	let items: InAppNotification[] = [];
	let loading = false;
	let error = '';
	let markingAll = false;

	// Reload whenever the menu is opened.
	$: if (showMenu) loadFirstPage();

	async function loadFirstPage() {
		if (!$isAuthenticated) return;
		loading = true;
		error = '';
		try {
			const res = await listNotifications({ page: 1, limit: 12 });
			items = res.items;
			unreadCount.set(res.unreadCount);
		} catch (e: any) {
			error = e?.message ?? 'Failed to load notifications';
		} finally {
			loading = false;
		}
	}

	function onClose() {
		showMenu = false;
	}

	async function handleClick(n: InAppNotification) {
		if (!n.read) {
			items = items.map((it) => (it._id === n._id ? { ...it, read: true } : it));
			decrementUnread();
			markNotificationRead(n._id).catch(() => refreshUnreadCount());
		}
		onClose();
		if (n.link) {
			if (n.link.startsWith('http')) {
				try {
					const url = new URL(n.link);
					if (url.origin === window.location.origin) goto(url.pathname + url.search);
					else window.open(n.link, '_blank', 'noopener');
				} catch {
					/* ignore malformed link */
				}
			} else {
				goto(n.link);
			}
		}
	}

	async function handleMarkAll() {
		markingAll = true;
		try {
			await markAllNotificationsRead();
			items = items.map((it) => ({ ...it, read: true }));
			resetUnread();
		} catch {
			/* ignore */
		} finally {
			markingAll = false;
		}
	}

	function relativeTime(iso: string): string {
		const then = new Date(iso).getTime();
		const diff = Date.now() - then;
		const m = Math.floor(diff / 60000);
		if (m < 1) return 'Just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		const d = Math.floor(h / 24);
		if (d < 7) return `${d}d ago`;
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const CATEGORY_FALLBACK_ICON: Record<string, string> = {
		security: 'mdi:shield-lock-outline',
		event: 'mdi:calendar-outline',
		ticket: 'mdi:ticket-outline',
		wallet: 'mdi:wallet-outline',
		payout: 'mdi:bank-outline',
		subscription: 'mdi:star-outline',
		kyc: 'mdi:card-account-details-outline',
		collaboration: 'mdi:handshake-outline',
		product: 'mdi:package-variant-closed',
		admin: 'mdi:shield-account-outline',
		system: 'mdi:bell-outline',
		marketing: 'mdi:bullhorn-outline'
	};

	function iconFor(n: InAppNotification): string {
		return n.icon || CATEGORY_FALLBACK_ICON[n.category] || 'mdi:bell-outline';
	}
</script>

{#if showMenu}
	<div
		class="fixed inset-0 z-20 bg-black/10 backdrop-blur-[2px]"
		on:click={onClose}
		on:keydown={(e) => e.key === 'Escape' && onClose()}
		role="button"
		tabindex="-1"
		aria-label="Close notifications"
	></div>

	<div
		class="triangle bg custom-scrollbar z-30 flex max-h-[540px] w-83 flex-col overflow-hidden rounded-xl text-sm md:w-90 {className}"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-200/70 px-5 py-3">
			<div class="flex items-center gap-2">
				<span class="font-semibold">Notifications</span>
				{#if $unreadCount > 0}
					<span class="rounded-full bg-[#513BE2] px-2 py-0.5 text-xs font-semibold text-white">
						{$unreadCount}
					</span>
				{/if}
			</div>
			{#if $unreadCount > 0}
				<button
					on:click={handleMarkAll}
					disabled={markingAll}
					class="text-xs font-medium text-[#513BE2] hover:underline disabled:opacity-50"
				>
					{markingAll ? '...' : 'Mark all read'}
				</button>
			{/if}
		</div>

		<!-- Body -->
		<div class="custom-scrollbar flex-1 overflow-y-auto">
			{#if !$isAuthenticated}
				<div class="px-5 py-10 text-center text-xs text-gray-400">Sign in to view notifications.</div>
			{:else if loading}
				<div class="px-5 py-10 text-center text-xs text-gray-400">Loading…</div>
			{:else if error}
				<div class="px-5 py-10 text-center text-xs text-red-500">{error}</div>
			{:else if items.length === 0}
				<div class="flex flex-col items-center gap-2 px-5 py-12 text-center">
					<Icon icon="mdi:bell-sleep-outline" class="text-3xl text-gray-300" />
					<p class="text-sm font-medium text-gray-600">You're all caught up</p>
					<p class="text-xs text-gray-400">New notifications will show up here.</p>
				</div>
			{:else}
				<ul class="divide-y divide-gray-100">
					{#each items as n (n._id)}
						<li>
							<button
								on:click={() => handleClick(n)}
								class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 {n.read ? '' : 'bg-[#F3F1FF]'}"
							>
								<div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
									<Icon icon={iconFor(n)} class="text-lg text-[#513BE2]" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between gap-2">
										<p class="truncate text-sm font-medium text-gray-800">{n.title}</p>
										{#if !n.read}
											<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#513BE2]"></span>
										{/if}
									</div>
									<p class="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</p>
									<p class="mt-1 text-[11px] text-gray-400">{relativeTime(n.createdAt)}</p>
								</div>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Footer -->
		<div class="border-t border-gray-200/70 p-2">
			<button
				on:click={() => {
					onClose();
					goto('/notifications');
				}}
				class="flex h-[36px] w-full items-center justify-center gap-2 rounded-sm bg-[#EBECED] text-center text-sm hover:bg-gray-200"
			>
				View all notifications
			</button>
		</div>
	</div>
{/if}

<style>
	.bg {
		background: #f4f5f6;
		box-shadow: 0px 0px 80px rgba(0, 0, 0, 0.08);
		border-radius: 8px;
	}
	@media (min-width: 739px) {
		.triangle::before {
			content: '';
			position: absolute;
			left: -18px;
			bottom: 16px;
			border-width: 8px;
			border-style: solid;
			border-color: transparent #f8f8f8 transparent transparent;
		}
		.triangle::after {
			content: '';
			position: absolute;
			left: -18px;
			bottom: 16px;
			border-width: 8px;
			border-style: solid;
			border-color: transparent rgba(0, 0, 0, 0.08) transparent transparent;
			z-index: -1;
		}
	}
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
