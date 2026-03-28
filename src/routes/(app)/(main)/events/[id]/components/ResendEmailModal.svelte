<script lang="ts">
	export let open = false;
	export let email = 'johnmedoc23@gmail.com';

	function resendEmail() {
		console.log('Resending confirmation email to:', email);
		open = false;
	}

	function cancel() {
		open = false;
	}
</script>

{#if open}
	<div
		on:click={() => (open = false)}
		on:keydown={(e) => e.key === 'Escape' && (open = false)}
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-xl bg-[#F4F5F6] shadow-xl"
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="space-y-4 px-6 py-6">
				<!-- Icon -->
				<div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF0F0]">
					<img src="/resend email.svg" alt="resend email" class="h-9 w-9" />
				</div>

				<h2 class="text-xl font-semibold text-gray-900">Resend Confirmation Email</h2>
				<p class="text-sm leading-snug text-[#8E8E90]">
					Please confirm that you want to resend the confirmation email to this guest ({email}).
				</p>

				<!-- Action Buttons -->
				<div class="flex gap-3">
					<button
						class="flex-1 rounded-lg bg-gray-900 py-3 text-center font-medium text-white transition hover:bg-gray-800"
						on:click={resendEmail}
					>
						Resend
					</button>
					<button
						class="flex-1 rounded-lg bg-[#F0F1F1] py-3 text-center font-medium text-[#727375] transition hover:bg-gray-200"
						on:click={cancel}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
