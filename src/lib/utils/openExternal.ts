/**
 * M-138 / M-137 — the one place the app opens an external URL.
 *
 * ── M-138: the missing `noopener` ────────────────────────────────────────
 *
 * Five `window.open(externalUrl, '_blank')` calls omitted `noopener`, while the
 * repo did it correctly six other times — so the convention existed and these
 * five were the drift.
 *
 * Without `noopener` the opened page gets a **live `window.opener`** and can
 * navigate the Rondwell tab to a look-alike login (`opener.location = ...`).
 * The user tabs back to what looks like their own session asking them to sign
 * in again. Tokens are in `localStorage` (**C-09**), so the phishing page is
 * worth an attacker's time to build.
 *
 * `noreferrer` goes with it: it also strips the `Referer` header, which would
 * otherwise leak the Rondwell URL — often containing an event or invoice id —
 * to the destination.
 *
 * ── M-137: the scheme check ──────────────────────────────────────────────
 *
 * `noopener` does nothing about `javascript:`. Several of these URLs come from
 * server responses or from organizer-supplied media rows, and
 * `createEventMedia`/`updateEventMedia` accept **any `url` string**. Opening
 * `javascript:...` executes it in this origin, which is stored XSS with a
 * click as the trigger.
 *
 * Only `http:` and `https:` are opened. Everything else is refused and
 * reported, rather than silently doing nothing — a link that does nothing when
 * clicked is a bug report; a link that refuses with a reason is a fixable
 * data problem.
 *
 * ── Why a helper and not five edits ──────────────────────────────────────
 *
 * The task asks for it, and the reason is that five edits fix five call sites
 * while the sixth gets written next month. One call site can be got right once.
 */

export interface OpenExternalResult {
	ok: boolean;
	message?: string;
}

const SAFE_SCHEMES = new Set(['http:', 'https:']);

/**
 * Open `url` in a new tab with `noopener,noreferrer`, if and only if it is a
 * plain web URL.
 *
 * Returns a result rather than throwing so callers can surface a toast; the
 * existing five call sites all already have a place to put a message.
 */
export function openExternal(
	url: string | null | undefined,
	opts?: { onError?: (message: string) => void }
): OpenExternalResult {
	if (!url) {
		const message = 'That link is not available.';
		opts?.onError?.(message);
		return { ok: false, message };
	}

	let parsed: URL;
	try {
		// A relative URL resolves against the current origin, which is what we
		// want for an internal path and is harmless.
		parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : 'https://rondwell.com');
	} catch {
		const message = 'That link is malformed and was not opened.';
		opts?.onError?.(message);
		return { ok: false, message };
	}

	if (!SAFE_SCHEMES.has(parsed.protocol)) {
		// `javascript:`, `data:`, `blob:`, `file:` — refused by name so the log
		// says what happened rather than leaving a dead link.
		const message = `Refused to open a "${parsed.protocol}" link.`;
		// eslint-disable-next-line no-console
		console.warn(`[M-137] refused to open non-web scheme: ${parsed.protocol}`);
		opts?.onError?.(message);
		return { ok: false, message };
	}

	window.open(parsed.href, '_blank', 'noopener,noreferrer');
	return { ok: true };
}
