/**
 * FE-P4-10 (P4-10) — Public compliance documentation pages.
 *
 * The compliance docs live in `docs/compliance/` in the backend repo:
 *   - data-retention-policy.md
 *   - aml-policy.md
 *   - kyc-policy.md
 *   - refund-policy.md
 *   - vendor-payout-policy.md
 *   - pci-scope.md
 *
 * Backend exposes them as public GETs:
 *   GET /api/v1/profile/legal/:slug
 *
 * Returns markdown text + frontmatter (`title`, `lastUpdated`).
 */

const BASE_URL = import.meta.env.VITE_API_URL;

export type LegalSlug =
	| 'data-retention'
	| 'aml-policy'
	| 'kyc-policy'
	| 'refund-policy'
	| 'vendor-payout-policy'
	| 'pci-scope';

export const LEGAL_DOCS: { slug: LegalSlug; title: string; description: string }[] = [
	{
		slug: 'data-retention',
		title: 'Data Retention Policy',
		description: '7-year financial retention and PII anonymisation procedures.',
	},
	{
		slug: 'aml-policy',
		title: 'AML Policy',
		description: 'Anti-money-laundering thresholds, alerts, and reporting.',
	},
	{
		slug: 'kyc-policy',
		title: 'KYC Policy',
		description: 'Verification tiers, document requirements, and review SLAs.',
	},
	{
		slug: 'refund-policy',
		title: 'Refund Policy',
		description: 'Refund windows, processes, and customer-facing guarantees.',
	},
	{
		slug: 'vendor-payout-policy',
		title: 'Vendor Payout Policy',
		description: 'Escrow window, dispute process, and payout cadence.',
	},
	{
		slug: 'pci-scope',
		title: 'PCI Scope',
		description: 'Confirms we never store card PANs and outlines tokenisation.',
	},
];

export interface LegalDoc {
	slug: LegalSlug;
	title: string;
	lastUpdated?: string | null;
	body: string; // markdown
}

/**
 * Fetch a single legal document.
 * Returns `null` when the backend hasn't exposed the slug (404) so the
 * caller can render a "Not yet published" stub instead of an error toast.
 */
export async function getLegalDoc(slug: LegalSlug): Promise<LegalDoc | null> {
	try {
		const res = await fetch(`${BASE_URL}/api/v1/profile/legal/${slug}`);
		if (!res.ok) return null;
		const data = await res.json();
		const d = data?.data ?? data ?? {};
		return {
			slug,
			title: d.title ?? humanise(slug),
			lastUpdated: d.lastUpdated ?? null,
			body: typeof d.body === 'string' ? d.body : '',
		};
	} catch {
		return null;
	}
}

function humanise(slug: string): string {
	return slug
		.split('-')
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join(' ');
}
