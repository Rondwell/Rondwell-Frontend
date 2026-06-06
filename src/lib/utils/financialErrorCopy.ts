/**
 * CC-1 — Centralised structured error code → user copy registry.
 *
 * Backend reference: every Phase 2 endpoint now returns
 * `{ status, code, message, meta? }` for 4xx errors. This module maps each
 * `code` to specific copy so the FE never falls back to a generic
 * "Something went wrong" toast.
 *
 * Usage:
 *   const copy = mapFinancialError(err);
 *   toast.error(copy.body, { title: copy.title });
 *
 * The `err` argument can be:
 *   - An Error thrown by `throwApiError` (carrying `.code`, `.status`, `.data`).
 *   - A plain `{ code, message, meta }` object pulled off a fetch body.
 *   - A bare string (treated as the message; falls through to the default).
 */

export type ErrorSeverity = 'info' | 'warn' | 'error';

export interface FinancialErrorCopy {
	/** Short, headline-style copy for the error toast or banner. */
	title: string;
	/** Longer body explaining what happened and how to recover. */
	body: string;
	/** Optional CTA label. The href is derived from `cta` below. */
	cta?: string;
	/** Optional href for the CTA. */
	ctaHref?: string;
	/** Severity drives the toast color / icon. */
	severity: ErrorSeverity;
}

interface ErrorContext {
	code?: string | null;
	message?: string | null;
	meta?: Record<string, any> | null;
	status?: number | null;
}

/**
 * Unwrap whatever shape the caller has (Error, plain object, string) to a
 * normalised `ErrorContext`.
 */
function normalise(err: any): ErrorContext {
	if (!err) return {};
	if (typeof err === 'string') return { message: err };
	const code = err.code ?? err.data?.code ?? err.body?.code ?? null;
	const message = err.message ?? err.data?.message ?? err.body?.message ?? null;
	const meta = err.meta ?? err.data?.meta ?? err.body?.meta ?? null;
	const status = err.status ?? err.data?.status ?? null;
	return { code, message, meta, status };
}

/**
 * Format a kobo amount as a major-unit string for inline use in copy.
 * Doesn't import `formatMoney` to avoid circular dependencies; the rough
 * NGN format is enough for error copy ("₦5,000,000").
 */
