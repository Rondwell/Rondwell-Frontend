/**
 * FE-P3-01 (NEW-8.1) — Plan-limit error mapper.
 *
 * Backend reference: every feature gate routes through `UsageTracker` and
 * raises `PlanLimitExceededError` (HTTP 403) with:
 *   { code: 'PLAN_LIMIT_EXCEEDED', meta: { limitKey, limit, current, tier } }
 *
 * This module turns the structured `meta` into user-facing copy and a
 * canonical "Upgrade" CTA. Used by `<PlanLimitBanner>` and any inline
 * action that catches a `PLAN_LIMIT_EXCEEDED` server response.
 */

export type PlanLimitKey =
	| 'maxParticipantsPerEvent'
	| 'maxAdminsPerEvent'
	| 'maxVendorsPerEvent'
	| 'maxSpeakersPerEvent'
	| 'maxExhibitorsPerEvent'
	| 'maxCollections'
	| 'seatingLayoutEvents'
	| 'activePaidEvents'
	| 'emails'
	| 'aiPrompts'
	| 'maxRegistrationFields'
	| 'maxTicketTypes'
	| 'maxCustomDomains'
	| string;

export interface PlanLimitMeta {
	limitKey?: PlanLimitKey;
	limit?: number;
	current?: number;
	tier?: string;
}

export interface PlanLimitCopy {
	title: string;
	body: string;
	cta: string;
	ctaHref: string;
	limitKey: PlanLimitKey;
	limit?: number;
	current?: number;
	tier?: string;
}

const LABELS: Record<string, { name: string; pluralised?: string }> = {
	maxParticipantsPerEvent: { name: 'participant', pluralised: 'participants' },
	maxAdminsPerEvent: { name: 'admin', pluralised: 'admins' },
	maxVendorsPerEvent: { name: 'vendor', pluralised: 'vendors' },
	maxSpeakersPerEvent: { name: 'speaker', pluralised: 'speakers' },
	maxExhibitorsPerEvent: { name: 'exhibitor', pluralised: 'exhibitors' },
	maxCollections: { name: 'collection', pluralised: 'collections' },
	seatingLayoutEvents: { name: 'seating-layout event', pluralised: 'seating-layout events' },
	activePaidEvents: { name: 'active paid event', pluralised: 'active paid events' },
	emails: { name: 'email', pluralised: 'emails' },
	aiPrompts: { name: 'AI prompt', pluralised: 'AI prompts' },
	maxRegistrationFields: { name: 'registration field', pluralised: 'registration fields' },
	maxTicketTypes: { name: 'ticket type', pluralised: 'ticket types' },
	maxCustomDomains: { name: 'custom domain', pluralised: 'custom domains' },
};

function labelFor(key: PlanLimitKey | undefined): { name: string; pluralised: string } {
	if (!key) return { name: 'feature', pluralised: 'features' };
	const entry = LABELS[key];
	if (!entry) return { name: 'feature', pluralised: 'features' };
	return { name: entry.name, pluralised: entry.pluralised ?? `${entry.name}s` };
}

/**
 * Map a `meta` object (or a thrown Error carrying `.meta`/`.data.meta`) to
 * the banner-friendly copy. Returns `null` when the input is not actually a
 * plan-limit error.
 */
export function mapPlanLimit(input: any): PlanLimitCopy | null {
	if (!input) return null;
	const code = input.code ?? input.data?.code ?? null;
	const status = input.status ?? input.data?.status ?? null;
	const isPlan = code === 'PLAN_LIMIT_EXCEEDED' || (status === 403 && (input.meta?.limitKey || input.data?.meta?.limitKey));
	const meta: PlanLimitMeta = input.meta ?? input.data?.meta ?? input;
	if (!isPlan && !meta?.limitKey) return null;

	const tier = meta?.tier ?? 'your plan';
	const limit = meta?.limit;
	const current = meta?.current;
	const { name, pluralised } = labelFor(meta?.limitKey);

	let body: string;
	let title: string;
	switch (meta?.limitKey) {
		case 'maxParticipantsPerEvent':
			title = 'Participant cap reached';
			body = `This event has reached the participant cap for ${tier}${limit ? ` (${limit})` : ''}.`;
			break;
		case 'maxAdminsPerEvent':
			title = 'Admin limit reached';
			body = `You can have up to ${limit ?? 'a limited number of'} admins per event on the ${tier} plan.`;
			break;
		case 'maxVendorsPerEvent':
		case 'maxSpeakersPerEvent':
		case 'maxExhibitorsPerEvent':
			title = `${name[0].toUpperCase() + name.slice(1)} limit reached`;
			body = `You've added ${current ?? ''}${limit ? `/${limit}` : ''} ${pluralised} to this event on the ${tier} plan.`;
			break;
		case 'maxCollections':
			title = 'Collection limit reached';
			body = `You're at ${current ?? ''}${limit ? `/${limit}` : ''} collections on the ${tier} plan.`;
			break;
		case 'seatingLayoutEvents':
			title = 'Seating-layout limit reached';
			body = `Seating-layout events are capped on the ${tier} plan${limit ? ` (${limit})` : ''}.`;
			break;
		case 'activePaidEvents':
			title = 'Active paid events cap reached';
			body = `You have ${current ?? ''}${limit ? `/${limit}` : ''} active paid events on ${tier}. Archive one or upgrade to publish more.`;
			break;
		case 'emails':
			title = 'Email allowance used up';
			body = `You've sent ${current ?? 0}/${limit ?? '—'} emails this period.`;
			break;
		case 'aiPrompts':
			title = 'AI prompt limit reached';
			body = `${current ?? 0}/${limit ?? '—'} AI prompts used this period.`;
			break;
		default:
			title = 'Plan limit reached';
			body = limit
				? `You've reached the ${meta?.limitKey ?? 'feature'} limit (${limit}) on ${tier}.`
				: `You've reached a limit on ${tier}.`;
	}

	return {
		title,
		body,
		cta: 'Upgrade',
		ctaHref: '/settings?tab=subscription',
		limitKey: meta?.limitKey ?? 'unknown',
		limit,
		current,
		tier,
	};
}

/** Convenience — true when the error is a plan-limit error. */
export function isPlanLimitError(err: any): boolean {
	if (!err) return false;
	const code = err.code ?? err.data?.code ?? null;
	return code === 'PLAN_LIMIT_EXCEEDED';
}
