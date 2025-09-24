/**
 * OAuth Callback Handler Component
 * User Story #7: Frontend Authentication UI Components
 * 
 * Handles the OAuth callback from Google and processes the authentication token
 */
import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import LoadingSpinner from '../ui/LoadingSpinner';

const OAuthCallback = () => {
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    // Parse URL parameters for the access token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      // Redirect to login with error message
      window.location.href = '/login?error=' + encodeURIComponent(error);
      return;
    }

    if (token) {
      // Handle successful OAuth callback
      handleOAuthCallback(token);
    } else {
      // No token found, redirect to home
      window.location.href = '/';
    }
  }, [handleOAuthCallback]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" color="accent" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Completing sign in...
        </h2>
        <p className="text-slate-400">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;