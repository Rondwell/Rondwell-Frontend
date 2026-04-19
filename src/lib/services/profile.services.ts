import { authFetch } from '$lib/services/api.client';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface UserProfileData {
  _id: string;
  userId: string;
  role: 'ORGANIZER' | 'VENDOR' | 'EXHIBITOR' | 'SPEAKER';
  name: string;
  username?: string;
  profilePictureUrl?: string;
  bio?: string;
  isDefault: boolean;
  onboardingStatus: 'INCOMPLETE' | 'COMPLETED';
  socialLinks?: {
    instagram?: string;
    x?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
    website?: string;
  };
}

export async function getActiveProfile(): Promise<UserProfileData> {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/me`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch profile');
  return data.data;
}

export async function getAllProfiles(): Promise<UserProfileData[]> {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/all`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch profiles');
  return data.data;
}

export async function switchProfile(newProfileId: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/switch`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newProfileId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to switch profile');
  return data.data;
}

/**
 * Complete role-specific onboarding (vendor, exhibitor, speaker).
 * Creates the profile and returns the new profile data.
 */
export async function completeOnboarding(
  roleType: 'vendor' | 'exhibitor' | 'speaker',
  onboardingData: Record<string, unknown>
) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/onboard/${roleType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ onboardingData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Onboarding failed');
  return data.data;
}

/**
 * Update vendor business details on the user profile.
 */
export async function updateVendorDetails(
  profileId: string,
  updates: Record<string, unknown>
) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/vendor/details`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update vendor details');
  return data.data;
}

/**
 * Update social links on a profile.
 */
export async function updateSocialLinks(
  profileId: string,
  links: Record<string, string>
) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/social-links`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(links),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update social links');
  return data.data;
}


/**
 * Search profiles (organizers, speakers, etc.) for collaboration requests.
 */
export async function searchProfiles(
  search: string,
  role = 'ORGANIZER',
  limit = 10
): Promise<any[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  params.set('limit', String(limit));

  const res = await authFetch(`${BASE_URL}/api/v1/profile/search?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to search profiles');
  return data.data?.profiles || [];
}


/**
 * Update exhibitor business details on the user profile.
 */
export async function updateExhibitorDetails(
  profileId: string,
  updates: Record<string, unknown>
) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/${profileId}/exhibitor/details`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update exhibitor details');
  return data.data;
}
