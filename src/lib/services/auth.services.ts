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

// ─── Smart OTP (tries register first, falls back to login) ───────────────────

/**
 * Sends OTP — tries register first. If user already exists, falls back to login.
 * Returns { isNewUser: boolean }
 */
export async function smartRequestOTP(
  emailOrPhone: string,
  isPhone = false
): Promise<{ isNewUser: boolean }> {
  setLoading(true);
  setError('');
  try {
    await requestRegistrationOTP(emailOrPhone, isPhone);
    toast.success('OTP sent! Check your inbox.');
    return { isNewUser: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('user already')) {
      await requestLoginOTP(emailOrPhone, isPhone);
      toast.success('OTP sent! Check your inbox.');
      return { isNewUser: false };
    }
    const errorMsg = msg || 'Failed to send OTP';
    setError(errorMsg);
    toast.error(errorMsg);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Verifies OTP — tries register verify first, falls back to login verify.
 * Saves auth state on success.
 */
export async function smartVerifyOTP(
  emailOrPhone: string,
  otp: string,
  isPhone = false
): Promise<{ token: string; refreshToken: string; user: any; isNewUser: boolean }> {
  setLoading(true);
  setError('');
  try {
    let data: any;
    let isNewUser = false;

    try {
      data = await verifyRegistrationOTP(emailOrPhone, otp, isPhone);
      isNewUser = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // If registration verify fails because user exists or OTP was for login
      if (
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('expired')
      ) {
        data = await verifyLoginOTP(emailOrPhone, otp, isPhone);
        isNewUser = false;
      } else {
        throw err;
      }
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
