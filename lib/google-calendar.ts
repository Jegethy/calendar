import { calendar_v3, google } from 'googleapis';
import { prisma } from './prisma';
import { Event } from '@/types';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Cache for OAuth2 client to avoid recreation
let cachedOAuth2Client: google.auth.OAuth2 | null = null;

/**
 * Creates or returns cached OAuth2 client configured with Google credentials
 * Caching prevents unnecessary recreation across multiple function calls
 */
function getOAuth2Client(): google.auth.OAuth2 {
  if (cachedOAuth2Client) {
    return cachedOAuth2Client;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth credentials are not configured in environment variables');
  }

  cachedOAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return cachedOAuth2Client;
}

/**
 * Generates the Google OAuth2 authorization URL
 */
export function getAuthorizationUrl(): string {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  return authUrl;
}

/**
 * Exchanges authorization code for tokens and saves them to the database
 */
export async function exchangeCodeForTokens(code: string, userId: string): Promise<void> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Failed to obtain required tokens from Google');
    }

    // Save tokens to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiresAt: new Date(tokens.expiry_date),
      },
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

/**
 * Gets a valid OAuth2 client for a user, refreshing tokens if necessary
 * Accepts tokens directly to avoid redundant database lookups
 * 
 * @param userId - User ID (for logging and token refresh)
 * @param accessToken - Current access token
 * @param refreshToken - Refresh token
 * @param expiresAt - Token expiry date
 * @returns OAuth2 client or null if tokens are invalid
 */
async function getAuthenticatedOAuth2Client(
  userId: string,
  accessToken: string | null,
  refreshToken: string | null,
  expiresAt: Date | null
): Promise<google.auth.OAuth2 | null> {
  if (!accessToken || !refreshToken) {
    return null;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiresAt?.getTime(),
  });

  // Check if token is expired and refresh if necessary
  if (expiresAt && new Date() >= expiresAt) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token && credentials.expiry_date) {
        // Update tokens in database
        await prisma.user.update({
          where: { id: userId },
          data: {
            googleAccessToken: credentials.access_token,
            googleTokenExpiresAt: new Date(credentials.expiry_date),
          },
        });
        oauth2Client.setCredentials(credentials);
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return null;
    }
  }

  return oauth2Client;
}

/**
 * Gets a valid OAuth2 client by user ID, fetching tokens from database
 * Use this as the main entry point for getting an authenticated client
 */
async function getAuthenticatedOAuth2ClientForUser(userId: string): Promise<google.auth.OAuth2 | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }

  return getAuthenticatedOAuth2Client(userId, user.googleAccessToken, user.googleRefreshToken, user.googleTokenExpiresAt);
}

/**
 * Syncs an event to Google Calendar and returns the Google Event ID
 */
export async function syncEventToGoogle(event: Event, userId: string): Promise<string | null> {
  try {
    const oauth2Client = await getAuthenticatedOAuth2ClientForUser(userId);
    if (!oauth2Client) {
      console.log(`User ${userId} has not connected Google Calendar`);
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Parse dates from ISO strings
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    // Build the event object
    const googleEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description || undefined,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      recurrence: event.rrule ? [event.rrule] : undefined,
      extendedProperties: {
        private: {
          calendarEventId: event.id,
        },
      },
    };

    // Insert the event into Google Calendar
    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });

    console.log(`Event synced to Google Calendar: ${result.data.id}`);
    return result.data.id || null;
  } catch (error) {
    console.error('Error syncing event to Google Calendar:', error);
    return null;
  }
}

/**
 * Deletes an event from Google Calendar
 */
export async function deleteEventFromGoogle(googleEventId: string, userId: string): Promise<boolean> {
  try {
    const oauth2Client = await getAuthenticatedOAuth2ClientForUser(userId);
    if (!oauth2Client) {
      console.log(`User ${userId} has not connected Google Calendar`);
      return false;
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });

    console.log(`Event deleted from Google Calendar: ${googleEventId}`);
    return true;
  } catch (error) {
    console.error('Error deleting event from Google Calendar:', error);
    return false;
  }
}

/**
 * Revokes Google OAuth tokens for a user
 */
export async function revokeGoogleAccess(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.googleAccessToken) {
      return;
    }

    const oauth2Client = getOAuth2Client();
    // Note: Revoke token directly (the access token, not the refresh token)
    if (user.googleAccessToken) {
      await oauth2Client.revokeCredentials();
    }

    // Clear tokens from database
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiresAt: null,
      },
    });

    console.log(`Google Calendar access revoked for user ${userId}`);
  } catch (error) {
    console.error('Error revoking Google access:', error);
  }
}
