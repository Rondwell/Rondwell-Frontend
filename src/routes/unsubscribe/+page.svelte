<!--
	FE-P2-10 — Email unsubscribe landing.

	Consumes a token from the email's List-Unsubscribe header (when the
	backend `/notifications/unsubscribe?token=...` endpoint ships) and
	confirms the opt-out.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	const API_URL = import.meta.env.VITE_API_URL;

	let status: 'loading' | 'success' | 'error' = 'loading';
	let message = '';

	$: token = $page.url.searchParams.get('token') ?? '';
	$: list = $page.url.searchParams.get('list') ?? 'marketing';

	onMount(async () => {
		if (!token) {
			status = 'error';
			message = 'No unsubscribe token provided.';
			return;
		}
		try {
			const res = await fetch(`${API_URL}/api/v1/notifications/unsubscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, list }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				status = 'error';
				message = data.message ?? 'Could not process unsubscribe. The link may have expired.';
				return;
			}
			status = 'success';
			message = data.message ?? 'You have been unsubscribed.';
		} catch (e: any) {
			status = 'error';
			message = e.message ?? 'Network error. Please try again.';
		}
	});
</script>

<svelte:head><title>Unsubscribe — Rondwell</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 via-white to-white p-4">
	<div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
		{#if status === 'loading'}
			<div class="flex flex-col items-center text-center">
				<Icon icon="mdi:email-outline" class="text-5xl text-gray-300" />
				<p class="mt-4 text-sm text-gray-500">Processing your request…</p>
			</div>
		{:else if status === 'success'}
			<div class="flex flex-col items-center text-center">
				<div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
					<Icon icon="mdi:email-off-outline" class="text-3xl text-green-600" />
				</div>
				<h1 class="mt-4 text-xl font-semibold text-gray-900">Unsubscribed</h1>
				<p class="mt-2 text-sm text-gray-600">{message}</p>
				<p class="mt-3 text-xs text-gray-400">
					You'll still receive transactional emails (receipts, security alerts, password resets).
				</p>
				<a
					href="/"
					class="mt-6 inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
				>
					Go home
				</a>
			</div>
		{:else}
			<div class="flex flex-col items-center text-center">
				<div class="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
					<Icon icon="mdi:alert-circle-outline" class="text-3xl text-red-600" />
				</div>
				<h1 class="mt-4 text-xl font-semibold text-gray-900">Couldn't unsubscribe</h1>
				<p class="mt-2 text-sm text-gray-600">{message}</p>
				<a
					href="/help-center?topic=email-preferences"
					class="mt-6 inline-flex rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Contact support
				</a>
			</div>
		{/if}
	</div>
</div>
