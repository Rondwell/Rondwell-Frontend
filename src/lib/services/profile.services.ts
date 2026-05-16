import { authFetch } from '$lib/services/api.client';

import { throwApiError } from '$lib/utils/errorMessage';
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
  publicProfileSlug?: string;
  isPublicProfile?: boolean;
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
  if (!res.ok) await throwApiError(res, 'Failed to fetch profile');
  const data = await res.json();
  return data.data;
}

export async function getAllProfiles(): Promise<UserProfileData[]> {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/all`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch profiles');
  const data = await res.json();
  return data.data;
}

export async function switchProfile(newProfileId: string) {
  const res = await authFetch(`${BASE_URL}/api/v1/profile/switch`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newProfileId }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to switch profile');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Onboarding failed');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update vendor details');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update social links');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to search profiles');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update exhibitor details');
  const data = await res.json();
  return data.data;
}
