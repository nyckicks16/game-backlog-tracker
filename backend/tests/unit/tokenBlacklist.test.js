/**
 * Unit Tests for Token Blacklist Utility
 * Tests token blacklisting functionality for security (Prisma implementation)
 */
import { jest } from '@jest/globals';

// Mock Prisma database
const mockPrismaTokenBlacklist = {
  create: jest.fn(),
  findUnique: jest.fn(),
  deleteMany: jest.fn()
};

jest.unstable_mockModule('../../db/database.js', () => ({
  prisma: {
    tokenBlacklist: mockPrismaTokenBlacklist
  }
}));

// Mock security logging
const mockLogTokenRevoked = jest.fn();
jest.unstable_mockModule('../../utils/securityLogging.js', () => ({
  logTokenRevoked: mockLogTokenRevoked
}));

// Import the module to test
const {
  blacklistToken,
  isTokenBlacklisted,
  cleanupExpiredTokens
} = await import('../../utils/tokenBlacklist.js');

describe('Token Blacklist Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('blacklistToken', () => {
    test('should blacklist a token with database storage', async () => {
      const token = 'test.jwt.token';
      const userId = 123;
      const type = 'access';
      const reason = 'User logout';

      mockPrismaTokenBlacklist.create.mockResolvedValue({
        id: 1,
        token,
        userId,
        type,
        reason,
        expiresAt: new Date(),
        createdAt: new Date()
      });

      await blacklistToken(token, userId, type, reason);

      expect(mockPrismaTokenBlacklist.create).toHaveBeenCalledWith({
        data: {
          token,
          userId,
          type,
          expiresAt: expect.any(Date),
          reason
        }
      });
      expect(mockLogTokenRevoked).toHaveBeenCalledWith(type, reason, { userId: '[REDACTED]' });
    });

    test('should handle database errors gracefully', async () => {
      const token = 'test.jwt.token';
      const userId = 123;

      mockPrismaTokenBlacklist.create.mockRejectedValue(new Error('Database error'));

      await expect(blacklistToken(token, userId)).rejects.toThrow('Database error');
    });

    test('should set default expiration when token has no exp', async () => {
      const token = 'simple.token.without.exp';
      const userId = 456;

      mockPrismaTokenBlacklist.create.mockResolvedValue({
        id: 2,
        token,
        userId,
        type: 'access',
        expiresAt: new Date(),
        createdAt: new Date()
      });

      await blacklistToken(token, userId);

      expect(mockPrismaTokenBlacklist.create).toHaveBeenCalledWith({
        data: {
          token,
          userId,
          type: 'access',
          expiresAt: expect.any(Date),
          reason: null
        }
      });
    });
  });

  describe('isTokenBlacklisted', () => {
    test('should return true for blacklisted token', async () => {
      const token = 'blacklisted.jwt.token';
      
      mockPrismaTokenBlacklist.findUnique.mockResolvedValue({
        id: 1,
        token,
        userId: 123,
        type: 'access',
        createdAt: new Date()
      });

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(true);
      expect(mockPrismaTokenBlacklist.findUnique).toHaveBeenCalledWith({
        where: { token }
      });
    });

    test('should return false for non-blacklisted token', async () => {
      const token = 'valid.jwt.token';
      
      mockPrismaTokenBlacklist.findUnique.mockResolvedValue(null);

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(false);
      expect(mockPrismaTokenBlacklist.findUnique).toHaveBeenCalledWith({
        where: { token }
      });
    });

    test('should handle database errors gracefully', async () => {
      const token = 'error.jwt.token';
      
      mockPrismaTokenBlacklist.findUnique.mockRejectedValue(new Error('Database connection error'));

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(false); // Should fail open
    });
  });

  describe('cleanupExpiredTokens', () => {
    test('should cleanup expired tokens', async () => {
      const mockResult = { count: 5 };
      
      mockPrismaTokenBlacklist.deleteMany.mockResolvedValue(mockResult);

      const result = await cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(mockPrismaTokenBlacklist.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          }
        }
      });
    });

    test('should handle cleanup errors', async () => {
      mockPrismaTokenBlacklist.deleteMany.mockRejectedValue(new Error('Cleanup failed'));

      await expect(cleanupExpiredTokens()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('service reliability', () => {
    test('should handle undefined/null tokens gracefully', async () => {
      // Functions accept null/undefined tokens with defaults
      const result1 = await isTokenBlacklisted(null);
      const result2 = await isTokenBlacklisted(undefined);
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });
});