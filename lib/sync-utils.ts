/**
 * Event Sync Utilities - Centralized logic for syncing events to Google Calendar
 * Now broadcasts to all connected users for true shared calendar experience
 */

import { broadcastSyncEventToGoogle, broadcastDeleteEventFromGoogle, broadcastUpdateEventOnGoogle } from './broadcast-sync';
import { Event } from '@/types';

/**
 * Async broadcast sync an event to all connected users' Google Calendars (non-blocking)
 * This fires after the API response is sent
 * 
 * @param event - The event to sync
 * @param triggeringUserId - The user who triggered the sync
 * @returns Promise that resolves when all syncs complete (or fail silently)
 */
export async function asyncBroadcastSyncToGoogle(event: Event, triggeringUserId: string): Promise<void> {
  // Fire and forget - don't wait for completion
  broadcastSyncEventToGoogle(event, triggeringUserId).catch((error) => {
    // Log but don't throw - sync failures shouldn't break the API response
    console.error(`[Broadcast Sync Error] Failed to sync event ${event.id}:`, error);
  });
}

/**
 * Async broadcast delete event from all connected users' Google Calendars (non-blocking)
 * 
 * @param eventId - The event ID to delete
 * @returns Promise that resolves when all deletions complete (or fail silently)
 */
export async function asyncBroadcastDeleteFromGoogle(eventId: string): Promise<void> {
  // Fire and forget - don't wait for completion
  broadcastDeleteEventFromGoogle(eventId).catch((error) => {
    // Log but don't throw - deletion failures shouldn't break the API response
    console.error(`[Broadcast Sync Error] Failed to delete event ${eventId}:`, error);
  });
}

/**
 * Async broadcast update event across all connected users' Google Calendars (non-blocking)
 * 
 * @param event - The updated event
 * @param eventId - The original event ID
 * @returns Promise that resolves when all updates complete (or fail silently)
 */
export async function asyncBroadcastUpdateOnGoogle(event: Event, eventId: string): Promise<void> {
  // Fire and forget - don't wait for completion
  broadcastUpdateEventOnGoogle(event, eventId).catch((error) => {
    // Log but don't throw - update failures shouldn't break the API response
    console.error(`[Broadcast Sync Error] Failed to update event ${eventId}:`, error);
  });
}

/**
 * Determine if an event should be synced to Google based on user preference
 * 
 * @param event - The event
 * @returns true if event should be synced
 */
export function shouldSyncToGoogle(event: Event): boolean {
  return event.syncToGoogle;
}
