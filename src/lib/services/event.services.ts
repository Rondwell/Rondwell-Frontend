import { authFetch } from '$lib/services/api.client';
import { invalidateEventCache } from '$lib/stores/eventCache.store';

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
  registrationOpen?: boolean;
  groupRegistrationEnabled?: boolean;
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

/** Discover public events — no auth required */
export async function discoverEvents(options?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  eventType?: string;
  registrationType?: string;
}): Promise<{ events: any[]; pagination: any }> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.search) params.set('search', options.search);
  if (options?.category) params.set('category', options.category);
  if (options?.eventType) params.set('eventType', options.eventType);
  if (options?.registrationType) params.set('registrationType', options.registrationType);
  const res = await fetch(`${EVENT_URL}/api/v1/events/discover?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) return { events: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  return data;
}

/** Public event page data — no auth required */
export async function getPublicEventPage(eventId: string): Promise<{
  event: any;
  ticketTypes: any[];
  organizers: any[];
  attendeeCount: number;
  attendingSample: any[];
  collection: any;
  registrationFields: any[];
  organizerProfile: any;
}> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/public`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch event page');
  return data;
}

/** Public agenda — no auth required */
export async function getPublicAgenda(eventId: string): Promise<{ dates: any[]; rooms: any[] }> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/public/agenda`);
  const data = await res.json();
  if (!res.ok) return { dates: [], rooms: [] };
  return data;
}

/** Public participants — no auth required */
export async function getPublicParticipants(eventId: string): Promise<{ speakers: any[]; exhibitors: any[]; vendors: any[] }> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/public/participants`);
  const data = await res.json();
  if (!res.ok) return { speakers: [], exhibitors: [], vendors: [] };
  return data;
}

/** Public media and FAQs — no auth required */
export async function getPublicMediaFaqs(eventId: string): Promise<{ media: any[]; faqs: any[] }> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/public/media-faqs`);
  const data = await res.json();
  if (!res.ok) return { media: [], faqs: [] };
  return data;
}

/** Public seats for a ticket type — no auth required */
export async function getPublicSeats(eventId: string, ticketTypeId?: string): Promise<{ layout: any; seats: any[] }> {
  const url = ticketTypeId
    ? `${EVENT_URL}/api/v1/events/${eventId}/public/seats?ticketTypeId=${ticketTypeId}`
    : `${EVENT_URL}/api/v1/events/${eventId}/public/seats`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) return { layout: null, seats: [] };
  return data;
}

export async function updateEvent(eventId: string, payload: Partial<CreateEventPayload>): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update event');
  invalidateEventCache(eventId);
  return data.event;
}

export async function publishEvent(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/publish`, {
    method: 'PUT',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to publish event');
  invalidateEventCache(eventId);
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

export async function getEventParticipants(eventId: string): Promise<any[]> {
  try {
    const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.participants ?? data ?? [];
  } catch {
    return [];
  }
}

export async function getEventAttendees(eventId: string): Promise<any[]> {
  try {
    const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? data.attendees ?? [];
  } catch {
    return [];
  }
}

export interface PaginatedAttendeesResponse {
  attendees: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getEventAttendeesPaginated(
  eventId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    guestStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<PaginatedAttendeesResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.search) params.set('search', options.search);
  if (options.guestStatus) params.set('guestStatus', options.guestStatus);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.sortOrder) params.set('sortOrder', options.sortOrder);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/paginated?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch attendees');
  return data.data;
}

export async function getMyEvents(): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/organizer/all`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch events');
  return data.events ?? [];
}


// ==================== TICKET TYPE APIs ====================

export async function getTicketTypes(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/tickets`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch ticket types');
  return data.ticketTypes ?? [];
}

