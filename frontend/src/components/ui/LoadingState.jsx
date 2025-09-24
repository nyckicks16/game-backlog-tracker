/**
 * Loading State Component
 * User Story #9: Implement Protected Routes and Authentication Guards
 * 
 * Gaming-themed loading states for route transitions and authentication checks
 */
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingState = ({ 
  message = 'Loading...', 
  showSpinner = true, 
  className = '',
  variant = 'page' // 'page', 'inline', 'overlay'
}) => {
  const baseClasses = 'flex flex-col items-center justify-center text-center';
  
  const variantClasses = {
    page: 'min-h-screen bg-slate-900 py-12 px-4',
    inline: 'py-8 px-4',
    overlay: 'fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Gaming-themed loading animation */}
        {showSpinner && (
          <div className="mb-6">
            <LoadingSpinner size="xl" color="accent" />
          </div>
        )}

        {/* Loading message */}
        <h2 className="text-xl font-semibold text-white mb-2">
          {message}
        </h2>

        {/* Gaming-themed subtitle */}
        <p className="text-slate-400 text-sm">
          {variant === 'page' && '🎮 Preparing your gaming experience...'}
          {variant === 'inline' && '🎯 Loading content...'}
          {variant === 'overlay' && '⚡ Processing...'}
        </p>

        {/* Progress bar animation */}
        <div className="mt-6 w-full max-w-xs">
          <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-500 to-sky-400 h-full rounded-full animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;