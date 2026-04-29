import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/google-calendar';

export async function GET() {
  try {
    // Get the authorization URL
    const authUrl = getAuthorizationUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 });
  }
}
