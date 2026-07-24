import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';
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
  maxGroupSize?: number;
  isMultiDay?: boolean;
  /**
   * FE-P2-01 (P2-01) — per-event refund policy. The server enforces:
   *   { window: 'BEFORE_START', hoursAfter: 0 }            — refunds blocked once the event starts
   *   { window: 'WITHIN_X_HOURS_AFTER', hoursAfter: 24 }   — default; allows up to N hours after start
   *   { window: 'NEVER', hoursAfter: 0 }                    — no refunds at all
   */
  refundPolicy?: {
    window: 'BEFORE_START' | 'WITHIN_X_HOURS_AFTER' | 'NEVER';
    hoursAfter?: number;
  };
  /**
   * FE-P2-03 (P2-03) — vendor escrow window in days (1..14). After invoice
   * payment success the funds are held for this many days before the
   * release cron pays out the vendor; the organizer can dispute within
   * the window.
   */
  vendorEscrowDays?: number;
  /**
   * FE-P3-08 (P3-08 / NEW-10.3) — ticket transfer / resale rails.
   */
  allowResale?: boolean;
  resalePlatformFeePercent?: number; // basis points, e.g. 1000 = 10%
  transferCutoffHoursBeforeStart?: number;
}

export interface CreateEventResponse {
  message: string;
  eventId: string;
  eventUrl: string;
  customLinkSlug: string;
}

export async function createEvent(payload: CreateEventPayload): Promise<CreateEventResponse> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) await throwApiError(res, 'Failed to create event');
  const data = await res.json();
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

export async function getMySubscribedCollections(): Promise<any[]> {
  try {
    const res = await authFetch(`${EVENT_URL}/api/v1/collections/my-subscriptions`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.collections ?? [];
  } catch {
    return [];
  }
}

export async function getEventById(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch event');
  const data = await res.json();
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
  eventDays: any[];
  organizers: any[];
  attendeeCount: number;
  attendingSample: any[];
  collection: any;
  registrationFields: any[];
  organizerProfile: any;
}> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/public`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch event page');
  const data = await res.json();
  return data;
}

/** Public agenda — no auth required */
export async function getPublicAgenda(eventId: string): Promise<{ dates: any[]; rooms: any[]; eventDays: any[] }> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/public/agenda`);
  const data = await res.json();
  if (!res.ok) return { dates: [], rooms: [], eventDays: [] };
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

/**
 * Check whether a custom event link (slug) is valid and available before saving.
 * Availability is enforced across every event's live + retired slugs server-side.
 */
export async function checkEventSlugAvailability(
  slug: string,
  eventId?: string
): Promise<{ available: boolean; valid: boolean; normalized?: string; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (eventId) params.set('eventId', eventId);
    const res = await authFetch(
      `${EVENT_URL}/api/v1/events/slug-available/${encodeURIComponent(slug)}?${params.toString()}`
    );
    if (!res.ok) return { available: false, valid: false, error: 'Could not check availability.' };
    return await res.json();
  } catch {
    return { available: false, valid: false, error: 'Could not check availability.' };
  }
}

export async function updateEvent(eventId: string, payload: Partial<CreateEventPayload>): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update event');
  const data = await res.json();
  invalidateEventCache(eventId);
  return data.event;
}

export async function publishEvent(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/publish`, {
    method: 'PUT',
  });
  if (!res.ok) await throwApiError(res, 'Failed to publish event');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to upload photo');
  const data = await res.json();

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
    attendeeStatus?: string;
    ticketTypeId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<PaginatedAttendeesResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.search) params.set('search', options.search);
  if (options.attendeeStatus) params.set('attendeeStatus', options.attendeeStatus);
  if (options.ticketTypeId) params.set('ticketTypeId', options.ticketTypeId);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.sortOrder) params.set('sortOrder', options.sortOrder);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/paginated?${params.toString()}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch attendees');
  const data = await res.json();
  return data.data;
}

export async function getMyEvents(): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/organizer/all`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch events');
  const data = await res.json();
  return data.events ?? [];
}

