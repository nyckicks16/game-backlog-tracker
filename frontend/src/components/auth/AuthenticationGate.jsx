/**
 * Authentication Gate Component
 * User Story #9: Implement Protected Routes and Authentication Guards
 * 
 * Displays when unauthenticated users try to access protected routes
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import GoogleLoginButton from './GoogleLoginButton';

const AuthenticationGate = ({ 
  returnTo = '/', 
  message = 'Authentication required to access this content',
  showLoginButton = true 
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Authentication Gate Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center shadow-lg">
          {/* Lock Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sky-500/10 mb-6">
            <LockClosedIcon className="h-8 w-8 text-sky-500" aria-hidden="true" />
          </div>

          {/* Headline */}
          <h2 className="text-2xl font-bold text-white mb-3">
            Authentication Required
          </h2>

          {/* Description */}
          <p className="text-slate-400 mb-8 leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="space-y-4">
            {showLoginButton && (
              <GoogleLoginButton 
                returnTo={returnTo}
                className="w-full"
              />
            )}
            
            {/* Back to Home Link */}
            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-slate-500 hover:text-sky-400 transition-colors duration-200"
              >
                ← Return to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-medium text-white mb-4">
            🎮 What you'll get with an account:
          </h3>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 text-sky-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Track your complete gaming backlog
              </span>
            </div>
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 text-sky-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Rate and review completed games
              </span>
            </div>
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 text-sky-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Get personalized gaming insights
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationGate;