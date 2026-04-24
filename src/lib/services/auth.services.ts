import { setError, setLoading, setUser, setVerified } from '$lib/stores/auth.store';
import { toast } from '$lib/stores/toast.store';

const BASE_URL = import.meta.env.VITE_API_URL;       // user service: port 3001
const EVENT_URL = import.meta.env.VITE_EVENT_API_URL; // event service: port 5000

function parseApiError(res: Response, data: any): string {
  if (res.status === 429) return data.message ?? data.error ?? 'Too many attempts. Please wait before trying again.';
  if (res.status === 400) return data.message ?? 'Invalid request.';
  if (res.status === 401) return 'Unauthorized. Please log in again.';
  if (res.status === 404) return data.message ?? 'Not found.';
  if (res.status >= 500) return 'Server error. Please try again later.';
  return data.message ?? 'Something went wrong.';
}

// ─── Registration ────────────────────────────────────────────────────────────

export async function requestRegistrationOTP(emailOrPhone: string, isPhone = false) {
  const body = isPhone ? { phoneNumber: emailOrPhone } : { email: emailOrPhone };
  const res = await fetch(`${BASE_URL}/api/v1/auth/register/otp-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(res, data));
  return data;
}

export async function verifyRegistrationOTP(emailOrPhone: string, otp: string, isPhone = false) {
  const body = isPhone
    ? { phoneNumber: emailOrPhone, otp }
    : { email: emailOrPhone, otp };
  const res = await fetch(`${BASE_URL}/api/v1/auth/register/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(res, data));
  return data;
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function requestLoginOTP(emailOrPhone: string, isPhone = false) {
  const body = isPhone ? { phoneNumber: emailOrPhone } : { email: emailOrPhone };
  const res = await fetch(`${BASE_URL}/api/v1/auth/login/otp-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(res, data));
  return data;
}

export async function verifyLoginOTP(emailOrPhone: string, otp: string, isPhone = false) {
  const body = isPhone
    ? { phoneNumber: emailOrPhone, otp }
    : { email: emailOrPhone, otp };
  const res = await fetch(`${BASE_URL}/api/v1/auth/login/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(res, data));
  return data;
}

// ─── Smart OTP (single unified endpoint) ─────────────────────────────────────

/**
 * Sends OTP via the unified endpoint — works for both new and existing users.
 * Returns { isNewUser: boolean }
 */
export async function smartRequestOTP(
  emailOrPhone: string,
  isPhone = false
): Promise<{ isNewUser: boolean }> {
  setLoading(true);
  setError('');
  try {
    const body = isPhone ? { phoneNumber: emailOrPhone } : { email: emailOrPhone };
    const res = await fetch(`${BASE_URL}/api/v1/auth/otp-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseApiError(res, data));
    toast.success('OTP sent! Check your inbox.');
    return { isNewUser: data.isNewUser ?? true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send OTP';
    setError(msg);
    toast.error(msg);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Verifies OTP — uses isNewUser flag to call the correct endpoint directly.
 * Saves auth state on success. Returns 2FA_REQUIRED status if user has 2FA enabled.
 */
export async function smartVerifyOTP(
  emailOrPhone: string,
  otp: string,
  isPhone = false,
  isNewUser = true
): Promise<{ token: string; refreshToken: string; user: any; isNewUser: boolean; status?: string; tempToken?: string }> {
  setLoading(true);
  setError('');
  try {
    let data: any;

    if (isNewUser) {
      data = await verifyRegistrationOTP(emailOrPhone, otp, isPhone);
    } else {
      data = await verifyLoginOTP(emailOrPhone, otp, isPhone);
    }

    // Check if 2FA is required
    if (data.status === '2FA_REQUIRED') {
      return { token: '', refreshToken: '', user: data.user, isNewUser: false, status: '2FA_REQUIRED', tempToken: data.tempToken };
    }

    const { token, refreshToken, user } = data;
    setUser(user, token, refreshToken);
    setVerified();

    return { token, refreshToken, user, isNewUser };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OTP verification failed';
    setError(msg);
    toast.error(msg);
    throw err;
  } finally {
    setLoading(false);
  }
}

// ─── Google Sign-In ──────────────────────────────────────────────────────────

/**
 * Sends the Google ID token (credential) to the backend for verification.
 * Handles both sign-up and login — backend links accounts by email automatically.
 * If 2FA is enabled, returns { status: '2FA_REQUIRED', tempToken, user }.
 */
export async function googleSignIn(
  credential: string
): Promise<{ token: string; refreshToken: string; user: any; isNewUser: boolean; status?: string; tempToken?: string }> {
  setLoading(true);
  setError('');
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseApiError(res, data));

    // Check if 2FA is required
    if (data.status === '2FA_REQUIRED') {
      return { token: '', refreshToken: '', user: data.user, isNewUser: false, status: '2FA_REQUIRED', tempToken: data.tempToken };
    }

    const { token, refreshToken, user, isNewUser } = data;
    setUser(user, token, refreshToken);
    setVerified();

    return { token, refreshToken, user, isNewUser };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Google sign-in failed';
    setError(msg);
    toast.error(msg);
    throw err;
  } finally {
    setLoading(false);
  }
}

// ─── 2FA Login Verification ─────────────────────────────────────────────────

/**
 * Verify 2FA code during login flow.
 * Called after OTP verify or Google sign-in returns 2FA_REQUIRED.
 */
export async function verify2FALogin(
  email: string,
  twoFactorCode: string,
  backupCode?: string
): Promise<{ token: string; refreshToken: string; user: any }> {
  setLoading(true);
  setError('');
  try {
    const body: Record<string, string> = { email };
    if (backupCode) {
      body.backupCode = backupCode;
    } else {
      body.twoFactorCode = twoFactorCode;
    }
    const res = await fetch(`${BASE_URL}/api/v1/auth/login/2fa-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseApiError(res, data));

    const { token, refreshToken, user } = data;
    setUser(user, token, refreshToken);
    setVerified();

    return { token, refreshToken, user };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '2FA verification failed';
    setError(msg);
    toast.error(msg);
    throw err;
  } finally {
    setLoading(false);
  }
}

// ─── Passkey Authentication ─────────────────────────────────────────────────

/**
 * Begin passkey authentication — gets challenge options from the server.
 */
export async function beginPasskeyAuth(email: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/passkeys/authenticate/begin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(res, data));
  return data;
}

/**
 * Complete passkey authentication — sends assertion response to the server.
 */
export async function completePasskeyAuth(userId: string, assertionData: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/passkeys/authenticate/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...assertionData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(res, data));
  return data;
}

// ─── Post-auth redirect helper ────────────────────────────────────────────────

export async function getPostLoginRedirect(token: string): Promise<string> {
  try {
    const res = await fetch(`${EVENT_URL}/api/v1/events/organizer/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.event?.id) {
        return `/events/${data.event.id}`;
      }
    }
  } catch {
    // fall through to default
  }
  return '/overview';
}
