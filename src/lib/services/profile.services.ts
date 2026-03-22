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

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function getActiveProfile(token: string): Promise<UserProfileData> {
  const res = await fetch(`${BASE_URL}/api/v1/profile/me`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch profile');
  return data.data;
}

export async function getAllProfiles(token: string): Promise<UserProfileData[]> {
  const res = await fetch(`${BASE_URL}/api/v1/profile/all`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch profiles');
  return data.data;
}

export async function switchProfile(token: string, newProfileId: string) {
  const res = await fetch(`${BASE_URL}/api/v1/profile/switch`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ newProfileId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to switch profile');
  return data.data;
}
