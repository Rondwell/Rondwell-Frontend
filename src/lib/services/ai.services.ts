import { authFetch } from '$lib/services/api.client';

const API_URL = import.meta.env.VITE_API_URL;

export interface AIGeneratedEvent {
  title: string;
  description: string;
  category: string;
  eventType: 'VIRTUAL' | 'PHYSICAL' | 'HYBRID';
  registrationType: 'FREE' | 'PAID';
  visibility: 'PUBLIC' | 'PRIVATE';
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  registrationDeadline?: string;
  maxAttendees?: number;
  themeColor?: string;
  locationDetails?: {
    virtual?: { platform: string; meetingLink: string };
    physical?: { venueName: string; venueAddress: string; seatingCapacity?: number };
  };
  waitlistEnabled: boolean;
  groupRegistrationEnabled: boolean;
  maxGroupSize?: number;
  donationsEnabled: boolean;
  publicAttendeeListEnabled: boolean;
  postEventFeedbackEnabled: boolean;
  communityEnabled: boolean;
  registrationOpen: boolean;
  keepPublicAfterEnd: boolean;
  checkinSettings: {
    isCheckinEnabled: boolean;
    passcodeEnabled: boolean;
    qrCodeEnabled: boolean;
    facialRecognitionRequired: boolean;
  };
  registrationFormSettings: {
    phoneEnabled: 'OFF' | 'OPTIONAL' | 'REQUIRED';
    ethAddressEnabled: 'OFF' | 'OPTIONAL' | 'REQUIRED';
    solAddressEnabled: 'OFF' | 'OPTIONAL' | 'REQUIRED';
  };
  agendaSettings: {
    isPublic: boolean;
    showSpeakerBio: boolean;
    showRoomCapacity: boolean;
    showSessionDescription: boolean;
    showMeetingLinks: boolean;
    groupBy: 'DATE' | 'ROOM' | 'TYPE';
  };
}

export async function generateEventWithAI(
  prompt: string,
  eventType?: string
): Promise<AIGeneratedEvent> {
  const res = await authFetch(`${API_URL}/api/ai/events/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, eventType }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.message ?? 'Failed to generate event');
  return data.data;
}

export async function generateDescriptionWithAI(
  prompt: string,
  tone: string = 'PROFESSIONAL',
  length: string = 'MEDIUM'
): Promise<string> {
  const res = await authFetch(`${API_URL}/api/descriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, tone, length }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.message ?? 'Failed to generate description');
  return data.data.description;
}