export async function getMyAttendingEvents(): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/attending`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch attending events');
  const data = await res.json();
  return data.events ?? [];
}

// ==================== ATTENDEE INVITATION APIs ====================

export async function inviteAttendees(
  eventId: string,
  attendees: Array<{ email: string; firstName?: string; lastName?: string }>,
  customMessage?: string
): Promise<{ success: any[]; failed: any[] }> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attendees, customMessage }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to invite attendees');
  const data = await res.json();
  return data.data;
}

export async function getEmailUsage(userId: string): Promise<{ used: number; limit: number; tier: string }> {
  const res = await authFetch(`${EVENT_URL}/api/v1/email/usage/${userId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch email usage');
  const data = await res.json();
  return data.data;
}


// ==================== TICKET TYPE APIs ====================

export async function getTicketTypes(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/tickets`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch ticket types');
  const data = await res.json();
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
  /** FE-P2-11 (NEW-4.3) — early-bird discount auto-applied within window. */
  isEarlyBird?: boolean;
  /** Percentage 1..100. Discount applied when `now <= salesEndDate − EARLY_BIRD_WINDOW_DAYS`. */
  earlyBirdDiscountPercentage?: number;
  /** Organizer-chosen early-bird cutoff (ISO). Overrides the window-days fallback. */
  earlyBirdEndDate?: string;
  allowedEventDayIds?: string[];
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create ticket type');
  const data = await res.json();
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
  /** FE-P2-11 (NEW-4.3) — early-bird editor fields. */
  isEarlyBird?: boolean;
  earlyBirdDiscountPercentage?: number;
  earlyBirdEndDate?: string;
  allowedEventDayIds?: string[];
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/tickets/${ticketTypeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update ticket type');
  const data = await res.json();
  return data.updated;
}

export async function deleteTicketType(eventId: string, ticketTypeId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/tickets/${ticketTypeId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete ticket type');
  const data = await res.json();
}

// ==================== REGISTRATION STATUS / GROUP REGISTRATION / CAPACITY ====================

export async function updateRegistrationOpen(eventId: string, registrationOpen: boolean): Promise<any> {
  return updateEvent(eventId, { registrationOpen } as any);
}

export async function updateGroupRegistration(eventId: string, groupRegistrationEnabled: boolean, maxGroupSize?: number): Promise<any> {
  const payload: any = { groupRegistrationEnabled };
  if (maxGroupSize !== undefined) payload.maxGroupSize = maxGroupSize;
  return updateEvent(eventId, payload as any);
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
  if (!res.ok) await throwApiError(res, 'Failed to fetch registration fields');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to create registration field');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update registration field');
  const data = await res.json();
  return data.field;
}

export async function deleteRegistrationField(eventId: string, fieldId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/registration-fields/${fieldId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete registration field');
}

export async function reorderRegistrationFields(eventId: string, fieldOrders: { fieldId: string; order: number }[]): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/registration-fields/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fieldOrders }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to reorder registration fields');
  const data = await res.json();
  return data.fields ?? [];
}

// ==================== SEAT LAYOUTS ====================

export async function getSeatLayouts(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch seat layouts');
  const data = await res.json();
  return data;
}

export async function getSeatLayoutById(eventId: string, layoutId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts/${layoutId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch seat layout');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to create seat layout');
  const data = await res.json();
  return data;
}

export async function updateSeatLayout(eventId: string, layoutId: string, payload: any): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts/${layoutId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update seat layout');
  const data = await res.json();
  return data;
}

export async function publishSeatLayout(eventId: string, layoutId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts/${layoutId}/publish`, {
    method: 'PATCH',
  });
  if (!res.ok) await throwApiError(res, 'Failed to publish seat layout');
  const data = await res.json();
  return data;
}

