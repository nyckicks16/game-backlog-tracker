/**
 * Environment Variable Security Validation
 * Validates critical environment variables at startup for security compliance
 */

/**
 * Security requirements for environment variables
 */
const SECURITY_REQUIREMENTS = {
  JWT_SECRET: {
    minLength: 64,
    description: 'JWT signing secret must be at least 64 characters for security',
  },
  SESSION_SECRET: {
    minLength: 64,
    description: 'Session secret must be at least 64 characters for security',
  },
  GOOGLE_CLIENT_SECRET: {
    minLength: 24,
    description: 'Google OAuth client secret appears to be invalid',
  },
};

/**
 * Required environment variables for production
 */
const REQUIRED_PRODUCTION_VARS = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'DATABASE_URL',
  'FRONTEND_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

/**
 * Validate environment variable security requirements
 * @throws {Error} If validation fails
 */
export const validateEnvironmentSecurity = () => {
  const errors = [];
  const warnings = [];

  // Check required variables exist
  for (const varName of REQUIRED_PRODUCTION_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      if (process.env.NODE_ENV === 'production') {
        errors.push(`Missing required environment variable: ${varName}`);
      } else {
        warnings.push(`Missing environment variable: ${varName} (required for production)`);
      }
      continue;
    }

    // Check security requirements
    const requirement = SECURITY_REQUIREMENTS[varName];
    if (requirement && value.length < requirement.minLength) {
      errors.push(`${varName}: ${requirement.description} (current: ${value.length} chars)`);
    }
  }

  // Check for insecure default values
  const insecureDefaults = {
    JWT_SECRET: ['your-super-secret-jwt-key-here', 'fallback-secret-key', 'secret'],
    SESSION_SECRET: ['your-super-secret-session-key-here', 'fallback-secret-key', 'secret'],
  };

  for (const [varName, defaults] of Object.entries(insecureDefaults)) {
    const value = process.env[varName];
    if (value && defaults.some(defaultValue => 
      value.toLowerCase().includes(defaultValue.toLowerCase()))) {
      errors.push(`${varName} appears to be using a default/example value. Use a secure random string.`);
    }
  }

  // Check NODE_ENV security
  if (process.env.NODE_ENV === 'production') {
    // Additional production-specific checks
    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
      warnings.push('FRONTEND_URL contains localhost in production environment');
    }

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
      warnings.push('Using SQLite database in production (consider PostgreSQL for production)');
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('🔶 Environment Security Warnings:');
    warnings.forEach(warning => console.warn(`   ${warning}`));
  }

  // Throw on errors
  if (errors.length > 0) {
    console.error('🚫 Environment Security Validation Failed:');
    errors.forEach(error => console.error(`   ${error}`));
    throw new Error(`Environment security validation failed with ${errors.length} error(s)`);
  }

  console.log('✅ Environment security validation passed');
};

/**
 * Generate secure random secrets for development
 * @param {number} length - Length of the secret to generate
 * @returns {string} Cryptographically secure random string
 */
export const generateSecureSecret = async (length = 64) => {
  const crypto = await import('crypto');
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate and display security configuration on startup
 */
export const displaySecurityConfig = () => {
  console.log('🔒 Security Configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   JWT Token Expiry: ${process.env.JWT_EXPIRES_IN || '15m'}`);
  console.log(`   Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`   Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Enabled' : 'Disabled'}`);
  console.log(`   HTTPS Cookies: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled (dev)'}`);
  console.log(`   Rate Limiting: Enabled (5 req/min auth, 100 req/15min general)`);
  console.log(`   Security Headers: Enabled (Helmet.js)`);
  console.log(`   CORS: ${process.env.FRONTEND_URL || 'localhost:5173'}`);
};