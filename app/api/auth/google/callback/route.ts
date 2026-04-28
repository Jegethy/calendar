import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { exchangeCodeForTokens } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { error: `Google OAuth error: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code not provided' },
        { status: 400 }
      );
    }

    // Exchange the authorization code for tokens
    await exchangeCodeForTokens(code, user.userId);

    // Redirect back to the app with a success message
    const redirectUrl = new URL('/', request.nextUrl.origin);
    redirectUrl.searchParams.set('googleSyncStatus', 'connected');
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorUrl = new URL('/', request.nextUrl.origin);
    errorUrl.searchParams.set('googleSyncStatus', 'error');
    return NextResponse.redirect(errorUrl);
  }
}
