<script>
	export let subscriber;
	export let open = false;
</script>

{#if open}
	<div id="ticket" class="triangle absolute top-7 right-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[142px] max-w-lg gap-1 rounded-lg bg-[#FFFCFC] p-2 shadow-lg">
			<!-- Collapse Icon -->

			<div class="flex w-[130px] flex-col items-center gap-2">
				{#if !subscriber?.name}
					<button
						class="flex w-full gap-1 rounded-md px-2 py-1 text-sm transition hover:bg-[#F0F0F0]"
					>
						<img src="/add-name-icon.svg" alt="add name" class="h-4 w-4" /> Add Name
					</button>{/if}
				<button
					class="flex w-full gap-1 rounded-md px-2 py-1 text-sm transition hover:bg-[#F0F0F0]"
				>
					<img src="/remove-icon.svg" alt="remove" class="h-4 w-4" /> Remove
				</button>
				<button
					class=" flex w-full gap-1 rounded-md px-2 py-1 text-sm transition hover:bg-[#F0F0F0]"
				>
					<img src="/block-icon.svg" alt="block" class="h-4 w-4" /> Block
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Triangle pointer */
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		right: 10px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
