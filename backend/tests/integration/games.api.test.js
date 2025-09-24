/**
 * Integration Tests for Games API
 * User Story #12: Integration Testing
 * 
 * End-to-end testing of game backlog functionality
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken } from '../../utils/jwt.js';

// Create mock objects first
const mockPrismaUser = {
  findUnique: jest.fn(),
};

const mockPrismaGame = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  groupBy: jest.fn(),
};

const mockPrismaUserGame = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

// Mock Prisma for controlled testing
jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: mockPrismaUser,
    game: mockPrismaGame,
    userGame: mockPrismaUserGame,
  })),
}));

// Mock token blacklist
jest.unstable_mockModule('../../utils/tokenBlacklist.js', () => ({
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
}));

// Mock IGDB API
jest.unstable_mockModule('../../services/igdb.js', () => ({
  searchGames: jest.fn(),
  getGameDetails: jest.fn(),
}));

const prisma = new PrismaClient();

describe('Games API Integration Tests', () => {
  let app;
  let authToken;
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockGame = {
    id: 1,
    igdbId: 12345,
    title: 'Test Game',
    summary: 'A test game for testing',
    releaseDate: new Date('2023-01-01'),
    genres: JSON.stringify(['Action', 'Adventure']),
    platforms: JSON.stringify(['PC', 'PS5']),
    coverUrl: 'https://example.com/cover.jpg',
    metacriticScore: 85,
    screenshotUrls: JSON.stringify(['https://example.com/screenshot.jpg']),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockUserGame = {
    id: 1,
    userId: 1,
    gameId: 1,
    status: 'want_to_play',
    priority: 3,
    personalRating: null,
    personalNotes: '',
    hoursPlayed: 0,
    completionPercentage: 0,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    game: mockGame
  };

  beforeAll(async () => {
    // Create a minimal Express app for testing
    const express = (await import('express')).default;
    const gamesRoutes = (await import('../../routes/games.js')).default;
    
    app = express();
    app.use(express.json());
    app.use('/api/games', gamesRoutes);
    
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
      update: jest.fn().mockResolvedValue(mockUser)
    };

    prisma.game = {
      findFirst: jest.fn().mockResolvedValue(mockGame),
      findUnique: jest.fn().mockResolvedValue(mockGame),
      create: jest.fn().mockResolvedValue(mockGame),
      update: jest.fn().mockResolvedValue(mockGame)
    };

    prisma.userGame = {
      findFirst: jest.fn().mockResolvedValue(mockUserGame),
      findUnique: jest.fn().mockResolvedValue(mockUserGame),
      findMany: jest.fn().mockResolvedValue([mockUserGame]),
      create: jest.fn().mockResolvedValue(mockUserGame),
      update: jest.fn().mockResolvedValue(mockUserGame),
      delete: jest.fn().mockResolvedValue(mockUserGame),
      count: jest.fn().mockResolvedValue(1)
    };
  });

  describe('POST /api/games', () => {
    test('should add game to backlog successfully', async () => {
      const gameData = {
        igdbId: 12345,
        status: 'want_to_play',
        priority: 3
      };

      prisma.game.create.mockResolvedValue(mockGame);
      prisma.userGame.create.mockResolvedValue(mockUserGame);

      const response = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameData)
        .expect(201);

      expect(response.body.message).toBe('Game added to backlog');
      expect(response.body.userGame).toMatchObject({
        status: gameData.status,
        priority: gameData.priority,
        game: expect.objectContaining({
          title: mockGame.title
        })
      });

      expect(prisma.userGame.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          gameId: mockGame.id,
          status: gameData.status,
          priority: gameData.priority
        },
        include: { game: true }
      });
    });

    test('should handle game already in backlog', async () => {
      prisma.userGame.findUnique.mockResolvedValue(mockUserGame);

      const response = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ igdbId: 12345, status: 'want_to_play' })
        .expect(400);

      expect(response.body.error).toBe('Game already in your backlog');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ igdbId: 12345 }) // Missing status
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    test('should validate status enum', async () => {
      const response = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ igdbId: 12345, status: 'invalid_status' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate priority range', async () => {
      const response = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ igdbId: 12345, status: 'want_to_play', priority: 6 })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({ igdbId: 12345, status: 'want_to_play' })
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('GET /api/games/backlog', () => {
    test('should get user backlog successfully', async () => {
      prisma.userGame.findMany.mockResolvedValue([mockUserGame]);

      const response = await request(app)
        .get('/api/games/backlog')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.games).toHaveLength(1);
      expect(response.body.games[0]).toMatchObject({
        id: mockUserGame.id,
        status: mockUserGame.status,
        priority: mockUserGame.priority,
        game: expect.objectContaining({
          title: mockGame.title
        })
      });

      expect(response.body.pagination).toBeDefined();
      expect(response.body.filters).toBeDefined();
    });

    test('should filter games by status', async () => {
      const filteredGames = [{ ...mockUserGame, status: 'playing' }];
      prisma.userGame.findMany.mockResolvedValue(filteredGames);

      const response = await request(app)
        .get('/api/games/backlog?status=playing')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(prisma.userGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'playing'
          })
        })
      );
    });

    test('should filter games by priority', async () => {
      const response = await request(app)
        .get('/api/games/backlog?priority=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(prisma.userGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 1
          })
        })
      );
    });

    test('should search games by title', async () => {
      const response = await request(app)
        .get('/api/games/backlog?search=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(prisma.userGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            game: expect.objectContaining({
              title: expect.objectContaining({
                contains: 'test'
              })
            })
          })
        })
      );
    });

    test('should sort games correctly', async () => {
      const response = await request(app)
        .get('/api/games/backlog?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(prisma.userGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { game: { title: 'asc' } }
        })
      );
    });

    test('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/games/backlog?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(prisma.userGame.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5
        })
      );
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/games/backlog')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('PUT /api/games/:id', () => {
    test('should update game status successfully', async () => {
      const updateData = {
        status: 'completed',
        personalRating: 4,
        personalNotes: 'Great game!',
        hoursPlayed: 25
      };

      const updatedUserGame = { ...mockUserGame, ...updateData };
      prisma.userGame.update.mockResolvedValue(updatedUserGame);

      const response = await request(app)
        .put('/api/games/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Game updated successfully');
      expect(response.body.userGame).toMatchObject({
        status: updateData.status,
        personalRating: updateData.personalRating
      });

      expect(prisma.userGame.update).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        data: expect.objectContaining(updateData),
        include: { game: true }
      });
    });

    test('should auto-set completion date when marking as completed', async () => {
      const updateData = { status: 'completed' };
      const updatedUserGame = { 
        ...mockUserGame, 
        ...updateData,
        completedAt: new Date()
      };
      prisma.userGame.update.mockResolvedValue(updatedUserGame);

      const response = await request(app)
        .put('/api/games/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(prisma.userGame.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completedAt: expect.any(Date)
          })
        })
      );
    });

    test('should validate rating range', async () => {
      const response = await request(app)
        .put('/api/games/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ personalRating: 6 })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate notes length', async () => {
      const response = await request(app)
        .put('/api/games/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ personalNotes: 'x'.repeat(1001) })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle game not found', async () => {
      prisma.userGame.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/games/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(404);

      expect(response.body.error).toBe('Game not found in your backlog');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put('/api/games/1')
        .send({ status: 'completed' })
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('DELETE /api/games/:id', () => {
    test('should remove game from backlog successfully', async () => {
      prisma.userGame.delete.mockResolvedValue(mockUserGame);

      const response = await request(app)
        .delete('/api/games/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Game removed from backlog');

      expect(prisma.userGame.delete).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id }
      });
    });

    test('should handle game not found', async () => {
      prisma.userGame.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/games/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Game not found in your backlog');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/games/1')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('GET /api/games/search', () => {
    beforeEach(async () => {
      const { searchGames } = await import('../../services/igdb.js');
      searchGames.mockResolvedValue([
        {
          id: 12345,
          name: 'Test Game',
          summary: 'A test game',
          first_release_date: 1640995200,
          genres: [{ name: 'Action' }],
          platforms: [{ name: 'PC' }],
          cover: { url: '//example.com/cover.jpg' },
          total_rating: 85
        }
      ]);
    });

    test('should search games successfully', async () => {
      const response = await request(app)
        .get('/api/games/search?q=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.games).toHaveLength(1);
      expect(response.body.games[0]).toMatchObject({
        igdbId: 12345,
        title: 'Test Game',
        summary: 'A test game'
      });
    });

    test('should require search query', async () => {
      const response = await request(app)
        .get('/api/games/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Search query is required');
    });

    test('should handle IGDB API errors', async () => {
      const { searchGames } = await import('../../services/igdb.js');
      searchGames.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/games/search?q=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBe('Failed to search games');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/games/search?q=test')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('GET /api/games/stats', () => {
    beforeEach(() => {
      prisma.userGame.count.mockImplementation(({ where }) => {
        if (where?.status === 'completed') return Promise.resolve(5);
        if (where?.status === 'playing') return Promise.resolve(2);
        if (where?.status === 'want_to_play') return Promise.resolve(10);
        if (where?.status === 'dropped') return Promise.resolve(1);
        return Promise.resolve(18);
      });

      prisma.userGame.findMany.mockResolvedValue([
        { ...mockUserGame, personalRating: 4 },
        { ...mockUserGame, personalRating: 5 }
      ]);
    });

    test('should get user game statistics', async () => {
      const response = await request(app)
        .get('/api/games/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        totalGames: 18,
        completed: 5,
        playing: 2,
        wantToPlay: 10,
        dropped: 1,
        averageRating: expect.any(Number)
      });

      expect(response.body.completionRate).toBeCloseTo(27.78, 1);
    });

    test('should handle zero games gracefully', async () => {
      prisma.userGame.count.mockResolvedValue(0);
      prisma.userGame.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/games/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        totalGames: 0,
        completed: 0,
        completionRate: 0,
        averageRating: 0
      });
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/games/stats')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      prisma.userGame.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/games/backlog')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch games');
    });

    test('should handle invalid game IDs', async () => {
      const response = await request(app)
        .get('/api/games/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Assuming validation middleware handles this
    });

    test('should validate numeric parameters', async () => {
      const response = await request(app)
        .get('/api/games/backlog?page=invalid&limit=abc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Query parameter validation should handle this
    });
  });
});