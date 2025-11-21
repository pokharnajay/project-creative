import { updateSession } from './lib/supabase-middleware';
import { NextResponse } from 'next/server';

/**
 * Protected routes that require authentication
 */
const protectedRoutes = [
  '/dashboard',
  '/generate',
  '/buy-credits',
  '/api/generate',
  '/api/upload',
  '/api/images',
  '/api/folders',
  '/api/credits',
  '/api/payments',
];

/**
 * Public routes that should redirect to dashboard if authenticated
 */
const publicRoutes = ['/auth/signin', '/auth/signup'];

/**
 * Middleware to handle authentication and security
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Update session and get user
  const { user, response } = await updateSession(request);

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is public auth route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If protected route and no user, redirect to signin
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If public auth route and user is authenticated, redirect to dashboard
  if (isPublicRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add security headers to all responses
  const secureResponse = NextResponse.next(response);

  // Security headers
  secureResponse.headers.set(
    'X-Content-Type-Options',
    'nosniff'
  );
  secureResponse.headers.set(
    'X-Frame-Options',
    'DENY'
  );
  secureResponse.headers.set(
    'X-XSS-Protection',
    '1; mode=block'
  );
  secureResponse.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  secureResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Add HSTS header in production
  if (process.env.NODE_ENV === 'production') {
    secureResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // Add request ID for tracking
  const requestId = crypto.randomUUID();
  secureResponse.headers.set('X-Request-ID', requestId);

  return secureResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