export async function deleteSeatLayout(eventId: string, layoutId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/seat-layouts/${layoutId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete seat layout');
}


// ==================== PARTICIPANT / SPEAKER MANAGEMENT APIs ====================

export async function getEventSpeakers(eventId: string, filters?: { status?: string; search?: string; hasSession?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('role', 'SPEAKER');
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status.toUpperCase().replace(' ', '_'));
  if (filters?.search) params.set('search', filters.search);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants?${params.toString()}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch speakers');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to invite speaker');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to invite speaker');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to add speaker');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update speaker details');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to send message');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to send reminder');
  const data = await res.json();
  return data;
}

export async function resendSpeakerInvitation(eventId: string, participantId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/resend-invitation`, {
    method: 'POST',
  });
  if (!res.ok) await throwApiError(res, 'Failed to resend invitation');
  const data = await res.json();
  return data;
}

export async function removeSpeaker(eventId: string, participantId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to remove speaker');
}

export async function assignSpeakerSessions(eventId: string, participantId: string, sessionIds: string[]): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/assign-sessions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionIds }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to assign sessions');
  const data = await res.json();
  return data;
}

/**
 * Search existing Rondwell profiles to add as a participant.
 * `query` can be an exact email (matches any registered user) or a
 * name/keyword (matches the role's public directory).
 */
export async function searchRondwellProfiles(
  eventId: string,
  query: string,
  role: 'SPEAKER' | 'EXHIBITOR' | 'VENDOR' = 'SPEAKER',
): Promise<any[]> {
  const params = new URLSearchParams({ q: query, role });
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/search-profiles?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) return [];
  return data.profiles ?? data.speakers ?? [];
}

/** @deprecated use searchRondwellProfiles(eventId, query, 'SPEAKER') */
export async function searchRondwellSpeakers(eventId: string, query: string): Promise<any[]> {
  return searchRondwellProfiles(eventId, query, 'SPEAKER');
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
  if (!res.ok) await throwApiError(res, 'Failed to fetch exhibitors');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to invite exhibitor');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to invite exhibitor');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to add exhibitor');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update exhibitor details');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to approve participant');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to decline participant');
  const data = await res.json();
  return data;
}

export async function sendPaymentRequest(eventId: string, participantId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/send-payment-request`, {
    method: 'POST',
  });
  if (!res.ok) await throwApiError(res, 'Failed to send payment request');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to mark as paid');
  const data = await res.json();
  return data;
}


// ==================== VENDOR MANAGEMENT APIs ====================

export async function getEventVendors(eventId: string, filters?: { status?: string; search?: string; hasOrders?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('role', 'VENDOR');
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status.toUpperCase().replace(' ', '_'));
  if (filters?.search) params.set('search', filters.search);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants?${params.toString()}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch vendors');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to invite vendor');
  const data = await res.json();
  return data;
}

export async function inviteVendorByProfile(eventId: string, payload: {
  participantProfileId: string;
  participantUserId: string;
  message?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, role: 'VENDOR', inviteType: 'RONDWELL_PROFILE' }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to invite vendor');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to add vendor');
  const data = await res.json();
  return data;
}


// ==================== COLLABORATION REQUEST APIs ====================

export async function getCollaborationRequests(eventId: string, filters?: { status?: string; role?: string; search?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters?.role && filters.role !== 'All') params.set('role', filters.role);
  if (filters?.search) params.set('search', filters.search);

  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/collaboration-requests?${params.toString()}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch collaboration requests');
  const data = await res.json();
  return data.data ?? [];
}

export async function respondToCollaborationRequest(eventId: string, requestId: string, action: 'ACCEPT' | 'DECLINE', message?: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/participants/collaboration-requests/${requestId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, message }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to respond to request');
  const data = await res.json();
  return data.data;
}


// ==================== ROOM MANAGEMENT APIs ====================

export async function getEventRooms(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch rooms');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to create room');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update room');
  const data = await res.json();
  return data;
}

export async function deleteEventRoom(eventId: string, roomId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete room');
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
  if (!res.ok) await throwApiError(res, 'Failed to upload room banner');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to fetch sessions');
  const data = await res.json();
  return data ?? [];
}

