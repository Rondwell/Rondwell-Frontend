<!--
	Orders & Tickets tab. Surfaces entry points into the attendee/customer
	order pages. Each card routes to its dedicated /account page where the
	full list + detail views live.
-->
<script lang="ts">
	import SettingsLinkCard from './SettingsLinkCard.svelte';
</script>

<div class="mb-12">
	<div class="mb-6">
		<h2 class="text-lg font-semibold">Orders & Tickets</h2>
		<p class="text-sm text-[#8C8F93]">
			Everything you've bought on Rondwell — event tickets and marketplace orders.
		</p>
	</div>

	<div class="space-y-3">
		<SettingsLinkCard
			icon="mdi:ticket-confirmation-outline"
			title="My Tickets"
			description="View your event tickets, transfer or resell when allowed."
			href="/account/tickets?from=orders"
			iconBg="bg-pink-50"
			iconColor="text-pink-600"
		/>
		<SettingsLinkCard
			icon="mdi:basket-outline"
			title="My Purchases"
			description="Products and bookings you've bought from vendors."
			href="/account/purchases?from=orders"
			iconBg="bg-purple-50"
			iconColor="text-purple-600"
		/>
	</div>
</div>
