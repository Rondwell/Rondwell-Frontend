import { authFetch } from '$lib/services/api.client';
import { throwApiError } from '$lib/utils/errorMessage';

// All HTTP traffic goes through the gateway (same base URL as other services).
const COMMUNITY_URL = import.meta.env.VITE_API_URL;
const COMMUNITY_WS_URL = import.meta.env.VITE_COMMUNITY_WS_URL as string | undefined;

export interface CommunitySettings {
  allowPosts: boolean;
  allowComments: boolean;
  allowReactions: boolean;
  allowPolls: boolean;
  allowPrivateChat: boolean;
  allowFileSharing: boolean;
  allowUpvoteDownvote: boolean;
  moderationEnabled?: boolean;
  profanityFilterEnabled?: boolean;
  profanityKeywords?: string[];
}

export interface CommunityRoom {
  _id: string;
  name: string;
  description?: string;
  emoji?: string;
  coverImageUrl?: string;
  isDefault?: boolean;
  organizerId: string;
  settings: CommunitySettings;
  postCount: number;
  createdAt?: string;
}

export interface CommunityPost {
  _id: string;
  chatRoomId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content?: string; // sanitized HTML
  mediaUrl?: string;
  pinned: boolean;
  likes: string[];
  commentCount: number;
  createdAt: string;
}

export interface CommunityOverview {
  enabled: boolean;
  community: {
    _id: string;
    chatRoomId: string;
    name: string;
    organizerId: string;
    isEnabled: boolean;
    settings: CommunitySettings;
    memberCount: number;
    messageCount: number;
  } | null;
  rooms: CommunityRoom[];
  stats: { activeUsers: number; totalPosts: number; chatRooms: number };
}

// ─── Overview / rooms (public reads) ────────────────────────────────────────
export async function getEventOverview(eventId: string): Promise<CommunityOverview> {
  const res = await fetch(`${COMMUNITY_URL}/api/v1/community/events/${eventId}/overview`);
  if (!res.ok) {
    return { enabled: false, community: null, rooms: [], stats: { activeUsers: 0, totalPosts: 0, chatRooms: 0 } };
  }
  const data = await res.json();
  return {
    enabled: data.enabled ?? false,
    community: data.community ?? null,
    rooms: data.rooms ?? [],
    stats: data.stats ?? { activeUsers: 0, totalPosts: 0, chatRooms: 0 },
  };
}

export async function getRoomPosts(roomId: string, page = 1, limit = 20): Promise<CommunityPost[]> {
  const res = await fetch(`${COMMUNITY_URL}/api/v1/community/rooms/${roomId}/posts?page=${page}&limit=${limit}`);
  if (!res.ok) return [];
  return (await res.json()).posts ?? [];
}

export async function getPost(postId: string): Promise<CommunityPost | null> {
  const res = await fetch(`${COMMUNITY_URL}/api/v1/community/posts/${postId}`);
  if (!res.ok) return null;
  return (await res.json()).post ?? null;
}

// ─── Rooms (organizer writes) ───────────────────────────────────────────────
export async function createCommunityRoom(
  eventId: string,
  payload: { name: string; description?: string; emoji?: string; coverImageUrl?: string }
): Promise<CommunityRoom> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/events/${eventId}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create room');
  return (await res.json()).room;
}

export async function updateCommunityRoom(
  roomId: string,
  payload: { name?: string; description?: string; emoji?: string; coverImageUrl?: string }
): Promise<CommunityRoom> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/rooms/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update room');
  return (await res.json()).room;
}

export async function deleteCommunityRoom(roomId: string): Promise<void> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/rooms/${roomId}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res, 'Failed to delete room');
}

// ─── Post image uploads ──────────────────────────────────────────────────────
// Uploaded as *transient* drafts: the server tags them so an S3 lifecycle rule
// auto-expires abandoned uploads. Publishing a post promotes its images to
// permanent; removing/replacing/cancelling deletes them via deleteCommunityImage.
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadCommunityImage(file: File): Promise<string> {
  const data = await fileToDataUrl(file);
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/uploads/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to upload image');
  return (await res.json()).url;
}

