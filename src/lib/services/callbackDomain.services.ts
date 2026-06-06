/**
 * FE-P1-15 (FA-10.3) — Custom callback domains service.
 *
 * Backend reference:
 *   - `services/user/src/api/controllers/organizerCallbackDomain.controller.ts`
 *   - Routes mounted at `/api/v1/profile/organizer/callback-domains`
 *
 * Flow:
 *   1. Add a domain — server returns the TXT record to publish
 *      (`_rondwell-verify.<domain>` with the challenge token as value).
 *   2. User publishes the TXT record at their DNS provider.
 *   3. User clicks Verify — server resolves the record and flips
 *      `verified=true` if it matches.
 *   4. Payment service's callback allow-list is automatically extended via
 *      RPC for any verified domain owned by an organizer.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;
const ROUTE = `${BASE_URL}/api/v1/profile/organizer/callback-domains`;

export interface CallbackDomainEntry {
	domain: string;
	verified: boolean;
	challengeIssuedAt?: string | null;
	verifiedAt?: string | null;
	challengeToken?: string | null;
}

export interface AddCallbackDomainResponse {
	domain: string;
	verified: boolean;
	challengeToken: string;
	dnsRecord: { name: string; type: 'TXT'; value: string };
}

export async function listCallbackDomains(): Promise<CallbackDomainEntry[]> {
	const res = await authFetch(ROUTE);
	if (!res.ok) await throwApiError(res, 'Failed to load custom domains');
	const data = await res.json();
	const items = data?.data ?? [];
	return Array.isArray(items) ? items : [];
}

export async function addCallbackDomain(domain: string): Promise<AddCallbackDomainResponse> {
	const res = await authFetch(ROUTE, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ domain }),
	});
	if (!res.ok) await throwApiError(res, 'Failed to add domain');
	const data = await res.json();
	return data?.data;
}

export async function verifyCallbackDomain(domain: string): Promise<CallbackDomainEntry> {
	const res = await authFetch(`${ROUTE}/${encodeURIComponent(domain)}/verify`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
	if (!res.ok) await throwApiError(res, 'Verification failed — DNS record not found yet');
	const data = await res.json();
	return data?.data;
}

export async function removeCallbackDomain(domain: string): Promise<void> {
	const res = await authFetch(`${ROUTE}/${encodeURIComponent(domain)}`, {
		method: 'DELETE',
	});
	if (!res.ok) await throwApiError(res, 'Failed to remove domain');
}

/**
 * Inline validator for the "Add domain" form. Mirrors the server-side
 * checks: lowercased hostname, no scheme, no path, no port, no userinfo,
 * no rondwell.com (reserved), and at least one dot.
 */
export function validateCallbackDomain(input: string): string | null {
	const trimmed = (input || '').trim().toLowerCase();
	if (!trimmed) return 'Enter a domain';
	if (trimmed.includes('://')) return 'Enter only the hostname (no http://)';
	if (trimmed.includes('/')) return 'Hostnames don\'t contain a path';
	if (trimmed.includes('@')) return 'Hostnames don\'t contain @';
	if (trimmed.includes(':')) return 'Hostnames don\'t contain a port';
	if (!/^[a-z0-9.-]+$/.test(trimmed)) return 'Use letters, numbers, dots, and hyphens only';
	if (!trimmed.includes('.')) return 'Enter a full hostname like events.example.com';
	if (trimmed === 'rondwell.com' || trimmed.endsWith('.rondwell.com')) {
		return 'rondwell.com is already trusted — no need to add it';
	}
	if (trimmed.startsWith('localhost')) return 'localhost is not allowed in production';
	if (trimmed.length > 253) return 'Hostname is too long';
	return null;
}
