<script lang="ts">
	import { subMenuItems, activeSubItem } from '$lib/stores/uiStore.js';
	import eventsIcon from '$lib/utils/svg';
	import { onMount } from 'svelte';

	onMount(() => {
		subMenuItems.set([
			{ label: 'Overview', icon: `${eventsIcon.overviewIcon}`, nav: '/events' },
			{ label: 'Attendees', icon: `${eventsIcon.attendeeIcon}`, nav: '/events/attendees' },
			{
				label: 'Registration',
				icon: `${eventsIcon.registrationIcon}`,
				nav: '/events/registration'
			},
			{
				label: 'Participants',
				icon: `${eventsIcon.participantsIcon}`,
				nav: '/events/participants'
			},
			{ label: 'Planning', icon: `${eventsIcon.planningIcon}`, nav: '/events/planning' },
			{ label: 'Insights', icon: `${eventsIcon.insightsIcon}`, nav: '/events/insights' },
			{ label: 'More', icon: `${eventsIcon.moreIcon}`, nav: '/events/more' }
		]);
		activeSubItem.set('Overview');
	});
</script>

<slot />
