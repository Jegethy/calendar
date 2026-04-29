import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  createdResponse,
  unauthorizedError,
  validationError,
  internalServerError,
} from '@/lib/api-response';
import { asyncBroadcastSyncToGoogle, shouldSyncToGoogle } from '@/lib/sync-utils';
import { isValidDateString, isValidTimeString, isValidTimeRange } from '@/lib/date-utils';
import { isValidRrule } from '@/lib/rrule-utils';
import { Event } from '@/types';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedError();
  }

  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return successResponse<{ events: Event[] }>({ events: events as Event[] });
  } catch (error) {
    console.error('Fetch events error:', error);
    return internalServerError();
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedError();
  }

  try {
    const body = await request.json();
    const { title, description, startTime, endTime, rrule, syncToGoogle } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return validationError('Title is required and must be a non-empty string');
    }

    // Parse dates/times if provided in that format, otherwise assume ISO strings
    let finalStartTime = startTime;
    let finalEndTime = endTime;

    // Validate date/time format and range
    if (!finalStartTime || !finalEndTime) {
      return validationError('startTime and endTime are required');
    }

    // Basic ISO string validation
    if (typeof finalStartTime !== 'string' || typeof finalEndTime !== 'string') {
      return validationError('startTime and endTime must be ISO 8601 strings');
    }

    try {
      // Verify they parse as valid dates
      const start = new Date(finalStartTime);
      const end = new Date(finalEndTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return validationError('Invalid date format for startTime or endTime');
      }

      if (start >= end) {
        return validationError('startTime must be before endTime');
      }
    } catch {
      return validationError('Invalid date format for startTime or endTime');
    }

    // Validate recurrence rule if provided
    if (rrule && !isValidRrule(rrule)) {
      return validationError('Invalid recurrence rule format');
    }

    // Get user's Google connection status
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { googleAccessToken: true },
    });
    const isGoogleConnected = !!currentUser?.googleAccessToken;

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description || null,
        startTime: finalStartTime,
        endTime: finalEndTime,
        rrule: rrule || null,
        syncToGoogle: syncToGoogle && isGoogleConnected,
        creatorId: user.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      include: {
        creator: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    // Broadcast sync to all connected users' Google Calendars if enabled (non-blocking)
    if (shouldSyncToGoogle(event as Event)) {
      asyncBroadcastSyncToGoogle(event as Event, user.userId);
    }

    return createdResponse<{ event: Event }>({ event: event as Event });
  } catch (error) {
    console.error('Create event error:', error);
    return internalServerError();
  }
}