function fmtKobo(kobo?: number | null, currency = 'NGN'): string {
	if (kobo == null) return '';
	const major = Number(kobo) / 100;
	const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '₦';
	return `${sym}${major.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso?: string | null): string {
	if (!iso) return 'soon';
	try {
		return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	} catch {
		return iso;
	}
}

const REGISTRY: Record<string, (ctx: ErrorContext) => FinancialErrorCopy> = {
	// ─── Inventory / sales window ─────────────────────────────────────────
	SOLD_OUT: () => ({
		title: 'Sold out',
		body: 'This ticket type just sold out. Pick another one.',
		severity: 'warn',
	}),
	OUT_OF_STOCK: () => ({
		title: 'Out of stock',
		body: 'This product is no longer available. Browse similar options.',
		severity: 'warn',
	}),
	SEAT_UNAVAILABLE: () => ({
		title: 'Seat taken',
		body: 'Someone else just picked that seat. Choose another.',
		severity: 'warn',
	}),
	SALES_NOT_OPEN: ({ meta }) => ({
		title: 'Sales not open yet',
		body: meta?.salesStartDate
			? `Sales open on ${fmtDate(meta.salesStartDate)}. Set a reminder?`
			: 'Sales for this ticket type haven\'t opened yet.',
		severity: 'info',
	}),
	SALES_CLOSED: ({ meta }) => ({
		title: 'Sales closed',
		body: meta?.salesEndDate
			? `Sales for this ticket type ended ${fmtDate(meta.salesEndDate)}.`
			: 'Sales for this ticket type have ended.',
		severity: 'warn',
	}),

	// ─── KYC ──────────────────────────────────────────────────────────────
	KYC_REQUIRED: () => ({
		title: 'Identity verification required',
		body: 'Verify your identity to enable withdrawals. It only takes a few minutes.',
		cta: 'Start verification',
		ctaHref: '/account/kyc/start',
		severity: 'warn',
	}),
	KYC_REJECTED: ({ meta }) => ({
		title: 'KYC rejected',
		body: meta?.reason
			? `Your verification was rejected: ${meta.reason}. Resubmit with corrected details.`
			: 'Your verification was rejected. Resubmit with corrected details.',
		cta: 'Resubmit',
		ctaHref: '/account/kyc/start',
		severity: 'error',
	}),
	DAILY_LIMIT_EXCEEDED: ({ meta }) => ({
		title: 'Daily limit reached',
		body: meta?.limitKobo
			? `You've reached your daily withdrawal limit of ${fmtKobo(meta.limitKobo, meta.currency)}. Upgrade to full KYC to remove the limit.`
			: 'You\'ve reached your daily withdrawal limit. Upgrade to full KYC to remove the limit.',
		cta: 'Upgrade KYC',
		ctaHref: '/account/kyc/start',
		severity: 'warn',
	}),

	// ─── AML ──────────────────────────────────────────────────────────────
	AML_REVIEW_REQUIRED: () => ({
		title: 'Compliance review',
		body: 'Withdrawals over the threshold require compliance review. We\'ll email you when approved (typically within 24h).',
		severity: 'info',
	}),
	ACCOUNT_LOCKED_AML: () => ({
		title: 'Account temporarily locked',
		body: 'Withdrawals are temporarily disabled while we review recent activity. Our compliance team will contact you within 24h.',
		severity: 'error',
	}),
	AML_VELOCITY_LOCKED: () => ({
		title: 'Velocity check triggered',
		body: 'Account locked pending compliance review of recent activity. Contact support if urgent.',
		severity: 'error',
	}),
	AML_ACCOUNT_LOCKED: () => ({
		title: 'Account locked',
		body: 'Account locked pending compliance review. Contact support for assistance.',
		severity: 'error',
	}),
	AML_CHECK_UNAVAILABLE: () => ({
		title: 'Check unavailable',
		body: 'Compliance check temporarily unavailable. Please try again shortly.',
		severity: 'warn',
	}),

	// ─── PIN / OTP ────────────────────────────────────────────────────────
	PIN_REQUIRED: () => ({
		title: 'PIN required',
		body: 'Enter your wallet PIN to authorise this withdrawal.',
		severity: 'warn',
	}),
	INVALID_PIN: ({ meta }) => ({
		title: 'PIN incorrect',
		body: typeof meta?.triesLeft === 'number'
			? `${meta.triesLeft} attempt${meta.triesLeft === 1 ? '' : 's'} remaining before lockout.`
			: 'Check your PIN and try again.',
		severity: 'error',
	}),
	PIN_LOCKED: () => ({
		title: 'PIN locked',
		body: 'Your PIN is temporarily locked. Reset it in Settings → Security.',
		cta: 'Reset PIN',
		ctaHref: '/settings?tab=security',
		severity: 'error',
	}),
	OTP_REQUEST_RATE_LIMIT: () => ({
		title: 'Too many OTP requests',
		body: 'Try again in an hour.',
		severity: 'warn',
	}),
	OTP_VERIFY_RATE_LIMIT: () => ({
		title: 'Too many OTP attempts',
		body: 'Try again in an hour.',
		severity: 'warn',
	}),
	NO_OTP: () => ({
		title: 'No active OTP',
		body: 'Request a new OTP to continue.',
		severity: 'warn',
	}),
	EXPIRED: () => ({
		title: 'OTP expired',
		body: 'This OTP has expired. Request a new one.',
		severity: 'warn',
	}),
	LOCKED: () => ({
		title: 'OTP locked',
		body: 'Too many wrong OTPs. Request a new code in 30 minutes.',
		severity: 'error',
	}),
	INVALID: ({ meta }) => ({
		title: 'OTP incorrect',
		body: typeof meta?.attemptsRemaining === 'number'
			? `${meta.attemptsRemaining} attempt${meta.attemptsRemaining === 1 ? '' : 's'} remaining before lockout.`
			: 'Check the code and try again.',
		severity: 'error',
	}),

	// ─── Beneficiary ──────────────────────────────────────────────────────
	BENEFICIARY_NAME_MISMATCH: ({ meta }) => ({
		title: 'Account name mismatch',
		body: meta?.canonicalName
			? `The bank says this account is owned by ${meta.canonicalName}. Verify the account number and bank code.`
			: 'The name you entered doesn\'t match the bank record. Verify the account number and bank code.',
		severity: 'error',
	}),
	BENEFICIARY_COOL_DOWN: ({ meta }) => ({
		title: 'Cool-down active',
		body: meta?.availableAt
			? `This account was added recently. Available for withdrawal at ${fmtDate(meta.availableAt)}.`
			: 'This account was added recently. The first withdrawal is delayed by 24h for security.',
		severity: 'info',
	}),
	BENEFICIARY_BLOCKED: () => ({
		title: 'Account unavailable',
		body: 'This account is unavailable. Contact support for assistance.',
		severity: 'error',
	}),
	BENEFICIARY_PENDING_REVIEW: () => ({
		title: 'Account under review',
		body: 'This account is under review for security. We\'ll email you when it\'s available.',
		severity: 'info',
	}),
	BENEFICIARY_INVALID: () => ({
		title: 'Bank account invalid',
		body: 'This bank account can\'t be used right now. Add a verified beneficiary to continue.',
		cta: 'Manage bank accounts',
		ctaHref: '/settings?tab=payments',
		severity: 'error',
	}),

	// ─── Plan limits ──────────────────────────────────────────────────────
	PLAN_LIMIT_EXCEEDED: ({ meta }) => {
		const k = meta?.limitKey ?? 'feature';
		const limit = meta?.limit;
		const tier = meta?.tier ?? 'your plan';
		return {
			title: 'Plan limit reached',
			body: limit
				? `You've reached the ${k} limit (${limit}) on ${tier}. Upgrade to remove the limit.`
				: `You've reached a limit on ${tier}. Upgrade to remove it.`,
			cta: 'Upgrade',
			ctaHref: '/settings?tab=subscription',
			severity: 'warn',
		};
	},

	// ─── Comp codes ───────────────────────────────────────────────────────
	COMP_CODE_INACTIVE: () => ({
		title: 'Code inactive',
		body: 'This complimentary code is no longer active.',
		severity: 'warn',
	}),
	COMP_CODE_EXPIRED: () => ({
		title: 'Code expired',
		body: 'This complimentary code has expired.',
		severity: 'warn',
	}),
	COMP_CODE_EVENT_MISMATCH: () => ({
		title: 'Code not for this event',
		body: 'This complimentary code is for a different event.',
		severity: 'warn',
	}),
	COMP_CODE_TICKET_MISMATCH: () => ({
		title: 'Code not for this ticket',
		body: 'This complimentary code doesn\'t apply to the selected ticket type.',
		severity: 'warn',
	}),
	COMP_CODE_EMAIL_NOT_ALLOWED: () => ({
		title: 'Email not allowed',
		body: 'This complimentary code is restricted to specific email addresses.',
		severity: 'warn',
	}),
	COMP_CODE_PER_USER_CAP: () => ({
		title: 'Personal limit reached',
		body: 'You\'ve already redeemed this code the maximum number of times.',
		severity: 'warn',
	}),
	COMP_CODE_EXHAUSTED: () => ({
		title: 'Code fully redeemed',
		body: 'This complimentary code has been used up.',
		severity: 'warn',
	}),

	// ─── Coupon ───────────────────────────────────────────────────────────
	COUPON_NOT_APPLICABLE_TO_TICKET_TYPE: () => ({
		title: 'Coupon not applicable',
		body: 'This coupon doesn\'t apply to the selected ticket type.',
		severity: 'warn',
	}),
	COUPON_PER_USER_LIMIT_REACHED: () => ({
		title: 'Coupon limit reached',
		body: 'You\'ve already used this coupon the maximum number of times.',
		severity: 'warn',
	}),

	// ─── Ticket transfer ──────────────────────────────────────────────────
	TICKET_REFUNDED: () => ({
		title: 'Ticket refunded',
		body: 'Refunded tickets cannot be transferred.',
		severity: 'error',
	}),
	TICKET_REFUND_IN_PROGRESS: () => ({
		title: 'Refund in progress',
		body: 'A refund is already being processed for this ticket.',
		severity: 'warn',
	}),
	TRANSFER_CUTOFF_PASSED: () => ({
		title: 'Transfer window closed',
		body: 'Tickets can no longer be transferred for this event.',
		severity: 'warn',
	}),

	// ─── Refund ───────────────────────────────────────────────────────────
	REFUND_BLOCKED_BY_POLICY: () => ({
		title: 'Refund window closed',
		body: 'Refunds are no longer allowed for this event. Contact support if this is an exception.',
		severity: 'warn',
	}),
	REFUND_AMOUNT_EXCEEDS_PAID: () => ({
		title: 'Amount too large',
		body: 'Refund amount cannot exceed the original payment.',
		severity: 'error',
	}),
	ALREADY_REFUNDED: () => ({
		title: 'Already refunded',
		body: 'This payment has already been refunded.',
		severity: 'warn',
	}),

	// ─── Wallet ───────────────────────────────────────────────────────────
	INSUFFICIENT_AVAILABLE_BALANCE: ({ meta }) => ({
		title: 'Insufficient balance',
		body: meta?.disputedKobo
			? `${fmtKobo(meta.disputedKobo, meta.currency)} is held against an open dispute. The remaining balance is withdrawable.`
			: 'Insufficient withdrawable balance — reserved or disputed funds are excluded.',
		severity: 'warn',
	}),
	INSUFFICIENT_FUNDS: () => ({
		title: 'Insufficient balance',
		body: 'Not enough funds in your wallet for this operation.',
		severity: 'warn',
	}),

	// ─── Subscription ─────────────────────────────────────────────────────
	TRIAL_ALREADY_USED: () => ({
		title: 'Trial already used',
		body: 'You\'ve already used your free trial. Subscribe directly to PLUS instead.',
		cta: 'Subscribe',
		ctaHref: '/pricing',
		severity: 'info',
	}),

	// ─── System ───────────────────────────────────────────────────────────
	CASCADE_DELETE_DISABLED: () => ({
		title: 'Action unavailable',
		body: 'Account deletion is being upgraded to a compliant soft-delete flow. Contact support for now.',
		cta: 'Contact support',
		ctaHref: '/help-center?topic=account-deletion',
		severity: 'warn',
	}),
	STALE_WEBHOOK: () => ({
		title: 'Stale event',
		body: 'This event was already processed.',
		severity: 'info',
	}),

	// ─── P4 — Wallet freeze, dispute reserve, VAT, receipts ───────────────
	WALLET_FROZEN: ({ meta }) => ({
		title: 'Wallet on hold',
		body: meta?.reason
			? `Your wallet is temporarily on hold while we verify activity (${meta.reason}). Contact support for assistance.`
			: 'Your wallet is temporarily on hold while we verify activity. Contact support for assistance.',
		cta: 'Contact support',
		ctaHref: '/help-center?topic=wallet-hold',
		severity: 'error',
	}),
	DISPUTED_RESERVE_HOLD: ({ meta }) => ({
		title: 'Funds on dispute hold',
		body: meta?.disputedKobo
			? `${fmtKobo(meta.disputedKobo, meta.currency)} is currently held against an open dispute. The remaining balance is withdrawable.`
			: 'Some of your balance is currently held against an open dispute. The remaining balance is withdrawable.',
		severity: 'warn',
	}),
	TAX_ID_REQUIRED: () => ({
		title: 'Tax ID required',
		body: 'Add your Tax Identification Number (TIN) before publishing paid events.',
		cta: 'Add TIN',
		ctaHref: '/account/tax',
		severity: 'warn',
	}),
	TAX_ID_INVALID: () => ({
		title: 'Tax ID invalid',
		body: 'The TIN you provided couldn\'t be verified. Double-check and resubmit.',
		cta: 'Update TIN',
		ctaHref: '/account/tax',
		severity: 'error',
	}),
	RECEIPT_NOT_READY: () => ({
		title: 'Receipt not ready',
		body: 'Receipts are generated within 60s of payment. Please refresh.',
		severity: 'info',
	}),
};

