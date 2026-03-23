import { authFetch } from '$lib/services/api.client';

const EVENT_URL = import.meta.env.VITE_EVENT_API_URL;

export interface CreateEventPayload {
  title: string;
  description?: string;
  category: string;
  eventOrganizerName: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  eventType: 'VIRTUAL' | 'PHYSICAL' | 'HYBRID';
  registrationType: 'FREE' | 'PAID';
  visibility: 'PUBLIC' | 'PRIVATE';
  themeColor?: string;
  locationDetails?: {
    virtual?: { platform: string; meetingLink: string };
    physical?: { venueName: string; venueAddress: string; resolvedAddress: { lat: number; lng: number; formatted_address: string } };
  };
  maxAttendees?: number;
  waitlistEnabled?: boolean;
  autoPromoteWaitlist?: boolean;
  donationsEnabled?: boolean;
  publicGuestListEnabled?: boolean;
  postEventFeedbackEnabled?: boolean;
  checkinSettings?: {
    isCheckinEnabled: boolean;
    passcodeEnabled: boolean;
    qrCodeEnabled: boolean;
    facialRecognitionRequired: boolean;
  };
  customLinkSlug?: string;
  collectionId?: string;
}

export interface CreateEventResponse {
  message: string;
  eventId: string;
  eventUrl?: string;
  customLinkSlug?: string;
}

export async function createEvent(payload: CreateEventPayload): Promise<CreateEventResponse> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create event');
  return data;
}

export async function getMyCollections(): Promise<any[]> {
  try {
    const res = await authFetch(`${EVENT_URL}/api/v1/collections`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.collections ?? data ?? [];
  } catch {
    return [];
  }
}

export async function getEventById(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch event');
  return data.event;
}

export async function updateEvent(eventId: string, payload: Partial<CreateEventPayload>): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update event');
  return data.event;
}

export async function publishEvent(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/publish`, {
    method: 'PUT',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to publish event');
  return data;
}

export async function uploadEventPhoto(eventId: string, file: File, category: 'COVER' | 'DISPLAY' = 'DISPLAY'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'IMAGE');
  formData.append('category', 'GENERAL');
  formData.append('isPublic', 'true');
  formData.append('title', category === 'COVER' ? 'Cover Photo' : 'Display Photo');

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to upload photo');

  const pictureField = category === 'COVER' ? 'coverPictureUrl' : 'displayPictureUrl';
  updateEvent(eventId, { [pictureField]: data.url } as any).catch(() => {});

  return data.url;
}

export async function getEventAttendees(eventId: string): Promise<any[]> {
  try {
    const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.participants ?? data ?? [];
  } catch {
    return [];
  }
}

export async function getEventGuests(eventId: string): Promise<any[]> {
  try {
    const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/guests`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.guests ?? data ?? [];
  } catch {
    return [];
  }
}

export async function getMyEvents(): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/organizer/all`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch events');
  return data.events ?? [];
}
