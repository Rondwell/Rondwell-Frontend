<svelte:head>
	<title>Selling Tickets & Managing Registrations | Help Center | Rondwell</title>
	<meta name="description" content="Learn how to sell tickets, manage registrations, and handle check-ins on Rondwell." />
</svelte:head>

<div class="mx-auto max-w-4xl py-10">
	<span>
		<h1 class="mb-2 text-4xl font-bold">Selling Tickets & Managing Registrations</h1>
		<p class="text-sm text-[#868789]">
			Everything you need to know about ticketing, attendee management, and check-ins.
		</p>
		<p class="mt-3 w-fit rounded-full bg-[#F0E0D8] px-3 py-1 text-[#F77A3A]">Ticketing</p>
	</span>

	<article class="my-8 flex flex-col gap-5">
		<h2 class="text-2xl font-bold">Setting Up Ticket Types</h2>
		<p class="leading-relaxed text-gray-700">
			Rondwell supports unlimited ticket types per event. Common setups include Early Bird, Regular, VIP, and Group tickets. For each type, configure:
		</p>
		<ul class="ml-4 list-disc space-y-2 text-gray-700">
			<li><strong>Price</strong> — set to 0 for free tickets, or enter an amount in your preferred currency</li>
			<li><strong>Quantity</strong> — limit the number available, or leave unlimited</li>
			<li><strong>Sales window</strong> — set when ticket sales open and close</li>
			<li><strong>Visibility</strong> — public (anyone can buy) or hidden (invite-only via link)</li>
		</ul>
	</article>

	<article class="my-8 flex flex-col gap-5">
		<h2 class="text-2xl font-bold">Multi-Currency Pricing</h2>
		<p class="leading-relaxed text-gray-700">
			Rondwell supports NGN, USD, and EUR pricing. Attendees pay in the currency you set. Revenue from USD/EUR tickets settles to your USD wallet; NGN tickets settle to your NGN wallet. You can withdraw from either at any time.
		</p>
	</article>

	<article class="my-8 flex flex-col gap-5">
		<h2 class="text-2xl font-bold">Reserved Seating & Seat Maps</h2>
		<p class="leading-relaxed text-gray-700">
			For seated venues, Rondwell supports <strong>reserved seating</strong>. Design a seat map for your venue, assign ticket types to sections, and attendees pick their exact seats at checkout. Seats are briefly <strong>held</strong> while a buyer completes payment, then released automatically if the payment isn't finished — so you never double-sell a seat.
		</p>
	</article>

	<article class="my-8 flex flex-col gap-5">
		<h2 class="text-2xl font-bold">Refunds & Payment Settlement</h2>
		<p class="leading-relaxed text-gray-700">
			Paid ticket revenue is confirmed through Rondwell's payment webhooks and held in escrow before settling to your wallet — this protects both you and your attendees. If you need to refund a registration, do it from the <strong>Attendees</strong> tab; the refund is processed back to the attendee's original payment method, and your wallet balance is adjusted accordingly.
		</p>
	</article>

	<article class="my-8 flex flex-col gap-5">
		<h2 class="text-2xl font-bold">Managing Attendees & Check-In</h2>
		<p class="leading-relaxed text-gray-700">
			View all registered attendees from your event's <strong>Attendees</strong> tab. Each registration shows ticket type, payment status, and check-in state. Use the built-in QR scanner on the Rondwell mobile app or web dashboard to check attendees in at the door.
		</p>
		<p class="leading-relaxed text-gray-700">
			You can also export your attendee list as a CSV for offline use or integration with other tools.
		</p>
	</article>

	<div class="mt-8">
		<a href="/help-center" class="text-sm font-medium text-purple-600 hover:underline">← Back to Help Center</a>
	</div>
</div>
