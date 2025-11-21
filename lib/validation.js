import { z } from 'zod';
import { MIN_PURCHASE_USD, MAX_PURCHASE_USD } from './razorpay';

/**
 * Payment creation schema
 */
export const createPaymentSchema = z.object({
  amountUsd: z
    .number()
    .min(MIN_PURCHASE_USD, `Minimum purchase is $${MIN_PURCHASE_USD}`)
    .max(MAX_PURCHASE_USD, `Maximum purchase is $${MAX_PURCHASE_USD}`)
    .refine((val) => !isNaN(val), 'Amount must be a valid number')
    .refine((val) => Number.isFinite(val), 'Amount must be finite')
    .refine((val) => val > 0, 'Amount must be positive'),
});

/**
 * Payment verification schema
 */
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

/**
 * Image generation schema
 */
export const generateImageSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Prompt must be at least 3 characters')
    .max(2000, 'Prompt must be less than 2000 characters')
    .refine((val) => val.trim().length > 0, 'Prompt cannot be empty'),
  productImageUrl: z.string().url('Invalid product image URL'),
  modelImageUrl: z.string().url('Invalid model image URL').optional().nullable(),
  numVariations: z
    .number()
    .int('Number of variations must be an integer')
    .min(1, 'Minimum 1 variation')
    .max(10, 'Maximum 10 variations')
    .default(1)
    .optional(),
});

/**
 * Folder creation schema
 */
export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters')
    .refine((val) => val.trim().length > 0, 'Folder name cannot be empty')
    .refine(
      (val) => !/[<>:"/\\|?*]/.test(val),
      'Folder name contains invalid characters'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
});

/**
 * Update folder schema
 */
export const updateFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
});

/**
 * Credits addition schema (for admin/testing purposes)
 */
export const addCreditsSchema = z.object({
  amount: z
    .number()
    .int('Credits must be an integer')
    .min(1, 'Amount must be positive')
    .max(100000, 'Amount too large'),
  type: z.enum(['purchase', 'usage', 'refund', 'bonus']).default('bonus'),
  description: z.string().max(500).optional(),
});

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Sanitize string input to prevent XSS
 * Removes potentially dangerous HTML/script tags
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .trim();
}

/**
 * Sanitize all string fields in an object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize request data
 */
export function validateAndSanitize(schema, data) {
  try {
    // First sanitize
    const sanitized = sanitizeObject(data);

    // Then validate
    const validated = schema.parse(sanitized);

    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
        errors: error.errors,
      };
    }

    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

/**
 * Extract IP address from request headers
 */
export function getIpAddress(headers) {
  // Try various headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(headers) {
  return headers.get('user-agent') || 'unknown';
}
