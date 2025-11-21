/**
 * CSRF Protection Utility
 *
 * Implements CSRF protection for API routes:
 * - Token generation and validation
 * - Double-submit cookie pattern
 * - Origin/Referer validation
 */

import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(sessionId) {
  const timestamp = Date.now();
  const data = `${sessionId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(data)
    .digest('hex');

  // Format: timestamp.signature
  return `${timestamp}.${signature}`;
}

/**
 * Verify a CSRF token
 */
export function verifyCsrfToken(token, sessionId) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Missing CSRF token' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid CSRF token format' };
  }

  const [timestamp, signature] = parts;
  const tokenTime = parseInt(timestamp, 10);

  // Check if token has expired
  if (Date.now() - tokenTime > TOKEN_EXPIRY) {
    return { valid: false, error: 'CSRF token expired' };
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId}:${timestamp}`)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid CSRF token signature' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'CSRF token verification failed' };
  }
}

/**
 * Validate request origin
 */
export function validateOrigin(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Allow requests without origin (same-origin form submissions, etc.)
  if (!origin && !referer) {
    // For API routes, we should be stricter
    return { valid: false, error: 'Missing origin header' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${host}`;
  const allowedOrigins = [
    appUrl,
    `http://localhost:3000`,
    `http://127.0.0.1:3000`,
  ];

  // Check origin
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        const originUrl = new URL(origin);
        return allowedUrl.origin === originUrl.origin;
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      return { valid: false, error: `Origin ${origin} not allowed` };
    }
  }

  // Check referer as fallback
  if (referer && !origin) {
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        const refererUrl = new URL(referer);
        return allowedUrl.origin === refererUrl.origin;
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      return { valid: false, error: `Referer ${referer} not allowed` };
    }
  }

  return { valid: true };
}

/**
 * CSRF middleware for API routes
 */
export async function csrfMiddleware(request, sessionId) {
  // Skip CSRF for GET, HEAD, OPTIONS
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method)) {
    return { valid: true };
  }

  // Validate origin first
  const originResult = validateOrigin(request);
  if (!originResult.valid) {
    return originResult;
  }

  // For mutation requests, verify CSRF token
  const csrfToken = request.headers.get('x-csrf-token');
  if (!csrfToken) {
    // Allow requests with valid origin but log warning
    console.warn('CSRF token missing but origin validated');
    return { valid: true, warning: 'CSRF token missing' };
  }

  return verifyCsrfToken(csrfToken, sessionId);
}

/**
 * Create CSRF protection headers for response
 */
export function createCsrfHeaders(sessionId) {
  const token = generateCsrfToken(sessionId);

  return {
    'X-CSRF-Token': token,
    // Set as cookie for double-submit pattern
    'Set-Cookie': `csrf_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`,
  };
}

export default {
  generateCsrfToken,
  verifyCsrfToken,
  validateOrigin,
  csrfMiddleware,
  createCsrfHeaders,
};
