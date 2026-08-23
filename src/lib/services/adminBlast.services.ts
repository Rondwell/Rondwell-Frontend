/**
 * Platform-wide email / in-app broadcasts (HQ → admin-service).
 *
 * Distinct from the organizer-owned event blast and the collection newsletter:
 * these are sent BY Rondwell to Rondwell's users, so they carry Rondwell
 * branding and draw on no organizer email allowance.
 *
 * Composing is open to any admin; sending is `super_admin` only and enforced
 * server-side — a broadcast reaches the whole user base under the platform's
 * own name.
 */
import { browser } from '$app/environment';
import { throwApiError } from '$lib/utils/errorMessage';

const API_URL = import.meta.env.VITE_API_URL;
const BASE = `${API_URL}/api/v1/admin/blasts`;

export type BlastStatus =
	| 'DRAFT'
	| 'SCHEDULED'
	| 'SENDING'
	| 'SENT'
	| 'PARTIALLY_SENT'
	| 'FAILED'
	| 'CANCELLED';

export type BlastAudience = 'ALL' | 'ORGANIZERS' | 'ATTENDEES' | 'PLUS' | 'CUSTOM';

export interface BlastCta {
	text: string;
	url: string;
	color: string;
	textColor: string;
	style: 'solid' | 'outline';
}

export interface BlastFilters {
	status?: string[];
	joinedAfter?: string | null;
	joinedBefore?: string | null;
	emails?: string[];
	respectOptOut?: boolean;
}

export interface EmailBlast {
	_id: string;
	subject: string;
	heading?: string;
	previewText?: string;
	htmlContent: string;
	excerpt?: string;
	heroImageUrl?: string | null;
	cta?: BlastCta | null;
	audience: BlastAudience;
	filters: BlastFilters;
	channels: { email: boolean; inApp: boolean };
	inAppTitle?: string;
	inAppBody?: string;
	status: BlastStatus;
	scheduledAt?: string | null;
	sentAt?: string | null;
	recipientCount: number;
	publishedCount: number;
	failedCount: number;
	skippedCount: number;
	failureReason?: string | null;
	createdByAdminEmail: string;
	sentByAdminEmail?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface BlastPayload {
	subject: string;
	heading?: string;
	previewText?: string;
	htmlContent: string;
	heroImageUrl?: string | null;
	cta?: BlastCta | null;
	audience: BlastAudience;
	filters?: BlastFilters;
	channels: { email: boolean; inApp: boolean };
	inAppTitle?: string;
	inAppBody?: string;
	scheduledAt?: string | null;
	sendNow?: boolean;
}

export interface AudienceCounts {
	/** Accounts matching the segment. */
	total: number;
	/** Of those, how many have a usable email address. */
	withEmail: number;
	/** Of those with an address, how many opted out of marketing. */
	optedOut: number;
	/**
	 * What will actually be sent — `withEmail` minus `optedOut`. Optional so a
	 * frontend deployed ahead of the API still renders (falling back to
	 * `withEmail`), which is the number the composer used to show.
	 */
	deliverable?: number;
}

function authHeaders(): Headers {
	const headers = new Headers({ 'Content-Type': 'application/json' });
	const token = browser ? localStorage.getItem('admin_token') : null;
	if (!token) throw new Error('Not authenticated');
	headers.set('Authorization', `Bearer ${token}`);
	return headers;
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
	const res = await fetch(`${BASE}${path}`, { ...options, headers: authHeaders() });

	if (res.status === 401 && browser) {
		localStorage.removeItem('admin_token');
		localStorage.removeItem('admin_user');
		window.location.href = '/hq/login';
		throw new Error('Session expired');
	}
	if (!res.ok) await throwApiError(res, 'Request failed');
	return res.json();
}

/**
 * How many people a given audience currently reaches. Called as the composer's
 * filters change so the admin always sees the blast radius before sending.
 */
export async function previewAudience(
	audience: BlastAudience,
	filters: BlastFilters = {}
): Promise<AudienceCounts> {
	const data = await request('/audience/preview', {
		method: 'POST',
		body: JSON.stringify({ audience, filters })
	});
	return data.data;
}

export async function listBlasts(
	params: { page?: number; limit?: number; status?: string } = {}
): Promise<{ blasts: EmailBlast[]; total: number; page: number; totalPages: number }> {
	const query = new URLSearchParams(
		Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '') as [
			string,
			string
		][]
	).toString();
	const data = await request(`/?${query}`);
	return data.data;
}

export async function getBlast(id: string): Promise<EmailBlast> {
	const data = await request(`/${id}`);
	return data.data;
}

export async function createBlast(payload: BlastPayload): Promise<EmailBlast> {
	const data = await request('/', { method: 'POST', body: JSON.stringify(payload) });
	return data.data;
}

export async function updateBlast(id: string, payload: BlastPayload): Promise<EmailBlast> {
	const data = await request(`/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
	return data.data;
}

export async function sendBlast(id: string): Promise<EmailBlast> {
	const data = await request(`/${id}/send`, { method: 'POST', body: '{}' });
	return data.data;
}

/** One copy to a chosen inbox, so the real thing can be checked first. */
export async function sendTestBlast(id: string, email?: string): Promise<string> {
	const data = await request(`/${id}/test`, {
		method: 'POST',
		body: JSON.stringify(email ? { email } : {})
	});
	return data.message;
}

export async function cancelBlast(id: string): Promise<EmailBlast> {
	const data = await request(`/${id}/cancel`, { method: 'POST', body: '{}' });
	return data.data;
}

export async function deleteBlast(id: string): Promise<void> {
	await request(`/${id}`, { method: 'DELETE' });
}

// ── Presentation helpers ─────────────────────────────────────────────────

export const AUDIENCE_OPTIONS: Array<{
	value: BlastAudience;
	label: string;
	description: string;
	color: string;
}> = [
	{
		value: 'ALL',
		label: 'All users',
		description: 'Every active account on the platform',
		color: '#513BE2'
	},
	{
		value: 'ORGANIZERS',
		label: 'Organizers',
		description: 'Accounts that have published at least one event',
		color: '#DB3EC6'
	},
	{
		value: 'ATTENDEES',
		label: 'Attendees only',
		description: 'Accounts that have never published an event',
		color: '#2563EB'
	},
	{
		value: 'PLUS',
		label: 'Rondwell PLUS',
		description: 'Users on a paid subscription',
		color: '#D79917'
	},
	{
		value: 'CUSTOM',
		label: 'Specific emails',
		description: 'Paste an explicit list of addresses',
		color: '#4B5563'
	}
];

export const BLAST_STATUS_STYLES: Record<BlastStatus, { label: string; class: string }> = {
	DRAFT: { label: 'Draft', class: 'bg-gray-100 text-gray-600 ring-gray-200' },
	SCHEDULED: { label: 'Scheduled', class: 'bg-amber-50 text-amber-700 ring-amber-200' },
	SENDING: { label: 'Sending', class: 'bg-blue-50 text-blue-700 ring-blue-200' },
	SENT: { label: 'Sent', class: 'bg-green-50 text-green-700 ring-green-200' },
	PARTIALLY_SENT: { label: 'Partially sent', class: 'bg-orange-50 text-orange-700 ring-orange-200' },
	FAILED: { label: 'Failed', class: 'bg-red-50 text-red-700 ring-red-200' },
	CANCELLED: { label: 'Cancelled', class: 'bg-gray-100 text-gray-500 ring-gray-200' }
};
