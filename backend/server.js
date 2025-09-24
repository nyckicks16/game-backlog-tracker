import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import ConnectSQLite3 from 'connect-sqlite3';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import { connectDatabase, disconnectDatabase, prisma } from './db/database.js';
import { initializeScheduledJobs, stopScheduledJobs } from './jobs/sessionJobs.js';
import { validateEnvironmentSecurity, displaySecurityConfig } from './utils/environmentSecurity.js';
import { getContentSecurityPolicy, additionalSecurityHeaders, authSecurityHeaders } from './utils/securityHeaders.js';
import { initializeSecurityLogging, logRateLimitExceeded, logSecurityEvent, SEVERITY_LEVELS } from './utils/securityLogging.js';

// Load environment variables
dotenv.config();

// Validate environment security before starting
try {
  validateEnvironmentSecurity();
} catch (error) {
  console.error('🚫 Server startup failed due to environment security issues');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Create SQLite session store
const SQLiteStore = ConnectSQLite3(session);

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later',
    status: 429,
  },
  skip: (req) => {
    // Skip rate limiting for successful authentication status checks
    return req.path === '/auth/status' && req.method === 'GET';
  },
  onLimitReached: (req) => {
    logRateLimitExceeded('auth_endpoints', { 
      path: req.path,
      method: req.method 
    }, req);
  },
});

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: getContentSecurityPolicy(),
  hsts: {
    maxAge: process.env.NODE_ENV === 'production' ? 31536000 : 0,
    includeSubDomains: process.env.NODE_ENV === 'production',
    preload: process.env.NODE_ENV === 'production',
  },
}));

// Additional security headers
app.use(additionalSecurityHeaders);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Static file serving for uploaded avatars
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './prisma',
    table: 'sessions',
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Basic logging middleware
app.use((req, res, next) => {
  // Redact sensitive headers from logs
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) safeHeaders.authorization = '[REDACTED]';
  if (safeHeaders.cookie) safeHeaders.cookie = '[REDACTED]';
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      message: 'Game Backlog Tracker API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'Connected'
    });
  } catch {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'Disconnected'
    });
  }
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Game Backlog Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/auth'
    }
  });
});

// Authentication routes with rate limiting and security headers
app.use('/auth', authLimiter, authSecurityHeaders, authRoutes);

// Profile routes (protected by authentication middleware within routes)
app.use('/api/profile', profileRoutes);

// Admin routes (protected by authentication middleware within routes)
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server`
  });
});

// Global error handler
app.use((error, req, res, _next) => {
  // Log security-relevant errors
  if (error.status === 401 || error.status === 403) {
    logSecurityEvent(
      'security_error',
      SEVERITY_LEVELS.MEDIUM,
      `Security error: ${error.message}`,
      { status: error.status, path: req.path },
      req
    );
  }
  
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server with database connection
async function startServer() {
  try {
    // Initialize security logging
    initializeSecurityLogging();
    
    // Connect to database
    await connectDatabase();
    
    // Initialize scheduled jobs for session management
    initializeScheduledJobs();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Game Backlog Tracker API running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      
      // Display security configuration
      displaySecurityConfig();
      
      console.log('\n✅ Server started successfully with enhanced security\n');
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
      console.log(`🗄️  Database: SQLite (Prisma)`);
      console.log(`🔧 Background jobs: Active`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down server...');
  stopScheduledJobs();
  await disconnectDatabase();
  console.log('👋 Server stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down server...');
  stopScheduledJobs();
  await disconnectDatabase();
  console.log('👋 Server stopped');
  process.exit(0);
});

// Start the server
startServer();

export default app;