/**
 * Stub for Email Service
 * Used for testing authentication flows
 */

export const sendVerificationEmail = async (email, token) => {
  console.log(`Mock: Sending verification email to ${email} with token ${token}`);
  return Promise.resolve(true);
};

export const sendPasswordResetEmail = async (email, token) => {
  console.log(`Mock: Sending password reset email to ${email} with token ${token}`);
  return Promise.resolve(true);
};

export const sendWelcomeEmail = async (email, firstName) => {
  console.log(`Mock: Sending welcome email to ${email} for ${firstName}`);
  return Promise.resolve(true);
};