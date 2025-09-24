// Test setup configuration
import { jest } from '@jest/globals';

// Set test timeout
jest.setTimeout(10000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// Global test utilities
global.testUser = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  provider: 'google',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Console warning suppression for tests
const originalConsoleWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
});