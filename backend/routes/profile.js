import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import Joi from 'joi';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { fileURLToPath } from 'url';

const router = express.Router();
const prisma = new PrismaClient();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Validation schemas
const profileUpdateSchema = Joi.object({
  displayName: Joi.string().min(2).max(50).optional().allow(''),
  bio: Joi.string().max(500).optional().allow(''),
  theme: Joi.string().valid('dark', 'light', 'auto').optional(),
  preferences: Joi.object({
    notifications: Joi.object({
      gameUpdates: Joi.boolean().optional(),
      achievements: Joi.boolean().optional(),
      system: Joi.boolean().optional(),
    }).optional(),
    privacy: Joi.object({
      profileVisible: Joi.boolean().optional(),
      statisticsVisible: Joi.boolean().optional(),
    }).optional(),
    gaming: Joi.object({
      favoriteGenres: Joi.array().items(Joi.string()).optional(),
      platforms: Joi.array().items(Joi.string()).optional(),
    }).optional(),
  }).optional(),
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
(async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create uploads directory:', error);
  }
})();

// GET /api/profile - Get user profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        profilePicture: true,
        theme: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse preferences JSON string
    let preferences = {};
    if (user.preferences) {
      try {
        preferences = JSON.parse(user.preferences);
      } catch (error) {
        console.error('Failed to parse user preferences:', error);
        preferences = {};
      }
    }

    // Calculate profile statistics (placeholder - will be expanded with game data)
    const stats = {
      totalGames: 0,
      completedGames: 0,
      hoursPlayed: 0,
      achievements: 0,
    };

    res.json({
      ...user,
      preferences,
      stats,
      // Use avatarUrl if available, otherwise fallback to Google profile picture
      profileImage: user.avatarUrl || user.profilePicture,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile - Update user profile
router.put('/', requireAuth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = profileUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const updateData = {
      displayName: value.displayName || null,
      bio: value.bio || null,
      theme: value.theme,
    };

    // Handle preferences separately as JSON
    if (value.preferences) {
      updateData.preferences = JSON.stringify(value.preferences);
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        profilePicture: true,
        theme: true,
        preferences: true,
        updatedAt: true,
      },
    });

    // Parse preferences for response
    let preferences = {};
    if (updatedUser.preferences) {
      try {
        preferences = JSON.parse(updatedUser.preferences);
      } catch (error) {
        console.error('Failed to parse updated preferences:', error);
      }
    }

    res.json({
      ...updatedUser,
      preferences,
      profileImage: updatedUser.avatarUrl || updatedUser.profilePicture,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/profile/avatar - Upload user avatar
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user.id;
    const filename = `avatar-${userId}-${Date.now()}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    // Process and resize image
    await sharp(req.file.buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(filepath);

    // Update user record with avatar URL
    const avatarUrl = `/uploads/${filename}`;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
        profilePicture: true,
      },
    });

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: updatedUser.avatarUrl,
      profileImage: updatedUser.avatarUrl || updatedUser.profilePicture,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// DELETE /api/profile/avatar - Remove user avatar
router.delete('/avatar', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true },
    });

    if (user && user.avatarUrl) {
      // Delete physical file
      const filename = path.basename(user.avatarUrl);
      const filepath = path.join(uploadsDir, filename);
      try {
        await fs.unlink(filepath);
      } catch (fileError) {
        console.warn('Failed to delete avatar file:', fileError);
        // Continue with database update even if file deletion fails
      }
    }

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null },
      select: {
        id: true,
        avatarUrl: true,
        profilePicture: true,
      },
    });

    res.json({
      message: 'Avatar removed successfully',
      avatarUrl: null,
      profileImage: updatedUser.profilePicture, // Fallback to Google profile picture
    });
  } catch (error) {
    console.error('Avatar removal error:', error);
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

// GET /api/profile/export - Export user data (GDPR compliance)
router.get('/export', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        displayName: true,
        bio: true,
        theme: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        provider: true,
        // Note: Exclude sensitive fields like tokens, passwords, etc.
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse preferences
    let preferences = {};
    if (user.preferences) {
      try {
        preferences = JSON.parse(user.preferences);
      } catch (error) {
        preferences = {};
      }
    }

    const exportData = {
      profile: {
        ...user,
        preferences,
      },
      // Future: Add games data, achievements, etc.
      games: [],
      achievements: [],
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    };

    // Set proper headers for download
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="profile-export-${timestamp}.json"`);
    res.setHeader('Content-Type', 'application/json');

    res.json(exportData);
  } catch (error) {
    console.error('Profile export error:', error);
    res.status(500).json({ error: 'Failed to export profile data' });
  }
});

// GET /api/profile/sessions - Get active sessions (placeholder for session management)
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    // This is a placeholder - actual session management would require
    // storing session data with device/location information
    const sessions = [
      {
        id: '1',
        device: 'Current Device',
        browser: 'Chrome',
        os: 'Windows 10',
        location: 'Unknown',
        lastActive: new Date().toISOString(),
        isCurrent: true,
      }
    ];

    res.json({ sessions });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }
  next(error);
});

export default router;