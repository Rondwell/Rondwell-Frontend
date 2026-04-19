import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export interface AuthUser {
  id: string;
  email?: string;
  phoneNumber?: string;
  defaultProfileId?: string;
  activeProfileId?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface ActiveProfile {
  _id: string;
  role: 'ORGANIZER' | 'VENDOR' | 'EXHIBITOR' | 'SPEAKER';
  name: string;
  profilePictureUrl?: string;
  onboardingStatus: 'INCOMPLETE' | 'COMPLETED';
}

interface AuthState {
  loading: boolean;
  error: string;
  email: string;
  verified: boolean;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  activeProfile: ActiveProfile | null;
}

function loadFromStorage(): Partial<AuthState> {
  if (!browser) return {};
  try {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('auth_refresh_token');
    const userRaw = localStorage.getItem('auth_user');
    const profileRaw = localStorage.getItem('auth_active_profile');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const activeProfile = profileRaw ? JSON.parse(profileRaw) : null;
    return { token, refreshToken, user, activeProfile };
  } catch {
    return {};
  }
}

const initial: AuthState = {
  loading: false,
  error: '',
  email: '',
  verified: false,
  user: null,
  token: null,
  refreshToken: null,
  activeProfile: null,
  ...loadFromStorage(),
};

export const authState = writable<AuthState>(initial);

export const isAuthenticated = derived(authState, ($s) => !!$s.token && !!$s.user);

export function setLoading(loading: boolean) {
  authState.update((s) => ({ ...s, loading }));
}

export function setError(error: string) {
  authState.update((s) => ({ ...s, error }));
}

export function setVerified() {
  authState.update((s) => ({ ...s, verified: true, error: '' }));
}

export function setEmail(email: string) {
  authState.update((s) => ({ ...s, email }));
}

export function setUser(user: AuthUser, token: string, refreshToken: string) {
  if (browser) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_refresh_token', refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
  authState.update((s) => ({ ...s, user, token, refreshToken, verified: true, error: '' }));
}

export function setActiveProfile(profile: ActiveProfile) {
  if (browser) {
    localStorage.setItem('auth_active_profile', JSON.stringify(profile));
  }
  authState.update((s) => ({ ...s, activeProfile: profile }));
}

export function clearUser() {
  if (browser) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_active_profile');
    localStorage.removeItem('post_auth_redirect');
  }
  authState.update((s) => ({
    ...s,
    user: null,
    token: null,
    refreshToken: null,
    verified: false,
    email: '',
    activeProfile: null,
  }));
}

export function getToken(): string | null {
  if (browser) return localStorage.getItem('auth_token');
  return null;
}
