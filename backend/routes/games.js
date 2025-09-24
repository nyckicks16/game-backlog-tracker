/**
 * Games API Routes (User Story #1)
 * Handles game search, library management, and statistics
 */
import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for search API
const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many search requests, please try again later.' }
});

/**
 * GET /api/games/search
 * Search for games using IGDB API
 */
router.get('/search', 
  authenticateToken,
  searchRateLimit,
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { q, limit = 10, offset = 0 } = req.query;

      // Mock IGDB API response for testing
      const mockGames = [
        {
          id: 1,
          name: `${q} Game 1`,
          cover: { url: 'https://example.com/cover1.jpg' },
          summary: `This is a test game matching "${q}"`,
          first_release_date: Date.now() / 1000,
          platforms: [{ name: 'PC' }],
          genres: [{ name: 'Action' }]
        },
        {
          id: 2,
          name: `${q} Game 2`,
          cover: { url: 'https://example.com/cover2.jpg' },
          summary: `Another test game matching "${q}"`,
          first_release_date: Date.now() / 1000,
          platforms: [{ name: 'PlayStation' }],
          genres: [{ name: 'RPG' }]
        }
      ];

      // Simulate pagination
      const paginatedGames = mockGames.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      res.json({
        games: paginatedGames,
        total: mockGames.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Game search error:', error);
      res.status(500).json({ error: 'Failed to search games' });
    }
  }
);

/**
 * POST /api/games
 * Add a game to user's library
 */
router.post('/',
  authenticateToken,
  [
    body('igdbId')
      .isInt({ min: 1 })
      .withMessage('Valid IGDB ID is required'),
    body('name')
      .notEmpty()
      .withMessage('Game name is required')
      .isLength({ max: 255 })
      .withMessage('Game name must not exceed 255 characters'),
    body('status')
      .optional()
      .isIn(['want_to_play', 'playing', 'completed', 'dropped'])
      .withMessage('Invalid game status'),
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating must be between 0 and 5'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { igdbId, name, status = 'want_to_play', rating, notes, coverUrl, releaseDate, platforms, genres } = req.body;
      const userId = req.user.id;

      // Check if game already exists in user's library
      const existingGame = await prisma.game.findFirst({
        where: {
          userId,
          igdbId: parseInt(igdbId)
        }
      });

      if (existingGame) {
        return res.status(409).json({ error: 'Game already in library' });
      }

      const game = await prisma.game.create({
        data: {
          userId,
          igdbId: parseInt(igdbId),
          name,
          status,
          rating: rating ? parseFloat(rating) : null,
          notes,
          coverUrl,
          releaseDate: releaseDate ? new Date(releaseDate) : null,
          platforms: platforms ? JSON.stringify(platforms) : null,
          genres: genres ? JSON.stringify(genres) : null
        }
      });

      res.status(201).json({
        message: 'Game added to library successfully',
        game: {
          id: game.id,
          igdbId: game.igdbId,
          name: game.name,
          status: game.status,
          rating: game.rating,
          notes: game.notes,
          coverUrl: game.coverUrl,
          releaseDate: game.releaseDate,
          platforms: game.platforms ? JSON.parse(game.platforms) : null,
          genres: game.genres ? JSON.parse(game.genres) : null,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt
        }
      });
    } catch (error) {
      console.error('Add game error:', error);
      res.status(500).json({ error: 'Failed to add game to library' });
    }
  }
);

/**
 * GET /api/games/stats
 * Get user's game statistics
 */
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const stats = await prisma.game.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true
        }
      });

      const totalGames = await prisma.game.count({
        where: { userId }
      });

      const averageRating = await prisma.game.aggregate({
        where: {
          userId,
          rating: {
            not: null
          }
        },
        _avg: {
          rating: true
        }
      });

      const formattedStats = {
        total: totalGames,
        by_status: {
          want_to_play: 0,
          playing: 0,
          completed: 0,
          dropped: 0
        },
        average_rating: averageRating._avg.rating || 0
      };

      stats.forEach(stat => {
        formattedStats.by_status[stat.status] = stat._count.status;
      });

      res.json(formattedStats);
    } catch (error) {
      console.error('Game stats error:', error);
      res.status(500).json({ error: 'Failed to fetch game statistics' });
    }
  }
);

