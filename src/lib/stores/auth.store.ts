import { writable } from 'svelte/store';

export const authState = writable({
  loading: false,
  error: '',
  email: '',
  verified: false,
});

export function setLoading(loading: boolean) {
  authState.update(s => ({ ...s, loading }));
}

export function setError(error: string) {
  authState.update(s => ({ ...s, error }));
}

export function setVerified() {
  authState.update(s => ({ ...s, verified: true, error: '' }));
}

export function setEmail(email: string) {
  authState.update(s => ({ ...s, email }));
}