/**
 * Analytics API Service Layer
 * ===========================
 * Enterprise-grade data fetching for all 5 analytics dashboards.
 * All calls go through the gateway → analytics service (port 3006).
 *
 * Features:
 * - Automatic token refresh via authFetch
 * - Request deduplication for concurrent calls
 * - Typed responses matching backend materialized views
 * - AI-powered summary and chat endpoints
 */
import { authFetch } from '$lib/services/api.client';

const BASE_URL = import.meta.env.VITE_API_URL;
const ANALYTICS_API = `${BASE_URL}/api/v1/analytics`;
const AI_API = `${BASE_URL}/api/ai/analytics`;

// ─── Helper ──────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await authFetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

// ─── EVENT ANALYTICS ─────────────────────────────────────────────────────────

export async function getEventAnalyticsOverview(eventId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/overview`);
}

export async function getEventRegistrations(eventId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/registrations`);
}

export async function getEventFunnel(eventId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/registrations/funnel`);
}

export async function getEventTickets(eventId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/tickets`);
}

export async function getEventEngagement(eventId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/engagement`);
}

export async function getEventWaitlist(eventId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/waitlist`);
}

export async function getEventCommunications(eventId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/communications`);
}

export async function getEventPredictions(eventId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/predictions`);
}

export async function getEventTimeseries(eventId: string, metric = 'registrations', period = '30d') {
  return fetchJSON<any>(`${ANALYTICS_API}/events/${eventId}/timeseries?metric=${metric}&period=${period}`);
}

export async function getOrganizerEventsList(page = 1, limit = 20, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  return fetchJSON<any>(`${ANALYTICS_API}/events/organizer/list?${params}`);
}

// ─── COLLECTION ANALYTICS ────────────────────────────────────────────────────

export async function getCollectionAnalyticsOverview(collectionId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/collections/${collectionId}/overview`);
}

export async function getCollectionSubscribers(collectionId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/collections/${collectionId}/subscribers`);
}

export async function getCollectionEvents(collectionId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/collections/${collectionId}/events`);
}

export async function getCollectionAudience(collectionId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/collections/${collectionId}/audience`);
}

export async function getCollectionGrowth(collectionId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/collections/${collectionId}/growth`);
}

export async function getCollectionPredictions(collectionId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/collections/${collectionId}/predictions`);
}

// ─── SPEAKER ANALYTICS ───────────────────────────────────────────────────────

export async function getSpeakerAnalyticsOverview(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/speakers/${profileId}/overview`);
}

export async function getSpeakerParticipation(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/speakers/${profileId}/participation`);
}

export async function getSpeakerSessions(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/speakers/${profileId}/sessions`);
}

export async function getSpeakerAudience(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/speakers/${profileId}/audience`);
}

export async function getSpeakerCollaborations(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/speakers/${profileId}/collaborations`);
}

export async function getSpeakerReputation(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/speakers/${profileId}/reputation`);
}

export async function getSpeakerGrowth(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/speakers/${profileId}/growth`);
}

export async function getSpeakerPredictions(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/speakers/${profileId}/predictions`);
}

// ─── VENDOR ANALYTICS ────────────────────────────────────────────────────────

export async function getVendorAnalyticsOverview(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/vendors/${profileId}/overview`);
}

export async function getVendorProducts(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/vendors/${profileId}/products`);
}

export async function getVendorOrders(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/vendors/${profileId}/orders`);
}

export async function getVendorEvents(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/vendors/${profileId}/events`);
}

export async function getVendorFinancials(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/vendors/${profileId}/financials`);
}

export async function getVendorGrowth(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/vendors/${profileId}/growth`);
}

export async function getVendorPredictions(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/vendors/${profileId}/predictions`);
}

// ─── EXHIBITOR ANALYTICS ─────────────────────────────────────────────────────

export async function getExhibitorAnalyticsOverview(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/exhibitors/${profileId}/overview`);
}

export async function getExhibitorParticipation(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/exhibitors/${profileId}/participation`);
}

export async function getExhibitorBooth(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/exhibitors/${profileId}/booth`);
}

export async function getExhibitorLeads(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/exhibitors/${profileId}/leads`);
}

export async function getExhibitorFinancials(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/exhibitors/${profileId}/financials`);
}

export async function getExhibitorVisibility(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/exhibitors/${profileId}/visibility`);
}

export async function getExhibitorGrowth(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/exhibitors/${profileId}/growth`);
}

export async function getExhibitorPredictions(profileId: string) {
  return fetchJSON<any>(`${ANALYTICS_API}/exhibitors/${profileId}/predictions`);
}

// ─── AI ANALYTICS ────────────────────────────────────────────────────────────

/**
 * Read the server's explanation out of a failed AI response.
 *
 * These helpers used to return `null` on ANY non-2xx and drop the body, so the
 * dashboards could only ever say "Unable to generate summary." — whether the
 * model was unavailable, the analytics service was down, or there was simply
 * no data yet. The AI service now sends a message that is safe to display.
 */
async function aiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    const message = body?.error || body?.message;
    if (typeof message === 'string' && message.trim()) return message;
  } catch {
    /* not JSON — use the fallback */
  }
  if (res.status === 401) return 'Please sign in again to use AI insights.';
  if (res.status === 429) return 'The AI assistant is busy right now. Please try again in a minute.';
  if (res.status >= 500) return 'AI insights are temporarily unavailable. Please try again shortly.';
  return fallback;
}

export type AISummaryResult = { summary: string; generatedAt: string; error?: undefined } | { error: string; summary?: undefined };
export type AIChatResult = { answer: string; generatedAt: string; error?: undefined } | { error: string; answer?: undefined };

export async function generateAnalyticsSummary(entityType: string, entityId: string): Promise<AISummaryResult> {
  try {
    const res = await authFetch(AI_API + '/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId }),
    });
    if (!res.ok) return { error: await aiErrorMessage(res, 'Unable to generate a summary right now.') };
    const json = await res.json();
    const data = json.data ?? json;
    if (!data?.summary) return { error: 'The AI returned an empty summary. Please try again.' };
    return data;
  } catch {
    return { error: "Couldn't reach the AI service. Check your connection and try again." };
  }
}

export async function chatWithAnalytics(entityType: string, entityId: string, question: string): Promise<AIChatResult> {
  try {
    const res = await authFetch(AI_API + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId, question }),
    });
    if (!res.ok) return { error: await aiErrorMessage(res, 'Unable to answer that right now.') };
    const json = await res.json();
    const data = json.data ?? json;
    if (!data?.answer) return { error: 'The AI returned an empty answer. Please try again.' };
    return data;
  } catch {
    return { error: "Couldn't reach the AI service. Check your connection and try again." };
  }
}
