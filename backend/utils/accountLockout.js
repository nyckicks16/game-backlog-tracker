/**
 * Account Lockout Utilities (User Story #10)
 * Handles account locking/unlocking for security after failed login attempts
 */
import { prisma } from '../db/database.js';
import { logAccountLocked, logSecurityEvent, SEVERITY_LEVELS } from './securityLogging.js';

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Record a failed login attempt
 * @param {string} email - User email
 * @returns {object} - User object with lockout status
 */
export const recordFailedAttempt = async (email) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return null;
    }

    // Check if account is already locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return {
        ...user,
        isLocked: true,
        lockTimeRemaining: Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000 / 60), // minutes
      };
    }

    // Increment failed attempts
    const failedAttempts = user.failedLoginAttempts + 1;
    
    // Check if we should lock the account
    const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: failedAttempts,
        lockedUntil: lockedUntil,
      },
    });

    if (shouldLock) {
      logAccountLocked(failedAttempts, { email: '[REDACTED]' });
    }

    return {
      ...updatedUser,
      isLocked: shouldLock,
      lockTimeRemaining: shouldLock ? LOCKOUT_DURATION_MS / 1000 / 60 : 0, // minutes
    };
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    throw error;
  }
};

/**
 * Reset failed login attempts after successful login
 * @param {number} userId - User ID
 */
export const resetFailedAttempts = async (userId) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
    throw error;
  }
};

/**
 * Check if an account is locked
 * @param {string} email - User email
 * @returns {object} - Lock status information
 */
export const checkAccountLockStatus = async (email) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      return { isLocked: false, user: null };
    }

    // Check if lock has expired
    if (user.lockedUntil && new Date(user.lockedUntil) <= new Date()) {
      // Auto-unlock expired accounts
      await resetFailedAttempts(user.id);
      return { 
        isLocked: false, 
        user: { ...user, failedLoginAttempts: 0, lockedUntil: null }
      };
    }

    const isLocked = !!(user.lockedUntil && new Date(user.lockedUntil) > new Date());
    const lockTimeRemaining = isLocked 
      ? Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000 / 60) 
      : 0;

    return {
      isLocked,
      user,
      lockTimeRemaining,
      attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - user.failedLoginAttempts),
    };
  } catch (error) {
    console.error('Error checking account lock status:', error);
    return { isLocked: false, user: null };
  }
};

/**
 * Manually unlock an account (admin function)
 * @param {string|number} userIdentifier - User email or ID
 */
export const adminUnlockAccount = async (userIdentifier) => {
  try {
    const whereClause = typeof userIdentifier === 'string' 
      ? { email: userIdentifier }
      : { id: userIdentifier };

    const user = await prisma.user.update({
      where: whereClause,
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    logSecurityEvent(
      'admin_account_unlock',
      SEVERITY_LEVELS.MEDIUM,
      'Admin unlocked user account',
      { userIdentifier: '[REDACTED]' }
    );
    return user;
  } catch (error) {
    console.error('Error unlocking account:', error);
    throw error;
  }
};

/**
 * Get lockout configuration
 */
export const getLockoutConfig = () => ({
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
  lockoutDurationMinutes: LOCKOUT_DURATION_MS / 1000 / 60,
});