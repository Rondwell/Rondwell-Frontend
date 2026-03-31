<script lang="ts">
	import { page } from '$app/stores';

	$: collectionId = $page.params.id ?? '';
</script>

<div class="py-4">
	<div class="mb-4">
		<h2 class="text-lg font-semibold">Subscribers</h2>
		<p class="mt-1 text-sm text-[#737577]">
			People who subscribe to your collection will appear here. Event attendees are automatically added.
		</p>
	</div>
	<div class="flex flex-col items-center justify-center gap-4 py-12">
		<img src="/noEvent.svg" alt="No subscribers" class="h-40 w-40 opacity-60" />
		<p class="text-sm text-[#A2ACB2]">No subscribers yet.</p>
	</div>
</div>
