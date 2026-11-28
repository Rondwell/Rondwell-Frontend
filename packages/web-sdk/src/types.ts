export type RondwellThemeMode = 'light' | 'dark' | 'auto';
export type RondwellCollectionLayout = 'grid' | 'list' | 'cards';

export interface RondwellInitConfig {
  publishableKey?: string;
  baseUrl?: string;
  apiBaseUrl?: string;
  theme?: RondwellThemeMode;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
}

export interface RondwellRegistrationSuccessPayload {
  registrationId: string;
  attendeeId?: string;
  eventId: string;
  ticketTypeId?: string;
  seatId?: string;
  seatNumber?: string;
  status?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  redirectUrl?: string;
}

export interface EventEmbedOptions {
  publishableKey?: string;
  baseUrl?: string;
  theme?: RondwellThemeMode;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  ticketId?: string;
  showCover?: boolean;
  showDescription?: boolean;
  showSeatMap?: boolean;
  showAttendeeCount?: boolean;
  redirectUrl?: string;
  metadata?: Record<string, string>;
  onReady?: (payload: { eventId: string }) => void;
  onTicketSelected?: (payload: { ticketTypeId: string; price?: number }) => void;
  onSeatSelected?: (payload: { seatId: string; seatNumber?: string }) => void;
  onSuccess?: (payload: RondwellRegistrationSuccessPayload) => void;
  onError?: (err: { message: string; code?: string }) => void;
  onClose?: () => void;
}

export interface CollectionEmbedOptions {
  publishableKey?: string;
  baseUrl?: string;
  layout?: RondwellCollectionLayout;
  theme?: RondwellThemeMode;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  showSearch?: boolean;
  showTags?: boolean;
  showPastEvents?: boolean;
  tagIds?: string[];
  openMode?: 'modal' | 'inline' | 'new_tab';
  redirectUrl?: string;
  onReady?: (payload: { collectionId: string }) => void;
  onEventSelect?: (payload: { eventId: string; slug?: string; title?: string }) => void;
  onSuccess?: (payload: RondwellRegistrationSuccessPayload) => void;
  onClose?: () => void;
}
