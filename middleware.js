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
 * API routes that need origin validation
 */
const apiRoutes = ['/api/'];

/**
 * Public routes that should redirect to dashboard if authenticated
 */
const publicRoutes = ['/auth/signin', '/auth/signup'];

/**
 * Validate request origin for API routes
 */
function validateOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');

  // Get allowed origins
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${host}`;
  const allowedOrigins = [
    appUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  // For preflight requests, always check origin
  if (request.method === 'OPTIONS') {
    return origin ? allowedOrigins.some(allowed => {
      try {
        return new URL(allowed).origin === origin;
      } catch {
        return false;
      }
    }) : true;
  }

  // For same-origin requests (no origin header), check referer
  if (!origin) {
    if (!referer) return true; // Allow requests without origin/referer (e.g., direct API calls)
    try {
      const refererOrigin = new URL(referer).origin;
      return allowedOrigins.some(allowed => {
        try {
          return new URL(allowed).origin === refererOrigin;
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  }

  // Validate origin
  return allowedOrigins.some(allowed => {
    try {
      return new URL(allowed).origin === origin;
    } catch {
      return false;
    }
  });
}

/**
 * Middleware to handle authentication and security
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Update session and get user
  const { user, response } = await updateSession(request);

  // Check if route is an API route
  const isApiRoute = apiRoutes.some((route) => pathname.startsWith(route));

  // Validate origin for API routes (prevent CSRF)
  if (isApiRoute && !validateOrigin(request)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
  }

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
