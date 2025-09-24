/**
 * Skeleton Loader Component
 * User Story #13: UX Design Optimization - Task 16: Add Loading States and User Feedback
 * 
 * Skeleton loading states for better perceived performance
 */
import React from 'react';

const SkeletonLoader = ({ 
  variant = 'text',
  width = 'full',
  height = 'auto',
  className = '',
  animate = true,
  count = 1
}) => {
  const baseClasses = `
    bg-slate-700 
    ${animate ? 'animate-pulse' : ''}
    ${className}
  `;

  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    button: 'h-10 rounded-xl',
    card: 'h-32 rounded-xl',
    avatar: 'w-10 h-10 rounded-full',
    image: 'h-48 rounded-xl',
    stat: 'h-16 rounded-lg',
  };

  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4',
  };

  const heightClasses = height !== 'auto' ? { height } : {};

  const skeletonElement = (
    <div 
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${typeof width === 'string' ? widthClasses[width] || width : 'w-full'}
      `}
      style={heightClasses}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {skeletonElement}
        </div>
      ))}
    </div>
  );
};

// Pre-built skeleton patterns
export const DashboardCardSkeleton = () => (
  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <SkeletonLoader variant="title" width="1/2" />
      <SkeletonLoader variant="text" width="8" height="8" className="rounded-full" />
    </div>
    <SkeletonLoader variant="text" width="3/4" className="h-8 mb-2" />
    <SkeletonLoader variant="text" width="1/2" />
  </div>
);

export const GameCardSkeleton = () => (
  <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
    <SkeletonLoader variant="image" className="mb-4" />
    <SkeletonLoader variant="title" className="mb-2" />
    <SkeletonLoader variant="text" count={2} />
    <div className="flex justify-between items-center mt-4">
      <SkeletonLoader variant="button" width="1/3" />
      <SkeletonLoader variant="text" width="1/4" />
    </div>
  </div>
);

export const NavigationSkeleton = () => (
  <div className="flex items-center space-x-6">
    <SkeletonLoader variant="text" width="16" />
    <SkeletonLoader variant="text" width="20" />
    <SkeletonLoader variant="text" width="18" />
    <SkeletonLoader variant="avatar" />
  </div>
);

export default SkeletonLoader;