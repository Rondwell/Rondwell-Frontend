<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getAllProfiles } from '$lib/services/profile.services';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { setPostAuthRedirect } from '$lib/utils/redirect';
	import { onMount } from 'svelte';

	let { children } = $props();
	let checked = $state(false);

	onMount(() => {
		const unsub = isAuthenticated.subscribe(async (authed) => {
			if (browser && !authed) {
				// Preserve the current URL so user returns here after auth
				const currentUrl = $page.url.pathname + $page.url.search;
				setPostAuthRedirect(currentUrl);
				goto('/auth');
				return;
			}

			if (browser && authed) {
				const currentPath = $page.url.pathname;
				// Don't redirect if already on onboarding
				if (currentPath.startsWith('/exhibitor/onboarding')) {
					checked = true;
					return;
				}

				try {
					const profiles = await getAllProfiles();
					const exhibitorProfile = profiles.find((p) => p.role === 'EXHIBITOR');
					if (!exhibitorProfile || exhibitorProfile.onboardingStatus !== 'COMPLETED') {
						goto('/exhibitor/onboarding');
						return;
					}
				} catch {
					// If profile fetch fails, let them through (auth guard already passed)
				}
			}

			checked = true;
		});
		return unsub;
	});
</script>

{#if checked}
	{@render children()}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#513BE2]"></div>
	</div>
{/if}
