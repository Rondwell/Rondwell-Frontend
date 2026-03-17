import { setLoading, setError, setVerified } from '$lib/stores/auth.store';

const BASE_URL = import.meta.env.VITE_API_URL;

export async function requestRegistrationOTP(email: string) {
  setLoading(true);
  setError('');

  console.log('📧 Requesting OTP for:', email);
  console.log('🌐 URL:', `${BASE_URL}/api/v1/auth/register/otp-request`);

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register/otp-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    console.log('📥 OTP Request Status:', res.status);
    console.log('📥 OTP Request Response:', data);

    if (!res.ok) {
      throw new Error(data.message ?? 'Failed to send OTP');
    }

    return data;

  } catch (err: unknown) {
    console.error('❌ OTP Request Error:', err);
    setError(err instanceof Error ? err.message : 'Something went wrong');
    throw err;
  } finally {
    setLoading(false);
  }
}

export async function verifyRegistrationOTP(email: string, otp: string) {
  setLoading(true);
  setError('');

  console.log('📤 Verifying OTP with:', { email, otp });

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        otp,  
      }),
    });

    const data = await res.json();
    console.log('📥 Verify Status:', res.status);
    console.log('📥 Verify Response:', data);

    if (!res.ok) {
      throw new Error(data.message ?? 'Invalid OTP');
    }

    setVerified();
    return data;

  } catch (err: unknown) {
    console.error('❌ Verify Error:', err);
    setError(err instanceof Error ? err.message : 'Something went wrong');
    throw err;
  } finally {
    setLoading(false);
  }
}