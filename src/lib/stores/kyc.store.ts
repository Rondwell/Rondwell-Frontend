/**
 * FE-P2-07 — KYC store.
 *
 * Cached snapshot of the user's KYC tier with a 60-second TTL. The
 * withdraw modal reads this on open to gate the UI without an extra
 * round-trip on every keystroke.
 *
 * Backend reference:
 *   - `services/user/src/api/controllers/KycController.ts:getMyKyc`
 *
 * Refresh paths:
 *   - On login → `loadKyc()`
 *   - After `submitKyc()` resolves → `loadKyc(true)`
 *   - After admin approves/rejects (out-of-band) → user reloads naturally.
 */

import { get, writable } from 'svelte/store';
import { getMyKyc, type MyKyc } from '$lib/services/kyc.services';

const CACHE_TTL_MS = 60_000;

interface KycSnapshot extends Partial<MyKyc> {
	loaded: boolean;
	loadedAt: number;
}

const DEFAULT: KycSnapshot = {
	tier: 'UNVERIFIED',
	status: 'NOT_SUBMITTED',
	loaded: false,
	loadedAt: 0,
};

export const kycStore = writable<KycSnapshot>({ ...DEFAULT });

let inFlight: Promise<void> | null = null;

/**
 * Load (or refresh) the KYC snapshot. Concurrent callers de-dupe on the
 * in-flight promise. Pass `force=true` after a mutation.
 */
export async function loadKyc(force = false): Promise<void> {
	const current = get(kycStore);
	const stale = !current.loaded || Date.now() - current.loadedAt > CACHE_TTL_MS;
	if (!force && !stale) return;
	if (inFlight) return inFlight;
	inFlight = (async () => {
		try {
			const data = await getMyKyc();
			kycStore.set({ ...DEFAULT, ...data, loaded: true, loadedAt: Date.now() });
		} catch (err) {
			console.warn('[kyc.store] loadKyc failed:', (err as any)?.message);
			kycStore.set({ ...DEFAULT, loaded: true, loadedAt: Date.now() });
		} finally {
			inFlight = null;
		}
	})();
	return inFlight;
}

export function resetKyc(): void {
	kycStore.set({ ...DEFAULT });
}