export async function getSessionsForRoom(eventId: string, roomId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}/sessions`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch room sessions');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to create session');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update session');
  const data = await res.json();
  return data;
}

export async function deleteEventSession(eventId: string, roomId: string, sessionId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/rooms/${roomId}/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete session');
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
  if (!res.ok) await throwApiError(res, 'Failed to upload session thumbnail');
  const data = await res.json();
  return { url: data.url, title: data.title || file.name };
}


// ==================== AGENDA APIs ====================

export async function getEventAgenda(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/agenda`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch agenda');
  const data = await res.json();
  return data;
}


// ==================== COMMUNITY APIs ====================

export async function enableEventCommunity(eventId: string, settings?: any): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/enable-community`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings || {}),
  });
  if (!res.ok) await throwApiError(res, 'Failed to enable community');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to update community settings');
  const data = await res.json();
  return data;
}


// ==================== MEDIA MANAGEMENT APIs ====================

export async function getEventMedia(eventId: string, typeFilter?: string): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('category', 'EVENT_GALLERY');
  if (typeFilter && typeFilter !== 'All') params.set('type', typeFilter);
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media?${params.toString()}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch media');
  const data = await res.json();
  return data.media ?? data ?? [];
}

export async function deleteEventMedia(eventId: string, mediaId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/media/${mediaId}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res, 'Failed to delete media');
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
  if (!res.ok) await throwApiError(res, 'Failed to upload media');
  const data = await res.json();
  return data;
}

// ==================== FAQ MANAGEMENT APIs ====================

export async function getEventFaqs(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/faqs`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch FAQs');
  const data = await res.json();
  return data.faqs ?? data ?? [];
}

export async function createEventFaq(eventId: string, payload: { question: string; answer: string; category?: string; isPublic?: boolean }): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/faqs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create FAQ');
  const data = await res.json();
  return data;
}

export async function updateEventFaq(eventId: string, faqId: string, payload: { question?: string; answer?: string; category?: string; isPublic?: boolean }): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/faqs/${faqId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update FAQ');
  const data = await res.json();
  return data;
}

export async function deleteEventFaq(eventId: string, faqId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/faqs/${faqId}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res, 'Failed to delete FAQ');
}


// ==================== EVENT ADMIN APIs ====================

export async function getEventAdmins(eventId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin?_t=${Date.now()}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch admins');
  const data = await res.json();
  return data ?? [];
}

export interface InviteEventAdminPayload {
  email: string;
  role: string;
  displayName?: string;
  permissions?: string[];
  personalMessage?: string;
  showOnEventPage?: boolean;
}

export async function inviteEventAdmin(eventId: string, payload: InviteEventAdminPayload): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/invite`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to invite admin');
  const data = await res.json();
  return data;
}

export async function updateEventAdminPermissions(eventId: string, adminId: string, payload: { role?: string; permissions?: string[]; showOnEventPage?: boolean }): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/${adminId}/permissions`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update admin');
  const data = await res.json();
  return data;
}

export async function removeEventAdmin(eventId: string, adminId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/${adminId}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res, 'Failed to remove admin');
}

export async function resendAdminInvite(eventId: string, adminId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/${adminId}/resend-invite`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to resend invitation');
  const data = await res.json();
  return data;
}

/**
 * Public — no auth. Returns a sanitized invitation preview for the
 * /admin-invitation/[token] confirmation page. Throws Error with code on:
 *   - 404 invitation not found
 *   - 409 already accepted/declined/revoked
 *   - 410 invitation expired
 */
export async function getAdminInvitation(eventId: string, token: string): Promise<any> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/invitation/${encodeURIComponent(token)}`);
  if (!res.ok) {
    // Preserve the specific code used by the confirmation page so it can
    // render the right empty state (expired, already processed, not found).
    const codeByStatus =
      res.status === 404 ? 'NOT_FOUND' :
      res.status === 409 ? 'ALREADY_PROCESSED' :
      res.status === 410 ? 'EXPIRED' : 'ERROR';
    try {
      await throwApiError(res, 'Failed to load invitation');
    } catch (err: any) {
      err.code = codeByStatus;
      throw err;
    }
  }
  const data = await res.json().catch(() => ({}));
  return data.data ?? data;
}

