export interface StatusStyle {
	bg: string;
	text: string;
}

export const statusStyles = {
	Confirmed: { bg: '#E3F4E1', text: '#3CBD2C' },
	Approved: { bg: '#E3F4E1', text: '#3CBD2C' },

	Invited: { bg: '#DBE4FF', text: '#003BFF' },
	Applied: { bg: '#f7c1a4', text: '#F87937' },
	Declined: { bg: '#FFECEC', text: '#FF0004' },
	Accepted: { bg: '#f2d7a6', text: '#FFA600' },
	Pending: { bg: '#FFFBD4', text: '#FFE500' },
	Live: { bg: '#C7FFFF', text: '#008080' },
	Fulfilled: { bg: '#FFDDFA', text: '#DB3EC6' },

	ManualAdd: { bg: '#EBECED', text: '#000000' },

	Default: { bg: '#EBECED', text: '#000000' }
} as const;

export type StatusType = keyof typeof statusStyles;

/** Safely returns the correct style */
export function getStatusStyle(status: string): StatusStyle {
	return statusStyles[status as StatusType] ?? statusStyles.Default;
}
