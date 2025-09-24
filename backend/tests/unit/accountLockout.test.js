/**
 * Unit Tests for Account Lockout Utility
 * Tests account lockout functionality for security
 */
import { jest } from '@jest/globals';

// Mock Prisma database
const mockPrismaUser = {
  findUnique: jest.fn(),
  update: jest.fn()
};

jest.unstable_mockModule('../../db/database.js', () => ({
  prisma: {
    user: mockPrismaUser
  }
}));

// Mock security logging
const mockLogAccountLocked = jest.fn();
const mockLogSecurityEvent = jest.fn();
jest.unstable_mockModule('../../utils/securityLogging.js', () => ({
  logAccountLocked: mockLogAccountLocked,
  logSecurityEvent: mockLogSecurityEvent,
  SEVERITY_LEVELS: {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
  }
}));

// Import the utilities to test
const {
  recordFailedAttempt,
  resetFailedAttempts,
  checkAccountLockStatus,
  adminUnlockAccount,
  getLockoutConfig
} = await import('../../utils/accountLockout.js');

describe('Account Lockout Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordFailedAttempt', () => {
    test('should record first failed login attempt', async () => {
      const email = 'user@example.com';
      const mockUser = {
        id: 1,
        email,
        failedLoginAttempts: 0,
        lockedUntil: null
      };

      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 1
      });

      const result = await recordFailedAttempt(email);

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email }
      });
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          failedLoginAttempts: 1,
          lockedUntil: null
        }
      });
      expect(result.failedLoginAttempts).toBe(1);
    });

    test('should lock account after max attempts', async () => {
      const email = 'user@example.com';
      const mockUser = {
        id: 1,
        email,
        failedLoginAttempts: 4, // One less than max
        lockedUntil: null
      };

      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000)
      });

      const result = await recordFailedAttempt(email);

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date)
        }
      });
      expect(mockLogAccountLocked).toHaveBeenCalled();
    });

    test('should return null for non-existent user', async () => {
      const email = 'nonexistent@example.com';

      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await recordFailedAttempt(email);

      expect(result).toBeNull();
    });
  });

  describe('resetFailedAttempts', () => {
    test('should reset failed attempts for user', async () => {
      const userId = 1;

      mockPrismaUser.update.mockResolvedValue({
        id: userId,
        failedLoginAttempts: 0,
        lockedUntil: null
      });

      await resetFailedAttempts(userId);

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
    });
  });

  describe('checkAccountLockStatus', () => {
    test('should return lock status for unlocked account', async () => {
      const email = 'user@example.com';
      const mockUser = {
        id: 1,
        email,
        failedLoginAttempts: 2,
        lockedUntil: null
      };

      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      const result = await checkAccountLockStatus(email);

      expect(result).toEqual({
        isLocked: false,
        user: mockUser,
        lockTimeRemaining: 0,
        attemptsRemaining: 3
      });
    });

    test('should return lock status for locked account', async () => {
      const email = 'locked@example.com';
      const lockTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      const mockUser = {
        id: 1,
        email,
        failedLoginAttempts: 5,
        lockedUntil: lockTime
      };

      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      const result = await checkAccountLockStatus(email);

      expect(result.isLocked).toBe(true);
      expect(result.user.failedLoginAttempts).toBe(5);
      expect(result.lockTimeRemaining).toBeGreaterThan(0);
    });

    test('should return null for non-existent user', async () => {
      const email = 'nonexistent@example.com';

      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await checkAccountLockStatus(email);

      expect(result).toEqual({ isLocked: false, user: null });
    });
  });

  describe('adminUnlockAccount', () => {
    test('should unlock account by email', async () => {
      const email = 'locked@example.com';
      const mockUser = {
        id: 1,
        email,
        failedLoginAttempts: 5,
        lockedUntil: new Date()
      };

      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 0,
        lockedUntil: null
      });

      const result = await adminUnlockAccount(email);

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { email },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      expect(mockLogSecurityEvent).toHaveBeenCalled();
    });
  });

  describe('getLockoutConfig', () => {
    test('should return lockout configuration', () => {
      const config = getLockoutConfig();

      expect(config).toEqual({
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30
      });
    });
  });

  describe('error handling', () => {
    test('should handle database errors gracefully', async () => {
      const email = 'user@example.com';

      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(recordFailedAttempt(email)).rejects.toThrow('Database error');
    });
  });
});