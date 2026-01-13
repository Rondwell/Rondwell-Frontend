<script lang="ts">
	import Icon from '@iconify/svelte';
	import Speakers from './Speakers.svelte';
	import Vendors from './Vendors.svelte';
	import Exhibitors from './Exhibitors.svelte';

	let searchQuery = '';

export const speakers  = [
		{
			id: 1,
			name: 'John Odoemenem',
			avatar: '/user.png',
			profile: 'UX Designer with 2+ years of experience in fintech…',
			sessionNum: 3,
			status: 'confirm' // maps to sessionStatus.panel
		},
		{
			id: 2,
			name: 'Edima Atahnasius',
			avatar: '/user.png',
			profile: 'Product manager with 3+ years of experience in fintech…',
			sessionNum: 2,
			status: 'invited'
		},
		{
			id: 3,
			name: 'Imabong Ekemini',
			avatar: '/user.png',
			profile: 'Software dev with 1+ years of experience in fintech…',
			sessionNum: 1,
			status: 'decline'
		},
		{
			id: 4,
			name: 'Imabong Ekemini',
			avatar: '/user.png',
			profile: 'Software dev with 1+ years of experience in fintech…',
			sessionNum: 0,
			status: 'accepted'
		},
		{
			id: 5,
			name: 'Imabong Ekemini',
			avatar: '/user.png',
			profile: 'Software dev with 1+ years of experience in fintech…',
			sessionNum: 3,
			status: 'manual'
		}
	];

		const handleStatus: any = {
		confirm: {
			label: 'Confirm',
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
		applied:{
			label: 'Applied',
			color: 'bg-orange-100 text-orange-700'
		},
		live:{
			label: 'Live',
			color: 'bg-cyan-100 text-cyan-700'
		},
		pending:{
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

	
</script>

<div class="">

	<Speakers />
	<Exhibitors />
	<Vendors />
</div>
