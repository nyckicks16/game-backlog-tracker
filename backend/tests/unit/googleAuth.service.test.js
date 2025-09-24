/**
 * Unit Tests for Google Auth Service
 * Tests Google OAuth integration functionality (stub implementation)
 */
import { jest } from '@jest/globals';

// Import the stub service
const { getGoogleProfile, generateGoogleAuthUrl } = await import('../../services/googleAuth.js');

describe('Google Auth Service', () => {
  describe('getGoogleProfile', () => {
    test('should get Google profile with valid token', async () => {
      const accessToken = 'valid_google_token';

      const result = await getGoogleProfile(accessToken);

      expect(result).toEqual({
        id: 'google_user_12345',
        email: 'mockuser@gmail.com',
        name: 'Mock Google User',
        given_name: 'Mock',
        family_name: 'User',
        picture: 'https://lh3.googleusercontent.com/a/mock-profile-picture',
        verified_email: true
      });
    });

    test('should reject invalid Google token', async () => {
      const accessToken = 'invalid_token';

      await expect(getGoogleProfile(accessToken)).rejects.toThrow('Invalid Google access token');
    });

    test('should reject missing token', async () => {
      const accessToken = null;

      await expect(getGoogleProfile(accessToken)).rejects.toThrow('Invalid Google access token');
    });
  });

  describe('generateGoogleAuthUrl', () => {
    test('should generate Google auth URL', () => {
      const result = generateGoogleAuthUrl();

      expect(result).toBe('https://accounts.google.com/oauth/mock-auth-url');
      expect(typeof result).toBe('string');
      expect(result.startsWith('https://accounts.google.com')).toBe(true);
    });

    test('should return consistent URL', () => {
      const result1 = generateGoogleAuthUrl();
      const result2 = generateGoogleAuthUrl();

      expect(result1).toBe(result2);
    });
  });
});