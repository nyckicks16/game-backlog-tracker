/**
 * Unit Tests for JWT Utilities
 * User Story #12: Integration Testing
 * 
 * Comprehensive testing of JWT token generation, verification, and security
 */
import { jest } from '@jest/globals';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  generateTokenPair
} from '../../utils/jwt.js';

describe('JWT Utilities', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser'
  };

  beforeEach(() => {
    // Reset any mocked functions
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    test('should generate a valid access token', () => {
      const token = generateAccessToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include correct payload in access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.type).toBe('access');
      expect(decoded.iss).toBe('game-backlog-tracker');
      expect(decoded.aud).toBe('game-backlog-tracker-client');
    });

    test('should have short expiration time for access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);
      
      const now = Math.floor(Date.now() / 1000);
      const expiration = decoded.exp;
      
      // Should expire within 15-16 minutes (allowing for test execution time)
      expect(expiration - now).toBeLessThanOrEqual(16 * 60);
      expect(expiration - now).toBeGreaterThan(14 * 60);
    });
  });

  describe('generateRefreshToken', () => {
    test('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should include correct payload in refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.type).toBe('refresh');
      expect(decoded.username).toBeUndefined(); // Refresh tokens don't include username
    });

    test('should have long expiration time for refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyToken(token);
      
      const now = Math.floor(Date.now() / 1000);
      const expiration = decoded.exp;
      
      // Should expire in approximately 7 days
      const sevenDays = 7 * 24 * 60 * 60;
      expect(expiration - now).toBeLessThanOrEqual(sevenDays + 60); // Allow 1 minute buffer
      expect(expiration - now).toBeGreaterThan(sevenDays - 60);
    });
  });

  describe('verifyToken', () => {
    test('should verify valid access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.type).toBe('access');
    });

    test('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.type).toBe('refresh');
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    test('should throw error for malformed token', () => {
      const malformedToken = 'this-is-not-a-jwt-token';
      
      expect(() => {
        verifyToken(malformedToken);
      }).toThrow();
    });

    test('should throw error for empty token', () => {
      expect(() => {
        verifyToken('');
      }).toThrow();
    });

    test('should throw error for null token', () => {
      expect(() => {
        verifyToken(null);
      }).toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    test('should extract token from valid Bearer header', () => {
      const token = 'valid-jwt-token-here';
      const header = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBe(token);
    });

    test('should return null for missing Authorization header', () => {
      const extracted = extractTokenFromHeader(null);
      
      expect(extracted).toBeNull();
    });

    test('should return null for undefined Authorization header', () => {
      const extracted = extractTokenFromHeader(undefined);
      
      expect(extracted).toBeNull();
    });

    test('should return null for empty Authorization header', () => {
      const extracted = extractTokenFromHeader('');
      
      expect(extracted).toBeNull();
    });

    test('should return null for header without Bearer prefix', () => {
      const extracted = extractTokenFromHeader('token-without-bearer');
      
      expect(extracted).toBeNull();
    });

    test('should return null for header with wrong prefix', () => {
      const extracted = extractTokenFromHeader('Basic token-here');
      
      expect(extracted).toBeNull();
    });

    test('should handle Bearer with extra spaces', () => {
      const token = 'valid-jwt-token';
      const header = `Bearer  ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBe(` ${token}`); // Should include the extra space
    });
  });

  describe('generateTokenPair', () => {
    test('should generate both access and refresh tokens', () => {
      const tokenPair = generateTokenPair(mockUser);
      
      expect(tokenPair).toBeDefined();
      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.tokenType).toBe('Bearer');
      expect(tokenPair.expiresIn).toBe(900); // 15 minutes
    });

    test('should generate valid tokens in pair', () => {
      const tokenPair = generateTokenPair(mockUser);
      
      // Verify access token
      const accessDecoded = verifyToken(tokenPair.accessToken);
      expect(accessDecoded.type).toBe('access');
      expect(accessDecoded.userId).toBe(mockUser.id);
      
      // Verify refresh token
      const refreshDecoded = verifyToken(tokenPair.refreshToken);
      expect(refreshDecoded.type).toBe('refresh');
      expect(refreshDecoded.userId).toBe(mockUser.id);
    });

    test('should generate different tokens each time', async () => {
      const user1 = { ...mockUser, id: 1 };
      const user2 = { ...mockUser, id: 2 };
      
      const pair1 = generateTokenPair(user1);
      const pair2 = generateTokenPair(user2);
      
      expect(pair1.accessToken).not.toBe(pair2.accessToken);
      expect(pair1.refreshToken).not.toBe(pair2.refreshToken);
    });
  });

  describe('Security Tests', () => {
    test('tokens should have different signatures for different users', () => {
      const user1 = { id: 1, email: 'user1@test.com', username: 'user1' };
      const user2 = { id: 2, email: 'user2@test.com', username: 'user2' };
      
      const token1 = generateAccessToken(user1);
      const token2 = generateAccessToken(user2);
      
      expect(token1).not.toBe(token2);
      
      const decoded1 = verifyToken(token1);
      const decoded2 = verifyToken(token2);
      
      expect(decoded1.userId).not.toBe(decoded2.userId);
    });

    test('should include issued at timestamp', () => {
      const beforeGeneration = Math.floor(Date.now() / 1000);
      const token = generateAccessToken(mockUser);
      const afterGeneration = Math.floor(Date.now() / 1000);
      
      const decoded = verifyToken(token);
      
      expect(decoded.iat).toBeGreaterThanOrEqual(beforeGeneration);
      expect(decoded.iat).toBeLessThanOrEqual(afterGeneration);
    });

    test('should include correct issuer and audience', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.iss).toBe('game-backlog-tracker');
      expect(decoded.aud).toBe('game-backlog-tracker-client');
    });
  });

  describe('Error Handling', () => {
    test('should handle user with missing properties gracefully', () => {
      const incompleteUser = { id: 1 }; // Missing email and username
      
      expect(() => {
        generateAccessToken(incompleteUser);
      }).not.toThrow();
      
      const token = generateAccessToken(incompleteUser);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBeUndefined();
      expect(decoded.username).toBeUndefined();
    });

    test('should handle null user object', () => {
      expect(() => {
        generateAccessToken(null);
      }).toThrow();
    });

    test('should handle undefined user object', () => {
      expect(() => {
        generateAccessToken(undefined);
      }).toThrow();
    });
  });
});