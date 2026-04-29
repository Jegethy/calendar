// ============================================================================
// AUTH TYPES
// ============================================================================

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

export interface GoogleSyncStatus {
  isConnected: boolean;
  lastSyncError?: string | null;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiresAt: Date | null;
  googleSyncStatus: GoogleSyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Minimal user for sharing (no sensitive tokens)
export type PublicUser = Pick<User, 'id' | 'name' | 'color'>;

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface Event {
  id: string;
  title: string;
  description: string | null;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  rrule: string | null; // RFC 5545 format
  syncToGoogle: boolean;
  creatorId: string;
  creator: PublicUser;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  rrule?: string | null;
  syncToGoogle?: boolean;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  rrule?: string | null;
  syncToGoogle?: boolean;
}

// ============================================================================
// GOOGLE SYNC TYPES
// ============================================================================

export interface GoogleSync {
  id: string;
  eventId: string;
  userId: string;
  googleEventId: string;
  syncedAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CALENDAR TYPES
// ============================================================================

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  color: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  originalEvent: Event;
  isSyncedToGoogle: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
}

export interface EventsResponse {
  events: Event[];
}

export interface EventResponse {
  event: Event;
}
