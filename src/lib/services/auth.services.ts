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
 *
 * H-14 — this used to return `{ isNewUser }`, read straight from the server's
 * response. That field was an account-enumeration oracle: one unauthenticated
 * request per address revealed whether it holds a Rondwell account, and
 * Rondwell holds attendee lists for NAMED events, so confirming an address is
 * registered is itself a disclosure. The server no longer sends it, and
 * `smartVerifyOTP` works it out from the verification result instead — by which
 * point the caller has proved control of the address.
 */
export async function smartRequestOTP(
  emailOrPhone: string,
  isPhone = false
): Promise<void> {
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
 * Verifies OTP and saves auth state. Returns 2FA_REQUIRED if the user has 2FA.
 *
 * H-14 — the caller no longer passes `isNewUser`, because the server no longer
 * tells anyone. Login verification is attempted first and registration second.
 *
 * Exactly one can succeed: the OTP the server issued is type-scoped
 * (`LOGIN` for an existing account, `REGISTRATION` for a new one) and
 * single-use, so the wrong endpoint cannot consume it. Trying both here is not
 * an oracle — the caller is holding a code mailed to that address, so they have
 * already proved control of it.
 */
export async function smartVerifyOTP(
  emailOrPhone: string,
  otp: string,
  isPhone = false
): Promise<{ token: string; refreshToken: string; user: any; isNewUser: boolean; status?: string; tempToken?: string }> {
  setLoading(true);
  setError('');
  try {
    let data: any;
    let isNewUser = false;

    try {
      data = await verifyLoginOTP(emailOrPhone, otp, isPhone);
    } catch {
      // Not an existing account (or the code was minted for registration).
      data = await verifyRegistrationOTP(emailOrPhone, otp, isPhone);
      isNewUser = true;
    }

    // Check if 2FA is required
    if (data.status === '2FA_REQUIRED') {
      return { token: '', refreshToken: '', user: data.user, isNewUser: false, status: '2FA_REQUIRED', tempToken: data.tempToken };
    }

    const { token, refreshToken, user } = data;
    await setUser(user, token, refreshToken);
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
    await setUser(user, token, refreshToken);
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
  tempToken: string,
  twoFactorCode: string,
  backupCode?: string
): Promise<{ token: string; refreshToken: string; user: any }> {
  setLoading(true);
  setError('');
  try {
    /**
     * C-07 — the request carries the `tempToken` from the first factor, not an
     * `email`. The server resolves the user from that signed receipt and does
     * not read an email at all.
     *
     * Sending an email was what made 2FA a standalone factor: anyone with an
     * address and one TOTP or backup code got a session, with no password.
     */
    const body: Record<string, string> = { tempToken };
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
    await setUser(user, token, refreshToken);
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
/**
 * C-03 — no `userId` parameter.
 *
 * It used to select the account the server minted a session for, while the
 * signature was checked against a user resolved from the `email` field. Pairing
 * a victim's `credentialId` with an attacker's `email` and assertion passed the
 * crypto against the attacker's key and issued a session for the victim. The
 * server now resolves the account once, from the credential id inside the
 * signed assertion — the one field an attacker cannot swap without breaking
 * the signature.
 */
export async function completePasskeyAuth(assertionData: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/passkeys/authenticate/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assertionData),
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
