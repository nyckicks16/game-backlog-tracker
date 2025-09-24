import jwt from 'jsonwebtoken';

/**
 * Generate JWT access token for user authentication
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    type: 'access',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', // Short-lived access token
    issuer: 'game-backlog-tracker',
    audience: 'game-backlog-tracker-client',
  });
};

/**
 * Generate JWT refresh token for token renewal
 * @param {Object} user - User object from database
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'refresh',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d', // Long-lived refresh token
    issuer: 'game-backlog-tracker',
    audience: 'game-backlog-tracker-client',
  });
};

/**
 * Verify JWT token and extract payload
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'game-backlog-tracker',
      audience: 'game-backlog-tracker-client',
    });
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Generate token pair (access + refresh)
 * @param {Object} user - User object from database
 * @returns {Object} Object containing access and refresh tokens
 */
const generateTokenPair = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    tokenType: 'Bearer',
    expiresIn: 900, // 15 minutes in seconds
  };
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  generateTokenPair,
};