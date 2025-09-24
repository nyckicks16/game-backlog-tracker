import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { isTokenBlacklisted } from '../utils/tokenBlacklist.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to require authentication for protected routes
 * Checks for valid JWT token in Authorization header or session
 */
const requireAuth = async (req, res, next) => {
  try {
    let user = null;

    // Try JWT token first (for API requests)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      if (token) {
        try {
          // Check if token is blacklisted first
          const isBlacklisted = await isTokenBlacklisted(token);
          if (isBlacklisted) {
            return res.status(401).json({
              error: 'TOKEN_REVOKED',
              message: 'Access token has been revoked',
              status: 401,
            });
          }

          const decoded = verifyToken(token);
          if (decoded.type !== 'access') {
            return res.status(401).json({
              error: 'INVALID_TOKEN_TYPE',
              message: 'Access token required',
              status: 401,
            });
          }

          // Fetch fresh user data from database
          user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              provider: true,
              lastLogin: true,
              createdAt: true,
            },
          });

          if (!user) {
            return res.status(401).json({
              error: 'USER_NOT_FOUND',
              message: 'User account no longer exists',
              status: 401,
            });
          }
        } catch (tokenError) {
          return res.status(401).json({
            error: 'INVALID_TOKEN',
            message: 'Invalid or expired access token',
            status: 401,
          });
        }
      }
    }

    // Fallback to session authentication (for browser requests)
    if (!user && req.isAuthenticated && req.isAuthenticated()) {
      user = req.user;
    }

    if (!user) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required to access this resource',
        status: 401,
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'AUTHENTICATION_ERROR',
      message: 'Internal authentication error',
      status: 500,
    });
  }
};

/**
 * Middleware to check authentication status without requiring it
 * Populates req.user if authenticated, but doesn't block unauthenticated requests
 */
const checkAuth = async (req, res, next) => {
  try {
    let user = null;

    // Try JWT token first
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      if (token) {
        try {
          const decoded = verifyToken(token);
          if (decoded.type === 'access') {
            user = await prisma.user.findUnique({
              where: { id: decoded.userId },
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
                provider: true,
                lastLogin: true,
                createdAt: true,
              },
            });
          }
        } catch (tokenError) {
          // Silent fail for optional authentication
          console.log('Optional auth token invalid:', tokenError.message);
        }
      }
    }

    // Fallback to session authentication
    if (!user && req.isAuthenticated && req.isAuthenticated()) {
      user = req.user;
    }

    req.user = user; // null if not authenticated
    next();
  } catch (error) {
    console.error('Check auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Middleware to validate refresh tokens
 */
const requireRefreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie first, fallback to body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token is required',
        status: 400,
      });
    }

    // Check if refresh token is blacklisted first
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      // Clear invalid refresh token cookie if it exists
      if (req.cookies.refreshToken) {
        res.clearCookie('refreshToken', { path: '/auth/refresh' });
      }
      
      return res.status(401).json({
        error: 'TOKEN_REVOKED',
        message: 'Refresh token has been revoked',
        status: 401,
      });
    }

    const decoded = verifyToken(refreshToken);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'INVALID_TOKEN_TYPE',
        message: 'Refresh token required',
        status: 401,
      });
    }

    // Verify user exists and refresh token matches
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      // Clear invalid refresh token cookie if it exists
      if (req.cookies.refreshToken) {
        res.clearCookie('refreshToken', { path: '/auth/refresh' });
      }
      
      return res.status(401).json({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
        status: 401,
      });
    }

    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    console.error('Refresh token middleware error:', error);
    
    // Clear invalid refresh token cookie if it exists
    if (req.cookies.refreshToken) {
      res.clearCookie('refreshToken', { path: '/auth/refresh' });
    }
    
    res.status(401).json({
      error: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid or expired refresh token',
      status: 401,
    });
  }
};

export {
  requireAuth,
  checkAuth,
  requireRefreshToken,
};

// Alias for compatibility with existing code
export const authenticateToken = requireAuth;