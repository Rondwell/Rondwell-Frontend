/**
 * FE-P4-04 (P4-04 / NEW-7.2) — PDF receipts.
 *
 * Backend reference: receipts are uploaded to S3 at `receipts/{transactionId}.pdf`
 * once the gateway settles. The presigned URL endpoint is auth-gated — only
 * the customer (payer) or organizer (recipient) can fetch:
 *
 *   GET /api/v1/payment/receipts/:transactionId/url
 *
 * The response body is `{ url, expiresAt }`. URLs typically expire within 5
 * minutes; the caller should fetch a fresh URL on every download click
 * rather than caching.
 */

import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface ReceiptPresignedUrl {
	url: string;
	expiresAt?: string | null;
}

export async function getReceiptUrl(transactionId: string): Promise<ReceiptPresignedUrl> {
	const res = await authFetch(`${BASE_URL}/api/v1/payment/receipts/${transactionId}/url`);
	if (!res.ok) await throwApiError(res, 'Receipt not yet available');
	const data = await res.json();
	const d = data?.data ?? data ?? {};
	return { url: d.url ?? '', expiresAt: d.expiresAt ?? null };
}