export async function createTicketType(eventId: string, payload: {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  requiresApproval?: boolean;
  salesStartDate: string;
  salesEndDate: string;
  quantityAvailable?: number;
  isFree?: boolean;
  tags?: string[];
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create ticket type');
  return data.ticketType;
}

export async function updateTicketType(eventId: string, ticketTypeId: string, payload: {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  requiresApproval?: boolean;
  salesStartDate?: string;
  salesEndDate?: string;
  quantityAvailable?: number;
  isFree?: boolean;
  tags?: string[];
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/tickets/${ticketTypeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update ticket type');
  return data.updated;
}

export async function deleteTicketType(eventId: string, ticketTypeId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/tickets/${ticketTypeId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to delete ticket type');
}

// ==================== REGISTRATION STATUS / GROUP REGISTRATION / CAPACITY ====================

export async function updateRegistrationOpen(eventId: string, registrationOpen: boolean): Promise<any> {
  return updateEvent(eventId, { registrationOpen } as any);
}

export async function updateGroupRegistration(eventId: string, groupRegistrationEnabled: boolean): Promise<any> {
  return updateEvent(eventId, { groupRegistrationEnabled } as any);
}

export async function updateEventCapacity(eventId: string, maxAttendees: number | null, waitlistEnabled?: boolean): Promise<any> {
  const payload: any = { waitlistEnabled: waitlistEnabled ?? false };
  if (maxAttendees === null) {
    payload.maxAttendees = null;
  } else {
    payload.maxAttendees = maxAttendees;
  }
  return updateEvent(eventId, payload);
}

export async function getTicketRegistrationCount(eventId: string, ticketTypeId: string): Promise<number> {
  try {
    const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/paginated?limit=1&ticketTypeId=${ticketTypeId}`);
    const data = await res.json();
    if (!res.ok) return 0;
    return data.data?.total ?? 0;
  } catch {
    return 0;
  }
}

// ==================== REGISTRATION FORM SETTINGS ====================

export async function updateRegistrationFormSettings(eventId: string, settings: {
  phoneEnabled?: 'OFF' | 'OPTIONAL' | 'REQUIRED';
  ethAddressEnabled?: 'OFF' | 'OPTIONAL' | 'REQUIRED';
  solAddressEnabled?: 'OFF' | 'OPTIONAL' | 'REQUIRED';
}): Promise<any> {
  return updateEvent(eventId, { registrationFormSettings: settings } as any);
}

// ==================== CUSTOM REGISTRATION FIELDS ====================

export async function getRegistrationFields(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/registration-fields`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch registration fields');
  return data.fields ?? [];
}

export async function createRegistrationField(eventId: string, payload: {
  fieldName: string;
  fieldType: string;
  isRequired?: boolean;
  options?: string[];
  ticketTypeIds?: string[];
  responseLength?: 'short' | 'multi-line';
  selectionType?: 'single' | 'multiple';
  platform?: string;
  contentType?: 'text' | 'link';
  termsContent?: string;
  termsLink?: string;
  collectSignature?: boolean;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/registration-fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create registration field');
  return data.field;
}

export async function updateRegistrationField(eventId: string, fieldId: string, payload: {
  fieldName?: string;
  fieldType?: string;
  isRequired?: boolean;
  options?: string[];
  ticketTypeIds?: string[];
  responseLength?: 'short' | 'multi-line';
  selectionType?: 'single' | 'multiple';
  platform?: string;
  contentType?: 'text' | 'link';
  termsContent?: string;
  termsLink?: string;
  collectSignature?: boolean;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/registration-fields/${fieldId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update registration field');
  return data.field;
}

export async function deleteRegistrationField(eventId: string, fieldId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/registration-fields/${fieldId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message ?? 'Failed to delete registration field');
  }
}

export async function reorderRegistrationFields(eventId: string, fieldOrders: { fieldId: string; order: number }[]): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/registration-fields/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fieldOrders }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to reorder registration fields');
  return data.fields ?? [];
}

// ==================== SEAT LAYOUTS ====================

export async function getSeatLayouts(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch seat layouts');
  return data;
}

export async function getSeatLayoutById(eventId: string, layoutId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts/${layoutId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch seat layout');
  return data;
}

export async function createSeatLayout(eventId: string, payload: {
  title: string;
  layoutType?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  elements?: any[];
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create seat layout');
  return data;
}

export async function updateSeatLayout(eventId: string, layoutId: string, payload: any): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts/${layoutId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update seat layout');
  return data;
}

export async function publishSeatLayout(eventId: string, layoutId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts/${layoutId}/publish`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to publish seat layout');
  return data;
}

export async function deleteSeatLayout(eventId: string, layoutId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts/${layoutId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message ?? 'Failed to delete seat layout');
  }
}


// ==================== PARTICIPANT / SPEAKER MANAGEMENT APIs ====================

export async function getEventSpeakers(eventId: string, filters?: { status?: string; search?: string; hasSession?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('role', 'SPEAKER');
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status.toUpperCase().replace(' ', '_'));
  if (filters?.search) params.set('search', filters.search);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch speakers');
  return (data.participants ?? data ?? []).filter((p: any) => p.role === 'SPEAKER');
}

export async function inviteSpeakerByEmail(eventId: string, payload: {
  firstName: string;
  lastName: string;
  email: string;
  message?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      role: 'SPEAKER',
      inviteType: 'EMAIL',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to invite speaker');
  return data;
}

export async function inviteSpeakerByProfile(eventId: string, payload: {
  participantProfileId: string;
  participantUserId: string;
  message?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      role: 'SPEAKER',
      inviteType: 'RONDWELL_PROFILE',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to invite speaker');
  return data;
}

export async function manualAddSpeaker(eventId: string, payload: {
  firstName: string;
  lastName: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: { linkedin?: string; twitter?: string; website?: string };
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/manual-add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, role: 'SPEAKER' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to add speaker');
  return data;
}

export async function updateSpeakerDetails(eventId: string, participantId: string, payload: {
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string;
  isPublic?: boolean;
  socialLinks?: { linkedin?: string; twitter?: string; website?: string };
  accessRestrictions?: string[];
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/details`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update speaker details');
  return data;
}

export async function sendSpeakerMessage(eventId: string, participantId: string, payload: {
  subject: string;
  message: string;
  email?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to send message');
  return data;
}

export async function sendSpeakerReminder(eventId: string, participantId: string, payload: {
  reminderType: string;
  customMessage?: string;
  sendCopy?: boolean;
  email?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/send-reminder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to send reminder');
  return data;
}

export async function resendSpeakerInvitation(eventId: string, participantId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/resend-invitation`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to resend invitation');
  return data;
}

export async function removeSpeaker(eventId: string, participantId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Failed to remove speaker');
  }
}

export async function assignSpeakerSessions(eventId: string, participantId: string, sessionIds: string[]): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/assign-sessions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to assign sessions');
  return data;
}

export async function searchRondwellSpeakers(eventId: string, query: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/search-speakers?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!res.ok) return [];
  return data.speakers ?? [];
}

export async function getEventSessions(eventId: string): Promise<any[]> {
  try {
    const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/sessions`);
    const data = await res.json();
    if (!res.ok) return [];
    return data.sessions ?? data ?? [];
  } catch {
    return [];
  }
}


// ==================== EXHIBITOR MANAGEMENT APIs ====================

export async function getEventExhibitors(eventId: string, filters?: { status?: string; search?: string; boothStatus?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('role', 'EXHIBITOR');
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status.toUpperCase().replace(' ', '_'));
  if (filters?.search) params.set('search', filters.search);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch exhibitors');
  return (data.participants ?? data ?? []).filter((p: any) => p.role === 'EXHIBITOR');
}

export async function inviteExhibitorByEmail(eventId: string, payload: {
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  message?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, role: 'EXHIBITOR', inviteType: 'EMAIL' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to invite exhibitor');
  return data;
}

export async function inviteExhibitorByProfile(eventId: string, payload: {
  participantProfileId: string;
  participantUserId: string;
  message?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, role: 'EXHIBITOR', inviteType: 'RONDWELL_PROFILE' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to invite exhibitor');
  return data;
}

export async function manualAddExhibitor(eventId: string, payload: {
  firstName: string;
  lastName: string;
  companyName?: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: { linkedin?: string; twitter?: string; website?: string };
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/manual-add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, role: 'EXHIBITOR' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to add exhibitor');
  return data;
}

export async function updateExhibitorDetails(eventId: string, participantId: string, payload: {
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string;
  isPublic?: boolean;
  boothStatus?: string;
  packageName?: string;
  socialLinks?: { linkedin?: string; twitter?: string; website?: string };
  accessRestrictions?: string[];
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/details`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update exhibitor details');
  return data;
}

export async function sendExhibitorMessage(eventId: string, participantId: string, payload: {
  subject: string;
  message: string;
  email?: string;
}): Promise<any> {
  return sendSpeakerMessage(eventId, participantId, payload);
}

export async function sendExhibitorReminder(eventId: string, participantId: string, payload: {
  reminderType: string;
  customMessage?: string;
  sendCopy?: boolean;
  email?: string;
}): Promise<any> {
  return sendSpeakerReminder(eventId, participantId, payload);
}

export async function resendExhibitorInvitation(eventId: string, participantId: string): Promise<any> {
  return resendSpeakerInvitation(eventId, participantId);
}

export async function removeExhibitor(eventId: string, participantId: string): Promise<void> {
  return removeSpeaker(eventId, participantId);
}

export async function approveParticipant(eventId: string, participantId: string, payload: {
  packageName?: string;
  requirePayment?: boolean;
  contributionAmount?: number;
  currency?: string;
  message?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to approve participant');
  return data;
}

export async function declineParticipant(eventId: string, participantId: string, payload: {
  reason?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to decline participant');
  return data;
}

export async function sendPaymentRequest(eventId: string, participantId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/send-payment-request`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to send payment request');
  return data;
}

export async function markPaidOffline(eventId: string, participantId: string, payload?: {
  paymentMethod?: string;
  paymentReference?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to mark as paid');
  return data;
}


// ==================== VENDOR MANAGEMENT APIs ====================

export async function getEventVendors(eventId: string, filters?: { status?: string; search?: string; hasOrders?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('role', 'VENDOR');
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status.toUpperCase().replace(' ', '_'));
  if (filters?.search) params.set('search', filters.search);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch vendors');
  return (data.participants ?? data ?? []).filter((p: any) => p.role === 'VENDOR');
}

export async function inviteVendorByEmail(eventId: string, payload: {
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  message?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, role: 'VENDOR', inviteType: 'EMAIL' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to invite vendor');
  return data;
}

export async function manualAddVendor(eventId: string, payload: {
  firstName: string;
  lastName: string;
  companyName?: string;
  bio?: string;
  socialLinks?: { linkedin?: string; twitter?: string; website?: string };
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/manual-add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, role: 'VENDOR' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to add vendor');
  return data;
}


// ==================== COLLABORATION REQUEST APIs ====================

export async function getCollaborationRequests(eventId: string, filters?: { status?: string; role?: string; search?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters?.role && filters.role !== 'All') params.set('role', filters.role);
  if (filters?.search) params.set('search', filters.search);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/collaboration-requests?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch collaboration requests');
  return data.data ?? [];
}

export async function respondToCollaborationRequest(eventId: string, requestId: string, action: 'ACCEPT' | 'DECLINE', message?: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/collaboration-requests/${requestId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to respond to request');
  return data.data;
}


// ==================== ROOM MANAGEMENT APIs ====================

export async function getEventRooms(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch rooms');
  return data ?? [];
}

export async function createEventRoom(eventId: string, payload: {
  name: string;
  description?: string;
  accessType?: string;
  capacity?: number;
  communityChatEnabled?: boolean;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, accessType: payload.accessType || 'PUBLIC' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create room');
  return data;
}

export async function updateEventRoom(eventId: string, roomId: string, payload: {
  name?: string;
  description?: string;
  accessType?: string;
  capacity?: number;
  communityChatEnabled?: boolean;
  isActive?: boolean;
  allowedTicketTypeIds?: string[];
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  bannerImageUrl?: string;
  bannerImageTitle?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update room');
  return data;
}

export async function deleteEventRoom(eventId: string, roomId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Failed to delete room');
  }
}


export async function uploadRoomBanner(eventId: string, file: File): Promise<{ url: string; title: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'IMAGE');
  formData.append('category', 'GENERAL');
  formData.append('isPublic', 'true');
  formData.append('title', file.name);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to upload room banner');
  return { url: data.url, title: data.title || file.name };
}


export async function deleteEventMediaByUrl(eventId: string, mediaUrl: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media/delete-by-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: mediaUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to delete media');
  }
}


// ==================== SESSION MANAGEMENT APIs ====================

export async function getAllEventSessionsForEvent(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/sessions`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch sessions');
  return data ?? [];
}

export async function getSessionsForRoom(eventId: string, roomId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}/sessions`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch room sessions');
  return data ?? [];
}

export async function createEventSession(eventId: string, roomId: string, payload: {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: string;
  speakers?: { speakerProfileId: string; name: string; isLeadSpeaker?: boolean }[];
  tags?: string[];
  isPublic?: boolean;
  communityChatEnabled?: boolean;
  capacity?: number;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create session');
  return data;
}

export async function updateEventSession(eventId: string, roomId: string, sessionId: string, payload: {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  speakers?: { speakerProfileId: string; name: string; isLeadSpeaker?: boolean }[];
  tags?: string[];
  isPublic?: boolean;
  communityChatEnabled?: boolean;
  capacity?: number;
  roomId?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update session');
  return data;
}

export async function deleteEventSession(eventId: string, roomId: string, sessionId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Failed to delete session');
  }
}

export async function uploadSessionThumbnail(eventId: string, file: File): Promise<{ url: string; title: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'IMAGE');
  formData.append('category', 'GENERAL');
  formData.append('isPublic', 'true');
  formData.append('title', file.name);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to upload session thumbnail');
  return { url: data.url, title: data.title || file.name };
}


// ==================== AGENDA APIs ====================

export async function getEventAgenda(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/agenda`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch agenda');
  return data;
}


// ==================== COMMUNITY APIs ====================

export async function enableEventCommunity(eventId: string, settings?: any): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/enable-community`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to enable community');
  return data;
}

export async function getEventCommunity(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/community`);
  const data = await res.json();
  if (!res.ok) return null;
  return data.community ?? data ?? null;
}

export async function updateCommunitySettings(communityId: string, settings: any): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/communities/${communityId}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update community settings');
  return data;
}


// ==================== MEDIA MANAGEMENT APIs ====================

export async function getEventMedia(eventId: string, typeFilter?: string): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('category', 'EVENT_GALLERY');
  if (typeFilter && typeFilter !== 'All') params.set('type', typeFilter);
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch media');
  return data.media ?? data ?? [];
}

export async function deleteEventMedia(eventId: string, mediaId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media/${mediaId}`, { method: 'DELETE' });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? 'Failed to delete media'); }
}

export async function uploadEventMedia(eventId: string, file: File, title?: string, description?: string, isPublic: boolean = true): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', file.type.startsWith('video') ? 'VIDEO' : file.type === 'application/pdf' ? 'DOCUMENT' : 'IMAGE');
  formData.append('category', 'EVENT_GALLERY');
  formData.append('isPublic', String(isPublic));
  formData.append('title', title || file.name);
  if (description) formData.append('description', description);
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to upload media');
  return data;
}

// ==================== FAQ MANAGEMENT APIs ====================

export async function getEventFaqs(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/faqs`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch FAQs');
  return data.faqs ?? data ?? [];
}

export async function createEventFaq(eventId: string, payload: { question: string; answer: string; category?: string; isPublic?: boolean }): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/faqs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create FAQ');
  return data;
}

export async function updateEventFaq(eventId: string, faqId: string, payload: { question?: string; answer?: string; category?: string; isPublic?: boolean }): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/faqs/${faqId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update FAQ');
  return data;
}

export async function deleteEventFaq(eventId: string, faqId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/faqs/${faqId}`, { method: 'DELETE' });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? 'Failed to delete FAQ'); }
}


// ==================== EVENT ADMIN APIs ====================

export async function getEventAdmins(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin?_t=${Date.now()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch admins');
  return data ?? [];
}

export async function inviteEventAdmin(eventId: string, payload: { userId: string; role: string; email?: string; message?: string }): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/invite`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to invite admin');
  return data;
}

export async function updateEventAdminPermissions(eventId: string, adminId: string, payload: { role?: string; permissions?: string[] }): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/${adminId}/permissions`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update admin');
  return data;
}

export async function removeEventAdmin(eventId: string, adminId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/${adminId}`, { method: 'DELETE' });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? 'Failed to remove admin'); }
}

export async function resendAdminInvite(eventId: string, adminId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/${adminId}/resend-invite`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to resend invitation');
  return data;
}

// ==================== ATTENDEE DETAIL & TIMELINE APIs ====================

export async function getAttendeeDetail(eventId: string, attendeeId: string): Promise<{
  attendee: any;
  registration: any;
  formAnswers: Array<{ question: string; answer: string; fieldType: string }>;
  ticketTypeName: string;
}> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/detail`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch attendee detail');
  return data.data;
}

export async function getAttendeeTimeline(eventId: string, attendeeId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/timeline`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch timeline');
  return data.data ?? [];
}

export async function updateAttendeeStatus(eventId: string, attendeeId: string, newStatus: string, notifyAttendee?: boolean, message?: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStatus, notifyAttendee, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update status');
  return data.data;
}

export async function reportAttendee(eventId: string, attendeeId: string, notes: string, blockForFutureEvents: boolean): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, blockForFutureEvents }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to report attendee');
  return data.data;
}

// ==================== ATTENDEE TAG APIs ====================

export async function addAttendeeTag(eventId: string, attendeeId: string, tagName: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to add tag');
  return data.data;
}

export async function removeAttendeeTag(eventId: string, attendeeId: string, tagName: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/tags/${encodeURIComponent(tagName)}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to remove tag');
  return data.data;
}

export async function getEventTags(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/tags/all`);
  const data = await res.json();
  if (!res.ok) return [];
  return data.data ?? [];
}

export async function createEventTag(eventId: string, name: string, color: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/tags/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create tag');
  return data.data;
}

export async function updateEventTag(eventId: string, tagId: string, name: string, color: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/tags/${tagId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update tag');
  return data.data;
}
