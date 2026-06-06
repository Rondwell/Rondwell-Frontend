<!--
	FE-P3-10 (NEW-9.2) — Super-admin user detail with anonymise PII action.

	Backend reference:
	  POST /api/v1/payment/admin/users/:id/anonymise

	Used for compliance-driven manual anonymisation outside the normal
	30-day grace flow. Destructive (financial records remain for 7y but PII
	is scrubbed irreversibly), so we gate behind a typed-confirmation step.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { adminAnonymiseUser } from '$lib/services/wallet.services';
	import Icon from '@iconify/svelte';

	$: userId = $page.params.id ?? '';

	let confirming = false;
	let typedConfirm = '';
	let submitting = false;
	let error = '';
	let success = '';

	async function handleAnonymise() {
		if (typedConfirm !== 'ANONYMISE') {
			error = 'Type ANONYMISE to confirm.';
			return;
		}
		submitting = true;
		error = '';
		try {
			await adminAnonymiseUser(userId);
			success = 'User PII anonymised. Financial records retained per the 7-year retention policy.';
			confirming = false;
			typedConfirm = '';
		} catch (e: any) {
			error = e?.message ?? 'Failed to anonymise user.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>User · {userId} · HQ</title>
</svelte:head>

<div class="mx-auto max-w-3xl p-4 sm:p-6">
	<button
		type="button"
		on:click={() => goto('/hq/users')}
		class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
	>
		<Icon icon="mdi:arrow-left" class="text-lg" /> Back to users
	</button>

	<div class="rounded-xl border bg-white p-6">
		<h1 class="text-xl font-bold">User detail</h1>
		<p class="mt-0.5 text-xs text-gray-500 break-all">{userId}</p>

		<div class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
			<div class="mb-2 flex items-center gap-2">
				<Icon icon="mdi:shield-alert-outline" class="text-lg text-red-600" />
				<h2 class="text-base font-semibold text-red-900">Anonymise PII</h2>
			</div>
			<p class="text-sm text-red-800">
				Compliance-driven manual anonymisation. Personal data (name, email, phone, addresses) is
				scrubbed irreversibly. Financial records remain for the 7-year regulatory retention.
			</p>

			{#if success}
				<p class="mt-3 rounded-md bg-emerald-100 p-2 text-xs text-emerald-800">{success}</p>
			{:else if confirming}
				<div class="mt-3 space-y-2">
					<label class="block text-xs font-medium text-red-900">
						Type <code class="rounded bg-red-100 px-1">ANONYMISE</code> to confirm:
						<input
							type="text"
							bind:value={typedConfirm}
							class="mt-1 w-full rounded-md border border-red-200 bg-white px-2 py-1 text-sm focus:outline-none"
						/>
					</label>
					{#if error}<p class="text-xs text-red-700">{error}</p>{/if}
					<div class="flex gap-2">
						<button
							on:click={() => { confirming = false; typedConfirm = ''; error = ''; }}
							class="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700"
						>
							Cancel
						</button>
						<button
							on:click={handleAnonymise}
							disabled={submitting || typedConfirm !== 'ANONYMISE'}
							class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
						>
							{submitting ? 'Anonymising…' : 'Anonymise PII'}
						</button>
					</div>
				</div>
			{:else}
				<button
					on:click={() => (confirming = true)}
					class="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
				>
					Anonymise PII…
				</button>
			{/if}
		</div>
	</div>
</div>
