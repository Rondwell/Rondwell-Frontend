<script lang="ts">
	import { publicSubscribeToCollection } from '$lib/services/collection.services';
	import { authState, isAuthenticated } from '$lib/stores/auth.store';
	import { toast } from '$lib/stores/toast.store';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';

	export let open = false;
	export let collectionId: string = '';
	export let collectionName: string = '';
	export let themeColor: Color = colors[0];
	export let onSubscribed: () => void = () => {};

	let firstName = '';
	let lastName = '';
	let email = '';
	let errors: Record<string, string> = {};
	let submitting = false;

	$: currentUser = $authState.user;

	$: if (open) {
		firstName = '';
		lastName = '';
		email = '';
		errors = {};
		submitting = false;
		// If logged in, auto-subscribe immediately
		if ($isAuthenticated && currentUser) {
			handleLoggedInSubscribe();
		}
	}

	function isValidEmail(e: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
	}

	function validate(): boolean {
		errors = {};
		if (!firstName.trim()) errors['firstName'] = 'First name is required.';
		if (!email.trim()) errors['email'] = 'Email is required.';
		else if (!isValidEmail(email)) errors['email'] = 'Please enter a valid email.';
		return Object.keys(errors).length === 0;
	}

	async function handleLoggedInSubscribe() {
		submitting = true;
		try {
			const profileName = $authState.activeProfile?.name || '';
			const result = await publicSubscribeToCollection(collectionId, {
				email: currentUser?.email,
				firstName: profileName.split(' ')[0] || '',
				lastName: profileName.split(' ').slice(1).join(' ') || '',
				userId: currentUser?.id,
			});
			if (result.alreadySubscribed) {
				toast.info('You are already subscribed to this collection.');
			} else {
				toast.success(`Subscribed to ${collectionName} successfully!`);
			}
			onSubscribed();
			open = false;
		} catch (e: any) {
			toast.error(e.message || 'Failed to subscribe');
		} finally {
			submitting = false;
		}
	}

	async function handleGuestSubscribe() {
		if (!validate()) return;
		submitting = true;
		try {
			const result = await publicSubscribeToCollection(collectionId, {
				email: email.trim().toLowerCase(),
				firstName: firstName.trim(),
				lastName: lastName.trim(),
			});
			if (result.alreadySubscribed) {
				toast.info('This email is already subscribed.');
			} else if (result.pendingVerification) {
				toast.info('A confirmation email was already sent. Please check your inbox.');
			} else if (result.autoActivated) {
				toast.success(`Subscribed to ${collectionName} successfully!`);
			} else {
				toast.success('Please check your email to confirm your subscription.');
			}
			onSubscribed();
			open = false;
		} catch (e: any) {
			toast.error(e.message || 'Failed to subscribe');
		} finally {
			submitting = false;
		}
	}
</script>

{#if open && !$isAuthenticated}
<div class="fixed inset-0 z-50 flex items-center justify-center px-4"
	on:click={() => (open = false)}
	on:keydown={(e) => { if (e.key === 'Escape') open = false; }}
	role="dialog"
	aria-modal="true">
	<div class="absolute inset-0" style="background-color: {themeColor.bg}CC; backdrop-filter: blur(12px);"></div>
	<div class="relative w-full max-w-sm rounded-2xl p-6 shadow-xl"
		style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};"
		on:click|stopPropagation
		on:keydown|stopPropagation
		role="document">

		<!-- Close -->
		<button class="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full transition"
			style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
			on:click={() => (open = false)} aria-label="Close">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
		</button>

		<!-- Header -->
		<div class="mb-5 flex items-center gap-3">
			<div class="flex h-11 w-11 items-center justify-center rounded-xl" style="background-color: {themeColor.smallCover};">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 8.608v.153l-9.422 5.685a1.2 1.2 0 01-1.156 0L2 8.76v-.153A3.6 3.6 0 015.6 5h12.8A3.6 3.6 0 0122 8.608z" fill="{themeColor.button}"/><path d="M2 8.76v6.64A3.6 3.6 0 005.6 19h12.8a3.6 3.6 0 003.6-3.6V8.608l-9.422 5.685a1.2 1.2 0 01-1.156 0L2 8.76z" fill="{themeColor.button}" opacity="0.4"/></svg>
			</div>
			<div>
				<h3 class="text-lg font-semibold" style="color: {themeColor.text};">Subscribe</h3>
				<p class="text-xs" style="color: {themeColor.lightText};">Get updates from {collectionName}</p>
			</div>
		</div>

		<form class="flex flex-col gap-4" on:submit|preventDefault={handleGuestSubscribe}>
			<div>
				<label class="text-xs font-medium" style="color: {themeColor.lightText};">First Name *</label>
				<input bind:value={firstName} type="text" placeholder="Your first name"
					class="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
					style="background-color: {themeColor.bg}; border-color: {errors.firstName ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
				{#if errors.firstName}<p class="mt-1 text-xs text-red-500">{errors.firstName}</p>{/if}
			</div>
			<div>
				<label class="text-xs font-medium" style="color: {themeColor.lightText};">Last Name</label>
				<input bind:value={lastName} type="text" placeholder="Your last name"
					class="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
					style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
			</div>
			<div>
				<label class="text-xs font-medium" style="color: {themeColor.lightText};">Email *</label>
				<input bind:value={email} type="email" placeholder="you@example.com"
					class="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
					style="background-color: {themeColor.bg}; border-color: {errors.email ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
				{#if errors.email}<p class="mt-1 text-xs text-red-500">{errors.email}</p>{/if}
			</div>
			<button type="submit" disabled={submitting}
				class="w-full rounded-lg py-3 text-sm font-medium transition-all disabled:opacity-60"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText};">
				{#if submitting}
					<span class="inline-flex items-center gap-2">
						<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
						Subscribing...
					</span>
				{:else}
					Subscribe
				{/if}
			</button>
			<p class="text-center text-xs" style="color: {themeColor.lightText};">
				You'll receive a confirmation email to verify your subscription.
			</p>
		</form>
	</div>
</div>
{/if}
