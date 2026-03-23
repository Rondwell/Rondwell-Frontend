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
