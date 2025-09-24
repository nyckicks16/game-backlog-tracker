/**
 * Unit Tests for Token Blacklist Utility
 * Tests token blacklisting functionality for security
 */
import { jest } from '@jest/globals';

// Mock Prisma database
const mockPrismaTokenBlacklist = {
  create: jest.fn(),
  findUnique: jest.fn(),
  deleteMany: jest.fn()
};

jest.unstable_mockModule('../db/database.js', () => ({
  prisma: {
    tokenBlacklist: mockPrismaTokenBlacklist
  }
}));

// Mock security logging
jest.unstable_mockModule('../../utils/securityLogging.js', () => ({
  logTokenRevoked: jest.fn()
}));

// Now import the module to test
const {
  blacklistToken,
  isTokenBlacklisted,
  blacklistUserTokens,
  cleanupExpiredTokens,
  adminRevokeUserTokens
} = await import('../../utils/tokenBlacklist.js');

describe('Token Blacklist Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('blacklistToken', () => {
    test('should blacklist a token with expiration', async () => {
      const token = 'test.jwt.token';
      const expiresIn = 3600;

      mockRedis.setex.mockResolvedValue('OK');

      await blacklistToken(token, expiresIn);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `blacklist:${token}`,
        expiresIn,
        'true'
      );
    });

    test('should handle Redis errors gracefully', async () => {
      const token = 'test.jwt.token';
      const expiresIn = 3600;

      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(blacklistToken(token, expiresIn)).rejects.toThrow('Redis error');
    });
  });

  describe('isTokenBlacklisted', () => {
    test('should return true for blacklisted token', async () => {
      const token = 'blacklisted.jwt.token';
      mockRedis.get.mockResolvedValue('true');

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith(`blacklist:${token}`);
    });

    test('should return false for non-blacklisted token', async () => {
      const token = 'valid.jwt.token';
      mockRedis.get.mockResolvedValue(null);

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(false);
      expect(mockRedis.get).toHaveBeenCalledWith(`blacklist:${token}`);
    });

    test('should handle Redis errors and return false', async () => {
      const token = 'test.jwt.token';
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(false);
    });
  });

  describe('blacklistUserTokens', () => {
    test('should blacklist multiple user tokens', async () => {
      const userId = 123;
      const tokens = ['token1', 'token2', 'token3'];
      const expiresIn = 3600;

      mockRedis.setex.mockResolvedValue('OK');

      await blacklistUserTokens(userId, tokens, expiresIn);

      expect(mockRedis.setex).toHaveBeenCalledTimes(3);
      tokens.forEach(token => {
        expect(mockRedis.setex).toHaveBeenCalledWith(
          `blacklist:${token}`,
          expiresIn,
          'true'
        );
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    test('should identify and cleanup expired tokens', async () => {
      const mockKeys = ['blacklist:token1', 'blacklist:token2'];
      const mockMulti = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      mockRedis.keys.mockResolvedValue(mockKeys);
      mockRedis.multi.mockReturnValue(mockMulti);

      await cleanupExpiredTokens();

      expect(mockRedis.keys).toHaveBeenCalledWith('blacklist:*');
      expect(mockMulti.del).toHaveBeenCalledTimes(2);
      expect(mockMulti.exec).toHaveBeenCalled();
    });
  });

  describe('adminRevokeUserTokens', () => {
    test('should revoke all tokens for specific user', async () => {
      const userId = 123;
      const userTokens = ['blacklist:user:123:token1', 'blacklist:user:123:token2'];
      const mockMulti = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      mockRedis.keys.mockResolvedValue(userTokens);
      mockRedis.multi.mockReturnValue(mockMulti);

      await adminRevokeUserTokens(userId);

      expect(mockRedis.keys).toHaveBeenCalledWith(`blacklist:user:${userId}:*`);
      expect(mockMulti.del).toHaveBeenCalledTimes(2);
      expect(mockMulti.exec).toHaveBeenCalled();
    });
  });
});