<script lang="ts">
	import { page } from '$app/stores';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import Dropdown from '../../../components/Dropdown.svelte';

	$: eventId = $page.params.id ?? '';
	$: token = $page.params.token ?? '';
	$: themeColor = eventId ? getEventTheme(eventId) : colors[0];

	let loading = true;
	let error = '';
	let memberData: any = null;
	let eventInfo: any = null;
	let ticketInfo: any = null;
	let registrationFields: any[] = [];

	// Form state
	let firstName = '';
	let lastName = '';
	let answers: Record<string, any> = {};
	let errors: Record<string, string> = {};
	let submitting = false;
	let submitError = '';
	let completed = false;
	let result: any = null;

	onMount(async () => {
		if (!token) { error = 'Invalid link'; loading = false; return; }
		const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;
		try {
			const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/registrations/group-member/${token}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? data.message ?? 'Invalid or expired link');

			memberData = data.member;
			eventInfo = data.event;
			ticketInfo = data.ticketType;
			registrationFields = data.registrationFields ?? [];

			firstName = memberData.firstName || '';
			lastName = memberData.lastName || '';

			if (memberData.status === 'CONFIRMED') {
				completed = true;
			}

			// Apply theme
			if (eventInfo?.themeColor) {
				const matched = colors.find(
					(c: Color) => c.name.toLowerCase() === eventInfo.themeColor.toLowerCase()
						|| c.bg.toLowerCase() === eventInfo.themeColor.toLowerCase()
				);
				if (matched) themeColor = matched;
			}
		} catch (e: any) {
			error = e.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	});

	$: filteredFields = registrationFields
		.filter((f: any) => {
			if (!f.ticketTypeIds || f.ticketTypeIds.length === 0) return true;
			return true; // Show all fields for group members
		})
		.sort((a: any, b: any) => a.order - b.order);

	function isValidEmail(e: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
	}

	function validate(): boolean {
		errors = {};
		if (!firstName.trim()) errors['firstName'] = 'First name is required.';
		for (const field of filteredFields) {
			if (field.isRequired) {
				const val = answers[field._id ?? field.formId];
				if (!val || (typeof val === 'string' && !val.trim())) {
					errors[field._id ?? field.formId] = `${field.fieldName} is required.`;
				}
			}
		}
		return Object.keys(errors).length === 0;
	}

	function getFieldInputType(fieldType: string): string {
		switch (fieldType) {
			case 'EMAIL': return 'email';
			case 'PHONE': return 'tel';
			case 'WEBSITE': return 'url';
			default: return 'text';
		}
	}

	async function handleSubmit() {
		if (!validate()) return;
		submitting = true;
		submitError = '';

		const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;
		const formAnswers = filteredFields.flatMap((f: any) => {
			const fid = f._id ?? f.formId;
			const val = answers[fid];
			if (val === undefined || val === null || val === '') return [];
			let answerValue = '';
			if (f.fieldType === 'CHECKBOX') answerValue = val ? 'Yes' : 'No';
			else if (Array.isArray(val)) answerValue = val.map((v: any) => typeof v === 'object' ? (v.value || v.label || String(v)) : String(v)).join(', ');
			else answerValue = String(val);
			if (!answerValue) return [];
			return [{ field_id: fid, answer_value: answerValue }];
		});

		try {
			const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/registrations/group-member/${token}/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					form_answers: formAnswers,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? data.message ?? 'Failed to complete profile');
			result = data.result;
			completed = true;
		} catch (e: any) {
			submitError = e.message || 'Something went wrong. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{eventInfo?.title ? `Complete Registration - ${eventInfo.title}` : 'Complete Registration'} | Rondwell</title>
</svelte:head>

<div class="flex min-h-screen w-full items-center justify-center px-4 py-8" style="background-color: {themeColor.bg};">
	<div class="w-full max-w-[480px]">

		{#if loading}
		<div class="flex flex-col items-center gap-4 animate-pulse">
			<div class="h-16 w-16 rounded-full" style="background-color: {themeColor.smallCover};"></div>
			<div class="h-6 w-48 rounded" style="background-color: {themeColor.smallCover};"></div>
			<div class="h-4 w-64 rounded" style="background-color: {themeColor.smallCover};"></div>
		</div>

		{:else if error}
		<div class="flex flex-col items-center text-center gap-5 rounded-2xl p-8" style="background-color: {themeColor.cover};">
			<div class="flex h-16 w-16 items-center justify-center rounded-full" style="background-color: {themeColor.smallCover};">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="{themeColor.lightText}" stroke-width="1.5"/><path d="M15 9l-6 6M9 9l6 6" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/></svg>
			</div>
			<h2 class="text-xl font-semibold" style="color: {themeColor.text};">Unable to load</h2>
			<p class="text-sm" style="color: {themeColor.lightText};">{error}</p>
		</div>

		{:else if completed}
		<!-- Completed state -->
		<div class="flex flex-col items-center text-center gap-6 rounded-2xl p-8" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
			<div class="flex h-20 w-20 items-center justify-center rounded-full" style="background-color: {themeColor.smallCover};">
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="{themeColor.button}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="{themeColor.button}" stroke-width="2"/></svg>
			</div>
			<h2 class="text-2xl font-semibold" style="color: {themeColor.text};">You're All Set!</h2>
			<p class="text-sm leading-relaxed" style="color: {themeColor.lightText};">
				Your profile is complete. You're registered for {eventInfo?.title ?? 'this event'}. Check your email for your ticket and QR code.
			</p>

			{#if result}
			<div class="w-full rounded-xl p-4 text-left space-y-3" style="background-color: {themeColor.bg}; border: 1px solid {themeColor.toggle};">
				<div class="flex justify-between">
					<span class="text-sm" style="color: {themeColor.lightText};">Name</span>
					<span class="text-sm font-medium" style="color: {themeColor.text};">{result.attendee_details?.firstName} {result.attendee_details?.lastName}</span>
				</div>
				{#if result.event_passcode}
				<div class="flex justify-between">
					<span class="text-sm" style="color: {themeColor.lightText};">Passcode</span>
					<span class="text-sm font-mono font-bold tracking-wider" style="color: {themeColor.button};">{result.event_passcode}</span>
				</div>
				{/if}
			</div>
			{#if result.qr_code_data}
			<div class="flex flex-col items-center gap-2">
				<p class="text-xs" style="color: {themeColor.lightText};">Your QR Code</p>
				<img src={result.qr_code_data} alt="QR Code" class="h-32 w-32 rounded-lg" />
			</div>
			{/if}
			{/if}

			<a href="/event-page/{eventId}" class="w-full rounded-lg py-2.5 text-center text-sm font-medium no-underline"
				style="background-color: {themeColor.button}; color: {themeColor.buttonText}; display: block;">
				View Event Page
			</a>
		</div>

		{:else}
		<!-- Profile completion form -->
		<div class="rounded-2xl p-6" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
			<!-- Event header -->
			<div class="mb-6 flex items-center gap-3">
				{#if eventInfo?.displayPictureUrl || eventInfo?.coverPictureUrl}
				<img src={eventInfo.displayPictureUrl || eventInfo.coverPictureUrl} class="size-12 rounded-lg object-cover" alt="event" />
				{:else}
				<div class="size-12 rounded-lg flex items-center justify-center text-xl" style="background-color: {themeColor.smallCover};">🎪</div>
				{/if}
				<div>
					<h2 class="text-lg font-medium" style="color: {themeColor.text};">{eventInfo?.title ?? 'Event'}</h2>
					<p class="text-xs" style="color: {themeColor.lightText};">Complete your registration</p>
				</div>
			</div>

			<div class="mb-5 rounded-lg px-3 py-2" style="background-color: {themeColor.smallCover};">
				<p class="text-xs" style="color: {themeColor.lightText};">
					You've been registered for this event. Please confirm your details below to receive your ticket.
				</p>
			</div>

			{#if submitError}
			<div class="mb-4 flex items-start gap-3 rounded-xl p-4 text-sm" style="background-color: #fef2f2; border: 1px solid #fecaca;">
				<span style="color: #991b1b;">{submitError}</span>
			</div>
			{/if}

			<form class="flex flex-col gap-5" on:submit|preventDefault={handleSubmit}>
				<div>
					<label class="text-sm" style="color: {themeColor.lightText};">First Name *</label>
					<input bind:value={firstName} type="text" placeholder="Your first name"
						class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
						style="background-color: {themeColor.bg}; border-color: {errors.firstName ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
					{#if errors.firstName}<p class="mt-1 text-xs text-red-500">{errors.firstName}</p>{/if}
				</div>

				<div>
					<label class="text-sm" style="color: {themeColor.lightText};">Last Name</label>
					<input bind:value={lastName} type="text" placeholder="Your last name"
						class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
						style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
				</div>

				<div>
					<label class="text-sm" style="color: {themeColor.lightText};">Email</label>
					<input value={memberData?.email ?? ''} type="email" disabled
						class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm opacity-60"
						style="background-color: {themeColor.smallCover}; border-color: {themeColor.toggle}; color: {themeColor.text};" />
				</div>

				<!-- Dynamic Custom Fields -->
				{#each filteredFields as field (field._id ?? field.formId)}
				{@const fid = field._id ?? field.formId}
				<div>
					<label class="text-sm" style="color: {themeColor.lightText};">
						{field.fieldName} {field.isRequired ? '*' : ''}
					</label>

					{#if field.fieldType === 'TEXT' || field.fieldType === 'SHORT_TEXT' || field.fieldType === 'COMPANY' || field.fieldType === 'EMAIL' || field.fieldType === 'PHONE' || field.fieldType === 'WEBSITE' || field.fieldType === 'WEB3_ETH_ADDRESS' || field.fieldType === 'WEB3_SOL_ADDRESS' || field.fieldType === 'SOCIAL_PROFILE'}
						<input
							bind:value={answers[fid]}
							type={getFieldInputType(field.fieldType)}
							placeholder={field.fieldType === 'PHONE' ? '+234...' : ''}
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
							style="background-color: {themeColor.bg}; border-color: {errors[fid] ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />

					{:else if field.fieldType === 'LONG_TEXT' || field.fieldType === 'CUSTOM_TEXT'}
						<textarea
							bind:value={answers[fid]}
							rows="3"
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2"
							style="background-color: {themeColor.bg}; border-color: {errors[fid] ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;">
						</textarea>

					{:else if field.fieldType === 'CHECKBOX'}
						<label class="mt-2 flex items-center gap-3 cursor-pointer select-none rounded-lg px-3 py-2.5"
							style="background-color: {themeColor.bg};">
							<input type="checkbox" bind:checked={answers[fid]}
								class="h-5 w-5 rounded border-2 cursor-pointer"
								style="accent-color: {themeColor.button};" />
							<span class="text-sm" style="color: {themeColor.text};">{field.fieldName}</span>
						</label>

					{:else if field.fieldType === 'OPTIONS' && field.selectionType === 'single'}
						<div class="mt-2">
							<Dropdown
								options={(field.options ?? []).map((o: string) => ({ value: o, label: o }))}
								value={answers[fid] ?? null}
								placeholder="Select an option"
								{themeColor}
								on:change={(e) => answers[fid] = e.detail.value ?? ''}
							/>
						</div>

					{:else if (field.fieldType === 'OPTIONS' && field.selectionType === 'multiple') || field.fieldType === 'MULTI_SELECT'}
						<div class="mt-2">
							<Dropdown
								options={(field.options ?? []).map((o: string) => ({ value: o, label: o }))}
								value={answers[fid] ?? []}
								placeholder="Select options"
								multiple={true}
								{themeColor}
								on:change={(e) => answers[fid] = e.detail.value ?? []}
							/>
						</div>

					{:else}
						<input bind:value={answers[fid]} type="text"
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
							style="background-color: {themeColor.bg}; border-color: {errors[fid] ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
					{/if}

					{#if errors[fid]}<p class="mt-1 text-xs text-red-500">{errors[fid]}</p>{/if}
				</div>
				{/each}

				<button type="submit" disabled={submitting}
					class="w-full rounded-lg py-3 text-base font-medium transition-all disabled:opacity-60"
					style="background-color: {themeColor.button}; color: {themeColor.buttonText};">
					{#if submitting}
						<span class="inline-flex items-center gap-2">
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
							Completing...
						</span>
					{:else}
						Complete Registration
					{/if}
				</button>
			</form>
		</div>
		{/if}
	</div>
</div>
