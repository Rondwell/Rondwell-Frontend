<script lang="ts">
	/** Which dashboard layout to render: vendor has 6 stat cards, exhibitor has 4, speaker has 3 */
	export let variant: 'vendor' | 'exhibitor' | 'speaker' = 'vendor';

	const statCount = variant === 'vendor' ? 6 : variant === 'exhibitor' ? 4 : 3;
	const statCols = variant === 'exhibitor' ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
</script>

<div class="min-h-screen w-full animate-pulse text-[#101828]">
	<!-- Header skeleton -->
	<div class="mb-8 flex items-center gap-3">
		<div class="h-8 w-8 rounded-lg bg-gray-200"></div>
		<div class="h-6 w-48 rounded-md bg-gray-200"></div>
	</div>

	{#if variant === 'exhibitor'}
		<!-- Welcome line -->
		<div class="mb-8 flex items-center gap-2">
			<div class="h-4 w-24 rounded bg-gray-200"></div>
			<div class="h-4 w-32 rounded bg-gray-200"></div>
		</div>
	{/if}

	<!-- Stat cards skeleton -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 {statCols}">
		{#each Array(statCount) as _}
			<div class="flex h-[180px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<div>
					<div class="mb-3 h-10 w-10 rounded-full bg-gray-200"></div>
					<div class="mb-2 h-7 w-16 rounded bg-gray-200"></div>
					<div class="h-3 w-24 rounded bg-gray-100"></div>
				</div>
				<div class="h-10 w-full rounded-xl bg-gray-200"></div>
			</div>
		{/each}
	</div>

	<!-- Divider -->
	<div class="my-8 h-px w-full bg-gray-100"></div>

	<!-- Section header skeleton -->
	<div class="mb-4 flex items-center justify-between">
		<div>
			<div class="mb-2 flex items-center gap-2">
				<div class="h-5 w-56 rounded bg-gray-200"></div>
				<div class="h-6 w-6 rounded-full bg-gray-200"></div>
			</div>
			<div class="h-3 w-40 rounded bg-gray-100"></div>
		</div>
		<div class="h-9 w-44 rounded-lg bg-gray-200"></div>
	</div>

	<!-- List items skeleton -->
	<div class="space-y-3">
		{#each Array(3) as _}
			<div class="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
				<div class="flex items-center gap-3">
					<div class="h-10 w-10 rounded-full bg-gray-200"></div>
					<div>
						<div class="mb-2 h-4 w-36 rounded bg-gray-200"></div>
						<div class="h-3 w-24 rounded bg-gray-100"></div>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<div class="h-4 w-20 rounded bg-gray-200"></div>
					<div class="h-3 w-16 rounded bg-gray-100"></div>
					<div class="h-8 w-24 rounded-lg bg-gray-200"></div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Divider -->
	<div class="my-8 h-px w-full bg-gray-100"></div>

	<!-- Second section header -->
	<div class="mb-4 flex items-center justify-between">
		<div>
			<div class="mb-2 h-5 w-44 rounded bg-gray-200"></div>
			<div class="h-3 w-32 rounded bg-gray-100"></div>
		</div>
		<div class="h-9 w-36 rounded-lg bg-gray-200"></div>
	</div>

	<!-- Transaction-like rows skeleton -->
	<div class="space-y-3">
		{#each Array(2) as _}
			<div class="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
				<div class="flex items-center gap-4">
					<div class="h-10 w-10 rounded-full bg-gray-200"></div>
					<div>
						<div class="mb-2 h-4 w-44 rounded bg-gray-200"></div>
						<div class="h-3 w-20 rounded bg-gray-100"></div>
					</div>
				</div>
				<div class="flex items-center gap-6">
					<div class="h-4 w-24 rounded bg-gray-200"></div>
					<div class="h-3 w-20 rounded bg-gray-100"></div>
					<div class="h-6 w-16 rounded-md bg-gray-200"></div>
					<div class="h-8 w-24 rounded-lg bg-gray-200"></div>
				</div>
			</div>
		{/each}
	</div>
</div>
