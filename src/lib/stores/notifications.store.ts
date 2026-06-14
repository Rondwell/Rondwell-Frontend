import { writable } from 'svelte/store';
import { getUnreadCount } from '$lib/services/notification.services';

/** Unread in-app notification count, surfaced on the bell badge. */
export const unreadCount = writable<number>(0);

let pollTimer: ReturnType<typeof setInterval> | null = null;

/** Fetch the latest unread count (best-effort — never throws). */
export async function refreshUnreadCount(): Promise<void> {
  try {
    const count = await getUnreadCount();
    unreadCount.set(count);
  } catch {
    /* not signed in / transient — leave previous value */
  }
}

/** Start background polling for the unread count. Idempotent. */
export function startUnreadPolling(intervalMs = 60_000): void {
  if (pollTimer) return;
  void refreshUnreadCount();
  pollTimer = setInterval(refreshUnreadCount, intervalMs);
}

export function stopUnreadPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** Optimistically decrement (e.g. after marking one read). */
export function decrementUnread(by = 1): void {
  unreadCount.update((n) => Math.max(0, n - by));
}

export function resetUnread(): void {
  unreadCount.set(0);
}
