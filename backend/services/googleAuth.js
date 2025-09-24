/**
 * Stub for Google Authentication Service
 * Used for testing OAuth flows
 */

export const getGoogleProfile = async (accessToken) => {
  console.log(`Mock: Getting Google profile with token ${accessToken}`);
  
  if (!accessToken || accessToken === 'invalid_token') {
    throw new Error('Invalid Google access token');
  }
  
  // Mock Google user profile
  return Promise.resolve({
    id: 'google_user_12345',
    email: 'mockuser@gmail.com',
    name: 'Mock Google User',
    given_name: 'Mock',
    family_name: 'User',
    picture: 'https://lh3.googleusercontent.com/a/mock-profile-picture',
    verified_email: true
  });
};

export const generateGoogleAuthUrl = () => {
  const mockAuthUrl = 'https://accounts.google.com/oauth/mock-auth-url';
  console.log(`Mock: Generated Google auth URL: ${mockAuthUrl}`);
  return mockAuthUrl;
};