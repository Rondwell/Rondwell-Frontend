const BASE_URL = import.meta.env.VITE_API_URL;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ─── User (account-level) ─────────────────────────────────────────────────────

export async function getMe(token: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch user');
  return data.data as {
    id: string;
    email: string;
    phoneNumber?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    twoFactorEnabled: boolean;
    hasPassword: boolean;
    localization: { country: string; language: string };
  };
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updatePersonalInfo(token: string, profileId: string, data: { name?: string; username?: string; bio?: string }) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/${profileId}/personal`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to update profile');
  return json.data;
}

export async function updateSocialLinks(token: string, profileId: string, links: Record<string, string>) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/${profileId}/social-links`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(links),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to update social links');
  return json.data;
}

export async function uploadProfilePicture(token: string, profileId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/api/v1/profile/${profileId}/profile-picture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to upload picture');
  return json.data as { profilePictureUrl: string };
}

// ─── Email / Phone ────────────────────────────────────────────────────────────

export async function changePrimaryEmail(token: string, newEmail: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/email/primary`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ newEmail }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to change email');
  return json;
}

export async function updatePhoneNumber(token: string, phoneNumber: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/phone`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ phoneNumber }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to update phone');
  return json;
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function requestPasswordSetup(token: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/password/setup-request`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to send setup link');
  return json;
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/password/change`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to change password');
  return json;
}

// ─── 2FA ──────────────────────────────────────────────────────────────────────

export async function begin2FASetup(token: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/2fa/enable/begin`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to begin 2FA setup');
  return json.data as { secret: string; qrCode: string };
}

export async function confirm2FASetup(token: string, code: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/2fa/enable/confirm`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ code }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Invalid 2FA code');
  return json.data as { backupCodes: string[] };
}

export async function disable2FA(token: string, code: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/2fa/disable`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ code }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to disable 2FA');
  return json;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getActiveSessions(token: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/sessions/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to fetch sessions');
  return json.data as Array<{
    _id: string;
    deviceInfo: { browser: string; os: string; deviceType: string; ipAddress: string };
    lastActivityAt: string;
    createdAt: string;
  }>;
}

export async function invalidateSession(token: string, sessionId: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to invalidate session');
  return json;
}

// ─── Delete Account ───────────────────────────────────────────────────────────

export async function deleteAccount(token: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/delete`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed to delete account');
  return json;
}
