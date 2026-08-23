/**
 * Frontend mirror of `services/event/src/constants/event-admin-roles.ts`.
 *
 * Keep in sync with the backend file. The shape is identical so the role
 * catalog can also be loaded dynamically from `GET /api/v1/events/admin/roles`
 * for true single-source-of-truth behavior.
 *
 * Pages that gate UI by permission should prefer to read from the
 * `accessRole` / `accessPermissions` fields returned by the backend on the
 * event payload rather than re-deriving them client-side.
 */

export const Permission = {
	// H-50 — `EVENT_PUBLISH` removed (2026-08-17). Draft is out, so there is no
	// publish step to gate. Kept in step with the backend's matrix in
	// `services/event/src/constants/event-admin-roles.ts`; the two must agree or
	// the UI offers a control the API refuses.
	EVENT_MANAGE: 'EVENT_MANAGE',
	EVENT_DELETE: 'EVENT_DELETE',
	EVENT_CANCEL: 'EVENT_CANCEL',
	EVENT_DAYS_MANAGE: 'EVENT_DAYS_MANAGE',
	AGENDA_MANAGE: 'AGENDA_MANAGE',
	SESSIONS_MANAGE: 'SESSIONS_MANAGE',
	ROOMS_MANAGE: 'ROOMS_MANAGE',
	ATTENDEES_VIEW: 'ATTENDEES_VIEW',
	ATTENDEES_MANAGE: 'ATTENDEES_MANAGE',
	REGISTRATION_MANAGE: 'REGISTRATION_MANAGE',
	CHECKIN_MANAGE: 'CHECKIN_MANAGE',
	TICKETS_MANAGE: 'TICKETS_MANAGE',
	SEATING_MANAGE: 'SEATING_MANAGE',
	MEDIA_MANAGE: 'MEDIA_MANAGE',
	/** Approve / hide guest-uploaded Memories. */
	MEDIA_MODERATE: 'MEDIA_MODERATE',
	/**
	 * Guest upload capability. Granted to verified ATTENDEES by the backend,
	 * never by an admin role — listed here only so UI code can name it.
	 */
	MEDIA_CONTRIBUTE: 'MEDIA_CONTRIBUTE',
	FAQS_MANAGE: 'FAQS_MANAGE',
	CHECKLIST_MANAGE: 'CHECKLIST_MANAGE',
	COMMUNITY_MANAGE: 'COMMUNITY_MANAGE',
	BLAST_SEND: 'BLAST_SEND',
	INSIGHTS_VIEW: 'INSIGHTS_VIEW',
	SETTINGS_MANAGE: 'SETTINGS_MANAGE',
	ADMINS_MANAGE: 'ADMINS_MANAGE',
	PARTICIPANTS_MANAGE: 'PARTICIPANTS_MANAGE',
	BUDGET_VIEW: 'BUDGET_VIEW',
	BUDGET_MANAGE: 'BUDGET_MANAGE',
	PROMOTERS_MANAGE: 'PROMOTERS_MANAGE',
	GIFTS_MANAGE: 'GIFTS_MANAGE'
} as const;

export type PermissionValue = (typeof Permission)[keyof typeof Permission];

export type EventAdminRoleValue =
	| 'EVENT_MANAGER'
	| 'EVENT_PLANNER'
	| 'COMMUNITY_MANAGER'
	| 'REGISTRATION_MANAGER'
	| 'SUPPORT_MANAGER';

export interface EventAdminRoleDefinition {
	value: EventAdminRoleValue;
	label: string;
	description: string;
	icon: string;
	permissions: PermissionValue[];
	requiresPlus?: boolean;
	color?: { bg: string; text: string; chip: string };
}

