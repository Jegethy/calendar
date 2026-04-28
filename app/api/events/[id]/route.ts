import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { title, description, startTime, endTime, rrule } = body;
    const { id } = await params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existing.creatorId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        rrule: rrule !== undefined ? rrule : undefined,
      },
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

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
