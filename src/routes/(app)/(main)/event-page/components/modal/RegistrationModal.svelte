<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getPublicEventPage, getPublicSeats, getGroupRegistrationMembers } from '$lib/services/event.services';
	import {
		attendeePaymentInitiate,
		verifyAndSettleTicketPayment,
	} from '$lib/services/payment.services';
	import { isAuthenticated } from '$lib/stores/auth.store';
	import { getEventTheme } from '$lib/stores/eventTheme';
	import type { Color } from '$lib/utils/colors';
	import { colors } from '$lib/utils/colors';
	import { formatMoney, majorToKobo } from '$lib/utils/money';
	import Icon from '@iconify/svelte';
	import Dropdown from '../Dropdown.svelte';
	import SeatSelector from '../SeatSelector.svelte';

	export let open = false;
	export let eventData: any = null;
	export let selectedTicketId: string = '';
	export let ticketTypes: any[] = [];
	export let registrationFields: any[] = [];
	export let ticketQuantity: number = 1;
	export let isGroupRegistration: boolean = false;

	$: eventId = $page.params.id ?? '';
	$: themeColor = eventId ? getEventTheme(eventId) : colors[0];
	$: selectedTicket = ticketTypes.find((t: any) => t._id === selectedTicketId) ?? null;

	// Filter registration fields for the selected ticket type
	$: filteredFields = registrationFields
		.filter((f: any) => {
			if (!f.ticketTypeIds || f.ticketTypeIds.length === 0) return true;
			return f.ticketTypeIds.includes(selectedTicketId);
		})
		.sort((a: any, b: any) => a.order - b.order);

	// Form state
	let firstName = '';
	let lastName = '';
	let email = '';
	let phone = '';
	let ethAddress = '';
	let solAddress = '';
	let answers: Record<string, any> = {};
	let errors: Record<string, string> = {};
	let submitting = false;
	let submitError = '';
	let selectedGateway: 'PAYSTACK' = 'PAYSTACK';

	// Terms expand/collapse state per field
	let termsExpanded: Record<string, boolean> = {};

	// Registration form settings from event
	$: phoneEnabled = eventData?.registrationFormSettings?.phoneEnabled ?? 'OFF';
	$: ethAddressEnabled = eventData?.registrationFormSettings?.ethAddressEnabled ?? 'OFF';
	$: solAddressEnabled = eventData?.registrationFormSettings?.solAddressEnabled ?? 'OFF';

	// Steps: 'form' | 'group-members' | 'seats' | 'payment' | 'confirmation'
	let step: 'form' | 'group-members' | 'seats' | 'payment' | 'confirmation' = 'form';
	let registrationResult: any = null;
	let selectedSeatId = '';
	let selectedSeatNumber = '';
	let hasSeatLayout = false;

	/**
	 * FE-P1-13 (FA-3.5) — FX preview state.
	 *
	 * Populated after `attendeePaymentInitiate` returns. The backend already
	 * locks the rate at checkout and persists it on the transaction; this is
	 * a display-only echo so the user knows exactly how much will be charged
	 * before opening the Paystack popup. Pre-flight FX preview will move to a
	 * dedicated `/payment/fx/preview` endpoint when it lands.
	 */
	type FxPreview = {
		sourceCurrency: string;
		sourceAmountKobo: number;
		targetCurrency: string;
		targetAmountKobo: number;
		formattedSource: string;
		formattedTarget: string;
		rateLabel: string;
	};
	let fxPreview: FxPreview | null = null;

	/**
	 * FE-P3-05 (FA-3.1, NEW-1.2, NEW-10.2) — Group purchase per-member
	 * registrations. The backend pre-creates N placeholders on the group
	 * register call and finalizes each on payment success with its own QR.
	 * After payment confirmation we fetch them so the modal can show
	 * every member's QR / passcode instead of only the lead's.
	 */
	let groupMemberRegistrations: any[] = [];
	let loadingGroupMembers = false;
	let groupQrIndex = 0;

	// Group members state
	interface GroupMember {
		firstName: string;
		lastName: string;
		email: string;
	}
	let groupMembers: GroupMember[] = [];
	let editingMemberIndex: number = -1;
	let memberFirstName = '';
	let memberLastName = '';
	let memberEmail = '';
	let memberErrors: Record<string, string> = {};

	$: groupMemberCount = isGroupRegistration ? ticketQuantity - 1 : 0;

	// Initialize group members array when quantity changes
	$: if (isGroupRegistration && groupMembers.length !== groupMemberCount) {
		const existing = [...groupMembers];
		groupMembers = Array.from({ length: groupMemberCount }, (_, i) => existing[i] ?? { firstName: '', lastName: '', email: '' });
	}

	function resetForm() {
		firstName = '';
		lastName = '';
		email = '';
		phone = '';
		ethAddress = '';
		solAddress = '';
		answers = {};
		errors = {};
		submitting = false;
		submitError = '';
		step = 'form';
		registrationResult = null;
		selectedSeatId = '';
		selectedSeatNumber = '';
		hasSeatLayout = false;
		groupMembers = [];
		editingMemberIndex = -1;
		memberFirstName = '';
		memberLastName = '';
		memberEmail = '';
		memberErrors = {};
		fxPreview = null;
		groupMemberRegistrations = [];
		loadingGroupMembers = false;
		groupQrIndex = 0;
	}

	$: if (open) {
		resetForm();
		// Check if this ticket type has a seat layout
		if (eventId && selectedTicketId) {
			getPublicSeats(eventId, selectedTicketId).then(data => {
				hasSeatLayout = !!(data.layout && data.layout.elements?.length > 0);
			}).catch(() => { hasSeatLayout = false; });
		}
	}

	/**
	 * FE-P3-05 — load every member registration for a group purchase. Best-
	 * effort: if the endpoint isn't yet enabled we silently fall back to
	 * the lead-only view.
	 */
	async function loadGroupMemberRegistrations() {
		if (!isGroupRegistration || !registrationResult) return;
		const groupId =
			registrationResult.groupId ??
			registrationResult.group_id ??
			registrationResult.registration_group_id ??
			registrationResult.registrationId ??
			registrationResult.registration_id;
		if (!groupId) return;
		loadingGroupMembers = true;
		try {
			const members = await getGroupRegistrationMembers(eventId, groupId);
			if (Array.isArray(members) && members.length > 0) {
				groupMemberRegistrations = members;
			}
		} catch {
			// Best-effort.
		} finally {
			loadingGroupMembers = false;
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

		if (phoneEnabled === 'REQUIRED' && !phone.trim()) errors['phone'] = 'Phone number is required.';
		if (ethAddressEnabled === 'REQUIRED' && !ethAddress.trim()) errors['ethAddress'] = 'Ethereum address is required.';
		if (solAddressEnabled === 'REQUIRED' && !solAddress.trim()) errors['solAddress'] = 'Solana address is required.';

		for (const field of filteredFields) {
			if (field.isRequired) {
				const val = answers[field._id ?? field.formId];
				if (!val || (typeof val === 'string' && !val.trim())) {
					errors[field._id ?? field.formId] = `${field.fieldName} is required.`;
				}
				if (Array.isArray(val) && val.length === 0) {
					errors[field._id ?? field.formId] = `${field.fieldName} is required.`;
				}
			}
		}
		return Object.keys(errors).length === 0;
	}

	function formatTicketTotalForQty(ticket: any, qty: number): string {
		// FE-P0-01 / FE-P1-16: route every ticket-price string through the
		// currency-aware `formatMoney(amountKobo, currency)` helper. Until the
		// backend serves `priceKobo` directly we convert the legacy major-unit
		// `ticket.price` at the boundary exactly once via `majorToKobo`.
		if (!ticket || ticket.isFree || !ticket.price) return 'FREE';
		const currency = ticket.currency ?? 'NGN';
		const totalKobo = majorToKobo(ticket.price, currency) * Math.max(1, qty);
		return formatMoney(totalKobo, currency, { minimumFractionDigits: 0 });
	}

	function formatDate(dt: string): string {
		if (!dt) return '';
		const d = new Date(dt);
		return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
	}

	async function handleSubmit() {
		if (!validate()) return;

		// If group registration, go to group members step
		if (isGroupRegistration && step === 'form') {
			step = 'group-members';
			return;
		}

		// If seat layout exists, go to seat selection first
		if (hasSeatLayout && step === 'form') {
			step = 'seats';
			return;
		}

		await proceedToRegistration();
	}

	function validateGroupMembers(): boolean {
		// Check all members have required fields
		for (let i = 0; i < groupMembers.length; i++) {
			const m = groupMembers[i];
			if (!m.firstName.trim() || !m.email.trim()) return false;
			if (!isValidEmail(m.email)) return false;
		}
		// Check for duplicate emails (including lead email)
		const allEmails = [email.toLowerCase(), ...groupMembers.map(m => m.email.toLowerCase())];
		return new Set(allEmails).size === allEmails.length;
	}

	function validateMemberForm(): boolean {
		memberErrors = {};
		if (!memberFirstName.trim()) memberErrors['firstName'] = 'First name is required.';
		if (!memberEmail.trim()) memberErrors['email'] = 'Email is required.';
		else if (!isValidEmail(memberEmail)) memberErrors['email'] = 'Please enter a valid email.';
		else {
			// Check for duplicates
			const allEmails = [email.toLowerCase(), ...groupMembers.map((m, i) => i !== editingMemberIndex ? m.email.toLowerCase() : '')].filter(Boolean);
			if (allEmails.includes(memberEmail.trim().toLowerCase())) {
				memberErrors['email'] = 'This email is already used by another attendee.';
			}
		}
		return Object.keys(memberErrors).length === 0;
	}

	function saveMember() {
		if (!validateMemberForm()) return;
		groupMembers[editingMemberIndex] = {
			firstName: memberFirstName.trim(),
			lastName: memberLastName.trim(),
			email: memberEmail.trim().toLowerCase(),
		};
		groupMembers = groupMembers;
		editingMemberIndex = -1;
		memberFirstName = '';
		memberLastName = '';
		memberEmail = '';
		memberErrors = {};
	}

	function openMemberEditor(index: number) {
		const m = groupMembers[index];
		memberFirstName = m.firstName;
		memberLastName = m.lastName;
		memberEmail = m.email;
		editingMemberIndex = index;
		memberErrors = {};
	}

	function closeMemberEditor() {
		editingMemberIndex = -1;
		memberFirstName = '';
		memberLastName = '';
		memberEmail = '';
		memberErrors = {};
	}

	async function proceedToRegistration() {
		submitting = true;
		submitError = '';

		const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;
		const formAnswers = filteredFields.flatMap((f: any) => {
			const fid = f._id ?? f.formId;
			const val = answers[fid];

			// Skip empty answers
			if (val === undefined || val === null || val === '') return [];

			let answerValue = '';

			if (f.fieldType === 'TERMS_CHECKBOX') {
				if (!val) return [];
				const sig = answers[fid + '_signature'];
				answerValue = sig ? `Accepted (Signed: ${sig})` : 'Accepted';
			} else if (f.fieldType === 'CHECKBOX') {
				answerValue = val ? 'Yes' : 'No';
			} else if (Array.isArray(val)) {
				const items = val.map((v: any) => typeof v === 'object' ? (v.value || v.label || String(v)) : String(v));
				answerValue = items.join(', ');
			} else {
				answerValue = String(val);
			}

			if (!answerValue) return [];

			const result: Array<{ field_id: string; answer_value: string }> = [
				{ field_id: fid, answer_value: answerValue },
			];

			if (f.fieldType === 'TERMS_CHECKBOX' && answers[fid + '_signature']) {
				result.push({
					field_id: fid + '_signature',
					answer_value: answers[fid + '_signature'],
				});
			}

			return result;
		});

		const isPaid = selectedTicket && !selectedTicket.isFree && selectedTicket.price && selectedTicket.price > 0;

		try {
			// Step 1: Create attendee entry
			const attendeeRes = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: email.trim().toLowerCase(),
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					ticketTypeId: selectedTicketId || undefined,
				}),
			});
			const attendeeData = await attendeeRes.json();
			if (!attendeeRes.ok) throw new Error(attendeeData.message ?? 'Failed to create attendee');

			const existingAttendee = attendeeData.data;
			const attendeeId = existingAttendee?._id ?? existingAttendee?.id ?? attendeeData.attendeeId;
			// P1-15: capture the registration token issued by event-service. The
			// payment service trusts this token (not raw IDs) for the public
			// ticket-purchase route.
			let registrationToken: string | undefined = attendeeData.registrationToken;

			// GROUP REGISTRATION PATH
			if (isGroupRegistration && groupMembers.length > 0) {
				const groupRegRes = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/registrations/register/group`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						eventId,
						ticketTypeId: selectedTicketId || undefined,
						leadDetails: {
							attendeeId,
							email: email.trim().toLowerCase(),
							firstName: firstName.trim(),
							lastName: lastName.trim(),
						},
						members: groupMembers,
						form_answers: formAnswers,
					}),
				});
				const groupRegData = await groupRegRes.json();
				if (!groupRegRes.ok) throw new Error(groupRegData.error ?? groupRegData.message ?? 'Group registration failed');

				// For group registration, we need to get the lead's registration
				// The backend creates it, so we fetch it
				const leadRegRes = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/registrations/event/${eventId}/attendee/${attendeeId}`);
				const leadRegData = await leadRegRes.json();
				registrationResult = leadRegData || { registration_id: 'group-pending', attendeeId };

				if (isPaid) {
					step = 'payment';
				} else {
					registrationResult.attendee_status = selectedTicket?.requiresApproval ? 'UNAPPROVED' : 'ATTENDING';
					step = 'confirmation';
				}
				return;
			}

			// SINGLE REGISTRATION PATH (unchanged)
			const regRes = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/registrations/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					eventId,
					attendeeId,
					attendee_details: {
						email: email.trim().toLowerCase(),
						firstName: firstName.trim(),
						lastName: lastName.trim(),
					},
					ticketTypeId: selectedTicketId || undefined,
					form_answers: formAnswers,
					linked_seat_id: selectedSeatId || undefined,
				}),
			});
			const regData = await regRes.json();
			if (!regRes.ok) throw new Error(regData.message ?? 'Registration failed');

			registrationResult = regData.registration;
			// P1-15: prefer the registration-time token (binds the chosen
			// ticketTypeId), fall back to the attendee-create token.
			if (regData.registrationToken) {
				registrationToken = regData.registrationToken;
			}
			if (registrationResult && registrationToken) {
				registrationResult.registrationToken = registrationToken;
			}

			if (isPaid) {
				step = 'payment';
			} else {
				const finalizeRes = await fetch(
					`${EVENT_URL}/api/v1/events/${eventId}/registrations/finalize/${registrationResult.registration_id}`,
					{ method: 'POST', headers: { 'Content-Type': 'application/json' } }
				);
				if (finalizeRes.ok) {
					registrationResult.attendee_status = selectedTicket?.requiresApproval ? 'UNAPPROVED' : 'ATTENDING';
				}
				step = 'confirmation';
			}
		} catch (e: any) {
			const msg = e.message ?? '';
			const code = (e.code ?? e.data?.code ?? '').toUpperCase();
			const meta = e.meta ?? e.data?.meta ?? {};

			// FE-P2-11-A: server-side sales-window enforcement.
			if (code === 'SALES_NOT_OPEN') {
				const dt = meta.salesStartDate ? new Date(meta.salesStartDate).toLocaleString() : '';
				submitError = dt
					? `Sales open on ${dt}. Set a reminder?`
					: "Sales for this ticket type haven't opened yet.";
			} else if (code === 'SALES_CLOSED') {
				const dt = meta.salesEndDate ? new Date(meta.salesEndDate).toLocaleString() : '';
				submitError = dt
					? `Sales for this ticket type ended ${dt}.`
					: 'Sales for this ticket type have ended.';
			} else if (code === 'SOLD_OUT') {
				submitError = 'This ticket type just sold out. Pick another one.';
			} else if (code === 'SEAT_UNAVAILABLE') {
				submitError = 'Someone else just picked that seat. Choose another.';
			} else if (code === 'COUPON_NOT_APPLICABLE_TO_TICKET_TYPE') {
				submitError = "This coupon doesn't apply to the selected ticket type.";
			} else if (code === 'COUPON_PER_USER_LIMIT_REACHED') {
				submitError = "You've already used this coupon the maximum number of times.";
			} else if (e.status === 409 && /coupon/i.test(msg)) {
				submitError = 'This coupon has reached its usage limit. Try another one.';
			} else if (msg.includes('already registered')) {
				submitError = "You're already registered for this event with this email address. Check your inbox for confirmation details.";
			} else if (msg.includes('blocked from registering')) {
				submitError = 'This email has been restricted from registering for events in this collection.';
			} else if (msg.includes('Registration is closed') || msg.includes('event has ended')) {
				submitError = 'Registration for this event is now closed.';
			} else if (msg.includes('Registration is currently closed')) {
				submitError = 'Registration is currently closed for this event. Please check back later.';
			} else if (msg.includes('Ticket type not found')) {
				submitError = 'This ticket type is no longer available. Please select a different ticket.';
			} else if (msg.includes('Duplicate email')) {
				submitError = msg;
			} else if (msg.includes('Not enough capacity')) {
				submitError = msg;
			} else if (msg.includes('already registered')) {
				submitError = msg;
			} else {
				submitError = msg || 'Something went wrong. Please try again.';
			}
			if (step === 'seats' || step === 'group-members') step = 'form';
		} finally {
			submitting = false;
		}
	}

	function getFieldInputType(fieldType: string): string {
		switch (fieldType) {
			case 'EMAIL': return 'email';
			case 'PHONE': return 'tel';
			case 'WEBSITE': return 'url';
			default: return 'text';
		}
	}

	function toggleMultiSelect(fieldId: string, option: string) {
		const current = answers[fieldId] ?? [];
		if (current.includes(option)) {
			answers[fieldId] = current.filter((o: string) => o !== option);
		} else {
			answers[fieldId] = [...current, option];
		}
	}

	async function handlePayment() {
		if (!registrationResult) return;
		submitting = true;
		submitError = '';

		const qty = isGroupRegistration ? ticketQuantity : 1;

		try {
			// FE-P0-04: typed initiate via the centralised service helper.
			// The helper enforces the FE-P0-01 contract (no client-side prices)
			// and parses the typed response, including the HMAC verification
			// token needed for `verify-and-settle`.
			const paymentData = await attendeePaymentInitiate({
				attendeeName: `${firstName.trim()} ${lastName.trim()}`.trim() || 'Attendee',
				// P1-15 (FA-10.3): registrationToken is the only trusted source for
				// the (eventId, attendeeId, ticketTypeId) trio. The legacy
				// `attendeeId` field is intentionally omitted — the server
				// rejects it under STRICT_REGISTRATION_TOKEN.
				registrationToken: registrationResult.registrationToken,
				attendeeEmail: email.trim().toLowerCase(),
				eventId,
				organizerId: eventData?.organizerId ?? '',
				ticketDetails: {
					ticketTypeId: selectedTicketId,
					quantity: qty,
					// P1-16 (NEW-2.2 / FA-3.3): unitPrice / price / amount /
					// discountAmount are server-side only. The server resolves the
					// canonical price from event-service.
				},
				paymentMethodDetails: {
					payment_gateway: selectedGateway,
					cardToken: '',
					currency: selectedTicket?.currency ?? 'NGN',
				},
				isGroupPurchase: isGroupRegistration,
				groupMembersEmails: isGroupRegistration ? groupMembers.map(m => m.email) : undefined,
				successCallbackUrl: `${window.location.origin}/event-page/${eventId}?payment=success&reg=${registrationResult.registration_id}`,
				failureCallbackUrl: `${window.location.origin}/event-page/${eventId}?payment=failed&reg=${registrationResult.registration_id}`,
				returnWalletPaymentLink: false,
				registrationIds: [registrationResult.registration_id],
			});

			if (paymentData.checkoutUrl) {
				// FE-P1-13: capture the FX preview if the backend converted
				// the ticket currency for this gateway (e.g. USD-priced
				// ticket paid in NGN via Paystack). The rate is locked on
				// the transaction; this display block echoes it so the user
				// knows the exact amount that will hit their card.
				const ticketCcy = selectedTicket?.currency ?? 'NGN';
				const settledCcy = paymentData.currency ?? ticketCcy;
				if (settledCcy && settledCcy !== ticketCcy) {
					const sourceMajor = Number(selectedTicket?.price ?? 0) * qty;
					const sourceKobo = majorToKobo(sourceMajor, ticketCcy);
					const targetKobo = Number(paymentData.totalAmount ?? 0);
					const sourceMajorActual = sourceKobo / 100;
					const targetMajorActual = targetKobo / 100;
					const rate = sourceMajorActual > 0 ? targetMajorActual / sourceMajorActual : 0;
					fxPreview = {
						sourceCurrency: ticketCcy,
						sourceAmountKobo: sourceKobo,
						targetCurrency: settledCcy,
						targetAmountKobo: targetKobo,
						formattedSource: formatMoney(sourceKobo, ticketCcy),
						formattedTarget: formatMoney(targetKobo, settledCcy),
						rateLabel: rate > 0 ? formatMoney(majorToKobo(rate, settledCcy), settledCcy) : `1 ${settledCcy}`,
					};
				} else {
					fxPreview = null;
				}

				if (selectedGateway === 'PAYSTACK') {
					// Use Paystack inline popup instead of redirect
					await loadPaystackScript();
					// P0-04: capture the HMAC verification token issued by the
					// payment service. The follow-up `verify-and-settle` POST
					// must echo this in the `x-verification-token` header.
					const verificationToken = paymentData.verificationToken ?? '';
					const handler = (window as any).PaystackPop.setup({
						key: paymentData.paystackPublicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
						email: email.trim().toLowerCase(),
						amount: paymentData.totalAmount,
						currency: paymentData.currency || selectedTicket?.currency || 'NGN',
						ref: paymentData.reference || '',
						channels: ['card', 'bank', 'ussd', 'bank_transfer'],
						callback: (_response: any) => {
							const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

							// Step 1: Verify and settle payment (creates wallets, credits organizer, etc.)
							// P0-04 / P0-05: forward the HMAC verification token. The
							// route is fully idempotent — calling it once per
							// reference is safe even if the webhook beats us to it.
							verifyAndSettleTicketPayment(paymentData.reference, verificationToken)
								.then(() =>
									// Step 2: Finalize registration on event service
									fetch(`${EVENT_URL}/api/v1/events/${eventId}/registrations/finalize/${registrationResult.registration_id}`, {
										method: 'POST', headers: { 'Content-Type': 'application/json' }
									})
								).then(() => {
									registrationResult.attendee_status = selectedTicket?.requiresApproval ? 'UNAPPROVED' : 'ATTENDING';
									step = 'confirmation';
									submitting = false;
								}).catch(() => {
									// Settlement or finalize might be handled by webhook — still show confirmation
									registrationResult.attendee_status = selectedTicket?.requiresApproval ? 'UNAPPROVED' : 'ATTENDING';
									step = 'confirmation';
									submitting = false;
								});
						},
						onClose: () => {
							submitError = 'Payment window was closed. You can try again.';
							submitting = false;
						},
					});
					handler.openIframe();
				} else {
					// Non-Paystack gateways — redirect to checkout URL
					window.location.href = paymentData.checkoutUrl;
				}
			} else {
				throw new Error('No checkout URL received from payment gateway');
			}
		} catch (e: any) {
			console.error('Payment initiation error:', e);
			submitError = e.message ?? 'Payment failed. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function loadPaystackScript(): Promise<void> {
		return new Promise((resolve, reject) => {
			if ((window as any).PaystackPop) { resolve(); return; }
			const script = document.createElement('script');
			script.src = 'https://js.paystack.co/v2/inline.js';
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load Paystack script'));
			document.head.appendChild(script);
		});
	}

	// FE-P3-05 — fetch the per-member registrations whenever the modal
	// reaches the confirmation step for a group purchase.
	$: if (step === 'confirmation' && isGroupRegistration && registrationResult && groupMemberRegistrations.length === 0 && !loadingGroupMembers) {
		loadGroupMemberRegistrations();
	}
</script>

{#if open}
<div class="fixed inset-0 z-50 flex items-center justify-center">
	<div class="animate-fadeIn h-full w-full flex flex-col items-center justify-start px-5 overflow-y-auto"
		style="background-color: {themeColor.bg}CC; backdrop-filter: blur(24px);">

		<!-- Close button -->
		<button
			class="absolute right-5 top-6 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
			style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
			on:click={() => (open = false)}
			aria-label="Close registration"
		>
			<Icon icon="mdi:close" class="text-lg font-bold" />
		</button>

		<div class="mt-[77px] mb-13 flex flex-col md:flex-row-reverse gap-8 md:gap-11 items-start justify-start w-full max-w-[900px]">

			<!-- Ticket Summary Card -->
			<div class="max-w-[430px] w-full flex flex-col gap-[19px] rounded-[15px] p-5"
				style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
				<div class="flex">
					{#if eventData?.displayPictureUrl || eventData?.coverPictureUrl}
					<img src={eventData.displayPictureUrl || eventData.coverPictureUrl} class="size-16 rounded-lg mr-3 object-cover" alt="event" />
					{:else}
					<div class="size-16 rounded-lg mr-3 flex items-center justify-center text-2xl" style="background-color: {themeColor.smallCover};">🎪</div>
					{/if}
					<div class="space-y-1">
						<h2 class="text-xl font-medium" style="color: {themeColor.text};">{eventData?.title ?? 'Event'}</h2>
						<p class="text-sm" style="color: {themeColor.lightText};">{formatDate(eventData?.startDateTime)}</p>
					</div>
				</div>
				<hr style="border-color: {themeColor.toggle};" />
				<div class="flex justify-between items-center">
					<p class="text-base" style="color: {themeColor.lightText};">Ticket</p>
					<p class="text-base font-medium" style="color: {themeColor.text};">{selectedTicket?.name ?? 'Standard'}</p>
				</div>
				{#if isGroupRegistration}
				<div class="flex justify-between items-center">
					<p class="text-base" style="color: {themeColor.lightText};">Quantity</p>
					<p class="text-base font-medium" style="color: {themeColor.text};">{ticketQuantity} tickets</p>
				</div>
				{/if}
				<hr style="border-color: {themeColor.toggle};" />
				<div class="flex justify-between items-center">
					<p class="text-base" style="color: {themeColor.lightText};">Total</p>
					<p class="text-xl font-semibold" style="color: {themeColor.text};">
						{formatTicketTotalForQty(selectedTicket, isGroupRegistration ? ticketQuantity : 1)}
					</p>
				</div>
				{#if isGroupRegistration}
				<div class="flex items-center gap-2 rounded-lg px-3 py-2" style="background-color: {themeColor.smallCover};">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="{themeColor.button}" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="{themeColor.button}" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="{themeColor.button}" stroke-width="1.5" stroke-linecap="round"/></svg>
					<span class="text-xs" style="color: {themeColor.lightText};">Group Registration · {ticketQuantity} attendees</span>
				</div>
				{/if}
			</div>

			<!-- Form / Confirmation -->
			<div class="max-w-[430px] w-full">

			{#if step === 'form'}
				<h3 class="mb-6 text-2xl font-normal" style="color: {themeColor.text};">Attendance Registration</h3>

				{#if submitError}
				<div class="mb-4 flex items-start gap-3 rounded-xl p-4 text-sm" style="background-color: #fef2f2; border: 1px solid #fecaca;">
					<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
					<span style="color: #991b1b;">{submitError}</span>
				</div>
				{/if}

				<form class="flex w-full flex-col gap-6" on:submit|preventDefault={handleSubmit}>
					<!-- First Name (always required) -->
					<div class="w-full">
						<label class="text-sm" style="color: {themeColor.lightText};">First Name *</label>
						<input bind:value={firstName} type="text" placeholder="John"
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
							style="background-color: {themeColor.cover}; border-color: {errors.firstName ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
						{#if errors.firstName}<p class="mt-1 text-xs text-red-500">{errors.firstName}</p>{/if}
					</div>

					<!-- Last Name -->
					<div class="w-full">
						<label class="text-sm" style="color: {themeColor.lightText};">Last Name</label>
						<input bind:value={lastName} type="text" placeholder="Doe"
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
							style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
					</div>

					<!-- Email (always required) -->
					<div class="w-full">
						<label class="text-sm" style="color: {themeColor.lightText};">Email *</label>
						<input bind:value={email} type="email" placeholder="john@example.com"
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
							style="background-color: {themeColor.cover}; border-color: {errors.email ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
						{#if errors.email}<p class="mt-1 text-xs text-red-500">{errors.email}</p>{/if}
					</div>

					<!-- Phone (from registrationFormSettings) -->
					{#if phoneEnabled !== 'OFF'}
					<div class="w-full">
						<label class="text-sm" style="color: {themeColor.lightText};">Phone Number {phoneEnabled === 'REQUIRED' ? '*' : ''}</label>
						<input bind:value={phone} type="tel" placeholder="+234..."
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
							style="background-color: {themeColor.cover}; border-color: {errors.phone ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
						{#if errors.phone}<p class="mt-1 text-xs text-red-500">{errors.phone}</p>{/if}
					</div>
					{/if}

					<!-- Ethereum Address (from registrationFormSettings) -->
					{#if ethAddressEnabled !== 'OFF'}
					<div class="w-full">
						<label class="text-sm" style="color: {themeColor.lightText};">Ethereum Address {ethAddressEnabled === 'REQUIRED' ? '*' : ''}</label>
						<input bind:value={ethAddress} type="text" placeholder="0x..."
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
							style="background-color: {themeColor.cover}; border-color: {errors.ethAddress ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
						{#if errors.ethAddress}<p class="mt-1 text-xs text-red-500">{errors.ethAddress}</p>{/if}
					</div>
					{/if}

					<!-- Solana Address (from registrationFormSettings) -->
					{#if solAddressEnabled !== 'OFF'}
					<div class="w-full">
						<label class="text-sm" style="color: {themeColor.lightText};">Solana Address {solAddressEnabled === 'REQUIRED' ? '*' : ''}</label>
						<input bind:value={solAddress} type="text" placeholder="Enter SOL address..."
							class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
							style="background-color: {themeColor.cover}; border-color: {errors.solAddress ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
						{#if errors.solAddress}<p class="mt-1 text-xs text-red-500">{errors.solAddress}</p>{/if}
					</div>
					{/if}

					<!-- Dynamic Custom Fields -->
					{#each filteredFields as field (field._id ?? field.formId)}
					{@const fid = field._id ?? field.formId}
					<div class="w-full">
						<label class="text-sm" style="color: {themeColor.lightText};">
							{field.fieldName} {field.isRequired ? '*' : ''}
						</label>

						{#if field.fieldType === 'TEXT' || field.fieldType === 'SHORT_TEXT' || field.fieldType === 'COMPANY' || field.fieldType === 'EMAIL' || field.fieldType === 'PHONE' || field.fieldType === 'WEBSITE' || field.fieldType === 'WEB3_ETH_ADDRESS' || field.fieldType === 'WEB3_SOL_ADDRESS' || field.fieldType === 'SOCIAL_PROFILE'}
							<input
								bind:value={answers[fid]}
								type={getFieldInputType(field.fieldType)}
								placeholder={field.fieldType === 'PHONE' ? '+234...' : field.fieldType === 'WEB3_ETH_ADDRESS' ? '0x...' : field.fieldType === 'SOCIAL_PROFILE' ? `Enter your ${field.platform || 'profile'} URL` : ''}
								class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
								style="background-color: {themeColor.cover}; border-color: {errors[fid] ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />

						{:else if field.fieldType === 'LONG_TEXT' || field.fieldType === 'CUSTOM_TEXT'}
							<textarea
								bind:value={answers[fid]}
								rows="3"
								class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm resize-none transition-all focus:outline-none focus:ring-2"
								style="background-color: {themeColor.cover}; border-color: {errors[fid] ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;">
							</textarea>

						{:else if field.fieldType === 'CHECKBOX'}
							<label class="mt-2 flex items-center gap-3 cursor-pointer select-none rounded-lg px-3 py-2.5 transition-colors hover:opacity-80"
								style="background-color: {themeColor.cover};">
								<input type="checkbox" bind:checked={answers[fid]}
									class="h-5 w-5 rounded border-2 transition-colors cursor-pointer"
									style="accent-color: {themeColor.button};" />
								<span class="text-sm" style="color: {themeColor.text};">{field.fieldName}</span>
							</label>

						{:else if field.fieldType === 'TERMS_CHECKBOX'}
							{@const termsText = field.termsContent || ''}
							{@const isLong = termsText.replace(/<[^>]*>/g, '').split(/\s+/).length > 200}
							{@const isExpanded = termsExpanded[fid] ?? false}
							<div class="mt-2 space-y-3">
								{#if field.contentType === 'link' && field.termsLink}
									<div class="rounded-lg p-3" style="background-color: {themeColor.cover};">
										<a href={field.termsLink} target="_blank" rel="noopener" class="text-sm underline" style="color: {themeColor.button};">
											View Terms and Conditions
										</a>
									</div>
								{:else if termsText}
									<div class="terms-content rounded-lg border p-3 text-sm transition-all"
										style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text}; {isLong && !isExpanded ? 'max-height: 120px; overflow: hidden;' : ''}">
										{@html termsText}
									</div>
									{#if isLong}
										<button
											type="button"
											on:click={() => { termsExpanded[fid] = !isExpanded; termsExpanded = termsExpanded; }}
											class="text-xs font-medium transition-colors hover:opacity-80"
											style="color: {themeColor.button};"
										>
											{isExpanded ? 'See less' : 'See more'}
										</button>
									{/if}
								{/if}
								<label class="flex items-center gap-3 cursor-pointer select-none rounded-lg px-3 py-2.5 transition-colors hover:opacity-80"
									style="background-color: {themeColor.cover};">
									<input type="checkbox" bind:checked={answers[fid]}
										class="h-5 w-5 rounded border-2 cursor-pointer"
										style="accent-color: {themeColor.button};" />
									<span class="text-sm" style="color: {themeColor.text};">I accept the terms and conditions</span>
								</label>
								{#if field.collectSignature && answers[fid]}
									<div class="mt-2">
										<label class="text-xs" style="color: {themeColor.lightText};">Type your name as signature</label>
										<input
											bind:value={answers[fid + '_signature']}
											type="text"
											placeholder="Type your full name"
											class="mt-1 w-full rounded-[9px] border px-4 py-3 text-lg italic transition-all focus:outline-none focus:ring-2"
											style="background-color: {themeColor.cover}; border-color: {themeColor.toggle}; color: {themeColor.text}; font-family: 'Dancing Script', 'Brush Script MT', 'Segoe Script', cursive; --tw-ring-color: {themeColor.button}40;" />
									</div>
								{/if}
							</div>

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

						{:else if field.fieldType === 'UPLOAD'}
							<input type="file" class="mt-2 w-full text-sm" style="color: {themeColor.lightText};"
								on:change={(e) => { const f = e.currentTarget?.files?.[0]; if (f) answers[fid] = f.name; }} />

						{:else if field.fieldType === 'SIGNATURE'}
							<input bind:value={answers[fid]} type="text" placeholder="Type your signature"
								class="mt-2 w-full rounded-[9px] border px-4 py-3 text-lg italic transition-all focus:outline-none focus:ring-2"
								style="background-color: {themeColor.cover}; border-color: {errors[fid] ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; font-family: 'Dancing Script', 'Brush Script MT', 'Segoe Script', cursive; --tw-ring-color: {themeColor.button}40;" />

						{:else}
							<input bind:value={answers[fid]} type="text"
								class="mt-2 w-full rounded-[9px] border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
								style="background-color: {themeColor.cover}; border-color: {errors[fid] ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
						{/if}

						{#if errors[fid]}<p class="mt-1 text-xs text-red-500">{errors[fid]}</p>{/if}
					</div>
					{/each}

					<!-- Submit -->
					<button type="submit" disabled={submitting}
						class="w-full rounded-lg py-3 text-base font-medium transition-all disabled:opacity-60"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};">
						{#if submitting}
							<span class="inline-flex items-center gap-2">
								<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
								Registering...
							</span>
						{:else}
							{selectedTicket?.requiresApproval ? 'Request to Get In' : 'Register'}
						{/if}
					</button>
				</form>

			{:else if step === 'group-members'}
				<!-- Group Members Step -->
				<div class="flex flex-col gap-5">
					<div>
						<h3 class="text-2xl font-normal" style="color: {themeColor.text};">Group Members</h3>
						<p class="mt-1 text-sm" style="color: {themeColor.lightText};">
							Add details for the {groupMemberCount} additional attendee{groupMemberCount > 1 ? 's' : ''} in your group.
						</p>
					</div>

					{#if submitError}
					<div class="flex items-start gap-3 rounded-xl p-4 text-sm" style="background-color: #fef2f2; border: 1px solid #fecaca;">
						<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
						</svg>
						<span style="color: #991b1b;">{submitError}</span>
					</div>
					{/if}

					<!-- Lead info summary -->
					<div class="flex items-center gap-3 rounded-lg p-3" style="background-color: {themeColor.smallCover};">
						<div class="flex h-9 w-9 items-center justify-center rounded-full" style="background-color: {themeColor.button}; color: {themeColor.buttonText};">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
						</div>
						<div>
							<p class="text-sm font-medium" style="color: {themeColor.text};">{firstName} {lastName} <span class="text-xs font-normal" style="color: {themeColor.lightText};">(You - Group Lead)</span></p>
							<p class="text-xs" style="color: {themeColor.lightText};">{email}</p>
						</div>
						<svg class="ml-auto h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="{themeColor.button}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</div>

					<!-- Member cards -->
					<div class="flex flex-col gap-3">
						{#each groupMembers as member, i}
						{@const isFilled = member.firstName && member.email}
						{@const isEditing = editingMemberIndex === i}

						{#if isEditing}
						<!-- Inline editor -->
						<div class="rounded-xl border-2 p-4" style="border-color: {themeColor.button}; background-color: {themeColor.cover};">
							<div class="mb-3 flex items-center justify-between">
								<p class="text-sm font-medium" style="color: {themeColor.text};">Attendee {i + 2}</p>
								<button class="text-xs underline" style="color: {themeColor.lightText};" on:click={closeMemberEditor}>Cancel</button>
							</div>
							<div class="flex flex-col gap-3">
								<div>
									<label class="text-xs" style="color: {themeColor.lightText};">First Name *</label>
									<input bind:value={memberFirstName} type="text" placeholder="First name"
										class="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
										style="background-color: {themeColor.bg}; border-color: {memberErrors.firstName ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
									{#if memberErrors.firstName}<p class="mt-1 text-xs text-red-500">{memberErrors.firstName}</p>{/if}
								</div>
								<div>
									<label class="text-xs" style="color: {themeColor.lightText};">Last Name</label>
									<input bind:value={memberLastName} type="text" placeholder="Last name"
										class="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
										style="background-color: {themeColor.bg}; border-color: {themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
								</div>
								<div>
									<label class="text-xs" style="color: {themeColor.lightText};">Email *</label>
									<input bind:value={memberEmail} type="email" placeholder="email@example.com"
										class="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
										style="background-color: {themeColor.bg}; border-color: {memberErrors.email ? '#ef4444' : themeColor.toggle}; color: {themeColor.text}; --tw-ring-color: {themeColor.button}40;" />
									{#if memberErrors.email}<p class="mt-1 text-xs text-red-500">{memberErrors.email}</p>{/if}
								</div>
								<button
									class="w-full rounded-lg py-2.5 text-sm font-medium transition-all"
									style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
									on:click={saveMember}
								>
									Save
								</button>
							</div>
						</div>
						{:else}
						<!-- Member card (clickable) -->
						<button
							class="flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:opacity-90"
							style="border-color: {isFilled ? themeColor.button + '40' : themeColor.toggle}; background-color: {themeColor.cover};"
							on:click={() => openMemberEditor(i)}
						>
							<div class="flex h-9 w-9 items-center justify-center rounded-full"
								style="background-color: {isFilled ? themeColor.button + '20' : themeColor.smallCover};">
								{#if isFilled}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="{themeColor.button}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
								{:else}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="{themeColor.lightText}" stroke-width="1.5"/></svg>
								{/if}
							</div>
							<div class="flex-1">
								{#if isFilled}
								<p class="text-sm font-medium" style="color: {themeColor.text};">{member.firstName} {member.lastName}</p>
								<p class="text-xs" style="color: {themeColor.lightText};">{member.email}</p>
								{:else}
								<p class="text-sm" style="color: {themeColor.lightText};">Attendee {i + 2} — Click to add details</p>
								{/if}
							</div>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="{themeColor.lightText}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</button>
						{/if}
						{/each}
					</div>

					<!-- Continue button -->
					<button
						class="w-full rounded-lg py-3 text-base font-medium transition-all disabled:opacity-60"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
						disabled={!validateGroupMembers() || submitting}
						on:click={() => {
							if (hasSeatLayout) { step = 'seats'; }
							else { proceedToRegistration(); }
						}}
					>
						{#if submitting}
							<span class="inline-flex items-center gap-2">
								<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
								Processing...
							</span>
						{:else}
							Continue
						{/if}
					</button>

					<button class="text-sm underline" style="color: {themeColor.lightText};" on:click={() => { step = 'form'; submitError = ''; }}>
						Back to form
					</button>
				</div>

			{:else if step === 'seats'}
				<!-- Seat Selection Step -->
				<div class="flex flex-col gap-4">
					<h3 class="text-xl font-normal" style="color: {themeColor.text};">Choose Your Seat</h3>
					<p class="text-sm" style="color: {themeColor.lightText};">
						Select a seat from the layout below. Available seats are highlighted.
					</p>

					{#if submitError}
					<div class="flex items-start gap-3 rounded-xl p-4 text-sm" style="background-color: #fef2f2; border: 1px solid #fecaca;">
						<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
						</svg>
						<span style="color: #991b1b;">{submitError}</span>
					</div>
					{/if}

					<SeatSelector
						{eventId}
						ticketTypeId={selectedTicketId}
						{themeColor}
						on:select={(e) => {
							selectedSeatId = e.detail.seatId;
							selectedSeatNumber = e.detail.seatNumber;
						}}
						on:unavailable={(e) => { submitError = e.detail.message; }}
					/>

					<div class="flex gap-3">
						<button
							class="flex-1 rounded-lg py-3 text-base font-medium transition-all disabled:opacity-60"
							style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
							disabled={submitting || !selectedSeatId}
							on:click={proceedToRegistration}
						>
							{#if submitting}
								<span class="inline-flex items-center gap-2 justify-center">
									<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
									Processing...
								</span>
							{:else}
								Continue with Seat {selectedSeatNumber || ''}
							{/if}
						</button>
					</div>

					<button class="text-sm underline" style="color: {themeColor.lightText};" on:click={() => { step = 'form'; submitError = ''; }}>
						Back to form
					</button>

					<!-- Skip seat selection -->
					<button class="text-xs" style="color: {themeColor.lightText};"
						on:click={() => { selectedSeatId = ''; selectedSeatNumber = ''; proceedToRegistration(); }}>
						Skip seat selection
					</button>
				</div>

			{:else if step === 'payment'}
				<!-- Payment Gateway Selection -->
				<div class="flex flex-col items-center gap-6">
					<h3 class="text-2xl font-normal" style="color: {themeColor.text};">Choose Payment Method</h3>
					<p class="text-sm" style="color: {themeColor.lightText};">
						Select your preferred payment gateway to complete your ticket purchase.
					</p>

					{#if submitError}
					<div class="w-full flex items-start gap-3 rounded-xl p-4 text-sm" style="background-color: #fef2f2; border: 1px solid #fecaca;">
						<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
						</svg>
						<span style="color: #991b1b;">{submitError}</span>
					</div>
					{/if}

					<div class="w-full flex flex-col gap-3">
						<button
							class="flex items-center gap-4 w-full rounded-xl p-4 border-2 transition-all"
							style="background-color: {themeColor.cover}; border-color: {selectedGateway === 'PAYSTACK' ? themeColor.button : themeColor.toggle};"
							on:click={() => selectedGateway = 'PAYSTACK'}
						>
							<div class="flex h-12 w-12 items-center justify-center rounded-lg" style="background-color: {themeColor.smallCover};">
								<span class="text-lg font-bold" style="color: {themeColor.button};">P</span>
							</div>
							<div class="text-left">
								<p class="text-sm font-medium" style="color: {themeColor.text};">Paystack</p>
								<p class="text-xs" style="color: {themeColor.lightText};">Pay with card, bank transfer, or USSD</p>
							</div>
						</button>
					</div>

					<div class="w-full rounded-xl p-4" style="background-color: {themeColor.smallCover};">
						<div class="flex justify-between mb-2">
							<span class="text-sm" style="color: {themeColor.lightText};">Ticket</span>
							<span class="text-sm font-medium" style="color: {themeColor.text};">{selectedTicket?.name}</span>
						</div>
						{#if isGroupRegistration}
						<div class="flex justify-between mb-2">
							<span class="text-sm" style="color: {themeColor.lightText};">Quantity</span>
							<span class="text-sm font-medium" style="color: {themeColor.text};">{ticketQuantity} tickets</span>
						</div>
						{/if}
						<div class="flex justify-between">
							<span class="text-sm" style="color: {themeColor.lightText};">Ticket price</span>
							<span class="text-lg font-bold" style="color: {themeColor.text};">
								{formatTicketTotalForQty(selectedTicket, isGroupRegistration ? ticketQuantity : 1)}
							</span>
						</div>
						<!-- FE-P1-13 (FA-3.5) — FX preview. Until the dedicated
						     `/payment/fx/preview` endpoint ships we render the
						     locked rate from `paymentData.fxLockedRate` AFTER
						     initiate (set in handlePayment). The rate is
						     locked at checkout — the user pays the exact
						     converted amount even if the market moves. -->
						{#if fxPreview && fxPreview.targetCurrency !== fxPreview.sourceCurrency}
							<div class="mt-3 border-t pt-3" style="border-color: {themeColor.toggle};">
								<div class="flex justify-between">
									<span class="text-sm" style="color: {themeColor.lightText};">You'll be charged</span>
									<span class="text-base font-semibold" style="color: {themeColor.text};">≈ {fxPreview.formattedTarget}</span>
								</div>
								<p class="mt-1 text-[11px]" style="color: {themeColor.lightText};">
									Rate locked at checkout: 1 {fxPreview.sourceCurrency} = {fxPreview.rateLabel}. You pay exactly this amount even if the market moves.
								</p>
							</div>
						{/if}
					</div>

					<button
						class="w-full rounded-lg py-3 text-base font-medium transition-all disabled:opacity-60"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
						disabled={submitting}
						on:click={handlePayment}
					>
						{#if submitting}
							<span class="inline-flex items-center gap-2">
								<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
								Processing...
							</span>
						{:else}
							Pay {fxPreview?.formattedTarget ?? formatTicketTotalForQty(selectedTicket, isGroupRegistration ? ticketQuantity : 1)}
						{/if}
					</button>

					<button class="text-sm underline" style="color: {themeColor.lightText};" on:click={() => step = 'form'}>
						Back to form
					</button>
				</div>

			{:else if step === 'confirmation'}
				<!-- Confirmation Page -->
				<div class="flex flex-col items-center text-center gap-6">
					<div class="flex h-20 w-20 items-center justify-center rounded-full" style="background-color: {themeColor.smallCover};">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="{themeColor.button}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="{themeColor.button}" stroke-width="2"/></svg>
					</div>

					<h2 class="text-2xl font-semibold" style="color: {themeColor.text};">
						{selectedTicket?.requiresApproval ? 'Request Submitted' : 'Registration Confirmed'}
					</h2>
					<p class="text-sm leading-relaxed" style="color: {themeColor.lightText};">
						{#if isGroupRegistration}
							{selectedTicket?.requiresApproval
								? `Your group request for ${ticketQuantity} tickets has been submitted. The organizer will review and approve your registration.`
								: `You've registered ${ticketQuantity} attendees for ${eventData?.title ?? 'this event'}. All ${ticketQuantity} members will receive their own ticket email at the address you provided.`}
						{:else}
							{selectedTicket?.requiresApproval
								? 'Your request has been submitted. The organizer will review and approve your registration.'
								: `You're registered for ${eventData?.title ?? 'this event'}. Check your email for confirmation details.`}
						{/if}
					</p>

					<!-- FE-P3-05 — multi-QR carousel for group purchases. -->
					{#if isGroupRegistration && (groupMemberRegistrations.length > 0 || loadingGroupMembers)}
						<div class="w-full rounded-xl border p-4 text-left" style="border-color: {themeColor.toggle}; background-color: {themeColor.cover};">
							{#if loadingGroupMembers}
								<div class="flex h-32 items-center justify-center">
									<span class="text-sm" style="color: {themeColor.lightText};">Loading member tickets…</span>
								</div>
							{:else}
								{@const total = groupMemberRegistrations.length}
								{@const idx = Math.min(groupQrIndex, Math.max(0, total - 1))}
								{@const current = groupMemberRegistrations[idx] ?? {}}
								{@const memberName = (current.firstName || current.attendee_details?.firstName || current.metaData?.firstName || `Attendee ${idx + 1}`).toString()}
								{@const memberEmailAddr = (current.email || current.attendee_details?.email || current.metaData?.email || '').toString()}
								{@const passcode = current.passcode || current.qrPasscode || current.checkInPasscode || current.registration_id || ''}
								<div class="flex items-center justify-between">
									<button
										type="button"
										class="rounded-full p-1.5 disabled:opacity-30"
										style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
										on:click={() => (groupQrIndex = Math.max(0, idx - 1))}
										disabled={idx === 0}
										aria-label="Previous member"
									>
										<Icon icon="mdi:chevron-left" class="text-lg" />
									</button>
									<div class="flex-1 text-center">
										<p class="text-xs" style="color: {themeColor.lightText};">Ticket {idx + 1} of {total}</p>
										<p class="mt-0.5 text-sm font-medium" style="color: {themeColor.text};">{memberName}</p>
										{#if memberEmailAddr}
											<p class="text-[11px]" style="color: {themeColor.lightText};">{memberEmailAddr}</p>
										{/if}
									</div>
									<button
										type="button"
										class="rounded-full p-1.5 disabled:opacity-30"
										style="background-color: {themeColor.smallCover}; color: {themeColor.text};"
										on:click={() => (groupQrIndex = Math.min(total - 1, idx + 1))}
										disabled={idx >= total - 1}
										aria-label="Next member"
									>
										<Icon icon="mdi:chevron-right" class="text-lg" />
									</button>
								</div>
								{#if passcode}
									<div class="mt-3 flex items-center justify-center">
										<div class="rounded-lg bg-white p-3" style="border: 1px solid {themeColor.toggle};">
											<img
												alt="Ticket QR"
												src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=2&data=${encodeURIComponent(passcode)}`}
												width="180"
												height="180"
											/>
										</div>
									</div>
									<p class="mt-2 text-center text-[11px]" style="color: {themeColor.lightText};">Passcode · <span class="font-mono">{passcode}</span></p>
								{/if}
							{/if}
						</div>
					{/if}

					{#if registrationResult}
					<div class="w-full rounded-xl p-4 text-left space-y-3" style="background-color: {themeColor.cover}; border: 1px solid {themeColor.toggle};">
						<div class="flex justify-between">
							<span class="text-sm" style="color: {themeColor.lightText};">Name</span>
							<span class="text-sm font-medium" style="color: {themeColor.text};">{firstName} {lastName}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm" style="color: {themeColor.lightText};">Email</span>
							<span class="text-sm font-medium" style="color: {themeColor.text};">{email}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm" style="color: {themeColor.lightText};">Ticket</span>
							<span class="text-sm font-medium" style="color: {themeColor.text};">{selectedTicket?.name}</span>
						</div>
						{#if selectedSeatNumber}
						<div class="flex justify-between">
							<span class="text-sm" style="color: {themeColor.lightText};">Seat</span>
							<span class="text-sm font-medium" style="color: {themeColor.button};">{selectedSeatNumber}</span>
						</div>
						{/if}
						{#if registrationResult.event_passcode}
						<div class="flex justify-between">
							<span class="text-sm" style="color: {themeColor.lightText};">Passcode</span>
							<span class="text-sm font-mono font-bold tracking-wider" style="color: {themeColor.button};">{registrationResult.event_passcode}</span>
						</div>
						{/if}
					</div>

					{#if registrationResult.qr_code_data}
					<div class="flex flex-col items-center gap-2">
						<p class="text-xs" style="color: {themeColor.lightText};">Your QR Code</p>
						<img src={registrationResult.qr_code_data} alt="QR Code" class="h-32 w-32 rounded-lg" />
					</div>
					{/if}

					{#if isGroupRegistration && groupMembers.length > 0}
					<div class="w-full rounded-xl p-4 text-left space-y-2" style="background-color: {themeColor.smallCover};">
						<p class="text-xs font-medium uppercase tracking-wider" style="color: {themeColor.lightText};">Group Members</p>
						{#each groupMembers as member, i}
						<div class="flex items-center gap-2">
							<div class="flex h-6 w-6 items-center justify-center rounded-full text-xs" style="background-color: {themeColor.button}20; color: {themeColor.button};">
								{i + 1}
							</div>
							<div>
								<p class="text-sm" style="color: {themeColor.text};">{member.firstName} {member.lastName}</p>
								<p class="text-xs" style="color: {themeColor.lightText};">{member.email} · Invitation sent</p>
							</div>
						</div>
						{/each}
					</div>
					{/if}
					{/if}

					<!-- CTA -->
					{#if !$isAuthenticated}
					<div class="w-full rounded-xl p-4" style="background-color: {themeColor.smallCover};">
						<p class="text-sm mb-3" style="color: {themeColor.text};">Verify your email to access the event page and manage your registration.</p>
						<button class="w-full rounded-lg py-2.5 text-sm font-medium"
							style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
							on:click={() => goto(`/auth?email=${encodeURIComponent(email.trim().toLowerCase())}`)}>
							Verify Email & Create Account
						</button>
					</div>
					{:else}
					<button class="w-full rounded-lg py-2.5 text-sm font-medium"
						style="background-color: {themeColor.button}; color: {themeColor.buttonText};"
						on:click={() => { open = false; goto(`/event-page/${eventId}`); }}>
						Go to Event Page
					</button>
					{/if}

					<button class="text-sm underline" style="color: {themeColor.lightText};" on:click={() => (open = false)}>
						Close
					</button>
				</div>
			{/if}
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.animate-fadeIn {
		animation: fade 0.15s ease-out;
	}
	@keyframes fade {
		from { opacity: 0; transform: scale(0.97); }
		to { opacity: 1; transform: scale(1); }
	}
	/* Rich text terms content styling */
	.terms-content :global(h1) { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
	.terms-content :global(h2) { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
	.terms-content :global(h3) { font-size: 1rem; font-weight: 600; margin-bottom: 0.375rem; }
	.terms-content :global(p) { margin-bottom: 0.5rem; line-height: 1.6; font-weight: 400; }
	.terms-content :global(ul) { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.5rem; font-weight: 400; }
	.terms-content :global(ol) { list-style: decimal; padding-left: 1.25rem; margin-bottom: 0.5rem; font-weight: 400; }
	.terms-content :global(li) { margin-bottom: 0.25rem; font-weight: 400; }
	.terms-content :global(strong) { font-weight: 700; }
	.terms-content :global(em) { font-style: italic; }
	.terms-content :global(a) { color: #7c3aed; text-decoration: underline; }
</style>
