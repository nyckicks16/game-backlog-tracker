/**
 * Admin Routes for User Session Management (User Story #10)
 * Administrative endpoints for token management and user account control
 */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { 
  blacklistUserTokens, 
  adminRevokeUserTokens,
  cleanupExpiredTokens 
} from '../utils/tokenBlacklist.js';
import { 
  adminUnlockAccount,
  getLockoutConfig,
  checkAccountLockStatus 
} from '../utils/accountLockout.js';
import { prisma } from '../db/database.js';

const router = express.Router();

// TODO: Add admin role check middleware when user roles are implemented
// For now, all authenticated users can use these endpoints (development only)

/**
 * POST /admin/tokens/revoke-user
 * Revoke all tokens for a specific user
 */
router.post('/tokens/revoke-user', requireAuth, async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'USER_ID_REQUIRED',
        message: 'User ID is required',
        status: 400,
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
        status: 404,
      });
    }

    await adminRevokeUserTokens(
      parseInt(userId), 
      reason || `Admin revocation by ${req.user.email}`
    );

    res.json({
      success: true,
      message: `All tokens revoked for user ${user.username}`,
      data: { userId: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Admin token revocation error:', error);
    res.status(500).json({
      error: 'REVOCATION_ERROR',
      message: 'Failed to revoke user tokens',
      status: 500,
    });
  }
});

/**
 * POST /admin/accounts/unlock
 * Unlock a locked user account
 */
router.post('/accounts/unlock', requireAuth, async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        error: 'IDENTIFIER_REQUIRED',
        message: 'User ID or email is required',
        status: 400,
      });
    }

    const identifier = userId ? parseInt(userId) : email;
    const user = await adminUnlockAccount(identifier);

    res.json({
      success: true,
      message: `Account unlocked for user ${user.username}`,
      data: {
        userId: user.id,
        email: user.email,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
      },
    });
  } catch (error) {
    console.error('Admin account unlock error:', error);
    res.status(500).json({
      error: 'UNLOCK_ERROR',
      message: 'Failed to unlock account',
      status: 500,
    });
  }
});

/**
 * GET /admin/accounts/lock-status/:identifier
 * Check lock status for a user account
 */
router.get('/accounts/lock-status/:identifier', requireAuth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to parse as user ID first, fallback to email
    const isUserId = !isNaN(parseInt(identifier));
    let email = identifier;
    
    if (isUserId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(identifier) },
        select: { email: true },
      });
      
      if (!user) {
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'User not found',
          status: 404,
        });
      }
      
      email = user.email;
    }

    const lockStatus = await checkAccountLockStatus(email);

    res.json({
      success: true,
      data: {
        identifier,
        email,
        ...lockStatus,
        config: getLockoutConfig(),
      },
    });
  } catch (error) {
    console.error('Check lock status error:', error);
    res.status(500).json({
      error: 'STATUS_CHECK_ERROR',
      message: 'Failed to check account status',
      status: 500,
    });
  }
});

/**
 * POST /admin/tokens/cleanup
 * Clean up expired blacklisted tokens
 */
router.post('/tokens/cleanup', requireAuth, async (req, res) => {
  try {
    const cleanedCount = await cleanupExpiredTokens();

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired tokens`,
      data: { cleanedCount },
    });
  } catch (error) {
    console.error('Token cleanup error:', error);
    res.status(500).json({
      error: 'CLEANUP_ERROR',
      message: 'Failed to clean up expired tokens',
      status: 500,
    });
  }
});

/**
 * GET /admin/session-stats
 * Get session management statistics
 */
router.get('/session-stats', requireAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      lockedUsers,
      blacklistedTokens,
      expiredTokens
    ] = await Promise.all([
      prisma.user.count(),
      
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      
      prisma.user.count({
        where: {
          AND: [
            { lockedUntil: { not: null } },
            { lockedUntil: { gt: new Date() } },
          ],
        },
      }),
      
      prisma.tokenBlacklist.count(),
      
      prisma.tokenBlacklist.count({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          activeIn24h: activeUsers,
          locked: lockedUsers,
        },
        tokens: {
          blacklisted: blacklistedTokens,
          expired: expiredTokens,
          needsCleanup: expiredTokens > 0,
        },
        config: getLockoutConfig(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Session stats error:', error);
    res.status(500).json({
      error: 'STATS_ERROR',
      message: 'Failed to get session statistics',
      status: 500,
    });
  }
});

export default router;