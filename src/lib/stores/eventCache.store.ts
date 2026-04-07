/**
 * Event Data Cache Store
 * 
 * Caches event data and collections at the event-level so tab navigation
 * (Overview, Attendees, Registration, etc.) is instant. Data is only
 * re-fetched when stale (default: 5 minutes) or explicitly invalidated.
 * 
 * Usage in pages:
 *   const { event, collections, loading, error } = getEventCache(eventId);
 *   // These are reactive stores — use $event, $loading, etc. in templates
 * 
 * After mutations (update, publish, etc.):
 *   invalidateEventCache(eventId);  // forces next access to re-fetch
 */

import { getEventById, getMyCollections } from '$lib/services/event.services';
import { get, writable, type Writable } from 'svelte/store';

const STALE_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  event: Writable<any>;
  collections: Writable<any[]>;
  loading: Writable<boolean>;
  error: Writable<string>;
  fetchedAt: number;
  promise: Promise<void> | null;
}

const cache = new Map<string, CacheEntry>();

function createEntry(): CacheEntry {
  return {
    event: writable(null),
    collections: writable([]),
    loading: writable(true),
    error: writable(''),
    fetchedAt: 0,
    promise: null,
  };
}

function isStale(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt > STALE_MS;
}

async function fetchAndPopulate(eventId: string, entry: CacheEntry, showLoading = true): Promise<void> {
  if (showLoading) {
    entry.loading.set(true);
  }
  entry.error.set('');
  try {
    const [event, collections] = await Promise.all([
      getEventById(eventId),
      getMyCollections().catch(() => []),
    ]);
    entry.event.set(event);
    entry.collections.set(collections);
    entry.fetchedAt = Date.now();
  } catch (e: any) {
    entry.error.set(e.message ?? 'Failed to load event');
  } finally {
    entry.loading.set(false);
    entry.promise = null;
  }
}

/**
 * Get cached event data stores for a given eventId.
 * Triggers a fetch only if data is missing or stale.
 * Returns reactive Svelte stores.
 */
export function getEventCache(eventId: string) {
  let entry = cache.get(eventId);

  if (!entry) {
    entry = createEntry();
    cache.set(eventId, entry);
  }

  // Fetch if no data yet or stale
  const hasData = get(entry.event) !== null;
  if (!hasData || isStale(entry)) {
    // If already fetching, don't duplicate
    if (!entry.promise) {
      if (hasData) {
        // Stale data: refresh in background without showing loading skeleton
        entry.loading.set(false);
        entry.promise = fetchAndPopulate(eventId, entry, false);
      } else {
        // No data: show loading skeleton
        entry.promise = fetchAndPopulate(eventId, entry, true);
      }
    }
  }

  return {
    event: entry.event,
    collections: entry.collections,
    loading: entry.loading,
    error: entry.error,
  };
}

/**
 * Force invalidate cache for an event. Next getEventCache() call will re-fetch.
 */
export function invalidateEventCache(eventId: string) {
  const entry = cache.get(eventId);
  if (entry) {
    entry.fetchedAt = 0;
    entry.promise = null;
  }
}

/**
 * Update the cached event data directly (optimistic update after mutations).
 * Avoids a full re-fetch when you already have the updated data.
 */
export function updateEventCache(eventId: string, updater: (event: any) => any) {
  const entry = cache.get(eventId);
  if (entry) {
    const current = get(entry.event);
    if (current) {
      entry.event.set(updater(current));
      entry.fetchedAt = Date.now(); // reset staleness
    }
  }
}

/**
 * Clear all cached event data (e.g., on logout).
 */
export function clearEventCache() {
  cache.clear();
}
