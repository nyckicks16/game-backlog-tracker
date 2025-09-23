import { PrismaClient } from '@prisma/client';

// Create a single instance of PrismaClient
const prisma = new PrismaClient();

// Test database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
async function disconnectDatabase() {
  await prisma.$disconnect();
}

export {
  prisma,
  connectDatabase,
  disconnectDatabase
};