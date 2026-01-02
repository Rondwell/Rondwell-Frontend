<script>
	/**
	 * @type {number}
	 */
	let openItem;

	const items = [
		{
			question: 'What is Rondwell?',
			answer:
				'Rondwell is an all-in-one event technology platform that helps organizers create, manage, promote, and monetize virtual, physical, and hybrid events.'
		},
		{
			question: 'Who can use Rondwell?',
			answer:
				'Event organizers, businesses, communities, vendors, exhibitors, speakers, and attendees can all use Rondwell.'
		},
		{
			question: 'Does Rondwell support paid and free events?',
			answer:
				'Yes. Organizers can create free or paid events with flexible ticketing, pricing, and capacity controls.'
		},
		{
			question: 'What payment currencies does Rondwell support?',
			answer:
				'Rondwell supports multi-currency payments and settlements, including NGN, USD, and other supported currencies via integrated payment partners.'
		},
		{
			question: 'Can organizers manage vendors, speakers, and exhibitors?',
			answer:
				'Yes. Rondwell provides dedicated tools for managing vendors, speakers, exhibitors, schedules, and event resources.'
		},
		{
			question: 'Does Rondwell support virtual events?',
			answer:
				'Yes. Rondwell supports virtual, physical, and hybrid events with integrations for meeting platforms and custom links.'
		},
		{
			question: 'Is my data secure on Rondwell?',
			answer:
				'Absolutely. We use industry-standard security practices and continuously improve our infrastructure to protect user data.'
		}
	];
	/**
	 * @param {number} index
	 */

	function toggleItem(index) {
		openItem = openItem === index ? -1 : index;
	}
</script>

<div class="min-h-screen p-8">
	<div class="mx-auto max-w-5xl space-y-4">
		{#each items as item, i}
			<div class="overflow-hidden rounded-lg shadow-sm">
				<button
					on:click={() => toggleItem(i)}
					class="flex w-full items-center justify-between px-8 py-6 text-left transition-colors"
				>
					<h3 class="pr-4 text-xl font-semibold text-gray-900">
						{item.question}
					</h3>
					<div class="flex-shrink-0">
						{#if openItem === i}
							<svg
								class="h-6 w-6 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						{:else}
							<svg
								class="h-6 w-6 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
						{/if}
					</div>
				</button>

				{#if openItem === i}
					<div class="px-8 pb-6 text-lg leading-relaxed text-gray-700">
						{item.answer}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
