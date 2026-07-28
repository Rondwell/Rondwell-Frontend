/**
 * FE-P5-05 — Group lead console client.
 *
 * ── The problem this solves ──────────────────────────────────────────────
 *
 * Group members always received an invite email. The LEAD — the person who
 * actually paid — received nothing beyond their own ticket, so there was no way
 * to discover that they could see who had confirmed, resend an invite, or hand a
 * seat to someone else. The endpoints existed; nothing linked to them.
 *
 * ── Authentication without an account ────────────────────────────────────
 *
 * Group routes are public by design (invitees aren't logged-in users). Lead
 * actions used to be authorised by `leadRegistrationId` in the request body,
 * which is NOT a secret: the frontend puts it in the payment callback URLs
 * (`?payment=success&reg=<id>`), so it lands in browser history, in `Referer`
 * headers sent to any third-party script on that page, and in access logs. It's
 * also a functional identifier used elsewhere, so it can't be rotated if it leaks.
 *
 * We now use a signed, expiring, revocable HMAC MANAGE TOKEN, sent in the
 * `x-group-manage-token` header (not the URL, so it stays out of `Referer`).
 * Seat REASSIGNMENT additionally requires a one-time code emailed to the lead's
 * registered address — so whoever holds the link must also hold the inbox.
 */

import { throwApiError } from '$lib/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_URL;

export type GroupSeatStatus = 'INVITED' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED';

export interface GroupConsoleSeat {
	email: string;
	firstName?: string;
	lastName?: string;
	status: GroupSeatStatus;
	invitedAt?: string;
	inviteSentCount: number;
	lastInviteSentAt?: string;
	confirmedAt?: string;
	declinedAt?: string;
	declineReason?: string;
	replacedEmail?: string;
	refundedAt?: string;
	registrationId?: string;
	attendeeStatus?: string | null;
	paymentStatus?: string | null;
	checkedIn: boolean;
	/** Server-computed capability flags, so the UI never offers a refused action. */
	canResend: boolean;
	canReassign: boolean;
	resendCapReached: boolean;
}

export interface GroupConsole {
	group: {
		groupId: string;
		eventId: string;
		status: string;
		paymentStatus: string;
		quantity: number;
		totalAmount: number;
		inviteExpiresAt?: string;
		activatedAt?: string;
		refundedAt?: string | null;
		isTerminal: boolean;
	};
	event: {
		_id: string;
		title: string;
		startDateTime?: string;
		endDateTime?: string;
		displayPictureUrl?: string;
		themeColor?: string;
		eventOrganizerName?: string;
	} | null;
	ticketType: { name: string } | null;
	lead: {
		email: string | null;
		firstName: string | null;
		lastName: string | null;
		registrationId: string;
		attendeeStatus: string | null;
		qrCodeData: string | null;
		qrCodeUrl: string | null;
		eventPasscode: string | null;
		checkedIn: boolean;
	};
	seats: GroupConsoleSeat[];
	counts: {
		total: number;
		confirmed: number;
		invited: number;
		declined: number;
		cancelled: number;
		checkedIn: number;
	};
	limits: { maxInviteSends: number; resendCooldownSeconds: number };
}

function groupUrl(eventId: string, groupId: string, path: string): string {
	return `${BASE_URL}/api/v1/events/${eventId}/registrations/group/${groupId}${path}`;
}

function headers(manageToken: string, otp?: string): Record<string, string> {
	const h: Record<string, string> = { 'Content-Type': 'application/json' };
	// Header, not query string — keeps the credential out of `Referer` headers and
	// browser history, which is precisely why `leadRegistrationId` was unusable.
	if (manageToken) h['x-group-manage-token'] = manageToken;
	if (otp) h['x-group-otp'] = otp;
	return h;
}

async function unwrap(res: Response, failMessage: string): Promise<any> {
	if (!res.ok) await throwApiError(res, failMessage);
	const data = await res.json();
	return data.data ?? data.result ?? data;
}

/** Load the lead's console. */
export async function getGroupConsole(
	eventId: string,
	groupId: string,
	manageToken: string
): Promise<GroupConsole> {
	const res = await fetch(groupUrl(eventId, groupId, '/console'), {
		headers: headers(manageToken)
	});
	return unwrap(res, 'Could not open your group page');
}

/** Resend a member's invite. Low-risk — no OTP needed. */
export async function resendGroupInvite(
	eventId: string,
	groupId: string,
	manageToken: string,
	email: string
): Promise<{ sent: boolean; inviteSentCount: number }> {
	const res = await fetch(groupUrl(eventId, groupId, '/resend-invite'), {
		method: 'POST',
		headers: headers(manageToken),
		body: JSON.stringify({ email })
	});
	return unwrap(res, 'Could not resend that invite');
}

/**
 * Request the one-time code that gates seat reassignment.
 *
 * The code is emailed to the LEAD'S registered address and is never returned in
 * the response — returning it would defeat the second factor. The response only
 * tells you which (masked) inbox to check.
 */
export async function requestGroupActionOtp(
	eventId: string,
	groupId: string,
	manageToken: string,
	payload: { action?: 'REASSIGN_SEAT' | 'REVOKE_LINKS'; oldEmail?: string; newEmail?: string }
): Promise<{ sent: true; sentToMasked: string; expiresInSeconds: number }> {
	const res = await fetch(groupUrl(eventId, groupId, '/request-otp'), {
		method: 'POST',
		headers: headers(manageToken),
		body: JSON.stringify({ action: payload.action ?? 'REASSIGN_SEAT', ...payload })
	});
	return unwrap(res, 'Could not send a verification code');
}

/**
 * Hand a paid seat to a different person. Requires the manage token AND the
 * one-time code, and the code is bound to this exact (from → to) pair server-side
 * so it can't be replayed to move a different seat.
 */
export async function reassignGroupSeat(
	eventId: string,
	groupId: string,
	manageToken: string,
	otp: string,
	oldEmail: string,
	newMember: { email: string; firstName?: string; lastName?: string }
): Promise<{ email: string; status: 'INVITED' }> {
	const res = await fetch(groupUrl(eventId, groupId, '/reassign'), {
		method: 'POST',
		headers: headers(manageToken, otp),
		body: JSON.stringify({ oldEmail, newMember })
	});
	return unwrap(res, 'Could not reassign that seat');
}

/**
 * Kill every outstanding manage link for this group. OTP-gated, because a leaked
 * link must not be usable to lock the real lead out.
 */
export async function revokeGroupManageLinks(
	eventId: string,
	groupId: string,
	manageToken: string,
	otp: string
): Promise<{ revoked: true; newVersion: number }> {
	const res = await fetch(groupUrl(eventId, groupId, '/revoke-links'), {
		method: 'POST',
		headers: headers(manageToken, otp),
		body: JSON.stringify({})
	});
	return unwrap(res, 'Could not revoke your links');
}

/**
 * Email the lead a fresh console link.
 *
 * Deliberately needs NO credential: it only ever sends to the lead's own stored
 * address, so the worst an attacker who knows a `group_id` can do is mail the real
 * lead their own link. That is what makes recovery possible for a lead who lost
 * the email.
 */
export async function sendGroupManageLink(
	eventId: string,
	groupId: string
): Promise<{ sent: boolean }> {
	const res = await fetch(groupUrl(eventId, groupId, '/send-manage-link'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({})
	});
	return unwrap(res, 'Could not email your management link');
}
