type StatusConfig = {
	label: string;
	color: string;
};

export const handleStatus: Record<string, StatusConfig> = {
	confirm: {
		label: 'Confirm',
		color: 'bg-green-100 text-green-700'
	},
	approved: {
		label: 'Approved',
		color: 'bg-green-100 text-green-700'
	},
	invited: {
		label: 'Invited',
		color: 'bg-blue-100 text-blue-700'
	},
	decline: {
		label: 'Decline',
		color: 'bg-red-100 text-red-700'
	},
	applied: {
		label: 'Applied',
		color: 'bg-orange-100 text-orange-700'
	},
	live: {
		label: 'Live',
		color: 'bg-cyan-100 text-cyan-700'
	},
	pending: {
		label: 'Pending',
		color: 'bg-yellow-100 text-yellow-700'
	},
	accepted: {
		label: 'Accepted',
		color: 'bg-amber-100 text-amber-700'
	},
	manual: {
		label: 'Manual Add',
		color: 'bg-gray-100 text-gray-700'
	}
};
