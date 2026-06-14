import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export interface InviteCollectionAdminPayload {
	email: string;
	role: string;
	displayName?: string;
	permissions?: string[];
	personalMessage?: string;
	showOnCollectionPage?: boolean;
}

/** Owner-only. Lists all admins for a collection. */
export async function getCollectionAdmins(collectionId: string): Promise<any[]> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/admin?_t=${Date.now()}`
	);
	if (!res.ok) await throwApiError(res, 'Failed to fetch collection admins');
	const data = await res.json();
	return data ?? [];
}

/** Owner-only. Invites a co-manager by email. */
export async function inviteCollectionAdmin(
	collectionId: string,
	payload: InviteCollectionAdminPayload
): Promise<any> {
	const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/admin/invite`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) await throwApiError(res, 'Failed to invite admin');
	return res.json();
}

/** Owner-only. Updates role / permissions / page visibility. */
export async function updateCollectionAdminPermissions(
	collectionId: string,
	adminId: string,
	payload: { role?: string; permissions?: string[]; showOnCollectionPage?: boolean }
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/admin/${adminId}/permissions`,
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to update admin');
	return res.json();
}

/** Owner-only. Removes an admin. */
export async function removeCollectionAdmin(collectionId: string, adminId: string): Promise<void> {
	const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/admin/${adminId}`, {
		method: 'DELETE'
	});
	if (!res.ok) await throwApiError(res, 'Failed to remove admin');
}

/** Owner-only. Rotates token and re-emails the invitee. */
export async function resendCollectionAdminInvite(
	collectionId: string,
	adminId: string
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/admin/${adminId}/resend-invite`,
		{ method: 'POST' }
	);
	if (!res.ok) await throwApiError(res, 'Failed to resend invitation');
	return res.json();
}

/**
 * Public — no auth. Returns a sanitized invitation preview for the
 * /collection-admin-invitation/[token] confirmation page. Throws Error with a
 * `code` on 404/409/410 so the page can render the right empty state.
 */
export async function getCollectionAdminInvitation(
	collectionId: string,
	token: string
): Promise<any> {
	const res = await fetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/admin/invitation/${encodeURIComponent(token)}`
	);
	if (!res.ok) {
		const codeByStatus =
			res.status === 404
				? 'NOT_FOUND'
				: res.status === 409
					? 'ALREADY_PROCESSED'
					: res.status === 410
						? 'EXPIRED'
						: 'ERROR';
		try {
			await throwApiError(res, 'Failed to load invitation');
		} catch (err: any) {
			err.code = codeByStatus;
			throw err;
		}
	}
	const data = await res.json().catch(() => ({}));
	return data.data ?? data;
}

/** Auth required. Accepts the invitation, links the userId, marks ACCEPTED. */
export async function acceptCollectionAdminInvite(
	collectionId: string,
	token: string
): Promise<any> {
	const res = await authFetch(
		`${EVENT_URL}/api/v1/collections/${collectionId}/admin/accept-invite`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token })
		}
	);
	if (!res.ok) await throwApiError(res, 'Failed to accept invitation');
	const data = await res.json().catch(() => ({}));
	return data.data ?? data;
}

/** Public — no auth. Declines the invitation by token. */
export async function declineCollectionAdminInvite(
	collectionId: string,
	token: string
): Promise<any> {
	const res = await fetch(`${EVENT_URL}/api/v1/collections/${collectionId}/admin/decline-invite`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token })
	});
	if (!res.ok) await throwApiError(res, 'Failed to decline invitation');
	const data = await res.json().catch(() => ({}));
	return data.data ?? data;
}

/** Loads the public collection-roles catalog from the backend. */
export async function getCollectionAdminRolesCatalog(): Promise<
	Array<{
		value: string;
		label: string;
		description: string;
		icon: string;
		permissions: string[];
		requiresPlus: boolean;
	}>
> {
	try {
		const res = await fetch(`${EVENT_URL}/api/v1/collections/admin/roles`);
		const data = await res.json();
		if (!res.ok) return [];
		return data.data ?? [];
	} catch {
		return [];
	}
}
