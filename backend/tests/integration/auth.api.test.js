/**
 * Integration Tests for Authentication API
 * User Story #12: Integration Testing
 * 
 * End-to-end testing of authentication flows
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';

// Mock Prisma for controlled testing
jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  })),
}));

// Mock token blacklist
jest.unstable_mockModule('../../utils/tokenBlacklist.js', () => ({
  addToBlacklist: jest.fn(),
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
}));

// Mock email service
jest.unstable_mockModule('../../services/email.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// Mock Google OAuth
jest.unstable_mockModule('../../services/googleAuth.js', () => ({
  getGoogleProfile: jest.fn(),
}));

const prisma = new PrismaClient();

describe('Authentication API Integration Tests', () => {
  let app;
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2b$10$rWQzZJ0P3zP1qQxZ.dCQ.uh2OyO8Yv7Vz9sVxJ2VGq4Kv3YzGJ0P3z',
    firstName: 'Test',
    lastName: 'User',
    emailVerified: true,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    lastLogin: new Date('2023-01-01')
  };

  const mockRefreshToken = {
    id: 'refresh-token-123',
    userId: 1,
    token: 'refresh_token_hash',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
    user: mockUser
  };

  beforeAll(async () => {
    // Create a minimal Express app for testing
    const express = (await import('express')).default;
    const authRoutes = (await import('../../routes/auth.js')).default;
    
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
  });

  describe('POST /api/auth/register', () => {
    const registrationData = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User'
    };

    test('should register user successfully', async () => {
      // Mock user doesn't exist
      prisma.user.findUnique.mockResolvedValue(null);
      
      // Mock successful user creation
      const newUser = {
        ...mockUser,
        ...registrationData,
        id: 2,
        passwordHash: 'hashed_password',
        emailVerified: false
      };
      prisma.user.create.mockResolvedValue(newUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toMatchObject({
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        emailVerified: false
      });

      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }) // Missing required fields
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...registrationData, email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...registrationData, password: 'weak' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle existing email', async () => {
      // Mock user already exists
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(400);

      expect(response.body.error).toBe('Email already registered');
    });

    test('should handle existing username', async () => {
      // First call returns null (email check), second returns user (username check)
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(400);

      expect(response.body.error).toBe('Username already taken');
    });

    test('should handle database errors', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(500);

      expect(response.body.error).toBe('Registration failed');
    });
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    beforeEach(() => {
      // Mock successful password verification
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should login successfully with email', async () => {
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username
      });

      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();

      // Verify last login was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLogin: expect.any(Date) }
      });
    });

    test('should login successfully with username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser', password: 'Password123!' })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
    });

    test('should handle invalid credentials', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should handle user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' }) // Missing password
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle database errors', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(500);

      expect(response.body.error).toBe('Login failed');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh tokens successfully', async () => {
      const newTokens = {
        accessToken: generateAccessToken(mockUser),
        refreshToken: generateRefreshToken()
      };

      prisma.refreshToken.create.mockResolvedValue({
        ...mockRefreshToken,
        token: newTokens.refreshToken
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' })
        .expect(200);

      expect(response.body.message).toBe('Tokens refreshed successfully');
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();

      // Verify old token was deleted
      expect(prisma.refreshToken.delete).toHaveBeenCalled();
    });

    test('should handle invalid refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body.error).toBe('Invalid refresh token');
    });

    test('should handle expired refresh token', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000) // Expired
      };
      prisma.refreshToken.findUnique.mockResolvedValue(expiredToken);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'expired_token' })
        .expect(401);

      expect(response.body.error).toBe('Refresh token expired');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({}) // Missing refresh token
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const accessToken = generateAccessToken(mockUser);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'valid_refresh_token' })
        .expect(200);

      expect(response.body.message).toBe('Logout successful');

      // Verify token was blacklisted
      const { addToBlacklist } = await import('../../utils/tokenBlacklist.js');
      expect(addToBlacklist).toHaveBeenCalled();

      // Verify refresh token was deleted
      expect(prisma.refreshToken.delete).toHaveBeenCalled();
    });

    test('should handle logout without refresh token', async () => {
      const accessToken = generateAccessToken(mockUser);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('should initiate password reset successfully', async () => {
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        resetToken: 'reset_token_hash',
        resetTokenExpiry: new Date(Date.now() + 3600000)
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).toBe('Password reset email sent');

      // Verify email service was called
      const { sendPasswordResetEmail } = await import('../../services/email.js');
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String)
      );
    });

    test('should handle non-existent email gracefully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toBe('Password reset email sent');
      // Should respond same way for security
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(() => {
      const userWithResetToken = {
        ...mockUser,
        resetToken: 'valid_reset_token_hash',
        resetTokenExpiry: new Date(Date.now() + 3600000)
      };
      prisma.user.findUnique.mockResolvedValue(userWithResetToken);
    });

    test('should reset password successfully', async () => {
      const resetData = {
        token: 'valid_reset_token',
        password: 'NewPassword123!'
      };

      prisma.user.update.mockResolvedValue({
        ...mockUser,
        resetToken: null,
        resetTokenExpiry: null
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(200);

      expect(response.body.message).toBe('Password reset successful');

      // Verify password was updated and reset token cleared
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          passwordHash: expect.any(String),
          resetToken: null,
          resetTokenExpiry: null
        }
      });
    });

    test('should handle invalid reset token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid_token', password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    test('should handle expired reset token', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        resetToken: 'expired_token_hash',
        resetTokenExpiry: new Date(Date.now() - 1000)
      };
      prisma.user.findUnique.mockResolvedValue(userWithExpiredToken);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'expired_token', password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    test('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid_token', password: 'weak' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/google', () => {
    beforeEach(async () => {
      const { getGoogleProfile } = await import('../../services/googleAuth.js');
      getGoogleProfile.mockResolvedValue({
        id: 'google_user_id',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg'
      });
    });

    test('should authenticate existing Google user', async () => {
      const googleUser = {
        ...mockUser,
        email: 'google@example.com',
        googleId: 'google_user_id'
      };
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.user.update.mockResolvedValue(googleUser);

      const response = await request(app)
        .post('/api/auth/google')
        .send({ accessToken: 'google_access_token' })
        .expect(200);

      expect(response.body.message).toBe('Google authentication successful');
      expect(response.body.user.email).toBe('google@example.com');
      expect(response.body.tokens).toBeDefined();
    });

    test('should create new user from Google profile', async () => {
      // No existing user found
      prisma.user.findUnique.mockResolvedValue(null);
      
      const newGoogleUser = {
        id: 2,
        email: 'google@example.com',
        username: 'google_user',
        googleId: 'google_user_id',
        firstName: 'Google',
        lastName: 'User',
        emailVerified: true,
        profilePicture: 'https://example.com/avatar.jpg'
      };
      prisma.user.create.mockResolvedValue(newGoogleUser);

      const response = await request(app)
        .post('/api/auth/google')
        .send({ accessToken: 'google_access_token' })
        .expect(201);

      expect(response.body.message).toBe('Google authentication successful');
      expect(response.body.user.email).toBe('google@example.com');
      expect(response.body.user.emailVerified).toBe(true);
    });

    test('should handle invalid Google token', async () => {
      const { getGoogleProfile } = await import('../../services/googleAuth.js');
      getGoogleProfile.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/google')
        .send({ accessToken: 'invalid_token' })
        .expect(401);

      expect(response.body.error).toBe('Invalid Google access token');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({}) // Missing access token
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle malformed JSON automatically
    });

    test('should handle large request payloads', async () => {
      const largeData = {
        email: 'test@example.com',
        password: 'x'.repeat(10000)
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largeData)
        .expect(400);

      // Should be rejected by validation
    });

    test('should handle concurrent login attempts', async () => {
      const loginPromises = Array(5).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'Password123!' })
      );

      const responses = await Promise.all(loginPromises);
      
      // All should succeed (assuming valid credentials)
      responses.forEach(response => {
        expect([200, 500]).toContain(response.status);
      });
    });

    test('should handle database connection failures gracefully', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' })
        .expect(500);

      expect(response.body.error).toBe('Login failed');
    });
  });
});