import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const API_URL = import.meta.env.VITE_API_URL;

/** The providers an organizer can connect for calendar and conferencing. */
export type IntegrationPlatform = 'GOOGLE' | 'ZOOM' | 'OUTLOOK';

export interface IntegrationEntry {
	id: string;
	platform: IntegrationPlatform;
	connectedAt: string;
	expiresAt: string | null;
	scope?: string;
	/** `true` when the stored access token is past its expiry. */
	needsRefresh: boolean;
}

export interface IntegrationsResponse {
	integrations: IntegrationEntry[];
	/**
	 * Which providers this deployment has credentials for.
	 *
	 * Reported by the API so the UI can grey out a provider rather than
	 * offering a button that answers 503 — the OAuth credentials are optional
	 * config, so a given environment may legitimately have only some of them.
	 */
	available: Record<string, boolean>;
}

export async function listIntegrations(): Promise<IntegrationsResponse> {
	const res = await authFetch(`${API_URL}/api/v1/integrations`);
	if (!res.ok) await throwApiError(res, 'Could not load your connected accounts');
	const json = await res.json().catch(() => ({}));
	return {
		integrations: json.integrations ?? [],
		available: json.available ?? {}
	};
}

/**
 * Start a connection flow.
 *
 * Returns the provider's consent URL for the caller to navigate to. The
 * request must be authenticated — that is what binds the `state` the provider
 * will echo back to this user, and it is how the unauthenticated callback
 * later knows whose account to attach the tokens to.
 */
export async function connectIntegration(platform: IntegrationPlatform): Promise<string> {
	const res = await authFetch(`${API_URL}/api/v1/integrations/${platform}/connect`, {
		// `Accept: application/json` matters: the endpoint redirects to the
		// provider when HTML is preferred, and we want the URL, not a 302 that
		// `fetch` would follow into an opaque cross-origin failure.
		headers: { Accept: 'application/json' }
	});
	if (!res.ok) await throwApiError(res, `Could not start the ${platform} connection`);
	const json = await res.json().catch(() => ({}));
	if (!json.url) throw new Error('The server did not return a connection URL.');
	return json.url as string;
}

export async function disconnectIntegration(integrationId: string): Promise<void> {
	const res = await authFetch(`${API_URL}/api/v1/integrations/${integrationId}`, {
		method: 'DELETE'
	});
	// 204 is the success case and carries no body.
	if (!res.ok && res.status !== 204) {
		await throwApiError(res, 'Could not disconnect that account');
	}
}

/** Read a few upcoming items, as proof to the user that the link works. */
export async function syncIntegrationCalendar(integrationId: string): Promise<{
	events?: unknown[];
	meetings?: unknown[];
}> {
	const res = await authFetch(
		`${API_URL}/api/v1/integrations/${integrationId}/sync-calendar`,
		{ method: 'POST' }
	);
	if (!res.ok) await throwApiError(res, 'Could not read that calendar');
	return (await res.json().catch(() => ({}))) as { events?: unknown[]; meetings?: unknown[] };
}
