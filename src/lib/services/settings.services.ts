import { authFetch } from '$lib/services/api.client';

import { throwApiError } from '$lib/utils/errorMessage';
const BASE_URL = import.meta.env.VITE_API_URL;

// ─── User (account-level) ─────────────────────────────────────────────────────

export async function getMe() {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/user/me`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch user');
  const data = await res.json();
  return data.data as {
    id: string;
    email: string;
    additionalEmails?: string[];
    pendingEmail?: string | null;
    pendingAdditionalEmail?: string | null;
    phoneNumber?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    twoFactorEnabled: boolean;
    hasPassword: boolean;
    localization: { country: string; language: string };
  };
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updatePersonalInfo(profileId: string, data: { name?: string; username?: string; bio?: string }) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/personal`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to update profile');
  return json.data;
}

export async function updateSocialLinks(profileId: string, links: Record<string, string>) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/social-links`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(links),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to update social links');
  return json.data;
}

export async function uploadProfilePicture(profileId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/profile-picture`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to upload picture');
  return json.data as { profilePictureUrl: string };
}

// ─── Email / Phone ────────────────────────────────────────────────────────────

export async function changePrimaryEmail(newEmail: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/email/primary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newEmail }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to change email');
  return json;
}

export async function verifyPrimaryEmailChange(otp: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/email/primary/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to verify email');
  return json;
}

export async function addAdditionalEmail(email: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/email/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to add email');
  return json;
}

export async function verifyAdditionalEmail(otp: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/email/add/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to verify email');
  return json.data as { additionalEmails: string[] };
}

export async function removeAdditionalEmail(email: string) {
  const res = await authFetch(
    `${BASE_URL}/api/v1/profile/email/${encodeURIComponent(email)}`,
    { method: 'DELETE' },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to remove email');
  return json.data as { additionalEmails: string[] };
}

export async function updatePhoneNumber(phoneNumber: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/phone`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to update phone');
  return json;
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function requestPasswordSetup() {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/password/setup-request`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to send setup link');
  return json;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/password/change`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to change password');
  return json;
}

// ─── 2FA ──────────────────────────────────────────────────────────────────────

export async function begin2FASetup() {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/2fa/enable/begin`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to begin 2FA setup');
  return json.data as { secret: string; qrCode: string };
}

export async function confirm2FASetup(code: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/2fa/enable/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Invalid 2FA code');
  return json.data as { backupCodes: string[] };
}

export async function disable2FA(code: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/2fa/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to disable 2FA');
  return json;
}

/**
 * Generate a fresh set of 2FA backup codes. This invalidates any previously
 * issued codes. Requires 2FA to already be enabled.
 */
export async function regenerateBackupCodes() {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/2fa/backup-codes`, {
    method: 'GET',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to generate backup codes');
  return json.data as { backupCodes: string[] };
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getActiveSessions() {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/sessions/all`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to fetch sessions');
  return json.data as Array<{
    _id: string;
    deviceInfo: { browser: string; os: string; deviceType: string; ipAddress: string };
    lastActivityAt: string;
    createdAt: string;
  }>;
}

export async function invalidateSession(sessionId: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to invalidate session');
  return json;
}

// ─── Passkey Registration (Settings) ──────────────────────────────────────────

export async function beginPasskeyRegistration(email: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/auth/passkeys/register/begin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to begin passkey registration');
  return json;
}

export async function completePasskeyRegistration(userId: string, data: any) {
  const res = await authFetch(`${BASE_URL}/api/v1/auth/passkeys/register/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to complete passkey registration');
  return json;
}

// ─── Passkey Management ───────────────────────────────────────────────────────

export async function listPasskeys() {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/passkeys`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to fetch passkeys');
  return json.data as Array<{ id: string; name: string; createdIndex: number; createdAt: string }>;
}

export async function removePasskey(credentialId: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/passkeys/${encodeURIComponent(credentialId)}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to remove passkey');
  return json;
}

// ─── Delete Account ───────────────────────────────────────────────────────────
//
// FE-P0-07: this helper is deprecated. The user-service `DELETE /profile/delete`
// route still works, but its payment-service cascade hop now returns
// `410 CASCADE_DELETE_DISABLED`, so financial records would be orphaned.
// `DeleteAccountModal` no longer calls this — it routes to support instead.
// When P3-10 ships the compliant `POST /api/v1/payment/admin/users/:id/anonymise`
// flow we'll replace this helper with `requestAccountAnonymisation()`. Keep
// the export here for now so any out-of-tree caller fails loudly via search,
// not silently via missing symbol.

export async function deleteAccount() {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/delete`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to delete account');
  return json;
}
