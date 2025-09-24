/**
 * Loading Spinner Component
 * User Story #7: Frontend Authentication UI Components
 * 
 * Reusable loading indicator following the gaming theme design system
 */
import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'accent',
  className = '' 
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Color variants following design system
  const colorClasses = {
    accent: 'border-sky-400',
    white: 'border-white',
    gray: 'border-gray-400'
  };

  return (
    <div
      className={`
        inline-block animate-spin rounded-full border-2 border-solid
        border-current border-r-transparent align-[-0.125em]
        motion-reduce:animate-[spin_1.5s_linear_infinite]
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;