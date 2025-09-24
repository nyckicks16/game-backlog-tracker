/**
 * Unit Tests for Authentication Middleware
 * User Story #12: Integration Testing
 * 
 * Comprehensive testing of authentication middleware functionality
 */
import { jest } from '@jest/globals';
import { generateAccessToken } from '../../utils/jwt.js';

// Mock Prisma at the module level
const mockPrismaUser = {
  findUnique: jest.fn(),
};

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: mockPrismaUser,
  })),
}));

// Mock the blacklist utility
const mockIsTokenBlacklisted = jest.fn();
jest.unstable_mockModule('../../utils/tokenBlacklist.js', () => ({
  isTokenBlacklisted: mockIsTokenBlacklisted,
}));

describe('Authentication Middleware', () => {
  let req, res, next;
  let requireAuth;

  beforeAll(async () => {
    // Import the middleware after mocks are set up
    const authModule = await import('../../middleware/auth.js');
    requireAuth = authModule.requireAuth;
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockIsTokenBlacklisted.mockResolvedValue(false);
    mockPrismaUser.findUnique.mockResolvedValue(global.testUser);

    // Create mock request/response objects
    req = {
      headers: {},
      user: undefined,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {},
    };

    next = jest.fn();
  });

  describe('JWT Token Authentication', () => {
    test('should authenticate valid JWT token', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;

      await requireAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(global.testUser.id);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject blacklisted token', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;
      mockIsTokenBlacklisted.mockResolvedValue(true);

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'TOKEN_REVOKED',
        message: 'Access token has been revoked',
        status: 401,
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject refresh token for access', async () => {
      // Create a refresh token instead of access token
      const payload = {
        userId: global.testUser.id,
        email: global.testUser.email,
        type: 'refresh', // This should be rejected
      };
      
      // We need to manually create a token with wrong type
      // Since we can't easily create a refresh token with our utilities
      // Let's test with a modified JWT creation
      const jwt = await import('jsonwebtoken');
      const refreshToken = jwt.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
        issuer: 'game-backlog-tracker',
        audience: 'game-backlog-tracker-client',
      });

      req.headers.authorization = `Bearer ${refreshToken}`;

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'INVALID_TOKEN_TYPE',
        message: 'Access token required',
        status: 401,
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired access token',
          status: 401,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle user not found in database', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'USER_NOT_FOUND',
        message: 'User account no longer exists',
        status: 401,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Header Validation', () => {
    test('should reject missing Authorization header', async () => {
      // No Authorization header

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required to access this resource',
        status: 401,
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject malformed Authorization header', async () => {
      req.headers.authorization = 'NotBearer token-here';

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required to access this resource',
        status: 401,
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject empty Authorization header', async () => {
      req.headers.authorization = '';

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Database Integration', () => {
    test('should fetch fresh user data from database', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;

      const mockUserFromDb = {
        ...global.testUser,
        displayName: 'Updated Name',
      };
      mockPrismaUser.findUnique.mockResolvedValue(mockUserFromDb);

      await requireAuth(req, res, next);

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: global.testUser.id },
        select: expect.objectContaining({
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        }),
      });

      expect(req.user.displayName).toBe('Updated Name');
      expect(next).toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;
      
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired access token',
        status: 401,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token Blacklist Integration', () => {
    test('should check token blacklist', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;

      await requireAuth(req, res, next);

      expect(mockIsTokenBlacklisted).toHaveBeenCalledWith(token);
    });

    test('should handle blacklist service errors', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;
      
      mockIsTokenBlacklisted.mockRejectedValue(new Error('Blacklist service error'));

      await requireAuth(req, res, next);

      // Blacklist errors should be caught as token verification errors
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired access token',
        status: 401,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;
      
      // Mock an unexpected error
      const mockError = new Error('Unexpected error');
      mockPrismaUser.findUnique.mockImplementation(() => {
        throw mockError;
      });

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired access token',
        status: 401,
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should not expose sensitive error details in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;
      
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database credentials invalid'));

      await requireAuth(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired access token',
        status: 401,
      });

      // Should not expose the actual database error
      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('credentials')
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Request Object Modification', () => {
    test('should attach user to request object', async () => {
      const token = generateAccessToken(global.testUser);
      req.headers.authorization = `Bearer ${token}`;

      await requireAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(global.testUser.id);
      expect(req.user.email).toBe(global.testUser.email);
    });

    test('should not modify user object when authentication fails', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await requireAuth(req, res, next);

      expect(req.user).toBeUndefined();
    });
  });
});