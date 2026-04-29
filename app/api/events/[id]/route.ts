import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncEventToGoogle, deleteEventFromGoogle } from '@/lib/google-calendar';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, startTime, endTime, rrule, syncToGoogle } = body;
    const { id } = await params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existing.creatorId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      title,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      rrule: rrule !== undefined ? rrule : undefined,
    };

    // Handle sync preference changes
    if (syncToGoogle !== undefined) {
      updateData.syncToGoogle = !!syncToGoogle;

      // If toggling on and not already synced, sync now
      if (syncToGoogle && !existing.googleEventId) {
        // Get the actual event data with title and times for syncing
        const startTimeDate = startTime ? new Date(startTime) : existing.startTime;
        const endTimeDate = endTime ? new Date(endTime) : existing.endTime;
        const eventTitle = title || existing.title;
        const eventDescription = description !== undefined ? description : existing.description;
        const eventRrule = rrule !== undefined ? rrule : existing.rrule;

        // Sync to Google asynchronously
        syncEventToGoogle(
          user.userId,
          id,
          eventTitle,
          eventDescription,
          startTimeDate,
          endTimeDate,
          eventRrule
        ).then((googleEventId) => {
          if (googleEventId) {
            prisma.event.update({
              where: { id },
              data: { googleEventId },
            }).catch(error => {
              console.error('Failed to update event with Google Event ID:', error);
            });
          }
        }).catch(error => {
          console.error('Failed to sync event to Google Calendar:', error);
        });
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

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (existing.creatorId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete from Google Calendar if synced (non-blocking)
  if (existing.googleEventId) {
    deleteEventFromGoogle(user.userId, existing.googleEventId)
      .then((success) => {
        if (!success) {
          console.warn(
            `Failed to delete Google Calendar event ${existing.googleEventId}. ` +
            `User may need to delete it manually from Google Calendar.`
          );
        }
      })
      .catch((error) => {
        console.error('Error during Google Calendar deletion:', error);
      });
  }

  // Always delete from local database (non-blocking Google deletion)
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
