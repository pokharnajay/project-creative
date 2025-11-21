/**
 * Simple in-memory rate limiter
 * In production, consider using Redis for distributed rate limiting
 */

const rateLimitMap = new Map();

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    max: 5, // 5 attempts
    window: 15 * 60 * 1000, // 15 minutes
  },

  // Payment endpoints - very strict
  PAYMENT_CREATE: {
    max: 10, // 10 order creations
    window: 60 * 60 * 1000, // 1 hour
  },
  PAYMENT_VERIFY: {
    max: 20, // 20 verification attempts
    window: 60 * 60 * 1000, // 1 hour
  },

  // API endpoints - moderate limits
  API_GENERAL: {
    max: 100, // 100 requests
    window: 15 * 60 * 1000, // 15 minutes
  },

  // Image generation - resource intensive
  IMAGE_GENERATION: {
    max: 20, // 20 generations
    window: 60 * 60 * 1000, // 1 hour
  },

  // File uploads
  FILE_UPLOAD: {
    max: 50, // 50 uploads
    window: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Check if a request should be rate limited
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {Object} limit - Rate limit configuration
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(identifier, limit = RATE_LIMITS.API_GENERAL) {
  const now = Date.now();
  const key = identifier;

  // Get or create rate limit entry
  let limitEntry = rateLimitMap.get(key);

  // Clean up expired entries periodically (every 1000 checks)
  if (Math.random() < 0.001) {
    cleanupExpiredEntries();
  }

  // If no entry or entry expired, create new one
  if (!limitEntry || now > limitEntry.resetAt) {
    limitEntry = {
      count: 0,
      resetAt: now + limit.window,
    };
    rateLimitMap.set(key, limitEntry);
  }

  // Increment count
  limitEntry.count++;

  // Check if limit exceeded
  const allowed = limitEntry.count <= limit.max;
  const remaining = Math.max(0, limit.max - limitEntry.count);

  return {
    allowed,
    remaining,
    resetAt: limitEntry.resetAt,
    limit: limit.max,
  };
}

/**
 * Rate limit middleware for API routes
 * @param {string} identifier - Unique identifier
 * @param {Object} limit - Rate limit configuration
 * @returns {Object|null} Error response or null if allowed
 */
export function rateLimit(identifier, limit = RATE_LIMITS.API_GENERAL) {
  const result = checkRateLimit(identifier, limit);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

    return {
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: new Date(result.resetAt).toISOString(),
    };
  }

  return null;
}

/**
 * Get rate limit headers for response
 * @param {Object} result - Rate limit check result
 * @returns {Object} Headers object
 */
export function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  const keysToDelete = [];

  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt + 60000) {
      // Add 1 minute buffer
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => rateLimitMap.delete(key));
}

/**
 * Reset rate limit for an identifier (for testing or admin purposes)
 * @param {string} identifier - Unique identifier
 */
export function resetRateLimit(identifier) {
  rateLimitMap.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 * @param {string} identifier - Unique identifier
 * @param {Object} limit - Rate limit configuration
 * @returns {Object} Current status
 */
export function getRateLimitStatus(identifier, limit = RATE_LIMITS.API_GENERAL) {
  const now = Date.now();
  const key = identifier;

  const limitEntry = rateLimitMap.get(key);

  if (!limitEntry || now > limitEntry.resetAt) {
    return {
      count: 0,
      remaining: limit.max,
      resetAt: now + limit.window,
      limit: limit.max,
    };
  }

  return {
    count: limitEntry.count,
    remaining: Math.max(0, limit.max - limitEntry.count),
    resetAt: limitEntry.resetAt,
    limit: limit.max,
  };
}

/**
 * Create a rate limit key from request info
 * @param {string} userId - User ID (if authenticated)
 * @param {string} ipAddress - IP address
 * @param {string} endpoint - API endpoint
 * @returns {string} Rate limit key
 */
export function createRateLimitKey(userId, ipAddress, endpoint) {
  // Prefer user ID for authenticated requests, fall back to IP
  const identifier = userId || ipAddress;
  return `${endpoint}:${identifier}`;
}

/**
 * Higher-order function to apply rate limiting to API handlers
 * @param {Function} handler - API route handler
 * @param {Object} limit - Rate limit configuration
 * @returns {Function} Wrapped handler with rate limiting
 */
export function withRateLimit(handler, limit = RATE_LIMITS.API_GENERAL) {
  return async (request, context) => {
    // Extract identifier (IP address, user ID, etc.)
    const identifier =
      request.headers.get('x-user-id') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check rate limit
    const rateLimitError = rateLimit(identifier, limit);

    if (rateLimitError) {
      return new Response(JSON.stringify(rateLimitError), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitError.retryAfter.toString(),
        },
      });
    }

    // Call the original handler
    return handler(request, context);
  };
}

/**
 * Get rate limit stats (for monitoring/debugging)
 */
export function getRateLimitStats() {
  return {
    totalKeys: rateLimitMap.size,
    entries: Array.from(rateLimitMap.entries()).map(([key, entry]) => ({
      key,
      count: entry.count,
      resetAt: new Date(entry.resetAt).toISOString(),
    })),
  };
}
