<script lang="ts">
	interface Booking {
		id: string;
		name: string;
		rating: string;
		type: 'Sale' | 'Booking';
		amount: number;
		timeAgo: string;
		status: 'Success' | 'Pending' | 'Failed';
	}

	let bookings: Booking[] = [
		{
			id: '1',
			name: 'Photography Package',
			rating: '#12332',
			type: 'Sale',
			amount: 1_250_000,
			timeAgo: '12 Minutes Ago',
			status: 'Success'
		},
		{
			id: '2',
			name: 'Photography Package',
			rating: '#12332',
			type: 'Sale',
			amount: 1_250_000,
			timeAgo: '12 Minutes Ago',
			status: 'Success'
		},
		{
			id: '3',
			name: 'Photography Package',
			rating: '#12332',
			type: 'Sale',
			amount: 1_250_000,
			timeAgo: '12 Minutes Ago',
			status: 'Success'
		},
		{
			id: '4',
			name: 'Photography Package',
			rating: '#12332',
			type: 'Sale',
			amount: 1_250_000,
			timeAgo: '12 Minutes Ago',
			status: 'Success'
		},
		{
			id: '5',
			name: 'Photography Package',
			rating: '#12332',
			type: 'Sale',
			amount: 1_250_000,
			timeAgo: '12 Minutes Ago',
			status: 'Success'
		}
	];

	function formatAmount(amount: number): string {
		return amount.toLocaleString();
	}
</script>

<div class="w-full max-w-6xl mx-auto p-6">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
			My Calendar/Bookings
		</h1>
		<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
			View all your confirmed bookings and manage your availability
		</p>
	</div>

	<!-- Bookings Table -->
	<div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each bookings as booking (booking.id)}
						<tr class="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors p-4">
							<!-- Package Info -->
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-purple-200 dark:bg-purple-900 rounded-lg flex items-center justify-center">
										<img src="/Brand.svg" alt="brand" />
									</div>
									<div class="flex gap-2">
										<p class="font-semibold text-gray-900 dark:text-white">{booking.name}</p>
                                        <span class="h-2 w-2 rounded-full bg-yellow-400 mt-1"></span>
										<p class="text-xs text-gray-600 dark:text-gray-400">{booking.rating}</p>
									</div>
								</div>
							</td>

							<!-- Type -->
							<td class="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
								{booking.type}
							</td>

							<!-- Amount -->
							<td class="px-6 py-4 text-gray-900 dark:text-white font-semibold">
								₦{formatAmount(booking.amount)}
							</td>

							<!-- Time -->
							<td class="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
								{booking.timeAgo}
							</td>

							<!-- Status -->
							<td class="px-6 py-4">
								<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
									{booking.status}
								</span>
							</td>

							<!-- Action -->
							<td class="px-6 py-4">
								<button class="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-800 dark:hover:text-purple-300 transition-colors">
									View Details
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
</style>
