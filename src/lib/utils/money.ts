/**
 * P1-16 (NEW-2.1, NEW-2.2, FA-6.2, FA-6.3) — Frontend money helpers.
 *
 * Mirrors the backend `services/payment/src/types/money.ts` contract:
 *   - All amounts crossing the wire are integer kobo / cents (minor units).
 *   - The display currency is whatever the backend returned, never assumed.
 *
 * Rules:
 *   - Render with `formatMoney(amountKobo, currency)`.
 *   - Convert user input to kobo with `majorToKobo(value, currency)`.
 *   - Read display values from `koboToMajor(amountKobo, currency)`.
 *
 * Never compute commerce off the display-only "view all" exchange rate —
 * that is for at-a-glance UX only and clearly labelled `≈`.
 */

export type SupportedCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'ETH';

/**
 * Decimal places per currency. Most are 2; ETH is 18 but we never *store*
 * ETH on-chain — when ETH balances cross the wire they are quoted as
 * "kobo-style" minor units (integer satoshi-like), and we render at 6 dp
 * for human readability.
 */
const DECIMALS: Record<string, number> = {
	NGN: 2,
	USD: 2,
	GBP: 2,
	EUR: 2,
	ETH: 6
};

const SYMBOLS: Record<string, string> = {
	NGN: '₦',
	USD: '$',
	GBP: '£',
	EUR: '€',
	ETH: 'Ξ'
};

function decimalsFor(currency: string | undefined | null): number {
	if (!currency) return 2;
	const n = DECIMALS[currency.toUpperCase()];
	return typeof n === 'number' ? n : 2;
}

function symbolFor(currency: string | undefined | null): string {
	if (!currency) return '';
	return SYMBOLS[currency.toUpperCase()] ?? `${currency.toUpperCase()} `;
}

/**
 * Convert a user-input major-unit amount (e.g. `199.99`) to integer minor
 * units (e.g. `19999` kobo for NGN, `19999` cents for USD).
 *
 * Returns `0` for empty / invalid input. Negatives are rejected (returned
 * as `0`) — the UI should refuse those before calling.
 */
export function majorToKobo(value: number | string | null | undefined, currency: string = 'NGN'): number {
	if (value === null || value === undefined || value === '') return 0;
	const n = typeof value === 'string' ? parseFloat(value) : value;
	if (!Number.isFinite(n) || n < 0) return 0;
	const factor = 10 ** decimalsFor(currency);
	// Math.round is the tie-breaker used by the backend `majorToKobo`.
	return Math.round(n * factor);
}

/**
 * Convert integer minor units back to a human-readable major unit number
 * (e.g. `19999` kobo → `199.99`). Use only for display.
 */
export function koboToMajor(amountKobo: number | null | undefined, currency: string = 'NGN'): number {
	if (amountKobo === null || amountKobo === undefined) return 0;
	const n = Number(amountKobo);
	if (!Number.isFinite(n)) return 0;
	const factor = 10 ** decimalsFor(currency);
	return n / factor;
}

interface FormatMoneyOptions {
	/** Locale for digit grouping. Default `en-NG` for NGN, `en-US` otherwise. */
	locale?: string;
	/** Override decimal places. */
	maximumFractionDigits?: number;
	/** Override decimal places (lower bound). Default = currency's natural decimals. */
	minimumFractionDigits?: number;
}

/**
 * Render an integer minor-unit amount in the supplied currency. Always
 * uses the currency the backend returned — never assumes NGN.
 *
 * Examples:
 *   formatMoney(2_000_000, 'NGN')  → "₦20,000.00"
 *   formatMoney(19_999, 'USD')     → "$199.99"
 *   formatMoney(0, 'NGN')          → "₦0.00"
 *   formatMoney(undefined, 'USD')  → "$0.00"
 */
export function formatMoney(
	amountKobo: number | null | undefined,
	currency: string | null | undefined = 'NGN',
	options: FormatMoneyOptions = {}
): string {
	const ccy = (currency ?? 'NGN').toUpperCase();
	const major = koboToMajor(amountKobo ?? 0, ccy);
	const dp = decimalsFor(ccy);
	const locale = options.locale ?? (ccy === 'NGN' ? 'en-NG' : 'en-US');
	try {
		// Intl.NumberFormat with `style: 'currency'` emits the proper symbol +
		// digit grouping for the locale. ETH falls through to the fallback
		// renderer below because Intl doesn't know about it.
		if (ccy !== 'ETH') {
			return new Intl.NumberFormat(locale, {
				style: 'currency',
				currency: ccy,
				minimumFractionDigits: options.minimumFractionDigits ?? dp,
				maximumFractionDigits: options.maximumFractionDigits ?? dp
			}).format(major);
		}
	} catch {
		// Fall through.
	}
	const num = major.toLocaleString(locale, {
		minimumFractionDigits: options.minimumFractionDigits ?? dp,
		maximumFractionDigits: options.maximumFractionDigits ?? dp
	});
	return `${symbolFor(ccy)}${num}`;
}

