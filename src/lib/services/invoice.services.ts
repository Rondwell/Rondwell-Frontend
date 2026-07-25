import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

const PAYMENT_URL = import.meta.env.VITE_PAYMENT_API_URL || import.meta.env.VITE_API_URL;

/**
 * Get a short-lived presigned URL for a collaboration's downloadable INVOICE PDF.
 * The notification service renders + stores it when the invoice is issued.
 */
export async function getInvoicePdfUrl(collaborationId: string, invoiceNumber: string): Promise<string> {
	const res = await authFetch(
		`${PAYMENT_URL}/api/v1/payment/receipts/invoice/${encodeURIComponent(collaborationId)}/${encodeURIComponent(invoiceNumber)}/url`,
	);
	if (!res.ok) await throwApiError(res, 'Invoice not available yet');
	const data = await res.json();
	return data?.data?.url;
}

/** Get a presigned URL for a transaction's RECEIPT PDF (post-payment). */
export async function getReceiptPdfUrl(transactionId: string): Promise<string> {
	const res = await authFetch(`${PAYMENT_URL}/api/v1/payment/receipts/${encodeURIComponent(transactionId)}/url`);
	if (!res.ok) await throwApiError(res, 'Receipt not available yet');
	const data = await res.json();
	return data?.data?.url;
}

/** Open the invoice PDF in a new tab. Returns false + reason on failure. */
export async function downloadInvoice(collaborationId: string, invoiceNumber: string): Promise<{ ok: boolean; message?: string }> {
	try {
		const url = await getInvoicePdfUrl(collaborationId, invoiceNumber);
		if (!url) return { ok: false, message: 'Invoice not available yet' };
		window.open(url, '_blank');
		return { ok: true };
	} catch (e: any) {
		return { ok: false, message: e?.message || 'Invoice not available yet — try again shortly' };
	}
}

/** Open the receipt PDF in a new tab. */
export async function downloadReceipt(transactionId: string): Promise<{ ok: boolean; message?: string }> {
	try {
		const url = await getReceiptPdfUrl(transactionId);
		if (!url) return { ok: false, message: 'Receipt not available yet' };
		window.open(url, '_blank');
		return { ok: true };
	} catch (e: any) {
		return { ok: false, message: e?.message || 'Receipt not available yet — try again shortly' };
	}
}
