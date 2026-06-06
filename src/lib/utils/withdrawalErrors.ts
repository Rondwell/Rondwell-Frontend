/**
 * FE-P1-07 / FE-P1-08 — Withdrawal error code → user-facing copy.
 *
 * Backend reference:
 *   - `services/payment/src/api/controllers/wallet.controller.ts:verifyWithdrawalOtp`
 *   - `services/payment/src/services/WithdrawalOtpService.ts` (P1-07)
 *   - `services/payment/src/services/PinService.ts` (P1-08)
 *
 * The withdrawal verify-otp endpoint returns structured `{ status, code, message, ... }`
 * payloads with HTTP statuses ranging 400/423/429/503. The frontend must render
 * specific copy per code rather than a generic "Something went wrong" toast.
 *
 * The codes are pulled from the controller and rate-limit middleware:
 *   - PIN_REQUIRED (400)         — userPin missing
 *   - INVALID_PIN (400)          — wrong PIN, decrement triesLeft
 *   - PIN_LOCKED (423)           — PinService.verifyPin threw "PIN locked"
 *   - OTP_REQUEST_RATE_LIMIT (429) — middleware
 *   - OTP_VERIFY_RATE_LIMIT (429)  — middleware
 *   - NO_OTP / EXPIRED / LOCKED / INVALID / ALREADY_USED — OTP service reasons
 *   - INSUFFICIENT_FUNDS (400)
 *   - KYC_REQUIRED / DAILY_LIMIT_EXCEEDED / AML_REVIEW_REQUIRED / AML_VELOCITY_LOCKED /
 *     AML_ACCOUNT_LOCKED / AML_CHECK_UNAVAILABLE — Phase 2 codes (kept here so we
 *     don't have to hop files when Phase 2 ships)
 *   - BENEFICIARY_INVALID / BENEFICIARY_COOL_DOWN — beneficiary lifecycle
 */

export interface WithdrawalErrorContext {
	/** Server-provided structured error code. */
	code?: string | null;
	/** Server-provided message (used as a fallback). */
	message?: string | null;
	/** OTP attempts remaining if the server included it. */
	attemptsRemaining?: number | null;
	/** Locked-until ISO timestamp from the server (for OTP / PIN lockouts). */
	lockedUntil?: string | null;
	/** PIN tries-left from PinService (when the controller surfaces it). */
	triesLeft?: number | null;
}

export interface MappedWithdrawalError {
	/** Short copy to show in the inline error banner / toast. */
	copy: string;
	/** Optional secondary line — e.g. "{n} attempts remaining". */
	hint?: string;
	/** When set, the modal should switch the user to the PIN field. */
	resetToPin?: boolean;
	/** When set, the modal should clear the OTP and demand a fresh request. */
	requireFreshOtp?: boolean;
	/** When set, link to the PIN reset / KYC / settings page. */
	actionHref?: string;
	/** Action label rendered next to the error copy. */
	actionLabel?: string;
}

const PIN_RESET_HREF = '/settings?tab=security';
const KYC_HREF = '/account/kyc';

/**
 * Map a structured server error to user-facing copy. Always returns a value;
 * unknown codes fall back to the server-supplied message or a generic line.
 */
