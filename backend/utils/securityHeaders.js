/**
 * Advanced Security Headers Configuration
 * Implements comprehensive security headers beyond basic Helmet.js
 */

/**
 * Content Security Policy configuration
 * Prevents XSS, clickjacking, and other injection attacks
 */
export const getContentSecurityPolicy = () => ({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for React dev mode
      "'unsafe-eval'", // Required for React dev mode
      "https://apis.google.com", // Google OAuth
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for styled components
      "https://fonts.googleapis.com", // Google Fonts
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com", // Google Fonts
      "data:", // Data URLs for fonts
    ],
    imgSrc: [
      "'self'",
      "data:", // Base64 images
      "https:", // External images (avatars, game covers)
      "https://lh3.googleusercontent.com", // Google profile pictures
    ],
    connectSrc: [
      "'self'",
      "https://api.igdb.com", // Game database API
      "https://accounts.google.com", // Google OAuth
      process.env.NODE_ENV === 'development' ? "ws://localhost:*" : "", // WebSocket for dev
    ].filter(Boolean),
    objectSrc: ["'none'"], // Prevent object/embed tags
    mediaSrc: ["'self'"],
    frameSrc: [
      "'self'",
      "https://accounts.google.com", // Google OAuth iframe
    ],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"], // Prevent clickjacking
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  },
});

/**
 * Security headers middleware
 * Adds additional security headers not covered by Helmet.js
 */
export const additionalSecurityHeaders = (req, res, next) => {
  // Referrer Policy - Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Feature Policy - Control browser features
  res.setHeader('Permissions-Policy', [
    'camera=()', // Disable camera access
    'microphone=()', // Disable microphone access
    'geolocation=()', // Disable geolocation
    'payment=()', // Disable payment API
    'usb=()', // Disable USB API
    'magnetometer=()', // Disable magnetometer
    'gyroscope=()', // Disable gyroscope
    'speaker=()', // Disable speaker selection
  ].join(', '));

  // Expect-CT - Certificate Transparency
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Expect-CT', 'max-age=86400, enforce');
  }

  // Cross-Origin Policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Additional security headers
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Clear-Site-Data', '"cache"'); // Clear cache on logout routes

  next();
};

/**
 * Security headers specific to authentication endpoints
 */
export const authSecurityHeaders = (req, res, next) => {
  // Prevent caching of authentication responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Clear site data on logout
  if (req.path.includes('logout')) {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
  }

  next();
};

/**
 * Get security headers configuration based on environment
 */
export const getSecurityHeadersConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    contentSecurityPolicy: getContentSecurityPolicy(),
    additionalHeaders: true,
    forceHTTPS: isProduction,
    hsts: {
      maxAge: isProduction ? 31536000 : 0, // 1 year in production
      includeSubDomains: isProduction,
      preload: isProduction,
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    expectCt: isProduction,
  };
};