/** Auth required. Accepts the invitation, links the userId, marks ACCEPTED. */
export async function acceptAdminInvite(eventId: string, token: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/accept-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to accept invitation');
  const data = await res.json().catch(() => ({}));
  return data.data ?? data;
}

/** Public — no auth. Declines the invitation by token. */
export async function declineAdminInvite(eventId: string, token: string): Promise<any> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/admin/decline-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to decline invitation');
  const data = await res.json().catch(() => ({}));
  return data.data ?? data;
}

/** Loads the public roles catalog from the backend (single source of truth). */
export async function getAdminRolesCatalog(): Promise<Array<{
  value: string;
  label: string;
  description: string;
  icon: string;
  permissions: string[];
  requiresPlus: boolean;
}>> {
  try {
    const res = await fetch(`${EVENT_URL}/api/v1/events/admin/roles`);
    const data = await res.json();
    if (!res.ok) return [];
    return data.data ?? [];
  } catch {
    return [];
  }
}

// ==================== ATTENDEE DETAIL & TIMELINE APIs ====================

export async function getAttendeeDetail(eventId: string, attendeeId: string): Promise<{
  attendee: any;
  registration: any;
  formAnswers: Array<{ question: string; answer: string; fieldType: string }>;
  ticketTypeName: string;
  ticketPrice: number;
  ticketCurrency: string;
  seatInfo: any;
}> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/detail?_t=${Date.now()}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch attendee detail');
  const data = await res.json();
  return data.data;
}

export async function getAttendeeTimeline(eventId: string, attendeeId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/timeline?_t=${Date.now()}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch timeline');
  const data = await res.json();
  return data.data ?? [];
}

export async function updateAttendeeStatus(eventId: string, attendeeId: string, newStatus: string, notifyAttendee?: boolean, message?: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStatus, notifyAttendee, message }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update status');
  const data = await res.json();
  return data.data;
}

export async function reportAttendee(eventId: string, attendeeId: string, notes: string, blockForFutureEvents: boolean): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, blockForFutureEvents }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to report attendee');
  const data = await res.json();
  return data.data;
}

export async function deleteAttendee(eventId: string, attendeeId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete attendee');
  const data = await res.json();
  return data.data;
}

// ==================== ATTENDEE TAG APIs ====================

export async function addAttendeeTag(eventId: string, attendeeId: string, tagName: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagName }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to add tag');
  const data = await res.json();
  return data.data;
}

export async function removeAttendeeTag(eventId: string, attendeeId: string, tagName: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/${attendeeId}/tags/${encodeURIComponent(tagName)}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to remove tag');
  const data = await res.json();
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
  if (!res.ok) await throwApiError(res, 'Failed to create tag');
  const data = await res.json();
  return data.data;
}

