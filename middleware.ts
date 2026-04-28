import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    // If JWT_SECRET is not set, block all protected routes
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
  const secret = new TextEncoder().encode(jwtSecret);

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLoginPage) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL('/', request.url));
    } catch {
      // Invalid token, allow login page
    }
  }

  if (token && !isLoginPage) {
    try {
      await jwtVerify(token, secret);
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