/**
 * GET /api/games
 * Get user's game library
 */
router.get('/',
  authenticateToken,
  [
    query('status')
      .optional()
      .isIn(['want_to_play', 'playing', 'completed', 'dropped'])
      .withMessage('Invalid status filter'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
    query('sort')
      .optional()
      .isIn(['name', 'createdAt', 'updatedAt', 'rating', 'releaseDate'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Invalid sort order')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { 
        status, 
        limit = 20, 
        offset = 0, 
        sort = 'createdAt', 
        order = 'desc' 
      } = req.query;
      const userId = req.user.id;

      const where = { userId };
      if (status) {
        where.status = status;
      }

      const games = await prisma.game.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: {
          [sort]: order
        }
      });

      const total = await prisma.game.count({ where });

      const formattedGames = games.map(game => ({
        id: game.id,
        igdbId: game.igdbId,
        name: game.name,
        status: game.status,
        rating: game.rating,
        notes: game.notes,
        coverUrl: game.coverUrl,
        releaseDate: game.releaseDate,
        platforms: game.platforms ? JSON.parse(game.platforms) : null,
        genres: game.genres ? JSON.parse(game.genres) : null,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt
      }));

      res.json({
        games: formattedGames,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get games error:', error);
      res.status(500).json({ error: 'Failed to fetch games' });
    }
  }
);

/**
 * PUT /api/games/:id
 * Update a game in user's library
 */
router.put('/:id',
  authenticateToken,
  [
    body('status')
      .optional()
      .isIn(['want_to_play', 'playing', 'completed', 'dropped'])
      .withMessage('Invalid game status'),
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating must be between 0 and 5'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const gameId = parseInt(req.params.id);
      const userId = req.user.id;
      const { status, rating, notes } = req.body;

      if (isNaN(gameId)) {
        return res.status(400).json({ error: 'Invalid game ID' });
      }

      // Verify game belongs to user
      const existingGame = await prisma.game.findFirst({
        where: {
          id: gameId,
          userId
        }
      });

      if (!existingGame) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (rating !== undefined) updateData.rating = rating ? parseFloat(rating) : null;
      if (notes !== undefined) updateData.notes = notes;

      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: updateData
      });

      res.json({
        message: 'Game updated successfully',
        game: {
          id: updatedGame.id,
          igdbId: updatedGame.igdbId,
          name: updatedGame.name,
          status: updatedGame.status,
          rating: updatedGame.rating,
          notes: updatedGame.notes,
          coverUrl: updatedGame.coverUrl,
          releaseDate: updatedGame.releaseDate,
          platforms: updatedGame.platforms ? JSON.parse(updatedGame.platforms) : null,
          genres: updatedGame.genres ? JSON.parse(updatedGame.genres) : null,
          createdAt: updatedGame.createdAt,
          updatedAt: updatedGame.updatedAt
        }
      });
    } catch (error) {
      console.error('Update game error:', error);
      res.status(500).json({ error: 'Failed to update game' });
    }
  }
);

/**
 * DELETE /api/games/:id
 * Remove a game from user's library
 */
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const userId = req.user.id;

      if (isNaN(gameId)) {
        return res.status(400).json({ error: 'Invalid game ID' });
      }

      // Verify game belongs to user
      const existingGame = await prisma.game.findFirst({
        where: {
          id: gameId,
          userId
        }
      });

      if (!existingGame) {
        return res.status(404).json({ error: 'Game not found' });
      }

      await prisma.game.delete({
        where: { id: gameId }
      });

      res.json({ message: 'Game removed from library successfully' });
    } catch (error) {
      console.error('Delete game error:', error);
      res.status(500).json({ error: 'Failed to remove game from library' });
    }
  }
);

export default router;