/**
 * Display-only conversion between two currencies. NEVER use this to
 * authorise a payment, withdrawal, or settlement. The UI must label the
 * resulting figure with `≈` to make the approximation explicit.
 *
 * Rates are kept as a static fallback table here; production callers
 * should replace with a live FX feed before launch.
 */
const DISPLAY_RATES_VS_USD: Record<string, number> = {
	NGN: 1 / 1500, // 1 NGN ≈ 0.00067 USD
	USD: 1,
	GBP: 1.27,
	EUR: 1.08,
	ETH: 3500
};

export function approximateConvert(
	amountKobo: number | null | undefined,
	fromCurrency: string,
	toCurrency: string
): number {
	const amount = koboToMajor(amountKobo ?? 0, fromCurrency);
	if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return amount;
	const fromUSD = DISPLAY_RATES_VS_USD[fromCurrency.toUpperCase()];
	const toUSD = DISPLAY_RATES_VS_USD[toCurrency.toUpperCase()];
	if (!fromUSD || !toUSD) return amount;
	const usd = amount * fromUSD;
	return usd / toUSD;
}

/**
 * Format an approximate-converted figure with the `≈` prefix mandated by
 * the spec.
 */
export function formatApproxMoney(
	amountKobo: number | null | undefined,
	fromCurrency: string,
	toCurrency: string
): string {
	const major = approximateConvert(amountKobo, fromCurrency, toCurrency);
	const minor = majorToKobo(major, toCurrency);
	return `≈ ${formatMoney(minor, toCurrency)}`;
}

/**
 * Backend monetary envelope contract:
 *   `{ amountKobo: number, currency: string }`
 *
 * Helper that accepts either:
 *   - a raw kobo number (legacy responses that haven't been envelope-ified yet),
 *   - or the new envelope.
 *
 * Falls back to NGN when the envelope omits a currency.
 */
export interface MoneyEnvelope {
	amountKobo: number;
	currency: string;
}

export function moneyFromBackend(
	value: number | MoneyEnvelope | null | undefined,
	defaultCurrency = 'NGN'
): { amountKobo: number; currency: string } {
	if (value === null || value === undefined) {
		return { amountKobo: 0, currency: defaultCurrency };
	}
	if (typeof value === 'number') {
		return { amountKobo: Number.isFinite(value) ? value : 0, currency: defaultCurrency };
	}
	if (typeof value === 'object' && 'amountKobo' in value) {
		return {
			amountKobo: Number.isFinite(value.amountKobo) ? value.amountKobo : 0,
			currency: value.currency || defaultCurrency
		};
	}
	return { amountKobo: 0, currency: defaultCurrency };
}


/**
 * CC-2 — Format a backend `MoneyEnvelope` (or a legacy raw kobo number)
 * directly. Removes one boilerplate line at every callsite.
 *
 * Examples:
 *   formatMoneyEnvelope({ amountKobo: 5000, currency: 'NGN' }) → '₦50.00'
 *   formatMoneyEnvelope(5000)                                  → '₦50.00' (defaultCurrency)
 *   formatMoneyEnvelope(null)                                   → '₦0.00'
 */
export function formatMoneyEnvelope(
	value: number | MoneyEnvelope | null | undefined,
	defaultCurrency = 'NGN',
	options: FormatMoneyOptions = {}
): string {
	const env = moneyFromBackend(value, defaultCurrency);
	return formatMoney(env.amountKobo, env.currency, options);
}

/**
 * CC-2 — Format a fee rate (e.g. 0.06) as a percent string.
 *
 * Examples:
 *   formatPercent(0.06)  → '6%'
 *   formatPercent(0.035) → '3.5%'
 *   formatPercent(null)  → '0%'
 */
export function formatPercent(rate: number | null | undefined, fractionDigits?: number): string {
	if (rate == null || !Number.isFinite(rate)) return '0%';
	const pct = rate * 100;
	const dp = fractionDigits ?? (pct === Math.round(pct) ? 0 : 1);
	return `${pct.toFixed(dp)}%`;
}
