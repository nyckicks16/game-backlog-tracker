/**
 * Background Jobs for Session Management (User Story #10)
 * Handles periodic cleanup of expired sessions and tokens
 */
import cron from 'node-cron';
import { cleanupExpiredTokens } from '../utils/tokenBlacklist.js';
import { prisma } from '../db/database.js';

/**
 * Clean up expired blacklisted tokens
 * Runs every hour
 */
const scheduleTokenCleanup = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Starting scheduled token cleanup...');
      const cleanedCount = await cleanupExpiredTokens();
      console.log(`✅ Token cleanup complete: ${cleanedCount} expired tokens removed`);
    } catch (error) {
      console.error('❌ Token cleanup failed:', error);
    }
  }, {
    timezone: 'UTC',
    name: 'tokenCleanup'
  });

  console.log('📅 Token cleanup job scheduled (every hour)');
};

/**
 * Clean up expired sessions from session store
 * Runs every 6 hours
 */
const scheduleSessionCleanup = () => {
  // Run every 6 hours at minute 0
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('Starting scheduled session cleanup...');
      
      // Clean up expired sessions (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Note: This would require a custom session cleanup based on your session store
      // For SQLite session store, you might need to manually clean the sessions table
      // For now, we'll just log that this should be implemented
      console.log('⚠️  Manual session cleanup needed - implement based on session store type');
      console.log('📊 Session cleanup task completed');
    } catch (error) {
      console.error('❌ Session cleanup failed:', error);
    }
  }, {
    timezone: 'UTC',
    name: 'sessionCleanup'
  });

  console.log('📅 Session cleanup job scheduled (every 6 hours)');
};

/**
 * Auto-unlock accounts that have passed their lockout time
 * Runs every 5 minutes
 */
const scheduleAccountUnlock = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      // Find accounts that should be unlocked (lockedUntil time has passed)
      const usersToUnlock = await prisma.user.findMany({
        where: {
          AND: [
            { lockedUntil: { not: null } },
            { lockedUntil: { lte: new Date() } },
          ],
        },
        select: { id: true, email: true, username: true, lockedUntil: true },
      });

      if (usersToUnlock.length > 0) {
        console.log(`🔓 Auto-unlocking ${usersToUnlock.length} accounts...`);
        
        // Reset failed attempts and clear lockout
        await prisma.user.updateMany({
          where: {
            id: {
              in: usersToUnlock.map(user => user.id),
            },
          },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        usersToUnlock.forEach(user => {
          console.log(`✅ Auto-unlocked account: ${user.username} (${user.email})`);
        });
      }
    } catch (error) {
      console.error('❌ Account unlock job failed:', error);
    }
  }, {
    timezone: 'UTC',
    name: 'accountUnlock'
  });

  console.log('📅 Account unlock job scheduled (every 5 minutes)');
};

/**
 * Clean up old refresh tokens from users who haven't logged in for 30 days
 * Runs daily at 2 AM
 */
const scheduleStaleTokenCleanup = () => {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Starting stale token cleanup...');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await prisma.user.updateMany({
        where: {
          AND: [
            { refreshToken: { not: null } },
            {
              OR: [
                { lastLogin: { lt: thirtyDaysAgo } },
                { lastLogin: null },
              ],
            },
          ],
        },
        data: {
          refreshToken: null,
        },
      });

      console.log(`🧹 Cleaned up ${result.count} stale refresh tokens`);
    } catch (error) {
      console.error('❌ Stale token cleanup failed:', error);
    }
  }, {
    timezone: 'UTC',
    name: 'staleTokenCleanup'
  });

  console.log('📅 Stale token cleanup job scheduled (daily at 2 AM)');
};

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduledJobs = () => {
  console.log('🚀 Initializing scheduled background jobs...');
  
  scheduleTokenCleanup();
  scheduleSessionCleanup();
  scheduleAccountUnlock();
  scheduleStaleTokenCleanup();
  
  console.log('✅ All scheduled jobs initialized successfully');
  
  // Log active jobs
  const tasks = cron.getTasks();
  console.log(`📊 Active cron jobs: ${tasks.size}`);
  tasks.forEach((task, name) => {
    console.log(`   - ${name}: ${task.options?.scheduled ? 'Running' : 'Stopped'}`);
  });
};

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export const stopScheduledJobs = () => {
  console.log('🛑 Stopping all scheduled jobs...');
  
  const tasks = cron.getTasks();
  tasks.forEach((task, name) => {
    task.stop();
    console.log(`   - Stopped: ${name}`);
  });
  
  console.log('✅ All scheduled jobs stopped');
};

/**
 * Get status of all scheduled jobs
 */
export const getJobStatus = () => {
  const tasks = cron.getTasks();
  const status = {};
  
  tasks.forEach((task, name) => {
    status[name] = {
      name,
      running: task.options?.scheduled || false,
      nextRun: task.nextDate ? task.nextDate().toISOString() : null,
    };
  });
  
  return status;
};