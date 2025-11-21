import { supabaseAdmin } from './supabase';

/**
 * Audit log actions
 */
export const AUDIT_ACTIONS = {
  // Authentication
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_SIGNUP: 'auth.signup',
  AUTH_FAILED_LOGIN: 'auth.failed_login',

  // Payments
  PAYMENT_ORDER_CREATED: 'payment.order_created',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_VERIFIED: 'payment.verified',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Credits
  CREDITS_PURCHASED: 'credits.purchased',
  CREDITS_USED: 'credits.used',
  CREDITS_REFUNDED: 'credits.refunded',
  CREDITS_ADDED: 'credits.added',

  // Images
  IMAGE_GENERATED: 'image.generated',
  IMAGE_DELETED: 'image.deleted',
  IMAGE_UPLOADED: 'image.uploaded',

  // Folders
  FOLDER_CREATED: 'folder.created',
  FOLDER_UPDATED: 'folder.updated',
  FOLDER_DELETED: 'folder.deleted',

  // Security
  SECURITY_INVALID_SIGNATURE: 'security.invalid_signature',
  SECURITY_RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  SECURITY_UNAUTHORIZED_ACCESS: 'security.unauthorized_access',
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
};

/**
 * Resource types
 */
export const RESOURCE_TYPES = {
  USER: 'user',
  PAYMENT: 'payment',
  CREDIT: 'credit',
  IMAGE: 'image',
  FOLDER: 'folder',
  SESSION: 'session',
};

/**
 * Log status
 */
export const LOG_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  ERROR: 'error',
};

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID (optional for some actions)
 * @param {string} params.action - Action performed (use AUDIT_ACTIONS)
 * @param {string} params.resourceType - Type of resource (use RESOURCE_TYPES)
 * @param {string} params.resourceId - ID of the resource (optional)
 * @param {string} params.ipAddress - IP address of the request
 * @param {string} params.userAgent - User agent string
 * @param {string} params.status - Status of the action (use LOG_STATUS)
 * @param {Object} params.metadata - Additional metadata (optional)
 */
export async function createAuditLog({
  userId = null,
  action,
  resourceType,
  resourceId = null,
  ipAddress = 'unknown',
  userAgent = 'unknown',
  status = LOG_STATUS.SUCCESS,
  metadata = {},
}) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return null;
    }

    // Validate required fields
    if (!action || !resourceType) {
      console.error('Action and resourceType are required for audit logs');
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        status,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating audit log:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(userId, action, status, metadata = {}, ipAddress, userAgent) {
  return createAuditLog({
    userId,
    action,
    resourceType: RESOURCE_TYPES.SESSION,
    status,
    metadata,
    ipAddress,
    userAgent,
  });
}

/**
 * Log payment event
 */
export async function logPaymentEvent(
  userId,
  action,
  paymentId,
  status,
  metadata = {},
  ipAddress,
  userAgent
) {
  return createAuditLog({
    userId,
    action,
    resourceType: RESOURCE_TYPES.PAYMENT,
    resourceId: paymentId,
    status,
    metadata,
    ipAddress,
    userAgent,
  });
}

/**
 * Log credit transaction event
 */
export async function logCreditEvent(
  userId,
  action,
  transactionId,
  status,
  metadata = {},
  ipAddress,
  userAgent
) {
  return createAuditLog({
    userId,
    action,
    resourceType: RESOURCE_TYPES.CREDIT,
    resourceId: transactionId,
    status,
    metadata,
    ipAddress,
    userAgent,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  userId,
  action,
  status,
  metadata = {},
  ipAddress,
  userAgent
) {
  return createAuditLog({
    userId,
    action,
    resourceType: 'security',
    status,
    metadata,
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of logs to retrieve
 */
export async function getUserAuditLogs(userId, limit = 50) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get recent security events
 * @param {number} limit - Number of logs to retrieve
 */
export async function getRecentSecurityEvents(limit = 100) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .or(`action.like.security.%,status.eq.${LOG_STATUS.FAILURE}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching security events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching security events:', error);
    return [];
  }
}

/**
 * Get payment events for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of logs to retrieve
 */
export async function getUserPaymentLogs(userId, limit = 50) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_type', RESOURCE_TYPES.PAYMENT)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching payment logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching payment logs:', error);
    return [];
  }
}
