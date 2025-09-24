/**
 * Integration Tests for Profile API
 * User Story #12: Integration Testing
 * 
 * End-to-end testing of profile management functionality
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken } from '../../utils/jwt.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Prisma for controlled testing
const mockPrismaUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: mockPrismaUser,
  })),
}));

// Mock token blacklist
jest.unstable_mockModule('../../utils/tokenBlacklist.js', () => ({
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
}));

const prisma = new PrismaClient();

describe('Profile API Integration Tests', () => {
  let app;
  let authToken;
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    bio: 'Test bio',
    theme: 'dark',
    preferences: JSON.stringify({
      notifications: { gameUpdates: true },
      privacy: { profileVisible: true }
    }),
    avatarUrl: null,
    profilePicture: 'https://example.com/avatar.jpg',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    lastLogin: new Date('2023-01-01')
  };

  beforeAll(async () => {
    // Create a minimal Express app for testing
    const express = (await import('express')).default;
    const profileRoutes = (await import('../../routes/profile.js')).default;
    
    app = express();
    app.use(express.json());
    app.use('/api/profile', profileRoutes);
    
    // Generate auth token
    authToken = generateAccessToken(mockUser);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create proper mock functions for Prisma models
    prisma.user = {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      findFirst: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      delete: jest.fn().mockResolvedValue(mockUser)
    };

    prisma.userGame = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0)
    };
  });

  describe('GET /api/profile', () => {
    test('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        displayName: mockUser.displayName,
        bio: mockUser.bio,
        theme: mockUser.theme,
      });

      expect(response.body.preferences).toEqual({
        notifications: { gameUpdates: true },
        privacy: { profileVisible: true }
      });

      expect(response.body.stats).toBeDefined();
      expect(response.body.profileImage).toBe(mockUser.profilePicture);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_REQUIRED');
    });

    test('should handle user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('should handle database errors', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch profile');
    });

    test('should handle invalid preferences JSON', async () => {
      const userWithInvalidPrefs = {
        ...mockUser,
        preferences: 'invalid-json'
      };
      mockPrismaUser.findUnique.mockResolvedValue(userWithInvalidPrefs);

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.preferences).toEqual({});
    });
  });

  describe('PUT /api/profile', () => {
    test('should update profile successfully', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        theme: 'light',
        preferences: {
          notifications: { gameUpdates: false, achievements: true },
          privacy: { profileVisible: false }
        }
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
        preferences: JSON.stringify(updateData.preferences)
      };

      mockPrismaUser.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.displayName).toBe(updateData.displayName);
      expect(response.body.bio).toBe(updateData.bio);
      expect(response.body.theme).toBe(updateData.theme);
      expect(response.body.preferences).toEqual(updateData.preferences);

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          displayName: updateData.displayName,
          bio: updateData.bio,
          theme: updateData.theme,
          preferences: JSON.stringify(updateData.preferences)
        },
        select: expect.any(Object)
      });
    });

    test('should validate input data', async () => {
      const invalidData = {
        displayName: 'x', // Too short
        bio: 'x'.repeat(501), // Too long
        theme: 'invalid-theme'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    test('should handle empty update gracefully', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('should handle database update errors', async () => {
      mockPrismaUser.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ displayName: 'New Name' })
        .expect(500);

      expect(response.body.error).toBe('Failed to update profile');
    });

    test('should allow clearing optional fields', async () => {
      const updateData = {
        displayName: '',
        bio: ''
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            displayName: null,
            bio: null
          })
        })
      );
    });
  });

  describe('POST /api/profile/avatar', () => {
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');

    beforeAll(async () => {
      // Create test fixtures directory
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      // Create a small test image (1x1 pixel JPEG)
      const testImageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
      ]);
      
      if (!fs.existsSync(testImagePath)) {
        fs.writeFileSync(testImagePath, testImageBuffer);
      }
    });

    test('should upload avatar successfully', async () => {
      const updatedUser = {
        ...mockUser,
        avatarUrl: '/uploads/avatar-1-123456789.jpg'
      };
      mockPrismaUser.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImagePath)
        .expect(200);

      expect(response.body.message).toBe('Avatar uploaded successfully');
      expect(response.body.avatarUrl).toMatch(/^\/uploads\/avatar-\d+-\d+\.jpg$/);
      expect(response.body.profileImage).toBeDefined();
    });

    test('should require authentication for avatar upload', async () => {
      const response = await request(app)
        .post('/api/profile/avatar')
        .attach('avatar', testImagePath)
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_REQUIRED');
    });

    test('should reject request without image', async () => {
      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('No image file provided');
    });

    test('should handle database update errors during avatar upload', async () => {
      mockPrismaUser.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImagePath)
        .expect(500);

      expect(response.body.error).toBe('Failed to upload avatar');
    });
  });

  describe('DELETE /api/profile/avatar', () => {
    test('should remove avatar successfully', async () => {
      const userWithAvatar = {
        ...mockUser,
        avatarUrl: '/uploads/avatar-1-123456789.jpg'
      };
      
      const userAfterRemoval = {
        ...mockUser,
        avatarUrl: null
      };

      mockPrismaUser.findUnique.mockResolvedValue(userWithAvatar);
      mockPrismaUser.update.mockResolvedValue(userAfterRemoval);

      const response = await request(app)
        .delete('/api/profile/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Avatar removed successfully');
      expect(response.body.avatarUrl).toBeNull();
      expect(response.body.profileImage).toBe(mockUser.profilePicture);
    });

    test('should handle removal when no avatar exists', async () => {
      const userWithoutAvatar = {
        ...mockUser,
        avatarUrl: null
      };

      mockPrismaUser.findUnique.mockResolvedValue(userWithoutAvatar);
      mockPrismaUser.update.mockResolvedValue(userWithoutAvatar);

      const response = await request(app)
        .delete('/api/profile/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Avatar removed successfully');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/profile/avatar')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('GET /api/profile/export', () => {
    test('should export user data successfully', async () => {
      const response = await request(app)
        .get('/api/profile/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-disposition']).toMatch(/attachment; filename="profile-export-\d{4}-\d{2}-\d{2}\.json"/);
      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');

      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.id).toBe(mockUser.id);
      expect(response.body.profile.email).toBe(mockUser.email);
      expect(response.body.games).toEqual([]);
      expect(response.body.achievements).toEqual([]);
      expect(response.body.exportedAt).toBeDefined();
      expect(response.body.exportVersion).toBe('1.0');
    });

    test('should require authentication for data export', async () => {
      const response = await request(app)
        .get('/api/profile/export')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_REQUIRED');
    });

    test('should handle user not found during export', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/profile/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /api/profile/sessions', () => {
    test('should get user sessions successfully', async () => {
      const response = await request(app)
        .get('/api/profile/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.sessions).toBeDefined();
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThan(0);

      const session = response.body.sessions[0];
      expect(session.id).toBeDefined();
      expect(session.device).toBeDefined();
      expect(session.isCurrent).toBe(true);
    });

    test('should require authentication for sessions', async () => {
      const response = await request(app)
        .get('/api/profile/sessions')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle malformed JSON
    });

    test('should handle large request payloads', async () => {
      const largeData = {
        bio: 'x'.repeat(10000) // Much larger than allowed
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});
