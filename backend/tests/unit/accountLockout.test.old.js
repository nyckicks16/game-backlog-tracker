/**
 * Unit Tests for Account Lockout Utility
 * Tests account security and lockout functionality
 */
import { jest } from '@jest/globals';

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  incr: jest.fn(),
  del: jest.fn(),
  ttl: jest.fn()
};

jest.unstable_mockModule('redis', () => ({
  createClient: jest.fn(() => mockRedis)
}));

// Mock Prisma
const mockPrisma = {
  user: {
    update: jest.fn()
  }
};

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

const {
  recordFailedLogin,
  isAccountLocked,
  unlockAccount,
  getAccountStatus
} = await import('../../utils/accountLockout.js');

describe('Account Lockout Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordFailedLogin', () => {
    test('should record first failed login attempt', async () => {
      const userId = 123;
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(-1);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await recordFailedLogin(userId);

      expect(mockRedis.incr).toHaveBeenCalledWith(`failed_login:${userId}`);
      expect(result).toEqual({
        attemptCount: 1,
        isLocked: false,
        lockoutTime: null
      });
    });

    test('should lock account after max attempts', async () => {
      const userId = 123;
      mockRedis.get.mockResolvedValue('4'); // 4 previous attempts
      mockRedis.incr.mockResolvedValue(5); // 5th attempt triggers lock
      mockRedis.setex.mockResolvedValue('OK');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await recordFailedLogin(userId);

      expect(result.isLocked).toBe(true);
      expect(result.attemptCount).toBe(5);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { lockedUntil: expect.any(Date) }
      });
    });
  });

  describe('isAccountLocked', () => {
    test('should return false for unlocked account', async () => {
      const userId = 123;
      mockRedis.get.mockResolvedValue('2'); // Only 2 attempts

      const result = await isAccountLocked(userId);

      expect(result).toBe(false);
    });

    test('should return true for locked account', async () => {
      const userId = 123;
      mockRedis.get.mockResolvedValue('5'); // 5 attempts = locked

      const result = await isAccountLocked(userId);

      expect(result).toBe(true);
    });

    test('should return false when no attempts recorded', async () => {
      const userId = 123;
      mockRedis.get.mockResolvedValue(null);

      const result = await isAccountLocked(userId);

      expect(result).toBe(false);
    });
  });

  describe('unlockAccount', () => {
    test('should unlock account and clear attempts', async () => {
      const userId = 123;
      mockRedis.del.mockResolvedValue(1);
      mockPrisma.user.update.mockResolvedValue({});

      await unlockAccount(userId);

      expect(mockRedis.del).toHaveBeenCalledWith(`failed_login:${userId}`);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { lockedUntil: null }
      });
    });
  });

  describe('getAccountStatus', () => {
    test('should return current account status', async () => {
      const userId = 123;
      mockRedis.get.mockResolvedValue('3');
      mockRedis.ttl.mockResolvedValue(1800); // 30 minutes remaining

      const result = await getAccountStatus(userId);

      expect(result).toEqual({
        attemptCount: 3,
        isLocked: false,
        remainingTime: 1800
      });
    });

    test('should return locked status for max attempts', async () => {
      const userId = 123;
      mockRedis.get.mockResolvedValue('5');
      mockRedis.ttl.mockResolvedValue(900); // 15 minutes remaining

      const result = await getAccountStatus(userId);

      expect(result).toEqual({
        attemptCount: 5,
        isLocked: true,
        remainingTime: 900
      });
    });
  });
});