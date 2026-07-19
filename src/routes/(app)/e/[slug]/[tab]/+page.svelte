<!--
	This route always redirects (or errors) in `+page.server.ts`, so this
	component only shows briefly while the redirect resolves. It mirrors the
	loading state used by `/e/[slug]`.
-->
<div class="flex h-screen items-center justify-center bg-white">
	<div class="flex flex-col items-center gap-4">
		<div class="flex items-center gap-2">
			<span class="inline-block h-2 w-2 rounded-full bg-[#DB3EC6] animate-[pulse-dot_1.6s_ease-in-out_infinite]"></span>
			<span class="inline-block h-2 w-2 rounded-full bg-[#8B3AD4] animate-[pulse-dot_1.6s_ease-in-out_0.2s_infinite]"></span>
			<span class="inline-block h-2 w-2 rounded-full bg-[#513BE2] animate-[pulse-dot_1.6s_ease-in-out_0.4s_infinite]"></span>
		</div>
		<p class="text-sm text-gray-400">Loading event</p>
	</div>
</div>

<style>
	@keyframes pulse-dot {
		0%, 100% { opacity: 0.3; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.4); }
	}
</style>