const ROLE_PERMISSIONS: Record<EventAdminRoleValue, PermissionValue[]> = {
	EVENT_MANAGER: [
		Permission.EVENT_MANAGE,
		Permission.EVENT_CANCEL,
		Permission.EVENT_DAYS_MANAGE,
		Permission.AGENDA_MANAGE,
		Permission.SESSIONS_MANAGE,
		Permission.ROOMS_MANAGE,
		Permission.ATTENDEES_VIEW,
		Permission.ATTENDEES_MANAGE,
		Permission.REGISTRATION_MANAGE,
		Permission.CHECKIN_MANAGE,
		Permission.TICKETS_MANAGE,
		Permission.SEATING_MANAGE,
		Permission.MEDIA_MANAGE,
		Permission.FAQS_MANAGE,
		Permission.CHECKLIST_MANAGE,
		Permission.COMMUNITY_MANAGE,
		Permission.BLAST_SEND,
		Permission.INSIGHTS_VIEW,
		Permission.SETTINGS_MANAGE,
		Permission.PARTICIPANTS_MANAGE,
		Permission.MEDIA_MODERATE,
		Permission.BUDGET_VIEW,
		Permission.BUDGET_MANAGE,
		Permission.PROMOTERS_MANAGE,
		Permission.GIFTS_MANAGE
	],
	// EVENT_MANAGER minus SETTINGS_MANAGE / ADMINS_MANAGE / EVENT_CANCEL —
	// a hired contractor runs the event but never touches payout settings,
	// the team list, or the event's existence.
	EVENT_PLANNER: [
		Permission.EVENT_MANAGE,
		Permission.EVENT_DAYS_MANAGE,
		Permission.AGENDA_MANAGE,
		Permission.SESSIONS_MANAGE,
		Permission.ROOMS_MANAGE,
		Permission.ATTENDEES_VIEW,
		Permission.ATTENDEES_MANAGE,
		Permission.REGISTRATION_MANAGE,
		Permission.CHECKIN_MANAGE,
		Permission.TICKETS_MANAGE,
		Permission.SEATING_MANAGE,
		Permission.MEDIA_MANAGE,
		Permission.MEDIA_MODERATE,
		Permission.FAQS_MANAGE,
		Permission.CHECKLIST_MANAGE,
		Permission.COMMUNITY_MANAGE,
		Permission.BLAST_SEND,
		Permission.INSIGHTS_VIEW,
		Permission.PARTICIPANTS_MANAGE,
		Permission.BUDGET_VIEW,
		Permission.BUDGET_MANAGE,
		Permission.GIFTS_MANAGE,
		// Mirrors the backend. Approving promoters is planning work; PAYING
		// them is not granted by this — the payout endpoint checks event
		// ownership by RPC, so a planner can never move money out of the wallet.
		Permission.PROMOTERS_MANAGE
	],
	REGISTRATION_MANAGER: [Permission.ATTENDEES_VIEW, Permission.CHECKIN_MANAGE],
	COMMUNITY_MANAGER: [Permission.COMMUNITY_MANAGE, Permission.MEDIA_MODERATE],
	SUPPORT_MANAGER: [Permission.ATTENDEES_VIEW, Permission.INSIGHTS_VIEW]
};

export const EVENT_ADMIN_ROLES: EventAdminRoleDefinition[] = [
	{
		value: 'EVENT_MANAGER',
		label: 'Manager',
		description: 'Full manage access to the event',
		icon: 'mdi:account-cog-outline',
		permissions: ROLE_PERMISSIONS.EVENT_MANAGER,
		color: { bg: 'bg-yellow-100', text: 'text-yellow-700', chip: 'bg-yellow-50' }
	},
	{
		value: 'EVENT_PLANNER',
		label: 'Event Planner',
		description: 'Runs the event end-to-end, except settings and team',
		icon: 'mdi:clipboard-account-outline',
		permissions: ROLE_PERMISSIONS.EVENT_PLANNER,
		color: { bg: 'bg-teal-100', text: 'text-teal-700', chip: 'bg-teal-50' }
	},
	{
		value: 'REGISTRATION_MANAGER',
		label: 'Check-In Only',
		description: 'Check in guests and view guest list',
		icon: 'mdi:clipboard-check-outline',
		permissions: ROLE_PERMISSIONS.REGISTRATION_MANAGER,
		requiresPlus: true,
		color: { bg: 'bg-blue-100', text: 'text-blue-700', chip: 'bg-blue-50' }
	},
	{
		value: 'COMMUNITY_MANAGER',
		label: 'Community Manager',
		description: 'Manage community forums and chats',
		icon: 'mdi:forum-outline',
		permissions: ROLE_PERMISSIONS.COMMUNITY_MANAGER,
		color: { bg: 'bg-purple-100', text: 'text-purple-700', chip: 'bg-purple-50' }
	},
	{
		value: 'SUPPORT_MANAGER',
		label: 'Non-Manager',
		description: 'Read-only access to attendees and insights',
		icon: 'mdi:account-outline',
		permissions: ROLE_PERMISSIONS.SUPPORT_MANAGER,
		color: { bg: 'bg-gray-100', text: 'text-gray-600', chip: 'bg-gray-50' }
	}
];

export function getRoleDefinition(role: string): EventAdminRoleDefinition | undefined {
	return EVENT_ADMIN_ROLES.find((r) => r.value === role);
}

export function getRoleLabel(role: string): string {
	return getRoleDefinition(role)?.label || role;
}

export function getRoleColor(role: string): { bg: string; text: string; chip: string } {
	return (
		getRoleDefinition(role)?.color || { bg: 'bg-gray-100', text: 'text-gray-600', chip: 'bg-gray-50' }
	);
}

export function rolePermissions(role: string): PermissionValue[] {
	return getRoleDefinition(role)?.permissions || [];
}

export function hasPermission(
	access: { permissions?: string[]; isOwner?: boolean } | null | undefined,
	required: PermissionValue
): boolean {
	if (!access) return false;
	if (access.isOwner) return true;
	if (!access.permissions) return false;
	return access.permissions.includes(required);
}
