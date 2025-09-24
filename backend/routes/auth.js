import express from 'express';
import passport from '../config/passport.js';
import { generateTokenPair } from '../utils/jwt.js';
import { blacklistUserTokens } from '../utils/tokenBlacklist.js';
import { resetFailedAttempts } from '../utils/accountLockout.js';
import { requireAuth, requireRefreshToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account', // Always show account selection
}));

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      // Reset failed login attempts on successful authentication
      await resetFailedAttempts(req.user.id);

      // Update user's last login
      await prisma.user.update({
        where: { id: req.user.id },
        data: { lastLogin: new Date() },
      });

      // Generate JWT tokens for API access
      const tokens = generateTokenPair(req.user);

      // Store refresh token in database
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      // Set refresh token in httpOnly cookie for enhanced security
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/auth/refresh',
      });

      // Redirect to frontend with success (access token in URL for initial setup)
      const frontendUrl = `${process.env.FRONTEND_URL}/auth/callback?success=true&token=${tokens.accessToken}`;
      res.redirect(frontendUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

/**
 * GET /auth/user
 * Get current authenticated user profile
 */
router.get('/user', requireAuth, (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture,
        provider: req.user.provider,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'PROFILE_ERROR',
      message: 'Failed to retrieve user profile',
      status: 500,
    });
  }
});

/**
 * GET /auth/status
 * Check authentication status
 */
router.get('/status', (req, res) => {
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
  
  res.json({
    authenticated: isAuthenticated,
    user: isAuthenticated ? {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      profilePicture: req.user.profilePicture,
    } : null,
  });
});

/**
 * POST /auth/refresh
 * Refresh JWT access token using refresh token
 */
router.post('/refresh', requireRefreshToken, async (req, res) => {
  try {
    // Generate new token pair
    const tokens = generateTokenPair(req.user);

    // Update stored refresh token
    await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        refreshToken: tokens.refreshToken,
        lastLogin: new Date(),
      },
    });

    // Update refresh token cookie with new value
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh',
    });

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      // Don't send refresh token in response when using cookies
      refreshToken: req.cookies.refreshToken ? undefined : tokens.refreshToken,
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'REFRESH_ERROR',
      message: 'Failed to refresh access token',
      status: 500,
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and invalidate session/tokens
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Blacklist all user tokens and clear from database
    await blacklistUserTokens(req.user.id, 'User logout');

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { 
      path: '/auth/refresh',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });

    // Logout from session if using session auth
    if (req.logout) {
      req.logout((err) => {
        if (err) {
          console.error('Session logout error:', err);
        }
      });
    }

    // Clear session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'LOGOUT_ERROR',
      message: 'Failed to logout properly',
      status: 500,
    });
  }
});

export default router;