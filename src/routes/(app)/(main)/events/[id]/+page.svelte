<!-- src/routes/event/+page.svelte -->
<script>
	import EndedEvent from './components/EndedEvent.svelte';
	import OnGoingEvent from './components/OnGoingEvent.svelte';

	// Mock data for the event
	const eventData = {
		title: "Faithful's Graduating Party",
		collection: 'John Collection',
		date: 'Wednesday, Sep 25',
		time: '11:30AM - 12:30AM GMT+1',
		location: 'Location Missing',
		description: 'Megaexe Party',
		organizer: 'John Calendar',
		approvalRequired: true,
		attendees: [
			{
				name: 'John Odoemenem',
				email: 'johnmedic23@gmail.com',
				status: 'Accepted',
				time: '13 Minutes Ago'
			}
		],
		admins: [{ name: 'John Odoemenem', email: 'johnmedic23@gmail.com', status: 'Admin' }],
		visibility: {
			calendar: 'John Calendar',
			status: 'Public'
		}
	};

	// {
	// 	title: 'Megaexe Party',
	// 	collection: 'John Collection',
	// 	date: 'Wednesday, Sep 25',
	// 	time: '11:30PM GMT+1',
	// 	location: 'Offline',
	// 	status: 'Event Has Ended',
	// 	attendees: 0,
	// 	guests: 1,
	// 	feedbackCollected: false,
	// 	invites: {
	// 		accepted: 1,
	// 		opened: 1,
	// 		declined: 0
	// 	},
	// 	recentRegistrations: [
	// 		{
	// 			name: 'John Odoemenem',
	// 			email: 'johnmedic23@gmail.com',
	// 			status: 'Unregistered',
	// 			time: '12 Minutes Ago'
	// 		},
	// 		{
	// 			name: 'John Odoemenem',
	// 			email: 'johnmedic23@gmail.com',
	// 			status: 'Attending',
	// 			time: 'Sep 23'
	// 		}
	// 	],
	// 	admins: [
	// 		{ name: 'John Odoemenem', email: 'johnmedic23@gmail.com', role: 'Creator' },
	// 		{ name: 'John Odoemenem', email: 'johnmedic23@gmail.com', role: 'Manager' }
	// 	],
	// 	visibility: {
	// 		calendar: 'JohnCalendar',
	// 		status: 'Public'
	// 	}
	// };
</script>

{#if eventData.date}
	<OnGoingEvent {eventData} />
{:else}
	<EndedEvent {eventData} />
{/if}
