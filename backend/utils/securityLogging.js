/**
 * Structured Security Event Logging
 * Centralized security event logging with sensitive data protection
 */

/**
 * Security event types for structured logging
 */
export const SECURITY_EVENTS = {
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  TOKEN_REVOKED: 'token_revoked',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  SECURITY_HEADER_VIOLATION: 'security_header_violation',
  INVALID_TOKEN: 'invalid_token',
  TOKEN_BLACKLISTED: 'token_blacklisted',
  ADMIN_ACTION: 'admin_action',
};

/**
 * Security event severity levels
 */
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Redact sensitive information from data
 * @param {any} data - Data to redact
 * @returns {any} Redacted data
 */
const redactSensitiveData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = [
    'password', 'token', 'refreshToken', 'accessToken', 'secret',
    'clientSecret', 'authorization', 'cookie', 'session'
  ];

  const redacted = { ...data };

  for (const field of sensitiveFields) {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]';
    }
  }

  // Redact email partially (keep domain visible)
  if (redacted.email) {
    const emailParts = redacted.email.split('@');
    if (emailParts.length === 2) {
      redacted.email = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`;
    }
  }

  // Redact user ID (keep as generic identifier)
  if (redacted.userId || redacted.id) {
    redacted.userId = '[USER_ID_REDACTED]';
    redacted.id = '[ID_REDACTED]';
  }

  return redacted;
};

/**
 * Log security events with structured format
 * @param {string} event - Event type from SECURITY_EVENTS
 * @param {string} severity - Severity level from SEVERITY_LEVELS  
 * @param {string} message - Human readable message
 * @param {object} metadata - Additional event metadata
 * @param {object} req - Express request object (optional)
 */
export const logSecurityEvent = (event, severity, message, metadata = {}, req = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    severity,
    message,
    metadata: redactSensitiveData(metadata),
    request: req ? {
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      origin: req.get('Origin'),
    } : null,
    environment: process.env.NODE_ENV,
  };

  // Color coding for console output
  const colors = {
    [SEVERITY_LEVELS.LOW]: '\x1b[36m',      // Cyan
    [SEVERITY_LEVELS.MEDIUM]: '\x1b[33m',   // Yellow
    [SEVERITY_LEVELS.HIGH]: '\x1b[31m',     // Red
    [SEVERITY_LEVELS.CRITICAL]: '\x1b[35m', // Magenta
  };

  const resetColor = '\x1b[0m';
  const severityColor = colors[severity] || '';

  // Log to console with formatting
  console.log(`${severityColor}🔒 [SECURITY] ${severity.toUpperCase()}${resetColor} - ${message}`);
  
  // In production, you would send this to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to security monitoring service
    // await sendToSecurityService(logEntry);
    
    // For now, log structured data to console
    if (severity === SEVERITY_LEVELS.HIGH || severity === SEVERITY_LEVELS.CRITICAL) {
      console.error('🚨 CRITICAL SECURITY EVENT:', JSON.stringify(logEntry, null, 2));
    }
  } else {
    // Development: Show full structured log
    console.log('📊 Security Event Details:', JSON.stringify(logEntry, null, 2));
  }
};

/**
 * Convenience functions for common security events
 */
export const logAuthSuccess = (userId, metadata = {}, req = null) => {
  logSecurityEvent(
    SECURITY_EVENTS.AUTH_SUCCESS,
    SEVERITY_LEVELS.LOW,
    'User authentication successful',
    { userId, ...metadata },
    req
  );
};

export const logAuthFailure = (reason, metadata = {}, req = null) => {
  logSecurityEvent(
    SECURITY_EVENTS.AUTH_FAILURE,
    SEVERITY_LEVELS.MEDIUM,
    `Authentication failed: ${reason}`,
    { reason, ...metadata },
    req
  );
};

export const logTokenRevoked = (tokenType, reason, metadata = {}, req = null) => {
  logSecurityEvent(
    SECURITY_EVENTS.TOKEN_REVOKED,
    SEVERITY_LEVELS.MEDIUM,
    `Token revoked: ${tokenType}`,
    { tokenType, reason, ...metadata },
    req
  );
};

export const logAccountLocked = (failedAttempts, metadata = {}, req = null) => {
  logSecurityEvent(
    SECURITY_EVENTS.ACCOUNT_LOCKED,
    SEVERITY_LEVELS.HIGH,
    `Account locked due to ${failedAttempts} failed attempts`,
    { failedAttempts, ...metadata },
    req
  );
};

export const logSuspiciousActivity = (activity, metadata = {}, req = null) => {
  logSecurityEvent(
    SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
    SEVERITY_LEVELS.HIGH,
    `Suspicious activity detected: ${activity}`,
    { activity, ...metadata },
    req
  );
};

export const logRateLimitExceeded = (endpoint, metadata = {}, req = null) => {
  logSecurityEvent(
    SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
    SEVERITY_LEVELS.MEDIUM,
    `Rate limit exceeded for ${endpoint}`,
    { endpoint, ...metadata },
    req
  );
};

/**
 * Initialize security logging
 */
export const initializeSecurityLogging = () => {
  console.log('🔒 Security logging initialized');
  
  // Log startup security configuration
  logSecurityEvent(
    'system_startup',
    SEVERITY_LEVELS.LOW,
    'Security logging system started',
    {
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    }
  );
};