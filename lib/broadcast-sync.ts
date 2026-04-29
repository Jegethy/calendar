/**
 * Broadcast Sync Utilities - Sync events to Google Calendar for all connected users
 * This enables true shared calendar experience where events sync to each user's Google Calendar
 */

import { Event, GoogleSync } from '@/types';
import { prisma } from './prisma';
import { syncEventToGoogle, deleteEventFromGoogle } from './google-calendar';

/**
 * Get all users with Google Calendar connected
 */
async function getAllConnectedUsers(): Promise<{ id: string; googleRefreshToken: string }[]> {
  const users = await prisma.user.findMany({
    where: {
      googleRefreshToken: {
        not: null,
      },
    },
    select: {
      id: true,
      googleRefreshToken: true,
    },
  });

  return users.filter((u) => u.googleRefreshToken) as { id: string; googleRefreshToken: string }[];
}

/**
 * Sync an event to all connected users' Google Calendars (non-blocking)
 * Creates GoogleSync entries to track which Google Event ID belongs to which user
 */
export async function broadcastSyncEventToGoogle(event: Event, triggeringUserId: string): Promise<void> {
  // Fire and forget - don't wait for completion
  (async () => {
    try {
      const connectedUsers = await getAllConnectedUsers();

      // Only sync to users who have enabled sync for themselves (we don't know their preference)
      // So we sync to all connected users, and they can turn it off individually
      const syncPromises = connectedUsers.map(async (user) => {
        try {
          const googleEventId = await syncEventToGoogle(event, user.id);

          if (googleEventId) {
            // Record the sync relationship
            await prisma.googleSync.upsert({
              where: {
                eventId_userId: {
                  eventId: event.id,
                  userId: user.id,
                },
              },
              update: {
                googleEventId,
                updatedAt: new Date(),
              },
              create: {
                eventId: event.id,
                userId: user.id,
                googleEventId,
              },
            });

            console.log(`Event ${event.id} synced to Google Calendar for user ${user.id}: ${googleEventId}`);
          }
        } catch (error) {
          console.error(`Failed to sync event ${event.id} to Google for user ${user.id}:`, error);
        }
      });

      // Wait for all syncs to complete
      await Promise.all(syncPromises);
    } catch (error) {
      console.error(`Broadcast sync failed for event ${event.id}:`, error);
    }
  })();
}

/**
 * Delete an event from all users' Google Calendars (non-blocking)
 */
export async function broadcastDeleteEventFromGoogle(eventId: string): Promise<void> {
  // Fire and forget - don't wait for completion
  (async () => {
    try {
      // Get all GoogleSync entries for this event
      const syncs = await prisma.googleSync.findMany({
        where: { eventId },
        include: {
          user: {
            select: { id: true },
          },
        },
      });

      const deletePromises = syncs.map(async (sync) => {
        try {
          await deleteEventFromGoogle(sync.googleEventId, sync.userId);

          // Remove the sync record
          await prisma.googleSync.deleteMany({
            where: { id: sync.id },
          });

          console.log(`Event ${eventId} deleted from Google Calendar for user ${sync.userId}`);
        } catch (error) {
          console.error(
            `Failed to delete event ${eventId} from Google for user ${sync.userId}:`,
            error
          );
        }
      });

      // Wait for all deletions to complete
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Broadcast delete failed for event ${eventId}:`, error);
    }
  })();
}

/**
 * Update an event across all users' Google Calendars (non-blocking)
 * Deletes old event and creates new one (Google Calendar API limitation)
 */
export async function broadcastUpdateEventOnGoogle(event: Event, eventId: string): Promise<void> {
  // Fire and forget
  (async () => {
    try {
      // First, delete the old event from all users
      await broadcastDeleteEventFromGoogle(eventId);

      // Then sync the new version to all users
      await broadcastSyncEventToGoogle(event, event.creatorId);
    } catch (error) {
      console.error(`Broadcast update failed for event ${eventId}:`, error);
    }
  })();
}

/**
 * Check if an event is synced to Google for a specific user
 */
export async function isEventSyncedToGoogle(eventId: string, userId: string): Promise<boolean> {
  const sync = await prisma.googleSync.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  return !!sync;
}

/**
 * Get Google Event ID for a specific event and user
 */
export async function getGoogleEventId(eventId: string, userId: string): Promise<string | null> {
  const sync = await prisma.googleSync.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    select: {
      googleEventId: true,
    },
  });

  return sync?.googleEventId || null;
}