export function mapWithdrawalError(ctx: WithdrawalErrorContext): MappedWithdrawalError {
	const { code, message, attemptsRemaining, triesLeft, lockedUntil } = ctx;

	switch ((code ?? '').toUpperCase()) {
		case 'PIN_REQUIRED':
			return {
				copy: 'Enter your wallet PIN to authorise this withdrawal.',
				resetToPin: true,
			};
		case 'INVALID_PIN': {
			const remaining = typeof triesLeft === 'number' ? triesLeft : undefined;
			return {
				copy: 'PIN is incorrect.',
				hint:
					remaining !== undefined
						? `${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`
						: undefined,
				resetToPin: true,
			};
		}
		case 'PIN_LOCKED':
			return {
				copy: 'Your PIN is temporarily locked.',
				hint: 'Reset it in Settings → Security to continue withdrawing.',
				actionHref: PIN_RESET_HREF,
				actionLabel: 'Reset PIN',
			};

		case 'OTP_REQUEST_RATE_LIMIT':
			return {
				copy: 'Too many OTP requests.',
				hint: 'Try again in an hour.',
			};
		case 'OTP_VERIFY_RATE_LIMIT':
			return {
				copy: 'Too many OTP attempts.',
				hint: 'Try again in an hour.',
			};
		case 'NO_OTP':
			return {
				copy: 'No active OTP.',
				hint: 'Request a new code to continue.',
				requireFreshOtp: true,
			};
		case 'EXPIRED':
			return {
				copy: 'This OTP has expired.',
				hint: 'Request a new one.',
				requireFreshOtp: true,
			};
		case 'LOCKED':
			return {
				copy: 'Too many wrong OTPs.',
				hint: lockedUntil
					? `Request a new code after ${formatLockoutTime(lockedUntil)}.`
					: 'Request a new code in 30 minutes.',
				requireFreshOtp: true,
			};
		case 'INVALID': {
			const remaining = typeof attemptsRemaining === 'number' ? attemptsRemaining : undefined;
			return {
				copy: 'OTP is incorrect.',
				hint:
					remaining !== undefined
						? `${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`
						: 'Check the code and try again.',
			};
		}
		case 'ALREADY_USED':
			return {
				copy: 'This OTP was already used.',
				hint: 'Request a new code to continue.',
				requireFreshOtp: true,
			};

		case 'INSUFFICIENT_FUNDS':
			return {
				copy: 'Insufficient withdrawable balance.',
				hint: 'Check your wallet — reserved or disputed funds are excluded.',
			};

		case 'KYC_REQUIRED':
			return {
				copy: 'Verify your identity to enable withdrawals.',
				hint: 'Complete KYC in your account settings, then try again.',
				actionHref: KYC_HREF,
				actionLabel: 'Verify identity',
			};
		case 'DAILY_LIMIT_EXCEEDED':
			return {
				copy: 'You\'ve hit your daily withdrawal limit.',
				hint: 'Increase your KYC tier or wait until tomorrow.',
				actionHref: KYC_HREF,
				actionLabel: 'Upgrade KYC',
			};
		case 'AML_REVIEW_REQUIRED':
			return {
				copy: 'This withdrawal exceeds our review threshold.',
				hint: 'Our team will reach out within 1 business day to confirm.',
			};
		case 'AML_VELOCITY_LOCKED':
		case 'AML_ACCOUNT_LOCKED':
			return {
				copy: 'Account locked pending compliance review.',
				hint: 'Contact support for assistance.',
			};
		case 'AML_CHECK_UNAVAILABLE':
			return {
				copy: 'Compliance check temporarily unavailable.',
				hint: 'Please try again shortly.',
			};

		case 'BENEFICIARY_COOL_DOWN':
			return {
				copy: 'This beneficiary is in a 24‑hour cool‑down.',
				hint: 'New bank accounts cool down before the first withdrawal.',
			};
		case 'BENEFICIARY_INVALID':
			return {
				copy: 'This bank account can\'t be used right now.',
				hint: message || 'Add a verified beneficiary to continue.',
				actionHref: '/settings?tab=payments',
				actionLabel: 'Manage bank accounts',
			};

		default:
			return {
				copy: message || 'Withdrawal failed. Please try again.',
			};
	}
}

/**
 * "10:34 AM" / "in 28 minutes" style helper for OTP lockout messaging. Keeps
 * the copy from going stale across timezones — we always show local clock
 * time the user is sitting in.
 */
function formatLockoutTime(iso: string): string {
	try {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '30 minutes';
		const minutes = Math.max(1, Math.round((d.getTime() - Date.now()) / 60_000));
		if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
		return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	} catch {
		return '30 minutes';
	}
}
