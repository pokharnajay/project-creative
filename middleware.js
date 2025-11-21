export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/generate/:path*',
    '/api/generate/:path*',
    '/api/upload/:path*',
    '/api/images/:path*',
    '/api/folders/:path*',
    '/api/credits/:path*',
  ],
};
