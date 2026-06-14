<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import {
		listNotifications,
		markNotificationRead,
		markAllNotificationsRead,
		deleteNotification,
		type InAppNotification
	} from '$lib/services/notification.services';
	import { unreadCount, refreshUnreadCount, decrementUnread, resetUnread } from '$lib/stores/notifications.store';

	let items: InAppNotification[] = [];
	let loading = true;
	let loadingMore = false;
	let error = '';
	let page = 1;
	let pages = 1;
	let total = 0;
	let filter: 'all' | 'unread' = 'all';
	let markingAll = false;
	let busyId = '';

	async function load(reset = true) {
		if (reset) {
			loading = true;
			page = 1;
		} else {
			loadingMore = true;
		}
		error = '';
		try {
			const res = await listNotifications({
				page,
				limit: 20,
				unreadOnly: filter === 'unread'
			});
			items = reset ? res.items : [...items, ...res.items];
			pages = res.pages;
			total = res.total;
			unreadCount.set(res.unreadCount);
		} catch (e: any) {
			error = e?.message ?? 'Failed to load notifications';
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	function setFilter(f: 'all' | 'unread') {
		if (filter === f) return;
		filter = f;
		load(true);
	}

	async function loadMore() {
		if (page >= pages) return;
		page += 1;
		await load(false);
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
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	async function handleClick(n: InAppNotification) {
		if (!n.read) {
			items = items.map((it) => (it._id === n._id ? { ...it, read: true } : it));
			decrementUnread();
			markNotificationRead(n._id).catch(() => refreshUnreadCount());
			if (filter === 'unread') items = items.filter((it) => it._id !== n._id);
		}
		if (n.link) {
			if (n.link.startsWith('http')) {
				try {
					const url = new URL(n.link);
					if (url.origin === window.location.origin) goto(url.pathname + url.search);
					else window.open(n.link, '_blank', 'noopener');
				} catch {
					/* ignore */
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
			items = filter === 'unread' ? [] : items.map((it) => ({ ...it, read: true }));
			resetUnread();
		} catch {
			/* ignore */
		} finally {
			markingAll = false;
		}
	}

	async function handleDelete(n: InAppNotification, e: Event) {
		e.stopPropagation();
		busyId = n._id;
		try {
			await deleteNotification(n._id);
			items = items.filter((it) => it._id !== n._id);
			total = Math.max(0, total - 1);
			if (!n.read) decrementUnread();
		} catch {
			/* ignore */
		} finally {
			busyId = '';
		}
	}

	onMount(() => load(true));
</script>

<div class="mx-auto w-full max-w-3xl">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Notifications</h1>
			<p class="text-sm text-[#8C8F93]">Stay on top of activity across your events and account.</p>
		</div>
		{#if $unreadCount > 0}
			<button
				on:click={handleMarkAll}
				disabled={markingAll}
				class="rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
			>
				{markingAll ? 'Marking…' : 'Mark all as read'}
			</button>
		{/if}
	</div>

	<!-- Filter tabs -->
	<div class="mb-4 flex items-center gap-2">
		<button
			on:click={() => setFilter('all')}
			class="rounded-full px-4 py-1.5 text-sm font-medium transition {filter === 'all' ? 'bg-[#513BE2] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}"
		>
			All
		</button>
		<button
			on:click={() => setFilter('unread')}
			class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition {filter === 'unread' ? 'bg-[#513BE2] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}"
		>
			Unread
			{#if $unreadCount > 0}
				<span class="rounded-full bg-[#DB3EC6] px-1.5 text-[11px] font-semibold text-white">{$unreadCount}</span>
			{/if}
		</button>
	</div>

	<div class="rounded-xl bg-white shadow-sm">
		{#if loading}
			<div class="py-16 text-center text-sm text-gray-400">Loading…</div>
		{:else if error}
			<div class="py-16 text-center text-sm text-red-500">{error}</div>
		{:else if items.length === 0}
			<div class="flex flex-col items-center gap-2 py-20 text-center">
				<Icon icon="mdi:bell-sleep-outline" class="text-4xl text-gray-300" />
				<p class="text-base font-medium text-gray-600">
					{filter === 'unread' ? 'No unread notifications' : "You're all caught up"}
				</p>
				<p class="text-sm text-gray-400">New notifications will show up here.</p>
			</div>
		{:else}
			<ul class="divide-y divide-gray-100">
				{#each items as n (n._id)}
					<li>
						<div
							on:click={() => handleClick(n)}
							on:keydown={(e) => e.key === 'Enter' && handleClick(n)}
							role="button"
							tabindex="0"
							class="group flex items-start gap-3 px-4 py-4 transition hover:bg-gray-50 {n.read ? '' : 'bg-[#F3F1FF]'}"
						>
							<div class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
								<Icon icon={iconFor(n)} class="text-xl text-[#513BE2]" />
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-2">
									<p class="text-sm font-semibold text-gray-800">{n.title}</p>
									{#if !n.read}
										<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#513BE2]"></span>
									{/if}
								</div>
								<p class="mt-0.5 text-sm text-gray-500">{n.body}</p>
								<div class="mt-1.5 flex items-center gap-3">
									<span class="text-xs text-gray-400">{relativeTime(n.createdAt)}</span>
									<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] capitalize text-gray-500">{n.category}</span>
								</div>
							</div>
							<button
								on:click={(e) => handleDelete(n, e)}
								disabled={busyId === n._id}
								class="ml-2 shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 disabled:opacity-50"
								aria-label="Delete notification"
							>
								<Icon icon="mdi:trash-can-outline" class="text-lg" />
							</button>
						</div>
					</li>
				{/each}
			</ul>

			{#if page < pages}
				<div class="border-t border-gray-100 p-3 text-center">
					<button
						on:click={loadMore}
						disabled={loadingMore}
						class="rounded-md bg-[#EBECED] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
					>
						{loadingMore ? 'Loading…' : 'Load more'}
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
