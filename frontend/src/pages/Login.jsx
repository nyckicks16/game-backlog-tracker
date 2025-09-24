/**
 * Login Page Component
 * User Story #7: Frontend Authentication UI Components
 * 
 * Main login page that provides Google OAuth authentication
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import AuthLayout from '../components/auth/AuthLayout';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import { toast } from 'react-hot-toast';

const Login = () => {
  const { user, isAuthenticated } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for error in URL params (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      toast.error('Authentication failed. Please try again.');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, user]);

  return (
    <AuthLayout 
      title="Sign In"
      subtitle="Access your game backlog and track your progress"
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-900 border border-red-700 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-red-400" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Options */}
        <div className="space-y-4">
          <GoogleLoginButton />
          
          {/* Additional login methods can be added here */}
        </div>

        {/* Features Preview */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4">
            Why use Game Backlog Tracker?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <svg 
                className="flex-shrink-0 h-5 w-5 text-sky-500 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <p className="ml-3 text-sm text-slate-300">
                Track your gaming progress across multiple platforms
              </p>
            </div>
            <div className="flex items-start">
              <svg 
                className="flex-shrink-0 h-5 w-5 text-sky-500 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
              <p className="ml-3 text-sm text-slate-300">
                Get insights and analytics on your gaming habits
              </p>
            </div>
            <div className="flex items-start">
              <svg 
                className="flex-shrink-0 h-5 w-5 text-sky-500 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
              <p className="ml-3 text-sm text-slate-300">
                Your data is secure with enterprise-grade protection
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;