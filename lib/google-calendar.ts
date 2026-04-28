import { calendar_v3, google } from 'googleapis';
import { prisma } from './prisma';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Creates an OAuth2 client configured with Google credentials
 */
function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth credentials are not configured in environment variables');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates the Google OAuth2 authorization URL
 */
export function getAuthorizationUrl(): string {
  const oauth2Client = createOAuth2Client();
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
    const oauth2Client = createOAuth2Client();
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
        googleTokenExpiry: new Date(tokens.expiry_date),
      },
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

/**
 * Gets a valid OAuth2 client for a user, refreshing tokens if necessary
 */
async function getValidOAuth2Client(userId: string): Promise<calendar_v3.Oauth2 | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
    return null;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime(),
  });

  // Check if token is expired and refresh if necessary
  if (user.googleTokenExpiry && new Date() >= user.googleTokenExpiry) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token && credentials.expiry_date) {
        // Update tokens in database
        await prisma.user.update({
          where: { id: userId },
          data: {
            googleAccessToken: credentials.access_token,
            googleTokenExpiry: new Date(credentials.expiry_date),
          },
        });
        oauth2Client.setCredentials(credentials);
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return null;
    }
  }

  return oauth2Client as unknown as calendar_v3.Oauth2;
}

/**
 * Syncs an event to Google Calendar
 */
export async function syncEventToGoogle(
  userId: string,
  eventId: string,
  title: string,
  description: string | null,
  startTime: Date,
  endTime: Date,
  rrule: string | null
): Promise<boolean> {
  try {
    const oauth2Client = await getValidOAuth2Client(userId);
    if (!oauth2Client) {
      console.log(`User ${userId} has not connected Google Calendar`);
      return false;
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build the event object
    const googleEvent: calendar_v3.Schema$Event = {
      summary: title,
      description: description || undefined,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      recurrence: rrule ? [rrule] : undefined,
      extendedProperties: {
        private: {
          calendarEventId: eventId,
        },
      },
    };

    // Insert the event into Google Calendar
    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });

    console.log(`Event synced to Google Calendar: ${result.data.id}`);
    return true;
  } catch (error) {
    console.error('Error syncing event to Google Calendar:', error);
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

    const oauth2Client = createOAuth2Client();
    await oauth2Client.revokeCredentials();

    // Clear tokens from database
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
      },
    });

    console.log(`Google Calendar access revoked for user ${userId}`);
  } catch (error) {
    console.error('Error revoking Google access:', error);
  }
}
