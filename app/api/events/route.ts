import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncEventToGoogle } from '@/lib/google-calendar';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    include: {
      creator: {
        select: { id: true, name: true, color: true },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, startTime, endTime, rrule, syncToGoogle } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Title, startTime, and endTime are required' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        rrule: rrule || null,
        syncToGoogle: !!syncToGoogle,
        creatorId: user.userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    // Sync to Google Calendar if enabled (non-blocking)
    if (syncToGoogle) {
      syncEventToGoogle(
        user.userId,
        event.id,
        event.title,
        event.description,
        event.startTime,
        event.endTime,
        event.rrule
      ).then((googleEventId) => {
        if (googleEventId) {
          // Update event with the Google Event ID
          prisma.event.update({
            where: { id: event.id },
            data: { googleEventId },
          }).catch(error => {
            console.error('Failed to update event with Google Event ID:', error);
          });
        }
      }).catch(error => {
        console.error('Failed to sync event to Google Calendar:', error);
      });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

