/**
 * Secure API Proxy Utility
 *
 * This module provides a secure way to make external API calls:
 * - Hides API keys from client-side code
 * - Validates and sanitizes all requests
 * - Adds request signing for verification
 * - Implements timeout and error handling
 * - Logs all external API calls for audit
 */

import crypto from 'crypto';
import { auditLog } from './audit';

// Allowed external services (whitelist)
const ALLOWED_SERVICES = {
  razorpay: {
    baseUrl: 'https://api.razorpay.com',
    authType: 'basic',
    timeout: 30000,
  },
  google_ai: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    authType: 'apikey',
    timeout: 120000,
  },
  google_storage: {
    baseUrl: 'https://storage.googleapis.com',
    authType: 'bearer',
    timeout: 60000,
  },
};

// Request signature for internal verification
const PROXY_SECRET = process.env.PROXY_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Generate a request signature for verification
 */
export function generateRequestSignature(payload, timestamp) {
  const data = `${timestamp}:${JSON.stringify(payload)}`;
  return crypto
    .createHmac('sha256', PROXY_SECRET)
    .update(data)
    .digest('hex');
}

/**
 * Verify a request signature
 */
export function verifyRequestSignature(payload, timestamp, signature) {
  // Check timestamp is within 5 minutes
  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false;
  }

  const expectedSignature = generateRequestSignature(payload, timestamp);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize request data to prevent injection
 */
function sanitizeRequestData(data) {
  if (typeof data === 'string') {
    // Remove potential script injections
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeRequestData);
  }
  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeRequestData(value);
    }
    return sanitized;
  }
  return data;
}

/**
 * Validate URL to prevent SSRF attacks
 */
function validateUrl(url, serviceName) {
  const service = ALLOWED_SERVICES[serviceName];
  if (!service) {
    throw new Error(`Service ${serviceName} is not allowed`);
  }

  const parsedUrl = new URL(url);
  const allowedBaseUrl = new URL(service.baseUrl);

  // Ensure the URL is for the allowed service
  if (parsedUrl.origin !== allowedBaseUrl.origin) {
    throw new Error(`URL ${url} is not allowed for service ${serviceName}`);
  }

  // Prevent localhost/internal network access
  const hostname = parsedUrl.hostname.toLowerCase();
  const forbiddenHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (forbiddenHosts.includes(hostname) || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    throw new Error('Internal network access is not allowed');
  }

  return true;
}

/**
 * Make a proxied API request
 */
export async function proxyRequest({
  service,
  endpoint,
  method = 'GET',
  body = null,
  headers = {},
  userId = null,
  ipAddress = null,
}) {
  const serviceConfig = ALLOWED_SERVICES[service];
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${service}`);
  }

  const url = `${serviceConfig.baseUrl}${endpoint}`;

  // Validate URL
  validateUrl(url, service);

  // Sanitize body if present
  const sanitizedBody = body ? sanitizeRequestData(body) : null;

  // Build request options
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Image-Studio/1.0',
      ...headers,
    },
    signal: AbortSignal.timeout(serviceConfig.timeout),
  };

  if (sanitizedBody && method !== 'GET') {
    requestOptions.body = JSON.stringify(sanitizedBody);
  }

  const startTime = Date.now();
  let responseStatus = null;
  let responseData = null;
  let error = null;

  try {
    const response = await fetch(url, requestOptions);
    responseStatus = response.status;

    // Parse response based on content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return {
      success: true,
      status: responseStatus,
      data: responseData,
    };
  } catch (err) {
    error = err.message;
    throw err;
  } finally {
    // Log the API call for audit
    const duration = Date.now() - startTime;
    await auditLog({
      userId,
      action: 'external_api_call',
      resourceType: 'api_proxy',
      ipAddress,
      status: error ? 'error' : 'success',
      metadata: {
        service,
        endpoint,
        method,
        responseStatus,
        duration,
        error,
      },
    }).catch(console.error); // Don't fail on audit log errors
  }
}

/**
 * Create authenticated headers for a service
 */
export function createServiceAuth(service, credentials) {
  const serviceConfig = ALLOWED_SERVICES[service];
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${service}`);
  }

  switch (serviceConfig.authType) {
    case 'basic':
      const basicAuth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');
      return { Authorization: `Basic ${basicAuth}` };

    case 'apikey':
      return { 'x-goog-api-key': credentials.apiKey };

    case 'bearer':
      return { Authorization: `Bearer ${credentials.token}` };

    default:
      return {};
  }
}

/**
 * Wrapper for making secure Razorpay API calls
 */
export async function razorpayProxy({ endpoint, method = 'GET', body = null, userId = null, ipAddress = null }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  const authHeaders = createServiceAuth('razorpay', { keyId, keySecret });

  return proxyRequest({
    service: 'razorpay',
    endpoint,
    method,
    body,
    headers: authHeaders,
    userId,
    ipAddress,
  });
}

/**
 * Wrapper for making secure Google AI API calls
 */
export async function googleAIProxy({ endpoint, method = 'POST', body = null, userId = null, ipAddress = null }) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const authHeaders = createServiceAuth('google_ai', { apiKey });

  return proxyRequest({
    service: 'google_ai',
    endpoint,
    method,
    body,
    headers: authHeaders,
    userId,
    ipAddress,
  });
}

export default {
  proxyRequest,
  razorpayProxy,
  googleAIProxy,
  generateRequestSignature,
  verifyRequestSignature,
};
