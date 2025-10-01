/**
 * Games API Routes (User Story #14)
 * Handles game search, library management, and statistics
 */
import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { searchGames, getGameDetails, getPopularGames } from '../services/igdb.js';

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

      // Use real IGDB API service
      const games = await searchGames(q, parseInt(limit), parseInt(offset));

      res.json({
        games,
        total: games.length, // Note: IGDB doesn't provide total count easily
        limit: parseInt(limit),
        offset: parseInt(offset),
        query: q
      });
    } catch (error) {
      console.error('Game search error:', error);
      
      // Handle specific error types
      if (error.message.includes('authentication failed')) {
        return res.status(502).json({ 
          error: 'Game database service unavailable',
          message: 'Please try again later.',
          retryable: true
        });
      }
      
      if (error.message.includes('rate limit exceeded')) {
        return res.status(429).json({ 
          error: 'Too many requests',
          message: 'Please wait a moment before searching again.',
          retryable: true
        });
      }
      
      if (error.message.includes('unavailable')) {
        return res.status(503).json({ 
          error: 'Game database temporarily unavailable',
          message: 'Please try again in a few minutes.',
          retryable: true
        });
      }
      
      res.status(500).json({ 
        error: 'Game search failed',
        message: 'An unexpected error occurred. Please try again.',
        retryable: true
      });
    }
  }
);

/**
 * GET /api/games/:id/details
 * Get detailed information about a specific game from IGDB
 */
router.get('/:id/details',
  authenticateToken,
  searchRateLimit,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          error: 'Valid game ID is required'
        });
      }

      // Get detailed game information from IGDB
      const gameDetails = await getGameDetails(parseInt(id));

      // Check if user already has this game in their library
      const userGame = await prisma.game.findFirst({
        where: {
          userId: req.user.id,
          igdbId: parseInt(id)
        }
      });

      res.json({
        ...gameDetails,
        inLibrary: !!userGame,
        userStatus: userGame?.status || null,
        userRating: userGame?.userRating || null,
        userNotes: userGame?.notes || null
      });
    } catch (error) {
      console.error('Game details error:', error);
      
      if (error.message.includes('Game not found')) {
        return res.status(404).json({ 
          error: 'Game not found',
          message: 'The requested game could not be found.'
        });
      }
      
      if (error.message.includes('authentication failed')) {
        return res.status(502).json({ 
          error: 'Game database service unavailable',
          message: 'Please try again later.',
          retryable: true
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to get game details',
        message: 'An unexpected error occurred. Please try again.',
        retryable: true
      });
    }
  }
);

/**
 * GET /api/games/popular
 * Get popular/trending games from IGDB
 */
router.get('/popular',
  authenticateToken,
  searchRateLimit,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
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

      const { limit = 20 } = req.query;
      const games = await getPopularGames(parseInt(limit));

      res.json({
        games,
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Popular games error:', error);
      res.status(500).json({ 
        error: 'Failed to get popular games',
        message: 'An unexpected error occurred. Please try again.',
        retryable: true
      });
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
      .isIn(['wishlist', 'playing', 'completed', 'on_hold'])
      .withMessage('Invalid game status'),
    body('userRating')
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage('User rating must be between 1 and 5'),
    body('notes')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Notes must not exceed 2000 characters')
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
        igdbId, 
        name, 
        summary,
        status = 'wishlist', 
        userRating, 
        notes, 
        coverUrl, 
        releaseDate, 
        platforms, 
        genres,
        developer,
        publisher,
        rating
      } = req.body;
      const userId = req.user.id;

      // Check if game already exists in user's library
      const existingGame = await prisma.game.findFirst({
        where: {
          userId,
          igdbId: parseInt(igdbId)
        }
      });

      if (existingGame) {
        return res.status(409).json({ 
          error: 'Game already in library',
          message: 'This game is already in your library.',
          game: existingGame
        });
      }

      const game = await prisma.game.create({
        data: {
          userId,
          igdbId: parseInt(igdbId),
          name,
          summary: summary || null,
          status,
          userRating: userRating ? parseFloat(userRating) : null,
          notes: notes || null,
          coverUrl: coverUrl || null,
          releaseDate: releaseDate ? new Date(releaseDate) : null,
          platforms: platforms ? JSON.stringify(platforms) : null,
          genres: genres ? JSON.stringify(genres) : null,
          developer: developer || null,
          publisher: publisher || null,
          rating: rating ? parseFloat(rating) : null
        }
      });

      res.status(201).json({
        message: 'Game added to library successfully',
        game: {
          id: game.id,
          igdbId: game.igdbId,
          name: game.name,
          summary: game.summary,
          status: game.status,
          userRating: game.userRating,
          notes: game.notes,
          coverUrl: game.coverUrl,
          releaseDate: game.releaseDate,
          platforms: game.platforms ? JSON.parse(game.platforms) : null,
          genres: game.genres ? JSON.parse(game.genres) : null,
          developer: game.developer,
          publisher: game.publisher,
          rating: game.rating,
          addedAt: game.addedAt,
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
      .isIn(['name', 'addedAt', 'updatedAt', 'userRating', 'releaseDate'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Invalid sort order')
  ],
  async (req, res) => {
    try {
      console.log('🎮 GET /api/games - Starting request');
      console.log('- User ID:', req.user?.id);
      console.log('- Query params:', req.query);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { 
        status, 
        limit = 20, 
        offset = 0, 
        sort = 'addedAt', 
        order = 'desc' 
      } = req.query;
      const userId = req.user.id;

      const where = { userId };
      if (status) {
        where.status = status;
      }

      console.log('🔍 Querying database with:', { where, limit, offset, sort, order });

      const games = await prisma.game.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: {
          [sort]: order
        }
      });

      console.log('📊 Found games:', games.length);

      const total = await prisma.game.count({ where });
      console.log('📊 Total count:', total);

      const formattedGames = games.map(game => {
        console.log('🎯 Formatting game:', game.id, game.name);
        try {
          return {
            id: game.id,
            igdbId: game.igdbId,
            name: game.name,
            status: game.status,
            rating: game.userRating, // Use userRating from schema
            notes: game.notes,
            coverUrl: game.coverUrl,
            releaseDate: game.releaseDate,
            platforms: game.platforms ? JSON.parse(game.platforms) : null,
            genres: game.genres ? JSON.parse(game.genres) : null,
            createdAt: game.addedAt, // Use addedAt from schema
            updatedAt: game.updatedAt
          };
        } catch (parseError) {
          console.error('❌ JSON parse error for game:', game.id, parseError);
          throw parseError;
        }
      });

      console.log('✅ Successfully formatted all games');

      res.json({
        games: formattedGames,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('❌ Get games error:', error);
      console.error('- Error name:', error.name);
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
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