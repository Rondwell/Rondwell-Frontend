/**
 * Cleans up verbose backend error messages (e.g. Mongoose validation errors)
 * into short, user-friendly messages suitable for toast notifications.
 */
export function cleanErrorMessage(msg: string): string {
	if (!msg) return 'Something went wrong. Please try again.';
	// Clean up verbose Mongoose/backend validation errors
	if (msg.toLowerCase().includes('validation failed')) {
		const parts = msg.split(':').slice(1).join(':').trim();
		const fields = parts.split(',').map(p => {
			const match = p.match(/`(\w+)`\s+is required/i);
			if (match) return match[1].replace(/([A-Z])/g, ' $1').trim();
			const pathMatch = p.match(/Path\s+`([^`]+)`/i);
			if (pathMatch) return pathMatch[1].split('.').pop()?.replace(/([A-Z])/g, ' $1').trim();
			return null;
		}).filter(Boolean);
		if (fields.length > 0) return `Missing required fields: ${fields.join(', ')}`;
		return 'Please fill in all required fields.';
	}
	// Truncate overly long messages
	if (msg.length > 120) return msg.slice(0, 120) + '...';
	return msg;
}

/**
 * Extract the human-readable error message from a backend response body,
 * regardless of the shape. The event service uses two different shapes:
 *
 *   - Production: { success: false, message: "...", error: ... }
 *   - Development: { success: false, error: { name, message, status, ... } }
 *
 * It also handles ResponseUtils-style envelopes ({ success, data, message }).
 * Falls back to a sensible default if nothing usable is found.
 */
export function extractApiErrorMessage(data: any, fallback: string): string {
	if (!data || typeof data !== 'object') return fallback;
	if (typeof data.message === 'string' && data.message.trim()) return data.message;
	if (data.error && typeof data.error === 'object') {
		if (typeof data.error.message === 'string' && data.error.message.trim()) return data.error.message;
		if (typeof data.error.name === 'string' && data.error.name.trim()) return data.error.name;
	}
	if (typeof data.error === 'string' && data.error.trim()) return data.error;
	if (data.data && typeof data.data === 'object') {
		if (typeof data.data.message === 'string' && data.data.message.trim()) return data.data.message;
	}
	return fallback;
}

/**
 * Map an HTTP status to a friendlier toast message when the body doesn't
 * carry one. Useful for permission-related failures where the user just
 * needs to know "you can't do this" rather than seeing a raw stack trace.
 */
export function statusToFriendlyMessage(status: number, fallback: string): string {
	switch (status) {
		case 401:
			return 'Your session has expired. Please log in again.';
		case 403:
			return "You don't have permission to perform this action.";
		case 404:
			return 'We couldn’t find what you were looking for.';
		case 409:
			return 'This conflicts with an existing record.';
		case 410:
			return 'This invitation has expired.';
		case 429:
			return 'Too many requests. Please wait a moment and try again.';
		case 500:
		case 502:
		case 503:
		case 504:
			return 'Something went wrong on our end. Please try again shortly.';
		default:
			return fallback;
	}
}

/**
 * Throws an Error with status, code, and message extracted from the response body.
 * Use this in client functions to standardize error handling so toasts surface
 * the real backend reason instead of a generic fallback.
 *
 * Usage:
 *   const res = await authFetch(url);
 *   if (!res.ok) await throwApiError(res, 'Failed to do thing');
 *
 * The thrown Error will have:
 *   - message: from data.message → data.error.message → status-based fallback → caller fallback
 *   - status: HTTP status (number)
 *   - code: response 'code' field if backend provided one (e.g. 'PLUS_REQUIRED')
 *   - data: full parsed body for callers that need more context
 */
export async function throwApiError(res: Response, fallback: string): Promise<never> {
	const data = await res.json().catch(() => ({}));
	const message =
		extractApiErrorMessage(data, '') ||
		statusToFriendlyMessage(res.status, fallback);
	const err = new Error(message) as Error & {
		status?: number;
		code?: string;
		data?: any;
	};
	err.status = res.status;
	err.code = data?.code || data?.error?.code || undefined;
	err.data = data;
	throw err;
}

/**
 * Build a fully-baked Error from a non-OK fetch Response. Reads the body,
 * extracts the message via the rules above, and falls back to a status-
 * driven friendly message when the body is empty or unhelpful.
 *
 * The returned Error carries `.status` (HTTP code) so callers that want
 * to branch on it (e.g. show a confirmation modal on 409) can.
 *
 * Usage:
 *   if (!res.ok) throw await apiError(res, 'Failed to delete event');
 *
 * Replaces the 4-line pattern:
 *   if (!res.ok) {
 *     const data = await res.json().catch(() => ({}));
 *     throw new Error(data.message ?? 'Failed to delete event');
 *   }
 */
export async function apiError(res: Response, fallback: string): Promise<Error> {
	const data = await res.json().catch(() => ({} as any));
	const message =
		extractApiErrorMessage(data, '') ||
		statusToFriendlyMessage(res.status, fallback);
	const err = new Error(message);
	(err as any).status = res.status;
	(err as any).body = data;
	return err;
}
