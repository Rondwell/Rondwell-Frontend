/**
 * Frontend mirror of `services/event/src/constants/collection-admin-roles.ts`.
 *
 * Keep in sync with the backend file. The shape is identical so the role
 * catalog can also be loaded dynamically from
 * `GET /api/v1/collections/admin/roles` for single-source-of-truth behavior.
 */

export const CollectionPermission = {
	COLLECTION_MANAGE: 'COLLECTION_MANAGE',
	COLLECTION_SETTINGS_MANAGE: 'COLLECTION_SETTINGS_MANAGE',
	COLLECTION_PAGE_MANAGE: 'COLLECTION_PAGE_MANAGE',
	EVENTS_VIEW: 'EVENTS_VIEW',
	EVENTS_CREATE: 'EVENTS_CREATE',
	EVENTS_MANAGE: 'EVENTS_MANAGE',
	SUBSCRIBERS_VIEW: 'SUBSCRIBERS_VIEW',
	SUBSCRIBERS_MANAGE: 'SUBSCRIBERS_MANAGE',
	TAGS_MANAGE: 'TAGS_MANAGE',
	COUPONS_MANAGE: 'COUPONS_MANAGE',
	BLAST_SEND: 'BLAST_SEND',
	INSIGHTS_VIEW: 'INSIGHTS_VIEW',
	ADMINS_MANAGE: 'ADMINS_MANAGE'
} as const;

export type CollectionPermissionValue =
	(typeof CollectionPermission)[keyof typeof CollectionPermission];

export type CollectionAdminRoleValue =
	| 'COLLECTION_MANAGER'
	| 'EVENTS_MANAGER'
	| 'COMMUNITY_MANAGER'
	| 'SUBSCRIBER_MANAGER'
	| 'INSIGHTS_MANAGER';

export interface CollectionAdminRoleDefinition {
	value: CollectionAdminRoleValue;
	label: string;
	description: string;
	icon: string;
	permissions: CollectionPermissionValue[];
	requiresPlus?: boolean;
	color?: { bg: string; text: string; chip: string };
}

const ROLE_PERMISSIONS: Record<CollectionAdminRoleValue, CollectionPermissionValue[]> = {
	COLLECTION_MANAGER: [
		CollectionPermission.COLLECTION_MANAGE,
		CollectionPermission.COLLECTION_SETTINGS_MANAGE,
		CollectionPermission.COLLECTION_PAGE_MANAGE,
		CollectionPermission.EVENTS_VIEW,
		CollectionPermission.EVENTS_CREATE,
		CollectionPermission.EVENTS_MANAGE,
		CollectionPermission.SUBSCRIBERS_VIEW,
		CollectionPermission.SUBSCRIBERS_MANAGE,
		CollectionPermission.TAGS_MANAGE,
		CollectionPermission.COUPONS_MANAGE,
		CollectionPermission.BLAST_SEND,
		CollectionPermission.INSIGHTS_VIEW
	],
	EVENTS_MANAGER: [
		CollectionPermission.EVENTS_VIEW,
		CollectionPermission.EVENTS_CREATE,
		CollectionPermission.EVENTS_MANAGE,
		CollectionPermission.INSIGHTS_VIEW
	],
	COMMUNITY_MANAGER: [CollectionPermission.SUBSCRIBERS_VIEW, CollectionPermission.BLAST_SEND],
	SUBSCRIBER_MANAGER: [
		CollectionPermission.SUBSCRIBERS_VIEW,
		CollectionPermission.SUBSCRIBERS_MANAGE,
		CollectionPermission.TAGS_MANAGE
	],
	INSIGHTS_MANAGER: [CollectionPermission.INSIGHTS_VIEW]
};

export const COLLECTION_ADMIN_ROLES: CollectionAdminRoleDefinition[] = [
	{
		value: 'COLLECTION_MANAGER',
		label: 'Collection Manager',
		description: 'Full access to the collection and all its events',
		icon: 'mdi:account-cog-outline',
		permissions: ROLE_PERMISSIONS.COLLECTION_MANAGER,
		color: { bg: 'bg-yellow-100', text: 'text-yellow-700', chip: 'bg-yellow-50' }
	},
	{
		value: 'EVENTS_MANAGER',
		label: 'Events Manager',
		description: 'Create and manage events under this collection',
		icon: 'mdi:calendar-edit',
		permissions: ROLE_PERMISSIONS.EVENTS_MANAGER,
		color: { bg: 'bg-blue-100', text: 'text-blue-700', chip: 'bg-blue-50' }
	},
	{
		value: 'COMMUNITY_MANAGER',
		label: 'Community Manager',
		description: 'Message subscribers and send blasts',
		icon: 'mdi:forum-outline',
		permissions: ROLE_PERMISSIONS.COMMUNITY_MANAGER,
		color: { bg: 'bg-purple-100', text: 'text-purple-700', chip: 'bg-purple-50' }
	},
	{
		value: 'SUBSCRIBER_MANAGER',
		label: 'Subscriber Manager',
		description: 'Manage subscribers and member tags',
		icon: 'mdi:account-group-outline',
		permissions: ROLE_PERMISSIONS.SUBSCRIBER_MANAGER,
		color: { bg: 'bg-green-100', text: 'text-green-700', chip: 'bg-green-50' }
	},
	{
		value: 'INSIGHTS_MANAGER',
		label: 'Insights Only',
		description: 'Read-only access to collection insights',
		icon: 'mdi:chart-box-outline',
		permissions: ROLE_PERMISSIONS.INSIGHTS_MANAGER,
		color: { bg: 'bg-gray-100', text: 'text-gray-600', chip: 'bg-gray-50' }
	}
];

export function getCollectionRoleDefinition(
	role: string
): CollectionAdminRoleDefinition | undefined {
	return COLLECTION_ADMIN_ROLES.find((r) => r.value === role);
}

export function getCollectionRoleLabel(role: string): string {
	return getCollectionRoleDefinition(role)?.label || role;
}

export function getCollectionRoleColor(role: string): { bg: string; text: string; chip: string } {
	return (
		getCollectionRoleDefinition(role)?.color || {
			bg: 'bg-gray-100',
			text: 'text-gray-600',
			chip: 'bg-gray-50'
		}
	);
}
