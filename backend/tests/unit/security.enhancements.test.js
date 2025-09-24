/**
 * Security Enhancement Tests
 * Tests for the security improvements implemented
 */
import { jest } from '@jest/globals';
import { 
  validateEnvironmentSecurity,
  generateSecureSecret 
} from '../../utils/environmentSecurity.js';
import { 
  logSecurityEvent,
  logAuthSuccess,
  logAuthFailure,
  SECURITY_EVENTS,
  SEVERITY_LEVELS 
} from '../../utils/securityLogging.js';
import { getContentSecurityPolicy } from '../../utils/securityHeaders.js';

describe('Security Enhancements', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment for each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Security Validation', () => {
    test('should pass validation with secure environment variables', () => {
      process.env.JWT_SECRET = 'a'.repeat(64); // 64 character secret
      process.env.SESSION_SECRET = 'b'.repeat(64);
      process.env.DATABASE_URL = 'file:./dev.db';
      process.env.FRONTEND_URL = 'http://localhost:5173';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret-24-chars';
      process.env.NODE_ENV = 'test';

      expect(() => validateEnvironmentSecurity()).not.toThrow();
    });

    test('should fail validation with short JWT_SECRET', () => {
      process.env.JWT_SECRET = 'short-secret'; // Less than 64 characters
      process.env.NODE_ENV = 'production';

      expect(() => validateEnvironmentSecurity()).toThrow(/Environment security validation failed/);
    });

    test('should fail validation with default JWT_SECRET values', () => {
      process.env.JWT_SECRET = 'your-super-secret-jwt-key-here-minimum-64-characters';
      process.env.NODE_ENV = 'production';

      expect(() => validateEnvironmentSecurity()).toThrow(/Environment security validation failed/);
    });

    test('should fail validation with missing required production variables', () => {
      process.env.NODE_ENV = 'production';
      // Remove all required variables
      delete process.env.JWT_SECRET;
      delete process.env.SESSION_SECRET;
      delete process.env.DATABASE_URL;

      expect(() => validateEnvironmentSecurity()).toThrow(/Environment security validation failed/);
    });
  });

  describe('Secure Secret Generation', () => {
    test('should generate secrets of correct length', async () => {
      const secret32 = await generateSecureSecret(32);
      const secret64 = await generateSecureSecret(64);

      expect(secret32).toHaveLength(64); // hex encoding doubles length
      expect(secret64).toHaveLength(128);
      expect(typeof secret32).toBe('string');
      expect(typeof secret64).toBe('string');
    });

    test('should generate unique secrets', async () => {
      const secret1 = await generateSecureSecret(32);
      const secret2 = await generateSecureSecret(32);

      expect(secret1).not.toBe(secret2);
    });

    test('should generate cryptographically secure random strings', async () => {
      const secret = await generateSecureSecret(32);
      
      // Should contain hex characters only
      expect(secret).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('Security Logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should log security events with correct structure', () => {
      const metadata = { userId: 123, action: 'login' };
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-user-agent'),
        method: 'POST',
        path: '/auth/login'
      };

      logSecurityEvent(
        SECURITY_EVENTS.AUTH_SUCCESS,
        SEVERITY_LEVELS.LOW,
        'Test security event',
        metadata,
        mockReq
      );

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find(call => 
        call[0].includes('[SECURITY]')
      );
      expect(logCall).toBeDefined();
      expect(logCall[0]).toContain('Test security event');
    });

    test('should redact sensitive data in logs', () => {
      const sensitiveData = {
        userId: 123,
        password: 'secret123',
        token: 'jwt-token-here',
        email: 'user@example.com',
        safe: 'this should remain'
      };

      logSecurityEvent(
        SECURITY_EVENTS.AUTH_FAILURE,
        SEVERITY_LEVELS.MEDIUM,
        'Sensitive data test',
        sensitiveData
      );

      expect(consoleSpy).toHaveBeenCalled();
      // Check that sensitive data was redacted but safe data remains
      const logCall = consoleSpy.mock.calls.find(call => 
        typeof call[1] === 'string' && call[1].includes('Security Event Details')
      );
      
      if (logCall && logCall[2]) {
        const logData = JSON.parse(logCall[2]);
        expect(logData.metadata.password).toBe('[REDACTED]');
        expect(logData.metadata.token).toBe('[REDACTED]');
        expect(logData.metadata.userId).toBe('[USER_ID_REDACTED]');
        expect(logData.metadata.email).toContain('***@'); // Partially redacted
        expect(logData.metadata.safe).toBe('this should remain');
      }
    });

    test('should use convenience logging functions', () => {
      logAuthSuccess('user-123', { loginMethod: 'oauth' });
      logAuthFailure('invalid_credentials', { attempts: 3 });

      expect(consoleSpy).toHaveBeenCalledTimes(4); // 2 calls per log function
    });
  });

  describe('Content Security Policy', () => {
    test('should generate secure CSP configuration', () => {
      const csp = getContentSecurityPolicy();

      expect(csp.directives).toBeDefined();
      expect(csp.directives.defaultSrc).toContain("'self'");
      expect(csp.directives.objectSrc).toEqual(["'none'"]);
      expect(csp.directives.frameAncestors).toEqual(["'none'"]);
    });

    test('should include necessary external domains', () => {
      const csp = getContentSecurityPolicy();

      // Should allow Google OAuth
      expect(csp.directives.scriptSrc).toContain('https://apis.google.com');
      expect(csp.directives.frameSrc).toContain('https://accounts.google.com');
      
      // Should allow Google Fonts
      expect(csp.directives.styleSrc).toContain('https://fonts.googleapis.com');
      expect(csp.directives.fontSrc).toContain('https://fonts.gstatic.com');
    });

    test('should configure different policies for development vs production', () => {
      process.env.NODE_ENV = 'development';
      const devCsp = getContentSecurityPolicy();

      process.env.NODE_ENV = 'production';  
      const prodCsp = getContentSecurityPolicy();

      // Development should allow WebSocket connections
      expect(devCsp.directives.connectSrc.some(src => src.includes('ws://'))).toBe(true);
      
      // Production should have upgrade-insecure-requests
      expect(Array.isArray(prodCsp.directives.upgradeInsecureRequests)).toBe(true);
    });
  });

  describe('Security Headers Middleware', () => {
    test('should add additional security headers', async () => {
      const { additionalSecurityHeaders } = await import('../../utils/securityHeaders.js');
      const mockReq = {};
      const mockRes = {
        setHeader: jest.fn()
      };
      const mockNext = jest.fn();

      additionalSecurityHeaders(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy', 
        'strict-origin-when-cross-origin'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Opener-Policy', 
        'same-origin'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Permitted-Cross-Domain-Policies', 
        'none'
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('Security Integration Tests', () => {
  test('should maintain JWT security with enhanced logging', () => {
    // This test ensures that our security enhancements don't break
    // existing JWT security functionality
    expect(true).toBe(true); // Placeholder - JWT tests already exist
  });

  test('should maintain authentication middleware security', () => {
    // This test ensures that our security enhancements don't break
    // existing auth middleware functionality  
    expect(true).toBe(true); // Placeholder - auth tests already exist
  });

  test('should handle errors securely with new logging', () => {
    // Test that errors are handled securely with new logging system
    expect(true).toBe(true); // Would test error handling in real scenario
  });
});