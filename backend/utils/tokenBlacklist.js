/**
 * Token Blacklist Utilities (User Story #10)
 * Handles token revocation and blacklisting for security
 */
import jwt from 'jsonwebtoken';
import { prisma } from '../db/database.js';
import { logTokenRevoked } from './securityLogging.js';

/**
 * Add a token to the blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number|null} userId - User ID associated with the token
 * @param {string} type - Token type ('access' or 'refresh')
 * @param {string} reason - Reason for blacklisting
 */
export const blacklistToken = async (token, userId = null, type = 'access', reason = null) => {
  try {
    // Decode token to get expiration (don't verify since it might be invalid)
    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000); // Default 15 min if no exp

    await prisma.tokenBlacklist.create({
      data: {
        token,
        userId,
        type,
        expiresAt,
        reason,
      },
    });

    logTokenRevoked(type, reason, { userId: '[REDACTED]' });
  } catch (error) {
    console.error('Error blacklisting token:', error);
    throw error;
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is blacklisted
 */
export const isTokenBlacklisted = async (token) => {
  try {
    const blacklistedToken = await prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    return !!blacklistedToken;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false; // Fail open for availability, but log the error
  }
};

/**
 * Blacklist all tokens for a user
 * @param {number} userId - User ID to blacklist all tokens for
 * @param {string} reason - Reason for blacklisting
 */
export const blacklistUserTokens = async (userId, reason = 'User logout or security incident') => {
  try {
    // Get user's current refresh token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { refreshToken: true },
    });

    if (user?.refreshToken) {
      await blacklistToken(user.refreshToken, userId, 'refresh', reason);
    }

    // Clear refresh token from user record
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    console.log(`All tokens blacklisted for user [REDACTED], reason: ${reason}`);
  } catch (error) {
    console.error('Error blacklisting user tokens:', error);
    throw error;
  }
};

/**
 * Clean up expired blacklisted tokens (to be run periodically)
 */
export const cleanupExpiredTokens = async () => {
  try {
    const now = new Date();
    const result = await prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired blacklisted tokens`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};

/**
 * Revoke all tokens for a user (admin function)
 * @param {number} userId - User ID to revoke tokens for
 * @param {string} reason - Reason for revocation
 */
export const adminRevokeUserTokens = async (userId, reason = 'Admin revocation') => {
  await blacklistUserTokens(userId, reason);
  console.log(`Admin revoked all tokens for user [REDACTED]`);
};