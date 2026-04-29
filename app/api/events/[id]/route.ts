import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  asyncBroadcastSyncToGoogle,
  asyncBroadcastDeleteFromGoogle,
  asyncBroadcastUpdateOnGoogle,
  shouldSyncToGoogle,
} from '@/lib/sync-utils';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  validationError,
  internalServerError,
  noContentResponse,
} from '@/lib/api-response';
import { isValidRrule } from '@/lib/rrule-utils';
import { Event } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedError();
  }

  try {
    const body = await request.json();
    const { title, description, startTime, endTime, rrule, syncToGoogle } = body;
    const { id } = await params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return notFoundError('Event not found');
    }

    if (existing.creatorId !== user.userId) {
      return forbiddenError();
    }

    // Validate provided fields
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return validationError('Title must be a non-empty string');
    }

    if (startTime !== undefined && typeof startTime !== 'string') {
      return validationError('startTime must be an ISO 8601 string');
    }

    if (endTime !== undefined && typeof endTime !== 'string') {
      return validationError('endTime must be an ISO 8601 string');
    }

    if (rrule !== undefined && !isValidRrule(rrule)) {
      return validationError('Invalid recurrence rule format');
    }

    // Validate date range if both times are provided
    if (startTime && endTime) {
      try {
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return validationError('Invalid date format for startTime or endTime');
        }
        if (start >= end) {
          return validationError('startTime must be before endTime');
        }
      } catch {
        return validationError('Invalid date format for startTime or endTime');
      }
    }

    // Build update data with only provided fields
    const updateData: Partial<typeof existing> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (rrule !== undefined) updateData.rrule = rrule;

    // Handle sync preference changes
    if (syncToGoogle !== undefined) {
      updateData.syncToGoogle = !!syncToGoogle;

      // If toggling on, sync to all users' Google Calendars
      if (syncToGoogle) {
        // Prepare event object for syncing with updated values
        const eventToSync: Event = {
          id: existing.id,
          title: title || existing.title,
          description: description !== undefined ? description : existing.description,
          startTime: startTime || existing.startTime,
          endTime: endTime || existing.endTime,
          rrule: rrule !== undefined ? rrule : existing.rrule,
          syncToGoogle: true,
          creatorId: existing.creatorId,
          creator: { id: user.userId, name: '', color: '' }, // Minimal, not used by sync
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        };

        // Broadcast sync to Google asynchronously
        asyncBroadcastSyncToGoogle(eventToSync, user.userId);
      }
    } else if (shouldSyncToGoogle(existing as Event)) {
      // If event details changed but sync preference unchanged, update on Google
      if (title !== undefined || startTime !== undefined || endTime !== undefined || rrule !== undefined) {
        const eventToSync: Event = {
          id: existing.id,
          title: title || existing.title,
          description: description !== undefined ? description : existing.description,
          startTime: startTime || existing.startTime,
          endTime: endTime || existing.endTime,
          rrule: rrule !== undefined ? rrule : existing.rrule,
          syncToGoogle: true,
          creatorId: existing.creatorId,
          creator: { id: user.userId, name: '', color: '' },
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        };

        // Broadcast update to Google asynchronously
        asyncBroadcastUpdateOnGoogle(eventToSync, existing.id);
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return successResponse<{ event: Event }>({ event: event as Event });
  } catch (error) {
    console.error('Update event error:', error);
    return internalServerError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedError();
  }

  try {
    const { id } = await params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return notFoundError('Event not found');
    }

    if (existing.creatorId !== user.userId) {
      return forbiddenError();
    }

    // Delete from Google Calendar for all users (non-blocking)
    if (existing.syncToGoogle) {
      asyncBroadcastDeleteFromGoogle(id);
    }

    // Delete from local database
    await prisma.event.delete({ where: { id } });

    return noContentResponse();
  } catch (error) {
    console.error('Delete event error:', error);
    return internalServerError();
  }
}