export async function updateEventTag(eventId: string, tagId: string, name: string, color: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/attendees/tags/${tagId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update tag');
  const data = await res.json();
  return data.data;
}

// ==================== EVENT SETTINGS APIs (Clone, Transfer, Cancel, Delete) ====================

export async function cloneEvent(eventId: string, payload: {
  collectionId: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/clone`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to clone event');
  const data = await res.json();
  return data;
}

export async function transferEventCollection(eventId: string, newCollectionId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/transfer-collection`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newCollectionId }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to transfer event');
  const data = await res.json();
  invalidateEventCache(eventId);
  return data;
}

export async function cancelEvent(eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/cancel`, {
    method: 'PUT',
  });
  if (!res.ok) await throwApiError(res, 'Failed to cancel event');
  const data = await res.json();
  invalidateEventCache(eventId);
  return data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete event');
}


// ── Collection API Services ───────────────────────────────────────────────

export async function createCollection(payload: {
  name: string;
  description?: string;
  themeColor?: string;
  // Note: `slug` is intentionally omitted — the backend always generates a
  // unique shareable slug on creation (like vendor/exhibitor/speaker pages).
  location?: string;
  socialLinks?: Record<string, string>;
  visibility?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create collection');
  const data = await res.json();
  return data.collection ?? data;
}

export async function updateCollection(collectionId: string, payload: Record<string, any>): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update collection');
  const data = await res.json();
  return data.collection ?? data;
}

/**
 * Delete a collection. The backend rejects deletion (409) while the collection
 * still has events or is the default collection; the thrown error carries
 * `status` and (when relevant) `code = 'COLLECTION_HAS_EVENTS'` + `eventCount`.
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body?.message ?? 'Failed to delete collection');
    err.status = res.status;
    err.code = body?.code;
    err.eventCount = body?.eventCount;
    throw err;
  }
}

export async function getCollectionById(collectionId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}`);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message ?? 'Failed to fetch collection');
    (err as any).status = res.status;
    throw err;
  }
  return data.collection ?? data;
}

export async function getCollectionEvents(collectionId: string, filter: 'upcoming' | 'past' = 'upcoming'): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/events?filter=${filter}`);
  const data = await res.json();
  if (!res.ok) return [];
  return data.events ?? [];
}

export async function addExistingEventToCollection(collectionId: string, eventId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/events/add-existing`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to add event to collection');
  const data = await res.json();
  return data;
}

export async function resolveEventUrl(collectionId: string, url: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/events/resolve-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) await throwApiError(res, 'Could not resolve event from URL');
  const data = await res.json();
  return data.event;
}

export async function addExternalEventToCollection(collectionId: string, payload: {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  eventType?: string;
  location?: string;
  organizerName?: string;
  sourceUrl?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/events/external`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to add external event');
  const data = await res.json();
  return data;
}

export async function getSelectableEventsForCollection(collectionId: string): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/events/selectable`);
  const data = await res.json();
  if (!res.ok) return [];
  return data.events ?? [];
}


export async function uploadCollectionProfilePicture(collectionId: string, file: File): Promise<{ profilePictureUrl: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/profile-picture`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload profile picture');
  const data = await res.json();
  return data;
}

export async function uploadCollectionCoverBanner(collectionId: string, file: File): Promise<{ coverBannerUrl: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/cover-banner`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload cover banner');
  const data = await res.json();
  return data;
}


export async function getPublicCollectionBySlug(slug: string): Promise<{ collection: any; events: any[] }> {
  const res = await fetch(`${EVENT_URL}/api/v1/collections/by-slug/${encodeURIComponent(slug)}`);
  if (!res.ok) await throwApiError(res, 'Collection not found');
  const data = await res.json();
  return { collection: data.collection, events: data.events ?? [] };
}


export async function scrapeExternalEventUrl(url: string): Promise<{
  title: string;
  description: string;
  image: string;
  siteName: string;
  startDate: string;
  endDate: string;
  location: string;
  sourceUrl: string;
}> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/scrape-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to fetch URL');
  const data = await res.json();
  return data;
}

// ── Collection Verification ───────────────────────────────────────────────

export async function requestCollectionVerification(collectionId: string, payload: {
  estimatedAudience: number;
  eventsInfo: string;
  guestsInfo: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/request-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to submit verification request');
  const data = await res.json();
  return data;
}

export async function getCollectionVerificationStatus(collectionId: string): Promise<{ approvalStatus: string; verificationRequest?: any }> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/verification-status`);
  if (!res.ok) await throwApiError(res, 'Failed to get verification status');
  const data = await res.json();
  return data;
}

// ==================== EVENT BLAST APIs ====================

export async function createEventBlast(eventId: string, payload: {
  subject: string;
  htmlContent: string;
  recipientStatuses: string[];
  scheduledAt?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/blasts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create blast');
  const data = await res.json();
  return data;
}

export async function getEventBlasts(eventId: string, params: Record<string, string> = {}): Promise<any> {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/blasts?${query}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch blasts');
  const data = await res.json();
  return data;
}

export async function getBlastQuota(eventId: string): Promise<{ used: number; limit: number; tier: string }> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/blasts/quota`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch quota');
  const data = await res.json();
  return data;
}

