/**
 * Authentication Layout Component
 * User Story #7: Frontend Authentication UI Components
 * 
 * Provides consistent layout and styling for authentication-related pages
 */
import React from 'react';
import PropTypes from 'prop-types';

const AuthLayout = ({ 
  children, 
  title, 
  subtitle,
  showBranding = true 
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Branding Section */}
        {showBranding && (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-sky-500 rounded-lg flex items-center justify-center mb-4">
              <svg 
                className="h-8 w-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-label="Game Backlog Tracker Logo"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Game Backlog Tracker
            </h1>
          </div>
        )}

        {/* Content Header */}
        <div className="text-center">
          {title && (
            <h2 className="text-3xl font-extrabold text-white">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="mt-8 space-y-6">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Secure authentication powered by Google
          </p>
        </div>
      </div>
    </div>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  showBranding: PropTypes.bool
};

export default AuthLayout;