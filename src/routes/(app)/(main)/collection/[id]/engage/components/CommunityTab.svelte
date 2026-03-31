<script lang="ts">
	import { page } from '$app/stores';

	$: collectionId = $page.params.id ?? '';
</script>

<div class="py-4">
	<div class="mb-4">
		<h2 class="text-lg font-semibold">Community</h2>
		<p class="mt-1 text-sm text-[#737577]">
			Manage your collection's community space. Connect with subscribers and attendees.
		</p>
	</div>
	<div class="flex flex-col items-center justify-center gap-4 py-12">
		<img src="/noEvent.svg" alt="No community" class="h-40 w-40 opacity-60" />
		<p class="text-sm text-[#A2ACB2]">Community features coming soon.</p>
	</div>
</div>