export async function cancelEventBlast(eventId: string, blastId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/blasts/${blastId}/cancel`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to cancel blast');
  const data = await res.json();
  return data;
}

export async function sendBlastNow(eventId: string, blastId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/blasts/${blastId}/send-now`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to send blast');
  const data = await res.json();
  return data;
}

export async function previewEventBlast(eventId: string, blastId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/blasts/${blastId}/preview`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to send preview');
  const data = await res.json();
  return data;
}

export async function previewBlastDraft(eventId: string, subject: string, htmlContent: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/blasts/preview-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, htmlContent }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to send preview');
  const data = await res.json();
  return data;
}

export async function uploadBlastImage(eventId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/blast-image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload image');
  const data = await res.json();
  return data.url;
}

/**
 * Upload an inline image for the event description rich-text editor.
 *
 * - When `eventId` is provided (edit flow), the image is stored under
 *   `events/{eventId}/description/`.
 * - When `eventId` is omitted (create flow — the event doesn't exist yet),
 *   it's uploaded to a draft prefix scoped to the authenticated organizer.
 *
 * Returns the public S3 URL to embed in the description HTML.
 */
export async function uploadEventDescriptionImage(
  file: File,
  eventId?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const url = eventId
    ? `${EVENT_URL}/api/v1/events/${eventId}/description-image`
    : `${EVENT_URL}/api/v1/events/description-image`;
  const res = await authFetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload image');
  const data = await res.json();
  return data.url;
}

// ==================== COLLECTION BLAST APIs ====================

export async function createCollectionBlast(collectionId: string, payload: {
  subject: string; htmlContent: string; recipientFilters?: { source?: string[] }; scheduledAt?: string;
}): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/blasts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create blast');
  const data = await res.json();
  return data;
}

export async function getCollectionBlasts(collectionId: string, params: Record<string, string> = {}): Promise<any> {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/blasts?${query}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch blasts');
  const data = await res.json();
  return data;
}

export async function getCollectionBlastQuota(collectionId: string): Promise<{ used: number; limit: number; tier: string }> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/blasts/quota`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch quota');
  const data = await res.json();
  return data;
}

export async function cancelCollectionBlast(collectionId: string, blastId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/blasts/${blastId}/cancel`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to cancel blast');
  const data = await res.json();
  return data;
}

export async function sendCollectionBlastNow(collectionId: string, blastId: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/blasts/${blastId}/send-now`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to send blast');
  const data = await res.json();
  return data;
}

export async function previewCollectionBlastDraft(collectionId: string, subject: string, htmlContent: string): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/blasts/preview-draft`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, htmlContent }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to send preview');
  const data = await res.json();
  return data;
}

export async function uploadCollectionBlastImage(collectionId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await authFetch(`${EVENT_URL}/api/v1/collections/${collectionId}/blast-image`, {
    method: 'POST', body: formData,
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload image');
  const data = await res.json();
  return data.url;
}


// ==================== CHECK-IN APIs ====================

/** Verify passcode — returns attendee details without checking in */
export async function verifyCheckinPasscode(eventId: string, passcode: string): Promise<any> {
  const res = await fetch(`${EVENT_URL}/api/v1/checkin/verify/passcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, passcode }),
  });
  if (!res.ok) await throwApiError(res, 'Verification failed');
  const data = await res.json();
  return data.data ?? data;
}

