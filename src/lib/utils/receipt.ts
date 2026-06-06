/**
 * FE-P4-04 — Receipt link helper.
 *
 * Single helper used by every transaction list (Wallet, earnings, refunds,
 * vendor orders, customer purchases) to fetch a presigned PDF URL on click
 * and open it in a new tab. URLs are short-lived; we always fetch fresh.
 */

import { getReceiptUrl } from '$lib/services/receipt.services';
import { financialErrorMessage } from '$lib/utils/financialErrorCopy';

/**
 * Fetch a presigned receipt URL and open it in a new tab.
 * Returns the URL on success; throws a user-friendly Error on failure.
 *
 * The 60s tooltip ("receipts are generated within 60s of payment") is
 * surfaced by the caller via the `onError` callback when a 404 lands.
 */
export async function openReceipt(
	transactionId: string,
	opts?: { onError?: (msg: string) => void }
): Promise<string | null> {
	try {
		const { url } = await getReceiptUrl(transactionId);
		if (!url) {
			opts?.onError?.(
				'Receipt not yet available. Receipts are generated within 60s of payment — please refresh.'
			);
			return null;
		}
		// Open in a new tab. Use `noopener,noreferrer` per security guidance.
		window.open(url, '_blank', 'noopener,noreferrer');
		return url;
	} catch (err: any) {
		const msg = financialErrorMessage(err);
		opts?.onError?.(
			msg.includes('not yet available') || (err?.status === 404)
				? 'Receipt not yet available. Receipts are generated within 60s of payment — please refresh.'
				: msg
		);
		return null;
	}
}