/**
 * Map any error-shaped value to user-facing copy. Returns a sensible
 * default when the code isn't registered.
 */
export function mapFinancialError(err: any): FinancialErrorCopy {
	const ctx = normalise(err);
	const codeKey = (ctx.code ?? '').toUpperCase();
	if (codeKey && REGISTRY[codeKey]) return REGISTRY[codeKey](ctx);

	// Status-driven fallbacks for common HTTP codes the FE sees.
	if (ctx.status === 409) {
		return {
			title: 'Conflict',
			body: ctx.message || 'This conflicts with an existing record. Please refresh and try again.',
			severity: 'warn',
		};
	}
	if (ctx.status === 410) {
		return {
			title: 'No longer available',
			body: ctx.message || 'This resource is no longer available.',
			severity: 'warn',
		};
	}
	if (ctx.status === 423) {
		return {
			title: 'Locked',
			body: ctx.message || 'This action is temporarily locked.',
			severity: 'error',
		};
	}
	if (ctx.status === 429) {
		return {
			title: 'Too many requests',
			body: ctx.message || 'Please wait a moment before trying again.',
			severity: 'warn',
		};
	}

	return {
		title: 'Something went wrong',
		body: ctx.message || 'Please try again. If the problem persists, contact support.',
		severity: 'error',
	};
}

/** Convenience: extract a one-line message for a toast. */
export function financialErrorMessage(err: any): string {
	const c = mapFinancialError(err);
	return c.body || c.title;
}