/** Verify QR token — returns attendee details without checking in */
export async function verifyCheckinQr(eventId: string, checkinToken: string): Promise<any> {
  const res = await fetch(`${EVENT_URL}/api/v1/checkin/verify/qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, checkinToken }),
  });
  if (!res.ok) await throwApiError(res, 'QR verification failed');
  const data = await res.json();
  return data.data ?? data;
}

/** Check in attendee via passcode */
export async function checkinByPasscode(eventId: string, passcode: string): Promise<any> {
  const res = await fetch(`${EVENT_URL}/api/v1/checkin/passcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, passcode }),
  });
  if (!res.ok) await throwApiError(res, 'Check-in failed');
  const data = await res.json();
  return data.data ?? data;
}

/** Check in attendee via QR code token */
export async function checkinByQrCode(eventId: string, checkinToken: string): Promise<any> {
  const res = await fetch(`${EVENT_URL}/api/v1/checkin/qr-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, checkinToken }),
  });
  if (!res.ok) await throwApiError(res, 'QR check-in failed');
  const data = await res.json();
  return data.data ?? data;
}

// ==================== EVENT DAY APIs (Multi-Day Event Support) ====================

export interface EventDayPayload {
  dayNumber: number;
  label?: string;
  date: string;
  startTime: string;
  endTime: string;
  checkinEnabled?: boolean;
  locationOverride?: {
    virtual?: { platform: string; meetingLink: string };
    physical?: { venueName: string; venueAddress: string; resolvedAddress?: { lat: number; lng: number; formatted_address: string } };
  };
}

export async function getEventDays(eventId: string): Promise<any[]> {
  const res = await fetch(`${EVENT_URL}/api/v1/events/${eventId}/days`);
  const data = await res.json();
  if (!res.ok) return [];
  return data.days ?? [];
}

export async function createEventDay(eventId: string, payload: EventDayPayload): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create event day');
  const data = await res.json();
  return data.day;
}

export async function updateEventDay(dayId: string, payload: Partial<EventDayPayload>): Promise<any> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/days/${dayId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update event day');
  const data = await res.json();
  return data.day;
}

export async function deleteEventDay(dayId: string): Promise<void> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/days/${dayId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete event day');
}

export async function bulkReplaceEventDays(eventId: string, days: EventDayPayload[]): Promise<any[]> {
  const res = await authFetch(`${EVENT_URL}/api/v1/events/${eventId}/days/bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to replace event days');
  const data = await res.json();
  return data.days ?? [];
}


// ==================== FE-P3-05 — GROUP REGISTRATION MEMBERS ====================

/**
 * FE-P3-05 (FA-3.1, NEW-1.2, NEW-10.2) — Fetch the per-member registrations
 * for a group purchase.
 *
 * Backend pre-creates N placeholder registrations on group registration
 * and finalizes each on payment success, generating a per-member QR /
 * passcode. The confirmation modal needs all of them so it can render the
 * lead's QR plus N member QRs.
 *
 * Returns an empty array if the endpoint isn't yet enabled in production.
 */
export async function getGroupRegistrationMembers(
	eventId: string,
	groupId: string
): Promise<any[]> {
	try {
		const res = await fetch(
			`${EVENT_URL}/api/v1/events/${eventId}/registrations/group/${groupId}/members`
		);
		if (!res.ok) return [];
		const data = await res.json();
		return data?.data ?? data?.members ?? data ?? [];
	} catch {
		return [];
	}
}


// ==================== PARTICIPANT INVITE ACCEPTANCE ====================

/**
 * Accept an event participant invitation from the emailed link.
 *
 * REQUIRES the invitee to be authenticated — the backend links their Rondwell
 * userId to the EventParticipant and creates a collaboration dashboard record.
 * The invite token from the email is still verified server-side.
 */
export async function acceptParticipantInvite(
  eventId: string,
  participantId: string,
  inviteToken: string
): Promise<any> {
  const res = await authFetch(
    `${EVENT_URL}/api/v1/events/${eventId}/participants/${participantId}/accept-invite`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteToken })
    }
  );
  if (!res.ok) await throwApiError(res, 'Failed to accept invitation');
  return res.json();
}