// Best-effort cleanup of an unpublished draft image. Never throws — the S3
// lifecycle rule is the safety net if this call is skipped or fails.
export async function deleteCommunityImage(url: string): Promise<void> {
  if (!url) return;
  try {
    await authFetch(`${COMMUNITY_URL}/api/v1/community/uploads/image`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch {
    /* ignore — lifecycle rule will expire the transient object */
  }
}

// Master on/off for the event community. Hits the community service directly
// (no cross-service RPC), so the public event page locks/unlocks reliably.
export async function setCommunityEnabled(eventId: string, enabled: boolean): Promise<{ enabled: boolean }> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/events/${eventId}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to toggle community');
  return res.json();
}

// ─── Posts (writes) ─────────────────────────────────────────────────────────
export async function createCommunityPost(
  roomId: string,
  payload: { title: string; content?: string; mediaUrl?: string; authorName?: string; authorAvatar?: string }
): Promise<CommunityPost> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/rooms/${roomId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create post');
  return (await res.json()).post;
}

export async function togglePostLike(postId: string): Promise<{ likeCount: number; liked: boolean }> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/posts/${postId}/like`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to react');
  return res.json();
}

export async function getPostComments(postId: string): Promise<any[]> {
  const res = await fetch(`${COMMUNITY_URL}/api/v1/community/posts/${postId}/comments`);
  if (!res.ok) return [];
  return (await res.json()).comments ?? [];
}

export async function addPostComment(
  postId: string,
  payload: { content: string; authorName?: string; authorAvatar?: string }
): Promise<any> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to add comment');
  return (await res.json()).comment;
}

export async function pinCommunityPost(postId: string): Promise<{ pinned: boolean }> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/posts/${postId}/pin`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to pin post');
  return res.json();
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  const res = await authFetch(`${COMMUNITY_URL}/api/v1/community/posts/${postId}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res, 'Failed to delete post');
}

// ─────────────────────────────────────────────────────────────────────────────
// Realtime feed connection
// ─────────────────────────────────────────────────────────────────────────────
export type FeedEvent =
  | { type: 'FEED_JOINED'; contextId: string }
  | { type: 'ROOM_CREATED'; room: CommunityRoom }
  | { type: 'ROOM_UPDATED'; room: CommunityRoom }
  | { type: 'ROOM_DELETED'; roomId: string }
  | { type: 'POST_CREATED'; roomId: string; post: CommunityPost }
  | { type: 'POST_LIKED'; postId: string; roomId: string; likeCount: number; userId: string; liked: boolean }
  | { type: 'COMMENT_CREATED'; postId: string; roomId: string; comment: any; commentCount: number }
  | { type: 'POST_PINNED'; postId: string; roomId: string; pinned: boolean }
  | { type: 'POST_DELETED'; postId: string; roomId: string }
  | { type: 'SETTINGS_UPDATED'; settings: CommunitySettings }
  | { type: 'COMMUNITY_TOGGLED'; enabled: boolean };

/**
 * Opens a resilient realtime connection to an event community feed.
 * Auto-reconnects with backoff and re-joins the feed on reconnect.
 * Returns a disposer that closes the socket.
 */
export function connectFeed(eventId: string, onEvent: (e: FeedEvent) => void): () => void {
  if (!COMMUNITY_WS_URL) {
    console.warn('VITE_COMMUNITY_WS_URL not set — realtime community disabled.');
    return () => {};
  }

  let ws: WebSocket | null = null;
  let closed = false;
  let attempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const open = () => {
    if (closed) return;
    try {
      ws = new WebSocket(`${COMMUNITY_WS_URL}/community/chat`);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      attempts = 0;
      ws?.send(JSON.stringify({ type: 'JOIN_FEED', contextId: eventId }));
    };
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data?.type) onEvent(data as FeedEvent);
      } catch { /* ignore malformed */ }
    };
    ws.onclose = () => { if (!closed) scheduleReconnect(); };
    ws.onerror = () => { try { ws?.close(); } catch { /* noop */ } };
  };

  const scheduleReconnect = () => {
    if (closed) return;
    attempts += 1;
    const delay = Math.min(30000, 1000 * 2 ** Math.min(attempts, 5));
    reconnectTimer = setTimeout(open, delay);
  };

  open();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    try { ws?.send(JSON.stringify({ type: 'LEAVE_FEED' })); } catch { /* noop */ }
    try { ws?.close(); } catch { /* noop */ }
  };
}
