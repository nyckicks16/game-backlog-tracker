import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase, prisma } from './db/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
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
      api: '/api'
    }
  });
});

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server`
  });
});

// Global error handler
app.use((error, req, res, _next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server with database connection
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Game Backlog Tracker API running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
      console.log(`🗄️  Database: SQLite (Prisma)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down server...');
  await disconnectDatabase();
  console.log('👋 Server stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down server...');
  await disconnectDatabase();
  console.log('👋 Server stopped');
  process.exit(0);
});

// Start the server
startServer();

export default app;