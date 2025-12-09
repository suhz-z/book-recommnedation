// middleware.ts (root of Next.js app, same level as app/ directory)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Must be named 'middleware' or be default export
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const authToken = request.cookies.get('access_token');
    
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

// Config is required
export const config = {
  matcher: '/dashboard/:path*',
};
